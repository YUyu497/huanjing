const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库连接池配置
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ 数据库连接成功');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        return false;
    }
}

// 执行查询的通用函数
async function executeQuery(sql, params = []) {
    try {
        const [rows] = await pool.execute(sql, params);
        return { success: true, data: rows };
    } catch (error) {
        console.error('❌ 查询执行失败:', error.message);
        return { success: false, error: error.message };
    }
}

// 执行事务
async function executeTransaction(queries) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const results = [];
        for (const query of queries) {
            const [rows] = await connection.execute(query.sql, query.params || []);
            results.push(rows);
        }

        await connection.commit();
        connection.release();
        return { success: true, data: results };
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('❌ 事务执行失败:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = {
    pool,
    testConnection,
    executeQuery,
    executeTransaction
};
