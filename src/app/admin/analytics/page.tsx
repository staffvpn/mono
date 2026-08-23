'use client';

import { useState } from 'react';
import { adminService } from '@/services/admin';
import { useDB, useMounted } from '@/hooks/useStore';
import { Card, Skeleton, Tabs } from '@/components/ui';
import { Funnel, LineChart } from '@/components/admin/charts';
import { Kpi, PageHead } from '@/components/admin/Chrome';

export default function AdminAnalytics() {
  const mounted = useMounted();
  useDB();
  const [days, setDays] = useState(30);
  if (!mounted) return <Skeleton className="h-96" />;
  const s = adminService.getDashboardStats();

  return (
    <div className="flex flex-col gap-5">
      <PageHead title="Аналитика"
        sub="Метрики, которых backend пока не отдаёт (DAU, retention, время до первого отклика), не выводим — вместо них честный прочерк."
        actions={<Tabs value={String(days)} onChange={(v) => setDays(Number(v))}
          tabs={[{ key: '7', label: '7 дней' }, { key: '30', label: '30 дней' }, { key: '90', label: '90 дней' }]} />} />

      <section>
        <h2 className="mb-2 text-lg font-extrabold">Пользователи</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Всего" value={s.users.total} />
          <Kpi label="DAU" value="—" hint="нужен backend" />
          <Kpi label="WAU" value="—" hint="нужен backend" />
          <Kpi label="Retention" value="—" hint="нужен backend" />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <LineChart title="Регистрации" data={adminService.getChart('users', days)} />
        <LineChart title="Созданные задачи" data={adminService.getChart('tasks', days)} />
        <LineChart title="Отклики" data={adminService.getChart('applications', days)} />
        <LineChart title="Заказы" data={adminService.getChart('orders', days)} />
        <LineChart title="Оборот" unit=" ₽" data={adminService.getChart('gmv', days)} />
        <LineChart title="Комиссия" unit=" ₽" data={adminService.getChart('commission', days)} />
      </div>

      <section>
        <h2 className="mb-2 text-lg font-extrabold">Маркетплейс</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Completion rate" value={s.orders.total ? `${Math.round((s.orders.completed / s.orders.total) * 100)}%` : '—'} />
          <Kpi label="Cancellation rate" value={s.orders.total ? `${Math.round((s.orders.cancelled / s.orders.total) * 100)}%` : '—'} />
          <Kpi label="Средний чек" value={`${s.orders.avgCheck.toLocaleString('ru-RU')} ₽`} />
          <Kpi label="Откликов на задачу" value={s.applications.avgPerTask} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4" pop={false}><Funnel title="Воронка заказчика" steps={adminService.getFunnel('customer')} /></Card>
        <Card className="p-4" pop={false}><Funnel title="Воронка исполнителя" steps={adminService.getFunnel('executor')} /></Card>
      </div>
    </div>
  );
}
