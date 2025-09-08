/**
 * 用户权限管理工具
 * 提供用户角色、权限检查和管理的功能
 */

(function () {
    'use strict';

    // 用户权限管理类
    class UserPermissions {
        constructor() {
            this.currentUser = null;
            this.permissions = new Map();
            this.roles = new Map();
            this.initializeDefaultPermissions();
        }

        /**
         * 初始化默认权限配置
         */
        initializeDefaultPermissions() {
            // 角色权限配置
            this.roles.set('guest', {
                level: 0,
                name: '游客',
                permissions: ['view_server_status', 'view_news']
            });

            this.roles.set('user', {
                level: 1,
                name: '普通用户',
                permissions: ['view_server_status', 'view_news', 'download_client', 'view_profile', 'edit_profile']
            });

            this.roles.set('admin', {
                level: 2,
                name: '管理员',
                permissions: ['view_server_status', 'view_news', 'download_client', 'view_profile', 'edit_profile', 'manage_users', 'view_admin_panel', 'manage_server']
            });

            this.roles.set('super_admin', {
                level: 3,
                name: '超级管理员',
                permissions: ['view_server_status', 'view_news', 'download_client', 'view_profile', 'edit_profile', 'manage_users', 'view_admin_panel', 'manage_server', 'system_config', 'all_permissions']
            });

            // 权限描述
            this.permissions.set('view_server_status', '查看服务器状态');
            this.permissions.set('view_news', '查看新闻资讯');
            this.permissions.set('download_client', '下载客户端');
            this.permissions.set('view_profile', '查看个人资料');
            this.permissions.set('edit_profile', '编辑个人资料');
            this.permissions.set('manage_users', '管理用户');
            this.permissions.set('view_admin_panel', '访问管理面板');
            this.permissions.set('manage_server', '管理服务器');
            this.permissions.set('system_config', '系统配置');
            this.permissions.set('all_permissions', '所有权限');
        }

        /**
         * 设置当前用户
         * @param {Object} userData - 用户数据
         */
        setCurrentUser(userData) {
            this.currentUser = userData;
            console.log('✅ 当前用户已设置:', userData.username, '角色:', userData.role);
        }

        /**
         * 获取当前用户
         * @returns {Object|null} 当前用户数据
         */
        getCurrentUser() {
            return this.currentUser;
        }

        /**
         * 检查用户是否有指定权限
         * @param {string} permission - 权限名称
         * @returns {boolean} 是否有权限
         */
        hasPermission(permission) {
            if (!this.currentUser) {
                return false;
            }

            const userRole = this.roles.get(this.currentUser.role);
            if (!userRole) {
                return false;
            }

            // 超级管理员拥有所有权限
            if (userRole.permissions.includes('all_permissions')) {
                return true;
            }

            // 检查角色权限
            if (userRole.permissions.includes(permission)) {
                return true;
            }

            // 检查用户自定义权限
            if (this.currentUser.customPermissions && Array.isArray(this.currentUser.customPermissions)) {
                return this.currentUser.customPermissions.some(p => p.name === permission);
            }

            return false;
        }

        /**
         * 检查用户是否有指定角色级别
         * @param {string} roleName - 角色名称
         * @returns {boolean} 是否有角色级别
         */
        hasRoleLevel(roleName) {
            if (!this.currentUser) {
                return false;
            }

            const userRole = this.roles.get(this.currentUser.role);
            const targetRole = this.roles.get(roleName);

            if (!userRole || !targetRole) {
                return false;
            }

            return userRole.level >= targetRole.level;
        }

        /**
         * 获取用户角色信息
         * @returns {Object|null} 角色信息
         */
        getUserRole() {
            if (!this.currentUser) {
                return null;
            }

            return this.roles.get(this.currentUser.role);
        }

        /**
         * 获取用户所有权限
         * @returns {Array} 权限列表
         */
        getUserPermissions() {
            if (!this.currentUser) {
                return [];
            }

            const userRole = this.roles.get(this.currentUser.role);
            if (!userRole) {
                return [];
            }

            let permissions = [...userRole.permissions];

            // 添加用户自定义权限
            if (this.currentUser.customPermissions && Array.isArray(this.currentUser.customPermissions)) {
                const customPermissionNames = this.currentUser.customPermissions.map(p => p.name);
                permissions = [...permissions, ...customPermissionNames];
            }

            return permissions;
        }

        /**
         * 检查用户是否已登录
         * @returns {boolean} 是否已登录
         */
        isLoggedIn() {
            return this.currentUser !== null;
        }

        /**
         * 检查用户是否为管理员
         * @returns {boolean} 是否为管理员
         */
        isAdmin() {
            return this.hasRoleLevel('admin');
        }

        /**
         * 检查用户是否为超级管理员
         * @returns {boolean} 是否为超级管理员
         */
        isSuperAdmin() {
            return this.hasRoleLevel('super_admin');
        }

        /**
         * 获取用户显示名称
         * @returns {string} 显示名称
         */
        getDisplayName() {
            if (!this.currentUser) {
                return '游客';
            }

            return this.currentUser.display_name || this.currentUser.username || '未知用户';
        }

        /**
         * 获取用户头像
         * @returns {string} 头像URL
         */
        getAvatar() {
            if (!this.currentUser || !this.currentUser.avatar_url) {
                return '/assets/images/default-avatar.png';
            }

            return this.currentUser.avatar_url;
        }

        /**
         * 清除当前用户
         */
        clearCurrentUser() {
            this.currentUser = null;
            console.log('✅ 当前用户已清除');
        }

        /**
         * 获取所有可用权限
         * @returns {Map} 权限映射
         */
        getAllPermissions() {
            return this.permissions;
        }

        /**
         * 获取所有可用角色
         * @returns {Map} 角色映射
         */
        getAllRoles() {
            return this.roles;
        }
    }

    // 创建全局实例
    window.userPermissions = new UserPermissions();

    // 添加一些便捷的全局函数
    window.hasPermission = function (permission) {
        return window.userPermissions.hasPermission(permission);
    };

    window.hasRole = function (roleName) {
        return window.userPermissions.hasRoleLevel(roleName);
    };

    window.isAdmin = function () {
        return window.userPermissions.isAdmin();
    };

    window.isSuperAdmin = function () {
        return window.userPermissions.isSuperAdmin();
    };

    console.log('✅ 用户权限工具已加载');
})();
