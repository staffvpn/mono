import type {
  Category, User, Task, Application, Order, Thread, Message, AppNotification,
  Payment, Dispute, Report, SupportTicket, AuditEntry, FeatureFlag, RiskEvent,
  ModerationItem, Review,
} from '@/types';

/* ============================================================
   ДЕМО-ДАННЫЕ. Не выдавать за настоящие: интерфейс помечает их
   плашкой «демо-режим», а CONFIG.useMock включает этот слой.
   ============================================================ */

const now = Date.now();
const iso = (minusMinutes: number) => new Date(now - minusMinutes * 60_000).toISOString();

export const categories: Category[] = [
  { id: 'c1', slug: 'repair', name: 'Ремонт', emoji: '🔧', parentId: null, order: 1, enabled: true },
  { id: 'c2', slug: 'cleaning', name: 'Уборка', emoji: '🧼', parentId: null, order: 2, enabled: true },
  { id: 'c3', slug: 'moving', name: 'Перевозки', emoji: '🚚', parentId: null, order: 3, enabled: true },
  { id: 'c4', slug: 'assembly', name: 'Сборка', emoji: '🪑', parentId: null, order: 4, enabled: true },
  { id: 'c5', slug: 'home', name: 'Помощь по дому', emoji: '🏠', parentId: null, order: 5, enabled: true },
  { id: 'c6', slug: 'auto', name: 'Авто', emoji: '🚗', parentId: null, order: 6, enabled: true },
  { id: 'c7', slug: 'delivery', name: 'Доставка', emoji: '📦', parentId: null, order: 7, enabled: true },
  { id: 'c8', slug: 'computers', name: 'Компьютеры', emoji: '💻', parentId: null, order: 8, enabled: true },
  { id: 'c9', slug: 'design', name: 'Дизайн', emoji: '🎨', parentId: null, order: 9, enabled: true },
  { id: 'c10', slug: 'photo', name: 'Фото и видео', emoji: '📷', parentId: null, order: 10, enabled: true },
  { id: 'c11', slug: 'work', name: 'Работа', emoji: '💼', parentId: null, order: 11, enabled: true },
  { id: 'c12', slug: 'events', name: 'Мероприятия', emoji: '🎉', parentId: null, order: 12, enabled: true },
  { id: 'c13', slug: 'pets', name: 'Животные', emoji: '🐕', parentId: null, order: 13, enabled: true },
  { id: 'c14', slug: 'learning', name: 'Обучение', emoji: '📚', parentId: null, order: 14, enabled: true },
  { id: 'c15', slug: 'beauty', name: 'Красота', emoji: '💅', parentId: null, order: 15, enabled: true },
  { id: 'c16', slug: 'other', name: 'Другое', emoji: '✨', parentId: null, order: 16, enabled: true },
  { id: 'c4a', slug: 'furniture', name: 'Сборка мебели', emoji: '🔩', parentId: 'c4', order: 1, enabled: true },
  { id: 'c1a', slug: 'plumbing', name: 'Сантехника', emoji: '🚿', parentId: 'c1', order: 1, enabled: true },
  { id: 'c1b', slug: 'electric', name: 'Электрика', emoji: '💡', parentId: 'c1', order: 2, enabled: true },
  { id: 'c8a', slug: 'bots', name: 'Боты и автоматизация', emoji: '🤖', parentId: 'c8', order: 1, enabled: true },
];

const emptyRep = {
  rating: null, reviewsCount: 0, ordersCompleted: 0, ordersCancelled: 0,
  successRate: null, responseMinutes: null, repeatCustomers: 0, trustIndex: null,
};

export const users: User[] = [
  {
    id: 'u0', name: 'Вы', avatar: '/av/man-01.webp', city: 'Москва', district: 'Хамовники',
    createdAt: iso(60 * 24 * 40), lastSeenAt: iso(1), status: 'active', activeRole: 'customer',
    verifications: [
      { kind: 'telegram', status: 'approved', updatedAt: iso(60 * 24 * 40) },
      { kind: 'phone', status: 'none', updatedAt: iso(60 * 24 * 40) },
      { kind: 'identity', status: 'none', updatedAt: iso(60 * 24 * 40) },
    ],
    reputation: { ...emptyRep },
  },
  {
    id: 'u1', name: 'Артём Соколов', username: 'artem_fix', avatar: '/av/man-03.webp',
    city: 'Москва', district: 'Хамовники', createdAt: iso(60 * 24 * 400), lastSeenAt: iso(12),
    status: 'active', activeRole: 'executor',
    verifications: [
      { kind: 'telegram', status: 'approved', updatedAt: iso(60 * 24 * 400) },
      { kind: 'phone', status: 'approved', updatedAt: iso(60 * 24 * 400) },
      { kind: 'identity', status: 'approved', updatedAt: iso(60 * 24 * 300) },
    ],
    reputation: {
      rating: 4.9, reviewsCount: 63, ordersCompleted: 71, ordersCancelled: 2,
      successRate: 0.97, responseMinutes: 11, repeatCustomers: 19, trustIndex: 92,
    },
    executor: {
      headline: 'Мастер на час, сборка и мелкий ремонт',
      about: 'Собираю мебель любой сложности, чиню краны и розетки. Инструмент свой, мусор увожу.',
      categories: ['c1', 'c4', 'c5'], skills: ['Сборка мебели', 'Сантехника', 'Электрика', 'Мелкий ремонт'],
      experienceYears: 7, rateFrom: 1500, district: 'Хамовники, Якиманка',
      portfolio: [
        { id: 'p1', title: 'Кухня под ключ', image: '/cat-1.webp' },
        { id: 'p2', title: 'Шкаф-купе 3 м', image: '/cat-4.webp' },
      ],
      availability: { today: true, tomorrow: true, thisWeek: true, byAgreement: true },
    },
  },
  {
    id: 'u2', name: 'Даша Резник', username: 'dasha_clean', avatar: '/av/girl-02.webp',
    city: 'Москва', district: 'Пресня', createdAt: iso(60 * 24 * 200), lastSeenAt: iso(40),
    status: 'active', activeRole: 'executor',
    verifications: [
      { kind: 'telegram', status: 'approved', updatedAt: iso(60 * 24 * 200) },
      { kind: 'phone', status: 'approved', updatedAt: iso(60 * 24 * 200) },
      { kind: 'identity', status: 'pending', updatedAt: iso(60 * 8) },
    ],
    reputation: {
      rating: 4.8, reviewsCount: 41, ordersCompleted: 44, ordersCancelled: 1,
      successRate: 0.98, responseMinutes: 7, repeatCustomers: 15, trustIndex: 88,
    },
    executor: {
      headline: 'Клининг: генеральная, после ремонта, окна',
      about: 'Работаю со своей химией и техникой. Люблю, когда после меня в квартире пахнет ничем.',
      categories: ['c2', 'c5'], skills: ['Генеральная уборка', 'После ремонта', 'Мытьё окон', 'Химчистка'],
      experienceYears: 4, rateFrom: 2500, district: 'Пресня, Сити',
      portfolio: [{ id: 'p3', title: 'Квартира после ремонта', image: '/cat-4.webp' }],
      availability: { today: false, tomorrow: true, thisWeek: true, byAgreement: true },
    },
  },
  {
    id: 'u3', name: 'Кирилл Ваулин', username: 'kir_dev', avatar: '/av/man-04.webp',
    city: 'Москва', district: 'Удалённо', createdAt: iso(60 * 24 * 120), lastSeenAt: iso(3),
    status: 'active', activeRole: 'executor',
    verifications: [
      { kind: 'telegram', status: 'approved', updatedAt: iso(60 * 24 * 120) },
      { kind: 'phone', status: 'approved', updatedAt: iso(60 * 24 * 120) },
      { kind: 'identity', status: 'none', updatedAt: iso(60 * 24 * 120) },
    ],
    reputation: {
      rating: 5, reviewsCount: 12, ordersCompleted: 13, ordersCancelled: 0,
      successRate: 1, responseMinutes: 24, repeatCustomers: 5, trustIndex: 79,
    },
    executor: {
      headline: 'Telegram-боты, автоматизация, интеграции',
      about: 'Делаю ботов под запись, оплату и уведомления. Отдаю с исходниками и инструкцией.',
      categories: ['c8'], skills: ['Telegram Bot API', 'Node.js', 'Автоматизация', 'Интеграции'],
      experienceYears: 5, rateFrom: 15000, district: 'Удалённо',
      portfolio: [{ id: 'p4', title: 'Бот записи для салона', image: '/cat-3.webp' }],
      availability: { today: true, tomorrow: true, thisWeek: true, byAgreement: true },
    },
  },
  {
    id: 'u4', name: 'Настя Ким', username: 'nastya_go', avatar: '/av/girl-05.webp',
    city: 'Москва', district: 'Центр', createdAt: iso(60 * 24 * 60), lastSeenAt: iso(90),
    status: 'active', activeRole: 'executor',
    verifications: [
      { kind: 'telegram', status: 'approved', updatedAt: iso(60 * 24 * 60) },
      { kind: 'phone', status: 'approved', updatedAt: iso(60 * 24 * 60) },
    ],
    reputation: {
      rating: 4.7, reviewsCount: 28, ordersCompleted: 30, ordersCancelled: 3,
      successRate: 0.91, responseMinutes: 5, repeatCustomers: 8, trustIndex: 74,
    },
    executor: {
      headline: 'Курьер по центру, документы и мелкие посылки',
      about: 'Пешком и на самокате. Беру срочные доставки, аккуратна с документами.',
      categories: ['c7', 'c3'], skills: ['Курьер', 'Документы', 'Срочная доставка'],
      experienceYears: 2, rateFrom: 700, district: 'ЦАО',
      portfolio: [],
      availability: { today: true, tomorrow: false, thisWeek: true, byAgreement: true },
    },
  },
  {
    id: 'u5', name: 'Ольга Пенкина', username: 'olga_p', avatar: '/av/girl-07.webp',
    city: 'Москва', district: 'Сокол', createdAt: iso(60 * 24 * 15), lastSeenAt: iso(600),
    status: 'pending_review', activeRole: 'customer',
    verifications: [{ kind: 'telegram', status: 'approved', updatedAt: iso(60 * 24 * 15) }],
    reputation: { ...emptyRep, rating: 4.6, reviewsCount: 3, ordersCompleted: 3, successRate: 1 },
  },
];

export const tasks: Task[] = [
  {
    id: 't1', authorId: 'u0', title: 'Собрать шкаф-купе', categoryId: 'c4', subcategoryId: 'c4a',
    description: 'Шкаф 2,4 м, коробки уже в квартире, инструкция есть. Нужен мастер со своим инструментом на вечер.',
    photos: ['/cat-1.webp'],
    geo: { address: 'ул. Тимура Фрунзе, 11', district: 'Хамовники', city: 'Москва', distanceKm: 1.2 },
    date: iso(-60 * 8), timeWindow: '18:00–21:00', urgency: 'today',
    budget: { amount: 3500, unknown: false, negotiable: true }, payMethod: 'card',
    relevance: 'active', moderation: 'published', createdAt: iso(15), updatedAt: iso(15),
    applicationsCount: 2, viewsCount: 34, reportsCount: 0,
  },
  {
    id: 't2', authorId: 'u5', title: 'Telegram-бот для записи клиентов', categoryId: 'c8', subcategoryId: 'c8a',
    description: 'Запись в салон, напоминания за сутки, выгрузка в Google Таблицу. ТЗ готово, покажу в чате.',
    photos: ['/cat-3.webp'],
    geo: { address: 'Удалённо', city: 'Москва' },
    date: null, urgency: 'this_week',
    budget: { amount: null, min: 20000, max: 40000, unknown: true, negotiable: true }, payMethod: 'sbp',
    relevance: 'comparing', moderation: 'published', createdAt: iso(32), updatedAt: iso(20),
    applicationsCount: 4, viewsCount: 96, reportsCount: 0,
  },
  {
    id: 't3', authorId: 'u0', title: 'Починить стиральную машину', categoryId: 'c1',
    description: 'Не сливает воду, гудит при отжиме. Bosch, четыре года. Нужен выезд сегодня или завтра.',
    photos: [],
    geo: { address: 'Ленинский просп., 32', district: 'Гагаринский', city: 'Москва', distanceKm: 3.8 },
    date: iso(-60 * 20), timeWindow: 'после 17:00', urgency: 'now',
    budget: { amount: 2200, unknown: false, negotiable: false }, payMethod: 'cash',
    relevance: 'needs_confirm', moderation: 'published', createdAt: iso(60 * 26), updatedAt: iso(60 * 26),
    applicationsCount: 1, viewsCount: 51, reportsCount: 0,
  },
  {
    id: 't4', authorId: 'u5', title: 'Отвезти документы в Сити', categoryId: 'c7',
    description: 'Забрать папку на Пресне и отвезти в Башню Федерация до 18:00. Ничего тяжёлого.',
    photos: [],
    geo: { address: 'Пресненская наб., 12', district: 'Пресня', city: 'Москва', distanceKm: 5.4 },
    date: iso(-60 * 4), timeWindow: 'до 18:00', urgency: 'today',
    budget: { amount: 1400, unknown: false, negotiable: false }, payMethod: 'card',
    relevance: 'active', moderation: 'published', createdAt: iso(120), updatedAt: iso(120),
    applicationsCount: 0, viewsCount: 12, reportsCount: 0,
  },
  {
    id: 't5', authorId: 'u0', title: 'Генеральная уборка двушки', categoryId: 'c2',
    description: 'Квартира 58 м², после ремонта. Нужны окна, плинтусы и кухня. Химия ваша.',
    photos: ['/cat-4.webp'],
    geo: { address: 'ул. Гиляровского, 7', district: 'Мещанский', city: 'Москва', distanceKm: 6.1 },
    date: iso(-60 * 48), timeWindow: 'утро', urgency: 'this_week',
    budget: { amount: null, min: 5000, max: 9000, unknown: true, negotiable: true }, payMethod: 'any',
    relevance: 'active', moderation: 'published', createdAt: iso(200), updatedAt: iso(200),
    applicationsCount: 1, viewsCount: 40, reportsCount: 0,
  },
  {
    id: 't6', authorId: 'u5', title: 'Повесить телевизор на кронштейн', categoryId: 'c5',
    description: 'Телевизор 55", стена бетонная, кронштейн куплен. Нужен перфоратор.',
    photos: [],
    geo: { address: 'Кутузовский просп., 24', district: 'Дорогомилово', city: 'Москва', distanceKm: 4.5 },
    date: null, urgency: 'flexible',
    budget: { amount: 2000, unknown: false, negotiable: true }, payMethod: 'cash',
    relevance: 'active', moderation: 'on_review', createdAt: iso(300), updatedAt: iso(300),
    applicationsCount: 0, viewsCount: 5, reportsCount: 1,
  },
];

export const applications: Application[] = [
  {
    id: 'a1', taskId: 't1', executorId: 'u1', price: 3500, comment: 'Возьмусь на сегодня, инструмент свой. Соберу за 2–3 часа.',
    durationHours: 3, canStart: 'сегодня после 18:00', status: 'sent', createdAt: iso(10),
  },
  {
    id: 'a2', taskId: 't1', executorId: 'u2', price: 3800, altPrice: 3500,
    comment: 'Могу завтра утром, если сегодня не горит.', durationHours: 3, canStart: 'завтра с 10:00',
    status: 'viewed', createdAt: iso(6),
  },
  {
    id: 'a3', taskId: 't2', executorId: 'u3', price: 28000, comment: 'Сделаю за 4 дня, отдам с исходниками и инструкцией.',
    durationHours: 32, canStart: 'завтра', status: 'sent', createdAt: iso(18),
  },
  {
    id: 'a4', taskId: 't5', executorId: 'u2', price: 7000, comment: 'После ремонта работаю часто, окна включены в цену.',
    durationHours: 6, canStart: 'в четверг утром', status: 'sent', createdAt: iso(150),
  },
];

export const orders: Order[] = [];
export const threads: Thread[] = [];
export const messages: Message[] = [];
export const reviews: Review[] = [];

export const notifications: AppNotification[] = [
  { id: 'n1', userId: 'u0', kind: 'match', title: 'Нашли 3 задачи рядом', body: 'Сборка и мелкий ремонт в вашем районе.', href: '/app/tasks', read: false, createdAt: iso(25) },
  { id: 'n2', userId: 'u0', kind: 'relevance', title: 'Задача ещё актуальна?', body: '«Починить стиральную машину» ждёт подтверждения.', href: '/app/tasks/t3', read: false, createdAt: iso(90) },
  { id: 'n3', userId: 'u0', kind: 'system', title: 'Демо-режим', body: 'Данные в приложении показательные — backend ещё не подключён.', read: true, createdAt: iso(400) },
];

export const payments: Payment[] = [];
export const disputes: Dispute[] = [];
export const reports: Report[] = [
  { id: 'r1', reporterId: 'u1', targetKind: 'task', targetId: 't6', reason: 'Похоже на дубль', comment: 'Такая же задача была вчера от другого аккаунта.', attachments: [], status: 'new', createdAt: iso(120) },
];
export const supportTickets: SupportTicket[] = [
  { id: 's1', userId: 'u5', topic: 'Проблема с заказом', message: 'Исполнитель не выходит на связь второй день.', status: 'new', priority: 'high', createdAt: iso(80), internalNotes: [] },
];

export const featureFlags: FeatureFlag[] = [
  { key: 'AI_MATCHING', title: 'Умный подбор через AI', enabled: false, audience: 'off', description: 'Сейчас подбор работает на детерминированных правилах MatchingService.' },
  { key: 'AI_TASK_CREATION', title: 'AI в создании задачи', enabled: false, audience: 'off', description: 'Разбор текста задачи — на правилах, без модели.' },
  { key: 'SAFE_DEAL', title: 'Безопасная сделка', enabled: true, audience: 'test', description: 'UI готов, платёжный провайдер не подключён.' },
  { key: 'REFERRALS', title: 'Реферальная программа', enabled: false, audience: 'off', description: 'Награда не определена — держим выключенной.' },
  { key: 'PREMIUM', title: 'Платные возможности', enabled: false, audience: 'off', description: 'В MVP не входит.' },
  { key: 'VERIFICATION', title: 'Проверка личности', enabled: true, audience: 'all', description: 'Очередь проверок в админке.' },
  { key: 'NEW_CHAT', title: 'Новый чат', enabled: true, audience: 'all', description: '' },
  { key: 'NEW_SEARCH', title: 'Новый поиск', enabled: true, audience: 'all', description: '' },
];

export const riskEvents: RiskEvent[] = [
  { id: 'k1', userId: 'u4', signal: 'Массовые отклики', detail: '38 откликов за 40 минут', score: 62, at: iso(70), status: 'new' },
  { id: 'k2', userId: 'u5', signal: 'Повторяющиеся жалобы', detail: 'Две жалобы за неделю от разных пользователей', score: 41, at: iso(200), status: 'in_review' },
];

export const moderationQueue: ModerationItem[] = [
  { id: 'm1', kind: 'task', title: 'Задача на модерации: «Повесить телевизор»', entityId: 't6', priority: 'normal', status: 'new', at: iso(300) },
  { id: 'm2', kind: 'report', title: 'Жалоба на задачу t6', entityId: 'r1', priority: 'normal', status: 'new', at: iso(120) },
  { id: 'm3', kind: 'verification', title: 'Проверка личности: Даша Резник', entityId: 'u2', priority: 'high', status: 'new', at: iso(480) },
  { id: 'm4', kind: 'risk', title: 'Массовые отклики от Насти Ким', entityId: 'k1', priority: 'high', status: 'new', at: iso(70) },
];

export const auditLog: AuditEntry[] = [
  { id: 'l1', at: iso(60), adminId: 'ad1', adminName: 'Владелец', adminRole: 'OWNER', action: 'Открыт демо-режим', entityType: 'system', entityId: '-', reason: 'Первый запуск' },
];
