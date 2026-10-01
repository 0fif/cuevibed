const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { migrateUserData } = require('../src/migrate-user-data');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cuevibed-migration-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, 'cue'), destination = path.join(root, 'CueVibed');
  fs.mkdirSync(path.join(source, 'whisper-models'), { recursive: true });
  fs.writeFileSync(path.join(source, 'cue-data.json'), '{"provider":"custom"}');
  fs.writeFileSync(path.join(source, 'meetings.json'), '[{"id":"saved"}]');
  fs.writeFileSync(path.join(source, 'whisper-models', 'model.bin'), 'model');
  fs.writeFileSync(path.join(source, 'whisper-models', 'model.bin.partial'), 'partial');
  return { source, destination };
}
test('copies settings, history and complete models, preserving originals', t => {
  const {source,destination}=fixture(t);
  migrateUserData(source,destination);
  for (const file of ['cue-data.json','meetings.json','whisper-models/model.bin']) {
    assert.deepEqual(fs.readFileSync(path.join(source,file)),fs.readFileSync(path.join(destination,file)));
  }
  assert.equal(fs.existsSync(path.join(destination,'whisper-models/model.bin.partial')),false);
  assert.equal(fs.statSync(path.join(destination,'cue-data.json')).mode & 0o777,0o600);
  fs.writeFileSync(path.join(source,'cue-data.json'),'changed upstream');
  migrateUserData(source,destination);
  assert.equal(fs.readFileSync(path.join(destination,'cue-data.json'),'utf8'),'{"provider":"custom"}');
});
test('preserves existing destination data and does not reimport deleted history', t => {
  const {source,destination}=fixture(t);
  fs.mkdirSync(destination);
  fs.writeFileSync(path.join(destination,'cue-data.json'),'existing preferences');
  migrateUserData(source,destination);
  assert.equal(fs.readFileSync(path.join(destination,'cue-data.json'),'utf8'),'existing preferences');
  fs.unlinkSync(path.join(destination,'meetings.json'));
  migrateUserData(source,destination);
  assert.equal(fs.existsSync(path.join(destination,'meetings.json')),false);
});
