'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth';
import { supportService, disputeService } from '@/services/comms';
import { getDB, commit, uid, nowISO } from '@/services/store';
import { useDB, useMounted } from '@/hooks/useStore';
import { haptic } from '@/lib/telegram';
import { Badge, Button, Card, Field, Select, Skeleton, Textarea } from '@/components/ui';
import { ArtSupport, ArtDone } from '@/components/ui/art';

const TOPICS = [
  'Меня обманули', 'Исполнитель не пришёл', 'Проблема с оплатой', 'Проблема с заказом',
  'Проблема с отзывом', 'Проблема с аккаунтом', 'Другое',
];

export default function HelpPage() {
  const mounted = useMounted();
  const db = useDB();
  const params = useSearchParams();
  const reportTask = params.get('task');
  const reportUser = params.get('user');
  const [topic, setTopic] = useState(TOPICS[0]);
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);

  if (!mounted) return <Skeleton className="h-64" />;
  const me = authService.getCurrentUser();
  if (!me) return null;

  const isReport = !!(reportTask || reportUser);
  const myTickets = supportService.list(me.id);
  const myDisputes = disputeService.list(me.id);

  function send() {
    if (isReport) {
      const d = getDB();
      d.reports.unshift({
        id: uid('r'), reporterId: me!.id,
        targetKind: reportTask ? 'task' : 'user',
        targetId: (reportTask || reportUser)!,
        reason: topic, comment: text.trim(), attachments: [], status: 'new', createdAt: nowISO(),
      });
      commit();
    } else {
      supportService.create({ userId: me!.id, topic, message: text.trim() });
    }
    haptic('success');
    setDone(true);
  }

  if (done) {
    return (
      <Card className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 p-10 text-center">
        <ArtDone />
        <h1 className="text-2xl font-extrabold">Обращение принято</h1>
        <p className="text-[15px] text-muted">
          Поддержка изучит материалы и ответит. Если дело касается заказа, средства остаются зарезервированными.
        </p>
        <Link href="/app"><Button>На главную</Button></Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-4">
        <ArtSupport className="h-20 w-20 shrink-0" />
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{isReport ? 'Пожаловаться' : 'Что случилось?'}</h1>
          <p className="mt-1 text-[15px] text-muted">
            Опишите ситуацию своими словами. Разберёмся.
          </p>
        </div>
      </div>

      <Card className="flex flex-col gap-4 p-6">
        <Field label="Тема" required>
          <Select value={topic} onChange={(e) => setTopic(e.target.value)}>
            {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Подробности" required hint="Что произошло, когда, какой заказ. Чем конкретнее, тем быстрее решим.">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} />
        </Field>
        <Button size="lg" onClick={send} disabled={text.trim().length < 10}>Отправить</Button>
      </Card>

      {myDisputes.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-3 text-lg font-extrabold">Мои споры</h2>
          <div className="flex flex-col gap-2">
            {myDisputes.map((d) => (
              <Link key={d.id} href={`/app/orders/${d.orderId}`}
                className="flex items-center justify-between gap-3 rounded-md border-2 border-ink bg-surface px-4 py-3">
                <span className="text-[15px] font-bold">Заказ {d.orderId}</span>
                <Badge tone={d.status === 'resolved' ? 'ok' : 'warn'}>
                  {{ open: 'Открыт', in_review: 'На рассмотрении', need_info: 'Нужны данные', resolved: 'Решён', closed: 'Закрыт' }[d.status]}
                </Badge>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {myTickets.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-3 text-lg font-extrabold">Мои обращения</h2>
          <div className="flex flex-col gap-2">
            {myTickets.map((t) => (
              <div key={t.id} className="rounded-md border-2 border-ink bg-surface px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold">{t.topic}</span>
                  <Badge tone={t.status === 'resolved' ? 'ok' : 'neutral'}>
                    {{ new: 'Новое', open: 'В работе', waiting_user: 'Ждём вас', waiting_admin: 'На стороне поддержки', resolved: 'Решено', closed: 'Закрыто' }[t.status]}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{t.message}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <p className="text-center text-sm text-faint">
        Категорий {db.categories.length} · поддержка отвечает в рабочие часы
      </p>
    </div>
  );
}
