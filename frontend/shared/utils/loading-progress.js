/**
 * 页面加载进度条管理器
 * 在页面顶部显示加载进度
 */
class LoadingProgressManager {
    constructor() {
        this.isInitialized = false;
        this.progressBar = null;
        this.currentProgress = 0;
        this.targetProgress = 100;
        this.animationSpeed = 2; // 进度条动画速度
        this.isLoading = false;
        this.init();
    }

    init() {
        if (this.isInitialized) return;

        console.log('📊 页面加载进度条管理器初始化');
        this.createProgressBar();
        this.bindEvents();
        this.isInitialized = true;
        console.log('✅ 页面加载进度条管理器初始化完成');
    }

    // 创建进度条
    createProgressBar() {
        // 创建进度条容器
        this.progressBar = document.createElement('div');
        this.progressBar.id = 'loading-progress';
        this.progressBar.className = 'loading-progress';

        // 创建进度条填充元素
        const progressFill = document.createElement('div');
        progressFill.className = 'loading-progress-fill';

        // 创建进度条标签
        const progressLabel = document.createElement('div');
        progressLabel.className = 'loading-progress-label';
        progressLabel.textContent = '页面加载中...';

        // 组装进度条
        this.progressBar.appendChild(progressFill);
        this.progressBar.appendChild(progressLabel);

        // 添加到页面
        document.body.appendChild(this.progressBar);

        console.log('📊 页面加载进度条已创建');
    }

    // 绑定事件
    bindEvents() {
        // 页面加载完成事件
        window.addEventListener('load', () => {
            this.completeLoading();
        });

        // DOM内容加载完成事件
        document.addEventListener('DOMContentLoaded', () => {
            this.startLoading();
        });

        // 页面可见性变化事件
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.resumeLoading();
            } else {
                this.pauseLoading();
            }
        });

        // 页面卸载事件
        window.addEventListener('beforeunload', () => {
            this.resetProgress();
        });
    }

    // 开始加载
    startLoading() {
        if (this.isLoading) return;

        console.log('📊 开始页面加载进度');
        this.isLoading = true;
        this.currentProgress = 0;
        this.targetProgress = 100;

        // 显示进度条
        this.showProgressBar();

        // 开始进度动画
        this.animateProgress();
    }

    // 动画进度
    animateProgress() {
        if (!this.isLoading) return;

        // 模拟真实的加载进度
        if (this.currentProgress < 30) {
            // 初始阶段：快速加载到30%
            this.currentProgress += this.animationSpeed * 2;
        } else if (this.currentProgress < 70) {
            // 中间阶段：中等速度加载到70%
            this.currentProgress += this.animationSpeed;
        } else if (this.currentProgress < 90) {
            // 后期阶段：慢速加载到90%
            this.currentProgress += this.animationSpeed * 0.5;
        } else if (this.currentProgress < 95) {
            // 最终阶段：很慢加载到95%
            this.currentProgress += this.animationSpeed * 0.2;
        }

        // 更新进度条显示
        this.updateProgress();

        // 继续动画
        if (this.currentProgress < this.targetProgress) {
            requestAnimationFrame(() => this.animateProgress());
        }
    }

    // 更新进度
    updateProgress() {
        if (!this.progressBar) return;

        const progressFill = this.progressBar.querySelector('.loading-progress-fill');
        const progressLabel = this.progressBar.querySelector('.loading-progress-label');

        if (progressFill) {
            progressFill.style.width = `${this.currentProgress}%`;
        }

        if (progressLabel) {
            // 更新标签文本
            if (this.currentProgress < 30) {
                progressLabel.textContent = '初始化页面...';
            } else if (this.currentProgress < 60) {
                progressLabel.textContent = '加载资源...';
            } else if (this.currentProgress < 80) {
                progressLabel.textContent = '渲染内容...';
            } else if (this.currentProgress < 95) {
                progressLabel.textContent = '完成加载...';
            } else {
                progressLabel.textContent = '加载完成！';
            }
        }

        // 添加进度类
        this.progressBar.className = `loading-progress progress-${Math.floor(this.currentProgress / 20) * 20}`;
    }

    // 完成加载
    completeLoading() {
        console.log('📊 页面加载完成');
        this.currentProgress = 100;
        this.updateProgress();

        // 延迟隐藏进度条
        setTimeout(() => {
            this.hideProgressBar();
            this.isLoading = false;
        }, 1000);
    }

    // 显示进度条
    showProgressBar() {
        if (this.progressBar) {
            this.progressBar.classList.add('show');
        }
    }

    // 隐藏进度条
    hideProgressBar() {
        if (this.progressBar) {
            this.progressBar.classList.remove('show');
        }
    }

    // 暂停加载
    pauseLoading() {
        if (this.isLoading) {
            console.log('📊 页面加载已暂停');
            this.isLoading = false;
        }
    }

    // 恢复加载
    resumeLoading() {
        if (!this.isLoading && this.currentProgress < 100) {
            console.log('📊 页面加载已恢复');
            this.isLoading = true;
            this.animateProgress();
        }
    }

    // 重置进度
    resetProgress() {
        this.currentProgress = 0;
        this.targetProgress = 100;
        this.isLoading = false;
        this.updateProgress();
    }

    // 设置进度
    setProgress(progress) {
        if (progress < 0 || progress > 100) return;

        this.currentProgress = progress;
        this.updateProgress();

        if (progress >= 100) {
            this.completeLoading();
        }
    }

    // 获取当前进度
    getCurrentProgress() {
        return this.currentProgress;
    }

    // 检查是否正在加载
    isLoading() {
        return this.isLoading;
    }

    // 手动开始加载（供外部调用）
    start() {
        this.startLoading();
    }

    // 手动完成加载（供外部调用）
    complete() {
        this.completeLoading();
    }

    // 销毁管理器
    destroy() {
        if (this.progressBar) {
            this.progressBar.remove();
            this.progressBar = null;
        }
        this.isInitialized = false;
        console.log('🗑️ 页面加载进度条管理器已销毁');
    }
}

// 创建全局实例
window.loadingProgressManager = new LoadingProgressManager();

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingProgressManager;
}
