/**
 * 导航栏服务器状态指示器
 * 在导航栏显示实时服务器状态
 */
class NavStatusIndicator {
    constructor() {
        this.isInitialized = false;
        this.statusIndicator = null;
        this.currentStatus = 'unknown';
        this.updateInterval = null;
        this.init();
    }

    init() {
        if (this.isInitialized) return;

        console.log('🚦 导航栏状态指示器初始化');
        this.createStatusIndicator();
        this.startStatusUpdates();
        this.isInitialized = true;
        console.log('✅ 导航栏状态指示器初始化完成');
    }

    // 创建状态指示器
    createStatusIndicator() {
        // 查找导航栏
        const navbar = document.querySelector('.navbar');
        if (!navbar) {
            console.warn('⚠️ 未找到导航栏，无法创建状态指示器');
            return;
        }

        // 创建状态指示器
        this.statusIndicator = document.createElement('div');
        this.statusIndicator.className = 'nav-status-indicator';
        this.statusIndicator.innerHTML = `
            <div class="status-dot"></div>
            <span class="status-text">服务器状态</span>
            <span class="player-count"></span>
        `;

        // 添加到导航栏右侧
        const navMenu = navbar.querySelector('.nav-menu');
        if (navMenu) {
            navMenu.appendChild(this.statusIndicator);
        } else {
            navbar.appendChild(this.statusIndicator);
        }

        console.log('🚦 导航栏状态指示器已创建');
    }

    // 开始状态更新
    startStatusUpdates() {
        // 立即更新一次
        this.updateStatus();

        // 每30秒更新一次状态
        this.updateInterval = setInterval(() => {
            this.updateStatus();
        }, 30000);

        console.log('🔄 状态更新已启动，30秒更新一次');
    }

    // 更新状态
    async updateStatus() {
        try {
            // 使用与服务器状态监控相同的接口
            const response = await fetch('/api/server-status/comprehensive');
            if (response.ok) {
                const data = await response.json();
                console.log('🚦 导航栏获取到服务器数据:', data);
                this.updateIndicator(data);
            } else {
                console.warn('⚠️ 导航栏获取服务器状态失败:', response.status);
                this.setStatus('offline', '服务器离线');
            }
        } catch (error) {
            console.warn('⚠️ 导航栏获取服务器状态失败:', error);
            this.setStatus('offline', '连接失败');
        }
    }

    // 更新指示器显示
    updateIndicator(data) {
        console.log('🚦 导航栏更新指示器，数据:', data);

        // 检查数据格式 - 后端返回的是 {success: true, data: {...}}
        if (!data || !data.success || !data.data) {
            console.warn('🚦 导航栏数据格式不正确:', data);
            this.setStatus('unknown', '状态未知');
            return;
        }

        const serverData = data.data;
        const serverInfo = serverData.serverInfo;

        // 获取玩家数量 - 添加详细日志
        let playerCount = 0;
        if (serverData.players && typeof serverData.players.count === 'number') {
            playerCount = serverData.players.count;
        } else if (serverInfo && typeof serverInfo.clients === 'number') {
            playerCount = serverInfo.clients;
        }

        // 获取最大玩家数
        let maxPlayers = serverData?.players?.max || 64;
        if (serverInfo && typeof serverInfo.maxClients === 'number') {
            maxPlayers = serverInfo.maxClients;
        }

        console.log(`🚦 导航栏玩家数量解析: 当前=${playerCount}, 最大=${maxPlayers}`);
        console.log(`🚦 导航栏数据详情:`, {
            players: serverData.players,
            serverInfo: serverInfo,
            playerCount: playerCount,
            maxPlayers: maxPlayers
        });

        // 判断服务器状态 - 使用与服务器状态监控相同的逻辑
        let status = 'offline';
        let statusText = '服务器离线';

        // 检查服务器状态 - 从serverData中获取
        if (serverData.status === 'online') {
            status = 'online';
            statusText = '服务器在线';
        } else if (serverData.status === 'warning') {
            status = 'warning';
            statusText = '服务器警告';
        } else if (serverData.status === 'offline') {
            // 检查是否是重启中状态
            if (serverData.server && serverData.server.uptime === '重启中') {
                status = 'restarting';
                statusText = '服务器重启中';
            } else {
                status = 'offline';
                statusText = '服务器离线';
            }
        } else {
            // 如果没有明确状态，尝试从其他信息判断
            if (serverData.players && serverData.players.count > 0) {
                status = 'online';
                statusText = '服务器在线';
            } else if (serverInfo && serverInfo.hostname) {
                status = 'online';
                statusText = '服务器在线';
            } else {
                status = 'unknown';
                statusText = '状态未知';
            }
        }

        console.log(`🚦 导航栏状态判断: ${status} - ${statusText}`);

        // 更新状态
        this.setStatus(status, statusText);

        // 更新玩家数量
        this.updatePlayerCount(playerCount, maxPlayers);
    }

    // 设置状态
    setStatus(status, text) {
        if (!this.statusIndicator) return;

        this.currentStatus = status;

        // 更新状态点
        const statusDot = this.statusIndicator.querySelector('.status-dot');
        if (statusDot) {
            // 处理重启中状态的特殊样式
            if (status === 'restarting') {
                statusDot.className = 'status-dot restarting';
            } else {
                statusDot.className = `status-dot ${status}`;
            }
        }

        // 更新状态文本
        const statusText = this.statusIndicator.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = text;
        }

        console.log(`🚦 服务器状态更新: ${status} - ${text}`);
    }

    // 更新玩家数量
    updatePlayerCount(current, max) {
        if (!this.statusIndicator) return;

        const playerCountElement = this.statusIndicator.querySelector('.player-count');
        if (playerCountElement) {
            playerCountElement.textContent = `${current}/${max}`;
        }
    }

    // 手动更新状态（供外部调用）
    forceUpdate() {
        this.updateStatus();
    }

    // 销毁指示器
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        if (this.statusIndicator) {
            this.statusIndicator.remove();
            this.statusIndicator = null;
        }

        this.isInitialized = false;
        console.log('🗑️ 导航栏状态指示器已销毁');
    }
}

// 创建全局实例
window.navStatusIndicator = new NavStatusIndicator();

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavStatusIndicator;
}
