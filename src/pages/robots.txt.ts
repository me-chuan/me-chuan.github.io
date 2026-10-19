import type { APIRoute } from 'astro';
import { SITE } from '../data/site.config';

/**
 * 构建时生成 robots.txt。
 * Sitemap 地址取自 astro.config.mjs 的 site，绑定自定义域名后自动跟随，
 * 不需要手工维护第二处域名。
 */
export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL(SITE.url)).href.replace(/\/+$/, '');

  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${base}/sitemap-index.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
