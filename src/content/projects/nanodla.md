---
title: nanoDLA
description: 基于 fx2lafw 的逻辑分析仪，采样率 24 MHz，用开源硬件做数字信号抓取。
startDate: 2025-02-04
repo: https://github.com/me-chuan/nanoDLA
tech: [FPGA, fx2lafw, 逻辑分析]
featured: true
order: 2
---

用一块廉价的开源 FPGA 板（Cypress FX2 方案）实现**逻辑分析仪**，`fx2lafw` 固件 + 配套的上位机与协议。

## 特点

- **采样率 24 MHz** —— 足以抓到常见的 UART / SPI / I²C 波形
- 基于 `fx2lafw` 生态，上位机直接用 Saleae Logic 兼容软件驱动
- 硬件成本低，固件与上位机全部开源

## 组成

| 层级 | 内容 |
|---|---|
| 固件 | FX2 端 USB 高速采样固件 |
| 硬件 | FPGA 板 + 必要的电平转换 |
| 上位机 | 复用 `fx2lafw` 的开源客户端 |

> TODO：补充接线说明、触发方式和实际抓取波形示例。
