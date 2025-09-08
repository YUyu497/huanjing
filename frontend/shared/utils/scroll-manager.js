/**
 * 滚动管理器
 * 管理返回顶部按钮和滚动进度条
 */
class ScrollManager {
    constructor() {
        this.backToTopBtn = null;
        this.scrollProgressBar = null;
        this.isInitialized = false;
        this.scrollThreshold = 100; // 降低滚动阈值，更容易触发
        this.init();
    }

    /**
     * 初始化滚动管理器
     */
    init() {
        if (this.isInitialized) return;

        console.log('🚀 滚动管理器初始化');

        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupScrollManager());
        } else {
            this.setupScrollManager();
        }

        this.isInitialized = true;
    }

    /**
     * 设置滚动管理器
     */
    setupScrollManager() {
        this.createScrollProgressBar();
        this.createBackToTopButton();
        this.bindScrollEvents();

        console.log('✅ 滚动管理器设置完成');
    }

    /**
     * 创建滚动进度条
     */
    createScrollProgressBar() {
        this.scrollProgressBar = document.createElement('div');
        this.scrollProgressBar.className = 'scroll-progress';
        document.body.appendChild(this.scrollProgressBar);

        console.log('📊 滚动进度条已创建');
    }

    /**
     * 创建返回顶部按钮
     */
    createBackToTopButton() {
        this.backToTopBtn = document.createElement('button');
        this.backToTopBtn.className = 'back-to-top';
        this.backToTopBtn.innerHTML = '<i class="fas fa-arrow-up icon"></i>';
        this.backToTopBtn.setAttribute('aria-label', '返回顶部');
        this.backToTopBtn.setAttribute('title', '返回顶部');

        // 添加点击事件
        this.backToTopBtn.addEventListener('click', () => this.scrollToTop());

        document.body.appendChild(this.backToTopBtn);

        console.log('⬆️ 返回顶部按钮已创建');
    }

    /**
     * 绑定滚动事件
     */
    bindScrollEvents() {
        // 使用节流函数优化滚动性能
        const throttledScrollHandler = this.throttle(() => {
            this.handleScroll();
        }, 16); // 约60fps

        window.addEventListener('scroll', throttledScrollHandler, { passive: true });

        // 窗口大小改变时重新计算
        window.addEventListener('resize', () => {
            this.updateScrollProgress();
        });

        console.log('🔗 滚动事件已绑定');
    }

    /**
     * 处理滚动事件
     */
    handleScroll() {
        this.updateScrollProgress();
        this.toggleBackToTopButton();

        // 添加调试信息
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop % 200 < 16) { // 每200px记录一次，避免日志过多
            console.log(`📊 滚动位置: ${scrollTop}px, 阈值: ${this.scrollThreshold}px`);
        }
    }

    /**
     * 更新滚动进度条
     */
    updateScrollProgress() {
        if (!this.scrollProgressBar) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / scrollHeight) * 100;

        this.scrollProgressBar.style.width = `${scrollPercent}%`;
    }

    /**
     * 切换返回顶部按钮显示状态
     */
    toggleBackToTopButton() {
        if (!this.backToTopBtn) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > this.scrollThreshold) {
            this.showBackToTopButton();
        } else {
            this.hideBackToTopButton();
        }
    }

    /**
     * 显示返回顶部按钮
     */
    showBackToTopButton() {
        if (!this.backToTopBtn) return;

        if (!this.backToTopBtn.classList.contains('show')) {
            console.log('⬆️ 显示返回顶部按钮');
            this.backToTopBtn.classList.remove('hide');
            this.backToTopBtn.classList.add('show');
            this.backToTopBtn.style.display = 'flex';
            this.backToTopBtn.style.opacity = '1';
            this.backToTopBtn.style.visibility = 'visible';
        }
    }

    /**
     * 隐藏返回顶部按钮
     */
    hideBackToTopButton() {
        if (!this.backToTopBtn) return;

        if (this.backToTopBtn.classList.contains('show')) {
            console.log('⬇️ 隐藏返回顶部按钮');
            this.backToTopBtn.classList.remove('show');
            this.backToTopBtn.classList.add('hide');

            // 立即隐藏，不使用动画
            this.backToTopBtn.style.display = 'none';
            this.backToTopBtn.style.opacity = '0';
            this.backToTopBtn.style.visibility = 'hidden';
        }
    }

    /**
     * 平滑滚动到顶部
     */
    scrollToTop() {
        const scrollOptions = {
            top: 0,
            behavior: 'smooth'
        };

        // 检查浏览器是否支持平滑滚动
        if ('scrollBehavior' in document.documentElement.style) {
            window.scrollTo(scrollOptions);
        } else {
            // 降级处理：使用传统滚动
            this.smoothScrollToTop();
        }

        // 添加点击反馈
        this.backToTopBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.backToTopBtn.style.transform = '';
        }, 150);
    }

    /**
     * 传统平滑滚动实现（降级处理）
     */
    smoothScrollToTop() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const duration = 500; // 滚动持续时间
        const startTime = performance.now();

        const animateScroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 使用缓动函数
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const newScrollTop = scrollTop * (1 - easeOutCubic);

            window.scrollTo(0, newScrollTop);

            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        };

        requestAnimationFrame(animateScroll);
    }

    /**
     * 节流函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 手动滚动到指定元素
     */
    scrollToElement(selector, offset = 0) {
        const element = document.querySelector(selector);
        if (!element) {
            console.warn(`未找到元素: ${selector}`);
            return;
        }

        const elementTop = element.offsetTop - offset;

        const scrollOptions = {
            top: elementTop,
            behavior: 'smooth'
        };

        if ('scrollBehavior' in document.documentElement.style) {
            window.scrollTo(scrollOptions);
        } else {
            window.scrollTo(0, elementTop);
        }
    }

    /**
     * 获取当前滚动位置
     */
    getScrollPosition() {
        return {
            top: window.pageYOffset || document.documentElement.scrollTop,
            left: window.pageXOffset || document.documentElement.scrollLeft
        };
    }

    /**
     * 检查是否在视口底部
     */
    isAtBottom(threshold = 100) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        return (scrollTop + windowHeight) >= (documentHeight - threshold);
    }

    /**
     * 手动测试按钮显示（调试用）
     */
    testButton() {
        console.log('🧪 测试返回顶部按钮');
        if (this.backToTopBtn) {
            console.log('✅ 按钮元素存在');
            this.showBackToTopButton();
        } else {
            console.log('❌ 按钮元素不存在');
        }
    }

    /**
     * 销毁滚动管理器
     */
    destroy() {
        if (this.backToTopBtn) {
            this.backToTopBtn.remove();
            this.backToTopBtn = null;
        }

        if (this.scrollProgressBar) {
            this.scrollProgressBar.remove();
            this.scrollProgressBar = null;
        }

        this.isInitialized = false;
        console.log('🗑️ 滚动管理器已销毁');
    }
}

// 创建全局实例
window.HuanjingScrollManager = new ScrollManager();

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScrollManager;
}
