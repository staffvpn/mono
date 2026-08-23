'use client';

import { commit, getDB, nowISO, uid } from './store';
import type { AppNotification, Dispute, ID, Message, Review, SupportTicket, Thread } from '@/types';

/* ---------- Чат ---------- */
export const chatService = {
  threads(userId: ID): Thread[] {
    return getDB().threads
      .filter((t) => t.customerId === userId || t.executorId === userId)
      .sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
  },
  get(id: ID) {
    return getDB().threads.find((t) => t.id === id);
  },
  findOrCreate(taskId: ID, customerId: ID, executorId: ID): Thread {
    const db = getDB();
    const found = db.threads.find(
      (t) => t.taskId === taskId && t.customerId === customerId && t.executorId === executorId,
    );
    if (found) return found;
    const thread: Thread = {
      id: uid('th'), taskId, customerId, executorId, lastMessageAt: nowISO(), unread: 0,
    };
    db.threads.unshift(thread);
    db.messages.push({
      id: uid('msg'), threadId: thread.id, authorId: 'system', kind: 'system',
      text: 'Чат создан. Обсудите детали и зафиксируйте условия — так проще, если что-то пойдёт не по плану.',
      createdAt: nowISO(), readBy: [],
    });
    commit();
    return thread;
  },
  messages(threadId: ID): Message[] {
    return getDB().messages
      .filter((m) => m.threadId === threadId)
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  },
  send(threadId: ID, authorId: ID, text: string, kind: Message['kind'] = 'text'): Message {
    const db = getDB();
    const msg: Message = {
      id: uid('msg'), threadId, authorId, kind, text, createdAt: nowISO(), readBy: [authorId],
    };
    db.messages.push(msg);
    db.threads = db.threads.map((t) => (t.id === threadId ? { ...t, lastMessageAt: nowISO() } : t));
    commit();
    return msg;
  },
  system(threadId: ID, text: string) {
    return chatService.send(threadId, 'system' as ID, text, 'system');
  },
};

/* ---------- Уведомления ---------- */
export const notificationService = {
  list(userId: ID): AppNotification[] {
    return getDB().notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  },
  unread(userId: ID) {
    return notificationService.list(userId).filter((n) => !n.read).length;
  },
  push(userId: ID, n: Omit<AppNotification, 'id' | 'userId' | 'read' | 'createdAt'>) {
    const db = getDB();
    db.notifications.unshift({ ...n, id: uid('n'), userId, read: false, createdAt: nowISO() });
    commit();
  },
  readAll(userId: ID) {
    const db = getDB();
    db.notifications = db.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n));
    commit();
  },
};

/* ---------- Отзывы ---------- */
export const reviewService = {
  forUser(userId: ID): Review[] {
    return getDB().reviews.filter((r) => r.targetId === userId);
  },
  create(r: Omit<Review, 'id' | 'createdAt' | 'average'>): Review {
    const db = getDB();
    const values = Object.values(r.scores).filter((v): v is number => typeof v === 'number');
    const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const review: Review = { ...r, id: uid('rv'), average, createdAt: nowISO() };
    db.reviews.unshift(review);
    db.orders = db.orders.map((o) =>
      o.id === r.orderId
        ? {
            ...o,
            reviewedByCustomer: r.direction === 'customer_to_executor' ? true : o.reviewedByCustomer,
            reviewedByExecutor: r.direction === 'executor_to_customer' ? true : o.reviewedByExecutor,
          }
        : o,
    );
    commit();
    return review;
  },
};

/* ---------- Споры и поддержка ---------- */
export const disputeService = {
  list(userId?: ID): Dispute[] {
    const db = getDB();
    if (!userId) return db.disputes;
    const mine = db.orders.filter((o) => o.customerId === userId || o.executorId === userId).map((o) => o.id);
    return db.disputes.filter((d) => mine.includes(d.orderId));
  },
  get(id: ID) {
    return getDB().disputes.find((d) => d.id === id);
  },
  open(input: Omit<Dispute, 'id' | 'status' | 'createdAt'>): Dispute {
    const db = getDB();
    const dispute: Dispute = { ...input, id: uid('d'), status: 'open', createdAt: nowISO() };
    db.disputes.unshift(dispute);
    db.orders = db.orders.map((o) =>
      o.id === input.orderId ? { ...o, status: 'disputed', disputeId: dispute.id } : o,
    );
    commit();
    return dispute;
  },
};

export const supportService = {
  list(userId?: ID): SupportTicket[] {
    const db = getDB();
    return userId ? db.support.filter((t) => t.userId === userId) : db.support;
  },
  create(t: Omit<SupportTicket, 'id' | 'status' | 'createdAt' | 'internalNotes' | 'priority'>): SupportTicket {
    const db = getDB();
    const ticket: SupportTicket = {
      ...t, id: uid('s'), status: 'new', priority: 'normal', createdAt: nowISO(), internalNotes: [],
    };
    db.support.unshift(ticket);
    commit();
    return ticket;
  },
};
