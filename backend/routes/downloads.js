const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { executeQuery, testConnection } = require('../config/database');

// 获取下载统计
router.get('/stats', async (req, res) => {
    try {
        // 获取总下载量
        const totalResult = await executeQuery(
            'SELECT COUNT(*) as total FROM downloads WHERE download_success = TRUE'
        );

        // 获取今日下载量
        const todayResult = await executeQuery(
            'SELECT COUNT(*) as today FROM downloads WHERE download_success = TRUE AND DATE(downloaded_at) = CURDATE()'
        );

        // 获取平台分布
        const platformResult = await executeQuery(
            'SELECT platform, COUNT(*) as count FROM downloads WHERE download_success = TRUE GROUP BY platform'
        );

        // 获取下载类型分布
        const typeResult = await executeQuery(
            'SELECT download_type, COUNT(*) as count FROM downloads WHERE download_success = TRUE GROUP BY download_type'
        );

        // 获取最近7天的下载趋势
        const trendResult = await executeQuery(`
            SELECT 
                DATE(downloaded_at) as date,
                COUNT(*) as count
            FROM downloads 
            WHERE download_success = TRUE 
            AND downloaded_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(downloaded_at)
            ORDER BY date
        `);

        const stats = {
            total: totalResult.success ? totalResult.data[0].total : 0,
            today: todayResult.success ? todayResult.data[0].today : 0,
            platforms: platformResult.success ? platformResult.data : [],
            types: typeResult.success ? typeResult.data : [],
            trend: trendResult.success ? trendResult.data : []
        };

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('获取下载统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取下载统计失败',
            error: error.message
        });
    }
});

// 数据库状态检查
router.get('/db-status', async (req, res) => {
    try {
        const isConnected = await testConnection();
        res.json({
            success: true,
            data: {
                connected: isConnected,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.json({
            success: false,
            data: {
                connected: false,
                error: error.message,
                timestamp: new Date().toISOString()
            }
        });
    }
});

// 记录下载
router.post('/record', async (req, res) => {
    try {
        // 首先检查数据库连接
        const dbStatus = await testConnection();
        if (!dbStatus) {
            console.warn('⚠️ 数据库连接失败，跳过下载记录');
            return res.json({
                success: false,
                message: '数据库连接失败，下载记录跳过',
                download_skipped: true,
                timestamp: new Date().toISOString()
            });
        }

        const {
            download_type = 'fivem',
            platform = 'unknown',
            user_agent,
            ip_address,
            file_size,
            user_id = null
        } = req.body;

        // 验证必填字段
        if (!download_type) {
            return res.status(400).json({
                success: false,
                message: '下载类型不能为空'
            });
        }

        // 获取客户端IP
        const clientIP = ip_address || req.ip || req.connection.remoteAddress;

        // 确保所有参数都不是 undefined，转换为 null
        const safeUserId = user_id || null;
        const safeDownloadType = download_type || 'fivem';
        const safePlatform = platform || 'unknown';
        const safeUserAgent = user_agent || null;
        const safeClientIP = clientIP || null;
        const safeFileSize = file_size || null;

        console.log('📝 下载记录参数:', {
            user_id: safeUserId,
            download_type: safeDownloadType,
            platform: safePlatform,
            user_agent: safeUserAgent,
            ip_address: safeClientIP,
            file_size: safeFileSize
        });

        // 插入下载记录
        const result = await executeQuery(
            `INSERT INTO downloads (
                user_id, download_type, platform, user_agent, 
                ip_address, file_size, download_success, downloaded_at
            ) VALUES (?, ?, ?, ?, ?, ?, TRUE, NOW())`,
            [safeUserId, safeDownloadType, safePlatform, safeUserAgent, safeClientIP, safeFileSize]
        );

        if (result.success) {
            res.json({
                success: true,
                message: '下载记录成功',
                download_id: result.data.insertId,
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('记录下载失败:', error);
        res.status(500).json({
            success: false,
            message: '记录下载失败',
            error: error.message
        });
    }
});

// 获取下载历史
router.get('/history', async (req, res) => {
    try {
        const { page = 1, limit = 20, type, platform } = req.query;
        const offset = (page - 1) * limit;

        // 构建查询条件
        let whereClause = 'WHERE download_success = TRUE';
        let params = [];

        if (type) {
            whereClause += ' AND download_type = ?';
            params.push(type);
        }

        if (platform) {
            whereClause += ' AND platform = ?';
            params.push(platform);
        }

        // 获取总数
        const countResult = await executeQuery(
            `SELECT COUNT(*) as total FROM downloads ${whereClause}`,
            params
        );

        // 获取分页数据
        const dataResult = await executeQuery(
            `SELECT 
                id, download_type, platform, ip_address, 
                file_size, downloaded_at
            FROM downloads 
            ${whereClause}
            ORDER BY downloaded_at DESC
            LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        const total = countResult.success ? countResult.data[0].total : 0;
        const downloads = dataResult.success ? dataResult.data : [];

        res.json({
            success: true,
            data: {
                downloads,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('获取下载历史失败:', error);
        res.status(500).json({
            success: false,
            message: '获取下载历史失败',
            error: error.message
        });
    }
});

// 获取平台统计
router.get('/platforms', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                platform,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM downloads WHERE download_success = TRUE), 2) as percentage
            FROM downloads 
            WHERE download_success = TRUE 
            GROUP BY platform 
            ORDER BY count DESC
        `);

        res.json({
            success: true,
            data: result.success ? result.data : [],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('获取平台统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取平台统计失败',
            error: error.message
        });
    }
});

// 获取下载类型统计
router.get('/types', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                download_type,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM downloads WHERE download_success = TRUE), 2) as percentage
            FROM downloads 
            WHERE download_success = TRUE 
            GROUP BY download_type 
            ORDER BY count DESC
        `);

        res.json({
            success: true,
            data: result.success ? result.data : [],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('获取下载类型统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取下载类型统计失败',
            error: error.message
        });
    }
});

// 获取实时下载数据（最近1小时）
router.get('/realtime', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                DATE_FORMAT(downloaded_at, '%H:%i') as time_slot,
                COUNT(*) as count
            FROM downloads 
            WHERE download_success = TRUE 
            AND downloaded_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            GROUP BY DATE_FORMAT(downloaded_at, '%H:%i')
            ORDER BY time_slot
        `);

        res.json({
            success: true,
            data: result.success ? result.data : [],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('获取实时下载数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取实时下载数据失败',
            error: error.message
        });
    }
});

// 获取下载趋势数据
router.get('/trend', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;

        const result = await executeQuery(`
            SELECT 
                DATE(downloaded_at) as date,
                COUNT(*) as count
            FROM downloads 
            WHERE download_success = TRUE 
            AND downloaded_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(downloaded_at)
            ORDER BY date
        `, [days]);

        res.json({
            success: true,
            data: result.success ? result.data : [],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('获取下载趋势数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取下载趋势数据失败',
            error: error.message
        });
    }
});

// FiveM安装包下载
router.get('/fivem', (req, res) => {
    console.log('🚀 FiveM下载请求开始');
    console.log('📋 请求头信息:', {
        'user-agent': req.headers['user-agent'],
        'range': req.headers.range,
        'accept': req.headers.accept,
        'referer': req.headers.referer
    });

    const filePath = path.join(__dirname, '../uploads/software/FiveM.exe');
    console.log('📁 文件路径:', filePath);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
        console.error('❌ 文件不存在:', filePath);
        return res.status(404).json({
            success: false,
            message: 'FiveM安装包文件不存在，请联系管理员上传'
        });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    console.log('📊 文件信息:', {
        size: fileSize,
        sizeMB: (fileSize / (1024 * 1024)).toFixed(2) + ' MB',
        lastModified: stat.mtime,
        range: range || '无'
    });

    if (range) {
        // 支持断点续传
        console.log('🔄 断点续传下载');
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });

        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': 'attachment; filename="FiveM.exe"'
        };

        console.log('📤 发送断点续传响应:', head);
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        // 完整下载
        console.log('📥 完整文件下载');
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': 'attachment; filename="FiveM.exe"'
        };

        console.log('📤 发送完整下载响应:', head);
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);

        console.log('✅ FiveM下载请求处理完成');
    }
});

// Kook安装包下载
router.get('/kook', (req, res) => {
    console.log('🚀 Kook下载请求开始');
    console.log('📋 请求头信息:', {
        'user-agent': req.headers['user-agent'],
        'range': req.headers.range,
        'accept': req.headers.accept,
        'referer': req.headers.referer
    });

    const filePath = path.join(__dirname, '../uploads/software/kook.exe');
    console.log('📁 文件路径:', filePath);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
        console.error('❌ 文件不存在:', filePath);
        return res.status(404).json({
            success: false,
            message: 'Kook安装包文件不存在，请联系管理员上传'
        });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    console.log('📊 文件信息:', {
        size: fileSize,
        sizeMB: (fileSize / (1024 * 1024)).toFixed(2) + ' MB',
        lastModified: stat.mtime,
        range: range || '无'
    });

    if (range) {
        // 支持断点续传
        console.log('🔄 断点续传下载');
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });

        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': 'attachment; filename="kook.exe"'
        };

        console.log('📤 发送断点续传响应:', head);
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        // 完整下载
        console.log('📥 完整文件下载');
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': 'attachment; filename="kook.exe"'
        };

        console.log('📤 发送完整下载响应:', head);
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);

        console.log('✅ Kook下载请求处理完成');
    }
});

// 获取Kook文件信息
router.get('/kook/info', (req, res) => {
    console.log('🔍 Kook文件信息请求');
    console.log('📋 请求头信息:', {
        'user-agent': req.headers['user-agent'],
        'referer': req.headers.referer
    });

    const filePath = path.join(__dirname, '../uploads/software/kook.exe');
    console.log('📁 文件路径:', filePath);

    if (!fs.existsSync(filePath)) {
        console.error('❌ 文件不存在:', filePath);
        return res.status(404).json({
            success: false,
            message: 'Kook安装包文件不存在'
        });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

    const fileInfo = {
        filename: 'kook.exe',
        size: fileSize,
        sizeMB: fileSizeMB,
        lastModified: stat.mtime,
        exists: true
    };

    console.log('📊 文件信息:', fileInfo);
    console.log('✅ 文件信息请求处理完成');

    res.json({
        success: true,
        data: fileInfo
    });
});

// 获取文件信息
router.get('/fivem/info', (req, res) => {
    console.log('🔍 FiveM文件信息请求');
    console.log('📋 请求头信息:', {
        'user-agent': req.headers['user-agent'],
        'referer': req.headers.referer
    });

    const filePath = path.join(__dirname, '../uploads/software/FiveM.exe');
    console.log('📁 文件路径:', filePath);

    if (!fs.existsSync(filePath)) {
        console.error('❌ 文件不存在:', filePath);
        return res.status(404).json({
            success: false,
            message: 'FiveM安装包文件不存在'
        });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

    const fileInfo = {
        filename: 'FiveM.exe',
        size: fileSize,
        sizeMB: fileSizeMB,
        lastModified: stat.mtime,
        exists: true
    };

    console.log('📊 文件信息:', fileInfo);
    console.log('✅ 文件信息请求处理完成');

    res.json({
        success: true,
        data: fileInfo
    });
});

module.exports = router;
