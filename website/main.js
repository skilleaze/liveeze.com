(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* =====================================================
     SOUND: everything synthesised with Web Audio, off by default
     ===================================================== */
  const Sound = (() => {
    let ctx = null, master = null, amb = null, noiseBuf = null, on = false, lastHover = 0;
    const AC = window.AudioContext || window.webkitAudioContext;

    function init() {
      if (ctx || !AC) return !!ctx;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return true;
    }
    function env(g, t, a, peak, rel) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + rel);
    }
    function tone(freq, { type = 'sine', peak = 0.04, a = 0.008, rel = 0.25, to = null, delay = 0 } = {}) {
      const t = ctx.currentTime + delay;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (to) o.frequency.exponentialRampToValueAtTime(to, t + a + rel);
      env(g, t, a, peak, rel);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + a + rel + 0.05);
    }
    function noise({ peak = 0.04, a = 0.02, rel = 0.3, type = 'bandpass', f1 = 600, f2 = 1800, q = 0.8 } = {}) {
      const t = ctx.currentTime;
      const s = ctx.createBufferSource(); s.buffer = noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
      f.frequency.setValueAtTime(f1, t); f.frequency.exponentialRampToValueAtTime(f2, t + a + rel);
      const g = ctx.createGain(); env(g, t, a, peak, rel);
      s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + a + rel + 0.05);
    }
    function startAmbient() {
      if (amb) return;
      const t = ctx.currentTime;
      const out = ctx.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.05, t + 3);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 0.4;
      const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = 0.06; lfoG.gain.value = 260;
      lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
      const notes = [110, 164.81, 220, 277.18, 329.63];
      const oscs = notes.map((f, i) => {
        const o = ctx.createOscillator(); o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = (i - 2) * 4;
        const g = ctx.createGain(); g.gain.value = i === 0 ? 0.5 : 0.22;
        o.connect(g); g.connect(lp); o.start(); return o;
      });
      const air = ctx.createBufferSource(); air.buffer = noiseBuf; air.loop = true;
      const airF = ctx.createBiquadFilter(); airF.type = 'lowpass'; airF.frequency.value = 400;
      const airG = ctx.createGain(); airG.gain.value = 0.08;
      air.connect(airF); airF.connect(airG); airG.connect(lp); air.start();
      lp.connect(out); out.connect(master);
      amb = { out, stop: () => { const n = ctx.currentTime; out.gain.cancelScheduledValues(n); out.gain.setValueAtTime(out.gain.value, n); out.gain.exponentialRampToValueAtTime(0.0001, n + 0.8); setTimeout(() => { oscs.forEach(o => o.stop()); lfo.stop(); air.stop(); }, 900); } };
    }
    const api = {
      get on() { return on; },
      enable() {
        if (!init()) return false;
        ctx.resume(); on = true; startAmbient();
        [659.25, 880, 1318.5].forEach((f, i) => tone(f, { peak: 0.035, rel: 1.4, delay: i * 0.11 }));
        return true;
      },
      disable() { on = false; if (amb) { amb.stop(); amb = null; } },
      hover() { if (!on) return; const n = performance.now(); if (n - lastHover < 70) return; lastHover = n; tone(1760, { peak: 0.018, rel: 0.09, to: 1320 }); },
      click() { if (!on) return; tone(392, { type: 'triangle', peak: 0.06, rel: 0.22, to: 196 }); noise({ peak: 0.02, a: 0.003, rel: 0.05, type: 'highpass', f1: 3000, f2: 2500 }); },
      whoosh() { if (!on) return; noise({ peak: 0.05, a: 0.18, rel: 0.6, f1: 300, f2: 2200, q: 0.9 }); },
      chime(i = 0) { if (!on) return; const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5]; tone(scale[i % scale.length], { peak: 0.03, rel: 1.1 }); tone(scale[i % scale.length] * 2, { peak: 0.008, rel: 0.8 }); }
    };
    return api;
  })();

  const soundBtns = document.querySelectorAll('.sound-btn, .sound-invite');
  function setSound(want) {
    if (want) { if (!Sound.enable()) return; } else Sound.disable();
    root.classList.toggle('sound-on', Sound.on);
    document.querySelector('.sound-btn').setAttribute('aria-pressed', Sound.on);
    document.querySelector('.sound-btn').setAttribute('aria-label', Sound.on ? 'Turn sound off' : 'Turn sound on');
    store.set('liveeze-sound', Sound.on ? '1' : '0');
  }
  soundBtns.forEach(b => b.addEventListener('click', e => { e.stopPropagation(); setSound(!Sound.on); }));
  if (store.get('liveeze-sound') === '1') {
    const wake = () => { if (!Sound.on) setSound(true); window.removeEventListener('pointerdown', wake); window.removeEventListener('keydown', wake); };
    window.addEventListener('pointerdown', wake); window.addEventListener('keydown', wake);
  }
  const interactive = 'a, button, .chips label, .step, input, textarea';
  document.addEventListener('pointerover', e => { if (e.pointerType === 'mouse' && e.target.closest(interactive) && !e.target.closest(interactive).contains(e.relatedTarget)) Sound.hover(); });
  document.addEventListener('click', e => { if (e.target.closest(interactive) && !e.target.closest('.sound-btn, .sound-invite')) Sound.click(); });

  /* =====================================================
     LOADER + HERO
     ===================================================== */
  const hero = document.querySelector('.hero-img');
  let done = false;
  const finish = () => { if (done) return; done = true; root.classList.add('loaded'); document.querySelectorAll('.hero .reveal').forEach(el => el.classList.add('in')); };
  if (hero && !hero.complete) hero.addEventListener('load', () => setTimeout(finish, 500), { once: true });
  else setTimeout(finish, 700);
  setTimeout(finish, 1600);

  /* Header + menu */
  const header = document.querySelector('.site-header');
  const menuBtn = document.querySelector('.menu-btn');
  menuBtn.addEventListener('click', () => {
    const open = header.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => {
    header.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); document.body.style.overflow = '';
  }));

  /* Reveal on scroll */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => { if (!el.closest('.hero')) io.observe(el); });

  /* Statement words */
  const statement = document.querySelector('[data-words]');
  let words = [];
  if (statement) {
    statement.innerHTML = statement.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
    words = [...statement.querySelectorAll('.w')];
  }

  /* =====================================================
     HERO DUST (canvas)
     ===================================================== */
  const canvas = document.querySelector('.dust');
  const heroEl = document.querySelector('.hero');
  let mouseX = 0, mouseY = 0, heroVisible = true;
  if (canvas && !reduce) {
    const c = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, parts = [];
    const count = () => (window.innerWidth < 700 ? 46 : 90);
    const make = () => ({ x: Math.random(), y: Math.random(), z: 0.25 + Math.random() * 0.75, s: Math.random() * Math.PI * 2, v: 0.00012 + Math.random() * 0.00028 });
    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
      parts = Array.from({ length: count() }, make);
    }
    size(); window.addEventListener('resize', size);
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(heroEl);
    let t0 = performance.now();
    (function frame(t) {
      requestAnimationFrame(frame);
      if (!heroVisible) return;
      const dt = Math.min(50, t - t0); t0 = t;
      c.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.y -= p.v * dt * p.z; p.s += dt * 0.0006;
        if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
        const sway = Math.sin(p.s) * 0.012;
        const x = (p.x + sway) * W + mouseX * 40 * p.z, y = p.y * H + mouseY * 24 * p.z;
        const beam = Math.max(0, 1 - Math.abs((p.x + p.y * 0.55) - 0.95) * 2.2);
        const a = (0.12 + beam * 0.55) * p.z;
        const r = 0.6 + p.z * 1.9;
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2);
        c.fillStyle = `rgba(232, 219, 203, ${a.toFixed(3)})`; c.fill();
        if (p.z > 0.85 && beam > 0.4) { c.beginPath(); c.arc(x, y, r * 3.2, 0, Math.PI * 2); c.fillStyle = `rgba(251, 249, 244, ${(a * 0.12).toFixed(3)})`; c.fill(); }
      }
    })(t0);
  }

  /* Hero pointer depth: image, dust and text move on separate planes */
  const heroInner = document.querySelector('.hero-inner');
  if (!reduce) {
    if (fine) {
      heroEl.addEventListener('pointermove', e => {
        mouseX = e.clientX / window.innerWidth - .5; mouseY = e.clientY / window.innerHeight - .5;
        hero.style.transform = `scale(1.06) translate3d(${mouseX * -22}px, ${mouseY * -14}px, 0)`;
        heroInner.style.transform = `translate3d(${mouseX * 10}px, ${mouseY * 6}px, 0)`;
      });
      heroEl.addEventListener('pointerleave', () => { hero.style.transform = ''; heroInner.style.transform = ''; mouseX = mouseY = 0; });
    } else {
      let a = 0; (function drift() { a += 0.004; mouseX = Math.sin(a) * 0.3; mouseY = Math.cos(a * 0.7) * 0.2; requestAnimationFrame(drift); })();
    }
  }

  /* =====================================================
     CUSTOM CURSOR
     ===================================================== */
  if (fine && !reduce) {
    root.classList.add('has-cursor');
    const cur = document.querySelector('.cursor'), dot = cur.querySelector('.cursor-dot'), ring = cur.querySelector('.cursor-ring');
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    window.addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; cur.classList.remove('hidden'); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.add('hidden'));
    document.addEventListener('pointerover', e => cur.classList.toggle('hover', !!e.target.closest('a, button, .chips label, .step, .tilt')));
    window.addEventListener('pointerdown', () => cur.classList.add('down'));
    window.addEventListener('pointerup', () => cur.classList.remove('down'));
    (function loop() {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    })();
  }

  /* =====================================================
     SCROLL-DRIVEN SCENES
     ===================================================== */
  const navLinks = [...document.querySelectorAll('.nav a:not(.nav-cta)')];
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href')));

  const process = document.querySelector('.process');
  const stack = document.querySelector('.stack');
  const slabs = [...document.querySelectorAll('.slab')];
  const steps = [...document.querySelectorAll('.step')];
  const bar = document.querySelector('.process-bar');
  let active = -1;

  const heroMedia = document.querySelector('.hero-media');
  const bandMedia = document.querySelector('.band-media');
  const band = document.querySelector('.band');

  /* 3D walk-through */
  const walk = document.querySelector('.walk');
  const world = document.querySelector('.walk-world');
  const rooms = [...document.querySelectorAll('.room')];
  const walkCount = document.querySelector('.walk-count b');
  const walkBar = document.querySelector('.walk-bar');
  let gap = 1100, walkIdx = -1;
  function layoutRooms() {
    const w = window.innerWidth;
    gap = w < 700 ? 900 : 1100;
    const spread = w < 700 ? w * 0.17 : Math.min(w * 0.25, 380);
    rooms.forEach((r, i) => {
      const side = +r.dataset.x;
      r.style.setProperty('--x', `${side * spread}px`);
      r.style.setProperty('--z', `${-(i + 1) * gap}px`);
      r.style.setProperty('--ry', `${side * -14}deg`);
    });
  }
  layoutRooms();

  function onScroll() {
    const y = window.scrollY, vh = window.innerHeight;
    header.classList.toggle('scrolled', y > 40);

    if (!reduce && y < vh) heroMedia.style.transform = `translate3d(0, ${y * 0.25}px, 0)`;

    if (words.length) {
      const r = statement.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
      const n = reduce ? words.length : Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    }

    if (process) {
      const r = process.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - vh), 0, 1);
      const explode = clamp(p * 1.6, 0, 1);
      stack.style.setProperty('--p', explode.toFixed(3));
      stack.classList.toggle('exploded', explode > .5);
      bar.style.setProperty('--p', p.toFixed(3));
      const idx = Math.min(3, Math.floor(p * 4));
      if (idx !== active) {
        if (active !== -1 && r.top < 0 && r.bottom > vh) { Sound.chime(idx); }
        active = idx;
        steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
      }
      slabs.forEach((s, i) => { const ex = explode > .5; s.classList.toggle('on', ex && i === idx); s.classList.toggle('dim', ex && i !== idx); });
    }

    if (walk) {
      const r = walk.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        const p = clamp(-r.top / (r.height - vh), 0, 1);
        const total = gap * (rooms.length + 0.15);
        const cam = p * total;
        world.style.transform = `translate3d(0, 0, ${cam}px)`;
        walk.classList.toggle('moving', p > 0.04);
        walkBar.style.setProperty('--p', p.toFixed(3));
        let nearest = 0, best = Infinity;
        rooms.forEach((room, i) => {
          const rel = cam - (i + 1) * gap;
          let o = 1;
          if (rel > 120) o = clamp(1 - (rel - 120) / 260, 0, 1);
          else if (rel < -3200) o = clamp((rel + 4200) / 1000, 0, 1);
          room.style.opacity = o.toFixed(3);
          room.style.visibility = o < 0.01 ? 'hidden' : 'visible';
          const dist = Math.abs(rel + 350);
          if (dist < best && i < 5) { best = dist; nearest = i; }
        });
        if (nearest !== walkIdx) {
          if (walkIdx !== -1) Sound.whoosh();
          walkIdx = nearest; walkCount.textContent = String(nearest + 1).padStart(2, '0');
        }
      }
    }

    if (!reduce && band) {
      const r = band.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) bandMedia.style.transform = `translate3d(0, ${(r.top + r.height / 2 - vh / 2) * -0.15}px, 0)`;
    }

    let cur = -1;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * 0.4) cur = i; });
    navLinks.forEach((a, i) => a.classList.toggle('is-current', i === cur));
  }
  let ticking = false;
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } }, { passive: true });
  window.addEventListener('resize', () => { layoutRooms(); onScroll(); });
  onScroll();

  /* Click a step to jump to it */
  steps.forEach((s, i) => s.addEventListener('click', () => {
    const top = process.offsetTop + (process.offsetHeight - window.innerHeight) * ((i + 0.5) / 4) / 1;
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* 3D tilt on cards */
  if (fine && !reduce) {
    document.querySelectorAll('.tilt').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, yy = (e.clientY - r.top) / r.height - .5;
        el.style.setProperty('--ry', `${x * 8}deg`); el.style.setProperty('--rx', `${yy * -8}deg`);
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); });
    });
  }

  /* Contact form: compose an email to the studio */
  const form = document.querySelector('.contact-form');
  const status = form.querySelector('.form-status');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.name.value.trim(), email = form.email.value.trim();
    const okEmail = /^\S+@\S+\.\S+$/.test(email);
    form.querySelectorAll('.field').forEach(f => f.classList.remove('err'));
    if (!name || !okEmail) {
      if (!name) form.name.closest('.field').classList.add('err');
      if (!okEmail) form.email.closest('.field').classList.add('err');
      status.textContent = 'Please add your name and a valid email address.';
      return;
    }
    const type = form.querySelector('input[name="type"]:checked').value;
    const body = `Name: ${name}\nEmail: ${email}\nProject type: ${type}\n\n${form.message.value.trim()}`;
    Sound.chime(4);
    window.location.href = `mailto:info@liveeze.com?subject=${encodeURIComponent('Project enquiry: ' + type)}&body=${encodeURIComponent(body)}`;
    status.textContent = 'Your email app should open with the enquiry ready to send. If it does not, write to info@liveeze.com.';
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
