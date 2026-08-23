'use client';

import Link from 'next/link';
import { adminService } from '@/services/admin';
import { useMounted } from '@/hooks/useStore';
import { Badge, Skeleton } from '@/components/ui';
import { DataTable, PageHead } from '@/components/admin/Chrome';

const KIND: Record<string, { l: string; href: (id: string) => string }> = {
  report: { l: 'Жалоба', href: () => '/admin/reports' },
  task: { l: 'Задача', href: (id) => `/app/tasks/${id}` },
  verification: { l: 'Проверка', href: (id) => `/admin/users/${id}` },
  risk: { l: 'Риск', href: () => '/admin/risk' },
  dispute: { l: 'Спор', href: () => '/admin/disputes' },
  payment: { l: 'Платёж', href: () => '/admin/payments' },
};

export default function AdminModeration() {
  const mounted = useMounted();
  if (!mounted) return <Skeleton className="h-96" />;
  const items = adminService.getModerationQueue();

  return (
    <div>
      <PageHead title="Требует внимания" sub={`В очереди: ${items.length}`} />
      <DataTable head={['Приоритет', 'Тип', 'Что', 'Объект', 'Статус', 'Дата', 'Ответственный']}
        rows={items.map((i) => [
          <Badge key="p" tone={i.priority === 'high' ? 'danger' : i.priority === 'normal' ? 'warn' : 'neutral'}>
            {{ high: 'высокий', normal: 'обычный', low: 'низкий' }[i.priority]}
          </Badge>,
          KIND[i.kind]?.l ?? i.kind,
          <Link key="t" href={KIND[i.kind]?.href(i.entityId) ?? '#'} className="font-bold text-brand">{i.title}</Link>,
          <code key="e" className="text-xs">{i.entityId}</code>,
          <Badge key="s" tone={i.status === 'new' ? 'warn' : 'neutral'}>{i.status}</Badge>,
          new Date(i.at).toLocaleString('ru-RU'),
          i.assignee ?? '—',
        ])} />
    </div>
  );
}
