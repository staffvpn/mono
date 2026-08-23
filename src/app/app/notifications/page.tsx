'use client';

import Link from 'next/link';
import { authService } from '@/services/auth';
import { notificationService } from '@/services/comms';
import { useDB, useMounted } from '@/hooks/useStore';
import { Badge, Button, Card, EmptyState, Skeleton } from '@/components/ui';
import { ArtBell } from '@/components/ui/art';
import { timeAgo } from '@/components/app/cards';

const KIND: Record<string, string> = {
  application: 'Отклик', message: 'Сообщение', order: 'Заказ', reminder: 'Напоминание',
  relevance: 'Актуальность', payment: 'Оплата', completed: 'Завершение', review: 'Отзыв',
  dispute: 'Спор', match: 'Подбор', system: 'Система',
};

export default function NotificationsPage() {
  const mounted = useMounted();
  useDB();
  if (!mounted) return <Skeleton className="h-64" />;

  const me = authService.getCurrentUser();
  if (!me) return null;
  const list = notificationService.list(me.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Уведомления</h1>
        {list.some((n) => !n.read) && (
          <Button variant="outline" size="sm" onClick={() => notificationService.readAll(me.id)}>
            Отметить прочитанными
          </Button>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState art={<ArtBell />} title="Пока тихо"
          text="Мы не спамим: пишем только когда есть что сказать по делу." />
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((n) => {
            const body = (
              <Card className={`p-5 ${n.read ? 'opacity-70' : ''}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={n.read ? 'neutral' : 'brand'}>{KIND[n.kind] ?? 'Событие'}</Badge>
                  <span className="ml-auto text-xs text-faint">{timeAgo(n.createdAt)}</span>
                </div>
                <h3 className="mt-2 text-lg font-extrabold">{n.title}</h3>
                <p className="mt-1 text-[15px] text-muted">{n.body}</p>
              </Card>
            );
            return n.href ? <Link key={n.id} href={n.href}>{body}</Link> : <div key={n.id}>{body}</div>;
          })}
        </div>
      )}
    </div>
  );
}
