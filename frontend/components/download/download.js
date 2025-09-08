// 下载组件JavaScript

// 下载管理器类
class DownloadManager {
    constructor() {
        this.apiBase = '/api/downloads';
        this.stats = {
            total: 0,
            today: 0
        };
        this.chart = null;
        this.currentPeriod = 7;
        this.init();
    }

    async init() {
        try {
            await this.getDownloadStats();
            this.updateDownloadStatsDisplay();
            this.initChartWithRetry();
            this.bindEvents();
            console.log('✅ 下载管理器初始化完成');
        } catch (error) {
            console.error('❌ 下载管理器初始化失败:', error);
        }
    }

    // 带重试的图表初始化
    initChartWithRetry() {
        if (typeof Chart !== 'undefined') {
            this.initChart();
        } else {
            console.log('⏳ Chart.js未加载，等待加载完成...');
            // 等待Chart.js加载完成
            let retryCount = 0;
            const maxRetries = 10;
            const checkChart = () => {
                if (typeof Chart !== 'undefined') {
                    console.log('✅ Chart.js加载完成，开始初始化图表');
                    this.initChart();
                } else if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`🔄 等待Chart.js加载... (${retryCount}/${maxRetries})`);
                    setTimeout(checkChart, 500);
                } else {
                    console.log('❌ Chart.js加载超时，显示错误信息');
                    this.showChartError();
                }
            };
            checkChart();
        }
    }

    // 获取下载统计
    async getDownloadStats() {
        try {
            const response = await fetch(`${this.apiBase}/stats`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.success) {
                this.stats = data.data;
                console.log('📊 下载统计获取成功:', this.stats);
            } else {
                throw new Error(data.message || '获取统计失败');
            }
        } catch (error) {
            console.error('❌ 获取下载统计失败:', error);
            // 使用默认值
            this.stats = { total: 0, today: 0 };
        }
    }

    // 更新下载统计显示
    updateDownloadStatsDisplay() {
        console.log('🔄 开始更新下载统计显示...');
        console.log('📊 当前统计数据:', this.stats);

        const totalElement = document.getElementById('total-downloads');
        const todayElement = document.getElementById('today-downloads');

        console.log('🔍 查找DOM元素:');
        console.log('  - total-downloads:', totalElement);
        console.log('  - today-downloads:', todayElement);

        if (totalElement) {
            const oldValue = totalElement.textContent;
            totalElement.textContent = this.stats.total.toLocaleString();
            console.log(`✅ 总下载量更新: ${oldValue} → ${this.stats.total.toLocaleString()}`);
        } else {
            console.log('⚠️ 未找到总下载量元素');
        }

        if (todayElement) {
            const oldValue = todayElement.textContent;
            todayElement.textContent = this.stats.today.toLocaleString();
            console.log(`✅ 今日下载更新: ${oldValue} → ${this.stats.today.toLocaleString()}`);
        } else {
            console.log('⚠️ 未找到今日下载元素');
        }

        console.log('🎯 统计显示更新完成');
    }

    // 显示图表加载错误
    showChartError() {
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem; color: var(--accent-color);"></i>
                    <p style="text-align: center; margin: 0;">
                        图表加载失败<br>
                        <small>请检查网络连接或刷新页面重试</small>
                    </p>
                </div>
            `;
        }
    }

    // 初始化图表
    initChart() {
        // 检查Chart.js是否已加载
        if (typeof Chart === 'undefined') {
            console.log('⚠️ Chart.js未加载，跳过图表初始化');
            this.showChartError();
            return;
        }

        const ctx = document.getElementById('downloadTrendChart');
        if (!ctx) {
            console.log('⚠️ 未找到图表画布元素');
            return;
        }

        // 销毁现有图表
        if (this.chart) {
            this.chart.destroy();
        }

        // 创建新图表
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '下载量',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
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
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false
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
                            color: '#9ca3af',
                            stepSize: 1
                        },
                        beginAtZero: true
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

        console.log('✅ 图表初始化完成');
        this.updateChartData();
    }

    // 更新图表数据
    async updateChartData() {
        if (!this.chart) return;

        try {
            const response = await fetch(`${this.apiBase}/trend?days=${this.currentPeriod}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success && data.data.length > 0) {
                const labels = data.data.map(item => item.date);
                const values = data.data.map(item => item.count);

                this.chart.data.labels = labels;
                this.chart.data.datasets[0].data = values;
                this.chart.update('active');

                console.log('📊 图表数据更新成功:', { labels, values });
            } else {
                // 如果没有数据，显示空图表
                this.chart.data.labels = [];
                this.chart.data.datasets[0].data = [];
                this.chart.update('active');
                console.log('📊 图表显示空数据');
            }
        } catch (error) {
            console.error('❌ 更新图表数据失败:', error);
        }
    }

    // 切换图表时间周期
    async switchChartPeriod(period) {
        this.currentPeriod = period;
        console.log(`🔄 切换到 ${period} 天周期`);

        // 更新按钮状态
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // 更新图表数据
        await this.updateChartData();
    }

    // 复制服务器IP
    async copyServerIP() {
        try {
            const serverIP = 'connect 9v73bb'; // 你的服务器IP和端口

            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(serverIP);
                this.showCopyNotification('服务器IP已复制到剪贴板！', 'success');
            } else {
                // 降级方案
                this.fallbackCopyTextToClipboard(serverIP);
            }
        } catch (error) {
            console.error('复制失败:', error);
            this.showCopyNotification('复制失败，请手动复制', 'error');
        }
    }



    // 降级复制方案
    fallbackCopyTextToClipboard(text) {
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
            this.showCopyNotification('服务器IP已复制到剪贴板！', 'success');
        } catch (err) {
            console.error('降级复制失败:', err);
            this.showCopyNotification('复制失败，请手动复制', 'error');
        }

        document.body.removeChild(textArea);
    }

    // 显示复制通知
    showCopyNotification(message, type = 'info') {
        // 移除现有通知
        const existingNotification = document.querySelector('.copy-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `copy-notification copy-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // 3秒后自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 3000);
    }

    // 下载FiveM
    async downloadFiveM() {
        console.log('🚀 开始下载FiveM...');
        try {
            // 记录下载
            console.log('📝 记录下载到数据库...');
            await this.recordDownload('fivem');

            // 直接下载后端的FiveM.exe文件
            console.log('📥 开始下载FiveM.exe文件...');
            const downloadLink = document.createElement('a');
            downloadLink.href = '/api/downloads/fivem';
            downloadLink.download = 'FiveM.exe';
            downloadLink.style.display = 'none';

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            this.showCopyNotification('FiveM客户端下载已开始！', 'success');
            console.log('✅ FiveM下载流程完成');
        } catch (error) {
            console.error('❌ 下载记录失败:', error);
            // 即使记录失败，也允许下载
            console.log('🔄 尝试直接下载文件...');
            const downloadLink = document.createElement('a');
            downloadLink.href = '/api/downloads/fivem';
            downloadLink.download = 'FiveM.exe';
            downloadLink.style.display = 'none';

            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    }

    // 记录下载
    async recordDownload(downloadType) {
        try {
            const platform = this.getPlatform();
            const userAgent = navigator.userAgent;

            const response = await fetch(`${this.apiBase}/record`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    download_type: downloadType,
                    platform: platform,
                    user_agent: userAgent,
                    file_size: null
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                console.log('✅ 下载记录成功:', data);
                // 更新统计
                await this.getDownloadStats();
                this.updateDownloadStatsDisplay();
            } else {
                throw new Error(data.message || '记录下载失败');
            }
        } catch (error) {
            console.error('❌ 记录下载失败:', error);
            throw error;
        }
    }

    // 获取平台信息
    getPlatform() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('win')) return 'windows';
        if (userAgent.includes('mac')) return 'macos';
        if (userAgent.includes('linux')) return 'linux';
        return 'unknown';
    }

    // 绑定事件
    bindEvents() {
        console.log('🔗 开始绑定事件...');

        // 检查用户登录状态
        const sessionToken = localStorage.getItem('sessionToken');
        if (!sessionToken) {
            console.log('🔒 用户未登录，跳过按钮事件绑定');
            return;
        }

        // 绑定复制IP按钮
        const copyBtn = document.getElementById('copyServerIPBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyServerIP());
            console.log('✅ 复制IP按钮事件绑定成功');
        } else {
            console.log('⚠️ 未找到复制IP按钮');
        }

        // 绑定复制连接信息按钮
        const copyConnectBtn = document.getElementById('copyConnectInfoBtn');
        if (copyConnectBtn) {
            copyConnectBtn.addEventListener('click', () => this.copyServerIP());
            console.log('✅ 复制连接信息按钮事件绑定成功');
        } else {
            console.log('⚠️ 未找到复制连接信息按钮');
        }

        // 绑定下载FiveM按钮
        const downloadFiveMBtn = document.getElementById('downloadFiveMBtn');
        if (downloadFiveMBtn) {
            downloadFiveMBtn.addEventListener('click', () => this.downloadFiveM());
            console.log('✅ 下载FiveM按钮事件绑定成功');
        } else {
            console.log('⚠️ 未找到下载FiveM按钮');
        }

        // 绑定其他可能的下载按钮（只绑定有特定data属性的按钮）
        const downloadBtns = document.querySelectorAll('.download-btn[data-platform]');
        downloadBtns.forEach(btn => {
            btn.addEventListener('click', () => this.downloadFiveM());
        });
        if (downloadBtns.length > 0) {
            console.log(`✅ 找到 ${downloadBtns.length} 个下载按钮`);
        }

        // 绑定主要按钮（只绑定有特定id的按钮，避免绑定导航按钮）
        const primaryBtns = document.querySelectorAll('.btn-primary');
        primaryBtns.forEach(btn => {
            // 只绑定有特定id的下载按钮，避免绑定导航按钮
            if (btn.id && (btn.id === 'downloadFiveMBtn' || btn.id.includes('download'))) {
                btn.addEventListener('click', () => this.downloadFiveM());
            }
        });
        if (primaryBtns.length > 0) {
            console.log(`✅ 找到 ${primaryBtns.length} 个主要按钮`);
        }

        // 绑定图表周期切换按钮
        const chartBtns = document.querySelectorAll('.chart-btn');
        chartBtns.forEach(btn => {
            btn.addEventListener('click', (event) => {
                const period = parseInt(event.target.dataset.period);
                this.switchChartPeriod(period);
            });
        });
        if (chartBtns.length > 0) {
            console.log(`✅ 找到 ${chartBtns.length} 个图表按钮`);
        }

        console.log('🎯 事件绑定完成');

        // 添加手动更新统计的调试方法
        window.debugUpdateStats = () => {
            console.log('🔧 手动触发统计更新...');
            this.updateDownloadStatsDisplay();
        };

        // 延迟1秒后再次尝试更新显示（防止DOM未完全加载）
        setTimeout(() => {
            console.log('⏰ 延迟更新统计显示...');
            this.updateDownloadStatsDisplay();
        }, 1000);
    }
}

// 延迟初始化下载管理器（性能优化）
document.addEventListener('DOMContentLoaded', () => {
    // 延迟1秒初始化，避免阻塞页面渲染
    setTimeout(() => {
        window.downloadManager = new DownloadManager();
    }, 1000);
});

// 导出重新绑定事件的函数（避免重复绑定）
window.rebindDownloadEvents = function () {
    if (window.downloadManager && !window.downloadManager.eventsBound) {
        window.downloadManager.bindEvents();
        window.downloadManager.eventsBound = true;
    }
};

