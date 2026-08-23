/**
 * Название рабочее и может смениться — держим его в одном месте,
 * чтобы замена не превращалась в поиск по всему проекту.
 */
export const BRAND = {
  name: 'TEYDO',
  slogan: 'Есть дело? Найдём того, кто сделает.',
  sloganShort: 'Есть дело? Давай сделаем.',
  supportTelegram: '@teydo_support',
  botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'teydobot',
} as const;
