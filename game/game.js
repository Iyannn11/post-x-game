// NEON DODGE — a tiny browser game built from one prompt.
// Prompt: "Build a tiny browser game: a neon ship dodges falling asteroids.
// Arrow keys to move, +1 point per second, game over on hit, press R to restart."
// Vanilla JS + canvas, no libraries, no network. Runs offline from static files.
(function () {
  'use strict';

  // Seeded RNG so a recorded run is reproducible.
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(1337);

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Starfield (static, drawn once per frame from a fixed list).
  const stars = [];
  for (let i = 0; i < 110; i++) {
    stars.push({ x: rand() * W, y: rand() * H, r: 0.6 + rand() * 1.8, s: 0.2 + rand() * 0.8 });
  }

  const SHIP_Y = H - 260;
  const ship = { x: W / 2, w: 92, h: 64, speed: 980 };
  const keys = { left: false, right: false };
  let asteroids = [];
  let score = 0, elapsed = 0, spawnT = 0, over = false, started = false;
  let flash = 0;

  const COLORS = ['#ff2d95', '#00e5ff', '#ffb020', '#b967ff'];

  function spawnAsteroid() {
    const r = 26 + rand() * 42;
    asteroids.push({
      x: 40 + rand() * (W - 80),
      y: -r - 20,
      r: r,
      vy: 320 + elapsed * 14 + rand() * 120,
      rot: rand() * Math.PI * 2,
      vr: (rand() - 0.5) * 1.6,
      color: COLORS[(rand() * COLORS.length) | 0],
      verts: 7 + ((rand() * 3) | 0),
    });
  }

  function reset() {
    asteroids = [];
    score = 0; elapsed = 0; spawnT = 0; over = false; started = true; flash = 0;
    ship.x = W / 2;
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, SHIP_Y);
    // Engine glow.
    const g = ctx.createRadialGradient(0, 34, 4, 0, 34, 60);
    g.addColorStop(0, 'rgba(0,229,255,0.85)');
    g.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 34, 60, 0, Math.PI * 2); ctx.fill();
    // Hull: neon triangle with cockpit.
    ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 22;
    ctx.fillStyle = '#062a33';
    ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -34); ctx.lineTo(40, 28); ctx.lineTo(16, 20); ctx.lineTo(0, 30);
    ctx.lineTo(-16, 20); ctx.lineTo(-40, 28); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#bff6ff';
    ctx.beginPath(); ctx.arc(0, -8, 8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawAsteroid(a) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);
    ctx.shadowColor = a.color; ctx.shadowBlur = 16;
    ctx.fillStyle = '#1a0b12';
    ctx.strokeStyle = a.color; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < a.verts; i++) {
      const ang = (i / a.verts) * Math.PI * 2;
      const rr = a.r * (0.78 + 0.22 * Math.sin(i * 2.7 + a.verts));
      const px = Math.cos(ang) * rr, py = Math.sin(ang) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    // Craters.
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath(); ctx.arc(-a.r * 0.3, -a.r * 0.2, a.r * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(a.r * 0.35, a.r * 0.3, a.r * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawHUD() {
    ctx.fillStyle = '#e8f6ff';
    ctx.font = '700 54px "JetBrains Mono", "DejaVu Sans Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE ' + score, 48, 96);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff2d95';
    ctx.fillText('NEON DODGE', W - 48, 96);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(232,246,255,0.55)';
    ctx.font = '400 30px "JetBrains Mono", "DejaVu Sans Mono", monospace';
    ctx.fillText('◀ ▶ move   ·   R restart', 48, 150);
  }

  function drawGameOver() {
    ctx.fillStyle = 'rgba(10,4,12,0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff2d95';
    ctx.font = '700 110px "JetBrains Mono", "DejaVu Sans Mono", monospace';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 40);
    ctx.fillStyle = '#e8f6ff';
    ctx.font = '700 64px "JetBrains Mono", "DejaVu Sans Mono", monospace';
    ctx.fillText('SCORE ' + score, W / 2, H / 2 + 60);
    ctx.fillStyle = 'rgba(232,246,255,0.7)';
    ctx.font = '400 36px "JetBrains Mono", "DejaVu Sans Mono", monospace';
    ctx.fillText('press R to fly again', W / 2, H / 2 + 140);
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    // Background.
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#070313');
    bg.addColorStop(0.6, '#0d0524');
    bg.addColorStop(1, '#160a2e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // Stars.
    ctx.fillStyle = '#ffffff';
    for (const s of stars) {
      ctx.globalAlpha = s.s;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (started && !over) {
      elapsed += dt;
      score = Math.floor(elapsed);
      // Steering.
      if (keys.left) ship.x -= ship.speed * dt;
      if (keys.right) ship.x += ship.speed * dt;
      ship.x = Math.max(56, Math.min(W - 56, ship.x));
      // Spawning ramps up with time.
      spawnT -= dt;
      if (spawnT <= 0) {
        spawnAsteroid();
        spawnT = Math.max(0.22, 0.55 - elapsed * 0.02);
      }
      // Move + collide.
      for (const a of asteroids) {
        a.y += a.vy * dt;
        a.rot += a.vr * dt;
      }
      asteroids = asteroids.filter(a => a.y - a.r < H + 40);
      for (const a of asteroids) {
        const dx = a.x - ship.x, dy = a.y - SHIP_Y;
        const rr = a.r * 0.82 + 26;
        if (dx * dx + dy * dy < rr * rr) { over = true; flash = 1; break; }
      }
    }

    for (const a of asteroids) drawAsteroid(a);
    if (started) drawShip();
    drawHUD();
    if (flash > 0) {
      ctx.fillStyle = 'rgba(255,45,149,' + (flash * 0.35) + ')';
      ctx.fillRect(0, 0, W, H);
      flash = Math.max(0, flash - dt * 2.2);
    }
    if (over) drawGameOver();
    if (!started) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e8f6ff';
      ctx.font = '700 72px "JetBrains Mono", "DejaVu Sans Mono", monospace';
      ctx.fillText('NEON DODGE', W / 2, H / 2 - 30);
      ctx.fillStyle = 'rgba(232,246,255,0.7)';
      ctx.font = '400 38px "JetBrains Mono", "DejaVu Sans Mono", monospace';
      ctx.fillText('press any arrow key to fly', W / 2, H / 2 + 50);
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') { keys.left = true; if (!started) reset(); e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'd') { keys.right = true; if (!started) reset(); e.preventDefault(); }
    if ((e.key === 'r' || e.key === 'R') && over) reset();
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });
  // Touch / drag steering.
  canvas.addEventListener('pointermove', (e) => {
    if (!started) reset();
    const rect = canvas.getBoundingClientRect();
    ship.x = Math.max(56, Math.min(W - 56, (e.clientX - rect.left) * (W / rect.width)));
  });

  // State hook for the recording autopilot (read-only).
  window.__game = {
    get shipX() { return ship.x; },
    get asteroids() { return asteroids.map(a => ({ x: a.x, y: a.y, r: a.r })); },
    get over() { return over; },
    get score() { return score; },
    get started() { return started; },
    reset: reset,
  };

  requestAnimationFrame(frame);
})();
