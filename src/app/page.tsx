import Link from 'next/link';
import Image from 'next/image';
import { SiteHeader, SiteFooter, Section } from '@/components/site/Chrome';
import { Button, Card, Badge } from '@/components/ui';
import { ArtSearching, ArtReply, ArtDeal, ArtDone } from '@/components/ui/art';
import { Reveal, Ribbon, Sparkle, Squiggle, Cloud, Bolt, Star } from '@/components/site/motion';
import { CategoryTiles } from '@/components/site/CategoryTiles';
import { Accordion } from '@/components/site/Accordion';

const WHY = [
  { t: 'Отклик бесплатный', d: 'Исполнитель не платит за возможность предложить себя. Платформа зарабатывает после сделки, а не до неё.' },
  { t: 'Задачи живые', d: 'Мы спрашиваем заказчика, актуальна ли задача. Если он молчит — она уходит вниз выдачи.' },
  { t: 'Рейтинг обеих сторон', d: 'Оценивают не только исполнителя. Заказчик тоже получает рейтинг — за адекватность и оплату.' },
  { t: 'Условия зафиксированы', d: 'Что, за сколько, когда и где — фиксируется до старта. Изменения только через новое согласие.' },
  { t: 'Безопасная сделка', d: 'Деньги резервируются и уходят исполнителю после того, как заказчик принял работу.' },
  { t: 'Подбор, а не свалка', d: 'Не список из тысячи объявлений, а подходящие люди и задачи с объяснением, почему подходят.' },
];

const STEPS = [
  { n: '1', t: 'Опишите задачу', d: 'Обычными словами. Мы сами разложим на категорию, дату и время — вы только подтвердите.', art: <ArtSearching /> },
  { n: '2', t: 'Получите подходящих людей', d: 'С рейтингом, расстоянием и ценой. И с объяснением, почему именно эти.', art: <ArtReply /> },
  { n: '3', t: 'Договоритесь', d: 'Чат, вопросы, цена. Когда всё сошлось — фиксируете условия в один тап.', art: <ArtDeal /> },
  { n: '4', t: 'Сделайте и закройте', d: 'Работа выполнена, вы приняли — исполнитель получает деньги. Оба ставите оценку.', art: <ArtDone /> },
];

const FAQ = [
  { q: 'Сколько стоит разместить задачу?', a: 'Ноль. Создание задачи, поиск, отклики, чаты и отзывы входят в бесплатный тариф.' },
  { q: 'Сколько стоит отклик?', a: 'Отклик бесплатный. Мы принципиально не берём деньги за попытку получить заказ.' },
  { q: 'Нужно ли платить за регистрацию?', a: 'Нет. Регистрация и профиль — бесплатно, в том числе профиль исполнителя.' },
  { q: 'На чём тогда зарабатывает платформа?', a: 'На комиссии с успешной сделки. Размер комиссии показывается до оплаты, отдельной строкой.' },
  { q: 'Как происходит оплата?', a: 'Заказчик оплачивает, деньги резервируются. Исполнитель делает работу, заказчик подтверждает — и деньги уходят исполнителю. При споре средства удерживаются до решения.' },
  { q: 'Что если исполнитель не пришёл?', a: 'Откройте раздел «Помощь с заказом» и укажите причину. Заказ, условия, переписка и платёж уходят на рассмотрение, деньги остаются зарезервированными.' },
  { q: 'Что если работа выполнена плохо?', a: 'Не подтверждайте выполнение и откройте спор. Пока идёт разбирательство, средства не уходят исполнителю.' },
  { q: 'Можно ли отменить заказ?', a: 'Да. До оплаты — свободно. После оплаты отмена проходит через подтверждение второй стороны или через спор, чтобы никто не остался ни с чем.' },
  { q: 'Как работает рейтинг?', a: 'После заказа заказчик оценивает качество, срок, общение и соответствие цене. Исполнитель оценивает адекватность, точность описания, пунктуальность, оплату и общение.' },
  { q: 'Можно ли работать без подтверждения личности?', a: 'Да, базовые сценарии доступны после подтверждения телефона или Telegram. Для категорий с повышенным риском проверка личности обязательна.' },
  { q: 'Можно ли быть и заказчиком, и исполнителем?', a: 'Да, и аккаунт при этом один. Роль переключается в профиле в любой момент.' },
  { q: 'Как работает Telegram?', a: 'Можно войти через Telegram и открыть приложение прямо в мессенджере — уведомления о задачах и откликах будут приходить туда же.' },
  { q: 'Можно ли пользоваться сайтом без Telegram?', a: 'Да. Есть вход по номеру телефона, аккаунт при этом тот же самый.' },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="overflow-x-clip">

        {/* ---------- ПЕРВЫЙ ЭКРАН ---------- */}
        <Section className="relative !pb-10 !pt-10 sm:!pt-16">
          {/* Бутафория живёт своей жизнью и не мешает нажатиям. */}
          <Cloud aria-hidden className="pointer-events-none absolute left-2 top-2 hidden h-14 w-24 animate-bob opacity-80 xl:block" />
          <Sparkle aria-hidden className="pointer-events-none absolute right-[46%] top-2 hidden h-8 w-8 animate-twinkle lg:block" />

          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <Badge tone="sand" className="mb-6 -rotate-1 animate-wobble whitespace-normal">
                Бесплатно создать · бесплатно откликнуться
              </Badge>
              <h1 className="text-balance text-[clamp(2.4rem,7vw,4.6rem)] font-extrabold leading-[0.98] tracking-tight">
                Есть дело?
                <br />
                <span className="relative inline-block text-brand [-webkit-text-stroke:3px_rgb(var(--c-ink))] [paint-order:stroke_fill]">
                  Давай сделаем.
                  <Squiggle aria-hidden className="absolute -bottom-3 left-0 h-4 w-full text-ink [-webkit-text-stroke:0]" />
                </span>
              </h1>
              <p className="mt-9 max-w-[46ch] text-[17px] leading-relaxed text-muted">
                Площадка, где задача находит человека, а не тонет среди тысячи объявлений.
                Создать задачу, найти работу рядом и откликнуться — бесплатно.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/app?intent=customer" className="toon-btn"><Button size="lg">Мне нужна помощь</Button></Link>
                <Link href="/app?intent=executor" className="toon-btn"><Button size="lg" variant="outline">Хочу заработать</Button></Link>
              </div>
              <p className="mt-4 text-sm text-faint">Роль можно поменять в любой момент — аккаунт один.</p>
            </div>

            <figure className="relative m-0 rotate-1 animate-bob [animation-duration:7s]">
              <Badge tone="brand" className="absolute -right-1 -top-5 z-10 rotate-6 animate-swing sm:-right-4">
                Новое
              </Badge>
              <Bolt aria-hidden className="absolute -left-5 bottom-8 z-10 hidden h-11 w-8 -rotate-12 animate-twinkle sm:block" />
              <div className="overflow-hidden rounded-xl border-3 border-ink bg-card shadow-pop-lg">
                <Image
                  src="/pic/main.webp"
                  alt="Команда TEYDO: люди, которые берутся за любые дела"
                  width={868}
                  height={861}
                  priority
                  sizes="(max-width: 1024px) 100vw, 46vw"
                  className="block h-auto w-full"
                />
              </div>
            </figure>
          </div>
        </Section>

        {/* ---------- Бегущая лента ---------- */}
        <Ribbon
          className="mt-2"
          items={['Забить гвоздь', 'Собрать шкаф', 'Починить кран', 'Сделать бота', 'Отвезти документы', 'Выгулять пса', 'Убрать после ремонта', 'Повесить полку']}
        />

        {/* ---------- Категории ---------- */}
        <Section eyebrow="Что чаще всего просят" title="Выберите, с чем нужна помощь">
          <Reveal><CategoryTiles /></Reveal>
        </Section>

        {/* ---------- Почему здесь проще ---------- */}
        <Section eyebrow="Почему здесь проще" title="Шесть вещей, которые меняют дело" className="relative !pt-0">
          <Star aria-hidden className="pointer-events-none absolute right-4 top-6 hidden h-9 w-9 animate-twinkle text-brand sm:block" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WHY.map((w, i) => (
              <Reveal key={w.t}>
                <Card className={`toon h-full p-6 ${i % 3 === 1 ? '-rotate-1' : i % 3 === 2 ? 'rotate-1' : ''}`}>
                  <div className="mb-3 grid h-11 w-11 place-items-center rounded-full border-3 border-ink bg-brand text-lg font-extrabold leading-none text-white shadow-pop-sm">
                    {i + 1}
                  </div>
                  <h3 className="text-lg font-extrabold tracking-tight">{w.t}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{w.d}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* ---------- Как это работает ---------- */}
        <Section id="how" eyebrow="Как это работает" title="Четыре шага — и дело сделано" className="!pt-0">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <Reveal key={s.n}>
                <Card className="toon flex h-full flex-col items-start gap-4 p-6">
                  <div className="opacity-90">{s.art}</div>
                  <div>
                    <div className="mb-1 text-sm font-extrabold text-brand">Шаг {s.n}</div>
                    <h3 className="text-xl font-extrabold tracking-tight">{s.t}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.d}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* ---------- Две стороны ---------- */}
        <Section className="!pt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
              <Card className="toon h-full bg-surface p-8">
                <h3 className="text-3xl font-extrabold tracking-tight">Для тех, кто ищет помощь</h3>
                <ul className="mt-5 space-y-3">
                  {[
                    'Опишите задачу обычными словами — разложим на поля сами',
                    'Не знаете цену — покажем ориентир по похожим задачам',
                    'Получите подходящих людей, а не поток случайных откликов',
                    'Зафиксируйте условия до начала работы',
                    'Платите после того, как приняли результат',
                  ].map((x) => (
                    <li key={x} className="flex gap-3 text-[15px] leading-relaxed">
                      <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-ink bg-brand" />
                      {x}
                    </li>
                  ))}
                </ul>
                <Link href="/app?intent=customer" className="toon-btn mt-7 inline-block"><Button>Найти человека</Button></Link>
              </Card>
            </Reveal>

            <Reveal>
              <Card className="toon h-full bg-brand p-8 text-white">
                <h3 className="text-3xl font-extrabold tracking-tight">Для тех, кто хочет заработать</h3>
                <ul className="mt-5 space-y-3">
                  {[
                    'Отклик бесплатный — всегда, а не первые три',
                    'Задачи рядом: фильтр от 1 км',
                    'Видно, насколько задача вам подходит и почему',
                    'Заказчик тоже с рейтингом — понятно, с кем идёте работать',
                    'Оплата зарезервирована ещё до начала работы',
                  ].map((x) => (
                    <li key={x} className="flex gap-3 text-[15px] leading-relaxed">
                      <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-ink bg-white" />
                      {x}
                    </li>
                  ))}
                </ul>
                <Link href="/app?intent=executor" className="toon-btn mt-7 inline-block">
                  <Button variant="ink">Взять задачу</Button>
                </Link>
              </Card>
            </Reveal>
          </div>
        </Section>

        {/* ---------- Вопросы ---------- */}
        <Section id="faq" eyebrow="Вопросы" title="Коротко о главном" className="!pb-24 !pt-0">
          <div className="mx-auto max-w-[820px]">
            <Accordion items={FAQ} />
          </div>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
