/**
 * 页面切换动画管理器
 * 实现导航链接点击时的平滑过渡效果
 */
class PageTransitionManager {
    constructor() {
        this.isInitialized = false;
        this.currentPage = 'home';
        this.isTransitioning = false;
        this.transitionDuration = 600; // 动画持续时间（毫秒）
        this.init();
    }

    init() {
        if (this.isInitialized) return;

        console.log('🎬 页面切换动画管理器初始化');
        this.setupPageTransitions();
        this.bindNavigationEvents();
        this.isInitialized = true;
        console.log('✅ 页面切换动画管理器初始化完成');
    }

    // 设置页面切换动画
    setupPageTransitions() {
        // 为所有页面添加过渡类
        const pages = document.querySelectorAll('section[id]');
        pages.forEach(page => {
            page.classList.add('page-section');
            page.style.transition = `opacity ${this.transitionDuration}ms ease-in-out, transform ${this.transitionDuration}ms ease-in-out`;
        });

        console.log(`🎬 已设置 ${pages.length} 个页面过渡效果`);
    }

    // 绑定导航事件
    bindNavigationEvents() {
        const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.navigateToPage(targetId);
            });
        });

        console.log(`🎬 已绑定 ${navLinks.length} 个导航链接`);
    }

    // 页面导航
    async navigateToPage(targetId) {
        if (this.isTransitioning) {
            console.log('🎬 页面切换中，忽略重复请求');
            return;
        }

        console.log(`🎬 开始切换到页面: ${targetId}`);
        this.isTransitioning = true;

        try {
            // 开始页面切换动画
            await this.startPageTransition(targetId);

            // 更新当前页面
            this.currentPage = targetId;

            // 更新导航链接状态
            this.updateNavigationState(targetId);

            // 滚动到目标页面
            this.scrollToPage(targetId);

            console.log(`✅ 页面切换完成: ${targetId}`);
        } catch (error) {
            console.error('❌ 页面切换失败:', error);
        } finally {
            this.isTransitioning = false;
        }
    }

    // 开始页面切换动画
    async startPageTransition(targetId) {
        return new Promise((resolve) => {
            // 获取当前页面和目标页面
            const currentPage = document.querySelector(`#${this.currentPage}`);
            const targetPage = document.querySelector(`#${targetId}`);

            if (!currentPage || !targetPage) {
                console.warn('⚠️ 页面元素未找到，跳过动画');
                resolve();
                return;
            }

            // 显示加载指示器
            this.showLoadingIndicator();

            // 第一阶段：淡出当前页面
            currentPage.style.opacity = '0';
            currentPage.style.transform = 'translateY(20px)';

            // 等待淡出完成
            setTimeout(() => {
                // 隐藏当前页面
                currentPage.style.display = 'none';

                // 第二阶段：淡入目标页面
                targetPage.style.display = 'block';
                targetPage.style.opacity = '0';
                targetPage.style.transform = 'translateY(20px)';

                // 强制重绘
                targetPage.offsetHeight;

                // 开始淡入动画
                targetPage.style.opacity = '1';
                targetPage.style.transform = 'translateY(0)';

                // 隐藏加载指示器
                this.hideLoadingIndicator();

                // 动画完成
                setTimeout(() => {
                    resolve();
                }, this.transitionDuration);
            }, this.transitionDuration);
        });
    }

    // 显示加载指示器
    showLoadingIndicator() {
        let loader = document.getElementById('page-transition-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'page-transition-loader';
            loader.innerHTML = `
                <div class="loader-content">
                    <div class="loader-spinner"></div>
                    <div class="loader-text">页面加载中...</div>
                </div>
            `;
            document.body.appendChild(loader);
        }

        loader.style.display = 'flex';
        loader.classList.add('show');
    }

    // 隐藏加载指示器
    hideLoadingIndicator() {
        const loader = document.getElementById('page-transition-loader');
        if (loader) {
            loader.classList.remove('show');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }
    }

    // 更新导航状态
    updateNavigationState(targetId) {
        // 移除所有活动状态
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // 添加目标页面的活动状态
        const targetLink = document.querySelector(`.nav-menu a[href="#${targetId}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }
    }

    // 滚动到目标页面
    scrollToPage(targetId) {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = targetElement.offsetTop - navbarHeight - 20;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    // 手动触发页面切换（供外部调用）
    transitionToPage(targetId) {
        this.navigateToPage(targetId);
    }

    // 设置过渡动画时长
    setTransitionDuration(duration) {
        this.transitionDuration = duration;
        console.log(`🎬 页面过渡动画时长已设置为: ${duration}ms`);
    }

    // 获取当前页面
    getCurrentPage() {
        return this.currentPage;
    }

    // 销毁管理器
    destroy() {
        this.isTransitioning = false;
        this.isInitialized = false;
        console.log('🗑️ 页面切换动画管理器已销毁');
    }
}

// 创建全局实例
window.pageTransitionManager = new PageTransitionManager();

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageTransitionManager;
}
