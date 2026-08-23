import { NextResponse } from 'next/server';
import { botToken, verifyInitData, verifyWidget } from '@/server/telegram';
import { SESSION_COOKIE, cookieOptions, sessionSecretConfigured, signSession } from '@/server/session';

/** node:crypto недоступен в edge-рантайме. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/telegram
 * body: { source: 'miniapp', payload: string } | { source: 'widget', payload: object }
 *
 * Проверяет подпись на сервере и выдаёт сессионную куку.
 * Данные пользователя, присланные без подписи, игнорируются полностью.
 */
export async function POST(req: Request) {
  const token = botToken();
  if (!token) {
    return NextResponse.json(
      { error: 'bot_token_not_configured', message: 'BOT_TOKEN не задан в переменных окружения.' },
      { status: 503 },
    );
  }
  if (!sessionSecretConfigured()) {
    return NextResponse.json(
      { error: 'session_secret_not_configured', message: 'SESSION_SECRET не задан (нужно не меньше 16 символов).' },
      { status: 503 },
    );
  }

  let body: { source?: string; payload?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const profile =
    body.source === 'miniapp'
      ? verifyInitData(String(body.payload ?? ''), token)
      : body.source === 'widget'
        ? verifyWidget(body.payload, token)
        : null;

  if (!profile) {
    return NextResponse.json({ error: 'bad_signature' }, { status: 401 });
  }

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Без имени';
  const session = signSession({
    via: 'telegram',
    telegramId: profile.id,
    name,
    username: profile.username,
    photoUrl: profile.photo_url,
    iat: Math.floor(Date.now() / 1000),
  });

  // Здесь место для записи пользователя в базу: найти по telegramId,
  // создать при первом входе и вернуть внутренний идентификатор.
  // Пока базы нет — возвращаем только проверенный профиль.
  const res = NextResponse.json({
    profile: {
      telegramId: profile.id,
      name,
      username: profile.username ?? null,
      photoUrl: profile.photo_url ?? null,
      languageCode: profile.language_code ?? null,
      isPremium: Boolean(profile.is_premium),
    },
    persisted: false,
  });
  res.cookies.set(SESSION_COOKIE, session, cookieOptions());
  return res;
}

/**
 * GET /api/auth/telegram — самопроверка настройки.
 * Отдаёт только «задано / не задано»: ни токен, ни секрет наружу не уходят.
 */
export async function GET() {
  const token = botToken();
  const secret = sessionSecretConfigured();
  return NextResponse.json({
    ok: Boolean(token) && secret,
    botToken: token ? 'задан' : 'НЕ ЗАДАН',
    sessionSecret: secret ? 'задан' : 'НЕ ЗАДАН',
    hint: token && secret
      ? 'Всё готово: можно указывать домен в @BotFather и проверять вход.'
      : 'Добавьте недостающие переменные в настройках хостинга и передеплойте проект.',
  });
}
