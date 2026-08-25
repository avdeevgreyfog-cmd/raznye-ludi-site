(() => {
  'use strict';

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const nav = document.getElementById('gearNav');
  const menuButton = document.querySelector('.gear-nav__menu');
  const mobileMenu = document.getElementById('gearMobileMenu');
  const scroller = document.querySelector('.loadout-scroll');
  const frames = [...document.querySelectorAll('.loadout-frame')];
  const stages = [...document.querySelectorAll('.loadout-stage')];
  const progressBar = document.getElementById('loadoutProgress');
  const counter = document.getElementById('stageCurrent');
  const scrollHint = document.getElementById('scrollHint');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let ticking = false;
  let currentStage = 0;

  const updateNav = () => {
    nav?.classList.toggle('is-scrolled', window.scrollY > 24);
  };

  const setStage = (index) => {
    if (index === currentStage) return;
    currentStage = index;
    stages.forEach((stage, i) => stage.classList.toggle('is-active', i === index));
    if (counter) counter.textContent = String(index + 1).padStart(2, '0');
    if (scrollHint) scrollHint.style.opacity = index >= frames.length - 1 ? '0' : '1';
  };

  const updateScrollScene = () => {
    if (!scroller || !frames.length) return;

    const rect = scroller.getBoundingClientRect();
    const travel = Math.max(1, scroller.offsetHeight - window.innerHeight);
    const scrolled = clamp(-rect.top / travel);
    const framePosition = scrolled * (frames.length - 1);
    const nearest = Math.round(framePosition);

    frames.forEach((frame, index) => {
      const distance = Math.abs(framePosition - index);
      const opacity = clamp(1 - distance);
      frame.style.opacity = opacity.toFixed(3);

      if (!reduceMotion) {
        const direction = index % 2 === 0 ? 1 : -1;
        const local = clamp(framePosition - index, -1, 1);
        const scale = 1.035 + Math.min(distance, 1) * 0.012;
        frame.style.transform = `translate3d(${local * direction * 0.45}%, ${local * -0.25}%, 0) scale(${scale})`;
      }
    });

    if (progressBar) progressBar.style.width = `${(scrolled * 100).toFixed(2)}%`;
    setStage(nearest);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateNav();
      updateScrollScene();
      ticking = false;
    });
  };

  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    mobileMenu?.classList.toggle('is-open', open);
  });

  mobileMenu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuButton?.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.remove('is-open');
    });
  });

  document.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('is-active', item === button));
      document.querySelectorAll('.gear-item').forEach((item) => {
        item.hidden = filter !== 'all' && item.dataset.category !== filter;
      });
    });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateScrollScene, { passive: true });
  updateNav();
  updateScrollScene();
})();
