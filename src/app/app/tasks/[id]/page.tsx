'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import {
  applicationService, favoriteService, matchingService, orderService, taskService,
} from '@/services/catalog';
import { chatService, notificationService } from '@/services/comms';
import { useDB, useMounted } from '@/hooks/useStore';
import { haptic } from '@/lib/telegram';
import {
  Badge, Button, Card, Field, Input, Modal, Rating, Skeleton, Textarea, Avatar, EmptyState,
} from '@/components/ui';
import { ArtReply, ArtEmpty } from '@/components/ui/art';
import { ApplicationRow, RelevanceBadge, budgetLabel, money, timeAgo } from '@/components/app/cards';

export default function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const mounted = useMounted();
  const db = useDB();
  const router = useRouter();
  const [applyOpen, setApplyOpen] = useState(false);
  const [price, setPrice] = useState('');
  const [comment, setComment] = useState('');
  const [start, setStart] = useState('сегодня');
  const [hours, setHours] = useState('');
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);

  if (!mounted) return <Skeleton className="h-96" />;

  const me = authService.getCurrentUser();
  const task = taskService.get(id);
  if (!me) return null;

  if (!task) {
    return (
      <EmptyState art={<ArtEmpty />} title="Задача не найдена"
        text="Возможно, её сняли с публикации или ссылка устарела."
        action={<Link href="/app/tasks"><Button>К списку задач</Button></Link>} />
    );
  }

  const author = db.users.find((u) => u.id === task.authorId);
  const isMine = task.authorId === me.id;
  const apps = applicationService.forTask(task.id);
  const match = matchingService.scoreTaskForUser(task, me);
  const alreadyApplied = applicationService.exists(task.id, me.id);
  const fav = favoriteService.has(me.id, 'task', task.id);
  const category = db.categories.find((c) => c.id === task.categoryId);

  function submitApply() {
    const p = Number(price.replace(/\s/g, ''));
    if (!p || p < 100) { setErr('Укажите цену — хотя бы примерную'); return; }
    if (comment.trim().length < 10) { setErr('Пара слов о том, как будете делать, сильно повышает шанс'); return; }
    applicationService.create({
      taskId: task!.id, executorId: me!.id, price: p, comment: comment.trim(),
      durationHours: hours ? Number(hours) : undefined, canStart: start,
    });
    const thread = chatService.findOrCreate(task!.id, task!.authorId, me!.id);
    chatService.send(thread.id, me!.id, `Откликнулся на «${task!.title}». Цена: ${money(p)}. ${comment.trim()}`);
    notificationService.push(task!.authorId, {
      kind: 'application', title: 'Новый отклик',
      body: `${me!.name} откликнулся на «${task!.title}»`, href: `/app/tasks/${task!.id}`,
    });
    haptic('success');
    setSent(true);
  }

  function choose(appId: string) {
    const app = apps.find((a) => a.id === appId)!;
    const order = orderService.createFromApplication(app, me!.id, task!);
    const thread = chatService.findOrCreate(task!.id, me!.id, app.executorId);
    chatService.system(thread.id, 'Заказчик выбрал исполнителя. Осталось подтвердить условия с обеих сторон.');
    notificationService.push(app.executorId, {
      kind: 'order', title: 'Вас выбрали!',
      body: `«${task!.title}» — осталось подтвердить условия`, href: `/app/orders/${order.id}`,
    });
    haptic('success');
    router.push(`/app/orders/${order.id}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="flex flex-col gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <RelevanceBadge task={task} />
            {category && <Badge tone="sand"><span aria-hidden>{category.emoji}</span>{category.name}</Badge>}
            {task.urgency === 'now' && <Badge tone="danger">Срочно</Badge>}
            {task.moderation === 'on_review' && <Badge tone="warn">На модерации</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{task.title}</h1>
          <p className="mt-1.5 text-sm text-faint">Опубликована {timeAgo(task.createdAt)} · {task.viewsCount} просмотров</p>
        </div>

        {task.photos.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {task.photos.map((src) => (
              <div key={src} className="aspect-[4/3] overflow-hidden rounded-lg border-3 border-ink bg-sand bg-cover bg-center"
                style={{ backgroundImage: `url("${src}")` }} role="img" aria-label="Фото задачи" />
            ))}
          </div>
        )}

        <Card className="p-6">
          <h2 className="text-lg font-extrabold">Что нужно сделать</h2>
          <p className="mt-2 whitespace-pre-line text-[16px] leading-relaxed">{task.description}</p>
          {task.extraTerms && (
            <p className="mt-4 rounded-md border-2 border-ink bg-surface p-3 text-[15px]">
              <b>Дополнительно:</b> {task.extraTerms}
            </p>
          )}
        </Card>

        <Card className="grid gap-4 p-6 sm:grid-cols-2">
          <Info label="Бюджет" value={budgetLabel(task)} big />
          <Info label="Оплата" value="Через TEYDO, деньги в резерве до приёмки" />
          <Info label="Где" value={`${task.geo.address}${task.geo.district ? `, ${task.geo.district}` : ''}`} />
          <Info label="Когда" value={task.date ? new Date(task.date).toLocaleDateString('ru-RU') + (task.timeWindow ? `, ${task.timeWindow}` : '') : (task.timeWindow || 'По договорённости')} />
        </Card>

        {isMine && (
          <section>
            <h2 className="mb-4 text-xl font-extrabold tracking-tight">
              Отклики <span className="text-muted">({apps.length})</span>
            </h2>
            {apps.length === 0 ? (
              <EmptyState art={<ArtEmpty />} title="Пока никто не откликнулся"
                text="Обычно первые отклики приходят в течение часа. Мы подберём людей ещё раз." />
            ) : (
              <div className="flex flex-col gap-4">
                {apps.map((a) => (
                  <ApplicationRow key={a.id} app={a} executor={db.users.find((u) => u.id === a.executorId)}
                    action={
                      task.orderId ? (
                        a.status === 'accepted' ? <Badge tone="ok">Выбран</Badge> : null
                      ) : (
                        <>
                          <Button size="sm" onClick={() => choose(a.id)}>Выбрать исполнителя</Button>
                          <Link href={`/app/messages?task=${task.id}&user=${a.executorId}`}>
                            <Button size="sm" variant="outline">Написать</Button>
                          </Link>
                        </>
                      )
                    } />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* ---------- Боковая колонка ---------- */}
      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        {!isMine && match.score > 0 && (
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-3 border-ink bg-brand text-lg font-extrabold text-white">
                {match.score}%
              </span>
              <div>
                <div className="font-extrabold">подходит вам</div>
                <p className="text-sm text-muted">{match.reasons.join(' · ') || 'Базовое совпадение по профилю'}</p>
              </div>
            </div>
          </Card>
        )}

        {!isMine && (
          <Card className="flex flex-col gap-3 p-5">
            {alreadyApplied ? (
              <>
                <Badge tone="ok">Вы уже откликнулись</Badge>
                <Link href="/app/messages"><Button variant="outline" className="w-full">Перейти в чат</Button></Link>
              </>
            ) : (
              <>
                <Button size="lg" onClick={() => setApplyOpen(true)}>Откликнуться бесплатно</Button>
                <p className="text-center text-xs text-faint">Спокойно. Этот отклик ничего тебе не стоит.</p>
              </>
            )}
            <Button variant="ghost" onClick={() => { favoriteService.toggle(me.id, 'task', task.id); haptic('select'); }}>
              {fav ? '★ В избранном' : '☆ В избранное'}
            </Button>
          </Card>
        )}

        {isMine && (
          <Card className="flex flex-col gap-3 p-5">
            <h3 className="font-extrabold">Задача ещё актуальна?</h3>
            <p className="text-sm text-muted">
              Если не подтвердить, задача опустится в выдаче — так исполнители не тратят время впустую.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { taskService.setRelevance(task.id, 'active'); haptic('success'); }}>Да, ищу</Button>
              <Button size="sm" variant="outline" onClick={() => { taskService.setRelevance(task.id, 'inactive'); }}>Уже не нужно</Button>
            </div>
          </Card>
        )}

        {author && (
          <Card className="p-5">
            <h3 className="mb-3 font-extrabold">Заказчик</h3>
            <Link href={`/app/executors/${author.id}`} className="flex items-center gap-3">
              <Avatar src={author.avatar} name={author.name} size={48} />
              <div>
                <div className="font-extrabold">{author.name}</div>
                <Rating value={author.reputation.rating} count={author.reputation.reviewsCount} size="sm" />
              </div>
            </Link>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-faint">Заказов</dt><dd className="font-bold">{author.reputation.ordersCompleted}</dd></div>
              <div><dt className="text-faint">Успешных</dt>
                <dd className="font-bold">{author.reputation.successRate === null ? '—' : `${Math.round(author.reputation.successRate * 100)}%`}</dd></div>
            </dl>
          </Card>
        )}

        <Link href={`/app/help?task=${task.id}`} className="text-center text-sm font-bold text-brand">
          Пожаловаться на задачу
        </Link>
      </aside>

      {/* ---------- Форма отклика ---------- */}
      <Modal open={applyOpen} onClose={() => { setApplyOpen(false); setSent(false); }} title={sent ? undefined : 'Ваш отклик'}>
        {sent ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <ArtReply />
            <h3 className="text-2xl font-extrabold">Отклик ушёл</h3>
            <p className="text-[15px] text-muted">
              Заказчик увидит его в списке. Как ответит — придёт уведомление.
            </p>
            <div className="flex gap-2">
              <Link href="/app/messages"><Button>Перейти в чат</Button></Link>
              <Button variant="outline" onClick={() => { setApplyOpen(false); setSent(false); }}>Закрыть</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Field label="Ваша цена" required hint={`Заказчик указал: ${budgetLabel(task)}`}>
              <Input inputMode="numeric" placeholder="3500" value={price}
                onChange={(e) => { setPrice(e.target.value.replace(/[^\d ]/g, '')); setErr(''); }} />
            </Field>
            <Field label="Комментарий" required hint="Как будете делать, что берёте с собой, есть ли опыт">
              <Textarea placeholder="Возьмусь сегодня вечером, инструмент свой…" value={comment}
                onChange={(e) => { setComment(e.target.value); setErr(''); }} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Когда можете начать"><Input value={start} onChange={(e) => setStart(e.target.value)} /></Field>
              <Field label="Сколько займёт, часов"><Input inputMode="numeric" placeholder="3" value={hours}
                onChange={(e) => setHours(e.target.value.replace(/\D/g, ''))} /></Field>
            </div>
            {err && <p role="alert" className="rounded-md border-2 border-danger bg-danger/10 px-3 py-2 text-sm font-bold text-danger">{err}</p>}
            <Button size="lg" onClick={submitApply}>Отправить отклик</Button>
            <p className="text-center text-xs text-faint">Спокойно. Этот отклик ничего тебе не стоит.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Info({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-faint">{label}</div>
      <div className={big ? 'mt-1 text-2xl font-extrabold tracking-tight' : 'mt-1 text-[15px] font-bold'}>{value}</div>
    </div>
  );
}
