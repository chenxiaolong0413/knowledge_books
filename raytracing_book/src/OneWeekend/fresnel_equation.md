一、Fresnel 方程简介
--------------

当光线射向介质表面时，一部分光会**反射**，另一部分光会**折射（透射）**。  
**Fresnel 方程**用于计算不同角度下，反射光和折射光的比例（反射率与透射率）。

* * *

### 定义：

对于入射光，其反射率取决于：

* 入射角 $\theta_1$
    
* 折射角 $\theta_2$
    
* 两侧介质的折射率 $n_1$、$n_2$
    
* 光的极化方式（s极化或p极化）
    

Fresnel 方程给出了两种极化方向下的反射率：

* $R_s$：s-极化（垂直于入射面）反射率
    
* $R_p$：p-极化（平行于入射面）反射率
    

整体反射率为：

$$R = \frac{R_s + R_p}{2}$$

* * *

### 数学表达：

$$R_s = \left| \frac{n_1 \cos\theta_1 - n_2 \cos\theta_2}{n_1 \cos\theta_1 + n_2 \cos\theta_2} \right|^2$$ $$R_p = \left| \frac{n_1 \cos\theta_2 - n_2 \cos\theta_1}{n_1 \cos\theta_2 + n_2 \cos\theta_1} \right|^2$$

* * *

### 说明：

* $$\cos\theta_1 = -\vec{I} \cdot \vec{N}$$
    
* $\cos\theta_2$ 可通过 Snell's Law 推出
    
* 由于不同极化方向反射行为不同，图形学通常**取平均值**
    

* * *

二、Schlick 近似（图形学中常用的高效估算）
-------------------------

完整的 Fresnel 方程较为复杂，尤其在实时渲染中代价高。因此**Christophe Schlick** 提出一个简洁的近似公式，在角度较小时非常精确。

* * *

### Schlick 公式：

$$R(\theta) = R_0 + (1 - R_0)(1 - \cos\theta)^5$$

其中：

* $R_0 = \left( \frac{n_1 - n_2}{n_1 + n_2} \right)^2$：垂直入射（$\theta = 0^\circ$）时的反射率
    
* $$\cos\theta = -\vec{I} \cdot \vec{N}$$
    

* * *

### 物理意义：

* 当光垂直入射（$\cos\theta = 1$）时，反射率最小
    
* 当光接近平行于表面（$\cos\theta \rightarrow 0$）时，反射率迅速上升接近 1
    
* 该公式可逼近玻璃、水、金属等各种介质在非极化光条件下的反射行为
    

* * *

### HLSL/GLSL 实现示例：

```hlsl
float FresnelSchlick(float cosTheta, float R0)
{
    float x = 1.0 - cosTheta;
    float x2 = x * x;
    return R0 + (1.0 - R0) * x2 * x2 * x; // x^5
}
```

* * *

三、金属与非金属 Fresnel 行为差异
---------------------

### 非金属（Dielectric）：

* $R_0$ 通常很小（如水约 0.02）
    
* 折射主导（反射仅在斜角时明显）
    

### 金属（Conductor）：

* 没有透射光（几乎完全反射）
    
* Fresnel 反射率随波长、方向、材质显著变化
    
* 实际中用 **复折射率（complex IOR）** 计算：$n + ik$，更复杂
    

> 图形学中 PBR 通常使用 LUT 或基于经验参数来近似金属 Fresnel 效果

* * *

四、图形学中的使用总结
-----------

| 使用目的 | 方法选择 | 精度 | 性能 |
| --- | --- | --- | --- |
| 实时渲染（如玻璃、水） | Schlick 近似 | 高（对于非金属） | 高效 |
| 精确物理仿真 | 完整 Fresnel 方程 | 准确 | 较慢 |
| 金属材质 | 使用复折射率 或 Lookup Table | 精确 | 中等 |

* * *

五、补充：Fresnel 与渲染公式中的作用
----------------------

在 PBR（基于物理的渲染）中：

* Fresnel 是 **镜面反射项（Specular）** 的核心组成部分
    
* 常与微表面模型（如 GGX）配合使用
    
* 调节光与视角之间的高光强度变化
    

* * *