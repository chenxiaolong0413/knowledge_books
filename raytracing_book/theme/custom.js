document.addEventListener("DOMContentLoaded", function () {
    const chapters = document.querySelectorAll(".chapter-item");

    chapters.forEach(chapter => {
        const toggle = chapter.querySelector(".toggle");
        const link = chapter.querySelector("a[href]");

        if (toggle) {
            // 将事件绑定到整行标题
            link.addEventListener("click", function (e) {
                e.preventDefault(); // 防止页面跳转
                chapter.classList.toggle("expanded");
            });
        }
    });
});
