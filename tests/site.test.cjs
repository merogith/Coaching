const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

let server, browser, base;
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.csv': 'text/csv', '.png': 'image/png', '.woff2': 'font/woff2' };
before(async () => {
  server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (!url.pathname.startsWith('/Coaching/')) { res.writeHead(404).end(); return; }
      let name = decodeURIComponent(url.pathname.slice('/Coaching/'.length));
      if (!name || name.endsWith('/')) name += 'index.html';
      const file = path.resolve(root, name);
      if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
      const data = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(data);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/Coaching/`;
  browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {});
});
after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

async function open(language = 'en', options = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  // Tests never submit a real request, even if an assertion fails partway through.
  await page.route('https://formspree.io/**', route => route.abort());
  await page.goto(base + (language === 'tr' ? 'tr/' : ''), { waitUntil: 'networkidle' });
  return { page, context };
}

for (const language of ['en', 'tr']) {
  for (const width of [320, 390, 1280]) {
    test(`${language} content, links and download at ${width}px`, async () => {
      const { page, context } = await open(language, { viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      try {
        assert.equal(await page.locator('html').getAttribute('lang'), language);
        assert.equal(await page.locator('#testimonials').count(), 0);
        assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1);
        const broken = await page.locator('a[href^="#"]').evaluateAll(links => links.map(a => a.getAttribute('href')).filter(href => !document.getElementById(href.slice(1))));
        assert.deepEqual(broken, []);
        const size = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }));
        assert.ok(size.content <= size.width, JSON.stringify(size));
        const download = page.waitForEvent('download');
        await page.locator('#worksheet a[download]').click();
        const file = await download;
        assert.match(file.suggestedFilename(), /money-map.*\.csv/);
        assert.equal(await file.failure(), null);
        const rows = (await fs.readFile(await file.path(), 'utf8')).trim().split('\n');
        assert.equal(rows.length, 9);
        await page.locator('.nav__tools > a').first().click();
        assert.equal(await page.locator('html').getAttribute('lang'), language === 'en' ? 'tr' : 'en');
      } finally { await context.close(); }
    });
  }

  test(`${language} request validation, retry, success and a new request`, async () => {
    const { page, context } = await open(language);
    let requests = 0;
    let result = 'failure';
    await page.route('https://formspree.io/**', async route => {
      requests++;
      if (result === 'failure') await route.fulfill({ status: 503, body: 'unavailable' });
      else await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    try {
      await page.locator('button[type=submit]').click();
      assert.equal(requests, 0, 'required fields prevent a network request');
      await page.locator('#cname').fill('Example Person');
      await page.locator('#cemail').fill('example@invalid.test');
      await page.locator('#cmsg').fill('Example request used only in an intercepted test.');
      await page.locator('button[type=submit]').click();
      await page.locator('.form-error').waitFor();
      assert.equal(await page.locator('#cname').inputValue(), 'Example Person');
      assert.equal(await page.locator('button[type=submit]').isEnabled(), true);
      assert.match(await page.locator('.form-status').textContent(), language === 'tr' ? /doğrulayamadık/ : /couldn’t confirm/);
      result = 'success';
      await page.locator('button[type=submit]').click();
      await page.locator('.book__grid').waitFor({ state: 'hidden' });
      assert.match(await page.locator('.form-status').textContent(), language === 'tr' ? /Henüz kesinleşmiş/ : /not scheduled yet/);
      assert.equal(await page.locator('.form-status').evaluate(el => document.activeElement === el), true);
      await page.locator('form button[type=button]').click();
      assert.equal(await page.locator('#cname').inputValue(), '');
      assert.equal(await page.locator('#cname').evaluate(el => document.activeElement === el), true);
      assert.equal(requests, 2);
    } finally { await context.close(); }
  });
}

test('mobile navigation works by keyboard and closed links stay out of focus', async () => {
  const { page, context } = await open('en', { viewport: { width: 390, height: 844 } });
  try {
    const burger = page.locator('#navBurger');
    assert.equal(await page.locator('#navLinks').evaluate(el => getComputedStyle(el).visibility), 'hidden');
    await burger.focus();
    await page.keyboard.press('Enter');
    assert.equal(await burger.getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await burger.getAttribute('aria-expanded'), 'false');
    assert.equal(await burger.evaluate(el => document.activeElement === el), true);
    await page.keyboard.press('Enter');
    await page.locator('#navLinks a[href="#faq"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await burger.getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('#faq').evaluate(el => document.activeElement === el), true);
    await page.getByText('What does it cost?', { exact: true }).press('Enter');
    assert.equal(await page.locator('details').first().getAttribute('open'), '');
  } finally { await context.close(); }
});

test('blocked storage keeps content, theme and the mobile menu usable', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Storage.prototype.getItem = Storage.prototype.setItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
  });
  try {
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.hero .reveal')).opacity === '1');
    await page.locator('#themeToggle').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await page.locator('#navBurger').click();
    assert.equal(await page.locator('#navBurger').getAttribute('aria-expanded'), 'true');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('a stalled request times out, preserves the draft, and allows retry', async () => {
  const { page, context } = await open();
  try {
    await page.route('https://formspree.io/**', () => {});
    // Advance the browser clock rather than waiting 15 real seconds.
    await page.clock.install();
    await page.locator('#cname').fill('Example Person');
    await page.locator('#cemail').fill('example@invalid.test');
    await page.locator('button[type=submit]').click();
    assert.equal(await page.locator('form').getAttribute('aria-busy'), 'true');
    await page.clock.runFor(16000);
    await page.locator('.form-error').waitFor();
    assert.equal(await page.locator('button[type=submit]').isEnabled(), true);
    assert.equal(await page.locator('#cemail').inputValue(), 'example@invalid.test');
  } finally { await context.close(); }
});

test('content and navigation remain available without JavaScript', async () => {
  const { page, context } = await open('en', { javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    assert.equal(await page.locator('.hero .reveal').evaluate(el => getComputedStyle(el).opacity), '1');
    assert.equal(await page.locator('#navLinks').isVisible(), true);
    assert.equal(await page.locator('form').getAttribute('method'), 'POST');
    assert.equal(await page.locator('form').getAttribute('action'), 'https://formspree.io/f/xpqevbbp');
  } finally { await context.close(); }
});
