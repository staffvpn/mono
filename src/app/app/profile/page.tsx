'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import { commit, getDB, resetDB } from '@/services/store';
import { useDB, useMounted } from '@/hooks/useStore';
import { haptic } from '@/lib/telegram';
import {
  Avatar, Badge, Button, Card, Chip, Field, Input, Modal, Rating, Select, Skeleton, Textarea, Toggle,
} from '@/components/ui';
import { CONFIG } from '@/lib/config';
import type { ExecutorProfile, User } from '@/types';
import { MockBanner } from '@/components/ui';

const AVATARS = [
  ...Array.from({ length: 10 }, (_, i) => `/av/man-${String(i + 1).padStart(2, '0')}.webp`),
  ...Array.from({ length: 10 }, (_, i) => `/av/girl-${String(i + 1).padStart(2, '0')}.webp`),
];

export default function ProfilePage() {
  const mounted = useMounted();
  const db = useDB();
  const router = useRouter();
  const [avOpen, setAvOpen] = useState(false);
  const [avKind, setAvKind] = useState<'man' | 'girl'>('man');
  const [edit, setEdit] = useState(false);

  if (!mounted) return <Skeleton className="h-96" />;
  const me = authService.getCurrentUser();
  if (!me) return null;

  const myId = me.id;
  function patch(fn: (u: User) => User) {
    const d = getDB();
    d.users = d.users.map((u) => (u.id === myId ? fn(u) : u));
    commit();
  }

  function setAvatar(src: string) {
    patch((u) => ({ ...u, avatar: src }));
    haptic('select');
  }

  function upload(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const c = document.createElement('canvas');
        c.width = c.height = 320;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 320, 320);
        let data = c.toDataURL('image/webp', 0.85);
        if (!data.startsWith('data:image/webp')) data = c.toDataURL('image/jpeg', 0.85);
        setAvatar(data);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  const ver = (k: string) => me.verifications.find((v) => v.kind === k);
  const ex = me.executor;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      {CONFIG.useMock && <MockBanner />}

      <Card className="p-6">
        <div className="flex flex-wrap items-start gap-4">
          <button onClick={() => setAvOpen(true)} className="relative shrink-0" aria-label="Сменить аватар">
            <Avatar src={me.avatar} name={me.name} size={84} />
            <span aria-hidden className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-3 border-ink bg-brand text-lg font-bold text-white">+</span>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight">{me.name}</h1>
            {me.username && <p className="text-[15px] text-muted">@{me.username}</p>}
            <div className="mt-2"><Rating value={me.reputation.rating} count={me.reputation.reviewsCount} /></div>
            <p className="mt-1 text-sm text-faint">
              {me.city} · с {new Date(me.createdAt).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(['telegram', 'phone', 'identity'] as const).map((k) => {
            const v = ver(k);
            const label = { telegram: 'Telegram', phone: 'Телефон', identity: 'Личность' }[k];
            if (v?.status === 'approved') return <Badge key={k} tone="ok">{label} подтверждён</Badge>;
            if (v?.status === 'pending') return <Badge key={k} tone="warn">{label}: на проверке</Badge>;
            return <Badge key={k} tone="neutral">{label} не подтверждён</Badge>;
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-extrabold">Режим</h2>
        <div className="flex gap-2">
          {(['customer', 'executor'] as const).map((r) => (
            <Chip key={r} active={me.activeRole === r} onClick={() => { authService.setRole(r); haptic('select'); }}>
              {r === 'customer' ? 'Заказчик' : 'Исполнитель'}
            </Chip>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">Аккаунт один. Роль меняется в любой момент — история никуда не денется.</p>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Профиль исполнителя</h2>
          <Button size="sm" variant="outline" onClick={() => setEdit((v) => !v)}>
            {edit ? 'Готово' : ex ? 'Изменить' : 'Заполнить'}
          </Button>
        </div>

        {!edit && !ex && (
          <p className="text-[15px] text-muted">
            Пока не заполнен. Без категорий и района подбор работает вслепую — заполните, это пара минут.
          </p>
        )}

        {!edit && ex && (
          <div className="flex flex-col gap-3">
            <p className="text-[15px] font-bold">{ex.headline}</p>
            <p className="text-[15px] text-muted">{ex.about}</p>
            <div className="flex flex-wrap gap-2">
              {ex.categories.map((c) => {
                const cat = db.categories.find((x) => x.id === c);
                return cat ? <Badge key={c} tone="sand">{cat.emoji} {cat.name}</Badge> : null;
              })}
            </div>
          </div>
        )}

        {edit && (
          <div className="flex flex-col gap-4">
            <Field label="Коротко о себе">
              <Input defaultValue={ex?.headline ?? ''} placeholder="Мастер на час, сборка и мелкий ремонт"
                onBlur={(e) => patch((u) => ({ ...u, executor: { ...defaults(u.executor), headline: e.target.value } }))} />
            </Field>
            <Field label="Подробнее">
              <Textarea defaultValue={ex?.about ?? ''} placeholder="Что делаете, с чем работаете, что берёте с собой"
                onBlur={(e) => patch((u) => ({ ...u, executor: { ...defaults(u.executor), about: e.target.value } }))} />
            </Field>
            <Field label="Категории">
              <div className="flex flex-wrap gap-2">
                {db.categories.filter((c) => !c.parentId && c.enabled).map((c) => {
                  const on = ex?.categories.includes(c.id) ?? false;
                  return (
                    <Chip key={c.id} active={on} onClick={() => patch((u) => {
                      const base = defaults(u.executor);
                      const set = new Set(base.categories);
                      if (set.has(c.id)) set.delete(c.id); else set.add(c.id);
                      return { ...u, executor: { ...base, categories: [...set] } };
                    })}>
                      <span aria-hidden>{c.emoji}</span>{c.name}
                    </Chip>
                  );
                })}
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Район работы">
                <Input defaultValue={ex?.district ?? ''} placeholder="Хамовники, Якиманка"
                  onBlur={(e) => patch((u) => ({ ...u, executor: { ...defaults(u.executor), district: e.target.value } }))} />
              </Field>
              <Field label="Ставка от, ₽">
                <Input inputMode="numeric" defaultValue={ex?.rateFrom ?? ''}
                  onBlur={(e) => patch((u) => ({ ...u, executor: { ...defaults(u.executor), rateFrom: Number(e.target.value) || null } }))} />
              </Field>
            </div>
            <Field label="Когда свободны">
              <div className="flex flex-col gap-2.5">
                {([['today', 'Сегодня'], ['tomorrow', 'Завтра'], ['thisWeek', 'На этой неделе'], ['byAgreement', 'По договорённости']] as const).map(([k, l]) => (
                  <Toggle key={k} label={l} checked={ex?.availability[k] ?? false}
                    onChange={(v) => patch((u) => {
                      const base = defaults(u.executor);
                      return { ...u, executor: { ...base, availability: { ...base.availability, [k]: v } } };
                    })} />
                ))}
              </div>
            </Field>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-extrabold">Подтверждение</h2>
        <div className="flex flex-col gap-3">
          {(['phone', 'identity'] as const).map((k) => {
            const v = ver(k);
            const done = v?.status === 'approved';
            return (
              <div key={k} className="flex flex-wrap items-center justify-between gap-3 rounded-md border-2 border-ink bg-surface px-4 py-3">
                <div>
                  <div className="font-bold">{k === 'phone' ? 'Телефон' : 'Личность'}</div>
                  <div className="text-sm text-muted">
                    {k === 'phone' ? 'Нужен для входа и связи по заказу' : 'Требуется в категориях с повышенным риском'}
                  </div>
                </div>
                {done ? <Badge tone="ok">Подтверждено</Badge> : (
                  <Button size="sm" variant="outline" onClick={() => {
                    patch((u) => ({
                      ...u,
                      verifications: u.verifications.some((x) => x.kind === k)
                        ? u.verifications.map((x) => x.kind === k ? { ...x, status: 'pending' as const, updatedAt: new Date().toISOString() } : x)
                        : [...u.verifications, { kind: k, status: 'pending' as const, updatedAt: new Date().toISOString() }],
                    }));
                    haptic('success');
                  }}>
                    {v?.status === 'pending' ? 'На проверке' : 'Подтвердить'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-6">
        <Link href="/app/help"><Button variant="outline" className="w-full">Нужна помощь</Button></Link>
        <Button variant="ghost" onClick={() => { authService.logout(); router.push('/'); }}>Выйти</Button>
        {CONFIG.useMock && (
          <Button variant="ghost" className="text-danger"
            onClick={() => { if (confirm('Сбросить демо-данные? Созданные задачи и заказы исчезнут.')) { resetDB(); router.push('/app'); } }}>
            Сбросить демо-данные
          </Button>
        )}
      </Card>

      {/* ---------- Аватар ---------- */}
      <Modal open={avOpen} onClose={() => setAvOpen(false)} title="Аватар">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Chip active={avKind === 'man'} onClick={() => setAvKind('man')}>Парни</Chip>
            <Chip active={avKind === 'girl'} onClick={() => setAvKind('girl')}>Девушки</Chip>
          </div>
          <div className="grid grid-cols-5 gap-2.5">
            {AVATARS.filter((a) => a.includes(avKind)).map((src) => (
              <button key={src} onClick={() => setAvatar(src)} aria-label="Выбрать аватар"
                aria-pressed={me.avatar === src}
                style={{ backgroundImage: `url("${src}")` }}
                className={`aspect-square rounded-full border-2 border-ink bg-sand bg-cover bg-center transition-transform hover:scale-110 ${me.avatar === src ? 'ring-4 ring-brand' : ''}`} />
            ))}
          </div>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-ink bg-card px-4 py-3 text-sm font-bold hover:bg-sand">
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
            Загрузить своё фото
          </label>
          <p className="text-center text-xs text-faint">Фото уменьшается до 320 px и хранится в вашем браузере.</p>
        </div>
      </Modal>
    </div>
  );
}

function defaults(e: ExecutorProfile | undefined): ExecutorProfile {
  return {
    headline: e?.headline ?? '', about: e?.about ?? '', categories: e?.categories ?? [],
    skills: e?.skills ?? [], experienceYears: e?.experienceYears ?? null, rateFrom: e?.rateFrom ?? null,
    district: e?.district ?? '', portfolio: e?.portfolio ?? [],
    availability: e?.availability ?? { today: false, tomorrow: false, thisWeek: true, byAgreement: true },
  };
}
