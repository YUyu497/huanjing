/**
 * 复制成功提示管理器
 * 管理复制操作后的成功提示显示
 */
class CopyNotificationManager {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 3; // 最多同时显示3个提示
        this.isInitialized = false;
        this.init();
    }

    /**
     * 初始化提示管理器
     */
    init() {
        if (this.isInitialized) return;

        console.log('🚀 复制提示管理器初始化');
        this.isInitialized = true;
    }

    /**
     * 显示复制成功提示
     * @param {string} message - 提示消息
     * @param {string} type - 提示类型 (success, info, warning, error)
     * @param {number} duration - 显示时长(毫秒)
     */
    show(message, type = 'success', duration = 3000) {
        // 限制同时显示的提示数量
        if (this.notifications.length >= this.maxNotifications) {
            this.removeOldest();
        }

        const notification = this.createNotification(message, type);
        this.notifications.push(notification);

        // 添加到页面
        document.body.appendChild(notification);

        // 显示动画
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // 自动关闭
        if (duration > 0) {
            setTimeout(() => {
                this.hide(notification);
            }, duration);
        }

        console.log(`✅ 显示${type}提示: ${message}`);
        return notification;
    }

    /**
     * 创建提示元素
     */
    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `copy-notification copy-notification-${type}`;

        // 根据类型设置不同的图标和颜色
        const iconMap = {
            success: 'fas fa-check-circle',
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-times-circle'
        };

        const colorMap = {
            success: 'linear-gradient(135deg, #10B981, #059669)',
            info: 'linear-gradient(135deg, #3B82F6, #2563EB)',
            warning: 'linear-gradient(135deg, #F59E0B, #D97706)',
            error: 'linear-gradient(135deg, #EF4444, #DC2626)'
        };

        notification.style.background = colorMap[type] || colorMap.success;

        notification.innerHTML = `
            <i class="${iconMap[type] || iconMap.success} icon"></i>
            <span class="message">${message}</span>
            <button class="close-btn" aria-label="关闭提示">
                <i class="fas fa-times"></i>
            </button>
        `;

        // 绑定关闭按钮事件
        const closeBtn = notification.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            this.hide(notification);
        });

        return notification;
    }

    /**
     * 隐藏指定提示
     */
    hide(notification) {
        if (!notification || !notification.parentNode) return;

        notification.classList.remove('show');
        notification.classList.add('hide');

        // 动画结束后移除元素
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
                this.notifications = this.notifications.filter(n => n !== notification);
            }
        }, 400);
    }

    /**
     * 移除最旧的提示
     */
    removeOldest() {
        if (this.notifications.length > 0) {
            const oldest = this.notifications.shift();
            this.hide(oldest);
        }
    }

    /**
     * 隐藏所有提示
     */
    hideAll() {
        this.notifications.forEach(notification => {
            this.hide(notification);
        });
    }

    /**
     * 显示复制成功提示（快捷方法）
     */
    showCopySuccess(text = '连接信息已复制到剪贴板') {
        return this.show(text, 'success', 2500);
    }

    /**
     * 显示复制失败提示（快捷方法）
     */
    showCopyError(text = '复制失败，请手动复制') {
        return this.show(text, 'error', 4000);
    }

    /**
     * 销毁管理器
     */
    destroy() {
        this.hideAll();
        this.notifications = [];
        this.isInitialized = false;
        console.log('🗑️ 复制提示管理器已销毁');
    }
}

// 创建全局实例
window.HuanjingCopyNotification = new CopyNotificationManager();

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CopyNotificationManager;
}
