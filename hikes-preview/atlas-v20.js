/* V14 — field atlas constructor: sources, area, sheet split, overlap and per-sheet print. */
const ATLAS_V20_KEY='rl_hike_atlas_v20';
const YANDEX_KEY_V20='rl_hike_yandex_tiles_key';
const ATLAS_SOURCES_V20={
  osm:{label:'OSM · тропы и дороги',short:'OSM',attribution:'© OpenStreetMap contributors'},
  sat:{label:'Спутник · Esri World Imagery',short:'Спутник',attribution:'Esri World Imagery'},
  hybrid:{label:'Гибрид · спутник + подписи',short:'Гибрид',attribution:'Esri World Imagery / Reference'},
  yandex:{label:'Яндекс · схема (API)',short:'Яндекс',attribution:'© Яндекс Карты'}
};
function defaultAtlasV20(){
  return {
    paper:'A4',orientation:'landscape',sheetCount:8,overlap:200,margin:350,
    overview1:'sat',overview2:'osm',detailDefault:'osm',
    includeOverview:true,includePlan:true,includeNav:true,includeGrid:true,includeCps:true,
    area:null,sheetSources:{},selected:{}
  };
}
function loadAtlasV20(){try{const x=JSON.parse(localStorage.getItem(ATLAS_V20_KEY)||'null');return {...defaultAtlasV20(),...(x||{}),sheetSources:{...(x?.sheetSources||{})},selected:{...(x?.selected||{})}}}catch(e){return defaultAtlasV20()}}
let atlasV20=loadAtlasV20(),atlasPickLayerV20=null;
function saveAtlasV20(){try{localStorage.setItem(ATLAS_V20_KEY,JSON.stringify(atlasV20))}catch(e){}}
function yandexKeyV20(){try{return localStorage.getItem(YANDEX_KEY_V20)||''}catch(e){return ''}}
function setYandexKeyV20(v){try{if(v)localStorage.setItem(YANDEX_KEY_V20,v);else localStorage.removeItem(YANDEX_KEY_V20)}catch(e){}}
function cosLatV20(bounds){return Math.cos((((bounds.north+bounds.south)/2)*Math.PI)/180)}
function projGroundV20(m,bounds){return m/Math.max(.2,cosLatV20(bounds))}
function routeBoundsV20(margin=350){
  const lats=editorV13.route.map(p=>+p[0]),lons=editorV13.route.map(p=>+p[1]);
  let west=Math.min(...lons),east=Math.max(...lons),south=Math.min(...lats),north=Math.max(...lats);
  const raw={west,east,south,north},pad=projGroundV20(Math.max(0,+margin||0),raw);
  let x0=mercXV12(west)-pad,x1=mercXV12(east)+pad,y0=mercYV12(south)-pad,y1=mercYV12(north)+pad;
  return {west:lonFromXV12(x0),east:lonFromXV12(x1),south:latFromYV12(y0),north:latFromYV12(y1)};
}
function atlasBoundsCurrentV20(){
  if(atlasV20.area&&Number.isFinite(+atlasV20.area.west))return {...atlasV20.area};
  if(typeof GRID_V12!=='undefined')return {west:GRID_V12.west,east:GRID_V12.east,south:GRID_V12.south,north:GRID_V12.north};
  return routeBoundsV20(atlasV20.margin);
}
function boundsSizeV20(b){
  const lat=(b.north+b.south)/2*Math.PI/180;
  const w=(mercXV12(b.east)-mercXV12(b.west))*Math.cos(lat);
  const h=(mercYV12(b.north)-mercYV12(b.south))*Math.cos(lat);
  return {w,h,aspect:w/Math.max(1,h)};
}
function factorPairsV20(n){const out=[];for(let r=1;r<=n;r++)if(n%r===0)out.push([n/r,r]);return out}
function layoutV20(count,bounds){
  const target=boundsSizeV20(bounds).aspect,pageAspect=1.35;
  let best=null;
  factorPairsV20(Math.max(1,+count||1)).forEach(([cols,rows])=>{
    const score=Math.abs(Math.log(((cols/rows)*pageAspect)/Math.max(.01,target)));
    if(!best||score<best.score)best={cols,rows,score};
  });
  return best||{cols:1,rows:1};
}
function splitBoundsV20(bounds,count,overlapM){
  const {cols,rows}=layoutV20(count,bounds),x0=mercXV12(bounds.west),x1=mercXV12(bounds.east),y0=mercYV12(bounds.south),y1=mercYV12(bounds.north);
  const dx=(x1-x0)/cols,dy=(y1-y0)/rows,ov=projGroundV20(Math.max(0,+overlapM||0),bounds)/2,out=[];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const left=x0+c*dx-(c?ov:0),right=x0+(c+1)*dx+(c<cols-1?ov:0);
    const top=y1-r*dy+(r?ov:0),bottom=y1-(r+1)*dy-(r<rows-1?ov:0);
    out.push({index:r*cols+c+1,row:r,col:c,rows,cols,west:lonFromXV12(left),east:lonFromXV12(right),north:latFromYV12(top),south:latFromYV12(bottom)});
  }
  return out;
}
function sourceOptionsV20(value,inherit=false){
  let h=inherit?`<option value="inherit" ${value==='inherit'?'selected':''}>Как для детальных листов</option>`:'';
  Object.entries(ATLAS_SOURCES_V20).forEach(([k,s])=>h+=`<option value="${k}" ${value===k?'selected':''}>${s.label}</option>`);
  return h;
}
function atlasSourceForSheetV20(i){const x=atlasV20.sheetSources?.[i];return !x||x==='inherit'?atlasV20.detailDefault:x}
function atlasSelectedV20(i){return atlasV20.selected?.[i]!==false}
function sheetsV20(){return splitBoundsV20(atlasBoundsCurrentV20(),atlasV20.sheetCount,atlasV20.overlap)}
function atlasSchemeV20(active=0,forPrint=false){
  const sh=sheetsV20(),meta=sh[0]||{cols:1,rows:1};
  return `<div class="atlas-scheme-v20 ${forPrint?'print':''}" style="grid-template-columns:repeat(${meta.cols},1fr)">${sh.map(s=>`<span class="${s.index===active?'active':''}">${s.index}</span>`).join('')}</div>`;
}
function modalRootV20(){
  let el=document.getElementById('atlasDesignerV20');
  if(!el){el=document.createElement('div');el.id='atlasDesignerV20';el.className='atlas-modal-v20';document.body.appendChild(el)}
  return el;
}
function closeAtlasV20(){document.getElementById('atlasDesignerV20')?.remove()}
function areaTextV20(){const s=boundsSizeV20(atlasBoundsCurrentV20());return `${(s.w/1000).toFixed(2).replace('.',',')} × ${(s.h/1000).toFixed(2).replace('.',',')} км`}
function renderAtlasDesignerV20(){
  const root=modalRootV20(),b=atlasBoundsCurrentV20(),sh=sheetsV20(),lay=layoutV20(atlasV20.sheetCount,b),key=yandexKeyV20();
  root.innerHTML=`<div class="atlas-backdrop-v20" data-atlas-close></div><section class="atlas-dialog-v20">
    <header><div><small>ПОЛЕВОЙ АТЛАС</small><h2>Конструктор печатных листов</h2><p>Обзорные карты и детальные листы строятся из одной географической области. Подложку можно задавать отдельно для каждого листа.</p></div><button class="atlas-x-v20" data-atlas-close>×</button></header>
    <div class="atlas-body-v20">
      <div class="atlas-config-v20">
        <section class="atlas-block-v20"><h3>1. Область</h3><div class="atlas-area-line-v20"><strong>${areaTextV20()}</strong><span>${b.south.toFixed(5)}, ${b.west.toFixed(5)} → ${b.north.toFixed(5)}, ${b.east.toFixed(5)}</span></div>
          <div class="atlas-actions-v20"><button class="btn alt sm" id="atlasAreaRouteV20">По маршруту + запас</button><button class="btn alt sm" id="atlasAreaPickV20">Выбрать на карте</button><button class="btn alt sm" id="atlasAreaPdfV20">Область исходного атласа</button></div>
          <label>Запас вокруг маршрута, м<input id="atlasMarginV20" type="number" min="0" max="3000" step="50" value="${atlasV20.margin}"></label>
        </section>
        <section class="atlas-block-v20"><h3>2. Бумага и разбиение</h3><div class="atlas-grid3-v20">
          <label>Формат<select id="atlasPaperV20"><option ${atlasV20.paper==='A4'?'selected':''}>A4</option><option ${atlasV20.paper==='A3'?'selected':''}>A3</option></select></label>
          <label>Ориентация<select id="atlasOrientV20"><option value="landscape" ${atlasV20.orientation==='landscape'?'selected':''}>Альбомная</option><option value="portrait" ${atlasV20.orientation==='portrait'?'selected':''}>Книжная</option></select></label>
          <label>Листов<select id="atlasCountV20">${[2,4,6,8,9,12,16].map(n=>`<option value="${n}" ${+atlasV20.sheetCount===n?'selected':''}>${n}</option>`).join('')}</select></label>
        </div><div class="atlas-grid2-v20">
          <label>Перекрытие соседей, м<input id="atlasOverlapV20" type="number" min="0" max="1000" step="50" value="${atlasV20.overlap}"></label>
          <div class="atlas-layout-note-v20"><small>Авторазбивка</small><strong>${lay.cols} × ${lay.rows}</strong><span>${sh.length} листов</span></div>
        </div></section>
        <section class="atlas-block-v20"><h3>3. Подложки</h3>
          <div class="atlas-grid2-v20"><label>Обзор 1<select id="atlasOverview1V20">${sourceOptionsV20(atlasV20.overview1)}</select></label><label>Обзор 2<select id="atlasOverview2V20">${sourceOptionsV20(atlasV20.overview2)}</select></label></div>
          <label>По умолчанию для детальных листов<select id="atlasDetailV20">${sourceOptionsV20(atlasV20.detailDefault)}</select></label>
          <div class="atlas-yandex-v20"><div><b>Яндекс · схема</b><small>Для официального Tiles API нужен ключ. Спутник и гибрид Яндекса через Tiles API недоступны, поэтому для этих режимов используется спутниковая подложка Esri.</small></div><input id="atlasYandexKeyV20" type="password" placeholder="API key Yandex Tiles" value="${esc(key)}"></div>
        </section>
        <section class="atlas-block-v20"><h3>4. Содержимое</h3><div class="atlas-checks-v20">
          <label><input id="atlasOverviewChkV20" type="checkbox" ${atlasV20.includeOverview?'checked':''}> Обзорные листы</label>
          <label><input id="atlasGridChkV20" type="checkbox" ${atlasV20.includeGrid?'checked':''}> Координатная сетка</label>
          <label><input id="atlasCpsChkV20" type="checkbox" ${atlasV20.includeCps?'checked':''}> КП</label>
          <label><input id="atlasPlanChkV20" type="checkbox" ${atlasV20.includePlan?'checked':''}> Маршрутный план</label>
          <label><input id="atlasNavChkV20" type="checkbox" ${atlasV20.includeNav?'checked':''}> Азимуты</label>
        </div></section>
      </div>
      <aside class="atlas-sheets-panel-v20"><div class="atlas-sheets-head-v20"><div><small>ДЕТАЛЬНЫЕ ЛИСТЫ</small><strong>${lay.cols} × ${lay.rows}</strong></div>${atlasSchemeV20()}</div>
        <div class="atlas-sheet-list-v20">${sh.map(s=>`<div class="atlas-sheet-row-v20"><label class="atlas-sheet-check-v20"><input type="checkbox" data-atlas-sheet-check="${s.index}" ${atlasSelectedV20(s.index)?'checked':''}><b>Лист ${s.index}</b></label><select data-atlas-sheet-source="${s.index}">${sourceOptionsV20(atlasV20.sheetSources?.[s.index]||'inherit',true)}</select><button class="btn alt sm" data-atlas-one="${s.index}">Открыть</button></div>`).join('')}</div>
      </aside>
    </div>
    <footer><div><small>Как в исходном атласе: общий обзор → перекрывающиеся детальные листы → маршрутный план.</small></div><div class="atlas-footer-actions-v20"><button class="btn alt" id="atlasSheetsOnlyV20">Только листы</button><button class="btn sand" id="atlasFullV20">Сводный атлас</button></div></footer>
  </section>`;
  bindAtlasDesignerV20();
}
function readAtlasControlsV20(){
  const val=id=>document.getElementById(id)?.value;
  atlasV20.paper=val('atlasPaperV20')||atlasV20.paper;atlasV20.orientation=val('atlasOrientV20')||atlasV20.orientation;
  atlasV20.sheetCount=+val('atlasCountV20')||atlasV20.sheetCount;atlasV20.overlap=Math.max(0,+val('atlasOverlapV20')||0);atlasV20.margin=Math.max(0,+val('atlasMarginV20')||0);
  atlasV20.overview1=val('atlasOverview1V20')||atlasV20.overview1;atlasV20.overview2=val('atlasOverview2V20')||atlasV20.overview2;atlasV20.detailDefault=val('atlasDetailV20')||atlasV20.detailDefault;
  atlasV20.includeOverview=!!document.getElementById('atlasOverviewChkV20')?.checked;atlasV20.includeGrid=!!document.getElementById('atlasGridChkV20')?.checked;
  atlasV20.includeCps=!!document.getElementById('atlasCpsChkV20')?.checked;atlasV20.includePlan=!!document.getElementById('atlasPlanChkV20')?.checked;atlasV20.includeNav=!!document.getElementById('atlasNavChkV20')?.checked;
  document.querySelectorAll('[data-atlas-sheet-check]').forEach(x=>atlasV20.selected[x.dataset.atlasSheetCheck]=x.checked);
  document.querySelectorAll('[data-atlas-sheet-source]').forEach(x=>atlasV20.sheetSources[x.dataset.atlasSheetSource]=x.value);
  setYandexKeyV20(val('atlasYandexKeyV20')?.trim()||'');saveAtlasV20();
}
function bindAtlasDesignerV20(){
  document.querySelectorAll('[data-atlas-close]').forEach(b=>b.onclick=closeAtlasV20);
  ['atlasPaperV20','atlasOrientV20','atlasCountV20','atlasOverlapV20','atlasOverview1V20','atlasOverview2V20','atlasDetailV20','atlasOverviewChkV20','atlasGridChkV20','atlasCpsChkV20','atlasPlanChkV20','atlasNavChkV20'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>{readAtlasControlsV20();renderAtlasDesignerV20()}));
  document.getElementById('atlasMarginV20')?.addEventListener('change',readAtlasControlsV20);
  document.getElementById('atlasYandexKeyV20')?.addEventListener('change',readAtlasControlsV20);
  document.querySelectorAll('[data-atlas-sheet-check],[data-atlas-sheet-source]').forEach(x=>x.addEventListener('change',readAtlasControlsV20));
  document.getElementById('atlasAreaRouteV20')?.addEventListener('click',()=>{readAtlasControlsV20();atlasV20.area=routeBoundsV20(atlasV20.margin);saveAtlasV20();renderAtlasDesignerV20()});
  document.getElementById('atlasAreaPdfV20')?.addEventListener('click',()=>{atlasV20.area={west:GRID_V12.west,east:GRID_V12.east,south:GRID_V12.south,north:GRID_V12.north};saveAtlasV20();renderAtlasDesignerV20()});
  document.getElementById('atlasAreaPickV20')?.addEventListener('click',pickAreaOnMapV20);
  document.getElementById('atlasFullV20')?.addEventListener('click',()=>{readAtlasControlsV20();openAtlasOutputV20('full')});
  document.getElementById('atlasSheetsOnlyV20')?.addEventListener('click',()=>{readAtlasControlsV20();openAtlasOutputV20('sheets')});
  document.querySelectorAll('[data-atlas-one]').forEach(b=>b.onclick=()=>{readAtlasControlsV20();openAtlasOutputV20('one',+b.dataset.atlasOne)});
}
function pickAreaOnMapV20(){
  if(editorModeV13){toast('Сначала заверши или сохрани редактирование маршрута, затем выбери область атласа.');return}
  closeAtlasV20();tab='route';render();
  setTimeout(()=>{
    if(!routeMapV11){toast('Карта ещё не готова');return}
    let first=null,mark=null,rect=null;
    toast('Область атласа: кликни первый угол, затем противоположный.');
    const h=e=>{
      if(!first){first=e.latlng;mark=L.circleMarker(first,{radius:6,color:'#171815',weight:2,fillColor:'#c7a65a',fillOpacity:1}).addTo(routeMapV11);toast('Первый угол выбран. Кликни противоположный угол.');return}
      const second=e.latlng;
      atlasV20.area={west:Math.min(first.lng,second.lng),east:Math.max(first.lng,second.lng),south:Math.min(first.lat,second.lat),north:Math.max(first.lat,second.lat)};
      if(mark)routeMapV11.removeLayer(mark);if(rect)routeMapV11.removeLayer(rect);routeMapV11.off('click',h);saveAtlasV20();toast('Область атласа сохранена');openAtlasDesignerV20();
    };
    routeMapV11.on('click',h);
  },180);
}
function openAtlasDesignerV20(){renderAtlasDesignerV20()}
function validateSourcesV20(mode,one){
  const used=new Set();
  if(mode==='full'&&atlasV20.includeOverview){used.add(atlasV20.overview1);used.add(atlasV20.overview2)}
  sheetsV20().forEach(s=>{if((mode!=='one'||s.index===one)&&atlasSelectedV20(s.index))used.add(atlasSourceForSheetV20(s.index))});
  if(used.has('yandex')&&!yandexKeyV20()){toast('Для подложки Яндекс введи API key Tiles API в конструкторе атласа.');return false}
  return true;
}
function tileXYPrintV20(lat,lon,z){const n=2**z,x=(lon+180)/360*n,lr=lat*Math.PI/180,y=(1-Math.asinh(Math.tan(lr))/Math.PI)/2*n;return [x,y]}
function sourceTilesV20(source,x,y,z){
  if(source==='sat')return [`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`];
  if(source==='hybrid')return [
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
    `https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${z}/${y}/${x}`
  ];
  if(source==='yandex')return [`https://tiles.api-maps.yandex.ru/v1/tiles/?apikey=${encodeURIComponent(yandexKeyV20())}&lang=ru_RU&x=${x}&y=${y}&z=${z}&l=map&projection=web_mercator`];
  return [`https://tile.openstreetmap.org/${z}/${x}/${y}.png`];
}
function zoomForBoundsV20(bounds,detail){
  const s=boundsSizeV20(bounds),max=Math.max(s.w,s.h);
  if(!detail)return max<4500?14:13;
  if(max<1300)return 17;if(max<2600)return 16;return 15;
}
function inBoundsV20(lat,lon,b){return lat<=b.north&&lat>=b.south&&lon>=b.west&&lon<=b.east}
function mapPageV20(bounds,source,title,sheetMeta=null){
  const z=zoomForBoundsV20(bounds,!!sheetMeta),nw=tileXYPrintV20(bounds.north,bounds.west,z),se=tileXYPrintV20(bounds.south,bounds.east,z);
  const px0=nw[0]*256,py0=nw[1]*256,px1=se[0]*256,py1=se[1]*256,W=Math.max(100,px1-px0),H=Math.max(100,py1-py0);
  const x0=Math.floor(nw[0]),x1=Math.floor(se[0]),y0=Math.floor(nw[1]),y1=Math.floor(se[1]),imgs=[];
  for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){
    sourceTilesV20(source,x,y,z).forEach((url,layer)=>imgs.push(`<img class="atlas-tile-v20 layer-${layer}" src="${url}" style="left:${((x*256-px0)/W*100).toFixed(5)}%;top:${((y*256-py0)/H*100).toFixed(5)}%;width:${(256/W*100).toFixed(5)}%;height:${(256/H*100).toFixed(5)}%">`));
  }
  const pxy=(lat,lon)=>{const t=tileXYPrintV20(lat,lon,z);return [t[0]*256-px0,t[1]*256-py0]};
  const routePts=editorV13.route.map(p=>pxy(p[0],p[1]).join(',')).join(' ');
  let grid='',gridLabels='';
  if(atlasV20.includeGrid){
    const g=gridCfgV13(),ax0=mercXV12(bounds.west),ax1=mercXV12(bounds.east),ay0=mercYV12(bounds.south),ay1=mercYV12(bounds.north);
    const cMin=Math.max(0,Math.floor((ax0-g.x0)/g.dx)-1),cMax=Math.ceil((ax1-g.x0)/g.dx)+1,rMin=Math.max(0,Math.floor((g.y1-ay1)/g.dy)-1),rMax=Math.ceil((g.y1-ay0)/g.dy)+1;
    for(let c=cMin;c<=cMax;c++){const lon=lonFromXV12(g.x0+c*g.dx),a=pxy(bounds.north,lon),bb=pxy(bounds.south,lon);grid+=`<line x1="${a[0]}" y1="${a[1]}" x2="${bb[0]}" y2="${bb[1]}"/>`;if(c<cMax){const lon2=lonFromXV12(g.x0+(c+.5)*g.dx),p=pxy(bounds.north,lon2);gridLabels+=`<text x="${p[0]}" y="18">${String(c+1).padStart(2,'0')}</text>`}}
    for(let r=rMin;r<=rMax;r++){const lat=latFromYV12(g.y1-r*g.dy),a=pxy(lat,bounds.west),bb=pxy(lat,bounds.east);grid+=`<line x1="${a[0]}" y1="${a[1]}" x2="${bb[0]}" y2="${bb[1]}"/>`;if(r<rMax&&CYR_ROWS_V13[r]){const lat2=latFromYV12(g.y1-(r+.5)*g.dy),p=pxy(lat2,bounds.west);gridLabels+=`<text x="13" y="${p[1]}">${CYR_ROWS_V13[r]}</text>`}}
  }
  let cps='';
  if(atlasV20.includeCps)dynamicCpsV13().filter(cp=>inBoundsV20(cp.lat,cp.lon,bounds)).forEach(cp=>{const p=pxy(cp.lat,cp.lon);cps+=`<g><circle cx="${p[0]}" cy="${p[1]}" r="6"/><text x="${p[0]+9}" y="${p[1]-8}">${esc(cp.number)} ${esc(cp.title)}</text></g>`});
  const src=ATLAS_SOURCES_V20[source]||ATLAS_SOURCES_V20.osm;
  const side=sheetMeta?`<aside class="atlas-print-side-v20"><div><small>ОБЗОРНАЯ СХЕМА</small>${atlasSchemeV20(sheetMeta.index,true)}</div><div class="atlas-print-legend-v20"><b>Лист ${sheetMeta.index}</b><span>${src.label}</span><span>Перекрытие: ${atlasV20.overlap} м</span><span>Сетка: ${gridCfgV13().cell} м</span><span>Масштаб: детальный</span></div></aside>`:'';
  return `<section class="atlas-page-v20"><header><div><small>${src.short.toUpperCase()}</small><h1>${esc(title)}</h1></div><b>${(routeLenV13()/1000).toFixed(1).replace('.',',')} км · ${gridCfgV13().cell} м</b></header><div class="atlas-map-layout-v20"><div class="atlas-map-crop-v20">${imgs.join('')}<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><g class="atlas-grid-lines-v20">${grid}</g><g class="atlas-grid-labels-v20">${gridLabels}</g><polyline class="atlas-route-halo-v20" points="${routePts}"/><polyline class="atlas-route-v20" points="${routePts}"/><g class="atlas-cps-v20">${cps}</g></svg>${source==='yandex'?'<div class="atlas-brand-v20">Яндекс Карты</div>':''}</div>${side}</div><footer><span>${src.attribution}</span><span>Разные люди · полевой атлас · ${new Date().toLocaleDateString('ru-RU')}</span></footer></section>`;
}
function tablePlanV20(){
  const cps=dynamicCpsV13(),rows=cps.map((cp,i)=>{const prev=i?cps[i-1]:null;return `<tr><td>${cp.number}</td><td>${esc(cp.title)}</td><td>${cp.km.toFixed(1)}</td><td>${prev?(cp.km-prev.km).toFixed(1):'—'}</td><td>${cp.arrival}</td><td>${cp.stopMin||''}</td><td>${gridCodeDynamicV13(cp.lat,cp.lon)}</td><td>${cp.lat.toFixed(6)}, ${cp.lon.toFixed(6)}</td></tr>`}).join('');
  return `<section class="atlas-page-v20 atlas-table-v20"><header><div><small>МАРШРУТНЫЙ ПЛАН</small><h1>Время и координаты</h1></div><b>${(routeLenV13()/1000).toFixed(1)} км · ${editorV13.start} → ${finalEtaV13()}</b></header><table><thead><tr><th>КП</th><th>Название</th><th>Км</th><th>От пред.</th><th>ETA</th><th>Стоп</th><th>Квадрат</th><th>WGS84</th></tr></thead><tbody>${rows}</tbody></table><footer><span>Расстояние и ETA рассчитаны по текущей геометрии маршрута.</span></footer></section>`;
}
function tableNavV20(){
  const cps=dynamicCpsV13(),rows=cps.slice(0,-1).map((a,i)=>{const b=cps[i+1];return `<tr><td>${i+1}</td><td>${esc(a.title)} → ${esc(b.title)}</td><td>${(b.km-a.km).toFixed(1)} км</td><td>${Math.round(bearingV13([a.lat,a.lon],[b.lat,b.lon]))}°</td><td>${esc(terrainSummaryV13(a.km*1000,b.km*1000))}</td></tr>`}).join('');
  return `<section class="atlas-page-v20 atlas-table-v20"><header><div><small>НАВИГАЦИЯ</small><h1>Переходы и азимуты</h1></div><b>Автоматический расчёт</b></header><table><thead><tr><th>#</th><th>Переход</th><th>По маршруту</th><th>Азимут</th><th>Тип движения</th></tr></thead><tbody>${rows}</tbody></table><footer><span>Приоритет на местности: реальные тропы, дороги и линейные ориентиры.</span></footer></section>`;
}
function printCssV20(){
  const paper=atlasV20.paper==='A3'?'A3':'A4',orientation=atlasV20.orientation==='portrait'?'portrait':'landscape';
  return `@page{size:${paper} ${orientation};margin:7mm}*{box-sizing:border-box}body{margin:0;background:#d9d8d2;color:#171815;font:10px Arial,sans-serif}.printbar{position:sticky;top:0;z-index:99;background:#171815;color:#fff;padding:10px;text-align:center}.printbar button{padding:9px 16px;margin-right:10px}.atlas-page-v20{width:${orientation==='landscape'?'281mm':'194mm'};height:${orientation==='landscape'?'194mm':'281mm'};margin:7px auto;background:#f2eee5;padding:6mm;display:flex;flex-direction:column;page-break-after:always}.atlas-page-v20 header{display:flex;justify-content:space-between;align-items:end;border-bottom:1px solid #777;padding-bottom:2.5mm}.atlas-page-v20 h1{margin:1mm 0 0;font-size:20px;text-transform:uppercase}.atlas-page-v20 small{letter-spacing:.11em;color:#725f3f}.atlas-map-layout-v20{display:grid;grid-template-columns:minmax(0,1fr) 42mm;gap:4mm;flex:1;min-height:0;margin-top:3mm}.atlas-page-v20:not(:has(.atlas-print-side-v20)) .atlas-map-layout-v20{grid-template-columns:1fr}.atlas-map-crop-v20{position:relative;overflow:hidden;background:#dfe4d9;min-height:0}.atlas-tile-v20{position:absolute;object-fit:fill}.atlas-map-crop-v20 svg{position:absolute;inset:0;width:100%;height:100%}.atlas-grid-lines-v20 line{stroke:#424744;stroke-width:.7;opacity:.52}.atlas-grid-labels-v20 text{font:bold 12px Arial;fill:#222;paint-order:stroke;stroke:#fff;stroke-width:3;text-anchor:middle;dominant-baseline:middle}.atlas-route-halo-v20{fill:none;stroke:#fff;stroke-width:8;stroke-linecap:round;stroke-linejoin:round}.atlas-route-v20{fill:none;stroke:#6c22c7;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.atlas-cps-v20 circle{fill:#6c22c7;stroke:#fff;stroke-width:2}.atlas-cps-v20 text{font:bold 11px Arial;fill:#171815;paint-order:stroke;stroke:#fff;stroke-width:4}.atlas-print-side-v20{border-left:1px solid #aaa;padding-left:3mm;display:flex;flex-direction:column;gap:5mm}.atlas-scheme-v20.print{display:grid;gap:1px;background:#999;border:1px solid #777;margin-top:2mm}.atlas-scheme-v20.print span{display:grid;place-items:center;min-height:11mm;background:#eee}.atlas-scheme-v20.print span.active{background:#c7a65a;font-weight:700}.atlas-print-legend-v20{display:grid;gap:2mm}.atlas-print-legend-v20 b{font-size:16px}.atlas-page-v20 footer{display:flex;justify-content:space-between;border-top:1px solid #aaa;margin-top:2mm;padding-top:2mm;color:#666}.atlas-brand-v20{position:absolute;left:8px;bottom:8px;background:#fff;padding:4px 6px;font-weight:700;border:1px solid #bbb}.atlas-table-v20 table{width:100%;border-collapse:collapse;margin-top:4mm;font-size:9px}.atlas-table-v20 th,.atlas-table-v20 td{border-bottom:1px solid #bbb;padding:2mm;text-align:left}.atlas-table-v20 th{font-size:8px;text-transform:uppercase;color:#666}@media print{body{background:white}.printbar{display:none}.atlas-page-v20{margin:0}}`;
}
function outputPagesV20(mode,one){
  const b=atlasBoundsCurrentV20(),sh=sheetsV20().filter(s=>atlasSelectedV20(s.index)&&(mode!=='one'||s.index===one)),pages=[];
  if(mode==='full'&&atlasV20.includeOverview){
    pages.push(mapPageV20(b,atlasV20.overview1,'Обзор территории · 1'));
    if(atlasV20.overview2!==atlasV20.overview1)pages.push(mapPageV20(b,atlasV20.overview2,'Обзор территории · 2'));
  }
  sh.forEach(s=>pages.push(mapPageV20(s,atlasSourceForSheetV20(s.index),`Лист ${s.index} · сектор`,s)));
  if(mode==='full'&&atlasV20.includePlan)pages.push(tablePlanV20());
  if(mode==='full'&&atlasV20.includeNav)pages.push(tableNavV20());
  return pages.join('');
}
function openAtlasOutputV20(mode='full',one=0){
  if(!validateSourcesV20(mode,one))return;
  const w=window.open('','_blank');if(!w){toast('Браузер заблокировал окно печати');return}
  const title=mode==='one'?`Лист ${one} — полевой атлас`:mode==='sheets'?'Детальные листы — полевой атлас':'Полевой атлас';
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${printCssV20()}</style></head><body><div class="printbar"><button onclick="window.print()">Печать / сохранить PDF</button>Подожди, пока картографические тайлы полностью загрузятся.</div>${outputPagesV20(mode,one)}</body></html>`);w.document.close();
}
openAtlasPrintV13=openAtlasDesignerV20;
const bindV20Base=bind;
bind=function(){bindV20Base();const b=document.getElementById('exportAtlasV13');if(b){b.textContent='Конструктор атласа';b.title='Настроить область, разбиение, подложки и печатные листы'}};
const buildV20=document.querySelector('.build-label');if(buildV20)buildV20.textContent='V14 · финальный маршрут · конструктор атласа';
render();
