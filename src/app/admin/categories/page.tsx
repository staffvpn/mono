'use client';

import { useState } from 'react';
import { adminService } from '@/services/admin';
import { commit, getDB } from '@/services/store';
import { useDB, useMounted } from '@/hooks/useStore';
import { Badge, Button, Card, Input, Skeleton, Toggle } from '@/components/ui';
import { PageHead } from '@/components/admin/Chrome';
import { logAction } from '@/services/admin';

export default function AdminCategories() {
  const mounted = useMounted();
  const db = useDB();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✨');
  if (!mounted) return <Skeleton className="h-96" />;

  const roots = db.categories.filter((c) => !c.parentId);

  function toggle(id: string, enabled: boolean) {
    const d = getDB();
    const before = d.categories.find((c) => c.id === id)?.enabled;
    d.categories = d.categories.map((c) => (c.id === id ? { ...c, enabled } : c));
    commit();
    logAction({ action: 'Категория включена/выключена', entityType: 'category', entityId: id, before: String(before), after: String(enabled) });
  }

  return (
    <div>
      <PageHead title="Категории" sub="Меняются без разработчика. Категория с историей не удаляется, а архивируется." />

      <Card className="mb-4 flex flex-wrap items-end gap-3 p-4" pop={false}>
        <label className="text-sm font-bold">
          Эмодзи
          <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="!min-h-[40px] !w-20 !border-2 !py-2 text-center" />
        </label>
        <label className="flex-1 text-sm font-bold">
          Название категории
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Ремонт техники"
            className="!min-h-[40px] !border-2 !py-2" />
        </label>
        <Button size="sm" disabled={!name.trim()}
          onClick={() => { adminService.upsertCategory({ name: name.trim(), emoji }); setName(''); }}>
          Добавить
        </Button>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {roots.map((c) => {
          const kids = db.categories.filter((x) => x.parentId === c.id);
          return (
            <Card key={c.id} className="p-4" pop={false}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-extrabold"><span aria-hidden>{c.emoji}</span> {c.name}</div>
                  <div className="text-xs text-faint">{c.slug} · порядок {c.order}</div>
                </div>
                <Badge tone={c.enabled ? 'ok' : 'neutral'}>{c.enabled ? 'вкл' : 'выкл'}</Badge>
              </div>
              {kids.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {kids.map((k) => <span key={k.id} className="rounded-full border border-ink/30 px-2 py-0.5 text-xs">{k.name}</span>)}
                </div>
              )}
              <div className="mt-3">
                <Toggle checked={c.enabled} onChange={(v) => toggle(c.id, v)} label="Показывать пользователям" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
