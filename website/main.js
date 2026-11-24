(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Loader: remove after the hero image is ready (max 1.6s) */
  const hero = document.querySelector('.hero-img');
  let done = false;
  const finish = () => { if (done) return; done = true; root.classList.add('loaded'); revealHero(); };
  if (hero && !hero.complete) hero.addEventListener('load', () => setTimeout(finish, 500), { once: true });
  else setTimeout(finish, 700);
  setTimeout(finish, 1600);
  function revealHero() { document.querySelectorAll('.hero .reveal').forEach(el => el.classList.add('in')); }

  /* Header */
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

  /* Statement: split into words */
  const statement = document.querySelector('[data-words]');
  let words = [];
  if (statement) {
    statement.innerHTML = statement.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
    words = [...statement.querySelectorAll('.w')];
  }

  /* Current nav section */
  const navLinks = [...document.querySelectorAll('.nav a:not(.nav-cta)')];
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href')));

  /* 3D process stack */
  const process = document.querySelector('.process');
  const stack = document.querySelector('.stack');
  const slabs = [...document.querySelectorAll('.slab')];
  const steps = [...document.querySelectorAll('.step')];
  const bar = document.querySelector('.process-bar');
  let active = -1;

  const heroMedia = document.querySelector('.hero-media');
  const bandMedia = document.querySelector('.band-media');
  const band = document.querySelector('.band');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

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
        active = idx;
        steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
        slabs.forEach((s, i) => { s.classList.toggle('on', i === idx && explode > .5); s.classList.toggle('dim', explode > .5 && i !== idx); });
      }
      if (explode <= .5) slabs.forEach(s => s.classList.remove('dim', 'on'));
      else slabs.forEach((s, i) => { s.classList.toggle('on', i === idx); s.classList.toggle('dim', i !== idx); });
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
  window.addEventListener('resize', onScroll);
  onScroll();

  /* Click a step to jump to it */
  steps.forEach((s, i) => {
    s.style.cursor = 'pointer';
    s.addEventListener('click', () => {
      const top = process.offsetTop + (process.offsetHeight - window.innerHeight) * ((i + 0.5) / 4);
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* Hero: subtle pointer parallax */
  if (fine && !reduce) {
    const heroEl = document.querySelector('.hero');
    heroEl.addEventListener('pointermove', e => {
      const x = e.clientX / window.innerWidth - .5, yy = e.clientY / window.innerHeight - .5;
      hero.style.transform = `scale(1.04) translate3d(${x * -18}px, ${yy * -12}px, 0)`;
    });
    heroEl.addEventListener('pointerleave', () => { hero.style.transform = ''; });

    /* 3D tilt on cards */
    document.querySelectorAll('.tilt').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, yy = (e.clientY - r.top) / r.height - .5;
        el.style.setProperty('--ry', `${x * 7}deg`); el.style.setProperty('--rx', `${yy * -7}deg`);
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); });
    });
  }

  /* Gallery: buttons, keys, drag */
  const gallery = document.querySelector('.gallery');
  if (gallery) {
    const slidesEls = [...gallery.querySelectorAll('.slide')];
    const go = dir => {
      const x = gallery.scrollLeft, pad = parseFloat(getComputedStyle(gallery).paddingLeft);
      const offs = slidesEls.map(s => s.offsetLeft - pad);
      let target = dir > 0 ? offs.find(o => o > x + 4) : [...offs].reverse().find(o => o < x - 4);
      if (target === undefined) target = dir > 0 ? offs[offs.length - 1] : 0;
      gallery.scrollTo({ left: target, behavior: reduce ? 'auto' : 'smooth' });
    };
    document.querySelectorAll('.gal-btn').forEach(b => b.addEventListener('click', () => go(+b.dataset.dir)));
    gallery.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } });
    if (fine) {
      let down = false, sx = 0, sl = 0, moved = false;
      gallery.addEventListener('pointerdown', e => { down = true; moved = false; sx = e.clientX; sl = gallery.scrollLeft; });
      window.addEventListener('pointermove', e => {
        if (!down) return;
        const dx = e.clientX - sx;
        if (Math.abs(dx) > 4) { moved = true; gallery.classList.add('dragging'); }
        gallery.scrollLeft = sl - dx;
      });
      window.addEventListener('pointerup', () => {
        if (!down) return; down = false;
        if (moved) { gallery.classList.remove('dragging'); const dir = gallery.scrollLeft > sl ? 1 : -1; gallery.scrollLeft = sl; go(dir); }
      });
    }
  }

  /* Contact form: compose an email to the studio */
  const form = document.querySelector('.contact-form');
  const status = form.querySelector('.form-status');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.name.value.trim(), email = form.email.value.trim();
    form.querySelectorAll('.field').forEach(f => f.classList.remove('err'));
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
      if (!name) form.name.closest('.field').classList.add('err');
      if (!/^\S+@\S+\.\S+$/.test(email)) form.email.closest('.field').classList.add('err');
      status.textContent = 'Please add your name and a valid email address.';
      return;
    }
    const type = form.querySelector('input[name="type"]:checked').value;
    const body = `Name: ${name}\nEmail: ${email}\nProject type: ${type}\n\n${form.message.value.trim()}`;
    window.location.href = `mailto:info@liveeze.com?subject=${encodeURIComponent('Project enquiry — ' + type)}&body=${encodeURIComponent(body)}`;
    status.textContent = 'Your email app should open with the enquiry ready to send. If it does not, write to info@liveeze.com.';
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
