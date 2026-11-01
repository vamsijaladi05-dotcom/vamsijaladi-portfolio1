(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mod = (a, n) => ((a % n) + n) % n;

  /* ---------- shared controls: dots, arrows, autoplay, swipe, pause on hover ---------- */
  function setup(root, n, go, getIndex) {
    const ms = +root.dataset.interval || 4000;
    const dotsEl = $('.s-dots', root), bar = $('.s-bar', root);
    const dots = [];
    for (let k = 0; k < n; k++) {
      const b = document.createElement('button');
      b.setAttribute('aria-label', 'Go to slide ' + (k + 1));
      b.addEventListener('click', () => { go(k); reset(); });
      dotsEl.appendChild(b); dots.push(b);
    }
    let timer = null, paused = false, visible = false;
    const stop = () => { clearTimeout(timer); timer = null; };
    function reset() {
      stop();
      if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; }
      if (reduce || paused || !visible) return;
      if (bar) bar.style.animation = `sbar ${ms}ms linear forwards`;
      timer = setTimeout(() => { go(getIndex() + 1); reset(); }, ms);
    }
    $('.s-prev', root).addEventListener('click', () => { go(getIndex() - 1); reset(); });
    $('.s-next', root).addEventListener('click', () => { go(getIndex() + 1); reset(); });
    root.addEventListener('mouseenter', () => { paused = true; stop(); if (bar) bar.style.animationPlayState = 'paused'; });
    root.addEventListener('mouseleave', () => { paused = false; reset(); });
    let sx = null;
    root.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 45) { go(getIndex() + (dx < 0 ? 1 : -1)); reset(); }
    }, { passive: true });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; reset(); }, { threshold: 0.25 }).observe(root);
    document.addEventListener('visibilitychange', () => { visible = !document.hidden && visible; reset(); });
    return { mark: m => dots.forEach((d, k) => d.classList.toggle('on', k === m)), reset };
  }

  /* ---------- A. Horizontal slide (right to left, endless) ---------- */
  function hslide(root) {
    const track = $('.hs-track', root), slides = $$('.hs-slide', track), n = slides.length;
    const clone = slides[0].cloneNode(true);
    clone.setAttribute('aria-hidden', 'true'); clone.classList.remove('is-active');
    track.appendChild(clone);
    let i = 0, busy = false, fb;
    const move = (idx, anim) => {
      track.style.transition = anim ? 'transform 1.1s cubic-bezier(.65,0,.35,1)' : 'none';
      track.style.transform = `translateX(${-idx * 100}%)`;
    };
    const active = idx => $$('.hs-slide', track).forEach((s, k) => {
      s.classList.toggle('is-active', k === idx);
      if (k !== idx) s.classList.remove('nocap');
    });
    const finish = () => {
      if (!busy) return; busy = false; clearTimeout(fb);
      if (i === n) {
        i = 0; move(0, false);
        const s0 = slides[0]; s0.classList.add('is-active', 'nocap');
        clone.classList.remove('is-active', 'nocap');
      }
    };
    const go = k => {
      if (busy) return;
      busy = true;
      if (k < 0) { move(n, false); void track.offsetWidth; k = n - 1; clone.classList.remove('is-active'); }
      k = Math.min(k, n); i = k;
      move(i, true); active(i);
      c.mark(mod(i, n));
      fb = setTimeout(finish, 1250);
    };
    track.addEventListener('transitionend', e => { if (e.target === track) finish(); });
    const c = setup(root, n, go, () => i);
    c.mark(0);
  }

  /* ---------- B. Parallax slider ---------- */
  function parallax(root) {
    const stage = $('.px-stage', root), slides = $$('.px-slide', stage), n = slides.length;
    let i = 0, busy = false;
    const go = k => {
      if (busy) return;
      k = mod(k, n); if (k === i) return;
      const dir = (k > i && !(i === 0 && k === n - 1)) || (i === n - 1 && k === 0) ? 1 : -1;
      busy = true;
      const A = slides[i], B = slides[k];
      B.classList.add('noanim'); B.dataset.s = dir > 0 ? 'right' : 'left'; void B.offsetWidth;
      B.classList.remove('noanim');
      requestAnimationFrame(() => {
        B.dataset.s = 'active'; A.dataset.s = dir > 0 ? 'left' : 'right';
      });
      i = k; c.mark(i);
      setTimeout(() => {
        slides.forEach((s, idx) => {
          if (idx === i || s.dataset.s === 'right') return;
          s.classList.add('noanim'); s.dataset.s = 'right'; void s.offsetWidth; s.classList.remove('noanim');
        });
        busy = false;
      }, 2100);
    };
    stage.addEventListener('mousemove', e => {
      const r = stage.getBoundingClientRect();
      stage.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      stage.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    stage.addEventListener('mouseleave', () => { stage.style.setProperty('--mx', 0); stage.style.setProperty('--my', 0); });
    const c = setup(root, n, go, () => i);
    c.mark(0);
  }

  /* ---------- C. 3D card slider ---------- */
  function card3d(root) {
    const cards = $$('.c3-card', root), n = cards.length, cap = $('.c3-cap', root);
    let i = 0, prevO = cards.map(() => 0);
    const layout = () => {
      cards.forEach((card, idx) => {
        let o = mod(idx - i, n); if (o > n / 2) o -= n;
        const a = Math.abs(o);
        card.classList.toggle('jump', Math.abs(o - prevO[idx]) > 1.5);
        prevO[idx] = o;
        card.style.transform = `translateX(${o * 62}%) translateZ(${-a * 150}px) rotateY(${-o * 30}deg)`;
        card.style.opacity = a <= 2 ? 1 - a * 0.18 : 0;
        card.style.filter = `brightness(${1 - a * 0.22})`;
        card.style.zIndex = 20 - a;
        card.style.pointerEvents = a <= 2 ? 'auto' : 'none';
        card.classList.toggle('is-front', o === 0);
      });
      cap.classList.remove('swap'); void cap.offsetWidth; cap.classList.add('swap');
      $('h3', cap).textContent = cards[i].dataset.title;
      $('p', cap).textContent = cards[i].dataset.desc;
      c.mark(i);
    };
    const go = k => { i = mod(k, n); layout(); };
    // clicking a side card brings it to the front; clicking the front card opens the lightbox (handled in main.js)
    cards.forEach((card, idx) => card.addEventListener('click', e => {
      if (idx !== i) { e.stopImmediatePropagation(); go(idx); c.reset(); }
    }));
    const c = setup(root, n, go, () => i);
    layout();
  }

  /* ---------- D. 3D cube slider ---------- */
  function cube(root) {
    const cubeEl = $('.cube', root), faces = $$('.face', cubeEl);
    const items = $$('.cube-items i', root).map(x => ({ src: x.dataset.src, title: x.dataset.title, desc: x.dataset.desc }));
    const n = items.length, side = $('.cube-text');
    const tTitle = $('#cubeTitle'), tDesc = $('#cubeDesc');
    let step = 0;
    const put = (face, it) => {
      $('img', face).src = it.src; $('img', face).alt = it.title;
      face.dataset.open = it.src; face.dataset.title = it.title; face.dataset.desc = it.desc;
    };
    const go = k => {
      // k is a running step count; only move forward/backward one face at a time
      const target = k;
      const nextFace = faces[mod(target, 4)];
      put(nextFace, items[mod(target, n)]);
      step = target;
      cubeEl.style.transform = `translateZ(calc(var(--w) / -2)) rotateY(${-90 * step}deg)`;
      const it = items[mod(step, n)];
      tTitle.textContent = it.title; tDesc.textContent = it.desc;
      side.classList.remove('swap'); void side.offsetWidth; side.classList.add('swap');
      c.mark(mod(step, n));
    };
    const c = setup(root, n, k => {
      // dots send an absolute item index; convert to a nearby step so the cube keeps turning one way
      if (k >= 0 && k < n && Math.abs(k - mod(step, n)) > 1) k = step + mod(k - step, n);
      go(k);
    }, () => step);
    c.mark(0);
  }

  const engines = { hslide, parallax, card3d, cube };
  $$('.slider[data-type]').forEach(r => engines[r.dataset.type] && engines[r.dataset.type](r));

  /* ---------- Typewriter: rotating hero role ---------- */
  const roleEl = $('#roleText');
  if (roleEl) {
    const phrases = ['UI/UX & Graphic Designer', 'Poster & Social Designer', 'Figma Prototyper', 'Video & Motion Editor'];
    let p = 0, n = 0, dir = 1;
    const tick = () => {
      const s = phrases[p];
      roleEl.textContent = s.slice(0, n);
      if (reduce) { roleEl.textContent = phrases[0]; return; }
      n += dir;
      if (n > s.length) { dir = -1; return setTimeout(tick, 1800); }
      if (n < 0) { dir = 1; n = 0; p = (p + 1) % phrases.length; return setTimeout(tick, 350); }
      setTimeout(tick, dir > 0 ? 75 : 35);
    };
    setTimeout(tick, 2000);
  }

  /* ---------- Typewriter on scroll: [data-typewriter] ---------- */
  $$('[data-typewriter]').forEach(el => {
    const full = el.textContent.trim();
    el.setAttribute('aria-label', full);
    if (reduce) return;
    let started = false;
    const prep = () => { el.style.minHeight = el.offsetHeight + 'px'; };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {
      prep(); el.textContent = '';
      new IntersectionObserver(([e], o) => {
        if (!e.isIntersecting || started) return;
        started = true; o.disconnect();
        el.classList.add('typing');
        let k = 0;
        const t = setInterval(() => {
          el.textContent = full.slice(0, ++k);
          if (k >= full.length) { clearInterval(t); setTimeout(() => el.classList.remove('typing'), 1500); }
        }, 45);
      }, { threshold: 0.6 }).observe(el);
    });
  });

  /* ---------- Fade in (slow opacity) ---------- */
  const fio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); fio.unobserve(e.target); }
  }), { threshold: 0.2 });
  $$('.fx-fade').forEach(el => fio.observe(el));

  /* ---------- Scroll reveal variants ---------- */
  $$('.sec-title').forEach(el => el.classList.add('from-left'));
  $$('.tcard').forEach((el, k) => el.classList.add(k % 2 ? 'from-right' : 'zoom'));
  $$('.lab-card').forEach((el, k) => el.classList.add(k % 2 ? 'from-right' : 'from-left'));
  $$('.rcard').forEach(el => el.classList.add('zoom'));
  $$('.cert .reveal, .case.reveal').forEach(el => el.classList.add('zoom'));
})();
