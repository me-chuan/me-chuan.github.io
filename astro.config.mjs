// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // 站点根地址。绑定自定义域名后改为 https://your-domain.com，
  // canonical / sitemap / RSS 会自动跟随，无需改其他文件。
  site: 'https://me-chuan.github.io',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [sitemap()],
});
