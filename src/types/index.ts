/* ============================================================
   Доменные типы TEYDO.
   Совпадают с таблицами, описанными в docs/DATABASE.md, чтобы
   переход с моков на реальный backend не требовал правки UI.
   ============================================================ */

export type ID = string;
export type ISODate = string;

/* ---------- Пользователь ---------- */

export type UserRole = 'customer' | 'executor';
export type UserStatus = 'active' | 'limited' | 'blocked' | 'pending_review';

export type VerificationKind = 'phone' | 'telegram' | 'identity' | 'documents';
export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'more_info';

export interface Verification {
  kind: VerificationKind;
  status: VerificationStatus;
  updatedAt: ISODate;
  note?: string;
}

export interface Reputation {
  /** null — оценок ещё не было. Ноль и «нет данных» это разные вещи. */
  rating: number | null;
  reviewsCount: number;
  ordersCompleted: number;
  ordersCancelled: number;
  /** доля успешно завершённых заказов, 0..1 */
  successRate: number | null;
  /** среднее время ответа в минутах */
  responseMinutes: number | null;
  repeatCustomers: number;
  /** внутренний индекс доверия 0..100, считается на backend */
  trustIndex: number | null;
}

export interface Availability {
  today: boolean;
  tomorrow: boolean;
  thisWeek: boolean;
  byAgreement: boolean;
}

export interface ExecutorProfile {
  headline: string;
  about: string;
  categories: ID[];
  skills: string[];
  experienceYears: number | null;
  rateFrom: number | null;
  district: string;
  portfolio: PortfolioItem[];
  availability: Availability;
}

export interface PortfolioItem {
  id: ID;
  title: string;
  image: string;
}

export interface User {
  id: ID;
  name: string;
  username?: string;
  phone?: string;
  telegramId?: number;
  avatar: string;
  city: string;
  district?: string;
  createdAt: ISODate;
  lastSeenAt: ISODate;
  status: UserStatus;
  /** роль, в которой человек сейчас работает; аккаунт всегда один */
  activeRole: UserRole;
  verifications: Verification[];
  reputation: Reputation;
  executor?: ExecutorProfile;
  restrictions?: UserRestriction[];
}

export interface UserRestriction {
  kind: 'tasks' | 'applications' | 'messages' | 'account';
  until: ISODate | null;
  reason: string;
  createdAt: ISODate;
}

/* ---------- Категории ---------- */

export interface Category {
  id: ID;
  slug: string;
  name: string;
  emoji: string;
  parentId: ID | null;
  order: number;
  enabled: boolean;
  archived?: boolean;
  description?: string;
}

/* ---------- Задача ---------- */

export type TaskRelevance =
  | 'active'            // актуальна
  | 'comparing'         // клиент сравнивает предложения
  | 'needs_confirm'     // требует подтверждения
  | 'inactive'          // неактуальна
  | 'done';             // завершена

export type TaskModeration = 'published' | 'on_review' | 'hidden' | 'archived';
export type Urgency = 'now' | 'today' | 'this_week' | 'flexible';
/**
 * Способ оплаты внутри площадки. Наличных и «переведу на карту» здесь нет
 * намеренно: вне платформы не работают ни резерв средств, ни разбор спора,
 * ни комиссия. Всё проходит через платёжный контур TEYDO.
 */
export type PaymentMethod = 'card' | 'sbp' | 'telegram';

export interface TaskBudget {
  /** null + unknown:true — «не знаю цену», показываем ориентир */
  amount: number | null;
  min?: number;
  max?: number;
  unknown: boolean;
  negotiable: boolean;
}

export interface TaskGeo {
  address: string;
  district?: string;
  city: string;
  lat?: number;
  lng?: number;
  /** расстояние до текущего пользователя в км, приходит с backend */
  distanceKm?: number;
}

export interface Task {
  id: ID;
  authorId: ID;
  title: string;
  description: string;
  categoryId: ID;
  subcategoryId?: ID;
  photos: string[];
  geo: TaskGeo;
  date: ISODate | null;
  timeWindow?: string;
  urgency: Urgency;
  budget: TaskBudget;
  extraTerms?: string;
  relevance: TaskRelevance;
  moderation: TaskModeration;
  createdAt: ISODate;
  updatedAt: ISODate;
  applicationsCount: number;
  viewsCount: number;
  reportsCount: number;
  selectedExecutorId?: ID;
  orderId?: ID;
}

/** Насколько задача подходит исполнителю. Считается MatchingService. */
export interface MatchScore {
  score: number;              // 0..100
  reasons: string[];          // человеческие объяснения
}

/* ---------- Отклик ---------- */

export type ApplicationStatus = 'sent' | 'viewed' | 'accepted' | 'declined' | 'withdrawn';

export interface Application {
  id: ID;
  taskId: ID;
  executorId: ID;
  price: number;
  altPrice?: number;
  comment: string;
  durationHours?: number;
  canStart: string;
  extra?: string;
  status: ApplicationStatus;
  createdAt: ISODate;
  orderId?: ID;
}

/* ---------- Заказ ---------- */

export type OrderStatus =
  | 'created'
  | 'awaiting_payment'
  | 'paid'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'refunded';

export interface OrderTerms {
  what: string;
  price: number;
  date: ISODate | null;
  timeWindow: string;
  place: string;
  extra?: string;
}

export interface OrderChange {
  id: ID;
  at: ISODate;
  byUserId: ID;
  terms: OrderTerms;
  acceptedByCustomer: boolean;
  acceptedByExecutor: boolean;
}

export interface Order {
  id: ID;
  taskId: ID;
  customerId: ID;
  executorId: ID;
  status: OrderStatus;
  terms: OrderTerms;
  changes: OrderChange[];
  commissionPercent: number;
  paymentId?: ID;
  createdAt: ISODate;
  completedAt?: ISODate;
  disputeId?: ID;
  reviewedByCustomer: boolean;
  reviewedByExecutor: boolean;
}

/* ---------- Чат ---------- */

export type MessageKind = 'text' | 'photo' | 'file' | 'voice' | 'system' | 'offer';

export interface Message {
  id: ID;
  threadId: ID;
  authorId: ID | 'system';
  kind: MessageKind;
  text: string;
  attachments?: string[];
  offer?: OrderTerms;
  createdAt: ISODate;
  readBy: ID[];
}

export interface Thread {
  id: ID;
  taskId: ID;
  customerId: ID;
  executorId: ID;
  orderId?: ID;
  lastMessageAt: ISODate;
  unread: number;
}

/* ---------- Отзывы ---------- */

export interface ReviewScores {
  quality?: number; deadline?: number; communication?: number; priceMatch?: number;
  adequacy?: number; descriptionMatch?: number; punctuality?: number; payment?: number;
}

export interface Review {
  id: ID;
  orderId: ID;
  authorId: ID;
  targetId: ID;
  direction: 'customer_to_executor' | 'executor_to_customer';
  scores: ReviewScores;
  average: number;
  text: string;
  createdAt: ISODate;
}

/* ---------- Прочее ---------- */

export interface Favorite {
  id: ID;
  userId: ID;
  kind: 'task' | 'user';
  targetId: ID;
  createdAt: ISODate;
}

export type NotificationKind =
  | 'application' | 'message' | 'order' | 'reminder' | 'relevance'
  | 'payment' | 'completed' | 'review' | 'dispute' | 'match' | 'system';

export interface AppNotification {
  id: ID;
  userId: ID;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: ISODate;
}

export type PaymentStatus = 'pending' | 'held' | 'released' | 'failed' | 'refunded';

export interface Payment {
  id: ID;
  orderId: ID;
  payerId: ID;
  payeeId: ID;
  /** Сумма заказа. Исполнителю уходит amount − commission. */
  amount: number;
  commission: number;
  currency: 'RUB';
  provider: string;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: ISODate;
  releasedAt?: ISODate;
  error?: string;
}

/* ---------- Кошелёк ---------- */

export type PayoutStatus = 'requested' | 'processing' | 'paid' | 'rejected';

export interface Payout {
  id: ID;
  userId: ID;
  amount: number;
  /** Куда выводим. Реквизиты хранит платёжный провайдер, не площадка. */
  destination: 'card' | 'sbp';
  masked: string;
  status: PayoutStatus;
  createdAt: ISODate;
  processedAt?: ISODate;
  reason?: string;
}

/** Строка истории кошелька. Считается из платежей и выплат, не хранится отдельно. */
export interface WalletEntry {
  id: ID;
  at: ISODate;
  kind: 'hold' | 'earned' | 'spent' | 'refund' | 'payout' | 'commission';
  amount: number;
  title: string;
  orderId?: ID;
}

export interface WalletBalance {
  /** Можно вывести прямо сейчас. */
  available: number;
  /** Зарезервировано по активным заказам — придёт после приёмки. */
  pending: number;
  /** Всего заработано за всё время. */
  earnedTotal: number;
  /** Всего потрачено за всё время (для заказчика). */
  spentTotal: number;
}

export type DisputeStatus = 'open' | 'in_review' | 'need_info' | 'resolved' | 'closed';
export type DisputeReason =
  | 'executor_no_show' | 'customer_no_show' | 'bad_work'
  | 'no_payment' | 'terms_changed' | 'description_mismatch' | 'other';

export interface Dispute {
  id: ID;
  orderId: ID;
  openedBy: ID;
  reason: DisputeReason;
  comment: string;
  evidence: string[];
  status: DisputeStatus;
  createdAt: ISODate;
  resolution?: {
    decision: 'customer' | 'executor' | 'refund_full' | 'refund_partial' | 'other';
    comment: string;
    byAdminId: ID;
    at: ISODate;
  };
}

export interface Report {
  id: ID;
  reporterId: ID;
  targetKind: 'user' | 'task' | 'message';
  targetId: ID;
  reason: string;
  comment: string;
  attachments: string[];
  status: 'new' | 'in_review' | 'accepted' | 'rejected';
  createdAt: ISODate;
}

export interface SupportTicket {
  id: ID;
  userId: ID;
  topic: string;
  message: string;
  orderId?: ID;
  status: 'new' | 'open' | 'waiting_user' | 'waiting_admin' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high';
  assignedTo?: ID;
  createdAt: ISODate;
  internalNotes: { at: ISODate; byAdminId: ID; text: string }[];
}

export interface Referral {
  code: string;
  ownerId: ID;
  invitedUserId?: ID;
  createdAt: ISODate;
  result: 'pending' | 'registered' | 'first_order';
}

/* ---------- Админка ---------- */

export type AdminRole = 'OWNER' | 'SUPER_ADMIN' | 'MODERATOR' | 'SUPPORT' | 'FINANCE' | 'ANALYST';

export interface AdminUser {
  id: ID;
  name: string;
  role: AdminRole;
}

export interface AuditEntry {
  id: ID;
  at: ISODate;
  adminId: ID;
  adminName: string;
  adminRole: AdminRole;
  action: string;
  entityType: string;
  entityId: ID;
  before?: string;
  after?: string;
  reason?: string;
}

export interface FeatureFlag {
  key: string;
  title: string;
  enabled: boolean;
  audience: 'all' | 'test' | 'off';
  description: string;
}

export interface RiskEvent {
  id: ID;
  userId: ID;
  signal: string;
  detail: string;
  score: number;
  at: ISODate;
  status: 'new' | 'in_review' | 'resolved' | 'rejected';
}

export interface ModerationItem {
  id: ID;
  kind: 'report' | 'task' | 'verification' | 'risk' | 'dispute' | 'payment';
  title: string;
  entityId: ID;
  priority: 'low' | 'normal' | 'high';
  status: 'new' | 'in_review' | 'waiting' | 'resolved' | 'rejected' | 'escalated';
  at: ISODate;
  assignee?: string;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
