/* V39 — guided onboarding, contextual help and persistent help preferences. */
(() => {
  'use strict';

  const VERSION = 1;
  const KEY = 'rl_hikes_onboarding_v1';
  let tourActive39 = false;
  let tourStep39 = 0;
  let tourOriginTab39 = 'overview';
  let highlighted39 = null;
  let welcomeTimer39 = null;

  const TOPICS = {
    overview: {
      title: 'Обзор похода',
      text: 'Главная сводка: что уже готово и где есть незакрытые вопросы.',
      points: ['Сигналы показывают проблемы, которые требуют решения.', 'Готовность собирается из данных остальных разделов.', 'Из обзора удобно переходить к конкретной проблеме.']
    },
    participants: {
      title: 'Участники',
      text: 'Здесь фиксируется состав именно этого похода.',
      points: ['Статус участия относится к мероприятию, а не к постоянному профилю.', 'В строке видно транспорт, роль и общую готовность.', 'Имя, позывной и постоянные данные человек меняет в «Моём профиле».']
    },
    roles: {
      title: 'Роли и компетенции',
      text: 'Роль — ответственность в конкретном походе. Компетенция — постоянный навык человека.',
      points: ['Основные роли назначает организатор.', 'Первая помощь, готовка и радиосвязь отмечаются как компетенции.', 'Один человек может иметь несколько компетенций.']
    },
    gear: {
      title: 'Снаряжение',
      text: 'Сначала задаётся, что требуется походу, затем люди отмечают готовность и получают групповое имущество.',
      points: ['«Моё снаряжение» — личный чек-лист участника.', '«Групповое» — вещи, которые достаточно взять на команду.', '«Шаблон похода» позволяет организатору добавлять и менять перечень вещей.']
    },
    food: {
      title: 'Питание и вода',
      text: 'Меню превращается в расчёт продуктов, закупки и объём воды на команду.',
      points: ['Для общих блюд задаётся норма продукта на человека.', 'Одинаковые продукты из разных блюд суммируются в закупках.', 'Вода считается отдельно: питьё + готовка + резерв − пополнение.']
    },
    transport: {
      title: 'Транспорт',
      text: 'Водители создают рейсы, а пассажиры выбирают подходящую машину и точку посадки.',
      points: ['Данные машины берутся из личного профиля водителя.', 'Конкретный рейс относится только к текущему походу.', 'Место считается занятым после подтверждения водителем.']
    },
    route: {
      title: 'Маршрут',
      text: 'Рабочая карта похода: линия движения, контрольные точки и разные картографические подложки.',
      points: ['«Карта» подходит для троп и ориентиров.', '«Спутник» помогает сверять реальный рельеф и объекты.', '«Яндекс» удобен для городской части и знакомых ориентиров.']
    },
    plan: {
      title: 'План',
      text: 'Последовательность этапов похода и ориентировочное время.',
      points: ['План связывает сбор, выезд, маршрут, привалы и завершение.', 'Время — рабочий ориентир, а не обещание точности до минуты.', 'Ответственные помогают понять, кто контролирует конкретный этап.']
    },
    profile: {
      title: 'Мой профиль',
      text: 'Постоянные данные человека, которые используются в разных походах.',
      points: ['Имя, позывной и телефон не нужно вводить заново в каждом разделе.', 'Водитель и автомобиль автоматически используются в транспорте.', 'Роли конкретного похода здесь не редактируются.']
    }
  };

  const TOUR = [
    {
      id: 'event',
      title: 'Текущее мероприятие',
      text: 'Здесь видно, с каким походом вы сейчас работаете. В дальнейшем отсюда можно будет переключаться между мероприятиями.',
      selector: '.event-switcher'
    },
    {
      id: 'profile',
      tab: 'profile',
      title: 'Мой профиль',
      text: 'Заполните имя, позывной, телефон, данные автомобиля и полезные компетенции. Эти данные не нужно повторять в каждом походе.',
      selector: '.v38-profile-summary',
      fallback: '#v38ProfileEntry'
    },
    {
      id: 'participants',
      tab: 'participants',
      title: 'Кто идёт',
      text: 'Во вкладке «Участники» команда отмечает участие. Здесь же быстро видно готовность каждого человека.',
      selector: '.deadline-note',
      fallback: '.page-head'
    },
    {
      id: 'roles',
      tab: 'roles',
      title: 'Кто за что отвечает',
      text: 'Основных ролей немного: руководитель, навигатор, безопасность и логистика. Узкие навыки хранятся как компетенции.',
      selector: '.v36-role-grid',
      fallback: '.page-head'
    },
    {
      id: 'gear',
      tab: 'gear',
      title: 'Снаряжение',
      text: 'Личный чек-лист, групповое имущество, распределение по людям и редактируемый шаблон похода находятся в одном разделе.',
      selector: '.v36-tabs',
      fallback: '.page-head'
    },
    {
      id: 'food',
      tab: 'food',
      title: 'Питание и вода',
      text: 'Составьте меню — система пересчитает продукты по числу людей, сформирует закупки и поможет распределить воду.',
      selector: '.v36-tabs',
      fallback: '.page-head'
    },
    {
      id: 'transport',
      tab: 'transport',
      title: 'Транспорт',
      text: 'Водитель создаёт рейс, задаёт места и точки посадки. Остальные участники выбирают, как добираются туда и обратно.',
      selector: '.tv24-dir',
      fallback: '.page-head'
    },
    {
      id: 'route',
      tab: 'route',
      title: 'Маршрут и карта',
      text: 'Здесь находятся трек, контрольные точки и картографические подложки. Для разных задач можно переключаться между картой, спутником и Яндексом.',
      selector: '#routeMapFinal',
      fallback: '.page-head'
    },
    {
      id: 'plan',
      tab: 'plan',
      title: 'План похода',
      text: 'Последняя вкладка связывает время, этапы маршрута, привалы и ответственных в одну последовательность действий.',
      selector: '.page-head'
    }
  ];

  function readState39() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { version: VERSION, status: 'new', hintsEnabled: true };
      const parsed = JSON.parse(raw);
      return {
        version: VERSION,
        status: ['new', 'completed', 'dismissed'].includes(parsed.status) ? parsed.status : 'new',
        hintsEnabled: parsed.hintsEnabled !== false
      };
    } catch (e) {
      return { version: VERSION, status: 'new', hintsEnabled: true };
    }
  }

  function writeState39(patch) {
    const next = { ...readState39(), ...patch, version: VERSION };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {}
    return next;
  }

  function ensureLayer39() {
    let root = document.getElementById('v39Layer');
    if (!root) {
      root = document.createElement('div');
      root.id = 'v39Layer';
      root.className = 'v39-layer';
      document.body.appendChild(root);
    }
    return root;
  }

  function clearHighlight39() {
    if (highlighted39) highlighted39.classList.remove('v39-tour-target');
    highlighted39 = null;
    document.querySelectorAll('.v39-tour-target').forEach(el => el.classList.remove('v39-tour-target'));
  }

  function closeLayer39() {
    clearHighlight39();
    const root = ensureLayer39();
    root.className = 'v39-layer';
    root.innerHTML = '';
  }

  function showWelcome39() {
    if (tourActive39) return;
    const root = ensureLayer39();
    root.className = 'v39-layer open welcome';
    root.innerHTML = `<div class="v39-dim"></div><section class="v39-welcome" role="dialog" aria-modal="true" aria-labelledby="v39WelcomeTitle">
      <div class="v39-welcome-mark">РЛ</div>
      <div class="v39-kicker">Быстрый старт</div>
      <h2 id="v39WelcomeTitle">Разобраться в «Походах» за пару минут</h2>
      <p>Покажем, где профиль участника, состав команды, роли, снаряжение, питание, транспорт, маршрут и план. После этого обучение больше не будет открываться само.</p>
      <div class="v39-welcome-points"><span>9 коротких шагов</span><span>Можно прервать в любой момент</span><span>Всегда доступно через «?»</span></div>
      <div class="v39-welcome-actions"><button type="button" class="btn alt" id="v39Dismiss">Больше не показывать</button><button type="button" class="btn sand" id="v39Start">Показать за 2 минуты</button></div>
    </section>`;
    document.getElementById('v39Dismiss').onclick = () => { writeState39({ status: 'dismissed' }); closeLayer39(); };
    document.getElementById('v39Start').onclick = () => startTour39(0);
  }

  function startTour39(step = 0) {
    clearTimeout(welcomeTimer39);
    closeLayer39();
    tourActive39 = true;
    tourStep39 = Math.max(0, Math.min(TOUR.length - 1, step));
    tourOriginTab39 = tab || 'overview';
    showTourStep39();
  }

  function finishTour39(completed = true) {
    tourActive39 = false;
    clearHighlight39();
    closeLayer39();
    writeState39({ status: completed ? 'completed' : 'dismissed' });
    if (completed) {
      tab = 'overview';
      render();
      if (typeof toast === 'function') toast('Обучение завершено. Его всегда можно открыть через «?»');
    }
  }

  function targetForStep39(step) {
    const preferred = document.querySelector(step.selector || '');
    if (preferred && preferred.getClientRects().length) return preferred;
    const fallback = step.fallback ? document.querySelector(step.fallback) : null;
    if (fallback && fallback.getClientRects().length) return fallback;
    return document.querySelector('#app .page-head') || document.querySelector('.workspace');
  }

  function positionTour39(target, pop) {
    if (!target || !pop) return;
    if (window.matchMedia('(max-width: 760px)').matches) {
      pop.removeAttribute('style');
      return;
    }
    const r = target.getBoundingClientRect();
    const pad = 14;
    const width = Math.min(370, window.innerWidth - pad * 2);
    pop.style.width = `${width}px`;
    pop.style.position = 'fixed';
    let left;
    let top;
    if (r.right < window.innerWidth * 0.42) {
      left = Math.min(window.innerWidth - width - pad, r.right + 18);
      top = Math.max(pad, Math.min(window.innerHeight - pop.offsetHeight - pad, r.top));
    } else {
      left = Math.max(pad, Math.min(window.innerWidth - width - pad, r.left));
      const below = r.bottom + 16;
      top = below + pop.offsetHeight < window.innerHeight - pad ? below : Math.max(pad, r.top - pop.offsetHeight - 16);
    }
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  }

  function showTourStep39() {
    if (!tourActive39) return;
    const step = TOUR[tourStep39];
    if (!step) return finishTour39(true);

    if (step.tab && tab !== step.tab) {
      tab = step.tab;
      render();
      return;
    }

    clearHighlight39();
    const target = targetForStep39(step);
    if (target) {
      highlighted39 = target;
      target.classList.add('v39-tour-target');
      try { target.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
    }

    const root = ensureLayer39();
    root.className = 'v39-layer open tour';
    root.innerHTML = `<div class="v39-dim tour-dim"></div><section class="v39-tour-card" role="dialog" aria-modal="true">
      <div class="v39-tour-progress"><span>Шаг ${tourStep39 + 1} из ${TOUR.length}</span><i><b style="width:${((tourStep39 + 1) / TOUR.length) * 100}%"></b></i></div>
      <div class="v39-kicker">${step.tab ? (TOPICS[step.tab]?.title || 'Поход') : 'Навигация'}</div>
      <h2>${step.title}</h2>
      <p>${step.text}</p>
      <div class="v39-tour-actions"><button type="button" class="v39-skip" id="v39Skip">Пропустить обучение</button><span></span>${tourStep39 > 0 ? '<button type="button" class="btn alt" id="v39Prev">Назад</button>' : ''}<button type="button" class="btn sand" id="v39Next">${tourStep39 === TOUR.length - 1 ? 'Готово' : 'Далее'}</button></div>
    </section>`;

    document.getElementById('v39Skip').onclick = () => finishTour39(false);
    document.getElementById('v39Prev')?.addEventListener('click', () => { tourStep39 -= 1; showTourStep39(); });
    document.getElementById('v39Next').onclick = () => {
      if (tourStep39 >= TOUR.length - 1) return finishTour39(true);
      tourStep39 += 1;
      showTourStep39();
    };
    requestAnimationFrame(() => positionTour39(target, root.querySelector('.v39-tour-card')));
  }

  function topicModal39(topicId = tab) {
    const topic = TOPICS[topicId] || TOPICS.overview;
    const root = ensureLayer39();
    root.className = 'v39-layer open help';
    root.innerHTML = `<div class="v39-dim" data-v39-close></div><section class="v39-help-modal" role="dialog" aria-modal="true">
      <header><div><div class="v39-kicker">Справка</div><h2>${topic.title}</h2></div><button type="button" class="v39-close" data-v39-close aria-label="Закрыть">×</button></header>
      <p class="v39-help-lead">${topic.text}</p>
      <div class="v39-help-points">${topic.points.map(x => `<div><i>✓</i><span>${x}</span></div>`).join('')}</div>
      <div class="v39-help-footer"><button type="button" class="btn alt" id="v39AllHelp">Все разделы</button><button type="button" class="btn sand" id="v39TourAgain">Пройти обучение</button></div>
    </section>`;
    root.querySelectorAll('[data-v39-close]').forEach(b => b.onclick = closeLayer39);
    document.getElementById('v39TourAgain').onclick = () => startTour39(0);
    document.getElementById('v39AllHelp').onclick = helpCenter39;
  }

  function helpCenter39() {
    const state = readState39();
    const root = ensureLayer39();
    root.className = 'v39-layer open help';
    root.innerHTML = `<div class="v39-dim" data-v39-close></div><section class="v39-help-modal v39-help-center" role="dialog" aria-modal="true">
      <header><div><div class="v39-kicker">Помощь</div><h2>Как устроены «Походы»</h2></div><button type="button" class="v39-close" data-v39-close aria-label="Закрыть">×</button></header>
      <p class="v39-help-lead">Выберите раздел для короткого объяснения или запустите интерактивный тур заново.</p>
      <div class="v39-help-grid">${Object.entries(TOPICS).map(([id, x]) => `<button type="button" data-v39-topic="${id}"><b>${x.title}</b><span>${x.text}</span></button>`).join('')}</div>
      <div class="v39-help-settings"><label><span><b>Контекстные подсказки</b><small>Показывать маленькие кнопки «?» возле сложных разделов.</small></span><span class="v39-switch"><input id="v39HintsGlobal" type="checkbox" ${state.hintsEnabled ? 'checked' : ''}><i></i></span></label></div>
      <div class="v39-help-footer"><button type="button" class="btn alt" data-v39-close>Закрыть</button><button type="button" class="btn sand" id="v39TourAgain">Пройти обучение</button></div>
    </section>`;
    root.querySelectorAll('[data-v39-close]').forEach(b => b.onclick = closeLayer39);
    root.querySelectorAll('[data-v39-topic]').forEach(b => b.onclick = () => topicModal39(b.dataset.v39Topic));
    document.getElementById('v39TourAgain').onclick = () => startTour39(0);
    document.getElementById('v39HintsGlobal').onchange = e => {
      writeState39({ hintsEnabled: e.target.checked });
      closeLayer39();
      mountHelp39();
      if (typeof toast === 'function') toast(e.target.checked ? 'Подсказки включены' : 'Контекстные подсказки отключены');
    };
  }

  function mountTopHelp39() {
    const viewer = document.querySelector('.viewer');
    if (!viewer) return;
    let btn = document.getElementById('v39HelpTop');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'v39HelpTop';
      btn.type = 'button';
      btn.className = 'v39-help-top';
      btn.title = 'Помощь и обучение';
      btn.setAttribute('aria-label', 'Помощь и обучение');
      btn.textContent = '?';
      viewer.appendChild(btn);
    }
    btn.onclick = helpCenter39;
  }

  function mountContextHelp39() {
    document.querySelectorAll('.v39-context-help').forEach(x => x.remove());
    if (!readState39().hintsEnabled || tourActive39) return;
    const topic = TOPICS[tab];
    const head = document.querySelector('#app .page-head');
    if (!topic || !head) return;
    const actions = head.querySelector('.page-head__actions') || head;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'v39-context-help';
    btn.title = `Что здесь находится: ${topic.title}`;
    btn.setAttribute('aria-label', `Справка: ${topic.title}`);
    btn.textContent = '?';
    btn.onclick = () => topicModal39(tab);
    actions.prepend(btn);
  }

  function mountProfileHelp39() {
    if (tab !== 'profile') return;
    const grid = document.querySelector('.v38-profile-grid');
    if (!grid || document.getElementById('v39ProfileHelp')) return;
    const state = readState39();
    const stack = grid.lastElementChild || grid;
    const card = document.createElement('section');
    card.id = 'v39ProfileHelp';
    card.className = 'v38-profile-card v39-profile-help';
    card.innerHTML = `<div class="v38-profile-card-head"><div><h2>Помощь и обучение</h2><p>Управление подсказками интерфейса для этого браузера.</p></div></div><div class="v38-profile-card-body">
      <label class="v39-setting-row"><span><b>Контекстные подсказки</b><small>Показывать кнопки «?» с пояснениями на рабочих вкладках.</small></span><span class="v39-switch"><input id="v39ProfileHints" type="checkbox" ${state.hintsEnabled ? 'checked' : ''}><i></i></span></label>
      <div class="v39-profile-help-actions"><button type="button" class="btn alt" id="v39OpenHelp">Открыть справку</button><button type="button" class="btn alt" id="v39RestartTour">Пройти обучение заново</button></div>
      <small class="v39-setting-note">Статус обучения хранится только в этом браузере. Очистка данных сайта сбросит настройку.</small>
    </div>`;
    stack.appendChild(card);
    document.getElementById('v39ProfileHints').onchange = e => {
      writeState39({ hintsEnabled: e.target.checked });
      mountContextHelp39();
      if (typeof toast === 'function') toast(e.target.checked ? 'Подсказки включены' : 'Контекстные подсказки отключены');
    };
    document.getElementById('v39OpenHelp').onclick = helpCenter39;
    document.getElementById('v39RestartTour').onclick = () => startTour39(0);
  }

  function mountHelp39() {
    mountTopHelp39();
    mountContextHelp39();
    mountProfileHelp39();
    const build = document.querySelector('.build-label');
    if (build) build.textContent = 'V39 · обучение и контекстная помощь';
  }

  const renderBefore39 = render;
  const bindBefore39 = bind;

  bind = function bindV39() {
    bindBefore39();
    mountHelp39();
  };

  render = function renderV39() {
    const out = renderBefore39();
    mountHelp39();
    if (tourActive39) setTimeout(showTourStep39, 30);
    return out;
  };

  window.addEventListener('resize', () => {
    if (!tourActive39) return;
    const root = ensureLayer39();
    const card = root.querySelector('.v39-tour-card');
    const step = TOUR[tourStep39];
    if (card && step) positionTour39(targetForStep39(step), card);
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (tourActive39) finishTour39(false);
    else if (ensureLayer39().classList.contains('open')) closeLayer39();
  });

  mountHelp39();
  if (readState39().status === 'new') {
    welcomeTimer39 = setTimeout(() => {
      if (!tourActive39 && !document.querySelector('.modal-layer.open')) showWelcome39();
    }, 650);
  }
})();
