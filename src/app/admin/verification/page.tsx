'use client';

import Link from 'next/link';
import { useDB, useMounted } from '@/hooks/useStore';
import { Badge, Skeleton } from '@/components/ui';
import { DangerAction, DataTable, PageHead } from '@/components/admin/Chrome';
import { commit, getDB } from '@/services/store';
import { logAction } from '@/services/admin';

export default function AdminVerification() {
  const mounted = useMounted();
  const db = useDB();
  if (!mounted) return <Skeleton className="h-96" />;

  const queue = db.users.flatMap((u) =>
    u.verifications.filter((v) => v.status === 'pending' || v.status === 'more_info').map((v) => ({ user: u, v })));

  function decide(userId: string, kind: string, status: 'approved' | 'rejected', reason: string) {
    const d = getDB();
    d.users = d.users.map((u) => u.id === userId
      ? { ...u, verifications: u.verifications.map((x) => x.kind === kind ? { ...x, status, updatedAt: new Date().toISOString() } : x) }
      : u);
    commit();
    logAction({ action: 'Решение по проверке', entityType: 'verification', entityId: `${userId}/${kind}`, after: status, reason });
  }

  return (
    <div>
      <PageHead title="Проверки" sub={`В очереди: ${queue.length}`} />
      <DataTable head={['Пользователь', 'Тип', 'Статус', 'Обновлено', 'Действия']}
        rows={queue.map(({ user, v }) => [
          <Link key="u" href={`/admin/users/${user.id}`} className="font-bold text-brand">{user.name}</Link>,
          { phone: 'Телефон', telegram: 'Telegram', identity: 'Личность', documents: 'Документы' }[v.kind],
          <Badge key="s" tone="warn">{v.status}</Badge>,
          new Date(v.updatedAt).toLocaleString('ru-RU'),
          <span key="a" className="flex gap-1">
            <DangerAction section="verification" label="Одобрить" question="Подтвердить проверку?"
              reasons={['Документы в порядке', 'Данные совпали', 'Другое']}
              onConfirm={(r) => decide(user.id, v.kind, 'approved', r)} />
            <DangerAction section="verification" label="Отклонить" question="Отклонить проверку?"
              reasons={['Данные не совпали', 'Плохое качество документа', 'Подозрение на подделку', 'Другое']}
              onConfirm={(r) => decide(user.id, v.kind, 'rejected', r)} />
          </span>,
        ])}
        empty="Очередь пуста" />
      <p className="mt-3 text-xs text-faint">
        Администратору показывается только то, что нужно для решения: сами документы хранятся отдельно и с ограниченным доступом.
      </p>
    </div>
  );
}
