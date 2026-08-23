'use client';

import Link from 'next/link';
import { authService } from '@/services/auth';
import { orderService, applicationService } from '@/services/catalog';
import { useDB, useMounted } from '@/hooks/useStore';
import { Badge, Button, Card, EmptyState, Skeleton, Tabs } from '@/components/ui';
import { ArtEmpty } from '@/components/ui/art';
import { money, timeAgo } from '@/components/app/cards';
import { useState } from 'react';
import { ORDER_LABEL } from '@/lib/orderStatus';


export default function OrdersPage() {
  const mounted = useMounted();
  const db = useDB();
  const [tab, setTab] = useState<'orders' | 'apps'>('orders');
  if (!mounted) return <Skeleton className="h-64" />;

  const me = authService.getCurrentUser();
  if (!me) return null;

  const orders = orderService.list(me.id);
  const apps = applicationService.byExecutor(me.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Мои заказы</h1>
      <Tabs value={tab} onChange={setTab}
        tabs={[{ key: 'orders', label: 'Заказы', count: orders.length }, { key: 'apps', label: 'Мои отклики', count: apps.length }]} />

      {tab === 'orders' && (
        orders.length === 0 ? (
          <EmptyState art={<ArtEmpty />} title="Заказов пока нет"
            text="Заказ появляется, когда заказчик выбрал исполнителя."
            action={<Link href="/app/tasks"><Button>К задачам</Button></Link>} />
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((o) => {
              const task = db.tasks.find((t) => t.id === o.taskId);
              const other = db.users.find((u) => u.id === (o.customerId === me.id ? o.executorId : o.customerId));
              const s = ORDER_LABEL[o.status];
              return (
                <Card key={o.id} as={Link} {...{ href: `/app/orders/${o.id}` }}
                  className="flex flex-wrap items-center gap-4 p-5 transition-transform hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-pop-sm">
                  <div className="min-w-0 flex-1">
                    <Badge tone={s.tone}>{s.l}</Badge>
                    <h3 className="mt-2 truncate text-lg font-extrabold">{task?.title ?? o.terms.what}</h3>
                    <p className="text-sm text-muted">
                      {o.customerId === me.id ? 'Исполнитель' : 'Заказчик'}: {other?.name ?? '—'} · {timeAgo(o.createdAt)}
                    </p>
                  </div>
                  <div className="text-xl font-extrabold">{money(o.terms.price)}</div>
                </Card>
              );
            })}
          </div>
        )
      )}

      {tab === 'apps' && (
        apps.length === 0 ? (
          <EmptyState art={<ArtEmpty />} title="Откликов пока нет"
            text="Найдите задачу рядом — отклик бесплатный."
            action={<Link href="/app/tasks"><Button>Найти задачи</Button></Link>} />
        ) : (
          <div className="flex flex-col gap-3">
            {apps.map((a) => {
              const task = db.tasks.find((t) => t.id === a.taskId);
              return (
                <Card key={a.id} as={Link} {...{ href: `/app/tasks/${a.taskId}` }} className="flex items-center gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <Badge tone={a.status === 'accepted' ? 'ok' : 'neutral'}>
                      {a.status === 'accepted' ? 'Вас выбрали' : 'Отклик отправлен'}
                    </Badge>
                    <h3 className="mt-2 truncate text-lg font-extrabold">{task?.title ?? 'Задача'}</h3>
                    <p className="text-sm text-muted">{timeAgo(a.createdAt)}</p>
                  </div>
                  <div className="text-lg font-extrabold">{money(a.price)}</div>
                </Card>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
