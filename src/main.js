import { SnakeGame, createRng } from "./game.js";
import { Renderer } from "./render.js";
import { InputManager } from "./input.js";
import { AudioManager } from "./audio.js";
import { loadState, saveState, updateLeaderboard, sanitizeVolume } from "./storage.js";

const DEFAULT_CONFIG = {
  grid: 22,
  baseSpeed: 8,
  wrap: false,
  powerups: true
};

const dom = {
  canvas: document.getElementById("game-canvas"),
  overlay: document.getElementById("overlay"),
  score: document.getElementById("status-score"),
  level: document.getElementById("status-level"),
  speed: document.getElementById("status-speed"),
  start: document.getElementById("start-btn"),
  pause: document.getElementById("pause-btn"),
  resume: document.getElementById("resume-btn"),
  restart: document.getElementById("restart-btn"),
  share: document.getElementById("share-btn"),
  gameoverDialog: document.getElementById("gameover-dialog"),
  gameoverSummary: document.getElementById("gameover-summary"),
  gameoverRetry: document.getElementById("gameover-retry"),
  gameoverClose: document.getElementById("gameover-close"),
  initials: document.getElementById("player-initials"),
  settings: {
    gridSize: document.getElementById("grid-size"),
    baseSpeed: document.getElementById("base-speed"),
    wrap: document.getElementById("wrap-mode"),
    powerups: document.getElementById("powerups"),
    tilt: document.getElementById("tilt"),
    volume: document.getElementById("volume"),
    mute: document.getElementById("mute")
  },
  leaderboard: document.getElementById("leaderboard"),
  theme: document.getElementById("theme-toggle"),
  contrast: document.getElementById("contrast-toggle"),
  motion: document.getElementById("motion-toggle")
};

const state = {
  status: "menu",
  lastTime: 0,
  accumulator: 0,
  tickRate: 8,
  maxSteps: 5,
  interpolation: 0,
  reduceMotion: false
};

const stored = loadState();

const audio = new AudioManager();
const renderer = new Renderer(dom.canvas);
const input = new InputManager({
  element: dom.canvas,
  onPauseToggle: () => togglePause()
});

const urlSeed = new URLSearchParams(window.location.search).get("seed");
const seedValue = Number(urlSeed || Date.now());
const rng = createRng(seedValue);

let game = createGameFromSettings();

function createGameFromSettings() {
  return new SnakeGame({
    grid: stored.settings.gridSize ?? DEFAULT_CONFIG.grid,
    baseSpeed: stored.settings.baseSpeed ?? DEFAULT_CONFIG.baseSpeed,
    wrap: stored.settings.wrap ?? DEFAULT_CONFIG.wrap,
    powerups: stored.settings.powerups ?? DEFAULT_CONFIG.powerups,
    rng
  });
}

function syncSettingsUI() {
  dom.settings.gridSize.value = stored.settings.gridSize;
  dom.settings.baseSpeed.value = stored.settings.baseSpeed;
  dom.settings.wrap.checked = stored.settings.wrap;
  dom.settings.powerups.checked = stored.settings.powerups;
  dom.settings.tilt.checked = stored.settings.tilt;
  dom.settings.volume.value = stored.settings.volume;
  dom.settings.mute.checked = stored.settings.muted;
  document.documentElement.dataset.theme = stored.settings.theme;
  document.documentElement.dataset.contrast = stored.settings.contrast;
  state.reduceMotion = stored.settings.reduceMotion;
  dom.theme.setAttribute("aria-pressed", stored.settings.theme === "dark");
  dom.contrast.setAttribute("aria-pressed", stored.settings.contrast === "high");
  dom.motion.setAttribute("aria-pressed", stored.settings.reduceMotion);
}

function updateLeaderboardUI() {
  dom.leaderboard.innerHTML = "";
  stored.leaderboard.forEach((entry) => {
    const li = document.createElement("li");
    const date = new Date(entry.date).toLocaleDateString();
    li.textContent = `${entry.initials} — ${entry.score} (${date})`;
    dom.leaderboard.appendChild(li);
  });
}

function updateStatus() {
  dom.score.textContent = `Score: ${game.score}`;
  dom.level.textContent = `Level: ${game.level}`;
  dom.speed.textContent = `Speed: ${game.speed} tps`;
}

function startGame() {
  if (!audio.ctx) audio.ensureContext();
  state.status = "playing";
  dom.pause.disabled = false;
  dom.resume.hidden = true;
  dom.pause.hidden = false;
  dom.overlay.textContent = "";
  input.clear();
}

function pauseGame() {
  if (state.status !== "playing") return;
  state.status = "paused";
  dom.pause.hidden = true;
  dom.resume.hidden = false;
  dom.overlay.textContent = "Paused";
}

function resumeGame() {
  if (state.status !== "paused") return;
  state.status = "playing";
  dom.pause.hidden = false;
  dom.resume.hidden = true;
  dom.overlay.textContent = "";
}

function togglePause() {
  if (state.status === "playing") pauseGame();
  else if (state.status === "paused") resumeGame();
}

function resetGame() {
  game = createGameFromSettings();
  renderer.resize(game.grid);
  updateStatus();
}

function handleGameOver() {
  state.status = "gameover";
  dom.pause.disabled = true;
  dom.overlay.textContent = "Game Over";
  dom.gameoverSummary.textContent = `You scored ${game.score}.`;
  dom.gameoverDialog.showModal();
}

function saveScore() {
  const initials = (dom.initials.value || "AAA").toUpperCase().slice(0, 3);
  stored.leaderboard = updateLeaderboard(stored.leaderboard, {
    initials,
    score: game.score,
    date: Date.now()
  });
  saveState(stored);
  updateLeaderboardUI();
}

function gameLoop(timestamp) {
  if (!state.lastTime) state.lastTime = timestamp;
  const delta = Math.min(0.1, (timestamp - state.lastTime) / 1000);
  state.lastTime = timestamp;
  if (state.status === "playing") {
    state.accumulator += delta;
    const tickDuration = 1 / game.speed;
    let steps = 0;
    while (state.accumulator >= tickDuration && steps < state.maxSteps) {
      const dir = input.next();
      if (dir) game.queueDirection(dir);
      const result = game.tick();
      if (result.ate) {
        audio.playEat();
        renderer.spawnParticles(game.snake[0]);
      }
      if (result.leveled) audio.playLevelUp();
      if (result.died) {
        audio.playDie();
        handleGameOver();
      }
      updateStatus();
      state.accumulator -= tickDuration;
      steps += 1;
    }
  }

  const interp = state.accumulator * game.speed;
  renderer.render({
    snake: game.snake,
    food: game.food,
    grid: game.grid,
    interp,
    power: game.activePower?.type,
    reduceMotion: state.reduceMotion
  });

  requestAnimationFrame(gameLoop);
}

function bindUI() {
  dom.start.addEventListener("click", () => {
    resetGame();
    startGame();
  });
  dom.pause.addEventListener("click", pauseGame);
  dom.resume.addEventListener("click", resumeGame);
  dom.restart.addEventListener("click", () => {
    resetGame();
    startGame();
  });
  dom.share.addEventListener("click", async () => {
    const text = `I scored ${game.score} in Snake!`;
    try {
      await navigator.clipboard.writeText(text);
      dom.share.textContent = "Copied!";
      setTimeout(() => (dom.share.textContent = "Share Score"), 1200);
    } catch (error) {
      alert(text);
    }
  });

  dom.gameoverRetry.addEventListener("click", () => {
    saveScore();
    dom.gameoverDialog.close();
    resetGame();
    startGame();
  });
  dom.gameoverClose.addEventListener("click", () => {
    saveScore();
    dom.gameoverDialog.close();
  });

  dom.settings.gridSize.addEventListener("change", (event) => {
    stored.settings.gridSize = Number(event.target.value);
    saveState(stored);
    resetGame();
  });
  dom.settings.baseSpeed.addEventListener("change", (event) => {
    stored.settings.baseSpeed = Number(event.target.value);
    saveState(stored);
    resetGame();
  });
  dom.settings.wrap.addEventListener("change", (event) => {
    stored.settings.wrap = event.target.checked;
    saveState(stored);
    resetGame();
  });
  dom.settings.powerups.addEventListener("change", (event) => {
    stored.settings.powerups = event.target.checked;
    saveState(stored);
    resetGame();
  });
  dom.settings.tilt.addEventListener("change", (event) => {
    stored.settings.tilt = event.target.checked;
    input.setTilt(event.target.checked);
    saveState(stored);
  });
  dom.settings.volume.addEventListener("input", (event) => {
    stored.settings.volume = sanitizeVolume(event.target.value);
    audio.setVolume(stored.settings.volume);
    saveState(stored);
  });
  dom.settings.mute.addEventListener("change", (event) => {
    stored.settings.muted = event.target.checked;
    audio.setMuted(stored.settings.muted);
    saveState(stored);
  });

  dom.theme.addEventListener("click", () => {
    stored.settings.theme = stored.settings.theme === "dark" ? "light" : "dark";
    syncSettingsUI();
    saveState(stored);
  });
  dom.contrast.addEventListener("click", () => {
    stored.settings.contrast = stored.settings.contrast === "high" ? "normal" : "high";
    syncSettingsUI();
    saveState(stored);
  });
  dom.motion.addEventListener("click", () => {
    stored.settings.reduceMotion = !stored.settings.reduceMotion;
    syncSettingsUI();
    saveState(stored);
  });
}

function init() {
  syncSettingsUI();
  updateLeaderboardUI();
  audio.setVolume(stored.settings.volume);
  audio.setMuted(stored.settings.muted);
  renderer.resize(game.grid);
  input.bind();
  input.setTilt(stored.settings.tilt);
  updateStatus();
  requestAnimationFrame(gameLoop);
}

bindUI();
init();
