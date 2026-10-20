---
title: 示例项目
description: 一个用来演示项目集页面布局的占位项目，可以替换成你自己的任意项目。
startDate: 2026-10-19
repo: https://github.com/me-chuan/me-chuan.github.io
tech: [TypeScript, Astro, GitHub Actions]
featured: true
order: 1
---

这是一个**示例项目**，目的是让你打开网站就能看到项目集页面的完整效果。

## 你可以做什么

- 直接把整个文件改写成你自己的项目（保留 frontmatter 结构）
- 在 `src/content/projects/` 下加更多 `.md` 文件，每个会单独生成详情页
- 把 `featured` 设为 `true` 的项目会优先出现在首页

## 前置条件

frontmatter 必填字段：

| 字段 | 说明 |
|---|---|
| `title` | 项目名 |
| `description` | 一句话说明 |
| `repo` | 仓库链接（可与示例一样指向本站的仓库） |
| `demo` | 在线演示地址（可选） |
| `tech` | 技术栈标签，会显示在卡片底部 |
| `featured` | 是否在首页置顶 |
| `order` | 排序权重，越小越靠前 |

去掉这一段，换成项目真实内容就行。**不需要碰任何代码**——`pnpm build` 会重新生成项目页面。
