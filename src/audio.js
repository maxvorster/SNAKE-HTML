const DEFAULT_VOLUME = 0.6;

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.volume = DEFAULT_VOLUME;
    this.muted = false;
  }

  ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.updateGain();
    }
  }

  /**
   * @param {number} volume
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.updateGain();
  }

  /**
   * @param {boolean} muted
   */
  setMuted(muted) {
    this.muted = muted;
    this.updateGain();
  }

  updateGain() {
    if (!this.masterGain) return;
    this.masterGain.gain.value = this.muted ? 0 : this.volume;
  }

  /**
   * @param {number} frequency
   * @param {number} duration
   */
  beep(frequency, duration) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = frequency;
    gain.gain.value = 0.12;
    osc.connect(gain).connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playEat() {
    this.beep(620, 0.08);
  }

  playDie() {
    this.beep(140, 0.25);
  }

  playLevelUp() {
    this.beep(780, 0.15);
    setTimeout(() => this.beep(980, 0.12), 110);
  }
}
