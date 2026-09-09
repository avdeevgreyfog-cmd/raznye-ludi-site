/* V11 — project export/import so edited local route can be shared */
const PROJECT_FORMAT_V17='raznye-ludi-hike-project';
function clonePlainV17(v){return JSON.parse(JSON.stringify(v))}
function projectPayloadV17(){
  let cps=[];try{cps=dynamicCpsV13().map(cp=>({id:cp.id,number:cp.number,title:cp.title,lat:cp.lat,lon:cp.lon,km:cp.km,arrival:cp.arrival,stopMin:cp.stopMin,grid:gridCodeDynamicV13(cp.lat,cp.lon)}))}catch(e){}
  return {
    format:PROJECT_FORMAT_V17,
    version:1,
    exportedAt:new Date().toISOString(),
    note:'Экспорт текущего состояния модуля «Разные люди — Походы». routeEditor содержит фактическую геометрию, КП, сетку, скорости и настройки расчёта.',
    event:clonePlainV17(S.event),
    appState:clonePlainV17(S),
    routeEditor:clonePlainV17(editorV13),
    view:{routeBase:typeof routeBaseV11!=='undefined'?routeBaseV11:'osm',overviewBase:typeof overviewBaseV11!=='undefined'?overviewBaseV11:'osm',gridEnabled:typeof gridEnabledV12!=='undefined'?gridEnabledV12:true},
    calculated:{distanceMeters:Math.round(routeLenV13()),distanceKm:+(routeLenV13()/1000).toFixed(3),finish:finalEtaV13(),cps}
  }
}
function projectFileNameV17(){const d=new Date(),pad=n=>String(n).padStart(2,'0');return `tomilinsky-route-project-${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`}
function downloadProjectV17(){try{const payload=projectPayloadV17(),blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=projectFileNameV17();document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);toast(editDirtyV15?'Экспортирован текущий черновик проекта':'Проект маршрута скачан')}catch(e){console.error(e);toast('Не удалось экспортировать проект')}}
function validProjectV17(p){return p&&p.format===PROJECT_FORMAT_V17&&p.routeEditor&&Array.isArray(p.routeEditor.route)&&p.routeEditor.route.length>1&&Array.isArray(p.routeEditor.cps)}
async function importProjectFileV17(file){if(!file)return;try{const p=JSON.parse(await file.text());if(!validProjectV17(p)){toast('Это не файл проекта «Разные люди — Походы»');return}if(!confirm('Заменить текущий локальный маршрут данными из выбранного файла проекта?'))return;editorV13=clonePlainV17(p.routeEditor);if(p.appState&&p.appState.event){S=clonePlainV17(p.appState);save()}else if(p.event){S.event={...S.event,...p.event};save()}if(p.view){if(p.view.routeBase)routeBaseV11=p.view.routeBase;if(p.view.overviewBase)overviewBaseV11=p.view.overviewBase;if(typeof p.view.gridEnabled==='boolean')gridEnabledV12=p.view.gridEnabled}persistEditorV15();editBaseV15=null;editDirtyV15=false;editorModeV13=false;selectedV13=null;routeActionV15='select';pathAV16=null;pathBV16=null;render();toast('Проект импортирован')}catch(e){console.error(e);toast('Не удалось прочитать файл проекта')}}
const toolbarV17Base=editorToolbarV13;
editorToolbarV13=function(){const s=toolbarV17Base();return s.replace(/<\/div>\s*$/,'<button class="btn alt" id="exportProjectV17" title="Скачать полный проект с геометрией, КП, сеткой и расчётом">Проект JSON</button><button class="btn alt" id="importProjectV17">Импорт</button><input id="importProjectFileV17" type="file" accept="application/json,.json" hidden></div>')};
const bindV17Base=bind;
bind=function(){bindV17Base();document.getElementById('exportProjectV17')?.addEventListener('click',downloadProjectV17);document.getElementById('importProjectV17')?.addEventListener('click',()=>document.getElementById('importProjectFileV17')?.click());document.getElementById('importProjectFileV17')?.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)importProjectFileV17(f);e.target.value=''})};
const buildV17=document.querySelector('.build-label');if(buildV17)buildV17.textContent='V11 · экспорт проекта для совместной правки';
render();
