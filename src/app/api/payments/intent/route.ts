import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPaymentGateway, settle, type PaymentMethod } from '@/server/payments';
import { SESSION_COOKIE, readSession } from '@/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const METHODS: PaymentMethod[] = ['card', 'sbp', 'telegram'];

/**
 * POST /api/payments/intent  { orderId, method }
 *
 * Сумму берём из заказа на сервере. Присланная клиентом цена игнорируется:
 * иначе оплатить заказ на 50 000 ₽ можно было бы рублём.
 */
export async function POST(req: Request) {
  const jar = await cookies();
  const session = readSession(jar.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const gateway = getPaymentGateway();
  if (!gateway) {
    return NextResponse.json(
      {
        error: 'payment_provider_not_configured',
        message: 'Платёжный провайдер не подключён. Оплата недоступна.',
      },
      { status: 501 },
    );
  }

  let body: { orderId?: string; method?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }

  const orderId = String(body.orderId ?? '').trim();
  const method = String(body.method ?? '') as PaymentMethod;
  if (!orderId || !METHODS.includes(method)) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  // Здесь backend достаёт заказ из базы и проверяет:
  //   • сессия принадлежит заказчику этого заказа;
  //   • условия подтверждены обеими сторонами;
  //   • заказ ещё не оплачен.
  // Без базы проверить нечего, поэтому дальше не идём.
  return NextResponse.json(
    { error: 'database_not_connected', message: 'Заказы пока не хранятся на сервере.' },
    { status: 501 },
  );
}

/** GET — какие способы оплаты доступны. Клиенту нужно знать, что показывать. */
export async function GET() {
  const gateway = getPaymentGateway();
  return NextResponse.json({
    configured: Boolean(gateway),
    provider: gateway?.name ?? null,
    methods: gateway ? METHODS : [],
    commissionPercent: settle(0).percent,
  });
}
