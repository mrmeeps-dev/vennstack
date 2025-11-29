/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMeta {
  readonly glob: (pattern: string, options?: { eager?: boolean }) => Record<string, () => Promise<any>>;
}


