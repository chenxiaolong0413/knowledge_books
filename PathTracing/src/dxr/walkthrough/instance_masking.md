# 实例掩码（Instance Masking）
----------------------

在顶层加速结构（Top-Level Acceleration Structure, TLAS）中的每个几何实例（Geometry Instance）都有一个 8 位的用户自定义字段，称为 `InstanceMask`（实例掩码）。

当着色器调用 `TraceRay()` 时，它可以传入一个 8 位的参数，叫做 `InstanceInclusionMask`（包含掩码）。  
系统会将这个 `InstanceInclusionMask` 和每个待检测交点的实例的 `InstanceMask` 执行按位与（AND）操作：

```
InstanceMask & InstanceInclusionMask
```

* 如果结果为 0，说明这个实例**不符合条件**，就会被忽略（即不会检测交点）。
    

* * *

### 有什么用？

这种机制允许我们在一个加速结构中表示多个“几何子集”。  
而不是为每种用途分别构建多个加速结构，提高了灵活性，也减少了构建和内存的开销。

开发者可以根据需要，在**遍历性能**和**维护多个结构的额外开销**之间做权衡。

* * *

### 举个例子：

假设你不希望某些物体在做**阴影计算**时产生遮挡（比如透明玻璃），但这些物体在正常渲染中仍然需要显示。

那么你可以给这些物体设置一个特定的 `InstanceMask`，然后在进行阴影检测的 `TraceRay()` 调用中，设置对应的 `InstanceInclusionMask` 来**屏蔽它们**。

* * *

### 换种角度理解：

* `InstanceMask`（实例掩码）的每一位可以表示一个“组”，实例属于哪些组就把对应的位设为 1。
    
    > （注意：如果 `InstanceMask = 0`，这个实例**永远不会被命中**！）
    
* 而射线的 `InstanceInclusionMask` 表示“我要包含哪些组”，只有和实例的掩码有**重叠位**（按位与后不为0），这个实例才会被考虑。
    

* * *

### 总结一句话：

> 通过 `InstanceMask` + `InstanceInclusionMask`，你可以灵活地控制射线要“看见”或“忽略”哪些实例，而不必为每种用途重建加速结构。

* * *