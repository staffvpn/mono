'use client';

import Link from 'next/link';
import { useState } from 'react';
import { adminService } from '@/services/admin';
import { useDB, useMounted } from '@/hooks/useStore';
import { Button, Card, Skeleton, Tabs } from '@/components/ui';
import { Funnel, LineChart } from '@/components/admin/charts';
import { Kpi, PageHead } from '@/components/admin/Chrome';

const METRICS = [
  { k: 'users', l: 'Пользователи', u: '' },
  { k: 'tasks', l: 'Задачи', u: '' },
  { k: 'applications', l: 'Отклики', u: '' },
  { k: 'orders', l: 'Заказы', u: '' },
  { k: 'gmv', l: 'Оборот', u: ' ₽' },
  { k: 'commission', l: 'Комиссия', u: ' ₽' },
];

export default function AdminDashboard() {
  const mounted = useMounted();
  useDB();
  const [metric, setMetric] = useState('users');
  const [days, setDays] = useState(30);
  const [funnel, setFunnel] = useState<'customer' | 'executor'>('customer');

  if (!mounted) return <Skeleton className="h-96" />;
  const s = adminService.getDashboardStats();
  const m = METRICS.find((x) => x.k === metric)!;

  const attention =
    s.moderation.reports + s.moderation.disputes + s.moderation.verifications +
    s.moderation.tasks + s.moderation.risk;

  return (
    <div className="flex flex-col gap-6">
      <PageHead title="Что происходит с платформой"
        sub="Показатели считаются из мок-данных. При подключении backend цифры придут оттуда."
        actions={
          <>
            <Link href="/admin/moderation"><Button size="sm">Требует внимания: {attention}</Button></Link>
            <Link href="/admin/notifications"><Button size="sm" variant="outline">Создать уведомление</Button></Link>
          </>
        } />

      {attention > 0 && (
        <Card className="flex flex-wrap items-center gap-3 border-warn bg-warn/10 p-4">
          <span className="text-sm font-bold">Сейчас требует вашего внимания:</span>
          {s.moderation.disputes > 0 && <Link href="/admin/disputes" className="text-sm font-bold text-brand">Споры ({s.moderation.disputes})</Link>}
          {s.moderation.reports > 0 && <Link href="/admin/reports" className="text-sm font-bold text-brand">Жалобы ({s.moderation.reports})</Link>}
          {s.moderation.verifications > 0 && <Link href="/admin/verification" className="text-sm font-bold text-brand">Проверки ({s.moderation.verifications})</Link>}
          {s.moderation.tasks > 0 && <Link href="/admin/tasks" className="text-sm font-bold text-brand">Задачи на модерации ({s.moderation.tasks})</Link>}
          {s.moderation.risk > 0 && <Link href="/admin/risk" className="text-sm font-bold text-brand">Риск-события ({s.moderation.risk})</Link>}
        </Card>
      )}

      <Group title="Пользователи" href="/admin/users">
        <Kpi label="Всего" value={s.users.total} />
        <Kpi label="Заказчики" value={s.users.customers} />
        <Kpi label="Исполнители" value={s.users.executors} />
        <Kpi label="На проверке" value={s.users.pending} tone={s.users.pending ? 'warn' : undefined} />
        <Kpi label="Заблокированы" value={s.users.blocked} tone={s.users.blocked ? 'danger' : undefined} />
      </Group>

      <Group title="Задачи и отклики" href="/admin/tasks">
        <Kpi label="Задач всего" value={s.tasks.total} />
        <Kpi label="Активных" value={s.tasks.active} />
        <Kpi label="На модерации" value={s.tasks.onReview} tone={s.tasks.onReview ? 'warn' : undefined} />
        <Kpi label="Откликов" value={s.applications.total} />
        <Kpi label="Откликов на задачу" value={s.applications.avgPerTask} hint="в среднем" />
        <Kpi label="Дошли до заказа" value={`${s.applications.toOrder}%`} />
      </Group>

      <Group title="Заказы" href="/admin/orders">
        <Kpi label="Всего" value={s.orders.total} />
        <Kpi label="Активных" value={s.orders.active} />
        <Kpi label="Завершено" value={s.orders.completed} tone="ok" />
        <Kpi label="Отменено" value={s.orders.cancelled} />
        <Kpi label="Спорных" value={s.orders.disputed} tone={s.orders.disputed ? 'danger' : undefined} />
        <Kpi label="Средний чек" value={`${s.orders.avgCheck.toLocaleString('ru-RU')} ₽`} />
      </Group>

      <Group title="Финансы" href="/admin/payments">
        <Kpi label="Оборот" value={`${s.finance.gmv.toLocaleString('ru-RU')} ₽`} />
        <Kpi label="Комиссия" value={`${s.finance.commission.toLocaleString('ru-RU')} ₽`} tone="ok" />
        <Kpi label="Зарезервировано" value={s.finance.held} />
        <Kpi label="Успешных" value={s.finance.succeeded} />
        <Kpi label="Неуспешных" value={s.finance.failed} tone={s.finance.failed ? 'danger' : undefined} />
        <Kpi label="Возвратов" value={s.finance.refunded} />
      </Group>

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">Динамика</h2>
          <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto">
            <Tabs value={metric} onChange={setMetric} tabs={METRICS.map((x) => ({ key: x.k, label: x.l }))} />
            <Tabs value={String(days)} onChange={(v) => setDays(Number(v))}
              tabs={[{ key: '7', label: '7 дней' }, { key: '30', label: '30 дней' }, { key: '90', label: '90 дней' }, { key: '365', label: '12 мес' }]} />
          </div>
        </div>
        <LineChart title={m.l} unit={m.u} data={adminService.getChart(metric, Math.min(days, 90))} />
        <p className="mt-2 text-xs text-faint">
          Одна метрика на график: две шкалы на одной оси искажают сравнение.
        </p>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">Воронка</h2>
          <Tabs value={funnel} onChange={setFunnel}
            tabs={[{ key: 'customer', label: 'Заказчик' }, { key: 'executor', label: 'Исполнитель' }]} />
        </div>
        <Funnel title={funnel === 'customer' ? 'Путь заказчика' : 'Путь исполнителя'}
          steps={adminService.getFunnel(funnel)} />
      </Card>
    </div>
  );
}

function Group({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-extrabold">{title}</h2>
        <Link href={href} className="text-sm font-bold text-brand">Открыть →</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{children}</div>
    </section>
  );
}
