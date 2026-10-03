# Apple 玻璃优化候选目标

日期：2026-10-03。推荐方向：轻盈浅色 regular glass + 独立深色版本。
维护者视觉接受：pending；当前文件不是用户已接受的设计。

可操作材质对照：[glass-study.html](glass-study.html)。同一背景、同一布局比较 glass、thick、solid，切换主题和背景；背景穿过卡片可看出采样、rim、内壁与投影。其 CSS 直接读取公共 Token/material.css，不建立官网私有材质实现。

官网方向：白色/柔灰画布、清晰黑色大标题、浮动玻璃导航；完整品牌首页与真实组件秀场。文档是稳定内容层，左组件目录、正文 demo/API、右锚点，顶部搜索、主题与版本。手机菜单抽屉和单列舞台。

光学目标：顶部/迎光侧较亮、底缘克制；柔反射不遮正文；双层独立 shadow。按钮在外壳内只用高光，不重复 blur。clear 仅媒体控件可选。

候选数值来自 CWA 试验，不宣称 Apple 原生 Liquid Glass 等价。局部折射 spike 推迟到 L2 与正式官网通过之后；当前不增加 SVG backdrop/WebGL 兼容负担。
