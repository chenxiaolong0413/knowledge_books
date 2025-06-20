
硬件特性等级（Hardware Feature Levels）
===============================

> 🗓️ 更新时间：2021年12月30日  
> 描述了 **11_0 到 12_1** 硬件特性等级的功能。

* * *

📌 简介
-----

为了适应新旧设备上显卡的多样性，**Direct3D 11** 引入了“**特性等级（Feature Level）”** 的概念。每个显卡根据其 GPU 实现了特定程度的 DirectX 功能。一个特性等级是对 GPU 功能的明确划分。例如，**11_0** 特性等级对应的功能就是 D3D11 中实现的功能。

当你创建一个设备时，可以尝试请求你期望的特性等级。如果设备创建成功，说明该等级受支持；否则就代表硬件不支持该等级。你可以选择：

* 降级尝试创建较低特性等级的设备；
    
* 或者直接退出应用程序。
    

* * *

🎯 特性等级的基本特性
------------

* 所有 Direct3D 12 驱动都支持 **11_0 或更高** 的特性等级。
    
* 如果 GPU 能创建设备，就说明它满足或超过该等级的功能。
    
* 高等级始终**包含**所有较低等级的功能。
    
* 特性等级只代表**功能性**，**不代表性能**。性能取决于具体硬件实现。
    
* 特性等级是在调用 `D3D12CreateDevice` 时选择的。
    
* 若需了解特性支持情况（如某些功能为“**可选 Optional**”），请调用 `CheckFeatureSupport`。
    
* 关于 WARP 和 Reference 类型设备的限制，请查阅相关文档。
    
* 特性等级最初介绍可参见 Direct3D 11 文档。
    

* * *

🔢 编号体系
-------

硬件特性等级 ≠ API 版本。例如：

* 有 **D3D11.3 API**，但没有 **11_3 特性等级**
    
* 特性等级由 `D3D_FEATURE_LEVEL` 枚举定义。
    

| 编号体系类型 | 示例 |
| --- | --- |
| Direct3D 版本 | `Direct3D 12.0` |
| Shader Model | `shader model 5.1` |
| Feature Level（特性等级） | `feature level 12_0` |

* * *

🧩 特性等级支持矩阵
-----------

| 功能 \ 特性等级 | **12_1⁰** | **12_0⁰** | **11_1¹** | **11_0** |
| --- | --- | --- | --- | --- |
| Shader Model | 6.0 | 6.0 | 6.0 / 5.1² | 6.0 / 5.1² |
| Resource Binding Tier | Tier2³ | Tier2³ | Tier1³ | Tier1³ |
| Tiled Resources | Tier2³ | Tier2³ | 可选 | 可选 |
| Conservative Rasterization | Tier1³ | 可选 | 可选 | 不支持 |
| Rasterizer Ordered Views | 支持 | 可选 | 可选 | 不支持 |
| Min/Max Filters | 支持 | 支持 | 可选 | 不支持 |
| Map Default Buffer | 可选 | 可选 | 可选 | 可选 |
| Shader 指定模板参考值 | 可选 | 可选 | 可选 | 不支持 |
| 有类型 UAV 加载 | 18种格式（更多为可选） | 同左 | 3种格式（更多为可选） | 同左 |
| Geometry Shader | 支持 | 支持 | 支持 | 支持 |
| Stream Out | 支持 | 支持 | 支持 | 支持 |
| Compute Shader | 支持 | 支持 | 支持 | 支持 |
| Hull / Domain Shader | 支持 | 支持 | 支持 | 支持 |
| Texture Resource Arrays | 支持 | 支持 | 支持 | 支持 |
| Cubemap Resource Arrays | 支持 | 支持 | 支持 | 支持 |
| BC1-BC7 压缩格式 | 支持 | 支持 | 支持 | 支持 |
| Alpha-to-coverage | 支持 | 支持 | 支持 | 支持 |
| 逻辑操作（混合阶段） | 支持 | 支持 | 支持 | 可选 |
| 独立于目标的光栅化（TIR） | 支持 | 支持 | 支持 | 不支持 |
| MRT 强制采样数=1 | 支持 | 支持 | 支持 | 可选 |
| UAV 渲染最大强制采样数 | 16 | 16 | 16 | 8 |
| 最大纹理尺寸 | 16384 | 16384 | 16384 | 16384 |
| 最大立方体纹理尺寸 | 同上 | 同上 | 同上 | 同上 |
| 最大体积纹理边长 | 2048 | 2048 | 2048 | 2048 |
| 最大纹理重复 | 16384 | 16384 | 16384 | 16384 |
| 最大各向异性等级 | 16 | 16 | 16 | 16 |
| 最大图元数量 | 2³² – 1 | 同左 | 同左 | 同左 |
| 最大顶点索引 | 2³² – 1 | 同左 | 同左 | 同左 |
| 最大输入槽数量 | 32 | 32 | 32 | 32 |
| 同时渲染目标数量（RT） | 8 | 8 | 8 | 8 |
| 遮挡查询（Occlusion Queries） | 支持 | 支持 | 支持 | 支持 |
| 独立 Alpha 混合 | 支持 | 支持 | 支持 | 支持 |
| Mirror Once | 支持 | 支持 | 支持 | 支持 |
| 重叠顶点元素 | 支持 | 支持 | 支持 | 支持 |
| 独立写入掩码 | 支持 | 支持 | 支持 | 支持 |
| 实例化绘制（Instancing） | 支持 | 支持 | 支持 | 支持 |

* * *

🔍 说明与注解
--------

* **⁰**：需要 **Direct3D 11.3 或 Direct3D 12** 运行时
    
* **¹**：需要 **Direct3D 11.1** 运行时
    
* **²**：Shader Model 5.0 可选支持：
    
    * 双精度（double）
        
    * 扩展双精度（extended double）
        
    * SAD4 指令
        
    * 半精度（partial precision）  
        可通过 `ID3D12Device::CheckFeatureSupport` 查询可用选项。
        
    * Shader Model 5.1 仅在 **支持 DirectX 12 API 的硬件** 上可用。
        
    * DirectX 11 只能支持到 Shader Model 5.0。
        
* **³**：更高的 Tier 是可选项。
    

* * *

📁 DXGI 格式支持表
-------------

可参考以下文档获取各特性等级对应的 DXGI 格式支持信息：

* [DXGI Format Support for Feature Level 12.1 Hardware](#)
    
* [DXGI Format Support for Feature Level 12.0 Hardware](#)
    
* [DXGI Format Support for Feature Level 11.1 Hardware](#)
    
* [DXGI Format Support for Feature Level 11.0 Hardware](#)
    
* [Hardware Support for Direct3D 10Level9 Formats](#)
    
* [Hardware Support for Direct3D 10.1 Formats](#)
    
* [Hardware Support for Direct3D 10 Formats](#)
    

