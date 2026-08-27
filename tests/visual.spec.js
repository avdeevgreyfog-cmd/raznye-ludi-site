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

for(const [name,url] of pages){
  test(`visual ${name}`,async({page},testInfo)=>{
    fs.mkdirSync('qa-shots',{recursive:true});
    await page.goto(url,{waitUntil:'networkidle'});
    await expect(page.locator('h1')).toBeVisible();
    await page.screenshot({path:`qa-shots/${testInfo.project.name}-${name}.png`,fullPage:true});
  });
}
