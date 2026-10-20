---
title: GitHub Pages 自动部署流水线：三段式与那些容易踩的坑
description: 部署工作流为什么是 build / upload / deploy 三段而不是一段，以及 Pages Source 选错、权限被收紧、锁文件缺失这几个真实会让部署失败的原因。
pubDate: 2026-10-19
tags: [GitHub Pages, CI/CD, GitHub Actions]
---

这个站点的部署靠一条 GitHub Actions 工作流。整体结构只有三步，但把它调通的过程里踩到了几个坑，整理下来。

<blockquote class="pull-quote">
源代码仓库里没有构建产物，git 历史干净；线上产物和 CI 严格同源；部署历史天然可回滚——拆三段换来的不只是结构清晰，是这些确定性的副产品。
</blockquote>

## 为什么要拆成三段

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7.0.1
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v5.0.0
        with:
          path: ./dist

  deploy:
    needs: build
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v5.0.1
```

`upload-pages-artifact` 和 `deploy-pages` 之间通过 **artifact** 传递产物，而不是通过分支。这样做的好处：

- **源码仓库里不会混入构建产物**，git 历史干净
- 部署用的产物和 CI 构建的产物严格同源，不存在"本地 build 出来的东西和线上不一样"
- 天然支持"部署历史回滚"——Pages 每次部署都有独立记录

## 坑一：Pages Source 选错

**症状**：工作流全绿，Actions 里显示部署成功，但网站内容没变。

**原因**：仓库 Settings → Pages → Build and deployment → Source 选成了 "Deploy from a branch"。

这个选项的意思是"GitHub 自己从某个分支的某个目录直接发布文件"，完全绕开了你的工作流。工作流跑得再绿也跟它没关系。

**解法**：Source 必须选 **GitHub Actions**。这是启用工作流部署后，GitHub 才会去接收工作流上传的 artifact。

## 坑二：权限被收紧

现在的工作流显式声明了权限：

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

`pages: write` 用来发布产物，`id-token: write` 用来拿 OIDC token 向 Pages 服务证明身份。少任何一个，部署都会在最后一步失败，而且错误信息通常很模糊（`HttpError: Resource not accessible by integration`）。

如果你在组织里，管理员可能把这两个权限在组织层面禁掉了——那就不是工作流本身的问题了。

## 坑三：锁文件没提交

CI 里用的是 `pnpm install --frozen-lockfile`，意思是"严格按 lock 文件安装，lock 和 package.json 不一致就直接失败"。

这保证了构建可复现，但前提是 **`pnpm-lock.yaml` 必须提交到仓库**。忘了提交，CI 会直接报 `ERR_PNPM_OUTDATED_LOCKFILE` 挂掉。

好处是：以后依赖升级走 Dependabot 提 PR，diff 一目了然，构建结果可复现。

## 顺带一提：并发控制

```yaml
concurrency:
  group: pages
  cancel-in-progress: true
```

连续 push 两次时，第二次会取消第一次的构建。少了这段，旧构建有可能后完成并覆盖新产物，线上出现"我明明推了新版本，怎么还是旧的"。

## 排查顺序

部署出问题时，按这个顺序看能少走弯路：

1. Actions → 对应运行 → 看失败在哪个 step
2. Build 失败 → 本地跑 `pnpm build` 复现，多半是内容 schema 校验或 TypeScript
3. Upload 失败 → 检查 `path` 和权限
4. Deploy 失败 → 检查 Pages Source、分支名、权限
5. 部署成功但页面不对 → 打开浏览器 DevTools 看 Network / Console 里的 404
