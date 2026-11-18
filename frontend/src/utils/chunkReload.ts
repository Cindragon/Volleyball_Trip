/**
 * After a new deploy the hashed JS chunks of the previous build are gone, so a
 * tab that was opened before the deploy fails to lazy-load the next page.
 * Reloading picks up the new build. The timestamp guard prevents a reload loop
 * if the chunk is genuinely broken.
 */
const RELOAD_KEY = 'vt:chunk-reload-at';
const RELOAD_GUARD_MS = 10_000;

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|ChunkLoadError|Unable to preload CSS/i.test(message);
}

/** Reloads once to fetch the current build. Returns false if we just did. */
export function reloadForNewBuild(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < RELOAD_GUARD_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Storage unavailable: still try a single reload.
  }
  window.location.reload();
  return true;
}
