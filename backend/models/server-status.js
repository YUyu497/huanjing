const { pool } = require('../config/database');

class ServerStatusModel {
    /**
     * 保存服务器状态到历史记录
     */
    static async saveStatusHistory(statusData) {
        try {
            const {
                status,
                clients,
                maxClients,
                uptimePercentage,
                averagePing,
                hostname,
                gameBuild,
                endpoint,
                projectDesc,
                playersData,
                resourcesCount,
                lastUpdateSource = 'fivem'
            } = statusData;

            const query = `
                INSERT INTO server_status_history 
                (status, clients, max_clients, uptime_percentage, average_ping, hostname, game_build, endpoint, project_desc, players_data, resources_count, last_update_source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                status,
                clients || 0,
                maxClients || 64,
                uptimePercentage || 0.00,
                averagePing || null,
                hostname || null,
                gameBuild || null,
                endpoint || null,
                projectDesc || null,
                playersData ? JSON.stringify(playersData) : null,
                resourcesCount || 0,
                lastUpdateSource
            ];

            const [result] = await pool.execute(query, values);
            console.log(`📊 服务器状态历史记录已保存: ID=${result.insertId}`);
            return result.insertId;

        } catch (error) {
            console.error('❌ 保存服务器状态历史记录失败:', error);
            throw error;
        }
    }

    /**
     * 更新服务器状态缓存
     */
    static async updateStatusCache(statusData) {
        try {
            const {
                status,
                clients,
                maxClients,
                uptimePercentage,
                averagePing,
                hostname,
                gameBuild,
                endpoint,
                projectDesc,
                playersData,
                resourcesCount,
                lastUpdateSource = 'fivem'
            } = statusData;

            const query = `
                UPDATE server_status_cache 
                SET status = ?, clients = ?, max_clients = ?, uptime_percentage = ?, average_ping = ?, 
                    hostname = ?, game_build = ?, endpoint = ?, project_desc = ?, players_data = ?, 
                    resources_count = ?, last_update = NOW(), last_update_source = ?
                WHERE id = 1
            `;

            const values = [
                status,
                clients || 0,
                maxClients || 64,
                uptimePercentage || 0.00,
                averagePing || null,
                hostname || null,
                gameBuild || null,
                endpoint || null,
                projectDesc || null,
                playersData ? JSON.stringify(playersData) : null,
                resourcesCount || 0,
                lastUpdateSource
            ];

            const [result] = await pool.execute(query, values);
            console.log(`📊 服务器状态缓存已更新: 影响行数=${result.affectedRows}`);
            return result.affectedRows > 0;

        } catch (error) {
            console.error('❌ 更新服务器状态缓存失败:', error);
            throw error;
        }
    }

    /**
     * 获取最新的服务器状态缓存
     */
    static async getLatestStatus() {
        try {
            const query = `
                SELECT * FROM server_status_cache WHERE id = 1
            `;

            const [rows] = await pool.execute(query);

            if (rows.length === 0) {
                console.log('⚠️ 未找到服务器状态缓存记录');
                return null;
            }

            const status = rows[0];

            // 解析JSON数据
            if (status.players_data) {
                try {
                    status.players_data = JSON.parse(status.players_data);
                } catch (e) {
                    status.players_data = null;
                }
            }

            console.log(`📊 获取到最新服务器状态: ${status.status}, 玩家${status.clients}/${status.max_clients}`);
            return status;

        } catch (error) {
            console.error('❌ 获取最新服务器状态失败:', error);
            throw error;
        }
    }

    /**
     * 获取服务器状态历史记录
     */
    static async getStatusHistory(limit = 100, offset = 0) {
        try {
            const query = `
                SELECT * FROM server_status_history 
                ORDER BY timestamp DESC 
                LIMIT ? OFFSET ?
            `;

            const [rows] = await pool.execute(query, [limit, offset]);

            // 解析JSON数据
            rows.forEach(row => {
                if (row.players_data) {
                    try {
                        row.players_data = JSON.parse(row.players_data);
                    } catch (e) {
                        row.players_data = null;
                    }
                }
            });

            console.log(`📊 获取到${rows.length}条历史记录`);
            return rows;

        } catch (error) {
            console.error('❌ 获取服务器状态历史记录失败:', error);
            throw error;
        }
    }

    /**
     * 获取指定时间范围内的状态记录
     */
    static async getStatusByTimeRange(startTime, endTime) {
        try {
            const query = `
                SELECT * FROM server_status_history 
                WHERE timestamp BETWEEN ? AND ?
                ORDER BY timestamp ASC
            `;

            const [rows] = await pool.execute(query, [startTime, endTime]);

            // 解析JSON数据
            rows.forEach(row => {
                if (row.players_data) {
                    try {
                        row.players_data = JSON.parse(row.players_data);
                    } catch (e) {
                        row.players_data = null;
                    }
                }
            });

            console.log(`📊 获取到${rows.length}条时间范围记录: ${startTime} 到 ${endTime}`);
            return rows;

        } catch (error) {
            console.error('❌ 获取时间范围状态记录失败:', error);
            throw error;
        }
    }

    /**
     * 更新日统计数据
     */
    static async updateDailyStats(date, statsData) {
        try {
            const {
                totalUptimeMinutes,
                totalDowntimeMinutes,
                maxPlayers,
                avgPlayers,
                totalConnections,
                avgPing,
                statusChanges
            } = statsData;

            const query = `
                INSERT INTO server_status_stats 
                (date, total_uptime_minutes, total_downtime_minutes, max_players, avg_players, total_connections, avg_ping, status_changes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                total_uptime_minutes = VALUES(total_uptime_minutes),
                total_downtime_minutes = VALUES(total_downtime_minutes),
                max_players = VALUES(max_players),
                avg_players = VALUES(avg_players),
                total_connections = VALUES(total_connections),
                avg_ping = VALUES(avg_ping),
                status_changes = VALUES(status_changes),
                updated_at = NOW()
            `;

            const values = [
                date,
                totalUptimeMinutes || 0,
                totalDowntimeMinutes || 0,
                maxPlayers || 0,
                avgPlayers || 0.00,
                totalConnections || 0,
                avgPing || null,
                statusChanges || 0
            ];

            const [result] = await pool.execute(query, values);
            console.log(`📊 日统计数据已更新: ${date}, 影响行数=${result.affectedRows}`);
            return result.affectedRows > 0;

        } catch (error) {
            console.error('❌ 更新日统计数据失败:', error);
            throw error;
        }
    }

    /**
     * 获取日统计数据
     */
    static async getDailyStats(startDate, endDate) {
        try {
            const query = `
                SELECT * FROM server_status_stats 
                WHERE date BETWEEN ? AND ?
                ORDER BY date ASC
            `;

            const [rows] = await pool.execute(query, [startDate, endDate]);
            console.log(`📊 获取到${rows.length}条日统计数据: ${startDate} 到 ${endDate}`);
            return rows;

        } catch (error) {
            console.error('❌ 获取日统计数据失败:', error);
            throw error;
        }
    }

    /**
     * 清理旧的历史记录（保留最近30天）
     */
    static async cleanupOldHistory(daysToKeep = 30) {
        try {
            const query = `
                DELETE FROM server_status_history 
                WHERE timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)
            `;

            const [result] = await pool.execute(query, [daysToKeep]);
            console.log(`🗑️ 清理了${result.affectedRows}条旧历史记录（保留最近${daysToKeep}天）`);
            return result.affectedRows;

        } catch (error) {
            console.error('❌ 清理旧历史记录失败:', error);
            throw error;
        }
    }

    /**
     * 获取服务器状态统计信息
     */
    static async getStatusSummary() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(CASE WHEN status = 'online' THEN 1 END) as online_count,
                    COUNT(CASE WHEN status = 'warning' THEN 1 END) as warning_count,
                    COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline_count,
                    MAX(clients) as max_players_ever,
                    AVG(clients) as avg_players,
                    AVG(average_ping) as avg_ping,
                    MIN(timestamp) as first_record,
                    MAX(timestamp) as last_record
                FROM server_status_history 
                WHERE timestamp > DATE_SUB(NOW(), INTERVAL 7 DAY)
            `;

            const [rows] = await pool.execute(query);
            const summary = rows[0];

            console.log(`📊 获取到状态统计摘要: 总记录${summary.total_records}条，在线${summary.online_count}次`);
            return summary;

        } catch (error) {
            console.error('❌ 获取状态统计摘要失败:', error);
            throw error;
        }
    }
}

module.exports = ServerStatusModel;
