/* V40 — keep onboarding cards above large map targets and prevent the route step from swallowing the tour. */
(() => {
  'use strict';

  function reposition40(target, card) {
    if (!target || !card || window.matchMedia('(max-width:760px)').matches) return;
    const r = target.getBoundingClientRect();
    const pad = 14;
    const width = Math.min(370, window.innerWidth - pad * 2);
    card.style.width = `${width}px`;
    card.style.position = 'fixed';
    let left = Math.max(pad, Math.min(window.innerWidth - width - pad, r.left));
    let top = r.bottom + 14;
    if (top + card.offsetHeight > window.innerHeight - pad) top = Math.max(pad, r.top - card.offsetHeight - 14);
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  }

  function normalizeTourTarget40() {
    const layer = document.getElementById('v39Layer');
    if (!layer?.classList.contains('tour')) return;
    const card = layer.querySelector('.v39-tour-card');
    let target = document.querySelector('.v39-tour-target');
    if (!card || !target) return;
    const rect = target.getBoundingClientRect();
    const tooLarge = rect.height > window.innerHeight * .48 || rect.width > window.innerWidth * .78;
    const isRouteMap = target.id === 'routeMapFinal' || !!target.closest('#routeMapFinal');
    if (tooLarge || isRouteMap) {
      target.classList.remove('v39-tour-target');
      const safe = document.querySelector('#app .page-head') || document.querySelector('.topbar');
      if (safe) {
        safe.classList.add('v39-tour-target');
        target = safe;
      }
    }
    requestAnimationFrame(() => reposition40(target, card));
  }

  const observer = new MutationObserver(() => normalizeTourTarget40());
  observer.observe(document.documentElement, { subtree:true, childList:true, attributes:true, attributeFilter:['class'] });
  window.addEventListener('resize', normalizeTourTarget40);
  window.addEventListener('scroll', () => {
    const layer = document.getElementById('v39Layer');
    if (!layer?.classList.contains('tour')) return;
    const target = document.querySelector('.v39-tour-target');
    const card = layer.querySelector('.v39-tour-card');
    if (target && card) reposition40(target,card);
  }, { passive:true });
})();
