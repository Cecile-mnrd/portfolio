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
      // l'email est copié directement au premier clic
      if (box.dataset.kind === 'email' && navigator.clipboard) navigator.clipboard.writeText(v).then(() => { copy.textContent = 'Copié ✓'; }).catch(() => {});
    });
  });

  /* ---------- CARROUSEL PROJETS (fonctionne aussi sans GSAP) ---------- */
  const car = document.querySelector('.carousel');
  const slides = car ? Array.from(car.children) : [];
  const tabBtns = Array.from(document.querySelectorAll('.planche__tab'));
  const prev = document.querySelector('.arrow--prev');
  const next = document.querySelector('.arrow--next');
  const counter = document.querySelector('.counter__i');
  let current = -1;
  // par défaut : carrousel libre ; sur ordinateur, remplacé par le défilement épinglé (plus bas)
  let goImpl = (i) => car.scrollTo({ left: slides[i].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
  const go = (i) => goImpl(Math.max(0, Math.min(slides.length - 1, i)));
  const scrollToEl = (el) => {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.2 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };
  // « Passer les projets »
  document.querySelectorAll('.skip').forEach((b) => b.addEventListener('click', () => scrollToEl(document.querySelector(b.dataset.target))));
  const onSlide = (i) => {
    if (i === current) return;
    current = i;
    tabBtns.forEach((t, k) => { t.classList.toggle('is-active', k === i); t.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    slides.forEach((sl, k) => sl.classList.toggle('is-current', k === i));
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
  heroMM.add('(min-width: 900px) and (min-height: 701px)', () => {
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
  heroMM.add('(max-width: 899px), (max-height: 700px)', () => {
    gsap.to('.layer--photo', { y: -40, rotation: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  });

  /* ---------- accroche qui s'écrit lettre par lettre ---------- */
  const hook = document.querySelector('.hero__hook');
  if (hook) {
    const full = hook.textContent; hook.textContent = ''; hook.classList.add('is-typing');
    const o = { n: 0 };
    gsap.to(o, { n: full.length, duration: full.length * 0.045, delay: 0.9, ease: 'none', snap: { n: 1 },
      onUpdate: () => { hook.textContent = full.slice(0, o.n); },
      onComplete: () => hook.classList.remove('is-typing') });
  }
  /* ---------- flèche « c'est par ici » : se dessine puis pointe ---------- */
  const mlLine = document.querySelector('.more-link__line');
  if (mlLine) {
    const L = mlLine.getTotalLength();
    gsap.timeline({ delay: 1.4 })
      .fromTo(mlLine, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' })
      .from('.more-link__head', { opacity: 0, x: -8, duration: 0.25 })
      .to('.more-link__arrow', { x: 6, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }

  /* ---------- vague discrète en bas de l'accueil ---------- */
  gsap.to('.sea__a', { x: -90, duration: 6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.sea__b', { x: 70, duration: 8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  /* ---------- photo « à propos » : léger parallaxe ---------- */
  gsap.fromTo('.about__photo', { y: 60 }, { y: -60, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.rope', { y: 40, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.ropes', start: 'top 85%' } });
  gsap.from('.mcard', { y: 60, rotation: (i) => (i ? 3 : -3), opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.master', start: 'top 80%' } });

  /* ---------- MANIFESTE : un coup de surligneur sur les mots clés ---------- */
  gsap.utils.toArray('.manifesto__text em').forEach((em) => {
    gsap.fromTo(em, { '--hl': '0%' }, { '--hl': '100%', ease: 'none', scrollTrigger: { trigger: em, start: 'top 80%', end: 'top 55%', scrub: true } });
  });

  /* ---------- PROJETS : défilement horizontal épinglé (ordinateur) ---------- */
  gsap.to('.sheets__top', { y: -30, rotation: -4, ease: 'none', scrollTrigger: { trigger: '.projects-intro', start: 'top 80%', end: 'bottom 30%', scrub: true } });
  gsap.to('.sheets span', { rotation: (i) => (i ? 9 : -11), x: (i) => (i ? 30 : -30), ease: 'none', scrollTrigger: { trigger: '.projects-intro', start: 'top 80%', end: 'bottom 30%', scrub: true } });
  const animateSlide = (i) => {
    const sl = slides[i]; if (!sl) return;
    gsap.fromTo(sl.querySelectorAll('.planche__text > *'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out', overwrite: true });
  };
  document.addEventListener('slidechange', (e) => animateSlide(e.detail));

  const projMM = gsap.matchMedia();
  projMM.add('(min-width: 900px)', () => {
    // pile de fiches : tous les intercalaires visibles ; au défilement, la fiche du dessus s'en va et révèle la suivante
    const section = document.querySelector('.projects');
    section.classList.add('is-stack');
    const n = slides.length;
    const off = (k) => ({ x: k * 9, y: 0, rotation: 0 });
    slides.forEach((sl, k) => { sl.style.zIndex = n - k; gsap.set(sl, off(k)); });
    const tl = gsap.timeline({
      defaults: { duration: 1 },
      scrollTrigger: {
        trigger: section, pin: true, start: 'top top', end: () => '+=' + (n - 1) * window.innerHeight * 0.75,
        scrub: 0.6, invalidateOnRefresh: true,
      },
      onUpdate: () => onSlide(Math.min(n - 1, Math.round(tl.progress() * (n - 1)))),
      id: 'stack',
    });
    for (let i = 0; i < n - 1; i++) {
      tl.to(slides[i], { xPercent: -118, y: 60, rotation: -9, ease: 'power2.in' }, i);
      for (let j = i + 1; j < n; j++) tl.to(slides[j], { ...off(j - i - 1), ease: 'power2.out' }, i + 0.15);
    }
    const st = tl.scrollTrigger;
    const old = goImpl;
    goImpl = (i) => {
      const y = st.start + (i / (n - 1)) * (st.end - st.start);
      if (lenis) lenis.scrollTo(y, { duration: 1.1 }); else window.scrollTo({ top: y, behavior: 'smooth' });
    };
    // le texte se réduit si besoin pour tenir dans la fiche
    const fit = () => slides.forEach((sl) => {
      const body = sl.querySelector('.planche__body'); const text = sl.querySelector('.planche__text');
      text.style.scale = '1';
      const cs = getComputedStyle(body);
      const avail = body.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const k = Math.min(1, avail / text.scrollHeight);
      text.style.scale = String(Math.max(0.55, k));
    });
    fit(); window.addEventListener('resize', fit); if (document.fonts) document.fonts.ready.then(fit);
    onSlide(0);
    return () => { window.removeEventListener('resize', fit); slides.forEach((sl) => { sl.querySelector('.planche__text').style.scale = ''; }); goImpl = old; section.classList.remove('is-stack'); slides.forEach((sl) => { sl.style.zIndex = ''; }); };
  });

  /* ---------- ATOUTS ---------- */
  gsap.from('.ticket', { y: -50, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.assets', start: 'top 80%' } });
  document.querySelectorAll('.ticket__big').forEach((el) => {
    const m = el.textContent.match(/^(\d+)(.*)$/); if (!m) return;
    const end = +m[1], suffix = m[2], o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.4, ease: 'power2.out', snap: { v: 1 }, onUpdate: () => { el.textContent = o.v + suffix; },
      scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
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
  const flipInner = document.querySelector('.flip__inner');
  const faces = () => {
    const back = Math.abs(gsap.getProperty(flipInner, 'rotationY')) > 90;
    document.querySelector('.flip').classList.toggle('is-back', back);
  };
  gsap.timeline({ scrollTrigger: { trigger: '.flip', start: 'top 90%', end: 'center 45%', scrub: 0.8 }, onUpdate: faces })
    .fromTo(flipInner, { y: 120, rotationY: 0, rotation: 4 }, { y: 0, rotationY: 180, rotation: -1.5, ease: 'power2.inOut', onUpdate: faces });
  document.querySelector('.flip').classList.add('is-js');
  gsap.from('.postmark', { scale: 1.6, opacity: 0, duration: 0.35, ease: 'power4.in', scrollTrigger: { trigger: '.flip', start: 'center 42%' } });
  gsap.from('.rings i', { scaleX: 0, transformOrigin: 'right center', duration: 0.5, stagger: 0.1, ease: 'back.out(2)', scrollTrigger: { trigger: '.panel--school', start: 'top 75%' } });

  /* ---------- un trait de feutre sous les mots en italique des titres ---------- */
  document.querySelectorAll('.section-title em, .panel__title em, .contact__title em').forEach((em) => {
    if (em.closest('.flip')) return;
    em.classList.add('scribble');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 200 20'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<path d="M3 13 C 40 6, 80 16, 120 9 S 180 7, 197 11"/>';
    em.appendChild(svg);
    const path = svg.querySelector('path'); const len = path.getTotalLength();
    gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', scrollTrigger: { trigger: em, start: 'top 80%' } });
  });

  /* ---------- compétences : les fiches sont distribuées comme des cartes ---------- */
  const skillMM = gsap.matchMedia();
  skillMM.add('(min-width: 900px)', () => {
    const cards = gsap.utils.toArray('.skill');
    const grid = document.querySelector('.skills__grid');
    gsap.fromTo(cards, {
      x: (i, el) => (grid.offsetWidth / 2) - (el.offsetLeft + el.offsetWidth / 2),
      rotation: (i) => [-8, 3, 10][i % 3], y: 40,
    }, {
      x: 0, rotation: 0, y: 0, ease: 'power2.out', stagger: 0.05,
      scrollTrigger: { trigger: '.skills', start: 'top 75%', end: 'top 25%', scrub: 0.8, invalidateOnRefresh: true },
    });
  });

  /* ---------- accueil : la chemise suit légèrement la souris ---------- */
  if (window.matchMedia('(pointer: fine)').matches) {
    gsap.set('.hero', { perspective: 1400 });
    const rx = gsap.quickTo('.board', 'rotationX', { duration: 0.9, ease: 'power3' });
    const ry = gsap.quickTo('.board', 'rotationY', { duration: 0.9, ease: 'power3' });
    document.querySelector('.hero').addEventListener('mousemove', (e) => {
      ry((e.clientX / window.innerWidth - 0.5) * 5);
      rx(-(e.clientY / window.innerHeight - 0.5) * 4);
    });
    document.querySelector('.hero').addEventListener('mouseleave', () => { rx(0); ry(0); });
  }

  /* ---------- barre de progression en ruban adhésif ---------- */

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
