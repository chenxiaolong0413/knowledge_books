# 📦 资源绑定（Resource Binding）
-------------------------

由于光线在场景中可以射向任意方向，因此在光线追踪中，不仅所有用于渲染场景的着色器都必须**同时可用**，而且它们所依赖的**资源绑定**（比如纹理、常量缓冲等）也必须一并准备好。

实际上，**选择运行哪个着色器（通过“着色器标识符”实现）本身也被视作一种资源绑定**，和传统的根签名绑定（如描述符表、根描述符、根常量）处于同一层级。

* * *

🧵 描述符堆（Descriptor Heaps）
-------------------------

通过 `SetDescriptorHeaps()` 设置到命令列表（CommandList）上的**描述符堆**，是**光线追踪、图形管线和计算管线共用**的。

* * *

🧬 本地根签名（Local Root Signature） vs 全局根签名（Global Root Signature）
--------------------------------------------------------------

在光线追踪中，着色器的资源绑定方式有两种：

### ✅ 本地根签名（Local Root Signature）

* 绑定内容来自“着色器表”（Shader Table，后文会介绍）。
    
* 允许每个着色器**拥有自己独立的绑定参数**。
    
* 比全局根签名更灵活，也支持更多内容。
    

### ✅ 全局根签名（Global Root Signature）

* 通过 `SetComputeRootSignature()` 设置到命令列表上（也可能存在其他间接方式）。
    
* 所有光线追踪着色器和计算着色器共享这一套绑定。
    

> 注意：一个光线追踪任务中的多个着色器**可以各自使用不同的本地根签名**，但**必须共用同一个全局根签名**。

* * *

📏 本地根签名的大小限制
-------------

本地根签名的最大占用空间受“着色器记录步长（Shader Record Stride）”限制。上限为：

```
最大步长 4096 字节 - 着色器标识符占用 32 字节 = 4064 字节
```

也就是说，**单个着色器所能使用的本地根签名参数，最大不能超过 4064 字节**。

* * *

❌ 绑定寄存器不能重叠
-----------

对于某个着色器来说：

* 本地根签名里定义的绑定寄存器（如 `t0`, `u0` 等）
    
* **不能与全局根签名中的绑定寄存器重叠**
    

* * *

🧂 关于静态采样器（Static Samplers）
---------------------------

* 本地根签名也可以像全局根签名那样**定义静态采样器**。
    
* 但有个重要限制：**凡是定义了同名采样器（如 `s0`）的本地根签名，必须使用完全相同的定义**。
    

> 例如，如果某个本地根签名定义了静态采样器 `s0`，那么其他也定义了 `s0` 的本地根签名，**必须用一模一样的定义**。

### 原因：

为了让某些硬件实现可以用描述符堆模拟静态采样器。这样它们可以：

* 给采样器在采样器堆中分配固定位置，
    
* 不管哪个着色器用哪个本地根签名，只要采样器名相同（比如都是 `s0`），就能共享同一个槽位。
    

当然，全局根签名中的静态采样器也会遵循相同的原则。

* * *

📌 小提示
------

根签名中还有一个“Shader Visibility Flags（着色器可见性标志）”的概念，具体用法可以参考相关章节。

* * *

如果你还想继续了解“着色器表”、“着色器标识符”或“状态对象（State Object）”等内容，我可以继续帮你翻译整理。是否继续？

* * *

**You:**

上面的概念太抽象不好理解，请结合香港结构体和函数以及功能代码进行说明

* * *

**ChatGPT:**

非常好，那我们来**结合结构体、函数调用和功能代码**，用一个完整例子说明**光线追踪中的资源绑定机制**，特别是 **本地根签名（Local Root Signature）和全局根签名（Global Root Signature）** 的作用和区别。

* * *

🧪 场景假设
-------

你现在要写一个光线追踪应用，用来渲染一个带有材质属性的球体。我们想要的效果是：

* 每个物体（例如球）有自己的材质（比如颜色、粗糙度等）
    
* 所有物体共享一个灯光信息
    
* 在光线命中物体时读取对应的材质信息
    

* * *

🧩 全局资源 和 本地资源的分工
-----------------

| 类型 | 内容 | 放在哪 |
| --- | --- | --- |
| 全局 | 灯光信息、摄像机位置等 | **全局根签名（Global Root Signature）** |
| 本地 | 每个球的材质颜色、粗糙度等 | **本地根签名（Local Root Signature）** |

* * *

🏗️ 定义结构体
---------

### 1️⃣ 全局常量结构体（GlobalConstants.hlsl）

```hlsl
cbuffer GlobalConstants : register(b0)
{
    float3 lightDirection;
    float3 cameraPosition;
};
```

### 2️⃣ 每个物体的本地数据（例如放在 Shader Record 里）

```hlsl
struct MaterialData
{
    float3 baseColor;
    float roughness;
};
```

* * *

📋 定义根签名
--------

### 1️⃣ 全局根签名（HLSL 示例）

```hlsl
// Global Root Signature
RootSignature GlobalRootSignature =
{
    RootConstants(num32BitConstants = 6, b0), // lightDirection + cameraPosition
    DescriptorTable(SRV(t0)) // 假设全局贴图资源
};
```

### 2️⃣ 本地根签名（每个命中着色器单独设置）

```hlsl
// Local Root Signature
RootSignature LocalRootSignature =
{
    RootConstants(num32BitConstants = 4, b1) // baseColor(r,g,b) + roughness
};
```

> 注意：b0 是全局常量，b1 是每个实例的材质数据，避免重叠。

* * *

🧑‍💻 设置根签名和着色器记录代码（C++）
------------------------

### 1️⃣ 设置全局根签名

```cpp
cmdList->SetComputeRootSignature(globalRootSignature);

// 假设我们用 root constants 方式设置全局光照数据
float constants[] = {
    lightDir.x, lightDir.y, lightDir.z,
    cameraPos.x, cameraPos.y, cameraPos.z
};
cmdList->SetComputeRoot32BitConstants(0, 6, constants, 0);
```

* * *

### 2️⃣ 设置本地根签名 & 填充 Shader Table

假设你有一个 `ShaderRecord`，每个记录用于绑定一个球的材质：

```cpp
struct MyShaderRecord
{
    void* shaderIdentifier;         // 着色器函数指针
    float baseColor[3];             // r, g, b
    float roughness;                // 材质粗糙度
};
```

我们填充一个 Shader Table（相当于传入 DispatchRays）：

```cpp
MyShaderRecord record = {};
record.shaderIdentifier = pso->GetShaderIdentifier(L"MyClosestHit");
record.baseColor[0] = 1.0f;  // 红色球
record.baseColor[1] = 0.0f;
record.baseColor[2] = 0.0f;
record.roughness = 0.5f;
```

* * *

🎯 着色器使用本地绑定数据
--------------

### ClosestHitShader.hlsl

```hlsl
// 来自 Local Root Signature
RootConstants MaterialData : register(b1);

[shader("closesthit")]
void MyClosestHitShader(inout RayPayload payload, in BuiltInTriangleIntersectionAttributes attr)
{
    float3 color = MaterialData.baseColor;
    float roughness = MaterialData.roughness;

    // 漫反射光照计算
    float3 normal = normalize(attr.normal);
    float NdotL = max(dot(normal, -lightDirection), 0.0f);
    payload.color = color * NdotL;
}
```

* * *

🧠 小结
-----

| 区别 | 全局根签名 | 本地根签名 |
| --- | --- | --- |
| 作用范围 | 所有着色器共享 | 每个着色器/物体独立 |
| 数据来源 | `SetComputeRoot*` 设置 | 着色器表（Shader Table）传入 |
| 示例数据 | 光照、相机位置等 | 材质颜色、粗糙度等 |
| 编码位置 | 命令列表里设置一次 | 着色器记录中逐条设置 |
| 用法优势 | 节省内存 + 可复用 | 灵活、细粒度控制 |

* * *

如果你需要完整的代码示例项目或者进一步讲解 Shader Table 如何构建，我也可以继续展开。是否需要？

* * *

**You:**

需要

* * *

**ChatGPT:**

很好，下面我们通过一个完整的 **D3D12 光线追踪资源绑定示例**，来展示如何配置：

* **全局根签名**
    
* **本地根签名**
    
* **Shader Table（着色器表）**
    
* **DispatchRays 调用流程**
    

我们将构建一个小型的光线追踪系统：一个红色球体，打上方向光。重点在于资源绑定逻辑而不是完整渲染框架。

* * *

🧱 一、全局根签名定义（HLSL 和 C++）
------------------------

### ✅ 全局根签名（HLSL）

```hlsl
cbuffer GlobalConstants : register(b0)
{
    float3 lightDirection;
    float3 cameraPosition;
};
```

### ✅ 全局根签名（C++ 创建方式）

```cpp
CD3DX12_ROOT_PARAMETER1 rootParams[1];

// 使用 Root Constants 传光源和相机位置 (6 个 float)
rootParams[0].InitAsConstants(
    6,           // 常量数量
    0,           // b0
    0,           // 可见性 = 所有着色器阶段
    D3D12_SHADER_VISIBILITY_ALL
);

CD3DX12_VERSIONED_ROOT_SIGNATURE_DESC globalRootSigDesc;
globalRootSigDesc.Init_1_1(
    _countof(rootParams), rootParams,
    0, nullptr, // 没有静态采样器
    D3D12_ROOT_SIGNATURE_FLAG_NONE
);
```

* * *

🧬 二、本地根签名定义（HLSL 和 C++）
------------------------

### ✅ 本地根签名（HLSL）

```hlsl
cbuffer MaterialConstants : register(b1)
{
    float3 baseColor;
    float roughness;
};
```

### ✅ 本地根签名（C++ 创建方式）

```cpp
CD3DX12_ROOT_PARAMETER1 localParams[1];
localParams[0].InitAsConstants(4, 1, 0, D3D12_SHADER_VISIBILITY_ALL); // b1: 4个 float

CD3DX12_VERSIONED_ROOT_SIGNATURE_DESC localRootSigDesc;
localRootSigDesc.Init_1_1(
    _countof(localParams), localParams,
    0, nullptr,
    D3D12_ROOT_SIGNATURE_FLAG_LOCAL_ROOT_SIGNATURE
);
```

注意 `D3D12_ROOT_SIGNATURE_FLAG_LOCAL_ROOT_SIGNATURE` 表示这是本地根签名。

* * *

🧠 三、构建 Shader Table
--------------------

```cpp
// 1. 着色器标识符获取
void* hitGroupIdentifier = pipelineState->GetShaderIdentifier(L"MyHitGroup");

// 2. 构建 shader record 内容结构
struct ShaderRecord
{
    uint8_t shaderId[D3D12_SHADER_IDENTIFIER_SIZE_IN_BYTES];
    float baseColor[3];   // red
    float roughness;      // 0.5
};

// 3. 填充 record 数据
ShaderRecord rec = {};
memcpy(rec.shaderId, hitGroupIdentifier, D3D12_SHADER_IDENTIFIER_SIZE_IN_BYTES);
rec.baseColor[0] = 1.0f; rec.baseColor[1] = 0.0f; rec.baseColor[2] = 0.0f;
rec.roughness = 0.5f;

// 4. 拷贝到 GPU buffer（着色器表）
D3D12Buffer shaderTableBuffer = CreateUploadBuffer(sizeof(ShaderRecord));
memcpy(shaderTableBuffer.cpuPtr, &rec, sizeof(ShaderRecord));
```

* * *

🚀 四、DispatchRays 配置
--------------------

```cpp
D3D12_DISPATCH_RAYS_DESC dispatchDesc = {};

// RayGenShader Table
dispatchDesc.RayGenerationShaderRecord.StartAddress = rayGenShaderTable->GetGPUVirtualAddress();
dispatchDesc.RayGenerationShaderRecord.SizeInBytes  = rayGenRecordSize;

// MissShader Table
dispatchDesc.MissShaderTable.StartAddress = missShaderTable->GetGPUVirtualAddress();
dispatchDesc.MissShaderTable.SizeInBytes  = missRecordSize;
dispatchDesc.MissShaderTable.StrideInBytes = missRecordSize;

// HitGroup Table（包含我们自定义的 record）
dispatchDesc.HitGroupTable.StartAddress = hitGroupShaderTable->GetGPUVirtualAddress();
dispatchDesc.HitGroupTable.SizeInBytes = sizeof(ShaderRecord);
dispatchDesc.HitGroupTable.StrideInBytes = sizeof(ShaderRecord);

// 调用光线调度
cmdList->DispatchRays(&dispatchDesc);
```

* * *

🎨 五、Closest Hit Shader 示例（HLSL）
--------------------------------

```hlsl
cbuffer MaterialConstants : register(b1);
cbuffer GlobalConstants   : register(b0);

[shader("closesthit")]
void MyClosestHitShader(inout RayPayload payload, BuiltInTriangleIntersectionAttributes attr)
{
    float3 normal = normalize(attr.normal);
    float NdotL = max(dot(normal, -lightDirection), 0.0);
    payload.color = baseColor * NdotL;
}
```

* * *

✅ 总结：关键调用链
----------

| 环节 | 资源绑定操作 | 数据来源 |
| --- | --- | --- |
| SetComputeRootSignature | 设置全局根签名 | 光源、相机数据（常量） |
| CreateShaderRecord | 构造本地数据 | 材质属性（颜色、粗糙度） |
| DispatchRays | 执行光线追踪 | 使用全局+本地绑定 |

* * *

如果你需要我帮你整理这个示例为**可运行的最小项目模板（如 DirectX Sample 或 DXC + D3D12）**，我可以继续提供完整项目结构。是否继续？

* * *

**You:**

rayGenShaderTable 这类表的构建 没有提到呢？shaderTableBuffer 只是模板吧？

* * *

**ChatGPT:**

非常对！你指出的很关键：

* * *

### ✅ `rayGenShaderTable`、`missShaderTable`、`hitGroupShaderTable` 这些才是真正的「Shader Table」资源

而我前面展示的 `shaderTableBuffer` 示例只是用于说明 `HitGroup` 的一条记录结构。

* * *

🧩 我们现在来补全：完整构建 Shader Table 的方式（包含 RayGen / Miss / HitGroup 三类）
----------------------------------------------------------------

### 🌟 一、Shader Table 是什么？

Shader Table 是 GPU 上的一块 **结构化内存区域**，被 `DispatchRays()` 使用：

| Shader Table 类型 | 内容 |
| --- | --- |
| RayGen Table | 通常只含一个记录（shader identifier + root 参数） |
| Miss Table | 可以含多个 Miss Shader 记录 |
| HitGroup Table | 含有每个物体的 HitGroup + 本地数据 |

* * *

🧱 二、Shader Table 中的记录格式
------------------------

每条记录的格式是：

```
[ 着色器标识符 (32字节) ][ 本地根签名参数（可选） ]
```

Stride 需要按 32 字节对齐（D3D12_RAYTRACING_SHADER_RECORD_BYTE_ALIGNMENT）

* * *

🛠️ 三、代码构建过程
------------

### 1️⃣ 获取 Shader Identifier

```cpp
void* rayGenShaderId = pso->GetShaderIdentifier(L"MyRayGen");
void* missShaderId   = pso->GetShaderIdentifier(L"MyMiss");
void* hitGroupId     = pso->GetShaderIdentifier(L"MyHitGroup");
```

* * *

### 2️⃣ 计算记录大小（shaderId + 本地根签名参数）

```cpp
UINT shaderIdSize = D3D12_SHADER_IDENTIFIER_SIZE_IN_BYTES; // 通常 32
UINT rayGenRecordSize = Align(shaderIdSize + 0, D3D12_RAYTRACING_SHADER_RECORD_BYTE_ALIGNMENT); // 无本地数据
UINT missRecordSize   = Align(shaderIdSize + 0, D3D12_RAYTRACING_SHADER_RECORD_BYTE_ALIGNMENT); // 无本地数据
UINT hitRecordSize    = Align(shaderIdSize + sizeof(MaterialData), D3D12_RAYTRACING_SHADER_RECORD_BYTE_ALIGNMENT);
```

* * *

### 3️⃣ 创建每个表的 Buffer 并填数据

#### 🔹 RayGen Shader Table

```cpp
ID3D12Resource* rayGenShaderTable;
CreateUploadBuffer(&rayGenShaderTable, rayGenRecordSize);
void* mapped;
rayGenShaderTable->Map(0, nullptr, &mapped);
memcpy(mapped, rayGenShaderId, shaderIdSize);
rayGenShaderTable->Unmap(0, nullptr);
```

#### 🔹 Miss Shader Table

```cpp
ID3D12Resource* missShaderTable;
CreateUploadBuffer(&missShaderTable, missRecordSize);
missShaderTable->Map(0, nullptr, &mapped);
memcpy(mapped, missShaderId, shaderIdSize);
missShaderTable->Unmap(0, nullptr);
```

#### 🔹 HitGroup Shader Table（包含本地材质）

```cpp
ID3D12Resource* hitGroupShaderTable;
CreateUploadBuffer(&hitGroupShaderTable, hitRecordSize);
hitGroupShaderTable->Map(0, nullptr, &mapped);

// 写入 shader identifier
memcpy(mapped, hitGroupId, shaderIdSize);

// 写入本地根签名参数（MaterialData）
float* dataPtr = reinterpret_cast<float*>((uint8_t*)mapped + shaderIdSize);
dataPtr[0] = 1.0f; // R
dataPtr[1] = 0.0f; // G
dataPtr[2] = 0.0f; // B
dataPtr[3] = 0.5f; // roughness

hitGroupShaderTable->Unmap(0, nullptr);
```

* * *

🚀 四、设置 DispatchRays 参数
-----------------------

```cpp
D3D12_DISPATCH_RAYS_DESC desc = {};

desc.RayGenerationShaderRecord.StartAddress = rayGenShaderTable->GetGPUVirtualAddress();
desc.RayGenerationShaderRecord.SizeInBytes  = rayGenRecordSize;

desc.MissShaderTable.StartAddress = missShaderTable->GetGPUVirtualAddress();
desc.MissShaderTable.SizeInBytes  = missRecordSize;
desc.MissShaderTable.StrideInBytes = missRecordSize;

desc.HitGroupTable.StartAddress = hitGroupShaderTable->GetGPUVirtualAddress();
desc.HitGroupTable.SizeInBytes = hitRecordSize;
desc.HitGroupTable.StrideInBytes = hitRecordSize;

desc.Width  = width;
desc.Height = height;
desc.Depth  = 1;

cmdList->DispatchRays(&desc);
```

* * *

🎨 总体结构图（Shader Table）
----------------------

```
DispatchRaysDesc
├── RayGenShaderRecord     → [shaderId]
├── MissShaderTable        → [shaderId] [shaderId]...
├── HitGroupTable          → [shaderId][材质数据]  [shaderId][材质数据] ...
```

* * *

✅ 小结
----

| 表类型 | 使用场景 | 是否含本地数据 | 记录数量 |
| --- | --- | --- | --- |
| RayGen | 入口函数 | 通常无 | 1 |
| Miss | 光线没命中 | 无 | 可多个 |
| HitGroup | 命中物体时调用 | 有 | 每个实例一个 |

* * *

下一步我可以帮你：

* 整理成一个 **最小运行项目结构**
    
* 使用 DXC 编译着色器并绑定到 PSO
    
* 整理完整 C++ + HLSL 文件结构
    

是否继续？还是你想尝试“多个物体 + 不同材质 + 共享光源”场景？

* * *

**You:**

如何理解：Miss Table 可以含多个 Miss Shader 记录

* * *

**ChatGPT:**

这是一个非常重要但初看容易困惑的点。我们来通俗解释 **为什么 Miss Table 可以包含多个 Miss Shader 记录**，以及 **它们是如何被使用的**。

* * *

🧭 先理解：什么是 Miss Shader？
-----------------------

在光线追踪中：

* 每条光线如果 **没有命中任何几何体**，就会触发一个 **Miss Shader**。
    
* Miss Shader 的典型用途是：设置背景颜色、环境光照、采样天空盒等。
    

* * *

❓那为什么要多个 Miss Shader？
---------------------

因为你可能会发出**多种不同类型的光线**，每种光线希望**用不同的“未命中行为”**来处理。

* * *

### ✅ 示例场景：

你发出以下几类光线：

| 光线用途 | 对应 Miss Shader |
| --- | --- |
| 主视线光线（primary ray） | 显示背景天空图 |
| 阴影检测光线（shadow ray） | 返回 0，表示“在阴影里” |
| 间接采样光线（GI ray） | 返回环境光值 |

这三类光线**在未命中物体时想要不同行为**，就需要使用不同的 Miss Shader。

* * *

✳️ 技术实现：使用 Shader Table 的索引机制
-----------------------------

* 在 `DispatchRays()` 中，你提供了 Miss Shader Table。
    
* 在 `TraceRay()` 函数中有一个参数 `missShaderIndex`，你可以**指定当前光线要使用哪个 Miss Shader Record**。
    

* * *

### ✅ 示例 HLSL

```hlsl
// 发射主光线
TraceRay(
    topLevelAS,
    RAY_FLAG_NONE,
    0xFF,
    0,  // missShaderIndex = 0（主视线）
    1,  // hitGroupIndex
    0,  // ray contribution
    ray,
    payload
);

// 发射阴影检测光线
TraceRay(
    topLevelAS,
    RAY_FLAG_ACCEPT_FIRST_HIT_AND_END_SEARCH,
    0xFF,
    1,  // missShaderIndex = 1（阴影）
    1,
    0,
    shadowRay,
    shadowPayload
);
```

* * *

🧱 Miss Shader Table 的结构（内存布局）
------------------------------

假设你提供两个 Miss Shader：

```cpp
// Miss 0: Skybox
memcpy(buffer + 0 * recordSize, shaderIdSkybox, shaderIdSize);

// Miss 1: Shadow
memcpy(buffer + 1 * recordSize, shaderIdShadow, shaderIdSize);
```

这样你就可以通过 `missShaderIndex = 0` or `1` 控制到底调用哪个 Miss Shader。

* * *

🔍 小结
-----

| 问题 | 答案 |
| --- | --- |
| **Miss Table 为什么可以有多个记录？** | 因为你可能会发射多种光线，每种光线在“未命中”时行为不同。 |
| **如何选择 Miss Shader？** | 在 `TraceRay()` 里设置 `missShaderIndex` 参数。 |
| **Miss Table 是怎么组织的？** | 一个数组，每个 entry 是一个 shader identifier（+ 本地数据，如果有的话）。 |

* * *

如果你希望我演示如何用两个 Miss Shader（如天空 vs 阴影）构建 Miss Table 并在 HLSL 中使用它们，也可以继续提供完整示例。是否需要？