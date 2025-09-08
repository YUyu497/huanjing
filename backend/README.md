# 幻境游戏官网 - 后端服务

基于Node.js和Express的游戏官网后端API服务，提供新闻管理、下载统计、用户反馈和数据分析功能。

## 🚀 功能特性

### 核心功能
- ✅ **新闻管理API** - 新闻的CRUD操作，支持分类和分页
- ✅ **下载管理API** - 下载统计、系统要求、更新检查
- ✅ **联系表单API** - 用户反馈和联系消息处理
- ✅ **数据分析API** - 页面访问、用户会话、下载分析
- ✅ **实时统计** - 活跃用户、页面访问等实时数据

### 技术特性
- 🔒 **安全防护** - Helmet安全头、CORS配置、输入验证
- 📊 **日志记录** - Morgan日志中间件
- 🎯 **错误处理** - 统一的错误处理机制
- 📈 **性能优化** - 响应压缩、缓存控制
- 🔧 **开发友好** - 热重载、环境配置

## 📁 项目结构

```
backend/
├── server.js              # 主服务器文件
├── package.json           # 项目依赖配置
├── env.example            # 环境变量示例
├── README.md              # 项目说明
└── routes/                # API路由
    ├── news.js            # 新闻管理路由
    ├── downloads.js       # 下载管理路由
    ├── contact.js         # 联系表单路由
    └── analytics.js       # 数据分析路由
```

## 🛠️ 安装和运行

### 1. 安装依赖
```bash
cd backend
npm install
```

### 2. 环境配置
```bash
# 复制环境变量示例文件
cp env.example .env

# 编辑.env文件，配置你的环境变量
```

### 3. 启动服务
```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm start
```

### 4. 访问服务
- 前端地址: http://localhost:3000
- API地址: http://localhost:3000/api
- 健康检查: http://localhost:3000/api/health

## 📚 API文档

### 新闻管理 API

#### 获取新闻列表
```
GET /api/news
Query参数:
- page: 页码 (默认: 1)
- limit: 每页数量 (默认: 10)
- category: 分类筛选
```

#### 获取单条新闻
```
GET /api/news/:id
```

#### 创建新闻（管理员）
```
POST /api/news
Body: {
  "title": "新闻标题",
  "content": "新闻内容",
  "image": "图片URL",
  "category": "分类"
}
```

### 下载管理 API

#### 获取下载统计
```
GET /api/downloads/stats
```

#### 记录下载
```
POST /api/downloads/record
Body: {
  "platform": "windows|macos",
  "version": "游戏版本",
  "userAgent": "用户代理"
}
```

#### 获取系统要求
```
GET /api/downloads/requirements/:platform
```

### 联系表单 API

#### 提交联系表单
```
POST /api/contact/submit
Body: {
  "name": "姓名",
  "email": "邮箱",
  "subject": "主题",
  "message": "消息内容",
  "type": "消息类型"
}
```

#### 提交反馈
```
POST /api/contact/feedback
Body: {
  "name": "姓名",
  "email": "邮箱",
  "rating": 5,
  "category": "反馈分类",
  "feedback": "反馈内容"
}
```

### 数据分析 API

#### 记录页面访问
```
POST /api/analytics/pageview
Body: {
  "page": "页面路径",
  "referrer": "来源页面",
  "timeOnPage": 30
}
```

#### 获取页面访问统计
```
GET /api/analytics/pageviews
Query参数:
- page: 页面筛选
- startDate: 开始日期
- endDate: 结束日期
- groupBy: 分组方式 (day|page)
```

#### 获取实时统计
```
GET /api/analytics/realtime
```

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 服务器端口 | 3000 |
| NODE_ENV | 运行环境 | development |
| MONGODB_URI | MongoDB连接字符串 | - |
| JWT_SECRET | JWT密钥 | - |
| SMTP_HOST | 邮件服务器地址 | - |
| CORS_ORIGIN | 跨域允许的源 | http://localhost:3000 |

### 数据库配置

当前使用内存存储，生产环境建议配置MongoDB：

1. 安装MongoDB
2. 在.env中配置MONGODB_URI
3. 创建数据模型（models/目录）

## 🚀 部署

### 开发环境
```bash
npm run dev
```

### 生产环境
```bash
# 安装依赖
npm install --production

# 启动服务
npm start

# 或使用PM2
pm2 start server.js --name "huanjing-backend"
```

### Docker部署
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 监控和日志

### 日志配置
- 使用Morgan记录HTTP请求日志
- 错误日志记录到控制台
- 生产环境建议配置日志文件

### 健康检查
```
GET /api/health
```

### 性能监控
- 响应时间监控
- 内存使用监控
- 错误率统计

## 🔒 安全措施

- **Helmet**: 安全头设置
- **CORS**: 跨域资源共享控制
- **输入验证**: 请求参数验证
- **速率限制**: 防止API滥用
- **错误处理**: 不暴露敏感信息

## 🤝 开发指南

### 添加新路由
1. 在routes/目录创建新文件
2. 在server.js中注册路由
3. 添加相应的中间件和验证

### 错误处理
```javascript
try {
  // 业务逻辑
} catch (error) {
  res.status(500).json({
    success: false,
    message: '操作失败',
    error: error.message
  });
}
```

### 数据验证
```javascript
if (!requiredField) {
  return res.status(400).json({
    success: false,
    message: '必填字段不能为空'
  });
}
```

## 📈 性能优化

- 使用压缩中间件
- 实现缓存策略
- 数据库查询优化
- 静态文件CDN

## 🐛 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查找占用端口的进程
   lsof -i :3000
   # 杀死进程
   kill -9 <PID>
   ```

2. **依赖安装失败**
   ```bash
   # 清除缓存
   npm cache clean --force
   # 重新安装
   npm install
   ```

3. **环境变量未生效**
   ```bash
   # 检查.env文件是否存在
   ls -la .env
   # 重启服务
   npm run dev
   ```

## 📞 支持

如有问题或建议，请通过以下方式联系：
- 邮箱: backend@huanjing.com
- 文档: https://docs.huanjing.com/api

---

**祝你的游戏官网后端服务运行顺利！** 🚀
