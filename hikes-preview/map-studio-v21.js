/* V15 — fullscreen map studio: route, checkpoints, generic marks, grid and atlas sheets. */
const MAP_STUDIO_V21_KEY='rl_map_studio_v21';
const MAP_MARK_TYPES_V21={
  poi:{label:'Точка',icon:'•'},
  camp:{label:'Лагерь',icon:'▲'},
  parking:{label:'Парковка',icon:'P'},
  water:{label:'Вода / родник',icon:'≈'},
  meeting:{label:'Место встречи',icon:'◎'},
  warning:{label:'Важное место',icon:'!'}
};
const MAP_BASES_V21={
  trail:{label:'Тропы',hint:'OSM · дороги и тропы'},
  sat:{label:'Спутник',hint:'Esri World Imagery'},
  city:{label:'Город',hint:'Яндекс при наличии ключа · иначе городская схема'}
};
let studioV21={
  open:false,map:null,base:'trail',tile:null,tool:'select',selected:null,
  route:null,routeHit:null,handles:[],cps:{},marks:{},grid:null,atlas:[],atlasArea:null,
  pathA:null,pathB:null,pathALayer:null,pathBLayer:null,pathPreview:null,pathBusy:false,
  areaA:null,areaALayer:null,areaPreview:null,
  history:[],future:[],baseEditor:null,baseAtlas:null,dirty:false,mouse:null
};

function cloneV21(v){return JSON.parse(JSON.stringify(v))}
function ensureMapDataV21(){if(!Array.isArray(editorV13.marks))editorV13.marks=[];if(!editorV13.grid)editorV13.grid={cell:200,offsetX:0,offsetY:0}}
function loadStudioPrefsV21(){try{return JSON.parse(localStorage.getItem(MAP_STUDIO_V21_KEY)||'{}')||{}}catch(e){return {}}}
function saveStudioPrefsV21(){try{localStorage.setItem(MAP_STUDIO_V21_KEY,JSON.stringify({base:studioV21.base,tool:studioV21.tool}))}catch(e){}}
function mapCityUsesYandexV21(){return typeof yandexKeyV20==='function'&&!!yandexKeyV20()}
function tileSpecStudioV21(kind){
  if(kind==='sat')return {url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',opts:{maxZoom:19,keepBuffer:5,updateWhenZooming:false,attribution:'Tiles © Esri'}};
  if(kind==='city'&&mapCityUsesYandexV21())return {url:`https://tiles.api-maps.yandex.ru/v1/tiles/?apikey=${encodeURIComponent(yandexKeyV20())}&lang=ru_RU&x={x}&y={y}&z={z}&l=map&projection=web_mercator`,opts:{maxZoom:19,keepBuffer:5,updateWhenZooming:false,attribution:'© Яндекс Карты'}};
  if(kind==='city')return {url:'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',opts:{maxZoom:20,keepBuffer:5,updateWhenZooming:false,attribution:'© OpenStreetMap contributors © CARTO'}};
  return {url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',opts:{maxZoom:19,keepBuffer:5,updateWhenZooming:false,attribution:'© OpenStreetMap contributors'}};
}
function makeStudioTileV21(kind){const s=tileSpecStudioV21(kind);return L.tileLayer(s.url,s.opts)}
function studioRootV21(){let e=document.getElementById('mapStudioV21');if(!e){e=document.createElement('div');e.id='mapStudioV21';document.body.appendChild(e)}return e}
function studioIsDirtyV21(){return studioV21.dirty||!sameV21(editorV13,studioV21.baseEditor)||!sameV21(atlasV20,studioV21.baseAtlas)}
function sameV21(a,b){try{return JSON.stringify(a)===JSON.stringify(b)}catch(e){return false}}
function markDirtyV21(){studioV21.dirty=true;updateStudioStatusV21()}
function pushStudioHistoryV21(){studioV21.history.push({editor:cloneV21(editorV13),atlas:cloneV21(atlasV20)});if(studioV21.history.length>60)studioV21.history.shift();studioV21.future=[]}
function restoreStudioSnapshotV21(s){if(!s)return;editorV13=cloneV21(s.editor);atlasV20=cloneV21(s.atlas);ensureMapDataV21();markDirtyV21();drawStudioAllV21();renderStudioInspectorV21();updateStudioHeaderMetricsV21()}
function undoStudioV21(){if(!studioV21.history.length)return;studioV21.future.push({editor:cloneV21(editorV13),atlas:cloneV21(atlasV20)});restoreStudioSnapshotV21(studioV21.history.pop())}
function redoStudioV21(){if(!studioV21.future.length)return;studioV21.history.push({editor:cloneV21(editorV13),atlas:cloneV21(atlasV20)});restoreStudioSnapshotV21(studioV21.future.pop())}
function saveStudioV21(){
  try{persistEditorV15()}catch(e){try{localStorage.setItem(EDITOR_V13_KEY,JSON.stringify(editorV13))}catch(_e){}}
  try{saveAtlasV20()}catch(e){}
  try{syncEventV13()}catch(e){}
  studioV21.baseEditor=cloneV21(editorV13);studioV21.baseAtlas=cloneV21(atlasV20);studioV21.dirty=false;
  updateStudioStatusV21();toast('Карта и маршрут сохранены');
}
function discardStudioV21(){editorV13=cloneV21(studioV21.baseEditor);atlasV20=cloneV21(studioV21.baseAtlas);studioV21.dirty=false;studioV21.history=[];studioV21.future=[];drawStudioAllV21();renderStudioInspectorV21();updateStudioHeaderMetricsV21();toast('Изменения отменены')}
function closeStudioV21(force=false){
  if(!force&&studioIsDirtyV21()&&!confirm('Есть несохранённые изменения. Закрыть карту без сохранения?'))return;
  if(studioIsDirtyV21()){editorV13=cloneV21(studioV21.baseEditor);atlasV20=cloneV21(studioV21.baseAtlas)}
  try{studioV21.map?.remove()}catch(e){}
  studioV21.open=false;studioV21.map=null;document.getElementById('mapStudioV21')?.remove();document.body.classList.remove('map-studio-open-v21');
  try{render()}catch(e){}
}
function openStudioV21(){
  ensureMapDataV21();
  const prefs=loadStudioPrefsV21();
  studioV21.open=true;studioV21.base=['trail','sat','city'].includes(prefs.base)?prefs.base:'trail';studioV21.tool='select';studioV21.selected=null;
  studioV21.pathA=studioV21.pathB=null;studioV21.areaA=null;studioV21.history=[];studioV21.future=[];studioV21.baseEditor=cloneV21(editorV13);studioV21.baseAtlas=cloneV21(atlasV20);studioV21.dirty=false;
  document.body.classList.add('map-studio-open-v21');renderStudioShellV21();requestAnimationFrame(mountStudioMapV21)
}

function renderStudioShellV21(){
  const root=studioRootV21();
  root.className='map-studio-v21';
  root.innerHTML=`<header class="studio-top-v21">
    <div class="studio-title-v21"><button class="studio-icon-btn-v21" id="studioCloseV21" title="Закрыть">←</button><div><small>КАРТОГРАФИЧЕСКАЯ МАСТЕРСКАЯ</small><strong>Томинский лесопарк</strong></div></div>
    <div class="studio-base-switch-v21">${Object.entries(MAP_BASES_V21).map(([k,v])=>`<button data-studio-base="${k}" class="${studioV21.base===k?'active':''}"><b>${v.label}</b><small>${v.hint}</small></button>`).join('')}</div>
    <div class="studio-top-actions-v21"><span id="studioSaveStateV21" class="studio-save-state-v21">Сохранено</span><button class="studio-btn-v21 ghost" id="studioDiscardV21">Не сохранять</button><button class="studio-btn-v21 primary" id="studioSaveV21">Сохранить</button></div>
  </header>
  <div class="studio-body-v21">
    <nav class="studio-tools-v21">
      ${studioToolButtonV21('select','↖','Выбрать / двигать')}
      ${studioToolButtonV21('add','＋','Добавить узел')}
      ${studioToolButtonV21('path','⌁','По тропе A→B')}
      ${studioToolButtonV21('cp','КП','Контрольные точки')}
      ${studioToolButtonV21('mark','●','Метки')}
      ${studioToolButtonV21('grid','▦','Сетка')}
      ${studioToolButtonV21('atlas','▤','Листы атласа')}
      <span class="studio-tools-sep-v21"></span>
      <button id="studioUndoV21" title="Отменить">↶</button><button id="studioRedoV21" title="Повторить">↷</button>
    </nav>
    <main class="studio-map-wrap-v21"><div id="studioMapV21" class="studio-map-v21"></div><div class="studio-cross-v21" id="studioCrossV21"></div>
      <div class="studio-map-quick-v21"><button id="studioFitRouteV21">Весь маршрут</button><button id="studioFitAreaV21">Область атласа</button><button id="studioNakarteV21">Nakarte ↗</button><button id="studioYandexV21">Яндекс ↗</button></div>
    </main>
    <aside class="studio-inspector-v21" id="studioInspectorV21"></aside>
  </div>
  <footer class="studio-status-v21"><span id="studioCoordV21">—</span><span id="studioGridCodeV21">Квадрат —</span><span id="studioDistanceV21">${(routeLenV13()/1000).toFixed(2).replace('.',',')} км</span><span id="studioEtaV21">Финиш ${finalEtaV13()}</span><span id="studioZoomV21">zoom —</span></footer>`;
  bindStudioShellV21();renderStudioInspectorV21();updateStudioStatusV21();
}
function studioToolButtonV21(tool,icon,label){return `<button data-studio-tool="${tool}" class="${studioV21.tool===tool?'active':''}" title="${label}"><span>${icon}</span><small>${label}</small></button>`}
function bindStudioShellV21(){
  document.getElementById('studioCloseV21')?.addEventListener('click',()=>closeStudioV21(false));
  document.getElementById('studioSaveV21')?.addEventListener('click',saveStudioV21);
  document.getElementById('studioDiscardV21')?.addEventListener('click',()=>{if(!studioIsDirtyV21()||confirm('Отменить все изменения после последнего сохранения?'))discardStudioV21()});
  document.getElementById('studioUndoV21')?.addEventListener('click',undoStudioV21);document.getElementById('studioRedoV21')?.addEventListener('click',redoStudioV21);
  document.querySelectorAll('[data-studio-tool]').forEach(b=>b.addEventListener('click',()=>setStudioToolV21(b.dataset.studioTool)));
  document.querySelectorAll('[data-studio-base]').forEach(b=>b.addEventListener('click',()=>setStudioBaseV21(b.dataset.studioBase)));
  document.getElementById('studioFitRouteV21')?.addEventListener('click',fitStudioRouteV21);document.getElementById('studioFitAreaV21')?.addEventListener('click',fitStudioAreaV21);
  document.getElementById('studioNakarteV21')?.addEventListener('click',openNakarteV21);document.getElementById('studioYandexV21')?.addEventListener('click',openYandexV21);
}
function setStudioToolV21(tool){
  if(!['select','add','path','cp','mark','grid','atlas'].includes(tool))return;
  studioV21.tool=tool;studioV21.selected=null;if(tool!=='path')clearStudioPathV21();if(tool!=='atlas')clearStudioAreaPickV21();saveStudioPrefsV21();
  document.querySelectorAll('[data-studio-tool]').forEach(b=>b.classList.toggle('active',b.dataset.studioTool===tool));
  studioV21.map?.getContainer().classList.toggle('crosshair',['add','cp','mark','atlas'].includes(tool));drawStudioAllV21();renderStudioInspectorV21();
}
function setStudioBaseV21(kind){
  if(!MAP_BASES_V21[kind]||!studioV21.map)return;studioV21.base=kind;saveStudioPrefsV21();document.querySelectorAll('[data-studio-base]').forEach(b=>b.classList.toggle('active',b.dataset.studioBase===kind));
  const next=makeStudioTileV21(kind),old=studioV21.tile;next.addTo(studioV21.map);next.once('load',()=>{if(old&&studioV21.map?.hasLayer(old))studioV21.map.removeLayer(old)});setTimeout(()=>{if(old&&studioV21.map?.hasLayer(old))studioV21.map.removeLayer(old)},2200);studioV21.tile=next;renderStudioInspectorV21();
}
function mountStudioMapV21(){
  const el=document.getElementById('studioMapV21');if(!el||!window.L)return;
  studioV21.map=L.map(el,{zoomControl:true,attributionControl:true,preferCanvas:true,scrollWheelZoom:true,zoomSnap:.5,zoomDelta:.5,wheelPxPerZoomLevel:110,minZoom:3,maxZoom:20,fadeAnimation:false,markerZoomAnimation:false});
  studioV21.tile=makeStudioTileV21(studioV21.base).addTo(studioV21.map);fitStudioRouteV21(false);drawStudioAllV21();
  studioV21.map.on('mousemove',e=>{studioV21.mouse=e.latlng;updateStudioMouseV21(e.latlng)});
  studioV21.map.on('zoomend',()=>{drawStudioAllV21();updateStudioMouseV21(studioV21.mouse);updateStudioStatusV21()});
  studioV21.map.on('click',handleStudioMapClickV21);
  studioV21.map.on('mousemove',e=>{if(studioV21.tool==='atlas'&&studioV21.areaA)drawAreaPreviewV21(e.latlng)});
  setTimeout(()=>studioV21.map?.invalidateSize(false),80);
}
function clearLayerV21(layer){if(layer&&studioV21.map?.hasLayer(layer))studioV21.map.removeLayer(layer)}
function clearStudioDrawV21(){
  clearLayerV21(studioV21.route);clearLayerV21(studioV21.routeHit);studioV21.handles.forEach(clearLayerV21);studioV21.handles=[];
  Object.values(studioV21.cps).forEach(clearLayerV21);studioV21.cps={};Object.values(studioV21.marks).forEach(clearLayerV21);studioV21.marks={};
  clearLayerV21(studioV21.grid);studioV21.grid=null;studioV21.atlas.forEach(clearLayerV21);studioV21.atlas=[];clearLayerV21(studioV21.atlasArea);studioV21.atlasArea=null;
}
function drawStudioAllV21(){if(!studioV21.map)return;clearStudioDrawV21();drawStudioGridV21();drawStudioAtlasV21();drawStudioRouteV21();drawStudioCpsV21();drawStudioMarksV21();drawPathAnchorsV21();updateStudioHeaderMetricsV21();updateStudioStatusV21()}
function routeHandleStepV21(){const z=studioV21.map?.getZoom()||15;if(z>=18)return 1;if(z>=17)return 2;if(z>=16)return 4;if(z>=15)return 8;if(z>=14)return 14;return 24}
function routePointIconV21(i,active=false){const last=editorV13.route.length-1,label=i===0?'С':i===last?'Ф':'';return L.divIcon({className:'',html:`<span class="studio-route-node-v21 ${label?'endpoint':''} ${active?'active':''}">${label}</span>`,iconSize:[label?26:14,label?26:14],iconAnchor:[label?13:7,label?13:7]})}
function drawStudioRouteV21(){
  const map=studioV21.map;if(!map)return;
  studioV21.route=L.polyline(editorV13.route,{color:'#6c22c7',weight:5,opacity:.98,lineJoin:'round',lineCap:'round',smoothFactor:.05,interactive:false}).addTo(map);
  studioV21.routeHit=L.polyline(editorV13.route,{color:'#000',weight:24,opacity:0,interactive:true,bubblingMouseEvents:false}).addTo(map);
  studioV21.routeHit.on('click',e=>{L.DomEvent.stopPropagation(e);handleStudioRouteClickV21(e.latlng)});
  if(studioV21.tool==='select'){
    const step=routeHandleStepV21(),last=editorV13.route.length-1;
    editorV13.route.forEach((p,i)=>{if(i!==0&&i!==last&&i%step!==0&&!(studioV21.selected?.type==='vertex'&&studioV21.selected?.index===i))return;const m=L.marker(p,{icon:routePointIconV21(i,studioV21.selected?.type==='vertex'&&studioV21.selected.index===i),draggable:true,zIndexOffset:(i===0||i===last)?1400:1000}).addTo(map);m._routeIndexV21=i;
      m.on('dragstart',()=>pushStudioHistoryV21());m.on('drag',ev=>{const ll=ev.target.getLatLng();moveRouteVertexV21(i,ll.lat,ll.lng,false)});m.on('dragend',ev=>{const ll=ev.target.getLatLng();moveRouteVertexV21(i,ll.lat,ll.lng,true);studioV21.selected={type:'vertex',index:i};markDirtyV21();renderStudioInspectorV21();drawStudioAllV21()});m.on('click',ev=>{L.DomEvent.stopPropagation(ev);studioV21.selected={type:'vertex',index:i};renderStudioInspectorV21();drawStudioAllV21()});studioV21.handles.push(m)})
  }
}
function moveRouteVertexV21(i,lat,lon,final){
  const last=editorV13.route.length-1;editorV13.route[i]=[lat,lon];
  if(i===0){const s=editorV13.cps.find(x=>x.id==='cp0');if(s){s.lat=lat;s.lon=lon}if(editorV13.loopLocked!==false){editorV13.route[last]=[lat,lon];const f=editorV13.cps.find(x=>x.id==='cpf');if(f){f.lat=lat;f.lon=lon}}}
  if(i===last){const f=editorV13.cps.find(x=>x.id==='cpf');if(f){f.lat=lat;f.lon=lon}if(editorV13.loopLocked!==false){editorV13.route[0]=[lat,lon];const s=editorV13.cps.find(x=>x.id==='cp0');if(s){s.lat=lat;s.lon=lon}}}
  if(studioV21.route)studioV21.route.setLatLngs(editorV13.route);if(studioV21.routeHit)studioV21.routeHit.setLatLngs(editorV13.route);if(final)markDirtyV21();updateStudioHeaderMetricsV21();
}
function handleStudioRouteClickV21(ll){
  if(studioV21.tool==='add')return addRouteNodeV21(ll);
  if(studioV21.tool==='path')return choosePathAnchorV21(ll);
  if(studioV21.tool==='select'){const n=nearestRouteV13(ll.lat,ll.lng);if(n){studioV21.selected={type:'segment',index:n.seg,near:n};renderStudioInspectorV21()}}
}
function addRouteNodeV21(ll){const n=nearestRouteV13(ll.lat,ll.lng);if(!n)return;pushStudioHistoryV21();const p=[n.lat,n.lon];editorV13.route.splice(n.seg+1,0,p);rebuildTerrainAfterInsertV21(n.seg);studioV21.selected={type:'vertex',index:n.seg+1};studioV21.tool='select';markDirtyV21();document.querySelectorAll('[data-studio-tool]').forEach(b=>b.classList.toggle('active',b.dataset.studioTool==='select'));drawStudioAllV21();renderStudioInspectorV21();toast('Узел добавлен. Теперь его можно перетащить.')}
function rebuildTerrainAfterInsertV21(seg){const next={};Object.entries(editorV13.terrain||{}).forEach(([k,v])=>{const i=+k;next[i>seg?i+1:i]=v});next[seg+1]=next[seg]||'unknown';editorV13.terrain=next}
function deleteRouteNodeV21(i){const last=editorV13.route.length-1;if(i<=0||i>=last){toast('Старт и финиш можно двигать, но нельзя удалить');return}pushStudioHistoryV21();editorV13.route.splice(i,1);const next={};Object.entries(editorV13.terrain||{}).forEach(([k,v])=>{const n=+k;if(n===i)return;next[n>i?n-1:n]=v});editorV13.terrain=next;studioV21.selected=null;markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}
function updateSelectedVertexCoordsV21(){const i=studioV21.selected?.index,lat=+document.getElementById('studioVertexLatV21')?.value,lon=+document.getElementById('studioVertexLonV21')?.value;if(!Number.isFinite(i)||!Number.isFinite(lat)||!Number.isFinite(lon))return toast('Проверь координаты');pushStudioHistoryV21();moveRouteVertexV21(i,lat,lon,true);drawStudioAllV21();renderStudioInspectorV21()}

function cpIconStudioV21(cp,active){return L.divIcon({className:'',html:`<span class="studio-cp-v21 ${active?'active':''}">${esc(cp.number)}</span>`,iconSize:[26,26],iconAnchor:[13,13]})}
function drawStudioCpsV21(){const map=studioV21.map;if(!map)return;dynamicCpsV13().forEach(cp=>{const drag=studioV21.tool==='cp',m=L.marker([cp.lat,cp.lon],{icon:cpIconStudioV21(cp,studioV21.selected?.type==='cp'&&studioV21.selected.id===cp.id),draggable:drag,zIndexOffset:1250}).addTo(map);m.bindTooltip(`${cp.number==='С'?'Старт':cp.number==='Ф'?'Финиш':'КП '+cp.number} · ${cp.title} · ${gridCodeDynamicV13(cp.lat,cp.lon)}`,{direction:'top'});m.on('click',e=>{L.DomEvent.stopPropagation(e);studioV21.selected={type:'cp',id:cp.id};renderStudioInspectorV21();drawStudioAllV21()});if(drag){m.on('dragstart',()=>pushStudioHistoryV21());m.on('dragend',e=>{const ll=e.target.getLatLng(),obj=editorV13.cps.find(x=>x.id===cp.id);if(!obj)return;obj.lat=ll.lat;obj.lon=ll.lng;if(cp.id==='cp0'||cp.id==='cpf')moveCpEndpointV21(cp.id,ll.lat,ll.lng);markDirtyV21();studioV21.selected={type:'cp',id:cp.id};drawStudioAllV21();renderStudioInspectorV21()})}studioV21.cps[cp.id]=m})}
function moveCpEndpointV21(id,lat,lon){const last=editorV13.route.length-1;if(id==='cp0'){editorV13.route[0]=[lat,lon];if(editorV13.loopLocked!==false){editorV13.route[last]=[lat,lon];const f=editorV13.cps.find(x=>x.id==='cpf');if(f){f.lat=lat;f.lon=lon}}}else{editorV13.route[last]=[lat,lon];if(editorV13.loopLocked!==false){editorV13.route[0]=[lat,lon];const s=editorV13.cps.find(x=>x.id==='cp0');if(s){s.lat=lat;s.lon=lon}}}}
function addCpStudioV21(ll){pushStudioHistoryV21();const n=nearestRouteV13(ll.lat,ll.lng),id='cp_'+Date.now();editorV13.cps.push({id,title:'Новая контрольная точка',lat:n?.lat||ll.lat,lon:n?.lon||ll.lng,stopMin:0,locked:false});studioV21.selected={type:'cp',id};markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}
function saveCpStudioV21(){const id=studioV21.selected?.id,cp=editorV13.cps.find(x=>x.id===id);if(!cp)return;const title=document.getElementById('studioCpTitleV21')?.value.trim(),stopMin=Math.max(0,+document.getElementById('studioCpStopV21')?.value||0),lat=+document.getElementById('studioCpLatV21')?.value,lon=+document.getElementById('studioCpLonV21')?.value;if(!title||!Number.isFinite(lat)||!Number.isFinite(lon))return toast('Проверь название и координаты');pushStudioHistoryV21();Object.assign(cp,{title,stopMin,lat,lon});if(id==='cp0'||id==='cpf')moveCpEndpointV21(id,lat,lon);markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}
function deleteCpStudioV21(){const id=studioV21.selected?.id,cp=editorV13.cps.find(x=>x.id===id);if(!cp||cp.locked)return toast('Старт и финиш удалить нельзя');pushStudioHistoryV21();editorV13.cps=editorV13.cps.filter(x=>x.id!==id);studioV21.selected=null;markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}

function markIconV21(m,active=false){const meta=MAP_MARK_TYPES_V21[m.type]||MAP_MARK_TYPES_V21.poi;return L.divIcon({className:'',html:`<span class="studio-mark-v21 ${active?'active':''}">${meta.icon}</span>`,iconSize:[24,24],iconAnchor:[12,12]})}
function drawStudioMarksV21(){const map=studioV21.map;if(!map)return;ensureMapDataV21();editorV13.marks.forEach(m=>{const marker=L.marker([m.lat,m.lon],{icon:markIconV21(m,studioV21.selected?.type==='mark'&&studioV21.selected.id===m.id),draggable:studioV21.tool==='mark',zIndexOffset:1180}).addTo(map);marker.bindTooltip(`${m.title||'Метка'} · ${(+m.lat).toFixed(6)}, ${(+m.lon).toFixed(6)}`,{direction:'top'});marker.on('click',e=>{L.DomEvent.stopPropagation(e);studioV21.selected={type:'mark',id:m.id};renderStudioInspectorV21();drawStudioAllV21()});if(studioV21.tool==='mark'){marker.on('dragstart',()=>pushStudioHistoryV21());marker.on('dragend',e=>{const ll=e.target.getLatLng();m.lat=ll.lat;m.lon=ll.lng;markDirtyV21();studioV21.selected={type:'mark',id:m.id};drawStudioAllV21();renderStudioInspectorV21()})}studioV21.marks[m.id]=marker})}
function addMarkStudioV21(ll){pushStudioHistoryV21();const id='m_'+Date.now();editorV13.marks.push({id,type:'poi',title:'Новая точка',note:'',lat:ll.lat,lon:ll.lng});studioV21.selected={type:'mark',id};markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}
function saveMarkStudioV21(){const id=studioV21.selected?.id,m=editorV13.marks.find(x=>x.id===id);if(!m)return;const title=document.getElementById('studioMarkTitleV21')?.value.trim(),type=document.getElementById('studioMarkTypeV21')?.value||'poi',note=document.getElementById('studioMarkNoteV21')?.value||'',lat=+document.getElementById('studioMarkLatV21')?.value,lon=+document.getElementById('studioMarkLonV21')?.value;if(!title||!Number.isFinite(lat)||!Number.isFinite(lon))return toast('Проверь название и координаты');pushStudioHistoryV21();Object.assign(m,{title,type,note,lat,lon});markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}
function deleteMarkStudioV21(){const id=studioV21.selected?.id;pushStudioHistoryV21();editorV13.marks=editorV13.marks.filter(x=>x.id!==id);studioV21.selected=null;markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}

function studioGridBoundsV21(){const a=atlasV20.area||routeBoundsV20(Math.max(350,+atlasV20.margin||350)),map=studioV21.map;if(!map)return a;const b=map.getBounds();return {west:Math.min(a.west,b.getWest()),east:Math.max(a.east,b.getEast()),south:Math.min(a.south,b.getSouth()),north:Math.max(a.north,b.getNorth())}}
function drawStudioGridV21(){if(studioV21.tool!=='grid'&&!gridEnabledV12)return;const map=studioV21.map,b=studioGridBoundsV21(),g=gridCfgV13(),group=L.layerGroup(),x0=mercXV12(b.west),x1=mercXV12(b.east),y0=mercYV12(b.south),y1=mercYV12(b.north);const cMin=Math.max(0,Math.floor((x0-g.x0)/g.dx)-1),cMax=Math.ceil((x1-g.x0)/g.dx)+1,rMin=Math.max(0,Math.floor((g.y1-y1)/g.dy)-1),rMax=Math.ceil((g.y1-y0)/g.dy)+1,line={color:'#3f4542',weight:.75,opacity:.52,interactive:false};for(let c=cMin;c<=cMax;c++){const lon=lonFromXV12(g.x0+c*g.dx);L.polyline([[b.south,lon],[b.north,lon]],line).addTo(group)}for(let r=rMin;r<=rMax;r++){const lat=latFromYV12(g.y1-r*g.dy);L.polyline([[lat,b.west],[lat,b.east]],line).addTo(group)}if(map.getZoom()>=13){for(let c=cMin;c<cMax;c++){const lon=lonFromXV12(g.x0+(c+.5)*g.dx);L.marker([b.north,lon],{icon:L.divIcon({className:'',html:`<span class="studio-grid-label-v21">${String(c+1).padStart(2,'0')}</span>`,iconSize:[28,16],iconAnchor:[14,8]}),interactive:false}).addTo(group)}for(let r=rMin;r<rMax;r++){const lat=latFromYV12(g.y1-(r+.5)*g.dy);L.marker([lat,b.west],{icon:L.divIcon({className:'',html:`<span class="studio-grid-label-v21 row">${rowCodeV13(r)}</span>`,iconSize:[24,16],iconAnchor:[12,8]}),interactive:false}).addTo(group)}}studioV21.grid=group.addTo(map)}
function applyStudioGridV21(){const cell=Math.max(50,Math.min(1000,+document.getElementById('studioGridCellV21')?.value||200)),offsetX=+document.getElementById('studioGridXV21')?.value||0,offsetY=+document.getElementById('studioGridYV21')?.value||0;pushStudioHistoryV21();editorV13.grid={...editorV13.grid,cell,offsetX,offsetY};markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}
function resetStudioGridV21(){pushStudioHistoryV21();editorV13.grid={cell:200,offsetX:0,offsetY:0};markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}
function anchorGridToAreaV21(){const b=atlasBoundsCurrentV20();pushStudioHistoryV21();const cell=Math.max(50,+editorV13.grid.cell||200),cos=Math.max(.2,Math.cos(((b.north+b.south)/2)*Math.PI/180)),proj=cell/cos;editorV13.grid={cell,offsetX:0,offsetY:0,originX:mercXV12(b.west),originY:mercYV12(b.north),metricStep:proj,originCell:cell};markDirtyV21();drawStudioAllV21();renderStudioInspectorV21();toast('Сетка привязана к левому верхнему углу выбранной области')}
const gridCfgV13BeforeV21=gridCfgV13;
gridCfgV13=function(){const g=editorV13.grid||{};if(Number.isFinite(+g.originX)&&Number.isFinite(+g.originY)){const cell=Math.max(50,Math.min(1000,+g.cell||200)),base=Number.isFinite(+g.metricStep)?+g.metricStep:cell/Math.max(.2,Math.cos((editorV13.route?.[0]?.[0]||55.58)*Math.PI/180));const scale=cell/Math.max(1,+g.originCell||cell);return {cell,dx:base*scale,dy:base*scale,x0:+g.originX+(+g.offsetX||0)/Math.max(.2,Math.cos((editorV13.route?.[0]?.[0]||55.58)*Math.PI/180)),y1:+g.originY+(+g.offsetY||0)/Math.max(.2,Math.cos((editorV13.route?.[0]?.[0]||55.58)*Math.PI/180))}}return gridCfgV13BeforeV21()};

function drawStudioAtlasV21(){if(studioV21.tool!=='atlas')return;const map=studioV21.map,b=atlasBoundsCurrentV20();studioV21.atlasArea=L.rectangle([[b.south,b.west],[b.north,b.east]],{color:'#c7a65a',weight:3,dashArray:'8 5',fill:false,interactive:false}).addTo(map);sheetsV20().forEach(s=>{const r=L.rectangle([[s.south,s.west],[s.north,s.east]],{color:'#171815',weight:1.4,opacity:.8,fillColor:'#c7a65a',fillOpacity:.035,interactive:false}).addTo(map);const c=[(s.north+s.south)/2,(s.east+s.west)/2];const label=L.marker(c,{icon:L.divIcon({className:'',html:`<span class="studio-sheet-label-v21">${s.index}</span>`,iconSize:[28,28],iconAnchor:[14,14]}),interactive:false}).addTo(map);studioV21.atlas.push(r,label)})}
function startStudioAreaPickV21(){studioV21.tool='atlas';studioV21.areaA=null;clearStudioAreaPickV21();document.querySelectorAll('[data-studio-tool]').forEach(b=>b.classList.toggle('active',b.dataset.studioTool==='atlas'));renderStudioInspectorV21();toast('Кликни первый угол области, затем противоположный')}
function clearStudioAreaPickV21(){studioV21.areaA=null;clearLayerV21(studioV21.areaALayer);clearLayerV21(studioV21.areaPreview);studioV21.areaALayer=studioV21.areaPreview=null}
function handleStudioAreaClickV21(ll){if(!studioV21.areaA){studioV21.areaA=ll;studioV21.areaALayer=L.circleMarker(ll,{radius:6,color:'#171815',weight:2,fillColor:'#c7a65a',fillOpacity:1}).addTo(studioV21.map);renderStudioInspectorV21();return}pushStudioHistoryV21();const a=studioV21.areaA;atlasV20.area={west:Math.min(a.lng,ll.lng),east:Math.max(a.lng,ll.lng),south:Math.min(a.lat,ll.lat),north:Math.max(a.lat,ll.lat)};saveAtlasV20();markDirtyV21();clearStudioAreaPickV21();drawStudioAllV21();renderStudioInspectorV21();toast('Область атласа обновлена')}
function drawAreaPreviewV21(ll){clearLayerV21(studioV21.areaPreview);if(!studioV21.areaA)return;const a=studioV21.areaA;studioV21.areaPreview=L.rectangle([[Math.min(a.lat,ll.lat),Math.min(a.lng,ll.lng)],[Math.max(a.lat,ll.lat),Math.max(a.lng,ll.lng)]],{color:'#c7a65a',weight:2,dashArray:'6 4',fillColor:'#c7a65a',fillOpacity:.08,interactive:false}).addTo(studioV21.map)}
function applyAtlasQuickV21(){const count=+document.getElementById('studioAtlasCountV21')?.value||8,overlap=Math.max(0,+document.getElementById('studioAtlasOverlapV21')?.value||200);pushStudioHistoryV21();atlasV20.sheetCount=count;atlasV20.overlap=overlap;saveAtlasV20();markDirtyV21();drawStudioAllV21();renderStudioInspectorV21()}
function areaFromRouteStudioV21(){pushStudioHistoryV21();atlasV20.area=routeBoundsV20(Math.max(0,+atlasV20.margin||350));saveAtlasV20();markDirtyV21();drawStudioAllV21();renderStudioInspectorV21();fitStudioAreaV21()}

function nearestAnchorV21(ll){const n=nearestRouteV13(ll.lat,ll.lng);return n?{seg:n.seg,t:n.t,lat:n.lat,lon:n.lon,along:n.along}:null}
function choosePathAnchorV21(ll){const a=nearestAnchorV21(ll);if(!a)return;if(!studioV21.pathA){studioV21.pathA=a;studioV21.pathB=null;drawPathAnchorsV21();renderStudioInspectorV21();toast('A выбран. Теперь выбери конец участка B.');return}studioV21.pathB=a;if(studioV21.pathB.along<studioV21.pathA.along){const t=studioV21.pathA;studioV21.pathA=studioV21.pathB;studioV21.pathB=t}drawPathAnchorsV21();renderStudioInspectorV21();toast('A и B выбраны. Нажми «Проложить по тропам».')}
function drawPathAnchorsV21(){clearLayerV21(studioV21.pathALayer);clearLayerV21(studioV21.pathBLayer);clearLayerV21(studioV21.pathPreview);studioV21.pathALayer=studioV21.pathBLayer=studioV21.pathPreview=null;if(!studioV21.map)return;const mk=(p,l)=>L.marker([p.lat,p.lon],{icon:L.divIcon({className:'',html:`<span class="studio-path-anchor-v21">${l}</span>`,iconSize:[28,28],iconAnchor:[14,14]}),interactive:false,zIndexOffset:1600}).addTo(studioV21.map);if(studioV21.pathA)studioV21.pathALayer=mk(studioV21.pathA,'A');if(studioV21.pathB){studioV21.pathBLayer=mk(studioV21.pathB,'B');const a=studioV21.pathA,b=studioV21.pathB,pts=[[a.lat,a.lon]];for(let i=a.seg+1;i<=b.seg;i++)pts.push(editorV13.route[i]);pts.push([b.lat,b.lon]);studioV21.pathPreview=L.polyline(pts,{color:'#c7a65a',weight:7,opacity:.9,dashArray:'10 7',interactive:false}).addTo(studioV21.map)}}
function clearStudioPathV21(){studioV21.pathA=studioV21.pathB=null;clearLayerV21(studioV21.pathALayer);clearLayerV21(studioV21.pathBLayer);clearLayerV21(studioV21.pathPreview);studioV21.pathALayer=studioV21.pathBLayer=studioV21.pathPreview=null}
async function routeStudioPathV21(){if(studioV21.pathBusy||!studioV21.pathA||!studioV21.pathB)return;studioV21.pathBusy=true;renderStudioInspectorV21();const a=studioV21.pathA,b=studioV21.pathB;try{const u=`https://brouter.de/brouter?lonlats=${a.lon},${a.lat}%7C${b.lon},${b.lat}&profile=trekking&alternativeidx=0&format=geojson`,r=await fetch(u);if(!r.ok)throw new Error(`HTTP ${r.status}`);const j=await r.json(),coords=j?.features?.[0]?.geometry?.coordinates||j?.geometry?.coordinates;if(!Array.isArray(coords)||coords.length<2)throw new Error('no geometry');pushStudioHistoryV21();const repl=coords.map(c=>[+c[1],+c[0]]),prefix=editorV13.route.slice(0,a.seg+1),suffix=editorV13.route.slice(b.seg+1);if(havV13(prefix[prefix.length-1],[a.lat,a.lon])>.2)prefix.push([a.lat,a.lon]);if(havV13(repl[0],[a.lat,a.lon])>.2)repl.unshift([a.lat,a.lon]);if(havV13(repl[repl.length-1],[b.lat,b.lon])>.2)repl.push([b.lat,b.lon]);if(suffix.length&&havV13(repl[repl.length-1],suffix[0])<.2)suffix.shift();editorV13.route=[...prefix,...repl,...suffix];editorV13.terrain={};const start=prefix.length-1;for(let i=start;i<start+repl.length-1;i++)editorV13.terrain[i]='trail';clearStudioPathV21();markDirtyV21();drawStudioAllV21();renderStudioInspectorV21();toast('Фрагмент перестроен по доступным тропам OSM. Проверь линию перед сохранением.')}catch(e){console.error(e);toast('Автопрокладка не получилась. A и B оставлены — можно переставить одну границу и повторить.')}finally{studioV21.pathBusy=false;renderStudioInspectorV21()}}

function handleStudioMapClickV21(e){const ll=e.latlng;if(studioV21.tool==='cp')return addCpStudioV21(ll);if(studioV21.tool==='mark')return addMarkStudioV21(ll);if(studioV21.tool==='atlas')return handleStudioAreaClickV21(ll);if(studioV21.tool==='grid'){const c=gridCellDynamicV13(ll.lat,ll.lng);if(c)toast(`Квадрат ${c.code}`)}}
function fitStudioRouteV21(animate=true){if(!studioV21.map||!editorV13.route?.length)return;studioV21.map.fitBounds(L.latLngBounds(editorV13.route),{padding:[46,46],animate})}
function fitStudioAreaV21(){if(!studioV21.map)return;const b=atlasBoundsCurrentV20();studioV21.map.fitBounds([[b.south,b.west],[b.north,b.east]],{padding:[38,38],animate:true})}
function openNakarteV21(){if(!studioV21.map)return;const c=studioV21.map.getCenter(),z=Math.round(studioV21.map.getZoom()),l=studioV21.base==='sat'?'S':'O';window.open(`https://nakarte.me/#m=${z}/${c.lat.toFixed(5)}/${c.lng.toFixed(5)}&l=${l}`,'_blank','noopener')}
function openYandexV21(){if(!studioV21.map)return;const c=studioV21.map.getCenter(),z=Math.round(studioV21.map.getZoom());window.open(`https://yandex.ru/maps/?ll=${encodeURIComponent(c.lng+','+c.lat)}&z=${z}`,'_blank','noopener')}
function downloadGeoJsonV21(){ensureMapDataV21();const features=[{type:'Feature',properties:{name:'Маршрут'},geometry:{type:'LineString',coordinates:editorV13.route.map(p=>[p[1],p[0]])}},...dynamicCpsV13().map(cp=>({type:'Feature',properties:{name:cp.title,kind:'checkpoint',number:cp.number,stopMin:cp.stopMin||0},geometry:{type:'Point',coordinates:[cp.lon,cp.lat]}})),...editorV13.marks.map(m=>({type:'Feature',properties:{name:m.title,kind:m.type,note:m.note||''},geometry:{type:'Point',coordinates:[m.lon,m.lat]}}))];const b=atlasBoundsCurrentV20();features.push({type:'Feature',properties:{name:'Область атласа',kind:'atlas'},geometry:{type:'Polygon',coordinates:[[[b.west,b.south],[b.east,b.south],[b.east,b.north],[b.west,b.north],[b.west,b.south]]]}});const blob=new Blob([JSON.stringify({type:'FeatureCollection',features},null,2)],{type:'application/geo+json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='field-map.geojson';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}

function renderStudioInspectorV21(){const e=document.getElementById('studioInspectorV21');if(!e)return;let h='';
  if(studioV21.tool==='select')h=inspectorSelectV21();
  if(studioV21.tool==='add')h=`<div class="studio-ins-head-v21"><small>МАРШРУТ</small><h3>Добавить узел</h3></div><div class="studio-help-v21">Кликни по линии маршрута. Новая точка появится прямо на выбранном участке, после чего автоматически включится режим перемещения.</div>`;
  if(studioV21.tool==='path')h=inspectorPathV21();
  if(studioV21.tool==='cp')h=inspectorCpV21();
  if(studioV21.tool==='mark')h=inspectorMarkV21();
  if(studioV21.tool==='grid')h=inspectorGridV21();
  if(studioV21.tool==='atlas')h=inspectorAtlasV21();
  e.innerHTML=h;bindStudioInspectorV21();
}
function inspectorSelectV21(){const s=studioV21.selected;if(s?.type==='vertex'){const p=editorV13.route[s.index],last=editorV13.route.length-1;return `<div class="studio-ins-head-v21"><small>МАРШРУТ</small><h3>${s.index===0?'Старт':s.index===last?'Финиш':`Узел ${s.index+1}`}</h3></div><label>Широта<input id="studioVertexLatV21" value="${p[0].toFixed(7)}"></label><label>Долгота<input id="studioVertexLonV21" value="${p[1].toFixed(7)}"></label><button class="studio-btn-v21 primary wide" id="studioVertexApplyV21">Применить координаты</button><button class="studio-btn-v21 danger wide" id="studioVertexDeleteV21" ${s.index===0||s.index===last?'disabled':''}>Удалить точку</button><div class="studio-help-v21">На карте двигается только выбранный узел. Для более точного изгиба сначала добавь новый узел.</div>`}if(s?.type==='segment'){return `<div class="studio-ins-head-v21"><small>МАРШРУТ</small><h3>Участок</h3></div><div class="studio-stat-card-v21"><span>Отрезок</span><strong>${((havV13(editorV13.route[s.index],editorV13.route[s.index+1]))/1000).toFixed(2).replace('.',',')} км</strong></div><button class="studio-btn-v21 wide" id="studioSplitSegV21">Добавить узел в середине</button><div class="studio-help-v21">Для автопрокладки большого фрагмента выбери инструмент «По тропе A→B».</div>`}return `<div class="studio-ins-head-v21"><small>РЕДАКТОР</small><h3>Выбрать / двигать</h3></div><div class="studio-help-v21">Приблизь нужный участок. Белые узлы можно перетаскивать независимо. Старт и финиш для замкнутого маршрута двигаются вместе.</div><div class="studio-kpis-v21"><div><span>Длина</span><strong>${(routeLenV13()/1000).toFixed(2).replace('.',',')} км</strong></div><div><span>КП</span><strong>${dynamicCpsV13().filter(x=>!['С','Ф'].includes(x.number)).length}</strong></div><div><span>Финиш</span><strong>${finalEtaV13()}</strong></div></div>`}
function inspectorPathV21(){const a=studioV21.pathA,b=studioV21.pathB;return `<div class="studio-ins-head-v21"><small>МАРШРУТ</small><h3>По тропе A → B</h3></div><div class="studio-step-v21 ${a?'done':''}"><b>1</b><span>${a?`A · ${(a.along/1000).toFixed(2)} км`:'Кликни на маршруте начало участка'}</span></div><div class="studio-step-v21 ${b?'done':''}"><b>2</b><span>${b?`B · ${(b.along/1000).toFixed(2)} км`:'Кликни на маршруте конец участка'}</span></div><div class="studio-step-v21 ${a&&b?'ready':''}"><b>3</b><span>Проверь выделенный пунктиром фрагмент и запусти прокладку.</span></div><button class="studio-btn-v21 primary wide" id="studioPathGoV21" ${!a||!b||studioV21.pathBusy?'disabled':''}>${studioV21.pathBusy?'Прокладываю…':'Проложить по тропам'}</button><button class="studio-btn-v21 ghost wide" id="studioPathResetV21" ${!a&&!b?'disabled':''}>Сбросить A / B</button><div class="studio-help-v21">Автопрокладка использует trekking-маршрутизацию по известным дорогам и тропам OSM. Если нужной тропы нет в данных, оставь ручную геометрию.</div>`}
function inspectorCpV21(){const id=studioV21.selected?.type==='cp'?studioV21.selected.id:null,cp=id?editorV13.cps.find(x=>x.id===id):null,dyn=id?dynamicCpsV13().find(x=>x.id===id):null;if(!cp)return `<div class="studio-ins-head-v21"><small>КОНТРОЛЬНЫЕ ТОЧКИ</small><h3>Добавить КП</h3></div><div class="studio-help-v21">Кликни в нужном месте карты. Новая КП автоматически привяжется к ближайшему участку маршрута и получит координаты.</div>`;return `<div class="studio-ins-head-v21"><small>${dyn?.number==='С'?'СТАРТ':dyn?.number==='Ф'?'ФИНИШ':`КП ${dyn?.number||''}`}</small><h3>${esc(cp.title)}</h3></div><label>Название<input id="studioCpTitleV21" value="${esc(cp.title)}"></label><label>Остановка, мин<input id="studioCpStopV21" type="number" min="0" max="240" value="${cp.stopMin||0}"></label><div class="studio-grid2-v21"><label>Широта<input id="studioCpLatV21" value="${(+cp.lat).toFixed(7)}"></label><label>Долгота<input id="studioCpLonV21" value="${(+cp.lon).toFixed(7)}"></label></div><div class="studio-stat-card-v21"><span>Квадрат / ETA</span><strong>${gridCodeDynamicV13(cp.lat,cp.lon)} · ${dyn?.arrival||'—'}</strong></div><button class="studio-btn-v21 primary wide" id="studioCpSaveV21">Сохранить КП</button><button class="studio-btn-v21 danger wide" id="studioCpDeleteV21" ${cp.locked?'disabled':''}>Удалить КП</button>`}
function inspectorMarkV21(){const id=studioV21.selected?.type==='mark'?studioV21.selected.id:null,m=id?editorV13.marks.find(x=>x.id===id):null;if(!m)return `<div class="studio-ins-head-v21"><small>МЕТКИ</small><h3>Добавить точку</h3></div><div class="studio-help-v21">Кликни по карте. Метка не влияет на маршрут и время: это отдельный ориентир, парковка, лагерь, вода или произвольная подпись.</div>`;return `<div class="studio-ins-head-v21"><small>МЕТКА</small><h3>${esc(m.title)}</h3></div><label>Тип<select id="studioMarkTypeV21">${Object.entries(MAP_MARK_TYPES_V21).map(([k,v])=>`<option value="${k}" ${m.type===k?'selected':''}>${v.label}</option>`).join('')}</select></label><label>Название<input id="studioMarkTitleV21" value="${esc(m.title)}"></label><label>Описание<textarea id="studioMarkNoteV21" rows="3">${esc(m.note||'')}</textarea></label><div class="studio-grid2-v21"><label>Широта<input id="studioMarkLatV21" value="${(+m.lat).toFixed(7)}"></label><label>Долгота<input id="studioMarkLonV21" value="${(+m.lon).toFixed(7)}"></label></div><button class="studio-btn-v21 primary wide" id="studioMarkSaveV21">Сохранить метку</button><button class="studio-btn-v21 danger wide" id="studioMarkDeleteV21">Удалить метку</button>`}
function inspectorGridV21(){const g=editorV13.grid||{};return `<div class="studio-ins-head-v21"><small>КООРДИНАТНАЯ СЕТКА</small><h3>${+g.cell||200} × ${+g.cell||200} м</h3></div><label>Размер клетки, м<input id="studioGridCellV21" type="number" min="50" max="1000" step="50" value="${+g.cell||200}"></label><div class="studio-grid2-v21"><label>Смещение X, м<input id="studioGridXV21" type="number" step="25" value="${+g.offsetX||0}"></label><label>Смещение Y, м<input id="studioGridYV21" type="number" step="25" value="${+g.offsetY||0}"></label></div><button class="studio-btn-v21 primary wide" id="studioGridApplyV21">Применить</button><button class="studio-btn-v21 wide" id="studioGridAnchorV21">Привязать к области атласа</button><button class="studio-btn-v21 ghost wide" id="studioGridResetV21">Вернуть исходную сетку 200 м</button><div class="studio-help-v21">Для текущего лесопарка исходная привязка совпадает с PDF. Для новой территории можно привязать нулевую точку сетки к выбранной области.</div>`}
function inspectorAtlasV21(){const b=atlasBoundsCurrentV20(),s=boundsSizeV20(b),lay=layoutV20(atlasV20.sheetCount,b);return `<div class="studio-ins-head-v21"><small>ПЕЧАТНЫЙ АТЛАС</small><h3>${lay.cols} × ${lay.rows} · ${atlasV20.sheetCount} листов</h3></div><div class="studio-stat-card-v21"><span>Область</span><strong>${(s.w/1000).toFixed(2).replace('.',',')} × ${(s.h/1000).toFixed(2).replace('.',',')} км</strong></div><div class="studio-grid2-v21"><label>Листов<select id="studioAtlasCountV21">${[2,4,6,8,9,12,16].map(n=>`<option value="${n}" ${+atlasV20.sheetCount===n?'selected':''}>${n}</option>`).join('')}</select></label><label>Перекрытие, м<input id="studioAtlasOverlapV21" type="number" min="0" max="1000" step="50" value="${+atlasV20.overlap||0}"></label></div><button class="studio-btn-v21 primary wide" id="studioAtlasApplyV21">Обновить разбиение</button><button class="studio-btn-v21 wide" id="studioAtlasPickV21">Выбрать область двумя кликами</button><button class="studio-btn-v21 wide" id="studioAtlasRouteV21">Область по маршруту + запас</button><button class="studio-btn-v21 sand wide" id="studioAtlasDesignerV21">Открыть конструктор атласа</button><div class="studio-help-v21">На карте показаны реальные границы листов и зоны перекрытия. Подложку каждого листа, формат бумаги и состав PDF настраивай в конструкторе.</div>`}
function bindStudioInspectorV21(){
  document.getElementById('studioVertexApplyV21')?.addEventListener('click',updateSelectedVertexCoordsV21);document.getElementById('studioVertexDeleteV21')?.addEventListener('click',()=>deleteRouteNodeV21(studioV21.selected?.index));
  document.getElementById('studioSplitSegV21')?.addEventListener('click',()=>{const i=studioV21.selected?.index,a=editorV13.route[i],b=editorV13.route[i+1];if(a&&b)addRouteNodeV21({lat:(a[0]+b[0])/2,lng:(a[1]+b[1])/2})});
  document.getElementById('studioPathGoV21')?.addEventListener('click',routeStudioPathV21);document.getElementById('studioPathResetV21')?.addEventListener('click',()=>{clearStudioPathV21();drawStudioAllV21();renderStudioInspectorV21()});
  document.getElementById('studioCpSaveV21')?.addEventListener('click',saveCpStudioV21);document.getElementById('studioCpDeleteV21')?.addEventListener('click',deleteCpStudioV21);
  document.getElementById('studioMarkSaveV21')?.addEventListener('click',saveMarkStudioV21);document.getElementById('studioMarkDeleteV21')?.addEventListener('click',deleteMarkStudioV21);
  document.getElementById('studioGridApplyV21')?.addEventListener('click',applyStudioGridV21);document.getElementById('studioGridResetV21')?.addEventListener('click',resetStudioGridV21);document.getElementById('studioGridAnchorV21')?.addEventListener('click',anchorGridToAreaV21);
  document.getElementById('studioAtlasApplyV21')?.addEventListener('click',applyAtlasQuickV21);document.getElementById('studioAtlasPickV21')?.addEventListener('click',startStudioAreaPickV21);document.getElementById('studioAtlasRouteV21')?.addEventListener('click',areaFromRouteStudioV21);document.getElementById('studioAtlasDesignerV21')?.addEventListener('click',()=>{saveStudioV21();openAtlasDesignerV20()});
}
function updateStudioMouseV21(ll){if(!ll)return;const c=gridCellDynamicV13(ll.lat,ll.lng),coord=document.getElementById('studioCoordV21'),grid=document.getElementById('studioGridCodeV21');if(coord)coord.textContent=`${ll.lat.toFixed(6)}, ${ll.lng.toFixed(6)}`;if(grid)grid.textContent=`Квадрат ${c?.code||'—'}`}
function updateStudioHeaderMetricsV21(){const d=document.getElementById('studioDistanceV21'),e=document.getElementById('studioEtaV21');if(d)d.textContent=`${(routeLenV13()/1000).toFixed(2).replace('.',',')} км`;if(e)e.textContent=`Финиш ${finalEtaV13()}`}
function updateStudioStatusV21(){const s=document.getElementById('studioSaveStateV21'),z=document.getElementById('studioZoomV21'),u=document.getElementById('studioUndoV21'),r=document.getElementById('studioRedoV21');if(s){const dirty=studioIsDirtyV21();s.textContent=dirty?'Есть несохранённые изменения':'Сохранено';s.classList.toggle('dirty',dirty)}if(z&&studioV21.map)z.textContent=`zoom ${studioV21.map.getZoom()}`;if(u)u.disabled=!studioV21.history.length;if(r)r.disabled=!studioV21.future.length}

/* Atlas source simplification: exactly the three map families used in the project. */
if(typeof ATLAS_SOURCES_V20!=='undefined'){
  ATLAS_SOURCES_V20.osm.label='Тропы · OSM';ATLAS_SOURCES_V20.osm.short='Тропы';
  ATLAS_SOURCES_V20.sat.label='Спутник · Esri';ATLAS_SOURCES_V20.sat.short='Спутник';
  ATLAS_SOURCES_V20.city={label:'Город · Яндекс / городская схема',short:'Город',attribution:'© OpenStreetMap contributors © CARTO / © Яндекс Карты'};
}
sourceOptionsV20=function(value,inherit=false){let h=inherit?`<option value="inherit" ${value==='inherit'?'selected':''}>Как для детальных листов</option>`:'';['osm','sat','city'].forEach(k=>{const s=ATLAS_SOURCES_V20[k];h+=`<option value="${k}" ${value===k?'selected':''}>${s.label}</option>`});return h};
const sourceTilesBeforeV21=sourceTilesV20;
sourceTilesV20=function(source,x,y,z){if(source==='city'){if(mapCityUsesYandexV21())return [`https://tiles.api-maps.yandex.ru/v1/tiles/?apikey=${encodeURIComponent(yandexKeyV20())}&lang=ru_RU&x=${x}&y=${y}&z=${z}&l=map&projection=web_mercator`];return [`https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`]}return sourceTilesBeforeV21(source,x,y,z)};
const mapPageBeforeV21=mapPageV20;
mapPageV20=function(bounds,source,title,sheetMeta=null){let html=mapPageBeforeV21(bounds,source,title,sheetMeta);ensureMapDataV21();if(!editorV13.marks.length)return html;const z=zoomForBoundsV20(bounds,!!sheetMeta),nw=tileXYPrintV20(bounds.north,bounds.west,z),se=tileXYPrintV20(bounds.south,bounds.east,z),px0=nw[0]*256,py0=nw[1]*256,W=Math.max(100,se[0]*256-px0),H=Math.max(100,se[1]*256-py0),pxy=(lat,lon)=>{const t=tileXYPrintV20(lat,lon,z);return [t[0]*256-px0,t[1]*256-py0]};let marks='';editorV13.marks.filter(m=>inBoundsV20(m.lat,m.lon,bounds)).forEach(m=>{const p=pxy(m.lat,m.lon),meta=MAP_MARK_TYPES_V21[m.type]||MAP_MARK_TYPES_V21.poi;marks+=`<g class="atlas-mark-v21"><circle cx="${p[0]}" cy="${p[1]}" r="6"/><text x="${p[0]+9}" y="${p[1]-8}">${esc(meta.icon)} ${esc(m.title)}</text></g>`});return html.replace('</svg>',`<g class="atlas-marks-v21">${marks}</g></svg>`)};
const printCssBeforeV21=printCssV20;
printCssV20=function(){return printCssBeforeV21()+`.atlas-marks-v21 circle{fill:#c7a65a;stroke:#171815;stroke-width:2}.atlas-marks-v21 text{font:bold 11px Arial;fill:#171815;paint-order:stroke;stroke:#fff;stroke-width:4}`};

/* Small route map supports the same three viewing modes. */
const tileSpecBeforeV21=tileSpecV11;
tileSpecV11=function(kind){if(kind==='city'){const s=tileSpecStudioV21('city');return {url:s.url,opts:s.opts}}return tileSpecBeforeV21(kind)};
function injectCityButtonV21(){document.querySelectorAll('.map-layer-switch-v11').forEach(g=>{if(g.querySelector('[data-map-layer-v11="city"]'))return;const b=document.createElement('button');b.type='button';b.dataset.mapLayerV11='city';b.textContent='Город';g.appendChild(b);b.addEventListener('click',()=>{if(routeBaseV11==='city')return;replaceBaseV11(routeMapV11,document.querySelector('.map-shell-v11'),'city',false);g.querySelectorAll('[data-map-layer-v11]').forEach(x=>x.classList.toggle('active',x.dataset.mapLayerV11==='city'))})})}

const toolbarBeforeV21=editorToolbarV13;
editorToolbarV13=function(){const s=toolbarBeforeV21();return s.replace(/<\/div>\s*$/,'<button class="btn sand" id="openMapStudioV21">Карта на весь экран</button><button class="btn alt" id="downloadGeoJsonV21">GeoJSON</button></div>')};
const bindBeforeV21=bind;
bind=function(){bindBeforeV21();document.getElementById('openMapStudioV21')?.addEventListener('click',openStudioV21);document.getElementById('downloadGeoJsonV21')?.addEventListener('click',downloadGeoJsonV21);injectCityButtonV21()};
const buildV21=document.querySelector('.build-label');if(buildV21)buildV21.textContent='V15 · полноэкранная карта · финальный атлас';
window.addEventListener('keydown',e=>{if(!studioV21.open)return;if(e.key==='Escape')closeStudioV21(false);if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveStudioV21()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redoStudioV21():undoStudioV21()}});
render();
