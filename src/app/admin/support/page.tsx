'use client';

import Link from 'next/link';
import { adminService } from '@/services/admin';
import { useDB, useMounted } from '@/hooks/useStore';
import { Badge, Skeleton } from '@/components/ui';
import { DataTable, PageHead } from '@/components/admin/Chrome';

export default function AdminSupport() {
  const mounted = useMounted();
  const db = useDB();
  if (!mounted) return <Skeleton className="h-96" />;
  const tickets = adminService.getSupportTickets();

  return (
    <div>
      <PageHead title="Поддержка" sub={`Обращений: ${tickets.length}`} />
      <DataTable head={['ID', 'Пользователь', 'Тема', 'Сообщение', 'Приоритет', 'Статус', 'Заказ', 'Дата']}
        rows={tickets.map((t) => {
          const u = db.users.find((x) => x.id === t.userId);
          return [
            <code key="i" className="text-xs">{t.id}</code>,
            u ? <Link key="u" href={`/admin/users/${u.id}`} className="text-brand">{u.name}</Link> : t.userId,
            t.topic,
            <span key="m" className="block max-w-[340px]">{t.message}</span>,
            <Badge key="p" tone={t.priority === 'high' ? 'danger' : 'neutral'}>{t.priority}</Badge>,
            <Badge key="s" tone={t.status === 'resolved' ? 'ok' : 'warn'}>{t.status}</Badge>,
            t.orderId ?? '—',
            new Date(t.createdAt).toLocaleString('ru-RU'),
          ];
        })} />
      <p className="mt-3 text-xs text-faint">Внутренние заметки администраторов пользователю не показываются.</p>
    </div>
  );
}
