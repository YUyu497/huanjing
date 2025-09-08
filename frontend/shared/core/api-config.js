/**
 * API配置文件
 * 根据不同的环境自动配置API基础URL
 */

const API_CONFIG = {
    // 环境检测
    isLocalFile: window.location.protocol === 'file:',
    isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    currentHostname: window.location.hostname,
    currentProtocol: window.location.protocol,

    // 根据环境设置API基础URL
    get API_BASE_URL() {
        if (this.isLocalFile) {
            // 本地文件系统访问
            return 'http://localhost:3000';
        } else if (this.isLocalhost) {
            // 本地开发环境
            return 'http://localhost:3000';
        } else if (this.currentHostname === 'www.dingyu.site' || this.currentHostname === 'dingyu.site') {
            // 生产环境 - 使用相对路径
            return '';
        } else {
            // 其他环境，默认使用相对路径
            return '';
        }
    },

    /**
     * 构建完整的API URL
     * @param {string} endpoint - API端点路径
     * @returns {string} 完整的API URL
     */
    buildApiUrl(endpoint) {
        // 确保endpoint以/开头
        if (!endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
        }

        // 如果API_BASE_URL为空，使用相对路径
        if (!this.API_BASE_URL) {
            return endpoint;
        }

        return this.API_BASE_URL + endpoint;
    },

    /**
     * 发送API请求的通用方法
     * @param {string} endpoint - API端点
     * @param {Object} options - 请求选项
     * @returns {Promise} 请求结果
     */
    async apiRequest(endpoint, options = {}) {
        const url = this.buildApiUrl(endpoint);

        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, finalOptions);
            return response;
        } catch (error) {
            console.error(`API请求失败 [${endpoint}]:`, error);
            throw error;
        }
    }
};

// 导出到全局
window.API_CONFIG = API_CONFIG;

// 调试信息
console.log('🔧 API配置已加载:', {
    isLocalFile: API_CONFIG.isLocalFile,
    isLocalhost: API_CONFIG.isLocalhost,
    currentHostname: API_CONFIG.currentHostname,
    API_BASE_URL: API_CONFIG.API_BASE_URL,
    currentProtocol: API_CONFIG.currentProtocol
});

// 环境提示
if (API_CONFIG.isLocalFile) {
    console.log('📁 本地文件系统环境，API请求将发送到 localhost:3000');
} else if (API_CONFIG.isLocalhost) {
    console.log('🏠 本地开发环境，API请求将发送到 localhost:3000');
} else if (API_CONFIG.currentHostname === 'www.dingyu.site' || API_CONFIG.currentHostname === 'dingyu.site') {
    console.log('🌐 生产环境，API请求将使用相对路径');
} else {
    console.log('❓ 未知环境，API请求将使用相对路径');
}
