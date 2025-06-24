# 7. 将相机代码移入独立类中

在继续之前，现在是将相机与场景渲染代码整合为一个新类的好时机：相机类。这个相机类将负责两个重要任务：

1. 构造并向世界发送光线；
2. 使用这些光线的结果来构建最终渲染的图像。

在这次重构中，我们将把 ray_color() 函数，以及主程序中的图像、相机和渲染部分集中整理到这个新类中。新的相机类将包含两个公共方法：initialize() 和 render()，以及两个私有辅助方法：get_ray() 和 ray_color()。

最终，相机将遵循我们能想到的最简单的使用模式：它将使用默认构造函数（无参数）进行构造，随后调用者通过简单的赋值方式修改相机的公共变量，最后通过调用 initialize() 方法来完成所有初始化。我们选择这种模式，而不是通过带大量参数的构造函数或定义并调用多个 setter 方法。这样，调用者只需要设置它真正关心的部分。最后，调用者可以选择显式调用 initialize() 方法，或者让相机在调用 render() 方法开始时自动调用该方法。我们采用第二种方式。

在主函数创建相机并设置默认值之后，它将调用 render() 方法。render() 方法将为渲染做准备，并执行渲染循环。

下面是我们新相机类的框架代码：

```c

#ifndef CAMERA_H
#define CAMERA_H

#include "hittable.h"

class camera {
  public:
    /* Public Camera Parameters Here */

    void render(const hittable& world) {
        ...
    }

  private:
    /* Private Camera Variables Here */

    void initialize() {
        ...
    }

    color ray_color(const ray& r, const hittable& world) const {
        ...
    }
};

#endif

```

```c
class camera {
  ...

  private:
    ...


    color ray_color(const ray& r, const hittable& world) const {
        hit_record rec;

        if (world.hit(r, interval(0, infinity), rec)) {
            return 0.5 * (rec.normal + color(1,1,1));
        }

        vec3 unit_direction = unit_vector(r.direction());
        auto a = 0.5*(unit_direction.y() + 1.0);
        return (1.0-a)*color(1.0, 1.0, 1.0) + a*color(0.5, 0.7, 1.0);
    }
};

#endif

```

现在，我们将 main() 函数中的几乎所有内容都移到新的摄像机类中。main()函数中唯一剩下的就是世界构建。下面是包含新迁移代码的摄像机类：

```c
class camera {
  public:
    double aspect_ratio = 1.0;  // Ratio of image width over height
    int    image_width  = 100;  // Rendered image width in pixel count

    void render(const hittable& world) {
        initialize();

        std::cout << "P3\n" << image_width << ' ' << image_height << "\n255\n";

        for (int j = 0; j < image_height; j++) {
            std::clog << "\rScanlines remaining: " << (image_height - j) << ' ' << std::flush;
            for (int i = 0; i < image_width; i++) {
                auto pixel_center = pixel00_loc + (i * pixel_delta_u) + (j * pixel_delta_v);
                auto ray_direction = pixel_center - center;
                ray r(center, ray_direction);

                color pixel_color = ray_color(r, world);
                write_color(std::cout, pixel_color);
            }
        }

        std::clog << "\rDone.                 \n";
    }

  private:
    int    image_height;   // Rendered image height
    point3 center;         // Camera center
    point3 pixel00_loc;    // Location of pixel 0, 0
    vec3   pixel_delta_u;  // Offset to pixel to the right
    vec3   pixel_delta_v;  // Offset to pixel below

    void initialize() {
        image_height = int(image_width / aspect_ratio);
        image_height = (image_height < 1) ? 1 : image_height;

        center = point3(0, 0, 0);

        // Determine viewport dimensions.
        auto focal_length = 1.0;
        auto viewport_height = 2.0;
        auto viewport_width = viewport_height * (double(image_width)/image_height);

        // Calculate the vectors across the horizontal and down the vertical viewport edges.
        auto viewport_u = vec3(viewport_width, 0, 0);
        auto viewport_v = vec3(0, -viewport_height, 0);

        // Calculate the horizontal and vertical delta vectors from pixel to pixel.
        pixel_delta_u = viewport_u / image_width;
        pixel_delta_v = viewport_v / image_height;

        // Calculate the location of the upper left pixel.
        auto viewport_upper_left =
            center - vec3(0, 0, focal_length) - viewport_u/2 - viewport_v/2;
        pixel00_loc = viewport_upper_left + 0.5 * (pixel_delta_u + pixel_delta_v);
    }

    color ray_color(const ray& r, const hittable& world) const {
        ...
    }
};

#endif
```

```c
#include "rtweekend.h"

#include "camera.h"
#include "hittable.h"
#include "hittable_list.h"
#include "sphere.h"

color ray_color(const ray& r, const hittable& world) {
    ...
}

int main() {
    hittable_list world;

    world.add(make_shared<sphere>(point3(0,0,-1), 0.5));
    world.add(make_shared<sphere>(point3(0,-100.5,-1), 100));

    camera cam;

    cam.aspect_ratio = 16.0 / 9.0;
    cam.image_width  = 400;

    cam.render(world);
}
```

