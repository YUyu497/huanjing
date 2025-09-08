// 导航组件JavaScript

// 导航栏滚动效果
function handleNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}

// 汉堡菜单切换
function toggleHamburgerMenu() {
    const navMenuOverlay = document.querySelector('.nav-menu-overlay');
    const hamburgerMenu = document.querySelector('.hamburger-menu');

    if (!navMenuOverlay || !hamburgerMenu) return;

    const isActive = navMenuOverlay.classList.contains('active');

    if (isActive) {
        closeHamburgerMenu();
    } else {
        openHamburgerMenu();
    }
}

// 打开汉堡菜单
function openHamburgerMenu() {
    const navMenuOverlay = document.querySelector('.nav-menu-overlay');
    const navMenuBackdrop = document.querySelector('.nav-menu-backdrop');
    const hamburgerMenu = document.querySelector('.hamburger-menu');

    if (navMenuOverlay) {
        navMenuOverlay.classList.add('active');
    }
    if (navMenuBackdrop) {
        navMenuBackdrop.classList.add('active');
    }
    if (hamburgerMenu) {
        hamburgerMenu.classList.add('active');
    }
    document.body.style.overflow = 'hidden'; // 防止背景滚动
}

// 关闭汉堡菜单
function closeHamburgerMenu() {
    const navMenuOverlay = document.querySelector('.nav-menu-overlay');
    const navMenuBackdrop = document.querySelector('.nav-menu-backdrop');
    const hamburgerMenu = document.querySelector('.hamburger-menu');

    if (navMenuOverlay) {
        navMenuOverlay.classList.remove('active');
    }
    if (navMenuBackdrop) {
        navMenuBackdrop.classList.remove('active');
    }
    if (hamburgerMenu) {
        hamburgerMenu.classList.remove('active');
    }
    document.body.style.overflow = ''; // 恢复背景滚动
}

// 平滑滚动到锚点
function smoothScrollToAnchor(anchor) {
    const targetId = anchor.getAttribute('href');
    if (targetId === '#') return;

    // 如果是外部链接或HTML文件，直接跳转
    if (targetId.startsWith('http') || targetId.includes('.html')) {
        window.location.href = targetId;
        return;
    }

    const targetElement = document.querySelector(targetId);
    if (targetElement) {
        const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
        const targetPosition = targetElement.offsetTop - navbarHeight - 20;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });

        // 关闭汉堡菜单
        closeHamburgerMenu();
    }
}

// 高亮当前导航项
function highlightCurrentNavItem() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a');

    if (sections.length === 0 || navLinks.length === 0) return;

    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            // 移除所有活动状态
            navLinks.forEach(link => {
                link.classList.remove('active');
            });

            // 添加当前活动状态
            const currentLink = document.querySelector(`.nav-menu a[href="#${sectionId}"]`);
            if (currentLink) {
                currentLink.classList.add('active');
            }
        }
    });
}

// 用户管理导航项状态更新
function updateUserManagementLink() {
    const userManagementLink = document.getElementById('userManagementLink');
    if (!userManagementLink) return;
    
    const userInfo = localStorage.getItem('userInfo');
    const sessionToken = localStorage.getItem('sessionToken');
    
    if (userInfo && sessionToken) {
        // 用户已登录，显示用户管理链接
        userManagementLink.classList.add('show');
        console.log('✅ 用户管理链接已显示');
    } else {
        // 用户未登录，隐藏用户管理链接
        userManagementLink.classList.remove('show');
        console.log('✅ 用户管理链接已隐藏');
    }
}

// 初始化导航组件
function initNavigation() {
    // 绑定汉堡菜单切换事件
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', toggleHamburgerMenu);
    }

    // 绑定关闭菜单按钮事件
    const closeMenuBtn = document.querySelector('.close-menu');
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeHamburgerMenu);
    }

    // 绑定所有导航链接的点击事件
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            smoothScrollToAnchor(this);
        });
    });

    // 点击背景遮罩层关闭菜单
    const navMenuBackdrop = document.querySelector('.nav-menu-backdrop');
    if (navMenuBackdrop) {
        navMenuBackdrop.addEventListener('click', closeHamburgerMenu);
    }

    // 监听滚动事件
    window.addEventListener('scroll', function () {
        handleNavbarScroll();
        highlightCurrentNavItem();
    });

    // 键盘导航支持
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeHamburgerMenu();
        }
    });

    // 延迟初始化用户管理链接状态
    setTimeout(() => {
        updateUserManagementLink();
    }, 100);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    initNavigation();

    // 触发一次滚动事件以设置初始导航栏样式
    window.dispatchEvent(new Event('scroll'));
});

// 导出函数供全局使用
window.toggleHamburgerMenu = toggleHamburgerMenu;
window.closeHamburgerMenu = closeHamburgerMenu;
window.openHamburgerMenu = openHamburgerMenu;
window.smoothScrollToAnchor = smoothScrollToAnchor;
window.updateUserManagementLink = updateUserManagementLink;
