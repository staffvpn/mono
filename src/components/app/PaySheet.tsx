'use client';

import { useState } from 'react';
import { Button, Modal, cx } from '@/components/ui';
import { money } from '@/components/app/cards';
import { CONFIG } from '@/lib/config';
import { inTelegram } from '@/lib/telegram';
import type { PaymentMethod } from '@/types';

/* ============================================================
   Экран оплаты заказа.
   Все способы ведут через платёжный контур площадки: перевод «на карту
   напрямую» здесь отсутствует не по недосмотру. Вне платформы не работают
   ни резерв средств, ни возврат, ни разбор спора.
   ============================================================ */

const METHODS: { v: PaymentMethod; title: string; note: string; icon: string }[] = [
  { v: 'card', title: 'Банковская карта', note: 'Visa, Mastercard, МИР', icon: '💳' },
  { v: 'sbp', title: 'СБП', note: 'Оплата по QR или из приложения банка', icon: '⚡' },
  { v: 'telegram', title: 'Telegram', note: 'Оплата прямо в мессенджере', icon: '✈️' },
];

export function PaySheet({ open, onClose, amount, commissionPercent, busy, onPay }: {
  open: boolean;
  onClose: () => void;
  amount: number;
  commissionPercent: number;
  busy?: boolean;
  onPay: (method: PaymentMethod) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>(inTelegram() ? 'telegram' : 'card');
  const commission = Math.round((amount * commissionPercent) / 100);

  return (
    <Modal open={open} onClose={onClose} title="Оплата заказа">
      <div className="flex flex-col gap-5">
        <div className="rounded-lg border-3 border-ink bg-surface p-4">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[15px] text-muted">К оплате</span>
            <span className="text-3xl font-extrabold tracking-tight">{money(amount)}</span>
          </div>
          <div className="mt-3 space-y-1.5 border-t-2 border-ink/10 pt-3 text-[14px]">
            <div className="flex justify-between gap-4">
              <span className="text-muted">Комиссия площадки {commissionPercent}%</span>
              <span className="font-bold tabular-nums">{money(commission)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">Получит исполнитель</span>
              <span className="font-bold tabular-nums">{money(amount - commission)}</span>
            </div>
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-extrabold">Чем платите</legend>
          {METHODS.map((m) => (
            <label
              key={m.v}
              className={cx(
                'flex cursor-pointer items-center gap-3 rounded-lg border-3 px-4 py-3 transition-colors',
                method === m.v ? 'border-ink bg-brand/10' : 'border-ink/25 hover:border-ink',
              )}
            >
              <input
                type="radio" name="pay-method" value={m.v} checked={method === m.v}
                onChange={() => setMethod(m.v)} className="sr-only"
              />
              <span aria-hidden className="text-xl leading-none">{m.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-extrabold">{m.title}</span>
                <span className="block text-[13px] text-muted">{m.note}</span>
              </span>
              <span
                aria-hidden
                className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full border-3 border-ink',
                  method === m.v ? 'bg-brand text-white' : 'bg-card')}
              >
                {method === m.v ? '✓' : ''}
              </span>
            </label>
          ))}
        </fieldset>

        <p className="rounded-md border-2 border-ink/15 bg-surface px-3 py-2.5 text-[13px] leading-relaxed text-muted">
          Деньги резервируются на счёте площадки и уйдут исполнителю только после того, как вы
          примете работу. Платить напрямую на карту исполнителю нельзя: вне TEYDO не действуют
          ни резерв, ни возврат, ни разбор спора.
        </p>

        {CONFIG.useMock && (
          <p className="rounded-md border-2 border-warn bg-warn/10 px-3 py-2.5 text-[13px] font-bold text-warn">
            Демо-режим: платёжный провайдер не подключён. Кнопка изменит статус заказа,
            настоящего списания не произойдёт.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button size="lg" loading={busy} onClick={() => onPay(method)}>
            Оплатить {money(amount)}
          </Button>
          <Button size="lg" variant="ghost" onClick={onClose} disabled={busy}>Отмена</Button>
        </div>
      </div>
    </Modal>
  );
}
