
* * *

🎮 Direct3D 12 中的工作提交机制
=======================

> 📅 发布时间：2021年12月30日

* * *

🧠 概述
-----

为提升 **Direct3D 应用的 CPU 使用效率**，自 Direct3D 12 起，不再支持与设备直接关联的 **立即上下文（Immediate Context）**。

* * *

📦 新机制：命令列表（Command Lists）
--------------------------

在 D3D12 中，应用程序需遵循如下流程：

1. **记录命令列表（Command Lists）**  
    将绘制指令和资源管理调用记录下来。
    
2. **提交命令列表**  
    可从多个线程同时将命令列表提交至一个或多个 **命令队列（Command Queues）**，这些队列负责管理命令的执行。
    

* * *

🚀 性能提升点
--------

这一机制的优势如下：

* **提高单线程效率**  
    允许应用程序**预先计算渲染工作**并进行重复利用。
    
* **更好利用多核系统**  
    渲染工作可以**分布到多个线程**，充分利用 CPU 多核能力。
    

* * *

📝 总结
-----

D3D12 的核心理念是：“**命令列表先录制，后执行，支持多线程并发提交**”，从根本上区别于 D3D11 的立即执行模式。这为游戏和图形应用提供了更高的灵活性和效率。
