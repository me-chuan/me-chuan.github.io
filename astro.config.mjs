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
  markdown: {
    // 双主题代码块：自动按当前 [data-theme] 切换。
    // defaultColor: false 是关键 —— 默认 true 时 Astro 会把亮色值直接内联成
    // color:#xxx，只留 --shiki-dark 变量；那样既拿不到 --shiki-light，
    // 内联样式又会盖过 CSS 里的 .astro-code span 规则，暗色模式就切不动了。
    // 设成 false 后只输出 --shiki-light / --shiki-dark 两套变量，交给 CSS 选。
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: true,
    },
  },
});
