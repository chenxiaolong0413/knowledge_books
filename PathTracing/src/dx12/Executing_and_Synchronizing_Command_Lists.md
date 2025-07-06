
* * *

执行与同步命令列表
=========

_发布日期：2021年12月30日_

在 Microsoft Direct3D 12 中，已不再存在以往版本中的立即模式（Immediate Mode）。相反，应用程序需要创建命令列表（Command List）和 Bundle，然后录制一组 GPU 指令。命令队列（Command Queue）用于提交命令列表以供执行。这种模型让开发者可以更高效地控制 GPU 和 CPU 的使用。

* * *

目录
--

* [命令队列概述](#%E5%91%BD%E4%BB%A4%E9%98%9F%E5%88%97%E6%A6%82%E8%BF%B0)
    
* [初始化命令队列](#%E5%88%9D%E5%A7%8B%E5%8C%96%E5%91%BD%E4%BB%A4%E9%98%9F%E5%88%97)
    
* [执行命令列表](#%E6%89%A7%E8%A1%8C%E5%91%BD%E4%BB%A4%E5%88%97%E8%A1%A8)
    
* [多命令队列访问资源](#%E5%A4%9A%E5%91%BD%E4%BB%A4%E9%98%9F%E5%88%97%E8%AE%BF%E9%97%AE%E8%B5%84%E6%BA%90)
    
* [使用命令队列围栏同步命令列表执行](#%E4%BD%BF%E7%94%A8%E5%91%BD%E4%BB%A4%E9%98%9F%E5%88%97%E5%9B%B4%E6%A0%8F%E5%90%8C%E6%AD%A5%E5%91%BD%E4%BB%A4%E5%88%97%E8%A1%A8%E6%89%A7%E8%A1%8C)
    
* [同步命令队列访问的资源](#%E5%90%8C%E6%AD%A5%E5%91%BD%E4%BB%A4%E9%98%9F%E5%88%97%E8%AE%BF%E9%97%AE%E7%9A%84%E8%B5%84%E6%BA%90)
    
* [命令队列对 Tiled Resources 的支持](#%E5%91%BD%E4%BB%A4%E9%98%9F%E5%88%97%E5%AF%B9-tiled-resources-%E7%9A%84%E6%94%AF%E6%8C%81)
    

* * *

命令队列概述
------

Direct3D 12 中的命令队列取代了以往运行时与驱动程序在“立即模式”下隐式进行的同步方式。命令队列通过 API 明确地让开发者管理并发性、并行性与同步，带来了以下优势：

* 避免因隐式同步带来的性能损耗；
    
* 允许在更高层级实现同步，从而提升效率与准确性；
    
* 显式地暴露高开销操作，有助于优化。
    

这些改进使以下场景成为可能或表现更好：

* **提升并行性**：应用可使用更深的队列来处理后台任务（如视频解码），同时保持前台任务的独立性；
    
* **异步与低优先级 GPU 工作**：低优先级的 GPU 操作可以与主线程并行执行，同时借助原子操作在不阻塞的情况下使用其他线程结果；
    
* **高优先级计算工作**：支持在 3D 渲染过程中中断，执行少量高优先级的计算任务，以便尽早返回结果供 CPU 继续处理。
    

* * *

初始化命令队列
-------

使用 `ID3D12Device::CreateCommandQueue` 方法可以创建命令队列。该方法接收一个 `D3D12_COMMAND_LIST_TYPE` 参数，用于指定队列类型，也就决定了可提交的命令类型。

常见队列类型如下：

* `D3D12_COMMAND_LIST_TYPE_DIRECT`
    
* `D3D12_COMMAND_LIST_TYPE_COMPUTE`
    
* `D3D12_COMMAND_LIST_TYPE_COPY`
    

一般来说：

* **DIRECT 队列**可接受所有类型的命令；
    
* **COMPUTE 队列**仅接受计算和拷贝相关命令；
    
* **COPY 队列**仅接受拷贝命令。
    

⚠️ 注意：**Bundle 只能被 Direct 类型的命令列表调用，不能直接提交到命令队列。**

* * *

执行命令列表
------

在录制完命令列表并获取默认命令队列或创建自定义队列后，可调用 `ID3D12CommandQueue::ExecuteCommandLists` 执行命令列表。

* 应用可在多个线程中提交命令列表，运行时会按提交顺序串行化处理；
    
* 系统会校验提交的命令列表，如违反以下限制，调用将被忽略：
    
    1. 命令列表是 Bundle 类型，而非 Direct；
        
    2. 未调用 `ID3D12GraphicsCommandList::Close` 结束录制；
        
    3. 录制后，对命令分配器调用了 `ID3D12CommandAllocator::Reset`；
        
    4. 命令队列围栏指示该命令列表的上次执行尚未完成；
        
    5. 查询状态（BeginQuery / EndQuery）前后不匹配；
        
    6. 资源状态转换（Resource Barriers）前后不匹配。
        

详见：[使用资源屏障同步资源状态](#%E5%90%8C%E6%AD%A5%E5%91%BD%E4%BB%A4%E9%98%9F%E5%88%97%E8%AE%BF%E9%97%AE%E7%9A%84%E8%B5%84%E6%BA%90)

* * *

多命令队列访问资源
---------

运行时对资源访问做出以下限制：

* **资源不能被多个命令队列同时写入**。当资源在某队列上处于可写状态时，该资源被认为是该队列独占，必须先转换为只读或 `COMMON` 状态后，才能被其他队列访问。
    
* **资源在只读状态下可以被多个队列同时访问**，甚至可跨进程共享。
    

参考：[使用资源屏障同步资源状态](#%E5%90%8C%E6%AD%A5%E5%91%BD%E4%BB%A4%E9%98%9F%E5%88%97%E8%AE%BF%E9%97%AE%E7%9A%84%E8%B5%84%E6%BA%90)

* * *

使用命令队列围栏同步命令列表执行
----------------

Direct3D 12 支持多个并行命令队列，这就要求开发者显式同步它们之间的依赖。例如：

* 等待计算队列的输出，才能在图形队列中进行渲染；
    
* 等待图形队列完成渲染，计算队列才能对资源进行写入。
    

为此，Direct3D 12 提供了 **围栏（Fence）机制**，通过 `ID3D12Fence` 接口表示。

* 围栏是一个表示当前处理工作单元的整数；
    
* 应用调用 `ID3D12CommandQueue::Signal` 来更新围栏值；
    
* 可查询围栏的当前值以判断任务是否完成，从而决定是否启动下一步操作。
    

* * *

同步命令队列访问的资源
-----------

Direct3D 12 使用 **资源屏障（Resource Barrier）** 来声明资源状态的同步转换。例如：

* 将资源从 **着色器资源视图**（SRV）转换为 **渲染目标视图**（RTV）；
    
* 在命令列表中管理这些资源状态转换；
    
* 开启调试层时，系统会验证资源状态转换是否合法。
    

更多信息请参考：[使用资源屏障同步资源状态](https://learn.microsoft.com/en-us/windows/win32/direct3d12/use-resource-barriers-to-synchronize-resource-states)

* * *

命令队列对 Tiled Resources 的支持
-------------------------

Direct3D 11 中的 `ID3D11DeviceContext2` 提供了对 **Tiled Resources**（瓦片资源）的支持；在 D3D12 中，这些方法由 `ID3D12CommandQueue` 提供：

| 方法 | 描述 |
| --- | --- |
| `CopyTileMappings` | 将瓦片资源的映射从源复制到目标资源 |
| `UpdateTileMappings` | 更新瓦片资源与内存堆中位置的映射 |

详情请参考：[Direct3D 11 Tiled Resources](https://learn.microsoft.com/en-us/windows/win32/direct3d11/overviews-direct3d-11-resources-tiled-resources-intro)

* * *