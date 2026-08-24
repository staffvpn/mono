'use client';

import { useId, useState } from 'react';
import { cx } from '@/components/ui';

/**
 * Вопрос-ответ с плавным раскрытием.
 * Нативный <details> высоту не анимирует, поэтому раскрываем сеткой 0fr→1fr.
 */
export function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();

  return (
    <div className="flex flex-col gap-3">
      {items.map((f, i) => {
        const isOpen = open === i;
        const id = `${base}-${i}`;
        return (
          <div
            key={f.q}
            className={cx(
              'overflow-hidden rounded-xl border-3 border-ink shadow-pop-sm transition-colors duration-300',
              isOpen ? 'acc-open bg-surface' : 'bg-card',
            )}
          >
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={id}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left text-[17px] font-extrabold tracking-tight sm:text-lg"
              >
                {f.q}
                <span
                  aria-hidden
                  className={cx(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-full border-3 border-ink text-lg leading-none',
                    'transition-[rotate,background-color] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]',
                    isOpen ? 'rotate-[135deg] bg-brand text-white' : 'bg-card',
                  )}
                >
                  <span className="-mt-px">+</span>
                </span>
              </button>
            </h3>
            <div id={id} role="region" className="acc-body">
              <div>
                <p className="border-t-2 border-ink/10 px-5 pb-5 pt-4 text-[15px] leading-relaxed text-muted">
                  {f.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
