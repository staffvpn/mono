'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { taskService } from '@/services/catalog';
import { useDB, useMounted } from '@/hooks/useStore';
import { Button, Card, Chip, EmptyState, MockBanner, Select, Skeleton } from '@/components/ui';
import { ArtEmpty } from '@/components/ui/art';
import { budgetLabel, timeAgo } from '@/components/app/cards';
import { PageHero } from '@/components/site/Chrome';
import { CONFIG } from '@/lib/config';
import type { Task } from '@/types';

const SORTS = [
  { v: 'new', l: 'Сначала новые' },
  { v: 'rich', l: 'Дороже' },
  { v: 'cheap', l: 'Дешевле' },
];

/**
 * Публичная витрина: показываем задачи без авторства и контактов.
 * Отклик, чат и подбор доступны только внутри приложения — здесь только «посмотреть».
 */
export function PublicTasks() {
  const mounted = useMounted();
  const db = useDB();
  const [cat, setCat] = useState('');
  const [sort, setSort] = useState('new');

  const cats = mounted ? db.categories.filter((c) => !c.parentId && c.enabled) : [];

  const list: Task[] = useMemo(() => {
    if (!mounted) return [];
    let out = taskService.list({ categoryId: cat || undefined });
    out = out.filter((t) => t.relevance !== 'inactive' && t.relevance !== 'done');
    const price = (t: Task) => t.budget.amount ?? t.budget.max ?? t.budget.min ?? 0;
    if (sort === 'rich') out = [...out].sort((a, b) => price(b) - price(a));
    if (sort === 'cheap') out = [...out].sort((a, b) => price(a) - price(b));
    return out;
  }, [mounted, db, cat, sort]);

  return (
    <>
      <PageHero
        eyebrow="Задачи"
        title="Что сейчас нужно сделать"
        sub="Открытая витрина задач. Чтобы посмотреть детали, написать заказчику и откликнуться, войдите — отклик бесплатный."
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/app?intent=executor"><Button size="lg">Войти и откликнуться</Button></Link>
          <Link href="/app/create"><Button size="lg" variant="outline">Создать свою задачу</Button></Link>
        </div>
      </PageHero>

      <div className="mx-auto w-full max-w-[1240px] px-5 py-14 sm:px-8 sm:py-16">
        {CONFIG.useMock && <MockBanner text="Демо-режим: задачи показательные, backend не подключён" />}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Chip active={!cat} onClick={() => setCat('')}>Все</Chip>
          {cats.map((c) => (
            <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
              <span aria-hidden>{c.emoji}</span> {c.name}
            </Chip>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-muted">
            {mounted ? `Найдено задач: ${list.length}` : 'Загружаем…'}
          </p>
          <label className="flex items-center gap-2 text-sm font-bold">
            Сортировка
            <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-auto">
              {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </Select>
          </label>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {!mounted && [0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-48" />)}

          {mounted && list.map((t) => {
            const c = db.categories.find((x) => x.id === t.categoryId);
            return (
              <Card key={t.id} className="flex flex-col gap-3 p-6">
                <div className="flex items-center gap-2 text-sm font-bold text-muted">
                  <span aria-hidden>{c?.emoji}</span>
                  {c?.name ?? 'Без категории'}
                  <span aria-hidden>·</span>
                  <span className="text-faint">{timeAgo(t.createdAt)}</span>
                </div>
                <h2 className="text-lg font-extrabold leading-tight tracking-tight">{t.title}</h2>
                <p className="line-clamp-3 text-[15px] leading-relaxed text-muted">{t.description}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink/10 pt-4">
                  <span className="text-lg font-extrabold">{budgetLabel(t)}</span>
                  <span className="text-sm font-bold text-muted">{t.geo.district || t.geo.city}</span>
                </div>
                <Link href={`/app/tasks/${t.id}`} className="mt-1">
                  <Button variant="outline" className="w-full">Открыть задачу</Button>
                </Link>
              </Card>
            );
          })}
        </div>

        {mounted && list.length === 0 && (
          <EmptyState
            art={<ArtEmpty />}
            title="Задач в этой категории пока нет"
            text="Выберите другую категорию или создайте свою задачу — это бесплатно."
            action={<Link href="/app/create"><Button>Создать задачу</Button></Link>}
          />
        )}
      </div>
    </>
  );
}
