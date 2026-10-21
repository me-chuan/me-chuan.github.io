---
title: 个人主页与技术写作系统
description: 用 Astro 搭建的个人网站，把技术文章、项目记录与自动部署整理成一个可以持续更新的空间。
startDate: 2026-10-19
repo: https://github.com/me-chuan/me-chuan.github.io
demo: https://me-chuan.github.io
tech: [TypeScript, Astro, GitHub Actions]
featured: true
order: 1
---

这个网站是我整理工程实践与技术写作的地方。它需要让文章和项目都容易查找，也要让我愿意长期维护。

## 我做了什么

- 使用 Astro 构建静态页面，将博客与项目内容放在 Markdown 集合中管理。
- 为文章添加标签、封面和 RSS，让内容有清晰的阅读与订阅路径。
- 使用 GitHub Actions 构建并部署到 GitHub Pages。

## 设计与工程取舍

首页采用编辑式排版：先介绍关注方向，再展示项目和文章。视觉上用衬线标题、克制的蓝色和清晰的分隔线，给内容留出呼吸空间。

选择静态站点，是因为这里主要承载阅读内容和项目记录。构建、上传和部署由工作流分段完成，便于发现哪一步出了问题。

项目仍在持续更新。设计和内容会随新的实践继续调整。
