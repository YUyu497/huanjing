/**
 * 独立认证验证器模块
 * 提供统一的登录验证功能，供其他页面调用
 */

class AuthValidator {
    constructor() {
        // 防止重复初始化
        if (window.authValidatorInstance) {
            console.log('⚠️ 认证验证器已存在，返回现有实例');
            return window.authValidatorInstance;
        }

        this.authCheckInterval = 5 * 60 * 1000; // 5分钟内的验证结果可以复用

        // 标记为已初始化
        window.authValidatorInstance = this;

        console.log('🔐 认证验证器已初始化');
    }

    /**
     * 验证用户登录状态
     * @param {Object} options - 配置选项
     * @param {string} options.pageName - 页面名称（用于日志）
     * @param {Function} options.onSuccess - 验证成功回调
     * @param {Function} options.onFailure - 验证失败回调
     * @param {boolean} options.forceCheck - 是否强制检查（忽略时间间隔）
     * @returns {Promise<boolean>} 验证结果
     */
    async validateAuth(options = {}) {
        const {
            pageName = '未知页面',
            onSuccess = null,
            onFailure = null,
            forceCheck = false
        } = options;

        console.log(`🔍 [${pageName}] 开始验证用户认证状态`);

        // 优先使用全局认证管理器
        if (window.authManager) {
            return await this.validateWithGlobalManager(pageName, onSuccess, onFailure, forceCheck);
        } else {
            return await this.validateWithLocalStorage(pageName, onSuccess, onFailure, forceCheck);
        }
    }

    /**
     * 使用全局认证管理器验证
     */
    async validateWithGlobalManager(pageName, onSuccess, onFailure, forceCheck) {
        try {
            console.log(`🔍 [${pageName}] 使用全局认证管理器验证`);
            const authSummary = window.authManager.getAuthSummary();
            console.log(`📊 [${pageName}] 认证状态摘要:`, authSummary);

            // 检查认证状态
            const isValid = await window.authManager.checkAndUpdateAuth(forceCheck);

            if (isValid) {
                console.log(`✅ [${pageName}] 用户认证有效`);
                if (onSuccess && typeof onSuccess === 'function') {
                    onSuccess();
                }
                return true;
            } else {
                console.log(`🔒 [${pageName}] 用户认证无效`);
                if (onFailure && typeof onFailure === 'function') {
                    onFailure();
                }
                return false;
            }
        } catch (error) {
            console.error(`❌ [${pageName}] 全局认证管理器验证失败:`, error);
            if (onFailure && typeof onFailure === 'function') {
                onFailure();
            }
            return false;
        }
    }

    /**
     * 使用本地存储验证（备用方案）
     */
    async validateWithLocalStorage(pageName, onSuccess, onFailure, forceCheck) {
        try {
            console.log(`🔍 [${pageName}] 使用本地存储验证（备用方案）`);

            const sessionToken = localStorage.getItem('sessionToken');

            if (!sessionToken) {
                console.log(`🔒 [${pageName}] 未检测到登录状态`);
                if (onFailure && typeof onFailure === 'function') {
                    onFailure();
                }
                return false;
            }

            // 检查令牌是否最近验证过（避免重复验证）
            if (!forceCheck) {
                const lastAuthCheck = localStorage.getItem('lastAuthCheck');
                const now = Date.now();

                if (lastAuthCheck && (now - parseInt(lastAuthCheck)) < this.authCheckInterval) {
                    console.log(`⏰ [${pageName}] 认证检查在5分钟内已完成，跳过重复验证`);
                    if (onSuccess && typeof onSuccess === 'function') {
                        onSuccess();
                    }
                    return true;
                }
            }

            // 发送验证请求
            const apiUrl = API_CONFIG.buildApiUrl('/api/auth/verify-session');
            console.log(`🌐 [${pageName}] 发送认证请求:`, {
                url: apiUrl,
                headers: {
                    'Authorization': `Bearer ${sessionToken.substring(0, 20)}...`
                }
            });

            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });

            console.log(`📡 [${pageName}] 认证响应状态:`, response.status, response.statusText);

            if (response.status === 401) {
                console.log(`🔒 [${pageName}] 认证失败：令牌无效或已过期`);

                try {
                    const errorResult = await response.json();
                    console.log(`📋 [${pageName}] 错误详情:`, errorResult);

                    if (errorResult.message === '会话无效或已过期') {
                        console.log(`🔄 [${pageName}] 会话已过期，清除本地存储`);
                    }
                } catch (parseError) {
                    console.log(`[${pageName}] 无法解析错误响应`);
                }

                // 清除无效令牌
                this.clearInvalidTokens();

                if (onFailure && typeof onFailure === 'function') {
                    onFailure();
                }
                return false;

            } else if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    console.log(`✅ [${pageName}] 用户已登录，允许访问`);
                    // 记录成功的认证检查时间
                    localStorage.setItem('lastAuthCheck', Date.now().toString());

                    if (onSuccess && typeof onSuccess === 'function') {
                        onSuccess();
                    }
                    return true;
                } else {
                    console.log(`❌ [${pageName}] 会话验证失败:`, result.message);
                    this.clearInvalidTokens();

                    if (onFailure && typeof onFailure === 'function') {
                        onFailure();
                    }
                    return false;
                }
            } else {
                console.log(`❌ [${pageName}] HTTP错误:`, response.status);

                if (onFailure && typeof onFailure === 'function') {
                    onFailure();
                }
                return false;
            }

        } catch (error) {
            console.error(`❌ [${pageName}] 本地验证失败:`, error);

            if (onFailure && typeof onFailure === 'function') {
                onFailure();
            }
            return false;
        }
    }

    /**
     * 清除无效的认证令牌
     */
    clearInvalidTokens() {
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('lastAuthCheck');
        console.log('🗑️ 无效的认证令牌已清除');
    }

    /**
     * 检查是否已登录（快速检查，不发送API请求）
     * @returns {boolean}
     */
    isLoggedIn() {
        const sessionToken = localStorage.getItem('sessionToken');
        return !!sessionToken;
    }

    /**
     * 获取用户信息
     * @returns {Object|null}
     */
    getUserInfo() {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                return JSON.parse(userInfo);
            } catch (error) {
                console.error('解析用户信息失败:', error);
                return null;
            }
        }
        return null;
    }

    /**
     * 获取会话令牌
     * @returns {string|null}
     */
    getSessionToken() {
        return localStorage.getItem('sessionToken');
    }

    /**
     * 强制重新验证（忽略缓存）
     * @param {Object} options - 配置选项
     * @returns {Promise<boolean>}
     */
    async forceValidate(options = {}) {
        return await this.validateAuth({
            ...options,
            forceCheck: true
        });
    }

    /**
     * 创建页面认证保护器
     * @param {Object} options - 配置选项
     * @returns {Object} 页面认证保护器
     */
    createPageProtector(options = {}) {
        const {
            pageName = '未知页面',
            onSuccess = null,
            onFailure = null,
            showLoginModal = null
        } = options;

        // 保存对当前实例的引用
        const self = this;

        return {
            /**
             * 保护页面，需要登录才能访问
             */
            async protect() {
                return await self.validateAuth({
                    pageName,
                    onSuccess,
                    onFailure: () => {
                        if (showLoginModal && typeof showLoginModal === 'function') {
                            showLoginModal();
                        }
                        if (onFailure && typeof onFailure === 'function') {
                            onFailure();
                        }
                    }
                });
            },

            /**
             * 检查登录状态但不阻止访问
             */
            async check() {
                return await self.validateAuth({
                    pageName,
                    onSuccess,
                    onFailure
                });
            }
        };
    }
}

// 创建全局实例
const authValidator = new AuthValidator();

// 导出
window.AuthValidator = AuthValidator;
window.authValidator = authValidator;
