import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader, SiteFooter, Section, PageHero } from '@/components/site/Chrome';
import { Reveal } from '@/components/site/motion';
import { Button, Card, Badge } from '@/components/ui';
import { ArtShield, ArtDispute, ArtSupport } from '@/components/ui/art';

export const metadata: Metadata = {
  title: 'Безопасность — TEYDO',
  description: 'Проверка пользователей, фиксация условий, рейтинг обеих сторон, споры и антифрод.',
};

const LAYERS = [
  { t: 'Подтверждение личности', d: 'Базовые сценарии открываются после подтверждения телефона или Telegram. Для категорий с повышенным риском — работа с детьми, животными, доступ в жильё, дорогая техника — проверка документов обязательна.' },
  { t: 'Рейтинг обеих сторон', d: 'Оценивают не только исполнителя. Заказчик получает оценку за точность описания, пунктуальность, оплату и общение — и это видно до того, как вы согласитесь работать.' },
  { t: 'Зафиксированные условия', d: 'Что, за сколько, когда и где — сохраняется отдельной записью. Любое изменение требует нового согласия обеих сторон, поэтому «мы же договаривались иначе» перестаёт быть аргументом.' },
  { t: 'Резерв средств', d: 'Деньги списываются до начала работы, но переходят исполнителю только после приёмки. Исполнитель не работает бесплатно, заказчик не платит вслепую.' },
  { t: 'Переписка как доказательство', d: 'Чат, фото и история изменений заказа сохраняются и в случае спора попадают в материалы дела.' },
  { t: 'Жалобы и модерация', d: 'На задачу, отклик, сообщение и профиль можно пожаловаться. Опасные и запрещённые задачи снимаются с публикации.' },
  { t: 'Антифрод', d: 'Система отмечает подозрительные сигналы: всплеск однотипных откликов, повторяющиеся отмены, попытки увести оплату мимо площадки, множественные аккаунты.' },
  { t: 'Центр споров', d: 'Спор открывается из заказа. Модератор видит условия, переписку, платёж и материалы обеих сторон — и решает, кому уходят деньги.' },
];

const RULES_CUSTOMER = [
  'Описывайте задачу подробно: объём, доступ, инструмент, сроки — половина конфликтов рождается в недосказанности.',
  'Проверьте профиль исполнителя: рейтинг, отзывы, завершённые заказы, подтверждения.',
  'Фиксируйте условия в заказе, а не «на словах в чате».',
  'Не переводите деньги напрямую до начала работы — вне площадки защита не действует.',
  'Принимайте работу, только когда действительно её посмотрели.',
];

const RULES_EXECUTOR = [
  'Смотрите на рейтинг заказчика так же внимательно, как он смотрит на ваш.',
  'Не начинайте работу, пока условия не подтверждены обеими сторонами.',
  'Задавайте уточняющие вопросы в чате — переписка остаётся и работает на вас.',
  'Фотографируйте результат: это лучший аргумент в споре.',
  'Не соглашайтесь на оплату мимо площадки, даже если просят «так дешевле».',
];

const RED_FLAGS = [
  'Просят перевести предоплату на карту до начала работы и вне заказа',
  'Уводят переписку в другой мессенджер сразу, до обсуждения деталей',
  'Отказываются фиксировать условия в заказе',
  'Обещают «гарантированный доход» или просят оплатить доступ к заказам',
  'Присылают ссылку на «оплату» с постороннего сайта',
  'Просят прислать код из СМС или данные карты',
];

export default function SafetyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHero
          eyebrow="Безопасность"
          title="Мы не обещаем чудес — мы оставляем следы"
          sub="Абсолютной безопасности не бывает ни на одной площадке. Зато каждый шаг сделки можно зафиксировать так, чтобы в спорной ситуации было на что опереться."
        >
          <div className="flex flex-wrap gap-3">
            <Link href="/help"><Button size="lg">Что делать, если проблема</Button></Link>
            <Link href="/legal/rules"><Button size="lg" variant="outline">Правила площадки</Button></Link>
          </div>
        </PageHero>

        <Section eyebrow="Восемь слоёв" title="Из чего складывается защита">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {LAYERS.map((l, i) => (
              <Card key={l.t} className={`p-6 ${i % 4 === 1 ? '-rotate-1' : i % 4 === 3 ? 'rotate-1' : ''}`}>
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-full border-3 border-ink bg-brand text-lg font-extrabold text-white shadow-pop-sm">
                  {i + 1}
                </div>
                <h3 className="text-[17px] font-extrabold leading-tight tracking-tight">{l.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{l.d}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section className="!pt-0">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="toon p-8">
              <ArtShield className="h-20 w-auto" />
              <h3 className="mt-4 text-2xl font-extrabold tracking-tight">Если вы заказчик</h3>
              <ul className="mt-5 space-y-3">
                {RULES_CUSTOMER.map((r) => (
                  <li key={r} className="flex gap-3 text-[15px] leading-relaxed text-muted">
                    <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-ink bg-brand" />
                    {r}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="toon bg-surface p-8">
              <ArtSupport className="h-20 w-auto" />
              <h3 className="mt-4 text-2xl font-extrabold tracking-tight">Если вы исполнитель</h3>
              <ul className="mt-5 space-y-3">
                {RULES_EXECUTOR.map((r) => (
                  <li key={r} className="flex gap-3 text-[15px] leading-relaxed text-muted">
                    <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-ink bg-brand" />
                    {r}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Section>

        <Section
          eyebrow="Тревожные признаки"
          title="Шесть поводов остановиться"
          sub="Если видите хотя бы один — не продолжайте сделку и пожалуйтесь. Жалоба анонимна для второй стороны."
          className="!pt-0"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {RED_FLAGS.map((f) => (
              <Reveal key={f}><Card className="toon h-full flex items-start gap-3 p-5">
                <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-3 border-ink bg-danger text-sm font-extrabold text-white">!</span>
                <p className="text-[15px] leading-relaxed">{f}</p>
              </Card></Reveal>
            ))}
          </div>
        </Section>

        <Section className="!pt-0">
          <Card className="toon bg-ink p-8 text-paper sm:p-10">
            <ArtDispute className="h-20 w-auto" />
            <h3 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">Как проходит спор</h3>
            <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Открытие', 'Любая сторона открывает спор из заказа и описывает суть.'],
                ['Заморозка', 'Платёж блокируется: деньги не уходят ни исполнителю, ни обратно.'],
                ['Материалы', 'Обе стороны прикладывают фото, файлы и пояснения. Переписка уже в деле.'],
                ['Решение', 'Модератор принимает решение и указывает основание. Деньги идут по решению.'],
              ].map(([t, d], i) => (
                <li key={t} className="rounded-lg border-3 border-paper/25 p-5">
                  <div className="mb-2 text-sm font-bold text-brand">Шаг {i + 1}</div>
                  <h4 className="text-lg font-extrabold tracking-tight">{t}</h4>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-paper/75">{d}</p>
                </li>
              ))}
            </ol>
          </Card>
        </Section>

        <Section eyebrow="Честно" title="Границы нашей ответственности" className="!pt-0 !pb-24">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { t: 'Мы не выполняем работу', d: 'Исполнители — самостоятельные люди, а не сотрудники платформы. Мы отвечаем за площадку и правила.' },
              { t: 'Мы не заменяем полицию и суд', d: 'При причинении вреда, угрозах или мошенничестве обращайтесь в правоохранительные органы. Материалы заказа мы предоставим по законному запросу.' },
              { t: 'Проверка ≠ гарантия', d: 'Подтверждённые документы означают, что человек тот, за кого себя выдаёт. Это не обещание качества его работы.' },
            ].map((x) => (
              <Reveal key={x.t}><Card className="toon h-full p-6">
                <Badge tone="sand" className="mb-3">Важно</Badge>
                <h3 className="text-lg font-extrabold tracking-tight">{x.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{x.d}</p>
              </Card></Reveal>
            ))}
          </div>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
