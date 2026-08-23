'use client';

import Link from 'next/link';
import { adminService } from '@/services/admin';
import { useDB, useMounted } from '@/hooks/useStore';
import { Badge, Card, Skeleton } from '@/components/ui';
import { DataTable, PageHead } from '@/components/admin/Chrome';

export default function AdminApplications() {
  const mounted = useMounted();
  const db = useDB();
  if (!mounted) return <Skeleton className="h-96" />;
  const apps = adminService.getApplications();

  // Подозрительная активность: всплеск откликов за короткое время.
  const byUser = new Map<string, number>();
  apps.forEach((a) => {
    if (Date.now() - +new Date(a.createdAt) < 2 * 3600_000) {
      byUser.set(a.executorId, (byUser.get(a.executorId) ?? 0) + 1);
    }
  });
  const spikes = [...byUser.entries()].filter(([, n]) => n >= 20);

  return (
    <div>
      <PageHead title="Отклики" sub={`Всего: ${apps.length}`} />

      {spikes.length > 0 && (
        <Card className="mb-4 border-danger bg-danger/10 p-4" pop={false}>
          <h2 className="text-sm font-bold">Подозрительная активность</h2>
          {spikes.map(([uid, n]) => (
            <p key={uid} className="mt-1 text-sm">
              Пользователь <Link href={`/admin/users/${uid}`} className="font-bold text-brand">{uid}</Link> отправил {n} откликов за 2 часа.
              Событие уходит в очередь рисков — автоматическая блокировка по одному сигналу не применяется.
            </p>
          ))}
        </Card>
      )}

      <DataTable head={['ID', 'Задача', 'Исполнитель', 'Цена', 'Комментарий', 'Статус', 'Заказ', 'Дата']}
        rows={apps.map((a) => {
          const ex = db.users.find((u) => u.id === a.executorId);
          const task = db.tasks.find((t) => t.id === a.taskId);
          return [
            <code key="i" className="text-xs">{a.id}</code>,
            task ? <Link key="t" href={`/app/tasks/${task.id}`} className="text-brand">{task.title}</Link> : a.taskId,
            ex ? <Link key="u" href={`/admin/users/${ex.id}`} className="text-brand">{ex.name}</Link> : a.executorId,
            `${a.price.toLocaleString('ru-RU')} ₽`,
            <span key="c" className="block max-w-[280px] truncate">{a.comment}</span>,
            <Badge key="s" tone={a.status === 'accepted' ? 'ok' : 'neutral'}>{a.status}</Badge>,
            a.orderId ?? '—',
            new Date(a.createdAt).toLocaleString('ru-RU'),
          ];
        })} />
    </div>
  );
}
