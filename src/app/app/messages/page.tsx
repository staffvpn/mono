'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth';
import { chatService } from '@/services/comms';
import { useDB, useMounted } from '@/hooks/useStore';
import { Avatar, Button, EmptyState, Card, Skeleton } from '@/components/ui';
import { ArtEmpty } from '@/components/ui/art';
import { timeAgo } from '@/components/app/cards';

export default function MessagesPage() {
  const mounted = useMounted();
  const db = useDB();
  const router = useRouter();
  const params = useSearchParams();
  const withUser = params.get('user');
  const taskId = params.get('task');

  // Переход «Написать» из карточки: создаём или находим тред и уходим в него.
  useEffect(() => {
    if (!mounted || !withUser) return;
    const me = authService.getCurrentUser();
    if (!me) return;
    const task = taskId ? db.tasks.find((t) => t.id === taskId) : db.tasks.find((t) => t.authorId === me.id);
    const customerId = task?.authorId ?? me.id;
    const executorId = customerId === me.id ? withUser : me.id;
    const thread = chatService.findOrCreate(task?.id ?? 'direct', customerId, executorId);
    router.replace(`/app/messages/${thread.id}`);
  }, [mounted, withUser, taskId, db.tasks, router]);

  if (!mounted) return <Skeleton className="h-64" />;
  const me = authService.getCurrentUser();
  if (!me) return null;

  const threads = chatService.threads(me.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Сообщения</h1>

      {threads.length === 0 ? (
        <EmptyState art={<ArtEmpty />} title="Тут пока пусто"
          text="Чат появится, как только вы откликнетесь на задачу или кто-то откликнется на вашу."
          action={<Link href="/app/tasks"><Button>К задачам</Button></Link>} />
      ) : (
        <div className="flex flex-col gap-3">
          {threads.map((t) => {
            const otherId = t.customerId === me.id ? t.executorId : t.customerId;
            const other = db.users.find((u) => u.id === otherId);
            const task = db.tasks.find((x) => x.id === t.taskId);
            const last = chatService.messages(t.id).slice(-1)[0];
            return (
              <Card key={t.id} as={Link} {...{ href: `/app/messages/${t.id}` }}
                className="flex items-center gap-4 p-4 transition-transform hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-pop-sm">
                <Avatar src={other?.avatar} name={other?.name} size={52} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-extrabold">{other?.name ?? 'Собеседник'}</span>
                    <span className="shrink-0 text-xs text-faint">{timeAgo(t.lastMessageAt)}</span>
                  </div>
                  {task && <div className="truncate text-sm text-brand">{task.title}</div>}
                  {last && <p className="mt-0.5 truncate text-sm text-muted">{last.text}</p>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
