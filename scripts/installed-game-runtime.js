#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_GAME_DIR_CANDIDATES = [
  path.join(
    os.homedir(),
    '.local',
    'share',
    'Steam',
    'steamapps',
    'common',
    'Ascend From Nine Mountains',
  ),
  path.join(
    os.homedir(),
    'Library',
    'Application Support',
    'Steam',
    'steamapps',
    'common',
    'Ascend From Nine Mountains',
  ),
  'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Ascend From Nine Mountains',
  'C:\\Program Files\\Steam\\steamapps\\common\\Ascend From Nine Mountains',
  'C:\\Steam\\steamapps\\common\\Ascend From Nine Mountains',
  'C:\\SteamLibrary\\steamapps\\common\\Ascend From Nine Mountains',
  'D:\\Steam\\steamapps\\common\\Ascend From Nine Mountains',
  'D:\\SteamLibrary\\steamapps\\common\\Ascend From Nine Mountains',
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function getGameDir() {
  if (process.env.AFNM_GAME_DIR) {
    return process.env.AFNM_GAME_DIR;
  }

  const detected = DEFAULT_GAME_DIR_CANDIDATES.find((candidate) =>
    fs.existsSync(candidate),
  );

  return detected || DEFAULT_GAME_DIR_CANDIDATES[0];
}

function getAppAsarPath(gameDir) {
  return path.join(gameDir, 'resources', 'app.asar');
}

function ensureExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    fail(`${description} not found: ${filePath}`);
  }
}

function getCacheFingerprint(asarPath) {
  const stat = fs.statSync(asarPath);
  return `${stat.size}-${Math.trunc(stat.mtimeMs)}`;
}

function getExtractDir(fingerprint) {
  return path.join(ROOT, 'tmp', 'installed-game-runtime', fingerprint);
}

function extractRuntime(asarPath, extractDir) {
  const marker = path.join(extractDir, 'dist-electron', 'main', 'index.js');
  if (fs.existsSync(marker)) {
    return extractDir;
  }

  fs.rmSync(extractDir, { recursive: true, force: true });
  fs.mkdirSync(extractDir, { recursive: true });

  const result = childProcess.spawnSync(
    'npx',
    ['-y', '@electron/asar', 'extract', asarPath, extractDir],
    {
      stdio: 'inherit',
      cwd: ROOT,
    },
  );

  if (result.status !== 0) {
    fail(`Failed to extract installed game runtime from ${asarPath}`);
  }

  return extractDir;
}

function readText(filePath) {
  ensureExists(filePath, 'Required extracted runtime file');
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function hasToken(text, token) {
  return text.includes(token);
}

function extractSummary(extractDir, gameDir, asarPath) {
  const packageJsonPath = path.join(extractDir, 'package.json');
  const mainIndexPath = path.join(
    extractDir,
    'dist-electron',
    'main',
    'index.js',
  );
  const gameJsPath = path.join(extractDir, 'dist-electron', 'Game.js');

  const packageJson = readJson(packageJsonPath);
  const mainIndex = readText(mainIndexPath);
  const gameJs = readText(gameJsPath);

  const buildVersion = mainIndex.match(/const ce="([^"]+)"/)?.[1] ?? null;

  return {
    gameDir,
    appAsarPath: asarPath,
    extractedDir: extractDir,
    gameVersion: packageJson.version ?? null,
    buildVersion,
    runtimeBehavior: {
      writesRelativeSettingsJson: mainIndex.includes('k="./settings.json"'),
      supportsDisableSteamSentinel: mainIndex.includes('disable_steam'),
      restartsThroughSteamByDefault: mainIndex.includes(
        'Restarting app through Steam...',
      ),
      disableSteamSentinelPath: path.join(gameDir, 'disable_steam'),
      hasNativeLauncher: fs.existsSync(path.join(gameDir, 'launch-native.sh')),
      hasHostLauncher: fs.existsSync(path.join(gameDir, 'launch-host.sh')),
    },
    modApi: {
      hasRegisterOptionsUI: hasToken(gameJs, 'registerOptionsUI'),
      hasInjectUI: hasToken(gameJs, 'injectUI:'),
      hasSubscribe: hasToken(gameJs, 'subscribe:e=>'),
      hasGetGameStateSnapshot: hasToken(gameJs, 'getGameStateSnapshot:()=>'),
      hasOnEventDropItem: hasToken(gameJs, 'onEventDropItem'),
      hasOnGenerateExploreEvents: hasToken(gameJs, 'onGenerateExploreEvents'),
      hasOnCalculateDamage: hasToken(gameJs, 'onCalculateDamage'),
      hasOnLocationEnter: hasToken(gameJs, 'onLocationEnter'),
      hasOnLootDrop: hasToken(gameJs, 'onLootDrop'),
      hasOnAdvanceDay: hasToken(gameJs, 'onAdvanceDay'),
      hasOnAdvanceMonth: hasToken(gameJs, 'onAdvanceMonth'),
      hasOnBeforeCombat: hasToken(gameJs, 'onBeforeCombat'),
      hasOnReduxAction: hasToken(gameJs, 'onReduxAction'),
      hasOnReduxActionPayload: hasToken(gameJs, 'onReduxActionPayload'),
      hasAddToSectShop: hasToken(gameJs, 'addToSectShop'),
      hasMakeSave: hasToken(gameJs, 'makeSave'),
      hasLoadSave: hasToken(gameJs, 'loadSave'),
      hasListSaves: hasToken(gameJs, 'listSaves'),
      hasSaveManagementActions:
        hasToken(gameJs, 'makeSave') &&
        hasToken(gameJs, 'loadSave') &&
        hasToken(gameJs, 'listSaves'),
      hasBeforeTechniqueEffects: hasToken(gameJs, 'beforeTechniqueEffects'),
      hasAfterTechniqueEffects: hasToken(gameJs, 'afterTechniqueEffects'),
      hasOnStackGainEffects: hasToken(gameJs, 'onStackGainEffects'),
      hasNewBuffTimingFields:
        hasToken(gameJs, 'beforeTechniqueEffects') &&
        hasToken(gameJs, 'afterTechniqueEffects') &&
        hasToken(gameJs, 'onStackGainEffects'),
    },
  };
}

function printUsage() {
  console.log(`Usage:
  node scripts/installed-game-runtime.js summary
  node scripts/installed-game-runtime.js extract
  node scripts/installed-game-runtime.js path
  node scripts/installed-game-runtime.js grep <pattern>

Environment:
  AFNM_GAME_DIR=/absolute/path/to/Ascend From Nine Mountains

If auto-detection misses your install, set AFNM_GAME_DIR explicitly.`);
}

function main() {
  const command = process.argv[2] || 'summary';
  const pattern = process.argv[3];
  const gameDir = getGameDir();
  const asarPath = getAppAsarPath(gameDir);
  ensureExists(gameDir, 'Installed game directory');
  ensureExists(asarPath, 'Installed app.asar');

  const extractDir = extractRuntime(
    asarPath,
    getExtractDir(getCacheFingerprint(asarPath)),
  );

  switch (command) {
    case 'summary': {
      const summary = extractSummary(extractDir, gameDir, asarPath);
      console.log(JSON.stringify(summary, null, 2));
      return;
    }
    case 'extract':
    case 'path': {
      console.log(extractDir);
      return;
    }
    case 'grep': {
      if (!pattern) {
        fail('Missing grep pattern.');
      }

      const searchDir = path.join(extractDir, 'dist-electron');

      // Try ripgrep first, fall back to Node-based grep for Windows compatibility
      const rgResult = childProcess.spawnSync(
        'rg',
        ['-n', pattern, searchDir],
        { cwd: ROOT, stdio: 'inherit' },
      );

      if (rgResult.error && rgResult.error.code === 'ENOENT') {
        console.log('ripgrep (rg) not found, using built-in search...\n');
        const files = [];
        function walkDir(dir) {
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walkDir(full);
            else if (entry.isFile() && /\.(js|ts|json)$/i.test(entry.name))
              files.push(full);
          }
        }
        walkDir(searchDir);
        const regex = new RegExp(pattern);
        let found = false;
        for (const file of files) {
          const lines = fs.readFileSync(file, 'utf8').split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (regex.test(lines[i])) {
              console.log(`${path.relative(ROOT, file)}:${i + 1}:${lines[i]}`);
              found = true;
            }
          }
        }
        process.exit(found ? 0 : 1);
      }

      process.exit(rgResult.status ?? 1);
    }
    case 'help':
    case '--help':
    case '-h': {
      printUsage();
      return;
    }
    default:
      fail(`Unknown command: ${command}`);
  }
}

main();
