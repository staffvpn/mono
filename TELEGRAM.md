# tasko в Telegram

Два независимых сценария, оба уже размечены в коде:

1. **Mini App** — сайт открывается внутри Telegram на весь экран.
2. **Вход через Telegram на обычном сайте** — кнопка в шапке и в окне входа.

Вся логика в `telegram.js`. Сверху файла два поля:

```js
TASKO.config = {
  bot: '',        // имя бота без @
  verifyUrl: ''   // эндпоинт проверки подписи
};
```

Пока они пустые — работает демо-режим: окно открывается, показывает
профиль с тестовыми данными и честно об этом пишет.

---

## 1. Бот и Mini App

1. В [@BotFather](https://t.me/BotFather) → `/newbot`, получите токен.
2. `/setdomain` → укажите домен сайта. **Без этого веб-виджет входа не заработает.**
3. `/newapp` → привяжите Mini App к боту, укажите URL сайта.
4. `/setmenubutton` → кнопка в меню бота, открывающая Mini App.

Впишите имя бота в `TASKO.config.bot`.

## 2. Полный экран

`telegram.js` при запуске внутри Telegram сам вызывает:

| Метод | Что делает |
|---|---|
| `ready()` | сообщает клиенту, что интерфейс готов |
| `expand()` | разворачивает на всю высоту |
| `requestFullscreen()` | полноэкранный режим, Bot API 8.0+ |
| `disableVerticalSwipes()` | свайп вниз не сворачивает приложение |
| `setHeaderColor` / `setBackgroundColor` | под палитру сайта |

Все вызовы обёрнуты в проверку — на старых клиентах просто пропускаются.

В полноэкранном режиме Telegram рисует свою шапку **поверх** страницы.
Отступы берутся из `safeAreaInset` и `contentSafeAreaInset` и кладутся
в CSS-переменные `--tg-top`, `--tg-bottom`, `--tg-left`, `--tg-right`.
Значения пересчитываются по событиям `safeAreaChanged`,
`contentSafeAreaChanged`, `fullscreenChanged`, `viewportChanged`.

На `<html>` вешается класс `in-telegram` — по нему в `styles.css`
сдвигается шапка и прячется навигация, дублирующая меню Telegram.

## 3. Проверка подписи — обязательный шаг

**Данные из Telegram нельзя принимать на веру.** И `initData` у Mini App,
и ответ веб-виджета подписаны токеном бота, и проверять подпись можно
только на сервере: в браузере токен держать нельзя.

Поднимите эндпоинт и впишите его в `verifyUrl`. Он получает:

```json
{ "source": "miniapp" | "widget", "payload": "<initData или объект user>" }
```

и должен вернуть `{ "profile": { "id": 1, "name": "…", "tag": "@…", "photo": "…" } }`.

### Пример на Node

```js
import crypto from 'node:crypto';

const TOKEN = process.env.BOT_TOKEN;

// Mini App: initData — строка вида "query_id=…&user=…&hash=…"
function checkInitData(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(TOKEN).digest();
  const sign = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  if (sign !== hash) return null;

  // не принимать протухшие данные
  const authDate = Number(params.get('auth_date')) * 1000;
  if (Date.now() - authDate > 24 * 60 * 60 * 1000) return null;

  return JSON.parse(params.get('user'));
}

// Веб-виджет: приходит объект с полем hash
function checkWidget(user) {
  const { hash, ...rest } = user;
  const dataCheckString = Object.keys(rest).sort()
    .map(k => `${k}=${rest[k]}`).join('\n');

  const secret = crypto.createHash('sha256').update(TOKEN).digest();
  const sign = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  if (sign !== hash) return null;
  if (Date.now() / 1000 - rest.auth_date > 86400) return null;
  return rest;
}
```

Дальше — своя сессия: положите пользователя в базу и выдайте httpOnly-куку
или JWT. `localStorage` в `telegram.js` хранит только имя и аватар для
отрисовки, сессией он не является.

На Vercel это кладётся в `api/auth.js` как serverless-функция.
`BOT_TOKEN` — в переменные окружения проекта, не в репозиторий.

## 4. Что уже сделано в интерфейсе

- **Любое действие требует входа.** Один делегированный обработчик
  перехватывает клики по `.btn`, `.tile`, `.req__go`, `.link--arrow`
  и отправку форм — до того, как сработают их собственные обработчики.
  Новая кнопка с классом `.btn` подхватится сама, размечать её не нужно.
  Не перехватываются: навигация (меню, якоря, логотип), подсказки под
  поиском, аккордеон FAQ и всё внутри самого окна — иначе по сайту
  нельзя было бы ходить.
  После входа перехват отключается и кнопки работают как обычно,
  после выхода — включается снова.
- Кнопка «Войти» в шапке и в мобильном меню.
- Окно входа вылетает снизу с разворотом, закрывается по фону, крестику и Esc.
- Три шага: приглашение → ожидание → профиль.
- Внутри Telegram шаг с виджетом пропускается: пользователь уже авторизован,
  имя и аватар берутся из `initDataUnsafe.user`.
- Системная кнопка «назад» в Telegram закрывает окно.
- После входа кнопка в шапке превращается в имя с аватаркой.
- Профиль — заготовка: статистика и разделы помечены «скоро».

## 5. Чего ещё нет

- Бэкенда с проверкой подписи (см. пункт 3) — без него вход демонстрационный.
- Наполнения профиля: задачи, отклики, чаты, оплата.
- Привязки задач к пользователю — нужна база.
