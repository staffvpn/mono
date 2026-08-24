'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cx } from '@/components/ui';

/**
 * Горизонтальная лента фильтров.
 * Полоса прокрутки спрятана, поэтому нужны свои признаки того, что лента
 * листается: стрелки и затемнение у краёв. Без них на мыши выглядит так,
 * будто список просто обрезан.
 */
export function ScrollRow({ children, className, label }: {
  children: React.ReactNode; className?: string; label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, children]);

  const nudge = (dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * Math.round(ref.current.clientWidth * 0.75), behavior: 'smooth' });

  const arrow = 'absolute top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-card text-sm shadow-pop-sm transition-opacity hover:bg-sand';

  return (
    <div className={cx('relative', className)}>
      <div
        ref={ref}
        onScroll={measure}
        role="group"
        aria-label={label}
        className="no-bar flex gap-2 overflow-x-auto scroll-smooth px-0.5 py-0.5"
      >
        {children}
      </div>

      {!atStart && (
        <>
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-card to-transparent" />
          <button type="button" onClick={() => nudge(-1)} aria-label="Прокрутить влево" className={cx(arrow, 'left-0')}>‹</button>
        </>
      )}
      {!atEnd && (
        <>
          <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent" />
          <button type="button" onClick={() => nudge(1)} aria-label="Прокрутить вправо" className={cx(arrow, 'right-0')}>›</button>
        </>
      )}
    </div>
  );
}
