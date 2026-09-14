/* V57 — quick editing of event facts on Overview. Route duration remains route-only. */
(() => {
  'use strict';

  const safe=v=>typeof esc==='function'?esc(v):String(v??'');
  const isOrganizer=()=>!!window.HikeAccessV47?.access?.().admin || document.body.classList.contains('hike-organizer');
  const plural=(n,one,few,many)=>{const a=Math.abs(Number(n)||0)%100,b=a%10;return a>10&&a<20?many:b===1?one:b>=2&&b<=4?few:many};
  const durationFromRow=row=>{
    const days=Math.max(1,Number(row?.duration_days)||1);
    const overnight=!!row?.overnight;
    if(!overnight)return `${days} ${plural(days,'день','дня','дней')}`;
    const nights=Math.max(1,days-1);
    return `${days} ${plural(days,'день','дня','дней')} · ${nights} ${plural(nights,'ночь','ночи','ночей')}`;
  };
  const meetingParts=raw=>{
    const text=String(raw||'').trim();
    if(!text || text==='Время и точка уточняются')return {time:'',place:''};
    const match=text.match(/^\s*(\d{1,2}:\d{2})\s*(?:[·—–-]\s*)?(.*)$/);
    return match?{time:match[1],place:(match[2]||'').trim()}:{time:'',place:text};
  };
  const eventDuration=()=>{
    const row=window.HikeEventV49?.event;
    if(row)return durationFromRow(row);
    const raw=String(S?.event?.duration||'').trim();
    if(raw && !/^\d+\s*ч(?:\s|$)/i.test(raw) && raw!=='1 день')return raw;
    return '2 дня · 1 ночь';
  };
  const icon=type=>{
    const paths={
      date:'<rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M8 3.5v4M16 3.5v4M4 9.5h16M8 13h3M13 13h3M8 16h3"/>',
      place:'<path d="M12 21s6-5.6 6-11a6 6 0 1 0-12 0c0 5.4 6 11 6 11Z"/><circle cx="12" cy="10" r="2.2"/>',
      time:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3.4 2"/>',
      duration:'<rect x="6" y="3.5" width="12" height="17" rx="2"/><path d="M9 3.5v3M15 3.5v3M8.5 10h7M8.5 13h4M8.5 16h5.5"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[type]}</svg>`;
  };
  const editIcon=()=>'<span class="ov57-fact__edit" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4.5 19.5 8 18.8 18.2 8.6a2 2 0 0 0-2.8-2.8L5.2 16zM13.8 7.4l2.8 2.8"/></svg></span>';

  function factsMarkup(){
    const meeting=meetingParts(S?.event?.meeting);
    const rows=[
      {key:'date',label:'Дата',value:S?.event?.date||'Дата уточняется',detail:'Дата начала похода',focus:'#evStart'},
      {key:'place',label:'Место сбора',value:meeting.place||'Место уточняется',detail:'Точка общего сбора',focus:'#evMeetPlace'},
      {key:'time',label:'Время сбора',value:meeting.time||'Время уточняется',detail:'До выхода на маршрут',focus:'#evMeetTime'},
      {key:'duration',label:'Длительность',value:eventDuration(),detail:'Длительность всего похода',focus:'#evDays'}
    ];
    const admin=isOrganizer();
    return `<section class="ov57-event-facts" aria-label="Основная информация о походе">${rows.map(row=>{
      const tag=admin?'button':'div';
      const attrs=admin?` type="button" data-v57-edit="${row.focus}" aria-label="Изменить: ${safe(row.label)}"`:'';
      return `<${tag} class="ov57-fact"${attrs}><span class="ov57-fact__icon">${icon(row.key)}</span><span class="ov57-fact__copy"><span class="ov57-fact__label">${safe(row.label)}</span><strong class="ov57-fact__value">${safe(row.value)}</strong><span class="ov57-fact__detail">${safe(row.detail)}</span></span>${admin?editIcon():''}</${tag}>`;
    }).join('')}</section>`;
  }

  function normalizeEventDuration(){
    if(!S?.event)return;
    const raw=String(S.event.duration||'').trim();
    const row=window.HikeEventV49?.event;
    if(row){
      S.event.duration=durationFromRow(row);
      S.event.durationDays=Math.max(1,Number(row.duration_days)||1);
      S.event.overnight=!!row.overnight;
      return;
    }
    if(!raw || /^\d+\s*ч(?:\s|$)/i.test(raw) || raw==='1 день'){
      S.event.duration='2 дня · 1 ночь';
      S.event.durationDays=2;
      S.event.overnight=true;
    }
  }

  function decorate(){
    normalizeEventDuration();
    if(typeof tab!=='undefined' && tab!=='overview')return;
    const shell=document.querySelector('.ov44-shell');
    const hero=shell?.querySelector('.ov44-hero-head');
    if(!shell||!hero)return;
    shell.querySelector('.ov57-event-facts')?.remove();
    hero.insertAdjacentHTML('afterend',factsMarkup());
    shell.querySelectorAll('[data-v57-edit]').forEach(button=>{
      button.addEventListener('click',()=>window.HikeEventV49?.openEditor?.(button.dataset.v57Edit));
    });
  }

  const beforeRender=render;
  render=function renderV57(){const out=beforeRender();requestAnimationFrame(decorate);return out};
  const beforeBind=bind;
  bind=function bindV57(){beforeBind();decorate()};
  window.HikeOverviewV57={decorate,eventDuration};
  queueMicrotask(decorate);
})();
