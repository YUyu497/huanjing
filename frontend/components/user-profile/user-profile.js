/**
 * 用户资料组件
 * 显示用户身份、权限和相关信息
 */

class UserProfile {
    constructor() {
        this.init();
    }

    init() {
        this.createUserProfileUI();
        this.bindEvents();
        this.updateUserInfo();
    }

    /**
     * 创建用户资料UI
     */
    createUserProfileUI() {
        // 检查是否已存在
        if (document.querySelector('.user-profile-widget')) {
            return;
        }

        const profileHTML = `
            <div class="user-profile-widget">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="profile-info">
                        <div class="profile-name">未登录</div>
                        <div class="profile-role">
                            <span class="role-badge guest">游客</span>
                        </div>
                    </div>
                    <div class="profile-actions">
                        <button class="profile-toggle" title="切换用户资料">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                </div>
                
                <div class="profile-details" style="display: none;">
                    <div class="profile-section">
                        <h4>用户信息</h4>
                        <div class="info-item">
                            <span class="label">用户ID:</span>
                            <span class="value" id="profile-user-id">--</span>
                        </div>
                        <div class="info-item">
                            <span class="label">邮箱:</span>
                            <span class="value" id="profile-email">--</span>
                        </div>
                        <div class="info-item">
                            <span class="label">注册时间:</span>
                            <span class="value" id="profile-created">--</span>
                        </div>
                        <div class="info-item">
                            <span class="label">最后登录:</span>
                            <span class="value" id="profile-last-login">--</span>
                        </div>
                    </div>
                    
                    <div class="profile-section">
                        <h4>权限信息</h4>
                        <div class="info-item">
                            <span class="label">角色等级:</span>
                            <span class="value" id="profile-role-level">--</span>
                        </div>
                        <div class="info-item">
                            <span class="label">可用功能:</span>
                            <span class="value" id="profile-features-count">--</span>
                        </div>
                        <div class="permissions-list" id="profile-permissions">
                            <!-- 权限列表将在这里动态生成 -->
                        </div>
                    </div>
                    
                    <div class="profile-section">
                        <h4>快速操作</h4>
                        <div class="quick-actions">
                            <button class="action-btn primary" id="edit-profile-btn" style="display: none;">
                                <i class="fas fa-edit"></i> 编辑资料
                            </button>
                            <button class="action-btn secondary" id="change-password-btn" style="display: none;">
                                <i class="fas fa-key"></i> 修改密码
                            </button>
                            <button class="action-btn info" id="login-history-btn" style="display: none;">
                                <i class="fas fa-history"></i> 登录记录
                            </button>
                            <button class="action-btn admin" id="admin-panel-btn" style="display: none;">
                                <i class="fas fa-cog"></i> 管理面板
                            </button>
                            <button class="action-btn danger" id="logout-btn" style="display: none;">
                                <i class="fas fa-sign-out-alt"></i> 退出登录
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 插入到页面中
        const targetElement = document.querySelector('.auth-container') ||
            document.querySelector('.main-content') ||
            document.body;

        if (targetElement) {
            targetElement.insertAdjacentHTML('beforeend', profileHTML);
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        const profileToggle = document.querySelector('.profile-toggle');
        const profileDetails = document.querySelector('.profile-details');

        if (profileToggle && profileDetails) {
            profileToggle.addEventListener('click', () => {
                const isVisible = profileDetails.style.display !== 'none';
                profileDetails.style.display = isVisible ? 'none' : 'block';

                const icon = profileToggle.querySelector('i');
                icon.className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
            });
        }

        // 绑定快速操作按钮事件
        this.bindQuickActionEvents();
    }

    /**
     * 绑定快速操作按钮事件
     */
    bindQuickActionEvents() {
        // 编辑资料
        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                this.showEditProfileModal();
            });
        }

        // 修改密码
        const changePasswordBtn = document.getElementById('change-password-btn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                this.showChangePasswordModal();
            });
        }

        // 登录记录
        const loginHistoryBtn = document.getElementById('login-history-btn');
        if (loginHistoryBtn) {
            loginHistoryBtn.addEventListener('click', () => {
                this.viewLoginHistory();
            });
        }

        // 管理面板
        const adminPanelBtn = document.getElementById('admin-panel-btn');
        if (adminPanelBtn) {
            adminPanelBtn.addEventListener('click', () => {
                this.openAdminPanel();
            });
        }

        // 退出登录
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    /**
     * 更新用户信息
     */
    updateUserInfo() {
        const token = localStorage.getItem('token');

        if (token) {
            // 用户已登录，获取用户信息
            this.fetchUserInfo();
        } else {
            // 用户未登录，显示游客状态
            this.showGuestState();
        }
    }

    /**
     * 获取用户信息
     */
    async fetchUserInfo() {
        try {
            const response = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                this.updateUserProfile(userData);
            } else {
                console.warn('获取用户信息失败');
                this.showGuestState();
            }
        } catch (error) {
            console.error('获取用户信息错误:', error);
            this.showGuestState();
        }
    }

    /**
     * 更新用户资料显示
     */
    updateUserProfile(userData) {
        // 设置当前用户信息
        if (window.userPermissions) {
            window.userPermissions.setCurrentUser(userData);
        }

        // 更新基本信息
        const profileName = document.querySelector('.profile-name');
        const profileRole = document.querySelector('.profile-role .role-badge');

        if (profileName) {
            profileName.textContent = userData.username || '未知用户';
        }

        if (profileRole) {
            profileRole.className = `role-badge ${userData.role || 'user'}`;
            profileRole.textContent = this.getRoleDisplayName(userData.role);
        }

        // 更新详细信息
        this.updateProfileDetails(userData);

        // 更新权限信息
        this.updatePermissionsInfo();

        // 更新快速操作按钮
        this.updateQuickActions(userData.role);
    }

    /**
     * 更新详细信息
     */
    updateProfileDetails(userData) {
        const userId = document.getElementById('profile-user-id');
        const email = document.getElementById('profile-email');
        const created = document.getElementById('profile-created');
        const lastLogin = document.getElementById('profile-last-login');

        if (userId) userId.textContent = userData.id || '--';
        if (email) email.textContent = userData.email || '--';
        if (created) created.textContent = userData.created_at ? new Date(userData.created_at).toLocaleDateString() : '--';
        if (lastLogin) lastLogin.textContent = userData.last_login ? new Date(userData.last_login).toLocaleDateString() : '--';
    }

    /**
     * 更新权限信息
     */
    updatePermissionsInfo() {
        if (!window.userPermissions) return;

        const roleLevel = document.getElementById('profile-role-level');
        const featuresCount = document.getElementById('profile-features-count');
        const permissionsList = document.getElementById('profile-permissions');

        const summary = window.userPermissions.getPermissionSummary();

        if (roleLevel) roleLevel.textContent = summary.roleLevel;
        if (featuresCount) featuresCount.textContent = summary.accessibleFeatures;

        if (permissionsList) {
            permissionsList.innerHTML = summary.permissions.map(permission => `
                <div class="permission-item">
                    <i class="fas fa-check"></i>
                    <span>${permission.name}</span>
                </div>
            `).join('');
        }
    }

    /**
     * 更新快速操作按钮
     */
    updateQuickActions(userRole) {
        const editProfileBtn = document.getElementById('edit-profile-btn');
        const changePasswordBtn = document.getElementById('change-password-btn');
        const loginHistoryBtn = document.getElementById('login-history-btn');
        const adminPanelBtn = document.getElementById('admin-panel-btn');
        const logoutBtn = document.getElementById('logout-btn');

        // 编辑资料 - 所有登录用户都可以
        if (editProfileBtn) editProfileBtn.style.display = 'inline-block';

        // 修改密码 - 所有登录用户都可以
        if (changePasswordBtn) changePasswordBtn.style.display = 'inline-block';

        // 登录记录 - 所有登录用户都可以
        if (loginHistoryBtn) loginHistoryBtn.style.display = 'inline-block';

        // 管理面板 - 只有管理员和超级管理员可以
        if (adminPanelBtn) {
            adminPanelBtn.style.display = (userRole === 'admin' || userRole === 'super_admin') ? 'inline-block' : 'none';
        }

        // 退出登录 - 所有登录用户都可以
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
    }

    /**
     * 显示游客状态
     */
    showGuestState() {
        const profileName = document.querySelector('.profile-name');
        const profileRole = document.querySelector('.profile-role .role-badge');

        if (profileName) profileName.textContent = '未登录';
        if (profileRole) {
            profileRole.className = 'role-badge guest';
            profileRole.textContent = '游客';
        }

        // 隐藏详细信息
        const profileDetails = document.querySelector('.profile-details');
        if (profileDetails) profileDetails.style.display = 'none';

        // 隐藏所有快速操作按钮
        this.hideAllQuickActions();
    }

    /**
     * 隐藏所有快速操作按钮
     */
    hideAllQuickActions() {
        const buttons = ['edit-profile-btn', 'change-password-btn', 'login-history-btn', 'admin-panel-btn', 'logout-btn'];
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) btn.style.display = 'none';
        });
    }

    /**
     * 获取角色显示名称
     */
    getRoleDisplayName(role) {
        const roleNames = {
            'user': '普通用户',
            'admin': '管理员',
            'super_admin': '超级管理员',
            'guest': '游客'
        };
        return roleNames[role] || '未知角色';
    }

    /**
     * 显示编辑资料模态框
     */
    showEditProfileModal() {
        // 这里可以实现编辑资料的模态框
        console.log('显示编辑资料模态框');
    }

    /**
     * 显示修改密码模态框
     */
    showChangePasswordModal() {
        // 这里可以实现修改密码的模态框
        console.log('显示修改密码模态框');
    }

    /**
     * 查看登录记录
     */
    viewLoginHistory() {
        // 跳转到登录记录页面
        window.location.href = '/pages/user/login-history.html';
    }

    /**
     * 打开管理面板
     */
    openAdminPanel() {
        // 这里可以实现管理面板的跳转
        console.log('打开管理面板');
        // window.location.href = '/admin';
    }

    /**
     * 退出登录
     */
    logout() {
        if (confirm('确定要退出登录吗？')) {
            localStorage.removeItem('token');
            this.showGuestState();

            // 刷新页面或更新其他相关状态
            if (typeof window.updateInterfaceForGuest === 'function') {
                window.updateInterfaceForGuest();
            }
        }
    }
}

// 页面加载完成后初始化 - 已禁用游客状态指示器
// document.addEventListener('DOMContentLoaded', () => {
//     new UserProfile();
// });

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserProfile;
}
