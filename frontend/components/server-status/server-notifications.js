// 服务器通知组件 - 显示FiveM服务器实时事件

class ServerNotifications {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.maxNotifications = 5;
        // 延迟初始化，避免阻塞页面渲染
        setTimeout(() => {
            this.init();
        }, 1500);
    }

    init() {
        console.log('🔔 初始化服务器通知组件');
        this.createNotificationContainer();
        this.startMonitoring();
        console.log('✅ 服务器通知组件初始化完成');
    }

    // 创建通知容器
    createNotificationContainer() {
        // 检查是否已存在
        if (document.getElementById('server-notifications')) {
            return;
        }

        this.container = document.createElement('div');
        this.container.id = 'server-notifications';
        this.container.className = 'server-notifications';

        document.body.appendChild(this.container);
        console.log('🔔 通知容器已创建');
    }

    // 开始监控服务器状态变化
    startMonitoring() {
        // 每30秒检查一次服务器状态变化
        setInterval(() => {
            this.checkServerStatusChanges();
        }, 30000);

        // 监听页面可见性变化，当页面重新可见时更新状态
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkServerStatusChanges();
            }
        });
    }

    // 检查服务器状态变化
    async checkServerStatusChanges() {
        try {
            const response = await fetch('/api/server-status/comprehensive');
            if (!response.ok) return;

            const data = await response.json();
            if (!data.success) return;

            const currentStatus = data.data.status;
            const currentPlayers = data.data.serverInfo?.clients || 0;

            // 检查状态变化
            if (this.lastStatus && this.lastStatus !== currentStatus) {
                this.showStatusChangeNotification(this.lastStatus, currentStatus);
            }

            // 检查玩家数量变化
            if (this.lastPlayerCount !== undefined) {
                const playerDiff = currentPlayers - this.lastPlayerCount;
                if (Math.abs(playerDiff) >= 5) { // 玩家数量变化超过5人时显示通知
                    this.showPlayerCountNotification(playerDiff, currentPlayers);
                }
            }

            // 更新记录的状态
            this.lastStatus = currentStatus;
            this.lastPlayerCount = currentPlayers;

        } catch (error) {
            console.warn('🔔 检查服务器状态变化失败:', error);
        }
    }

    // 显示状态变化通知
    showStatusChangeNotification(oldStatus, newStatus) {
        const statusTexts = {
            online: '在线',
            warning: '警告',
            offline: '离线'
        };

        const oldText = statusTexts[oldStatus] || oldStatus;
        const newText = statusTexts[newStatus] || newStatus;

        let message = '';
        let type = 'info';

        if (newStatus === 'online') {
            message = `🎉 服务器已上线！`;
            type = 'success';
        } else if (newStatus === 'offline') {
            message = `⚠️ 服务器已离线`;
            type = 'error';
        } else if (newStatus === 'warning') {
            message = `⚠️ 服务器状态异常`;
            type = 'warning';
        }

        this.addNotification(message, type);
    }

    // 显示玩家数量变化通知
    showPlayerCountNotification(playerDiff, currentPlayers) {
        let message = '';
        let type = 'info';

        if (playerDiff > 0) {
            message = `👥 ${playerDiff} 名玩家加入服务器 (当前: ${currentPlayers}人)`;
            type = 'success';
        } else {
            message = `👋 ${Math.abs(playerDiff)} 名玩家离开服务器 (当前: ${currentPlayers}人)`;
            type = 'info';
        }

        this.addNotification(message, type);
    }

    // 添加通知
    addNotification(message, type = 'info', duration = 5000) {
        const notification = {
            id: Date.now() + Math.random(),
            message,
            type,
            timestamp: new Date(),
            duration
        };

        this.notifications.push(notification);

        // 限制通知数量
        if (this.notifications.length > this.maxNotifications) {
            this.notifications.shift();
        }

        this.renderNotification(notification);
        this.updateNotificationList();

        // 自动移除通知
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, duration);
    }

    // 渲染单个通知
    renderNotification(notification) {
        const notificationElement = document.createElement('div');
        notificationElement.className = `server-notification notification-${notification.type}`;
        notificationElement.dataset.id = notification.id;
        notificationElement.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    ${this.getNotificationIcon(notification.type)}
                </div>
                <div class="notification-message">
                    ${notification.message}
                </div>
                <button class="notification-close" onclick="serverNotifications.removeNotification(${notification.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notification-progress"></div>
        `;

        this.container.appendChild(notificationElement);

        // 添加进入动画
        setTimeout(() => {
            notificationElement.classList.add('show');
        }, 100);

        // 添加进度条动画
        const progressBar = notificationElement.querySelector('.notification-progress');
        if (progressBar) {
            progressBar.style.transition = `width ${notification.duration}ms linear`;
            setTimeout(() => {
                progressBar.style.width = '0%';
            }, 100);
        }
    }

    // 获取通知图标
    getNotificationIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        return icons[type] || icons.info;
    }

    // 移除通知
    removeNotification(id) {
        const notificationElement = this.container.querySelector(`[data-id="${id}"]`);
        if (notificationElement) {
            notificationElement.classList.remove('show');
            setTimeout(() => {
                notificationElement.remove();
            }, 300);
        }

        this.notifications = this.notifications.filter(n => n.id !== id);
        this.updateNotificationList();
    }

    // 更新通知列表
    updateNotificationList() {
        // 这里可以添加通知历史记录功能
        console.log(`🔔 当前通知数量: ${this.notifications.length}`);
    }

    // 显示自定义通知
    show(message, type = 'info', duration = 5000) {
        this.addNotification(message, type, duration);
    }

    // 显示成功通知
    success(message, duration = 5000) {
        this.show(message, 'success', duration);
    }

    // 显示错误通知
    error(message, duration = 5000) {
        this.show(message, 'error', duration);
    }

    // 显示警告通知
    warning(message, duration = 5000) {
        this.show(message, 'warning', duration);
    }

    // 显示信息通知
    info(message, duration = 5000) {
        this.show(message, 'info', duration);
    }

    // 清除所有通知
    clearAll() {
        this.notifications = [];
        this.container.innerHTML = '';
    }

    // 销毁组件
    destroy() {
        this.clearAll();
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        console.log('🗑️ 服务器通知组件已销毁');
    }
}

// 创建全局实例
window.serverNotifications = new ServerNotifications();

// 导出函数供全局使用
window.showServerNotification = (message, type, duration) => {
    window.serverNotifications.show(message, type, duration);
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    // 组件已在构造函数中自动初始化
});
