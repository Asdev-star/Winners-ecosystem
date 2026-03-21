/**
 * Native store bridge placeholder.
 *
 * The current web Zustand stores still depend on browser-only APIs such as
 * localStorage, import.meta.env, and service worker registration. Keep this
 * module as the rendezvous point for extracting shared slices into a native-safe
 * package before replacing it with a filesystem symlink or workspace package.
 */

export const sharedStoreBridge = {
  status: "pending-shared-extraction",
} as const;
