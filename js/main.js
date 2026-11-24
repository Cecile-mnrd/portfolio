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

  /* ---------- email et téléphone : décodés seulement au clic ---------- */
  document.querySelectorAll('.secret').forEach((box) => {
    const btn = box.querySelector('.secret__btn');
    const out = box.querySelector('.secret__value');
    btn.addEventListener('click', () => {
      const v = [...atob(box.dataset.v)].reverse().join('');
      const a = document.createElement('a');
      a.href = (box.dataset.kind === 'email' ? 'mailto:' : 'tel:') + v.replace(/\s/g, box.dataset.kind === 'email' ? '' : '');
      a.textContent = v;
      out.replaceChildren(a);
      const copy = document.createElement('button');
      copy.type = 'button'; copy.className = 'secret__btn'; copy.textContent = 'Copier';
      copy.addEventListener('click', () => {
        (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject())
          .then(() => { copy.textContent = 'Copié'; })
          .catch(() => { const r = document.createRange(); r.selectNodeContents(a); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); });
      });
      btn.replaceWith(copy);
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
          c.style.translate = `${p * d * 60}px ${Math.abs(p) * d * 20}px`;
        });
        sl.querySelectorAll('.shard').forEach((c, k) => { c.style.scale = String(1 - Math.abs(p) * 0.5); c.style.rotate = `${p * (k ? 30 : -30)}deg`; });
      });
    };
    car.addEventListener('scrollend', update);
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

  /* ---------- HERO : les documents sortent de la chemise ---------- */
  // entrée courte (< 1 s) : les feuilles remontent de la poche avant
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.folder, .pocket', { y: 40, opacity: 0, duration: 0.45 }, 0)
    .from('.hero .layer', { y: 150, duration: 0.7, stagger: 0.08 }, 0.1)
    .from('.hero__name .line', { yPercent: 35, opacity: 0, duration: 0.55, stagger: 0.07 }, 0.15)
    .from('.hero .clip', { y: -18, opacity: 0, duration: 0.3, stagger: 0.06 }, 0.55)
    .from('.stamp', { scale: 0.4, opacity: 0, rotation: -60, duration: 0.45, ease: 'back.out(2)' }, 0.5)
    .from('.nav > *', { y: -20, opacity: 0, duration: 0.4, stagger: 0.06 }, 0);

  const heroMM = gsap.matchMedia();
  // moment signature (ordinateur) : au défilement, on sort les documents de la chemise
  heroMM.add('(min-width: 900px)', () => {
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '.hero', pin: true, start: 'top top', end: '+=75%', scrub: 0.8 },
    });
    tl.to('.layer--name', { y: -70, x: -20, rotation: -3 }, 0)
      .to('.layer--photo', { y: -150, x: 70, rotation: 7 }, 0)
      .to('.layer--note', { y: -60, x: 50, rotation: 3 }, 0)
      .to('.stamp', { rotation: 120, y: -40 }, 0)
      .to('.scroll-hint', { opacity: 0, duration: 0.2 }, 0)
      .to('.folder, .pocket', { y: () => window.innerHeight * 0.75, opacity: 0, ease: 'power1.in' }, 0.35)
      .to('.layer', { y: '-=60', stagger: 0.05 }, 0.55);
  });
  heroMM.add('(max-width: 899px)', () => {
    gsap.to('.layer--photo', { y: -40, rotation: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  });

  /* ---------- MANIFESTE : un coup de surligneur sur les mots clés ---------- */
  gsap.utils.toArray('.manifesto__text em').forEach((em) => {
    gsap.fromTo(em, { '--hl': '0%' }, { '--hl': '100%', ease: 'none', scrollTrigger: { trigger: em, start: 'top 80%', end: 'top 55%', scrub: true } });
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

  /* ---------- ATOUTS ---------- */
  gsap.from('.ticket', { y: -50, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.assets', start: 'top 80%' } });
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
  gsap.from('.seal', {
    scale: 0, rotation: -200, duration: 0.9, ease: 'back.out(1.8)',
    scrollTrigger: { trigger: '.seal', start: 'top 90%' },
  });

  /* ---------- CONTACT : la carte postale arrive, puis on la tamponne ---------- */
  gsap.from('.postcard', { y: 90, rotation: 4, opacity: 0, ease: 'power2.out', scrollTrigger: { trigger: '.postcard', start: 'top 95%', end: 'top 60%', scrub: 1 } });
  gsap.from('.postmark', { scale: 1.6, opacity: 0, duration: 0.35, ease: 'power4.in', scrollTrigger: { trigger: '.postcard', start: 'top 45%' } });
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
