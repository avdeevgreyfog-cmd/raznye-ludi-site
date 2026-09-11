/* V37 — one editorial/workspace language across every Hikes tab. */
(() => {
  'use strict';

  const COPY = {
    overview: { kicker: 'Поход', title: 'Обзор', desc: 'Сводка по готовности команды, маршруту, транспорту, снаряжению и питанию.' },
    participants: { kicker: 'Команда', title: 'Участники', desc: 'Статусы участия и краткая готовность каждого участника.' },
    roles: { kicker: 'Команда', title: 'Роли', desc: 'Основные зоны ответственности и дополнительные компетенции участников.' },
    gear: { kicker: 'Подготовка', title: 'Снаряжение', desc: 'Что нужно взять, что уже готово и как распределено групповое имущество.' },
    food: { kicker: 'Подготовка', title: 'Питание', desc: 'Меню, продукты, закупки и распределение воды на команду.' },
    transport: { kicker: 'Логистика', title: 'Транспорт', desc: 'Как команда добирается на мероприятие и возвращается обратно.' },
    route: { kicker: 'Навигация', title: 'Маршрут', desc: 'Линия маршрута, контрольные точки, карта и навигационные материалы.' },
    plan: { kicker: 'Навигация', title: 'План', desc: 'Время старта, темп, перерывы и последовательность этапов похода.' }
  };

  const basePageHeadV37 = pageHead;
  pageHead = function pageHeadV37(kicker, title, desc, actions = '') {
    const copy = COPY[tab];
    if (!copy) return basePageHeadV37(kicker, title, desc, actions);
    return basePageHeadV37(copy.kicker, copy.title, copy.desc, actions);
  };

  const baseTransportPageV37 = transportPage;
  transportPage = function transportPageV37() {
    const html = baseTransportPageV37();
    const withoutLegacyHero = html.replace(/<section class="tv27-hero">[\s\S]*?<\/section>/, '');
    return `${pageHead('Логистика', 'Транспорт', COPY.transport.desc)}${withoutLegacyHero}`;
  };

  function syncOverviewRolesV37() {
    if (tab !== 'overview' || !S.rolesV36?.roles) return;
    const list = document.querySelector('.ov32-responsibles');
    if (!list) return;
    list.innerHTML = S.rolesV36.roles.map(role => `<button type="button" class="${role.p ? '' : 'missing'}"><span>${esc(role.title)}</span><b>${esc(role.p ? pn(role.p) : 'Не назначено')}</b></button>`).join('');
    list.querySelectorAll('button').forEach(button => button.onclick = () => { tab = 'roles'; render(); });
    const panel = list.closest('.ov32-panel');
    const kicker = panel?.querySelector('.page-kicker');
    if (kicker) kicker.textContent = 'Ответственность';
  }

  function normalizeTabCopyV37() {
    document.body.dataset.hikeTab = tab;
    const app = document.getElementById('app');
    if (app) app.dataset.hikeTab = tab;
    const replacements = new Map([
      ['Когда и как питаемся', 'План питания'],
      ['Мне нужно сделать', 'Ближайшие действия'],
      ['Организационная сводка', 'Сводка'],
      ['Рейсы на мероприятие', 'Рейсы туда'],
      ['Обратные рейсы', 'Рейсы обратно'],
      ['Организационный таймлайн', 'Командный таймлайн'],
      ['План маршрута', 'Маршрут по времени']
    ]);
    document.querySelectorAll('.section-head h2,.ov32-panel-head h2,.tv27-card h2,.tv27-panel-head h2,.v36-food-day-head b').forEach(el => {
      const next = replacements.get(el.textContent.trim());
      if (next) el.textContent = next;
    });
    syncOverviewRolesV37();
  }

  const baseRenderV37 = render;
  render = function renderV37() {
    const result = baseRenderV37();
    normalizeTabCopyV37();
    const build = document.querySelector('.build-label');
    if (build) build.textContent = 'V37 · единый стиль всех вкладок';
    return result;
  };

  const baseBindV37 = bind;
  bind = function bindV37() {
    baseBindV37();
    normalizeTabCopyV37();
  };

  render();
})();
