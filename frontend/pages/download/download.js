// 下载页面专用JavaScript

class DownloadPage {
    constructor() {
        // 防止重复初始化
        if (window.downloadPageInstance) {
            console.log('⚠️ 下载页面已初始化，跳过重复初始化');
            return;
        }

        this.downloadManager = null;
        this.particles = [];

        // 标记为已初始化
        window.downloadPageInstance = this;

        this.init();
    }

    init() {
        this.initAOS();
        this.initNavigation();
        this.initFAQ();
        this.initDownloadButtons();
        this.initAnimations();
        this.initDownloadManager();
        this.initParticleEffects();
        this.initServerStatus();
        this.checkDatabaseStatus();
        this.checkUserAuth();
        console.log('✅ 下载页面初始化完成');
    }

    // 初始化AOS动画库
    initAOS() {
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

    // 初始化导航功能
    initNavigation() {
        // 移动端菜单切换
        const menuToggle = document.querySelector('.menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');

        if (menuToggle && mobileMenu) {
            menuToggle.addEventListener('click', () => {
                mobileMenu.classList.toggle('active');
                menuToggle.classList.toggle('active');
            });
        }

        // 智能处理导航链接点击
        this.initSmartNavigation();

        // 导航栏滚动效果
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // 平滑滚动到锚点
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // 智能导航处理
    initSmartNavigation() {
        // 处理下载中心链接点击
        const downloadLinks = document.querySelectorAll('a[href*="download.html"], a[href*="download/download.html"]');

        downloadLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // 如果当前已经在下载页面，阻止导航
                if (window.location.pathname.includes('download.html')) {
                    e.preventDefault();
                    console.log('📍 已在下载页面，跳过重复导航');

                    // 可选：显示提示或滚动到顶部
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return false;
                }
            });
        });

        console.log('🧭 智能导航已初始化，防止重复页面加载');
    }

    // 初始化FAQ交互
    initFAQ() {
        const faqItems = document.querySelectorAll('.faq-item');

        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');

            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');

                // 关闭其他所有FAQ项
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });

                // 切换当前项的状态
                if (isActive) {
                    item.classList.remove('active');
                } else {
                    item.classList.add('active');
                }
            });
        });
    }

    // 初始化下载按钮
    initDownloadButtons() {
        const downloadButtons = document.querySelectorAll('.download-btn');

        downloadButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const platform = button.getAttribute('data-platform');
                this.handleDownload(platform, e);
            });
        });
    }

    // 处理下载请求
    handleDownload(platform, event) {
        const button = event.target.closest('.download-btn');
        const downloadType = button.getAttribute('data-type') || 'fivem';
        
        console.log(`🚀 开始下载 ${downloadType} ${platform} 版本`);

        // 添加加载状态
        if (button) {
            this.setButtonLoading(button, true, platform, downloadType);
        }

        // 显示下载提示
        this.showDownloadNotification(platform, downloadType);

        // 模拟下载过程
        setTimeout(() => {
            if (button) {
                this.setButtonLoading(button, false, platform, downloadType);
            }
        }, 3000);
    }

    // 设置按钮加载状态
    setButtonLoading(button, loading, platform, downloadType = 'fivem') {
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

        // 根据下载类型选择相应的下载方法
        if (loading) {
            // 延迟下载，避免重复点击
            setTimeout(() => {
                if (downloadType === 'kook') {
                    this.downloadKook();
                } else {
                    this.downloadWindows();
                }
            }, 1000);
        }
    }

    // 下载Windows版本
    downloadWindows() {
        // 创建下载链接
        const link = document.createElement('a');
        link.href = '/api/downloads/fivem';
        link.download = 'FiveM-Windows.exe';
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 记录下载统计
        this.recordDownload('fivem', 'windows');
    }

    // 下载Kook版本
    downloadKook() {
        // 创建下载链接
        const link = document.createElement('a');
        link.href = '/api/downloads/kook';
        link.download = 'kook.exe';
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 记录下载统计
        this.recordDownload('kook', 'windows');
    }

    // 下载macOS版本
    downloadMacOS() {
        // 创建下载链接
        const link = document.createElement('a');
        link.href = '/api/downloads/fivem';
        link.download = 'FiveM-macOS.dmg';
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 记录下载统计
        this.recordDownload('fivem', 'macos');
    }

    // 下载Linux版本
    downloadLinux() {
        // 创建下载链接
        const link = document.createElement('a');
        link.href = '/api/downloads/fivem';
        link.download = 'FiveM-Linux.tar.gz';
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 记录下载统计
        this.recordDownload('fivem', 'linux');
    }

    // 记录下载到数据库
    async recordDownload(downloadType, platform) {
        try {
            const response = await fetch(API_CONFIG.buildApiUrl('/api/downloads/record'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    download_type: downloadType,
                    platform: platform,
                    user_agent: navigator.userAgent,
                    ip_address: await this.getClientIP()
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ 下载记录成功:', result);
                // 更新统计显示
                this.updateStats();
            } else {
                if (result.download_skipped) {
                    console.log('⚠️ 下载记录跳过（数据库连接问题）:', result.message);
                } else {
                    console.error('❌ 下载记录失败:', result.message);
                }
                // 即使记录失败，也不影响下载功能
                console.log('⚠️ 下载记录失败，但下载功能正常');
            }
        } catch (error) {
            console.error('❌ 记录下载时出错:', error);
            // 即使记录失败，也不影响下载功能
            console.log('⚠️ 下载记录出错，但下载功能正常');
        }
    }

    // 获取客户端IP（多备选方案）
    async getClientIP() {
        const ipServices = [
            'https://api.ipify.org?format=json',
            'https://api.myip.com',
            'https://ipinfo.io/json',
            'https://httpbin.org/ip'
        ];

        for (const service of ipServices) {
            try {
                // 创建超时控制器
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                
                const response = await fetch(service, { 
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    let ip = null;
                    
                    // 根据不同服务解析IP地址
                    if (data.ip) {
                        ip = data.ip;
                    } else if (data.origin) {
                        ip = data.origin;
                    } else if (data.query) {
                        ip = data.query;
                    }
                    
                    if (ip) {
                        console.log(`✅ 从 ${service} 获取到IP地址: ${ip}`);
                        return ip;
                    }
                }
            } catch (error) {
                console.log(`⚠️ ${service} 获取IP失败:`, error.message);
                continue;
            }
        }
        
        console.log('⚠️ 所有IP服务都失败，使用默认值');
        return '127.0.0.1';
    }

    // 更新统计显示
    async updateStats() {
        try {
            const response = await fetch(API_CONFIG.buildApiUrl('/api/downloads/stats'));
            const result = await response.json();

            if (result.success) {
                const stats = result.data;

                // 更新总下载量
                const totalElement = document.getElementById('total-downloads');
                if (totalElement) {
                    totalElement.textContent = stats.total;
                }

                // 更新今日下载量
                const todayElement = document.getElementById('today-downloads');
                if (todayElement) {
                    todayElement.textContent = stats.today;
                }

                console.log('✅ 统计更新成功');
            }
        } catch (error) {
            console.error('❌ 更新统计失败:', error);
        }
    }

    // 显示下载通知
    showDownloadNotification(platform, downloadType = 'fivem') {
        const softwareName = downloadType === 'kook' ? 'Kook' : 'FiveM';
        
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'download-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-download"></i>
                <span>正在下载 ${softwareName} ${platform} 版本...</span>
            </div>
        `;

        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-medium);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;

        // 添加到页面
        document.body.appendChild(notification);

        // 3秒后自动移除
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 初始化页面动画
    initAnimations() {
        // 监听滚动事件，触发动画
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // 观察所有需要动画的元素
        const animatedElements = document.querySelectorAll('.fade-in-up');
        animatedElements.forEach(el => observer.observe(el));

        // 数字计数动画
        this.animateNumbers();

        // 卡片悬停效果
        this.initCardHoverEffects();

        // 统计数字更新动画
        this.initStatNumberAnimations();
    }

    // 初始化粒子效果
    initParticleEffects() {
        const cards = document.querySelectorAll('.download-card, .requirement-card, .stat-card');

        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                this.createParticles(card);
            });

            card.addEventListener('mouseleave', () => {
                this.clearParticles();
            });
        });
    }

    // 创建粒子效果
    createParticles(element) {
        this.clearParticles();

        const rect = element.getBoundingClientRect();
        const particleCount = 8;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * rect.width + 'px';
            particle.style.top = Math.random() * rect.height + 'px';
            particle.style.animationDelay = Math.random() * 2 + 's';

            element.appendChild(particle);
            this.particles.push(particle);

            // 自动移除粒子
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 3000);
        }
    }

    // 清除粒子效果
    clearParticles() {
        this.particles.forEach(particle => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        });
        this.particles = [];
    }

    // 初始化统计数字动画
    initStatNumberAnimations() {
        const statNumbers = document.querySelectorAll('.stat-number');

        statNumbers.forEach(number => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        number.classList.add('animate');
                        setTimeout(() => {
                            number.classList.remove('animate');
                        }, 1000);
                    }
                });
            });

            observer.observe(number);
        });
    }

    // 初始化下载管理器
    initDownloadManager() {
        // 初始化下载统计
        this.updateStats();

        // 初始化图表
        this.initChart();

        // 绑定图表控制按钮事件
        this.bindChartEvents();
    }

    // 初始化图表
    initChart() {
        if (typeof Chart === 'undefined') {
            console.log('⚠️ Chart.js未加载，跳过图表初始化');
            return;
        }

        const ctx = document.getElementById('downloadTrendChart');
        if (!ctx) {
            console.log('⚠️ 未找到图表画布元素');
            return;
        }

        // 创建图表
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '下载量',
                    data: [],
                    borderColor: '#64b5f6',
                    backgroundColor: 'rgba(100, 181, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#64b5f6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#64b5f6',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#9ca3af'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#9ca3af'
                        }
                    }
                }
            }
        });

        // 加载初始数据
        this.updateChartData(7);
        console.log('✅ 图表初始化完成');
    }

    // 更新图表数据
    async updateChartData(days = 7) {
        try {
            const response = await fetch(`/api/downloads/trend?days=${days}`);
            const result = await response.json();

            if (result.success && result.data) {
                const labels = result.data.map(item => item.date);
                const values = result.data.map(item => item.count);

                this.chart.data.labels = labels;
                this.chart.data.datasets[0].data = values;
                this.chart.update();

                console.log('📊 图表数据更新成功:', { labels, values });
            }
        } catch (error) {
            console.error('❌ 更新图表数据失败:', error);
        }
    }

    // 绑定图表控制按钮事件
    bindChartEvents() {
        const chartButtons = document.querySelectorAll('.chart-btn');

        chartButtons.forEach(button => {
            button.addEventListener('click', () => {
                const period = parseInt(button.getAttribute('data-period'));

                // 更新按钮状态
                chartButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // 更新图表数据
                this.updateChartData(period);
            });
        });
    }

    // 数字计数动画
    animateNumbers() {
        const numbers = document.querySelectorAll('.stat-number');

        numbers.forEach(number => {
            const finalValue = parseInt(number.textContent);
            let currentValue = 0;
            const increment = finalValue / 50;

            const timer = setInterval(() => {
                currentValue += increment;
                if (currentValue >= finalValue) {
                    currentValue = finalValue;
                    clearInterval(timer);
                }
                number.textContent = Math.floor(currentValue);
            }, 20);
        });
    }

    // 卡片悬停效果
    initCardHoverEffects() {
        const cards = document.querySelectorAll('.download-card, .requirement-card, .stat-card, .faq-item');

        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px) scale(1.02)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    // 检查数据库状态
    async checkDatabaseStatus() {
        try {
            const response = await fetch(API_CONFIG.buildApiUrl('/api/downloads/db-status'));
            const result = await response.json();
            
            if (result.success) {
                if (result.data.connected) {
                    console.log('✅ 数据库连接正常');
                } else {
                    console.warn('⚠️ 数据库连接异常');
                }
            } else {
                console.warn('⚠️ 无法检查数据库状态');
            }
        } catch (error) {
            console.warn('⚠️ 数据库状态检查失败:', error.message);
        }
    }

    // 检查用户登录状态
    async checkUserAuth() {
        // 使用认证验证器
        if (!window.authValidator) {
            console.warn('⚠️ 认证验证器未加载');
            return;
        }

        // 创建页面认证保护器
        const pageProtector = window.authValidator.createPageProtector({
            pageName: '下载中心',
            onSuccess: () => {
                console.log('✅ 用户认证有效，允许访问下载中心');
            },
            onFailure: () => {
                console.log('🔒 用户认证无效，重定向到登录页面');
                this.showLoginRequiredModal();
            },
            showLoginModal: () => {
                this.showLoginRequiredModal();
            }
        });

        // 保护页面
        await pageProtector.protect();
    }

    // 显示登录要求弹窗
    showLoginRequiredModal() {
        const modal = document.createElement('div');
        modal.className = 'login-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-lock"></i> 需要登录</h3>
                </div>
                <div class="modal-body">
                    <p>为了确保服务器安全和用户体验，访问下载中心需要登录账户。</p>
                    <div class="modal-actions">
                        <a href="../auth/auth.html" class="btn btn-primary">
                            <i class="fas fa-sign-in-alt"></i>
                            立即登录
                        </a>
                        <a href="../../index.html" class="btn btn-secondary">
                            <i class="fas fa-home"></i>
                            返回首页
                        </a>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 禁用页面滚动
        document.body.style.overflow = 'hidden';

        // 点击背景不关闭，强制用户选择
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                // 不关闭弹窗，只显示提示
                this.showToast('请先登录或返回首页', 'warning');
            }
        });
    }

    // 显示提示消息
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(toast);

        // 显示动画
        setTimeout(() => toast.classList.add('show'), 100);

        // 自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // 初始化服务器状态显示
    async initServerStatus() {
        try {
            // 等待服务器状态服务初始化
            if (window.serverStatus) {
                await window.serverStatus.init();

                // 获取初始状态
                await this.updateServerStatusDisplay();

                // 注册状态更新回调
                window.serverStatus.onUpdate((data) => {
                    this.updateServerStatusDisplay(data);
                });

                console.log('✅ 服务器状态显示初始化完成');
            } else {
                console.error('❌ 服务器状态服务未找到');
            }
        } catch (error) {
            console.error('❌ 初始化服务器状态显示失败:', error);
        }
    }

    // 更新服务器状态显示
    async updateServerStatusDisplay(data = null) {
        try {
            let serverInfo = data;

            if (!serverInfo) {
                serverInfo = await window.serverStatus.getComprehensiveInfo();
            }

            if (!serverInfo) {
                this.showServerStatusError();
                return;
            }

            // 更新服务器状态
            const statusElement = document.getElementById('server-status-value');
            if (statusElement) {
                const statusInfo = window.serverStatus.formatServerStatus(serverInfo.server.status);
                statusElement.textContent = statusInfo.text;
                statusElement.style.color = statusInfo.color;
            }

            // 更新在线玩家数
            const playerElement = document.getElementById('player-count-value');
            if (playerElement) {
                const playerCount = window.serverStatus.formatPlayerCount(
                    serverInfo.players.online,
                    serverInfo.players.max
                );
                playerElement.textContent = playerCount;
            }

            // 更新运行时间
            const uptimeElement = document.getElementById('uptime-value');
            if (uptimeElement) {
                const uptime = window.serverStatus.formatUptime(serverInfo.server.uptime);
                uptimeElement.textContent = uptime;
            }

            // 更新状态显示样式
            this.updateServerStatusStyle(serverInfo.server.status);

            console.log('✅ 服务器状态显示已更新');
        } catch (error) {
            console.error('❌ 更新服务器状态显示失败:', error);
            this.showServerStatusError();
        }
    }

    // 更新服务器状态样式
    updateServerStatusStyle(status) {
        const statusDisplay = document.getElementById('server-status-display');
        if (!statusDisplay) return;

        // 移除所有状态类
        statusDisplay.classList.remove('status-online', 'status-offline', 'status-warning');

        // 添加对应状态类
        switch (status) {
            case 'online':
                statusDisplay.classList.add('status-online');
                break;
            case 'offline':
                statusDisplay.classList.add('status-offline');
                break;
            case 'starting':
            case 'stopping':
                statusDisplay.classList.add('status-warning');
                break;
            default:
                // 保持默认样式
                break;
        }
    }

    // 显示服务器状态错误
    showServerStatusError() {
        const elements = [
            'server-status-value',
            'player-count-value',
            'uptime-value'
        ];

        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '获取失败';
                element.style.color = '#EF4444';
            }
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new DownloadPage();
});

// 添加动画CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .animate-in {
        animation: fadeInUp 0.6s ease forwards;
    }
`;
document.head.appendChild(style);
