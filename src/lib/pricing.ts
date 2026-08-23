/**
 * Комиссия платформы. Значение по умолчанию: в проде приходит из настроек
 * платформы (админка → «Настройки»), считается на сервере и не редактируется клиентом.
 */
export const COMMISSION_PERCENT = 7;

/** Комиссия с суммы заказа, в рублях. Округление — в пользу читаемости чека. */
export function commissionOf(amount: number, percent: number = COMMISSION_PERCENT): number {
  return Math.round((amount * percent) / 100);
}
