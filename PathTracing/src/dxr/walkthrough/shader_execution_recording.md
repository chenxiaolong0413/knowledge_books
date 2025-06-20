
Shader Execution Reordering（着色器执行重排序）
-------------------------------------

### 动机：

许多光线追踪工作负载由于其随机性（stochastic nature）而导致着色器执行和数据访问的发散。尝试通过高层的应用程序逻辑来改善一致性，存在诸多缺点——既难以达到硬件辅助实现所能达到的性能，也会显著增加开发者的工作量。DXR API 已经允许实现层动态调度由 `TraceRay` 和 `CallShader` 触发的着色工作，但它并未提供任何机制让应用程序控制该调度过程。

此外，目前 `TraceRay` 将遍历、相交测试、AnyHit 着色器、ClosestHit 或 Miss 着色器的执行捆绑在一起，这种“融合”性质也对编程模型施加了各种限制。这种设计可能增加开发者的负担，也可能降低性能。例如：一些常用代码，如顶点提取和插值，必须在所有 ClosestHit 着色器中重复编写。这会导致更多代码生成，而这在发散的执行环境中尤其不利。此外，`TraceRay` 的设计要求即使仅需获取命中的基本信息（例如命中距离），也必须执行 Hit 着色器，从而使简单的可见性射线产生不必要的开销。

`Shader Execution Reordering（SER）` 引入了一个新的 HLSL 内建指令 —— `MaybeReorderThread`，允许应用程序在 GPU 上以可控方式重新排序工作，从而提高执行和数据访问的一致性。同时，还引入了 `HitObject`，用于将遍历、AnyHit 着色器、相交测试与 ClosestHit/Miss 着色器分离开来。

`HitObject` 与 `MaybeReorderThread` 可结合使用，用于在更可控的上下文中执行 ClosestHit 和 Miss 着色器，以提升一致性。应用程序可以根据命中属性、射线生成状态、射线负载，或它们的任意组合来控制一致性。通过考虑 Hit/Miss 着色器及其后的控制流和数据访问模式，应用程序可以最大化性能。

`HitObject` 进一步提升了光线追踪管线的灵活性。首先，一些通用代码（如顶点提取与插值）不再需要在所有 ClosestHit 着色器中重复，它们可以直接写在 RayGeneration 着色器中，并在 ClosestHit 着色器之前执行。其次，简单的可见性射线不再需要为了获取命中的基本信息（如最近命中的距离）而调用 Hit 着色器。最后，`HitObject` 也可以从 `RayQuery` 构建，从而允许 `MaybeReorderThread` 与基于 Shader Table 的 ClosestHit 和 Miss 着色器联用。

这个特性对现有 DXR 实现来说，采用起来应当是相对直接的：`HitObject` 实际上只是将原先 `TraceRay` 的功能分解为两个独立阶段：遍历阶段和着色阶段。而对于 SER 的 `MaybeReorderThread`，最低要求的实现仅仅是一个空操作（no-op），而已有复杂调度机制的实现可复用现有结构来支持 SER。由于此特性对编程模型的扩展仅限于 HLSL 与 DXIL，因此 DXR 的运行时并不需要任何更改。

该特性是 Shader Model 6.9（预览中）中必须支持的部分，只要设备支持光线追踪。同时，该特性也是 `D3D12_RAYTRACING_TIER_1_2` 的必需部分。不过，即使某设备不支持 Tier_1_2，只要它支持 Shader Model 6.9，就必须支持 SER。

请注意，所有 SER 的新类型与内建函数都被添加到了 `dx` 命名空间中，符合 HLSL 扩展的快速通道流程（Fast-Track Process）。为可读性考虑，本文档只在 `HitObject` 及其成员的定义中明确使用命名空间，其他示例中默认已启用 `using namespace dx`。

* * *

### SER 功能的规范用法如下，将原有的 `TraceRay` 调用更改为下列等效序列：

```hlsl
HitObject Hit = HitObject::TraceRay(..., Payload);
MaybeReorderThread(Hit);
HitObject::Invoke(Hit, Payload);
```

此代码段中，射线被追踪，并将遍历、相交测试和 AnyHit 着色的结果存储在 `Hit` 中。调用 `MaybeReorderThread` 可以基于 `Hit` 中的信息提高执行一致性。随后，在一个更具一致性的上下文中调用 ClosestHit 或 Miss 着色器。

请注意这只是一个基础示例。你还可以查询 Hit 的附加信息，为 `MaybeReorderThread` 提供额外的提示。关于更复杂的用法，请参见 _Separation of MaybeReorderThread and HitObject::Invoke_。

另外，`TraceRay` 返回 `HitObject` 后可以不调用 `MaybeReorderThread` 或 `Invoke`。调用者可能只想获取 `HitObject`，并不关心线程重排或 ClosestHit/Miss 着色。这个能力在 SER 设备支持一节中会进一步探讨。其含义是：即便设备对 `MaybeReorderThread` 没有任何实际行为，只要支持 Shader Model 6.9，也必须允许不调用 `Invoke`。这种跳过最终着色的能力，在旧的 DXR 模型中是不存在的。

关于本功能的更多信息，请参见 `HitObject` 和 `MaybeReorderThread` 的完整文档。

* * *

### SER 设备支持

只要设备支持 Shader Model 6.9 且支持光线追踪，就必须支持本规范中的 Shader Execution Reordering HLSL 方法。这并不意味着所有设备都必须真正执行线程重排序 —— 实现中允许仅将 `MaybeReorderThread` 视为无操作（no-op）。应用程序只需编写一套支持 SER 的代码，能够利用重排的设备就会使用它，而其他设备则表现为未进行重排。

为帮助应用程序了解设备是否实际进行了重排序，D3D12 提供了一个设备能力标志，可通过 `CheckFeatureSupport()` 查询：

```cpp
// OPTIONSNN - NN 将在 SER 正式发布时确定
typedef struct D3D12_FEATURE_DATA_D3D12_OPTIONSNN
{
    ...
    _Out_ BOOL ShaderExecutionReorderingActuallyReorders;
    ...
} D3D12_FEATURE_DATA_D3D12_OPTIONSNN;
```

示例代码：

```cpp
D3D12_FEATURE_DATA_D3D12_OPTIONSNN Options; // NN 待定
VERIFY_SUCCEEDED(pDevice->CheckFeatureSupport(
    D3D12_FEATURE_D3D12_OPTIONSNN, &Options, sizeof(Options)));
if (!Options.ShaderExecutionReorderingActuallyReorders) {
    // 应用可能想要手动进行排序，
    // 或者开发者想确认当前设备上的行为。
}
```

即使在不进行线程重排的设备上，SER 中的 `HitObject` 依然有用。

例如，假设应用想要追踪一条射线（可能包含 AnyHit 着色器调用），但只关心最终的 T 值，而不想执行 ClosestHit 着色器（即便着色组中存在它）。

那么，应用程序可以调用 `TraceRay` 返回一个 `HitObject`，然后调用 `HitObject::GetRayTCurrent()` 获取 T 值即可完成。不调用 `HitObject::Invoke()` 意味着跳过 ClosestHit/Miss 着色器的执行，而这在任何支持 Shader Model 6.9 的设备上都有效。

如果后续的工作能从线程重排序中受益，应用仍可在 `TraceRay` 之后调用 `MaybeReorderThread()`。而不能执行重排序的设备则会简单地忽略该调用。

* * *

如需继续了解，请告诉我是否需要我翻译文档中后续的章节，例如 `HitObject` 的成员方法说明，或进一步的使用示例。

* * *

**ChatGPT:**

当然可以。下面我将结合代码示例来逐段解释“Shader Execution Reordering（SER）”的关键点及其用途，让你更直观地理解这一特性。

* * *

✅ 背景问题（为什么需要 SER）
-----------------

### 问题 1：重复代码，效率低

传统 TraceRay 流程绑定太死，很多逻辑必须写在 ClosestHit Shader 中，比如：

```hlsl
[shader("closesthit")]
void ClosestHitMain(inout HitPayload payload)
{
    float3 position = GetHitPosition(); // 顶点插值
    float3 normal = GetHitNormal();     // 法线插值
    // 计算光照等
}
```

但如果有多个 ClosestHit Shader，每个都要复制 `GetHitPosition()` 和 `GetHitNormal()` 的逻辑，不仅代码冗余，而且性能差。

* * *

✅ 解决方案 1：`HitObject` + `TraceRay`
---------------------------------

现在我们可以把光线追踪结果存进 `HitObject`，延后执行着色器：

```hlsl
HitObject hit = HitObject::TraceRay(Scene, flags, mask, ray, payload);
```

此时并**没有执行 ClosestHit/Miss Shader**，只是完成了“加速结构遍历 + 相交测试 + AnyHit”。

可以在 raygen 着色器中提前做通用处理，比如顶点插值：

```hlsl
if (HitObject::CommittedStatus(hit) == COMMITTED_TRIANGLE_HIT)
{
    float3 pos = HitObject::GetHitPosition(hit); // 提前取
    float3 nrm = HitObject::GetHitNormal(hit);
    payload.position = pos;
    payload.normal = nrm;
}
```

* * *

✅ 解决方案 2：`MaybeReorderThread`
-----------------------------

`MaybeReorderThread()` 允许 GPU 在执行 ClosestHit/Miss 前先对线程排序，优化内存访问一致性：

```hlsl
MaybeReorderThread(hit);
```

它的执行会影响之后这句的执行效率：

```hlsl
HitObject::Invoke(hit, payload);
```

执行 `Invoke` 后才真正进入 shader table 中的 ClosestHit 或 Miss 着色器。

* * *

✅ 场景：可见性测试不需要 ClosestHit
------------------------

以前即使只是想知道“有没有命中”，“命中距离是多少”，也要付出执行 ClosestHit Shader 的代价：

```hlsl
[shader("closesthit")]
void ClosestHit_Visibility(inout Payload payload)
{
    payload.visible = true;
}
```

现在你可以这样写：

```hlsl
HitObject hit = HitObject::TraceRay(..., payload);

if (HitObject::CommittedStatus(hit) == COMMITTED_TRIANGLE_HIT)
{
    payload.visible = true;
    payload.t = HitObject::GetRayTCurrent(hit); // 获取命中距离
}

// 根本不调用 HitObject::Invoke()
```

这不仅更高效，也更灵活！

* * *

✅ 完整示例
------

```hlsl
[shader("raygeneration")]
void RayGen()
{
    RayDesc ray;
    ray.Origin = ...;
    ray.Direction = ...;
    ray.TMin = 0.001;
    ray.TMax = 1000.0;

    MyPayload payload = {};

    // 步骤1：发射光线，得到 HitObject
    HitObject hit = HitObject::TraceRay(scene, RAY_FLAG_NONE, 0xFF, ray, payload);

    // 步骤2：提前取一些数据（不必在 ClosestHit 中处理）
    if (HitObject::CommittedStatus(hit) == COMMITTED_TRIANGLE_HIT)
    {
        float3 pos = HitObject::GetHitPosition(hit);
        float3 nrm = HitObject::GetHitNormal(hit);
        payload.position = pos;
        payload.normal = nrm;
    }

    // 步骤3：提示 GPU 按照 hit 数据做线程排序
    MaybeReorderThread(hit);

    // 步骤4：执行 ClosestHit 或 Miss Shader（如果需要）
    HitObject::Invoke(hit, payload);
}
```

* * *

✅ SER 是可选但统一支持的
---------------

设备如果不支持真正的重排序，那么 `MaybeReorderThread()` 只是个 no-op（空操作），但程序仍然可以统一编写，保证兼容性：

```cpp
if (!deviceSupportsReordering)
{
    // 可以手动排序 hit 数据列表
}
```

* * *

✅ 总结重点
------

| 传统 TraceRay 问题 | SER 提供的解法 |
| --- | --- |
| ClosestHit 中代码重复多 | HitObject 可在 raygen 中统一处理 |
| 获取 T 值必须调用 Hit Shader | HitObject 可直接读取 T 值 |
| 难以控制线程调度 | MaybeReorderThread 可优化一致性 |
| 执行路径死板 | Hit 和 Invoke 解耦，更灵活 |

* * *
