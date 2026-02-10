import { createRng, isCollision, nextHead, spawnFood } from "../src/game.js";

const assert = (label, condition) => {
  if (!condition) {
    throw new Error(`Assertion failed: ${label}`);
  }
  console.log(`✔ ${label}`);
};

export function runTests() {
  const rng = createRng(1234);
  const snake = [
    { x: 1, y: 1 },
    { x: 1, y: 2 }
  ];

  assert("nextHead moves correctly", nextHead({ x: 1, y: 1 }, { x: 1, y: 0 }).x === 2);
  assert("collision detects snake", isCollision({ x: 1, y: 1 }, snake));

  const food = spawnFood(5, snake, rng);
  assert("food not on snake", !isCollision(food, snake));
}

if (typeof window !== "undefined") {
  window.addEventListener("load", runTests);
}
