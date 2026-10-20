/**
 * 站点全局配置 —— 所有页面共享的元信息集中在这里，改一处即可全站生效。
 * 需要自定义的地方已经标了 TODO 注释。
 */

export const SITE = {
  /** 站点名 / 你的名字 */
  title: 'chuan',
  /** 首页标题后缀，出现在 <title> 与 OG 标题里 */
  tagline: 'Engineering Notes & Projects',
  /** 全站默认描述，用于 SEO 与社交分享卡片 */
  description: '个人主页与写作：工程项目、开源实践与技术笔记。',
  /** 作者名，用于 JSON-LD Person schema 与文章署名 */
  author: 'chuan',
  /** 语言标记，影响 <html lang> 与日期格式 */
  lang: 'zh-CN',
  /** 站点根地址，与 astro.config.mjs 的 site 保持一致 */
  url: 'https://me-chuan.github.io',
  /** 头像路径（放在 public/ 下） */
  avatar: '/avatar.svg',
  /** 社交与联系方式。留空字符串则不渲染对应入口。 */
  links: {
    github: 'https://github.com/me-chuan',
    email: 'lemonchuan@sjtu.edu.cn',
    // TODO: 想加别的平台就往下追加，渲染逻辑自动支持
    // linkedin: 'https://www.linkedin.com/in/...',
    // x: 'https://x.com/...',
  },
  /** 顶部导航 */
  nav: [
    { label: '首页', href: '/' },
    { label: '博客', href: '/blog/' },
    { label: '项目', href: '/projects/' },
    { label: '关于', href: '/about/' },
  ],
  /** 页脚版权起始年份 */
  since: 2023,
} as const;

export type SiteConfig = typeof SITE;
