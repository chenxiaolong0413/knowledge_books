# 🗓 总体规划（按周）
## 📘 第 1~2 周：图形学入门 & 数学基础复习
**目标**：了解图形学基本构成，打好数学基础。

### 学习内容：

三维坐标系、向量、矩阵、点乘/叉乘

光线与几何的交点计算（射线-球、射线-平面）

坐标变换（世界空间、观察空间、屏幕空间）

### 推荐资料：

《Fundamentals of Computer Graphics》第1章、第2章

相关线性代数补充（3Blue1Brown 线性代数系列）

### 输出成果：

实现向量库和射线-球交点测试函数

## 📘 第 3~5 周：光线追踪基本原理（Ray Tracing）
**目标**：理解光线追踪原理，构建最简单的 Ray Tracer。

### 学习内容:

相机模型（光线生成）

光线与场景求交

基本材质（漫反射）

图像输出（PPM/PNG）

### 推荐资料：

Ray Tracing in One Weekend

### 输出成果：

完成《Ray Tracing in One Weekend》第1章~第6章代码（C++）

## 📘 第 6~8 周：Path Tracing 初步理解（全局光照 & 重要性采样）
**目标**：理解光线反弹的统计计算，初步构建 Path Tracer。

### 学习内容：

蒙特卡洛积分、路径采样

俄罗斯轮盘赌算法

Lambertian 漫反射的球面随机采样

### 推荐资料：

Ray Tracing: The Next Week

YouTube: Sebastian Lague 的 Path Tracing 系列视频

### 输出成果：

完成带有间接光的 Path Tracer（不含光源重要性采样）

## 📘 第 9~11 周：构建复杂材质与优化采样
**目标**：支持金属、透明材质，引入更多高质量采样方法。

### 学习内容：

金属反射（镜面反射）

折射材质（玻璃）

多重采样 + 降噪（Gamma 校正、平均颜色）

### 推荐资料：

Ray Tracing: The Rest of Your Life

《Physically Based Rendering》第7章（选读）

### 输出成果：

实现多材质渲染图、支持抗锯齿、路径反弹深度控制

## 📘 第 12~14 周：优化性能 + 真实世界光照模型
**目标**：理解渲染方程，支持区域光源与重要性采样。

### 学习内容：

BRDF 概念、Lambert、Phong、GGX 等模型

面光源采样、直接光采样优化

光源重要性采样 vs 路径采样

### 推荐资料：

小型 CPU 渲染器（如 smallpt）

YouTube: David Kuri’s Path Tracer 实现讲解

### 输出成果：

支持光源重要性采样、加速渲染效果

## 📘 第 15~16 周：总结项目 & 拓展阅读
**目标**：整合知识，构建完整的 Path Tracer 项目，并了解 GPU 实现可能。

### 任务：

用 C++ 或 Python 写一个整理版的 Path Tracer

结合 GUI 输出（如 SDL/OpenGL）

初步了解 GLSL/Compute Shader 中的路径追踪实现方式

### 可选进阶：

用 WebGPU / Three.js 实现 Path Tracing Demo

阅读《Real-Time Rendering》第5版

## 📌 补充建议
每周建议投入 6~10 小时，周末进行完整代码练习。

优先完成 CPU 路径追踪实现后，再考虑 GPU 实时路径追踪。

保持一个 Git 仓库，用于记录每周成果和测试图像。