/**
 * 服务器状态服务模块
 * 用于与后端 txAdmin 集成 API 进行通信
 */

class ServerStatusService {
    constructor() {
        this.baseUrl = '/api/server-status';
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30秒缓存
        this.updateCallbacks = new Set();
        this.autoUpdateInterval = null;
        this.isInitialized = false;

        console.log('🔧 服务器状态服务已初始化');
    }

    /**
     * 初始化服务
     */
    async init() {
        if (this.isInitialized) {
            console.log('⚠️ 服务器状态服务已经初始化');
            return;
        }

        try {
            // 检查连接状态
            const connection = await this.checkConnection();
            console.log('🔗 txAdmin连接状态:', connection);

            // 启动自动更新
            this.startAutoUpdate();

            this.isInitialized = true;
            console.log('✅ 服务器状态服务初始化完成');
        } catch (error) {
            console.error('❌ 服务器状态服务初始化失败:', error);
        }
    }

    /**
     * 获取服务器状态
     */
    async getServerStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/status`);
            const result = await response.json();

            if (result.success) {
                this.cache.set('serverStatus', {
                    data: result.data,
                    timestamp: Date.now()
                });
                return result.data;
            } else {
                console.error('❌ 获取服务器状态失败:', result.message);
                return this.getCachedData('serverStatus');
            }
        } catch (error) {
            console.error('❌ 获取服务器状态失败:', error);
            return this.getCachedData('serverStatus');
        }
    }

    /**
     * 获取在线玩家
     */
    async getOnlinePlayers() {
        try {
            const response = await fetch(`${this.baseUrl}/players`);
            const result = await response.json();

            if (result.success) {
                this.cache.set('players', {
                    data: result.data,
                    timestamp: Date.now()
                });
                return result.data;
            } else {
                console.error('❌ 获取玩家列表失败:', result.message);
                return this.getCachedData('players') || [];
            }
        } catch (error) {
            console.error('❌ 获取玩家列表失败:', error);
            return this.getCachedData('players') || [];
        }
    }

    /**
     * 获取综合服务器信息
     */
    async getComprehensiveInfo() {
        try {
            const response = await fetch(`${this.baseUrl}/comprehensive`);
            const result = await response.json();

            if (result.success) {
                this.cache.set('comprehensive', {
                    data: result.data,
                    timestamp: Date.now()
                });
                return result.data;
            } else {
                console.error('❌ 获取综合信息失败:', result.message);
                return this.getCachedData('comprehensive');
            }
        } catch (error) {
            console.error('❌ 获取综合信息失败:', error);
            return this.getCachedData('comprehensive');
        }
    }

    /**
     * 获取服务器信息
     */
    async getServerInfo() {
        try {
            const response = await fetch(`${this.baseUrl}/info`);
            const result = await response.json();

            if (result.success) {
                this.cache.set('serverInfo', {
                    data: result.data,
                    timestamp: Date.now()
                });
                return result.data;
            } else {
                console.error('❌ 获取服务器信息失败:', result.message);
                return this.getCachedData('serverInfo');
            }
        } catch (error) {
            console.error('❌ 获取服务器信息失败:', error);
            return this.getCachedData('serverInfo');
        }
    }

    /**
     * 检查连接状态
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/connection`);
            const result = await response.json();

            if (result.success) {
                return result.data;
            } else {
                return { connected: false, error: result.message };
            }
        } catch (error) {
            return { connected: false, error: error.message };
        }
    }

    /**
     * 获取缓存数据
     */
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log(`📦 使用缓存数据: ${key}`);
            return cached.data;
        }
        return null;
    }

    /**
     * 获取缓存统计
     */
    getCacheStats() {
        const now = Date.now();
        const stats = {};

        for (const [key, value] of this.cache.entries()) {
            const age = now - value.timestamp;
            stats[key] = {
                age: Math.floor(age / 1000),
                expired: age > this.cacheTimeout
            };
        }

        return stats;
    }

    /**
     * 清理过期缓存
     */
    cleanExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.cache.delete(key);
                console.log(`🧹 清理过期缓存: ${key}`);
            }
        }
    }

    /**
     * 启动自动更新
     */
    startAutoUpdate(interval = 30000) {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
        }

        this.autoUpdateInterval = setInterval(async () => {
            try {
                const info = await this.getComprehensiveInfo();
                if (info) {
                    this.notifyUpdateCallbacks(info);
                }
            } catch (error) {
                console.error('❌ 自动更新失败:', error);
            }
        }, interval);

        console.log(`🔄 自动更新已启动，间隔: ${interval / 1000}秒`);
    }

    /**
     * 停止自动更新
     */
    stopAutoUpdate() {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
            this.autoUpdateInterval = null;
            console.log('⏹️ 自动更新已停止');
        }
    }

    /**
     * 注册更新回调
     */
    onUpdate(callback) {
        this.updateCallbacks.add(callback);
        return () => this.updateCallbacks.delete(callback); // 返回取消函数
    }

    /**
     * 通知所有更新回调
     */
    notifyUpdateCallbacks(data) {
        this.updateCallbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('❌ 更新回调执行失败:', error);
            }
        });
    }

    /**
     * 格式化在线人数显示
     */
    formatPlayerCount(online, max) {
        if (typeof online === 'number' && typeof max === 'number') {
            return `${online}/${max}`;
        }
        return '0/64'; // 默认值，会被实际数据覆盖
    }

    /**
     * 格式化服务器状态
     */
    formatServerStatus(status) {
        const statusMap = {
            'online': { text: '在线', color: '#10B981', icon: '🟢' },
            'offline': { text: '离线', color: '#EF4444', icon: '🔴' },
            'starting': { text: '启动中', color: '#F59E0B', icon: '🟡' },
            'stopping': { text: '停止中', color: '#F59E0B', icon: '🟡' },
            'unknown': { text: '未知', color: '#6B7280', icon: '⚪' }
        };

        return statusMap[status] || statusMap['unknown'];
    }

    /**
     * 格式化运行时间
     */
    formatUptime(uptime) {
        if (!uptime) return '0天 0小时 0分钟';

        // 如果已经是格式化字符串，直接返回
        if (typeof uptime === 'string' && uptime.includes('d')) {
            return uptime;
        }

        // 如果是秒数，进行格式化
        if (typeof uptime === 'number') {
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);

            return `${days}天 ${hours}小时 ${minutes}分钟`;
        }

        return uptime;
    }

    /**
     * 获取服务器状态摘要
     */
    async getStatusSummary() {
        try {
            const info = await this.getComprehensiveInfo();
            if (!info) return null;

            return {
                status: info.server.status,
                players: this.formatPlayerCount(info.players.online, info.players.max),
                uptime: this.formatUptime(info.server.uptime),
                resources: `${info.resources.running}/${info.resources.total}`,
                lastUpdate: new Date().toLocaleString('zh-CN')
            };
        } catch (error) {
            console.error('❌ 获取状态摘要失败:', error);
            return null;
        }
    }

    /**
     * 销毁服务
     */
    destroy() {
        this.stopAutoUpdate();
        this.updateCallbacks.clear();
        this.cache.clear();
        this.isInitialized = false;
        console.log('🗑️ 服务器状态服务已销毁');
    }
}

// 创建全局实例
window.serverStatus = new ServerStatusService();

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (window.serverStatus) {
        window.serverStatus.destroy();
    }
});

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServerStatusService;
}
