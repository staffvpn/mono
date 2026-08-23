'use client';

import { adminService } from '@/services/admin';
import { useMounted } from '@/hooks/useStore';
import { Skeleton } from '@/components/ui';
import { DataTable, PageHead } from '@/components/admin/Chrome';

export default function AdminAudit() {
  const mounted = useMounted();
  if (!mounted) return <Skeleton className="h-96" />;
  const logs = adminService.getAuditLogs();

  return (
    <div>
      <PageHead title="Журнал действий" sub="Записи создаются автоматически и не редактируются из интерфейса." />
      <DataTable head={['Когда', 'Кто', 'Роль', 'Действие', 'Объект', 'Было', 'Стало', 'Причина']}
        rows={logs.map((l) => [
          new Date(l.at).toLocaleString('ru-RU'),
          l.adminName,
          l.adminRole,
          l.action,
          <code key="e" className="text-xs">{l.entityType}/{l.entityId}</code>,
          <span key="b" className="block max-w-[180px] truncate text-xs">{l.before ?? '—'}</span>,
          <span key="a" className="block max-w-[180px] truncate text-xs">{l.after ?? '—'}</span>,
          l.reason ?? '—',
        ])} />
    </div>
  );
}
