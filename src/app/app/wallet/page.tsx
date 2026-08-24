'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/auth';
import { walletService, PAYOUT_MIN_AMOUNT } from '@/services/wallet';
import { useDB, useMounted } from '@/hooks/useStore';
import {
  Badge, Button, Card, EmptyState, Field, Input, Modal, Select, Skeleton, Stat, cx,
} from '@/components/ui';
import { ArtMoney } from '@/components/ui/art';
import { money } from '@/components/app/cards';
import { CONFIG } from '@/lib/config';
import { haptic } from '@/lib/telegram';
import type { WalletEntry } from '@/types';

const KIND: Record<WalletEntry['kind'], { label: string; tone: 'ok' | 'warn' | 'neutral' | 'danger' }> = {
  hold: { label: 'В резерве', tone: 'warn' },
  earned: { label: 'Зачислено', tone: 'ok' },
  commission: { label: 'Комиссия', tone: 'neutral' },
  spent: { label: 'Оплата', tone: 'neutral' },
  refund: { label: 'Возврат', tone: 'ok' },
  payout: { label: 'Вывод', tone: 'neutral' },
};

const STATUS: Record<string, { label: string; tone: 'ok' | 'warn' | 'danger' | 'neutral' }> = {
  requested: { label: 'Заявка принята', tone: 'warn' },
  processing: { label: 'В обработке', tone: 'warn' },
  paid: { label: 'Выплачено', tone: 'ok' },
  rejected: { label: 'Отклонено', tone: 'danger' },
};

export default function WalletPage() {
  const mounted = useMounted();
  useDB();
  const [open, setOpen] = useState(false);
  const [sum, setSum] = useState('');
  const [dest, setDest] = useState<'card' | 'sbp'>('card');
  const [acct, setAcct] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  if (!mounted) return <Skeleton className="h-96" />;
  const me = authService.getCurrentUser();
  if (!me) return null;

  const balance = walletService.balance(me.id);
  const entries = walletService.entries(me.id);
  const payouts = walletService.payouts(me.id);
  const amount = Number(sum.replace(/\s/g, '')) || 0;

  function submit() {
    setErr('');
    const digits = acct.replace(/\D/g, '');
    if (digits.length < 4) { setErr('Укажите номер карты или телефон для перевода'); return; }
    try {
      walletService.requestPayout(me!.id, amount, dest, `•••• ${digits.slice(-4)}`);
      haptic('success');
      setDone(true);
      setSum(''); setAcct('');
    } catch (e) {
      setErr((e as Error).message === 'min_amount'
        ? `Минимальная сумма вывода — ${money(PAYOUT_MIN_AMOUNT)}`
        : 'На балансе недостаточно средств');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Кошелёк</h1>
        <Button onClick={() => { setOpen(true); setDone(false); setErr(''); }} disabled={balance.available <= 0}>
          Вывести деньги
        </Button>
      </div>

      <Card className="flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-center">
        <ArtMoney className="h-24 w-auto shrink-0" />
        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="text-sm font-bold text-muted">Доступно к выводу</div>
            <div className="text-4xl font-extrabold tracking-tight tabular-nums">{money(balance.available)}</div>
          </div>
          <div>
            <div className="text-sm font-bold text-muted">В резерве по заказам</div>
            <div className="text-4xl font-extrabold tracking-tight tabular-nums text-warn">{money(balance.pending)}</div>
            <p className="mt-1 text-[13px] leading-relaxed text-faint">
              Придёт на баланс, как только заказчик примет работу.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Заработано за всё время" value={money(balance.earnedTotal)} />
        <Stat label="Потрачено на заказы" value={money(balance.spentTotal)} />
      </div>

      {CONFIG.useMock && (
        <p className="rounded-lg border-3 border-warn bg-warn/10 px-4 py-3 text-sm font-bold text-warn">
          Демо-режим: платёжный провайдер не подключён. Баланс считается по демонстрационным
          заказам, вывод создаёт только заявку — реального перевода не происходит.
        </p>
      )}

      {payouts.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-extrabold tracking-tight">Заявки на вывод</h2>
          <div className="flex flex-col gap-3">
            {payouts.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink/10 pb-3 last:border-0 last:pb-0">
                <div>
                  <div className="font-extrabold tabular-nums">{money(p.amount)}</div>
                  <div className="text-[13px] text-muted">
                    {p.destination === 'card' ? 'На карту' : 'По СБП'} {p.masked} ·{' '}
                    {new Date(p.createdAt).toLocaleString('ru-RU')}
                  </div>
                </div>
                <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-extrabold tracking-tight">История операций</h2>
        {entries.length === 0 ? (
          <EmptyState
            title="Операций пока нет"
            text="Здесь появятся оплаты, зачисления и выводы. Возьмите первый заказ — и счётчик оживёт."
            action={<Link href="/app/tasks"><Button>Найти задачу</Button></Link>}
          />
        ) : (
          <div className="flex flex-col">
            {entries.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink/10 py-3 first:pt-0 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={KIND[e.kind].tone}>{KIND[e.kind].label}</Badge>
                    <span className="text-[15px] font-bold">{e.title}</span>
                  </div>
                  <div className="mt-1 text-[13px] text-faint">
                    {new Date(e.at).toLocaleString('ru-RU')}
                    {e.orderId && <> · <Link href={`/app/orders/${e.orderId}`} className="text-brand">заказ</Link></>}
                  </div>
                </div>
                <span className={cx('shrink-0 text-lg font-extrabold tabular-nums',
                  e.amount >= 0 ? 'text-ok' : 'text-ink')}>
                  {e.amount >= 0 ? '+' : '−'}{money(Math.abs(e.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Вывод денег">
        {done ? (
          <div className="flex flex-col gap-4">
            <p className="text-[15px] leading-relaxed">
              Заявка создана. Деньги придут на указанные реквизиты — обычно в течение рабочего дня.
            </p>
            <Button onClick={() => setOpen(false)}>Понятно</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-[15px] text-muted">
              Доступно {money(balance.available)}. Минимальная сумма — {money(PAYOUT_MIN_AMOUNT)}.
            </p>
            <Field label="Сумма" required>
              <Input inputMode="numeric" placeholder={String(balance.available)} value={sum}
                onChange={(e) => { setSum(e.target.value.replace(/[^\d ]/g, '')); setErr(''); }} />
            </Field>
            <Field label="Куда вывести">
              <Select value={dest} onChange={(e) => setDest(e.target.value as 'card' | 'sbp')}>
                <option value="card">На банковскую карту</option>
                <option value="sbp">По СБП, на номер телефона</option>
              </Select>
            </Field>
            <Field label={dest === 'card' ? 'Номер карты' : 'Номер телефона'} required
              hint="Реквизиты уходят платёжному провайдеру. Площадка их не хранит.">
              <Input inputMode="numeric" value={acct}
                onChange={(e) => { setAcct(e.target.value); setErr(''); }}
                placeholder={dest === 'card' ? '2202 •••• •••• 1234' : '+7 900 000-00-00'} />
            </Field>
            {err && <p role="alert" className="rounded-md border-2 border-danger bg-danger/10 px-3 py-2 text-sm font-bold text-danger">{err}</p>}
            <Button size="lg" onClick={submit} disabled={amount <= 0}>Вывести {amount > 0 ? money(amount) : ''}</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
