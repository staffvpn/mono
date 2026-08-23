'use client';

import Link from 'next/link';
import { adminService } from '@/services/admin';
import { useDB, useMounted } from '@/hooks/useStore';
import { Badge, Card, Skeleton } from '@/components/ui';
import { DataTable, PageHead } from '@/components/admin/Chrome';

export default function AdminRisk() {
  const mounted = useMounted();
  const db = useDB();
  if (!mounted) return <Skeleton className="h-96" />;
  const events = adminService.getRiskEvents();

  return (
    <div>
      <PageHead title="Риски" sub={`Событий: ${events.length}`} />
      <Card className="mb-4 p-4" pop={false}>
        <p className="text-sm text-muted">
          Risk score — внутренний сигнал, а не доказательство нарушения. Один слабый сигнал не приводит
          к автоматической блокировке: решение принимает человек, и оно попадает в журнал.
        </p>
      </Card>
      <DataTable head={['Пользователь', 'Сигнал', 'Детали', 'Score', 'Статус', 'Дата']}
        rows={events.map((e) => {
          const u = db.users.find((x) => x.id === e.userId);
          return [
            u ? <Link key="u" href={`/admin/users/${u.id}`} className="font-bold text-brand">{u.name}</Link> : e.userId,
            e.signal,
            e.detail,
            <Badge key="s" tone={e.score > 60 ? 'danger' : e.score > 35 ? 'warn' : 'neutral'}>{e.score}</Badge>,
            e.status,
            new Date(e.at).toLocaleString('ru-RU'),
          ];
        })} />
    </div>
  );
}
