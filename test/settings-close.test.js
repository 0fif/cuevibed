const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'renderer.js'), 'utf8');

// Settings used to declare closeSettings twice. The async one waited for a
// successful save; the sync one always hid the modal. JavaScript kept the
// second, so Done / Escape / scrim-click discarded failed saves. This scan
// is the same shape as the Gemini-model drift tests: the renderer is not
// unit-testable without Electron, so we lock the wiring in source.

test('renderer defines closeSettings once', () => {
  const matches = source.match(/function closeSettings\s*\(/g) || [];
  assert.equal(matches.length, 1, `expected one closeSettings, found ${matches.length}`);
});

test('closeSettings awaits saveSettings before hiding the modal', () => {
  const match = source.match(/async function closeSettings\(\) \{([\s\S]*?)\n  \}/);
  assert.ok(match, 'could not find async closeSettings body');
  const body = match[1];
  assert.match(body, /await saveSettings\(\)/);
  assert.match(body, /if \(await saveSettings\(\)\) \{\s*if \(isSettingsWindow\) cue\.settingsCloseWindow\(\);\s*else scrim\.classList\.add\('hidden'\);/);
  assert.equal(body.includes("scrim.classList.add('hidden')"), true);
  assert.ok(
    !/saveSettings\(\);\s*scrim\.classList\.add\('hidden'\)/.test(body),
    'closeSettings must not hide the modal without awaiting saveSettings'
  );
});

test('Done, scrim-click, and Escape all go through closeSettings', () => {
  assert.match(source, /\$\('#s-close'\)\.addEventListener\('click',\s*\(\) => \{ void closeSettings\(\); \}\)/);
  assert.match(source, /if \(e\.target === scrim\) void closeSettings\(\)/);
  assert.match(
    source,
    /if \(e\.key === 'Escape' && !scrim\.classList\.contains\('hidden'\)\) void closeSettings\(\)/
  );
});

// Exercise the shared native/overlay close path, including a failed save and
// two close requests arriving while the first save is still in flight.
test('native Settings closes only after a successful save and ignores duplicate closes', async () => {
  const vm = require('node:vm');
  const body = source.match(/async function closeSettings\(\) \{([\s\S]*?)\n  \}/)[0];
  let resolveSave;
  let saves = 0, closes = 0;
  const context = vm.createContext({
    isSettingsWindow: true,
    cue: { settingsCloseWindow: () => { closes++; } },
    scrim: { classList: { add: () => assert.fail('native Settings must close its own window') } },
    saveSettings: () => { saves++; return new Promise(resolve => { resolveSave = resolve; }); }
  });
  vm.runInContext('let closingSettings = false;\n' + body, context);
  const first = context.closeSettings();
  await context.closeSettings();
  assert.equal(saves, 1);
  assert.equal(closes, 0);
  resolveSave(false);
  await first;
  assert.equal(closes, 0);
  const second = context.closeSettings();
  resolveSave(true);
  await second;
  assert.equal(closes, 1);
});
