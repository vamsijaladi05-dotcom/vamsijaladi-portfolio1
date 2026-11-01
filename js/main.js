(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Stagger the second hero word after the first
  $$('.w2 i').forEach((el, i) => el.style.setProperty('--n', i * 0.1 + 's'));

  $$('.ia-col').forEach((el, i) => el.style.setProperty('--k', i));
  $$('.flow li').forEach((el, i) => el.style.setProperty('--k', i));

  // Scroll progress bar
  const bar = $('.progress');
  const onScroll = () => {
    const h = document.documentElement;
    bar.style.transform = `scaleX(${h.scrollTop / (h.scrollHeight - h.clientHeight || 1)})`;
  };
  addEventListener('scroll', onScroll, { passive: true });

  // Reveal on scroll (staggered inside grids)
  $$('.grid-web .reveal').forEach((el, i) => el.style.setProperty('--d', (i % 3) * 0.12 + 's'));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  }), { threshold: 0.08 });
  $$('.reveal').forEach(el => io.observe(el));

  // Skill pills pop in one by one after a delay
  const pills = $('#pills');
  $$('span', pills).forEach((s, i) => s.style.setProperty('--i', i));
  new IntersectionObserver(([e], o) => {
    if (e.isIntersecting) { setTimeout(() => pills.classList.add('in'), 250); o.disconnect(); }
  }, { threshold: 0.3 }).observe(pills);

  // Custom cursor: follows with easing, grows on hover
  const cur = $('.cursor');
  if (cur && matchMedia('(hover:hover)').matches) {
    let x = 0, y = 0, tx = 0, ty = 0;
    addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; cur.classList.add('on'); });
    (function loop() {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      cur.style.transform = `translate(${x}px,${y}px)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', e => {
      cur.classList.toggle('big', !!e.target.closest('[data-open], .card, figure'));
    });
  }

  // 3D tilt on hover
  if (!reduce) $$('[data-tilt]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(800px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateY(-4px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

  // Poster filters
  $$('.filters button').forEach(b => b.addEventListener('click', () => {
    $$('.filters button').forEach(x => x.classList.toggle('on', x === b));
    const f = b.dataset.f;
    $$('.masonry figure').forEach((fig, i) => {
      const show = f === 'all' || fig.dataset.c === f;
      setTimeout(() => fig.classList.toggle('hide', !show), reduce ? 0 : i * 25);
    });
  }));

  // Lightbox pop-up (click to open, Esc / backdrop / x to close)
  const lb = $('#lb'), lbImg = $('.lb-img img', lb);
  let lastFocus;
  const open = el => {
    lastFocus = document.activeElement;
    lbImg.src = el.dataset.open;
    lbImg.alt = el.dataset.title || '';
    $('.lb-cap h3', lb).textContent = el.dataset.title || '';
    $('.lb-cap p', lb).textContent = el.dataset.desc || '';
    $('.lb-img', lb).scrollTop = 0;
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('.lb-x', lb).focus();
  };
  const close = () => {
    lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocus && lastFocus.focus();
  };
  $$('[data-open]').forEach(el => {
    el.tabIndex = 0;
    el.addEventListener('click', () => open(el));
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(el); } });
  });
  lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lb-x')) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && lb.classList.contains('open')) close(); });


  // Marquee: duplicate content so the loop is seamless
  const tr = $('.track'); if (tr) tr.innerHTML += tr.innerHTML;


  // Type tool demo: types a line, then switches font
  const tyT = $('#tyText'), tyN = $('#tyName');
  if (tyT) {
    const fonts = [['Outfit', "'Outfit',sans-serif", 800, 'normal'], ['Open Sans Italic', "'Open Sans',sans-serif", 700, 'italic'], ['Georgia', 'Georgia,serif', 400, 'normal'], ['Monospace', 'ui-monospace,Menlo,monospace', 600, 'normal']];
    const line = 'Design in motion'; let f = 0, n = 0, dir = 1;
    const tick = () => {
      const [name, fam, w, st] = fonts[f];
      tyT.style.fontFamily = fam; tyT.style.fontWeight = w; tyT.style.fontStyle = st; tyN.textContent = name;
      tyT.firstChild ? (tyT.firstChild.nodeValue = line.slice(0, n)) : tyT.prepend(line.slice(0, n));
      n += dir;
      if (n > line.length) { dir = -1; return setTimeout(tick, reduce ? 3000 : 1400); }
      if (n < 0) { dir = 1; n = 0; f = (f + 1) % fonts.length; }
      setTimeout(tick, reduce ? 3000 : dir > 0 ? 90 : 35);
    };
    tick();
  }

  // Colour theory lab
  const hue = $('#hue'), wheel = $('#wheel'), sw = $('#sw');
  const wrap = document.createElement('div'); wrap.className = 'wheelbox';
  wheel.parentNode.insertBefore(wrap, wheel); wrap.appendChild(wheel);
  let mode = 'comp';
  const offs = { comp: [0, 180], ana: [-30, 0, 30], tri: [0, 120, 240] };
  const hsl = (h, s = 72, l = 58) => {
    h = (h % 360 + 360) % 360; s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))).toString(16).padStart(2, '0');
    return '#' + f(0) + f(8) + f(4);
  };
  const drawColour = () => {
    const base = +hue.value, list = offs[mode];
    wrap.querySelectorAll('.dot').forEach(d => d.remove());
    sw.innerHTML = '';
    const roles = ['60% neutral base', '30% secondary', '10% accent'];
    list.forEach((o, i) => {
      const hh = base + o, a = hh * Math.PI / 180, col = hsl(hh);
      const d = document.createElement('span'); d.className = 'dot';
      d.style.left = 50 + 40 * Math.sin(a) + '%'; d.style.top = 50 - 40 * Math.cos(a) + '%';
      d.style.background = col; d.style.animationDelay = i * 0.3 + 's'; wrap.appendChild(d);
      const row = document.createElement('div');
      row.innerHTML = `<i style="background:${col}"></i><span>${col}${list.length === 3 ? '<br>' + roles[i] : ''}</span>`;
      sw.appendChild(row);
    });
    const neutral = document.createElement('div');
    neutral.innerHTML = `<i style="background:${hsl(base, 12, 14)}"></i><span>Neutral</span>`; sw.appendChild(neutral);
  };
  hue.addEventListener('input', drawColour);
  $$('#harm button').forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.m; $$('#harm button').forEach(x => x.classList.toggle('on', x === b)); drawColour();
  }));
  drawColour();

  // Buttons lab: ripple on press, loading then done
  $$('.b-ripple').forEach(b => b.addEventListener('click', e => {
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), el = document.createElement('span');
    el.className = 'rip'; el.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    b.appendChild(el); setTimeout(() => el.remove(), 700);
  }));
  const ld = $('#ld');
  ld.addEventListener('click', () => {
    if (ld.classList.contains('loading')) return;
    ld.classList.remove('done'); ld.classList.add('loading'); $('.tx', ld).textContent = 'Saving';
    setTimeout(() => { ld.classList.remove('loading'); ld.classList.add('done'); $('.tx', ld).textContent = 'Saved'; }, 1500);
    setTimeout(() => { ld.classList.remove('done'); $('.tx', ld).textContent = 'Save'; }, 3200);
  });

  // Components & variables lab
  const comp = $('#comp');
  $$('#vc button').forEach(b => b.addEventListener('click', () => {
    comp.style.setProperty('--pc', b.style.getPropertyValue('--c'));
    $$('#vc button').forEach(x => x.classList.toggle('on', x === b));
  }));
  $$('#vr button').forEach(b => b.addEventListener('click', () => {
    comp.style.setProperty('--pr', b.dataset.r + 'px');
    $$('#vr button').forEach(x => x.classList.toggle('on', x === b));
  }));

  // Copy email on click
  const copy = $('#copy'), hint = $('#hint');
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(copy.dataset.email); hint.textContent = 'Email copied'; }
    catch { hint.textContent = 'Press Ctrl+C to copy: ' + copy.dataset.email; }
    setTimeout(() => (hint.textContent = 'Click to copy my email'), 2200);
  });
})();
