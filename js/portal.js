(() => {
  const path = location.pathname;
  const base = path.includes('/raznye-ludi-site/') ? '/raznye-ludi-site' : '';
  const section = document.body.dataset.section || '';
  const href = (p) => `${base}${p}`;

  const navItems = [
    {key:'team',label:'Команда',href:'/team/',links:[['О команде','/team/about.html'],['История','/team/history.html'],['Состав','/team/people.html'],['Принципы','/team/principles.html'],['Устав и правила','/team/rules.html']],feature:['КТО МЫ','Люди, которые играют одной командой.','Открыть раздел →']},
    {key:'start',label:'Новичку',href:'/start/',links:[['Как попасть','/start/how-to-join.html'],['Первая тренировка','/start/first-training.html'],['Что взять','/start/what-to-bring.html'],['FAQ','/start/faq.html'],['Оставить заявку','/start/application.html']],feature:['ПЕРВЫЙ РАЗ?','Начни с простой инструкции без лишней теории.','Начать →']},
    {key:'gear',label:'Снаряжение',href:'/gear/',links:[['Интерактивный боец','/pages/gear.html'],['Требования','/gear/requirements.html'],['Форма','/gear/uniform.html'],['Разгрузка','/gear/load-bearing.html'],['Комплекты по ролям','/gear/roles.html'],['Чек-листы','/gear/checklists.html']],feature:['LOADOUT','Система снаряжения: от общей логики до чек-листа.','Разобрать комплект →']},
    {key:'knowledge',label:'Подготовка',href:'/knowledge/',links:[['База знаний','/knowledge/'],['Основы','/knowledge/#basics'],['Тактика','/knowledge/#tactics'],['Связь','/knowledge/#comms'],['Навигация','/knowledge/#navigation'],['Медицина','/knowledge/#medicine']],feature:['БАЗА ЗНАНИЙ','Материалы команды в одном месте — с поиском и категориями.','Открыть базу →']},
    {key:'events',label:'Мероприятия',href:'/events/',links:[['Предстоящие','/events/'],['Календарь','/events/calendar.html'],['Архив','/events/archive.html'],['Пример карточки события','/events/event.html']],feature:['КАЛЕНДАРЬ','Игры, тренировки, выезды и история мероприятий.','Смотреть события →']},
    {key:'journal',label:'Журнал',href:'/journal/',links:[['Последние публикации','/journal/'],['Новости','/journal/?type=news'],['Отчёты','/journal/?type=reports'],['Статьи','/journal/?type=articles'],['Пример публикации','/journal/article.html']],feature:['ЖИЗНЬ КОМАНДЫ','Новости, отчёты, фотографии и большие материалы.','Открыть журнал →']}
  ];

  function renderHeader(){
    const target = document.querySelector('[data-site-header]');
    if(!target) return;
    const nav = navItems.map(item => `
      <div class="portal-nav__item">
        <a class="portal-nav__link ${section===item.key?'is-active':''}" href="${href(item.href)}">${item.label}</a>
        <div class="portal-mega">
          <div class="portal-mega__links">${item.links.map(([l,p])=>`<a href="${href(p)}">${l}</a>`).join('')}</div>
          <a class="portal-mega__feature" href="${href(item.href)}"><small>${item.feature[0]}</small><strong>${item.feature[1]}</strong><span>${item.feature[2]}</span></a>
        </div>
      </div>`).join('');
    const mobile = navItems.map(item => `<details ${section===item.key?'open':''}><summary>${item.label}</summary><a href="${href(item.href)}">Обзор раздела</a>${item.links.map(([l,p])=>`<a href="${href(p)}">${l}</a>`).join('')}</details>`).join('');
    target.innerHTML = `<header class="portal-header"><div class="portal-header__inner">
      <a class="portal-brand" href="${href('/')}"><img src="${href('/assets/final_logo.png')}" alt=""><span><strong>Разные люди</strong><small>тактическая команда</small></span></a>
      <nav class="portal-nav" aria-label="Основная навигация">${nav}</nav>
      <a class="portal-join" href="${href('/start/application.html')}">Вступить</a>
      <button class="portal-menu-btn" type="button" aria-expanded="false" aria-label="Открыть меню"><span></span><span></span><span></span></button>
    </div></header><div class="portal-mobile" aria-label="Мобильная навигация">${mobile}<a class="portal-mobile__join" href="${href('/start/application.html')}">Оставить заявку</a></div>`;
    const btn = target.querySelector('.portal-menu-btn');
    const menu = target.querySelector('.portal-mobile');
    btn?.addEventListener('click',()=>{const open=menu.classList.toggle('is-open');btn.setAttribute('aria-expanded',String(open));document.body.style.overflow=open?'hidden':''});
    menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('is-open');document.body.style.overflow='';btn?.setAttribute('aria-expanded','false')}));
  }

  function renderFooter(){
    const target = document.querySelector('[data-site-footer]');
    if(!target) return;
    target.innerHTML = `<footer class="portal-footer"><div class="portal-shell"><div class="portal-footer__grid">
      <div class="portal-footer__brand"><strong>Разные люди</strong><p>Страйкбольная команда. Тренировки, игры, выезды, подготовка и развитие команды.</p></div>
      <div><h4>Команда</h4><a href="${href('/team/about.html')}">О нас</a><a href="${href('/team/history.html')}">История</a><a href="${href('/team/people.html')}">Состав</a><a href="${href('/team/rules.html')}">Устав</a></div>
      <div><h4>Новичку</h4><a href="${href('/start/how-to-join.html')}">Как попасть</a><a href="${href('/start/first-training.html')}">Первая тренировка</a><a href="${href('/start/what-to-bring.html')}">Что взять</a><a href="${href('/start/faq.html')}">FAQ</a></div>
      <div><h4>Подготовка</h4><a href="${href('/gear/')}">Снаряжение</a><a href="${href('/knowledge/')}">База знаний</a><a href="${href('/events/')}">Мероприятия</a></div>
      <div><h4>Медиа</h4><a href="${href('/journal/')}">Журнал</a><a href="https://vk.ru/different_people_rf" target="_blank" rel="noopener">ВКонтакте</a><a href="${href('/start/application.html')}">Вступить</a></div>
    </div><div class="portal-footer__bottom"><span>© Разные люди</span><span>Каркас публичного портала · контент будет дополняться</span></div></div></footer>`;
  }

  const articles = [
    {title:'Радиодисциплина: каркас материала',category:'Связь',desc:'Структура будущей статьи: позывные, порядок выхода в эфир, краткость сообщений и подтверждение команд.',href:'/knowledge/article.html'},
    {title:'Подготовка к первой тренировке',category:'Основы',desc:'Чек-лист новичка: одежда, вода, документы, время прибытия и что не нужно покупать заранее.',href:'/start/first-training.html'},
    {title:'Комплект на обычную игру',category:'Снаряжение',desc:'Каркас чек-листа, который позже можно будет автоматически привязывать к мероприятию.',href:'/gear/checklists.html'},
    {title:'Навигация и ориентирование',category:'Навигация',desc:'Будущий материал по карте, компасу, координатам и базовой работе на местности.',href:'/knowledge/article.html'},
    {title:'Работа малой группой',category:'Тактика',desc:'Заготовка раздела о передвижении, секторах ответственности и взаимодействии.',href:'/knowledge/article.html'},
    {title:'Базовая аптечка',category:'Медицина',desc:'Структура будущего материала о составе индивидуального медицинского набора.',href:'/knowledge/article.html'}
  ];

  function renderKnowledge(){
    const input=document.querySelector('[data-knowledge-search]');
    const grid=document.querySelector('[data-knowledge-results]');
    if(!input||!grid) return;
    const draw=(q='')=>{const s=q.trim().toLowerCase();const list=articles.filter(a=>`${a.title} ${a.category} ${a.desc}`.toLowerCase().includes(s));grid.innerHTML=list.map(a=>`<a class="portal-news-card" href="${href(a.href)}"><div class="portal-news-card__body"><div class="portal-news-card__meta">${a.category} · каркас</div><h3>${a.title}</h3><p>${a.desc}</p></div></a>`).join('') || '<p style="color:#817a70">Материалы по запросу пока не добавлены.</p>'};
    draw(); input.addEventListener('input',e=>draw(e.target.value));
  }

  const journalItems = [
    {type:'news',label:'Новости',title:'Система новостей подключена к каркасу',desc:'Сейчас это демонстрационная публикация. В дальнейшем записи будут приходить из административной части.',img:'/assets/scene_02.webp',href:'/journal/article.html'},
    {type:'reports',label:'Отчёты',title:'Отчёт о мероприятии — шаблон',desc:'Карточка для будущих фотоотчётов, видео и связанных материалов после игры или тренировки.',img:'/assets/scene_04.webp',href:'/journal/article.html'},
    {type:'articles',label:'Статьи',title:'Большие материалы команды',desc:'Журнал поддерживает не только короткие новости, но и полноценные редакционные материалы.',img:'/assets/scene_08.webp',href:'/journal/article.html'}
  ];
  function renderJournal(){
    const grid=document.querySelector('[data-journal-grid]'); if(!grid) return;
    const params=new URLSearchParams(location.search); let type=params.get('type')||'all';
    const draw=()=>{const items=type==='all'?journalItems:journalItems.filter(x=>x.type===type);grid.innerHTML=items.map(x=>`<a class="portal-news-card" href="${href(x.href)}"><div class="portal-news-card__visual"><img src="${href(x.img)}" alt=""></div><div class="portal-news-card__body"><div class="portal-news-card__meta">${x.label} · демонстрация</div><h3>${x.title}</h3><p>${x.desc}</p></div></a>`).join('')};
    document.querySelectorAll('[data-journal-filter]').forEach(b=>{if(b.dataset.journalFilter===type)b.classList.add('is-active');b.addEventListener('click',()=>{type=b.dataset.journalFilter;document.querySelectorAll('[data-journal-filter]').forEach(x=>x.classList.toggle('is-active',x===b));draw()})});draw();
  }

  function renderCalendar(){
    const grid=document.querySelector('[data-calendar-grid]'); if(!grid) return;
    const eventDays=[6,13,20,27];
    let html=''; for(let i=1;i<=35;i++){const day=i<=31?i:'';html+=`<div class="portal-calendar__day ${eventDays.includes(i)?'is-event':''}">${day}${eventDays.includes(i)?'<i title="Демонстрационная отметка события"></i>':''}</div>`} grid.innerHTML=html;
  }

  renderHeader(); renderFooter(); renderKnowledge(); renderJournal(); renderCalendar();
})();