'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/** На сервере layout-эффектов нет — иначе React пишет предупреждение в консоль. */
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
import { cx } from '@/components/ui';

/**
 * Появление при прокрутке. Наблюдатель отключается после первого показа:
 * повторное «выпрыгивание» при возврате наверх выглядит нервно.
 */
export function Reveal({ children, className, as: Tag = 'div' }: {
  children: React.ReactNode; className?: string; as?: 'div' | 'li' | 'section';
}) {
  const ref = useRef<HTMLElement>(null);
  // 'idle' — состояние серверной разметки: без JS содержимое просто видно.
  // Прятать начинаем только на клиенте, до первой отрисовки.
  const [state, setState] = useState<'idle' | 'hidden' | 'shown'>('idle');

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Уже на экране при загрузке — показываем сразу, без выпрыгивания.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
      setState('shown');
      return;
    }

    setState('hidden');
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setState('shown'); io.disconnect(); } },
      { rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    // Страховка: если наблюдатель почему-то не сработал, содержимое
    // всё равно появится — пустой экран хуже отсутствия анимации.
    const t = window.setTimeout(() => setState('shown'), 4000);
    return () => { io.disconnect(); window.clearTimeout(t); };
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cx(state === 'hidden' && 'reveal', state === 'shown' && 'reveal is-in', className)}
    >
      {children}
    </Tag>
  );
}

/** Наклонная бегущая лента. Текст дублируется — вторая половина закрывает шов. */
export function Ribbon({ items, className }: { items: string[]; className?: string }) {
  const row = (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {items.map((t, i) => (
        <span key={i} className="flex items-center gap-8 whitespace-nowrap text-lg font-extrabold uppercase tracking-wide sm:text-2xl">
          {t}
          <Star className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
        </span>
      ))}
    </div>
  );
  return (
    // Отступ по вертикали освобождает место под наклон: без него полосу срезает.
    <div className={cx('overflow-hidden py-[max(14px,1.8vw)]', className)}>
      <div className="-rotate-2 border-y-3 border-ink bg-brand py-3 text-white">
        <div className="ticker" aria-hidden>
          {row}
          {row}
        </div>
        <span className="sr-only">{items.join(' · ')}</span>
      </div>
    </div>
  );
}

/* ---------- Мелкая рисованная бутафория ---------- */

const S = { stroke: 'rgb(var(--c-ink))', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;

export function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 3l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-1.4z" {...S} fill="currentColor" strokeWidth={2} />
    </svg>
  );
}

export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path d="M20 4c1.5 9 6.5 14 16 16-9.5 2-14.5 7-16 16-1.5-9-6.5-14-16-16 9.5-2 14.5-7 16-16z"
        fill="rgb(var(--c-brand))" stroke="rgb(var(--c-ink))" strokeWidth={3} strokeLinejoin="round" />
    </svg>
  );
}

export function Squiggle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 24" className={className} aria-hidden>
      <path d="M3 15c12-16 24 10 36-4s24 14 36-2 24 8 42-1" {...S} />
    </svg>
  );
}

export function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 56" className={className} aria-hidden>
      <path d="M24 46c-11 0-19-7-19-16S13 14 24 14c3-7 10-11 18-11 11 0 20 8 21 18 8 1 14 7 14 14 0 6-5 11-13 11z"
        fill="rgb(var(--c-card))" stroke="rgb(var(--c-ink))" strokeWidth={3} strokeLinejoin="round" />
    </svg>
  );
}

export function Bolt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 44" className={className} aria-hidden>
      <path d="M19 3L5 25h9l-2 16 16-24h-10z" fill="rgb(var(--c-brand))" stroke="rgb(var(--c-ink))" strokeWidth={3} strokeLinejoin="round" />
    </svg>
  );
}
