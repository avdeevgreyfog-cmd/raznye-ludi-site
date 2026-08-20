/* Scout company history foundation
   Stores snapshots locally first; prepared for Supabase persistence.
*/
(function(){
  const KEY='scout_company_history_v1';

  function load(){
    try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}
  }

  function save(data){
    localStorage.setItem(KEY,JSON.stringify(data));
  }

  function snapshot(company){
    return {
      date:new Date().toISOString(),
      vacancies:Number(company.vacancies||company.jobsCount||0),
      priority:Number(company.priority||company.score||0),
      need:Number(company.need||company.needScore||0),
      roles:company.roles||[],
      locations:company.locations||[],
      contacts:company.contacts||[]
    };
  }

  function compare(oldSnap,newSnap){
    if(!oldSnap)return {type:'first',text:'Компания впервые обнаружена'};
    const dv=newSnap.vacancies-oldSnap.vacancies;
    const dp=newSnap.priority-oldSnap.priority;
    const events=[];
    if(dv>0)events.push({type:'growth',text:`+${dv} вакансий`});
    if(dv<0)events.push({type:'decline',text:`${dv} вакансий`});
    if(dp!==0)events.push({type:'score',text:`Приоритет ${oldSnap.priority} → ${newSnap.priority}`});
    return {type:events.length?'change':'stable',events};
  }

  window.ScoutHistory={
    saveSnapshot(id,company){
      const db=load();
      const list=db[id]||[];
      const next=snapshot(company);
      const diff=compare(list[list.length-1],next);
      list.push({...next,diff});
      db[id]=list;
      save(db);
      return diff;
    },
    get(id){return load()[id]||[];}
  };
})();
