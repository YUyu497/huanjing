/**
 * 登录记录页面JavaScript
 * 管理用户登录历史的显示和交互
 */

class LoginHistoryPage {
    constructor() {
        this.currentUser = null;
        this.loginHistory = [];
        this.filteredHistory = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = {
            dateRange: 'all',
            status: 'all',
            ip: ''
        };
        
        this.init();
    }

    /**
     * 初始化页面
     */
    async init() {
        console.log('📊 登录记录页面初始化');
        
        // 检查用户登录状态
        await this.checkUserAuth();
        
        // 初始化页面组件
        this.initStats();
        this.initFilters();
        this.initTable();
        this.initPagination();
        
        // 加载登录记录数据
        await this.loadLoginHistory();
        
        // 绑定事件
        this.bindEvents();
        
        console.log('✅ 登录记录页面初始化完成');
    }

    /**
     * 检查用户认证状态
     */
    async checkUserAuth() {
        const userInfo = localStorage.getItem('userInfo');
        const sessionToken = localStorage.getItem('sessionToken');
        
        if (!userInfo || !sessionToken) {
            this.showNotification('请先登录以查看登录记录', 'warning');
            setTimeout(() => {
                window.location.href = '../auth/auth.html';
            }, 2000);
            return;
        }
        
        try {
            this.currentUser = JSON.parse(userInfo);
            console.log('✅ 用户已登录:', this.currentUser.username);
        } catch (error) {
            console.error('❌ 解析用户信息失败:', error);
            this.showNotification('用户信息解析失败', 'error');
            setTimeout(() => {
                window.location.href = '../auth/auth.html';
            }, 2000);
        }
    }

    /**
     * 初始化统计信息
     */
    initStats() {
        // 统计信息将在loadLoginHistory中更新
    }

    /**
     * 初始化筛选器
     */
    initFilters() {
        const dateRangeSelect = document.getElementById('dateRange');
        const statusFilter = document.getElementById('statusFilter');
        const ipFilter = document.getElementById('ipFilter');
        
        if (dateRangeSelect) {
            dateRangeSelect.value = this.filters.dateRange;
        }
        if (statusFilter) {
            statusFilter.value = this.filters.status;
        }
        if (ipFilter) {
            ipFilter.value = this.filters.ip;
        }
    }

    /**
     * 初始化表格
     */
    initTable() {
        const tableBody = document.getElementById('loginHistoryBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6" class="loading-cell">正在加载数据...</td></tr>';
        }
    }

    /**
     * 初始化分页
     */
    initPagination() {
        const pagination = document.getElementById('pagination');
        if (pagination) {
            pagination.innerHTML = '';
        }
    }

    /**
     * 加载登录记录数据
     */
    async loadLoginHistory() {
        try {
            // 模拟API调用 - 实际项目中应该调用真实API
            this.loginHistory = this.generateMockData();
            this.filteredHistory = [...this.loginHistory];
            
            this.updateStats();
            this.updateTable();
            this.updatePagination();
            
            console.log('✅ 登录记录加载完成:', this.loginHistory.length, '条记录');
        } catch (error) {
            console.error('❌ 加载登录记录失败:', error);
            this.showNotification('加载登录记录失败', 'error');
        }
    }

    /**
     * 生成模拟数据
     */
    generateMockData() {
        const mockData = [];
        const now = new Date();
        const statuses = ['success', 'failed'];
        const failureReasons = ['密码错误', '账户被锁定', '验证码错误', '网络超时'];
        const devices = ['Windows 10 - Chrome', 'Windows 11 - Firefox', 'macOS - Safari', 'Android - Chrome', 'iOS - Safari'];
        const loginMethods = ['密码登录', '邮箱验证', '手机验证'];
        const ips = ['192.168.1.100', '10.0.0.50', '172.16.0.25', '203.0.113.1', '198.51.100.1'];
        
        for (let i = 0; i < 50; i++) {
            const date = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const isSuccess = status === 'success';
            
            mockData.push({
                id: i + 1,
                timestamp: date.toISOString(),
                ip: ips[Math.floor(Math.random() * ips.length)],
                device: devices[Math.floor(Math.random() * devices.length)],
                method: loginMethods[Math.floor(Math.random() * loginMethods.length)],
                status: status,
                failureReason: isSuccess ? null : failureReasons[Math.floor(Math.random() * failureReasons.length)]
            });
        }
        
        return mockData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * 更新统计信息
     */
    updateStats() {
        const totalLogins = this.loginHistory.length;
        const successfulLogins = this.loginHistory.filter(record => record.status === 'success').length;
        const uniqueIPs = new Set(this.loginHistory.map(record => record.ip)).size;
        const lastLogin = this.loginHistory.length > 0 ? this.loginHistory[0] : null;
        const successRate = totalLogins > 0 ? ((successfulLogins / totalLogins) * 100).toFixed(1) : '0.0';
        
        // 更新统计卡片
        this.updateStatCard('totalLogins', totalLogins.toString());
        this.updateStatCard('lastLogin', lastLogin ? this.formatDate(lastLogin.timestamp) : '--');
        this.updateStatCard('uniqueIPs', uniqueIPs.toString());
        this.updateStatCard('successRate', successRate + '%');
    }

    /**
     * 更新统计卡片
     */
    updateStatCard(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * 更新表格
     */
    updateTable() {
        const tableBody = document.getElementById('loginHistoryBody');
        const totalRecords = document.getElementById('totalRecords');
        
        if (!tableBody) return;
        
        // 计算当前页的数据
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredHistory.slice(startIndex, endIndex);
        
        if (pageData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="no-data">暂无数据</td></tr>';
            return;
        }
        
        tableBody.innerHTML = pageData.map(record => `
            <tr>
                <td>${this.formatDateTime(record.timestamp)}</td>
                <td>${record.ip}</td>
                <td>${record.device}</td>
                <td>${record.method}</td>
                <td>
                    <span class="status-badge ${record.status}">
                        ${record.status === 'success' ? '成功' : '失败'}
                    </span>
                </td>
                <td>${record.failureReason || '--'}</td>
            </tr>
        `).join('');
        
        if (totalRecords) {
            totalRecords.textContent = this.filteredHistory.length;
        }
    }

    /**
     * 更新分页
     */
    updatePagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(this.filteredHistory.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // 上一页按钮
        if (this.currentPage > 1) {
            paginationHTML += `<button class="page-btn" data-page="${this.currentPage - 1}">
                <i class="fas fa-chevron-left"></i> 上一页
            </button>`;
        }
        
        // 页码按钮
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage ? 'active' : '';
            paginationHTML += `<button class="page-btn ${isActive}" data-page="${i}">${i}</button>`;
        }
        
        // 下一页按钮
        if (this.currentPage < totalPages) {
            paginationHTML += `<button class="page-btn" data-page="${this.currentPage + 1}">
                下一页 <i class="fas fa-chevron-right"></i>
            </button>`;
        }
        
        pagination.innerHTML = paginationHTML;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 筛选器事件
        const applyFiltersBtn = document.getElementById('applyFilters');
        const resetFiltersBtn = document.getElementById('resetFilters');
        const exportDataBtn = document.getElementById('exportData');
        
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }
        
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => this.resetFilters());
        }
        
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.exportData());
        }
        
        // 分页事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-btn')) {
                const page = parseInt(e.target.dataset.page);
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.updateTable();
                    this.updatePagination();
                }
            }
        });
    }

    /**
     * 应用筛选器
     */
    applyFilters() {
        const dateRange = document.getElementById('dateRange')?.value || 'all';
        const status = document.getElementById('statusFilter')?.value || 'all';
        const ip = document.getElementById('ipFilter')?.value || '';
        
        this.filters = { dateRange, status, ip };
        
        // 应用筛选逻辑
        this.filteredHistory = this.loginHistory.filter(record => {
            // 日期筛选
            if (dateRange !== 'all') {
                const recordDate = new Date(record.timestamp);
                const now = new Date();
                let startDate;
                
                switch (dateRange) {
                    case 'today':
                        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        break;
                    case 'week':
                        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case 'month':
                        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        startDate = null;
                }
                
                if (startDate && recordDate < startDate) {
                    return false;
                }
            }
            
            // 状态筛选
            if (status !== 'all' && record.status !== status) {
                return false;
            }
            
            // IP筛选
            if (ip && !record.ip.includes(ip)) {
                return false;
            }
            
            return true;
        });
        
        this.currentPage = 1;
        this.updateTable();
        this.updatePagination();
        
        this.showNotification(`筛选完成，找到 ${this.filteredHistory.length} 条记录`, 'success');
    }

    /**
     * 重置筛选器
     */
    resetFilters() {
        this.filters = { dateRange: 'all', status: 'all', ip: '' };
        
        document.getElementById('dateRange').value = 'all';
        document.getElementById('statusFilter').value = 'all';
        document.getElementById('ipFilter').value = '';
        
        this.filteredHistory = [...this.loginHistory];
        this.currentPage = 1;
        this.updateTable();
        this.updatePagination();
        
        this.showNotification('筛选器已重置', 'info');
    }

    /**
     * 导出数据
     */
    exportData() {
        if (this.filteredHistory.length === 0) {
            this.showNotification('没有数据可导出', 'warning');
            return;
        }
        
        // 生成CSV数据
        const headers = ['时间', 'IP地址', '设备信息', '登录方式', '结果', '失败原因'];
        const csvData = [
            headers.join(','),
            ...this.filteredHistory.map(record => [
                this.formatDateTime(record.timestamp),
                record.ip,
                record.device,
                record.method,
                record.status === 'success' ? '成功' : '失败',
                record.failureReason || ''
            ].join(','))
        ].join('\n');
        
        // 创建下载链接
        const blob = new Blob(['\ufeff' + csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `登录记录_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('数据导出成功', 'success');
    }

    /**
     * 格式化日期时间
     */
    formatDateTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * 格式化日期
     */
    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('zh-CN');
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        // 使用全局通知函数或创建简单的通知
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    new LoginHistoryPage();
});
