---
title: 写文章与加项目：这个站点的内容操作手册
description: 给自己看的备忘。新增一篇博客、新增一个项目、改个人信息，各自要动哪些文件。
pubDate: 2026-10-19
tags: [使用说明]
---

这是一篇偏向"使用说明"的文章，也是这个站点内容的活文档。

## 加一篇博客

在 `src/content/blog/` 下新建 `.md` 文件，文件名就是 URL（`foo-bar.md` → `/blog/foo-bar/`）。

frontmatter 必填字段：

```yaml
---
title: 文章标题
description: 一句话摘要，会用在列表页和 SEO 描述里
pubDate: 2026-10-19
tags: [标签1, 标签2]
---
```

可选字段：

| 字段 | 说明 |
|---|---|
| `updatedDate` | 有则显示"更新于" |
| `draft` | `true` 时线上不显示（本地开发可见） |

schema 会在构建期校验，字段写错或缺失会直接让 CI 失败——比上线后才发现要好。

## 加一个项目

在 `src/content/projects/` 下新建 `.md` 文件：

```yaml
---
title: 项目名
description: 一句话说明这个项目是干什么的
startDate: 2024-03-01
repo: https://github.com/me-chuan/some-repo
demo: https://example.com
tech: [TypeScript, Astro]
featured: true
order: 1
---
```

`featured: true` 的项目会优先出现在首页；`order` 越小越靠前。正文（Markdown 部分）可选，会渲染在项目详情页。

## 改个人信息

所有站点级信息集中在 `src/data/site.config.ts` 一个文件里：

- 站名、简介、作者名、头像路径
- 社交链接（填了才显示，`email` 留空就不渲染联系入口）
- 顶部导航
- 社交卡片图片路径 `public/og-image.png`

改完 `pnpm dev` 立刻生效。

## 换域名

现在用的是 `me-chuan.github.io`。换成自有域名需要动三处：

1. `astro.config.mjs` 里的 `site`
2. `src/data/site.config.ts` 里的 `url`
3. `public/CNAME`（新建文件，写域名，一行一个）

然后在域名服务商加 DNS 记录：

| 类型 | 名称 | 值 |
|---|---|---|
| A | `@` | `185.199.108.153` `185.199.109.153` `185.199.110.153` `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` `2606:50c0:8001::153` `2606:50c0:8002::153` `2606:50c0:8003::153` |
| CNAME | `www` | `me-chuan.github.io` |

最后到仓库 Settings → Pages 填 Custom domain，勾上 Enforce HTTPS。等证书签发（几分钟到 24 小时）就完成了。

> ⚠️ 不要用通配符 DNS 记录（`*.example.com`），官方明确警告这会带来域名接管风险。

## 本地开发

```bash
pnpm dev        # 开发服务器，热更新
pnpm build      # 构建到 dist/，和 CI 产物一致
pnpm preview    # 本地预览构建结果
pnpm check      # TypeScript + 内容 schema 检查
pnpm covers     # 重新生成全部文章封面到 src/assets/covers/
```

推送到 `main` 分支会自动触发构建和部署。
