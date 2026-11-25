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
     SOUND
     Browsers only allow audio after the visitor's first touch,
     click or key press. Sound switches on at that moment (unless
     the visitor muted it before) and stays on as they browse.
     ===================================================== */
  const Sound = (() => {
    const AC = window.AudioContext || window.webkitAudioContext;
    let ctx = null, master = null, noiseBuf = null, amb = null, air = null, on = false, lastHover = 0, lastTap = 0;

    function silentWavUrl() {
      const n = 800, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
      const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
      w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
      v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
      w(36, 'data'); v.setUint32(40, n * 2, true);
      return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
    }
    function init() {
      if (ctx) return true;
      if (!AC) return false;
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return true;
    }
    function unlockMedia() {
      // iPhone: playing a media element moves audio to the "playback" channel,
      // so Web Audio is heard even when the ring/silent switch is on.
      try { const a = new Audio(silentWavUrl()); a.setAttribute('playsinline', ''); a.volume = 0.01; const p = a.play(); if (p) p.catch(() => {}); } catch (e) {}
    }
    function env(g, t, a, peak, rel) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + rel);
    }
    function tone(freq, { type = 'sine', peak = 0.04, a = 0.008, rel = 0.25, to = null, delay = 0 } = {}) {
      const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (to) o.frequency.exponentialRampToValueAtTime(to, t + a + rel);
      env(g, t, a, peak, rel); o.connect(g); g.connect(master); o.start(t); o.stop(t + a + rel + 0.05);
    }
    function noise({ peak = 0.04, a = 0.02, rel = 0.3, type = 'bandpass', f1 = 600, f2 = 1800, q = 0.8 } = {}) {
      const t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
      f.frequency.setValueAtTime(f1, t); f.frequency.exponentialRampToValueAtTime(f2, t + a + rel);
      const g = ctx.createGain(); env(g, t, a, peak, rel);
      s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + a + rel + 0.05);
    }
    function startBeds() {
      if (amb) return;
      const t = ctx.currentTime;
      // warm ambient chord
      const out = ctx.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.045, t + 2.5);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 760; lp.Q.value = 0.4;
      const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = 0.07; lfoG.gain.value = 240;
      lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
      const oscs = [110, 164.81, 220, 277.18, 329.63].map((f, i) => {
        const o = ctx.createOscillator(); o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = (i - 2) * 4;
        const g = ctx.createGain(); g.gain.value = i === 0 ? 0.5 : 0.22; o.connect(g); g.connect(lp); o.start(); return o;
      });
      lp.connect(out); out.connect(master);
      // soft "air" that rises with scrolling
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.7;
      const ag = ctx.createGain(); ag.gain.value = 0;
      src.connect(bp); bp.connect(ag); ag.connect(master); src.start();
      air = { gain: ag.gain, filter: bp.frequency };
      amb = { stop() {
        const n = ctx.currentTime; out.gain.cancelScheduledValues(n); out.gain.setValueAtTime(out.gain.value, n); out.gain.exponentialRampToValueAtTime(0.0001, n + 0.6);
        ag.gain.setTargetAtTime(0, n, 0.05);
        setTimeout(() => { oscs.forEach(o => o.stop()); lfo.stop(); src.stop(); }, 700);
      } };
    }
    return {
      get on() { return on; },
      enable(first) {
        if (!init()) return false;
        unlockMedia();
        if (ctx.state !== 'running') ctx.resume();
        on = true; startBeds();
        [659.25, 880, 1318.5].forEach((f, i) => tone(f, { peak: first ? 0.03 : 0.035, rel: 1.3, delay: i * 0.1 }));
        return true;
      },
      disable() { on = false; if (amb) { amb.stop(); amb = null; air = null; } },
      resume() { if (ctx && ctx.state !== 'running') ctx.resume(); },
      hover() { if (!on) return; const n = performance.now(); if (n - lastHover < 70) return; lastHover = n; tone(1760, { peak: 0.016, rel: 0.09, to: 1320 }); },
      click() { if (!on) return; lastTap = performance.now(); tone(392, { type: 'triangle', peak: 0.06, rel: 0.22, to: 196 }); noise({ peak: 0.018, a: 0.003, rel: 0.05, type: 'highpass', f1: 3000, f2: 2500 }); },
      tap() { if (!on) return; const n = performance.now(); if (n - lastTap < 80) return; lastTap = n; tone(880, { peak: 0.022, rel: 0.16, to: 660 }); },
      whoosh() { if (!on) return; noise({ peak: 0.05, a: 0.15, rel: 0.55, f1: 300, f2: 2200, q: 0.9 }); },
      chime(i = 0) { if (!on) return; const s = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66]; const f = s[i % s.length]; tone(f, { peak: 0.026, rel: 1.1 }); tone(f * 2, { peak: 0.007, rel: 0.8 }); },
      scroll(speed) { if (!on || !air) return; const t = ctx.currentTime; air.gain.setTargetAtTime(Math.min(0.03, speed * 0.00003), t, 0.08); air.filter.setTargetAtTime(700 + Math.min(1600, speed * 2), t, 0.1); },
      scrollStop() { if (!on || !air) return; air.gain.setTargetAtTime(0, ctx.currentTime, 0.25); }
    };
  })();

  const soundBtn = document.querySelector('.sound-btn');
  function syncSoundUI() {
    root.classList.toggle('sound-on', Sound.on);
    root.classList.toggle('sound-muted', store.get('liveeze-sound') === '0');
    if (soundBtn) { soundBtn.setAttribute('aria-pressed', Sound.on); soundBtn.setAttribute('aria-label', Sound.on ? 'Mute sound' : 'Turn sound on'); }
  }
  if (soundBtn) soundBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (Sound.on) { Sound.disable(); store.set('liveeze-sound', '0'); }
    else { store.set('liveeze-sound', '1'); Sound.enable(); }
    syncSoundUI();
  });
  syncSoundUI();
  // First gesture anywhere turns sound on (unless muted). touchend + click cover iOS.
  const gestureEvents = ['pointerdown', 'touchend', 'click', 'keydown'];
  const cleanup = () => gestureEvents.forEach(ev => window.removeEventListener(ev, firstGesture, true));
  function firstGesture(e) {
    if (e.target && e.target.closest && e.target.closest('.sound-btn')) return;
    if (store.get('liveeze-sound') === '0') { cleanup(); return; }
    if (!Sound.on && Sound.enable(true)) { syncSoundUI(); cleanup(); }
  }
  gestureEvents.forEach(ev => window.addEventListener(ev, firstGesture, true));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Sound.on) Sound.resume(); });

  // Sounds for every touch or click, with a fuller tone on links and buttons
  const interactive = 'a, button, summary, .chips label, input, textarea';
  document.addEventListener('pointerdown', e => {
    if (e.target.closest('.sound-btn')) return;
    if (e.target.closest(interactive)) Sound.click(); else Sound.tap();
  }, true);
  if (fine) document.addEventListener('pointerover', e => {
    const el = e.target.closest(interactive);
    if (el && !el.contains(e.relatedTarget)) Sound.hover();
  });

  /* =====================================================
     LOADER + HEADER + MENU
     ===================================================== */
  const hero = document.querySelector('.hero-img');
  let done = false;
  const finish = () => { if (done) return; done = true; root.classList.add('loaded'); document.querySelectorAll('.hero .reveal').forEach(el => el.classList.add('in')); };
  if (hero && !hero.complete) hero.addEventListener('load', () => setTimeout(finish, 350), { once: true });
  else setTimeout(finish, 500);
  setTimeout(finish, 1400);

  const header = document.querySelector('.site-header');
  const menuBtn = document.querySelector('.menu-btn');
  const setMenu = open => {
    header.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuBtn.addEventListener('click', () => setMenu(!header.classList.contains('open')));
  document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && header.classList.contains('open')) setMenu(false); });

  /* Reveal on scroll */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.reveal').forEach(el => { if (!el.closest('.hero')) io.observe(el); });

  /* A gentle chime as each new section comes into view (no click needed) */
  let lastChime = 0;
  const secs = [...document.querySelectorAll('[data-sound]')];
  const seen = new Set();
  const sio = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting || seen.has(e.target)) return;
    seen.add(e.target);
    const n = performance.now(); if (n - lastChime < 500) return; lastChime = n;
    Sound.chime(secs.indexOf(e.target));
  }), { threshold: .3 });
  secs.forEach(s => sio.observe(s));

  /* Statement words */
  const statement = document.querySelector('[data-words]');
  let words = [];
  if (statement) {
    statement.innerHTML = statement.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
    words = [...statement.querySelectorAll('.w')];
  }

  /* =====================================================
     HERO DUST (light canvas, paused when off-screen)
     ===================================================== */
  const canvas = document.querySelector('.dust');
  const heroEl = document.querySelector('.hero');
  if (canvas && heroEl && !reduce) {
    const c = canvas.getContext('2d');
    let W = 0, H = 0, parts = [], visible = true, raf = 0, last = 0, mx = 0, my = 0;
    const make = () => ({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.7, s: Math.random() * 6.28, v: 0.00012 + Math.random() * 0.00025 });
    function size() {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = '#E8DBCB';
      parts = Array.from({ length: W < 700 ? 24 : 48 }, make);
    }
    function frame(t) {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min(50, t - (last || t)); last = t;
      c.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.y -= p.v * dt * p.z; p.s += dt * 0.0006;
        if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
        const x = (p.x + Math.sin(p.s) * 0.012) * W + mx * 30 * p.z, y = p.y * H + my * 18 * p.z;
        const beam = Math.max(0, 1 - Math.abs((p.x + p.y * 0.55) - 0.95) * 2.2);
        c.globalAlpha = (0.14 + beam * 0.55) * p.z;
        c.fillRect(x, y, 1 + p.z * 2, 1 + p.z * 2);
      }
      raf = requestAnimationFrame(frame);
    }
    size(); window.addEventListener('resize', size);
    const kick = () => { if (visible && !document.hidden && !raf) { last = 0; raf = requestAnimationFrame(frame); } };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(heroEl);
    document.addEventListener('visibilitychange', kick);
    if (fine) heroEl.addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  }

  /* =====================================================
     SCROLL (one rAF per frame, transforms only)
     ===================================================== */
  const navLinks = [...document.querySelectorAll('.nav a:not(.nav-cta)')].filter(a => a.getAttribute('href').startsWith('#'));
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href')));
  const heroMedia = document.querySelector('.hero-media');
  const band = document.querySelector('.band'), bandMedia = document.querySelector('.band-media');
  const contact = document.querySelector('#contact');
  const pfMedia = document.querySelector('.pf-hero-media');
  let lastY = window.scrollY, lastT = performance.now(), stopTimer = 0;

  function onScroll() {
    const y = window.scrollY, vh = window.innerHeight;
    header.classList.toggle('scrolled', y > 40);
    root.classList.toggle('show-float', y > vh * 0.9);
    root.style.setProperty('--hdr', header.offsetHeight + 'px');

    if (!reduce) {
      if (heroMedia && y < vh) heroMedia.style.transform = `translate3d(0, ${y * 0.22}px, 0)`;
      if (pfMedia && y < vh) pfMedia.style.transform = `translate3d(0, ${y * 0.25}px, 0)`;
      if (band) {
        const r = band.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh) bandMedia.style.transform = `translate3d(0, ${(r.top + r.height / 2 - vh / 2) * -0.12}px, 0)`;
      }
    }
    if (words.length) {
      const r = statement.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
        const n = reduce ? words.length : Math.round(p * words.length);
        words.forEach((w, i) => w.classList.toggle('on', i < n));
      }
    }
    if (contact) { const r = contact.getBoundingClientRect(); root.classList.toggle('at-contact', r.top < vh * 0.8 && r.bottom > 0); }
    let cur = -1;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * 0.4) cur = i; });
    navLinks.forEach((a, i) => a.classList.toggle('is-current', i === cur));

    const now = performance.now(), speed = Math.abs(y - lastY) / Math.max(16, now - lastT) * 1000;
    lastY = y; lastT = now;
    Sound.scroll(speed);
    clearTimeout(stopTimer); stopTimer = setTimeout(() => Sound.scrollStop(), 140);
  }
  let ticking = false;
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  const toTop = document.querySelector('.to-top');
  if (toTop) toTop.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); Sound.whoosh(); });

  /* FAQ: opening one closes the others */
  const faqs = [...document.querySelectorAll('.faq details')];
  faqs.forEach(d => d.addEventListener('toggle', () => { if (d.open) faqs.forEach(o => { if (o !== d) o.open = false; }); }));

  /* =====================================================
     CONTACT FORM: composes an email to the studio
     ===================================================== */
  const form = document.querySelector('.contact-form');
  if (form) {
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
        (name ? form.email : form.name).focus();
        return;
      }
      const type = form.querySelector('input[name="type"]:checked').value;
      const lines = [`Name: ${name}`, `Email: ${email}`];
      if (form.phone.value.trim()) lines.push(`Phone: ${form.phone.value.trim()}`);
      if (form.location.value.trim()) lines.push(`Project location: ${form.location.value.trim()}`);
      lines.push(`Project type: ${type}`, '', form.message.value.trim());
      Sound.chime(4);
      window.location.href = `mailto:info@liveeze.com?subject=${encodeURIComponent('Project enquiry: ' + type)}&body=${encodeURIComponent(lines.join('\n'))}`;
      status.textContent = 'Your email app should open with the enquiry ready to send. If it does not, write to info@liveeze.com.';
    });
  }

  /* =====================================================
     PORTFOLIO: filters + full-screen viewer
     ===================================================== */
  const chips = [...document.querySelectorAll('.pf-chip')];
  const sets = [...document.querySelectorAll('.pf-set')];
  function applyFilter(cat, scroll) {
    chips.forEach(c => { const on = c.dataset.filter === cat; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', on); });
    sets.forEach(s => { s.hidden = !(cat === 'all' || s.dataset.cat === cat); });
    const chip = chips.find(c => c.dataset.filter === cat);
    if (chip) chip.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
    if (scroll) {
      const bar = document.querySelector('.pf-filter'), first = sets.find(s => !s.hidden);
      const top = first.getBoundingClientRect().top + scrollY - bar.offsetHeight - header.offsetHeight + parseFloat(getComputedStyle(first).paddingTop) - 28;
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  if (chips.length) {
    chips.forEach(c => c.addEventListener('click', () => {
      const cat = c.dataset.filter;
      history.replaceState(null, '', cat === 'all' ? location.pathname : '#' + cat);
      applyFilter(cat, true);
    }));
    const initial = location.hash.slice(1);
    if (initial && sets.some(s => s.dataset.cat === initial)) applyFilter(initial, false);
    window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (sets.some(s => s.dataset.cat === h)) applyFilter(h, true); });
  }

  const lb = document.querySelector('.lightbox');
  if (lb) {
    const img = lb.querySelector('.lb-img'), cap = lb.querySelector('.lb-cap'), count = lb.querySelector('.lb-count');
    let list = [], pos = 0, lastFocus = null;
    const visibleItems = () => [...document.querySelectorAll('.pf-open')].filter(b => !b.closest('.pf-set').hidden);
    function show(i) {
      pos = (i + list.length) % list.length;
      const b = list[pos];
      lb.classList.add('loading');
      img.onload = () => lb.classList.remove('loading');
      img.src = b.dataset.full; img.alt = b.querySelector('img').alt;
      cap.textContent = b.dataset.caption;
      count.textContent = `${String(pos + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
      const next = list[(pos + 1) % list.length]; if (next) { const pre = new Image(); pre.src = next.dataset.full; }
    }
    function open(btn) {
      list = visibleItems(); lastFocus = btn;
      lb.hidden = false; document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => lb.classList.add('open'));
      show(list.indexOf(btn)); Sound.whoosh();
      lb.querySelector('.lb-close').focus({ preventScroll: true });
    }
    function close() {
      lb.classList.remove('open'); document.body.style.overflow = '';
      setTimeout(() => { lb.hidden = true; img.removeAttribute('src'); }, 350);
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }
    document.addEventListener('click', e => { const b = e.target.closest('.pf-open'); if (b) open(b); });
    lb.querySelector('.lb-prev').addEventListener('click', () => show(pos - 1));
    lb.querySelector('.lb-next').addEventListener('click', () => show(pos + 1));
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-stage')) close(); });
    document.addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') { show(pos + 1); Sound.hover(); }
      if (e.key === 'ArrowLeft') { show(pos - 1); Sound.hover(); }
      if (e.key === 'Tab') {
        const f = [...lb.querySelectorAll('button')]; const i = f.indexOf(document.activeElement);
        e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    let sx = null;
    lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) { show(pos + (dx < 0 ? 1 : -1)); Sound.whoosh(); } sx = null; });
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
