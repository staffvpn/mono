'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/auth';
import { orderService, paymentService } from '@/services/catalog';
import { chatService, disputeService, notificationService, reviewService } from '@/services/comms';
import { useDB, useMounted } from '@/hooks/useStore';
import { CONFIG } from '@/lib/config';
import { haptic } from '@/lib/telegram';
import {
  Avatar, Badge, Button, Card, EmptyState, Field, Modal, Select, Skeleton, StarPicker, Textarea,
} from '@/components/ui';
import { ArtDeal, ArtDone, ArtMoney, ArtEmpty, ArtDispute } from '@/components/ui/art';
import { money } from '@/components/app/cards';
import { ORDER_LABEL } from '@/lib/orderStatus';
import type { DisputeReason } from '@/types';

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const mounted = useMounted();
  const db = useDB();
  const [busy, setBusy] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [reviewText, setReviewText] = useState('');
  const [dReason, setDReason] = useState<DisputeReason>('executor_no_show');
  const [dComment, setDComment] = useState('');

  if (!mounted) return <Skeleton className="h-96" />;
  const me = authService.getCurrentUser();
  const order = orderService.get(id);
  if (!me) return null;
  if (!order) return <EmptyState art={<ArtEmpty />} title="Заказ не найден" />;

  const isCustomer = order.customerId === me.id;
  const other = db.users.find((u) => u.id === (isCustomer ? order.executorId : order.customerId));
  const task = db.tasks.find((t) => t.id === order.taskId);
  const payment = db.payments.find((p) => p.id === order.paymentId);
  const last = order.changes[order.changes.length - 1];
  const bothAgreed = last.acceptedByCustomer && last.acceptedByExecutor;
  const myAgreed = isCustomer ? last.acceptedByCustomer : last.acceptedByExecutor;
  const commission = Math.round((order.terms.price * order.commissionPercent) / 100);
  const status = ORDER_LABEL[order.status];
  const alreadyReviewed = isCustomer ? order.reviewedByCustomer : order.reviewedByExecutor;

  function confirm() {
    orderService.confirmTerms(order!.id, isCustomer ? 'customer' : 'executor');
    const th = chatService.findOrCreate(order!.taskId, order!.customerId, order!.executorId);
    chatService.system(th.id, `${me!.name} подтвердил условия.`);
    haptic('success');
  }

  async function pay() {
    setBusy(true);
    try {
      await paymentService.createPayment(order!.id, order!.terms.price);
      orderService.update(order!.id, { status: 'in_progress' });
      const th = chatService.findOrCreate(order!.taskId, order!.customerId, order!.executorId);
      chatService.system(th.id, 'Оплата получена, деньги зарезервированы. Можно приступать.');
      notificationService.push(order!.executorId, {
        kind: 'payment', title: 'Деньги зарезервированы',
        body: 'Заказчик оплатил. Можно приступать к работе.', href: `/app/orders/${order!.id}`,
      });
      haptic('success');
    } finally { setBusy(false); }
  }

  async function accept() {
    setBusy(true);
    try {
      if (order!.paymentId) await paymentService.releasePayment(order!.paymentId);
      orderService.update(order!.id, { status: 'completed', completedAt: new Date().toISOString() });
      notificationService.push(order!.executorId, {
        kind: 'completed', title: 'Работа принята',
        body: `Деньги отправлены: ${money(order!.terms.price - commission)}`, href: `/app/orders/${order!.id}`,
      });
      haptic('success');
      setRateOpen(true);
    } finally { setBusy(false); }
  }

  function saveReview() {
    reviewService.create({
      orderId: order!.id, authorId: me!.id, targetId: other!.id,
      direction: isCustomer ? 'customer_to_executor' : 'executor_to_customer',
      scores, text: reviewText.trim(),
    });
    haptic('success');
    setRateOpen(false);
  }

  function openDispute() {
    disputeService.open({
      orderId: order!.id, openedBy: me!.id, reason: dReason, comment: dComment.trim(), evidence: [],
    });
    haptic('error');
    setDisputeOpen(false);
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="flex flex-col gap-5">
        <div>
          <Badge tone={status.tone}>{status.l}</Badge>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Договорились</h1>
          <p className="mt-1 text-[15px] text-muted">Заказ {order.id}</p>
        </div>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-extrabold">Условия</h2>
          <dl className="flex flex-col gap-3">
            <Term k="Что делаем" v={order.terms.what} />
            <Term k="Цена" v={money(order.terms.price)} big />
            <Term k="Когда" v={`${order.terms.date ? new Date(order.terms.date).toLocaleDateString('ru-RU') : 'по договорённости'}${order.terms.timeWindow ? `, ${order.terms.timeWindow}` : ''}`} />
            <Term k="Где" v={order.terms.place} />
            {order.terms.extra && <Term k="Дополнительно" v={order.terms.extra} />}
          </dl>

          <div className="mt-5 rounded-md border-2 border-ink bg-surface p-4 text-sm">
            <div className="flex justify-between"><span>Цена работы</span><b>{money(order.terms.price)}</b></div>
            <div className="mt-1.5 flex justify-between text-muted">
              <span>Комиссия площадки ({order.commissionPercent}%)</span><span>{money(commission)}</span>
            </div>
            <div className="mt-1.5 flex justify-between border-t-2 border-ink/15 pt-1.5">
              <span>Исполнитель получит</span><b>{money(order.terms.price - commission)}</b>
            </div>
          </div>

          {order.status === 'created' && (
            <div className="mt-5">
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge tone={last.acceptedByCustomer ? 'ok' : 'neutral'}>
                  Заказчик {last.acceptedByCustomer ? 'подтвердил' : 'не подтвердил'}
                </Badge>
                <Badge tone={last.acceptedByExecutor ? 'ok' : 'neutral'}>
                  Исполнитель {last.acceptedByExecutor ? 'подтвердил' : 'не подтвердил'}
                </Badge>
              </div>
              {!myAgreed ? (
                <Button size="lg" onClick={confirm}>Подтвердить условия</Button>
              ) : (
                <p className="text-[15px] text-muted">Вы подтвердили. Ждём вторую сторону.</p>
              )}
            </div>
          )}

          {bothAgreed && order.status !== 'created' && (
            <p className="mt-5 rounded-md border-2 border-ok bg-ok/10 px-4 py-3 text-sm font-bold text-ok">
              Условия зафиксированы. Любое изменение создаёт новое предложение и требует согласия обеих сторон.
            </p>
          )}
        </Card>

        {order.status === 'awaiting_payment' && isCustomer && (
          <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
            <ArtMoney className="h-20 w-20 shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-extrabold">Оплата</h3>
              <p className="mt-1 text-[15px] text-muted">
                Деньги резервируются на защищённом счёте и уходят исполнителю только после того, как вы примете работу.
              </p>
              {CONFIG.useMock && (
                <p className="mt-3 rounded-md border-2 border-warn bg-warn/10 px-3 py-2 text-sm font-bold text-warn">
                  Демо-режим: платёжный провайдер не подключён. Кнопка меняет статус заказа, списания не происходит.
                </p>
              )}
            </div>
            <Button onClick={pay} loading={busy}>Оплатить {money(order.terms.price)}</Button>
          </Card>
        )}

        {order.status === 'in_progress' && (
          <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
            <ArtDone className="h-20 w-20 shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-extrabold">{isCustomer ? 'Работа выполнена?' : 'Работа в процессе'}</h3>
              <p className="mt-1 text-[15px] text-muted">
                {isCustomer
                  ? 'Подтверждайте только после того, как всё проверили: после подтверждения деньги уходят исполнителю.'
                  : 'Как закончите — заказчик подтвердит выполнение, и деньги придут вам.'}
              </p>
            </div>
            {isCustomer && <Button onClick={accept} loading={busy}>Принять работу</Button>}
          </Card>
        )}

        {order.status === 'completed' && (
          <Card className="flex flex-col items-center gap-4 p-8 text-center">
            <ArtDone />
            <h3 className="text-2xl font-extrabold">Заказ закрыт</h3>
            <p className="text-[15px] text-muted">
              {payment?.status === 'released' ? 'Деньги отправлены исполнителю.' : 'Платёж обрабатывается.'}
            </p>
            {!alreadyReviewed && <Button onClick={() => setRateOpen(true)}>Оценить</Button>}
            {isCustomer && (
              <Link href={`/app/executors/${order.executorId}`}>
                <Button variant="outline">Позвать снова</Button>
              </Link>
            )}
          </Card>
        )}

        {order.status === 'disputed' && (
          <Card className="flex items-center gap-4 border-danger p-6">
            <ArtDispute className="h-20 w-20 shrink-0" />
            <div>
              <h3 className="text-lg font-extrabold">Открыт спор</h3>
              <p className="mt-1 text-[15px] text-muted">
                Средства удерживаются до решения. Поддержка изучает заказ, условия, переписку и платёж.
              </p>
            </div>
          </Card>
        )}
      </div>

      <aside className="flex flex-col gap-4">
        {other && (
          <Card className="p-5">
            <h3 className="mb-3 font-extrabold">{isCustomer ? 'Исполнитель' : 'Заказчик'}</h3>
            <Link href={`/app/executors/${other.id}`} className="flex items-center gap-3">
              <Avatar src={other.avatar} name={other.name} size={48} />
              <div><div className="font-extrabold">{other.name}</div>
                <div className="text-sm text-muted">{other.city}</div></div>
            </Link>
            <Link href={`/app/messages?user=${other.id}&task=${order.taskId}`} className="mt-4 block">
              <Button variant="outline" className="w-full">Написать</Button>
            </Link>
          </Card>
        )}

        {task && (
          <Card className="p-5">
            <h3 className="mb-2 font-extrabold">Задача</h3>
            <Link href={`/app/tasks/${task.id}`} className="text-[15px] font-bold text-brand">{task.title}</Link>
          </Card>
        )}

        {payment && (
          <Card className="p-5">
            <h3 className="mb-3 font-extrabold">Платёж</h3>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between"><dt className="text-faint">Статус</dt><dd className="font-bold">
                {{ pending: 'Обрабатывается', held: 'Зарезервирован', released: 'Отправлен исполнителю', failed: 'Ошибка', refunded: 'Возвращён' }[payment.status]}
              </dd></div>
              <div className="flex justify-between"><dt className="text-faint">Сумма</dt><dd className="font-bold">{money(payment.amount)}</dd></div>
              <div className="flex justify-between"><dt className="text-faint">Комиссия</dt><dd>{money(payment.commission)}</dd></div>
            </dl>
          </Card>
        )}

        {['paid', 'in_progress', 'completed'].includes(order.status) && order.status !== 'disputed' && (
          <Button variant="outline" onClick={() => setDisputeOpen(true)}>Возникла проблема</Button>
        )}
      </aside>

      {/* ---------- Оценка ---------- */}
      <Modal open={rateOpen} onClose={() => setRateOpen(false)} title="Как всё прошло?">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            {(isCustomer
              ? [['quality', 'Качество'], ['deadline', 'Срок'], ['communication', 'Общение'], ['priceMatch', 'Цена соответствовала']]
              : [['adequacy', 'Адекватность'], ['descriptionMatch', 'Описание совпало'], ['punctuality', 'Пунктуальность'], ['payment', 'Оплата'], ['communication', 'Общение']]
            ).map(([k, l]) => (
              <StarPicker key={k} label={l} value={scores[k] ?? 0} onChange={(v) => setScores((s) => ({ ...s, [k]: v }))} />
            ))}
          </div>
          <Field label="Комментарий">
            <Textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)}
              placeholder="Что понравилось, что можно улучшить" />
          </Field>
          <Button size="lg" onClick={saveReview} disabled={Object.keys(scores).length === 0}>Отправить оценку</Button>
        </div>
      </Modal>

      {/* ---------- Спор ---------- */}
      <Modal open={disputeOpen} onClose={() => setDisputeOpen(false)} title="Помощь с заказом">
        <div className="flex flex-col gap-4">
          <p className="text-[15px] text-muted">
            Опишите, что произошло. Пока идёт разбирательство, средства остаются зарезервированными.
          </p>
          <Field label="Что случилось" required>
            <Select value={dReason} onChange={(e) => setDReason(e.target.value as DisputeReason)}>
              <option value="executor_no_show">Исполнитель не пришёл</option>
              <option value="customer_no_show">Заказчик не пришёл</option>
              <option value="bad_work">Работа выполнена плохо</option>
              <option value="no_payment">Не оплатили</option>
              <option value="terms_changed">Изменились условия</option>
              <option value="description_mismatch">Описание не соответствовало реальности</option>
              <option value="other">Другое</option>
            </Select>
          </Field>
          <Field label="Подробности" required>
            <Textarea value={dComment} onChange={(e) => setDComment(e.target.value)}
              placeholder="Что именно пошло не так, когда и что вы уже пробовали" />
          </Field>
          <Button size="lg" variant="danger" onClick={openDispute} disabled={dComment.trim().length < 10}>
            Открыть спор
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Term({ k, v, big }: { k: string; v: string; big?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b-2 border-ink/10 pb-2.5 last:border-0">
      <dt className="text-faint">{k}</dt>
      <dd className={big ? 'text-right text-2xl font-extrabold' : 'text-right font-bold'}>{v}</dd>
    </div>
  );
}
