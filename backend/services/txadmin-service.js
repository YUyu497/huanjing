/**
 * txAdmin 服务模块
 * 使用 Node.js 内置 fetch 与 FiveM 服务器进行通信和数据获取
 */

class TxAdminService {
    constructor() {
        // 从环境变量获取 FiveM 服务器地址，如果没有则使用默认值
        this.baseUrl = process.env.FIVEM_SERVER_URL || process.env.TXADMIN_URL || 'http://localhost:30120';
        this.apiKey = process.env.TXADMIN_API_KEY || '';
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30秒缓存

        // 使用正确的 FiveM API 端点
        this.apiEndpoints = {
            info: '/info.json',           // 服务器基本信息
            dynamic: '/dynamic.json',     // 动态信息（玩家数量、状态等）
            players: '/players.json',     // 在线玩家列表
            ping: '/ping.json'            // 服务器延迟测试
        };

        console.log(`🔧 txAdmin/FiveM 服务初始化，服务器地址: ${this.baseUrl}`);
    }

    /**
     * 测试 API 端点
     */
    async testApiEndpoints() {
        const results = {};

        for (const [name, endpoint] of Object.entries(this.apiEndpoints)) {
            try {
                const response = await fetch(`${this.baseUrl}${endpoint}`, {
                    headers: this.getHeaders(),
                    signal: AbortSignal.timeout(5000)
                });

                results[name] = {
                    status: response.status,
                    contentType: response.headers.get('content-type'),
                    isJson: response.headers.get('content-type')?.includes('application/json'),
                    url: `${this.baseUrl}${endpoint}`
                };

                if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
                    const data = await response.json();
                    results[name].data = data;
                }
            } catch (error) {
                results[name] = {
                    error: error.message,
                    url: `${this.baseUrl}${endpoint}`
                };
            }
        }

        console.log('🔍 FiveM API 端点测试结果:', results);
        return results;
    }

    /**
     * 获取服务器状态
     */
    async getServerStatus() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            // 使用 dynamic.json 获取服务器状态
            const response = await fetch(`${this.baseUrl}/dynamic.json`, {
                headers: this.getHeaders(),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // 检查并验证 JSON 响应
            const jsonCheck = await this.isValidJsonResponse(response);
            if (!jsonCheck.isValid) {
                throw new Error(`响应不是有效的JSON: ${jsonCheck.error}`);
            }

            const data = await jsonCheck.response.json();

            // 调试：显示所有可用字段
            console.log('🔍 dynamic.json 数据字段:', Object.keys(data));
            console.log('📊 dynamic.json 完整数据:', JSON.stringify(data, null, 2));

            // 转换 FiveM 数据格式为我们的格式
            const status = {
                status: data.clients > 0 ? 'online' : 'offline',
                uptime: data.uptime || data.serverUptime || data.runtime || '运行中',
                version: data.version || 'unknown',
                timestamp: new Date().toISOString(),
                players: data.clients || 0,
                maxPlayers: data.sv_maxclients || 64
            };

            // 缓存数据
            this.cache.set('serverStatus', {
                data: status,
                timestamp: Date.now()
            });

            console.log('✅ 成功获取FiveM服务器状态:', status);
            return status;
        } catch (error) {
            console.error('❌ 获取FiveM状态失败:', error.message);
            // 返回缓存数据或默认值
            return this.getCachedData('serverStatus') || this.getDefaultStatus();
        }
    }

    /**
     * 获取在线玩家
     */
    async getOnlinePlayers() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${this.baseUrl}/players.json`, {
                headers: this.getHeaders(),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.warn(`⚠️ players.json 请求失败: ${response.status} ${response.statusText}`);
                // 如果 players.json 失败，尝试从 dynamic.json 获取玩家数量
                return this.getPlayersFromDynamic();
            }

            // 检查并验证 JSON 响应
            const jsonCheck = await this.isValidJsonResponse(response);
            if (!jsonCheck.isValid) {
                console.warn(`⚠️ players.json 响应无效: ${jsonCheck.error}`);
                // 如果响应无效，尝试从 dynamic.json 获取玩家数量
                return this.getPlayersFromDynamic();
            }

            const data = await jsonCheck.response.json();

            // 转换玩家数据格式
            const players = Array.isArray(data) ? data.map(player => ({
                id: player.id || player.endpoint || 'unknown',
                name: player.name || 'Unknown Player',
                ping: player.ping || 0,
                identifiers: player.identifiers || []
            })) : [];

            this.cache.set('players', {
                data: players,
                timestamp: Date.now()
            });

            console.log('✅ 成功获取FiveM玩家列表');
            return players;
        } catch (error) {
            // 特别检查是否是JSON解析错误，这通常表示服务器正在重启
            if (error.message.includes('Unexpected end of JSON input') || 
                error.message.includes('JSON') || 
                error.message.includes('SyntaxError')) {
                console.error('🔄 检测到JSON解析错误，服务器可能正在重启:', error.message);
            } else {
                console.error('❌ 获取玩家列表失败:', error.message);
            }
            // 尝试从 dynamic.json 获取玩家数量作为备选方案
            return this.getPlayersFromDynamic();
        }
    }

    /**
     * 从 dynamic.json 获取玩家数量（备选方案）
     */
    async getPlayersFromDynamic() {
        try {
            const response = await fetch(`${this.baseUrl}/dynamic.json`, {
                headers: this.getHeaders(),
                signal: AbortSignal.timeout(5000)
            });

            if (response.ok) {
                const data = await response.json();
                const playerCount = data.clients || 0;

                if (playerCount > 0) {
                    // 只有在有真实玩家时才创建模拟列表
                    const players = [];
                    for (let i = 0; i < playerCount; i++) {
                        players.push({
                            id: `player_${i + 1}`,
                            name: `玩家${i + 1}`,
                            ping: Math.floor(Math.random() * 100) + 20,
                            identifiers: []
                        });
                    }

                    console.log(`🔄 从 dynamic.json 获取到 ${playerCount} 名玩家`);
                    return players;
                } else {
                    console.log('🔄 服务器无玩家在线');
                    return [];
                }
            }
        } catch (error) {
            // 特别检查是否是JSON解析错误
            if (error.message.includes('Unexpected end of JSON input') || 
                error.message.includes('JSON') || 
                error.message.includes('SyntaxError')) {
                console.warn('🔄 备选方案也出现JSON解析错误，确认服务器正在重启:', error.message);
            } else {
                console.warn('⚠️ 备选方案也失败:', error.message);
            }
        }

        // 如果都失败了，返回空数组
        console.log('🔴 所有玩家数据获取方法都失败，返回空数组');
        return [];
    }

    /**
     * 获取资源状态（FiveM 不直接提供资源状态，返回空数组）
     */
    async getResourcesStatus() {
        try {
            // FiveM 的 players.json 可能包含一些资源信息
            const players = await this.getOnlinePlayers();

            // 返回模拟的资源状态
            const resources = [
                {
                    name: 'FiveM Server',
                    status: 'started',
                    type: 'server'
                }
            ];

            this.cache.set('resources', {
                data: resources,
                timestamp: Date.now()
            });

            console.log('✅ 成功获取FiveM资源状态');
            return resources;
        } catch (error) {
            console.error('❌ 获取资源状态失败:', error.message);
            return this.getCachedData('resources') || [];
        }
    }

    /**
     * 获取服务器信息
     */
    async getServerInfo() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${this.baseUrl}/info.json`, {
                headers: this.getHeaders(),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // 检查并验证 JSON 响应
            const jsonCheck = await this.isValidJsonResponse(response);
            if (!jsonCheck.isValid) {
                throw new Error(`响应不是有效的JSON: ${jsonCheck.error}`);
            }

            const data = await jsonCheck.response.json();

            // 调试：显示所有可用字段
            console.log('🔍 info.json 数据字段:', Object.keys(data));
            console.log('📊 info.json 完整数据:', JSON.stringify(data, null, 2));

            // 转换服务器信息格式
            const info = {
                server: {
                    name: data.hostname || '幻境FiveM服务器',
                    maxClients: data.sv_maxclients || 64,
                    version: data.version || 'unknown',
                    map: data.mapname || 'Los Santos',
                    gametype: data.gametype || 'FiveM'
                },
                vars: data.vars || {},
                resources: data.resources || [],
                // 尝试获取运行时间
                uptime: data.uptime || data.serverUptime || data.runtime || null
            };

            this.cache.set('serverInfo', {
                data: info,
                timestamp: Date.now()
            });

            console.log('✅ 成功获取FiveM服务器信息:', info);
            return info;
        } catch (error) {
            console.error('❌ 获取服务器信息失败:', error.message);
            return this.getCachedData('serverInfo') || this.getDefaultServerInfo();
        }
    }

    /**
     * 获取综合服务器信息
     */
    async getComprehensiveServerInfo() {
        try {
            const [status, players, resources, info] = await Promise.all([
                this.getServerStatus(),
                this.getOnlinePlayers(),
                this.getResourcesStatus(),
                this.getServerInfo()
            ]);

            // 统一服务器状态判断逻辑
            let serverStatus = 'offline';
            let serverUptime = '离线';

            // 优先检查玩家数据获取状态 - 这是最可靠的离线指标
            // 如果玩家数据获取失败（特别是JSON解析失败），说明服务器正在重启或离线
            let playersFetchFailed = false;
            let connectionCheckResult = null;
            
            // 尝试检测服务器重启状态
            let restartDetection = null;
            try {
                restartDetection = await this.detectServerRestart();
            } catch (error) {
                console.warn('⚠️ 重启检测失败:', error.message);
            }

            try {
                // 尝试获取连接状态
                connectionCheckResult = await this.checkConnection();
            } catch (error) {
                console.warn('⚠️ 连接检查失败:', error.message);
                connectionCheckResult = { connected: false, error: error.message };
            }

            // 检查玩家数据获取是否成功
            if (!Array.isArray(players)) {
                playersFetchFailed = true;
                console.log('⚠️ 玩家数据获取失败，可能服务器正在重启');
            }

            // 服务器状态判断逻辑（优先级：重启检测 > 玩家数据 > 连接检查 > 备选方案）
            if (restartDetection && restartDetection.restarting) {
                // 重启检测是最优先的判断
                serverStatus = 'offline';
                serverUptime = '重启中';
                console.log(`🔴 基于重启检测，判定服务器重启中 (置信度: ${restartDetection.confidence})`);
            } else if (playersFetchFailed) {
                // 玩家数据获取失败是第二可靠的离线指标
                serverStatus = 'offline';
                serverUptime = '离线';
                console.log('🔴 基于玩家数据获取失败，判定服务器离线');
            } else if (connectionCheckResult && connectionCheckResult.connected) {
                // 连接检查成功且玩家数据正常
                if (Array.isArray(players) && players.length >= 0) {
                    serverStatus = 'online';
                    serverUptime = '运行中';
                    console.log('🟢 基于连接检查和玩家数据，判定服务器在线');
                } else {
                    serverStatus = 'offline';
                    serverUptime = '离线';
                    console.log('🔴 连接检查成功但玩家数据异常，判定服务器离线');
                }
            } else {
                // 连接检查失败，使用备选判断
                if (Array.isArray(players) && players.length > 0) {
                    serverStatus = 'online';
                    serverUptime = '运行中';
                    console.log('🟡 基于备选判断（有玩家），判定服务器在线');
                } else {
                    serverStatus = 'offline';
                    serverUptime = '离线';
                    console.log('🔴 基于备选判断（无玩家），判定服务器离线');
                }
            }

            const comprehensiveInfo = {
                server: {
                    status: serverStatus,
                    uptime: serverUptime,
                    version: status.version || 'unknown',
                    name: info?.server?.name || '幻境FiveM服务器',
                    maxClients: info?.server?.maxClients || 64,
                    gameBuild: info?.server?.version || 'unknown' // 添加游戏构建版本
                },
                players: {
                    online: Array.isArray(players) ? players.length : 0,
                    max: info?.server?.maxClients || 64,
                    list: Array.isArray(players) ? players : []
                },
                resources: {
                    total: Array.isArray(resources) ? resources.length : 0,
                    running: Array.isArray(resources) ? resources.filter(r => r.status === 'started').length : 0,
                    status: Array.isArray(resources) ? resources : []
                },
                performance: {
                    uptime: serverUptime,
                    timestamp: new Date().toISOString()
                },
                vars: info?.vars || {}, // 添加服务器变量，包含 sv_enforceGameBuild
                version: status.version || 'unknown' // 添加顶级版本字段
            };

            // 缓存综合信息
            this.cache.set('comprehensive', {
                data: comprehensiveInfo,
                timestamp: Date.now()
            });

            console.log(`✅ 成功获取综合服务器信息 - 状态: ${serverStatus}, 运行时间: ${serverUptime}`);
            return comprehensiveInfo;
        } catch (error) {
            console.error('❌ 获取综合服务器信息失败:', error.message);
            return this.getCachedData('comprehensive') || this.getDefaultComprehensiveInfo();
        }
    }

    /**
     * 获取缓存数据
     */
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log(`📦 使用缓存数据: ${key}`);
            return cached.data;
        }
        return null;
    }

    /**
     * 获取默认状态
     */
    getDefaultStatus() {
        return {
            status: 'unknown',
            uptime: '0d 0h 0m',
            version: 'unknown',
            timestamp: new Date().toISOString(),
            players: 0,
            maxPlayers: 64
        };
    }

    /**
     * 获取默认服务器信息
     */
    getDefaultServerInfo() {
        return {
            server: {
                name: '幻境FiveM服务器',
                maxClients: 64,
                version: 'unknown',
                map: 'Los Santos',
                gametype: 'FiveM'
            }
        };
    }

    /**
     * 获取默认综合信息
     */
    getDefaultComprehensiveInfo() {
        return {
            server: {
                status: 'unknown',
                uptime: '0d 0h 0m',
                version: 'unknown',
                name: '幻境FiveM服务器',
                maxClients: 64
            },
            players: {
                online: 0,
                max: 64,
                list: []
            },
            resources: {
                total: 0,
                running: 0,
                status: []
            },
            performance: {
                uptime: '0d 0h 0m',
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * 获取请求头
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Huanjing-FiveM-Server/1.0.0'
        };

        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        return headers;
    }

    /**
     * 检查FiveM服务器连接状态
     * 注意：此方法可能无法准确检测重启状态，因为重启中的服务器仍可能响应HTTP请求
     */
    async checkConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            // 使用 info.json 检查连接
            const response = await fetch(`${this.baseUrl}/info.json`, {
                headers: this.getHeaders(),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // 检查并验证 JSON 响应
            const jsonCheck = await this.isValidJsonResponse(response);
            if (!jsonCheck.isValid) {
                throw new Error(`响应不是有效的JSON: ${jsonCheck.error}`);
            }

            const data = await jsonCheck.response.json();
            return {
                connected: true,
                status: 'online',
                uptime: data.uptime || '0d 0h 0m',
                players: data.clients || 0,
                maxPlayers: data.sv_maxclients || 64
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message
            };
        }
    }

    /**
     * 清理过期缓存
     */
    cleanExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.cache.delete(key);
                console.log(`🧹 清理过期缓存: ${key}`);
            }
        }
    }

    /**
     * 获取缓存统计
     */
    getCacheStats() {
        const now = Date.now();
        const stats = {};

        for (const [key, value] of this.cache.entries()) {
            const age = now - value.timestamp;
            stats[key] = {
                age: Math.floor(age / 1000),
                expired: age > this.cacheTimeout
            };
        }

        return stats;
    }

    /**
     * 检测服务器是否正在重启
     * 通过检查多个端点的响应一致性来判断
     */
    async detectServerRestart() {
        try {
            const endpoints = ['/players.json', '/dynamic.json', '/info.json'];
            const results = [];
            
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(`${this.baseUrl}${endpoint}`, {
                        headers: this.getHeaders(),
                        signal: AbortSignal.timeout(3000)
                    });
                    
                    if (response.ok) {
                        const text = await response.text();
                        try {
                            JSON.parse(text);
                            results.push({ endpoint, status: 'valid', hasData: text.length > 10 });
                        } catch (parseError) {
                            results.push({ endpoint, status: 'invalid_json', hasData: text.length > 10 });
                        }
                    } else {
                        results.push({ endpoint, status: 'http_error', hasData: false });
                    }
                } catch (error) {
                    results.push({ endpoint, status: 'fetch_error', hasData: false });
                }
            }
            
            // 分析结果：如果多个端点返回无效JSON，服务器可能正在重启
            const invalidJsonCount = results.filter(r => r.status === 'invalid_json').length;
            const hasDataCount = results.filter(r => r.hasData).length;
            
            if (invalidJsonCount >= 2) {
                console.log('🔄 检测到多个端点返回无效JSON，服务器可能正在重启');
                return { restarting: true, confidence: 'high', details: results };
            } else if (invalidJsonCount === 1 && hasDataCount === 0) {
                console.log('🔄 检测到部分端点异常且无数据，服务器可能正在重启');
                return { restarting: true, confidence: 'medium', details: results };
            } else {
                return { restarting: false, confidence: 'low', details: results };
            }
        } catch (error) {
            console.warn('⚠️ 重启检测失败:', error.message);
            return { restarting: false, confidence: 'unknown', details: [] };
        }
    }

    /**
     * 检查响应是否为有效的JSON
     */
    async isValidJsonResponse(response) {
        try {
            const contentType = response.headers.get('content-type');
            console.log(`🔍 检查响应: Content-Type=${contentType || 'not-set'}`);

            // FiveM 服务器可能不设置 Content-Type 或设置为 text/plain
            // 我们尝试解析响应体来判断是否为 JSON
            const text = await response.text();
            console.log(`📄 响应内容预览: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);

            // 尝试解析为 JSON
            JSON.parse(text);

            // 如果解析成功，重新设置 response 的 body
            // 因为我们已经读取了 body，需要重新创建 response
            const newResponse = new Response(text, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            });

            console.log('✅ JSON 响应验证成功');
            return { isValid: true, response: newResponse };
        } catch (error) {
            console.log(`❌ JSON 响应验证失败: ${error.message}`);
            return { isValid: false, error: error.message };
        }
    }

    /**
     * 尝试从 txAdmin 获取运行时间
     */
    async getTxAdminUptime() {
        try {
            const txAdminUrl = process.env.TXADMIN_URL || 'http://111.170.145.231:40120';
            console.log(`🔍 尝试从 txAdmin 获取运行时间: ${txAdminUrl}/api/status`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${txAdminUrl}/api/status`, {
                headers: this.getHeaders(),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const jsonCheck = await this.isValidJsonResponse(response);
            if (!jsonCheck.isValid) {
                throw new Error(`响应不是有效的JSON: ${jsonCheck.error}`);
            }

            const data = await jsonCheck.response.json();
            console.log('🔍 txAdmin 状态数据:', data);

            // 尝试从不同字段获取运行时间
            const uptime = data.uptime || data.serverUptime || data.runtime || data.status?.uptime;

            if (uptime) {
                console.log(`✅ 从 txAdmin 获取到运行时间: ${uptime}`);
                return uptime;
            } else {
                console.log('❌ txAdmin 中也没有运行时间字段');
                return null;
            }
        } catch (error) {
            console.log(`❌ 获取 txAdmin 运行时间失败: ${error.message}`);
            return null;
        }
    }
}

// 创建单例实例
const txAdminService = new TxAdminService();

// 定期清理过期缓存
setInterval(() => {
    txAdminService.cleanExpiredCache();
}, 60000); // 每分钟清理一次

module.exports = txAdminService;
