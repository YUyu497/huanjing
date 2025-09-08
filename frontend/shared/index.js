/**
 * Shared模块主索引文件
 * 统一管理所有共享模块
 */

console.log('📦 Shared模块主索引已加载');

// 模块结构说明：
//
// 📁 core/          - 核心配置模块
//    ├── api-config.js    - API配置和环境检测
//    └── index.js         - 核心模块索引
//
// 📁 auth/          - 认证模块
//    ├── auth-manager.js   - 全局认证状态管理器
//    ├── auth-validator.js - 页面认证验证器
//    └── index.js          - 认证模块索引
//
// 📁 ui/            - UI模块
//    ├── shared.css        - 通用样式和布局
//    ├── animations.css    - 动画效果
//    ├── responsive.css    - 响应式设计
//    └── index.js          - UI模块索引
//
// 📁 utils/         - 工具模块
//    ├── loading-progress.js  - 加载进度管理
//    ├── theme-manager.js     - 主题管理
//    ├── page-transitions.js  - 页面过渡效果
//    ├── copy-notification.js - 复制通知
//    ├── page-loader.js       - 页面加载器
//    ├── scroll-manager.js    - 滚动管理
//    ├── shared.js            - 通用工具函数
//    └── index.js             - 工具模块索引
//
// 📁 docs/          - 文档模块
//    └── README.md           - 认证验证器使用说明
//
// 📄 index.js       - 主索引文件（当前文件）

// 使用说明：
// 1. 核心配置：引入 core/api-config.js
// 2. 认证功能：引入 auth/auth-manager.js 和 auth/auth-validator.js
// 3. UI样式：引入 ui/shared.css, ui/animations.css, ui/responsive.css
// 4. 工具功能：根据需要引入 utils/ 下的相应文件
