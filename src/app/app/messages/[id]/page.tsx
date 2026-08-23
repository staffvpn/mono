'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/auth';
import { chatService, notificationService } from '@/services/comms';
import { useDB, useMounted } from '@/hooks/useStore';
import { backButton, haptic } from '@/lib/telegram';
import { useRouter } from 'next/navigation';
import { Avatar, Badge, Button, Card, EmptyState, Input, Skeleton } from '@/components/ui';
import { ArtEmpty } from '@/components/ui/art';
import { cx } from '@/components/ui';

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const mounted = useMounted();
  const db = useDB();
  const router = useRouter();
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => backButton(true, () => router.back()), [router]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [db.messages.length]);

  if (!mounted) return <Skeleton className="h-96" />;
  const me = authService.getCurrentUser();
  const thread = chatService.get(id);
  if (!me) return null;
  if (!thread) return <EmptyState art={<ArtEmpty />} title="Чат не найден" />;

  const otherId = thread.customerId === me.id ? thread.executorId : thread.customerId;
  const other = db.users.find((u) => u.id === otherId);
  const task = db.tasks.find((t) => t.id === thread.taskId);
  const order = db.orders.find((o) => o.taskId === thread.taskId);
  const msgs = chatService.messages(thread.id);

  function send() {
    const v = text.trim();
    if (!v) return;
    chatService.send(thread!.id, me!.id, v);
    notificationService.push(otherId, {
      kind: 'message', title: 'Новое сообщение', body: v.slice(0, 60), href: `/app/messages/${thread!.id}`,
    });
    setText('');
    haptic('light');
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-190px)] w-full max-w-3xl flex-col lg:h-[calc(100dvh-160px)]">
      <Card className="mb-3 flex items-center gap-3 p-3">
        <Link href="/app/messages" aria-label="Назад"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-ink lg:hidden">←</Link>
        <Avatar src={other?.avatar} name={other?.name} size={44} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-extrabold">{other?.name}</div>
          {task && <Link href={`/app/tasks/${task.id}`} className="truncate text-sm text-brand">{task.title}</Link>}
        </div>
        {order && (
          <Link href={`/app/orders/${order.id}`}><Button size="sm" variant="outline">Заказ</Button></Link>
        )}
      </Card>

      <div className="flex-1 overflow-y-auto rounded-xl border-3 border-ink bg-card p-4">
        <div className="flex flex-col gap-3">
          {msgs.map((m) => {
            const mine = m.authorId === me.id;
            if (m.kind === 'system') {
              return (
                <div key={m.id} className="mx-auto max-w-[80%] rounded-full border-2 border-ink bg-surface px-4 py-2 text-center text-xs font-bold">
                  {m.text}
                </div>
              );
            }
            return (
              <div key={m.id} className={cx('max-w-[80%] rounded-lg border-3 border-ink px-4 py-2.5',
                mine ? 'ml-auto bg-brand text-white' : 'bg-surface')}>
                <p className="whitespace-pre-line text-[15px] leading-relaxed">{m.text}</p>
                <span className={cx('mt-1 block text-[11px]', mine ? 'text-white/70' : 'text-faint')}>
                  {new Date(m.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>

      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Написать сообщение…" aria-label="Сообщение" />
        <Button type="submit" aria-label="Отправить">→</Button>
      </form>
      <p className="mt-2 text-center text-xs text-faint">
        Не переводите деньги напрямую до фиксации условий — иначе спор защитить не сможет.
      </p>
    </div>
  );
}
