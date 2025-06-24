# Github_TrueTrace

## 特性：

基于高性能计算着色器的路径追踪，无需RT核心

用于高性能软件光线追踪的压缩宽边界体层次结构（不使用RT核心）

不依赖特定GPU厂商（即便是集成显卡也可运行，无需RTX核心）

支持现代显卡的硬件光追

完整的Disney BSDF材质模型支持

对复杂自发光网格的完整支持

支持运行时对象的变换、添加与移除

支持运行时材质修改

实时降噪支持ASVGF算法

离线降噪支持OIDN

支持PBR贴图

支持多重重要性采样的下一事件估计（NEE）

支持球面高斯光源树或光源BVH进行NEE

支持所有Unity默认光源（基于NEE）

支持泛光、景深、自曝光、TAA、色调映射

预计算多次大气散射的天空模拟

对象实例化（无需RT核心）

ReSTIR GI（目前为实验性实现）

简单的放大功能

同时支持Built-in、HDRP和URP渲染管线

完整支持蒙皮网格

支持标准变形网格

支持Unity地形及地形树（基于高度图）

环境贴图重要性采样

光照缓存（Radiance Cache）

材质预设系统

高效的全景渲染

对聚光灯支持IES灯型文件

真正的无绑定纹理支持（感谢Meetem）

卷积泛光效果（非原创）

支持Vulkan和Metal（兼容性可能因设备而异）

使用SDF实现网格切割（仅用于渲染剖面，不修改网格本体）

支持Lambert或EON漫反射模型

支持色差、饱和度、彩色暗角

完整的多重散射雾（非实时）

正交相机支持


## 添加新对象
### 自动方法：

首先将你的GameObject作为TrueTrace创建的“Scene”对象的子对象添加。

全局设置：在TrueTrace设置菜单中点击“Auto Assign Scripts”。

局部设置：在设置菜单中进入“Hierarchy Options”，将你添加的根对象拖入“Selective Auto Assign Scripts”区域。

点击“Selective Auto Assign”。

### 手动方法：

- 首先将你的GameObject作为TrueTrace创建的“Scene”对象的子对象添加。
- 每个包含网格的对象都需添加RayTracingObject脚本。
- 对于非蒙皮网格：
  - 将ParentObject脚本添加到：
    - 每个含有RayTracingObject的对象
    - 或这些对象的直接父对象（可以将多个网格组合，提高性能）
  - 对于蒙皮网格：
    - 将父对象标记为ParentObject，会将所有蒙皮子对象组合在一起。
- 对于默认Unity光源：只需在每个光源上添加RayTracingLight脚本。


## 通用使用说明：
- 建议使用DX12，它支持OIDN、无绑定纹理、RT核心以及更高的性能。
- 你希望渲染的相机需挂载RenderHandler脚本（如标记为MainCamera则自动添加）。
- 红/绿矩形显示加速结构是否已构建完成。红色表示未完成，绿色表示完成，若构建超过15秒会有提示音（可在TrueTrace设置->功能设置中启用）。
- 可通过层级中启用/禁用带有ParentObject脚本的对象来添加/移除对象，但需等待加速结构重建。
- 自发光网格在初始构建时需设置非零发光值以启用NEE，但之后可动态修改。
- 使用默认BIRP材质进行PBR设置时，各贴图需放入对应槽位，但Roughness需放入Occlusion槽（可在MaterialPairing菜单中修改）。
- 若你使用BlendShape变形网格，可能需在其导入设置中关闭Legacy Blendshape Normals，并确保法线为“导入”，否则BlendShape法线可能错误。
- 若使用HDRI或CubeMap作为天空盒，请将其在Inspector中设置为Texture2D，Unity将自动转换，然后放入TrueTrace设置中“Scene Settings”的相应槽位。

## URP 设置指南：
- Unity 6000及以上版本需开启Project Settings -> Graphics -> 启用最底部的“Compatability Mode”
- 在使用的Universal Renderer Asset中启用“Native RenderPass”
- 二选一：
  - 相机中开启PostProcessing，并设置抗锯齿为TAA（这是目前唯一稳定生成Motion Vector的方法）
  - 或在TrueTrace设置 -> 功能设置中启用“Use Custom Motion Vectors”
- 最后，如未自动添加，请手动将URPTTInjectPass脚本挂载到空对象上
- 建议：将使用的URP Asset中的Render Scale设为1

## 创建非标准图像：
- 将TTAdvancedImageGen脚本附加到任一层级中的对象，并配置所需设置。

## 使用实例化功能：
- 使用HWRT时需Unity 6000.0.31f1或更高版本，否则仅支持SWRT
- 所有被实例化的源对象需放置于InstancedStorage下，并设置为动态对象（同一对象需挂载ParentObject和RayTracingObject）
- 实例化对象时，只需在Scene对象下添加挂有InstanceObject脚本的GameObject，并在脚本中选择所需实例对象

## 将Shader纹理连接到TrueTrace：

- 每个Shader只需配置一次，未配置的Shader在TrueTrace中会显示为白色
- 打开PathTracingSettings中的Material Pair Options标签
- 拖入任何使用该Shader的材质
- 点击三个按钮以指定输入类型和对应输出，再点击“Apply Material Links”并在“Main Options”中重建BVH以更新场景对象

## 功能设置内容（Functionality Settings Contents）
**注意：本表中大多数选项现在在悬停时会显示工具提示**

- 启用 RT Cores –（仅限 DX12，需要 Unity 2023 或更高版本）为支持硬件光追的显卡启用硬件 RT（Ray Tracing）功能。
- 禁用 Bindless 纹理 – 适用于 DX11（/Vulkan/Metal）的兼容模式。禁用 Bindless 纹理功能，改为使用纹理图集作为替代（限制纹理分辨率）。
- 使用旧 Light BVH 代替高斯树 – 禁用高斯光照树，以提升性能，但会降低金属表面的光照采样质量。
- 使用 DX11 模式 – 禁用仅支持 DX12 的功能开关，允许 TrueTrace 在 DX11（/Vulkan/Metal）下运行。
- 启用 OIDN 去噪器 –（仅限 DX12）在“主选项”中将 OIDN 去噪器加入可选列表。
- 完全禁用辐射缓存（Radiance Cache） – 释放通常被辐射缓存占用的内存资源。
- 移除光栅化渲染依赖 – TrueTrace 将停止使用光栅化渲染（除了 TAAU 超分辨率缩放），这样可以在关闭相机的光栅化渲染后进一步提升性能。
- 启用感知发光纹理的 Light BVH – Light BVH 采样时会考虑发光纹理/遮罩，实现更智能的发光网格采样；但可能消耗大量内存。
- 启用详细日志输出（Verbose Logging） – TrueTrace 将输出更多调试信息到控制台。
- 启用渐变透明贴图（Fade Mapping） – 与实时去噪器兼容性较差，但允许根据 alpha 贴图实现表面透明度变化。
- 彩色玻璃（Stained Glass） – 是否为穿过彩色玻璃的阴影射线添加颜色，由材质参数控制，如：是否为薄玻璃、Albedo、散射距离（Scatter Distance）。
- 启用 Light BVH – 控制是否使用 Light BVH 或高斯树；若关闭，将使用 NEE 的 RIS 次数。关闭可获得最快速度，但发光网格采样质量较差。
- 快速开关辐射缓存（Radcache） – 开关辐射缓存功能。用于与真实路径追踪结果进行对比时非常有用。

## 编辑器窗口指南
**TrueTrace 选项说明**

- 构建聚合 BVH（推荐在编辑模式更改对象后执行） – 允许你在运行之前预构建对象的 BVH，这样就不必每次进入 Play 模式时等待构建。
- 清除父对象数据 – 清除存储在父对象上的数据，使你能够点击它们而不会出现卡顿。
- 截图 – 将截图保存至 TrueTrace 设置中“功能设置”下的路径。
- 自动分配脚本 – 将所有必需的脚本分配给 Scene 对象下的所有对象，是添加对象的最佳方式。
- 剩余对象 – 仍在处理中尚未完成的对象数量。
- 最大反弹次数 – 设置光线可达到的最大反弹次数。
- 内部分辨率比率 – 相对于 GameView 的渲染比例，编辑模式下调低可减少分辨率并加速渲染。
- 启用俄罗斯轮盘法 – 强烈推荐开启，可提前终止对贡献较小的光线的追踪，从而极大提升性能。
- 启用对象移动 – 允许在运行时移动对象，并在构建完成后添加新对象。
- 允许图像累积 – 在相机静止时允许图像进行帧累积。
- 使用下一事件估计（NEE） – 启用影子射线/下一事件估计以进行直接光采样。
  - RIS 次数 – Unity 和网格光源执行 RIS 采样的次数（仅在功能设置中关闭 Light BVH 时对网格光源有效）。
- 允许网格蒙皮 – 允许蒙皮网格动画或变形（受骨骼控制）。
- 去噪器 – 可在不同去噪器之间切换。
- 使用 ReSTIR GI – 启用 ReSTIR 全局光照，通常有更高质量（与 Recur 和 SVGF 去噪器兼容）。
  - 执行采样连接验证 – 验证两个采样是否可互相可见，不可见则丢弃。
  - 启用时间性（Temporal） – 启用 ReSTIR GI 的时间性处理（允许采样跨时间传播，目前作用不大）。
  - 时间性 M 上限 – 控制采样的生命周期，值越小则光照更新越快但噪点更多（推荐 0 或约 12）。
  - 启用空间性（Spatial） – 启用 ReSTIR GI 的空间处理（允许像素选择邻近像素的采样）。
- 放大器（仅当 Internal Resolution Ratio ≠ 1 时） – 允许从若干种放大方法中选择其一。
- 启用部分渲染 – 仅追踪 1/(X×X) 的光线以提升性能。
- 启用 AntiFirefly – 启用 RCRS 滤波器，用于去除孤立亮点。
  - AntiFirefly 前帧数 – 在触发 AntiFirefly 之前所需的帧数。
  - AntiFirefly 帧间隔 – 每 X 帧执行一次 AntiFirefly。
- RR 忽略主命中点 – 相当于额外的反弹，使暗面对象不会更吵杂，但会牺牲部分性能。
- 大气散射采样数 – 控制预计算的多重散射大气样本数量。
- 当前采样数 – 显示当前累积的采样数量。
- 启用色调映射 – 开启色调映射，并可选择具体算法。
- 使用锐化滤镜 – 使用对比自适应锐化滤波。
- 启用 Bloom – 开关 Bloom 效果。
- 启用景深（DoF） – 开关景深及其相关设置。
  - Ctrl + 中键点击 – 自动聚焦到 GameView 中鼠标悬停的对象。
  - Ctrl + 中键滚轮 – 调整光圈大小。
- 启用自动/手动曝光 – 开启曝光自动/手动调节。
- 启用 TAA – 开启时间抗锯齿。
- 启用 FXAA – 开启快速近似抗锯齿。

## 高级选项
**GlobalDefines.cginc 描述**

- 注意：以下是指位于 TrueTrace-Unity-Pathtracer -> TrueTrace -> Resources -> GlobalDefines.cginc 的 GlobalDefines.cginc 文件（蓝色），它包含额外的功能开关。
- 可通过删除/添加每个 #define 前的 // 进行启用/禁用：
- 不要直接修改以下项（由 CPU 或功能设置控制）：
  - HardwareRT – 硬件光追（DX12，仅限 Unity 2023+）
  - HDRP、DX11、UseBindless、UseSGTree、TTCustomMotionVectors – 分别在功能设置中控制。
  - MultiMapScreenshot – 保存截图时额外保存材质 ID 和网格 ID 图（与 TTAdvancedImageGen 或 Screenshot 一起使用）。

- 可自行修改的选项：
  - AdvancedAlphaMapped – 启用对 Cutout 对象在遍历时的优化处理；开启一般有利。
  - ExtraSampleValidation – ReSTIR 同时射出直接和间接的影子光线；性能开销大但可能值得。
  - ReSTIRAdvancedValidation – 使用小技巧提高 ReSTIR 在后续帧中利用影子光线的效率。
  - IgnoreGlassShadow – 允许 NEE 射线穿透玻璃。
  - IgnoreGlassMain – 完全忽略场景中的玻璃对象。
  - FadeMapping – 启用材质选项中的 FadeMapping，去噪效果不稳定（功能设置中也可启用）。
  - PointFiltering – 使用点过滤而非线性或三线性采样纹理。
  - StainedGlassShadow – 搭配 IgnoreGlassShadow，允许彩色玻璃影响经过的影子射线。
  - IgnoreBackfacing – 光线不会与背面三角面相交（功能设置中可选）。
  - LBVH – 启用 RIS 采样或使用光照树（功能设置中控制）。
  - AccurateEmissionTex – 更精确地采样发光纹理。
  - TrueBlack – 传统选项，允许真正黑色（已解决旧问题）。
  - UseTextureLOD – Bindless 开启时启用简单的 LOD 纹理采样（功能设置可控制）。
  - EONDiffuse – 切换 Lambert 或 EON 漫反射模型（功能设置可选）。
  - AdvancedBackground – 指定的表面可视作命中天空盒（功能设置可选）。
  - UseBRDFLights – 是否在使用 NEE 时使用多重重要性采样；关闭有助于减少亮点噪声。
  - DoubleBufferSGTree – 帮助 ASVGF 更好采样移动发光网格，性能开销大。
  - Fog – 切换多重散射雾（与去噪不兼容，功能设置中也可切换）。
  - RadCache – 快速切换辐射缓存（功能设置中也可控制）。
  - ClampRoughnessToBounce – 每次反弹时提升材质粗糙度，有助于减少亮点噪声。
  - RasterizedDirect – 实验性，BIRP 专用，仅做间接光贡献，直接光由 Unity 光栅化处理。
  - ReSTIRSampleReduction – 实验性，仅追踪一半光线，由 ReSTIR 补全。
  - ReSTIRRestrictSpatial – 实验性，使镜面反射更干净。
  - SmartRestriction – 基于以上的额外清理处理。
  - ReSTIRAdditionalAO – 通过 ReSTIR 添加伪 AO，有助于提亮角落。
  - ShadowGlassAttenuation – StainedGlassShadow 的增强版，仍处于实验阶段。
  - DisableNormalMaps – 调试选项。
  - ClayMetalOverride – 定义固定的金属度/粗糙度参数以实现粘土效果。