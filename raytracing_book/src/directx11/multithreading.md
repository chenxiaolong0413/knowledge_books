# Multithreading 介绍

## 一、Direct3D 11 中的多线程渲染简介

Direct3D 11 的多线程设计旨在最大化利用 CPU 和 GPU 的计算能力，通过多线程并行处理，提升整体渲染性能。相比以往的单线程渲染方式（例如主线程负责渲染，辅线程处理资源加载），D3D11 提供了内建的同步机制，使得可以更加灵活、高效地利用多核 CPU，降低等待成本，提升帧率。

## 二、关键概念与线程安全性

**ID3D11Device 与 ID3D11DeviceContext 的线程安全区别**
| 接口                    | 线程安全性   | 说明                                         |
| --------------------- | ------- | ------------------------------------------ |
| `ID3D11Device`        | ✅ 线程安全  | 多线程可并发调用，如创建资源（纹理、缓冲区等）无需同步机制              |
| `ID3D11DeviceContext` | ❌ 非线程安全 | 每个 context 只能被一个线程操作，多个线程需使用同步机制（如临界区）保护访问 |

- **原因**：虽然渲染命令执行在 GPU 上，但这些命令的生成通常在 CPU 上，并涉及资源（如纹理、状态对象）的读写，必须避免竞态条件。
- **设计思路**：每个线程应拥有自己独立的 ID3D11DeviceContext（特别是 Deferred Context），避免多线程共享同一个 context。

## 三、Deferred Context 与 Immediate Context

Direct3D 11 中的渲染工作分为两种上下文：

| 类型                    | 用途                               | 特点                               |
| --------------------- | -------------------------------- | -------------------------------- |
| **Immediate Context** | 立即提交命令到 GPU                      | 必须在一个线程中使用（且是主线程，建议与 DXGI 操作同线程） |
| **Deferred Context**  | 构建命令列表（`Command List`），稍后提交到 GPU | 可在多个线程中并发构建，提高 CPU 利用率           |

- 主线程使用 Immediate Context 提交渲染命令。
- 多个工作线程可以同时构建命令列表（ID3D11CommandList），由主线程汇总并提交，形成并行流水线。

## 四、与 DXGI 的多线程使用注意事项

**DXGI（DirectX Graphics Infrastructure）操作也必须在主线程完成，尤其是**

- IDXGISwapChain::Present 方法
- 除了 AddRef、Release 和 QueryInterface 外，其它 DXGI 接口调用不支持并发调用

**原因**: DXGI 与 GPU 呈现管线紧密绑定，不支持并发访问，使用中要避免线程竞态。

## 五、驱动支持的重要性

多线程性能最终是否提升，取决于显卡驱动对 Direct3D 11 多线程 API 的支持：

- 驱动需支持 D3D11 的多线程资源创建与提交优化
- 可以使用 CheckFeatureSupport 方法检测驱动是否支持多线程优化

## 六、与 Direct3D 10 的差异

- D3D10 对多线程的支持有限，仅通过 thread-safe layer 实现部分支持
- D3D11 从架构层面全面支持多线程，性能更优，使用更灵活

## 总结

在 Direct3D 11 中实现高效的多线程渲染，应遵循以下原则：

- 使用多个 Deferred Context 在不同线程中生成命令；
- 主线程集中提交命令列表和进行 Present 操作；
- 避免多线程共享 Immediate Context 和 DXGI 接口调用；
- 合理使用线程同步机制（如互斥量或临界区） 保护共享资源访问；
- 检测显卡驱动是否支持多线程优化，判断是否能从多线程中获益。

# Object Creation with Multithreading

## 一、Direct3D 11 中资源创建的基本原则

- 使用 ID3D11Device 创建资源与对象(如顶点缓冲、索引缓冲、常量缓冲、纹理等)
- 使用 ID3D11DeviceContext 执行渲染操作（绘制命令）；
- 资源创建本身（如 CreateBuffer、CreateTexture2D）是 CPU 端的行为，通过驱动传递给 GPU。

## 二、多线程创建资源的关键考虑（Multithreading Considerations）

### 1. 驱动对并发创建（concurrent creates）的支持至关重要

- 如果显卡驱动支持并发资源创建（concurrent resource creation）
    - 多线程调用 ID3D11Device 创建资源可带来较大性能提升；
    - 无需担心同步机制，可以同时在多个线程中进行对象创建；

- 如果驱动不支持并发创建：
    - 多线程创建资源将受到限制；
    - 应该在单线程中串行创建资源，或采用某种任务队列方式减少冲突；

> ✅ 可通过查询 D3D11_FEATURE_DATA_THREADING.DriverConcurrentCreates 来判断驱动支持情况：

```c

D3D11_FEATURE_DATA_THREADING threadingSupport;
device->CheckFeatureSupport(
    D3D11_FEATURE_THREADING,
    &threadingSupport,
    sizeof(threadingSupport));

if (threadingSupport.DriverConcurrentCreates) {
    // 支持并发资源创建
}
```

### 2. 并发 ≠ 一定更快：是否提升性能取决于资源类型

- **纹理创建和加载:**

    - 受限于 内存带宽（disk I/O + memory copy），并发并不总是更快；
    - 多线程同时加载多个纹理，可能与串行加载效果类似，甚至更差；

- **着色器编译（如 HLSL 到字节码）：**

    - 通常是 CPU 密集型任务，可以显著受益于多线程并发执行；

- **顶点缓冲、常量缓冲等小资源：**

    - 是否受益要看创建频率与初始化数据量，初始化成本低时，多线程价值不大。

### 3. 利用 pInitialData 初始化新资源更高效

- 若 GPU 和驱动支持并发创建，可以在创建时传递初始数据指针（例如 CreateTexture2D 中的 pInitialData）以避免后续 UpdateSubresource；

- 示例：
```c

D3D11_SUBRESOURCE_DATA initData = {};
initData.pSysMem = textureData;
initData.SysMemPitch = ...;

device->CreateTexture2D(&desc, &initData, &texture);
```

此做法在多线程中可有效减少后续数据传输、同步延迟。

## 三、小结：多线程资源创建的策略建议

| 项目                | 建议                                                    |
| ----------------- | ----------------------------------------------------- |
| 检查驱动是否支持并发资源创建    | 使用 `CheckFeatureSupport` 查询 `DriverConcurrentCreates` |
| 并发创建适合的对象类型       | 着色器、复杂对象编译等 CPU 密集型资源                                 |
| 不适合并发的对象类型        | 大型纹理等内存密集型资源，可能瓶颈在带宽                                  |
| 使用 `pInitialData` | 创建资源时尽量传递初始化数据，提高效率                                   |
| 避免多个线程共享资源创建状态    | 每个线程应独立构造资源描述、数据指针，减少依赖共享状态                           |


# Immediate and Deferred Rendering

> 即时渲染（Immediate Rendering） 和 延迟渲染（Deferred Rendering），这两者都是通过 ID3D11DeviceContext 接口实现的，但应用场景和线程模型不同。

**以下是结构化、严谨的中文解析**

## 一、两种渲染方式概述
| 渲染方式                      | 接口类型                | 执行线程    | 使用场景           | 是否可多线程使用  |
| ------------------------- | ------------------- | ------- | -------------- | --------- |
| Immediate Rendering（即时渲染） | `Immediate Context` | 主线程（通常） | 直接向 GPU 提交绘制命令 | ❌（不可并发）   |
| Deferred Rendering（延迟渲染）  | `Deferred Context`  | 任意工作线程  | 记录命令列表，稍后回放    | ✅（适用于多线程） |


## 二、Immediate Rendering（即时渲染）

### 特点：

- 渲染命令立即被加入到 GPU 命令队列中；
- 通常用于主线程；
- 用于渲染、设置管线状态以及回放命令列表；
- 由 D3D11CreateDevice 或 D3D11CreateDeviceAndSwapChain 创建；
- 不支持多个线程同时操作（非线程安全）。

### 示例流程：

- 设置渲染状态（如绑定顶点缓冲、设置着色器）；
- 调用 Draw* 方法；
- 命令直接排入 GPU 执行队列。


## 三、Deferred Rendering（延迟渲染）

### 特点：

- 渲染命令被记录到命令列表（Command List）中，而不是立即提交；
- 设计目的是支持多线程并行记录渲染命令；
- 最终由主线程使用 Immediate Context 回放命令列表；
- 使用 ID3D11Device::CreateDeferredContext 创建；
- 每个工作线程可使用自己的 Deferred Context，并发构建命令列表。

### 多线程流程示意：

- 多个线程各自：
    - 创建 Deferred Context
    - 设置状态、记录命令
    - 生成 Command List

- 主线程使用 Immediate Context::ExecuteCommandList 回放多个命令列表

### 性能优势：

- 命令回放效率远高于命令构建；
- 可将场景拆分为多个子任务（如每个模型/视角），并发构建命令，最大化 CPU 并行性；
- 减少主线程工作负担，提升帧率。


## 四、注意事项与限制

### 1. 不能并发回放命令列表：

- 尽管多个线程可以并发创建多个 Command List，但它们必须串行在主线程回放；
- Immediate Context 一次只能执行一个命令列表。

### 2. 判断上下文类型：

- 可使用 ID3D11DeviceContext::GetType 判断当前 context 是 Immediate 还是 Deferred。

### 3. Map 方法的使用限制：

- 在 Deferred Context 中，仅支持对 动态资源（D3D11_USAGE_DYNAMIC） 调用 Map；
- 第一次调用必须使用 D3D11_MAP_WRITE_DISCARD；
- 后续可用 D3D11_MAP_WRITE_NO_OVERWRITE（如果资源类型允许）。

### 4. 查询（Query）对象的限制：

| 操作                                        | 支持情况                             |
| ----------------------------------------- | -------------------------------- |
| 在 `Deferred Context` 中生成查询数据（Begin / End） | ✅ 支持                             |
| 在 `Deferred Context` 中读取查询结果（`GetData`）   | ❌ 不支持，只能在 `Immediate Context` 获取 |


例如使用 SetPredication 设置基于查询结果的条件渲染时，查询数据必须通过 Immediate Context 执行 ExecuteCommandList 后由 GPU 提交。

## 五、总结与使用建议

| 应用场景                     | 推荐使用的 Context 类型         |
| ------------------------ | ------------------------ |
| 实时用户输入控制、最终绘制提交          | `Immediate Context`（主线程） |
| 多线程预处理复杂场景（如建筑物批次、角色动画等） | `Deferred Context`（工作线程） |


### 核心策略：

利用 Deferred Context 实现渲染命令的多线程构建，最后交由 Immediate Context 统一回放执行，达成**“分布式构建、集中式提交”**的高性能渲染架构。

# Command List

## 一、什么是 Command List（命令列表）

命令列表是指由 GPU 可执行的一系列图形命令的集合。它的主要作用是：

- 记录（Record）：将一系列绘制指令、状态设置等命令记录下来；
- 回放（Playback）：将这些命令提交给 GPU 执行。

其核心目的是：降低 API 层的开销，提高多线程渲染效率。

## 二、使用场景

命令列表的使用主要分为两大类：

### 1. 多线程实时构建与回放

- 典型场景：在同一帧（frame）中：
- 主线程使用 Immediate Context 渲染当前画面的一部分；
- 工作线程使用 Deferred Context 录制另一部分命令；

当主线程渲染完后，回放（Execute）工作线程生成的命令列表。

✅ 优势：可将复杂场景（如大型地图、多个模型）分割成并行渲染任务，充分利用多核 CPU。

### 2. 预录制命令，在需要时高效回放

- 典型场景：
    - 在加载关卡时提前录制某些绘制命令（如场景装饰、背景元素）；
    - 后续每一帧快速回放这些命令，提高运行时效率。

✅ 优势：预先消除命令构建成本，减少运行时 CPU 工作负担。

⚠️ 注意：命令列表不能持久化存储或跨程序运行使用，无法从磁盘加载，因为它与运行时的资源绑定关系无法保存。

## 三、使用限制与要点

| 特性   | 描述                                             |
| ---- | ---------------------------------------------- |
| 录制方式 | 只能由 `Deferred Context` 录制                      |
| 回放方式 | 只能由 `Immediate Context::ExecuteCommandList` 回放 |
| 并发录制 | ✅ 支持多线程同时使用多个 `Deferred Context` 录制多个命令列表      |
| 并发回放 | ❌ 不支持并发回放，`Immediate Context` 一次只能执行一个命令列表     |
| 是否可变 | ❌ 命令列表是不可变的（immutable），一旦录制完成无法修改              |
| 生命周期 | 仅在当前程序执行周期中有效，不可跨游戏存档或重启后使用                    |


## 四、性能影响因素

命令列表的性能依赖于：

- 显卡驱动对命令列表支持的深度；
- CPU 渲染命令生成过程是否复杂；
- 多线程分布是否合理、均衡；
- 是否避免了 GPU 等待或状态冲突。
⚠️ 建议在使用前查询驱动支持程度：

```c

D3D11_FEATURE_DATA_THREADING threadingSupport;
device->CheckFeatureSupport(D3D11_FEATURE_THREADING, &threadingSupport, sizeof(threadingSupport));

if (threadingSupport.DriverCommandLists) {
    // 驱动支持命令列表
}

```

## 五、总结：Command List 使用指南

| 步骤                       | 方法                                       |
| ------------------------ | ---------------------------------------- |
| 1. 创建 `Deferred Context` | `ID3D11Device::CreateDeferredContext`    |
| 2. 使用该 context 记录命令      | 调用绘制、状态设置等 API                           |
| 3. 生成命令列表                | `ID3D11DeviceContext::FinishCommandList` |
| 4. 使用主线程回放               | `ImmediateContext::ExecuteCommandList`   |
| 5. （可选）重复使用              | 若场景重复绘制，则可回放命令列表多次                       |


# Multiple-Pass Rendering

**多次渲染** 是一种图形渲染技术，其核心思想是: **场景图会被遍历多次，每次遍历称为一次“渲染通道”（pass）**，最终合成一个图像输出。这样做的主要目的是：

- **分离复杂渲染任务**，使得每个通道关注一个特定的渲染子任务（比如几何渲染、光照、后期处理等）；
- **提高性能**，特别是在支持并发执行的图形硬件中，可以让多个渲染任务并行处理。

## 一、关键概念解释：

### 1. Immediate Context（即时上下文）

- 直接在主线程/主GPU上下文中发出渲染命令；
- 通常用于主要渲染过程，例如将图形绘制到 Render Target（RT）中；
- 执行速度快，实时性强。

### 2. Deferred Context（延迟上下文）

- 用于录制命令（不是立即执行），可以在多线程中完成；
- 这些命令通过 FinishCommandList() 生成 CommandList，由 Immediate Context 在主线程中统一执行；
- 非常适合多核 CPU 并行准备渲染任务。

## 二、流程详解：

设有三次渲染通道（Pass 0、Pass 1、Pass 2）：

### Pass 0 - Immediate Context：
- 设定渲染目标为资源 X；
- 渲染主场景（绘制几何体等）；
- 资源 X 是被写入的 Render Target View（RTV）。

### Pass 1 & Pass 2 - Deferred Context：

- 不修改资源 X，只读取它作为 Shader Resource View（SRV）；
- 以用于如光照计算、屏幕空间效果、模糊等后期处理；
- 将命令录入 CommandList 中。

### 执行顺序：

- FinishCommandList() 用于生成命令列表；
- ExecuteCommandList() 让 Immediate Context 实际执行这些渲染操作。

## 三、伪代码解读：

```c

ImmCtx->SetRenderTarget(pRTViewOfResourceX); // 设置渲染目标：资源 X
DefCtx1->SetTexture(pSRView1OfResourceX);    // 设置读取资源 X（延迟上下文 1）
DefCtx2->SetTexture(pSRView2OfResourceX);    // 设置读取资源 X（延迟上下文 2）

for () { // 遍历场景图
    ImmCtx->Draw();     // 第一通道：渲染基本图形到资源 X（写入）

    DefCtx1->Draw();    // 第二通道（录制）：使用资源 X 做纹理操作（如后期处理）
    DefCtx2->Draw();    // 第三通道（录制）：使用资源 X 做其他处理
}

// 创建命令列表
DefCtx1->FinishCommandList(&pCL1);
DefCtx2->FinishCommandList(&pCL2);

// 执行延迟上下文的命令列表
ImmCtx->ExecuteCommandList(pCL1);
ImmCtx->ExecuteCommandList(pCL2);

```

## 四、图示结构（简化）

```markdown

         [Scene Graph Traversal]
                  |
     -------------------------------
     |             |              |
 [Pass 0]     [Pass 1]       [Pass 2]
Immediate     Deferred       Deferred
Context       Context        Context
(Render)      (Texture)      (Effect)
     |             |              |
     ------------同步执行-----------
                    ↓
             [Final Framebuffer]
```

## 五、优点总结

- **性能优化**：充分利用多核 CPU，将准备命令的工作并行化。
- **结构清晰**：不同渲染阶段分离，更易维护和扩展。
- **资源复用**：Render Target（写）和 Shader Resource（读）灵活切换。


## 六、注意事项

- 在 ExecuteCommandList() 前，不应让 Deferred Context 使用尚未更新完成的资源；
- 保证资源同步（如 GPU Barrier、状态转换）是多通道渲染正确运行的关键；
- 并非所有 GPU 都对 deferred contexts 支持得很好，需测试性能收益。
