/* V58 — remove duplicate Overview facts and make organizer preview editing functional. */
(() => {
  'use strict';

  const safe=v=>typeof esc==='function'?esc(v):String(v??'');
  const previewAdmin=()=>!!window.HikeAccessV47?.access?.().admin;
  const cloudOrganizer=()=>document.body.classList.contains('hike-organizer');
  const plural=(n,one,few,many)=>{const a=Math.abs(Number(n)||0)%100,b=a%10;return a>10&&a<20?many:b===1?one:b>=2&&b<=4?few:many};
  const duration=(days,overnight)=>{
    const d=Math.max(1,Number(days)||1);
    if(!overnight)return `${d} ${plural(d,'день','дня','дней')}`;
    const n=Math.max(1,d-1);
    return `${d} ${plural(d,'день','дня','дней')} · ${n} ${plural(n,'ночь','ночи','ночей')}`;
  };
  const meetingParts=raw=>{
    const text=String(raw||'').trim();
    if(!text||/^время и точка уточняются$/i.test(text))return {time:'',place:''};
    const m=text.match(/^\s*(\d{1,2}:\d{2})\s*(?:[·—–-]\s*)?(.*)$/);
    return m?{time:m[1],place:(m[2]||'').trim()}:{time:'',place:text};
  };
  const editIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5 8 18.8 18.2 8.6a2 2 0 0 0-2.8-2.8L5.2 16zM13.8 7.4l2.8 2.8"/></svg>';

  function setFact(card,value,detail,focus){
    if(!card)return;
    const strong=card.querySelector('strong');if(strong){strong.textContent=value;strong.title=value}
    let em=card.querySelector('em');
    if(!em){em=document.createElement('em');card.querySelector('div:nth-child(2)')?.appendChild(em)}
    if(em){em.textContent=detail;em.title=detail}
    card.querySelectorAll('.ov48-fact-edit,.ov57-fact-edit,.v58-fact-edit').forEach(n=>n.remove());
    const editable=previewAdmin()||cloudOrganizer();
    card.classList.toggle('v58-editable',editable);
    if(!editable)return;
    const b=document.createElement('button');b.type='button';b.className='v58-fact-edit';b.dataset.v58Focus=focus;b.setAttribute('aria-label','Редактировать');b.innerHTML=editIcon;
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();window.HikeEventV49?.openEditor?.(focus)});
    card.appendChild(b);
  }

  function decorateFacts(){
    if(typeof tab!=='undefined'&&tab!=='overview')return;
    const shell=document.querySelector('.ov44-shell');if(!shell)return;
    shell.querySelectorAll('.ov57-event-facts').forEach(n=>n.remove());
    const cards=[...shell.querySelectorAll('.ov48-event-facts .ov48-fact')];if(cards.length<4)return;
    const meet=meetingParts(S?.event?.meeting);
    const d=window.HikeEventV49?.event?.duration_days||S?.event?.durationDays||2;
    const overnight=window.HikeEventV49?.event?.overnight ?? (S?.event?.overnight!==false);
    setFact(cards[0],S?.event?.date||'Дата уточняется','Дата начала похода','#evStart');
    setFact(cards[1],meet.place||'Место уточняется','Точка общего сбора','#evMeetPlace');
    setFact(cards[2],meet.time||'Время уточняется','До выхода на маршрут','#evMeetTime');
    setFact(cards[3],duration(d,overnight),'Длительность всего похода','#evDays');
    const build=document.querySelector('.build-label');if(build)build.textContent='V58 · стабильная сборка';
  }

  function statusCode(value){return ({'Подготовка':'planning','Регистрация открыта':'open','Набор закрыт':'closed','Отменён':'cancelled'})[value]||'planning'}
  function statusText(value){return ({planning:'Подготовка',open:'Регистрация открыта',closed:'Набор закрыт',cancelled:'Отменён'})[value]||'Подготовка'}

  function localEditor(focus=''){
    if(!previewAdmin()){if(typeof toast==='function')toast('Редактирование доступно организатору');return}
    const row=window.HikeEventV49?.event||{};
    const meet=meetingParts(S?.event?.meeting||row.meeting_label);
    const days=Math.max(1,Number(row.duration_days||S?.event?.durationDays)||2);
    const overnight=row.overnight ?? (S?.event?.overnight!==false);
    const start=S?.event?._previewStart||'';
    const status=row.status||statusCode(S?.event?.status);
    openModal('Основная информация о походе',`<div class="form-grid hike-settings-form v49-event-form">
      <div class="field full"><label>Название<input id="evTitle" value="${safe(row.title||S?.event?.title||S?.event?.short||'Томинский лесопарк · поход-тренировка')}"></label></div>
      <div class="field"><label>Дата и время старта<input id="evStart" type="datetime-local" value="${safe(start)}"></label></div>
      <div class="field"><label>Время сбора<input id="evMeetTime" type="time" value="${safe(meet.time)}"></label></div>
      <div class="field full"><label>Место сбора<input id="evMeetPlace" value="${safe(meet.place)}" placeholder="Например: парковка у входа в лесопарк"></label></div>
      <div class="field"><label>Количество дней<input id="evDays" type="number" min="1" max="30" value="${days}"></label></div>
      <div class="field"><label class="v49-check"><input id="evOvernight" type="checkbox" ${overnight?'checked':''}><span>С ночёвкой</span></label></div>
      <div class="field full"><label>Статус<select id="evStatus"><option value="planning" ${status==='planning'?'selected':''}>Подготовка</option><option value="open" ${status==='open'?'selected':''}>Регистрация открыта</option><option value="closed" ${status==='closed'?'selected':''}>Набор закрыт</option><option value="cancelled" ${status==='cancelled'?'selected':''}>Отменён</option></select></label></div>
    </div>`,layer=>{
      const title=layer.querySelector('#evTitle').value.trim();if(!title){toast('Укажи название похода');return false}
      const starts=layer.querySelector('#evStart').value,meetTime=layer.querySelector('#evMeetTime').value,meetPlace=layer.querySelector('#evMeetPlace').value.trim(),daysValue=Math.max(1,Number(layer.querySelector('#evDays').value)||1),night=layer.querySelector('#evOvernight').checked,st=layer.querySelector('#evStatus').value;
      S.event.title=title;S.event.durationDays=daysValue;S.event.overnight=night;S.event.duration=duration(daysValue,night);S.event.meeting=[meetTime,meetPlace].filter(Boolean).join(' · ')||'Время и точка уточняются';S.event.status=statusText(st);S.event._previewStart=starts;
      S.event.date=starts?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(new Date(starts)):'Дата уточняется';
      if(typeof save==='function')save();render();toast('Изменения сохранены в режиме проверки');return true;
    });
    requestAnimationFrame(()=>document.querySelector(focus)?.focus());
  }

  function patchEditor(){
    const api=window.HikeEventV49;if(!api||api.__v58Patched)return false;
    const original=api.openEditor.bind(api);
    api.openEditor=focus=>cloudOrganizer()?original(focus):localEditor(focus);
    api.__v58Patched=true;
    return true;
  }

  let scheduled=false;
  const refresh=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;patchEditor();decorateFacts()})};
  const observer=new MutationObserver(refresh);
  const boot=()=>{observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});refresh()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('load',()=>{const timer=setInterval(()=>{refresh();if(patchEditor()&&document.querySelector('.ov48-event-facts')){clearInterval(timer);refresh()}},80);setTimeout(()=>clearInterval(timer),5000)},{once:true});
})();
