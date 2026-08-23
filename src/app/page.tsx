import Link from 'next/link';
import { SiteHeader, SiteFooter, Section } from '@/components/site/Chrome';
import { Button, Card, Badge } from '@/components/ui';
import {
  ArtSearching, ArtReply, ArtDeal, ArtDone, ArtShield, ArtMoney,
} from '@/components/ui/art';
import { BRAND } from '@/lib/brand';

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

const COMPARE: { row: string; classic: string; teydo: string }[] = [
  { row: 'Отклик исполнителя', classic: 'Часто платный или по подписке', teydo: 'Бесплатный' },
  { row: 'Актуальность задачи', classic: 'Висит, пока не удалят', teydo: 'Заказчик подтверждает, иначе задача уходит вниз' },
  { row: 'Рейтинг', classic: 'Обычно только у исполнителя', teydo: 'У обеих сторон' },
  { row: 'Условия сделки', classic: 'На словах в переписке', teydo: 'Фиксируются и требуют согласия обоих' },
  { row: 'Оплата', classic: 'Напрямую, на свой страх', teydo: 'Резервируется до приёмки работы' },
  { row: 'Выбор', classic: 'Листать сотни объявлений', teydo: 'Подбор с объяснением совпадения' },
  { row: 'Поиск', classic: 'По всему городу', teydo: 'От 1 км, люди рядом' },
  { row: 'Спорные ситуации', classic: 'Разбирайтесь сами', teydo: 'Центр споров с материалами заказа' },
];

const FAQ = [
  { q: 'Сколько стоит разместить задачу?', a: 'Ноль. Создание задачи, поиск, отклики, чаты и отзывы входят в бесплатный тариф.' },
  { q: 'Сколько стоит отклик?', a: 'Отклик бесплатный. Мы принципиально не берём деньги за попытку получить заказ.' },
  { q: 'Нужно ли платить за регистрацию?', a: 'Нет. Регистрация и профиль — бесплатно, в том числе профиль исполнителя.' },
  { q: 'На чём тогда зарабатывает платформа?', a: 'На комиссии с успешной сделки. Размер комиссии показывается до оплаты, отдельной строкой. Мы зарабатываем, когда зарабатываете вы.' },
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
      <main id="main">
        {/* ---------- HERO ---------- */}
        <Section className="!pb-10 !pt-10 sm:!pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <Badge tone="sand" className="mb-6 -rotate-1 whitespace-normal">Бесплатно создать · бесплатно откликнуться</Badge>
              <h1 className="text-balance text-[clamp(2.4rem,7vw,4.6rem)] font-extrabold leading-[0.98] tracking-tight">
                Есть дело?
                <br />
                <span className="text-brand [-webkit-text-stroke:3px_rgb(var(--c-ink))] [paint-order:stroke_fill]">
                  Давай сделаем.
                </span>
              </h1>
              <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-muted">
                Площадка, где задача находит человека, а не тонет среди тысячи объявлений.
                Создать задачу, найти работу рядом и откликнуться — бесплатно.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/app?intent=customer"><Button size="lg">Мне нужна помощь</Button></Link>
                <Link href="/app?intent=executor"><Button size="lg" variant="outline">Хочу заработать</Button></Link>
              </div>
              <p className="mt-4 text-sm text-faint">Роль можно поменять в любой момент — аккаунт один.</p>
            </div>

            <Card className="relative rotate-1 p-7 shadow-pop-lg">
              <div className="absolute -right-4 -top-5 rotate-6">
                <Badge tone="brand">Новое</Badge>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">Мы зарабатываем, когда вы зарабатываете</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                Никаких платных откликов и подписок ради того, чтобы вас увидели.
                Платформа берёт комиссию только с успешной сделки — и показывает её до оплаты.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {['Создать задачу', 'Найти задачи', 'Откликнуться', 'Переписка'].map((x) => (
                  <div key={x} className="flex items-center gap-2.5 rounded-md border-2 border-ink bg-surface px-3 py-2.5 text-sm font-bold">
                    <span aria-hidden className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-ink bg-brand text-[10px] text-white">₽</span>
                    <span className="min-w-0 truncate">{x}</span>
                    <span className="ml-auto shrink-0 whitespace-nowrap text-brand">0 ₽</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Section>

        {/* ---------- Почему здесь проще ---------- */}
        <Section eyebrow="Почему здесь проще" title="Шесть вещей, которые меняют дело">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WHY.map((w, i) => (
              <Card key={w.t} className={`p-6 ${i % 3 === 1 ? '-rotate-1' : i % 3 === 2 ? 'rotate-1' : ''}`}>
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-full border-3 border-ink bg-brand text-lg font-extrabold text-white shadow-pop-sm">
                  {i + 1}
                </div>
                <h3 className="text-lg font-extrabold tracking-tight">{w.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{w.d}</p>
              </Card>
            ))}
          </div>
        </Section>

        {/* ---------- Как это работает ---------- */}
        <Section id="how" eyebrow="Как это работает" title="Четыре шага — и дело сделано">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <Card key={s.n} className="flex flex-col items-start gap-4 p-6">
                <div className="opacity-90">{s.art}</div>
                <div>
                  <div className="mb-1 text-sm font-bold text-brand">Шаг {s.n}</div>
                  <h3 className="text-xl font-extrabold tracking-tight">{s.t}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.d}</p>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        {/* ---------- Две стороны ---------- */}
        <Section>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-surface p-8">
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
              <Link href="/app?intent=customer" className="mt-7 inline-block"><Button>Найти человека</Button></Link>
            </Card>

            <Card className="bg-brand p-8 text-white">
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
              <Link href="/app?intent=executor" className="mt-7 inline-block">
                <Button variant="ink">Взять задачу</Button>
              </Link>
            </Card>
          </div>
        </Section>

        {/* ---------- Сравнение ---------- */}
        <Section
          eyebrow="Почему не просто доска объявлений"
          title="Доска показывает всё. Мы показываем нужное"
          sub="Объявлений много не значит хорошо: чем длиннее список, тем дольше выбор и тем больше в нём мёртвых задач."
        >
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b-3 border-ink bg-surface">
                    <th className="p-4 text-sm font-bold"> </th>
                    <th className="p-4 text-sm font-bold text-muted">Классические площадки</th>
                    <th className="p-4 text-sm font-extrabold text-brand">{BRAND.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((c) => (
                    <tr key={c.row} className="border-b-2 border-ink/10 last:border-0">
                      <td className="p-4 text-[15px] font-bold">{c.row}</td>
                      <td className="p-4 text-[15px] text-muted">{c.classic}</td>
                      <td className="p-4 text-[15px] font-bold">{c.teydo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Section>

        {/* ---------- Безопасность и оплата ---------- */}
        <Section>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-8">
              <ArtShield className="h-20 w-20" />
              <h3 className="mt-4 text-2xl font-extrabold tracking-tight">Безопасность</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                Проверка пользователей, фиксация условий, рейтинг обеих сторон, центр споров и антифрод.
                Абсолютной безопасности не обещает никто — но каждый шаг сделки оставляет след, на который можно опереться.
              </p>
              <Link href="/safety" className="mt-6 inline-block"><Button variant="outline">Как мы защищаем</Button></Link>
            </Card>

            <Card className="p-8">
              <ArtMoney className="h-20 w-20" />
              <h3 className="mt-4 text-2xl font-extrabold tracking-tight">Оплата без магии</h3>
              <ol className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-muted">
                <li><b className="text-ink">1.</b> Заказчик оплачивает — деньги резервируются.</li>
                <li><b className="text-ink">2.</b> Исполнитель выполняет работу.</li>
                <li><b className="text-ink">3.</b> Заказчик подтверждает результат.</li>
                <li><b className="text-ink">4.</b> Деньги уходят исполнителю, комиссия — платформе.</li>
                <li><b className="text-ink">5.</b> Если возник спор — средства удерживаются до решения.</li>
              </ol>
              <Link href="/payments" className="mt-6 inline-block"><Button variant="outline">Оплата и комиссия</Button></Link>
            </Card>
          </div>
        </Section>

        {/* ---------- FAQ ---------- */}
        <Section id="faq" eyebrow="Вопросы" title="Коротко о главном">
          <div className="grid gap-3 lg:grid-cols-2">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-lg border-3 border-ink bg-card p-5 shadow-pop-sm open:bg-surface">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-bold">
                  {f.q}
                  <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-ink text-sm transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 border-t-2 border-ink/10 pt-3 text-[15px] leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>

        {/* ---------- Финальный CTA ---------- */}
        <Section className="!pb-24">
          <Card className="bg-brand p-10 text-center text-white shadow-pop-lg sm:p-16">
            <h2 className="text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">Ну что, погнали?</h2>
            <p className="mx-auto mt-4 max-w-[44ch] text-[17px]">
              Создай первую задачу или найди работу рядом. Обе кнопки бесплатные.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/app"><Button size="lg" variant="ink">Начать бесплатно</Button></Link>
              <a href={`https://t.me/${BRAND.botUsername}`}><Button size="lg" variant="outline">Открыть в Telegram</Button></a>
            </div>
          </Card>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
