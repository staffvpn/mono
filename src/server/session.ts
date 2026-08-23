import crypto from 'node:crypto';

/* ============================================================
   Сессия: подписанная httpOnly-кука.
   Это НЕ замена базе пользователей — кука лишь подтверждает,
   что предъявитель прошёл проверку подписи Telegram или кода из СМС.
   При подключении backend выдачу сессии забирает он.
   ============================================================ */

export const SESSION_COOKIE = 'teydo_session';
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export interface SessionPayload {
  /** Способ входа, которым сессия была получена. */
  via: 'telegram' | 'phone';
  /** Идентификатор Telegram, если вход был через Telegram. */
  telegramId?: number;
  /** Телефон в формате E.164, если вход был по номеру. */
  phone?: string;
  name?: string;
  username?: string;
  photoUrl?: string;
  /** Момент выдачи, секунды. */
  iat: number;
}

function secret(): string {
  // Отдельный секрет для подписи сессии. Токен бота для этого не используем:
  // у него другая зона ответственности и другой срок жизни.
  return (process.env.SESSION_SECRET || '').trim();
}

export function sessionSecretConfigured(): boolean {
  return secret().length >= 16;
}

const b64u = (b: Buffer) => b.toString('base64url');

export function signSession(payload: SessionPayload): string {
  const body = b64u(Buffer.from(JSON.stringify(payload), 'utf8'));
  const mac = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${mac}`;
}

export function readSession(raw: string | undefined): SessionPayload | null {
  if (!raw || !sessionSecretConfigured()) return null;
  const [body, mac] = raw.split('.');
  if (!body || !mac) return null;

  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  const a = Buffer.from(mac, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (Date.now() / 1000 - payload.iat > MAX_AGE_SECONDS) return null;
    return payload;
  } catch {
    return null;
  }
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  };
}
