use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};
use std::sync::mpsc::{channel, RecvTimeoutError};
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

const DEBOUNCE: Duration = Duration::from_millis(300);

fn hash_content(contents: &str) -> u64 {
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    contents.hash(&mut hasher);
    hasher.finish()
}

fn self_write_registry() -> &'static Mutex<HashMap<PathBuf, u64>> {
    static REGISTRY: OnceLock<Mutex<HashMap<PathBuf, u64>>> = OnceLock::new();
    REGISTRY.get_or_init(|| Mutex::new(HashMap::new()))
}

/// Records the content the app itself just wrote to `path`, so a watcher
/// event for this exact content can be told apart from a genuine external
/// edit arriving in the same debounce window (TECHNICAL_ARCHITECTURE.md §5.5).
/// Callers are the low-level write helpers in archive.rs — any command that
/// writes a managed file through them gets loop prevention for free.
pub fn record_self_write(path: &Path, contents: &str) {
    self_write_registry().lock().unwrap().insert(path.to_path_buf(), hash_content(contents));
}

/// Watches `paths` for changes and calls `on_external_change` (with the
/// changed path) once per debounced batch of filesystem events — but only
/// for content that doesn't match the last write `record_self_write`
/// recorded for that path, so the app's own toggle-driven writes don't
/// produce a spurious external-change notification.
///
/// Runs the debounce loop on a dedicated background thread; the returned
/// `RecommendedWatcher` must be kept alive for as long as watching should
/// continue (dropping it stops the OS-level watch).
pub fn start_watching<F>(paths: Vec<PathBuf>, on_external_change: F) -> notify::Result<RecommendedWatcher>
where
    F: Fn(PathBuf) + Send + 'static,
{
    let (tx, rx) = channel::<notify::Result<Event>>();
    let mut watcher = notify::recommended_watcher(move |res| {
        let _ = tx.send(res);
    })?;

    for path in &paths {
        watcher.watch(path, RecursiveMode::NonRecursive)?;
    }

    std::thread::spawn(move || {
        let mut pending: HashMap<PathBuf, Instant> = HashMap::new();
        loop {
            match rx.recv_timeout(Duration::from_millis(50)) {
                Ok(Ok(event)) => {
                    if matches!(event.kind, EventKind::Modify(_) | EventKind::Create(_)) {
                        for path in event.paths {
                            pending.insert(path, Instant::now());
                        }
                    }
                }
                Ok(Err(_)) => {}
                Err(RecvTimeoutError::Timeout) => {}
                Err(RecvTimeoutError::Disconnected) => break,
            }

            let now = Instant::now();
            let ready: Vec<PathBuf> =
                pending.iter().filter(|(_, seen)| now.duration_since(**seen) >= DEBOUNCE).map(|(p, _)| p.clone()).collect();

            for path in ready {
                pending.remove(&path);
                let Ok(contents) = std::fs::read_to_string(&path) else { continue };
                let new_hash = hash_content(&contents);

                let mut registry = self_write_registry().lock().unwrap();
                if registry.get(&path) == Some(&new_hash) {
                    continue; // our own write already reflected this content — not external
                }
                registry.insert(path.clone(), new_hash);
                drop(registry);

                on_external_change(path);
            }
        }
    });

    Ok(watcher)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::mpsc::channel as std_channel;

    struct TempWorkspace {
        path: PathBuf,
    }

    impl TempWorkspace {
        fn new(name: &str) -> Self {
            let path = std::env::temp_dir().join(format!("morch-watcher-test-{name}-{}", std::process::id()));
            std::fs::create_dir_all(&path).unwrap();
            Self { path }
        }
    }

    impl Drop for TempWorkspace {
        fn drop(&mut self) {
            std::fs::remove_dir_all(&self.path).ok();
        }
    }

    #[test]
    fn external_edit_is_reported_within_debounce_window() {
        let ws = TempWorkspace::new("external");
        let file = ws.path.join("CLAUDE.md");
        std::fs::write(&file, "original\n").unwrap();

        let (tx, rx) = std_channel::<PathBuf>();
        let _watcher = start_watching(vec![file.clone()], move |path| {
            let _ = tx.send(path);
        })
        .expect("start_watching failed");

        // Simulate an external tool editing the file (no record_self_write call).
        std::thread::sleep(Duration::from_millis(100));
        std::fs::write(&file, "edited externally\n").unwrap();

        let seen = rx.recv_timeout(Duration::from_secs(2)).expect("expected an external-change notification");
        assert_eq!(seen, file);
    }

    #[test]
    fn apps_own_write_does_not_trigger_external_change() {
        let ws = TempWorkspace::new("self-write");
        let file = ws.path.join("CLAUDE.md");
        std::fs::write(&file, "original\n").unwrap();

        let (tx, rx) = std_channel::<PathBuf>();
        let _watcher = start_watching(vec![file.clone()], move |path| {
            let _ = tx.send(path);
        })
        .expect("start_watching failed");

        std::thread::sleep(Duration::from_millis(100));
        let new_contents = "written by the app\n";
        record_self_write(&file, new_contents);
        std::fs::write(&file, new_contents).unwrap();

        // No event should show up even after waiting well past the debounce window.
        let result = rx.recv_timeout(Duration::from_millis(800));
        assert!(result.is_err(), "app's own write should not be reported as an external change");
    }

    #[test]
    fn external_edit_after_a_self_write_is_still_reported() {
        let ws = TempWorkspace::new("self-then-external");
        let file = ws.path.join("CLAUDE.md");
        std::fs::write(&file, "original\n").unwrap();

        let (tx, rx) = std_channel::<PathBuf>();
        let _watcher = start_watching(vec![file.clone()], move |path| {
            let _ = tx.send(path);
        })
        .expect("start_watching failed");

        std::thread::sleep(Duration::from_millis(100));
        let app_write = "written by the app\n";
        record_self_write(&file, app_write);
        std::fs::write(&file, app_write).unwrap();
        // Drain the (absent) self-write notification window before the external edit.
        let _ = rx.recv_timeout(Duration::from_millis(500));

        std::fs::write(&file, "then a human edited it\n").unwrap();
        let seen = rx.recv_timeout(Duration::from_secs(2)).expect("external edit after a self-write should still be reported");
        assert_eq!(seen, file);
    }
}
