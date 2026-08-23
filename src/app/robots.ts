import type { MetadataRoute } from 'next';

/** Приложение и админка в поиске не нужны: там нет публичного содержимого. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/app/', '/admin/', '/api/'] }],
    sitemap: 'https://teydo.app/sitemap.xml',
  };
}
