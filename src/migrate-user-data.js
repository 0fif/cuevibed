const fs = require('node:fs');
const path = require('node:path');

// Copy user-owned data once; never move originals or replace destination files.
function migrateUserData(source, destination) {
  const marker = path.join(destination, '.cue-migration-complete');
  if (fs.existsSync(marker)) return;
  fs.mkdirSync(destination, { recursive: true, mode: 0o700 });
  function copyFile(from, to) {
    if (!fs.existsSync(from) || fs.existsSync(to)) return;
    const temporary = to + '.migration-tmp';
    fs.copyFileSync(from, temporary, fs.constants.COPYFILE_FICLONE);
    fs.chmodSync(temporary, 0o600);
    fs.renameSync(temporary, to);
  }
  for (const name of ['cue-data.json', 'cue-data.json.bak', 'meetings.json', 'meetings.json.bak']) {
    copyFile(path.join(source, name), path.join(destination, name));
  }
  const models = path.join(source, 'whisper-models');
  if (fs.existsSync(models)) {
    const target = path.join(destination, 'whisper-models');
    fs.mkdirSync(target, { recursive: true, mode: 0o700 });
    for (const entry of fs.readdirSync(models, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.bin')) copyFile(path.join(models, entry.name), path.join(target, entry.name));
    }
  }
  fs.writeFileSync(marker, 'Imported from Cue; original files retained.\n', { mode: 0o600 });
}
module.exports = { migrateUserData };
