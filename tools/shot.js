/* Снимает страницы приложения. Внешние хосты заблокированы в этом
   окружении, поэтому глушим их явно, иначе networkidle не наступает. */
const { chromium } = require('/tmp/claude-0/-home-user-mono/891f74c8-a0d6-547a-baac-42de3fcd1a22/scratchpad/tools/node_modules/playwright');

const OUT = '/tmp/claude-0/-home-user-mono/891f74c8-a0d6-547a-baac-42de3fcd1a22/scratchpad/';
const BASE = 'http://localhost:4300';

async function make(browser, width = 1440, height = 1000) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  // Глоб '**://*' совпадает только со scheme://host и НЕ ловит адреса с путём:
  // из-за этого шрифты Google уходили в сеть и держали DOMContentLoaded ~12 с.
  await page.route('**/*', (route) => {
    const u = route.request().url();
    if (u.startsWith(BASE)) return route.continue();
    return route.abort();
  });
  return page;
}

async function go(page, path) {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(350);
}

module.exports = { chromium, OUT, BASE, make, go };
