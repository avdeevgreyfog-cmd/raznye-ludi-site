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
      const h1=page.locator('h1');
      const box=await h1.boundingBox();
      expect(box,`${url} h1 missing at ${width}px`).toBeTruthy();
      expect(box.x,`${url} h1 clipped left at ${width}px`).toBeGreaterThanOrEqual(-1);
      expect(box.x+box.width,`${url} h1 clipped right at ${width}px`).toBeLessThanOrEqual(width+1);
    }
  }
});

test('mobile event format content stays in viewport',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile');
  await page.goto('/events/',{waitUntil:'networkidle'});
  const width=await page.evaluate(()=>innerWidth);
  for(const el of await page.locator('.event-format').all()){
    const box=await el.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x+box.width).toBeLessThanOrEqual(width+1);
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
  await expect(page.locator('[data-form-status] a[href="../gear/"]')).toBeVisible();
});

test('event filters and archive state work without data',async({page})=>{
  await page.goto('/events/');
  const archive=page.locator('[data-event-state="archive"]');
  await archive.click();
  await expect(archive).toHaveClass(/is-active/);
  await expect(page.locator('[data-events]')).toContainText('Архив пока пуст');
  const training=page.locator('[data-event-filter="training"]');
  await training.click();
  await expect(training).toHaveClass(/is-active/);
});

test('gear breakdown changes camera focus and pressed state',async({page})=>{
  await page.goto('/gear/');
  const items=page.locator('[data-gear-item]');
  expect(await items.count()).toBeGreaterThan(1);
  await items.nth(1).click();
  await expect(items.nth(1)).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.gear-lab__visual')).toHaveAttribute('data-focus','head');
  await expect(page.locator('[data-gear-image]')).toHaveAttribute('src',/scene_09\.webp$/);
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

test('critical local assets resolve',async({page,request})=>{
  const checked=new Set();
  for(const url of pages){
    await page.goto(url);
    const refs=await page.locator('img[src],source[src],script[src],link[rel="stylesheet"][href]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src')||n.getAttribute('href')).filter(Boolean));
    const posters=await page.locator('video[poster]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('poster')).filter(Boolean));
    for(const ref of [...refs,...posters]){
      if(ref.startsWith('http')) continue;
      const u=new URL(ref,page.url());
      if(checked.has(u.pathname)) continue;
      checked.add(u.pathname);
      const r=await request.get(u.pathname);
      expect(r.status(),`${ref} -> ${r.status()}`).toBeLessThan(400);
    }
  }
});

test('seo support files and 404 exist',async({request})=>{
  for(const url of ['/robots.txt','/sitemap.xml','/404.html']){
    const r=await request.get(url);
    expect(r.status(),`${url} -> ${r.status()}`).toBeLessThan(400);
  }
});

test('public copy contains no prototype phrases',async()=>{
  const files=['index.html','team/index.html','start/index.html','gear/index.html','events/index.html','start/application.html'];
  const forbidden=[
    'в дальнейшем','здесь будет','данный раздел','данный блок','позже добавим','структура позволяет',
    'предусмотрена возможность','публичный портал','этот блок спроектирован','каркас','здесь можно разместить',
    'когда появятся материалы','эта страница подготовлена для','погрузитесь в мир','уникальный опыт',
    'больше, чем просто','незабываемые эмоции','новый уровень','характер сайта','сайт не заменяет',
    'сайт строится вокруг','без претензии на официальный','не превращая наблюдения','не продолжает лендинг',
    'разделы продолжают лендинг','несуществующего backend','страница мероприятий не должна'
  ];
  for(const file of files){
    const text=fs.readFileSync(path.join(process.cwd(),file),'utf8').toLowerCase();
    for(const phrase of forbidden) expect(text,`${file}: ${phrase}`).not.toContain(phrase);
  }
});
