/* Прогон всех экранов по ширинам: ищем горизонтальную прокрутку и ошибки в консоли.
   Разбор виновных элементов делаем внутри страницы одним проходом и с ранним выходом:
   getComputedStyle на каждом узле — это принудительный пересчёт стилей, на узких
   ширинах он превращал проверку в минуты на страницу. */
const { chromium, BASE, make, go } = require('./shot');

const WIDTHS = [320, 360, 375, 390, 414, 430, 768, 820, 1024, 1280, 1440, 1920];
const PAGES = [
  '/', '/how-it-works', '/safety', '/payments', '/pricing', '/tasks', '/help',
  '/legal/terms', '/legal/privacy', '/legal/rules',
  '/app', '/app/tasks', '/app/create', '/app/executors', '/app/orders',
  '/app/messages', '/app/notifications', '/app/favorites', '/app/profile', '/app/help',
  '/admin', '/admin/users', '/admin/tasks', '/admin/applications', '/admin/orders',
  '/admin/payments', '/admin/moderation', '/admin/reports', '/admin/disputes',
  '/admin/support', '/admin/verification', '/admin/risk', '/admin/categories',
  '/admin/notifications', '/admin/flags', '/admin/settings', '/admin/audit', '/admin/analytics',
];

const probe = () => {
  const de = document.documentElement;
  if (de.scrollWidth <= de.clientWidth + 1) return null;

  const limit = de.clientWidth + 1;
  const out = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  let el = walk.nextNode();
  while (el && out.length < 3) {
    const b = el.getBoundingClientRect();
    if (b.width > 0 && b.right > limit) {
      // Свой горизонтальный скролл — осознанное решение, а не поломка:
      // пропускаем и сам узел, и всё, что лежит внутри скроллящегося предка.
      let scroller = null;
      for (let a = el; a && a !== document.body; a = a.parentElement) {
        const ox = getComputedStyle(a).overflowX;
        if (ox === 'auto' || ox === 'scroll') { scroller = a; break; }
      }
      if (scroller) {
        walk.currentNode = scroller;
        let next = walk.nextSibling();
        while (!next && walk.parentNode()) next = walk.nextSibling();
        el = next;
        continue;
      }
      out.push(`${el.tagName.toLowerCase()}.${String(el.className || '').slice(0, 50)} → ${Math.round(b.right)}px`);
    }
    el = walk.nextNode();
  }
  return { doc: de.scrollWidth, view: de.clientWidth, over: out };
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const problems = [];
  const errors = [];

  for (const w of WIDTHS) {
    const page = await make(browser, w, 900);
    page.on('pageerror', (e) => errors.push(`${w}px ${page.url()}: ${e.message}`));

    for (const p of PAGES) {
      await go(page, p);
      const r = await page.evaluate(probe);
      process.stderr.write(`${w}px ${p}${r ? ' ← перелив' : ''}\n`);
      if (r) problems.push(`${w}px ${p}: документ ${r.doc} > ${r.view}${r.over.length ? ' | ' + r.over.join(' ; ') : ''}`);
    }
    await page.close();
  }

  await browser.close();
  console.log(problems.length ? problems.join('\n') : 'Горизонтальной прокрутки нет ни на одной ширине.');
  console.log(errors.length ? '\nJS-ошибки:\n' + errors.join('\n') : 'JS-ошибок нет.');
  process.exit(problems.length || errors.length ? 1 : 0);
})();
