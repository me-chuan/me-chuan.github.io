---
title: Aseprite Builder
description: 用 GitHub Actions 在 10 分钟内构建 Aseprite，覆盖 Windows、macOS、Ubuntu 三平台。
startDate: 2025-10-11
repo: https://github.com/me-chuan/aseprite-builder
tech: [GitHub Actions, Aseprite, CMake]
featured: true
order: 1
---

Aseprite 的闭源授权让"每个人都在自己机器上编译一遍"变得很没必要。这个仓库把编译流程搬进 GitHub Actions，**10 分钟**内产出三个平台的构建产物。

## 为什么需要它

Aseprite 的官方 Linux 构建路线依赖一串容易踩坑的环节：第三方依赖的版本锁定、`libwebp` / `libpng` 的多版本冲突、Gtk 层的头文件缺失。手工在新系统上复现一遍，轻则半小时起步，重则一整天。

GitHub Actions 提供了**完全一致的干净环境**，并且把整个过程固化成可重复执行的定义。

## 覆盖平台

| 平台 | 说明 |
|---|---|
| Windows | |
| macOS | |
| Ubuntu | |

## 使用方式

在仓库的 Actions 页面手动触发工作流，或推送到触发分支。构建产物作为 artifact 提供。
