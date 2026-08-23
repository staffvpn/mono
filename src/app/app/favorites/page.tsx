'use client';

import Link from 'next/link';
import { useState } from 'react';
import { authService } from '@/services/auth';
import { favoriteService } from '@/services/catalog';
import { useDB, useMounted } from '@/hooks/useStore';
import { Button, EmptyState, Skeleton, Tabs } from '@/components/ui';
import { ArtEmpty } from '@/components/ui/art';
import { TaskCard, UserCard } from '@/components/app/cards';

export default function FavoritesPage() {
  const mounted = useMounted();
  const db = useDB();
  const [tab, setTab] = useState<'tasks' | 'users'>('tasks');
  if (!mounted) return <Skeleton className="h-64" />;

  const me = authService.getCurrentUser();
  if (!me) return null;

  const favs = favoriteService.list(me.id);
  const tasks = favs.filter((f) => f.kind === 'task').map((f) => db.tasks.find((t) => t.id === f.targetId)).filter(Boolean);
  const users = favs.filter((f) => f.kind === 'user').map((f) => db.users.find((u) => u.id === f.targetId)).filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Избранное</h1>
      <Tabs value={tab} onChange={setTab}
        tabs={[{ key: 'tasks', label: 'Задачи', count: tasks.length }, { key: 'users', label: 'Исполнители', count: users.length }]} />

      {tab === 'tasks' && (tasks.length === 0 ? (
        <EmptyState art={<ArtEmpty />} title="Здесь будут задачи, которых ты не хочешь потерять"
          text="Нажмите на звёздочку в карточке задачи — она окажется тут."
          action={<Link href="/app/tasks"><Button>К задачам</Button></Link>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tasks.map((t) => <TaskCard key={t!.id} task={t!} href={`/app/tasks/${t!.id}`} />)}
        </div>
      ))}

      {tab === 'users' && (users.length === 0 ? (
        <EmptyState art={<ArtEmpty />} title="Здесь будут люди, которых ты не хочешь потерять"
          text="Понравился исполнитель — добавьте в избранное и позовите снова."
          action={<Link href="/app/executors"><Button>К исполнителям</Button></Link>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {users.map((u) => (
            <UserCard key={u!.id} user={u!} href={`/app/executors/${u!.id}`}
              action={<Link href={`/app/messages?user=${u!.id}`}><Button size="sm">Позвать снова</Button></Link>} />
          ))}
        </div>
      ))}
    </div>
  );
}
