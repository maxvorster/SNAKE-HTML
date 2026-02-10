/**
 * @typedef {{x: number, y: number}} Vec2
 * @typedef {{type: string, duration: number}} Powerup
 */

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

export const POWERUP_TYPES = ["speed", "slow", "shrink", "double"];

/**
 * Seeded RNG (Mulberry32)
 * @param {number} seed
 */
export function createRng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {Vec2} head
 * @param {Vec2} dir
 * @returns {Vec2}
 */
export function nextHead(head, dir) {
  return { x: head.x + dir.x, y: head.y + dir.y };
}

/**
 * @param {Vec2} pos
 * @param {Vec2[]} snake
 * @returns {boolean}
 */
export function isCollision(pos, snake) {
  return snake.some((segment) => segment.x === pos.x && segment.y === pos.y);
}

/**
 * @param {number} grid
 * @param {Vec2[]} snake
 * @param {() => number} rng
 * @returns {Vec2}
 */
export function spawnFood(grid, snake, rng) {
  const free = [];
  for (let y = 0; y < grid; y += 1) {
    for (let x = 0; x < grid; x += 1) {
      if (!isCollision({ x, y }, snake)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { x: 0, y: 0 };
  return free[Math.floor(rng() * free.length)];
}

export class SnakeGame {
  /**
   * @param {{grid: number, baseSpeed: number, wrap: boolean, powerups: boolean, rng: () => number}} config
   */
  constructor(config) {
    this.grid = config.grid;
    this.baseSpeed = config.baseSpeed;
    this.wrap = config.wrap;
    this.powerupsEnabled = config.powerups;
    this.rng = config.rng;
    this.reset();
  }

  reset() {
    const mid = Math.floor(this.grid / 2);
    this.snake = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid }
    ];
    this.direction = DIRS.right;
    this.pendingDirection = DIRS.right;
    this.food = spawnFood(this.grid, this.snake, this.rng);
    this.score = 0;
    this.level = 1;
    this.speed = this.baseSpeed;
    this.dead = false;
    this.grow = 0;
    this.powerups = [];
    this.activePower = null;
    this.powerTimer = 0;
    this.lastEat = 0;
  }

  /**
   * @param {Vec2} dir
   */
  queueDirection(dir) {
    if (dir.x === -this.direction.x && dir.y === -this.direction.y) {
      return;
    }
    this.pendingDirection = dir;
  }

  tick() {
    if (this.dead) return { ate: false, leveled: false, died: false };
    this.direction = this.pendingDirection;
    let next = nextHead(this.snake[0], this.direction);

    if (this.wrap) {
      next = {
        x: (next.x + this.grid) % this.grid,
        y: (next.y + this.grid) % this.grid
      };
    } else if (next.x < 0 || next.x >= this.grid || next.y < 0 || next.y >= this.grid) {
      this.dead = true;
      return { ate: false, leveled: false, died: true };
    }

    if (isCollision(next, this.snake)) {
      this.dead = true;
      return { ate: false, leveled: false, died: true };
    }

    this.snake.unshift(next);
    let ate = false;
    let leveled = false;

    if (next.x === this.food.x && next.y === this.food.y) {
      this.score += this.activePower?.type === "double" ? 2 : 1;
      this.grow += 1;
      ate = true;
      this.lastEat = 1;
      if (this.score % 5 === 0) {
        this.level += 1;
        this.speed = this.baseSpeed + Math.floor(this.level / 2);
        leveled = true;
      }
      this.food = spawnFood(this.grid, this.snake, this.rng);
      if (this.powerupsEnabled && this.rng() > 0.85 && this.powerups.length < 1) {
        const type = POWERUP_TYPES[Math.floor(this.rng() * POWERUP_TYPES.length)];
        this.powerups.push({ type, duration: 6 });
      }
    }

    if (this.grow > 0) {
      this.grow -= 1;
    } else {
      this.snake.pop();
    }

    if (this.powerups.length > 0 && !this.activePower) {
      const power = this.powerups.shift();
      if (power) {
        this.activePower = power;
        this.powerTimer = power.duration;
        if (power.type === "speed") this.speed += 3;
        if (power.type === "slow") this.speed = Math.max(4, this.speed - 3);
        if (power.type === "shrink") this.snake.splice(-2, 2);
      }
    }

    if (this.activePower) {
      this.powerTimer -= 1 / this.speed;
      if (this.powerTimer <= 0) {
        this.activePower = null;
        this.speed = this.baseSpeed + Math.floor(this.level / 2);
      }
    }

    return { ate, leveled, died: false };
  }
}
