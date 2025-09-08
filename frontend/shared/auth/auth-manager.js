/**
 * 全局认证状态管理器
 * 用于管理用户登录状态，避免重复验证
 */

class AuthManager {
    constructor() {
        // 防止重复初始化
        if (window.authManagerInstance) {
            console.log('⚠️ 认证管理器已存在，返回现有实例');
            return window.authManagerInstance;
        }

        this.isAuthenticated = false;
        this.sessionToken = null;
        this.userInfo = null;
        this.lastAuthCheck = null;
        this.authCheckInterval = 5 * 60 * 1000; // 5分钟内的验证结果可以复用

        // 从本地存储恢复状态
        this.restoreFromStorage();

        // 标记为已初始化
        window.authManagerInstance = this;

        console.log('🔐 认证管理器已初始化');
    }

    /**
     * 从本地存储恢复认证状态
     */
    restoreFromStorage() {
        this.sessionToken = localStorage.getItem('sessionToken');
        this.userInfo = localStorage.getItem('userInfo');
        this.lastAuthCheck = localStorage.getItem('lastAuthCheck');

        if (this.sessionToken && this.userInfo) {
            try {
                this.userInfo = JSON.parse(this.userInfo);
                this.isAuthenticated = true;
                console.log('🔐 从本地存储恢复认证状态');
            } catch (error) {
                console.error('解析用户信息失败:', error);
                this.clearAuthentication();
            }
        }
    }

    /**
     * 检查用户是否已认证
     * @returns {boolean}
     */
    isUserAuthenticated() {
        return this.isAuthenticated && !!this.sessionToken;
    }

    /**
     * 获取会话令牌
     * @returns {string|null}
     */
    getSessionToken() {
        return this.sessionToken;
    }

    /**
     * 获取用户信息
     * @returns {Object|null}
     */
    getUserInfo() {
        return this.userInfo;
    }

    /**
     * 设置认证状态
     * @param {string} token - 会话令牌
     * @param {Object} userInfo - 用户信息
     */
    setAuthenticated(token, userInfo) {
        this.sessionToken = token;
        this.userInfo = userInfo;
        this.isAuthenticated = true;
        this.lastAuthCheck = Date.now().toString();

        // 保存到本地存储
        localStorage.setItem('sessionToken', token);
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        localStorage.setItem('lastAuthCheck', this.lastAuthCheck);

        console.log('🔐 用户认证状态已设置');
    }

    /**
     * 清除认证状态
     */
    clearAuthentication() {
        this.isAuthenticated = false;
        this.sessionToken = null;
        this.userInfo = null;
        this.lastAuthCheck = null;

        // 清除本地存储
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('lastAuthCheck');

        console.log('🔐 用户认证状态已清除');
    }

    /**
     * 验证会话
     * @param {boolean} forceCheck - 是否强制检查（忽略时间间隔）
     * @returns {Promise<boolean>} 验证结果
     */
    async verifySession(forceCheck = false) {
        if (!this.sessionToken) {
            console.log('🔒 未检测到会话令牌');
            this.clearAuthentication();
            return false;
        }

        // 检查是否最近验证过（避免重复验证）
        if (!forceCheck && this.lastAuthCheck) {
            const now = Date.now();
            const timeSinceLastCheck = now - parseInt(this.lastAuthCheck);

            if (timeSinceLastCheck < this.authCheckInterval) {
                console.log('⏰ 认证检查在5分钟内已完成，跳过重复验证');
                return this.isAuthenticated;
            }
        }

        try {
            const apiUrl = API_CONFIG.buildApiUrl('/api/auth/verify-session');
            console.log('🌐 发送认证请求:', {
                url: apiUrl,
                headers: {
                    'Authorization': `Bearer ${this.sessionToken.substring(0, 20)}...`
                }
            });

            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });

            console.log('📡 认证响应状态:', response.status, response.statusText);

            if (response.status === 401) {
                console.log('🔒 认证失败：令牌无效或已过期');
                this.clearAuthentication();
                return false;
            } else if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    console.log('✅ 会话验证成功');
                    this.lastAuthCheck = Date.now().toString();
                    localStorage.setItem('lastAuthCheck', this.lastAuthCheck);
                    return true;
                } else {
                    console.log('❌ 会话验证失败:', result.message);
                    this.clearAuthentication();
                    return false;
                }
            } else {
                console.log('❌ HTTP错误:', response.status);
                return false;
            }

        } catch (error) {
            console.error('验证会话失败:', error);
            return false;
        }
    }

    /**
     * 检查并更新认证状态
     * @param {boolean} forceCheck - 是否强制检查
     * @returns {Promise<boolean>} 认证状态
     */
    async checkAndUpdateAuth(forceCheck = false) {
        const isValid = await this.verifySession(forceCheck);
        this.isAuthenticated = isValid;
        return isValid;
    }

    /**
     * 获取认证状态摘要
     * @returns {Object}
     */
    getAuthSummary() {
        return {
            isAuthenticated: this.isAuthenticated,
            hasSessionToken: !!this.sessionToken,
            hasUserInfo: !!this.userInfo,
            lastAuthCheck: this.lastAuthCheck,
            timeSinceLastCheck: this.lastAuthCheck ? Date.now() - parseInt(this.lastAuthCheck) : null
        };
    }
}

// 创建全局实例
const authManager = new AuthManager();

// 导出到全局
window.authManager = authManager;
