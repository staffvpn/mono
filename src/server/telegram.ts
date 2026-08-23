import crypto from 'node:crypto';

/* ============================================================
   Проверка подписи Telegram — только на сервере.
   Данные пользователя, пришедшие с фронта без подписи (window.Telegram
   .WebApp.initDataUnsafe), доверенными не считаются никогда.

   Схем подписи две, и они разные:
   • Mini App  — секрет = HMAC_SHA256(bot_token, ключ «WebAppData»)
   • Login Widget — секрет = SHA256(bot_token)
   Перепутать их местами нельзя: подпись не сойдётся.
   ============================================================ */

const MAX_AGE_SECONDS = 24 * 60 * 60; // данные старше суток не принимаем

export interface TelegramProfile {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
  is_premium?: boolean;
}

/** Токен только из окружения. При вставке в панель хостинга к нему часто липнет пробел. */
export function botToken(): string {
  return (process.env.BOT_TOKEN || '').trim();
}

/** Сравнение за постоянное время: иначе подпись подбирается побайтово. */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function fresh(authDate: unknown): boolean {
  const ts = Number(authDate);
  if (!Number.isFinite(ts) || ts <= 0) return false;
  return Date.now() / 1000 - ts <= MAX_AGE_SECONDS;
}

/** Mini App: initData — строка вида "user=…&auth_date=…&hash=…". */
export function verifyInitData(initData: string, token: string): TelegramProfile | null {
  if (!initData || !token) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');
  // signature относится к сторонней проверке через публичный ключ Telegram
  // и в data-check-string для hash не входит.
  params.delete('signature');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
  const sign = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  if (!safeEqual(sign, hash)) return null;
  if (!fresh(params.get('auth_date'))) return null;

  try {
    const user = JSON.parse(params.get('user') || 'null') as TelegramProfile | null;
    return user && typeof user.id === 'number' ? user : null;
  } catch {
    return null;
  }
}

/** Telegram Login Widget: плоский объект с полем hash. */
export function verifyWidget(payload: unknown, token: string): TelegramProfile | null {
  if (!payload || typeof payload !== 'object' || !token) return null;
  const { hash, ...rest } = payload as Record<string, unknown> & { hash?: string };
  if (!hash || typeof hash !== 'string') return null;

  const dataCheckString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${String(rest[k])}`)
    .join('\n');

  const secret = crypto.createHash('sha256').update(token).digest();
  const sign = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  if (!safeEqual(sign, hash)) return null;
  if (!fresh(rest.auth_date)) return null;

  const id = Number(rest.id);
  if (!Number.isFinite(id)) return null;
  return { ...(rest as object), id } as TelegramProfile;
}
