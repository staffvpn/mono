'use client';

import { useState } from 'react';
import Link from 'next/link';
import { adminService } from '@/services/admin';
import { useDB, useMounted } from '@/hooks/useStore';
import { Badge, Card, Select, Skeleton } from '@/components/ui';
import { DataTable, Kpi, PageHead } from '@/components/admin/Chrome';

const TONE: Record<string, 'ok' | 'warn' | 'danger' | 'neutral'> = {
  held: 'warn', released: 'ok', pending: 'warn', failed: 'danger', refunded: 'neutral',
};

export default function AdminPayments() {
  const mounted = useMounted();
  const db = useDB();
  const [f, setF] = useState('all');
  if (!mounted) return <Skeleton className="h-96" />;

  const all = adminService.getPayments();
  const list = f === 'all' ? all : all.filter((p) => p.status === f);
  const sum = (fn: (p: (typeof all)[number]) => number) => all.reduce((s, p) => s + fn(p), 0);

  return (
    <div>
      <PageHead title="Платежи" sub="Статус платежа меняет только провайдер через backend — из интерфейса он не редактируется." />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Оборот" value={`${sum((p) => p.amount).toLocaleString('ru-RU')} ₽`} />
        <Kpi label="Комиссия" value={`${sum((p) => p.commission).toLocaleString('ru-RU')} ₽`} tone="ok" />
        <Kpi label="Зарезервировано" value={all.filter((p) => p.status === 'held').length} tone="warn" />
        <Kpi label="Возвраты" value={all.filter((p) => p.status === 'refunded').length} />
      </div>

      <Select value={f} onChange={(e) => setF(e.target.value)} className="mb-4 !min-h-[40px] !w-auto !border-2 !py-2 text-sm">
        <option value="all">Все статусы</option>
        <option value="held">Зарезервированы</option>
        <option value="released">Отправлены</option>
        <option value="pending">В обработке</option>
        <option value="failed">Неуспешные</option>
        <option value="refunded">Возвращённые</option>
      </Select>

      <DataTable head={['Transaction ID', 'Заказ', 'Плательщик', 'Получатель', 'Сумма', 'Комиссия', 'Провайдер', 'Статус', 'Дата', 'Ошибка']}
        rows={list.map((p) => {
          const payer = db.users.find((u) => u.id === p.payerId);
          const payee = db.users.find((u) => u.id === p.payeeId);
          return [
            <code key="i" className="text-xs">{p.id}</code>,
            p.orderId,
            payer ? <Link key="a" href={`/admin/users/${payer.id}`} className="text-brand">{payer.name}</Link> : p.payerId,
            payee ? <Link key="b" href={`/admin/users/${payee.id}`} className="text-brand">{payee.name}</Link> : p.payeeId,
            `${p.amount.toLocaleString('ru-RU')} ₽`,
            `${p.commission.toLocaleString('ru-RU')} ₽`,
            p.provider,
            <Badge key="s" tone={TONE[p.status]}>{p.status}</Badge>,
            new Date(p.createdAt).toLocaleString('ru-RU'),
            p.error ?? '—',
          ];
        })}
        empty="Платежей ещё не было — они появятся после первой оплаты заказа." />

      <Card className="mt-4 p-4" pop={false}>
        <h2 className="text-sm font-bold">Комиссия</h2>
        <p className="mt-1 text-sm text-muted">
          Ставка настраивается в разделе «Настройки». Изменение требует подтверждения, сохраняет предыдущее значение
          и попадает в журнал действий.
        </p>
        <Link href="/admin/settings" className="mt-2 inline-block text-sm font-bold text-brand">Открыть настройки →</Link>
      </Card>
    </div>
  );
}
