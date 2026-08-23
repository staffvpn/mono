'use client';

import Link from 'next/link';
import { Avatar, Badge, Card, Rating, cx } from '@/components/ui';
import type { Application, MatchScore, Task, User } from '@/types';

const RELEVANCE: Record<Task['relevance'], { label: string; tone: 'ok' | 'warn' | 'neutral' | 'danger' }> = {
  active: { label: 'Актуальна', tone: 'ok' },
  comparing: { label: 'Сравнивает предложения', tone: 'neutral' },
  needs_confirm: { label: 'Ждёт подтверждения', tone: 'warn' },
  inactive: { label: 'Неактуальна', tone: 'danger' },
  done: { label: 'Завершена', tone: 'neutral' },
};

export function money(v: number | null | undefined) {
  if (v === null || v === undefined) return '—';
  return `${v.toLocaleString('ru-RU')} ₽`;
}

export function budgetLabel(t: Task) {
  if (!t.budget.unknown) return money(t.budget.amount);
  if (t.budget.min && t.budget.max) return `${t.budget.min.toLocaleString('ru-RU')}–${t.budget.max.toLocaleString('ru-RU')} ₽`;
  return 'Цена обсуждается';
}

export function timeAgo(iso: string) {
  const min = Math.round((Date.now() - +new Date(iso)) / 60000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.round(h / 24)} дн назад`;
}

export function RelevanceBadge({ task }: { task: Task }) {
  const r = RELEVANCE[task.relevance];
  return <Badge tone={r.tone}>{r.label}</Badge>;
}

export function TaskCard({ task, author, match, href }: {
  task: Task; author?: User; match?: MatchScore; href: string;
}) {
  return (
    <Card as={Link} {...{ href }} className="block p-5 transition-transform hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-pop-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <RelevanceBadge task={task} />
          {task.urgency === 'now' && <Badge tone="danger">Срочно</Badge>}
        </div>
        <span className="shrink-0 text-xs text-faint">{timeAgo(task.createdAt)}</span>
      </div>

      <h3 className="mt-3 text-xl font-extrabold leading-tight tracking-tight">{task.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-muted">{task.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="font-extrabold">{budgetLabel(task)}</span>
        {typeof task.geo.distanceKm === 'number' && task.geo.distanceKm > 0 && (
          <span className="text-muted">{task.geo.distanceKm.toFixed(1)} км</span>
        )}
        <span className="text-muted">{task.geo.district || task.geo.city}</span>
        {task.timeWindow && <span className="text-muted">{task.timeWindow}</span>}
      </div>

      {match && match.score > 0 && (
        <div className="mt-4 rounded-md border-2 border-ink bg-surface px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm font-extrabold">
            <span className="grid h-6 min-w-[44px] place-items-center rounded-full border-2 border-ink bg-brand px-1.5 text-xs text-white">
              {match.score}%
            </span>
            подходит вам
          </div>
          {match.reasons.length > 0 && (
            <p className="mt-1.5 text-xs text-muted">{match.reasons.join(' · ')}</p>
          )}
        </div>
      )}

      {author && (
        <div className="mt-4 flex items-center gap-2.5 border-t-2 border-ink/10 pt-3">
          <Avatar src={author.avatar} name={author.name} size={32} />
          <span className="text-sm font-bold">{author.name}</span>
          <span className="ml-auto"><Rating value={author.reputation.rating} count={author.reputation.reviewsCount} size="sm" /></span>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-xs text-faint">
        <span>{task.applicationsCount} откл.</span>
        <span>·</span>
        <span>{task.viewsCount} просм.</span>
      </div>
    </Card>
  );
}

export function UserCard({ user, match, href, action }: {
  user: User; match?: MatchScore; href: string; action?: React.ReactNode;
}) {
  const v = (k: string) => user.verifications.find((x) => x.kind === k)?.status === 'approved';
  return (
    <Card className="p-5">
      <Link href={href} className="flex items-start gap-3.5">
        <Avatar src={user.avatar} name={user.name} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight">{user.name}</span>
            {v('identity') && <Badge tone="ok">Личность ✓</Badge>}
            {!v('identity') && v('phone') && <Badge tone="sand">Телефон ✓</Badge>}
          </div>
          {user.executor && <p className="mt-0.5 truncate text-sm text-muted">{user.executor.headline}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <Rating value={user.reputation.rating} count={user.reputation.reviewsCount} size="sm" />
            <span className="text-muted">{user.reputation.ordersCompleted} заказов</span>
            {user.reputation.responseMinutes && <span className="text-muted">отвечает ~{user.reputation.responseMinutes} мин</span>}
          </div>
        </div>
      </Link>

      {match && match.score > 0 && (
        <div className="mt-4 rounded-md border-2 border-ink bg-surface px-3 py-2">
          <span className="text-sm font-extrabold">{match.score}% совпадение</span>
          {match.reasons.length > 0 && <p className="mt-1 text-xs text-muted">{match.reasons.join(' · ')}</p>}
        </div>
      )}

      {user.executor && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {user.executor.skills.slice(0, 4).map((s) => (
            <span key={s} className="rounded-full border-2 border-ink bg-card px-2.5 py-1 text-xs font-bold">{s}</span>
          ))}
        </div>
      )}

      {action && <div className="mt-4 flex flex-wrap gap-2">{action}</div>}
    </Card>
  );
}

export function ApplicationRow({ app, executor, action }: {
  app: Application; executor?: User; action?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3.5">
        {executor && <Avatar src={executor.avatar} name={executor.name} size={48} />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-lg font-extrabold tracking-tight">{executor?.name ?? 'Исполнитель'}</span>
            <span className="text-lg font-extrabold">{money(app.price)}</span>
          </div>
          {executor && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm">
              <Rating value={executor.reputation.rating} count={executor.reputation.reviewsCount} size="sm" />
              <span className="text-muted">{executor.reputation.ordersCompleted} заказов</span>
            </div>
          )}
          <p className="mt-2.5 text-[15px] leading-relaxed">{app.comment}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 text-sm text-muted">
            <span>Начнёт: {app.canStart}</span>
            {app.durationHours && <span>Займёт ~{app.durationHours} ч</span>}
            <span className={cx(app.status === 'accepted' && 'font-bold text-ok')}>
              {app.status === 'accepted' ? 'Выбран' : timeAgo(app.createdAt)}
            </span>
          </div>
        </div>
      </div>
      {action && <div className="mt-4 flex flex-wrap gap-2">{action}</div>}
    </Card>
  );
}
