'use client';

import { use } from 'react';
import Link from 'next/link';
import { adminService } from '@/services/admin';
import { useDB, useMounted } from '@/hooks/useStore';
import { Avatar, Badge, Card, Skeleton } from '@/components/ui';
import { DangerAction, Kpi, PageHead, DataTable } from '@/components/admin/Chrome';

export default function AdminUser({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const mounted = useMounted();
  const db = useDB();
  if (!mounted) return <Skeleton className="h-96" />;

  const u = adminService.getUser(id);
  if (!u) return <p className="text-sm text-faint">Пользователь не найден.</p>;

  const tasks = db.tasks.filter((t) => t.authorId === u.id);
  const apps = db.applications.filter((a) => a.executorId === u.id);
  const orders = db.orders.filter((o) => o.customerId === u.id || o.executorId === u.id);
  const reports = db.reports.filter((r) => r.targetId === u.id || r.reporterId === u.id);
  const payments = db.payments.filter((p) => p.payerId === u.id || p.payeeId === u.id);

  return (
    <div className="flex flex-col gap-5">
      <PageHead title={u.name} sub={`ID ${u.id} · ${u.city}`}
        actions={
          <>
            <DangerAction section="users" label={u.status === 'blocked' ? 'Разблокировать' : 'Заблокировать'}
              question={u.status === 'blocked' ? 'Снять блокировку?' : 'Заблокировать пользователя?'}
              reasons={u.status === 'blocked' ? ['Ошибочная блокировка', 'Проблема решена', 'Другое'] : ['Спам', 'Мошенничество', 'Нарушение правил', 'Жалобы', 'Другое']}
              onConfirm={(reason) => adminService.updateUserStatus(u.id, u.status === 'blocked' ? 'active' : 'blocked', reason)} />
            <DangerAction section="users" label="Ограничить отклики" question="Ограничить отправку откликов?"
              reasons={['Массовые отклики', 'Низкое качество откликов', 'Жалобы', 'Другое']}
              onConfirm={(reason) => adminService.restrictUser(u.id, 'applications', reason)} />
            <DangerAction section="users" label="Запросить проверку" question="Запросить дополнительную верификацию?"
              reasons={['Подозрительная активность', 'Категория повышенного риска', 'Жалобы', 'Другое']}
              onConfirm={(reason) => adminService.updateUserStatus(u.id, 'pending_review', reason)} />
          </>
        } />

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card className="p-5" pop={false}>
          <div className="flex items-center gap-3">
            <Avatar src={u.avatar} name={u.name} size={64} />
            <div>
              <div className="text-lg font-extrabold">{u.name}</div>
              <div className="text-sm text-muted">{u.username ? `@${u.username}` : 'без username'}</div>
            </div>
          </div>
          <dl className="mt-4 flex flex-col gap-2 text-sm">
            <Row k="Телефон" v={u.phone ?? '—'} />
            <Row k="Telegram ID" v={u.telegramId ? String(u.telegramId) : '—'} />
            <Row k="Регистрация" v={new Date(u.createdAt).toLocaleString('ru-RU')} />
            <Row k="Активность" v={new Date(u.lastSeenAt).toLocaleString('ru-RU')} />
            <Row k="Статус" v={u.status} />
            <Row k="Роль" v={u.executor ? 'заказчик + исполнитель' : 'заказчик'} />
          </dl>
          <p className="mt-4 text-[11px] leading-relaxed text-faint">
            Персональные данные показываются в объёме, нужном для роли администратора.
          </p>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Kpi label="Рейтинг" value={u.reputation.rating?.toFixed(1) ?? '—'} />
            <Kpi label="Отзывов" value={u.reputation.reviewsCount} />
            <Kpi label="Выполнено" value={u.reputation.ordersCompleted} />
            <Kpi label="Отмен" value={u.reputation.ordersCancelled} tone={u.reputation.ordersCancelled > 3 ? 'warn' : undefined} />
            <Kpi label="Успешных" value={u.reputation.successRate === null ? '—' : `${Math.round(u.reputation.successRate * 100)}%`} />
            <Kpi label="Индекс доверия" value={u.reputation.trustIndex ?? '—'} hint="внутренний сигнал" />
          </div>

          <Card className="p-4" pop={false}>
            <h3 className="mb-2 text-sm font-bold">Верификация</h3>
            <div className="flex flex-wrap gap-2">
              {u.verifications.map((v) => (
                <Badge key={v.kind} tone={v.status === 'approved' ? 'ok' : v.status === 'pending' ? 'warn' : 'neutral'}>
                  {{ phone: 'Телефон', telegram: 'Telegram', identity: 'Личность', documents: 'Документы' }[v.kind]}: {v.status}
                </Badge>
              ))}
            </div>
          </Card>

          {u.restrictions && u.restrictions.length > 0 && (
            <Card className="border-warn p-4" pop={false}>
              <h3 className="mb-2 text-sm font-bold">Ограничения</h3>
              {u.restrictions.map((r, i) => (
                <div key={i} className="text-sm">{r.kind} — {r.reason} ({new Date(r.createdAt).toLocaleDateString('ru-RU')})</div>
              ))}
            </Card>
          )}
        </div>
      </div>

      <Section title={`Задачи (${tasks.length})`}>
        <DataTable head={['ID', 'Название', 'Статус', 'Откликов', 'Создана']}
          rows={tasks.map((t) => [t.id, t.title, t.moderation, t.applicationsCount, new Date(t.createdAt).toLocaleDateString('ru-RU')])} />
      </Section>

      <Section title={`Отклики (${apps.length})`}>
        <DataTable head={['ID', 'Задача', 'Цена', 'Статус', 'Дата']}
          rows={apps.map((a) => [a.id, a.taskId, `${a.price} ₽`, a.status, new Date(a.createdAt).toLocaleDateString('ru-RU')])} />
      </Section>

      <Section title={`Заказы (${orders.length})`}>
        <DataTable head={['ID', 'Статус', 'Сумма', 'Создан']}
          rows={orders.map((o) => [o.id, o.status, `${o.terms.price} ₽`, new Date(o.createdAt).toLocaleDateString('ru-RU')])} />
      </Section>

      <Section title={`Платежи (${payments.length})`}>
        <DataTable head={['ID', 'Заказ', 'Сумма', 'Комиссия', 'Статус']}
          rows={payments.map((p) => [p.id, p.orderId, `${p.amount} ₽`, `${p.commission} ₽`, p.status])} />
      </Section>

      <Section title={`Жалобы (${reports.length})`}>
        <DataTable head={['ID', 'Причина', 'Статус', 'Дата']}
          rows={reports.map((r) => [r.id, r.reason, r.status, new Date(r.createdAt).toLocaleDateString('ru-RU')])} />
      </Section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3 border-b border-ink/10 pb-1.5"><dt className="text-faint">{k}</dt><dd className="text-right font-bold">{v}</dd></div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-2 text-lg font-extrabold">{title}</h2>{children}</section>;
}
