const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const pages=['/','/team/','/start/','/gear/','/events/','/start/application.html'];

for(const url of pages){
  test(`${url} loads cleanly`,async({page})=>{
    const errors=[];
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    page.on('pageerror',e=>errors.push(e.message));
    const r=await page.goto(url);
    expect(r.ok()).toBeTruthy();
    await page.waitForLoadState('networkidle');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(errors,errors.join('\n')).toEqual([]);
    expect(await page.locator('h1').count()).toBe(1);
  });
}

test('responsive overflow matrix',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop');
  for(const width of [360,390,768,1024,1440,1920]){
    await page.setViewportSize({width,height:1000});
    for(const url of pages){
      await page.goto(url,{waitUntil:'networkidle'});
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      expect(overflow,`${url} overflow at ${width}px`).toBeLessThanOrEqual(1);
    }
  }
});

test('mobile navigation works',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile');
  await page.goto('/');
  const btn=page.locator('.menu-btn');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded','true');
  await expect(page.locator('.mobile-nav')).toHaveClass(/is-open/);
  await expect(page.locator('body')).toHaveClass(/menu-open/);
  await page.locator('.mobile-nav a').first().click();
});

test('application produces prepared message without fake send',async({page})=>{
  await page.goto('/start/application.html');
  await page.fill('#name','Тест');
  await page.fill('#age','25');
  await page.selectOption('#experience',{label:'Опыта нет'});
  await page.selectOption('#gear',{label:'Пока ничего нет'});
  await page.fill('#contact','vk.com/test');
  await page.click('button[type=submit]');
  await expect(page.locator('[data-form-status]')).toHaveClass(/is-visible/);
  await expect(page.locator('[data-form-text]')).toHaveValue(/Тест/);
});

test('canonical page internal links resolve',async({page,request})=>{
  const checked=new Set();
  for(const url of pages){
    await page.goto(url);
    const hrefs=await page.locator('a[href]').evaluateAll(as=>[...new Set(as.map(a=>a.getAttribute('href')).filter(h=>h&&!h.startsWith('http')&&!h.startsWith('#')&&!h.startsWith('mailto:')&&!h.startsWith('tel:')))]);
    for(const h of hrefs){
      const u=new URL(h,page.url());
      if(checked.has(u.pathname)) continue;
      checked.add(u.pathname);
      const r=await request.get(u.pathname);
      expect(r.status(),`${h} -> ${r.status()}`).toBeLessThan(400);
    }
  }
});

test('public copy contains no prototype phrases',async()=>{
  const files=['index.html','team/index.html','start/index.html','gear/index.html','events/index.html','start/application.html'];
  const forbidden=[
    'в дальнейшем','здесь будет','данный раздел','данный блок','позже добавим','структура позволяет',
    'предусмотрена возможность','публичный портал','этот блок спроектирован','каркас','здесь можно разместить',
    'когда появятся материалы','эта страница подготовлена для','погрузитесь в мир','уникальный опыт',
    'больше, чем просто','незабываемые эмоции','новый уровень'
  ];
  for(const file of files){
    const text=fs.readFileSync(path.join(process.cwd(),file),'utf8').toLowerCase();
    for(const phrase of forbidden) expect(text,`${file}: ${phrase}`).not.toContain(phrase);
  }
});
