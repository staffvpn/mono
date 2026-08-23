/** Флаги окружения. Секретов здесь быть не должно — только публичные значения. */
export const CONFIG = {
  /** Пока backend не подключён, весь слой данных работает на моках. */
  useMock: (process.env.NEXT_PUBLIC_USE_MOCK_DATA ?? 'true') !== 'false',
  /** Пусто = свои маршруты в /api того же домена. */
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'teydobot',
} as const;
