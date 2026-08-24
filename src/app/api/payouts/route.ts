import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPaymentGateway } from '@/server/payments';
import { SESSION_COOKIE, readSession } from '@/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Минимальная сумма вывода. Держим на сервере: клиент её не задаёт. */
const MIN_AMOUNT = 500;

/**
 * POST /api/payouts  { amount, destination, token }
 *
 * token — идентификатор реквизитов на стороне провайдера. Номер карты
 * на сервер площадки не попадает и в базе не хранится.
 */
export async function POST(req: Request) {
  const jar = await cookies();
  const session = readSession(jar.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const gateway = getPaymentGateway();
  if (!gateway) {
    return NextResponse.json(
      { error: 'payment_provider_not_configured', message: 'Выплаты недоступны: провайдер не подключён.' },
      { status: 501 },
    );
  }

  let body: { amount?: number; destination?: string; token?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }

  const amount = Math.floor(Number(body.amount));
  const destination = body.destination === 'sbp' ? 'sbp' : 'card';
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT) {
    return NextResponse.json({ error: 'min_amount', minAmount: MIN_AMOUNT }, { status: 400 });
  }
  if (!body.token) return NextResponse.json({ error: 'no_destination' }, { status: 400 });

  // Здесь backend пересчитывает доступный остаток по своим записям
  // и только потом создаёт выплату. Сумма из запроса — пожелание.
  void destination;
  return NextResponse.json(
    { error: 'database_not_connected', message: 'Баланс пока не хранится на сервере.' },
    { status: 501 },
  );
}
