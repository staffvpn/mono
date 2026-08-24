'use client';

import { commit, getDB, nowISO, uid } from './store';
import type { ID, Payment, Payout, WalletBalance, WalletEntry } from '@/types';

/* ============================================================
   Кошелёк.
   Баланс НЕ хранится числом: он выводится из платежей и выплат.
   Хранимое число рано или поздно разъезжается с историей операций,
   а восстановить, откуда взялась разница, уже нельзя.
   В проде тот же расчёт делает сервер, клиент только показывает.
   ============================================================ */

const MIN_PAYOUT = 500;
export const PAYOUT_MIN_AMOUNT = MIN_PAYOUT;

/** Сколько получит исполнитель с этого платежа. */
export function payoutOf(p: Payment): number {
  return p.amount - p.commission;
}

export const walletService = {
  balance(userId: ID): WalletBalance {
    const db = getDB();
    const asPayee = db.payments.filter((p) => p.payeeId === userId);
    const asPayer = db.payments.filter((p) => p.payerId === userId);
    const payouts = db.payouts.filter((p) => p.userId === userId);

    const earnedTotal = asPayee
      .filter((p) => p.status === 'released')
      .reduce((s, p) => s + payoutOf(p), 0);

    const pending = asPayee
      .filter((p) => p.status === 'held')
      .reduce((s, p) => s + payoutOf(p), 0);

    // Отклонённая выплата возвращает деньги в доступные, поэтому её не вычитаем.
    const withdrawn = payouts
      .filter((p) => p.status !== 'rejected')
      .reduce((s, p) => s + p.amount, 0);

    const spentTotal = asPayer
      .filter((p) => p.status === 'released' || p.status === 'held')
      .reduce((s, p) => s + p.amount, 0);

    return { available: earnedTotal - withdrawn, pending, earnedTotal, spentTotal };
  },

  /** История операций по возрастанию давности. */
  entries(userId: ID): WalletEntry[] {
    const db = getDB();
    const out: WalletEntry[] = [];

    for (const p of db.payments) {
      if (p.payeeId === userId) {
        if (p.status === 'held') {
          out.push({ id: `${p.id}-h`, at: p.createdAt, kind: 'hold', amount: payoutOf(p),
            title: 'Оплата зарезервирована заказчиком', orderId: p.orderId });
        }
        if (p.status === 'released') {
          out.push({ id: `${p.id}-e`, at: p.releasedAt ?? p.createdAt, kind: 'earned', amount: payoutOf(p),
            title: 'Работа принята — деньги зачислены', orderId: p.orderId });
          out.push({ id: `${p.id}-c`, at: p.releasedAt ?? p.createdAt, kind: 'commission', amount: -p.commission,
            title: 'Комиссия площадки', orderId: p.orderId });
        }
      }
      if (p.payerId === userId) {
        if (p.status === 'held' || p.status === 'released') {
          out.push({ id: `${p.id}-s`, at: p.createdAt, kind: 'spent', amount: -p.amount,
            title: p.status === 'held' ? 'Оплата заказа — деньги в резерве' : 'Оплата заказа', orderId: p.orderId });
        }
        if (p.status === 'refunded') {
          out.push({ id: `${p.id}-r`, at: p.createdAt, kind: 'refund', amount: p.amount,
            title: 'Возврат по заказу', orderId: p.orderId });
        }
      }
    }

    for (const p of db.payouts.filter((x) => x.userId === userId)) {
      out.push({ id: p.id, at: p.createdAt, kind: 'payout', amount: -p.amount,
        title: p.status === 'rejected' ? 'Вывод отклонён' : 'Вывод на карту' });
    }

    return out.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  },

  payouts(userId: ID): Payout[] {
    return getDB().payouts.filter((p) => p.userId === userId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  },

  /**
   * Заявка на вывод. Сумму и доступный остаток в проде пересчитывает сервер:
   * присланное клиентом значение основанием не является.
   */
  requestPayout(userId: ID, amount: number, destination: 'card' | 'sbp', masked: string): Payout {
    const db = getDB();
    const { available } = walletService.balance(userId);
    if (amount < MIN_PAYOUT) throw new Error('min_amount');
    if (amount > available) throw new Error('not_enough');

    const payout: Payout = {
      id: uid('po'), userId, amount, destination, masked,
      status: 'requested', createdAt: nowISO(),
    };
    db.payouts.unshift(payout);
    commit();
    return payout;
  },
};
