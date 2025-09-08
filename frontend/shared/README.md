# 📁 Shared 模块结构说明

## 🎯 概述

`frontend/shared` 文件夹包含了整个前端项目的共享模块，经过重新组织后，文件结构更加清晰，便于维护和扩展。

## 📂 文件夹结构

```
frontend/shared/
├── 📁 core/              # 核心配置模块
│   ├── api-config.js     # API配置和环境检测
│   └── index.js          # 核心模块索引
│
├── 📁 auth/              # 认证模块
│   ├── auth-manager.js   # 全局认证状态管理器
│   ├── auth-validator.js # 页面认证验证器
│   └── index.js          # 认证模块索引
│
├── 📁 ui/                # UI模块
│   ├── shared.css        # 通用样式和布局
│   ├── animations.css    # 动画效果
│   ├── responsive.css    # 响应式设计
│   └── index.js          # UI模块索引
│
├── 📁 utils/             # 工具模块
│   ├── loading-progress.js  # 加载进度管理
│   ├── theme-manager.js     # 主题管理
│   ├── page-transitions.js  # 页面过渡效果
│   ├── copy-notification.js # 复制通知
│   ├── page-loader.js       # 页面加载器
│   ├── scroll-manager.js    # 滚动管理
│   ├── shared.js            # 通用工具函数
│   └── index.js             # 工具模块索引
│
├── 📁 docs/              # 文档模块
│   └── README.md         # 认证验证器使用说明
│
├── 📄 index.js           # 主索引文件
└── 📄 README.md          # 本文件（结构说明）
```

## 🔧 使用方法

### 1. 核心配置
```html
<!-- API配置 -->
<script src="../../shared/core/api-config.js"></script>
```

### 2. 认证功能
```html
<!-- 认证管理器 -->
<script src="../../shared/auth/auth-manager.js"></script>
<!-- 认证验证器 -->
<script src="../../shared/auth/auth-validator.js"></script>
```

### 3. UI样式
```html
<!-- 通用样式 -->
<link rel="stylesheet" href="../../shared/ui/shared.css">
<!-- 动画效果 -->
<link rel="stylesheet" href="../../shared/ui/animations.css">
<!-- 响应式设计 -->
<link rel="stylesheet" href="../../shared/ui/responsive.css">
```

### 4. 工具功能
```html
<!-- 根据需要引入相应的工具文件 -->
<script src="../../shared/utils/theme-manager.js"></script>
<script src="../../shared/utils/scroll-manager.js"></script>
```

## 📋 模块说明

### Core 模块
- **api-config.js**: 自动检测环境并配置API基础URL
- 支持本地文件系统、本地开发、生产环境等不同场景

### Auth 模块
- **auth-manager.js**: 管理全局认证状态，处理登录/登出
- **auth-validator.js**: 提供页面级别的认证验证和保护

### UI 模块
- **shared.css**: 通用样式、布局、组件样式
- **animations.css**: CSS动画、过渡效果
- **responsive.css**: 响应式设计、媒体查询

### Utils 模块
- **loading-progress.js**: 加载进度条管理
- **theme-manager.js**: 主题切换和管理
- **page-transitions.js**: 页面过渡动画
- **copy-notification.js**: 复制操作通知
- **page-loader.js**: 页面加载状态管理
- **scroll-manager.js**: 滚动行为管理
- **shared.js**: 通用工具函数

## 🚀 优势

1. **结构清晰**: 按功能分类，便于查找和维护
2. **模块化**: 每个模块职责单一，便于扩展
3. **文档完善**: 每个模块都有说明文档
4. **易于维护**: 相关文件集中管理，减少混乱

## 📝 注意事项

1. **路径更新**: 重新组织后，需要更新所有页面的引用路径
2. **依赖关系**: 注意模块间的依赖关系，按正确顺序引入
3. **向后兼容**: 保持原有的API接口不变，确保现有代码正常工作

## 🔄 迁移指南

如果要将现有页面迁移到新的文件结构：

1. 更新CSS文件路径：`../../shared/shared.css` → `../../shared/ui/shared.css`
2. 更新JS文件路径：`../../shared/api-config.js` → `../../shared/core/api-config.js`
3. 更新认证文件路径：`../../shared/auth-manager.js` → `../../shared/auth/auth-manager.js`
4. 更新工具文件路径：根据需要引入 `../../shared/utils/` 下的相应文件

## 📞 技术支持

如有问题或建议，请参考各模块的详细文档或联系开发团队。
