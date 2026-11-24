/* Transition entre les pages : une feuille de kraft recouvre l'écran, puis se retire */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const store = (k, v) => { try { v === undefined ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {} };

  // arrivée : si on vient d'une autre page du site, la feuille se retire
  if (root.classList.contains('wiping')) {
    store('wipe');
    requestAnimationFrame(() => requestAnimationFrame(() => { root.classList.add('wipe-out'); root.classList.remove('wiping'); }));
    setTimeout(() => root.classList.remove('wipe-out'), 900);
  }
  if (reduce) return;

  // départ : vers une autre page .html du site
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!/\.html(#.*)?$/.test(href) || /^[a-z]+:/i.test(href)) return;
    e.preventDefault();
    store('wipe', '1');
    root.classList.add('wipe-in');
    setTimeout(() => { window.location.href = href; }, 520);
  });
  // retour arrière depuis le cache : on enlève la feuille
  window.addEventListener('pageshow', (e) => { if (e.persisted) root.classList.remove('wipe-in', 'wiping'); });
})();
