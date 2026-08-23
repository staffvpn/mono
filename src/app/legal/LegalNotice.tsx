import { Badge } from '@/components/ui';

/**
 * Документы написаны как рабочий текст продукта, а не как проверенные юристом.
 * Прямо говорим об этом, чтобы никто не принял их за готовую оферту.
 */
export function LegalNotice() {
  return (
    <div className="mb-8 rounded-lg border-3 border-ink bg-sand p-5">
      <Badge tone="brand" className="mb-3">Черновик</Badge>
      <p className="!mb-0 text-[15px] font-bold leading-relaxed !text-ink">
        Это рабочая редакция документа. Она описывает, как устроен сервис, но не проходила
        юридическую проверку и не является публичной офертой. Перед запуском текст должен
        согласовать юрист.
      </p>
    </div>
  );
}
