/* V43 — sidebar grouping and lightweight line icons. */
(() => {
  'use strict';

  const GROUPS = [
    ['Поход', ['overview', 'participants', 'roles']],
    ['Подготовка', ['gear', 'food', 'transport']],
    ['На местности', ['route', 'plan']]
  ];

  const ICONS = {
    overview: '<circle cx="12" cy="12" r="8.25"/><path d="m15.5 8.5-2.2 5-4.8 2 2.1-4.9 4.9-2.1Z"/>',
    participants: '<path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20"/><circle cx="9.5" cy="7.5" r="3.2"/><path d="M17 8.4a3 3 0 0 1 0 5.7M20.5 20v-1.4a3.5 3.5 0 0 0-2.7-3.4"/>',
    roles: '<circle cx="8.5" cy="7.5" r="3"/><path d="M3 20v-1.3a4.6 4.6 0 0 1 4.6-4.6h1.8c1.1 0 2.1.4 2.9 1"/><circle cx="17" cy="16.8" r="3.2"/><path d="m19.4 19.2 2 2M17 12.4v1.1M17 20.1v1.1M12.6 16.8h1.1M20.3 16.8h1.1"/>',
    gear: '<path d="M7 7V5.8A3.8 3.8 0 0 1 10.8 2h2.4A3.8 3.8 0 0 1 17 5.8V7"/><rect x="5" y="6.5" width="14" height="15" rx="3"/><path d="M5 11H3.5v6H5M19 11h1.5v6H19M9 10.5h6M9 15.5h6"/>',
    food: '<path d="M5.5 3v7M8 3v7M3 3v4.5A2.5 2.5 0 0 0 5.5 10v11M16 3v18M16 3c3 1.7 4.5 4.3 4.5 7.2 0 2-1.4 3.3-4.5 3.3"/>',
    transport: '<path d="M5 17h14M6.2 17l.8-6.1A2.2 2.2 0 0 1 9.2 9h5.6a2.2 2.2 0 0 1 2.2 1.9l.8 6.1M7 9l1.1-3h7.8L17 9"/><circle cx="8" cy="17.5" r="1.5"/><circle cx="16" cy="17.5" r="1.5"/>',
    route: '<path d="m3.5 6.5 5-2.5 7 2.5 5-2.5v14l-5 2.5-7-2.5-5 2.5v-14Z"/><path d="M8.5 4v14M15.5 6.5v14"/>',
    plan: '<path d="M7 3h8l4 4v14H5V3h2Z"/><path d="M14 3v5h5M8 12h8M8 16h8"/>'
  };

  function iconFor(id) {
    return `<span class="sidebar-v43-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[id] || '<circle cx="12" cy="12" r="7"/>'}</svg></span>`;
  }

  function decorateNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    const buttons = Array.from(nav.querySelectorAll('button[data-tab]'));
    if (!buttons.length) return;

    const map = new Map(buttons.map(button => [button.dataset.tab, button]));
    const used = new Set();
    const fragment = document.createDocumentFragment();

    GROUPS.forEach(([title, ids]) => {
      const available = ids.map(id => map.get(id)).filter(Boolean);
      if (!available.length) return;

      const group = document.createElement('div');
      group.className = 'sidebar-nav-group';

      const heading = document.createElement('div');
      heading.className = 'sidebar-nav-group__title';
      heading.textContent = title;

      const items = document.createElement('div');
      items.className = 'sidebar-nav-group__items';

      available.forEach(button => {
        const id = button.dataset.tab;
        used.add(id);
        if (!button.querySelector('.sidebar-v43-icon')) {
          button.insertAdjacentHTML('afterbegin', iconFor(id));
        }
        items.appendChild(button);
      });

      group.append(heading, items);
      fragment.appendChild(group);
    });

    buttons.filter(button => !used.has(button.dataset.tab)).forEach(button => {
      if (!button.querySelector('.sidebar-v43-icon')) {
        button.insertAdjacentHTML('afterbegin', iconFor(button.dataset.tab));
      }
      fragment.appendChild(button);
    });

    nav.replaceChildren(fragment);
    nav.dataset.v43Decorated = '1';
  }

  function decorateSidebar() {
    document.getElementById('sidebar')?.classList.add('sidebar-v43-ready');
    decorateNav();
  }

  const originalRenderNav = window.renderNav;
  if (typeof originalRenderNav === 'function') {
    window.renderNav = function sidebarV43RenderNav() {
      originalRenderNav.apply(this, arguments);
      decorateNav();
    };
  }

  requestAnimationFrame(decorateSidebar);
})();
