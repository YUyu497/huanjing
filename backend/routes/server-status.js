/**
 * 服务器状态 API 路由
 * 提供 txAdmin 服务器数据的访问接口
 */

const express = require('express');
const router = express.Router();
const txAdminService = require('../services/txadmin-service');
const { validateToken } = require('../middleware/auth');

/**
 * 获取服务器状态（公开接口）
 * GET /api/server-status/status
 */
router.get('/status', async (req, res) => {
    try {
        console.log('📡 请求FiveM服务器状态');
        const status = await txAdminService.getServerStatus();

        res.json({
            success: true,
            data: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ 获取服务器状态失败:', error.message);
        res.status(500).json({
            success: false,
            message: '获取服务器状态失败',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 获取在线玩家（公开接口）
 * GET /api/server-status/players
 */
router.get('/players', async (req, res) => {
    try {
        console.log('📡 请求FiveM在线玩家列表');
        const players = await txAdminService.getOnlinePlayers();

        res.json({
            success: true,
            data: players,
            count: Array.isArray(players) ? players.length : 0,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ 获取玩家列表失败:', error.message);
        res.status(500).json({
            success: false,
            message: '获取玩家列表失败',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 获取综合服务器信息（公开接口）
 * GET /api/server-status/comprehensive
 */
router.get('/comprehensive', async (req, res) => {
    try {
        console.log('📡 请求FiveM综合服务器信息');
        const info = await txAdminService.getComprehensiveServerInfo();

        res.json({
            success: true,
            data: info,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ 获取综合服务器信息失败:', error.message);
        res.status(500).json({
            success: false,
            message: '获取综合服务器信息失败',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 获取资源状态（需要认证）
 * GET /api/server-status/resources
 */
router.get('/resources', validateToken, async (req, res) => {
    try {
        console.log('📡 请求FiveM资源状态');
        const resources = await txAdminService.getResourcesStatus();

        res.json({
            success: true,
            data: resources,
            count: Array.isArray(resources) ? resources.length : 0,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ 获取资源状态失败:', error.message);
        res.status(500).json({
            success: false,
            message: '获取资源状态失败',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 获取服务器信息（公开接口）
 * GET /api/server-status/info
 */
router.get('/info', async (req, res) => {
    try {
        console.log('📡 请求FiveM服务器信息');
        const info = await txAdminService.getServerInfo();

        res.json({
            success: true,
            data: info,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ 获取服务器信息失败:', error.message);
        res.status(500).json({
            success: false,
            message: '获取服务器信息失败',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 检查txAdmin连接状态（公开接口）
 * GET /api/server-status/connection
 */
router.get('/connection', async (req, res) => {
    try {
        console.log('📡 检查FiveM服务器连接状态');
        const connection = await txAdminService.checkConnection();

        res.json({
            success: true,
            data: connection,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ 检查连接状态失败:', error.message);
        res.status(500).json({
            success: false,
            message: '检查连接状态失败',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 获取缓存统计（需要认证）
 * GET /api/server-status/cache-stats
 */
router.get('/cache-stats', validateToken, async (req, res) => {
    try {
        console.log('📡 请求缓存统计');
        const stats = txAdminService.getCacheStats();

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ 获取缓存统计失败:', error.message);
        res.status(500).json({
            success: false,
            message: '获取缓存统计失败',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 测试 txAdmin API 端点（公开接口）
 * GET /api/server-status/test-endpoints
 */
router.get('/test-endpoints', async (req, res) => {
    try {
        console.log('🔍 测试 FiveM API 端点');
        const results = await txAdminService.testApiEndpoints();

        res.json({
            success: true,
            data: results,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ API 端点测试失败:', error.message);
        res.status(500).json({
            success: false,
            message: 'API 端点测试失败',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 健康检查接口（公开接口）
 * GET /api/server-status/health
 */
router.get('/health', async (req, res) => {
    try {
        const connection = await txAdminService.checkConnection();
        const status = await txAdminService.getServerStatus();

        const health = {
            service: 'txAdmin Integration',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            txAdmin: {
                connected: connection.connected,
                serverStatus: status.status,
                uptime: status.uptime
            },
            cache: {
                stats: txAdminService.getCacheStats()
            }
        };

        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        console.error('❌ 健康检查失败:', error.message);
        res.status(503).json({
            success: false,
            message: '服务不可用',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
