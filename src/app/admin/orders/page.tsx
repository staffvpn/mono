'use client';

import Link from 'next/link';
import { adminService } from '@/services/admin';
import { useDB, useMounted } from '@/hooks/useStore';
import { Badge, Skeleton } from '@/components/ui';
import { DataTable, PageHead } from '@/components/admin/Chrome';
import { ORDER_LABEL } from '@/lib/orderStatus';

export default function AdminOrders() {
  const mounted = useMounted();
  const db = useDB();
  if (!mounted) return <Skeleton className="h-96" />;
  const orders = adminService.getOrders();

  return (
    <div>
      <PageHead title="Заказы" sub={`Всего: ${orders.length}`} />
      <DataTable head={['ID', 'Заказчик', 'Исполнитель', 'Задача', 'Сумма', 'Комиссия', 'Статус', 'Платёж', 'Создан', 'Спор']}
        rows={orders.map((o) => {
          const c = db.users.find((u) => u.id === o.customerId);
          const e = db.users.find((u) => u.id === o.executorId);
          const p = db.payments.find((x) => x.id === o.paymentId);
          const s = ORDER_LABEL[o.status];
          return [
            <code key="i" className="text-xs">{o.id}</code>,
            c ? <Link key="c" href={`/admin/users/${c.id}`} className="text-brand">{c.name}</Link> : o.customerId,
            e ? <Link key="e" href={`/admin/users/${e.id}`} className="text-brand">{e.name}</Link> : o.executorId,
            <Link key="t" href={`/app/tasks/${o.taskId}`} className="text-brand">{o.terms.what}</Link>,
            `${o.terms.price.toLocaleString('ru-RU')} ₽`,
            `${Math.round((o.terms.price * o.commissionPercent) / 100).toLocaleString('ru-RU')} ₽`,
            <Badge key="s" tone={s.tone}>{s.l}</Badge>,
            p?.status ?? '—',
            new Date(o.createdAt).toLocaleDateString('ru-RU'),
            o.disputeId ? <Badge key="d" tone="danger">есть</Badge> : '—',
          ];
        })} />
    </div>
  );
}
