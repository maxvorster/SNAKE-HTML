# Snake — Modern Web Edition

A production-quality Snake game built with vanilla HTML/CSS/JS (ES modules). No build step required — just open `index.html` in your browser.

## File Tree
```
.
├── index.html
├── styles.css
├── src/
│   ├── main.js
│   ├── game.js
│   ├── render.js
│   ├── input.js
│   ├── audio.js
│   └── storage.js
├── tests/
│   └── logic.test.js
└── assets/
    ├── snake-sprites.png
    ├── eat.wav
    └── die.wav
```

## Run Instructions
1. Download or copy all files into a folder.
2. Open `index.html` in a modern browser (Chrome, Safari, Firefox).
3. Optional: use a deterministic replay by adding a seed in the URL, e.g. `index.html?seed=1234`.

> Note: Audio starts only after your first interaction (browser autoplay policy).

## Controls
- **Keyboard:** Arrow keys or WASD. Space toggles pause/resume.
- **Touch:** Swipe in any direction; use the on-screen D-pad.
- **Tilt:** Enable in settings (beta).

## Configuration Options
- Grid size
- Base speed (ticks per second)
- Wrap-around walls
- Powerups on/off
- Audio volume + mute
- Theme (light/dark) + high-contrast
- Reduce motion

## Accessibility Features
- Keyboard- and screen reader-friendly buttons with ARIA labels.
- Visible focus styles.
- High-contrast mode and reduced-motion option.

## Assets
This repo uses assets.
- `assets/snake-sprites.png` — sprite sheet (head/body/tail variants).
- `assets/eat.wav` — short SFX.
- `assets/die.wav` — short SFX.


## Testing
The test harness runs in the browser (no Node required).
1. Open `tests/logic.test.js` in a browser console via `index.html` or create a test page that imports it.
2. Look for `✔` log output.

## Testing Checklist
- [ ] Movement is smooth at 60fps.
- [ ] Food never spawns on the snake.
- [ ] Pause/resume works on keyboard and touch.
- [ ] High score persists after refresh.
- [ ] Touch swipe and D-pad both work.

## Extension Ideas
1. Add obstacle walls or maze layouts.
2. Multiplayer local co-op with two snakes.
3. Daily challenge seed of the day.
4. Ghost replay of best run.
5. Pixel-art theme toggle.
6. Custom snake skins.
7. Advanced powerups (reverse controls, portals).
8. Achievements and badges.
9. Fullscreen mobile mode.
10. Web Share API integration.
