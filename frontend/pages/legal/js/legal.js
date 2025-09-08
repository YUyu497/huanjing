// 法律页面通用JavaScript

class LegalPageManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('📄 初始化法律页面管理器');
        this.initScrollSpy();
        this.initBackToTop();
        this.initCookieModal();
        this.initSmoothScroll();
        this.initAOS();
    }

    // 初始化滚动监听
    initScrollSpy() {
        const tocLinks = document.querySelectorAll('.toc-link');
        const sections = document.querySelectorAll('.legal-section');

        if (tocLinks.length === 0 || sections.length === 0) return;

        // 创建Intersection Observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    this.updateActiveTocLink(id);
                }
            });
        }, {
            rootMargin: '-20% 0px -70% 0px'
        });

        // 观察所有章节
        sections.forEach(section => {
            observer.observe(section);
        });

        // 点击目录链接滚动到对应章节
        tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - 100;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // 更新活跃的目录链接
    updateActiveTocLink(activeId) {
        const tocLinks = document.querySelectorAll('.toc-link');
        
        tocLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${activeId}`) {
                link.classList.add('active');
            }
        });
    }

    // 初始化返回顶部按钮
    initBackToTop() {
        const backToTopBtn = document.getElementById('backToTop');
        
        if (!backToTopBtn) return;

        // 监听滚动事件
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        // 点击返回顶部
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 初始化Cookie设置弹窗
    initCookieModal() {
        const cookieSettingsBtn = document.getElementById('cookieSettingsBtn');
        const cookieModal = document.getElementById('cookieModal');
        const closeModal = document.getElementById('closeCookieModal');
        const savePreferencesBtn = document.getElementById('saveCookiePreferences');
        const rejectAllBtn = document.getElementById('rejectAllCookies');

        if (!cookieSettingsBtn || !cookieModal) return;

        // 打开弹窗
        cookieSettingsBtn.addEventListener('click', () => {
            this.loadCookiePreferences();
            cookieModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        });

        // 关闭弹窗
        const closeModalHandler = () => {
            cookieModal.classList.remove('show');
            document.body.style.overflow = '';
        };

        closeModal.addEventListener('click', closeModalHandler);
        
        // 点击背景关闭弹窗
        cookieModal.addEventListener('click', (e) => {
            if (e.target === cookieModal) {
                closeModalHandler();
            }
        });

        // ESC键关闭弹窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && cookieModal.classList.contains('show')) {
                closeModalHandler();
            }
        });

        // 保存偏好设置
        if (savePreferencesBtn) {
            savePreferencesBtn.addEventListener('click', () => {
                this.saveCookiePreferences();
                closeModalHandler();
                this.showNotification('Cookie偏好设置已保存', 'success');
            });
        }

        // 拒绝所有Cookie
        if (rejectAllBtn) {
            rejectAllBtn.addEventListener('click', () => {
                this.rejectAllCookies();
                closeModalHandler();
                this.showNotification('已拒绝所有可选Cookie', 'info');
            });
        }
    }

    // 加载Cookie偏好设置
    loadCookiePreferences() {
        const preferences = this.getCookiePreferences();
        
        // 更新开关状态
        const functionalCookies = document.getElementById('functionalCookies');
        const analyticsCookies = document.getElementById('analyticsCookies');
        const marketingCookies = document.getElementById('marketingCookies');

        if (functionalCookies) {
            functionalCookies.checked = preferences.functional;
        }
        if (analyticsCookies) {
            analyticsCookies.checked = preferences.analytics;
        }
        if (marketingCookies) {
            marketingCookies.checked = preferences.marketing;
        }
    }

    // 保存Cookie偏好设置
    saveCookiePreferences() {
        const functionalCookies = document.getElementById('functionalCookies');
        const analyticsCookies = document.getElementById('analyticsCookies');
        const marketingCookies = document.getElementById('marketingCookies');

        const preferences = {
            functional: functionalCookies ? functionalCookies.checked : false,
            analytics: analyticsCookies ? analyticsCookies.checked : false,
            marketing: marketingCookies ? marketingCookies.checked : false,
            timestamp: Date.now()
        };

        localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
        
        // 应用Cookie设置
        this.applyCookieSettings(preferences);
    }

    // 拒绝所有可选Cookie
    rejectAllCookies() {
        const preferences = {
            functional: false,
            analytics: false,
            marketing: false,
            timestamp: Date.now()
        };

        localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
        this.applyCookieSettings(preferences);
    }

    // 获取Cookie偏好设置
    getCookiePreferences() {
        const stored = localStorage.getItem('cookiePreferences');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('解析Cookie偏好设置失败:', e);
            }
        }
        
        // 默认设置
        return {
            functional: true,
            analytics: false,
            marketing: false,
            timestamp: Date.now()
        };
    }

    // 应用Cookie设置
    applyCookieSettings(preferences) {
        console.log('🍪 应用Cookie设置:', preferences);
        
        // 这里可以根据偏好设置来控制Cookie的使用
        // 例如：启用/禁用分析工具、功能Cookie等
        
        if (!preferences.analytics) {
            // 禁用分析Cookie
            this.disableAnalytics();
        }
        
        if (!preferences.functional) {
            // 禁用功能Cookie
            this.disableFunctional();
        }
        
        if (!preferences.marketing) {
            // 禁用营销Cookie
            this.disableMarketing();
        }
    }

    // 禁用分析Cookie
    disableAnalytics() {
        console.log('📊 禁用分析Cookie');
        // 这里可以添加禁用Google Analytics等分析工具的代码
    }

    // 禁用功能Cookie
    disableFunctional() {
        console.log('⚙️ 禁用功能Cookie');
        // 这里可以添加禁用功能Cookie的代码
    }

    // 禁用营销Cookie
    disableMarketing() {
        console.log('📢 禁用营销Cookie');
        // 这里可以添加禁用营销Cookie的代码
    }

    // 初始化平滑滚动
    initSmoothScroll() {
        // 为所有内部链接添加平滑滚动
        const internalLinks = document.querySelectorAll('a[href^="#"]');
        
        internalLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const offsetTop = target.offsetTop - 100;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // 初始化AOS动画
    initAOS() {
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                easing: 'ease-out-cubic',
                once: true,
                offset: 100
            });
        }
    }

    // 显示通知
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;

        // 添加到页面
        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 获取通知图标
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // 获取通知颜色
    getNotificationColor(type) {
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            warning: '#ed8936',
            info: '#4299e1'
        };
        return colors[type] || '#4299e1';
    }

    // 复制文本到剪贴板
    copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        } else {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                return Promise.resolve();
            } catch (err) {
                return Promise.reject(err);
            } finally {
                document.body.removeChild(textArea);
            }
        }
    }

    // 格式化日期
    formatDate(date) {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(date).toLocaleDateString('zh-CN', options);
    }

    // 检查是否为移动设备
    isMobile() {
        return window.innerWidth <= 768;
    }

    // 处理移动端特殊逻辑
    handleMobileFeatures() {
        if (this.isMobile()) {
            // 移动端特殊处理
            this.initMobileMenu();
            this.optimizeForMobile();
        }
    }

    // 初始化移动端菜单
    initMobileMenu() {
        const menuToggle = document.querySelector('.menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');
        
        if (menuToggle && mobileMenu) {
            menuToggle.addEventListener('click', () => {
                mobileMenu.classList.toggle('active');
                menuToggle.classList.toggle('active');
            });
        }
    }

    // 移动端优化
    optimizeForMobile() {
        // 调整字体大小
        const legalText = document.querySelector('.legal-text');
        if (legalText) {
            legalText.style.fontSize = '16px';
        }

        // 调整间距
        const sections = document.querySelectorAll('.legal-section');
        sections.forEach(section => {
            section.style.marginBottom = '30px';
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 法律页面加载完成');
    
    // 初始化法律页面管理器
    window.legalPageManager = new LegalPageManager();
    
    // 处理移动端特性
    window.legalPageManager.handleMobileFeatures();
    
    // 检查Cookie偏好设置
    const preferences = window.legalPageManager.getCookiePreferences();
    if (preferences.timestamp) {
        console.log('🍪 已加载Cookie偏好设置:', preferences);
    }
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (window.legalPageManager) {
        // 清理资源
        console.log('📄 清理法律页面资源');
    }
});

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LegalPageManager;
}
