/**
 * M09 系统管理 - 认证、用户、角色路由
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { ok, fail, page } = require('../middleware/response');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

// 登录
router.post('/auth/login', async (req, res) => {
  try {
    // 兼容两种前端：{ username } 或 { employeeId }（旧Spring Boot前端）
    const { username, employeeId, password } = req.body;
    const loginName = username || employeeId;
    if (!loginName || !password) return fail(res, '用户名和密码不能为空');
    const [rows] = await db.execute(
      'SELECT * FROM sys_user WHERE username=? AND deleted=0', [loginName]
    );
    if (!rows.length) return fail(res, '用户名或密码错误', 401);
    const user = rows[0];
    if (user.status !== 1) return fail(res, '账号已被禁用', 403);
    // 简化密码校验：
    // - 'Admin@2026' 为万能演示密码（所有账号通用）
    // - 'admin123' 为 admin 账号演示密码
    // - 'op123456' 为 op001 演示密码
    // - 'qc123456' 为 qc001 演示密码
    // - 其他账号使用 bcrypt 校验
    const DEMO_PASSWORDS = {
      admin: 'admin123',
      op001: 'op123456',
      qc001: 'qc123456',
    };
    const demoPass = DEMO_PASSWORDS[loginName];
    const valid = password === 'Admin@2026'
      || (demoPass && password === demoPass)
      || await bcrypt.compare(password, user.password).catch(() => false);
    if (!valid) return fail(res, '用户名或密码错误', 401);
    await db.execute('UPDATE sys_user SET last_login=NOW() WHERE id=?', [user.id]);
    const token = jwt.sign(
      { id: user.id, username: user.username, realName: user.real_name, roleCode: user.role_code, factoryCode: user.factory_code },
      JWT_SECRET, { expiresIn: '12h' }
    );
    // 返回前端兼容格式（authStore.ts 期望 data.token + data.user）
    ok(res, {
      token,
      // 保留旧字段 userInfo（兼容 tmj-mes 前端）
      userInfo: { id: user.id, username: user.username, realName: user.real_name, roleCode: user.role_code, factoryCode: user.factory_code },
      // 新字段 user（兼容 webapp authStore.ts）
      user: {
        id: String(user.id),
        username: user.username,
        realName: user.real_name || user.username,
        email: user.email || '',
        phone: user.phone || '',
        roleIds: user.role_code ? [user.role_code] : ['OPERATOR'],
        roleNames: [user.role_code || 'OPERATOR'],
        factoryIds: user.factory_code ? [user.factory_code === 'NJ' ? 'F001' : 'F002'] : ['F001'],
        defaultFactoryId: user.factory_code === 'LS' ? 'F002' : 'F001',
        status: user.status === 1 ? 'active' : 'inactive',
        permissions: [],
      }
    });
  } catch (e) {
    fail(res, e.message, 500);
  }
});

// 获取当前用户信息
router.get('/auth/userinfo', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id,username,real_name,employee_no,factory_code,role_id,role_code,phone,email,status FROM sys_user WHERE id=?',
      [req.user.id]
    );
    ok(res, rows[0] || null);
  } catch (e) { fail(res, e.message, 500); }
});

// 用户列表
router.get('/system/users', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, username, realName, factoryCode } = req.query;
    let sql = 'SELECT id,username,real_name,employee_no,factory_code,role_code,phone,email,status,create_time FROM sys_user WHERE deleted=0';
    const params = [];
    if (username) { sql += ' AND username LIKE ?'; params.push(`%${username}%`); }
    if (realName) { sql += ' AND real_name LIKE ?'; params.push(`%${realName}%`); }
    if (factoryCode) { sql += ' AND factory_code=?'; params.push(factoryCode); }
    const [countRows] = await db.execute(sql.replace('SELECT id,username,real_name,employee_no,factory_code,role_code,phone,email,status,create_time', 'SELECT COUNT(*) as cnt'), params);
    const total = countRows[0].cnt;
    sql += ` ORDER BY create_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, total, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});

// 创建用户
router.post('/system/users', authMiddleware, async (req, res) => {
  try {
    const { username, password = 'Admin@2026', realName, factoryCode, roleCode, phone } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const [r] = await db.execute(
      'INSERT INTO sys_user (username,password,real_name,factory_code,role_code,phone) VALUES (?,?,?,?,?,?)',
      [username, hash, realName, factoryCode, roleCode, phone || '']
    );
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message.includes('Duplicate') ? '用户名已存在' : e.message, 400); }
});

// 更新用户
router.put('/system/users/:id', authMiddleware, async (req, res) => {
  try {
    const { realName, factoryCode, roleCode, phone, status } = req.body;
    await db.execute(
      'UPDATE sys_user SET real_name=?,factory_code=?,role_code=?,phone=?,status=?,update_time=NOW() WHERE id=? AND deleted=0',
      [realName, factoryCode, roleCode, phone || '', status ?? 1, req.params.id]
    );
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// 删除用户
router.delete('/system/users/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('UPDATE sys_user SET deleted=1 WHERE id=?', [req.params.id]);
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// 角色列表
router.get('/system/roles', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM sys_role WHERE deleted=0 ORDER BY id');
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});

// 工厂列表
router.get('/system/factories', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM sys_factory WHERE deleted=0');
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});

// 审计日志
router.get('/system/audit-logs', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, module, username } = req.query;
    let sql = 'SELECT * FROM sys_audit_log WHERE 1=1';
    const params = [];
    if (module) { sql += ' AND module=?'; params.push(module); }
    if (username) { sql += ' AND username LIKE ?'; params.push(`%${username}%`); }
    const [countRows] = await db.execute(sql.replace('SELECT *', 'SELECT COUNT(*) as cnt'), params);
    sql += ` ORDER BY create_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, countRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});

module.exports = router;
