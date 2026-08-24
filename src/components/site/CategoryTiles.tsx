'use client';

import Image from 'next/image';
import Link from 'next/link';

/**
 * Лента категорий: наведённая плитка расширяется, соседние сжимаются.
 * Растёт flex-grow, а не масштаб, поэтому соседи отодвигаются,
 * а не оказываются перекрыты.
 */
const TILES = [
  { img: '/cat-1.webp', title: 'Ремонт и сантехника', note: 'Кран, полка, розетка, стиралка', href: '/tasks' },
  { img: '/cat-4.webp', title: 'Уборка', note: 'Квартира, после ремонта, окна', href: '/tasks' },
  { img: '/cat-2.webp', title: 'Доставка и перевозки', note: 'Документы, покупки, переезд', href: '/tasks' },
  { img: '/cat-3.webp', title: 'Digital и боты', note: 'Telegram-бот, сайт, автоматизация', href: '/tasks' },
];

export function CategoryTiles() {
  return (
    <div className="flex flex-col gap-4 md:h-[460px] md:flex-row">
      {TILES.map((t, i) => (
        <Link
          key={t.title}
          href={t.href}
          className="group relative block h-64 overflow-hidden rounded-xl border-3 border-ink shadow-pop
                     transition-[flex-grow,box-shadow] duration-500 ease-[cubic-bezier(.22,.9,.24,1)]
                     focus-visible:shadow-pop-lg md:h-auto md:flex-[1_1_0%] md:hover:flex-[2.4_1_0%]
                     md:focus-visible:flex-[2.4_1_0%] md:hover:shadow-pop-lg"
        >
          <Image
            src={t.img}
            alt=""
            width={628}
            height={628}
            sizes="(max-width: 768px) 100vw, 40vw"
            priority={i < 2}
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
          {/* Затемнение только снизу: подпись читается, картинка остаётся видна. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/85 via-ink/45 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="text-xl font-extrabold leading-tight tracking-tight text-white drop-shadow-sm">
              {t.title}
            </div>
            <div className="mt-1 max-h-0 overflow-hidden text-sm text-white/85 opacity-0 transition-all duration-500 ease-out group-hover:max-h-16 group-hover:opacity-100">
              {t.note}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
