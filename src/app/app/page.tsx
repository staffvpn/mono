'use client';

import Link from 'next/link';
import { authService } from '@/services/auth';
import { taskService, matchingService, applicationService, orderService } from '@/services/catalog';
import { notificationService } from '@/services/comms';
import { useDB, useMounted } from '@/hooks/useStore';
import { Button, Card, EmptyState, MockBanner, Skeleton } from '@/components/ui';
import { ArtSearching, ArtEmpty } from '@/components/ui/art';
import { TaskCard, timeAgo } from '@/components/app/cards';
import { CONFIG } from '@/lib/config';

export default function AppHome() {
  const mounted = useMounted();
  const db = useDB();
  if (!mounted) return <Skeleton className="h-64" />;

  const me = authService.getCurrentUser();
  if (!me) return null;

  const isExecutor = me.activeRole === 'executor';
  const myTasks = taskService.list({ authorId: me.id });
  const myApps = applicationService.byExecutor(me.id);
  const myOrders = orderService.list(me.id);
  const feed = taskService.list().filter((t) => t.authorId !== me.id && t.relevance !== 'inactive');
  const scored = feed
    .map((t) => ({ task: t, match: matchingService.scoreTaskForUser(t, me) }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {isExecutor ? 'Сегодня для тебя есть задачи' : `Привет, ${me.name.split(' ')[0]}`}
          </h1>
          <p className="mt-1 text-[15px] text-muted">
            {isExecutor ? 'Отклик бесплатный — всегда.' : 'Опишите задачу, остальное сделаем мы.'}
          </p>
        </div>
        <Link href="/app/create"><Button>Создать задачу</Button></Link>
      </div>

      {CONFIG.useMock && <MockBanner />}

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickStat label={isExecutor ? 'Мои отклики' : 'Мои задачи'} value={isExecutor ? myApps.length : myTasks.length}
          href={isExecutor ? '/app/orders' : '/app/tasks?mine=1'} />
        <QuickStat label="Заказы" value={myOrders.length} href="/app/orders" />
        <QuickStat label="Уведомления" value={notificationService.unread(me.id)} href="/app/notifications" />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold tracking-tight">
            {isExecutor ? 'Подходящие задачи' : 'Что происходит рядом'}
          </h2>
          <Link href="/app/tasks" className="text-sm font-bold text-brand">Все задачи →</Link>
        </div>

        {scored.length === 0 ? (
          <EmptyState
            art={<ArtEmpty />}
            title="Пока тихо"
            text="Можно подождать. Или создать первую задачу — это бесплатно."
            action={<Link href="/app/create"><Button>Создать задачу</Button></Link>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {scored.map(({ task, match }) => (
              <TaskCard key={task.id} task={task} href={`/app/tasks/${task.id}`}
                author={db.users.find((u) => u.id === task.authorId)}
                match={isExecutor ? match : undefined} />
            ))}
          </div>
        )}
      </section>

      {!isExecutor && myTasks.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-extrabold tracking-tight">Мои задачи</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {myTasks.slice(0, 4).map((t) => (
              <TaskCard key={t.id} task={t} href={`/app/tasks/${t.id}`} />
            ))}
          </div>
        </section>
      )}

      {isExecutor && !me.executor && (
        <Card className="flex flex-col items-start gap-4 bg-surface p-6 sm:flex-row sm:items-center">
          <ArtSearching className="h-20 w-20 shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-extrabold">Заполните профиль исполнителя</h3>
            <p className="mt-1 text-[15px] text-muted">
              Категории, район и доступность — без них подбор работает вслепую.
            </p>
          </div>
          <Link href="/app/profile"><Button>Заполнить</Button></Link>
        </Card>
      )}
    </div>
  );
}

function QuickStat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Card as={Link} {...{ href }} className="block p-5 transition-transform hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-pop-sm">
      <div className="text-3xl font-extrabold tracking-tight">{value}</div>
      <div className="mt-1 text-sm font-bold text-muted">{label}</div>
    </Card>
  );
}
