import crypto from 'node:crypto';

/* ============================================================
   Отправка СМС-кодов.
   Провайдер НЕ подключён: пока переменные окружения не заданы,
   getSmsProvider() возвращает null, а маршруты честно отвечают 501.
   Ни один код в этом файле не притворяется отправленным.

   Чтобы подключить реального провайдера, реализуйте SmsProvider
   и верните его из getSmsProvider() по значению SMS_PROVIDER.
   ============================================================ */

export interface SmsProvider {
  readonly name: string;
  /** Отправляет текст на номер в формате E.164. Бросает исключение при отказе провайдера. */
  send(phoneE164: string, text: string): Promise<void>;
}

export function getSmsProvider(): SmsProvider | null {
  const name = (process.env.SMS_PROVIDER || '').trim();
  if (!name) return null;

  // Здесь подключается конкретный провайдер, например:
  // if (name === 'smsru') return smsRu(process.env.SMS_API_KEY!);
  // Пока ни одна интеграция не написана — считаем провайдер ненастроенным,
  // чтобы наружу не ушло ложное «код отправлен».
  return null;
}

/* ---------- Хранилище кодов ---------- */

export interface CodeRecord {
  /** Хранится только хэш: сам код не должен лежать ни в памяти, ни в логах. */
  hash: string;
  expiresAt: number;
  attempts: number;
  sentAt: number;
}

export interface CodeStore {
  get(phone: string): Promise<CodeRecord | null>;
  set(phone: string, rec: CodeRecord): Promise<void>;
  delete(phone: string): Promise<void>;
}

/**
 * Реализация в памяти процесса. Годится только для локальной разработки:
 * в serverless каждый инстанс имеет свою память, и код «потеряется».
 * В продакшене нужен Redis или таблица в базе.
 */
const memory = new Map<string, CodeRecord>();
export const memoryCodeStore: CodeStore = {
  async get(phone) {
    const rec = memory.get(phone);
    if (!rec) return null;
    if (rec.expiresAt < Date.now()) { memory.delete(phone); return null; }
    return rec;
  },
  async set(phone, rec) { memory.set(phone, rec); },
  async delete(phone) { memory.delete(phone); },
};

export const CODE_TTL_SECONDS = 120;
export const RESEND_COOLDOWN_SECONDS = 60;
export const MAX_ATTEMPTS = 5;

export function hashCode(phone: string, code: string): string {
  const salt = (process.env.SESSION_SECRET || '').trim();
  return crypto.createHmac('sha256', salt).update(`${phone}:${code}`).digest('hex');
}

export function randomCode(): string {
  // 4 цифры — компромисс между удобством ввода и защитой; защиту даёт лимит попыток.
  return String(crypto.randomInt(0, 10000)).padStart(4, '0');
}

/** Приводим ввод к E.164 для России/СНГ; всё остальное отвергаем. */
export function normalizePhone(raw: string): string | null {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) return `+7${digits.slice(1)}`;
  if (digits.length === 10) return `+7${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
}
