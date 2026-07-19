// Storybook-only stand-in for `@tauri-apps/api/event`, aliased in main.ts.
// Dashboard.tsx's file-watcher subscription has nothing to listen to outside
// a real Tauri webview, so `listen` resolves to a no-op unsubscribe.
export async function listen<T>(
  _event: string,
  _handler: (event: { payload: T }) => void,
): Promise<() => void> {
  return () => {};
}
