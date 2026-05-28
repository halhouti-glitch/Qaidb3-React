import type { Dispatch, SetStateAction } from 'react';

// Test stub for `virtual:pwa-register/react`. That module is synthesised by
// vite-plugin-pwa at build/preview time and does not exist under Vitest, so
// vite.config.ts aliases the specifier to this file for the `test` run.
//
// Both the component-under-test (via the aliased virtual specifier) and the
// test file (via a relative import of this path) resolve to the same module
// instance, so a test can drive the hook by mutating `__pwaMock` before render.

type RegisterReturn = {
  needRefresh: [boolean, Dispatch<SetStateAction<boolean>>];
  offlineReady: [boolean, Dispatch<SetStateAction<boolean>>];
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
};

export const __pwaMock = {
  needRefresh: false,
  setNeedRefresh: (_value: boolean) => {},
  updateServiceWorker: async (_reloadPage?: boolean) => {},
  reset() {
    this.needRefresh = false;
    this.setNeedRefresh = () => {};
    this.updateServiceWorker = async () => {};
  },
};

export function useRegisterSW(): RegisterReturn {
  return {
    needRefresh: [
      __pwaMock.needRefresh,
      __pwaMock.setNeedRefresh as Dispatch<SetStateAction<boolean>>,
    ],
    offlineReady: [false, () => {}],
    updateServiceWorker: __pwaMock.updateServiceWorker,
  };
}
