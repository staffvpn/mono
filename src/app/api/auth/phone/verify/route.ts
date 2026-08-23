import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { MAX_ATTEMPTS, getSmsProvider, hashCode, memoryCodeStore, normalizePhone } from '@/server/sms';
import { SESSION_COOKIE, cookieOptions, sessionSecretConfigured, signSession } from '@/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/auth/phone/verify  { phone, code } */
export async function POST(req: Request) {
  if (!getSmsProvider()) {
    return NextResponse.json(
      { error: 'sms_provider_not_configured', message: 'SMS-провайдер не подключён.' },
      { status: 501 },
    );
  }
  if (!sessionSecretConfigured()) {
    return NextResponse.json({ error: 'session_secret_not_configured' }, { status: 503 });
  }

  let body: { phone?: string; code?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }

  const phone = normalizePhone(body.phone ?? '');
  const code = String(body.code ?? '').trim();
  if (!phone || !/^\d{4}$/.test(code)) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const rec = await memoryCodeStore.get(phone);
  if (!rec) return NextResponse.json({ error: 'code_expired' }, { status: 410 });

  if (rec.attempts >= MAX_ATTEMPTS) {
    await memoryCodeStore.delete(phone);
    return NextResponse.json({ error: 'too_many_attempts' }, { status: 429 });
  }

  const given = Buffer.from(hashCode(phone, code), 'utf8');
  const want = Buffer.from(rec.hash, 'utf8');
  const ok = given.length === want.length && crypto.timingSafeEqual(given, want);

  if (!ok) {
    await memoryCodeStore.set(phone, { ...rec, attempts: rec.attempts + 1 });
    return NextResponse.json({ error: 'bad_code', attemptsLeft: MAX_ATTEMPTS - rec.attempts - 1 }, { status: 401 });
  }

  await memoryCodeStore.delete(phone);

  // Здесь место для записи пользователя в базу: найти по номеру,
  // создать при первом входе, вернуть внутренний идентификатор.
  const res = NextResponse.json({ profile: { phone }, persisted: false });
  res.cookies.set(
    SESSION_COOKIE,
    signSession({ via: 'phone', phone, iat: Math.floor(Date.now() / 1000) }),
    cookieOptions(),
  );
  return res;
}
