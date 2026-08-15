(() => {
  const header = document.getElementById('header');
  const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);

  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 35);
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
  }, {threshold:.10});
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  requestAnimationFrame(() => document.querySelector('.hero .reveal')?.classList.add('visible'));

  const activeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
    });
  }, {rootMargin:'-38% 0px -54% 0px', threshold:0});
  sections.forEach(sec => activeObserver.observe(sec));

  document.querySelectorAll('.scene').forEach(scene => {
    const photo = scene.querySelector(':scope > .scene-photo');
    if (!photo || scene.querySelector(':scope > .scene-ambient')) return;
    const ambient = photo.cloneNode(false);
    ambient.classList.add('scene-ambient'); ambient.alt = ''; ambient.setAttribute('aria-hidden','true');
    scene.insertBefore(ambient, photo);
  });
  const about = document.querySelector('.about > .scene-photo:not(.scene-ambient)');
  const hero = document.querySelector('.hero');
  if (about && hero && !hero.querySelector('.hero-forest-bridge')) {
    const bridge = about.cloneNode(false); bridge.className='hero-forest-bridge'; bridge.alt=''; bridge.setAttribute('aria-hidden','true');
    hero.insertBefore(bridge, hero.querySelector('.hero-content'));
  }

  const form = document.getElementById('applyForm');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const b = form.querySelector('.submit'); const old = b.textContent;
    b.textContent='Заявка подготовлена'; b.disabled=true;
    setTimeout(() => { b.textContent=old; b.disabled=false; }, 2200);
  });
})();
