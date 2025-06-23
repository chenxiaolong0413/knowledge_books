# 2. 输出图像  
## 2.1. PPM 图像格式

每当你启动一个渲染器时，你需要某种方式来查看图像。最直接的方法就是将图像写入文件。不过问题在于，图像格式有很多种，其中大多数都很复杂。我总是从一个纯文本的 PPM 文件开始。下面是 Wikipedia 上对其的简要描述：

图 1：PPM 示例

让我们写点 C++ 代码来输出这样一个图像：

```cpp

#include <iostream>

int main() {

    // Image

    int image_width = 256;
    int image_height = 256;

    // Render

    std::cout << "P3\n" << image_width << ' ' << image_height << "\n255\n";

    for (int j = 0; j < image_height; j++) {
        for (int i = 0; i < image_width; i++) {
            auto r = double(i) / (image_width-1);
            auto g = double(j) / (image_height-1);
            auto b = 0.0;

            int ir = int(255.999 * r);
            int ig = int(255.999 * g);
            int ib = int(255.999 * b);

            std::cout << ir << ' ' << ig << ' ' << ib << '\n';
        }
    }
}

```

代码清单 1：[main.cc] 创建你的第一张图像

这段代码中有几点需要注意：

* 像素是按行写出的。
    
* 每一行像素从左到右写出。
    
* 所有的行自顶向下依次写出。
    
* 按惯例，红/绿/蓝三个通道内部使用 0.0 到 1.0 的实数表示。在输出前，需要将其缩放到 0 到 255 的整数范围。
    
* 从左到右，红色从完全关闭（黑）渐变到完全开启（亮红）；从上到下，绿色从完全关闭（黑）渐变到完全开启（亮绿）。红光和绿光混合后会变成黄色，所以我们应该预期图像右下角是黄色的。