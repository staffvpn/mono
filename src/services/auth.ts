'use client';

import { commit, getDB, nowISO, uid } from './store';
import type { User, UserRole } from '@/types';
import { CONFIG } from '@/lib/config';

/* ============================================================
   AuthService.
   Telegram initData и SMS-коды проверяются ТОЛЬКО на сервере.
   Здесь — интерфейс и мок-реализация; методы sendPhoneCode/verifyPhoneCode
   в продакшене уходят в /api/auth/*.
   ============================================================ */

export interface AuthService {
  getCurrentUser(): User | null;
  loginTelegram(initData: string, unsafeUser: TelegramUser | null): Promise<User>;
  sendPhoneCode(phone: string): Promise<{ sent: true; ttlSeconds: number }>;
  verifyPhoneCode(phone: string, code: string): Promise<User>;
  setRole(role: UserRole): void;
  markOnboarded(): void;
  logout(): void;
}

export interface TelegramUser {
  id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string;
}

/* ------------------------------------------------------------
   Пока backend не завёл собственную таблицу пользователей,
   /api/auth/* возвращает только проверенный профиль. Собираем из него
   минимального пользователя: репутация пустая, потому что данных нет —
   не ноль, а «нет данных».
   ------------------------------------------------------------ */
const emptyReputation = {
  rating: null, reviewsCount: 0, ordersCompleted: 0, ordersCancelled: 0,
  successRate: null, responseMinutes: null, repeatCustomers: 0, trustIndex: null,
};

function baseUser(id: string, name: string): User {
  return {
    id, name, avatar: '', city: '', createdAt: nowISO(), lastSeenAt: nowISO(),
    status: 'active', activeRole: 'customer',
    verifications: [], reputation: { ...emptyReputation },
  };
}

function fromTelegramProfile(p: {
  telegramId: number; name: string; username: string | null; photoUrl: string | null;
}): User {
  const u = baseUser(`tg${p.telegramId}`, p.name);
  return {
    ...u,
    telegramId: p.telegramId,
    username: p.username ?? undefined,
    avatar: p.photoUrl ?? '',
    verifications: [{ kind: 'telegram', status: 'approved', updatedAt: nowISO() }],
  };
}

function fromPhone(phone: string): User {
  const u = baseUser(`ph${phone.replace(/\D/g, '')}`, phone);
  return {
    ...u,
    phone,
    verifications: [{ kind: 'phone', status: 'approved', updatedAt: nowISO() }],
  };
}

function attach(user: User): User {
  const db = getDB();
  db.currentUserId = user.id;
  if (!db.users.find((u) => u.id === user.id)) db.users.push(user);
  commit();
  return user;
}

export const authService: AuthService = {
  getCurrentUser() {
    const db = getDB();
    if (!db.currentUserId) return null;
    return db.users.find((u) => u.id === db.currentUserId) ?? null;
  },

  async loginTelegram(initData, unsafeUser) {
    if (!CONFIG.useMock && CONFIG.apiUrl) {
      const res = await fetch(`${CONFIG.apiUrl}/auth/telegram`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'miniapp', payload: initData }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'auth_failed');
      const data = await res.json();
      // Пользователь берётся из ответа сервера. Профиль из initDataUnsafe
      // сюда не попадает: подпись проверена только на сервере.
      return attach((data.user as User) ?? fromTelegramProfile(data.profile));
    }

    const db = getDB();
    const base = db.users.find((u) => u.id === 'u0')!;
    const user: User = {
      ...base,
      name: unsafeUser
        ? [unsafeUser.first_name, unsafeUser.last_name].filter(Boolean).join(' ') || 'Без имени'
        : base.name,
      username: unsafeUser?.username,
      telegramId: unsafeUser?.id,
      avatar: unsafeUser?.photo_url || base.avatar,
      lastSeenAt: nowISO(),
    };
    db.users = db.users.map((u) => (u.id === 'u0' ? user : u));
    return attach(user);
  },

  async sendPhoneCode(phone) {
    if (!CONFIG.useMock && CONFIG.apiUrl) {
      const res = await fetch(`${CONFIG.apiUrl}/auth/phone/send`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'sms_failed');
      return res.json();
    }
    // Код никогда не хранится и не проверяется на фронте.
    await new Promise((r) => setTimeout(r, 600));
    return { sent: true as const, ttlSeconds: 120 };
  },

  async verifyPhoneCode(phone, code) {
    if (!CONFIG.useMock && CONFIG.apiUrl) {
      const res = await fetch(`${CONFIG.apiUrl}/auth/phone/verify`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'bad_code');
      const data = await res.json();
      return attach((data.user as User) ?? fromPhone(phone));
    }

    await new Promise((r) => setTimeout(r, 500));
    if (!/^\d{4}$/.test(code)) throw new Error('bad_code');

    const db = getDB();
    const base = db.users.find((u) => u.id === 'u0')!;
    const user: User = {
      ...base,
      phone,
      verifications: base.verifications.map((v) =>
        v.kind === 'phone' ? { ...v, status: 'approved', updatedAt: nowISO() } : v,
      ),
      lastSeenAt: nowISO(),
    };
    db.users = db.users.map((u) => (u.id === 'u0' ? user : u));
    return attach(user);
  },

  setRole(role) {
    const db = getDB();
    db.users = db.users.map((u) => (u.id === db.currentUserId ? { ...u, activeRole: role } : u));
    commit();
  },

  markOnboarded() {
    const db = getDB();
    db.onboarded = true;
    commit();
  },

  logout() {
    const db = getDB();
    db.currentUserId = null;
    db.onboarded = false;
    commit();
    // Куку httpOnly браузер сам не удалит — просим сервер.
    if (!CONFIG.useMock) {
      void fetch(`${CONFIG.apiUrl}/auth/session`, { method: 'DELETE', credentials: 'include' })
        .catch(() => {});
    }
  },
};

export { uid };
