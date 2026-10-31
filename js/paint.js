/* Colour pour: RGB + CMYK streams drip from the hero letters (behind the content),
   and a mixed stream pours into a bucket in the last section. Canvas only; no layout impact. */
(() => {
  const cv = document.getElementById('paint'), bk = document.getElementById('bucket');
  if (!cv || !bk) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = cv.getContext('2d'), bx = bk.getContext('2d');
  // R G B C M Y K (graphite so it reads on black) + orange + violet
  const P = ['#ff3b5c', '#2bd985', '#3d7bff', '#19d3ee', '#f03ab4', '#ffd23f', '#9aa0b5', '#ff8a3d', '#9b6bff'];
  const letters = [...document.querySelectorAll('.hero h1 i')];
  const hero = document.querySelector('.hero'), contact = document.getElementById('contact');
  const ss = (a, b, x) => { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
  let W, H, dpr;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bd = Math.min(devicePixelRatio || 1, 2);
    bk.width = 200 * bd; bk.height = 220 * bd; bx.setTransform(bd, 0, 0, bd, 0, 0);
  };
  resize(); addEventListener('resize', resize);

  const TOP = 34, BOT = 186;
  let fill = 0, strength = 0, parts = [], tips = letters.map(() => ({ next: 1 + Math.random() * 2 }));
  const t0 = performance.now(); let last = t0;

  const body = () => {
    bx.beginPath(); bx.moveTo(18, TOP); bx.lineTo(182, TOP); bx.lineTo(160, BOT);
    bx.quadraticCurveTo(158, BOT + 8, 148, BOT + 8); bx.lineTo(52, BOT + 8);
    bx.quadraticCurveTo(42, BOT + 8, 40, BOT); bx.closePath();
  };
  const wavePath = (sy, amp, ph) => {
    bx.beginPath(); bx.moveTo(0, 220);
    for (let x = 0; x <= 200; x += 4) bx.lineTo(x, sy + Math.sin(x * 0.07 + ph) * amp + Math.sin(x * 0.13 - ph * 1.3) * amp * 0.5);
    bx.lineTo(200, 220); bx.closePath();
  };
  const drawBucket = (t) => {
    bx.clearRect(0, 0, 200, 220);
    const sy = BOT + 4 - (BOT + 4 - TOP - 8) * fill, amp = 1.5 + 5 * strength;
    bx.save(); body(); bx.clip();
    if (fill > 0.005) {
      bx.save(); wavePath(sy, amp, t * 2.2); bx.clip();
      const g = bx.createLinearGradient(0, sy, 0, BOT + 8); g.addColorStop(0, '#1b1530'); g.addColorStop(1, '#0a0814');
      bx.fillStyle = g; bx.fillRect(0, 0, 200, 220);
      for (let k = 0; k < 7; k++) {
        const cx = 100 + Math.sin(t * 0.6 + k * 1.7) * 55, cy = sy + 36 + Math.cos(t * 0.5 + k * 2.1) * 38;
        const rg = bx.createRadialGradient(cx, cy, 0, cx, cy, 64);
        rg.addColorStop(0, P[k] + '99'); rg.addColorStop(1, P[k] + '00');
        bx.fillStyle = rg; bx.fillRect(0, 0, 200, 220);
      }
      bx.restore();
      bx.globalCompositeOperation = 'source-over';
      bx.beginPath();
      for (let x = 0; x <= 200; x += 4) {
        const y = sy + Math.sin(x * 0.07 + t * 2.2) * amp + Math.sin(x * 0.13 - t * 2.2 * 1.3) * amp * 0.5;
        x ? bx.lineTo(x, y) : bx.moveTo(x, y);
      }
      bx.strokeStyle = 'rgba(255,255,255,.55)'; bx.lineWidth = 1.5; bx.stroke();
    }
    bx.fillStyle = 'rgba(255,255,255,.08)';
    bx.beginPath(); bx.moveTo(28, TOP + 6); bx.lineTo(46, TOP + 6); bx.lineTo(62, BOT - 6); bx.lineTo(50, BOT - 6); bx.fill();
    bx.restore();
    bx.lineJoin = 'round'; bx.lineCap = 'round';
    body(); bx.strokeStyle = 'rgba(255,255,255,.85)'; bx.lineWidth = 2.5; bx.stroke();
    bx.beginPath(); bx.moveTo(14, TOP); bx.lineTo(186, TOP); bx.lineWidth = 5; bx.stroke();
    bx.beginPath(); bx.ellipse(100, TOP, 82, 30, 0, Math.PI, 2 * Math.PI);
    bx.strokeStyle = 'rgba(255,255,255,.45)'; bx.lineWidth = 2.5; bx.stroke();
  };

  const spawn = (x, y, vx, vy, r, c, life, maxY = Infinity) => { if (parts.length < 90) parts.push({ x, y, vx, vy, r, c, life, maxY }); };

  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = now / 1000, since = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    const hr = hero.getBoundingClientRect(), br = bk.getBoundingClientRect();
    const heroOn = hr.bottom > 0 && hr.top < H, bucketOn = br.bottom > 0 && br.top < H;

    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // 1. Streams dripping from each hero letter
    if (heroOn) {
      const grow = ss(1.4, 4.4, since), maxLen = Math.min(H * 0.5, 420);
      letters.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -20 || r.top > H) return;
        const x = r.left + r.width * 0.5, y0 = r.bottom - r.height * 0.1, len = maxLen * grow * (0.8 + 0.2 * Math.sin(i * 2.3));
        if (len < 4) return;
        const pts = [];
        for (let d = 0; d <= len; d += 6) pts.push([x + Math.sin(d * 0.03 + t * 2.2 + i) * 2.4 * (d / len), y0 + d]);
        const g = ctx.createLinearGradient(x, y0, x, y0 + len);
        g.addColorStop(0, P[i % 9]); g.addColorStop(1, P[(i + 1) % 9]);
        const path = () => { ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); };
        ctx.globalAlpha = 0.6; ctx.strokeStyle = g; ctx.lineWidth = 6; path(); ctx.stroke();
        ctx.globalAlpha = 0.32; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.setLineDash([2, 22]); ctx.lineDashOffset = -t * 90; path(); ctx.stroke(); ctx.setLineDash([]);
        const tx = pts[pts.length - 1][0], ty = pts[pts.length - 1][1], rr = 5.5 + Math.sin(t * 3 + i);
        const rg = ctx.createRadialGradient(tx, ty, 0, tx, ty, rr * 2.4);
        rg.addColorStop(0, P[(i + 1) % 9]); rg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.7; ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(tx, ty, rr * 2.4, 0, 7); ctx.fill();
        if (grow > 0.6 && t > tips[i].next) {
          spawn(tx, ty, (Math.random() - 0.5) * 16, 30, 3 + Math.random() * 2.5, P[(i + 1) % 9], 2.4);
          tips[i].next = t + 0.9 + Math.random() * 1.7;
        }
      });
    }

    // 2. Mixed pour into the bucket in the last section
    const pouring = bucketOn && fill < 1 && br.top < H * 0.92;
    strength += ((pouring ? 1 : 0) - strength) * Math.min(1, dt * 2.5);
    if (pouring) fill = Math.min(1, fill + dt * 0.13);
    if (strength > 0.02) {
      const sc = br.width / 200, cx = br.left + 100 * sc;
      const surf = br.top + (BOT + 4 - (BOT + 4 - TOP - 8) * fill) * sc, y1 = Math.min(surf, H + 40);
      for (let k = 0; k < 7; k++) {
        ctx.beginPath();
        for (let y = -10; y <= y1; y += 10) {
          const n = Math.max(0, Math.min(1, (y + 10) / (y1 + 10 || 1)));
          const spread = 9 * Math.pow(1 - n, 1.4) * sc + 3.5;
          const x = cx + Math.sin(y * 0.02 + t * 1.8 + k * 0.9) * spread;
          y === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.globalAlpha = 0.3 * strength; ctx.strokeStyle = P[k]; ctx.lineWidth = 5.5 * strength * sc; ctx.stroke();
      }
      ctx.globalAlpha = 0.12 * strength; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, -10); ctx.lineTo(cx, y1); ctx.stroke();
      if (Math.random() < 0.6 * strength) spawn(cx + (Math.random() - 0.5) * 14, y1, (Math.random() - 0.5) * 120, -120 - Math.random() * 120, 1.6 + Math.random() * 2, P[(Math.random() * 9) | 0], 0.9, y1 + 3);
    }

    // 3. Drops (hero drips falling, bucket splashes)
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.vy += 1100 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.y > H + 20 || p.life <= 0 || (p.vy > 0 && p.y > p.maxY)) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = 0.7 * Math.min(1, p.life / 0.5); ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * (1 + Math.min(Math.abs(p.vy), 800) / 450), 0, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    if (bucketOn) drawBucket(t);
  };

  if (reduce) { cv.style.display = 'none'; fill = 0.7; drawBucket(0); return; }
  requestAnimationFrame(frame);
})();
