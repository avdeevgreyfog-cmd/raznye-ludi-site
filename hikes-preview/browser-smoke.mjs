import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd();
const server=createServer(async(req,res)=>{
 try{let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(pathname.endsWith('/'))pathname+='index.html';const p=resolve(root,'.'+pathname);if(!p.startsWith(root+'/'))throw Error('path');const content=await readFile(p);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'})[extname(p)]||'application/octet-stream');res.end(content)}catch{res.statusCode=404;res.end('Not found')}
});
await new Promise(r=>server.listen(4173,'127.0.0.1',r));
await mkdir('hikes-preview/test-results',{recursive:true});
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[],report=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4173/hikes-preview/',{waitUntil:'domcontentloaded'});
 await page.locator('#nav [data-tab="roles"]').waitFor({timeout:30000});
 for(const tab of ['overview','participants','roles','gear','food','transport','route','plan','documents']){
   await page.locator('#nav [data-tab="'+tab+'"]').click();
   await page.waitForTimeout(250);
   assert.ok((await page.locator('#app').innerText()).trim().length>40,'Empty tab: '+tab);
   report.push({tab,width:1440,heading:await page.locator('#app h1').first().textContent()});
   await page.screenshot({path:'hikes-preview/test-results/'+tab+'-desktop.png',fullPage:true});
 }
 await page.setViewportSize({width:390,height:844});
 for(const tab of ['roles','gear','food','transport','route','plan','documents']){
   await page.evaluate(t=>{window.__smokeTab=t;},tab);
   // The sidebar can be off-canvas on mobile; click via the existing navigation handler.
   await page.locator('#nav [data-tab="'+tab+'"]').evaluate(el=>el.click());
   await page.waitForTimeout(150);
   report.push({tab,width:390,scrollWidth:await page.evaluate(()=>document.documentElement.scrollWidth)});
   await page.screenshot({path:'hikes-preview/test-results/'+tab+'-mobile.png',fullPage:true});
 }
 assert.equal(errors.length,0,'Uncaught browser errors:\n'+errors.join('\n'));
}finally{
 await writeFile('hikes-preview/test-results/report.json',JSON.stringify({report,errors},null,2));
 console.log(JSON.stringify({report,errors},null,2));
 await browser.close();server.close();
}
