'use client';

import { useState } from 'react';
import { adminService } from '@/services/admin';
import { useDB, useMounted } from '@/hooks/useStore';
import { Badge, Button, Card, Field, Input, Select, Skeleton, Textarea } from '@/components/ui';
import { DataTable, PageHead } from '@/components/admin/Chrome';

export default function AdminNotifications() {
  const mounted = useMounted();
  useDB();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all');
  const [channel, setChannel] = useState('in-app');
  const [sent, setSent] = useState<{ sent: number } | null>(null);
  if (!mounted) return <Skeleton className="h-96" />;

  const history = adminService.getAuditLogs().filter((l) => l.action === 'Массовое уведомление');

  return (
    <div className="flex flex-col gap-5">
      <PageHead title="Рассылки" sub="Уведомления от имени платформы. Массовая рассылка — не инструмент для спама." />

      <Card className="grid gap-4 p-5 lg:grid-cols-2" pop={false}>
        <div className="flex flex-col gap-4">
          <Field label="Заголовок" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Технические работы 12 марта" />
          </Field>
          <Field label="Текст" required>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)}
              placeholder="Завтра с 03:00 до 04:00 приложение будет недоступно." />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Аудитория">
              <Select value={audience} onChange={(e) => setAudience(e.target.value)}>
                <option value="all">Все пользователи</option>
                <option value="executors">Только исполнители</option>
                <option value="customers">Только заказчики</option>
              </Select>
            </Field>
            <Field label="Канал" hint="Telegram и e-mail подключаются на backend">
              <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
                <option value="in-app">В приложении</option>
                <option value="telegram">Telegram</option>
                <option value="email">E-mail</option>
              </Select>
            </Field>
          </div>
          <Button disabled={!title.trim() || !body.trim()}
            onClick={() => setSent(adminService.sendNotification({ title, body, audience, channel }))}>
            Отправить сейчас
          </Button>
          {sent && (
            <div className="rounded-md border-2 border-ok bg-ok/10 px-3 py-2 text-sm font-bold text-ok">
              Уведомление добавлено в ленту приложения: {sent.sent} получателей.
              {channel !== 'in-app' && (
                <span className="mt-1 block text-warn">
                  Канал «{channel === 'telegram' ? 'Telegram' : 'E-mail'}» не подключён — наружу сообщение не ушло.
                </span>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 text-sm font-bold">Предпросмотр</div>
          <Card className="p-4">
            <Badge tone="brand">Система</Badge>
            <h3 className="mt-2 text-lg font-extrabold">{title || 'Заголовок уведомления'}</h3>
            <p className="mt-1 text-sm text-muted">{body || 'Текст уведомления появится здесь.'}</p>
          </Card>
        </div>
      </Card>

      <section>
        <h2 className="mb-2 text-lg font-extrabold">История рассылок</h2>
        <DataTable head={['Дата', 'Кто', 'Заголовок', 'Результат']}
          rows={history.map((l) => [
            new Date(l.at).toLocaleString('ru-RU'), `${l.adminName} (${l.adminRole})`, l.reason ?? '—', l.after ?? '—',
          ])}
          empty="Рассылок ещё не было" />
      </section>
    </div>
  );
}
