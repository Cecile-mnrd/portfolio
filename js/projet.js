/* Pages projet : défilement doux, apparitions, curseur */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || !window.ScrollTrigger || reduce) return;
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // en-tête : la fiche se pose, les visuels tombent en collage
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.back', { x: -30, opacity: 0, duration: 0.5 })
    .from('.case-hero__text', { y: 80, rotation: -6, opacity: 0, duration: 0.9 }, '<0.1')
    .from('.case-hero__cover .cut', { y: -120, opacity: 0, rotation: () => gsap.utils.random(-25, 25), duration: 0.9, stagger: 0.12, ease: 'back.out(1.4)' }, '<0.1')
    .from('.nav > *', { y: -30, opacity: 0, duration: 0.5, stagger: 0.1 }, '<');

  gsap.to('.case-hero__cover .cut', {
    y: (i) => -40 - i * 30, ease: 'none',
    scrollTrigger: { trigger: '.case-hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    if (el.closest('.case-hero')) return;
    gsap.from(el, {
      y: 70, opacity: 0, rotation: gsap.utils.random(-4, 4), duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });
  gsap.from('.next__title', { xPercent: -10, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.next', start: 'top 95%', end: 'top 50%', scrub: true } });

  // chiffres clés en compteur
  document.querySelectorAll('.num__big').forEach((el) => {
    const m = el.textContent.match(/^(\d+)(.*)$/); if (!m) return;
    const end = +m[1], suf = m[2], o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.3, ease: 'power2.out', snap: { v: 1 }, onUpdate: () => { el.textContent = o.v + suf; }, scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  const cursor = document.querySelector('.cursor');
  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    const label = cursor.querySelector('.cursor__label');
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('mousemove', (e) => { cursor.style.opacity = 1; cx(e.clientX); cy(e.clientY); });
    document.querySelectorAll('[data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => { label.textContent = el.dataset.cursorLabel || 'voir'; cursor.classList.add('is-active'); });
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
    });
  }
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
