const test = require('node:test');
const assert = require('node:assert/strict');
const { AutoAnswer, isQuestion } = require('../src/auto-answer');

function fixture() {
  const answers = [];
  let time = 0, enabled = true, busy = false, id = 0;
  const tasks = new Map();
  const detector = new AutoAnswer({
    enabled: () => enabled, busy: () => busy, answer: text => answers.push(text),
    now: () => time, schedule: fn => { tasks.set(++id, fn); return id; }, cancel: key => tasks.delete(key)
  });
  return { detector, answers, setEnabled: v => enabled = v, setBusy: v => busy = v,
    advance: ms => time += ms,
    flush: () => { const pending = [...tasks.values()]; tasks.clear(); pending.forEach(fn => fn()); }
  };
}
test('detects English questions and requests, excluding short noise and greetings', () => {
  for (const text of ['Can Conditional Access require a compliant device?', 'How does this work', 'Please explain device compliance']) assert.ok(isQuestion(text));
  for (const text of ['you', 'Hello there', 'That makes sense.']) assert.equal(isQuestion(text), false);
});
test('only remote speech triggers, and repeated final transcripts are deduplicated', () => {
  const f = fixture(), text = 'Can you explain this?';
  f.detector.push({ channel: 'you', text }); f.flush();
  assert.equal(f.answers.length, 0);
  f.detector.push({ channel: 'them', text }); f.flush();
  f.detector.push({ channel: 'them', text }); f.flush();
  assert.deepEqual(f.answers, [text]);
});
test('keeps the latest question while busy, but drops stale questions', () => {
  const f = fixture(); f.setBusy(true);
  f.detector.push({ channel: 'them', text: 'How does this work?' }); f.flush();
  f.detector.push({ channel: 'them', text: 'Can you explain compliance?' });
  f.setBusy(false); f.flush();
  assert.deepEqual(f.answers, ['Can you explain compliance?']);
  f.detector.push({ channel: 'them', text: 'What about the cost?' });
  f.advance(16000); f.flush();
  assert.equal(f.answers.length, 1);
});
test('disable and session reset cancel pending automatic answers', () => {
  const f = fixture();
  f.detector.push({ channel: 'them', text: 'What does it cost?' });
  f.setEnabled(false); f.flush();
  assert.equal(f.answers.length, 0);
  f.setEnabled(true);
  f.detector.push({ channel: 'them', text: 'What does it cost?' });
  f.detector.reset(); f.flush();
  assert.equal(f.answers.length, 0);
});
