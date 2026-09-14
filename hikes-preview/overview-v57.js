/* V58 — reuse the existing Overview facts row; no duplicate cards. */
(() => {
  'use strict';

  const plural=(n,one,few,many)=>{const a=Math.abs(Number(n)||0)%100,b=a%10;return a>10&&a<20?many:b===1?one:b>=2&&b<=4?few:many};
  const organizerView=()=>document.body.classList.contains('hike-organizer')||!!window.HikeAccessV47?.access?.().admin;
  const durationFromRow=row=>{
    const days=Math.max(1,Number(row?.duration_days)||1);
    const overnight=!!row?.overnight;
    if(!overnight)return `${days} ${plural(days,'день','дня','дней')}`;
    const nights=Math.max(1,days-1);
    return `${days} ${plural(days,'день','дня','дней')} · ${nights} ${plural(nights,'ночь','ночи','ночей')}`;
  };
  const meetingParts=raw=>{
    const text=String(raw||'').trim();
    if(!text||text==='Время и точка уточняются')return {time:'',place:''};
    const match=text.match(/^\s*(\d{1,2}:\d{2})\s*(?:[·—–-]\s*)?(.*)$/);
    return match?{time:match[1],place:(match[2]||'').trim()}:{time:'',place:text};
  };
  const eventDuration=()=>{
    const row=window.HikeEventV49?.event;
    if(row)return durationFromRow(row);
    const raw=String(S?.event?.duration||'').trim();
    if(raw&&!/^\d+\s*ч(?:\s|$)/i.test(raw)&&raw!=='1 день')return raw;
    return '2 дня · 1 ночь';
  };
  const editIcon=()=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5 8 18.8 18.2 8.6a2 2 0 0 0-2.8-2.8L5.2 16zM13.8 7.4l2.8 2.8"/></svg>';

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
    if(!raw||/^\d+\s*ч(?:\s|$)/i.test(raw)||raw==='1 день'){
      S.event.duration='2 дня · 1 ночь';
      S.event.durationDays=2;
      S.event.overnight=true;
    }
  }

  function setFact(card,value,detail,focus,editable){
    if(!card)return;
    const strong=card.querySelector('strong');if(strong){strong.textContent=value;strong.title=value}
    let em=card.querySelector('em');
    if(detail){
      if(!em){em=document.createElement('em');card.querySelector('div:nth-child(2)')?.appendChild(em)}
      if(em){em.textContent=detail;em.title=detail}
    }else em?.remove();
    card.querySelectorAll('.ov48-fact-edit,.ov57-fact-edit').forEach(node=>node.remove());
    card.classList.toggle('ov57-is-editable',editable);
    if(!editable)return;
    const button=document.createElement('button');
    button.type='button';button.className='ov57-fact-edit';button.dataset.v57Edit=focus;button.setAttribute('aria-label','Редактировать');button.innerHTML=editIcon();
    button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();window.HikeEventV49?.openEditor?.(focus)});
    card.appendChild(button);
  }

  function decorate(){
    normalizeEventDuration();
    if(typeof tab!=='undefined'&&tab!=='overview')return;
    const shell=document.querySelector('.ov44-shell');if(!shell)return;
    shell.querySelectorAll('.ov57-event-facts').forEach(node=>node.remove());
    const cards=[...shell.querySelectorAll('.ov48-event-facts .ov48-fact')];if(cards.length<4)return;
    const meeting=meetingParts(S?.event?.meeting),editable=organizerView();
    setFact(cards[0],S?.event?.date||'Дата уточняется','Дата начала похода','#evStart',editable);
    setFact(cards[1],meeting.place||'Место уточняется','Точка общего сбора','#evMeetPlace',editable);
    setFact(cards[2],meeting.time||'Время уточняется','До выхода на маршрут','#evMeetTime',editable);
    setFact(cards[3],eventDuration(),'Длительность всего похода','#evDays',editable);
  }

  const beforeRender=render;
  render=function renderV58(){const out=beforeRender();requestAnimationFrame(decorate);return out};
  const beforeBind=bind;
  bind=function bindV58(){beforeBind();decorate()};
  window.HikeOverviewV57={decorate,eventDuration};
  queueMicrotask(decorate);
})();
