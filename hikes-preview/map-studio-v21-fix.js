/* V15.2 — interaction and atlas-output safety fixes. */
if(typeof studioV21!=='undefined'&&studioV21.areaPicking===undefined)studioV21.areaPicking=false;

/* Migrate older atlas source choices to the final three-mode model. */
(function migrateAtlasSourcesV212(){
  const valid=['osm','sat','city'],norm=v=>valid.includes(v)?v:(v==='yandex'?'city':v==='hybrid'?'sat':'osm');
  atlasV20.overview1=norm(atlasV20.overview1);atlasV20.overview2=norm(atlasV20.overview2);atlasV20.detailDefault=norm(atlasV20.detailDefault);
  Object.keys(atlasV20.sheetSources||{}).forEach(k=>{const v=atlasV20.sheetSources[k];if(v!=='inherit')atlasV20.sheetSources[k]=norm(v)});
  try{saveAtlasV20()}catch(e){}
})();

/* The fine metric grid is useful only at working zoom. Never span it between a remote old atlas area and the current viewport. */
studioGridBoundsV21=function(){
  const map=studioV21.map;if(!map)return atlasBoundsCurrentV20();const b=map.getBounds();
  return {west:b.getWest(),east:b.getEast(),south:b.getSouth(),north:b.getNorth()};
};
const drawStudioGridBaseV212=drawStudioGridV21;
drawStudioGridV21=function(){
  const z=studioV21.map?.getZoom?.()||0;
  if(z<13)return;
  return drawStudioGridBaseV212();
};

/* Atlas tool is inspection by default. Two-click area editing starts only after the explicit button. */
const clearStudioAreaPickBaseV212=clearStudioAreaPickV21;
clearStudioAreaPickV21=function(){studioV21.areaPicking=false;return clearStudioAreaPickBaseV212()};
const startStudioAreaPickBaseV212=startStudioAreaPickV21;
startStudioAreaPickV21=function(){startStudioAreaPickBaseV212();studioV21.areaPicking=true;renderStudioInspectorV21()};
const handleStudioMapClickBaseV212=handleStudioMapClickV21;
handleStudioMapClickV21=function(e){
  if(studioV21.tool==='atlas'&&!studioV21.areaPicking)return;
  return handleStudioMapClickBaseV212(e);
};
const pickAreaOnMapBaseV212=pickAreaOnMapV20;
pickAreaOnMapV20=function(){
  if(studioV21.open){closeAtlasV20();startStudioAreaPickV21();return}
  return pickAreaOnMapBaseV212();
};

/* Keep Nakarte integration conservative: satellite uses the known S layer code; other modes only share center/zoom. */
openNakarteV21=function(){
  if(!studioV21.map)return;
  const c=studioV21.map.getCenter(),z=Math.round(studioV21.map.getZoom()),layer=studioV21.base==='sat'?'&l=S':'';
  window.open(`https://nakarte.me/#m=${z}/${c.lat.toFixed(5)}/${c.lng.toFixed(5)}${layer}`,'_blank','noopener');
};

/* Make atlas area-picking state explicit. */
const inspectorAtlasBaseV212=inspectorAtlasV21;
inspectorAtlasV21=function(){
  const h=inspectorAtlasBaseV212();
  if(!studioV21.areaPicking)return h;
  return h.replace('<div class="studio-help-v21">','<div class="studio-step-v21 ready"><b>•</b><span>Режим выбора области включён: укажи два противоположных угла на карте.</span></div><div class="studio-help-v21">');
};

/* Add field-atlas essentials missing from the earlier browser print: north arrow and a real metric scale bar. */
const mapPageBaseV212=mapPageV20;
mapPageV20=function(bounds,source,title,sheetMeta=null){
  let html=mapPageBaseV212(bounds,source,title,sheetMeta),size=boundsSizeV20(bounds),bar=1000;
  if(size.w<1800)bar=200;else if(size.w<3500)bar=500;
  const width=Math.max(5,Math.min(38,bar/Math.max(1,size.w)*100));
  const extras=`<div class="atlas-north-v212"><b>С</b><span>↑</span></div><div class="atlas-scale-v212"><div style="width:${width.toFixed(2)}%"></div><span>${bar>=1000?(bar/1000)+' км':bar+' м'}</span></div>`;
  return html.replace('</svg>',`</svg>${extras}`);
};
const printCssBaseV212=printCssV20;
printCssV20=function(){return printCssBaseV212()+`.atlas-north-v212{position:absolute;right:8px;top:8px;width:30px;height:44px;background:rgba(255,255,255,.86);border:1px solid #777;display:grid;place-items:center;align-content:center;z-index:5}.atlas-north-v212 b{font:700 10px Arial}.atlas-north-v212 span{font:700 22px/18px Arial}.atlas-scale-v212{position:absolute;left:10px;bottom:9px;z-index:5;display:flex;align-items:end;gap:7px;background:rgba(255,255,255,.88);padding:5px 7px;border:1px solid #888;min-width:115px}.atlas-scale-v212>div{height:6px;border:2px solid #171815;border-top:0;min-width:22px}.atlas-scale-v212 span{font:bold 9px Arial;white-space:nowrap}`};

const buildV212=document.querySelector('.build-label');
if(buildV212)buildV212.textContent='V15.2 · полноэкранная карта · финальный атлас';
