/**
 * 天美健MES系统后端 - 数据库连接配置
 */
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'tmj_mes_2026',
  database: 'tmj_mes_db',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+08:00',
});

pool.getConnection().then(conn => {
  console.log('✅ 数据库连接成功: tmj_mes_db');
  conn.release();
}).catch(err => {
  console.error('❌ 数据库连接失败:', err.message);
});

module.exports = pool;
