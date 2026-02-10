/**
 * @typedef {{x: number, y: number}} Direction
 */

const KEY_MAP = new Map([
  ["ArrowUp", { x: 0, y: -1 }],
  ["ArrowDown", { x: 0, y: 1 }],
  ["ArrowLeft", { x: -1, y: 0 }],
  ["ArrowRight", { x: 1, y: 0 }],
  ["w", { x: 0, y: -1 }],
  ["s", { x: 0, y: 1 }],
  ["a", { x: -1, y: 0 }],
  ["d", { x: 1, y: 0 }]
]);

export class InputManager {
  constructor({ element, onPauseToggle }) {
    this.element = element;
    this.onPauseToggle = onPauseToggle;
    this.queue = [];
    this.maxQueue = 3;
    this.touchStart = null;
    this.tiltEnabled = false;
    this.tiltListener = null;
  }

  /**
   * @param {Direction} dir
   */
  enqueue(dir) {
    const last = this.queue[this.queue.length - 1];
    if (last && last.x === dir.x && last.y === dir.y) return;
    if (this.queue.length >= this.maxQueue) {
      this.queue.shift();
    }
    this.queue.push(dir);
  }

  /**
   * @returns {Direction | null}
   */
  next() {
    return this.queue.shift() ?? null;
  }

  clear() {
    this.queue.length = 0;
  }

  bind() {
    window.addEventListener("keydown", (event) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === " ") {
        event.preventDefault();
        this.onPauseToggle?.();
        return;
      }
      const dir = KEY_MAP.get(key);
      if (dir) {
        event.preventDefault();
        this.enqueue(dir);
      }
    });

    this.element.addEventListener("pointerdown", (event) => {
      this.touchStart = { x: event.clientX, y: event.clientY };
    });

    this.element.addEventListener("pointerup", (event) => {
      if (!this.touchStart) return;
      const dx = event.clientX - this.touchStart.x;
      const dy = event.clientY - this.touchStart.y;
      const threshold = 20;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
        this.enqueue({ x: dx > 0 ? 1 : -1, y: 0 });
      } else if (Math.abs(dy) > threshold) {
        this.enqueue({ x: 0, y: dy > 0 ? 1 : -1 });
      }
      this.touchStart = null;
    });

    document.querySelectorAll(".dpad button").forEach((button) => {
      button.addEventListener("click", () => {
        const dir = button.getAttribute("data-dir");
        const mapping = {
          up: { x: 0, y: -1 },
          down: { x: 0, y: 1 },
          left: { x: -1, y: 0 },
          right: { x: 1, y: 0 }
        };
        if (mapping[dir]) this.enqueue(mapping[dir]);
      });
    });
  }

  /**
   * @param {boolean} enabled
   */
  setTilt(enabled) {
    this.tiltEnabled = enabled;
    if (enabled && !this.tiltListener) {
      this.tiltListener = (event) => {
        if (!event.gamma && !event.beta) return;
        const gamma = event.gamma ?? 0;
        const beta = event.beta ?? 0;
        const threshold = 12;
        if (Math.abs(gamma) > Math.abs(beta) && Math.abs(gamma) > threshold) {
          this.enqueue({ x: gamma > 0 ? 1 : -1, y: 0 });
        } else if (Math.abs(beta) > threshold) {
          this.enqueue({ x: 0, y: beta > 0 ? 1 : -1 });
        }
      };
      window.addEventListener("deviceorientation", this.tiltListener);
    }

    if (!enabled && this.tiltListener) {
      window.removeEventListener("deviceorientation", this.tiltListener);
      this.tiltListener = null;
    }
  }
}
