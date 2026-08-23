'use client';

/* ============================================================
   Обёртка над Telegram WebApp SDK.
   Все вызовы защищены проверкой наличия метода: на старых клиентах
   часть API отсутствует, и падать из-за этого приложение не должно.
   initData НИКОГДА не считается доверенным на фронте — он лишь
   передаётся на backend для проверки подписи.
   ============================================================ */

export interface TgUser {
  id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string;
}

interface TgWebApp {
  initData: string;
  initDataUnsafe: { user?: TgUser; start_param?: string };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  safeAreaInset?: { top: number; bottom: number; left: number; right: number };
  contentSafeAreaInset?: { top: number; bottom: number; left: number; right: number };
  isFullscreen?: boolean;
  BackButton: { show(): void; hide(): void };
  MainButton: {
    setText(t: string): void; show(): void; hide(): void;
    enable(): void; disable(): void; showProgress(l?: boolean): void; hideProgress(): void;
  };
  HapticFeedback?: {
    impactOccurred(s: string): void;
    notificationOccurred(t: string): void;
    selectionChanged(): void;
  };
  ready(): void;
  expand(): void;
  close(): void;
  requestFullscreen?(): void;
  disableVerticalSwipes?(): void;
  setHeaderColor?(c: string): void;
  setBackgroundColor?(c: string): void;
  onEvent(e: string, cb: () => void): void;
  offEvent(e: string, cb: () => void): void;
}

declare global {
  interface Window { Telegram?: { WebApp: TgWebApp } }
}

export function tg(): TgWebApp | null {
  if (typeof window === 'undefined') return null;
  const w = window.Telegram?.WebApp;
  if (!w || w.initData === undefined || w.platform === 'unknown') return null;
  return w;
}

export const inTelegram = () => tg() !== null;

/** Разворачиваем Mini App и отдаём безопасные зоны в CSS. */
export function initMiniApp(): boolean {
  const w = tg();
  if (!w) return false;

  document.documentElement.classList.add('in-telegram');
  const safe = (fn?: () => void) => { try { fn?.(); } catch { /* клиент не умеет */ } };

  safe(() => w.ready());
  safe(() => w.expand());
  safe(() => w.requestFullscreen?.());
  safe(() => w.disableVerticalSwipes?.());

  applyTheme(w);
  applyInsets(w);

  ['safeAreaChanged', 'contentSafeAreaChanged', 'fullscreenChanged', 'viewportChanged']
    .forEach((e) => safe(() => w.onEvent(e, () => applyInsets(w))));
  safe(() => w.onEvent('themeChanged', () => applyTheme(w)));

  return true;
}

/** Тема у приложения одна — песочная, поэтому цвет Telegram подгоняем под неё,
 *  а не наоборот: иначе шапка мессенджера не совпадает с фоном страницы. */
function applyTheme(w: TgWebApp) {
  document.documentElement.setAttribute('data-theme', 'light');
  const bg = '#E4CFBE';
  try { w.setHeaderColor?.(bg); w.setBackgroundColor?.(bg); } catch { /* пусто */ }
}

function applyInsets(w: TgWebApp) {
  const s = w.safeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 };
  const c = w.contentSafeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 };
  const root = document.documentElement.style;
  root.setProperty('--tg-top', `${(s.top || 0) + (c.top || 0)}px`);
  root.setProperty('--tg-bottom', `${(s.bottom || 0) + (c.bottom || 0)}px`);
}

export function haptic(kind: 'light' | 'success' | 'error' | 'select' = 'light') {
  const h = tg()?.HapticFeedback;
  if (!h) return;
  try {
    if (kind === 'success') h.notificationOccurred('success');
    else if (kind === 'error') h.notificationOccurred('error');
    else if (kind === 'select') h.selectionChanged();
    else h.impactOccurred('light');
  } catch { /* пусто */ }
}

export function backButton(show: boolean, onClick?: () => void) {
  const w = tg();
  if (!w) return () => {};
  try {
    if (show) {
      w.BackButton.show();
      if (onClick) { w.onEvent('backButtonClicked', onClick); return () => { try { w.offEvent('backButtonClicked', onClick); w.BackButton.hide(); } catch { /* пусто */ } }; }
    } else w.BackButton.hide();
  } catch { /* пусто */ }
  return () => {};
}

/**
 * Deeplink вида https://t.me/BOT?startapp=task_123 приходит в start_param.
 * Возвращаем маршрут, на который нужно отправить пользователя.
 */
export function startParamRoute(): string | null {
  const p = tg()?.initDataUnsafe?.start_param;
  if (!p) return null;
  const [kind, id] = p.split('_');
  if (!id) return null;
  if (kind === 'task') return `/app/tasks/${id}`;
  if (kind === 'user') return `/app/executors/${id}`;
  if (kind === 'order') return `/app/orders/${id}`;
  if (kind === 'invite') return `/app?ref=${id}`;
  return null;
}
