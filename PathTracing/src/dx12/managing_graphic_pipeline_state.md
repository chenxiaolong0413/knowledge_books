
* * *

管理 Direct3D 12 中的图形管线状态
=======================

_发布日期：2021 年 12 月 30 日_

本文介绍如何在 Direct3D 12 中设置图形管线状态。

* * *

管线状态概述
------

当几何图形被提交到 GPU 进行绘制时，有大量的硬件设置决定了输入数据如何被解释和渲染。这些设置统称为**图形管线状态**（Graphics Pipeline State），包括常见的光栅化器状态（Rasterizer State）、混合状态（Blend State）、深度模板状态（Depth Stencil State），几何图元的拓扑类型，以及用于渲染的各类着色器。

在 Direct3D 12 中，大多数图形管线状态是通过**管线状态对象（Pipeline State Object，PSO）**设置的。应用程序可以在初始化阶段创建任意数量的 PSO，这些对象由 `ID3D12PipelineState` 接口表示。在渲染阶段，命令列表可以通过调用 `ID3D12GraphicsCommandList::SetPipelineState` 快速切换管线状态。

相比之下，Direct3D 11 中将图形管线状态打包为较粗粒度的状态对象，如 `ID3D11BlendState`，并通过 `ID3D11DeviceContext::OMSetBlendState` 等方法在即时上下文中设置。

Direct3D 12 的 PSO 设计允许 GPU 在初始化时预处理所有依赖的状态，从而在渲染时高效地进行状态切换。例如，混合状态可能依赖于光栅状态和混合设置，因此集中预处理可显著提升性能。

> **注意：**虽然大多数状态通过 PSO 设置，但仍有一部分状态是通过 `ID3D12GraphicsCommandList` 的方法单独设置的。本文将在后续部分详细说明。另外，直接命令列表（Direct Command Lists）与 Bundle 对图形管线状态的继承和持久化行为也存在差异，下面将一并介绍。

* * *

通过 PSO 设置的图形管线状态
----------------

查看 [`D3D12_GRAPHICS_PIPELINE_STATE_DESC`](https://learn.microsoft.com/en-us/windows/win32/api/d3d12/ns-d3d12-d3d12_graphics_pipeline_state_desc) 结构体的文档，可以了解可在创建 PSO 时设置的所有图形管线状态。以下是可设置内容的简要总结：

* 各类着色器的字节码：包括顶点、像素、域、外壳和几何着色器；
    
* 顶点输入格式；
    
* 图元拓扑类型：
    
    * 在 PSO 中通过 `D3D12_PRIMITIVE_TOPOLOGY_TYPE` 设置基本类型（如点、线、三角形、曲面等）；
        
    * 具体排列方式（如线段列表、带状排列、带邻接数据）通过 `IASetPrimitiveTopology` 在命令列表中设置；
        
* 混合状态、光栅化器状态、深度模板状态；
    
* 深度模板格式、渲染目标格式与数量；
    
* 多重采样参数；
    
* 流输出缓冲区；
    
* 根签名（Root Signature）——详见[根签名](https://learn.microsoft.com/en-us/windows/win32/direct3d12/root-signatures)。
    

* * *

通过命令列表单独设置的图形管线状态
-----------------

除 PSO 外，还有一些管线状态是通过 `ID3D12GraphicsCommandList` 的方法设置的，如下表所示：

| 状态 | 设置方法 |
| --- | --- |
| 资源绑定 | `IASetIndexBuffer`、`IASetVertexBuffers`、`SOSetTargets`、`OMSetRenderTargets`、`SetDescriptorHeaps`、所有 `SetGraphicsRoot*` 和 `SetComputeRoot*` 方法 |
| 视口 | `RSSetViewports` |
| 裁剪矩形 | `RSSetScissorRects` |
| 混合因子 | `OMSetBlendFactor` |
| 深度模板参考值 | `OMSetStencilRef` |
| 图元拓扑排列与邻接信息 | `IASetPrimitiveTopology` |

* * *

图形管线状态的继承规则
-----------

由于**直接命令列表（Direct Command Lists）**通常只使用一次，而**Bundles**会被多次并发使用，两者对图形管线状态的继承行为不同。

### PSO 设置的状态继承规则：

* **不继承**。直接命令列表和 Bundle 都**不会**继承之前命令列表中通过 PSO 设置的图形管线状态；
    
* 初始状态是在通过 `ID3D12Device::CreateCommandList` 创建命令列表时，通过传入 `ID3D12PipelineState` 参数设置的；
    
* 若未提供 PSO，则使用默认初始状态；
    
* 可以在命令列表中通过 `SetPipelineState` 更换当前 PSO。
    

### 非 PSO 设置的状态继承规则：

* **直接命令列表**不继承这些状态。具体初始值见 `ID3D12GraphicsCommandList::ClearState`；
    
* **Bundles** 会继承所有非 PSO 的图形管线状态，但**不包括图元拓扑类型**；
    
    * 执行 Bundle 时，其图元拓扑类型默认为 `D3D12_PRIMITIVE_TOPOLOGY_TYPE_UNDEFINED`；
        
    * Bundle 内设置的状态会影响其父命令列表。例如，在 Bundle 内调用了 `RSSetViewports`，则该视口设置会持续影响后续父命令列表中的调用。
        

* * *

资源绑定的持久性
--------

* 无论是在命令列表还是 Bundle 中设置的资源绑定（Resource Bindings）都会**持续存在**；
    
* 也就是说：
    
    * 在直接命令列表中修改的绑定，在之后执行的 Bundle 中仍然有效；
        
    * 在 Bundle 中修改的绑定，也会影响之后的父命令列表中的调用。
        

有关资源绑定的更多信息，参见[使用根签名 - Bundle 语义](https://learn.microsoft.com/en-us/windows/win32/direct3d12/using-a-root-signature#bundle-semantics)。

* * *