import type { ModAPI, ModOptionsFC, RootState } from 'afnm-types';
import {
  getHeavenlyConvergencePatchStatus,
  installHeavenlyConvergencePatch,
  patchHeavenlyConvergenceNow,
} from './heavenlyConvergencePatch';

type PatchConfig = {
  enabled: boolean;
};

const MOD_TAG = `[${MOD_METADATA.name}]`;
const ENABLED_FLAG_KEY = `${MOD_METADATA.name}.enabled`;

let lastKnownLocation: string | null = null;

function log(message: string, ...args: unknown[]) {
  console.log(MOD_TAG, message, ...args);
}

function getSnapshot(): RootState | null {
  return window.modAPI?.getGameStateSnapshot?.() ?? null;
}

function getGlobalFlags(): Record<string, number> {
  return window.modAPI?.actions?.getGlobalFlags?.() ?? {};
}

function getConfig(): PatchConfig {
  return {
    enabled: (getGlobalFlags()[ENABLED_FLAG_KEY] ?? 1) !== 0,
  };
}

function setEnabled(enabled: boolean): PatchConfig {
  window.modAPI?.actions?.setGlobalFlag?.(ENABLED_FLAG_KEY, enabled ? 1 : 0);
  return getConfig();
}

function ensureDefaultConfig() {
  const flags = getGlobalFlags();
  if (flags[ENABLED_FLAG_KEY] === undefined) {
    window.modAPI?.actions?.setGlobalFlag?.(ENABLED_FLAG_KEY, 1);
  }
}

function updateLastKnownLocation(snapshot: RootState | null) {
  lastKnownLocation = snapshot?.location?.current ?? null;
}

function createTextElement(
  createElement: (...args: unknown[]) => unknown,
  type: string,
  key: string,
  text: string,
  style: Record<string, string | number> = {},
) {
  return createElement(type, { key, style }, text);
}

const PatchOptions: ModOptionsFC = ({ api }) => {
  const ReactRuntime = window.React;

  if (
    !ReactRuntime?.createElement ||
    !ReactRuntime.useEffect ||
    !ReactRuntime.useState
  ) {
    throw new Error('React runtime unavailable for options UI');
  }

  const createElement = ReactRuntime.createElement.bind(ReactRuntime);
  const [config, setConfig] = ReactRuntime.useState<PatchConfig>(getConfig());
  const GameButton = api.components.GameButton ?? 'button';

  ReactRuntime.useEffect(() => {
    setConfig(getConfig());
  }, []);

  const updateEnabled = (enabled: boolean) => {
    setConfig(setEnabled(enabled));
  };

  return createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '8px 4px 4px',
      },
    },
    [
      createTextElement(
        createElement,
        'div',
        'title',
        'Heavenly Convergence Patch',
        {
          fontWeight: 700,
          fontSize: '1.1rem',
        },
      ),
      createTextElement(
        createElement,
        'div',
        'body',
        'Updates Heavenly Convergence Art to match the current Core Formation condensation art data after Incandescent Nexus and its existing patch load.',
        {
          lineHeight: 1.45,
          opacity: 0.9,
        },
      ),
      createElement(
        'div',
        {
          key: 'actions',
          style: {
            display: 'flex',
            gap: '12px',
          },
        },
        [
          createElement(
            GameButton,
            {
              key: 'enable',
              onClick: () => updateEnabled(true),
            },
            config.enabled ? 'Enabled' : 'Enable Mod',
          ),
          createElement(
            GameButton,
            {
              key: 'disable',
              onClick: () => updateEnabled(false),
            },
            config.enabled ? 'Disable Mod' : 'Disabled',
          ),
        ],
      ),
      createTextElement(
        createElement,
        'div',
        'footer',
        'Changing this setting takes full effect on the next game reload because item data is patched during mod startup.',
        {
          lineHeight: 1.45,
          opacity: 0.8,
        },
      ),
    ],
  );
};

function installDebugApi() {
  window.__afnmModDebug ??= {};
  window.__afnmModDebug[MOD_METADATA.name] = {
    getMetadata: () => ({ ...MOD_METADATA }),
    getConfig,
    getPatchStatus: getHeavenlyConvergencePatchStatus,
    getLastLocation: () => lastKnownLocation,
    getSnapshot,
    logSnapshot: () => {
      log('Snapshot', getSnapshot());
    },
    patchNow: () => {
      const modApi = window.modAPI;
      if (!modApi) {
        return getHeavenlyConvergencePatchStatus();
      }

      return patchHeavenlyConvergenceNow(modApi, log);
    },
  };
}

function registerOptionsUi(modApi: ModAPI) {
  modApi.actions?.registerOptionsUI?.(PatchOptions);
}

function registerSnapshotListener(modApi: ModAPI) {
  updateLastKnownLocation(modApi.getGameStateSnapshot?.() ?? null);

  modApi.subscribe?.(() => {
    updateLastKnownLocation(modApi.getGameStateSnapshot?.() ?? null);
  });
}

function install() {
  const modApi = window.modAPI;

  if (!modApi) {
    console.warn(
      MOD_TAG,
      'ModAPI not available; compatibility patch not installed.',
    );
    return;
  }

  window.__afnmModInstalled ??= {};
  if (window.__afnmModInstalled[MOD_METADATA.name]) {
    return;
  }
  window.__afnmModInstalled[MOD_METADATA.name] = true;

  ensureDefaultConfig();
  installDebugApi();
  registerOptionsUi(modApi);
  registerSnapshotListener(modApi);
  installHeavenlyConvergencePatch(modApi, () => getConfig().enabled, log);

  log('Compatibility patch installed.', {
    version: MOD_METADATA.version,
    gameVersion: MOD_METADATA.gameVersion,
  });
}

install();
