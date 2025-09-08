const ServerStatusModel = require('../models/server-status');

class CleanupTask {
    constructor() {
        this.cleanupInterval = null;
        this.isRunning = false;
    }

    /**
     * 启动定时清理任务
     */
    start() {
        if (this.cleanupInterval) {
            console.log('⚠️ 清理任务已在运行中');
            return;
        }

        // 每天凌晨2点执行清理任务
        this.cleanupInterval = setInterval(async () => {
            const now = new Date();
            if (now.getHours() === 2 && now.getMinutes() === 0) {
                await this.performCleanup();
            }
        }, 60000); // 每分钟检查一次

        console.log('🔄 定时清理任务已启动，每天凌晨2点执行');
    }

    /**
     * 停止定时清理任务
     */
    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            console.log('⏹️ 定时清理任务已停止');
        }
    }

    /**
     * 执行清理任务
     */
    async performCleanup() {
        if (this.isRunning) {
            console.log('⚠️ 清理任务正在运行中，跳过本次执行');
            return;
        }

        this.isRunning = true;
        console.log('🧹 开始执行定时清理任务...');

        try {
            // 清理30天前的历史记录
            const deletedCount = await ServerStatusModel.cleanupOldHistory(30);
            console.log(`✅ 定时清理完成，删除了${deletedCount}条旧记录`);

            // 可以在这里添加其他清理任务
            // 比如清理过期的会话、日志等

        } catch (error) {
            console.error('❌ 定时清理任务执行失败:', error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * 立即执行一次清理
     */
    async cleanupNow() {
        console.log('🧹 立即执行清理任务...');
        await this.performCleanup();
    }
}

// 创建全局实例
const cleanupTask = new CleanupTask();

// 导出实例和类
module.exports = {
    cleanupTask,
    CleanupTask
};
