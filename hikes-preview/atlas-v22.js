/* V16 — atlas print parity with the reference PDF: true overview thumbnail, auto page orientation, undistorted map viewport, print legend/scale. */
const ATLAS_V22_MIGRATION='rl_atlas_v22_auto_orientation';
try{
  if(!localStorage.getItem(ATLAS_V22_MIGRATION)){
    atlasV20.orientation='auto';
    saveAtlasV20();
    localStorage.setItem(ATLAS_V22_MIGRATION,'1');
  }
}catch(e){}

function atlasPaperSizeV22(orientation){
  const a3=atlasV20.paper==='A3';
  if(a3)return orientation==='portrait'?{w:297,h:420}:{w:420,h:297};
  return orientation==='portrait'?{w:210,h:297}:{w:297,h:210};
}
function atlasPageMetricsV22(orientation,withRail=false,overview=false){
  const p=atlasPaperSizeV22(orientation),outer=12,header=19,footer=10;
  const bodyW=p.w-outer,bodyH=p.h-outer-header-footer;
  const rail=withRail?43:0,gap=withRail?4:0,legend=overview?25:0;
  return {pageW:p.w,pageH:p.h,mapW:bodyW-rail-gap,mapH:Math.max(60,bodyH-legend),rail,gap,header,footer,outer};
}
function atlasOrientationV22(bounds,withRail=false,overview=false){
  if(atlasV20.orientation==='portrait'||atlasV20.orientation==='landscape')return atlasV20.orientation;
  const b=boundsSizeV20(bounds),geo=Math.max(.08,b.aspect);
  const lp=atlasPageMetricsV22('landscape',withRail,overview),pp=atlasPageMetricsV22('portrait',withRail,overview);
  const la=lp.mapW/lp.mapH,pa=pp.mapW/pp.mapH;
  return Math.abs(Math.log(geo/la))<=Math.abs(Math.log(geo/pa))?'landscape':'portrait';
}
function expandBoundsAspectV22(bounds,targetAspect){
  const x0=mercXV12(bounds.west),x1=mercXV12(bounds.east),y0=mercYV12(bounds.south),y1=mercYV12(bounds.north);
  let w=x1-x0,h=y1-y0;const cx=(x0+x1)/2,cy=(y0+y1)/2,cur=w/Math.max(1,h);
  if(cur<targetAspect)w=h*targetAspect;else h=w/targetAspect;
  return {west:lonFromXV12(cx-w/2),east:lonFromXV12(cx+w/2),south:latFromYV12(cy-h/2),north:latFromYV12(cy+h/2)};
}
function printZoomV22(bounds,detail){
  const s=boundsSizeV20(bounds),max=Math.max(s.w,s.h);
  if(!detail){if(max<5500)return 15;if(max<9500)return 14;return 13}
  if(max<3400)return 17;if(max<6500)return 16;return 15;
}
function tileSurfaceV22(bounds,source,z){
  const nw=tileXYPrintV20(bounds.north,bounds.west,z),se=tileXYPrintV20(bounds.south,bounds.east,z),px0=nw[0]*256,py0=nw[1]*256,px1=se[0]*256,py1=se[1]*256;
  const W=Math.max(100,px1-px0),H=Math.max(100,py1-py0),imgs=[];
  for(let x=Math.floor(nw[0]);x<=Math.floor(se[0]);x++)for(let y=Math.floor(nw[1]);y<=Math.floor(se[1]);y++){
    sourceTilesV20(source,x,y,z).forEach((url,layer)=>imgs.push(`<img class="atlas-tile-v20 layer-${layer}" src="${url}" loading="eager" decoding="async" style="left:${((x*256-px0)/W*100).toFixed(5)}%;top:${((y*256-py0)/H*100).toFixed(5)}%;width:${(256/W*100).toFixed(5)}%;height:${(256/H*100).toFixed(5)}%">`));
  }
  const pxy=(lat,lon)=>{const t=tileXYPrintV20(lat,lon,z);return [t[0]*256-px0,t[1]*256-py0]};
  return {imgs,W,H,pxy};
}
function gridSvgV22(bounds,pxy){
  if(!atlasV20.includeGrid)return {lines:'',labels:''};
  const g=gridCfgV13(),ax0=mercXV12(bounds.west),ax1=mercXV12(bounds.east),ay0=mercYV12(bounds.south),ay1=mercYV12(bounds.north);
  const cMin=Math.floor((ax0-g.x0)/g.dx)-1,cMax=Math.ceil((ax1-g.x0)/g.dx)+1,rMin=Math.floor((g.y1-ay1)/g.dy)-1,rMax=Math.ceil((g.y1-ay0)/g.dy)+1;
  let lines='',labels='';
  for(let c=cMin;c<=cMax;c++){
    const lon=lonFromXV12(g.x0+c*g.dx),a=pxy(bounds.north,lon),b=pxy(bounds.south,lon);lines+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
    if(c>=0&&c<cMax){const p=pxy(bounds.north,lonFromXV12(g.x0+(c+.5)*g.dx));labels+=`<text class="grid-top-v22" x="${p[0]}" y="16">${String(c+1).padStart(2,'0')}</text>`}
  }
  for(let r=rMin;r<=rMax;r++){
    const lat=latFromYV12(g.y1-r*g.dy),a=pxy(lat,bounds.west),b=pxy(lat,bounds.east);lines+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
    if(r>=0&&r<rMax){const p=pxy(latFromYV12(g.y1-(r+.5)*g.dy),bounds.west);labels+=`<text class="grid-side-v22" x="14" y="${p[1]}">${rowCodeV13(r)}</text>`}
  }
  return {lines,labels};
}
function routeAndPointsSvgV22(bounds,pxy){
  const routePts=editorV13.route.map(p=>pxy(p[0],p[1]).join(',')).join(' ');
  let cps='';
  if(atlasV20.includeCps)dynamicCpsV13().filter(cp=>inBoundsV20(cp.lat,cp.lon,bounds)).forEach(cp=>{
    const p=pxy(cp.lat,cp.lon),camp=cp.number==='С'||cp.number==='Ф';
    cps+=`<g class="${camp?'camp':''}"><circle cx="${p[0]}" cy="${p[1]}" r="6"/><text x="${p[0]+9}" y="${p[1]-8}">${esc(cp.number)} ${esc(cp.title)}</text></g>`;
  });
  let marks='';
  try{(editorV13.marks||[]).filter(m=>inBoundsV20(m.lat,m.lon,bounds)).forEach(m=>{const p=pxy(m.lat,m.lon);marks+=`<g class="atlas-user-mark-v22"><circle cx="${p[0]}" cy="${p[1]}" r="5"/><text x="${p[0]+8}" y="${p[1]+4}">${esc(m.title||'Точка')}</text></g>`})}catch(e){}
  return {routePts,cps,marks};
}
function sectorTextV22(s){
  if(!s)return '';
  const vr=s.rows===1?'центр':s.row===0?'север':s.row===s.rows-1?'юг':s.rows===4?(s.row===1?'север-центр':'юг-центр'):`ряд ${s.row+1}`;
  const hr=s.cols===1?'центр':s.col===0?'запад':s.col===s.cols-1?'восток':`колонка ${s.col+1}`;
  return `${vr}-${hr}`;
}
function niceScaleV22(widthM){
  const target=widthM*.24,candidates=[50,100,200,250,500,1000,2000,2500,5000,10000];let best=candidates[0];
  for(const c of candidates)if(c<=target)best=c;return best;
}
function scaleBlockV22(bounds,mapWidthMm){
  const w=boundsSizeV20(bounds).w,len=niceScaleV22(w),pct=Math.max(5,Math.min(48,len/w*100)),den=Math.max(100,Math.round((w*1000/Math.max(1,mapWidthMm))/100)*100);
  const fmt=n=>n>=1000?`${String(n/1000).replace('.',',')} км`:`${n} м`;
  return `<div class="atlas-scale-v22"><div class="atlas-scale-line-v22" style="width:${pct.toFixed(2)}%"><i></i><i></i><i></i></div><div class="atlas-scale-label-v22" style="width:${pct.toFixed(2)}%"><span>0</span><span>${fmt(len/2)}</span><span>${fmt(len)}</span></div><small>Масштаб ~1:${den.toLocaleString('ru-RU')}</small></div>`;
}
function compassV22(){return `<div class="atlas-north-v22"><b>С</b><svg viewBox="0 0 24 38" aria-hidden="true"><path d="M12 1 L20 25 L12 20 L4 25 Z"/><line x1="12" y1="19" x2="12" y2="37"/></svg></div>`}
function miniOverviewV22(activeIndex){
  const b=atlasBoundsCurrentV20(),ratio=.72,rb=expandBoundsAspectV22(b,ratio),z=13,t=tileSurfaceV22(rb,'osm',z),sh=sheetsV20();
  const routePts=editorV13.route.map(p=>t.pxy(p[0],p[1]).join(',')).join(' ');
  let rects='';
  sh.forEach(s=>{const a=t.pxy(s.north,s.west),c=t.pxy(s.south,s.east),x=Math.min(a[0],c[0]),y=Math.min(a[1],c[1]),w=Math.abs(c[0]-a[0]),h=Math.abs(c[1]-a[1]),cx=x+w/2,cy=y+h/2;rects+=`<rect class="${s.index===activeIndex?'active':''}" x="${x}" y="${y}" width="${w}" height="${h}"/><text x="${cx}" y="${cy}">${s.index}</text>`});
  return `<div class="atlas-mini-map-v22" style="aspect-ratio:${ratio}">${t.imgs.join('')}<svg viewBox="0 0 ${t.W} ${t.H}" preserveAspectRatio="none"><polyline class="atlas-mini-route-v22" points="${routePts}"/><g class="atlas-mini-sheets-v22">${rects}</g></svg></div>`;
}
function legendV22(source){
  const src=ATLAS_SOURCES_V20[source]||ATLAS_SOURCES_V20.osm;
  return `<div class="atlas-legend-v22"><small>УСЛОВНЫЕ ОБОЗНАЧЕНИЯ</small><div><span><i class="lg-route"></i>Маршрут</span><span><i class="lg-cp"></i>Контрольная точка</span><span><i class="lg-camp"></i>Старт / финиш</span><span><i class="lg-grid"></i>Координатная сетка ${gridCfgV13().cell} м</span><span><i class="lg-sheet"></i>Текущий лист</span></div><em>${esc(src.label)}</em></div>`;
}
function detailRailV22(sheet,source){return `<aside class="atlas-rail-v22"><section><small>ОБЗОРНАЯ СХЕМА</small>${miniOverviewV22(sheet.index)}<p>Лист ${sheet.index} выделен на общей карте. Соседние листы имеют перекрытие ${atlasV20.overlap} м.</p></section>${legendV22(source)}</aside>`}
function overviewLegendV22(source){return `<div class="atlas-overview-legend-v22">${legendV22(source)}<div class="atlas-overview-meta-v22"><span>Область: ${areaTextV20()}</span><span>Листов: ${atlasV20.sheetCount}</span><span>Перекрытие: ${atlasV20.overlap} м</span></div></div>`}
function mapFrameV22(bounds,source,detail,targetAspect){
  const rb=expandBoundsAspectV22(bounds,targetAspect),z=printZoomV22(rb,detail),t=tileSurfaceV22(rb,source,z),g=gridSvgV22(rb,t.pxy),rp=routeAndPointsSvgV22(rb,t.pxy);
  return {bounds:rb,z,html:`<div class="atlas-map-crop-v20 atlas-map-crop-v22">${t.imgs.join('')}<svg viewBox="0 0 ${t.W} ${t.H}" preserveAspectRatio="none"><g class="atlas-grid-lines-v20">${g.lines}</g><g class="atlas-grid-labels-v20">${g.labels}</g><polyline class="atlas-route-halo-v20" points="${rp.routePts}"/><polyline class="atlas-route-v20" points="${rp.routePts}"/><g class="atlas-cps-v20">${rp.cps}</g><g>${rp.marks}</g></svg>${source==='yandex'?'<div class="atlas-brand-v20">Яндекс Карты</div>':''}${compassV22()}</div>`};
}
mapPageV20=function(bounds,source,title,sheetMeta=null){
  const withRail=!!sheetMeta,overview=!sheetMeta,orientation=atlasOrientationV22(bounds,withRail,overview),m=atlasPageMetricsV22(orientation,withRail,overview),target=m.mapW/m.mapH,frame=mapFrameV22(bounds,source,withRail,target),src=ATLAS_SOURCES_V20[source]||ATLAS_SOURCES_V20.osm;
  const headerTitle=sheetMeta?'Томинский лесопарк - полевой атлас':title;
  const subtitle=sheetMeta?`Лист ${sheetMeta.index} - ${sectorTextV22(sheetMeta)}`:'Обзорная схема';
  return `<section class="atlas-page-v20 atlas-page-v22 page-${orientation}-v22" data-orientation="${orientation}"><header class="atlas-head-v22"><div><h1>${esc(headerTitle)}</h1><small>${esc(subtitle)}</small></div>${sheetMeta?`<b>Лист ${sheetMeta.index}</b>`:`<b>Маршрут · ${(routeLenV13()/1000).toFixed(1).replace('.',',')} км</b>`}</header><div class="atlas-map-layout-v20 atlas-map-layout-v22 ${withRail?'with-rail':''}">${frame.html}${withRail?detailRailV22(sheetMeta,source):''}</div>${overview?overviewLegendV22(source):''}<footer class="atlas-foot-v22">${scaleBlockV22(frame.bounds,m.mapW)}<div><span>${src.attribution}</span><span>Разные люди · ${new Date().toLocaleDateString('ru-RU')}</span></div></footer></section>`;
};

const tablePlanBaseV22=tablePlanV20,tableNavBaseV22=tableNavV20;
tablePlanV20=function(){return tablePlanBaseV22().replace('atlas-page-v20 atlas-table-v20','atlas-page-v20 atlas-table-v20 page-landscape-v22')};
tableNavV20=function(){return tableNavBaseV22().replace('atlas-page-v20 atlas-table-v20','atlas-page-v20 atlas-table-v20 page-landscape-v22')};

printCssV20=function(){
  const paper=atlasV20.paper==='A3'?'A3':'A4',L=atlasPaperSizeV22('landscape'),P=atlasPaperSizeV22('portrait');
  return `@page landscapePage{size:${paper} landscape;margin:0}@page portraitPage{size:${paper} portrait;margin:0}*{box-sizing:border-box}body{margin:0;background:#d8d6cf;color:#171815;font:10px Arial,sans-serif}.printbar{position:sticky;top:0;z-index:99;background:#171815;color:#fff;padding:10px 14px;text-align:center}.printbar button{padding:9px 16px;margin-right:10px}.printbar .ready{color:#d4bd82}.atlas-page-v20{margin:7px auto;background:#fff;padding:6mm;display:flex;flex-direction:column;page-break-after:always;overflow:hidden}.page-landscape-v22{page:landscapePage;width:${L.w}mm;height:${L.h}mm}.page-portrait-v22{page:portraitPage;width:${P.w}mm;height:${P.h}mm}.atlas-head-v22{display:flex;justify-content:space-between;align-items:flex-start;border:0!important;padding:0 0 3mm!important;min-height:14mm}.atlas-head-v22 h1{font:bold 15px Arial;margin:0 0 2mm;text-transform:none}.atlas-head-v22 small{font-size:8px;color:#555;letter-spacing:0}.atlas-head-v22>b{font-size:10px}.atlas-map-layout-v22{display:grid!important;grid-template-columns:1fr!important;gap:4mm!important;flex:1;min-height:0;margin:0!important}.atlas-map-layout-v22.with-rail{grid-template-columns:minmax(0,1fr) 43mm!important}.atlas-map-crop-v22{position:relative;overflow:hidden;background:#e7e8e1;min-width:0;min-height:0;border:.2mm solid #777}.atlas-tile-v20{position:absolute;object-fit:fill}.atlas-map-crop-v22 svg{position:absolute;inset:0;width:100%;height:100%}.atlas-grid-lines-v20 line{stroke:#333;stroke-width:.7;opacity:.48}.atlas-grid-labels-v20 text{font:bold 11px Arial;fill:#222;paint-order:stroke;stroke:#fff;stroke-width:3;text-anchor:middle;dominant-baseline:middle}.atlas-route-halo-v20{fill:none;stroke:#fff;stroke-width:8;stroke-linecap:round;stroke-linejoin:round}.atlas-route-v20{fill:none;stroke:#6c22c7;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.atlas-cps-v20 circle{fill:#6c22c7;stroke:#fff;stroke-width:2}.atlas-cps-v20 .camp circle{fill:#2f7a50}.atlas-cps-v20 text,.atlas-user-mark-v22 text{font:bold 10px Arial;fill:#171815;paint-order:stroke;stroke:#fff;stroke-width:4}.atlas-user-mark-v22 circle{fill:#c7a65a;stroke:#171815;stroke-width:1.5}.atlas-rail-v22{display:flex;flex-direction:column;gap:4mm;border-left:.2mm solid #999;padding-left:3mm;min-width:0}.atlas-rail-v22 section>small,.atlas-legend-v22>small{display:block;font-size:7px;font-weight:700;letter-spacing:.08em;margin-bottom:1.5mm}.atlas-rail-v22 p{font-size:7px;line-height:1.35;color:#666;margin:1.5mm 0 0}.atlas-mini-map-v22{position:relative;width:100%;overflow:hidden;border:.25mm solid #777;background:#e6eadf}.atlas-mini-map-v22 img{position:absolute;object-fit:fill}.atlas-mini-map-v22 svg{position:absolute;inset:0;width:100%;height:100%}.atlas-mini-route-v22{fill:none;stroke:#6c22c7;stroke-width:4}.atlas-mini-sheets-v22 rect{fill:rgba(255,255,255,.03);stroke:#555;stroke-width:2}.atlas-mini-sheets-v22 rect.active{fill:rgba(199,166,90,.34);stroke:#9d7e38;stroke-width:5}.atlas-mini-sheets-v22 text{font:bold 19px Arial;fill:#171815;paint-order:stroke;stroke:#fff;stroke-width:5;text-anchor:middle;dominant-baseline:middle}.atlas-legend-v22{border:.2mm solid #aaa;padding:2.5mm;background:#faf9f6}.atlas-legend-v22>div{display:grid;gap:1.5mm}.atlas-legend-v22 span{display:flex;align-items:center;gap:2mm;font-size:7px}.atlas-legend-v22 i{display:inline-block;width:9mm;height:2mm;position:relative;flex:none}.lg-route:after{content:'';position:absolute;left:0;right:0;top:.7mm;border-top:1.2mm solid #6c22c7}.lg-cp:after{content:'';position:absolute;width:2.7mm;height:2.7mm;border-radius:50%;background:#6c22c7;border:.5mm solid white;box-shadow:0 0 0 .2mm #777;left:3mm;top:-.3mm}.lg-camp:after{content:'';position:absolute;width:2.7mm;height:2.7mm;border-radius:50%;background:#2f7a50;left:3mm;top:-.3mm}.lg-grid{border-top:.2mm solid #555}.lg-sheet{border:.6mm solid #c7a65a;height:4mm!important}.atlas-legend-v22 em{display:block;margin-top:2mm;font-size:6.5px;color:#777;font-style:normal}.atlas-overview-legend-v22{display:grid;grid-template-columns:1.4fr .6fr;gap:4mm;margin-top:3mm}.atlas-overview-meta-v22{border:.2mm solid #aaa;padding:2.5mm;display:grid;gap:1.5mm;font-size:7px}.atlas-north-v22{position:absolute;right:3mm;top:3mm;width:8mm;text-align:center;background:rgba(255,255,255,.82);padding:1mm}.atlas-north-v22 b{display:block;font-size:8px}.atlas-north-v22 svg{position:static!important;width:5mm!important;height:8mm!important}.atlas-north-v22 path{fill:#171815}.atlas-north-v22 line{stroke:#171815;stroke-width:2}.atlas-foot-v22{display:grid!important;grid-template-columns:1fr auto;gap:5mm;align-items:end;border:0!important;margin:2mm 0 0!important;padding:0!important;min-height:8mm;color:#666}.atlas-foot-v22>div:last-child{display:grid;text-align:right;gap:.7mm;font-size:6.5px}.atlas-scale-v22{min-width:55mm}.atlas-scale-line-v22{height:2.5mm;border-bottom:.4mm solid #171815;display:flex;justify-content:space-between;align-items:end}.atlas-scale-line-v22 i{height:2.5mm;border-left:.4mm solid #171815}.atlas-scale-label-v22{display:flex;justify-content:space-between;font-size:6.5px;color:#222}.atlas-scale-v22 small{font-size:6px;color:#666}.atlas-brand-v20{position:absolute;left:2mm;bottom:2mm;background:#fff;padding:1mm 1.5mm;font-weight:700;border:.2mm solid #bbb}.atlas-table-v20{page:landscapePage;width:${L.w}mm;height:${L.h}mm;padding:8mm}.atlas-table-v20 table{width:100%;border-collapse:collapse;margin-top:4mm;font-size:9px}.atlas-table-v20 th,.atlas-table-v20 td{border-bottom:1px solid #bbb;padding:2mm;text-align:left}.atlas-table-v20 th{font-size:8px;text-transform:uppercase;color:#666}@media print{body{background:white}.printbar{display:none}.atlas-page-v20{margin:0}}`;
};

openAtlasOutputV20=function(mode='full',one=0){
  if(!validateSourcesV20(mode,one))return;
  const w=window.open('','_blank');if(!w){toast('Браузер заблокировал окно печати');return}
  const title=mode==='one'?`Лист ${one} - полевой атлас`:mode==='sheets'?'Детальные листы - полевой атлас':'Полевой атлас';
  const pages=outputPagesV20(mode,one);
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${printCssV20()}</style></head><body><div class="printbar"><button id="printAtlasBtn" onclick="window.print()" disabled>Загрузка карт...</button><span id="printAtlasState">Подготавливаю листы в печатном разрешении</span></div>${pages}<script>(function(){var imgs=[].slice.call(document.images),btn=document.getElementById('printAtlasBtn'),s=document.getElementById('printAtlasState');if(!imgs.length){btn.disabled=false;btn.textContent='Печать / сохранить PDF';s.textContent='Готово';return}var done=0;function tick(){done++;s.textContent='Загружено '+done+' / '+imgs.length;if(done>=imgs.length){btn.disabled=false;btn.textContent='Печать / сохранить PDF';s.textContent='Карты готовы к печати';s.className='ready'}}imgs.forEach(function(i){if(i.complete)tick();else{i.addEventListener('load',tick,{once:true});i.addEventListener('error',tick,{once:true})}});setTimeout(function(){btn.disabled=false;btn.textContent='Печать / сохранить PDF';s.textContent='Можно печатать; часть тайлов могла не загрузиться'},12000)})();<\/script></body></html>`);w.document.close();
};

const bindAtlasDesignerBaseV22=bindAtlasDesignerV20;
bindAtlasDesignerV20=function(){
  const sel=document.getElementById('atlasOrientV20');
  if(sel&&!sel.querySelector('option[value="auto"]')){const o=document.createElement('option');o.value='auto';o.textContent='Авто - по форме листа';sel.insertBefore(o,sel.firstChild);sel.value=atlasV20.orientation||'auto'}
  bindAtlasDesignerBaseV22();
};
const renderAtlasDesignerBaseV22=renderAtlasDesignerV20;
renderAtlasDesignerV20=function(){renderAtlasDesignerBaseV22();const note=document.querySelector('.atlas-layout-note-v20');if(note&&atlasV20.orientation==='auto'){note.insertAdjacentHTML('beforeend','<span class="atlas-auto-note-v22">ориентация листов: авто</span>')}};

const buildV22=document.querySelector('.build-label');
if(buildV22)buildV22.textContent='V16 · атлас по образцу PDF · автоориентация';
