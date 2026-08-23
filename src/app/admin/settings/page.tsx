'use client';

import { useState } from 'react';
import { adminService, type PlatformSettings } from '@/services/admin';
import { useMounted } from '@/hooks/useStore';
import { Button, Card, Field, Input, Skeleton, Toggle } from '@/components/ui';
import { PageHead } from '@/components/admin/Chrome';

export default function AdminSettings() {
  const mounted = useMounted();
  const [saved, setSaved] = useState('');
  const [s, setS] = useState<PlatformSettings | null>(null);
  if (!mounted) return <Skeleton className="h-96" />;
  const cur = s ?? adminService.getSettings();

  function save(patch: Partial<PlatformSettings>, reason: string) {
    const next = adminService.updateSettings(patch, reason);
    setS(next);
    setSaved('Сохранено и записано в журнал');
    setTimeout(() => setSaved(''), 3000);
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHead title="Настройки платформы" sub="Изменения фиксируются в журнале: кто, когда, что было и что стало." />

      <Card className="p-5" pop={false}>
        <h2 className="mb-3 text-lg font-extrabold">Комиссия</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Базовая ставка, %" hint="Применяется к успешной сделке">
            <Input inputMode="numeric" defaultValue={cur.commissionPercent}
              onBlur={(e) => save({ commissionPercent: Number(e.target.value) || cur.commissionPercent }, 'Изменение базовой комиссии')} />
          </Field>
          <Field label="Минимум, ₽">
            <Input inputMode="numeric" defaultValue={cur.commissionMin}
              onBlur={(e) => save({ commissionMin: Number(e.target.value) || 0 }, 'Изменение минимальной комиссии')} />
          </Field>
          <Field label="Максимум, ₽">
            <Input inputMode="numeric" defaultValue={cur.commissionMax}
              onBlur={(e) => save({ commissionMax: Number(e.target.value) || 0 }, 'Изменение максимальной комиссии')} />
          </Field>
        </div>
      </Card>

      <Card className="p-5" pop={false}>
        <h2 className="mb-3 text-lg font-extrabold">Лимиты и модерация</h2>
        <div className="flex flex-col gap-4">
          <Field label="Откликов в сутки на пользователя" hint="Жёсткий лимит для всех — плохая идея: у проверенных исполнителей порог должен расти">
            <Input inputMode="numeric" defaultValue={cur.applicationsPerDay}
              onBlur={(e) => save({ applicationsPerDay: Number(e.target.value) || 0 }, 'Изменение лимита откликов')} />
          </Field>
          <Toggle checked={cur.moderateNewTasks} label="Новые задачи уходят на модерацию"
            onChange={(v) => save({ moderateNewTasks: v }, 'Переключение премодерации задач')} />
        </div>
      </Card>

      <Card className="p-5" pop={false}>
        <h2 className="mb-3 text-lg font-extrabold">Режим технических работ</h2>
        <div className="flex flex-col gap-4">
          <Toggle checked={cur.maintenance.enabled} label="Включить режим техработ"
            onChange={(v) => save({ maintenance: { ...cur.maintenance, enabled: v } }, 'Переключение режима техработ')} />
          <Field label="Заголовок">
            <Input defaultValue={cur.maintenance.title}
              onBlur={(e) => save({ maintenance: { ...cur.maintenance, title: e.target.value } }, 'Текст техработ')} />
          </Field>
          <Field label="Текст для пользователя">
            <Input defaultValue={cur.maintenance.text}
              onBlur={(e) => save({ maintenance: { ...cur.maintenance, text: e.target.value } }, 'Текст техработ')} />
          </Field>
          <p className="text-xs text-faint">
            Административные маршруты остаются доступны авторизованным администраторам.
          </p>
        </div>
      </Card>

      <Card className="p-5" pop={false}>
        <h2 className="mb-3 text-lg font-extrabold">Интеграции</h2>
        <dl className="flex flex-col gap-2 text-sm">
          {[
            ['Telegram Bot', 'BOT_TOKEN', 'задаётся в переменных окружения'],
            ['Платёжный провайдер', 'PAYMENT_PROVIDER_KEY', 'не подключён'],
            ['SMS-провайдер', 'SMS_PROVIDER_KEY', 'не подключён'],
            ['E-mail', 'SMTP_URL', 'не подключён'],
          ].map(([n, k, v]) => (
            <div key={k} className="flex flex-wrap justify-between gap-2 border-b border-ink/10 pb-2">
              <dt className="font-bold">{n}</dt>
              <dd className="text-faint"><code className="text-xs">{k}</code> — {v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-faint">
          Ключи не отображаются в интерфейсе и не хранятся во фронтенде.
        </p>
      </Card>

      {saved && <p className="text-sm font-bold text-ok">{saved}</p>}
    </div>
  );
}
