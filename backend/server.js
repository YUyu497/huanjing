const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet()); // 安全头
app.use(cors()); // 跨域支持
app.use(morgan('combined')); // 日志
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析

// 设置信任代理（解决rate-limit的X-Forwarded-For问题）
app.set('trust proxy', 1);

// 静态文件服务
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.static('uploads'));

// 测试数据库连接
app.get('/api/health', async (req, res) => {
    try {
        const dbConnected = await testConnection();
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: dbConnected ? 'connected' : 'disconnected'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/news', require('./routes/news'));
app.use('/api/downloads', require('./routes/downloads'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/server-data', require('./routes/server-status'));
app.use('/api/server-status', require('./routes/server-status'));

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '页面未找到'
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// 启动服务器
app.listen(PORT, async () => {
    console.log(`🎮 幻境游戏服务器运行在端口 ${PORT}`);
    console.log(`📱 前端地址: http://localhost:${PORT}`);
    console.log(`🔧 API地址: http://localhost:${PORT}/api`);

    // 测试数据库连接
    const dbConnected = await testConnection();
    if (dbConnected) {
        console.log('✅ 数据库连接正常');

        // 启动定时清理任务
        const { cleanupTask } = require('./utils/cleanup-task');
        cleanupTask.start();
        console.log('🧹 定时清理任务已启动');
    } else {
        console.log('⚠️ 数据库连接失败，请检查配置');
    }
});

module.exports = app;
