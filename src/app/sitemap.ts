import type { MetadataRoute } from 'next';

const PUBLIC_PATHS = [
  '', '/how-it-works', '/safety', '/payments', '/pricing', '/tasks', '/help',
  '/legal/terms', '/legal/privacy', '/legal/rules',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://teydo.app';
  return PUBLIC_PATHS.map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency: p === '/tasks' ? 'daily' : 'monthly',
    priority: p === '' ? 1 : 0.7,
  }));
}
