# 用户认证系统

用户登录注册功能，使用QQ邮箱验证码进行身份验证。

## 文件结构

```
auth/
├── auth.html          # 登录注册页面HTML
├── auth.css           # 页面样式文件
├── auth.js            # 页面交互逻辑
└── README.md          # 说明文档
```

## 功能特性

### 🔐 **用户注册**
- QQ邮箱验证注册
- 用户名唯一性检查
- 密码强度验证
- 邮箱验证码验证
- 实时表单验证

### 🚪 **用户登录**
- QQ邮箱验证码登录
- 会话管理
- 自动登录状态检查

### 📧 **邮箱验证**
- 6位数字验证码
- 10分钟有效期
- 60秒发送间隔限制
- 美观的邮件模板

### 🛡️ **安全特性**
- 密码加密存储（bcrypt）
- 会话令牌管理
- 请求频率限制
- 输入验证和过滤
- CSRF保护

## API接口

### 发送验证码
```http
POST /api/auth/send-verification
Content-Type: application/json

{
  "email": "user@qq.com",
  "type": "register|login|reset_password"
}
```

### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@qq.com",
  "username": "username",
  "displayName": "Display Name",
  "password": "password123",
  "verificationCode": "123456"
}
```

### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@qq.com",
  "verificationCode": "123456"
}
```

### 验证会话
```http
GET /api/auth/verify-session
Authorization: Bearer <session_token>
```

### 用户登出
```http
POST /api/auth/logout
Authorization: Bearer <session_token>
```

## 前端功能

### 表单验证
- **邮箱验证**：必须是有效的QQ邮箱（@qq.com结尾）
- **用户名验证**：3-20位字母、数字、下划线
- **密码验证**：至少6位，包含大小写字母和数字
- **确认密码**：与原密码一致
- **验证码**：6位数字

### 用户体验
- 实时表单验证
- 加载状态指示
- 错误信息提示
- 成功状态反馈
- 验证码倒计时
- 密码显示切换
- 响应式设计

### 动画效果
- AOS滚动动画
- 表单切换动画
- 按钮加载动画
- 通知弹窗动画

## 数据库表结构

### users 表
- `id` - 用户ID（主键）
- `username` - 用户名（唯一）
- `email` - 邮箱地址（唯一）
- `password_hash` - 密码哈希
- `display_name` - 显示名称
- `avatar_url` - 头像URL
- `is_verified` - 邮箱是否验证
- `is_active` - 账户是否激活
- `role` - 用户角色
- `last_login` - 最后登录时间
- `created_at` - 创建时间
- `updated_at` - 更新时间

### email_verifications 表
- `id` - 验证记录ID
- `email` - 邮箱地址
- `verification_code` - 验证码
- `type` - 验证类型
- `expires_at` - 过期时间
- `is_used` - 是否已使用
- `created_at` - 创建时间

### user_sessions 表
- `id` - 会话ID
- `user_id` - 用户ID
- `session_token` - 会话令牌
- `ip_address` - IP地址
- `user_agent` - 用户代理
- `expires_at` - 过期时间
- `is_active` - 是否激活
- `created_at` - 创建时间
- `updated_at` - 更新时间

## 环境配置

### 后端环境变量
```env
# QQ邮箱配置
QQ_EMAIL_USER=your_qq_email@qq.com
QQ_EMAIL_PASS=your_qq_email_authorization_code

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=huanjing_fivem
DB_USER=root
DB_PASSWORD=your_password
```

### QQ邮箱设置
1. 登录QQ邮箱
2. 设置 → 账户
3. 开启SMTP服务
4. 获取授权码
5. 将授权码配置到环境变量

## 安装依赖

```bash
cd backend
npm install bcrypt nodemailer express-rate-limit express-validator
```

## 使用说明

### 1. 数据库初始化
```bash
# 执行SQL文件创建用户相关表
mysql -u root -p huanjing_fivem < sql/0.0.1.sql
```

### 2. 配置环境变量
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑配置文件
vim backend/.env
```

### 3. 启动服务
```bash
cd backend
npm start
```

### 4. 访问页面
打开浏览器访问：`http://localhost:3000/pages/auth/auth.html`

## 安全注意事项

1. **密码安全**
   - 使用bcrypt加密存储
   - 密码强度要求
   - 防止密码暴力破解

2. **会话安全**
   - 会话令牌随机生成
   - 设置合理的过期时间
   - 支持主动登出

3. **邮箱验证**
   - 验证码有效期限制
   - 发送频率限制
   - 防止验证码暴力破解

4. **输入验证**
   - 前后端双重验证
   - 防止SQL注入
   - 防止XSS攻击

## 故障排除

### 常见问题

1. **邮件发送失败**
   - 检查QQ邮箱授权码
   - 确认SMTP服务已开启
   - 检查网络连接

2. **数据库连接失败**
   - 检查数据库配置
   - 确认数据库服务运行
   - 检查用户权限

3. **验证码无效**
   - 检查验证码是否过期
   - 确认邮箱地址正确
   - 检查验证码输入

4. **会话失效**
   - 检查会话是否过期
   - 确认令牌格式正确
   - 重新登录获取新会话

## 更新日志

### v0.0.1 (2024-01-15)
- 初始版本发布
- 实现基础登录注册功能
- QQ邮箱验证码支持
- 会话管理系统
- 响应式界面设计
