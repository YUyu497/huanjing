// 主JavaScript文件

// 页面初始化
function initPage() {
    const startTime = performance.now();
    console.log('🚀 幻境FiveM服务器页面初始化');

    // 关键初始化（立即执行）
    initAOS();
    checkUserAuth();
    if (typeof initServerStatus === 'function') {
        initServerStatus();
    }
    initNavigation();
    initServerInfo();

    // 使用 requestIdleCallback 延迟非关键初始化
    if ('requestIdleCallback' in window) {
        // 第一优先级：用户交互相关
        requestIdleCallback(() => {
            initInteractions();
            initButtonLoadingAnimations();
        }, { timeout: 500 });

        // 第二优先级：视觉效果
        requestIdleCallback(() => {
            initAnimations();
            initScrollEffects();
        }, { timeout: 1000 });

        // 第三优先级：装饰效果
        requestIdleCallback(() => {
            initParticleEffects();
            initStatNumberAnimations();
        }, { timeout: 2000 });
    } else {
        // 降级方案：更长的延迟
        setTimeout(() => {
            initInteractions();
            initButtonLoadingAnimations();
        }, 300);

        setTimeout(() => {
            initAnimations();
            initScrollEffects();
        }, 800);

        setTimeout(() => {
            initParticleEffects();
            initStatNumberAnimations();
        }, 1500);
    }

    const endTime = performance.now();
    const initTime = endTime - startTime;
    console.log(`✅ 页面初始化完成，耗时: ${initTime.toFixed(2)}ms`);

    // 性能监控
    if (initTime > 100) {
        console.warn(`⚠️ 页面初始化时间较长: ${initTime.toFixed(2)}ms，建议进一步优化`);
    }
}

// 初始化AOS动画库
function initAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            offset: 100,
            delay: 0
        });
        console.log('✅ AOS动画库初始化完成');
    } else {
        console.log('⚠️ AOS库未加载，跳过动画初始化');
    }
}

// 初始化动画
function initAnimations() {
    // 页面加载动画
    const animatedElements = document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right, .fade-in-scale');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

// 初始化滚动效果
function initScrollEffects() {
    // 视差滚动效果（使用防抖优化）
    const parallaxElements = document.querySelectorAll('.hero::before');

    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }

        scrollTimeout = setTimeout(() => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;

            parallaxElements.forEach(el => {
                if (el) {
                    el.style.transform = `translateY(${rate}px)`;
                }
            });
        }, 16); // 约60fps
    });
}

// 初始化交互功能
function initInteractions() {
    // 平滑滚动到顶部
    initBackToTop();

    // 初始化工具提示
    initTooltips();

    // 初始化表单验证
    initFormValidation();
}

// 返回顶部功能
function initBackToTop() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        box-shadow: var(--shadow-medium);
        transition: all 0.3s ease;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
    `;

    document.body.appendChild(backToTopBtn);

    // 显示/隐藏按钮
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.style.display = 'flex';
            setTimeout(() => {
                backToTopBtn.style.opacity = '1';
                backToTopBtn.style.visibility = 'visible';
            }, 100);
        } else {
            backToTopBtn.style.opacity = '0';
            backToTopBtn.style.visibility = 'hidden';
            setTimeout(() => {
                backToTopBtn.style.display = 'none';
            }, 300);
        }
    });

    // 点击返回顶部
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 悬停效果
    backToTopBtn.addEventListener('mouseenter', () => {
        backToTopBtn.style.transform = 'translateY(-3px)';
        backToTopBtn.style.boxShadow = 'var(--shadow-heavy)';
    });

    backToTopBtn.addEventListener('mouseleave', () => {
        backToTopBtn.style.transform = 'translateY(0)';
        backToTopBtn.style.boxShadow = 'var(--shadow-medium)';
    });
}

// 初始化工具提示
function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');

    tooltipElements.forEach(element => {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = element.getAttribute('data-tooltip');
        tooltip.style.cssText = `
            position: absolute;
            background: var(--bg-dark);
            color: var(--text-primary);
            padding: 0.5rem 0.75rem;
            border-radius: var(--border-radius);
            font-size: 0.875rem;
            white-space: nowrap;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-medium);
            pointer-events: none;
        `;

        document.body.appendChild(tooltip);

        element.addEventListener('mouseenter', (e) => {
            const rect = element.getBoundingClientRect();
            tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
            tooltip.style.opacity = '1';
            tooltip.style.visibility = 'visible';
        });

        element.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
        });
    });
}

// 初始化表单验证
function initFormValidation() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // 简单的表单验证
            const inputs = form.querySelectorAll('input[required], textarea[required]');
            let isValid = true;

            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = 'var(--error-color)';

                    // 显示错误提示
                    showFormError(input, '此字段为必填项');
                } else {
                    input.style.borderColor = 'var(--border-color)';
                    hideFormError(input);
                }
            });

            if (isValid) {
                // 表单验证通过，可以提交
                console.log('表单验证通过');
                // 这里可以添加实际的表单提交逻辑
            }
        });
    });
}

// 显示表单错误
function showFormError(input, message) {
    let errorElement = input.parentNode.querySelector('.form-error');

    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'form-error';
        errorElement.style.cssText = `
            color: var(--error-color);
            font-size: 0.875rem;
            margin-top: 0.25rem;
        `;
        input.parentNode.appendChild(errorElement);
    }

    errorElement.textContent = message;
}

// 隐藏表单错误
function hideFormError(input) {
    const errorElement = input.parentNode.querySelector('.form-error');
    if (errorElement) {
        errorElement.remove();
    }
}

// 初始化用户权限系统
function initializeUserPermissions(userData) {
    try {
        // 检查是否已加载用户权限工具
        if (typeof window.userPermissions !== 'undefined') {
            window.userPermissions.setCurrentUser(userData);
            console.log('✅ 用户权限系统初始化完成:', userData.role);

            // 根据用户权限更新界面
            updateUIForUserPermissions(userData);
        } else {
            console.warn('⚠️ 用户权限工具未加载，跳过权限初始化');
        }
    } catch (error) {
        console.error('❌ 初始化用户权限系统失败:', error);
    }
}

// 根据用户权限更新界面
function updateUIForUserPermissions(userData) {
    // 根据用户角色显示/隐藏特定功能
    if (window.userPermissions) {
        // 检查下载权限
        if (window.userPermissions.hasPermission('download_client')) {
            showDownloadFeatures();
        } else {
            hideDownloadFeatures();
        }

        // 检查管理权限
        if (window.userPermissions.hasRoleLevel('admin')) {
            showAdminFeatures();
        } else {
            hideAdminFeatures();
        }

        console.log('✅ 界面权限更新完成');
    }
}

// 显示下载功能
function showDownloadFeatures() {
    const downloadElements = document.querySelectorAll('.download-feature, .download-btn');
    downloadElements.forEach(el => {
        el.style.display = 'block';
    });
}

// 隐藏下载功能
function hideDownloadFeatures() {
    const downloadElements = document.querySelectorAll('.download-feature, .download-btn');
    downloadElements.forEach(el => {
        el.style.display = 'none';
    });
}

// 显示管理功能
function showAdminFeatures() {
    const adminElements = document.querySelectorAll('.admin-feature, .admin-btn');
    adminElements.forEach(el => {
        el.style.display = 'block';
    });
}

// 隐藏管理功能
function hideAdminFeatures() {
    const adminElements = document.querySelectorAll('.admin-feature, .admin-btn');
    adminElements.forEach(el => {
        el.style.display = 'none';
    });
}

// 检查用户登录状态
async function checkUserAuth() {
    // 首先尝试从用户权限工具获取用户信息
    if (window.userPermissions && window.userPermissions.getCurrentUser()) {
        const user = window.userPermissions.getCurrentUser();
        console.log('✅ 从权限工具获取到用户信息:', user.username);
        updateNavigationForLoggedInUser(user);
        updateUIForLoggedInUser();
        return;
    }

    // 然后尝试从localStorage获取用户信息
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            console.log('✅ 从localStorage获取到用户信息:', user.username);

            // 同步到用户权限工具
            if (window.userPermissions) {
                window.userPermissions.setCurrentUser(user);
            }

            updateNavigationForLoggedInUser(user);
            updateUIForLoggedInUser();
            return;
        } catch (error) {
            console.warn('解析localStorage用户信息失败:', error);
        }
    }

    // 最后尝试使用sessionToken验证
    const sessionToken = localStorage.getItem('sessionToken');
    if (!sessionToken) {
        console.log('🔍 未检测到登录状态');
        updateUIForGuestUser();
        return;
    }

    try {
        const response = await fetch(API_CONFIG.buildApiUrl('/api/auth/verify-session'), {
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ 用户已登录:', result.user.username);

            // 初始化用户权限系统
            initializeUserPermissions(result.user);

            updateNavigationForLoggedInUser(result.user);
            updateUIForLoggedInUser();
        } else {
            console.log('❌ 会话无效，清除本地存储');
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('userInfo');
            updateUIForGuestUser();
        }

    } catch (error) {
        console.error('验证会话失败:', error);
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('userInfo');
        updateUIForGuestUser();
    }
}

// 更新导航栏为已登录状态
function updateNavigationForLoggedInUser(user) {
    const loginLink = document.querySelector('.login-link');
    const mobileLoginLink = document.querySelector('.mobile-menu .login-link');

    if (loginLink) {
        // 替换登录链接为用户菜单
        loginLink.innerHTML = `
            <div class="user-menu">
                <span class="user-avatar">
                    <i class="fas fa-user"></i>
                </span>
                <span class="user-name">${user.displayName || user.username}</span>
                <i class="fas fa-chevron-down"></i>
            </div>
        `;
        loginLink.href = '#';
        loginLink.classList.remove('login-link');
        loginLink.classList.add('user-menu-toggle');

        // 添加用户菜单下拉框
        const userMenu = document.createElement('div');
        userMenu.className = 'user-dropdown';
        userMenu.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="user-details">
                    <div class="user-name">${user.displayName || user.username}</div>
                    <div class="user-email">${user.email}</div>
                </div>
            </div>
            <div class="user-menu-items">
                <a href="#" class="menu-item" id="profile-settings-btn">
                    <i class="fas fa-user-cog"></i>
                    个人设置
                </a>
                <div class="menu-divider"></div>
                <a href="#" class="menu-item logout-btn">
                    <i class="fas fa-sign-out-alt"></i>
                    退出登录
                </a>
            </div>
        `;

        loginLink.parentNode.appendChild(userMenu);

        // 绑定用户菜单事件
        bindUserMenuEvents(loginLink, userMenu);
    }

    if (mobileLoginLink) {
        // 更新移动端菜单
        mobileLoginLink.innerHTML = `
            <div class="mobile-user-info">
                <i class="fas fa-user"></i>
                <span>${user.displayName || user.username}</span>
            </div>
        `;
        mobileLoginLink.href = '#';
        mobileLoginLink.classList.remove('login-link');
        mobileLoginLink.classList.add('mobile-user-menu');
    }
}

// 绑定用户菜单事件
function bindUserMenuEvents(menuToggle, userMenu) {
    // 切换菜单显示
    menuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        userMenu.classList.toggle('show');
    });

    // 点击外部关闭菜单
    document.addEventListener('click', (e) => {
        if (!menuToggle.contains(e.target) && !userMenu.contains(e.target)) {
            userMenu.classList.remove('show');
        }
    });

    // 个人设置
    const profileSettingsBtn = userMenu.querySelector('#profile-settings-btn');
    if (profileSettingsBtn) {
        profileSettingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/pages/user/profile-settings.html';
        });
    }

    // 退出登录
    const logoutBtn = userMenu.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            try {
                const sessionToken = localStorage.getItem('sessionToken');
                if (sessionToken) {
                    await fetch('/api/auth/logout', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${sessionToken}`
                        }
                    });
                }

                // 清除本地存储
                localStorage.removeItem('sessionToken');
                localStorage.removeItem('userInfo');

                // 刷新页面
                window.location.reload();

            } catch (error) {
                console.error('退出登录失败:', error);
                // 即使API调用失败，也清除本地存储并刷新页面
                localStorage.removeItem('sessionToken');
                localStorage.removeItem('userInfo');
                window.location.reload();
            }
        });
    }
}

// 更新界面为游客状态
function updateUIForGuestUser() {
    console.log('🔒 更新界面为游客状态');

    // 禁用下载按钮
    const downloadButtons = document.querySelectorAll('.download-btn, .copy-btn, .connect-btn, .btn.btn-primary, .btn.btn-secondary');
    downloadButtons.forEach(btn => {
        // 保存原始文本
        const originalText = btn.querySelector('span')?.textContent || btn.textContent;
        btn.setAttribute('data-original-text', originalText);

        // 禁用按钮
        btn.classList.add('disabled');
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
        btn.style.pointerEvents = 'none';

        // 更新文本
        if (btn.querySelector('span')) {
            btn.querySelector('span').textContent = '请先登录';
        } else {
            btn.textContent = '请先登录';
        }

        // 移除所有点击事件监听器
        const newBtn = btn.cloneNode(true);
        newBtn.classList.add('disabled');
        newBtn.style.opacity = '0.6';
        newBtn.style.cursor = 'not-allowed';
        newBtn.style.pointerEvents = 'none';

        if (newBtn.querySelector('span')) {
            newBtn.querySelector('span').textContent = '请先登录';
        } else {
            newBtn.textContent = '请先登录';
        }

        // 添加新的点击事件，显示登录提示
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showLoginRequiredModal();
        });

        btn.parentNode.replaceChild(newBtn, btn);
    });

    // 禁用下载中心链接
    const downloadCenterLinks = document.querySelectorAll('a[href*="download"]');
    downloadCenterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginRequiredModal();
        });
    });

    // 添加登录提示横幅
    addLoginBanner();
}

// 更新界面为已登录状态
function updateUIForLoggedInUser() {
    console.log('✅ 更新界面为已登录状态');
    
    // 更新用户管理链接状态
    if (typeof window.updateUserManagementLink === 'function') {
        window.updateUserManagementLink();
    }

    // 恢复下载按钮
    const downloadButtons = document.querySelectorAll('.download-btn, .copy-btn, .connect-btn, .btn.btn-primary, .btn.btn-secondary');
    downloadButtons.forEach(btn => {
        btn.classList.remove('disabled');
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.pointerEvents = 'auto';

        // 恢复原始文本
        const originalText = btn.getAttribute('data-original-text');
        if (originalText) {
            if (btn.querySelector('span')) {
                btn.querySelector('span').textContent = originalText;
            } else {
                btn.textContent = originalText;
            }
        }
    });

    // 为已登录用户添加按钮加载动画
    addButtonLoadingAnimations();
    
    // 初始化复制功能
    initCopyFunctions();

    // 重新绑定下载组件事件（避免重复初始化）
    if (window.rebindDownloadEvents && !window.downloadEventsBound) {
        window.rebindDownloadEvents();
        window.downloadEventsBound = true;
    }

    // 移除登录提示横幅
    removeLoginBanner();
}

// 为已登录用户添加按钮加载动画
function addButtonLoadingAnimations() {
    const buttons = document.querySelectorAll('#copyConnectInfoBtn, #downloadFiveMBtn');

    buttons.forEach(button => {
        // 移除可能存在的旧事件监听器
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        // 添加新的点击事件监听器
        newButton.addEventListener('click', (e) => {
            setButtonLoading(newButton, true);

            // 模拟加载过程
            setTimeout(() => {
                setButtonLoading(newButton, false);
            }, 2000);
        });
    });
}

// 添加登录提示横幅
function addLoginBanner() {
    if (document.getElementById('login-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'login-banner';
    banner.className = 'login-banner';
    banner.innerHTML = `
        <div class="banner-content">
            <i class="fas fa-lock"></i>
            <span>登录后即可下载FiveM客户端和获取服务器连接信息</span>
            <a href="pages/auth/auth.html" class="login-btn">立即登录</a>
            <button class="close-banner" onclick="removeLoginBanner()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.insertBefore(banner, document.body.firstChild);
}

// 移除登录提示横幅
function removeLoginBanner() {
    const banner = document.getElementById('login-banner');
    if (banner) {
        banner.remove();
    }
}

// 显示登录要求弹窗
function showLoginRequiredModal() {
    const modal = document.createElement('div');
    modal.className = 'login-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-lock"></i> 需要登录</h3>
                <button class="close-modal" onclick="this.closest('.login-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p>为了确保服务器安全和用户体验，下载FiveM客户端和获取服务器信息需要登录账户。</p>
                <div class="modal-actions">
                    <a href="pages/auth/auth.html" class="btn btn-primary">
                        <i class="fas fa-sign-in-alt"></i>
                        立即登录
                    </a>
                    <button class="btn btn-secondary" onclick="this.closest('.login-modal').remove()">
                        稍后再说
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    // 监听页面可见性变化，当页面重新可见时同步用户状态
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // 页面重新可见时，检查用户状态是否需要同步
            syncUserStateIfNeeded();
        }
    });

    initPage();
});

// 同步用户状态（如果需要）
function syncUserStateIfNeeded() {
    // 如果用户权限工具中有用户信息，但localStorage中没有，则同步
    if (window.userPermissions && window.userPermissions.getCurrentUser()) {
        const user = window.userPermissions.getCurrentUser();
        const storedUser = localStorage.getItem('userInfo');

        if (!storedUser || JSON.parse(storedUser).id !== user.id) {
            localStorage.setItem('userInfo', JSON.stringify(user));
            console.log('🔄 页面可见性变化，同步用户状态到localStorage');
        }
    }
}

// 页面可见性变化处理
document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        document.title = '幻境 - 页面已隐藏';
    } else {
        document.title = '幻境 - FiveM角色扮演服务器';
    }
});

// 初始化粒子效果
function initParticleEffects() {
    const cards = document.querySelectorAll('.feature-card, .news-card, .connect-info, .requirements, .download-preview');
    let particles = [];

    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            createParticles(card, particles);
        });

        card.addEventListener('mouseleave', () => {
            clearParticles(particles);
        });
    });
}

// 创建粒子效果
function createParticles(element, particles) {
    clearParticles(particles);

    const rect = element.getBoundingClientRect();
    const particleCount = 8;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * rect.width + 'px';
        particle.style.top = Math.random() * rect.height + 'px';
        particle.style.animationDelay = Math.random() * 2 + 's';

        element.appendChild(particle);
        particles.push(particle);

        // 自动移除粒子
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 3000);
    }
}

// 清除粒子效果
function clearParticles(particles) {
    particles.forEach(particle => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    });
    particles.length = 0;
}

// 初始化按钮加载动画
function initButtonLoadingAnimations() {
    // 这个函数现在由登录状态管理，不再在这里直接添加事件监听器
    console.log('🔧 按钮加载动画初始化完成（等待登录状态确认）');
}

// 设置按钮加载状态
function setButtonLoading(button, loading) {
    if (loading) {
        button.classList.add('loading');
        const span = button.querySelector('span');
        if (span) {
            span.style.opacity = '0';
        }
    } else {
        button.classList.remove('loading');
        const span = button.querySelector('span');
        if (span) {
            span.style.opacity = '1';
        }
    }
}

// 数字计数动画
function animateNumbers() {
    const numbers = document.querySelectorAll('.stat-number');

    numbers.forEach(number => {
        const finalValue = parseInt(number.textContent.replace(/,/g, ''));
        let currentValue = 0;
        const increment = finalValue / 50;
        const isDecimal = number.textContent.includes('.');

        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= finalValue) {
                currentValue = finalValue;
                clearInterval(timer);
            }

            if (isDecimal) {
                number.textContent = currentValue.toFixed(1);
            } else {
                number.textContent = Math.floor(currentValue).toLocaleString();
            }
        }, 20);
    });
}

// 初始化统计数字动画
function initStatNumberAnimations() {
    const statNumbers = document.querySelectorAll('.stat-number');

    // 使用单个观察器观察所有元素
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const number = entry.target;
                number.classList.add('animate');

                // 避免重复动画
                if (!number.dataset.animated) {
                    animateNumbers();
                    number.dataset.animated = 'true';
                }

                setTimeout(() => {
                    number.classList.remove('animate');
                }, 1000);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    statNumbers.forEach(number => {
        observer.observe(number);
    });
}

// 初始化服务器信息
async function initServerInfo() {
    console.log('🔧 初始化首页服务器信息');
    
    try {
        // 获取服务器综合信息
        const response = await fetch('/api/server-status/comprehensive');
        if (!response.ok) {
            throw new Error(`服务器信息API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error('服务器信息API返回失败');
        }
        
        // 更新首页服务器信息
        updateHomePageServerInfo(data.data);
        
        console.log('✅ 首页服务器信息初始化完成');
        
    } catch (error) {
        console.error('❌ 获取首页服务器信息失败:', error);
        // 保持默认值，不显示错误
    }
}

// 更新首页服务器信息
function updateHomePageServerInfo(serverData) {
    console.log('🔄 更新首页服务器信息:', serverData);
    
    // 更新服务器IP和端口
    const serverIPElement = document.getElementById('server-ip');
    if (serverIPElement) {
        // 从环境变量或配置中获取实际服务器地址
        const serverIP = 'connect 9v73bb'; // 实际服务器地址
        serverIPElement.textContent = serverIP;
        console.log('✅ 更新服务器IP:', serverIP);
    }
    
    // 更新服务器版本
    const serverVersionElement = document.getElementById('server-version');
    if (serverVersionElement) {
        // 优先使用游戏版本号，如果没有则使用服务器版本
        let gameVersion = serverData.vars?.sv_enforceGameBuild || serverData.server?.gameBuild || serverData.server?.version || '2.1.0';
        
        // 确保版本号格式正确（移除可能存在的v前缀，然后重新添加）
        if (gameVersion && typeof gameVersion === 'string') {
            gameVersion = gameVersion.replace(/^v/, ''); // 移除开头的v
        }
        
        const version = `v${gameVersion}`;
        serverVersionElement.textContent = version;
        console.log('✅ 更新服务器版本:', version);
        console.log('🔍 原始版本数据:', {
            sv_enforceGameBuild: serverData.vars?.sv_enforceGameBuild,
            gameBuild: serverData.server?.gameBuild,
            version: serverData.server?.version,
            finalVersion: version
        });
    }
    
    // 更新在线状态
    const serverStatusElement = document.getElementById('server-status');
    if (serverStatusElement) {
        const status = serverData.server?.status || 'offline';
        const statusText = status === 'online' ? '在线' : 
                         status === 'restarting' ? '重启中' : '离线';
        serverStatusElement.textContent = statusText;
        console.log('✅ 更新在线状态:', statusText);
    }
    
    // 更新玩家数量显示（关于我们部分的统计）
    const playerCountElements = document.querySelectorAll('.stat-number');
    playerCountElements.forEach(element => {
        if (element.textContent === '386') { // 日均活跃玩家数
            const currentPlayers = serverData.players?.online || 0;
            element.textContent = currentPlayers.toString();
            console.log('✅ 更新当前在线玩家数:', currentPlayers);
        }
    });
    
    // 更新在线率
    const uptimeElements = document.querySelectorAll('.stat-label');
    uptimeElements.forEach(element => {
        if (element.textContent === '在线率') {
            const parentElement = element.parentElement;
            const numberElement = parentElement.querySelector('.stat-number');
            if (numberElement && numberElement.textContent === '99.7%') {
                const maxPlayers = serverData.players?.max || 64;
                const currentPlayers = serverData.players?.online || 0;
                const uptime = maxPlayers > 0 ? ((currentPlayers / maxPlayers) * 100).toFixed(1) : '0.0';
                numberElement.textContent = `${uptime}%`;
                console.log('✅ 更新在线率:', `${uptime}%`);
            }
        }
    });
    
    // 更新最大玩家容量显示
    const maxPlayersCapacity = document.getElementById('max-players-capacity');
    const maxPlayersDescription = document.getElementById('max-players-description');
    if (maxPlayersCapacity && maxPlayersDescription) {
        const maxPlayers = serverData.players?.max || 64;
        maxPlayersCapacity.textContent = `${maxPlayers}人容量`;
        maxPlayersDescription.textContent = `支持${maxPlayers}人同时在线，打造热闹的游戏社区`;
        console.log('✅ 更新最大玩家容量:', `${maxPlayers}人`);
    }
}

// 初始化复制功能
function initCopyFunctions() {
    console.log('🔧 初始化复制功能');
    
    // 复制服务器IP按钮
    const copyServerIPBtn = document.getElementById('copyServerIPBtn');
    if (copyServerIPBtn) {
        copyServerIPBtn.addEventListener('click', async () => {
            const serverIPElement = document.getElementById('server-ip');
            const serverIP = serverIPElement ? serverIPElement.textContent : 'connect 9v73bb';
            
            try {
                await navigator.clipboard.writeText(serverIP);
                showCopyNotification('服务器IP已复制到剪贴板');
                console.log('✅ 服务器IP已复制:', serverIP);
            } catch (error) {
                console.error('❌ 复制失败:', error);
                // 降级方案：使用传统方法
                fallbackCopyToClipboard(serverIP);
            }
        });
    }
    
    // 复制连接信息按钮
    const copyConnectInfoBtn = document.getElementById('copyConnectInfoBtn');
    if (copyConnectInfoBtn) {
        copyConnectInfoBtn.addEventListener('click', async () => {
            const serverIPElement = document.getElementById('server-ip');
            const serverIP = serverIPElement ? serverIPElement.textContent : 'connect 9v73bb';
            const connectInfo = `服务器连接: ${serverIP}\n服务器名称: 幻境 半RP服务器\nQQ群: 962507707\n连接方式: 在FiveM客户端中输入连接代码即可连接`;
            
            try {
                await navigator.clipboard.writeText(connectInfo);
                showCopyNotification('连接信息已复制到剪贴板');
                console.log('✅ 连接信息已复制');
            } catch (error) {
                console.error('❌ 复制失败:', error);
                // 降级方案：使用传统方法
                fallbackCopyToClipboard(connectInfo);
            }
        });
    }
}

// 降级复制方案
function fallbackCopyToClipboard(text) {
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
        showCopyNotification('已复制到剪贴板');
        console.log('✅ 使用降级方案复制成功');
    } catch (error) {
        console.error('❌ 降级复制也失败:', error);
        showCopyNotification('复制失败，请手动复制');
    }
    
    document.body.removeChild(textArea);
}

// 显示复制通知
function showCopyNotification(message) {
    // 移除已存在的通知
    const existingNotification = document.querySelector('.copy-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-color, #10b981);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        font-size: 14px;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 导出函数供全局使用
window.initPage = initPage;
window.showFormError = showFormError;
window.hideFormError = hideFormError;
window.setButtonLoading = setButtonLoading;
window.animateNumbers = animateNumbers;
window.initServerInfo = initServerInfo;
window.initCopyFunctions = initCopyFunctions;
