const {chromium,firefox,webkit}=require('playwright');
const AxeBuilder=require('@axe-core/playwright').default;
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'qa-results');fs.mkdirSync(out,{recursive:true});
const prefix='/Sowndarya-s-Portfolio/';
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.pdf':'application/pdf','.webp':'image/webp','.ttf':'font/ttf','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{let name=decodeURIComponent(req.url.split('?')[0]);if(!name.startsWith(prefix)){res.writeHead(404);return res.end();}name=name.slice(prefix.length)||'index.html';const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(file)]||'text/plain');fs.createReadStream(file).pipe(res);});
let results={viewports:[],functional:[],accessibility:[],errors:[]};
async function overflow(page,label){
 const data=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,items:[...document.querySelectorAll('main *,footer *')].filter(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width&&r.height&&s.visibility!=='hidden'&&s.display!=='none'&&!el.closest('[hidden],.sr-only')&&(r.right>innerWidth+1||r.left< -1)}).map(el=>el.tagName+'.'+el.className).slice(0,12)}));
 assert(data.scroll<=data.width+1,`${label}: page overflow ${JSON.stringify(data)}`);assert.equal(data.items.length,0,`${label}: element overflow ${data.items}`);
 return data;
}
async function visit(page){await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);}
let base;
(async()=>{
 await new Promise(resolve=>server.listen(8081,'127.0.0.1',resolve));base=`http://127.0.0.1:8081${prefix}`;
 for(const [engine,type] of Object.entries({chromium,firefox,webkit})){
  let browser;try { browser=await type.launch(); } catch(e) { results.errors.push(engine+': '+e.message);continue; }const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});const page=await context.newPage();
  page.on('pageerror',e=>results.errors.push(engine+': '+e.message));
  const failures=[];page.on('response',r=>{if(r.status()>=400)failures.push(r.status()+' '+r.url())});
  try{
   for(const width of engine==='chromium'?[320,360,375,390,430,550,768,1024,1280,1440,1920]:[320,768,1440]){
    await page.setViewportSize({width,height:900});await visit(page);await page.waitForTimeout(750);
    results.viewports.push({engine,width,...await overflow(page,engine+' '+width)});
    // Every full-page screenshot includes visible fallback content even before its entrance.
    if(engine==='chromium'&&[320,390,550,768,1024,1440].includes(width))await page.screenshot({path:path.join(out,`${engine}-${width}.png`),fullPage:true});
   }
   await page.setViewportSize({width:390,height:844});await visit(page);
   await page.getByRole('button',{name:'Open navigation',exact:true}).click();
   assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
   assert(await page.locator('#main').evaluate(el=>el.inert));
   await page.keyboard.press('Escape');assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');assert(await page.locator('.menu-toggle').evaluate(el=>el===document.activeElement));
   await page.locator('.menu-toggle').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');await page.locator('#mobile-menu a').last().focus();assert(await page.locator('#mobile-menu a').last().evaluate(el=>el===document.activeElement));await page.keyboard.press('Tab');assert(await page.locator('.menu-toggle').evaluate(el=>el===document.activeElement));await page.keyboard.press('Shift+Tab');assert(await page.locator('#mobile-menu a').last().evaluate(el=>el===document.activeElement));
   await page.locator('#mobile-menu').getByRole('link',{name:'Experience',exact:true}).click();await page.waitForTimeout(750);assert.equal(new URL(page.url()).hash,'#experience');assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');assert.equal(await page.locator('body').evaluate(el=>el.style.overflow),'');
   await page.goBack();assert.equal(new URL(page.url()).hash,'');await page.goForward();assert.equal(new URL(page.url()).hash,'#experience');
   for(const category of ['CRM','Data','Quality','Documentation','Business','All']){
    await page.getByRole('button',{name:category,exact:true}).click();
    assert.equal(await page.locator(`[data-filter="${category}"]`).getAttribute('aria-pressed'),'true');
    const shown=await page.locator('.skill:visible').evaluateAll(es=>es.map(e=>e.dataset.category));assert(shown.length>0);if(category!=='All')assert(shown.every(x=>x===category));
   }
   for(const summary of await page.locator('summary').all()){await summary.click();assert(await summary.evaluate(el=>el.parentElement.open));await summary.press('Enter');assert(!(await summary.evaluate(el=>el.parentElement.open)));}
   await page.locator('.replay').scrollIntoViewIfNeeded();for(let i=0;i<4;i++)await page.locator('.replay').click();await page.waitForTimeout(3100);assert.equal((await page.locator('.phase').innerText()).trim(),'04 / CLARITY');
   if(engine==='chromium')await context.grantPermissions(['clipboard-read','clipboard-write']);await page.locator('.copy-email').click();await page.waitForFunction(()=>/Email address copied|Copy this address/.test(document.querySelector('.copy-status').textContent));assert.match(await page.locator('.copy-status').innerText(),/Email address copied|Copy this address/);
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('.resume-link').click()]);assert.equal(download.suggestedFilename(),'Sowndarya-Sureshkumar-Resume.pdf');assert.equal(await download.failure(),null);
   const assetLinks=await page.locator('a[href],img[src],link[rel="stylesheet"],script[src]').evaluateAll(es=>es.map(e=>e.getAttribute('href')||e.getAttribute('src')).filter(x=>x&&!x.startsWith('#')&&!x.startsWith('data:')&&!x.includes(':')));
   for(const link of new Set(assetLinks)){const res=await context.request.get(new URL(link,base).href);assert.equal(res.status(),200,link);}
   const anchors=await page.locator('a[href^="#"]').evaluateAll(es=>es.map(e=>e.hash));for(const hash of anchors)assert(await page.locator(hash).count(),hash);
   assert((await page.locator('a[href^="mailto:"]').first().getAttribute('href'))==='mailto:sowndaryas397@gmail.com');
   assert.equal(await page.locator('a[href="https://www.linkedin.com/in/sowndarya-suresh-kumar/"]').count(),2);
   await page.getByRole('link',{name:'Back to top',exact:true}).click();await page.waitForFunction(()=>scrollY<100,undefined,{timeout:5000});
   for(const [width,height] of [[844,390],[667,375]]){await page.setViewportSize({width,height});await overflow(page,engine+' landscape');if(width<801){await page.locator('.menu-toggle').click();assert(await page.locator('#mobile-menu a').last().isVisible());await page.keyboard.press('Escape');}}
   await page.setViewportSize({width:320,height:900});await page.locator('.hero-tagline').evaluate(el=>el.textContent+=' Additional supporting information about business requirements and stakeholder communication.'.repeat(8));await overflow(page,engine+' long content');
   await visit(page);await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.replay').click();assert.equal((await page.locator('.phase').innerText()).trim(),'04 / CLARITY');assert.equal(await page.locator('.cursor').evaluate(el=>getComputedStyle(el).display),'none');assert.equal(await page.locator('html').evaluate(el=>getComputedStyle(el).scrollBehavior),'auto');
   if(engine==='chromium'){
    await context.grantPermissions(['clipboard-read','clipboard-write']);await page.locator('.copy-email').click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'sowndaryas397@gmail.com');
    // 200% layout zoom is exercised as a 640px CSS viewport; 200% text-only enlargement adds a stricter reflow check.
    await page.setViewportSize({width:640,height:450});await visit(page);await overflow(page,'200% layout zoom equivalent');
    await page.addStyleTag({content:'html { font-size: 200%; }'});await page.screenshot({path:path.join(out,'chromium-200-text.png'),fullPage:true});await overflow(page,'200% text zoom');
    await page.setViewportSize({width:390,height:844});await visit(page);await page.locator('details').evaluateAll(es=>es.forEach(e=>e.open=true));
    for(const width of [390,1440]){await page.setViewportSize({width,height:1000});const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();results.accessibility.push({width,violations:a.violations});assert.equal(a.violations.length,0,JSON.stringify(a.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));}
   }
   const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:844}});const plain=await nojs.newPage();await plain.goto(base);assert.equal(await plain.locator('.skill').count(),20);assert.equal(await plain.locator('.practice').count(),5);assert(await plain.locator('header nav').isVisible());await overflow(plain,engine+' no JavaScript');await nojs.close();
   const touch=await browser.newContext({hasTouch:true,viewport:{width:390,height:844}});const tp=await touch.newPage();await tp.goto(base);assert.equal(await tp.locator('.cursor').evaluate(el=>getComputedStyle(el).display),'none');await touch.close();
   assert.equal(failures.length,0,failures.join('\n'));results.functional.push({engine,status:'passed',checks:['menu open/close/Escape/focus loop','anchor history','all filters','all disclosures keyboard/mouse','rapid replay','clipboard/fallback','PDF download','local assets','anchor targets','mailto/LinkedIn targets','back to top','landscape','long content','reduced motion','no JavaScript','touch cursor']});
  }catch(e){results.errors.push(engine+': '+e.stack);console.error(engine,e.stack)}finally{await browser.close();}
 }
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));if(results.errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
