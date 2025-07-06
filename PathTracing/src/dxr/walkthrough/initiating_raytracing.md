

# ▶️ 启动光线追踪（Initiating Raytracing）

## 1. **设置光线追踪管线状态对象（Pipeline State Object）**
    
    首先，需要通过 `SetPipelineState1()`  
    在命令列表（Command List）上设置包含光线追踪着色器的**光线追踪管线状态对象**。
    
## 2. **触发执行：DispatchRays()**
    
    类比：
    
    * 栅格化（Rasterization）通过 `Draw()` 调用；
        
    * 计算（Compute）通过 `Dispatch()` 调用；
        
    
    光线追踪通过 `**DispatchRays()**` 触发执行。
    
    `DispatchRays()` 可被用于以下命令列表中：
    
    * 图形命令列表（Graphics Command List）
        
    * 计算命令列表（Compute Command List）
        
    * 批处理包（Bundle）
        

* * *

## 🆕 Tier 1.1 的新增功能

> 支持更加灵活和高级的光线追踪调用方式：

* ✅ **GPU 端发起 DispatchRays() 调用**
    
    使用 `ExecuteIndirect()`，GPU 可以动态决定何时以及如何调用 `DispatchRays()`，无需 CPU 介入。
    
* ✅ **内联光线追踪（Inline Raytracing）**
    
    在任何着色器阶段（包括 Compute 和 Graphics 着色器）中**直接调用光线追踪逻辑**。  
    此模式**不依赖其他光线追踪着色器（如 miss/hit 等）**，处理过程与调用着色器逻辑**内联执行**。
    
    > 📌 详见后文的 _Inline raytracing_ 章节。
    

* * *