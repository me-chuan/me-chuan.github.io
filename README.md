# 个人主页

基于 [Astro 7](https://astro.build) 的静态个人主页，部署在 GitHub Pages。

- **站点地址**：https://me-chuan.github.io
- **技术栈**：Astro 7 + TypeScript + pnpm 11 + 纯 CSS（无 UI 框架）
- **部署**：GitHub Actions 自动部署（`main` 分支推送即触发）

## 目录结构

```
.
├─ .github/
│  ├─ workflows/deploy.yml     # 主部署：build → upload artifact → deploy
│  ├─ workflows/quality.yml    # PR 门禁：build + 死链检查 + Lighthouse CI
│  └─ dependabot.yml           # 依赖与 Action 自动升级
├─ public/                     # 直接拷贝到站点根目录的静态资源
├─ src/
│  ├─ components/              # Header / Footer / SEO / 卡片组件
│  ├─ content/                 # 博客与项目的 Markdown 内容
│  ├─ data/site.config.ts      # 站点全局信息（单点维护）
│  ├─ layouts/BaseLayout.astro
│  ├─ pages/                   # 路由
│  ├─ styles/global.css        # 设计令牌 + 全局样式
│  └─ content.config.ts        # 内容集合 schema
├─ astro.config.mjs
├─ lighthouserc.cjs            # Lighthouse 门禁阈值
└─ pnpm-lock.yaml              # 必须提交，CI 用 --frozen-lockfile
```

## 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 本地开发服务器（http://localhost:4321） |
| `pnpm build` | 构建到 `dist/`（与 CI 产物一致） |
| `pnpm preview` | 本地预览构建结果 |
| `pnpm check` | TypeScript + 内容 schema 检查 |

## 写内容

- **加文章**：在 `src/content/blog/` 放一个 `.md` 文件，frontmatter 需含 `title` / `description` / `pubDate` / `tags`
- **加项目**：在 `src/content/projects/` 放一个 `.md` 文件，frontmatter 需含 `title` / `description`
- **改站点信息**：编辑 `src/data/site.config.ts`

schema 会在构建期校验，字段写错会让 CI 直接失败——比上线后才发现要好。

## ⚠️ 首次部署必看

推送后如果网站没变化，按这个顺序排查：

1. **仓库 Settings → Pages → Build and deployment → Source 必须选 `GitHub Actions`**。
   选成 "Deploy from a branch" 会让工作流跑完但站点不更新。
2. 检查 Actions 页面的运行日志，看失败在哪个 step。
3. 确认 `pnpm-lock.yaml` 已提交。

## 绑定自定义域名

1. 域名服务商加 DNS 记录：

   | 类型 | 名称 | 值 |
   |---|---|---|
   | A | `@` | `185.199.108.153` `185.199.109.153` `185.199.110.153` `185.199.111.153` |
   | AAAA | `@` | `2606:50c0:8000::153` `2606:50c0:8001::153` `2606:50c0:8002::153` `2606:50c0:8003::153` |
   | CNAME | `www` | `me-chuan.github.io` |

2. 改 `astro.config.mjs` 的 `site` 和 `src/data/site.config.ts` 的 `url`
3. 新建 `public/CNAME`，写入域名
4. 仓库 Settings → Pages → Custom domain 填域名，勾选 **Enforce HTTPS**

> 不要使用通配符 DNS 记录（`*.example.com`），官方明确警告这存在域名接管风险。

## 技术方案文档

完整的选型论证、CI/CD 设计、SEO/性能基线、风险登记册见 `personal-site-github-pages-plan.md`。
