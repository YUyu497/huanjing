// 服务器状态组件JavaScript - 对接真实FiveM数据

class ServerStatusManager {
    constructor() {
        this.serverData = {
            status: 'offline',
            players: {
                current: 0,
                max: 64 // 默认值，会被后端数据覆盖
            },
            uptime: '0%',
            ping: '--',
            version: 'v2.1.0',
            hostname: '幻境 FiveM服务器',
            lastUpdate: null,
            playersList: []
        };
        this.updateInterval = null;
        // 移除自动初始化，改为手动调用
    }

    async init() {
        console.log('🚀 初始化真实服务器状态组件');

        // 创建状态卡片
        this.createServerStatusCard();

        // 立即获取一次数据
        await this.updateServerData();

        // 开始定时更新
        this.startAutoUpdate();

        console.log('✅ 真实服务器状态组件初始化完成');
    }

    // 获取服务器数据
    async updateServerData() {
        try {
            console.log('📡 获取服务器状态数据...');

            // 获取综合服务器信息
            const comprehensiveResponse = await fetch('/api/server-status/comprehensive');
            if (!comprehensiveResponse.ok) {
                throw new Error(`综合信息API请求失败: ${comprehensiveResponse.status}`);
            }
            const comprehensiveData = await comprehensiveResponse.json();

            if (!comprehensiveData.success) {
                throw new Error('综合信息API返回失败');
            }

            // 获取在线玩家列表
            const playersResponse = await fetch('/api/server-status/players');
            let playersData = { success: true, data: { players: [], count: 0 } };
            if (playersResponse.ok) {
                playersData = await playersResponse.json();
            }

            // 获取服务器详细信息
            const detailsResponse = await fetch('/api/server-status/info');
            let detailsData = { success: true, data: {} };
            if (detailsResponse.ok) {
                detailsData = await detailsResponse.json();
            }

            // 更新服务器数据
            this.updateServerStatus(comprehensiveData.data, playersData.data, detailsData.data);

            console.log('✅ 服务器数据更新成功:', {
                status: this.serverData.status,
                players: `${this.serverData.players.current}/${this.serverData.players.max}`,
                lastUpdate: this.serverData.lastUpdate ? new Date(this.serverData.lastUpdate).toLocaleString() : '从未'
            });

        } catch (error) {
            console.error('❌ 获取服务器数据失败:', error);
            this.setOfflineStatus();
        }
    }

    // 更新服务器状态
    updateServerStatus(statusData, playersData, detailsData) {
        console.log('🔄 更新服务器状态:', { statusData, playersData, detailsData });

        // 更新基本信息 - 使用新的数据结构
        this.serverData.status = statusData.server?.status || 'offline';
        this.serverData.lastUpdate = new Date().toISOString();

        // 更新服务器信息
        if (statusData.server) {
            this.serverData.players.current = statusData.players?.online || 0;
            this.serverData.players.max = statusData.players?.max || 64;
            this.serverData.hostname = statusData.server?.name || '幻境 FiveM服务器';
            
            // 优先使用 sv_enforceGameBuild，如果没有则使用服务器版本
            let gameVersion = statusData.vars?.sv_enforceGameBuild || statusData.server?.gameBuild || statusData.server?.version || '2.1.0';
            
            // 确保版本号格式正确（移除可能存在的v前缀，然后重新添加）
            if (gameVersion && typeof gameVersion === 'string') {
                gameVersion = gameVersion.replace(/^v/, ''); // 移除开头的v
            }
            
            this.serverData.version = `v${gameVersion}`;
            
            console.log('🔍 版本数据处理:', {
                sv_enforceGameBuild: statusData.vars?.sv_enforceGameBuild,
                gameBuild: statusData.server?.gameBuild,
                serverVersion: statusData.server?.version,
                finalVersion: this.serverData.version
            });
        }

        // 如果服务器离线或重启中，强制设置相应状态
        if (this.serverData.status === 'offline') {
            this.serverData.players.current = 0;
            this.serverData.hostname = '幻境 FiveM服务器 (离线)';
            console.log('⚠️ 检测到服务器离线，设置离线状态');
        } else if (statusData.server?.uptime === '重启中') {
            this.serverData.players.current = 0;
            this.serverData.hostname = '幻境 FiveM服务器 (重启中)';
            console.log('🔄 检测到服务器重启中，设置重启状态');
        }

        // 更新玩家列表
        if (statusData.players && statusData.players.list) {
            this.serverData.playersList = statusData.players.list;
        } else if (Array.isArray(playersData)) {
            this.serverData.playersList = playersData;
        }

        // 更新详细信息
        if (detailsData && detailsData.server) {
            this.serverData.hostname = detailsData.server.name || this.serverData.hostname;
            // 不要覆盖已经处理好的版本号，保持使用 sv_enforceGameBuild
            // this.serverData.version = detailsData.server.version || this.serverData.version;
        }

        // 计算在线率（基于玩家数量）
        this.calculateUptime();

        // 计算平均延迟（基于玩家列表）
        this.calculateAveragePing();

        // 更新显示
        this.updateDisplay();

        console.log('✅ 服务器状态更新完成:', {
            status: this.serverData.status,
            players: `${this.serverData.players.current}/${this.serverData.players.max}`,
            hostname: this.serverData.hostname,
            version: this.serverData.version
        });
    }

    // 计算在线率
    calculateUptime() {
        const currentPlayers = this.serverData.players.current;
        const maxPlayers = this.serverData.players.max;

        if (maxPlayers <= 0) {
            this.serverData.uptime = '0%';
            console.log(`📊 在线率计算: 最大玩家数无效，在线率0%`);
            return;
        }

        // 基于玩家数量计算在线率
        const playerUptime = (currentPlayers / maxPlayers) * 100;

        // 根据服务器状态调整在线率
        let adjustedUptime = playerUptime;

        if (this.serverData.status === 'online') {
            // 服务器在线，确保在线率至少为1%
            adjustedUptime = Math.max(1.0, playerUptime);
        } else if (this.serverData.status === 'offline') {
            // 服务器离线，在线率为0%
            adjustedUptime = 0;
        } else {
            // 其他状态（如重启中），在线率为0%
            adjustedUptime = 0;
        }

        // 如果服务器离线或重启中，强制在线率为0%
        if (this.serverData.status === 'offline' || this.serverData.hostname.includes('重启中')) {
            adjustedUptime = 0;
        }

        // 格式化在线率，保留1位小数
        this.serverData.uptime = `${adjustedUptime.toFixed(1)}%`;

        console.log(`📊 在线率计算: 玩家${currentPlayers}/${maxPlayers}，服务器状态${this.serverData.status}，在线率${this.serverData.uptime}`);
    }

    // 计算平均延迟
    calculateAveragePing() {
        if (!this.serverData.playersList || this.serverData.playersList.length === 0) {
            this.serverData.ping = '--';
            return;
        }

        // 计算所有玩家的平均延迟
        const totalPing = this.serverData.playersList.reduce((sum, player) => {
            return sum + (player.ping || 0);
        }, 0);

        const averagePing = Math.round(totalPing / this.serverData.playersList.length);
        this.serverData.ping = `${averagePing}ms`;

        console.log(`📊 平均延迟计算: ${this.serverData.playersList.length}名玩家，总延迟${totalPing}ms，平均${averagePing}ms`);
    }

    // 设置离线状态
    setOfflineStatus() {
        this.serverData.status = 'offline';
        this.serverData.players.current = 0;
        this.serverData.uptime = '0%';
        this.serverData.ping = '--';
        this.serverData.playersList = [];
        this.serverData.hostname = '幻境 FiveM服务器 (离线)';
        this.updateDisplay();

        console.log('⚠️ 服务器状态设置为离线');
    }

    // 设置重启中状态
    setRestartingStatus() {
        this.serverData.status = 'offline'; // 使用offline状态，但显示重启中
        this.serverData.players.current = 0;
        this.serverData.uptime = '0%';
        this.serverData.ping = '--';
        this.serverData.playersList = [];
        this.serverData.hostname = '幻境 FiveM服务器 (重启中)';
        this.updateDisplay();

        console.log('🔄 服务器状态设置为重启中');
    }

    // 更新显示
    updateDisplay() {
        // 更新状态指示器
        this.updateStatusIndicator();

        // 更新状态卡片
        this.updateStatusCard();

        // 更新连接信息
        this.updateConnectInfo();

        // 更新玩家列表
        this.updatePlayersList();
    }

    // 更新状态指示器
    updateStatusIndicator() {
        const statusIndicator = document.querySelector('.status-indicator');
        if (statusIndicator) {
            const statusDot = statusIndicator.querySelector('.status-dot');
            const statusText = statusIndicator.querySelector('.status-text');

            if (statusDot) {
                // 检查是否显示重启中状态
                if (this.serverData.hostname.includes('重启中')) {
                    statusDot.className = 'status-dot restarting';
                } else {
                    statusDot.className = `status-dot ${this.serverData.status}`;
                }
            }

            if (statusText) {
                // 检查是否显示重启中状态
                if (this.serverData.hostname.includes('重启中')) {
                    statusText.textContent = '重启中';
                } else {
                    const statusTexts = {
                        online: '在线',
                        warning: '警告',
                        offline: '离线'
                    };
                    statusText.textContent = statusTexts[this.serverData.status] || '未知';
                }
            }
        }
    }

    // 更新状态卡片
    updateStatusCard() {
        const statusCard = document.querySelector('.server-status-card');
        if (statusCard) {
            // 更新玩家数量
            const playerElements = statusCard.querySelectorAll('.server-info-value');
            playerElements.forEach(element => {
                if (element.textContent.includes('/')) {
                    element.textContent = `${this.serverData.players.current}/${this.serverData.players.max}`;
                }
            });

            // 更新在线率
            const uptimeElements = statusCard.querySelectorAll('.server-info-value');
            uptimeElements.forEach(element => {
                if (element.textContent.includes('%')) {
                    element.textContent = this.serverData.uptime;
                }
            });

            // 更新延迟 - 修复：直接通过索引更新
            const allValues = statusCard.querySelectorAll('.server-info-value');
            if (allValues.length >= 3) {
                // 第三个元素是平均延迟
                allValues[2].textContent = this.serverData.ping;
            }

            // 更新版本 - 修复：直接通过索引更新
            if (allValues.length >= 4) {
                // 第四个元素是服务器版本
                allValues[3].textContent = this.serverData.version;
            }

            // 更新最近更新时间
            const lastUpdateElement = statusCard.querySelector('.last-update-time');
            if (lastUpdateElement) {
                lastUpdateElement.innerHTML = `<i class="fas fa-sync-alt"></i> 最近更新: ${this.formatUpdateTime()}`;
            }

            // 更新在线玩家数量
            const onlinePlayersTitle = statusCard.querySelector('.online-players-section h4');
            if (onlinePlayersTitle) {
                onlinePlayersTitle.innerHTML = `<i class="fas fa-users"></i> 在线玩家 (${this.serverData.players.current})`;
            }
        }
    }

    // 更新连接信息
    updateConnectInfo() {
        const versionElements = document.querySelectorAll('.connect-info-value');
        versionElements.forEach(element => {
            if (element.textContent.includes('v')) {
                element.textContent = this.serverData.version;
            }
        });

        // 更新在线状态
        const onlineElements = document.querySelectorAll('.connect-info-value');
        onlineElements.forEach(element => {
            if (element.textContent === '在线' || element.textContent === '离线') {
                element.textContent = this.serverData.status === 'online' ? '在线' : '离线';
            }
        });
    }

    // 更新玩家列表
    updatePlayersList() {
        const playersListContainer = document.querySelector('.online-players-list');
        if (!playersListContainer) return;

        if (this.serverData.playersList.length === 0) {
            playersListContainer.innerHTML = '<div class="no-players">暂无在线玩家</div>';
            return;
        }

        const playersHTML = this.serverData.playersList.map(player => `
                     <div class="player-item">
                <div class="player-info">
                    <span class="player-name">${player.name}</span>
                         <span class="player-id">#${player.id}</span>
                </div>
                <div class="player-ping ping-${player.pingStatus}">
                    ${player.ping}ms
                </div>
                     </div>
        `).join('');

        playersListContainer.innerHTML = playersHTML;
    }

    // 创建服务器状态卡片
    createServerStatusCard() {
        const statusSection = document.querySelector('#connect');
        if (!statusSection) return;

        // 检查是否已存在
        if (document.querySelector('.server-status-card')) {
            return;
        }

        const statusCard = document.createElement('div');
        statusCard.className = 'server-status-card';
        statusCard.innerHTML = `
            <h3><i class="fas fa-chart-line"></i> 实时状态</h3>
            <div class="server-info-grid">
                <div class="server-info-item">
                    <div class="server-info-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="server-info-label">在线玩家</div>
                    <div class="server-info-value">${this.serverData.players.current}/${this.serverData.players.max}</div>
                </div>
                <div class="server-info-item">
                    <div class="server-info-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="server-info-label">在线率</div>
                    <div class="server-info-value">${this.serverData.uptime}</div>
                </div>
                <div class="server-info-item">
                    <div class="server-info-icon">
                        <i class="fas fa-signal"></i>
                    </div>
                    <div class="server-info-label">平均延迟</div>
                    <div class="server-info-value">${this.serverData.ping}</div>
                </div>
                <div class="server-info-item">
                    <div class="server-info-icon">
                        <i class="fas fa-code-branch"></i>
                    </div>
                    <div class="server-info-label">服务器版本</div>
                    <div class="server-info-value">${this.serverData.version}</div>
                </div>
            </div>
            <div class="last-update-time">
                <i class="fas fa-sync-alt"></i> 最近更新: ${this.formatUpdateTime()}
            </div>
            <div class="online-players-section">
                <h4><i class="fas fa-users"></i> 在线玩家 (${this.serverData.players.current})</h4>
                <div class="online-players-list">
                    <div class="no-players">加载中...</div>
                </div>
                     </div>
                 `;

        // 插入到连接信息后面
        const connectGrid = statusSection.querySelector('.connect-grid');
        if (connectGrid) {
            connectGrid.parentNode.insertBefore(statusCard, connectGrid.nextSibling);
        }
    }

    // 开始自动更新
    startAutoUpdate() {
        // 每60秒更新一次（减少频率）
        this.updateInterval = setInterval(() => {
            this.updateServerData();
        }, 60000);

        console.log('🔄 服务器状态自动更新已启动，60秒更新一次');
    }

    // 停止自动更新
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('⏹️ 服务器状态自动更新已停止');
        }
    }

    // 手动更新
    forceUpdate() {
        this.updateServerData();
    }

    // 格式化更新时间
    formatUpdateTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    // 销毁组件
    destroy() {
        this.stopAutoUpdate();
        console.log('🗑️ 服务器状态组件已销毁');
    }
}

// 创建全局实例
window.serverStatusManager = new ServerStatusManager();

// 导出函数供全局使用
window.updateServerStatus = () => window.serverStatusManager.forceUpdate();
window.initServerStatus = () => window.serverStatusManager.init();

// 延迟初始化服务器状态组件（性能优化）
document.addEventListener('DOMContentLoaded', function () {
    // 延迟2秒初始化，避免阻塞页面渲染
    setTimeout(() => {
        if (!window.serverStatusManager) {
            window.serverStatusManager = new ServerStatusManager();
        }
    }, 2000);
});
