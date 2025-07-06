
一、斯涅尔定律（Snell's Law）简介
----------------------

当光线从一种介质进入另一种介质时（如从空气进入水中），光的传播方向会发生改变，这种现象称为**折射**。斯涅尔定律描述了这种折射过程中的**入射角**和**折射角**之间的关系。

### 数学表达：

$$n_1 \sin\theta_1 = n_2 \sin\theta_2$$

* $n_1$：入射介质的折射率
    
* $n_2$：折射介质的折射率
    
* $\theta_1$：入射角（光线与法线的夹角）
    
* $\theta_2$：折射角（折射光线与法线的夹角）
    

> 角度都是相对于法线（而不是表面）来定义的。

* * *

二、折射向量的推导与计算
------------

在图形学中，我们常常需要从入射光线向量和法线计算折射向量。这一过程基于**向量形式的斯涅尔定律**，以下是推导全过程。

* * *

### 1. 设定

已知以下向量：

* $\mathbf{I}$：单位入射向量（朝向表面，已归一化）
    
* $\mathbf{N}$：单位法线向量（朝外，已归一化）
    
* $\eta = \frac{n_1}{n_2}$：折射率比（入射介质 / 折射介质）
    

目标：求出折射后的单位向量 $\mathbf{T}$

* * *

### 2. 斯涅尔定律在向量空间的表达

入射向量与法线之间的夹角为 $\theta_1$，根据余弦定义：

$$\cos\theta_1 = -\mathbf{I} \cdot \mathbf{N}$$

（注意：入射光向量指向表面，法线向外，因此取负号）

* * *

### 3. 折射向量构建思路

我们将折射向量 $\mathbf{T}$ 拆解为两个分量：

* **平行于表面的分量** $\mathbf{T}_\parallel$
    
* **垂直于表面的分量** $\mathbf{T}_\perp$
    

* * *

### 4. 使用折射率比进行缩放

根据折射定律和平面几何关系，有：

#### 平行分量：

$$\mathbf{T}_\parallel = \eta(\mathbf{I} + \cos\theta_1 \cdot \mathbf{N})$$

（先将 $\mathbf{I}$ 在法线方向分解掉，然后缩放）

* * *

### 5. 计算垂直分量（保持单位长度）

设 $\cos\theta_2$ 为折射角余弦，由三角恒等式有：

$$\cos^2\theta_2 = 1 - \sin^2\theta_2$$

又由斯涅尔定律知：

$$\sin\theta_2 = \eta \sin\theta_1$$

而 $\sin^2\theta_1 = 1 - \cos^2\theta_1$，代入得：

$$\cos^2\theta_2 = 1 - \eta^2 (1 - \cos^2\theta_1)$$

因此：

$$\mathbf{T}_\perp = -\sqrt{1 - \eta^2 (1 - \cos^2\theta_1)} \cdot \mathbf{N}$$

* * *

### 6. 折射向量的总和

$$ 
\vec{T} = \eta \cdot (\vec{I} + \cos \theta_i) - \sqrt{1 - \eta^2(1 - \cos^2\theta_i)} \cdot \vec{N}
$$

$$
\vec{T} = \eta \cdot (\vec{I} + \cos\theta_i \cdot \vec{N}) - \sqrt{1 - \left| \eta \cdot (\vec{I} + \cos\theta_i \cdot \vec{N}) \right|^2} \cdot \vec{N}
$$

这是常见的折射向量表达式，可用于 Shader、渲染管线等场景。

* * *

三、特殊情况：全反射
----------

如果

$$\eta^2 (1 - \cos^2\theta_1) > 1$$

则根号内为负值，此时**不存在实数解**，即发生了**全反射**（Total Internal Reflection）。也就是说，所有光都被反射回去了，没有折射向量。

* * *

四、伪代码实现（Unity HLSL 等价）
----------------------

```hlsl
float3 Refract(float3 I, float3 N, float eta)
{
    float cos1 = clamp(-dot(I, N), -1.0, 1.0);
    float sin2Sq = eta * eta * (1.0 - cos1 * cos1);

    if (sin2Sq > 1.0)
        return float3(0,0,0); // 全反射，无折射

    float cos2 = sqrt(1.0 - sin2Sq);
    return eta * I + (eta * cos1 - cos2) * N;
}
```

* * *

五、物理直觉总结
--------

* 折射是因为光速在不同介质中不同。
    
* 法线方向决定了角度定义，必须统一。
    
* 折射向量的构造保留了单位长度。
    
* 在图形学中更常使用向量形式而不是角度形式进行计算。
    

如需结合图示说明、代码调试或反射向量对比，我也可以补充说明。