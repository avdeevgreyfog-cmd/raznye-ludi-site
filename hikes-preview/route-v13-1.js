/* V7 — editable route, dynamic CP metrics, editable grid, trail routing and print-atlas export */
const EDITOR_V13_KEY='rl_hike_route_editor_v13';
const EDITOR_V13_VERSION=1;
const TERRAIN_V13={
  unknown:{label:'Не задан',speed:4.0,color:'#6c22c7'},
  road:{label:'Дорога',speed:4.8,color:'#4f5961'},
  trail:{label:'Тропа',speed:4.2,color:'#7b35c9'},
  clearing:{label:'Просека',speed:4.0,color:'#b18432'},
  forest:{label:'Лес / без тропы',speed:3.0,color:'#4f7654'}
};
const CYR_ROWS_V13=['А','Б','В','Г','Д','Е','Ж','З','И','К','Л','М','Н','О','П','Р','С','Т','У','Ф','Х','Ц','Ч','Ш','Щ','Э','Ю'];
const BASE_ROUTE_RAW_M_V13=(()=>{let n=0;for(let i=0;i<ROUTE_V10_TRACK.length-1;i++)n+=havV13(ROUTE_V10_TRACK[i],ROUTE_V10_TRACK[i+1]);return n})();
const DISTANCE_CAL_V13=21300/BASE_ROUTE_RAW_M_V13;
let editorV13=loadEditorV13();
let editorModeV13=false,editorToolV13='route',selectedV13=null,undoV13=[],redoV13=[];
let routeLineV13=null,routeSegLayersV13=[],routeVertexLayersV13=[],cpLayersV13={},dynamicGridLayerV13=null,dynamicGridSelectedV13=null;
let lastBrouterPendingV13=false;

function cloneV13(v){return JSON.parse(JSON.stringify(v))}
function defaultEditorV13(){
  return {
    version:EDITOR_V13_VERSION,
    route:ROUTE_V10_TRACK.map(p=>[+p[0],+p[1]]),
    cps:ROUTE_V9_POINTS.map((p,i)=>({id:p.id||`cp${i}`,title:p.title||`КП ${i}`,lat:+p.lat,lon:+p.lon,stopMin:stopMinV13(p.stop),locked:p.id==='cp0'||p.id==='cpf'})),
    terrain:{},
    grid:{cell:200,offsetX:0,offsetY:0},
    speeds:{road:4.8,trail:4.2,clearing:4.0,forest:3.0,unknown:4.0},
    start:S.event.start||'10:00',snapCps:true
  };
}
function loadEditorV13(){try{const raw=localStorage.getItem(EDITOR_V13_KEY),x=raw?JSON.parse(raw):null;if(!x||x.version!==EDITOR_V13_VERSION||!Array.isArray(x.route)||x.route.length<2)return defaultEditorV13();const d=defaultEditorV13();return {...d,...x,grid:{...d.grid,...(x.grid||{})},speeds:{...d.speeds,...(x.speeds||{})}}}catch(e){return defaultEditorV13()}}
function saveEditorV13(){try{localStorage.setItem(EDITOR_V13_KEY,JSON.stringify(editorV13))}catch(e){} syncEventV13()}
function syncEventV13(){try{S.event.distance=`${(routeLenV13()/1000).toFixed(1).replace('.',',')} км`;S.event.start=editorV13.start;S.event.finish=finalEtaV13();S.event.duration=fmtDurationV13(routeDurationMinV13());save()}catch(e){}}
function pushHistoryV13(){undoV13.push(cloneV13(editorV13));if(undoV13.length>40)undoV13.shift();redoV13=[]}
function undoEditorV13(){if(!undoV13.length)return;redoV13.push(cloneV13(editorV13));editorV13=undoV13.pop();saveEditorV13();selectedV13=null;render();toast('Отменено')}
function redoEditorV13(){if(!redoV13.length)return;undoV13.push(cloneV13(editorV13));editorV13=redoV13.pop();saveEditorV13();selectedV13=null;render();toast('Повторено')}
function resetEditorV13(){pushHistoryV13();editorV13=defaultEditorV13();saveEditorV13();selectedV13=null;render();toast('Маршрут и сетка возвращены к PDF-версии')}

function havV13(a,b){const R=6371008.8,p1=a[0]*Math.PI/180,p2=b[0]*Math.PI/180,dp=(b[0]-a[0])*Math.PI/180,dl=(b[1]-a[1])*Math.PI/180,s=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.sqrt(s))}
function rawRouteLenV13(){let n=0;for(let i=0;i<editorV13.route.length-1;i++)n+=havV13(editorV13.route[i],editorV13.route[i+1]);return n}
function routeLenV13(){return rawRouteLenV13()*DISTANCE_CAL_V13}
function routeCumV13(){const out=[0];for(let i=0;i<editorV13.route.length-1;i++)out.push(out[out.length-1]+havV13(editorV13.route[i],editorV13.route[i+1])*DISTANCE_CAL_V13);return out}
function pxyV13(lat,lon){return [mercXV12(lon),mercYV12(lat)]}
function llV13(x,y){return [latFromYV12(y),lonFromXV12(x)]}
function nearestRouteV13(lat,lon){const p=pxyV13(lat,lon),cum=routeCumV13();let best=null;for(let i=0;i<editorV13.route.length-1;i++){const a=pxyV13(editorV13.route[i][0],editorV13.route[i][1]),b=pxyV13(editorV13.route[i+1][0],editorV13.route[i+1][1]),vx=b[0]-a[0],vy=b[1]-a[1],wx=p[0]-a[0],wy=p[1]-a[1],den=vx*vx+vy*vy,t=den?Math.max(0,Math.min(1,(wx*vx+wy*vy)/den)):0,x=a[0]+t*vx,y=a[1]+t*vy,d=Math.hypot(p[0]-x,p[1]-y);if(!best||d<best.d){const ll=llV13(x,y),segM=havV13(editorV13.route[i],editorV13.route[i+1])*DISTANCE_CAL_V13;best={seg:i,t,d,lat:ll[0],lon:ll[1],along:cum[i]+t*segM}}}return best}
function stopMinV13(v){const m=String(v||'').match(/(\d+)\s*мин/i);if(m)return +m[1];const h=String(v||'').match(/(\d+)\s*час/i);return h?+h[1]*60:0}
function terrainSpeedV13(i){const t=editorV13.terrain[i]||'unknown';return Math.max(.5,+editorV13.speeds[t]||TERRAIN_V13[t]?.speed||4)}
function routeTravelMinToV13(m){let left=m,min=0;for(let i=0;i<editorV13.route.length-1&&left>0;i++){const seg=havV13(editorV13.route[i],editorV13.route[i+1])*DISTANCE_CAL_V13,use=Math.min(left,seg);min+=(use/1000)/terrainSpeedV13(i)*60;left-=use}return min}
function parseClockV13(s){const m=String(s||'10:00').match(/(\d{1,2}):(\d{2})/);return m?(+m[1]*60 + +m[2]):600}
function fmtClockV13(min){min=Math.round(min)%1440;if(min<0)min+=1440;return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`}
function bearingV13(a,b){const p1=a[0]*Math.PI/180,p2=b[0]*Math.PI/180,dl=(b[1]-a[1])*Math.PI/180,y=Math.sin(dl)*Math.cos(p2),x=Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl);return (Math.atan2(y,x)*180/Math.PI+360)%360}
function dynamicCpsV13(){
  const arr=editorV13.cps.map(cp=>{const n=nearestRouteV13(cp.lat,cp.lon);return {...cp,near:n,along:n?.along||0}});
  const start=arr.find(c=>c.id==='cp0'),finish=arr.find(c=>c.id==='cpf'),middle=arr.filter(c=>c.id!=='cp0'&&c.id!=='cpf').sort((a,b)=>a.along-b.along);
  let stops=0;const startMin=parseClockV13(editorV13.start);const out=[];
  if(start)out.push({...start,number:'С',km:0,arrival:fmtClockV13(startMin)});
  middle.forEach((cp,i)=>{const eta=startMin+routeTravelMinToV13(cp.along)+stops;out.push({...cp,number:String(i+1),km:cp.along/1000,arrival:fmtClockV13(eta)});stops+=cp.stopMin||0});
  const total=routeLenV13(),finishEta=startMin+routeTravelMinToV13(total)+stops;
  if(finish)out.push({...finish,number:'Ф',km:total/1000,arrival:fmtClockV13(finishEta)});
  return out;
}
function finalEtaV13(){const cps=dynamicCpsV13();return cps[cps.length-1]?.arrival||'—'}
function routeDurationMinV13(){const start=parseClockV13(editorV13.start),end=parseClockV13(finalEtaV13());return end>=start?end-start:end+1440-start}
function fmtDurationV13(min){const h=Math.floor(min/60),m=Math.round(min%60);return `${h} ч ${m?`${m} мин`:''}`.trim()}
