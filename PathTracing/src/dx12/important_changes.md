
* * *

从 Direct3D 11 到 Direct3D 12 的重要变更
=================================

_发布日期：2021 年 12 月 30 日_

Direct3D 12 相较于 Direct3D 11 在编程模型上发生了重大变化。  
它让应用程序可以比以往更贴近硬件运行，从而获得更高的性能和效率。  
但这一提升的代价是：**你需要自己处理更多底层任务**。

* * *

Direct3D 12 的主要变更包括：
--------------------

* 显式同步（Explicit Synchronization）
    
* 物理内存驻留管理（Physical Memory Residency Management）
    
* 管线状态对象（Pipeline State Objects）
    
* 命令列表与命令包（Command Lists and Bundles）
    
* 描述符堆与表（Descriptor Heaps and Tables）
    
* 从 Direct3D 11 的迁移建议
    

* * *

一、显式同步（Explicit Synchronization）
--------------------------------

在 D3D11 中，CPU 与 GPU 的同步是由运行时自动管理的；  
而在 D3D12 中，同步 **完全交由应用程序手动控制**，包括：

* 管线冲突不再自动检测，需开发者手动避免；
    
* Map/Lock-DISCARD 模式（自动提供新内存区域）不再支持；
    
* 所有动态更新（常量缓冲区、顶点缓冲、动态纹理等）需应用程序管理生命周期和同步；
    
* 所有资源的生命周期需手动管理，不再使用引用计数自动回收。
    

🛠️ 示例：你需要确保一个资源在 GPU 使用完之前不要释放或覆盖它，使用 Fence 来做同步。

* * *

二、物理内存驻留管理（Memory Residency Management）
---------------------------------------

* D3D12 不再自动协调多线程、多适配器、多命令队列的并发访问；
    
* 无资源重命名、多缓冲等便利机制；
    
* 应用需使用 **Fence** 明确确保资源在被访问期间处于内存驻留状态；
    
* **资源屏障（Resource Barriers）** 也必须手动插入，以同步资源状态切换。
    

🔗 参阅：[Memory Management in Direct3D 12](https://learn.microsoft.com/en-us/windows/win32/direct3d12/memory-management)

* * *

三、管线状态对象（Pipeline State Objects，PSO）
------------------------------------

在 D3D11 中，图形管线状态被拆成多个独立对象（如光栅状态、着色器状态等），方便但效率低：

* GPU 无法在绘制前合并这些状态；
    
* 驱动需在 draw call 时动态整理状态，开销大；
    
* 限制最大绘制调用数量。
    

在 D3D12 中，所有状态被封装成 **不可变的 PSO 对象**，创建时就确定：

* 驱动可预编译为底层 GPU 指令；
    
* 切换 PSO 时只需快速复制状态，效率极高；
    
* 极大地减少每帧 draw call 的开销。
    

🔗 参阅：[Managing graphics pipeline state in D3D12](https://learn.microsoft.com/en-us/windows/win32/direct3d12/managing-graphics-pipeline-state)

* * *

四、命令列表与命令包（Command Lists & Bundles）
-----------------------------------

在 D3D11 中，工作通过 immediate context 提交，支持 deferred context 但效率不佳。

D3D12 引入了 **Command List**：

* 每个命令列表包含完整的 GPU 工作信息（PSO、资源、绘制指令等）；
    
* 不继承全局状态，可在多线程中自由构建；
    
* 最终提交时才串行处理，其他全部可并行；
    

还引入了 **Bundle**（命令包）：

* 可复用的“子命令列表”，支持状态继承；
    
* 非常适合多个实例之间只有资源不同的绘制场景；
    
* 节省命令录制与驱动转换开销。
    

🔗 参阅：[Work Submission in Direct3D 12](https://learn.microsoft.com/en-us/windows/win32/direct3d12/recording-command-lists)

* * *

五、描述符堆与表（Descriptor Heaps and Tables）
-------------------------------------

在 D3D11 中，资源绑定通过 View 对象绑定到特定槽位：

* 每次资源变化都要重新绑定；
    
* 限制现代硬件的并行访问与效率。
    

D3D12 引入新的绑定模型：

* 应用通过 **描述符堆**（Descriptor Heap）统一管理资源视图；
    
* 绘制调用时只需传入对应的 **描述符表**（即堆的一部分）；
    
* GPU 可直接使用预写入内存中的原生描述符；
    
* 切换资源几乎无开销。
    

并且，D3D12 支持 **着色器中的资源动态索引**：

* 实现高度灵活的渲染方法；
    
* 举例：延迟渲染引擎可支持上千种材质而无明显性能瓶颈。
    

🔗 参阅：

* [Resource Binding in D3D12](https://learn.microsoft.com/en-us/windows/win32/direct3d12/resource-binding)
    
* [Differences from D3D11](https://learn.microsoft.com/en-us/windows/win32/direct3d12/d3d12-graphics-differences)
    

* * *

总结
--

| 特性 | D3D11 | D3D12 |
| --- | --- | --- |
| 同步 | 自动完成 | 开发者手动控制 |
| 管线状态 | 多个可变对象 | 单一不可变 PSO |
| 资源绑定 | View 显式绑定 | 描述符堆 + 表 |
| 命令提交 | Immediate / Deferred Context | 多线程构建命令列表 + Bundle |
| 内存管理 | 自动引用计数 | 手动管理生命周期 |
| 性能与控制权 | 较高开销、较低控制 | 低开销、完全控制 |

Direct3D 12 提供了对硬件更贴近的编程方式，适合追求极致性能的高级图形开发者。它需要更多的底层知识与资源管理技巧，但能换来更高的效率和灵活性。

* * *