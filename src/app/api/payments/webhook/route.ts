import { NextResponse } from 'next/server';
import { getPaymentGateway, isDuplicateEvent } from '@/server/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/webhook — уведомление от платёжного провайдера.
 *
 * Единственное место, где меняется статус платежа. Клиент такого права
 * не имеет ни при каких условиях: «я оплатил» из браузера — не событие.
 */
export async function POST(req: Request) {
  const gateway = getPaymentGateway();
  if (!gateway) {
    return NextResponse.json({ error: 'payment_provider_not_configured' }, { status: 501 });
  }

  // Подпись считается по сырому телу: JSON.parse и обратная сборка
  // меняют порядок ключей и пробелы, и подпись перестаёт сходиться.
  const raw = await req.text();
  const signature = req.headers.get('x-payment-signature');
  if (!gateway.verifyWebhook(raw, signature)) {
    return NextResponse.json({ error: 'bad_signature' }, { status: 401 });
  }

  let event: { id?: string; type?: string; paymentId?: string };
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }

  const eventId = String(event.id ?? '');
  if (!eventId) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  // Провайдер повторяет доставку, пока не получит 200. Повтор обязан
  // отвечать успехом, но ничего не делать: иначе деньги уйдут дважды.
  if (isDuplicateEvent(eventId)) return NextResponse.json({ ok: true, duplicate: true });

  // Здесь backend переводит заказ и платёж в новое состояние:
  //   payment.succeeded → held, payment.captured → released,
  //   payment.canceled  → failed, refund.succeeded → refunded.
  return NextResponse.json(
    { error: 'database_not_connected', message: 'Некуда записать статус платежа.' },
    { status: 501 },
  );
}
