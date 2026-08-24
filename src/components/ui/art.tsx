import Image from 'next/image';

/* ============================================================
   Иллюстрации интерфейса.
   Раньше здесь лежали самодельные SVG; теперь — мультяшный набор
   из /public/pic. Имена компонентов сохранены, поэтому места
   использования менять не нужно.
   ============================================================ */

type Props = { className?: string };

function Pic({ src, w, h, className, alt = '' }: {
  src: string; w: number; h: number; className?: string; alt?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={w}
      height={h}
      aria-hidden={alt === '' || undefined}
      className={className ?? 'h-24 w-auto'}
      sizes="200px"
    />
  );
}

/* ---------- Сценарии сделки ---------- */
export const ArtSearching = (p: Props) => <Pic src="/pic/search.webp" w={367} h={323} {...p} />;
export const ArtReply = (p: Props) => <Pic src="/pic/message.webp" w={405} h={306} {...p} />;
export const ArtDeal = (p: Props) => <Pic src="/pic/the_agreement.webp" w={409} h={329} {...p} />;
export const ArtWork = (p: Props) => <Pic src="/pic/update.webp" w={250} h={270} {...p} />;
export const ArtDone = (p: Props) => <Pic src="/pic/accept.webp" w={345} h={341} {...p} />;
export const ArtMoney = (p: Props) => <Pic src="/pic/money.webp" w={439} h={321} {...p} />;
export const ArtDispute = (p: Props) => <Pic src="/pic/question.webp" w={311} h={259} {...p} />;
export const ArtSupport = (p: Props) => <Pic src="/pic/support.webp" w={409} h={351} {...p} />;
export const ArtShield = (p: Props) => <Pic src="/pic/security.webp" w={364} h={388} {...p} />;
export const ArtBell = (p: Props) => <Pic src="/pic/notification.webp" w={303} h={280} {...p} />;

/* ---------- Состояния экранов ---------- */
export const ArtEmpty = (p: Props) => <Pic src="/pic/while_empty.webp" w={786} h={749} {...p} />;
export const ArtError = (p: Props) => <Pic src="/pic/error.webp" w={815} h={773} {...p} />;
export const ArtLoading = (p: Props) => <Pic src="/pic/loading.webp" w={817} h={773} {...p} />;
export const ArtSuccess = (p: Props) => <Pic src="/pic/success.webp" w={840} h={800} {...p} />;
export const ArtNotFound = (p: Props) => <Pic src="/pic/nothing_was_found.webp" w={840} h={749} {...p} />;
export const Art404 = (p: Props) => <Pic src="/pic/404.webp" w={822} h={749} {...p} />;

/* ---------- Мелкие пиктограммы ---------- */
export const ArtTime = (p: Props) => <Pic src="/pic/time.webp" w={349} h={295} {...p} />;
export const ArtCalendar = (p: Props) => <Pic src="/pic/calendar.webp" w={401} h={325} {...p} />;
export const ArtMap = (p: Props) => <Pic src="/pic/map.webp" w={337} h={249} {...p} />;
export const ArtFile = (p: Props) => <Pic src="/pic/file.webp" w={374} h={324} {...p} />;
export const ArtImage = (p: Props) => <Pic src="/pic/image.webp" w={408} h={322} {...p} />;
export const ArtLike = (p: Props) => <Pic src="/pic/like.webp" w={387} h={324} {...p} />;
export const ArtNews = (p: Props) => <Pic src="/pic/news.webp" w={337} h={250} {...p} />;
export const ArtPortfolio = (p: Props) => <Pic src="/pic/portfolio.webp" w={322} h={264} {...p} />;
export const ArtProfileOk = (p: Props) => <Pic src="/pic/profile_accept.webp" w={364} h={351} {...p} />;
export const ArtTelegram = (p: Props) => <Pic src="/pic/telegram.webp" w={349} h={247} {...p} />;
