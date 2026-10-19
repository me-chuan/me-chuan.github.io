---
title: 为什么这个站点用 Astro 而不是 Next.js
description: 个人主页的流量结构和博客站不一样，选型标准也不同。这篇文章记录了我最终选择 Astro 的理由，以及被否掉的几种方案各自的问题在哪。
pubDate: 2026-10-19
tags: [Astro, 静态站点, 选型]
---

个人主页和电商站是两种东西。电商站要处理登录态、个性化推荐、复杂的客户端状态；个人主页九成的访客是"点进来看一眼就走"。

这就决定了选型标准应该反过来：**不是"能做什么"，而是"为了用不到的能力付出了多少代价"**。

## 我否掉的几种方案

### Next.js（static export）

生态最大，文档最全，但对这个场景是杀鸡用牛刀：

- 导出的静态站点仍然要带 React Runtime，首屏 JS 很难压到 50KB 以下
- `basePath` / `trailingSlash` / 图片优化目录这三件事，每一件都要单独调
- 升级一次大版本要重新验证一遍导出产物

### Vite + React / Vue

单页应用形态最灵活，但同样有首屏 JS 的问题，而且需要自己搭路由、SEO 元信息、Markdown 渲染、代码高亮……最后变成"用 React 重新实现一个 Astro"。

### Hugo

构建速度确实是最快的，Markdown 原生支持也成熟。但 Go 模板对前端背景的人有学习成本，而我的内容迭代频率并不高——每次改模板语法的时间成本大于省下的那几秒构建时间。

## 最后选了 Astro

三个决定性理由：

1. **零 JS 是默认行为，不是优化项。** 不写 `<script>` 就没有 JS，不引入框架组件就不会带上对应 runtime。个人主页真正需要交互的只有"主题切换"这一处。

2. **内容集合（Content Collections）让内容管理变成零成本。** 文章就是一个 `.md` 文件，frontmatter 由 schema 在构建期校验——日期格式写错、标题漏写，CI 直接失败，而不是上线后才发现。

   ```ts
   // src/content.config.ts
   const blog = defineCollection({
     loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
     schema: z.object({
       title: z.string().max(80),
       description: z.string().max(200),
       pubDate: z.coerce.date(),
       tags: z.array(z.string()).default([]),
       draft: z.boolean().default(false),
     }),
   });
   ```

3. **Islands 架构留了后路。** 将来要加评论区、在线状态这类真交互时，只对单个组件加 `client:visible`，不污染全站。架构上不是死路。

## 代价是什么

- 内容集合是 Astro 5+ 的写法，早期教程里的 `type: 'content'` 已经过时，网上搜到的老文章很容易误导
- 需要对 Astro 的构建产物做一次基础体检（`astro check` + Lighthouse CI），否则样式崩了也只有上线才知道

## 一句话总结

个人主页的技术选型，本质是**为"用不到的能力"定价**。Astro 在这个尺度上给出的价格最低：默认输出最轻，内容模型最省事，同时保留了扩展路径。
