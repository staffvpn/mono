import type { OrderStatus } from '@/types';

export const ORDER_LABEL: Record<OrderStatus, { l: string; tone: 'neutral' | 'ok' | 'warn' | 'danger' | 'brand' }> = {
  created: { l: 'Условия не подтверждены', tone: 'warn' },
  awaiting_payment: { l: 'Ждёт оплаты', tone: 'warn' },
  paid: { l: 'Оплачен, деньги зарезервированы', tone: 'brand' },
  in_progress: { l: 'В работе', tone: 'brand' },
  completed: { l: 'Завершён', tone: 'ok' },
  cancelled: { l: 'Отменён', tone: 'neutral' },
  disputed: { l: 'Спор', tone: 'danger' },
  refunded: { l: 'Возврат', tone: 'neutral' },
};
