/* =========================================================
   Animations de défilement — GSAP + ScrollTrigger + Lenis
   ========================================================= */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = window.gsap && window.ScrollTrigger;
  const fine = window.matchMedia('(pointer: fine)').matches;

  /* ---------- ancres ---------- */
  let lenis = null;
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? document.body : document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.4 });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  if (!hasGsap || reduce) return; // contenu entièrement lisible sans animation

  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- HERO ---------- */
  const outline = document.querySelector('.portrait__line path');
  const outlineLen = outline ? outline.getTotalLength() : 0;
  if (outline) gsap.set(outline, { strokeDasharray: outlineLen, strokeDashoffset: outlineLen });

  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.hero .sheet', { y: 80, rotation: -6, opacity: 0, duration: 1 })
    .from('.hero__name .line', { yPercent: 70, opacity: 0, duration: 0.9, stagger: 0.12 }, '-=0.6')
    .from('.kicker, .hero__role, .hero__sub', { y: 20, opacity: 0, duration: 0.6, stagger: 0.08 }, '-=0.5')
    .from('.portrait__img', { scale: 0.6, opacity: 0, duration: 0.9, ease: 'back.out(1.6)' }, '-=0.7')
    .to(outline, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, '-=0.5')
    .from('.hero .note, .hero .status', { y: -100, opacity: 0, duration: 0.9, stagger: 0.12, rotation: () => gsap.utils.random(-18, 18) }, '-=1.2')
    .from('.sticker', { scale: 0, opacity: 0, duration: 0.55, stagger: 0.06, ease: 'back.out(2.6)' }, '-=0.6')
    .from('.nav > *', { y: -30, opacity: 0, duration: 0.6, stagger: 0.1 }, '<');

  gsap.utils.toArray('.hero .layer').forEach((layer) => {
    const speed = parseFloat(layer.dataset.speed || 0.2);
    gsap.to(layer, {
      y: () => -window.innerHeight * speed, rotation: gsap.utils.random(-5, 5), ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
    });
  });
  gsap.to('.sticker', {
    y: (i) => -120 - i * 40, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.scroll-hint', { opacity: 0, scrollTrigger: { trigger: '.hero', start: 'top top', end: '20% top', scrub: true } });

  // les étiquettes suivent la souris
  if (fine) {
    const movers = gsap.utils.toArray('.sticker').map((el, i) => ({
      x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3' }),
      depth: 14 + (i % 3) * 12,
    }));
    window.addEventListener('mousemove', (e) => {
      const dx = e.clientX / window.innerWidth - 0.5;
      movers.forEach((m) => m.x(dx * m.depth));
    });
  }

  /* ---------- MANIFESTE : les mots s'allument ---------- */
  document.querySelectorAll('.reveal-words').forEach((block) => {
    const frag = document.createDocumentFragment();
    block.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s);
        });
      } else {
        const s = document.createElement('span'); s.className = 'w'; s.appendChild(node.cloneNode(true)); frag.appendChild(s);
      }
    });
    block.replaceChildren(frag);
    gsap.fromTo(block.querySelectorAll('.w'), { opacity: 0.12, y: 8 }, {
      opacity: 1, y: 0, stagger: 0.08, ease: 'none',
      scrollTrigger: { trigger: block, start: 'top 80%', end: 'bottom 50%', scrub: true },
    });
  });

  /* ---------- titres : crochets et rayons ---------- */
  gsap.utils.toArray('.bracket-title').forEach((t) => {
    gsap.from(t.querySelectorAll('.bt'), {
      x: (i) => (i ? 40 : -40), opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: t, start: 'top 85%' },
    });
  });
  gsap.utils.toArray('.title-rays').forEach((t) => {
    gsap.from(t.querySelectorAll('.ray'), {
      scale: 0, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'back.out(3)', transformOrigin: '50% 50%',
      scrollTrigger: { trigger: t, start: 'top 85%' },
    });
  });

  /* ---------- PROJETS ---------- */
  const mm = gsap.matchMedia();
  const track = document.querySelector('.projects__track');

  mm.add('(min-width: 900px)', () => {
    const distance = () => track.scrollWidth - window.innerWidth;
    const scroller = gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        trigger: '.projects', pin: true, start: 'top top', end: () => '+=' + distance(), scrub: 1, invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set('.progress span', { scaleX: self.progress }),
      },
    });
    track.querySelectorAll('.project__inner').forEach((card) => {
      gsap.fromTo(card, { rotation: gsap.utils.random(4, 9), y: 50 }, {
        rotation: gsap.utils.random(-3, 3), y: -20, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: scroller, start: 'left right', end: 'right left', scrub: true },
      });
    });
  });
  mm.add('(max-width: 899px)', () => {
    track.querySelectorAll('.project').forEach((card) => {
      gsap.from(card, { y: 80, opacity: 0, rotation: gsap.utils.random(-8, 8), duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 85%' } });
    });
  });

  /* ---------- PARCOURS : la ligne du temps se trace ---------- */
  gsap.from('.timeline__line', {
    scaleY: 0, ease: 'none',
    scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 60%', scrub: true },
  });
  gsap.utils.toArray('.step').forEach((step) => {
    gsap.from(step.querySelector('.step__body'), { x: 60, opacity: 0, rotation: 2, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: step, start: 'top 80%' } });
    gsap.from(step.querySelectorAll('.step__years span'), { y: 20, opacity: 0, duration: 0.6, stagger: 0.1, scrollTrigger: { trigger: step, start: 'top 80%' } });
  });

  /* ---------- COMPÉTENCES : les pastilles tombent ---------- */
  gsap.utils.toArray('.skill-card').forEach((card, i) => {
    gsap.from(card, { y: 60, opacity: 0, rotation: i % 2 ? 3 : -3, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 88%' } });
    gsap.from(card.querySelectorAll('.chips li'), {
      scale: 0.4, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'back.out(2.2)', scrollTrigger: { trigger: card, start: 'top 80%' },
    });
  });
  gsap.from('.extra', { x: -40, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out', scrollTrigger: { trigger: '.extras', start: 'top 85%' } });

  /* ---------- CONTACT ---------- */
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
  if (cursor && fine) {
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

  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
