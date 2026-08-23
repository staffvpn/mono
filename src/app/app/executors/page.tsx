'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth';
import { favoriteService, matchingService, taskService } from '@/services/catalog';
import { useDB, useMounted } from '@/hooks/useStore';
import { Button, Card, Chip, EmptyState, Select, Skeleton } from '@/components/ui';
import { ArtEmpty } from '@/components/ui/art';
import { UserCard } from '@/components/app/cards';
import { haptic } from '@/lib/telegram';

export default function ExecutorsPage() {
  const mounted = useMounted();
  const db = useDB();
  const params = useSearchParams();
  const taskId = params.get('task');
  const [cat, setCat] = useState('');
  const [sort, setSort] = useState('match');
  const [onlyVerified, setOnlyVerified] = useState(false);

  const me = mounted ? authService.getCurrentUser() : null;
  const task = taskId ? taskService.get(taskId) : undefined;

  const list = useMemo(() => {
    if (!me) return [];
    let out = db.users.filter((u) => u.executor && u.id !== me.id && u.status === 'active');
    if (cat) out = out.filter((u) => u.executor!.categories.includes(cat));
    if (onlyVerified) out = out.filter((u) => u.verifications.some((v) => v.kind === 'identity' && v.status === 'approved'));

    const scored = out.map((u) => ({
      user: u,
      match: task ? matchingService.scoreTaskForUser(task, u) : { score: 0, reasons: [] },
    }));
    scored.sort((a, b) => {
      if (sort === 'rating') return (b.user.reputation.rating ?? 0) - (a.user.reputation.rating ?? 0);
      if (sort === 'cheap') return (a.user.executor!.rateFrom ?? 0) - (b.user.executor!.rateFrom ?? 0);
      if (sort === 'fast') return (a.user.reputation.responseMinutes ?? 999) - (b.user.reputation.responseMinutes ?? 999);
      return b.match.score - a.match.score;
    });
    return scored;
  }, [db, me, cat, sort, onlyVerified, task]);

  if (!mounted) return <div className="grid gap-4 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}</div>;
  if (!me) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          {task ? 'Мы нашли подходящих людей' : 'Исполнители'}
        </h1>
        {task && <p className="mt-1 text-[15px] text-muted">Для задачи «{task.title}»</p>}
      </div>

      <Card className="flex flex-col gap-4 p-4">
        <div className="no-bar flex gap-2 overflow-x-auto">
          <Chip active={!cat} onClick={() => setCat('')}>Все</Chip>
          {db.categories.filter((c) => !c.parentId && c.enabled).slice(0, 10).map((c) => (
            <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
              <span aria-hidden>{c.emoji}</span>{c.name}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Chip active={onlyVerified} onClick={() => setOnlyVerified((v) => !v)}>Личность подтверждена</Chip>
          <Select value={sort} onChange={(e) => setSort(e.target.value)} className="ml-auto max-w-[220px]" aria-label="Сортировка">
            <option value="match">Лучшее совпадение</option>
            <option value="rating">Выше рейтинг</option>
            <option value="cheap">Дешевле</option>
            <option value="fast">Быстрее отвечает</option>
          </Select>
        </div>
      </Card>

      {list.length === 0 ? (
        <EmptyState art={<ArtEmpty />} title="Никого не нашли"
          text="Попробуйте убрать фильтры — возможно, они слишком строгие." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map(({ user, match }) => (
            <UserCard key={user.id} user={user} href={`/app/executors/${user.id}`}
              match={task ? match : undefined}
              action={
                <>
                  <Link href={`/app/messages?user=${user.id}${taskId ? `&task=${taskId}` : ''}`}>
                    <Button size="sm">Написать</Button>
                  </Link>
                  <Button size="sm" variant="outline"
                    onClick={() => { favoriteService.toggle(me.id, 'user', user.id); haptic('select'); }}>
                    {favoriteService.has(me.id, 'user', user.id) ? '★ В избранном' : '☆ В избранное'}
                  </Button>
                </>
              } />
          ))}
        </div>
      )}
    </div>
  );
}
