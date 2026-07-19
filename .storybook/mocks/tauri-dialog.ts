// Storybook-only stand-in for `@tauri-apps/plugin-dialog`, aliased in
// main.ts. There's no native folder picker outside a real Tauri webview, so
// "browse" resolves to a fixed example path instead of hanging.
export async function open(_options?: Record<string, unknown>): Promise<string | null> {
  return "/Users/example/my-workspace";
}
