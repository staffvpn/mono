'use client';

import { use } from 'react';
import Link from 'next/link';
import { authService } from '@/services/auth';
import { favoriteService } from '@/services/catalog';
import { reviewService } from '@/services/comms';
import { useDB, useMounted } from '@/hooks/useStore';
import { haptic } from '@/lib/telegram';
import { Avatar, Badge, Button, Card, EmptyState, Rating, Skeleton } from '@/components/ui';
import { ArtEmpty } from '@/components/ui/art';
import { money } from '@/components/app/cards';

export default function ExecutorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const mounted = useMounted();
  const db = useDB();
  if (!mounted) return <Skeleton className="h-96" />;

  const me = authService.getCurrentUser();
  const user = db.users.find((u) => u.id === id);
  if (!me) return null;
  if (!user) return <EmptyState art={<ArtEmpty />} title="Профиль не найден" />;

  const rep = user.reputation;
  const reviews = reviewService.forUser(user.id);
  const ver = (k: string) => user.verifications.find((v) => v.kind === k)?.status === 'approved';

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="flex flex-col gap-5">
        <Card className="p-6">
          <div className="flex flex-wrap items-start gap-4">
            <Avatar src={user.avatar} name={user.name} size={80} />
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-extrabold tracking-tight">{user.name}</h1>
              {user.executor && <p className="mt-1 text-[15px] text-muted">{user.executor.headline}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Rating value={rep.rating} count={rep.reviewsCount} />
                <span className="text-sm text-muted">{user.city}{user.district ? `, ${user.district}` : ''}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {ver('telegram') && <Badge tone="sand">Telegram ✓</Badge>}
                {ver('phone') && <Badge tone="sand">Телефон ✓</Badge>}
                {ver('identity') ? <Badge tone="ok">Личность ✓</Badge> : <Badge tone="neutral">Личность не подтверждена</Badge>}
              </div>
            </div>
          </div>

          {user.executor?.about && <p className="mt-5 text-[16px] leading-relaxed">{user.executor.about}</p>}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-extrabold">Репутация</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Metric l="Выполнено" v={rep.ordersCompleted} />
            <Metric l="Успешных" v={rep.successRate === null ? '—' : `${Math.round(rep.successRate * 100)}%`} />
            <Metric l="Отмен" v={rep.ordersCancelled} />
            <Metric l="Отвечает" v={rep.responseMinutes ? `~${rep.responseMinutes} мин` : '—'} />
            <Metric l="Возвращаются" v={rep.repeatCustomers} />
            <Metric l="Индекс доверия" v={rep.trustIndex ?? '—'} />
          </div>
          <p className="mt-4 text-xs text-faint">
            Индекс доверия — внутренний показатель. Он не является гарантией и не заменяет вашу оценку.
          </p>
        </Card>

        {user.executor && user.executor.skills.length > 0 && (
          <Card className="p-6">
            <h2 className="mb-3 text-lg font-extrabold">Навыки</h2>
            <div className="flex flex-wrap gap-2">
              {user.executor.skills.map((s) => (
                <span key={s} className="rounded-full border-2 border-ink bg-surface px-3 py-1.5 text-sm font-bold">{s}</span>
              ))}
            </div>
          </Card>
        )}

        {user.executor && user.executor.portfolio.length > 0 && (
          <Card className="p-6">
            <h2 className="mb-3 text-lg font-extrabold">Портфолио</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {user.executor.portfolio.map((p) => (
                <figure key={p.id}>
                  <div className="aspect-[4/3] rounded-lg border-3 border-ink bg-sand bg-cover bg-center"
                    style={{ backgroundImage: `url("${p.image}")` }} role="img" aria-label={p.title} />
                  <figcaption className="mt-2 text-sm font-bold">{p.title}</figcaption>
                </figure>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-extrabold">Отзывы</h2>
          {reviews.length === 0 ? (
            <p className="text-[15px] text-muted">Отзывов пока нет. Появятся после завершённых заказов.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((r) => (
                <div key={r.id} className="border-b-2 border-ink/10 pb-4 last:border-0">
                  <Rating value={r.average} size="sm" />
                  <p className="mt-1.5 text-[15px]">{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="flex flex-col gap-3 p-5">
          {user.executor?.rateFrom && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-faint">Ставка от</div>
              <div className="text-2xl font-extrabold">{money(user.executor.rateFrom)}</div>
            </div>
          )}
          <Link href={`/app/messages?user=${user.id}`}><Button className="w-full">Написать</Button></Link>
          <Button variant="outline" onClick={() => { favoriteService.toggle(me.id, 'user', user.id); haptic('select'); }}>
            {favoriteService.has(me.id, 'user', user.id) ? '★ В избранном' : '☆ В избранное'}
          </Button>
        </Card>

        {user.executor && (
          <Card className="p-5">
            <h3 className="mb-3 font-extrabold">Доступность</h3>
            <ul className="flex flex-col gap-2 text-[15px]">
              {([['today', 'Сегодня'], ['tomorrow', 'Завтра'], ['thisWeek', 'На этой неделе'], ['byAgreement', 'По договорённости']] as const).map(([k, l]) => (
                <li key={k} className="flex items-center gap-2">
                  <span aria-hidden className={user.executor!.availability[k] ? 'text-ok' : 'text-faint'}>
                    {user.executor!.availability[k] ? '✓' : '—'}
                  </span>
                  <span className={user.executor!.availability[k] ? '' : 'text-faint'}>{l}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted">Район: {user.executor.district}</p>
          </Card>
        )}

        <Link href={`/app/help?user=${user.id}`} className="text-center text-sm font-bold text-brand">
          Пожаловаться на профиль
        </Link>
      </aside>
    </div>
  );
}

function Metric({ l, v }: { l: string; v: React.ReactNode }) {
  return (
    <div className="rounded-md border-2 border-ink bg-surface px-3 py-2.5">
      <div className="text-xl font-extrabold">{v}</div>
      <div className="text-xs text-faint">{l}</div>
    </div>
  );
}
