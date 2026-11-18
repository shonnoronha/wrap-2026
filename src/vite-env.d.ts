/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "1" bundles the wrap API into the page, for a static single-file build. */
  readonly VITE_STATIC?: string;
  /** "neutral" removes redBus product names and wordmarks (public demo build). */
  readonly VITE_BRAND?: string;
  /** Base URL of the real wrap API. Unset = the dummy server on the same origin. */
  readonly VITE_WRAP_API_URL?: string;
}
