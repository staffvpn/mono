'use client';

import * as seed from '@/mock/data';
import { commit, getDB, nowISO, uid } from './store';
import type {
  AdminRole, AdminUser, AuditEntry, FeatureFlag, ID, ModerationItem, RiskEvent, Task, User,
} from '@/types';

/* ============================================================
   AdminService — единая точка входа админки.
   Фронт админки никогда не ходит в базу напрямую: в проде каждый
   метод превращается в вызов защищённого admin API с проверкой роли
   на сервере. Скрытая кнопка защитой не считается.
   ============================================================ */

/* ---------- RBAC ---------- */
export type AdminSection =
  | 'dashboard' | 'users' | 'tasks' | 'applications' | 'orders' | 'payments'
  | 'moderation' | 'reports' | 'disputes' | 'support' | 'verification' | 'risk'
  | 'categories' | 'notifications' | 'banners' | 'analytics' | 'flags'
  | 'settings' | 'audit';

const MATRIX: Record<AdminRole, AdminSection[] | 'all'> = {
  OWNER: 'all',
  SUPER_ADMIN: 'all',
  MODERATOR: ['dashboard', 'users', 'tasks', 'applications', 'moderation', 'reports', 'verification', 'risk', 'categories', 'audit'],
  SUPPORT: ['dashboard', 'users', 'orders', 'support', 'disputes', 'tasks', 'audit'],
  FINANCE: ['dashboard', 'payments', 'orders', 'analytics', 'audit'],
  ANALYST: ['dashboard', 'analytics'],
};

/** Действия, меняющие данные. ANALYST не может ничего, кроме чтения. */
const WRITE_ROLES: AdminRole[] = ['OWNER', 'SUPER_ADMIN', 'MODERATOR', 'SUPPORT', 'FINANCE'];

export function canSee(role: AdminRole, section: AdminSection): boolean {
  const allowed = MATRIX[role];
  return allowed === 'all' || allowed.includes(section);
}

export function canWrite(role: AdminRole, section: AdminSection): boolean {
  if (!canSee(role, section)) return false;
  if (!WRITE_ROLES.includes(role)) return false;
  if (role === 'FINANCE') return ['payments', 'orders'].includes(section);
  if (role === 'SUPPORT') return ['support', 'disputes', 'orders'].includes(section);
  if (role === 'MODERATOR') return ['users', 'tasks', 'reports', 'moderation', 'verification', 'categories', 'risk'].includes(section);
  return true;
}

/* ---------- Текущий администратор (в проде — из серверной сессии) ---------- */
const ADMIN_KEY = 'teydo.admin.v1';

export const adminAuth = {
  current(): AdminUser {
    if (typeof window === 'undefined') return { id: 'ad1', name: 'Владелец', role: 'OWNER' };
    try {
      const raw = localStorage.getItem(ADMIN_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* пусто */ }
    return { id: 'ad1', name: 'Владелец', role: 'OWNER' };
  },
  setRole(role: AdminRole) {
    const me = { ...adminAuth.current(), role };
    try { localStorage.setItem(ADMIN_KEY, JSON.stringify(me)); } catch { /* пусто */ }
  },
};

/* ---------- Audit Log ---------- */
const AUDIT_KEY = 'teydo.audit.v1';

function readAudit(): AuditEntry[] {
  if (typeof window === 'undefined') return seed.auditLog;
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    return raw ? JSON.parse(raw) : structuredClone(seed.auditLog);
  } catch { return structuredClone(seed.auditLog); }
}

function writeAudit(list: AuditEntry[]) {
  try { localStorage.setItem(AUDIT_KEY, JSON.stringify(list.slice(0, 300))); } catch { /* пусто */ }
}

export function logAction(entry: Omit<AuditEntry, 'id' | 'at' | 'adminId' | 'adminName' | 'adminRole'>) {
  const me = adminAuth.current();
  const list = readAudit();
  list.unshift({ ...entry, id: uid('l'), at: nowISO(), adminId: me.id, adminName: me.name, adminRole: me.role });
  writeAudit(list);
}

/* ---------- Настройки и флаги ---------- */
const SETTINGS_KEY = 'teydo.settings.v1';

export interface PlatformSettings {
  platformName: string;
  commissionPercent: number;
  commissionMin: number;
  commissionMax: number;
  applicationsPerDay: number;
  moderateNewTasks: boolean;
  maintenance: { enabled: boolean; title: string; text: string; until: string };
}

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: 'TEYDO',
  commissionPercent: 7,
  commissionMin: 100,
  commissionMax: 15000,
  applicationsPerDay: 40,
  moderateNewTasks: false,
  maintenance: { enabled: false, title: 'Технические работы', text: 'Мы ненадолго закрыли двери на технические работы.', until: '' },
};

const FLAGS_KEY = 'teydo.flags.v1';

/* ---------- Аналитика на моках ---------- */
function series(days: number, base: number, spread: number) {
  const out: { label: string; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const wave = Math.sin(i / 3) * spread * 0.4;
    out.push({
      label: d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      value: Math.max(0, Math.round(base + wave + ((i * 37) % spread))),
    });
  }
  return out;
}

export const adminService = {
  isMock: true,

  getDashboardStats() {
    const db = getDB();
    const t = db.tasks;
    const o = db.orders;
    const p = db.payments;
    return {
      users: {
        total: db.users.length,
        blocked: db.users.filter((u) => u.status === 'blocked').length,
        pending: db.users.filter((u) => u.status === 'pending_review').length,
        customers: db.users.filter((u) => u.activeRole === 'customer').length,
        executors: db.users.filter((u) => !!u.executor).length,
      },
      tasks: {
        total: t.length,
        active: t.filter((x) => x.relevance === 'active').length,
        onReview: t.filter((x) => x.moderation === 'on_review').length,
        done: t.filter((x) => x.relevance === 'done').length,
        withReports: t.filter((x) => x.reportsCount > 0).length,
      },
      applications: {
        total: db.applications.length,
        waiting: db.applications.filter((a) => a.status === 'sent').length,
        avgPerTask: t.length ? +(db.applications.length / t.length).toFixed(1) : 0,
        toOrder: db.applications.length
          ? Math.round((db.applications.filter((a) => a.status === 'accepted').length / db.applications.length) * 100)
          : 0,
      },
      orders: {
        total: o.length,
        active: o.filter((x) => ['paid', 'in_progress', 'awaiting_payment'].includes(x.status)).length,
        completed: o.filter((x) => x.status === 'completed').length,
        cancelled: o.filter((x) => x.status === 'cancelled').length,
        disputed: o.filter((x) => x.status === 'disputed').length,
        avgCheck: o.length ? Math.round(o.reduce((s, x) => s + x.terms.price, 0) / o.length) : 0,
      },
      finance: {
        gmv: p.reduce((s, x) => s + x.amount, 0),
        commission: p.reduce((s, x) => s + x.commission, 0),
        succeeded: p.filter((x) => ['held', 'released'].includes(x.status)).length,
        failed: p.filter((x) => x.status === 'failed').length,
        refunded: p.filter((x) => x.status === 'refunded').length,
        held: p.filter((x) => x.status === 'held').length,
      },
      moderation: {
        reports: db.reports.filter((r) => r.status === 'new').length,
        verifications: db.users.filter((u) => u.verifications.some((v) => v.status === 'pending')).length,
        tasks: t.filter((x) => x.moderation === 'on_review').length,
        disputes: db.disputes.filter((d) => ['open', 'in_review'].includes(d.status)).length,
        risk: seed.riskEvents.filter((r) => r.status === 'new').length,
      },
    };
  },

  getChart(metric: string, days: number) {
    const map: Record<string, [number, number]> = {
      users: [4, 6], tasks: [7, 9], applications: [14, 18], orders: [3, 5],
      gmv: [18000, 22000], commission: [1200, 1600],
    };
    const [base, spread] = map[metric] ?? [5, 6];
    return series(days, base, spread);
  },

  getFunnel(kind: 'customer' | 'executor') {
    const steps = kind === 'customer'
      ? ['Открыл', 'Регистрация', 'Создал задачу', 'Получил отклик', 'Выбрал', 'Зафиксировал', 'Оплатил', 'Завершил', 'Отзыв']
      : ['Открыл', 'Регистрация', 'Заполнил профиль', 'Открыл задачу', 'Отклик', 'Получил заказ', 'Выполнил', 'Оплата', 'Отзыв'];
    let v = 1000;
    return steps.map((label, i) => {
      const value = Math.round(v);
      v *= [1, 0.62, 0.55, 0.78, 0.71, 0.83, 0.74, 0.88, 0.61][i] ?? 0.8;
      return { label, value, share: Math.round((value / 1000) * 100) };
    });
  },

  getUsers(q?: { search?: string; status?: string; role?: string }) {
    const db = getDB();
    return db.users.filter((u) => {
      if (q?.search) {
        const s = q.search.toLowerCase();
        const hay = `${u.id} ${u.name} ${u.username ?? ''} ${u.phone ?? ''} ${u.telegramId ?? ''}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      if (q?.status && q.status !== 'all' && u.status !== q.status) return false;
      if (q?.role === 'executor' && !u.executor) return false;
      if (q?.role === 'customer' && u.executor) return false;
      return true;
    });
  },

  getUser(id: ID): User | undefined {
    return getDB().users.find((u) => u.id === id);
  },

  updateUserStatus(id: ID, status: User['status'], reason: string) {
    const db = getDB();
    const before = db.users.find((u) => u.id === id);
    db.users = db.users.map((u) => (u.id === id ? { ...u, status } : u));
    commit();
    logAction({
      action: status === 'blocked' ? 'Блокировка пользователя' : 'Изменение статуса пользователя',
      entityType: 'user', entityId: id, before: before?.status, after: status, reason,
    });
  },

  restrictUser(id: ID, kind: 'tasks' | 'applications' | 'messages' | 'account', reason: string) {
    const db = getDB();
    db.users = db.users.map((u) =>
      u.id === id
        ? { ...u, restrictions: [...(u.restrictions ?? []), { kind, until: null, reason, createdAt: nowISO() }] }
        : u,
    );
    commit();
    logAction({ action: 'Ограничение пользователя', entityType: 'user', entityId: id, after: kind, reason });
  },

  getTasks(q?: { search?: string; moderation?: string }) {
    const db = getDB();
    return db.tasks.filter((t) => {
      if (q?.search && !`${t.id} ${t.title}`.toLowerCase().includes(q.search.toLowerCase())) return false;
      if (q?.moderation && q.moderation !== 'all' && t.moderation !== q.moderation) return false;
      return true;
    });
  },

  moderateTask(id: ID, moderation: Task['moderation'], reason: string) {
    const db = getDB();
    const before = db.tasks.find((t) => t.id === id)?.moderation;
    db.tasks = db.tasks.map((t) => (t.id === id ? { ...t, moderation } : t));
    commit();
    logAction({ action: 'Модерация задачи', entityType: 'task', entityId: id, before, after: moderation, reason });
  },

  getApplications() { return getDB().applications; },
  getOrders() { return getDB().orders; },
  getPayments() { return getDB().payments; },
  getDisputes() { return getDB().disputes; },
  getReports() { return getDB().reports; },
  getSupportTickets() { return getDB().support; },
  getCategories() { return getDB().categories; },
  getRiskEvents(): RiskEvent[] { return seed.riskEvents; },
  getModerationQueue(): ModerationItem[] { return seed.moderationQueue; },

  upsertCategory(c: Partial<import('@/types').Category> & { name: string }) {
    const db = getDB();
    if (c.id) {
      db.categories = db.categories.map((x) => (x.id === c.id ? { ...x, ...c } : x));
      logAction({ action: 'Изменение категории', entityType: 'category', entityId: c.id, after: c.name });
    } else {
      const id = uid('c');
      db.categories.push({
        id, slug: id, name: c.name, emoji: c.emoji ?? '✨', parentId: c.parentId ?? null,
        order: db.categories.length + 1, enabled: true,
      });
      logAction({ action: 'Создание категории', entityType: 'category', entityId: id, after: c.name });
    }
    commit();
  },

  getFeatureFlags(): FeatureFlag[] {
    if (typeof window === 'undefined') return seed.featureFlags;
    try {
      const raw = localStorage.getItem(FLAGS_KEY);
      return raw ? JSON.parse(raw) : structuredClone(seed.featureFlags);
    } catch { return structuredClone(seed.featureFlags); }
  },

  updateFeatureFlag(key: string, patch: Partial<FeatureFlag>) {
    const list = adminService.getFeatureFlags().map((f) => (f.key === key ? { ...f, ...patch } : f));
    try { localStorage.setItem(FLAGS_KEY, JSON.stringify(list)); } catch { /* пусто */ }
    logAction({ action: 'Изменение feature flag', entityType: 'flag', entityId: key, after: JSON.stringify(patch) });
    return list;
  },

  getSettings(): PlatformSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  },

  updateSettings(patch: Partial<PlatformSettings>, reason = '') {
    const before = adminService.getSettings();
    const next = { ...before, ...patch };
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch { /* пусто */ }
    logAction({
      action: 'Изменение настроек', entityType: 'settings', entityId: 'platform',
      before: JSON.stringify(before), after: JSON.stringify(patch), reason,
    });
    return next;
  },

  getAuditLogs(): AuditEntry[] { return readAudit(); },

  sendNotification(input: { title: string; body: string; audience: string; channel: string }) {
    const db = getDB();
    const targets = db.users.filter((u) => {
      if (input.audience === 'executors') return !!u.executor;
      if (input.audience === 'customers') return !u.executor;
      return true;
    });
    targets.forEach((u) => {
      db.notifications.unshift({
        id: uid('n'), userId: u.id, kind: 'system', title: input.title, body: input.body,
        read: false, createdAt: nowISO(),
      });
    });
    commit();
    logAction({
      action: 'Массовое уведомление', entityType: 'notification', entityId: input.audience,
      after: `${targets.length} получателей, канал ${input.channel}`, reason: input.title,
    });
    // Уведомление кладётся в ленту приложения. Наружу — в Telegram или на почту —
    // ничего не уходит: провайдеры не подключены, и врать об этом нельзя.
    return { sent: targets.length, deliveredOutside: false as const };
  },

  globalSearch(q: string) {
    const db = getDB();
    const s = q.trim().toLowerCase();
    if (!s) return { users: [], tasks: [], orders: [], payments: [] };
    return {
      users: db.users.filter((u) => `${u.id} ${u.name} ${u.username ?? ''}`.toLowerCase().includes(s)).slice(0, 5),
      tasks: db.tasks.filter((t) => `${t.id} ${t.title}`.toLowerCase().includes(s)).slice(0, 5),
      orders: db.orders.filter((o) => o.id.toLowerCase().includes(s)).slice(0, 5),
      payments: db.payments.filter((p) => `${p.id} ${p.orderId}`.toLowerCase().includes(s)).slice(0, 5),
    };
  },
};
