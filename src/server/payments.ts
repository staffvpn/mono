import crypto from 'node:crypto';

/* ============================================================
   Платёжный контур.
   Провайдер НЕ подключён: пока переменные окружения пусты,
   getPaymentGateway() возвращает null, а маршруты честно отвечают 501.
   Ни одна строка здесь не делает вид, что деньги списались.

   Требования к провайдеру, без которых схема площадки не собирается:
   • двухстадийная оплата (холдирование) — деньги замораживаются до приёмки;
   • выплаты в пользу третьих лиц — исполнитель не сотрудник площадки;
   • возвраты, в том числе частичные;
   • вебхук со своей подписью — статус меняет провайдер, а не клиент.
   ============================================================ */

export type PaymentMethod = 'card' | 'sbp' | 'telegram';

export interface PaymentIntent {
  /** Идентификатор платежа на стороне провайдера. */
  id: string;
  /** Куда отправить плательщика. Для Telegram — ссылка на счёт. */
  confirmationUrl: string;
  amount: number;
  status: 'pending';
}

export interface PaymentGateway {
  readonly name: string;
  /** Создаёт платёж с холдированием. Сумма приходит с сервера, не с клиента. */
  createIntent(input: {
    orderId: string; amount: number; method: PaymentMethod; description: string;
  }): Promise<PaymentIntent>;
  /** Списывает захолдированное и переводит исполнителю за вычетом комиссии. */
  capture(paymentId: string, amount: number): Promise<void>;
  /** Возврат плательщику. */
  refund(paymentId: string, amount: number, reason: string): Promise<void>;
  /** Выплата исполнителю на его реквизиты. */
  payout(input: { userId: string; amount: number; destination: 'card' | 'sbp'; token: string }): Promise<void>;
  /** Проверка подписи вебхука. Тело — сырой текст, не разобранный JSON. */
  verifyWebhook(rawBody: string, signature: string | null): boolean;
}

export function getPaymentGateway(): PaymentGateway | null {
  const name = (process.env.PAYMENT_PROVIDER || '').trim();
  const shop = (process.env.PAYMENT_SHOP_ID || '').trim();
  const key = (process.env.PAYMENT_SECRET_KEY || '').trim();
  if (!name || !shop || !key) return null;

  // Здесь подключается конкретный провайдер, например:
  // if (name === 'yookassa') return yooKassa(shop, key);
  // Пока ни одна интеграция не написана — считаем контур ненастроенным,
  // чтобы наружу не ушло ложное «оплачено».
  return null;
}

/** Сравнение подписей за постоянное время. */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/* ---------- Деньги ---------- */

/** Комиссия по умолчанию. В проде значение приходит из настроек площадки. */
export const DEFAULT_COMMISSION_PERCENT = 7;

/**
 * Итог по заказу считается на сервере из действующих условий.
 * Сумма, присланная клиентом, — пожелание, а не основание.
 */
export function settle(amount: number, percent = DEFAULT_COMMISSION_PERCENT) {
  const commission = Math.round((amount * percent) / 100);
  return { amount, commission, executorGets: amount - commission, percent };
}

/* ---------- Идемпотентность вебхука ---------- */

const seen = new Set<string>();

/**
 * Провайдеры повторяют вебхук, пока не получат 200. Обработать событие дважды
 * означает дважды перевести деньги, поэтому события отсеиваются по идентификатору.
 * В памяти процесса — только для разработки: в проде нужна таблица с уникальным
 * индексом по (provider, event_id).
 */
export function isDuplicateEvent(eventId: string): boolean {
  if (seen.has(eventId)) return true;
  seen.add(eventId);
  if (seen.size > 5000) seen.clear();
  return false;
}
