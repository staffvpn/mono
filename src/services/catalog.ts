'use client';

import { commit, getDB, nowISO, uid } from './store';
import { COMMISSION_PERCENT } from '@/lib/pricing';
import type {
  Application, Favorite, ID, MatchScore, Order, OrderTerms, Payment, PaymentMethod, Task, User,
} from '@/types';

/* ============================================================
   Работа с задачами, откликами, заказами и подбором.
   Всё, что помечено «на backend», в проде считается сервером:
   цена, комиссия, статусы платежей и рейтинги.
   ============================================================ */

export interface TaskDraft {
  title: string; description: string; categoryId: ID; subcategoryId?: ID;
  address: string; district?: string; city: string;
  date: string | null; timeWindow?: string;
  urgency: Task['urgency'];
  budget: number | null; budgetUnknown: boolean;
  photos: string[]; extraTerms?: string;
}

export const taskService = {
  list(filter?: { categoryId?: ID; authorId?: ID; onlyPublished?: boolean }): Task[] {
    const db = getDB();
    return db.tasks
      .filter((t) => (filter?.onlyPublished === false ? true : t.moderation === 'published'))
      .filter((t) => (filter?.categoryId ? t.categoryId === filter.categoryId : true))
      .filter((t) => (filter?.authorId ? t.authorId === filter.authorId : true))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  },

  get(id: ID): Task | undefined {
    return getDB().tasks.find((t) => t.id === id);
  },

  create(draft: TaskDraft, authorId: ID): Task {
    const db = getDB();
    const task: Task = {
      id: uid('t'),
      authorId,
      title: draft.title,
      description: draft.description,
      categoryId: draft.categoryId,
      subcategoryId: draft.subcategoryId,
      photos: draft.photos,
      geo: { address: draft.address, district: draft.district, city: draft.city, distanceKm: 0 },
      date: draft.date,
      timeWindow: draft.timeWindow,
      urgency: draft.urgency,
      budget: draft.budgetUnknown
        ? { amount: null, min: 1500, max: 6000, unknown: true, negotiable: true }
        : { amount: draft.budget, unknown: false, negotiable: true },
      extraTerms: draft.extraTerms,
      relevance: 'active',
      moderation: 'published',
      createdAt: nowISO(),
      updatedAt: nowISO(),
      applicationsCount: 0,
      viewsCount: 0,
      reportsCount: 0,
    };
    db.tasks.unshift(task);
    commit();
    return task;
  },

  setRelevance(id: ID, relevance: Task['relevance']) {
    const db = getDB();
    db.tasks = db.tasks.map((t) => (t.id === id ? { ...t, relevance, updatedAt: nowISO() } : t));
    commit();
  },
};

export const applicationService = {
  forTask(taskId: ID): Application[] {
    return getDB().applications.filter((a) => a.taskId === taskId);
  },
  byExecutor(executorId: ID): Application[] {
    return getDB().applications.filter((a) => a.executorId === executorId);
  },
  exists(taskId: ID, executorId: ID) {
    return getDB().applications.some((a) => a.taskId === taskId && a.executorId === executorId);
  },
  create(input: Omit<Application, 'id' | 'status' | 'createdAt'>): Application {
    const db = getDB();
    const app: Application = { ...input, id: uid('a'), status: 'sent', createdAt: nowISO() };
    db.applications.unshift(app);
    db.tasks = db.tasks.map((t) =>
      t.id === input.taskId ? { ...t, applicationsCount: t.applicationsCount + 1 } : t,
    );
    commit();
    return app;
  },
};

/* ---------- Подбор ----------
   Детерминированные правила, не AI. Флаг AI_MATCHING выключен,
   и интерфейс это честно показывает. */
export const matchingService = {
  scoreTaskForUser(task: Task, user: User): MatchScore {
    if (!user.executor) return { score: 0, reasons: [] };
    const reasons: string[] = [];
    let score = 40;

    if (user.executor.categories.includes(task.categoryId)) {
      score += 25;
      reasons.push('категория совпадает с вашими');
    }
    const d = task.geo.distanceKm;
    if (typeof d === 'number' && d <= 5) {
      score += 15;
      reasons.push(d < 1.5 ? 'совсем рядом' : `${d.toFixed(1)} км от вас`);
    }
    if (user.executor.availability.today && (task.urgency === 'now' || task.urgency === 'today')) {
      score += 10;
      reasons.push('вы свободны сегодня');
    }
    const rate = user.executor.rateFrom;
    const price = task.budget.amount ?? task.budget.max ?? null;
    if (rate && price && price >= rate) {
      score += 10;
      reasons.push('бюджет в вашей вилке');
    }
    if ((user.reputation.ordersCompleted ?? 0) > 10) {
      reasons.push('похожие задачи уже выполняли');
    }
    return { score: Math.min(99, score), reasons };
  },

  executorsForTask(task: Task): { user: User; match: MatchScore }[] {
    const db = getDB();
    return db.users
      .filter((u) => u.executor && u.id !== task.authorId && u.status === 'active')
      .map((u) => ({ user: u, match: matchingService.scoreTaskForUser(task, u) }))
      .filter((x) => x.match.score > 40)
      .sort((a, b) => b.match.score - a.match.score);
  },
};

/* ---------- Избранное ---------- */
export const favoriteService = {
  list(userId: ID) {
    return getDB().favorites.filter((f) => f.userId === userId);
  },
  has(userId: ID, kind: Favorite['kind'], targetId: ID) {
    return getDB().favorites.some((f) => f.userId === userId && f.kind === kind && f.targetId === targetId);
  },
  toggle(userId: ID, kind: Favorite['kind'], targetId: ID) {
    const db = getDB();
    const found = db.favorites.find((f) => f.userId === userId && f.kind === kind && f.targetId === targetId);
    if (found) db.favorites = db.favorites.filter((f) => f !== found);
    else db.favorites.unshift({ id: uid('f'), userId, kind, targetId, createdAt: nowISO() });
    commit();
    return !found;
  },
};

/* ---------- Заказы ---------- */
export { COMMISSION_PERCENT };

export const orderService = {
  list(userId: ID): Order[] {
    return getDB().orders.filter((o) => o.customerId === userId || o.executorId === userId);
  },
  get(id: ID) {
    return getDB().orders.find((o) => o.id === id);
  },
  createFromApplication(app: Application, customerId: ID, task: Task): Order {
    const db = getDB();
    const terms: OrderTerms = {
      what: task.title,
      price: app.price,
      date: task.date,
      timeWindow: task.timeWindow || app.canStart,
      place: task.geo.address,
      extra: task.extraTerms,
    };
    const order: Order = {
      id: uid('o'),
      taskId: task.id,
      customerId,
      executorId: app.executorId,
      status: 'created',
      terms,
      // Выбор исполнителя — ещё не согласие: по спецификации условия
      // подтверждают обе стороны явным действием.
      changes: [{
        id: uid('ch'), at: nowISO(), byUserId: customerId, terms,
        acceptedByCustomer: false, acceptedByExecutor: false,
      }],
      commissionPercent: COMMISSION_PERCENT,
      createdAt: nowISO(),
      reviewedByCustomer: false,
      reviewedByExecutor: false,
    };
    db.orders.unshift(order);
    db.applications = db.applications.map((a) =>
      a.id === app.id ? { ...a, status: 'accepted', orderId: order.id } : a,
    );
    db.tasks = db.tasks.map((t) =>
      t.id === task.id ? { ...t, selectedExecutorId: app.executorId, orderId: order.id, relevance: 'comparing' } : t,
    );
    commit();
    return order;
  },
  update(id: ID, patch: Partial<Order>) {
    const db = getDB();
    db.orders = db.orders.map((o) => (o.id === id ? { ...o, ...patch } : o));
    commit();
  },
  confirmTerms(id: ID, side: 'customer' | 'executor') {
    const db = getDB();
    db.orders = db.orders.map((o) => {
      if (o.id !== id) return o;
      const changes = o.changes.map((c, i) =>
        i === o.changes.length - 1
          ? { ...c, acceptedByCustomer: side === 'customer' ? true : c.acceptedByCustomer,
                   acceptedByExecutor: side === 'executor' ? true : c.acceptedByExecutor }
          : c,
      );
      const last = changes[changes.length - 1];
      const both = last.acceptedByCustomer && last.acceptedByExecutor;
      return { ...o, changes, status: both && o.status === 'created' ? 'awaiting_payment' : o.status };
    });
    commit();
  },
};

/* ---------- Платежи ----------
   PaymentService — абстракция. Реальный провайдер подключается на backend;
   фронт никогда не меняет статус платежа сам. */
export interface PaymentProvider {
  createPayment(orderId: ID, amount: number, method: PaymentMethod): Promise<Payment>;
  getPaymentStatus(paymentId: ID): Promise<Payment | undefined>;
  releasePayment(paymentId: ID): Promise<Payment | undefined>;
  refundPayment(paymentId: ID, reason: string): Promise<Payment | undefined>;
}

export const mockPaymentProvider: PaymentProvider = {
  async createPayment(orderId, amount, method) {
    await new Promise((r) => setTimeout(r, 700));
    const db = getDB();
    const order = db.orders.find((o) => o.id === orderId)!;
    const payment: Payment = {
      id: uid('pay'), orderId, payerId: order.customerId, payeeId: order.executorId,
      amount, commission: Math.round((amount * order.commissionPercent) / 100),
      currency: 'RUB', provider: 'mock', method, status: 'held', createdAt: nowISO(),
    };
    db.payments.unshift(payment);
    db.orders = db.orders.map((o) => (o.id === orderId ? { ...o, status: 'paid', paymentId: payment.id } : o));
    commit();
    return payment;
  },
  async getPaymentStatus(id) {
    return getDB().payments.find((p) => p.id === id);
  },
  async releasePayment(id) {
    await new Promise((r) => setTimeout(r, 500));
    const db = getDB();
    db.payments = db.payments.map((p) => (p.id === id ? { ...p, status: 'released', releasedAt: nowISO() } : p));
    commit();
    return db.payments.find((p) => p.id === id);
  },
  async refundPayment(id) {
    const db = getDB();
    db.payments = db.payments.map((p) => (p.id === id ? { ...p, status: 'refunded' } : p));
    commit();
    return db.payments.find((p) => p.id === id);
  },
};

export const paymentService = mockPaymentProvider;
