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

// 移动端菜单切换
function toggleMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuToggle = document.querySelector('.menu-toggle');

    if (!mobileMenu || !menuToggle) return;

    const isActive = mobileMenu.classList.contains('active');

    if (isActive) {
        mobileMenu.classList.remove('active');
        menuToggle.classList.remove('active');
    } else {
        mobileMenu.classList.add('active');
        menuToggle.classList.add('active');
    }
}

// 关闭移动端菜单
function closeMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const menuToggle = document.querySelector('.menu-toggle');

    if (mobileMenu) {
        mobileMenu.classList.remove('active');
    }
    if (menuToggle) {
        menuToggle.classList.remove('active');
    }
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

        // 关闭移动端菜单
        closeMobileMenu();
    }
}

// 高亮当前导航项
function highlightCurrentNavItem() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a, .mobile-menu a');

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
            const currentLink = document.querySelector(`.nav-menu a[href="#${sectionId}"], .mobile-menu a[href="#${sectionId}"]`);
            if (currentLink) {
                currentLink.classList.add('active');
            }
        }
    });
}

// 初始化导航组件
function initNavigation() {
    // 绑定移动端菜单切换事件
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }

    // 绑定所有导航链接的点击事件
    const navLinks = document.querySelectorAll('.nav-menu a, .mobile-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            smoothScrollToAnchor(this);
        });
    });

    // 点击页面其他地方关闭移动端菜单
    document.addEventListener('click', function (e) {
        const mobileMenu = document.querySelector('.mobile-menu');
        const menuToggle = document.querySelector('.menu-toggle');

        if (mobileMenu && !mobileMenu.contains(e.target) && !menuToggle?.contains(e.target)) {
            closeMobileMenu();
        }
    });

    // 监听滚动事件
    window.addEventListener('scroll', function () {
        handleNavbarScroll();
        highlightCurrentNavItem();
    });

    // 监听窗口大小变化
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });

    // 键盘导航支持
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeMobileMenu();
        }
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    initNavigation();

    // 触发一次滚动事件以设置初始导航栏样式
    window.dispatchEvent(new Event('scroll'));
});

// 导出函数供全局使用
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.smoothScrollToAnchor = smoothScrollToAnchor;
