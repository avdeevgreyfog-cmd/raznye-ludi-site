(() => {
  document.documentElement.classList.add('js');
  const header = document.getElementById('header');
  const menuBtn = document.querySelector('.menu-btn');
  const mobileMenu = document.getElementById('mobileMenu');
  const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 35);
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
  menuBtn?.addEventListener('click', () => {
    const open = mobileMenu?.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobileMenu.classList.remove('open'); menuBtn?.setAttribute('aria-expanded','false');
  }));
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, {threshold:.08});
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    requestAnimationFrame(() => document.querySelector('.hero .reveal')?.classList.add('visible'));
    const activeObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
      });
    }, {rootMargin:'-36% 0px -56% 0px',threshold:0});
    sections.forEach(sec => activeObserver.observe(sec));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }
})();
