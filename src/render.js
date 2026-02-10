/**
 * @typedef {{x: number, y: number}} Vec2
 */

export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.lastFlash = 0;
    this.particles = [];
  }

  resize(grid) {
    const size = this.canvas.clientWidth;
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = size * ratio;
    this.canvas.height = size * ratio;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.cell = size / grid;
  }

  /**
   * @param {{snake: Vec2[], food: Vec2, grid: number, interp: number, power?: string, reduceMotion: boolean}} state
   */
  render(state) {
    const { ctx, cell } = this;
    ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    this.drawGrid(state.grid);
    this.drawFood(state.food, cell);
    this.drawSnake(state.snake, cell, state.interp);
    if (state.power) {
      ctx.save();
      ctx.fillStyle = "rgba(255, 212, 0, 0.2)";
      ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
      ctx.restore();
    }
    this.updateParticles(state.reduceMotion);
  }

  drawGrid(grid) {
    const { ctx, cell } = this;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= grid; i += 1) {
      const pos = i * cell;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, cell * grid);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(cell * grid, pos);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawSnake(snake, cell, interp) {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = "#3cb371";
    ctx.shadowColor = "rgba(60, 179, 113, 0.4)";
    ctx.shadowBlur = 10;
    snake.forEach((segment, index) => {
      const prev = snake[index + 1] ?? segment;
      const x = (segment.x + (segment.x - prev.x) * interp) * cell;
      const y = (segment.y + (segment.y - prev.y) * interp) * cell;
      const radius = index === 0 ? cell * 0.4 : cell * 0.3;
      ctx.beginPath();
      ctx.roundRect(x + cell * 0.1, y + cell * 0.1, cell * 0.8, cell * 0.8, radius);
      ctx.fill();
    });
    ctx.restore();
  }

  drawFood(food, cell) {
    const { ctx } = this;
    ctx.save();
    const x = food.x * cell + cell / 2;
    const y = food.y * cell + cell / 2;
    ctx.fillStyle = "#f56565";
    ctx.beginPath();
    ctx.arc(x, y, cell * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  spawnParticles(position, count = 6) {
    for (let i = 0; i < count; i += 1) {
      this.particles.push({
        x: position.x,
        y: position.y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        life: 30
      });
    }
  }

  updateParticles(reduceMotion) {
    if (reduceMotion) {
      this.particles.length = 0;
      return;
    }
    const { ctx, cell } = this;
    ctx.save();
    ctx.fillStyle = "rgba(98, 160, 255, 0.6)";
    this.particles = this.particles.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
      ctx.beginPath();
      ctx.arc(p.x * cell, p.y * cell, 3, 0, Math.PI * 2);
      ctx.fill();
      return p.life > 0;
    });
    ctx.restore();
  }
}
