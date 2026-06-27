import type { ModAPI, RootState } from 'afnm-types';
import type { HeavenlyConvergencePatchStatus } from './modContent/heavenlyConvergencePatch';

type PatchConfig = {
  enabled: boolean;
};

type PatchDebugApi = {
  getMetadata: () => {
    name: string;
    version: string;
    author: { name: string };
    description: string;
    gameVersion?: string;
  };
  getConfig: () => PatchConfig;
  getPatchStatus: () => HeavenlyConvergencePatchStatus;
  getLastLocation: () => string | null;
  getSnapshot: () => RootState | null;
  logSnapshot: () => void;
  patchNow: () => HeavenlyConvergencePatchStatus;
};

declare global {
  const MOD_METADATA: {
    name: string;
    version: string;
    author: { name: string };
    description: string;
    gameVersion?: string;
  };

  interface Window {
    modAPI?: ModAPI;
    React?: {
      createElement: (...args: any[]) => any;
      useEffect?: (
        effect: () => void | (() => void),
        deps?: readonly unknown[],
      ) => void;
      useState?: <T>(
        initialState: T,
      ) => [T, (value: T | ((previousValue: T) => T)) => void];
    };
    __afnmModInstalled?: Record<string, boolean>;
    __afnmModDebug?: Record<string, PatchDebugApi>;
  }
}

export {};
