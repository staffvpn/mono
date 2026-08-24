'use client';

import * as seed from '@/mock/data';
import type {
  Application, AppNotification, Category, Dispute, Favorite, Message, Order,
  Payment, Report, Review, SupportTicket, Task, Thread, User, ID, Payout,
} from '@/types';

/* ============================================================
   Мок-хранилище. Держит состояние в памяти и зеркалит в localStorage,
   чтобы созданная задача, отклик и заказ переживали перезагрузку.
   Это НЕ база данных: при подключении backend слой сервисов
   переключается на HTTP, а этот файл удаляется целиком.
   ============================================================ */

const KEY = 'teydo.mock.v2';

export interface DB {
  users: User[];
  categories: Category[];
  tasks: Task[];
  applications: Application[];
  orders: Order[];
  threads: Thread[];
  messages: Message[];
  reviews: Review[];
  favorites: Favorite[];
  notifications: AppNotification[];
  payments: Payment[];
  payouts: Payout[];
  disputes: Dispute[];
  reports: Report[];
  support: SupportTicket[];
  currentUserId: ID | null;
  onboarded: boolean;
}

function fresh(): DB {
  return {
    users: structuredClone(seed.users),
    categories: structuredClone(seed.categories),
    tasks: structuredClone(seed.tasks),
    applications: structuredClone(seed.applications),
    orders: structuredClone(seed.orders),
    threads: structuredClone(seed.threads),
    messages: structuredClone(seed.messages),
    reviews: structuredClone(seed.reviews),
    favorites: [],
    notifications: structuredClone(seed.notifications),
    payments: structuredClone(seed.payments),
    payouts: [],
    disputes: structuredClone(seed.disputes),
    reports: structuredClone(seed.reports),
    support: structuredClone(seed.supportTickets),
    currentUserId: null,
    onboarded: false,
  };
}

let db: DB | null = null;
const listeners = new Set<() => void>();

export function getDB(): DB {
  if (db) return db;
  if (typeof window === 'undefined') return fresh();
  try {
    const raw = localStorage.getItem(KEY);
    db = raw ? { ...fresh(), ...JSON.parse(raw) } : fresh();
  } catch {
    db = fresh();
  }
  return db!;
}

export function commit() {
  if (typeof window === 'undefined' || !db) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* приватный режим или переполнено — работаем из памяти */
  }
  listeners.forEach((l) => l());
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function resetDB() {
  db = fresh();
  commit();
}

export const uid = (p: string) => `${p}${Math.random().toString(36).slice(2, 8)}`;
export const nowISO = () => new Date().toISOString();
