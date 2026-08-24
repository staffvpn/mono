'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import { taskService } from '@/services/catalog';
import { notificationService } from '@/services/comms';
import { useDB, useMounted } from '@/hooks/useStore';
import { parseTask, priceHint } from '@/lib/parseTask';
import { haptic } from '@/lib/telegram';
import { Badge, Button, Card, Chip, Field, Input, Select, Skeleton, Textarea, Toggle } from '@/components/ui';
import { ArtSearching, ArtDone } from '@/components/ui/art';
import { money } from '@/components/app/cards';
import type { Urgency } from '@/types';

type Step = 'idea' | 'confirm' | 'details' | 'done';

export default function CreateTaskPage() {
  const mounted = useMounted();
  const db = useDB();
  const router = useRouter();

  const [step, setStep] = useState<Step>('idea');
  const [raw, setRaw] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [timeWindow, setTimeWindow] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('flexible');
  const [budget, setBudget] = useState('');
  const [unknownPrice, setUnknownPrice] = useState(false);
  const [payMethod, setPayMethod] = useState<'card' | 'cash' | 'sbp' | 'any'>('any');
  const [extra, setExtra] = useState('');
  const [err, setErr] = useState('');
  const [createdId, setCreatedId] = useState('');

  const parsed = useMemo(() => (raw.trim() ? parseTask(raw, db.categories) : null), [raw, db.categories]);
  const hint = priceHint(categoryId);

  if (!mounted) return <Skeleton className="h-96" />;
  const me = authService.getCurrentUser();
  if (!me) return null;

  function acceptParse() {
    if (!parsed) return;
    setTitle(parsed.title || raw.slice(0, 60));
    setDescription(raw.trim());
    if (parsed.categoryId) setCategoryId(parsed.categoryId);
    if (parsed.date) setDate(parsed.date.slice(0, 10));
    if (parsed.timeWindow) setTimeWindow(parsed.timeWindow);
    if (parsed.urgency) setUrgency(parsed.urgency);
    if (parsed.budget) setBudget(String(parsed.budget));
    setStep('details');
    haptic('success');
  }

  function publish() {
    if (title.trim().length < 5) { setErr('Название слишком короткое — по нему выбирают, стоит ли открывать'); return; }
    if (description.trim().length < 15) { setErr('Опишите чуть подробнее: так отклики будут точнее'); return; }
    if (!categoryId) { setErr('Выберите категорию'); return; }
    if (!address.trim()) { setErr('Укажите адрес или район — хотя бы примерно'); return; }
    if (!unknownPrice && !Number(budget.replace(/\s/g, ''))) { setErr('Укажите бюджет или отметьте «не знаю цену»'); return; }

    const task = taskService.create({
      title: title.trim(), description: description.trim(), categoryId,
      address: address.trim(), city: me!.city, district: me!.district,
      date: date ? new Date(date).toISOString() : null,
      timeWindow: timeWindow || undefined, urgency,
      budget: unknownPrice ? null : Number(budget.replace(/\s/g, '')),
      budgetUnknown: unknownPrice, payMethod, photos: [], extraTerms: extra || undefined,
    }, me!.id);

    notificationService.push(me!.id, {
      kind: 'system', title: 'Задача опубликована',
      body: `«${task.title}» видна исполнителям рядом`, href: `/app/tasks/${task.id}`,
    });
    setCreatedId(task.id);
    setStep('done');
    haptic('success');
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Steps step={step} />

      {step === 'idea' && (
        <Card className="mt-6 p-6">
          <h1 className="text-2xl font-extrabold tracking-tight">Что нужно сделать?</h1>
          <p className="mt-2 text-[15px] text-muted">
            Напишите как есть, обычными словами. Разложим на поля сами — вы только проверите.
          </p>
          <div className="mt-5">
            <Textarea autoFocus rows={4} value={raw} onChange={(e) => setRaw(e.target.value)}
              placeholder="Нужно собрать шкаф икеа в субботу вечером, бюджет 3500 р" />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {['Собрать шкаф в субботу вечером',
              'Починить кран, течёт, срочно',
              'Отвезти документы завтра в центр'].map((s) => (
              <button key={s} onClick={() => setRaw(s)}
                className="rounded-full border-2 border-ink bg-card px-3 py-1.5 text-xs font-bold hover:bg-sand">
                {s}
              </button>
            ))}
          </div>

          {parsed && raw.trim().length > 8 && (
            <div className="mt-6 rounded-lg border-3 border-ink bg-surface p-5">
              <div className="flex items-center gap-2">
                <Badge tone="brand">Мы поняли так</Badge>
                <span className="text-xs text-faint">разбор по правилам, не AI</span>
              </div>
              <dl className="mt-4 grid gap-2.5 text-[15px]">
                <Row k="Задача" v={parsed.title || '—'} />
                <Row k="Категория" v={parsed.categoryName || 'не определили — выберете сами'} />
                <Row k="Дата" v={parsed.dateLabel || 'не указана'} />
                <Row k="Время" v={parsed.timeWindow || 'не указано'} />
                {parsed.budget && <Row k="Бюджет" v={money(parsed.budget)} />}
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={acceptParse}>Всё верно, дальше</Button>
                <Button variant="outline" onClick={() => { setDescription(raw); setStep('details'); }}>
                  Заполню сам
                </Button>
              </div>
            </div>
          )}

          {(!parsed || raw.trim().length <= 8) && (
            <div className="mt-6 flex items-center gap-4 rounded-lg border-2 border-dashed border-ink/40 p-5">
              <ArtSearching className="h-16 w-auto shrink-0" />
              <p className="text-sm text-muted">
                Пара предложений — и мы предложим категорию, дату и время. Ничего не отправится, пока вы не подтвердите.
              </p>
            </div>
          )}
        </Card>
      )}

      {step === 'details' && (
        <Card className="mt-6 flex flex-col gap-5 p-6">
          <h1 className="text-2xl font-extrabold tracking-tight">Проверьте детали</h1>

          <Field label="Название" required><Input value={title} onChange={(e) => { setTitle(e.target.value); setErr(''); }} /></Field>
          <Field label="Описание" required hint="Чем точнее, тем меньше уточняющих вопросов">
            <Textarea value={description} onChange={(e) => { setDescription(e.target.value); setErr(''); }} />
          </Field>

          <Field label="Категория" required>
            <div className="no-bar flex flex-wrap gap-2">
              {db.categories.filter((c) => !c.parentId && c.enabled).map((c) => (
                <Chip key={c.id} active={categoryId === c.id} onClick={() => { setCategoryId(c.id); setErr(''); }}>
                  <span aria-hidden>{c.emoji}</span>{c.name}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Адрес или район" required hint="Точный адрес увидит только выбранный исполнитель">
            <Input value={address} onChange={(e) => { setAddress(e.target.value); setErr(''); }} placeholder="ул. Тимура Фрунзе, 11" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Дата"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Время">
              <Select value={timeWindow} onChange={(e) => setTimeWindow(e.target.value)}>
                <option value="">Не важно</option>
                <option value="утро">Утро</option>
                <option value="день">День</option>
                <option value="вечер">Вечер</option>
              </Select>
            </Field>
          </div>

          <Field label="Насколько срочно">
            <div className="flex flex-wrap gap-2">
              {([['now', 'Прямо сейчас'], ['today', 'Сегодня'], ['this_week', 'На этой неделе'], ['flexible', 'Не горит']] as const).map(([v, l]) => (
                <Chip key={v} active={urgency === v} onClick={() => setUrgency(v)}>{l}</Chip>
              ))}
            </div>
          </Field>

          <Field label="Бюджет" required={!unknownPrice}
            hint={unknownPrice && hint ? `Похожие задачи обычно стоят ${money(hint.min)}–${money(hint.max)}. Ориентир, не обязательство.` : undefined}>
            <div className="flex flex-col gap-3">
              {!unknownPrice && (
                <Input inputMode="numeric" placeholder="3500" value={budget}
                  onChange={(e) => { setBudget(e.target.value.replace(/[^\d ]/g, '')); setErr(''); }} />
              )}
              <Toggle checked={unknownPrice} onChange={(v) => { setUnknownPrice(v); setErr(''); }} label="Не знаю цену" />
            </div>
          </Field>

          <Field label="Способ оплаты">
            <div className="flex flex-wrap gap-2">
              {([['any', 'Любой'], ['card', 'Картой'], ['sbp', 'СБП'], ['cash', 'Наличными']] as const).map(([v, l]) => (
                <Chip key={v} active={payMethod === v} onClick={() => setPayMethod(v)}>{l}</Chip>
              ))}
            </div>
          </Field>

          <Field label="Дополнительные условия" hint="Например: нужен свой инструмент, есть лифт, дома кот">
            <Input value={extra} onChange={(e) => setExtra(e.target.value)} />
          </Field>

          {err && <p role="alert" className="rounded-md border-2 border-danger bg-danger/10 px-3 py-2 text-sm font-bold text-danger">{err}</p>}

          <div className="flex flex-wrap gap-2">
            <Button size="lg" onClick={publish}>Опубликовать — бесплатно</Button>
            <Button size="lg" variant="ghost" onClick={() => setStep('idea')}>Назад</Button>
          </div>
        </Card>
      )}

      {step === 'done' && (
        <Card className="mt-6 flex flex-col items-center gap-4 p-10 text-center">
          <ArtDone />
          <h1 className="text-3xl font-extrabold tracking-tight">Задача опубликована</h1>
          <p className="max-w-[40ch] text-[15px] text-muted">
            Мы показали её подходящим исполнителям рядом. Как придут отклики — сообщим.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Button onClick={() => router.push(`/app/tasks/${createdId}`)}>Открыть задачу</Button>
            <Button variant="outline" onClick={() => router.push('/app/executors?task=' + createdId)}>
              Посмотреть исполнителей
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b-2 border-ink/10 pb-2 last:border-0">
      <dt className="text-faint">{k}</dt>
      <dd className="text-right font-bold">{v}</dd>
    </div>
  );
}

function Steps({ step }: { step: Step }) {
  const items: { k: Step; l: string }[] = [
    { k: 'idea', l: 'Опишите' }, { k: 'details', l: 'Детали' }, { k: 'done', l: 'Готово' },
  ];
  const idx = items.findIndex((i) => i.k === step);
  return (
    <ol className="flex items-center gap-2">
      {items.map((i, n) => (
        <li key={i.k} className="flex flex-1 items-center gap-2">
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-3 border-ink text-sm font-extrabold ${n <= idx ? 'bg-brand text-white' : 'bg-card'}`}>
            {n + 1}
          </span>
          <span className={`text-sm font-bold ${n <= idx ? '' : 'text-faint'}`}>{i.l}</span>
          {n < items.length - 1 && <span className="h-0.5 flex-1 bg-ink/20" />}
        </li>
      ))}
    </ol>
  );
}
