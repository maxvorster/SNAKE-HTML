/**
 * @typedef {Object} LeaderboardEntry
 * @property {string} initials
 * @property {number} score
 * @property {number} date
 */

const STORAGE_KEY = "snake:save:v2";
const DEFAULT_STATE = {
  settings: {
    gridSize: 22,
    baseSpeed: 8,
    wrap: false,
    powerups: true,
    tilt: false,
    volume: 0.6,
    muted: false,
    theme: "light",
    contrast: "normal",
    reduceMotion: false
  },
  leaderboard: []
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * @returns {{settings: typeof DEFAULT_STATE.settings, leaderboard: LeaderboardEntry[]}}
 */
export function loadState() {
  if (typeof localStorage === "undefined") {
    return structuredClone(DEFAULT_STATE);
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return {
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings ?? {}) },
      leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : []
    };
  } catch (error) {
    console.warn("Failed to load settings", error);
    return structuredClone(DEFAULT_STATE);
  }
}

/**
 * @param {{settings: typeof DEFAULT_STATE.settings, leaderboard: LeaderboardEntry[]}} state
 */
export function saveState(state) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings: state.settings,
        leaderboard: state.leaderboard
      })
    );
  } catch (error) {
    console.warn("Failed to save settings", error);
  }
}

/**
 * @param {LeaderboardEntry[]} leaderboard
 * @param {LeaderboardEntry} entry
 * @returns {LeaderboardEntry[]}
 */
export function updateLeaderboard(leaderboard, entry) {
  const next = [...leaderboard, entry]
    .sort((a, b) => b.score - a.score || b.date - a.date)
    .slice(0, 10);
  return next;
}

/**
 * @param {number} volume
 * @returns {number}
 */
export function sanitizeVolume(volume) {
  return clamp(Number(volume) || 0, 0, 1);
}
