use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::{HashMap, HashSet};
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
/// Watches each path's *parent directory* rather than the file itself and
/// filters events down to `paths`. Watching a file directly only survives
/// in-place writes — many editors (and Claude Code) save via "write a temp
/// file, then rename it over the original," which orphans a direct file
/// watch after the first such save on some platforms/inotify configurations.
/// Directory watches survive rename-over-target indefinitely. A path whose
/// parent directory doesn't exist yet (or can't be watched) is skipped
/// rather than aborting the whole batch, so one missing file doesn't take
/// down watching for every other managed file.
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

    let watched_files: HashSet<PathBuf> = paths.iter().cloned().collect();
    let mut parent_dirs: HashSet<PathBuf> = HashSet::new();
    for path in &paths {
        if let Some(parent) = path.parent() {
            parent_dirs.insert(parent.to_path_buf());
        }
    }
    for dir in &parent_dirs {
        if let Err(e) = watcher.watch(dir, RecursiveMode::NonRecursive) {
            eprintln!("morch: failed to watch {}: {e}", dir.display());
        }
    }

    std::thread::spawn(move || {
        let mut pending: HashMap<PathBuf, Instant> = HashMap::new();
        loop {
            match rx.recv_timeout(Duration::from_millis(50)) {
                Ok(Ok(event)) => {
                    if matches!(event.kind, EventKind::Modify(_) | EventKind::Create(_)) {
                        for path in event.paths {
                            if watched_files.contains(&path) {
                                pending.insert(path, Instant::now());
                            }
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

                // `remove` (not `get`) so a self-write suppresses exactly one
                // matching flush — if content later cycles back to the same
                // hash independently (e.g. an external revert), that's a new
                // event and must not be swallowed by a stale registry entry.
                let mut registry = self_write_registry().lock().unwrap();
                let is_self_write = registry.remove(&path) == Some(new_hash);
                drop(registry);
                if is_self_write {
                    continue;
                }

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

    #[test]
    fn external_edits_via_atomic_rename_are_detected_repeatedly() {
        // Many editors (and Claude Code) save via "write a temp file, then
        // rename it over the target" rather than an in-place write. A watch
        // on the file itself can go silently dead after the first such
        // rename; watching the parent directory must survive repeated cycles.
        let ws = TempWorkspace::new("atomic-rename");
        let file = ws.path.join("CLAUDE.md");
        std::fs::write(&file, "original\n").unwrap();

        let (tx, rx) = std_channel::<PathBuf>();
        let _watcher = start_watching(vec![file.clone()], move |path| {
            let _ = tx.send(path);
        })
        .expect("start_watching failed");

        std::thread::sleep(Duration::from_millis(100));

        for i in 0..3 {
            let tmp = ws.path.join(format!("CLAUDE.md.tmp{i}"));
            std::fs::write(&tmp, format!("edited externally #{i}\n")).unwrap();
            std::fs::rename(&tmp, &file).unwrap();

            let seen = rx
                .recv_timeout(Duration::from_secs(2))
                .unwrap_or_else(|_| panic!("expected an external-change notification for atomic rename #{i}"));
            assert_eq!(seen, file);
        }
    }

    #[test]
    fn watching_continues_even_if_one_managed_files_directory_does_not_exist() {
        let ws = TempWorkspace::new("missing-dir");
        let existing = ws.path.join("CLAUDE.md");
        std::fs::write(&existing, "original\n").unwrap();
        // Parent directory was never created — simulates a managed file
        // whose containing folder got deleted/renamed out from under it.
        let missing = ws.path.join("SKILLS-not-created-yet").join("some-skill.md");

        let (tx, rx) = std_channel::<PathBuf>();
        let _watcher = start_watching(vec![existing.clone(), missing], move |path| {
            let _ = tx.send(path);
        })
        .expect("start_watching should succeed even if one path's directory can't be watched yet");

        std::thread::sleep(Duration::from_millis(100));
        std::fs::write(&existing, "edited\n").unwrap();

        let seen = rx.recv_timeout(Duration::from_secs(2)).expect("the other managed file should still be watched");
        assert_eq!(seen, existing);
    }
}
