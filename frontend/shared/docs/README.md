# 🔐 认证验证器使用说明

## 概述

`auth-validator.js` 是一个独立的认证验证器模块，提供统一的登录验证功能，供其他页面调用。它简化了认证逻辑的实现，提高了代码的可维护性。

## 功能特性

- ✅ **统一认证接口**：所有页面使用相同的认证验证方法
- ✅ **智能缓存**：5分钟内的验证结果可以复用，避免重复验证
- ✅ **双重验证策略**：优先使用全局认证管理器，备用本地存储验证
- ✅ **灵活回调**：支持成功/失败回调函数
- ✅ **页面保护器**：提供页面级别的认证保护功能
- ✅ **错误处理**：完善的错误处理和日志记录

## 使用方法

### 1. 引入模块

在HTML页面中引入认证验证器：

```html
<!-- 认证管理器（可选，用于增强功能） -->
<script src="../../shared/auth/auth-manager.js"></script>

<!-- 认证验证器（必需） -->
<script src="../../shared/auth/auth-validator.js"></script>
```

### 2. 基本使用

#### 简单验证

```javascript
// 检查用户是否已登录
if (window.authValidator.isLoggedIn()) {
    console.log('用户已登录');
} else {
    console.log('用户未登录');
}

// 获取用户信息
const userInfo = window.authValidator.getUserInfo();
console.log('用户信息:', userInfo);

// 获取会话令牌
const token = window.authValidator.getSessionToken();
console.log('会话令牌:', token);
```

#### 完整验证

```javascript
// 验证用户认证状态
const isValid = await window.authValidator.validateAuth({
    pageName: '我的页面',
    onSuccess: () => {
        console.log('认证成功，允许访问');
        // 执行页面初始化逻辑
        this.initPage();
    },
    onFailure: () => {
        console.log('认证失败，显示登录提示');
        this.showLoginModal();
    }
});

if (isValid) {
    console.log('用户已认证');
} else {
    console.log('用户未认证');
}
```

### 3. 页面认证保护器（推荐）

#### 创建页面保护器

```javascript
class MyPage {
    constructor() {
        this.init();
    }
    
    async init() {
        // 创建页面认证保护器
        const pageProtector = window.authValidator.createPageProtector({
            pageName: '我的页面',
            onSuccess: () => {
                console.log('✅ 用户认证有效，允许访问');
                this.loadPageData();
            },
            onFailure: () => {
                console.log('🔒 用户认证无效');
                // 可以在这里执行其他逻辑
            },
            showLoginModal: () => {
                this.showLoginRequiredModal();
            }
        });
        
        // 保护页面（需要登录才能访问）
        await pageProtector.protect();
        
        // 或者只检查状态（不阻止访问）
        // await pageProtector.check();
    }
    
    async loadPageData() {
        // 页面数据加载逻辑
        console.log('加载页面数据...');
    }
    
    showLoginRequiredModal() {
        // 显示登录提示模态框
        console.log('显示登录提示');
    }
}
```

#### 强制重新验证

```javascript
// 忽略缓存，强制重新验证
const isValid = await window.authValidator.forceValidate({
    pageName: '我的页面',
    onSuccess: () => {
        console.log('强制验证成功');
    },
    onFailure: () => {
        console.log('强制验证失败');
    }
});
```

## 配置选项

### validateAuth 方法选项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `pageName` | string | '未知页面' | 页面名称，用于日志记录 |
| `onSuccess` | Function | null | 验证成功回调函数 |
| `onFailure` | Function | null | 验证失败回调函数 |
| `forceCheck` | boolean | false | 是否强制检查（忽略缓存） |

### createPageProtector 方法选项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `pageName` | string | '未知页面' | 页面名称 |
| `onSuccess` | Function | null | 验证成功回调 |
| `onFailure` | Function | null | 验证失败回调 |
| `showLoginModal` | Function | null | 显示登录模态框回调 |

## 页面保护器方法

### protect()
保护页面，需要登录才能访问。如果用户未登录，会调用 `onFailure` 回调。

### check()
检查登录状态但不阻止访问。无论结果如何都会继续执行。

## 错误处理

认证验证器会自动处理以下情况：

- **网络错误**：API请求失败时的错误处理
- **令牌过期**：自动清除无效的本地存储
- **HTTP错误**：处理各种HTTP状态码
- **解析错误**：JSON解析失败时的容错处理

## 最佳实践

### 1. 页面初始化时使用

```javascript
class MyPage {
    constructor() {
        this.init();
    }
    
    async init() {
        // 先检查认证，再初始化页面
        const pageProtector = window.authValidator.createPageProtector({
            pageName: '我的页面',
            onSuccess: () => this.initPage(),
            showLoginModal: () => this.showLoginModal()
        });
        
        await pageProtector.protect();
    }
}
```

### 2. 处理认证状态变化

```javascript
// 监听认证状态变化
window.addEventListener('storage', (e) => {
    if (e.key === 'sessionToken') {
        if (e.newValue) {
            console.log('用户已登录');
        } else {
            console.log('用户已登出');
            // 执行登出后的清理逻辑
        }
    }
});
```

### 3. 自定义错误处理

```javascript
const isValid = await window.authValidator.validateAuth({
    pageName: '我的页面',
    onSuccess: () => {
        console.log('认证成功');
    },
    onFailure: () => {
        console.log('认证失败，执行自定义处理');
        // 自定义错误处理逻辑
        this.handleAuthFailure();
    }
});
```

## 注意事项

1. **依赖关系**：认证验证器依赖 `api-config.js`，确保先加载
2. **异步操作**：所有验证方法都是异步的，需要使用 `await` 或 `.then()`
3. **回调函数**：回调函数是可选的，但建议提供以处理不同情况
4. **错误处理**：验证器会自动处理常见错误，但建议提供自定义错误处理
5. **性能优化**：5分钟内的验证结果会缓存，避免重复API请求

## 示例页面

参考以下页面的实现：
- `frontend/pages/download/download.js` - 下载中心页面
- `frontend/pages/news/news.js` - 新闻资讯页面

## 更新日志

- **v1.0.0** - 初始版本，提供基本认证验证功能
- **v1.1.0** - 添加页面保护器功能
- **v1.2.0** - 优化错误处理和日志记录
