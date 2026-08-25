(() => {
  const path = location.pathname;
  const base = path.includes('/raznye-ludi-site/') ? '/raznye-ludi-site' : '';
  const section = document.body.dataset.section || '';
  const href = (p) => `${base}${p}`;

  ['/css/portal-editorial.css','/css/portal-flow.css'].forEach(file=>{
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=href(file);
    document.head.appendChild(link);
  });

  const navItems = [
    {key:'team',label:'Команда',href:'/team/',links:[['О команде','/team/about.html'],['История','/team/history.html'],['Состав','/team/people.html'],['Принципы','/team/principles.html'],['Устав и правила','/team/rules.html']]},
    {key:'start',label:'Новичку',href:'/start/',links:[['Как попасть','/start/how-to-join.html'],['Первая тренировка','/start/first-training.html'],['Что взять','/start/what-to-bring.html'],['Частые вопросы','/start/faq.html'],['Оставить заявку','/start/application.html']]},
    {key:'gear',label:'Снаряжение',href:'/gear/',links:[['Интерактивный боец','/pages/gear.html'],['Требования','/gear/requirements.html'],['Форма','/gear/uniform.html'],['Разгрузочные системы','/gear/load-bearing.html'],['Комплекты по ролям','/gear/roles.html'],['Чек-листы','/gear/checklists.html']]},
    {key:'knowledge',label:'Подготовка',href:'/knowledge/',links:[['База знаний','/knowledge/'],['Основы','/knowledge/#basics'],['Тактика','/knowledge/#tactics'],['Связь','/knowledge/#comms'],['Навигация','/knowledge/#navigation'],['Медицина','/knowledge/#medicine']]},
    {key:'events',label:'Мероприятия',href:'/events/',links:[['Предстоящие','/events/'],['Календарь','/events/calendar.html'],['Архив','/events/archive.html'],['Страница мероприятия','/events/event.html']]},
    {key:'journal',label:'Журнал',href:'/journal/',links:[['Все публикации','/journal/'],['Новости','/journal/?type=news'],['Отчёты','/journal/?type=reports'],['Статьи','/journal/?type=articles']]}
  ];

  function renderHeader(){
    const target = document.querySelector('[data-site-header]');
    if(!target) return;
    const nav = navItems.map(item => `
      <div class="portal-nav__item">
        <a class="portal-nav__link ${section===item.key?'is-active':''}" href="${href(item.href)}">${item.label}</a>
        <div class="portal-dropdown">
          <div class="portal-dropdown__eyebrow">${item.label}</div>
          <div class="portal-dropdown__links">${item.links.map(([l,p],i)=>`<a style="--i:${i}" href="${href(p)}">${l}</a>`).join('')}</div>
          <a class="portal-dropdown__overview" href="${href(item.href)}">Обзор раздела →</a>
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
    </div><div class="portal-footer__bottom"><span>© Разные люди</span><span>Страйкбольная команда</span></div></div></footer>`;
  }

  const articles = [
    {title:'Радиодисциплина',category:'Связь',desc:'Позывные, порядок выхода в эфир, краткость сообщений и подтверждение команд.',href:'/knowledge/article.html'},
    {title:'Подготовка к первой тренировке',category:'Основы',desc:'Одежда, вода, документы, время прибытия и что не нужно покупать заранее.',href:'/start/first-training.html'},
    {title:'Комплект на обычную игру',category:'Снаряжение',desc:'Чек-лист снаряжения, который в дальнейшем можно будет привязывать к конкретному мероприятию.',href:'/gear/checklists.html'},
    {title:'Навигация и ориентирование',category:'Навигация',desc:'Карта, компас, координаты и базовая работа на местности.',href:'/knowledge/article.html'},
    {title:'Работа малой группой',category:'Тактика',desc:'Передвижение, сектора ответственности и взаимодействие внутри группы.',href:'/knowledge/article.html'},
    {title:'Базовая аптечка',category:'Медицина',desc:'Состав индивидуального медицинского набора и логика его размещения.',href:'/knowledge/article.html'}
  ];

  function renderKnowledge(){
    const input=document.querySelector('[data-knowledge-search]');
    const grid=document.querySelector('[data-knowledge-results]');
    if(!input||!grid) return;
    const draw=(q='')=>{const s=q.trim().toLowerCase();const list=articles.filter(a=>`${a.title} ${a.category} ${a.desc}`.toLowerCase().includes(s));grid.innerHTML=list.map(a=>`<a class="portal-news-card" href="${href(a.href)}"><div class="portal-news-card__body"><div class="portal-news-card__meta">${a.category}</div><h3>${a.title}</h3><p>${a.desc}</p></div></a>`).join('') || '<p style="color:#817a70">Материалы по запросу пока не добавлены.</p>'};
    draw(); input.addEventListener('input',e=>draw(e.target.value));
  }

  const journalItems = [
    {type:'news',label:'Новости',title:'Новости команды',desc:'Здесь будут появляться короткие новости, объявления и изменения в жизни команды.',img:'/assets/scene_02.webp',href:'/journal/article.html'},
    {type:'reports',label:'Отчёты',title:'Отчёты с мероприятий',desc:'Фото, видео, результаты и заметки после игр, тренировок и выездов.',img:'/assets/scene_04.webp',href:'/journal/article.html'},
    {type:'articles',label:'Статьи',title:'Большие материалы',desc:'Развёрнутые публикации о подготовке, опыте команды и отдельных событиях.',img:'/assets/scene_08.webp',href:'/journal/article.html'}
  ];
  function renderJournal(){
    const grid=document.querySelector('[data-journal-grid]'); if(!grid) return;
    const params=new URLSearchParams(location.search); let type=params.get('type')||'all';
    const draw=()=>{const items=type==='all'?journalItems:journalItems.filter(x=>x.type===type);grid.innerHTML=items.map(x=>`<a class="portal-news-card" href="${href(x.href)}"><div class="portal-news-card__visual"><img src="${href(x.img)}" alt=""></div><div class="portal-news-card__body"><div class="portal-news-card__meta">${x.label}</div><h3>${x.title}</h3><p>${x.desc}</p></div></a>`).join('')};
    document.querySelectorAll('[data-journal-filter]').forEach(b=>{if(b.dataset.journalFilter===type)b.classList.add('is-active');b.addEventListener('click',()=>{type=b.dataset.journalFilter;document.querySelectorAll('[data-journal-filter]').forEach(x=>x.classList.toggle('is-active',x===b));draw()})});draw();
  }

  function renderCalendar(){
    const grid=document.querySelector('[data-calendar-grid]'); if(!grid) return;
    let html=''; for(let i=1;i<=35;i++){const day=i<=31?i:'';html+=`<div class="portal-calendar__day">${day}</div>`} grid.innerHTML=html;
  }

  renderHeader(); renderFooter(); renderKnowledge(); renderJournal(); renderCalendar();
})();