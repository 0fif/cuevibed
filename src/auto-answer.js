// Lightweight English question detection; no extra LLM request.
function isQuestion(text) {
  const value = String(text || '').trim();
  if (value.split(/\s+/).length < 3) return false;
  return /\?$/.test(value) || /^(?:can|could|would|will|should|do|does|did|is|are|was|were|have|has|how|why|what|when|where|which|who)\b/i.test(value) || /^(?:please\s+)?(?:explain|describe|tell me|walk me through)\b/i.test(value);
}

class AutoAnswer {
  constructor({ enabled, busy, answer, delayMs = 800, now = Date.now, schedule = setTimeout, cancel = clearTimeout }) {
    Object.assign(this, { enabled, busy, answer, delayMs, now, schedule, cancel });
    this.timer = null;
    this.pending = null;
    this.last = null;
  }
  reset() {
    this.cancel(this.timer);
    this.timer = null;
    this.pending = null;
    this.last = null;
  }
  push(turn) {
    if (!this.enabled() || turn.channel !== 'them') return;
    this.cancel(this.timer);
    // A continuation updates context and postpones an already detected question.
    if (isQuestion(turn.text)) {
      const key = turn.text.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
      if (this.last?.key === key && this.now() - this.last.at < 15000) return;
      this.pending = { text: turn.text, key, at: this.now() };
    }
    if (this.pending) this.timer = this.schedule(() => this.flush(), this.delayMs);
  }
  flush() {
    if (!this.enabled() || !this.pending || this.now() - this.pending.at > 15000) {
      this.pending = null;
      return;
    }
    if (this.busy()) {
      this.timer = this.schedule(() => this.flush(), 300);
      return;
    }
    const question = this.pending;
    this.pending = null;
    this.last = { key: question.key, at: this.now() };
    this.answer(question.text);
  }
}
module.exports = { AutoAnswer, isQuestion };
