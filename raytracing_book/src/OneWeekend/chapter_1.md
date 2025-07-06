# 渲染引擎列表

## 1. [Cycles](https://www.blender.org/features/rendering/)
- 所属项目：Blender 内置渲染器
- 语言：C++, CUDA, OptiX, OpenCL
- 特性：支持 CPU 和 GPU Path Tracing（双向、MIS、多光源等）
- 授权协议：Apache 2.0
- 优点：Blender 集成，活跃社区，商业可用
- 缺点：不适合嵌入式或小型项目

## 2. [LuxCoreRender](https://luxcorerender.org/)
- 语言：C++, Python 接口
- 特性：基于物理的光谱渲染，支持 Path Tracing、Bidirectional Path Tracing、Photon Mapping 等
- 授权协议：Apache 2.0
- 优点：高质量、光谱渲染、支持复杂材质
- 缺点：相对较大，不适合轻量嵌入

## 3. [PBRT (Physically Based Rendering Toolkit)](https://pbrt.org/)
- 语言：C++
- 特性：研究级别 Path Tracing 引擎，详尽物理建模
- 授权协议：BSD
- 优点：教学用途极佳，代码结构清晰，配套教材（《PBRT》）
- 缺点：运行效率较低，不是实时渲染器

## 4. [Mitsuba Renderer](https://www.mitsuba-renderer.org/)
- 语言：C++ / Python / CUDA（Mitsuba 2）
- 特性：多种传输算法（Path Tracing、Metropolis 等），插件化设计
- 授权协议：GPLv3 / BSD（部分）
- 优点：适合研究和扩展，支持光谱渲染
- 缺点：学习曲线较陡

## 5. [Nori](https://github.com/wjakob/nori)
- 语言：C++
- 特性：教学用途 Path Tracer
- 授权协议：MIT
- 优点：适合初学者，代码结构极简，便于理解 Path Tracing 原理
- 缺点：功能不全，不适合生产使用

## 6. [Falcor](https://github.com/NVIDIA/Falcor)
- 语言：C++, HLSL
- 特性：NVIDIA 研究级渲染框架，支持 RTX 实时 Path Tracing
- 授权协议：MIT
- 优点：现代实时渲染架构，适合开发实时 Path Tracer
- 缺点：对显卡要求高，仅限 Windows 和 NVIDIA GPU

## 7. [Embree + Intel OSPRay](https://www.ospray.org/)
- 语言：C++
- 特性：专注于高效 CPU 光线追踪，支持 Path Tracing
- 授权协议：Apache 2.0
- 优点：优化极致，适合科学可视化、电影渲染
- 缺点：仅支持 CPU，不适合移动或嵌入式设备

## 8. 数学公式

$$
\begin{aligned}
f(x) &= \int_{-\infty}^{\infty} e^{-x^2} dx \\
     &= \sqrt{\pi}
\end{aligned}
$$

$$
\left( \sum_{n=1}^{\infty} \frac{1}{n^2} \right) = \frac{\pi^2}{6}
$$

$$ \vec{d} = (x, y, z) $$