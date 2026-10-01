const assert = require('node:assert/strict');
const test = require('node:test');
const { UtteranceSegmenter } = require('../src/utterance-segmenter');

const FRAME_SAMPLES = 480;
const FRAME_BYTES = FRAME_SAMPLES * 2;

function frame(amplitude) {
  const buffer = Buffer.alloc(FRAME_BYTES);
  for (let offset = 0; offset < buffer.length; offset += 2) buffer.writeInt16LE(amplitude, offset);
  return buffer;
}

function pushFrames(segmenter, amplitude, count) {
  for (let index = 0; index < count; index += 1) segmenter.push(frame(amplitude));
}

test('includes pre-roll and emits after the configured trailing silence', () => {
  const utterances = [];
  const speechStates = [];
  const segmenter = new UtteranceSegmenter({
    channel: 'you',
    onSpeechState: (_channel, speaking) => speechStates.push(speaking),
    onUtterance: (_channel, pcm) => utterances.push(pcm)
  });

  pushFrames(segmenter, 0, 10);
  pushFrames(segmenter, 1200, 8);
  pushFrames(segmenter, 0, 18);

  assert.equal(utterances.length, 1);
  // Confirmed onset uses some of the pre-roll; all eight speech frames survive.
  const samples = [];
  for (let i = 0; i < utterances[0].length; i += 2) samples.push(utterances[0].readInt16LE(i));
  assert.equal(samples.filter(value => value === 1200).length, FRAME_SAMPLES * 8);
  assert.deepEqual(speechStates, [true, false]);
});

test('flushes a final active utterance when capture stops', () => {
  const utterances = [];
  const segmenter = new UtteranceSegmenter({
    channel: 'them',
    onUtterance: (_channel, pcm) => utterances.push(pcm)
  });
  pushFrames(segmenter, 1000, 8);
  segmenter.stop();
  assert.equal(utterances.length, 1);
  assert.ok(utterances[0].length >= FRAME_BYTES * 8);
});

test('splits long speech into bounded segments with overlap', () => {
  const utterances = [];
  const segmenter = new UtteranceSegmenter({
    channel: 'you',
    preRollMs: 60,
    minUtteranceMs: 30,
    maxUtteranceMs: 300,
    overlapMs: 60,
    onUtterance: (_channel, pcm) => utterances.push(pcm)
  });
  pushFrames(segmenter, 1000, 24);
  segmenter.stop();

  assert.ok(utterances.length >= 3);
  assert.equal(utterances[0].length, FRAME_BYTES * 10);
  assert.equal(utterances[1].length, FRAME_BYTES * 10);
  assert.ok(utterances.every((pcm) => pcm.length <= FRAME_BYTES * 10));
});


test('isolated keyboard-like impulses do not open or emit an utterance', () => {
  const utterances = [];
  const segmenter = new UtteranceSegmenter({ channel: 'you', onUtterance: (_, pcm) => utterances.push(pcm) });
  for (let i = 0; i < 20; i++) {
    pushFrames(segmenter, 8000, 1);
    pushFrames(segmenter, 0, 5);
  }
  segmenter.stop();
  assert.equal(utterances.length, 0);
});

test('a click followed later by speech does not merge into an endless utterance', () => {
  const utterances = [];
  const segmenter = new UtteranceSegmenter({ channel: 'you', onUtterance: (_, pcm) => utterances.push(pcm) });
  pushFrames(segmenter, 8000, 1);
  pushFrames(segmenter, 0, 40);
  pushFrames(segmenter, 1200, 8);
  pushFrames(segmenter, 0, 20);
  assert.equal(utterances.length, 1);
  assert.ok(utterances[0].length < FRAME_BYTES * 35);
});
