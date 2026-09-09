/* V17 — flexible route plan: independent breaks, pace profiles, copyable CP coordinates and electronic exports. */
const PLAN_V23_MIGRATION='rl_plan_v23_breaks_v1';
const PACE_PROFILES_V23={
  working:{label:'Рабочий темп',short:'Рабочий',hint:'Идём собранно и держим график.',speeds:{road:5.0,trail:4.2,clearing:3.1,forest:2.3,unknown:3.6}},
  relaxed:{label:'Спокойный темп',short:'Спокойный',hint:'Прогулочный режим без задачи идти быстро.',speeds:{road:4.0,trail:3.4,clearing:2.5,forest:1.8,unknown:3.0}}
};
const TERRAIN_META_V23={
  road:{label:'Дорога',hint:'Широкая дорога или грунтовка: спокойно проходит велосипед/мопед.'},
  trail:{label:'Тропа',hint:'Пешая извилистая тропа, где велосипеду уже заметно сложнее.'},
  clearing:{label:'Трудный проход',hint:'Заросшая тропа, плохая просека, кусты или местами бурелом.'},
  forest:{label:'Лес / без тропы',hint:'Движение напрямую через лес без нормального пути.'},
  unknown:{label:'Не задано',hint:'Пока участок не классифицирован вручную.'}
};

if(typeof TERRAIN_V13!=='undefined'){
  TERRAIN_V13.road.label=TERRAIN_META_V23.road.label;
  TERRAIN_V13.trail.label=TERRAIN_META_V23.trail.label;
  TERRAIN_V13.clearing.label=TERRAIN_META_V23.clearing.label;
  TERRAIN_V13.forest.label=TERRAIN_META_V23.forest.label;
  TERRAIN_V13.unknown.label=TERRAIN_META_V23.unknown.label;
}

function ensurePlanV23(){
  if(!editorV13.plan||typeof editorV13.plan!=='object')editorV13.plan={};
  const p=editorV13.plan;
  if(!['working','relaxed'].includes(p.profile))p.profile='working';
  if(!Number.isFinite(+p.reservePct))p.reservePct=10;
  if(!p.speedProfiles||typeof p.speedProfiles!=='object')p.speedProfiles={};
  Object.entries(PACE_PROFILES_V23).forEach(([k,v])=>{
    p.speedProfiles[k]={...v.speeds,...(p.speedProfiles[k]||{})};
  });
  if(!Array.isArray(p.breaks))p.breaks=[];
  if(!Array.isArray(editorV13.marks))editorV13.marks=[];
  let migrated=false;
  try{migrated=localStorage.getItem(PLAN_V23_MIGRATION)==='1'}catch(e){}
  if(!migrated){
    (editorV13.cps||[]).forEach(cp=>{
      const min=Math.max(0,+cp.stopMin||0);
      if(min&&cp.id!=='cpf')p.breaks.push({id:'br_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),title:min>=45?'Обед':'Перерыв',minutes:min,afterCpId:cp.id});
      cp.stopMin=0;
    });
    try{localStorage.setItem(PLAN_V23_MIGRATION,'1')}catch(e){}
    persistPlanV23();
  }
  syncLegacySpeedsV23();
  return p;
}
function syncLegacySpeedsV23(){
  const p=editorV13.plan||{},profile=PACE_PROFILES_V23[p.profile]?p.profile:'working',src=p.speedProfiles?.[profile]||PACE_PROFILES_V23[profile].speeds;
  editorV13.speeds={...(editorV13.speeds||{}),...src};
}
function persistPlanV23(){
  try{persistEditorV15()}catch(e){try{localStorage.setItem(EDITOR_V13_KEY,JSON.stringify(editorV13));syncEventV13()}catch(_e){}}
}
function planProfileV23(){ensurePlanV23();return editorV13.plan.profile}
function profileSpeedV23(type){const p=ensurePlanV23(),profile=planProfileV23();return Math.max(.5,+p.speedProfiles?.[profile]?.[type]||PACE_PROFILES_V23[profile].speeds[type]||3)}
function reservePctV23(){return Math.max(0,Math.min(50,+ensurePlanV23().reservePct||0))}
function breaksV23(){return ensurePlanV23().breaks}
function breaksAfterV23(cpId){return breaksV23().filter(b=>b.afterCpId===cpId)}
function breaksTotalV23(){return breaksV23().reduce((s,b)=>s+Math.max(0,+b.minutes||0),0)}
function fmtMinutesV23(min){min=Math.max(0,Math.round(min));const h=Math.floor(min/60),m=min%60;return h?`${h} ч${m?' '+m+' мин':''}`:`${m} мин`}

terrainSpeedV13=function(i){const t=editorV13.terrain[i]||'unknown';return profileSpeedV23(t)};
function rawTravelMinV23(toM){
  const cum=routeCumV13();let left=Math.max(0,+toM||0),min=0;
  for(let i=0;i<cum.length-1&&left>0;i++){
    const seg=Math.max(0,cum[i+1]-cum[i]),use=Math.min(left,seg);min+=(use/1000)/terrainSpeedV13(i)*60;left-=use;
  }
  return min;
}
function plannedTravelMinV23(toM){return rawTravelMinV23(toM)*(1+reservePctV23()/100)}
routeTravelMinToV13=plannedTravelMinV23;

dynamicCpsV13=function(){
  ensurePlanV23();
  const arr=(editorV13.cps||[]).map(cp=>{const n=nearestRouteV13(cp.lat,cp.lon);return {...cp,near:n,along:n?.along||0,stopMin:0}});
  const start=arr.find(c=>c.id==='cp0'),finish=arr.find(c=>c.id==='cpf'),middle=arr.filter(c=>c.id!=='cp0'&&c.id!=='cpf').sort((a,b)=>a.along-b.along),order=[];
  if(start)order.push(start);order.push(...middle);if(finish)order.push(finish);
  const startMin=parseClockV13(editorV13.start),total=routeLenV13();let pauseBefore=0,midNo=0;
  return order.map(cp=>{
    const along=cp.id==='cp0'?0:cp.id==='cpf'?total:Math.max(0,Math.min(total,cp.along));
    const number=cp.id==='cp0'?'С':cp.id==='cpf'?'Ф':String(++midNo),eta=startMin+plannedTravelMinV23(along)+pauseBefore;
    const out={...cp,number,km:along/1000,arrival:fmtClockV13(eta),stopMin:0};
    pauseBefore+=breaksAfterV23(cp.id).reduce((s,b)=>s+Math.max(0,+b.minutes||0),0);
    return out;
  });
};
finalEtaV13=function(){const cps=dynamicCpsV13();return cps[cps.length-1]?.arrival||'—'};
routeDurationMinV13=function(){const a=parseClockV13(editorV13.start),b=parseClockV13(finalEtaV13());return b>=a?b-a:b+1440-a};

function breakTimelineV23(){
  const cps=dynamicCpsV13(),events=[];
  cps.forEach(cp=>{
    events.push({kind:'cp',cp,time:cp.arrival});
    let cursor=parseClockV13(cp.arrival);
    breaksAfterV23(cp.id).forEach(b=>{const min=Math.max(0,+b.minutes||0),start=fmtClockV13(cursor),end=fmtClockV13(cursor+min);events.push({kind:'break',break:b,after:cp,start,end});cursor+=min});
  });
  return events;
}
function cpAnchorIdsV23(){return dynamicCpsV13().filter(cp=>cp.id!=='cpf').map(cp=>cp.id)}
function normalizeBreakAnchorV23(b){const ids=cpAnchorIdsV23();if(!ids.includes(b.afterCpId))b.afterCpId=ids[0]||'cp0'}
function addBreakV23(afterCpId){ensurePlanV23();const ids=cpAnchorIdsV23();const anchor=ids.includes(afterCpId)?afterCpId:(ids[1]||ids[0]||'cp0');editorV13.plan.breaks.push({id:'br_'+Date.now(),title:'Перерыв',minutes:10,afterCpId:anchor});persistPlanV23();render();toast('Перерыв добавлен')}
function updateBreakV23(id,patch){const b=breaksV23().find(x=>x.id===id);if(!b)return;Object.assign(b,patch);b.minutes=Math.max(0,Math.min(240,+b.minutes||0));normalizeBreakAnchorV23(b);persistPlanV23();render()}
function deleteBreakV23(id){editorV13.plan.breaks=breaksV23().filter(x=>x.id!==id);persistPlanV23();render();toast('Перерыв удалён')}
function moveBreakV23(id,dir){const b=breaksV23().find(x=>x.id===id),ids=cpAnchorIdsV23();if(!b||!ids.length)return;let i=Math.max(0,ids.indexOf(b.afterCpId));i=Math.max(0,Math.min(ids.length-1,i+dir));b.afterCpId=ids[i];persistPlanV23();render()}

function routePlanStatsV23(){const base=rawTravelMinV23(routeLenV13()),reserve=base*reservePctV23()/100,pauses=breaksTotalV23();return {base,reserve,pauses,total:base+reserve+pauses}}
function speedCardsV23(){
  const p=ensurePlanV23(),profile=planProfileV23(),order=['road','trail','clearing','forest'];
  return `<div class="pace-profiles-v23"><button data-profile-v23="working" class="${profile==='working'?'active':''}"><b>Рабочий</b><small>${PACE_PROFILES_V23.working.hint}</small></button><button data-profile-v23="relaxed" class="${profile==='relaxed'?'active':''}"><b>Спокойный</b><small>${PACE_PROFILES_V23.relaxed.hint}</small></button></div><div class="speed-cards-v23">${order.map(k=>`<label><span><b>${TERRAIN_META_V23[k].label}</b><small>${TERRAIN_META_V23[k].hint}</small></span><em><input type="number" min="0.5" max="8" step="0.1" data-speed-v23="${k}" value="${(+p.speedProfiles[profile][k]).toFixed(1)}"> км/ч</em></label>`).join('')}</div><div class="speed-fallback-v23">Не классифицированный участок: <b>${(+p.speedProfiles[profile].unknown).toFixed(1)} км/ч</b>. Тип поверхности можно назначать по участкам в полноэкранном редакторе.</div>`;
}
function routeTimelineHtmlV23(){
  const ev=breakTimelineV23();
  return `<div class="route-timeline-v23">${ev.map((x,i)=>{
    if(x.kind==='cp'){
      const cp=x.cp,next=ev.slice(i+1).find(y=>y.kind==='cp')?.cp,az=next?Math.round(bearingV13([cp.lat,cp.lon],[next.lat,next.lon])):null;
      return `<article class="plan-cp-v23" data-cp-anchor="${cp.id}"><div class="plan-time-v23">${cp.arrival}</div><div class="plan-dot-v23 ${cp.number==='С'||cp.number==='Ф'?'endpoint':''}">${cp.number}</div><div class="plan-main-v23"><div><b>${esc(cp.title)}</b><span>${cp.km.toFixed(1).replace('.',',')} км · ${gridCodeDynamicV13(cp.lat,cp.lon)}${az!==null?' · дальше '+az+'°':''}</span></div><div class="plan-coords-v23"><code>${cp.lat.toFixed(6)}, ${cp.lon.toFixed(6)}</code><button data-copy-cp-v23="${cp.id}">Копировать</button><button data-open-cp-v23="${cp.id}">Карта ↗</button></div></div>${cp.id!=='cpf'?`<button class="plan-add-break-v23" data-add-break-v23="${cp.id}" title="Добавить перерыв после этой точки">＋ перерыв</button>`:''}</article><div class="plan-drop-v23" data-break-drop-v23="${cp.id}">Перетащить перерыв сюда</div>`;
    }
    const b=x.break;
    return `<article class="plan-break-v23" draggable="true" data-break-id-v23="${b.id}"><div class="plan-time-v23">${x.start}<small>→ ${x.end}</small></div><div class="plan-break-icon-v23">Ⅱ</div><div class="plan-break-main-v23"><input list="breakTypesV23" data-break-title-v23="${b.id}" value="${esc(b.title||'Перерыв')}" aria-label="Название перерыва"><label><input type="number" min="0" max="240" step="5" data-break-min-v23="${b.id}" value="${Math.max(0,+b.minutes||0)}"> мин</label><span>После: ${esc(x.after.title)}</span></div><div class="plan-break-actions-v23"><button data-break-up-v23="${b.id}" title="Выше">↑</button><button data-break-down-v23="${b.id}" title="Ниже">↓</button><button data-break-del-v23="${b.id}" title="Удалить">×</button></div></article>`;
  }).join('')}<datalist id="breakTypesV23"><option value="Перерыв"><option value="Перекур"><option value="Обед"><option value="Отдых"><option value="Сбор группы"><option value="Навигационная пауза"></datalist></div>`;
}
function cpRowsDynamicV23(){return dynamicCpsV13().map(cp=>`<div class="cp-row-v23"><button class="cp-focus-v23" data-cp-dyn-v13="${cp.id}" type="button"><span class="cp-index">${cp.number}</span><span class="cp-main"><b>${esc(cp.title)}</b><small><span class="grid-code-v12">${gridCodeDynamicV13(cp.lat,cp.lon)}</span>${cp.km.toFixed(1).replace('.',',')} км</small></span><span class="cp-time">${cp.arrival}</span></button><div class="cp-coordline-v23"><code>${cp.lat.toFixed(6)}, ${cp.lon.toFixed(6)}</code><button type="button" data-copy-cp-v23="${cp.id}">Копировать</button><button type="button" data-open-cp-v23="${cp.id}">Открыть ↗</button></div></div>`).join('')}
cpRowsDynamicV13=cpRowsDynamicV23;

function planPageV23(){
  ensurePlanV23();const stats=routePlanStatsV23(),profile=PACE_PROFILES_V23[planProfileV23()];
  const org=`<div class="timeline-head"><span>Время</span><span>Этап</span><span>Ответственный</span><span>Маршрут</span><span></span></div>${S.timeline.map(t=>`<div class="timeline-row"><div class="timeline-time">${esc(t.time)}</div><div><b>${esc(t.title)}</b><small>${esc(t.note||'')}</small></div><div>${esc(pn(t.owner))}</div><div>${t.route?esc(routeName(t.route)):'—'}</div><div class="row-actions"><button class="icon-btn" data-edit-time="${t.id}" title="Редактировать">✎</button><button class="icon-btn" data-del-time="${t.id}" title="Удалить">×</button></div></div>`).join('')}`;
  return `${pageHead('Расчёт маршрута','План','КП задают географию. Перерывы — отдельные временные события, которые можно свободно переставлять.',`<button class="btn alt" id="copyAllCpV23">Скопировать все КП</button><button class="btn sand" id="addBreakGeneralV23">Добавить перерыв</button>`)}<div class="plan-auto-summary-v23"><div><small>Старт</small><strong>${editorV13.start}</strong></div><div><small>Финиш</small><strong>${finalEtaV13()}</strong></div><div><small>Движение</small><strong>${fmtMinutesV23(stats.base)}</strong></div><div><small>Перерывы</small><strong>${fmtMinutesV23(stats.pauses)}</strong></div><div><small>Резерв ${reservePctV23()}%</small><strong>${fmtMinutesV23(stats.reserve)}</strong></div><div><small>Темп</small><strong>${profile.short}</strong></div></div>${section('Темп и расчёт',`<div class="plan-settings-v23"><div class="plan-start-reserve-v23"><label>Время старта<input type="time" id="routeStartV23" value="${editorV13.start}"></label><label>Организационный резерв<input type="number" min="0" max="50" step="1" id="reserveV23" value="${reservePctV23()}"><span>% от времени движения</span></label></div>${speedCardsV23()}</div>`,'Скорость зависит от выбранного темпа и проходимости конкретного участка. Резерв распределяется по маршруту пропорционально времени движения.')}${section('План маршрута',routeTimelineHtmlV23(),'Перерывы не имеют координат и не являются КП. Их можно перетаскивать между точками или перемещать стрелками на телефоне.')}${section('Организационный таймлайн',org,'Отдельный командный план мероприятия, не влияющий на расчёт движения.')}`;
}
planPage=planPageV23;

function removeLegacyStopEditorsV23(){document.querySelectorAll('#cpStopV15,#studioCpStopV21').forEach(el=>{const l=el.closest('label');if(l)l.remove();else el.remove()});document.querySelectorAll('.editor-card-v13,.studio-inspector-v21').forEach(box=>{if(box.querySelector('.breaks-note-v23'))return;const cp=box.querySelector('#cpTitleV15,#studioCpTitleV21');if(cp){const n=document.createElement('div');n.className='breaks-note-v23';n.textContent='Остановки и обед теперь настраиваются отдельно во вкладке «План».';cp.closest('label')?.after(n)}})}
function injectRouteMapTimesV23(){const head=document.querySelector('.route-map-head-v11>div:first-child');if(head&&!head.querySelector('.map-time-v23')){const e=document.createElement('div');e.className='map-time-v23';e.innerHTML=`<span>Старт <b>${editorV13.start}</b></span><span>Финиш <b>${finalEtaV13()}</b></span>`;head.appendChild(e)}}
function copyTextV23(text,msg='Скопировано'){if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).then(()=>toast(msg)).catch(()=>fallbackCopyV23(text,msg));else fallbackCopyV23(text,msg)}
function fallbackCopyV23(text,msg){const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();try{document.execCommand('copy');toast(msg)}catch(e){toast('Не удалось скопировать')}t.remove()}
function cpByIdV23(id){return dynamicCpsV13().find(cp=>cp.id===id)}
function copyCpV23(id){const cp=cpByIdV23(id);if(cp)copyTextV23(`${cp.lat.toFixed(6)}, ${cp.lon.toFixed(6)}`,`${cp.number==='С'||cp.number==='Ф'?cp.number:'КП '+cp.number}: координаты скопированы`)}
function openCpV23(id){const cp=cpByIdV23(id);if(cp)window.open(`https://yandex.ru/maps/?pt=${cp.lon.toFixed(6)},${cp.lat.toFixed(6)}&z=16&l=map`,'_blank','noopener')}
function copyAllCpV23(){const text=dynamicCpsV13().map(cp=>`${cp.number==='С'?'Старт':cp.number==='Ф'?'Финиш':'КП '+cp.number} · ${cp.title}\n${cp.lat.toFixed(6)}, ${cp.lon.toFixed(6)}`).join('\n\n');copyTextV23(text,'Все координаты КП скопированы')}

function blobDownloadV23(name,type,text){const b=new Blob([text],{type}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function xmlEscV23(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function exportGpxV23(){
  const cps=dynamicCpsV13(),marks=editorV13.marks||[],wpts=[...cps.map(cp=>`<wpt lat="${cp.lat}" lon="${cp.lon}"><name>${xmlEscV23(cp.number==='С'?'Старт':cp.number==='Ф'?'Финиш':'КП '+cp.number+' · '+cp.title)}</name><desc>${xmlEscV23(cp.title)}</desc></wpt>`),...marks.map(m=>`<wpt lat="${m.lat}" lon="${m.lon}"><name>${xmlEscV23(m.title||'Точка')}</name><desc>${xmlEscV23(m.note||'')}</desc></wpt>`)].join('');
  const trk=editorV13.route.map(p=>`<trkpt lat="${p[0]}" lon="${p[1]}"></trkpt>`).join('');
  blobDownloadV23('route-and-points.gpx','application/gpx+xml',`<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="Raznye Ludi" xmlns="http://www.topografix.com/GPX/1/1">${wpts}<trk><name>Маршрут</name><trkseg>${trk}</trkseg></trk></gpx>`)
}
function exportKmlV23(){
  const pts=dynamicCpsV13().map(cp=>`<Placemark><name>${xmlEscV23(cp.number==='С'?'Старт':cp.number==='Ф'?'Финиш':'КП '+cp.number+' · '+cp.title)}</name><Point><coordinates>${cp.lon},${cp.lat},0</coordinates></Point></Placemark>`).join('');
  const marks=(editorV13.marks||[]).map(m=>`<Placemark><name>${xmlEscV23(m.title||'Точка')}</name><description>${xmlEscV23(m.note||'')}</description><Point><coordinates>${m.lon},${m.lat},0</coordinates></Point></Placemark>`).join('');
  const line=editorV13.route.map(p=>`${p[1]},${p[0]},0`).join(' ');
  blobDownloadV23('route-and-points.kml','application/vnd.google-earth.kml+xml',`<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Разные люди · маршрут</name><Placemark><name>Маршрут</name><LineString><tessellate>1</tessellate><coordinates>${line}</coordinates></LineString></Placemark>${pts}${marks}</Document></kml>`)
}
function exportGeoJsonV23(){if(typeof downloadGeoJsonV21==='function')return downloadGeoJsonV21();}
function exportProjectV23(){ensurePlanV23();blobDownloadV23('field-map-project.json','application/json',JSON.stringify({format:'raznye-ludi-field-map',version:2,exportedAt:new Date().toISOString(),editor:editorV13,atlas:typeof atlasV20!=='undefined'?atlasV20:null},null,2))}
function exportCardV23(){return section('Электронный экспорт',`<div class="export-grid-v23"><button class="btn sand" id="exportGpxV23"><b>GPX</b><span>трек + КП + метки</span></button><button class="btn alt" id="exportKmlV23"><b>KML</b><span>Google Earth и совместимые карты</span></button><button class="btn alt" id="exportGeoV23"><b>GeoJSON</b><span>GIS / веб-карты</span></button><button class="btn alt" id="exportProjectV23"><b>Проект JSON</b><span>полное редактируемое состояние</span></button></div>`,'GPX и KML содержат географическую линию и точки в WGS84. Бумажный атлас остаётся отдельным экспортом.')}
const routePageBeforeV23=routePage;
routePage=function(){return routePageBeforeV23()+exportCardV23()};

/* Fullscreen studio: classify route segments with the same four terrain classes. */
const inspectorSelectBeforeV23=inspectorSelectV21;
inspectorSelectV21=function(){
  const s=studioV21.selected;
  if(s?.type!=='segment')return inspectorSelectBeforeV23();
  const i=s.index,a=editorV13.route[i],b=editorV13.route[i+1],t=editorV13.terrain[i]||'unknown',speed=profileSpeedV23(t);
  return `<div class="studio-ins-head-v21"><small>МАРШРУТ</small><h3>Участок ${i+1}</h3></div><div class="studio-stat-card-v21"><span>Отрезок</span><strong>${(havV13(a,b)/1000).toFixed(2).replace('.',',')} км</strong></div><label>Проходимость<select id="studioTerrainV23">${['road','trail','clearing','forest','unknown'].map(k=>`<option value="${k}" ${t===k?'selected':''}>${TERRAIN_META_V23[k].label}</option>`).join('')}</select></label><div class="studio-stat-card-v21"><span>${PACE_PROFILES_V23[planProfileV23()].label}</span><strong>${speed.toFixed(1)} км/ч</strong></div><div class="studio-help-v21">${TERRAIN_META_V23[t].hint} Скорость берётся из выбранного профиля во вкладке «План».</div><button class="studio-btn-v21 wide" id="studioSplitSegV21">Добавить узел в середине</button>`;
};
const inspectorCpBeforeV23=inspectorCpV21;
inspectorCpV21=function(){
  const id=studioV21.selected?.type==='cp'?studioV21.selected.id:null,cp=id?editorV13.cps.find(x=>x.id===id):null,dyn=id?dynamicCpsV13().find(x=>x.id===id):null;if(!cp)return inspectorCpBeforeV23();
  return `<div class="studio-ins-head-v21"><small>${dyn?.number==='С'?'СТАРТ':dyn?.number==='Ф'?'ФИНИШ':`КП ${dyn?.number||''}`}</small><h3>${esc(cp.title)}</h3></div><label>Название<input id="studioCpTitleV21" value="${esc(cp.title)}"></label><div class="studio-grid2-v21"><label>Широта<input id="studioCpLatV21" value="${(+cp.lat).toFixed(7)}"></label><label>Долгота<input id="studioCpLonV21" value="${(+cp.lon).toFixed(7)}"></label></div><div class="studio-coordinate-actions-v23"><code>${(+cp.lat).toFixed(6)}, ${(+cp.lon).toFixed(6)}</code><button id="studioCopyCpV23">Копировать</button><button id="studioOpenCpV23">Карта ↗</button></div><div class="studio-stat-card-v21"><span>Квадрат / ETA</span><strong>${gridCodeDynamicV13(cp.lat,cp.lon)} · ${dyn?.arrival||'—'}</strong></div><div class="breaks-note-v23">Перерывы не привязаны к КП и редактируются во вкладке «План».</div><button class="studio-btn-v21 primary wide" id="studioCpSaveV21">Сохранить КП</button><button class="studio-btn-v21 danger wide" id="studioCpDeleteV21" ${cp.locked?'disabled':''}>Удалить КП</button>`;
};
const bindStudioInspectorBeforeV23=bindStudioInspectorV21;
bindStudioInspectorV21=function(){bindStudioInspectorBeforeV23();document.getElementById('studioTerrainV23')?.addEventListener('change',e=>{const i=studioV21.selected?.index;if(!Number.isInteger(i))return;pushStudioHistoryV21();editorV13.terrain[i]=e.target.value;markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()});document.getElementById('studioCopyCpV23')?.addEventListener('click',()=>copyCpV23(studioV21.selected?.id));document.getElementById('studioOpenCpV23')?.addEventListener('click',()=>openCpV23(studioV21.selected?.id));};
const renderStudioShellBeforeV23=renderStudioShellV21;
renderStudioShellV21=function(){renderStudioShellBeforeV23();const title=document.querySelector('.studio-title-v21>div');if(title&&!title.querySelector('.studio-schedule-v23')){const e=document.createElement('span');e.className='studio-schedule-v23';title.appendChild(e)}updateStudioHeaderMetricsV21()};
const updateStudioHeaderMetricsBeforeV23=updateStudioHeaderMetricsV21;
updateStudioHeaderMetricsV21=function(){updateStudioHeaderMetricsBeforeV23();const e=document.getElementById('studioEtaV21');if(e)e.textContent=`Старт ${editorV13.start} · Финиш ${finalEtaV13()}`;const s=document.querySelector('.studio-schedule-v23');if(s)s.textContent=`Старт ${editorV13.start} · Финиш ${finalEtaV13()}`};

/* Atlas: richer field legend and route plan with independent breaks. */
if(typeof legendV22==='function'){
  legendV22=function(source){const src=ATLAS_SOURCES_V20[source]||ATLAS_SOURCES_V20.osm;return `<div class="atlas-legend-v22 atlas-legend-v23"><small>УСЛОВНЫЕ ОБОЗНАЧЕНИЯ</small><div><span><i class="lg-route"></i>Маршрут</span><span><i class="lg-cp"></i>Контрольная точка</span><span><i class="lg-camp"></i>Старт / финиш</span><span><i class="lg-road-v23"></i>Дорога</span><span><i class="lg-trail-v23"></i>Тропа</span><span><i class="lg-rail-v23"></i>Железная дорога</span><span><i class="lg-power-v23"></i>ЛЭП / просека</span><span><i class="lg-water-v23"></i>Вода</span><span><i class="lg-swamp-v23"></i>Болото</span><span><i class="lg-forest-v23"></i>Лес</span><span><i class="lg-open-v23"></i>Открытая местность</span><span><i class="lg-grid"></i>Сетка ${gridCfgV13().cell} м</span><span><i class="lg-sheet"></i>Текущий лист</span></div><em>${esc(src.label)}</em></div>`};
}
tablePlanV20=function(){
  const stats=routePlanStatsV23(),rows=breakTimelineV23().map(x=>x.kind==='cp'?`<tr><td>${x.cp.number}</td><td><b>${esc(x.cp.title)}</b></td><td>${x.cp.km.toFixed(1)}</td><td>${x.cp.arrival}</td><td>${gridCodeDynamicV13(x.cp.lat,x.cp.lon)}</td><td>${x.cp.lat.toFixed(6)}, ${x.cp.lon.toFixed(6)}</td></tr>`:`<tr class="atlas-break-row-v23"><td>—</td><td><b>${esc(x.break.title)}</b></td><td>—</td><td>${x.start}–${x.end} · ${x.break.minutes} мин</td><td>—</td><td>после ${esc(x.after.title)}</td></tr>`).join('');
  return `<section class="atlas-page-v20 atlas-table-v20 page-landscape-v22"><header><div><small>МАРШРУТНЫЙ ПЛАН</small><h1>Время, перерывы и координаты</h1></div><b>${PACE_PROFILES_V23[planProfileV23()].short} · ${editorV13.start} → ${finalEtaV13()}</b></header><div class="atlas-plan-summary-v23"><span>Движение ${fmtMinutesV23(stats.base)}</span><span>Резерв ${reservePctV23()}% · ${fmtMinutesV23(stats.reserve)}</span><span>Перерывы ${fmtMinutesV23(stats.pauses)}</span><span>Длина ${(routeLenV13()/1000).toFixed(1).replace('.',',')} км</span></div><table><thead><tr><th>КП</th><th>Событие</th><th>Км</th><th>Время</th><th>Квадрат</th><th>WGS84 / примечание</th></tr></thead><tbody>${rows}</tbody></table><footer><span>Перерывы являются временными событиями и не имеют координат.</span></footer></section>`;
};

const bindBeforeV23=bind;
bind=function(){
  bindBeforeV23();ensurePlanV23();removeLegacyStopEditorsV23();injectRouteMapTimesV23();
  document.getElementById('routeStartV23')?.addEventListener('change',e=>{editorV13.start=e.target.value||'10:00';persistPlanV23();render();toast('Время старта обновлено')});
  document.getElementById('reserveV23')?.addEventListener('change',e=>{editorV13.plan.reservePct=Math.max(0,Math.min(50,+e.target.value||0));persistPlanV23();render();toast('Резерв обновлён')});
  document.querySelectorAll('[data-profile-v23]').forEach(b=>b.addEventListener('click',()=>{editorV13.plan.profile=b.dataset.profileV23;syncLegacySpeedsV23();persistPlanV23();render();toast(`Темп: ${PACE_PROFILES_V23[editorV13.plan.profile].label}`)}));
  document.querySelectorAll('[data-speed-v23]').forEach(i=>i.addEventListener('change',()=>{const p=planProfileV23();editorV13.plan.speedProfiles[p][i.dataset.speedV23]=Math.max(.5,Math.min(8,+i.value||3));syncLegacySpeedsV23();persistPlanV23();render();toast('Скорость обновлена')}));
  document.getElementById('addBreakGeneralV23')?.addEventListener('click',()=>addBreakV23());
  document.querySelectorAll('[data-add-break-v23]').forEach(b=>b.addEventListener('click',()=>addBreakV23(b.dataset.addBreakV23)));
  document.querySelectorAll('[data-break-title-v23]').forEach(i=>i.addEventListener('change',()=>updateBreakV23(i.dataset.breakTitleV23,{title:i.value.trim()||'Перерыв'})));
  document.querySelectorAll('[data-break-min-v23]').forEach(i=>i.addEventListener('change',()=>updateBreakV23(i.dataset.breakMinV23,{minutes:+i.value||0})));
  document.querySelectorAll('[data-break-up-v23]').forEach(b=>b.addEventListener('click',()=>moveBreakV23(b.dataset.breakUpV23,-1)));
  document.querySelectorAll('[data-break-down-v23]').forEach(b=>b.addEventListener('click',()=>moveBreakV23(b.dataset.breakDownV23,1)));
  document.querySelectorAll('[data-break-del-v23]').forEach(b=>b.addEventListener('click',()=>deleteBreakV23(b.dataset.breakDelV23)));
  let dragId=null;document.querySelectorAll('[data-break-id-v23]').forEach(row=>row.addEventListener('dragstart',e=>{dragId=row.dataset.breakIdV23;e.dataTransfer.effectAllowed='move';row.classList.add('dragging')}));document.querySelectorAll('[data-break-id-v23]').forEach(row=>row.addEventListener('dragend',()=>row.classList.remove('dragging')));document.querySelectorAll('[data-break-drop-v23]').forEach(z=>{z.addEventListener('dragover',e=>{e.preventDefault();z.classList.add('over')});z.addEventListener('dragleave',()=>z.classList.remove('over'));z.addEventListener('drop',e=>{e.preventDefault();z.classList.remove('over');if(dragId)updateBreakV23(dragId,{afterCpId:z.dataset.breakDropV23})})});
  document.querySelectorAll('[data-copy-cp-v23]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();copyCpV23(b.dataset.copyCpV23)}));
  document.querySelectorAll('[data-open-cp-v23]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();openCpV23(b.dataset.openCpV23)}));
  document.getElementById('copyAllCpV23')?.addEventListener('click',copyAllCpV23);
  document.getElementById('exportGpxV23')?.addEventListener('click',exportGpxV23);document.getElementById('exportKmlV23')?.addEventListener('click',exportKmlV23);document.getElementById('exportGeoV23')?.addEventListener('click',exportGeoJsonV23);document.getElementById('exportProjectV23')?.addEventListener('click',exportProjectV23);
};

ensurePlanV23();
const buildV23=document.querySelector('.build-label');if(buildV23)buildV23.textContent='V17 · гибкий план · темпы · электронный экспорт';
render();
