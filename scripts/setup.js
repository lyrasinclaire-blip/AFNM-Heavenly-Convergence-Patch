#!/usr/bin/env node
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO_ROOT = path.resolve(__dirname, '..');
const UPLOADER_DIR = path.resolve(REPO_ROOT, '..', 'ModUploader-AFNM');

function log(prefix, msg) {
  console.log(`[${prefix}] ${msg}`);
}

function hasCommand(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getVersion(cmd) {
  try {
    return execSync(`${cmd} --version`, { encoding: 'utf8' })
      .trim()
      .split('\n')[0];
  } catch {
    return null;
  }
}

function runCommand(label, cmd, args, cwd) {
  console.log(`\n== ${label} ==`);
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: true });
  return result.status === 0;
}

console.log('=== AFNM Mod Template Setup ===\n');

// Check required tools
const required = [
  { cmd: 'bun', name: 'bun', url: 'https://bun.sh' },
  { cmd: 'node', name: 'node', url: 'https://nodejs.org' },
  { cmd: 'git', name: 'git', url: 'https://git-scm.com' },
];

let missing = [];
for (const tool of required) {
  if (hasCommand(tool.cmd)) {
    log('ok', `${tool.name}: ${getVersion(tool.cmd)}`);
  } else {
    missing.push(tool);
  }
}

if (missing.length > 0) {
  console.log('\nMissing required tools:');
  for (const tool of missing) {
    console.log(`  - ${tool.name} (${tool.url})`);
  }
  console.log('\nInstall them and re-run this script.');
  process.exit(1);
}

// Install dependencies
if (!runCommand('Install dependencies', 'bun', ['install'], REPO_ROOT)) {
  log('!!', 'Dependency installation failed');
  process.exit(1);
}
log('ok', 'Dependencies installed');

// Clone ModUploader-AFNM if missing
console.log('');
if (fs.existsSync(UPLOADER_DIR)) {
  log('ok', `ModUploader-AFNM found at ${UPLOADER_DIR}`);
} else {
  console.log('ModUploader-AFNM not found. Cloning...');
  if (
    !runCommand(
      'Clone ModUploader-AFNM',
      'git',
      [
        'clone',
        'https://github.com/lemon07r/ModUploader-AFNM.git',
        UPLOADER_DIR,
      ],
      REPO_ROOT,
    )
  ) {
    log(
      '!!',
      'Failed to clone ModUploader-AFNM. Workshop uploads will not work.',
    );
    log(
      '!!',
      `Clone it manually: git clone https://github.com/lemon07r/ModUploader-AFNM.git "${UPLOADER_DIR}"`,
    );
  } else {
    log('ok', `ModUploader-AFNM cloned to ${UPLOADER_DIR}`);
  }
}

// Detect game installation
console.log('');
const homedir = os.homedir();
const gameCandidates = [
  path.join(
    homedir,
    '.local',
    'share',
    'Steam',
    'steamapps',
    'common',
    'Ascend From Nine Mountains',
  ),
  path.join(
    homedir,
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

let gameFound = null;
for (const candidate of gameCandidates) {
  if (fs.existsSync(candidate)) {
    gameFound = candidate;
    break;
  }
}

if (gameFound) {
  log('ok', `Game installation found: ${gameFound}`);
} else {
  log('!!', 'Game installation not detected.');
  console.log(
    '     Set AFNM_GAME_DIR in your environment to use the runtime oracle.',
  );
  console.log(
    '     Example: export AFNM_GAME_DIR="/path/to/Ascend From Nine Mountains"',
  );
}

// Check optional tools
console.log('\n=== Optional Tools ===');
if (hasCommand('agent-browser')) {
  log('ok', 'agent-browser available (for automated game testing)');
} else {
  log(
    '--',
    'agent-browser not installed (optional, for automated game testing)',
  );
  console.log('     Install with: npm install -g @anthropic/agent-browser');
}

// Verify build
console.log('\n=== Verifying Build ===');
const tcOk = runCommand('Typecheck', 'bun', ['run', 'typecheck'], REPO_ROOT);
log(tcOk ? 'ok' : '!!', tcOk ? 'TypeScript passes' : 'TypeScript errors found');

const buildOk = runCommand('Build', 'bun', ['run', 'build'], REPO_ROOT);
log(buildOk ? 'ok' : '!!', buildOk ? 'Build succeeds' : 'Build failed');

console.log('\n=== Setup Complete ===\n');
console.log('Next steps:');
console.log(
  "  1. Update package.json with your mod's name, description, and author",
);
console.log(
  '  2. Update package.json afnmWorkshop fields for Workshop publishing',
);
console.log('  3. Replace the example logic in src/modContent/index.ts');
console.log('  4. Run: bun run build');
console.log("  5. Copy builds/*.zip to your game's mods/ directory to test");
console.log('\nSee README.md and AGENTS.md for more details.');
