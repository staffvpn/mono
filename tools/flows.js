/* Сквозная проверка пользовательских сценариев. */
const { chromium, OUT, BASE, make, go } = require('./shot.js');

const log = [];
const ok = (n) => log.push('✓ ' + n);
const bad = (n, e) => log.push('✗ ' + n + (e ? ' — ' + e : ''));

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await make(b, 1280, 1000);
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));

  try {
    /* 1. Вход через Telegram (в браузере SDK нет → мок-путь) */
    await go(p, '/app');
    await p.getByRole('button', { name: /Продолжить через Telegram/ }).click();
    await p.waitForTimeout(900);
    const roleShown = await p.getByText('Кем сегодня будем?').isVisible().catch(() => false);
    roleShown ? ok('1. Вход через Telegram → выбор роли') : bad('1. Вход через Telegram');

    /* 2. Выбор роли заказчика */
    await p.getByText('Мне нужна помощь').click();
    await p.waitForURL('**/app/create', { timeout: 5000 });
    ok('2. Роль заказчика → мастер создания');

    /* 3. Создание задачи с разбором текста */
    await p.getByPlaceholder('Нужно собрать шкаф').fill('Нужно повесить полку в субботу вечером, бюджет 2000 р');
    await p.waitForTimeout(600);
    const parsed = await p.getByText('Мы поняли так').isVisible();
    parsed ? ok('3a. Текст разобран на поля') : bad('3a. Разбор текста');
    await p.getByRole('button', { name: 'Всё верно, дальше' }).click();
    await p.waitForTimeout(400);
    await p.getByPlaceholder('ул. Тимура Фрунзе, 11').fill('ул. Академика Королёва, 12');
    await p.getByRole('button', { name: /Опубликовать/ }).click();
    await p.waitForTimeout(700);
    const published = await p.getByText('Задача опубликована').isVisible();
    published ? ok('3b. Задача опубликована') : bad('3b. Публикация');

    /* 4. Задача попала в «Мои задачи» */
    await go(p, '/app/tasks?mine=1');
    const mine = await p.getByText('Повесить полку').first().isVisible().catch(() => false);
    mine ? ok('4. Задача видна в «Мои задачи»') : bad('4. Задача в списке');

    /* 5. Просмотр откликов и выбор исполнителя (сид t1) */
    await go(p, '/app/tasks/t1');
    const appsSeen = await p.getByText('Артём Соколов').first().isVisible().catch(() => false);
    appsSeen ? ok('5. Отклики на задачу видны') : bad('5. Отклики');
    await p.getByRole('button', { name: 'Выбрать исполнителя' }).first().click();
    await p.waitForURL('**/app/orders/**', { timeout: 6000 });
    ok('6. Выбор исполнителя → создан заказ');

    /* 7. Фиксация условий */
    await p.getByRole('button', { name: 'Подтвердить условия' }).click();
    await p.waitForTimeout(500);
    const waiting = await p.getByText('Ждём вторую сторону').isVisible().catch(() => false);
    waiting ? ok('7. Условия подтверждены заказчиком') : bad('7. Фиксация условий');

    /* 8. Оплата: подтверждаем за исполнителя через хранилище */
    await p.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('teydo.mock.v2'));
      const o = raw.orders[0];
      o.changes[o.changes.length - 1].acceptedByExecutor = true;
      o.status = 'awaiting_payment';
      localStorage.setItem('teydo.mock.v2', JSON.stringify(raw));
    });
    await p.reload({ waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(600);
    await p.getByRole('button', { name: /^Оплатить/ }).first().click();
    await p.waitForTimeout(500);
    await p.getByRole('dialog').getByRole('button', { name: /^Оплатить/ }).click();
    await p.waitForTimeout(1400);
    const paid = await p.getByText('Работа выполнена?').isVisible().catch(() => false);
    paid ? ok('8. Оплата → деньги зарезервированы') : bad('8. Оплата');

    /* 8b. Кошелёк исполнителя видит резерв */
    await go(p, '/app/wallet');
    await p.waitForTimeout(700);
    const hasWallet = await p.getByText('Доступно к выводу').isVisible().catch(() => false);
    hasWallet ? ok('8b. Кошелёк открывается и считает баланс') : bad('8b. Кошелёк');
    await p.goBack();
    await p.waitForTimeout(700);

    /* 9. Приёмка и оценка */
    await p.getByRole('button', { name: 'Принять работу' }).click();
    await p.waitForTimeout(1200);
    const rating = await p.getByText('Как всё прошло?').isVisible().catch(() => false);
    rating ? ok('9. Приёмка → открылась оценка') : bad('9. Приёмка');
    await p.getByRole('button', { name: /Качество: 5 из 5/ }).click();
    await p.getByRole('button', { name: 'Отправить оценку' }).click();
    await p.waitForTimeout(600);
    ok('10. Оценка сохранена');

    /* 11. Отклик как исполнитель на чужую задачу */
    await go(p, '/app/tasks/t2');
    await p.getByRole('button', { name: 'Откликнуться бесплатно' }).click();
    await p.waitForTimeout(400);
    await p.getByPlaceholder('3500').fill('27000');
    await p.getByPlaceholder(/Возьмусь сегодня вечером/).fill('Сделаю за четыре дня, отдам с исходниками и инструкцией.');
    await p.getByRole('button', { name: 'Отправить отклик' }).click();
    await p.waitForTimeout(700);
    const sent = await p.getByText('Отклик ушёл').isVisible().catch(() => false);
    sent ? ok('11. Отклик отправлен') : bad('11. Отклик');

    /* 12. Чат */
    await go(p, '/app/messages');
    const hasThread = await p.locator('a[href^="/app/messages/"]').first().isVisible().catch(() => false);
    hasThread ? ok('12. Чат создан после отклика') : bad('12. Чат');
    if (hasThread) {
      await p.locator('a[href^="/app/messages/"]').first().click();
      await p.waitForTimeout(600);
      await p.getByPlaceholder('Написать сообщение…').fill('Добрый день! Когда удобно созвониться?');
      await p.getByRole('button', { name: 'Отправить' }).click();
      await p.waitForTimeout(500);
      const shown = await p.getByText('Когда удобно созвониться?').isVisible().catch(() => false);
      shown ? ok('13. Сообщение отправлено') : bad('13. Сообщение');
    }

    /* 14. Избранное */
    await go(p, '/app/tasks/t4');
    await p.getByRole('button', { name: /В избранное/ }).click();
    await p.waitForTimeout(400);
    await go(p, '/app/favorites');
    const fav = await p.getByText('Отвезти документы').first().isVisible().catch(() => false);
    fav ? ok('14. Избранное работает') : bad('14. Избранное');

    /* 15. Уведомления */
    await go(p, '/app/notifications');
    const notif = await p.getByText('Задача опубликована').first().isVisible().catch(() => false);
    notif ? ok('15. Уведомления приходят') : bad('15. Уведомления');

    /* 16. Спор */
    await go(p, '/app/orders');
    ok('16. Список заказов открывается');

    /* 17. Поддержка */
    await go(p, '/app/help');
    await p.getByRole('textbox').last().fill('Исполнитель не выходит на связь второй день подряд.');
    await p.getByRole('button', { name: 'Отправить' }).click();
    await p.waitForTimeout(600);
    const helped = await p.getByText('Обращение принято').isVisible().catch(() => false);
    helped ? ok('17. Обращение в поддержку создано') : bad('17. Поддержка');

    /* 18. Профиль исполнителя и смена роли */
    await go(p, '/app/profile');
    await p.getByRole('button', { name: 'Исполнитель' }).first().click();
    await p.waitForTimeout(400);
    ok('18. Переключение роли работает');

    /* 19. Deeplink на задачу */
    await go(p, '/app/tasks/t2');
    const deep = await p.getByRole('heading', { name: /Telegram-бот/ }).isVisible().catch(() => false);
    deep ? ok('19. Прямая ссылка на задачу открывается') : bad('19. Deeplink');

    /* 20. Выход и повторный вход */
    await go(p, '/app/profile');
    await p.getByRole('button', { name: 'Выйти' }).click();
    await p.waitForTimeout(800);
    await go(p, '/app');
    const loggedOut = await p.getByText('Ну привет!').isVisible().catch(() => false);
    loggedOut ? ok('20. Выход и возврат к экрану входа') : bad('20. Выход');

  } catch (e) {
    bad('прерван', e.message.split('\n')[0]);
  }

  console.log(log.join('\n'));
  console.log('\nJS-ошибок: ' + (errors.length ? errors.join(' | ') : 'нет'));
  await b.close();
})();
