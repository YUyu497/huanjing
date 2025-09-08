/**
 * 页面加载动画管理器
 * 控制页面元素的淡入动画效果
 */
class PageLoader {
    constructor() {
        this.animatedElements = [];
        this.isInitialized = false;
        this.observer = null;
        this.init();
    }

    /**
     * 初始化页面加载动画
     */
    init() {
        if (this.isInitialized) return;

        console.log('🎬 页面加载动画管理器初始化');

        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupAnimations());
        } else {
            this.setupAnimations();
        }

        this.isInitialized = true;
    }

    /**
     * 设置动画
     */
    setupAnimations() {
        // 查找所有需要动画的元素
        this.findAnimatedElements();

        // 设置Intersection Observer
        this.setupIntersectionObserver();

        // 立即触发首屏动画
        this.triggerInitialAnimations();

        console.log('✅ 页面加载动画设置完成');
    }

    /**
     * 查找需要动画的元素
     */
    findAnimatedElements() {
        // 查找所有带有动画类的元素
        const selectors = [
            '.fade-in-up',
            '.fade-in-left',
            '.fade-in-right',
            '.fade-in-scale'
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                this.animatedElements.push({
                    element: element,
                    hasAnimated: false
                });
            });
        });

        console.log(`🎯 找到 ${this.animatedElements.length} 个需要动画的元素`);
    }

    /**
     * 设置Intersection Observer
     */
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            // 降级处理：直接显示所有元素
            this.showAllElements();
            return;
        }

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // 观察所有动画元素
        this.animatedElements.forEach(item => {
            this.observer.observe(item.element);
        });
    }

    /**
     * 触发首屏动画
     */
    triggerInitialAnimations() {
        // 获取视口高度
        const viewportHeight = window.innerHeight;

        // 立即显示首屏内的元素
        this.animatedElements.forEach((item, index) => {
            const rect = item.element.getBoundingClientRect();
            if (rect.top < viewportHeight) {
                // 添加延迟，创造波浪效果
                setTimeout(() => {
                    this.animateElement(item.element);
                }, index * 100);
            }
        });
    }

    /**
     * 为单个元素添加动画
     */
    animateElement(element) {
        const item = this.animatedElements.find(item => item.element === element);
        if (item && !item.hasAnimated) {
            element.classList.add('animate-in');
            item.hasAnimated = true;

            // 添加动画完成后的处理
            element.addEventListener('transitionend', () => {
                element.style.transition = 'none';
            }, { once: true });
        }
    }

    /**
     * 显示所有元素（降级处理）
     */
    showAllElements() {
        this.animatedElements.forEach(item => {
            item.element.classList.add('animate-in');
            item.hasAnimated = true;
        });
    }

    /**
     * 手动触发元素动画
     */
    triggerAnimation(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            this.animateElement(element);
        });
    }

    /**
     * 重置所有动画
     */
    resetAnimations() {
        this.animatedElements.forEach(item => {
            item.element.classList.remove('animate-in');
            item.hasAnimated = false;
        });

        // 重新设置观察器
        if (this.observer) {
            this.observer.disconnect();
        }
        this.setupIntersectionObserver();
    }

    /**
     * 销毁动画管理器
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.animatedElements = [];
        this.isInitialized = false;
        console.log('🗑️ 页面加载动画管理器已销毁');
    }
}

// 创建全局实例
window.HuanjingPageLoader = new PageLoader();

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageLoader;
}
