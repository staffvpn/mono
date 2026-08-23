/* ============================================================
   Разбор задачи, написанной обычным языком.
   Это правила, а не AI: флаг AI_TASK_CREATION выключен, и интерфейс
   не называет это искусственным интеллектом.
   ============================================================ */

import type { Category, Urgency } from '@/types';

export interface ParsedTask {
  title: string;
  categoryId?: string;
  categoryName?: string;
  date?: string;
  dateLabel?: string;
  timeWindow?: string;
  urgency?: Urgency;
  budget?: number;
}

const KEYWORDS: { cat: string; words: string[] }[] = [
  { cat: 'c4', words: ['собрать', 'сборка', 'шкаф', 'кровать', 'комод', 'икеа', 'ikea', 'мебель', 'стеллаж'] },
  { cat: 'c1', words: ['починить', 'ремонт', 'кран', 'протекает', 'розетк', 'свет', 'сантехник', 'стиральн', 'посудомо'] },
  { cat: 'c2', words: ['убрать', 'уборк', 'помыть', 'клининг', 'окна', 'генеральн'] },
  { cat: 'c3', words: ['перевезти', 'переезд', 'грузчик', 'газель', 'вывезти'] },
  { cat: 'c7', words: ['отвезти', 'доставить', 'курьер', 'забрать', 'привезти'] },
  { cat: 'c8', words: ['бот', 'сайт', 'телеграм', 'telegram', 'программ', 'настроить компьютер', 'автоматиз'] },
  { cat: 'c9', words: ['логотип', 'дизайн', 'макет', 'баннер'] },
  { cat: 'c10', words: ['фото', 'снять видео', 'фотограф', 'видеограф'] },
  { cat: 'c13', words: ['собак', 'кошк', 'выгул', 'питом'] },
  { cat: 'c14', words: ['репетитор', 'научить', 'урок', 'подтянуть'] },
  { cat: 'c5', words: ['повесить', 'прибить', 'помочь по дому', 'полк'] },
];

const DAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const DAY_FORMS: Record<string, number> = {
  'понедельник': 1, 'вторник': 2, 'среду': 3, 'среда': 3, 'четверг': 4,
  'пятницу': 5, 'пятница': 5, 'субботу': 6, 'суббота': 6, 'воскресенье': 0,
};

export function parseTask(text: string, categories: Category[]): ParsedTask {
  const t = text.toLowerCase();
  const out: ParsedTask = { title: '' };

  // категория
  for (const k of KEYWORDS) {
    if (k.words.some((w) => t.includes(w))) {
      out.categoryId = k.cat;
      out.categoryName = categories.find((c) => c.id === k.cat)?.name;
      break;
    }
  }

  // дата
  if (t.includes('сегодня')) { out.dateLabel = 'сегодня'; out.date = new Date().toISOString(); out.urgency = 'today'; }
  else if (t.includes('завтра')) {
    const d = new Date(); d.setDate(d.getDate() + 1);
    out.dateLabel = 'завтра'; out.date = d.toISOString(); out.urgency = 'today';
  } else {
    for (const [word, dow] of Object.entries(DAY_FORMS)) {
      if (t.includes(word)) {
        const d = new Date();
        const diff = (dow - d.getDay() + 7) % 7 || 7;
        d.setDate(d.getDate() + diff);
        out.dateLabel = DAYS[dow];
        out.date = d.toISOString();
        out.urgency = 'this_week';
        break;
      }
    }
  }

  // время суток
  if (t.includes('утр')) out.timeWindow = 'утро';
  else if (t.includes('днём') || t.includes('днем') || t.includes('обед')) out.timeWindow = 'день';
  else if (t.includes('вечер')) out.timeWindow = 'вечер';
  else if (t.includes('ноч')) out.timeWindow = 'ночь';

  // срочность
  if (t.includes('срочно') || t.includes('сейчас') || t.includes('как можно быстрее')) out.urgency = 'now';

  // бюджет
  const m = t.match(/(\d[\d\s]{2,})\s*(?:р|₽|руб)/);
  if (m) out.budget = Number(m[1].replace(/\s/g, ''));

  // заголовок — первое предложение без служебных слов
  const first = text.split(/[.!?\n]/)[0].trim();
  out.title = first
    .replace(/^(нужно|надо|требуется|хочу|ищу)\s+/i, '')
    .replace(/\s+(сегодня|завтра|срочно)\b/gi, '')
    .trim();
  if (out.title) out.title = out.title.charAt(0).toUpperCase() + out.title.slice(1);
  if (out.title.length > 60) out.title = out.title.slice(0, 57).trimEnd() + '…';

  return out;
}

/** Ориентир по цене. В проде приходит из аналитики backend. */
export function priceHint(categoryId?: string): { min: number; max: number } | null {
  const map: Record<string, [number, number]> = {
    c1: [1500, 6000], c2: [2500, 9000], c3: [2000, 12000], c4: [1500, 7000],
    c5: [800, 4000], c7: [500, 2500], c8: [8000, 60000], c9: [3000, 30000],
  };
  const v = categoryId ? map[categoryId] : undefined;
  return v ? { min: v[0], max: v[1] } : null;
}
