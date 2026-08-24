'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth';
import { matchingService, taskService } from '@/services/catalog';
import { useDB, useMounted } from '@/hooks/useStore';
import { Button, Card, Chip, EmptyState, Select, Skeleton, Tabs, cx } from '@/components/ui';
import { ScrollRow } from '@/components/app/ScrollRow';
import { ArtEmpty } from '@/components/ui/art';
import { TaskCard } from '@/components/app/cards';

const DISTANCES = [1, 3, 5, 10, 25, 0];
const SORTS = [
  { v: 'match', l: 'Лучшее совпадение' },
  { v: 'near', l: 'Ближе' },
  { v: 'cheap', l: 'Дешевле' },
  { v: 'rich', l: 'Дороже' },
  { v: 'new', l: 'Новее' },
];

export default function TasksPage() {
  const mounted = useMounted();
  const db = useDB();
  const params = useSearchParams();
  const [tab, setTab] = useState<'all' | 'mine'>(params.get('mine') ? 'mine' : 'all');
  const [cat, setCat] = useState<string>('');
  const [dist, setDist] = useState<number>(0);
  const [sort, setSort] = useState('match');

  const me = mounted ? authService.getCurrentUser() : null;

  const list = useMemo(() => {
    if (!me) return [];
    let out = taskService.list();
    out = tab === 'mine' ? out.filter((t) => t.authorId === me.id) : out.filter((t) => t.authorId !== me.id);
    if (cat) out = out.filter((t) => t.categoryId === cat);
    if (dist) out = out.filter((t) => (t.geo.distanceKm ?? 99) <= dist);

    const withScore = out.map((t) => ({ t, m: matchingService.scoreTaskForUser(t, me) }));
    withScore.sort((a, b) => {
      if (sort === 'near') return (a.t.geo.distanceKm ?? 99) - (b.t.geo.distanceKm ?? 99);
      if (sort === 'cheap') return (a.t.budget.amount ?? a.t.budget.min ?? 0) - (b.t.budget.amount ?? b.t.budget.min ?? 0);
      if (sort === 'rich') return (b.t.budget.amount ?? b.t.budget.max ?? 0) - (a.t.budget.amount ?? a.t.budget.max ?? 0);
      if (sort === 'new') return +new Date(b.t.createdAt) - +new Date(a.t.createdAt);
      return b.m.score - a.m.score;
    });
    return withScore;
  }, [me, db, tab, cat, dist, sort]);

  if (!mounted) return <div className="grid gap-4 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-56" />)}</div>;
  if (!me) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Задачи</h1>
        <Link href="/app/create"><Button>Создать задачу</Button></Link>
      </div>

      <Tabs value={tab} onChange={setTab}
        tabs={[{ key: 'all', label: 'Все задачи' }, { key: 'mine', label: 'Мои задачи' }]} />

      <Card className="flex flex-col gap-3 p-3 sm:p-4">
        <ScrollRow label="Категории">
          <Chip active={!cat} onClick={() => setCat('')}>Все</Chip>
          {db.categories.filter((c) => !c.parentId && c.enabled).map((c) => (
            <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
              <span aria-hidden className="text-[15px] leading-none">{c.emoji}</span>
              {c.name}
            </Chip>
          ))}
        </ScrollRow>

        <div className="flex flex-col gap-3 border-t-2 border-ink/10 pt-3 sm:flex-row sm:items-center">
          {/* Расстояние — переключатель, а не россыпь кнопок: значения
              взаимоисключающие и их всего шесть. */}
          <div className="no-bar flex shrink-0 gap-1 overflow-x-auto rounded-full border-2 border-ink bg-surface p-1">
            {DISTANCES.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={dist === d}
                onClick={() => setDist(d)}
                className={cx(
                  'min-h-[30px] shrink-0 rounded-full px-3 text-[13px] font-bold leading-none transition-colors',
                  dist === d ? 'bg-brand text-white' : 'text-muted hover:text-ink',
                )}
              >
                {d === 0 ? 'Весь город' : `${d} км`}
              </button>
            ))}
          </div>

          <label className="flex min-w-0 items-center gap-2 sm:ml-auto">
            <span className="shrink-0 text-[13px] font-bold text-muted">Сортировка</span>
            <Select value={sort} onChange={(e) => setSort(e.target.value)}
              className="!min-h-[38px] !w-auto !border-2 !py-1.5 text-[13px]" aria-label="Сортировка">
              {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
            </Select>
          </label>
        </div>
      </Card>

      {list.length === 0 ? (
        <EmptyState
          art={<ArtEmpty />}
          title={tab === 'mine' ? 'Задач пока нет' : 'Ничего не нашлось'}
          text={tab === 'mine'
            ? 'Создайте первую — это бесплатно и занимает минуту.'
            : 'Попробуйте расширить радиус или убрать категорию.'}
          action={tab === 'mine' ? <Link href="/app/create"><Button>Создать задачу</Button></Link> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map(({ t, m }) => (
            <TaskCard key={t.id} task={t} href={`/app/tasks/${t.id}`}
              author={db.users.find((u) => u.id === t.authorId)}
              match={me.activeRole === 'executor' ? m : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
