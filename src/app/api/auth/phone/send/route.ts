import { NextResponse } from 'next/server';
import {
  CODE_TTL_SECONDS, RESEND_COOLDOWN_SECONDS, getSmsProvider, hashCode,
  memoryCodeStore, normalizePhone, randomCode,
} from '@/server/sms';
import { sessionSecretConfigured } from '@/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/phone/send  { phone: string }
 * Код генерируется и хранится ТОЛЬКО на сервере и только в виде хэша.
 * В ответе кода нет — иначе проверка теряет смысл.
 */
export async function POST(req: Request) {
  const provider = getSmsProvider();
  if (!provider) {
    return NextResponse.json(
      {
        error: 'sms_provider_not_configured',
        message: 'SMS-провайдер не подключён. Вход по номеру телефона недоступен, используйте вход через Telegram.',
      },
      { status: 501 },
    );
  }
  if (!sessionSecretConfigured()) {
    return NextResponse.json({ error: 'session_secret_not_configured' }, { status: 503 });
  }

  let body: { phone?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }

  const phone = normalizePhone(body.phone ?? '');
  if (!phone) return NextResponse.json({ error: 'bad_phone' }, { status: 400 });

  const existing = await memoryCodeStore.get(phone);
  if (existing && Date.now() - existing.sentAt < RESEND_COOLDOWN_SECONDS * 1000) {
    const wait = Math.ceil((RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - existing.sentAt)) / 1000);
    return NextResponse.json({ error: 'too_soon', retryAfterSeconds: wait }, { status: 429 });
  }

  const code = randomCode();
  await memoryCodeStore.set(phone, {
    hash: hashCode(phone, code),
    expiresAt: Date.now() + CODE_TTL_SECONDS * 1000,
    attempts: 0,
    sentAt: Date.now(),
  });

  try {
    await provider.send(phone, `Код для входа: ${code}`);
  } catch {
    await memoryCodeStore.delete(phone);
    return NextResponse.json({ error: 'sms_send_failed' }, { status: 502 });
  }

  return NextResponse.json({ sent: true, ttlSeconds: CODE_TTL_SECONDS });
}
