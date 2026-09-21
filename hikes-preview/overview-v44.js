/* V44 — approved daylight Overview composition. Uses existing hike state only. */
(() => {
  'use strict';

  let map44 = null;
  const $ = (s, root=document) => root.querySelector(s);
  const safe = v => typeof esc === 'function' ? esc(v) : String(v ?? '');

  function routeStats44(){
    let distance=S.event?.distance||'Уточняется',duration='Уточняется',finish='—',start=S.event?.start||'—',controlPoints=0;
    try{
      if(typeof routeLenV13==='function') distance=`${(routeLenV13()/1000).toFixed(1).replace('.',',')} км`;
      if(typeof routeDurationMinV13==='function'&&typeof fmtDurationV13==='function') duration=fmtDurationV13(routeDurationMinV13());
      if(typeof finalEtaV13==='function') finish=finalEtaV13();
      if(typeof dynamicCpsV13==='function'){
        const cps=dynamicCpsV13()||[];
        controlPoints=Math.max(0,cps.length>=2?cps.length-2:cps.length);
      }
      if(typeof editorV13!=='undefined'&&editorV13?.start) start=editorV13.start;
    }catch(e){}
    return {distance,duration,finish,start,controlPoints};
  }

  function confirmedCount44(){return (S.participants||[]).filter(p=>p.rsvp==='yes').length}
  function maybeCount44(){return (S.participants||[]).filter(p=>p.rsvp==='maybe').length}
  function rolesDone44(){return (S.roles||[]).filter(r=>r.p).length}
  function assigned44(g){return (g.a||[]).reduce((n,a)=>n+(+a[1]||0),0)}
  function gearDone44(){return (S.shared||[]).filter(g=>assigned44(g)>=(+g.need||0)).length}

  function attention44(){
    try{
      const groups=attentionGroups();
      const all=[...(groups.critical||[]).map(x=>({...x,tone:'risk'})),...(groups.warning||[]).map(x=>({...x,tone:'warn'})),...(groups.info||[]).map(x=>({...x,tone:'info'}))];
      return {groups,all,count:all.length};
    }catch(e){return {groups:{critical:[],warning:[],info:[]},all:[],count:0}}
  }

  function nextTasks44(me){
    const out=[];
    if(!me)return out;
    if(me.rsvp==='pending'||me.rsvp==='maybe')out.push({text:'Подтвердить участие',tab:'participants',tone:'warn'});
    if(me.rsvp==='yes'){
      if(['unset','need',undefined,null].includes(S.rides?.there?.[me.id]))out.push({text:'Выбрать транспорт туда',tab:'transport',tone:'risk'});
      if(['unset','need',undefined,null].includes(S.rides?.back?.[me.id]))out.push({text:'Подтвердить транспорт обратно',tab:'transport',tone:'risk'});
      const pr=progress(me.id); if(pr[0]<pr[1])out.push({text:`Закрыть чек-лист снаряжения (${pr[0]}/${pr[1]})`,tab:'gear',tone:'warn'});
      const unc=(S.shared||[]).filter(g=>(g.a||[]).some(a=>a[0]===me.id)&&!(g.confirmed||[]).includes(me.id));
      if(unc.length)out.push({text:'Подтвердить групповое имущество',tab:'gear',tone:'warn'});
    }
    if(!out.length)out.push({text:'Критичных действий на сейчас нет',tab:'',tone:'ok'});
    return out.slice(0,3);
  }

  function eventDateISO44(value){
    const s=String(value||'').trim();
    if(!s||/уточня|не задан/i.test(s))return '';
    let m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/); if(m)return `${m[1]}-${m[2]}-${m[3]}`;
    m=s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/); if(m)return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
    const months={января:1,февраля:2,марта:3,апреля:4,мая:5,июня:6,июля:7,августа:8,сентября:9,октября:10,ноября:11,декабря:12};
    m=s.toLowerCase().match(/(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+(\d{4}))?/);
    if(m){const y=m[3]||new Date().getFullYear();return `${y}-${String(months[m[2]]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`}
    return '';
  }

  function routePoint44(){
    try{
      const r=typeof editorV13!=='undefined'&&Array.isArray(editorV13.route)?editorV13.route:[];
      if(r.length){const p=r[Math.floor(r.length/2)];return {lat:+p[0],lon:+p[1]}}
    }catch(e){}
    return null;
  }

  function weatherText44(code){
    const c=+code;
    if(c===0)return ['Ясно','sun'];
    if([1,2].includes(c))return ['Переменная облачность','partly'];
    if(c===3)return ['Облачно','cloud'];
    if([45,48].includes(c))return ['Туман','fog'];
    if([51,53,55,56,57].includes(c))return ['Морось','rain'];
    if([61,63,65,66,67,80,81,82].includes(c))return ['Дождь','rain'];
    if([71,73,75,77,85,86].includes(c))return ['Снег','snow'];
    if([95,96,99].includes(c))return ['Гроза','storm'];
    return ['Прогноз','partly'];
  }

  function weatherIcon44(kind){
    const common='viewBox="0 0 48 48" aria-hidden="true"';
    if(kind==='sun')return `<svg ${common}><circle cx="24" cy="24" r="8"/><path d="M24 4v7M24 37v7M4 24h7M37 24h7M9.9 9.9l5 5M33.1 33.1l5 5M38.1 9.9l-5 5M14.9 33.1l-5 5"/></svg>`;
    if(kind==='rain'||kind==='storm')return `<svg ${common}><path d="M14 31h22a8 8 0 0 0 0-16 12 12 0 0 0-23-2 9 9 0 0 0 1 18Z"/><path d="M17 36l-2 5M26 36l-2 5M35 36l-2 5"/></svg>`;
    if(kind==='snow')return `<svg ${common}><path d="M14 30h22a8 8 0 0 0 0-16 12 12 0 0 0-23-2 9 9 0 0 0 1 18Z"/><path d="M18 36v6M15 39h6M30 36v6M27 39h6"/></svg>`;
    return `<svg ${common}><path d="M14 31h22a8 8 0 0 0 0-16 12 12 0 0 0-23-2 9 9 0 0 0 1 18Z"/><circle cx="14" cy="12" r="6"/><path d="M14 2v4M4 12h4M20 12h4M7 5l3 3M21 5l-3 3"/></svg>`;
  }

  function weatherPlaceholder44(){
    const dateISO=eventDateISO44(S.event?.date), point=routePoint44();
    let title='Погода появится после выбора даты',detail='Координаты маршрута уже готовы для прогноза.';
    if(dateISO&&point){title='Загружаем прогноз…';detail='По координатам маршрута и дате похода.'}
    else if(dateISO&&!point){title='Маршрут пока не задан';detail='После сохранения трека появится прогноз.'}
    return `<div class="ov44-weather-body" id="ov44WeatherBody"><div class="ov44-weather-icon">${weatherIcon44('partly')}</div><div class="ov44-weather-copy"><strong>${safe(title)}</strong><span>${safe(detail)}</span></div></div>`;
  }

  function metric44(icon,label,value,detail,tone=''){
    return `<div class="ov44-metric ${tone}"><span class="ov44-metric-icon">${icon}</span><div><small>${safe(label)}</small><strong>${safe(value)}</strong><em>${safe(detail)}</em></div></div>`;
  }

  function ico44(type){
    const icons={
      route:'<path d="M5 18c2-5 4-8 7-8s4 3 7 3 4-3 5-7"/><circle cx="5" cy="18" r="2"/><circle cx="24" cy="6" r="2"/>',
      users:'<circle cx="9" cy="8" r="2.5"/><circle cx="17" cy="9" r="2"/><path d="M4 19c.4-3.5 2.2-5.3 5-5.3s4.6 1.8 5 5.3M14 14.5c.8-.8 1.7-1.2 2.7-1.2 2 0 3.4 1.4 3.8 4"/>',
      roles:'<circle cx="8" cy="8" r="2.5"/><path d="M3 19c.4-3.5 2.2-5.3 5-5.3 1.3 0 2.4.4 3.2 1.2"/><circle cx="17" cy="16" r="2.4"/><path d="M17 11.8v1M17 19.2v1M12.8 16h1M20.2 16h1"/>',
      gear:'<path d="M8 7V5.8A3.8 3.8 0 0 1 11.8 2h.4A3.8 3.8 0 0 1 16 5.8V7"/><rect x="5.5" y="6.5" width="13" height="15" rx="3"/><path d="M9 11h6M9 15h6"/>',
      alert:'<path d="M12 3 22 21H2L12 3Z"/><path d="M12 9v5M12 18h.01"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[type]||icons.route}</svg>`;
  }

  function overview44(){
    const me=(S.participants||[]).find(p=>p.id===S.current)||(S.participants||[])[0];
    const meId=me?.id||'',rs=routeStats44(),att=attention44(),tasks=nextTasks44(me),pr=me?progress(me.id):[0,0,0],roles=me?participantRoles(me.id):[],shared=me?participantShared(me.id):[];
    const yes=confirmedCount44(),maybe=maybeCount44(),roleDone=rolesDone44(),gearDone=gearDone44(),ready=typeof readiness==='function'?readiness():0;
    const roleMissing=Math.max(0,(S.roles||[]).length-roleDone),gearMissing=Math.max(0,(S.shared||[]).length-gearDone);
    const topAttention=att.all.slice(0,3);
    const subtitle=[S.event?.type,S.event?.duration].filter(Boolean).join(' · ');

    return `<div class="ov44-shell">
      <header class="ov44-hero-head"><div class="ov44-hero-copy"><div class="page-kicker">Командный штаб</div><h1>${safe(S.event?.short||S.event?.title||'Поход')}</h1><p>${safe(subtitle)}</p></div></header>
      <section class="ov44-top-grid">
        <div class="ov44-map-card"><div id="overviewMapV44" class="ov44-map"><div class="ov44-map-fallback">Маршрут загружается…</div></div><div class="ov44-map-actions"><button class="btn alt sm" data-v44-jump="route">Открыть маршрут</button></div></div>
        <aside class="ov44-right-stack">
          <section class="ov44-card ov44-readiness"><div class="ov44-card-head"><h2>Готовность группы</h2><span>${safe(ready)}%</span></div><div class="ov44-ready-row"><strong>${safe(ready)}%</strong><div class="ov44-ready-track"><i style="width:${Math.max(0,Math.min(100,ready))}%"></i></div></div><p>${yes} участников · ${att.count} ${att.count===1?'вопрос':'вопроса'}</p></section>
          <section class="ov44-card ov44-weather"><div class="ov44-card-head"><h2>Погода <small>(предварительно)</small></h2><button data-v44-weather type="button">Обновить</button></div>${weatherPlaceholder44()}</section>
        </aside>
      </section>
      <section class="ov44-metrics-strip">
        ${metric44(ico44('route'),'Маршрут',rs.distance,rs.duration)}
        ${metric44(ico44('users'),'Участники',String(yes),maybe?`${maybe} возможно`:'состав подтверждён')}
        ${metric44(ico44('roles'),'Роли',`${roleDone}/${(S.roles||[]).length}`,roleMissing?`${roleMissing} не закрыто`:'распределены')}
        ${metric44(ico44('gear'),'Снаряжение',`${gearDone}/${(S.shared||[]).length}`,gearMissing?`${gearMissing} дефицита`:'групповое закрыто')}
        ${metric44(ico44('alert'),'Внимание',String(att.count),att.count?'требует решения':'вопросов нет',att.count?'risk':'ok')}
      </section>
      <section class="ov44-main-grid">
        <section class="ov44-card ov44-my-prep"><div class="ov44-card-head"><h2>Моя подготовка</h2><button data-v44-jump="profile">Открыть профиль</button></div>
          <div class="ov44-prep-grid"><div class="ov44-person"><div class="avatar">${safe(initials(me?.name||(window.HikeSession?.signed?'У':'Г')))}</div><div><strong>${safe(me?.name||(window.HikeSession?.signed?'Участник':'Гость'))}</strong><span>${safe(roles.join(' · ')||'Роль не назначена')}</span></div></div>
          <div class="ov44-progress-block"><div><span>Снаряжение</span><b>${pr[0]} / ${pr[1]}</b></div><div class="ov44-progress"><i style="width:${pr[2]}%"></i></div></div>
          <div class="ov44-prep-lines"><button data-v44-jump="transport"><span>Транспорт туда</span><b>${safe(rideLabel(meId,'there'))}</b></button><button data-v44-jump="transport"><span>Транспорт обратно</span><b class="${['unset','need'].includes(S.rides?.back?.[meId])?'warn':''}">${safe(rideLabel(meId,'back'))}</b></button>${shared.length?`<button data-v44-jump="gear"><span>Групповое имущество</span><b>${safe(shared.join(' · '))}</b></button>`:''}</div></div>
          <div class="ov44-next-action"><span>Следующее действие</span><strong>${safe(tasks[0]?.text||'Критичных действий нет')}</strong>${tasks[0]?.tab?`<button data-v44-jump="${tasks[0].tab}">Открыть раздел →</button>`:''}</div>
        </section>
        <section class="ov44-card ov44-attention"><div class="ov44-card-head"><h2>Требует внимания <span>${att.count}</span></h2><button data-v44-jump="participants">Смотреть всё</button></div><div class="ov44-att-list">${topAttention.map(x=>`<button data-v44-jump="${x.tab}" class="${x.tone}"><i></i><span><b>${safe(x.title)}</b><small>${safe(x.detail)}</small></span><em>Открыть</em></button>`).join('')||'<div class="ov44-empty">Незакрытых вопросов нет.</div>'}</div></section>
      </section>
      <section class="ov44-bottom-grid">
        <section class="ov44-card ov44-links"><div class="ov44-card-head"><h2>Полезные разделы</h2></div><button data-v44-jump="route">Маршрут и трек <span>→</span></button><button data-v44-jump="plan">План дня <span>→</span></button><button data-v44-jump="gear">Чек-лист снаряжения <span>→</span></button><button data-v44-jump="food">Питание <span>→</span></button></section>
        <section class="ov44-card ov44-nearest"><div class="ov44-card-head"><h2>Ближайшие задачи</h2><button data-v44-jump="plan">Весь план</button></div>${tasks.map((t,i)=>`<button class="ov44-near-row ${t.tone}" ${t.tab?`data-v44-jump="${t.tab}"`:''}><i></i><span>${safe(t.text)}</span><em>${i===0?'сейчас':'далее'}</em></button>`).join('')}</section>
        <section class="ov44-scenic"><div class="ov44-scenic-copy"><strong>Люди. Природа. Движение.</strong><span>Больше, чем просто поход.</span></div><button data-v44-jump="route" aria-label="Открыть маршрут">→</button></section>
      </section>
    </div>`;
  }

  function initMap44(){
    if(tab!=='overview')return;
    const el=$('#overviewMapV44'); if(!el)return;
    try{if(map44){map44.remove();map44=null}}catch(e){}
    try{
      if(typeof L==='undefined'||typeof editorV13==='undefined'||!Array.isArray(editorV13.route)||editorV13.route.length<2){el.innerHTML='<div class="ov44-map-fallback">Маршрут пока не задан</div>';return}
      el.innerHTML='';
      map44=L.map(el,{zoomControl:true,attributionControl:true,scrollWheelZoom:false,dragging:true,tap:false});
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map44);
      const line=L.polyline(editorV13.route,{weight:5,opacity:.96,color:'#1f6b53'}).addTo(map44);
      const cps=typeof dynamicCpsV13==='function'?(dynamicCpsV13()||[]):[];
      cps.forEach(cp=>L.circleMarker([cp.lat,cp.lon],{radius:cp.number==='С'||cp.number==='Ф'?6:4,weight:2,color:'#1f6b53',fillColor:'#f8fbf8',fillOpacity:1}).addTo(map44));
      map44.fitBounds(line.getBounds(),{padding:[22,22]});
      setTimeout(()=>map44?.invalidateSize(),80);
    }catch(e){el.innerHTML='<div class="ov44-map-fallback">Не удалось отрисовать маршрут</div>'}
  }

  async function loadWeather44(){
    if(tab!=='overview')return;
    const body=$('#ov44WeatherBody'); if(!body)return;
    const dateISO=eventDateISO44(S.event?.date),point=routePoint44();
    if(!dateISO||!point){
      if(!dateISO) body.innerHTML=`<div class="ov44-weather-icon">${weatherIcon44('partly')}</div><div class="ov44-weather-copy"><strong>Погода появится после выбора даты</strong><span>Координаты маршрута уже готовы для прогноза.</span></div>`;
      else body.innerHTML=`<div class="ov44-weather-icon">${weatherIcon44('cloud')}</div><div class="ov44-weather-copy"><strong>Маршрут пока не задан</strong><span>После сохранения трека появится прогноз.</span></div>`;
      return;
    }
    const today=new Date();today.setHours(0,0,0,0);const d=new Date(`${dateISO}T00:00:00`);const days=Math.round((d-today)/86400000);
    if(days<0){body.innerHTML=`<div class="ov44-weather-icon">${weatherIcon44('cloud')}</div><div class="ov44-weather-copy"><strong>Дата уже прошла</strong><span>Для обзора нужен будущий прогноз.</span></div>`;return}
    if(days>16){body.innerHTML=`<div class="ov44-weather-icon">${weatherIcon44('partly')}</div><div class="ov44-weather-copy"><strong>Прогноз будет доступен ближе к дате</strong><span>Сервис даёт прогноз до 16 дней вперёд.</span></div>`;return}
    body.innerHTML=`<div class="ov44-weather-icon">${weatherIcon44('partly')}</div><div class="ov44-weather-copy"><strong>Загружаем прогноз…</strong><span>По координатам маршрута.</span></div>`;
    try{
      const q=new URLSearchParams({latitude:String(point.lat),longitude:String(point.lon),daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',timezone:'auto',wind_speed_unit:'ms',start_date:dateISO,end_date:dateISO});
      const r=await fetch(`https://api.open-meteo.com/v1/forecast?${q}`);if(!r.ok)throw new Error(`weather ${r.status}`);const j=await r.json();
      const dly=j.daily||{},code=dly.weather_code?.[0],mx=dly.temperature_2m_max?.[0],mn=dly.temperature_2m_min?.[0],rain=dly.precipitation_probability_max?.[0],wind=dly.wind_speed_10m_max?.[0],wt=weatherText44(code);
      body.innerHTML=`<div class="ov44-weather-icon">${weatherIcon44(wt[1])}</div><div class="ov44-weather-copy ov44-weather-live"><div><strong>${Number.isFinite(mx)?`${Math.round(mx)}°`:'—'}</strong><span>${safe(wt[0])}${Number.isFinite(mn)?` · минимум ${Math.round(mn)}°`:''}</span></div><dl><div><dt>Ветер</dt><dd>${Number.isFinite(wind)?`${wind.toFixed(1).replace('.',',')} м/с`:'—'}</dd></div><div><dt>Осадки</dt><dd>${Number.isFinite(rain)?`${Math.round(rain)}%`:'—'}</dd></div></dl></div>`;
    }catch(e){body.innerHTML=`<div class="ov44-weather-icon">${weatherIcon44('cloud')}</div><div class="ov44-weather-copy"><strong>Прогноз временно недоступен</strong><span>Остальные данные похода работают без погоды.</span></div>`}
  }

  function guestAccess44(){
    const me=(S.participants||[]).find(p=>p.id===S.current)||(S.participants||[])[0];
    if(me)return;
    const card=$('.ov44-my-prep');
    if(!card)return;
    card.innerHTML='<div class="ov44-card-head"><h2>Присоединиться к походу</h2></div><div class="ov44-empty"><strong>Вы пока не вошли.</strong><br>Нажмите «Войти» в верхней панели, укажите email и отправьте заявку на участие.</div>';
  }

  function bind44(){
    document.body.classList.toggle('ov44-active',tab==='overview');
    if(tab!=='overview')return;
    guestAccess44();
    document.querySelectorAll('[data-v44-jump]').forEach(b=>b.onclick=()=>{const target=b.dataset.v44Jump;if(!target)return;tab=target;render()});
    document.querySelector('[data-v44-weather]')?.addEventListener('click',loadWeather44);
    requestAnimationFrame(()=>{initMap44();loadWeather44()});
  }

  const baseBind44=bind;
  bind=function(){baseBind44();bind44()};
  overview=overview44;
  document.querySelector('.build-label')?.replaceChildren(document.createTextNode('V44 · обзор похода'));
  render();
})();
