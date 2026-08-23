'use client';

import Link from 'next/link';
import { adminService } from '@/services/admin';
import { useDB, useMounted } from '@/hooks/useStore';
import { Badge, Skeleton } from '@/components/ui';
import { DangerAction, DataTable, PageHead } from '@/components/admin/Chrome';

export default function AdminReports() {
  const mounted = useMounted();
  const db = useDB();
  if (!mounted) return <Skeleton className="h-96" />;
  const reports = adminService.getReports();

  return (
    <div>
      <PageHead title="Жалобы" sub={`Всего: ${reports.length}`} />
      <DataTable head={['ID', 'Кто пожаловался', 'На что', 'Объект', 'Причина', 'Комментарий', 'Статус', 'Дата', 'Действия']}
        rows={reports.map((r) => {
          const who = db.users.find((u) => u.id === r.reporterId);
          return [
            <code key="i" className="text-xs">{r.id}</code>,
            who ? <Link key="w" href={`/admin/users/${who.id}`} className="text-brand">{who.name}</Link> : r.reporterId,
            { user: 'Пользователь', task: 'Задача', message: 'Сообщение' }[r.targetKind],
            <code key="t" className="text-xs">{r.targetId}</code>,
            r.reason,
            <span key="c" className="block max-w-[300px]">{r.comment}</span>,
            <Badge key="s" tone={r.status === 'new' ? 'warn' : 'neutral'}>{r.status}</Badge>,
            new Date(r.createdAt).toLocaleString('ru-RU'),
            <span key="a" className="flex gap-1">
              <DangerAction section="reports" label="Принять" question="Принять жалобу и скрыть объект?"
                reasons={['Подтверждено', 'Нарушение правил', 'Мошенничество', 'Другое']}
                onConfirm={() => { if (r.targetKind === 'task') adminService.moderateTask(r.targetId, 'hidden', 'Жалоба ' + r.id); }} />
              <DangerAction section="reports" label="Отклонить" question="Отклонить жалобу?"
                reasons={['Не подтвердилось', 'Недостаточно данных', 'Другое']}
                onConfirm={() => {}} />
            </span>,
          ];
        })} />
    </div>
  );
}
