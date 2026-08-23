/* Снимает набор экранов для отчётной страницы. Логинимся мок-путём:
   в браузере вне Telegram кнопка входа идёт по мок-ветке AuthService. */
const fs = require('node:fs');
const { chromium, OUT, BASE, make, go } = require('./shot.js');

const DESKTOP = [
  ['landing', '/'], ['how', '/how-it-works'], ['pricing', '/pricing'],
  ['safety', '/safety'], ['tasks-public', '/tasks'], ['legal', '/legal/terms'],
];
const APP = [
  ['app-home', '/app'], ['app-tasks', '/app/tasks'], ['app-create', '/app/create'],
  ['app-executors', '/app/executors'], ['app-orders', '/app/orders'], ['app-profile', '/app/profile'],
];
const ADMIN = [
  ['admin-home', '/admin'], ['admin-users', '/admin/users'],
  ['admin-analytics', '/admin/analytics'], ['admin-audit', '/admin/audit'],
];
const MOBILE = [['m-landing', '/'], ['m-app', '/app'], ['m-pricing', '/pricing']];

const dir = OUT + 'shots/';
fs.mkdirSync(dir, { recursive: true });

async function shoot(page, name, path) {
  await go(page, path);
  await page.waitForTimeout(500);
  await page.screenshot({ path: dir + name + '.jpg', type: 'jpeg', quality: 70 });
  process.stderr.write(name + '\n');
}

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  const d = await make(b, 1280, 900);
  for (const [n, p] of DESKTOP) await shoot(d, n, p);

  // вход в приложение
  await go(d, '/app');
  await d.getByRole('button', { name: /Продолжить через Telegram/ }).click();
  await d.waitForTimeout(900);
  const role = await d.getByText('Мне нужна помощь').isVisible().catch(() => false);
  if (role) { await d.getByText('Мне нужна помощь').click(); await d.waitForTimeout(700); }
  for (const [n, p] of APP) await shoot(d, n, p);
  for (const [n, p] of ADMIN) await shoot(d, n, p);
  await d.close();

  const m = await make(b, 390, 780);
  await go(m, '/app');
  await m.getByRole('button', { name: /Продолжить через Telegram/ }).click().catch(() => {});
  await m.waitForTimeout(800);
  await m.getByText('Мне нужна помощь').click().catch(() => {});
  await m.waitForTimeout(600);
  for (const [n, p] of MOBILE) await shoot(m, n, p);
  await m.close();

  await b.close();
  console.log('готово: ' + dir);
})();
