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

  /* ---------- CARROUSEL PROJETS (fonctionne aussi sans GSAP) ---------- */
  const car = document.querySelector('.carousel');
  const slides = car ? Array.from(car.children) : [];
  const tabBtns = Array.from(document.querySelectorAll('.tabs button'));
  const prev = document.querySelector('.arrow--prev');
  const next = document.querySelector('.arrow--next');
  const counter = document.querySelector('.counter__i');
  let current = -1;
  const go = (i) => {
    i = Math.max(0, Math.min(slides.length - 1, i));
    car.scrollTo({ left: slides[i].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
  };
  const onSlide = (i) => {
    if (i === current) return;
    current = i;
    tabBtns.forEach((t, k) => { t.classList.toggle('is-active', k === i); t.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    if (counter) counter.textContent = String(i + 1).padStart(2, '0');
    if (prev) prev.disabled = i === 0;
    if (next) next.disabled = i === slides.length - 1;
    document.dispatchEvent(new CustomEvent('slidechange', { detail: i }));
  };
  if (car) {
    tabBtns.forEach((t, i) => t.addEventListener('click', () => go(i)));
    prev && prev.addEventListener('click', () => go(current - 1));
    next && next.addEventListener('click', () => go(current + 1));
    car.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); }
    });
    // glissement horizontal (trackpad) : on laisse le navigateur gérer, sans le défilement doux
    car.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.stopPropagation(); }, { passive: true });
    let ticking = false;
    const update = () => {
      ticking = false;
      const w = car.clientWidth;
      onSlide(Math.round(car.scrollLeft / w));
      if (reduce) return;
      // parallaxe des visuels découpés pendant le glissement
      slides.forEach((sl) => {
        const p = (sl.offsetLeft - car.scrollLeft) / w; // -1 … 0 … 1
        if (Math.abs(p) > 1.2) return;
        sl.querySelectorAll('.cut').forEach((c) => {
          const d = parseFloat(c.dataset.depth || 1);
          c.style.translate = `${p * d * 140}px ${Math.abs(p) * d * 30}px`;
        });
        sl.querySelectorAll('.shard').forEach((c, k) => { c.style.scale = String(1 - Math.abs(p) * 0.5); c.style.rotate = `${p * (k ? 30 : -30)}deg`; });
      });
    };
    car.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

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

  /* ---------- PROJETS ---------- */
  gsap.to('.sheets__top', { y: -30, rotation: -4, ease: 'none', scrollTrigger: { trigger: '.projects-intro', start: 'top 80%', end: 'bottom 30%', scrub: true } });
  gsap.to('.sheets span', { rotation: (i) => (i ? 9 : -11), x: (i) => (i ? 30 : -30), ease: 'none', scrollTrigger: { trigger: '.projects-intro', start: 'top 80%', end: 'bottom 30%', scrub: true } });
  gsap.from('.projects-intro__hint', { y: 30, opacity: 0, duration: 0.8, scrollTrigger: { trigger: '.projects-intro', start: 'top 60%' } });
  // le texte de la planche active se reconstruit
  const animateSlide = (i) => {
    const sl = slides[i]; if (!sl) return;
    gsap.fromTo(sl.querySelectorAll('.planche__text > *'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out', overwrite: true });
    gsap.fromTo(sl.querySelectorAll('.cut'), { scale: 0.85 }, { scale: 1, duration: 0.8, stagger: 0.08, ease: 'back.out(1.6)', overwrite: true });
  };
  document.addEventListener('slidechange', (e) => animateSlide(e.detail));
  ScrollTrigger.create({ trigger: '.projects', start: 'top 70%', once: true, onEnter: () => animateSlide(Math.max(current, 0)) });
  gsap.from('.tabs button', { y: 40, opacity: 0, stagger: 0.06, duration: 0.6, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.projects', start: 'top 60%' } });

  /* ---------- ATOUTS ---------- */
  gsap.from('.ticket', { y: -80, opacity: 0, rotation: () => gsap.utils.random(-20, 20), duration: 0.9, stagger: 0.12, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.assets', start: 'top 75%' } });
  gsap.fromTo('.arrow-draw', { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, repeat: -1, repeatDelay: 1.4, ease: 'power2.out', scrollTrigger: { trigger: '.assets', start: 'top 75%' } });

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
  gsap.from('.seal', {
    scale: 0, rotation: -200, duration: 0.9, ease: 'back.out(1.8)',
    scrollTrigger: { trigger: '.seal', start: 'top 90%' },
  });

  /* ---------- COMPÉTENCES ---------- */
  gsap.utils.toArray('.skill').forEach((card, i) => {
    gsap.from(card, { y: 60, opacity: 0, rotation: i % 2 ? 3 : -3, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 88%' } });
    gsap.from(card.querySelectorAll('.chips li'), { scale: 0.5, opacity: 0, duration: 0.45, stagger: 0.04, ease: 'back.out(2)', scrollTrigger: { trigger: card, start: 'top 80%' } });
  });
  gsap.from('.more', { y: 30, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.skills__more', start: 'top 88%' } });

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
    y: 100, rotation: 5, opacity: 0, ease: 'power2.out',
    scrollTrigger: { trigger: '.contact__card', start: 'top 95%', end: 'top 60%', scrub: 1 },
  });
  gsap.from('.rings i', { scaleX: 0, transformOrigin: 'right center', duration: 0.5, stagger: 0.1, ease: 'back.out(2)', scrollTrigger: { trigger: '.panel--school', start: 'top 75%' } });

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
