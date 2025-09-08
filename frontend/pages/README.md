# 页面管理系统

## 📁 目录结构

```
frontend/pages/
├── README.md                 # 页面管理说明
├── download/                 # 下载中心页面
│   ├── download.html        # 下载页面HTML
│   ├── download.css         # 下载页面样式
│   └── download.js          # 下载页面脚本
├── news/                    # 新闻资讯页面（待创建）
├── server-status/           # 服务器状态页面（待创建）
├── about/                   # 关于我们页面（待创建）
└── admin/                   # 管理后台页面（待创建）
```

## 🎯 设计理念

### 主界面简化
- **保留核心信息**：只显示必要的介绍和入口
- **功能模块化**：每个功能都有独立的二级页面
- **导航清晰**：通过导航栏和面包屑导航保持用户方向感

### 二级页面特点
- **功能完整**：包含该功能的所有相关内容和操作
- **样式统一**：使用共享的CSS变量和组件样式
- **交互丰富**：提供完整的用户交互体验
- **响应式设计**：适配各种设备尺寸

## 🚀 页面开发规范

### 1. HTML结构
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <!-- 统一的meta标签和标题格式 -->
    <title>页面名称 - 幻境FiveM服务器</title>
    
    <!-- 样式文件引用顺序 -->
    <link rel="stylesheet" href="../shared/ui/shared.css">
<link rel="stylesheet" href="../shared/ui/animations.css">
<link rel="stylesheet" href="../shared/ui/responsive.css">
    <link rel="stylesheet" href="../components/navigation/navigation.css">
    <link rel="stylesheet" href="页面专用样式.css">
</head>
<body>
    <!-- 统一的导航栏结构 -->
    <nav class="navbar">...</nav>
    
    <!-- 页面头部 -->
    <section class="page-header">...</section>
    
    <!-- 页面内容 -->
    <section class="页面内容">...</section>
    
    <!-- 统一页脚 -->
    <footer>...</footer>
    
    <!-- JavaScript文件引用 -->
    <script src="../components/navigation/navigation.js"></script>
    <script src="页面专用脚本.js"></script>
</body>
</html>
```

### 2. CSS样式
- **使用CSS变量**：所有颜色、间距、阴影等都使用共享变量
- **组件化样式**：每个页面创建独立的CSS文件
- **响应式优先**：使用移动优先的响应式设计
- **动画效果**：合理使用动画提升用户体验

### 3. JavaScript功能
- **模块化设计**：每个页面使用独立的类管理功能
- **事件处理**：统一的事件绑定和管理方式
- **API交互**：统一的API调用和错误处理
- **状态管理**：合理管理页面状态和数据

## 📱 响应式断点

```css
/* 使用共享的响应式变量 */
@media (max-width: 768px) { /* 平板 */ }
@media (max-width: 480px) { /* 手机 */ }
@media (min-width: 1200px) { /* 桌面 */ }
```

## 🔗 导航链接

### 主界面链接
- 首页：`/index.html`
- 下载中心：`/pages/download/download.html`
- 新闻资讯：`/pages/news/news.html`（待创建）
- 服务器状态：`/pages/server-status/status.html`（待创建）
- 关于我们：`/pages/about/about.html`（待创建）

### 面包屑导航
每个二级页面都应该包含面包屑导航，帮助用户了解当前位置：
```html
<div class="breadcrumb">
    <a href="../index.html">首页</a>
    <i class="fas fa-chevron-right"></i>
    <span>当前页面</span>
</div>
```

## 🎨 样式主题

### 颜色系统
- **主色调**：`var(--accent-color)` - 蓝色系
- **强调色**：`var(--neon-color)` - 霓虹蓝
- **背景色**：`var(--bg-primary)` 和 `var(--bg-secondary)`
- **文字色**：`var(--text-primary)` 和 `var(--text-secondary)`

### 组件样式
- **卡片**：使用 `card` 类或自定义样式
- **按钮**：使用 `btn` 和 `btn-primary` 等类
- **图标**：使用 Font Awesome 图标库
- **动画**：使用共享的动画类和关键帧

## 📋 待创建页面

### 1. 新闻资讯页面 (`/pages/news/`)
- 新闻列表展示
- 新闻详情页面
- 分类筛选功能
- 搜索功能

### 2. 服务器状态页面 (`/pages/server-status/`)
- 实时服务器状态
- 玩家在线统计
- 服务器性能监控
- 历史数据查看

### 3. 关于我们页面 (`/pages/about/`)
- 服务器介绍
- 团队信息
- 联系方式
- 用户协议

### 4. 管理后台页面 (`/pages/admin/`)
- 数据统计面板
- 用户管理
- 内容管理
- 系统设置

## 🔧 开发工具

### 调试工具
- 使用浏览器开发者工具
- 控制台日志输出
- 网络请求监控
- 性能分析

### 测试方法
- 多浏览器兼容性测试
- 响应式设计测试
- 功能完整性测试
- 用户体验测试

## 📝 更新日志

### v1.0.0 (2024-01-15)
- ✅ 创建页面管理系统
- ✅ 完成下载中心页面
- ✅ 建立页面开发规范
- 🔄 待创建其他功能页面

## 🤝 贡献指南

1. **遵循规范**：严格按照页面开发规范创建页面
2. **样式统一**：使用共享的CSS变量和组件样式
3. **功能完整**：确保页面功能完整且用户体验良好
4. **测试充分**：在多个设备和浏览器上测试页面
5. **文档更新**：及时更新相关文档和说明

---

**注意**：所有新创建的页面都应该遵循这个规范，确保整个项目的一致性和可维护性。
