'use client';

import Link from 'next/link';
import { useState } from 'react';
import { adminService } from '@/services/admin';
import { useDB, useMounted } from '@/hooks/useStore';
import { Avatar, Badge, Input, Select, Skeleton } from '@/components/ui';
import { DataTable, PageHead } from '@/components/admin/Chrome';

const STATUS: Record<string, { l: string; tone: 'ok' | 'warn' | 'danger' | 'neutral' }> = {
  active: { l: 'Активен', tone: 'ok' },
  limited: { l: 'Ограничен', tone: 'warn' },
  blocked: { l: 'Заблокирован', tone: 'danger' },
  pending_review: { l: 'На проверке', tone: 'warn' },
};

export default function AdminUsers() {
  const mounted = useMounted();
  useDB();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [role, setRole] = useState('all');
  if (!mounted) return <Skeleton className="h-96" />;

  const users = adminService.getUsers({ search: q, status, role });

  return (
    <div>
      <PageHead title="Пользователи" sub={`Найдено: ${users.length}`} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Имя, ID, username, телефон, Telegram ID"
          className="!min-h-[40px] max-w-sm !border-2 !py-2 text-sm" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="!min-h-[40px] !w-auto !border-2 !py-2 text-sm">
          <option value="all">Любой статус</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
        </Select>
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="!min-h-[40px] !w-auto !border-2 !py-2 text-sm">
          <option value="all">Любая роль</option>
          <option value="customer">Заказчики</option>
          <option value="executor">Исполнители</option>
        </Select>
      </div>

      <DataTable
        head={['Пользователь', 'ID', 'Контакты', 'Роль', 'Рейтинг', 'Заказов', 'Регистрация', 'Активность', 'Статус', 'Проверки']}
        rows={users.map((u) => [
          <Link key="n" href={`/admin/users/${u.id}`} className="flex items-center gap-2 font-bold text-brand">
            <Avatar src={u.avatar} name={u.name} size={28} />{u.name}
          </Link>,
          <code key="i" className="text-xs">{u.id}</code>,
          <span key="c" className="text-xs">{u.phone ?? '—'}<br />{u.username ? `@${u.username}` : '—'}</span>,
          u.executor ? 'Исполнитель' : 'Заказчик',
          u.reputation.rating?.toFixed(1) ?? '—',
          u.reputation.ordersCompleted,
          new Date(u.createdAt).toLocaleDateString('ru-RU'),
          new Date(u.lastSeenAt).toLocaleDateString('ru-RU'),
          <Badge key="s" tone={STATUS[u.status].tone}>{STATUS[u.status].l}</Badge>,
          <span key="v" className="flex flex-wrap gap-1">
            {u.verifications.filter((v) => v.status === 'approved').map((v) => (
              <Badge key={v.kind} tone="sand">{{ phone: 'тел', telegram: 'tg', identity: 'лич', documents: 'док' }[v.kind]}</Badge>
            ))}
          </span>,
        ])} />
    </div>
  );
}
