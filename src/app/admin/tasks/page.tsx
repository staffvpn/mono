'use client';

import { useState } from 'react';
import Link from 'next/link';
import { adminService } from '@/services/admin';
import { useDB, useMounted } from '@/hooks/useStore';
import { Badge, Input, Select, Skeleton } from '@/components/ui';
import { DangerAction, DataTable, PageHead } from '@/components/admin/Chrome';

export default function AdminTasks() {
  const mounted = useMounted();
  const db = useDB();
  const [q, setQ] = useState('');
  const [mod, setMod] = useState('all');
  if (!mounted) return <Skeleton className="h-96" />;

  const tasks = adminService.getTasks({ search: q, moderation: mod });

  return (
    <div>
      <PageHead title="Задачи" sub={`Найдено: ${tasks.length}`} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ID или название"
          className="!min-h-[40px] max-w-sm !border-2 !py-2 text-sm" />
        <Select value={mod} onChange={(e) => setMod(e.target.value)} className="!min-h-[40px] !w-auto !border-2 !py-2 text-sm">
          <option value="all">Любой статус</option>
          <option value="published">Опубликованы</option>
          <option value="on_review">На модерации</option>
          <option value="hidden">Скрыты</option>
          <option value="archived">В архиве</option>
        </Select>
      </div>

      <DataTable
        head={['ID', 'Название', 'Автор', 'Категория', 'Город', 'Цена', 'Откликов', 'Актуальность', 'Модерация', 'Жалоб', 'Действия']}
        rows={tasks.map((t) => {
          const author = db.users.find((u) => u.id === t.authorId);
          const cat = db.categories.find((c) => c.id === t.categoryId);
          return [
            <code key="i" className="text-xs">{t.id}</code>,
            <Link key="t" href={`/app/tasks/${t.id}`} className="font-bold text-brand">{t.title}</Link>,
            author ? <Link key="a" href={`/admin/users/${author.id}`} className="text-brand">{author.name}</Link> : '—',
            cat?.name ?? '—',
            t.geo.city,
            t.budget.unknown ? 'обсуждается' : `${t.budget.amount?.toLocaleString('ru-RU')} ₽`,
            t.applicationsCount,
            t.relevance,
            <Badge key="m" tone={t.moderation === 'published' ? 'ok' : t.moderation === 'on_review' ? 'warn' : 'neutral'}>{t.moderation}</Badge>,
            t.reportsCount ? <Badge key="r" tone="danger">{t.reportsCount}</Badge> : '—',
            <span key="act" className="flex gap-1">
              <DangerAction section="tasks" label="Скрыть" question="Скрыть задачу из выдачи?"
                reasons={['Спам', 'Мошенничество', 'Дубль', 'Нарушение правил', 'Другое']}
                onConfirm={(r) => adminService.moderateTask(t.id, 'hidden', r)} />
              <DangerAction section="tasks" label="Опубликовать" question="Вернуть задачу в выдачу?"
                reasons={['Проверено, всё в порядке', 'Ошибочное скрытие', 'Другое']}
                onConfirm={(r) => adminService.moderateTask(t.id, 'published', r)} />
            </span>,
          ];
        })} />
      <p className="mt-3 text-xs text-faint">
        Задачи не удаляются физически: история нужна для споров и финансового аудита. Используется скрытие и архив.
      </p>
    </div>
  );
}
