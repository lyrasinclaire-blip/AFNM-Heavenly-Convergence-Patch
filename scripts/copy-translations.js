const fs = require('fs');
const path = require('path');
const { packageJson } = require('./mod-package');

const translationsDir = path.resolve(__dirname, '../translations');
const distPath = path.resolve(__dirname, `../dist/${packageJson.name}`);

if (!fs.existsSync(translationsDir)) {
  process.exit(0);
}

const files = fs
  .readdirSync(translationsDir)
  .filter((file) => file.endsWith('.json') && file !== 'template.json');
if (files.length === 0) {
  process.exit(0);
}

const distTranslationsDir = path.resolve(distPath, 'translations');
fs.mkdirSync(distTranslationsDir, { recursive: true });

for (const file of files) {
  fs.copyFileSync(
    path.resolve(translationsDir, file),
    path.resolve(distTranslationsDir, file),
  );
}

console.log(`Copied ${files.length} translation file(s) to dist`);
