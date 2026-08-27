const { test, expect } = require('@playwright/test');
const fs = require('fs');

const pages=[
  ['home','/'],
  ['team','/team/'],
  ['start','/start/'],
  ['gear','/gear/'],
  ['events','/events/'],
  ['application','/start/application.html']
];

async function warmPage(page){
  await page.evaluate(async()=>{
    const step=Math.max(420,Math.floor(innerHeight*.72));
    for(let y=0;y<document.documentElement.scrollHeight;y+=step){
      scrollTo(0,y);
      await new Promise(r=>setTimeout(r,45));
    }
    scrollTo(0,0);
  });
  await page.waitForTimeout(250);
}

for(const [name,url] of pages){
  test(`visual ${name}`,async({page},testInfo)=>{
    fs.mkdirSync('qa-shots',{recursive:true});
    await page.goto(url,{waitUntil:'networkidle'});
    await expect(page.locator('h1')).toBeVisible();
    await warmPage(page);
    await page.evaluate(()=>document.querySelectorAll('.reveal').forEach(el=>el.classList.add('is-visible')));
    await page.screenshot({path:`qa-shots/${testInfo.project.name}-${name}.png`,fullPage:true});
  });
}
