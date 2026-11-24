/* =========================================================
   Animations de défilement — GSAP + ScrollTrigger + Lenis
   ========================================================= */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = window.gsap && window.ScrollTrigger;

  /* ---------- ancres (fonctionne avec ou sans Lenis) ---------- */
  let lenis = null;
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? document.body : document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  if (!hasGsap || reduce) return; // le site reste entièrement lisible sans animation

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- défilement doux ---------- */
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- HERO : les papiers se posent sur la table ---------- */
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro
    .from('.folder', { y: 120, opacity: 0, duration: 0.9 })
    .from('.hero .card', {
      y: 160, opacity: 0, duration: 1.1, stagger: 0.14,
      rotation: () => gsap.utils.random(-22, 22),
    })
    .from('.hero__role', {
      scale: 0, opacity: 0, duration: 0.6, stagger: 0.05, ease: 'back.out(2.5)',
    }, '-=0.7')
    .from('.hero__name .line', { yPercent: 60, opacity: 0, duration: 0.9, stagger: 0.12 }, '<')
    .from('.hero .clip', { y: -50, opacity: 0, duration: 0.5, stagger: 0.1 }, '-=0.5')
    .from('.stamp', { scale: 0, rotation: -120, duration: 0.8, ease: 'back.out(1.8)' }, '-=0.4')
    .from('.nav > *', { y: -30, opacity: 0, duration: 0.6, stagger: 0.1 }, '<');

  // parallaxe : chaque couche s'envole à sa vitesse
  gsap.utils.toArray('.hero .layer').forEach((layer) => {
    const speed = parseFloat(layer.dataset.speed || 0.2);
    gsap.to(layer, {
      y: () => -window.innerHeight * speed,
      rotation: gsap.utils.random(-6, 6),
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
    });
  });
  gsap.to('.scroll-hint', {
    opacity: 0, scrollTrigger: { trigger: '.hero', start: 'top top', end: '20% top', scrub: true },
  });

  // les fractions suivent la souris
  const fracs = gsap.utils.toArray('.frac');
  if (window.matchMedia('(pointer: fine)').matches) {
    const movers = fracs.map((el, i) => ({
      x: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3' }),
      y: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3' }),
      depth: 10 + (i % 4) * 9,
    }));
    window.addEventListener('mousemove', (e) => {
      const dx = e.clientX / window.innerWidth - 0.5;
      const dy = e.clientY / window.innerHeight - 0.5;
      movers.forEach((m) => { m.x(dx * m.depth); m.y(dy * m.depth); });
    });
  }

  /* ---------- MANIFESTE : les mots s'allument au défilement ---------- */
  document.querySelectorAll('.reveal-words').forEach((block) => {
    const frag = document.createDocumentFragment();
    block.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span');
          s.className = 'w'; s.textContent = part; frag.appendChild(s);
        });
      } else {
        const s = document.createElement('span');
        s.className = 'w'; s.appendChild(node.cloneNode(true)); frag.appendChild(s);
      }
    });
    block.replaceChildren(frag);
    gsap.fromTo(block.querySelectorAll('.w'),
      { opacity: 0.12, y: 8 },
      { opacity: 1, y: 0, stagger: 0.08, ease: 'none',
        scrollTrigger: { trigger: block, start: 'top 80%', end: 'bottom 50%', scrub: true } });
  });

  /* ---------- PROJETS : planches collage ---------- */
  const mm = gsap.matchMedia();
  const track = document.querySelector('.projects__track');
  const planches = gsap.utils.toArray('.planche--grid');

  mm.add('(min-width: 900px)', () => {
    const distance = () => track.scrollWidth - window.innerWidth;
    const scroller = gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        trigger: '.projects', pin: true, start: 'top top', end: () => '+=' + distance(), scrub: 1, invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set('.progress span', { scaleX: self.progress }),
      },
    });
    planches.forEach((pl) => {
      const st = { trigger: pl, containerAnimation: scroller, start: 'left right', end: 'right left', scrub: true };
      pl.querySelectorAll('.cut').forEach((cut) => {
        const d = parseFloat(cut.dataset.depth || 1);
        gsap.fromTo(cut, { xPercent: 40 * d, rotation: '+=' + (8 * d) }, { xPercent: -25 * d, rotation: '-=' + (10 * d), ease: 'none', scrollTrigger: st });
      });
      gsap.fromTo(pl.querySelectorAll('.shard'), { scale: 0.4, rotation: -20 }, { scale: 1.15, rotation: 15, ease: 'none', scrollTrigger: st });
      gsap.from(pl.querySelectorAll('.planche__text > *'), {
        y: 40, opacity: 0, stagger: 0.06, ease: 'power2.out',
        scrollTrigger: { trigger: pl, containerAnimation: scroller, start: 'left 70%', end: 'left 20%', scrub: true },
      });
    });
  });

  mm.add('(max-width: 899px)', () => {
    planches.forEach((pl) => {
      gsap.from(pl.querySelectorAll('.cut'), {
        y: 80, opacity: 0, rotation: () => gsap.utils.random(-15, 15), duration: 0.9, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: pl, start: 'top 80%' },
      });
      gsap.from(pl.querySelectorAll('.planche__text > *'), {
        y: 30, opacity: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out',
        scrollTrigger: { trigger: pl.querySelector('.planche__text'), start: 'top 85%' },
      });
    });
  });

  /* ---------- PARCOURS ---------- */
  gsap.from('.panel--exp', {
    xPercent: -15, rotation: -6, opacity: 0, ease: 'power2.out',
    scrollTrigger: { trigger: '.parcours', start: 'top 85%', end: 'top 35%', scrub: 1 },
  });
  gsap.from('.panel--school', {
    xPercent: 20, y: 80, rotation: 8, opacity: 0, ease: 'power2.out',
    scrollTrigger: { trigger: '.parcours', start: 'top 75%', end: 'top 25%', scrub: 1 },
  });
  gsap.utils.toArray('.exp, .school').forEach((el) => {
    gsap.from(el, {
      x: -30, opacity: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });
  gsap.to('.stars span', {
    rotation: 360, ease: 'none',
    scrollTrigger: { trigger: '.parcours', start: 'top bottom', end: 'bottom top', scrub: true },
  });
  gsap.from('.seal', {
    scale: 0, rotation: -200, duration: 0.9, ease: 'back.out(1.8)',
    scrollTrigger: { trigger: '.seal', start: 'top 90%' },
  });

  /* ---------- COMPÉTENCES : la carte mentale se dessine ---------- */
  const lines = gsap.utils.toArray('.mm-lines line');
  lines.forEach((l) => {
    const len = l.getTotalLength();
    l.style.strokeDasharray = len;
    l.style.strokeDashoffset = len;
  });
  const mmTl = gsap.timeline({
    scrollTrigger: { trigger: '.skills', start: 'top 70%', end: 'center 45%', scrub: 1 },
  });
  mmTl
    .from('.mm-center', { opacity: 0, scale: 0.8, transformOrigin: '50% 50%', stagger: 0.1 })
    .to(lines, { strokeDashoffset: 0, stagger: 0.08, ease: 'none' })
    .from('.mm-nodes text', { opacity: 0, y: 10, stagger: 0.06 }, '<0.2')
    .from('.langs', { opacity: 0, x: 30 }, '<');
  gsap.from('.interests', { y: 60, rotation: 4, opacity: 0, ease: 'power2.out', scrollTrigger: { trigger: '.interests', start: 'top 95%', end: 'top 65%', scrub: 1 } });

  /* ---------- CONTACT : bandeau qui accélère avec le scroll ---------- */
  const marquee = gsap.to('.marquee__track', { xPercent: -50, ease: 'none', duration: 22, repeat: -1 });
  ScrollTrigger.create({
    trigger: '.contact', start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => {
      const v = gsap.utils.clamp(-6, 6, self.getVelocity() / 250);
      gsap.to(marquee, { timeScale: 1 + Math.abs(v), duration: 0.2, overwrite: true });
      gsap.to(marquee, { timeScale: 1, duration: 1.2, delay: 0.2, overwrite: false });
    },
  });
  gsap.from('.contact__card', {
    y: 120, rotation: 6, opacity: 0, ease: 'power2.out',
    scrollTrigger: { trigger: '.contact__card', start: 'top 95%', end: 'top 55%', scrub: 1 },
  });

  /* ---------- curseur ---------- */
  const cursor = document.querySelector('.cursor');
  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    const label = cursor.querySelector('.cursor__label');
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('mousemove', (e) => { cursor.style.opacity = 1; cx(e.clientX); cy(e.clientY); });
    document.addEventListener('mouseleave', () => { cursor.style.opacity = 0; });
    document.querySelectorAll('[data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => { label.textContent = el.dataset.cursorLabel || 'voir'; cursor.classList.add('is-active'); });
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
    });
  }

  // recalcule quand les polices sont chargées
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
