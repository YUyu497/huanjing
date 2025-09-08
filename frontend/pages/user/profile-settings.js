/**
 * 个人设置页面JavaScript
 * 整合基本资料、安全设置、偏好设置和登录记录功能
 */

class ProfileSettingsPage {
    constructor() {
        this.currentUser = null;
        this.loginHistory = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.filters = {
            dateRange: 30,
            loginResult: 'all',
            searchIP: ''
        };
        this.init();
    }

    init() {
        // 等待用户权限工具加载完成
        this.waitForUserPermissions();
        this.bindEvents();
        console.log('✅ 个人设置页面初始化完成');
    }

    /**
     * 等待用户权限工具加载完成
     */
    waitForUserPermissions() {
        const checkInterval = setInterval(() => {
            if (typeof window.userPermissions !== 'undefined') {
                clearInterval(checkInterval);
                this.checkAuth();
            }
        }, 100);

        // 设置超时，避免无限等待
        setTimeout(() => {
            clearInterval(checkInterval);
            if (typeof window.userPermissions === 'undefined') {
                console.warn('用户权限工具加载超时');
                this.checkAuth();
            }
        }, 5000);
    }

    /**
     * 检查用户认证状态
     */
    checkAuth() {
        // 首先尝试从用户权限工具获取用户信息
        if (window.userPermissions && window.userPermissions.getCurrentUser()) {
            this.currentUser = window.userPermissions.getCurrentUser();
            this.populateUserInfo();
            this.loadUserPreferences();
            // 同步到localStorage，确保其他页面能获取到
            this.syncUserDataToStorage();
            return;
        }

        // 如果没有，则尝试从localStorage获取用户信息
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                this.currentUser = JSON.parse(userInfo);
                this.populateUserInfo();
                this.loadUserPreferences();
                // 同步到用户权限工具，确保状态一致
                this.syncUserDataToPermissions();
                return;
            } catch (error) {
                console.warn('解析用户信息失败:', error);
            }
        }

        // 如果localStorage中也没有，则从localStorage获取sessionToken
        const sessionToken = localStorage.getItem('sessionToken');
        if (!sessionToken) {
            this.showNotification('请先登录', 'error');
            setTimeout(() => {
                window.location.href = '../auth/auth.html';
            }, 2000);
            return;
        }

        // 获取用户信息
        this.fetchUserInfo();
    }

    /**
     * 获取用户信息
     */
    async fetchUserInfo() {
        try {
            const response = await fetch('/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.currentUser = result.user;
                this.populateUserInfo();
                this.loadUserPreferences();
                // 同步用户数据到存储和权限工具
                this.syncUserDataToStorage();
                this.syncUserDataToPermissions();
            } else {
                this.showNotification('获取用户信息失败', 'error');
                setTimeout(() => {
                    window.location.href = '../auth/auth.html';
                }, 2000);
            }
        } catch (error) {
            console.error('获取用户信息失败:', error);
            this.showNotification('网络错误，请稍后重试', 'error');
        }
    }

    /**
     * 填充用户信息到表单
     */
    populateUserInfo() {
        if (!this.currentUser) return;

        // 填充基本资料
        document.getElementById('username').value = this.currentUser.username || '';
        document.getElementById('email').value = this.currentUser.email || '';
        document.getElementById('displayName').value = this.currentUser.displayName || '';

        // 设置用户组
        const userGroupSelect = document.getElementById('userGroup');
        if (userGroupSelect) {
            userGroupSelect.value = this.currentUser.userGroup || 'default';
        }
    }

    /**
     * 加载用户偏好设置
     */
    loadUserPreferences() {
        // 从localStorage加载用户偏好设置
        const preferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');

        // 设置开关状态
        document.getElementById('loginNotifications').checked = preferences.loginNotifications !== false;
        document.getElementById('serverNotifications').checked = preferences.serverNotifications !== false;
        document.getElementById('eventNotifications').checked = preferences.eventNotifications !== false;

        // 设置选择框
        document.getElementById('theme').value = preferences.theme || 'auto';
        document.getElementById('language').value = preferences.language || 'zh-CN';
        document.getElementById('timezone').value = preferences.timezone || 'Asia/Shanghai';
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 标签页切换
        this.bindTabEvents();

        // 表单提交
        this.bindFormEvents();

        // 密码显示切换
        this.bindPasswordToggle();

        // 偏好设置变更
        this.bindPreferenceEvents();

        // 登录记录相关事件
        this.bindHistoryEvents();
    }

    /**
     * 绑定标签页事件
     */
    bindTabEvents() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.settings-tab');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                this.switchTab(targetTab, tabBtns, tabContents);

                // 如果切换到登录记录标签页，加载数据
                if (targetTab === 'history') {
                    this.loadLoginHistory();
                }
            });
        });
    }

    /**
     * 切换标签页
     */
    switchTab(targetTab, tabBtns, tabContents) {
        // 更新按钮状态
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${targetTab}"]`).classList.add('active');

        // 更新内容显示
        tabContents.forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(targetTab).classList.add('active');
    }

    /**
     * 绑定表单事件
     */
    bindFormEvents() {
        // 基本资料表单
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProfileUpdate();
            });
        }

        // 密码修改表单
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordChange();
            });
        }
    }

    /**
     * 绑定密码显示切换事件
     */
    bindPasswordToggle() {
        const toggleBtns = document.querySelectorAll('.toggle-password');

        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                const input = document.getElementById(targetId);
                const icon = btn.querySelector('i');

                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    }

    /**
     * 绑定偏好设置事件
     */
    bindPreferenceEvents() {
        // 监听所有开关和选择框的变化
        const preferenceElements = document.querySelectorAll('input[type="checkbox"], select');

        preferenceElements.forEach(element => {
            element.addEventListener('change', () => {
                this.saveUserPreferences();
            });
        });
    }

    /**
     * 绑定登录记录相关事件
     */
    bindHistoryEvents() {
        // 筛选按钮
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }

        // 重置筛选按钮
        const resetFiltersBtn = document.getElementById('resetFilters');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        // 导出数据按钮
        const exportDataBtn = document.getElementById('exportData');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.exportLoginHistory();
            });
        }

        // 筛选条件变化
        const filterElements = document.querySelectorAll('#dateRange, #loginResult, #searchIP');
        filterElements.forEach(element => {
            element.addEventListener('change', () => {
                this.updateFilters();
            });
        });
    }

    /**
     * 处理基本资料更新
     */
    async handleProfileUpdate() {
        const formData = new FormData(document.getElementById('profileForm'));
        const updateData = {
            displayName: formData.get('displayName'),
            userGroup: formData.get('userGroup')
        };

        try {
            const response = await fetch('/api/user/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                this.showNotification('基本资料更新成功', 'success');
                // 更新本地用户信息
                if (this.currentUser) {
                    this.currentUser.displayName = updateData.displayName;
                    this.currentUser.userGroup = updateData.userGroup;
                }
            } else {
                const result = await response.json();
                this.showNotification(result.message || '更新失败', 'error');
            }
        } catch (error) {
            console.error('更新基本资料失败:', error);
            this.showNotification('网络错误，请稍后重试', 'error');
        }
    }

    /**
     * 处理密码修改
     */
    async handlePasswordChange() {
        const formData = new FormData(document.getElementById('passwordForm'));
        const passwordData = {
            currentPassword: formData.get('currentPassword'),
            newPassword: formData.get('newPassword'),
            confirmPassword: formData.get('confirmPassword')
        };

        // 验证密码
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            this.showNotification('两次输入的新密码不一致', 'error');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            this.showNotification('新密码长度不能少于6位', 'error');
            return;
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
            this.showNotification('新密码必须包含大小写字母和数字', 'error');
            return;
        }

        try {
            const response = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            if (response.ok) {
                this.showNotification('密码修改成功', 'success');
                // 清空表单
                document.getElementById('passwordForm').reset();
            } else {
                const result = await response.json();
                this.showNotification(result.message || '密码修改失败', 'error');
            }
        } catch (error) {
            console.error('修改密码失败:', error);
            this.showNotification('网络错误，请稍后重试', 'error');
        }
    }

    /**
     * 保存用户偏好设置
     */
    saveUserPreferences() {
        const preferences = {
            loginNotifications: document.getElementById('loginNotifications').checked,
            serverNotifications: document.getElementById('serverNotifications').checked,
            eventNotifications: document.getElementById('eventNotifications').checked,
            theme: document.getElementById('theme').value,
            language: document.getElementById('language').value,
            timezone: document.getElementById('timezone').value
        };

        // 保存到localStorage
        localStorage.setItem('userPreferences', JSON.stringify(preferences));

        // 应用主题设置
        this.applyTheme(preferences.theme);

        // 应用语言设置
        this.applyLanguage(preferences.language);

        this.showNotification('偏好设置已保存', 'success');
        console.log('✅ 用户偏好设置已保存');
    }

    /**
     * 应用主题设置
     */
    applyTheme(theme) {
        const body = document.body;

        // 移除现有主题类
        body.classList.remove('theme-light', 'theme-dark');

        if (theme === 'light') {
            body.classList.add('theme-light');
        } else if (theme === 'dark') {
            body.classList.add('theme-dark');
        }
        // auto模式不添加类，使用系统默认
    }

    /**
     * 应用语言设置
     */
    applyLanguage(language) {
        // 这里可以实现语言切换逻辑
        console.log('应用语言设置:', language);
    }

    /**
     * 加载登录记录
     */
    async loadLoginHistory() {
        try {
            // 显示加载状态
            this.showLoadingState();

            // 这里应该调用实际的API，现在使用模拟数据
            const mockData = this.generateMockLoginHistory();
            this.loginHistory = mockData;

            // 更新统计信息
            this.updateHistoryStatistics();

            // 渲染表格
            this.renderHistoryTable();

            // 渲染分页
            this.renderPagination();

        } catch (error) {
            console.error('加载登录记录失败:', error);
            this.showNotification('加载登录记录失败', 'error');
        }
    }

    /**
     * 生成模拟登录记录数据
     */
    generateMockLoginHistory() {
        const mockData = [];
        const now = new Date();
        const loginMethods = ['密码登录', '验证码登录', 'QQ登录'];
        const results = ['success', 'failed'];
        const failureReasons = ['密码错误', '验证码错误', '账户被锁定', '网络超时', '设备异常'];
        const ips = ['192.168.1.100', '10.0.0.50', '172.16.0.25', '203.0.113.10', '45.32.123.45'];

        for (let i = 0; i < 50; i++) {
            const date = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
            const result = results[Math.floor(Math.random() * results.length)];

            mockData.push({
                id: i + 1,
                timestamp: date.toISOString(),
                ipAddress: ips[Math.floor(Math.random() * ips.length)],
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                loginMethod: loginMethods[Math.floor(Math.random() * loginMethods.length)],
                result: result,
                failureReason: result === 'failed' ? failureReasons[Math.floor(Math.random() * failureReasons.length)] : null
            });
        }

        return mockData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * 更新登录记录统计
     */
    updateHistoryStatistics() {
        const totalLogins = this.loginHistory.length;
        const successfulLogins = this.loginHistory.filter(record => record.result === 'success').length;
        const uniqueIPs = new Set(this.loginHistory.map(record => record.ipAddress)).size;
        const successRate = totalLogins > 0 ? Math.round((successfulLogins / totalLogins) * 100) : 0;

        const lastLogin = this.loginHistory.length > 0 ? this.loginHistory[0].timestamp : null;

        document.getElementById('totalLogins').textContent = totalLogins;
        document.getElementById('lastLogin').textContent = lastLogin ? this.formatRelativeTime(lastLogin) : '--';
        document.getElementById('uniqueIPs').textContent = uniqueIPs;
        document.getElementById('successRate').textContent = `${successRate}%`;
    }

    /**
     * 渲染登录记录表格
     */
    renderHistoryTable() {
        const tbody = document.getElementById('historyTableBody');
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageData = this.loginHistory.slice(startIndex, endIndex);

        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">暂无登录记录</td></tr>';
            return;
        }

        tbody.innerHTML = pageData.map(record => `
            <tr>
                <td>${this.formatDateTime(record.timestamp)}</td>
                <td>${record.ipAddress}</td>
                <td title="${record.userAgent}">${this.truncateUserAgent(record.userAgent)}</td>
                <td>${record.loginMethod}</td>
                <td>
                    <span class="status-badge ${record.result}">
                        ${record.result === 'success' ? '成功' : '失败'}
                    </span>
                </td>
                <td>${record.failureReason || '-'}</td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="profileSettingsPage.viewRecordDetails(${record.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // 更新记录数量
        document.getElementById('recordCount').textContent = this.loginHistory.length;
    }

    /**
     * 渲染分页控件
     */
    renderPagination() {
        const totalPages = Math.ceil(this.loginHistory.length / this.pageSize);
        const pagination = document.getElementById('pagination');

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // 上一页按钮
        paginationHTML += `
            <button ${this.currentPage === 1 ? 'disabled' : ''} onclick="profileSettingsPage.goToPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // 页码按钮
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                paginationHTML += `
                    <button class="${i === this.currentPage ? 'active' : ''}" onclick="profileSettingsPage.goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                paginationHTML += '<span>...</span>';
            }
        }

        // 下一页按钮
        paginationHTML += `
            <button ${this.currentPage === totalPages ? 'disabled' : ''} onclick="profileSettingsPage.goToPage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        pagination.innerHTML = paginationHTML;
    }

    /**
     * 跳转到指定页面
     */
    goToPage(page) {
        this.currentPage = page;
        this.renderHistoryTable();
        this.renderPagination();
    }

    /**
     * 应用筛选条件
     */
    applyFilters() {
        this.currentPage = 1;
        this.loadLoginHistory();
    }

    /**
     * 重置筛选条件
     */
    resetFilters() {
        this.filters = {
            dateRange: 30,
            loginResult: 'all',
            searchIP: ''
        };

        // 重置表单
        document.getElementById('dateRange').value = '30';
        document.getElementById('loginResult').value = 'all';
        document.getElementById('searchIP').value = '';

        this.currentPage = 1;
        this.loadLoginHistory();
    }

    /**
     * 更新筛选条件
     */
    updateFilters() {
        this.filters.dateRange = parseInt(document.getElementById('dateRange').value);
        this.filters.loginResult = document.getElementById('loginResult').value;
        this.filters.searchIP = document.getElementById('searchIP').value;
    }

    /**
     * 导出登录记录
     */
    exportLoginHistory() {
        // 这里可以实现CSV导出功能
        this.showNotification('导出功能开发中', 'info');
    }

    /**
     * 查看记录详情
     */
    viewRecordDetails(recordId) {
        const record = this.loginHistory.find(r => r.id === recordId);
        if (record) {
            this.showNotification(`查看记录详情: ${record.ipAddress} - ${record.loginMethod}`, 'info');
        }
    }

    /**
     * 显示加载状态
     */
    showLoadingState() {
        const tbody = document.getElementById('historyTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    加载中...
                </td>
            </tr>
        `;
    }

    /**
     * 格式化日期时间
     */
    formatDateTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        if (diff < 2592000000) return `${Math.floor(diff / 86400000)}天前`;

        return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * 格式化相对时间
     */
    formatRelativeTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 86400000) return '今天';
        if (diff < 172800000) return '昨天';
        if (diff < 2592000000) return `${Math.floor(diff / 86400000)}天前`;

        return date.toLocaleDateString('zh-CN');
    }

    /**
     * 截断用户代理字符串
     */
    truncateUserAgent(userAgent) {
        if (userAgent.length <= 50) return userAgent;
        return userAgent.substring(0, 50) + '...';
    }

    /**
     * 同步用户数据到localStorage
     */
    syncUserDataToStorage() {
        if (this.currentUser) {
            localStorage.setItem('userInfo', JSON.stringify(this.currentUser));
            console.log('✅ 用户数据已同步到localStorage');
        }
    }

    /**
     * 同步用户数据到权限工具
     */
    syncUserDataToPermissions() {
        if (this.currentUser && window.userPermissions) {
            window.userPermissions.setCurrentUser(this.currentUser);
            console.log('✅ 用户数据已同步到权限工具');
        }
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const messageElement = notification.querySelector('.notification-message');
        const iconElement = notification.querySelector('.notification-icon');

        // 清除之前的定时器
        if (this.notificationTimer) {
            clearTimeout(this.notificationTimer);
        }

        // 设置消息内容
        messageElement.textContent = message;

        // 设置图标和样式
        notification.className = `notification ${type}`;
        iconElement.className = 'notification-icon';

        switch (type) {
            case 'success':
                iconElement.classList.add('fas', 'fa-check-circle');
                break;
            case 'error':
                iconElement.classList.add('fas', 'fa-exclamation-circle');
                break;
            case 'warning':
                iconElement.classList.add('fas', 'fa-exclamation-triangle');
                break;
            default:
                iconElement.classList.add('fas', 'fa-info-circle');
        }

        // 显示通知
        notification.classList.add('show');

        // 自动隐藏
        this.notificationTimer = setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }
}

// 创建全局实例
window.profileSettingsPage = new ProfileSettingsPage();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 实例已在上面创建
});
