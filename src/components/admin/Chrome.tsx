'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { adminAuth, adminService, canSee, canWrite, type AdminSection } from '@/services/admin';
import { useMounted } from '@/hooks/useStore';
import { Badge, Button, Card, Input, Select, cx } from '@/components/ui';
import { CONFIG } from '@/lib/config';
import type { AdminRole } from '@/types';

const NAV: { section: AdminSection; href: string; label: string; group: string }[] = [
  { section: 'dashboard', href: '/admin', label: 'Обзор', group: 'Главное' },
  { section: 'analytics', href: '/admin/analytics', label: 'Аналитика', group: 'Главное' },
  { section: 'users', href: '/admin/users', label: 'Пользователи', group: 'Маркетплейс' },
  { section: 'tasks', href: '/admin/tasks', label: 'Задачи', group: 'Маркетплейс' },
  { section: 'applications', href: '/admin/applications', label: 'Отклики', group: 'Маркетплейс' },
  { section: 'orders', href: '/admin/orders', label: 'Заказы', group: 'Маркетплейс' },
  { section: 'payments', href: '/admin/payments', label: 'Платежи', group: 'Финансы' },
  { section: 'moderation', href: '/admin/moderation', label: 'Требует внимания', group: 'Доверие' },
  { section: 'reports', href: '/admin/reports', label: 'Жалобы', group: 'Доверие' },
  { section: 'disputes', href: '/admin/disputes', label: 'Споры', group: 'Доверие' },
  { section: 'support', href: '/admin/support', label: 'Поддержка', group: 'Доверие' },
  { section: 'verification', href: '/admin/verification', label: 'Проверки', group: 'Доверие' },
  { section: 'risk', href: '/admin/risk', label: 'Риски', group: 'Доверие' },
  { section: 'categories', href: '/admin/categories', label: 'Категории', group: 'Настройка' },
  { section: 'notifications', href: '/admin/notifications', label: 'Рассылки', group: 'Настройка' },
  { section: 'flags', href: '/admin/flags', label: 'Feature flags', group: 'Настройка' },
  { section: 'settings', href: '/admin/settings', label: 'Настройки', group: 'Настройка' },
  { section: 'audit', href: '/admin/audit', label: 'Журнал действий', group: 'Настройка' },
];

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const pathname = usePathname();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  if (!mounted) return null;

  const me = adminAuth.current();
  const allowed = NAV.filter((n) => canSee(me.role, n.section));
  const groups = [...new Set(allowed.map((n) => n.group))];
  const results = q.trim() ? adminService.globalSearch(q) : null;

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <button onClick={() => setOpen((v) => !v)} aria-label="Меню"
            className="grid h-9 w-9 place-items-center rounded-md border-2 border-ink lg:hidden">☰</button>
          <Link href="/admin" className="text-lg font-extrabold tracking-tight">
            TEYDO <span className="text-brand">admin</span>
          </Link>
          <Badge tone="warn" className="hidden sm:inline-flex">demo / mock</Badge>

          {/* min-w-0: без него поле ввода держит ширину по своему content-size
              и растягивает шапку на узких экранах. */}
          <div className="relative ml-auto min-w-0 w-full max-w-md">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск: пользователь, задача, заказ, платёж"
              className="!min-h-[38px] !w-full !min-w-0 !border-2 !py-1.5 text-sm" aria-label="Глобальный поиск" />
            {results && (
              <Card className="absolute right-0 top-11 z-50 max-h-96 w-full overflow-auto p-3 shadow-pop">
                <SearchGroup title="Пользователи" items={results.users.map((u) => ({ id: u.id, label: `${u.name} · ${u.id}`, href: `/admin/users/${u.id}` }))} />
                <SearchGroup title="Задачи" items={results.tasks.map((t) => ({ id: t.id, label: `${t.title} · ${t.id}`, href: `/admin/tasks` }))} />
                <SearchGroup title="Заказы" items={results.orders.map((o) => ({ id: o.id, label: o.id, href: '/admin/orders' }))} />
                <SearchGroup title="Платежи" items={results.payments.map((p) => ({ id: p.id, label: p.id, href: '/admin/payments' }))} />
                {!results.users.length && !results.tasks.length && !results.orders.length && !results.payments.length && (
                  <p className="px-2 py-3 text-sm text-faint">Ничего не нашлось</p>
                )}
              </Card>
            )}
          </div>

          <Select aria-label="Роль администратора" value={me.role}
            onChange={(e) => { adminAuth.setRole(e.target.value as AdminRole); location.reload(); }}
            className="!min-h-[38px] !w-auto !min-w-0 !max-w-[7.5rem] !border-2 !px-2 !py-1.5 text-sm">
            {(['OWNER', 'SUPER_ADMIN', 'MODERATOR', 'SUPPORT', 'FINANCE', 'ANALYST'] as AdminRole[]).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </div>
      </header>

      <div className="flex">
        <aside className={cx('w-60 shrink-0 border-r-2 border-ink bg-paper p-3 lg:block',
          open ? 'fixed inset-y-0 left-0 z-50 overflow-auto pt-16' : 'hidden')}>
          {groups.map((g) => (
            <div key={g} className="mb-4">
              <div className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-faint">{g}</div>
              {allowed.filter((n) => n.group === g).map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
                  className={cx('block rounded-md px-2.5 py-2 text-sm font-bold',
                    pathname === n.href ? 'bg-ink text-paper' : 'hover:bg-sand')}>
                  {n.label}
                </Link>
              ))}
            </div>
          ))}
          <p className="px-2 text-[11px] leading-relaxed text-faint">
            Роль {me.role}: доступ ограничен серверной проверкой, скрытие пунктов — только удобство.
          </p>
        </aside>

        <main className="min-w-0 flex-1 p-4 lg:p-6">
          {CONFIG.useMock && (
            <div className="mb-4 rounded-lg border-3 border-warn bg-warn/10 px-4 py-3 text-sm font-bold text-warn">
              Демо-режим: backend не подключён. Цифры и записи взяты из мок-данных,
              платежи и рассылки наружу не уходят.
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

function SearchGroup({ title, items }: { title: string; items: { id: string; label: string; href: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="mb-2">
      <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-faint">{title}</div>
      {items.map((i) => (
        <Link key={i.id} href={i.href} className="block truncate rounded px-2 py-1.5 text-sm hover:bg-sand">{i.label}</Link>
      ))}
    </div>
  );
}

/* ---------- Общие элементы админки ---------- */

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function DataTable({ head, rows, empty = 'Записей нет' }: {
  head: string[]; rows: React.ReactNode[][]; empty?: string;
}) {
  return (
    <Card className="overflow-hidden p-0" pop={false}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-ink bg-surface">
              {head.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2.5 font-bold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={head.length} className="px-3 py-8 text-center text-faint">{empty}</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className="border-b border-ink/10 hover:bg-surface/60">
                {r.map((c, j) => <td key={j} className="px-3 py-2.5 align-top">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function Kpi({ label, value, tone, hint }: {
  label: string; value: React.ReactNode; tone?: 'ok' | 'warn' | 'danger'; hint?: string;
}) {
  return (
    <div className="rounded-lg border-2 border-ink bg-card px-4 py-3">
      <div className={cx('text-2xl font-extrabold tabular-nums tracking-tight',
        tone === 'danger' && 'text-danger', tone === 'warn' && 'text-warn', tone === 'ok' && 'text-ok')}>
        {value}
      </div>
      <div className="mt-0.5 text-xs font-bold text-muted">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] text-faint">{hint}</div>}
    </div>
  );
}

/** Опасные действия требуют причины и подтверждения — и всё пишется в журнал. */
export function DangerAction({ label, question, reasons, onConfirm, section }: {
  label: string; question: string; reasons: string[]; section: AdminSection;
  onConfirm: (reason: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(reasons[0]);
  const me = adminAuth.current();
  if (!canWrite(me.role, section)) {
    return <Button size="sm" variant="ghost" disabled title={`Роль ${me.role} не может выполнять это действие`}>{label}</Button>;
  }
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>{label}</Button>
      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/60 p-4">
          <Card className="w-full max-w-md p-5">
            <h3 className="text-lg font-extrabold">{question}</h3>
            <p className="mt-1 text-sm text-muted">Действие попадёт в журнал: кто, когда и по какой причине.</p>
            <div className="mt-4 flex flex-col gap-2">
              {reasons.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm font-bold">
                  <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} />
                  {r}
                </label>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <Button size="sm" variant="danger" onClick={() => { onConfirm(reason); setOpen(false); }}>Подтвердить</Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Отмена</Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
