import Link from 'next/link';
import { SiteHeader, SiteFooter } from '@/components/site/Chrome';
import { Button } from '@/components/ui';
import { Art404 } from '@/components/ui/art';

export const metadata = { title: 'Страница не найдена — TEYDO' };

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex w-full max-w-[1240px] flex-col items-center px-5 py-20 text-center sm:px-8 sm:py-28">
        <Art404 className="h-52 w-auto sm:h-64" />
        <h1 className="mt-8 text-balance text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-tight tracking-tight">
          Такой страницы нет
        </h1>
        <p className="mt-4 max-w-[46ch] text-[17px] leading-relaxed text-muted">
          Возможно, ссылка устарела или в адресе опечатка. Задачи и исполнители никуда не делись — вернитесь на главную.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="toon-btn"><Button size="lg">На главную</Button></Link>
          <Link href="/tasks" className="toon-btn"><Button size="lg" variant="outline">Посмотреть задачи</Button></Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
