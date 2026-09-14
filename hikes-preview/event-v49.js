/* V49 — event facts are separate from route timing and editable by the organizer. */
(() => {
  'use strict';

  const PROJECT_URL='https://qmnjsvifwcutjailxdug.supabase.co';
  const PUBLISHABLE_KEY='sb_publishable_R1n0gwDrWkKn0-D5nuaz3Q_jRjTFwTD';
  const EVENT_SLUG='tominsky-lesopark';
  const AUTH_KEY='rl_hike_auth_v42';
  let eventRow=null;

  const session=()=>{try{return JSON.parse(localStorage.getItem(AUTH_KEY)||'null')}catch(e){return null}};
  const isOrganizer=()=>document.body.classList.contains('hike-organizer');
  const safe=v=>typeof esc==='function'?esc(v):String(v??'');
  const plural=(n,one,few,many)=>{const a=Math.abs(Number(n)||0)%100,b=a%10;return a>10&&a<20?many:b===1?one:b>=2&&b<=4?few:many};
  const durationLabel=row=>{
    const days=Math.max(1,Number(row?.duration_days)||1);
    if(!row?.overnight)return `${days} ${plural(days,'день','дня','дней')}`;
    const nights=Math.max(1,days-1);
    return `${days} ${plural(days,'день','дня','дней')} · ${nights} ${plural(nights,'ночь','ночи','ночей')}`;
  };
  const russianDate=value=>{
    if(!value)return 'Дата уточняется';
    const date=new Date(value);
    return Number.isNaN(date.getTime())?'Дата уточняется':new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(date);
  };
  const toLocal=value=>{
    if(!value)return '';
    const d=new Date(value);if(Number.isNaN(d.getTime()))return '';
    const pad=n=>String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const meetingParts=raw=>{
    const text=String(raw||'').trim();
    const match=text.match(/^\s*(\d{1,2}:\d{2})\s*(?:[·—–-]\s*)?(.*)$/);
    return match?{time:match[1],place:(match[2]||'').trim()}:{time:'',place:text};
  };

  async function request(path,options={}){
    const auth=session();
    const headers={apikey:PUBLISHABLE_KEY,'Content-Type':'application/json',...(options.headers||{})};
    if(auth?.access_token)headers.Authorization=`Bearer ${auth.access_token}`;
    const response=await fetch(`${PROJECT_URL}${path}`,{method:options.method||'GET',headers,body:options.body===undefined?undefined:JSON.stringify(options.body)});
    const body=await response.json().catch(()=>null);
    if(!response.ok)throw new Error(body?.message||body?.error_description||`Ошибка сервера (${response.status})`);
    return body;
  }

  function apply(row){
    if(!row||typeof S==='undefined'||!S?.event)return;
    eventRow=row;
    S.event.date=russianDate(row.starts_at);
    S.event.meeting=row.meeting_label||'Время и точка уточняются';
    S.event.duration=durationLabel(row);
    S.event.durationDays=Math.max(1,Number(row.duration_days)||1);
    S.event.overnight=!!row.overnight;
    S.event.status=({planning:'Подготовка',open:'Регистрация открыта',closed:'Набор закрыт',cancelled:'Отменён'})[row.status]||'Подготовка';
  }

  async function load(){
    const auth=session();if(!auth?.access_token)return null;
    const rows=await request(`/rest/v1/hike_events?slug=eq.${encodeURIComponent(EVENT_SLUG)}&select=*`);
    const row=rows?.[0]||null;if(row)apply(row);return row;
  }

  function focusLater(selector){if(!selector)return;requestAnimationFrame(()=>document.querySelector(selector)?.focus())}

  async function openEditor(focus=''){
    if(!isOrganizer()){if(typeof toast==='function')toast('Редактирование доступно организатору');return}
    const row=eventRow||await load();if(!row){if(typeof toast==='function')toast('Не удалось загрузить параметры похода');return}
    const meeting=meetingParts(row.meeting_label),start=toLocal(row.starts_at),deadline=toLocal(row.reply_deadline),days=Math.max(1,Number(row.duration_days)||1);
    openModal('Основная информация о походе',`<div class="form-grid hike-settings-form v49-event-form">
      <div class="field full"><label>Название<input id="evTitle" value="${safe(row.title||'')}"></label></div>
      <div class="field"><label>Дата и время старта<input id="evStart" type="datetime-local" value="${safe(start)}"></label></div>
      <div class="field"><label>Время сбора<input id="evMeetTime" type="time" value="${safe(meeting.time)}"></label></div>
      <div class="field full"><label>Место сбора<input id="evMeetPlace" value="${safe(meeting.place)}" placeholder="Например: парковка у входа в лесопарк"></label></div>
      <div class="field"><label>Количество дней<input id="evDays" type="number" min="1" max="30" value="${days}"></label></div>
      <div class="field"><label class="v49-check"><input id="evOvernight" type="checkbox" ${row.overnight?'checked':''}><span>С ночёвкой</span></label></div>
      <div class="field"><label>Дедлайн ответа<input id="evDeadline" type="datetime-local" value="${safe(deadline)}"></label></div>
      <div class="field"><label>Лимит участников<input id="evLimit" type="number" min="1" value="${row.participant_limit||''}"></label></div>
      <div class="field full"><label>Статус<select id="evStatus"><option value="planning" ${row.status==='planning'?'selected':''}>Подготовка</option><option value="open" ${row.status==='open'?'selected':''}>Регистрация открыта</option><option value="closed" ${row.status==='closed'?'selected':''}>Набор закрыт</option><option value="cancelled" ${row.status==='cancelled'?'selected':''}>Отменён</option></select></label></div>
    </div>`,async layer=>{
      const title=layer.querySelector('#evTitle').value.trim();if(!title){toast('Укажи название похода');return false}
      const starts=layer.querySelector('#evStart').value,meetTime=layer.querySelector('#evMeetTime').value,meetPlace=layer.querySelector('#evMeetPlace').value.trim(),deadlineValue=layer.querySelector('#evDeadline').value,limit=layer.querySelector('#evLimit').value,daysValue=Math.max(1,Number(layer.querySelector('#evDays').value)||1),overnight=layer.querySelector('#evOvernight').checked;
      const meetingLabel=[meetTime,meetPlace].filter(Boolean).join(' · ')||null;
      const rows=await request(`/rest/v1/hike_events?slug=eq.${encodeURIComponent(EVENT_SLUG)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:{title,starts_at:starts?new Date(starts).toISOString():null,meeting_label:meetingLabel,duration_days:daysValue,overnight,reply_deadline:deadlineValue?new Date(deadlineValue).toISOString():null,participant_limit:limit?Number(limit):null,status:layer.querySelector('#evStatus').value}});
      const next=rows?.[0]||row;apply(next);if(typeof save==='function')save();render();toast('Параметры похода сохранены');return true;
    });
    focusLater(focus);
  }

  function wireOrganizerControls(){
    if(!isOrganizer())return;
    const settings=document.getElementById('hikeSettingsButton');if(settings)settings.onclick=()=>openEditor('#evTitle');
    const switcher=document.getElementById('eventSwitcher');if(switcher)switcher.onclick=()=>openEditor('#evTitle');
  }

  window.HikeEventV49={load,openEditor,durationLabel,get event(){return eventRow}};
  const baseRender=render;
  render=function renderV49(){const result=baseRender();if(eventRow)apply(eventRow);wireOrganizerControls();return result};

  const observer=new MutationObserver(()=>wireOrganizerControls());
  observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  load().then(row=>{if(row)render()}).catch(error=>console.warn('V49 event load failed',error));
})();
