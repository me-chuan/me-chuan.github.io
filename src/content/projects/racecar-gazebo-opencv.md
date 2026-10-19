---
title: Racecar Gazebo + OpenCV
description: MIT Racecar 的 Gazebo 仿真环境，并接入 OpenCV 做视觉感知。
startDate: 2024-06-01
repo: https://github.com/me-chuan/racecar_gazebo_opencv
tech: [Python, Gazebo, ROS, OpenCV]
featured: true
order: 3
---

用 **Gazebo** 搭一个 MIT Racecar 小车的仿真环境，再接上 **OpenCV** 做视觉部分的验证。

## 解决什么问题

实体小车调试相机相关的功能非常低效：场地、标定、光照都要反复折腾。仿真环境把这些变量都变成可复现的参数。

## 组成

- **Gazebo 世界**：赛道、障碍物、传感器配置
- **Racecar 模型**：URDF 描述与差速驱动
- **OpenCV 管线**：图像采集 → 处理 → 决策，直接复用真实车上的代码路径

> TODO：补充环境依赖版本、启动命令与典型实验结果截图。
