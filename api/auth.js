/* ============================================================
   Проверка подписи Telegram — Vercel serverless function
   ------------------------------------------------------------
   Токен бота берётся ТОЛЬКО из переменной окружения.
   В репозиторий его класть нельзя: он даёт полный доступ к боту.
   Vercel → Project → Settings → Environment Variables → BOT_TOKEN
   ============================================================ */
const crypto = require('node:crypto');

const MAX_AGE = 24 * 60 * 60; // данные старше суток не принимаем

/* Mini App: initData — строка вида "user=…&auth_date=…&hash=…" */
function checkInitData(initData, token) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  params.delete('signature');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
  const sign = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  if (!timingSafeEqual(sign, hash)) return null;

  const authDate = Number(params.get('auth_date'));
  if (!authDate || Date.now() / 1000 - authDate > MAX_AGE) return null;

  try {
    return JSON.parse(params.get('user'));
  } catch (e) {
    return null;
  }
}

/* Веб-виджет: объект с полем hash */
function checkWidget(user, token) {
  if (!user || typeof user !== 'object' || !user.hash) return null;
  const { hash, ...rest } = user;

  const dataCheckString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join('\n');

  const secret = crypto.createHash('sha256').update(token).digest();
  const sign = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  if (!timingSafeEqual(sign, hash)) return null;

  if (!rest.auth_date || Date.now() / 1000 - Number(rest.auth_date) > MAX_AGE) return null;
  return rest;
}

/* сравнение постоянного времени — иначе подпись можно подобрать побайтово */
function timingSafeEqual(a, b) {
  const ba = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  // При вставке в панель Vercel к токену часто прилипает пробел
  // или перевод строки — тогда подпись не сойдётся ни при каких данных.
  const token = (process.env.BOT_TOKEN || '').trim();
  if (!token) {
    res.status(500).json({ error: 'bot_token_not_configured' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || !body.source) {
    res.status(400).json({ error: 'bad_request' });
    return;
  }

  const user =
    body.source === 'miniapp'
      ? checkInitData(String(body.payload || ''), token)
      : checkWidget(body.payload, token);

  if (!user) {
    res.status(401).json({ error: 'bad_signature' });
    return;
  }

  // Здесь место для своей сессии: положить пользователя в базу
  // и выдать httpOnly-куку. Пока отдаём профиль для отрисовки.
  res.status(200).json({
    profile: {
      id: user.id,
      name: [user.first_name, user.last_name].filter(Boolean).join(' '),
      tag: user.username ? '@' + user.username : '',
      photo: user.photo_url || ''
    }
  });
};
