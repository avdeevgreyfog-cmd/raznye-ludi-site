(()=>{
const style=document.createElement('style');
style.textContent=`
.lead>summary{grid-template-columns:minmax(250px,1.7fr) minmax(190px,1.08fr) 92px 94px 94px 28px}
.summary-score.demand b{color:#294a67}.summary-score.sales b{color:#1f654d}.summary-score span{white-space:nowrap}
.lead-kpis.v2{grid-template-columns:repeat(6,minmax(105px,1fr))}.score-note{font-size:12px;color:#69737d;margin-top:7px;line-height:1.45}.reason-list{margin:7px 0 0;padding-left:18px;font-size:13px}.reason-list li{margin:4px 0}.risk{background:#fff8e8;border:1px solid #ead7a6;padding:8px 10px;margin-top:8px;font-size:12px;color:#66501d}.quality-flag{background:#fff1f1;border:1px solid #e7c7c7;padding:8px 10px;margin:8px 0;font-size:12px;color:#762828}.feature-chip{font-size:11px;padding:4px 6px;background:#f3f7fb;border:1px solid #d8e3eb}.industry-line{font-weight:700}.industry-line small{display:block;color:#69737d;font-weight:400;margin-top:3px}.score-pair{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}.score-box{border:1px solid #dfe5e8;background:#fafbfc;padding:8px 10px;min-width:145px}.score-box span{display:block;font-size:11px;color:#69737d}.score-box b{font-size:19px}.score-box.sales b{color:#1f654d}.score-box.demand b{color:#294a67}
@media(max-width:1050px){.lead>summary{grid-template-columns:minmax(220px,1.5fr) minmax(150px,1fr) 78px 78px 78px 24px}.lead-kpis.v2{grid-template-columns:repeat(3,1fr)}}
@media(max-width:720px){.lead>summary{grid-template-columns:1fr auto auto}.summary-direction{grid-column:1/2}.summary-vacancies{display:none}.summary-score.demand{grid-column:2/3;grid-row:1/3}.summary-score.sales{grid-column:3/4;grid-row:1/3}.chev{display:none}.lead-kpis.v2{grid-template-columns:repeat(2,1fr)}}
`;
document.head.appendChild(style);
function workforceChips(arr){return (Array.isArray(arr)?arr:[]).map(x=>String(x)).filter(Boolean)}
function commercialReasons(m,relevant,fresh,industry,staff,allVac){const x=[];
 if(relevant>=8)x.push(`Массовая текущая потребность: ${relevant} целевых вакансий`);else if(relevant>=3)x.push(`Несколько целевых вакансий одновременно: ${relevant}`);
 if(fresh>=5)x.push(`Высокая свежесть найма: ${fresh} вакансий за 7 дней`);
 if(String(staff).includes('более 5000'))x.push('Крупный работодатель: более 5000 сотрудников');else if(String(staff).includes('1000'))x.push('Крупная организация: 1000+ сотрудников');
 if(allVac>=500)x.push(`Очень высокая общая активность найма: ${allVac.toLocaleString('ru-RU')} вакансий`);else if(allVac>=100)x.push(`Высокая общая активность найма: ${allVac.toLocaleString('ru-RU')} вакансий`);
 if(Number(m.industryFit||0)>=17)x.push(`Профиль бизнеса подходит под массовый аутсорс: ${industry}`);
 const wf=workforceChips(m.workforceSignals);if(wf.length>=3)x.push('В вакансиях есть признаки массовой операционной модели: '+wf.slice(0,3).join(', '));
 return x;
}
leadHtml=function(l){
 const c=l.company||{},raw=c.raw||{},m=l.metrics||{},roles=m.roleSummary||[],signals=l.signals||[],jobs=l.jobs||[],prov=l.providers||[];
 const contacts=[c.site?'<a href="'+esc(c.site)+'" target="_blank" rel="noopener">Сайт компании</a>':'',c.public_phone?esc(c.public_phone):'',c.public_email?'<a href="mailto:'+esc(c.public_email)+'">'+esc(c.public_email)+'</a>':''].filter(Boolean).join(' · ');
 const staff=m.staffCount||raw.staffCount||'нет данных',allVac=Number(m.totalVacancies||raw.totalVacancies||0),direction=demandDirection(roles),fresh=Number(m.newJobs7d||0),relevant=Number(m.relevantJobs||jobs.length||0),demand=Number(m.demandScore||0),sales=Number(m.salesPriorityScore??l.score??0),industry=m.industry||l.explanation?.industry||'Отрасль не определена';
 const wf=workforceChips(m.workforceSignals),flags=Array.isArray(m.dataQualityWarnings)?m.dataQualityWarnings:[],reasons=commercialReasons(m,relevant,fresh,industry,staff,allVac),publicSector=m.publicSector===true||m.publicSector==='true';
 const risks=[];if(publicSector)risks.push('Госсектор / регулируемая закупка: прямой коммерческий контакт может быть менее эффективен, нужно проверять закупки и тендеры.');if(relevant<=1)risks.push('Текущая целевая потребность подтверждена только одной вакансией.');
 return `<details class="lead ${esc(l.priority)}"><summary>
  <div><div class="company-name">${esc(c.name||l.company_id)}</div><div class="summary-sub"><span class="status-pill ${esc(l.status||'new')}">${esc(statusLabel(l.status))}</span><span class="priority-pill">${esc(priorityLabel(l.priority))}</span>${c.inn?'<span class="muted">ИНН '+esc(c.inn)+'</span>':''}</div></div>
  <div class="summary-direction industry-line">${esc(industry)}<small>${esc(direction)} · ${esc(staff)}</small></div>
  <div class="summary-vacancies"><b>${relevant}</b><span>целевых</span></div>
  <div class="summary-score demand"><b>${demand}</b><span>Потребность</span></div>
  <div class="summary-score sales"><b>${sales}</b><span>Приоритет</span></div><div class="chev">⌄</div>
 </summary><div class="lead-body">
  ${flags.length?'<div class="quality-flag"><b>Требует проверки данных:</b> '+flags.map(esc).join(' · ')+'</div>':''}
  <div class="lead-kpis v2"><div class="lead-kpi"><span>Потребность</span><b>${demand}/100</b></div><div class="lead-kpi"><span>Приоритет продаж</span><b>${sales}/100</b></div><div class="lead-kpi"><span>Свежих за 7 дней</span><b>${fresh}</b></div><div class="lead-kpi"><span>Размер компании</span><b>${esc(staff)}</b></div><div class="lead-kpi"><span>Всего вакансий</span><b>${allVac?allVac.toLocaleString('ru-RU'):'нет данных'}</b></div><div class="lead-kpi"><span>Последний сигнал</span><b>${esc(fmtDateTime(l.lastSignalAt)||'—')}</b></div></div>
  <div class="lead-columns"><div>
   <div class="subsection"><h4>Коммерческая оценка</h4><div class="fact"><b>Отрасль:</b> ${esc(industry)}</div><div class="fact"><b>Направление потребности:</b> ${esc(direction)}</div><div class="score-pair"><div class="score-box demand"><span>Кадровая потребность</span><b>${demand}/100</b></div><div class="score-box sales"><span>Приоритет для продаж</span><b>${sales}/100</b></div></div>${reasons.length?'<ul class="reason-list">'+reasons.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<div class="muted" style="margin-top:8px">Сильных коммерческих факторов пока недостаточно.</div>'}${risks.map(x=>'<div class="risk">'+esc(x)+'</div>').join('')}<div class="score-note">${esc(l.explanation?.scoreExplanation||'')}</div></div>
   <div class="subsection"><h4>Признаки массового найма</h4><div class="chips">${signals.length?signals.map(s=>'<span class="chip">'+esc(s.type)+' · '+esc(s.evidence)+'</span>').join(''):'<span class="muted">Резких динамических сигналов пока нет</span>'}</div>${wf.length?'<div class="chips">'+wf.map(x=>'<span class="feature-chip">'+esc(x)+'</span>').join('')+'</div>':'<div class="muted">Дополнительные признаки пока не обнаружены.</div>'}</div>
  </div><div>
   <div class="subsection"><h4>Компания</h4><div class="fact"><b>Отрасль:</b> ${esc(industry)}</div><div class="fact"><b>Размер:</b> ${esc(staff)}</div><div class="fact"><b>Вакансий всего:</b> ${allVac?allVac.toLocaleString('ru-RU'):'—'}</div><div class="fact"><b>Источники:</b> ${esc(prov.join(', ')||'не указаны')}</div><div class="fact"><b>Основные роли:</b> ${esc(roles.slice(0,5).map(r=>r.label+' — '+r.count).join(', ')||'—')}</div>${contacts?'<div class="contacts">'+contacts+'</div>':'<div class="muted">Публичные контакты пока не найдены</div>'}</div>
   <div class="subsection"><h4>Что подтверждено</h4>${(l.explanation?.confirmedFacts||[]).map(x=>'<div class="fact">• '+esc(x)+'</div>').join('')}<div class="score-note">${esc(l.explanation?.demandExplanation||'')}</div><div class="muted" style="margin-top:7px">${esc(l.explanation?.caveat||'')}</div></div>
  </div></div>
  <div class="jobs-title"><h4>Вакансии (${jobs.length})</h4><span class="muted">Сгруппированы по профессиям</span></div>${jobs.length?vacancyGroups(jobs,roles):'<div class="muted">Вакансий нет</div>'}
  <div class="actions">${[['working','В работу'],['need','Потребность есть'],['proposal','Запросили КП'],['later','Вернуться позже'],['no_need','Нет потребности'],['outsourcing_no','Не используют аутсорс'],['bad_signal','Неверный сигнал']].map(x=>'<button onclick="event.preventDefault();event.stopPropagation();setStatus(\''+encodeURIComponent(l.company_id)+'\',\''+x[0]+'\')">'+x[1]+'</button>').join('')}</div>
 </div></details>`
};
setTimeout(()=>{try{renderLeads()}catch{}},0);
})();
