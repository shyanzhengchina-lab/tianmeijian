/**
 * 基础档案路由 - 物料、单位、车间、BOM、工艺路线等
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { ok, fail, page } = require('../middleware/response');
const { authMiddleware } = require('../middleware/auth');

// ===== 计量单位 =====
router.get('/base/units', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM base_unit WHERE deleted=0 ORDER BY id');
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/base/units', authMiddleware, async (req, res) => {
  try {
    const { unitCode, unitName } = req.body;
    const [r] = await db.execute('INSERT INTO base_unit (unit_code,unit_name) VALUES (?,?)', [unitCode, unitName]);
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message.includes('Duplicate') ? '编码已存在' : e.message, 400); }
});
router.delete('/base/units/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('UPDATE base_unit SET deleted=1 WHERE id=?', [req.params.id]);
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// ===== 物料分类 =====
router.get('/base/material-categories', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM base_material_category WHERE deleted=0 ORDER BY sort_no,id');
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/base/material-categories', authMiddleware, async (req, res) => {
  try {
    const { parentId = 0, catCode, catName, sortNo = 0 } = req.body;
    const [r] = await db.execute(
      'INSERT INTO base_material_category (parent_id,cat_code,cat_name,sort_no) VALUES (?,?,?,?)',
      [parentId, catCode, catName, sortNo]
    );
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message, 400); }
});

// ===== 物料档案 =====
router.get('/base/materials', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, materialCode, materialName, materialType } = req.query;
    let sql = 'SELECT m.*,c.cat_name FROM base_material m LEFT JOIN base_material_category c ON m.category_id=c.id WHERE m.deleted=0';
    const params = [];
    if (materialCode) { sql += ' AND m.material_code LIKE ?'; params.push(`%${materialCode}%`); }
    if (materialName) { sql += ' AND m.material_name LIKE ?'; params.push(`%${materialName}%`); }
    if (materialType) { sql += ' AND m.material_type=?'; params.push(materialType); }
    const [cntRows] = await db.execute(`SELECT COUNT(*) as cnt FROM base_material m LEFT JOIN base_material_category c ON m.category_id=c.id WHERE m.deleted=0${materialCode ? ' AND m.material_code LIKE ?' : ''}${materialName ? ' AND m.material_name LIKE ?' : ''}${materialType ? ' AND m.material_type=?' : ''}`, params);
    sql += ` ORDER BY m.create_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/base/materials', authMiddleware, async (req, res) => {
  try {
    const { materialCode, materialName, categoryId, materialType, spec, unitName, brand, supplier, shelfLife, storageCond, minStock, maxStock } = req.body;
    const [r] = await db.execute(
      'INSERT INTO base_material (material_code,material_name,category_id,material_type,spec,unit_name,brand,supplier,shelf_life,storage_cond,min_stock,max_stock) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [materialCode, materialName, categoryId || null, materialType || '', spec || '', unitName || '', brand || '', supplier || '', shelfLife || 0, storageCond || '', minStock || 0, maxStock || 0]
    );
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message.includes('Duplicate') ? '物料编码已存在' : e.message, 400); }
});
router.put('/base/materials/:id', authMiddleware, async (req, res) => {
  try {
    const { materialName, materialType, spec, unitName, brand, supplier, shelfLife, storageCond, minStock, maxStock, status } = req.body;
    await db.execute(
      'UPDATE base_material SET material_name=?,material_type=?,spec=?,unit_name=?,brand=?,supplier=?,shelf_life=?,storage_cond=?,min_stock=?,max_stock=?,status=?,update_time=NOW() WHERE id=? AND deleted=0',
      [materialName, materialType || '', spec || '', unitName || '', brand || '', supplier || '', shelfLife || 0, storageCond || '', minStock || 0, maxStock || 0, status ?? 1, req.params.id]
    );
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});
router.delete('/base/materials/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('UPDATE base_material SET deleted=1,update_time=NOW() WHERE id=?', [req.params.id]);
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// ===== 产品系列 =====
router.get('/base/product-series', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM base_product_series WHERE deleted=0 ORDER BY id');
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/base/product-series', authMiddleware, async (req, res) => {
  try {
    const { seriesCode, seriesName, description } = req.body;
    const [r] = await db.execute('INSERT INTO base_product_series (series_code,series_name,description) VALUES (?,?,?)', [seriesCode, seriesName, description || '']);
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message, 400); }
});

// ===== BOM主表 =====
router.get('/base/boms', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, materialCode, materialName, bomStatus } = req.query;
    let sql = 'SELECT * FROM base_bom WHERE deleted=0';
    const params = [];
    if (materialCode) { sql += ' AND material_code LIKE ?'; params.push(`%${materialCode}%`); }
    if (materialName) { sql += ' AND material_name LIKE ?'; params.push(`%${materialName}%`); }
    if (bomStatus) { sql += ' AND bom_status=?'; params.push(bomStatus); }
    const cnt = `SELECT COUNT(*) as cnt FROM base_bom WHERE deleted=0${materialCode ? ' AND material_code LIKE ?' : ''}${materialName ? ' AND material_name LIKE ?' : ''}${bomStatus ? ' AND bom_status=?' : ''}`;
    const [cntRows] = await db.execute(cnt, params);
    sql += ` ORDER BY create_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/base/boms/:id', authMiddleware, async (req, res) => {
  try {
    const [bom] = await db.execute('SELECT * FROM base_bom WHERE id=?', [req.params.id]);
    if (!bom.length) return fail(res, '不存在');
    const [details] = await db.execute('SELECT * FROM base_bom_detail WHERE bom_id=? AND deleted=0 ORDER BY line_no', [req.params.id]);
    ok(res, { ...bom[0], details });
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/base/boms', authMiddleware, async (req, res) => {
  try {
    const { bomCode, bomVersion = '1.00', materialId, materialCode, materialName, batchSize = 1000, batchUnit, details = [] } = req.body;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [r] = await conn.execute(
        'INSERT INTO base_bom (bom_code,bom_version,material_id,material_code,material_name,batch_size,batch_unit,create_by) VALUES (?,?,?,?,?,?,?,?)',
        [bomCode, bomVersion, materialId || null, materialCode || '', materialName || '', batchSize, batchUnit || '', req.user?.username || '']
      );
      const bomId = r.insertId;
      for (let i = 0; i < details.length; i++) {
        const d = details[i];
        await conn.execute(
          'INSERT INTO base_bom_detail (bom_id,line_no,material_id,material_code,material_name,material_type,qty,unit_name,loss_rate,process_step,is_key_material) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
          [bomId, i + 1, d.materialId || null, d.materialCode || '', d.materialName || '', d.materialType || '', d.qty || 0, d.unitName || '', d.lossRate || 0, d.processStep || '', d.isKeyMaterial || 0]
        );
      }
      await conn.commit();
      ok(res, { id: bomId });
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  } catch (e) { fail(res, e.message, 400); }
});
router.put('/base/boms/:id', authMiddleware, async (req, res) => {
  try {
    const { bomStatus, batchSize, batchUnit } = req.body;
    await db.execute('UPDATE base_bom SET bom_status=?,batch_size=?,batch_unit=?,update_time=NOW() WHERE id=?', [bomStatus, batchSize, batchUnit || '', req.params.id]);
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// ===== 工序档案 =====
router.get('/base/operations', authMiddleware, async (req, res) => {
  try {
    const { factoryCode } = req.query;
    let sql = 'SELECT * FROM base_operation WHERE deleted=0';
    const params = [];
    if (factoryCode) { sql += ' AND factory_code=?'; params.push(factoryCode); }
    sql += ' ORDER BY op_code';
    const [rows] = await db.execute(sql, params);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/base/operations', authMiddleware, async (req, res) => {
  try {
    const { opCode, opName, opType, factoryCode, workshopType, stdTime } = req.body;
    const [r] = await db.execute(
      'INSERT INTO base_operation (op_code,op_name,op_type,factory_code,workshop_type,std_time) VALUES (?,?,?,?,?,?)',
      [opCode, opName, opType || '', factoryCode || '', workshopType || '', stdTime || 0]
    );
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message.includes('Duplicate') ? '工序编码已存在' : e.message, 400); }
});

// ===== 工艺路线 =====
router.get('/base/process-routings', authMiddleware, async (req, res) => {
  try {
    const { factoryCode, routeStatus } = req.query;
    let sql = 'SELECT * FROM base_process_routing WHERE deleted=0';
    const params = [];
    if (factoryCode) { sql += ' AND factory_code=?'; params.push(factoryCode); }
    if (routeStatus) { sql += ' AND route_status=?'; params.push(routeStatus); }
    sql += ' ORDER BY create_time DESC';
    const [rows] = await db.execute(sql, params);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/base/process-routings/:id', authMiddleware, async (req, res) => {
  try {
    const [route] = await db.execute('SELECT * FROM base_process_routing WHERE id=?', [req.params.id]);
    if (!route.length) return fail(res, '不存在');
    const [steps] = await db.execute('SELECT * FROM base_routing_step WHERE route_id=? AND deleted=0 ORDER BY step_no', [req.params.id]);
    ok(res, { ...route[0], steps });
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/base/process-routings', authMiddleware, async (req, res) => {
  try {
    const { routeCode, routeName, materialId, factoryCode, workshopType, version, steps = [] } = req.body;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [r] = await conn.execute(
        'INSERT INTO base_process_routing (route_code,route_name,material_id,factory_code,workshop_type,version) VALUES (?,?,?,?,?,?)',
        [routeCode, routeName, materialId || null, factoryCode || '', workshopType || '', version || '1.0']
      );
      const routeId = r.insertId;
      for (const s of steps) {
        await conn.execute(
          'INSERT INTO base_routing_step (route_id,step_no,op_id,op_code,op_name,wc_id,std_time,is_key_step,require_qc,require_ebr) VALUES (?,?,?,?,?,?,?,?,?,?)',
          [routeId, s.stepNo, s.opId || null, s.opCode || '', s.opName || '', s.wcId || null, s.stdTime || 0, s.isKeyStep || 0, s.requireQc || 0, s.requireEbr || 1]
        );
      }
      await conn.commit();
      ok(res, { id: routeId });
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  } catch (e) { fail(res, e.message, 400); }
});

// ===== 车间 =====
router.get('/base/workshops', authMiddleware, async (req, res) => {
  try {
    const { factoryCode } = req.query;
    let sql = 'SELECT * FROM base_workshop WHERE deleted=0';
    const params = [];
    if (factoryCode) { sql += ' AND factory_code=?'; params.push(factoryCode); }
    sql += ' ORDER BY id';
    const [rows] = await db.execute(sql, params);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/base/workshops', authMiddleware, async (req, res) => {
  try {
    const { workshopCode, workshopName, factoryCode, workshopType } = req.body;
    const [r] = await db.execute(
      'INSERT INTO base_workshop (workshop_code,workshop_name,factory_code,workshop_type) VALUES (?,?,?,?)',
      [workshopCode, workshopName, factoryCode || '', workshopType || '']
    );
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message, 400); }
});

// ===== 班组 =====
router.get('/base/teams', authMiddleware, async (req, res) => {
  try {
    const { factoryCode } = req.query;
    let sql = 'SELECT t.*,w.workshop_name FROM base_team t LEFT JOIN base_workshop w ON t.workshop_id=w.id WHERE t.deleted=0';
    const params = [];
    if (factoryCode) { sql += ' AND t.factory_code=?'; params.push(factoryCode); }
    sql += ' ORDER BY t.id';
    const [rows] = await db.execute(sql, params);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/base/teams', authMiddleware, async (req, res) => {
  try {
    const { teamCode, teamName, workshopId, factoryCode } = req.body;
    const [r] = await db.execute(
      'INSERT INTO base_team (team_code,team_name,workshop_id,factory_code) VALUES (?,?,?,?)',
      [teamCode, teamName, workshopId || null, factoryCode || '']
    );
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message, 400); }
});

// ===== 员工档案 =====
router.get('/base/employees', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, empName, factoryCode, teamId } = req.query;
    let sql = 'SELECT e.*,t.team_name,w.workshop_name FROM base_employee e LEFT JOIN base_team t ON e.team_id=t.id LEFT JOIN base_workshop w ON e.workshop_id=w.id WHERE e.deleted=0';
    const params = [];
    if (empName) { sql += ' AND e.emp_name LIKE ?'; params.push(`%${empName}%`); }
    if (factoryCode) { sql += ' AND e.factory_code=?'; params.push(factoryCode); }
    if (teamId) { sql += ' AND e.team_id=?'; params.push(teamId); }
    const [cntRows] = await db.execute(`SELECT COUNT(*) as cnt FROM base_employee e WHERE e.deleted=0${empName ? ' AND e.emp_name LIKE ?' : ''}${factoryCode ? ' AND e.factory_code=?' : ''}${teamId ? ' AND e.team_id=?' : ''}`, params);
    sql += ` ORDER BY e.create_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/base/employees', authMiddleware, async (req, res) => {
  try {
    const { empNo, empName, factoryCode, workshopId, teamId, empType, position, phone } = req.body;
    const [r] = await db.execute(
      'INSERT INTO base_employee (emp_no,emp_name,factory_code,workshop_id,team_id,emp_type,position,phone) VALUES (?,?,?,?,?,?,?,?)',
      [empNo, empName, factoryCode || '', workshopId || null, teamId || null, empType || '正式', position || '', phone || '']
    );
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message, 400); }
});
router.put('/base/employees/:id', authMiddleware, async (req, res) => {
  try {
    const { empName, factoryCode, workshopId, teamId, empType, position, phone, status } = req.body;
    await db.execute(
      'UPDATE base_employee SET emp_name=?,factory_code=?,workshop_id=?,team_id=?,emp_type=?,position=?,phone=?,status=?,update_time=NOW() WHERE id=?',
      [empName, factoryCode || '', workshopId || null, teamId || null, empType || '正式', position || '', phone || '', status ?? 1, req.params.id]
    );
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});
router.delete('/base/employees/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('UPDATE base_employee SET deleted=1 WHERE id=?', [req.params.id]);
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// ===== 工作中心 =====
router.get('/base/work-centers', authMiddleware, async (req, res) => {
  try {
    const { factoryCode } = req.query;
    let sql = 'SELECT wc.*,w.workshop_name FROM base_work_center wc LEFT JOIN base_workshop w ON wc.workshop_id=w.id WHERE wc.deleted=0';
    const params = [];
    if (factoryCode) { sql += ' AND wc.factory_code=?'; params.push(factoryCode); }
    sql += ' ORDER BY wc.id';
    const [rows] = await db.execute(sql, params);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/base/work-centers', authMiddleware, async (req, res) => {
  try {
    const { wcCode, wcName, workshopId, workshopCode, factoryCode, wcType, capacity } = req.body;
    const [r] = await db.execute(
      'INSERT INTO base_work_center (wc_code,wc_name,workshop_id,workshop_code,factory_code,wc_type,capacity) VALUES (?,?,?,?,?,?,?)',
      [wcCode, wcName, workshopId || null, workshopCode || '', factoryCode || '', wcType || '', capacity || 0]
    );
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message, 400); }
});


// ============================================================
// 兼容路由层 v2 — 完整camelCase字段名，覆盖前端所有API调用
// ============================================================

// ── 工具函数：snake_case → camelCase ─────────────────────────
function toCamel(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamel);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
      v instanceof Date ? v : (v && typeof v === 'object' ? toCamel(v) : v)
    ])
  );
}

// ── 计量单位 /units/* ──────────────────────────────────────────
router.get('/units/list', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, unit_code as unitCode, unit_name as unitName, unit_code as code, unit_name as name FROM base_unit WHERE deleted=0 ORDER BY id');
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/units/page', authMiddleware, async (req, res) => {
  try {
    const { current = 1, pageSize = 20 } = req.query;
    const offset = (Number(current) - 1) * Number(pageSize);
    const [rows] = await db.execute('SELECT id, unit_code as unitCode, unit_name as unitName, unit_code as code, unit_name as name FROM base_unit WHERE deleted=0 ORDER BY id LIMIT ? OFFSET ?', [Number(pageSize), offset]);
    const [[cnt]] = await db.execute('SELECT COUNT(*) as total FROM base_unit WHERE deleted=0');
    ok(res, { list: rows, total: cnt.total, current: Number(current), pageSize: Number(pageSize) });
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/units/:id', authMiddleware, async (req, res) => {
  try {
    const [[row]] = await db.execute('SELECT id, unit_code as unitCode, unit_name as unitName FROM base_unit WHERE id=? AND deleted=0', [req.params.id]);
    ok(res, row || null);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/units', authMiddleware, async (req, res) => {
  try {
    const { unitCode, unitName, code, name } = req.body;
    const [r] = await db.execute('INSERT INTO base_unit (unit_code,unit_name) VALUES (?,?)', [unitCode||code, unitName||name]);
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message, 400); }
});
router.put('/units/:id', authMiddleware, async (req, res) => {
  try {
    const { unitName, name } = req.body;
    await db.execute('UPDATE base_unit SET unit_name=?,update_time=NOW() WHERE id=?', [unitName||name, req.params.id]);
    ok(res, { id: Number(req.params.id) });
  } catch (e) { fail(res, e.message, 400); }
});
router.delete('/units/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('UPDATE base_unit SET deleted=1 WHERE id=?', [req.params.id]);
    ok(res, null);
  } catch (e) { fail(res, e.message, 400); }
});

// ── 物料分类 /material-categories/* ──────────────────────────
router.get('/material-categories/list', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT id, IFNULL(parent_id,0) as parentId, cat_code as code, cat_name as name, sort_no as sortNo, 1 as status FROM base_material_category WHERE deleted=0 ORDER BY sort_no,id`);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/material-categories/page', authMiddleware, async (req, res) => {
  try {
    const { current = 1, pageSize = 50 } = req.query;
    const offset = (Number(current) - 1) * Number(pageSize);
    const [rows] = await db.execute(`SELECT id, IFNULL(parent_id,0) as parentId, cat_code as code, cat_name as name, sort_no as sortNo, 1 as status FROM base_material_category WHERE deleted=0 ORDER BY sort_no,id LIMIT ? OFFSET ?`, [Number(pageSize), offset]);
    const [[cnt]] = await db.execute('SELECT COUNT(*) as total FROM base_material_category WHERE deleted=0');
    ok(res, { list: rows, total: cnt.total, current: Number(current), pageSize: Number(pageSize) });
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/material-categories', authMiddleware, async (req, res) => {
  try {
    const { parentId, code, catCode, name, catName, sortNo } = req.body;
    const [r] = await db.execute('INSERT INTO base_material_category (parent_id,cat_code,cat_name,sort_no) VALUES (?,?,?,?)', [parentId||null, catCode||code, catName||name, sortNo||0]);
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message, 400); }
});
router.put('/material-categories/:id', authMiddleware, async (req, res) => {
  try {
    const { name, catName, sortNo } = req.body;
    await db.execute('UPDATE base_material_category SET cat_name=?,sort_no=?,update_time=NOW() WHERE id=?', [catName||name, sortNo||0, req.params.id]);
    ok(res, { id: Number(req.params.id) });
  } catch (e) { fail(res, e.message, 400); }
});
router.delete('/material-categories/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('UPDATE base_material_category SET deleted=1 WHERE id=?', [req.params.id]);
    ok(res, null);
  } catch (e) { fail(res, e.message, 400); }
});
router.delete('/material-categories/batch', authMiddleware, async (req, res) => {
  try {
    const ids = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return ok(res, null);
    await db.execute(`UPDATE base_material_category SET deleted=1 WHERE id IN (${ids.map(()=>'?').join(',')})`, ids);
    ok(res, null);
  } catch (e) { fail(res, e.message, 400); }
});

// ── 物料档案 /materials/* ──────────────────────────────────────
const MATERIAL_SELECT = `SELECT m.id, m.material_code as code, m.material_name as name,
  m.material_code as materialCode, m.material_name as materialName,
  m.category_id as categoryId, m.material_type as type, m.material_type as materialType,
  m.spec, m.unit_name as unitName, m.brand, m.supplier,
  IFNULL(m.shelf_life,0) as shelfLife, m.storage_cond as storageCond,
  IFNULL(m.min_stock,0) as minStock, IFNULL(m.max_stock,0) as maxStock,
  IFNULL(m.status,1) as status, c.cat_name as categoryName
  FROM base_material m LEFT JOIN base_material_category c ON m.category_id=c.id`;

router.get('/materials/list', authMiddleware, async (req, res) => {
  try {
    const { categoryId, type, materialType, keyword } = req.query;
    let where = 'WHERE m.deleted=0'; const p = [];
    if (categoryId) { where += ' AND m.category_id=?'; p.push(Number(categoryId)); }
    if (type||materialType) { where += ' AND m.material_type=?'; p.push(type||materialType); }
    if (keyword) { where += ' AND (m.material_code LIKE ? OR m.material_name LIKE ?)'; p.push(`%${keyword}%`,`%${keyword}%`); }
    const [rows] = await db.execute(`${MATERIAL_SELECT} ${where} ORDER BY m.id`, p);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/materials/page', authMiddleware, async (req, res) => {
  try {
    const { current=1, pageSize=20, categoryId, type, materialType, keyword } = req.query;
    const offset = (Number(current)-1)*Number(pageSize);
    let where = 'WHERE m.deleted=0'; const p = [];
    if (categoryId) { where += ' AND m.category_id=?'; p.push(Number(categoryId)); }
    if (type||materialType) { where += ' AND m.material_type=?'; p.push(type||materialType); }
    if (keyword) { where += ' AND (m.material_code LIKE ? OR m.material_name LIKE ?)'; p.push(`%${keyword}%`,`%${keyword}%`); }
    const [rows] = await db.execute(`${MATERIAL_SELECT} ${where} ORDER BY m.id LIMIT ? OFFSET ?`, [...p,Number(pageSize),offset]);
    const [[cnt]] = await db.execute(`SELECT COUNT(*) as total FROM base_material m ${where}`, p);
    ok(res, { list:rows, total:cnt.total, current:Number(current), pageSize:Number(pageSize) });
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/materials/:id', authMiddleware, async (req, res) => {
  try {
    const [[row]] = await db.execute(`${MATERIAL_SELECT} WHERE m.id=? AND m.deleted=0`, [req.params.id]);
    ok(res, row||null);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/materials', authMiddleware, async (req, res) => {
  try {
    const { code, materialCode, name, materialName, categoryId, type, materialType, spec, unitName, brand, supplier, shelfLife, storageCond, minStock, maxStock } = req.body;
    const [r] = await db.execute(
      'INSERT INTO base_material (material_code,material_name,category_id,material_type,spec,unit_name,brand,supplier,shelf_life,storage_cond,min_stock,max_stock) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [materialCode||code, materialName||name, categoryId||null, materialType||type||'RAW', spec||'', unitName||'', brand||'', supplier||'', shelfLife||0, storageCond||'', minStock||0, maxStock||0]
    );
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message, 400); }
});
router.put('/materials/:id', authMiddleware, async (req, res) => {
  try {
    const { name, materialName, type, materialType, spec, unitName, brand, supplier, shelfLife, storageCond, minStock, maxStock, status } = req.body;
    await db.execute(
      'UPDATE base_material SET material_name=?,material_type=?,spec=?,unit_name=?,brand=?,supplier=?,shelf_life=?,storage_cond=?,min_stock=?,max_stock=?,status=?,update_time=NOW() WHERE id=? AND deleted=0',
      [materialName||name, materialType||type||'RAW', spec||'', unitName||'', brand||'', supplier||'', shelfLife||0, storageCond||'', minStock||0, maxStock||0, status??1, req.params.id]
    );
    ok(res, { id: Number(req.params.id) });
  } catch (e) { fail(res, e.message, 400); }
});
router.delete('/materials/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('UPDATE base_material SET deleted=1,update_time=NOW() WHERE id=?', [req.params.id]);
    ok(res, null);
  } catch (e) { fail(res, e.message, 400); }
});

// ── 产品系列 /product-series/* ────────────────────────────────
router.get('/product-series/list', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT id, series_code as code, series_name as name,
      series_code as seriesCode, series_name as seriesName, description, IFNULL(status,1) as status
      FROM base_product_series WHERE deleted=0 ORDER BY id`);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/product-series/page', authMiddleware, async (req, res) => {
  try {
    const { current=1, pageSize=20 } = req.query;
    const offset = (Number(current)-1)*Number(pageSize);
    const [rows] = await db.execute(`SELECT id, series_code as code, series_name as name,
      series_code as seriesCode, series_name as seriesName, description, IFNULL(status,1) as status
      FROM base_product_series WHERE deleted=0 ORDER BY id LIMIT ? OFFSET ?`, [Number(pageSize),offset]);
    const [[cnt]] = await db.execute('SELECT COUNT(*) as total FROM base_product_series WHERE deleted=0');
    ok(res, { list:rows, total:cnt.total, current:Number(current), pageSize:Number(pageSize) });
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/product-series/:id', authMiddleware, async (req, res) => {
  try {
    const [[row]] = await db.execute('SELECT id,series_code as code,series_name as name,description FROM base_product_series WHERE id=? AND deleted=0', [req.params.id]);
    ok(res, row||null);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/product-series', authMiddleware, async (req, res) => {
  try {
    const { seriesCode, seriesName, code, name, description } = req.body;
    const [r] = await db.execute('INSERT INTO base_product_series (series_code,series_name,description) VALUES (?,?,?)', [seriesCode||code, seriesName||name, description||'']);
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message, 400); }
});
router.put('/product-series/:id', authMiddleware, async (req, res) => {
  try {
    const { seriesName, name, description } = req.body;
    await db.execute('UPDATE base_product_series SET series_name=?,description=?,update_time=NOW() WHERE id=?', [seriesName||name, description||'', req.params.id]);
    ok(res, { id: Number(req.params.id) });
  } catch (e) { fail(res, e.message, 400); }
});

// ── BOM /boms/* ───────────────────────────────────────────────
router.get('/boms/list', authMiddleware, async (req, res) => {
  try {
    const { materialCode, materialName } = req.query;
    let where = 'WHERE deleted=0'; const p = [];
    if (materialCode) { where += ' AND material_code LIKE ?'; p.push(`%${materialCode}%`); }
    if (materialName) { where += ' AND material_name LIKE ?'; p.push(`%${materialName}%`); }
    const [rows] = await db.execute(`SELECT id, bom_code as bomCode, bom_code as code,
      bom_version as bomVersion, bom_version as version,
      material_id as materialId, material_code as materialCode, material_name as materialName,
      batch_size as batchSize, batch_unit as batchUnit, batch_unit as unitName,
      bom_status as bomStatus, bom_status as status,
      effective_date as effectiveDate, expiry_date as expiryDate,
      create_by as createBy, create_time as createTime
      FROM base_bom ${where} ORDER BY id`, p);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/boms/page', authMiddleware, async (req, res) => {
  try {
    const { current=1, pageSize=20, materialCode, materialName, bomStatus } = req.query;
    const offset = (Number(current)-1)*Number(pageSize);
    let where = 'WHERE deleted=0'; const p = [];
    if (materialCode) { where += ' AND material_code LIKE ?'; p.push(`%${materialCode}%`); }
    if (materialName) { where += ' AND material_name LIKE ?'; p.push(`%${materialName}%`); }
    if (bomStatus) { where += ' AND bom_status=?'; p.push(bomStatus); }
    const [rows] = await db.execute(`SELECT id, bom_code as bomCode, bom_code as code,
      bom_version as version, material_code as materialCode, material_name as materialName,
      batch_size as batchSize, batch_unit as batchUnit, bom_status as status,
      effective_date as effectiveDate, create_by as createBy, create_time as createTime
      FROM base_bom ${where} ORDER BY id LIMIT ? OFFSET ?`, [...p,Number(pageSize),offset]);
    const [[cnt]] = await db.execute(`SELECT COUNT(*) as total FROM base_bom ${where}`, p);
    ok(res, { list:rows, total:cnt.total, current:Number(current), pageSize:Number(pageSize) });
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/boms/:id', authMiddleware, async (req, res) => {
  try {
    const [[bom]] = await db.execute(`SELECT id, bom_code as bomCode, bom_code as code,
      bom_version as version, material_id as materialId, material_code as materialCode,
      material_name as materialName, batch_size as batchSize, batch_unit as batchUnit,
      bom_status as status, effective_date as effectiveDate, create_by as createBy
      FROM base_bom WHERE id=? AND deleted=0`, [req.params.id]);
    if (!bom) return ok(res, null);
    const [details] = await db.execute(`SELECT id, bom_id as bomId, line_no as lineNo,
      material_id as materialId, material_code as materialCode, material_name as materialName,
      material_type as materialType, qty as quantity, qty, unit_name as unitName,
      loss_rate as lossRate, loss_rate as scrapRate, process_step as processStep,
      is_key_material as isKeyMaterial
      FROM base_bom_detail WHERE bom_id=? AND deleted=0 ORDER BY line_no`, [req.params.id]);
    ok(res, { ...bom, details });
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/boms/:id/details', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT id, bom_id as bomId, line_no as lineNo,
      material_id as materialId, material_code as materialCode, material_name as materialName,
      material_type as materialType, qty as quantity, qty, unit_name as unitName,
      loss_rate as lossRate, loss_rate as scrapRate, process_step as processStep,
      IFNULL(is_key_material,0) as isKeyMaterial
      FROM base_bom_detail WHERE bom_id=? AND deleted=0 ORDER BY line_no`, [req.params.id]);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/boms', authMiddleware, async (req, res) => {
  try {
    const { bomCode, code, bomVersion='1.00', version, materialId, materialCode, materialName, batchSize=1000, batchUnit='粒', details=[] } = req.body;
    const [r] = await db.execute('INSERT INTO base_bom (bom_code,bom_version,material_id,material_code,material_name,batch_size,batch_unit) VALUES (?,?,?,?,?,?,?)',
      [bomCode||code, bomVersion||version, materialId||null, materialCode||'', materialName||'', batchSize, batchUnit]);
    const bomId = r.insertId;
    for (let i=0; i<details.length; i++) {
      const d = details[i];
      await db.execute('INSERT INTO base_bom_detail (bom_id,line_no,material_id,material_code,material_name,material_type,qty,unit_name,loss_rate,process_step,is_key_material) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [bomId,i+1,d.materialId||null,d.materialCode||'',d.materialName||'',d.materialType||'',d.qty||d.quantity||0,d.unitName||'',d.lossRate||d.scrapRate||0,d.processStep||'',d.isKeyMaterial||0]);
    }
    ok(res, { id: bomId });
  } catch (e) { fail(res, e.message, 400); }
});
router.get('/bom-details/list', authMiddleware, async (req, res) => {
  try {
    const { bomId } = req.query;
    if (!bomId) return ok(res, []);
    const [rows] = await db.execute(`SELECT id, bom_id as bomId, line_no as lineNo,
      material_code as materialCode, material_name as materialName, material_type as materialType,
      qty as quantity, qty, unit_name as unitName, loss_rate as lossRate, process_step as processStep
      FROM base_bom_detail WHERE bom_id=? AND deleted=0 ORDER BY line_no`, [bomId]);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/bom-details', authMiddleware, async (req, res) => {
  try {
    const { bomId, lineNo, materialId, materialCode, materialName, materialType, qty, quantity, unitName, lossRate, processStep, isKeyMaterial } = req.body;
    const [r] = await db.execute('INSERT INTO base_bom_detail (bom_id,line_no,material_id,material_code,material_name,material_type,qty,unit_name,loss_rate,process_step,is_key_material) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [bomId, lineNo||1, materialId||null, materialCode||'', materialName||'', materialType||'RAW', qty||quantity||0, unitName||'', lossRate||0, processStep||'', isKeyMaterial||0]);
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message, 400); }
});
router.put('/bom-details/:id', authMiddleware, async (req, res) => {
  try {
    const { qty, quantity, unitName, lossRate, processStep } = req.body;
    await db.execute('UPDATE base_bom_detail SET qty=?,unit_name=?,loss_rate=?,process_step=?,update_time=NOW() WHERE id=?',
      [qty||quantity||0, unitName||'', lossRate||0, processStep||'', req.params.id]);
    ok(res, { id: Number(req.params.id) });
  } catch (e) { fail(res, e.message, 400); }
});
router.delete('/bom-details/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('UPDATE base_bom_detail SET deleted=1 WHERE id=?', [req.params.id]);
    ok(res, null);
  } catch (e) { fail(res, e.message, 400); }
});

// ── 工序主数据 /operations/* ──────────────────────────────────
router.get('/operations/list', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT id, op_code as opCode, op_code as code,
      op_name as opName, op_name as name, op_type as opType,
      IFNULL(std_time,0) as stdTime, workshop_type as workshopType,
      IFNULL(description,'') as description, IFNULL(status,1) as status
      FROM base_operation WHERE deleted=0 ORDER BY id`);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/operations/page', authMiddleware, async (req, res) => {
  try {
    const { current=1, pageSize=20 } = req.query;
    const offset = (Number(current)-1)*Number(pageSize);
    const [rows] = await db.execute(`SELECT id, op_code as opCode, op_code as code,
      op_name as opName, op_name as name, op_type as opType,
      IFNULL(std_time,0) as stdTime, workshop_type as workshopType, IFNULL(status,1) as status
      FROM base_operation WHERE deleted=0 ORDER BY id LIMIT ? OFFSET ?`, [Number(pageSize),offset]);
    const [[cnt]] = await db.execute('SELECT COUNT(*) as total FROM base_operation WHERE deleted=0');
    ok(res, { list:rows, total:cnt.total, current:Number(current), pageSize:Number(pageSize) });
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/operations/:id', authMiddleware, async (req, res) => {
  try {
    const [[row]] = await db.execute(`SELECT id, op_code as opCode, op_name as opName, op_type as opType,
      IFNULL(std_time,0) as stdTime, workshop_type as workshopType, description
      FROM base_operation WHERE id=? AND deleted=0`, [req.params.id]);
    ok(res, row||null);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/operations', authMiddleware, async (req, res) => {
  try {
    const { opCode, code, opName, name, opType, stdTime, workshopType, description } = req.body;
    const [r] = await db.execute('INSERT INTO base_operation (op_code,op_name,op_type,std_time,workshop_type,description) VALUES (?,?,?,?,?,?)',
      [opCode||code, opName||name, opType||'', stdTime||0, workshopType||'', description||'']);
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message, 400); }
});
router.put('/operations/:id', authMiddleware, async (req, res) => {
  try {
    const { opName, name, opType, stdTime, workshopType, description } = req.body;
    await db.execute('UPDATE base_operation SET op_name=?,op_type=?,std_time=?,workshop_type=?,description=?,update_time=NOW() WHERE id=?',
      [opName||name, opType||'', stdTime||0, workshopType||'', description||'', req.params.id]);
    ok(res, { id: Number(req.params.id) });
  } catch (e) { fail(res, e.message, 400); }
});

// ── 工艺路线 /process-routings/* ─────────────────────────────
router.get('/process-routings/list', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT id, route_code as routeCode, route_code as code,
      route_name as routeName, route_name as name, material_id as materialId,
      factory_code as factoryCode, workshop_type as workshopType,
      route_status as routeStatus, route_status as status, version
      FROM base_process_routing WHERE deleted=0 ORDER BY id`);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/process-routings/page', authMiddleware, async (req, res) => {
  try {
    const { current=1, pageSize=20 } = req.query;
    const offset = (Number(current)-1)*Number(pageSize);
    const [rows] = await db.execute(`SELECT id, route_code as routeCode, route_code as code,
      route_name as routeName, route_name as name, factory_code as factoryCode,
      workshop_type as workshopType, route_status as status, version
      FROM base_process_routing WHERE deleted=0 ORDER BY id LIMIT ? OFFSET ?`, [Number(pageSize),offset]);
    const [[cnt]] = await db.execute('SELECT COUNT(*) as total FROM base_process_routing WHERE deleted=0');
    ok(res, { list:rows, total:cnt.total, current:Number(current), pageSize:Number(pageSize) });
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/process-routings/:id', authMiddleware, async (req, res) => {
  try {
    const [[route]] = await db.execute(`SELECT id, route_code as routeCode, route_code as code,
      route_name as routeName, route_name as name, material_id as materialId,
      factory_code as factoryCode, workshop_type as workshopType, route_status as status, version
      FROM base_process_routing WHERE id=? AND deleted=0`, [req.params.id]);
    if (!route) return ok(res, null);
    const [steps] = await db.execute(`SELECT rs.id, rs.route_id as routingId, rs.route_id as routeId, rs.step_no as stepNo,
      rs.op_id as opId, rs.op_code as opCode, IFNULL(rs.op_name, rs.op_code) as opName,
      IFNULL(rs.std_time,0) as stdTime, IFNULL(rs.is_key_step,0) as isKeyProcess,
      IFNULL(rs.is_key_step,0) as isKeyStep, IFNULL(rs.require_qc,0) as requireQc,
      IFNULL(rs.require_ebr,0) as requireEbr, rs.wc_id as wcId
      FROM base_routing_step rs
      WHERE rs.route_id=? AND rs.deleted=0 ORDER BY rs.step_no`, [req.params.id]);
    ok(res, { ...route, steps });
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/process-routings', authMiddleware, async (req, res) => {
  try {
    const { routeCode, code, routeName, name, materialId, factoryCode, workshopType, version='1.0', steps=[] } = req.body;
    const [r] = await db.execute('INSERT INTO base_process_routing (route_code,route_name,material_id,factory_code,workshop_type,version) VALUES (?,?,?,?,?,?)',
      [routeCode||code, routeName||name, materialId||null, factoryCode||'NJ', workshopType||'', version]);
    const routeId = r.insertId;
    for (let i=0; i<steps.length; i++) {
      const s = steps[i];
      await db.execute('INSERT INTO base_routing_step (route_id,step_no,op_id,op_code,op_name,std_time,is_key_step) VALUES (?,?,?,?,?,?,?)',
        [routeId, s.stepNo||i+1, s.opId||null, s.opCode||'', s.opName||'', s.stdTime||0, s.isKeyProcess||s.isKeyStep||0]);
    }
    ok(res, { id: routeId });
  } catch (e) { fail(res, e.message, 400); }
});
router.put('/process-routings/:id', authMiddleware, async (req, res) => {
  try {
    const { routeName, name, version } = req.body;
    await db.execute('UPDATE base_process_routing SET route_name=?,version=?,update_time=NOW() WHERE id=?',
      [routeName||name, version||'1.0', req.params.id]);
    ok(res, { id: Number(req.params.id) });
  } catch (e) { fail(res, e.message, 400); }
});

// ── 车间 /workshops/* ─────────────────────────────────────────
router.get('/workshops/list', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT id, workshop_code as workshopCode, workshop_code as code,
      workshop_name as workshopName, workshop_name as name, factory_code as factoryCode, IFNULL(status,1) as status
      FROM base_workshop WHERE deleted=0 ORDER BY id`);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/workshops/page', authMiddleware, async (req, res) => {
  try {
    const { current=1, pageSize=20 } = req.query;
    const offset = (Number(current)-1)*Number(pageSize);
    const [rows] = await db.execute(`SELECT id, workshop_code as code, workshop_name as name,
      factory_code as factoryCode FROM base_workshop WHERE deleted=0 ORDER BY id LIMIT ? OFFSET ?`, [Number(pageSize),offset]);
    const [[cnt]] = await db.execute('SELECT COUNT(*) as total FROM base_workshop WHERE deleted=0');
    ok(res, { list:rows, total:cnt.total });
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/workshops/:id', authMiddleware, async (req, res) => {
  try {
    const [[row]] = await db.execute('SELECT id, workshop_code as code, workshop_name as name, factory_code as factoryCode FROM base_workshop WHERE id=? AND deleted=0', [req.params.id]);
    ok(res, row||null);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/workshops', authMiddleware, async (req, res) => {
  try {
    const { workshopCode, code, workshopName, name, factoryCode } = req.body;
    const [r] = await db.execute('INSERT INTO base_workshop (workshop_code,workshop_name,factory_code) VALUES (?,?,?)',
      [workshopCode||code, workshopName||name, factoryCode||'NJ']);
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message, 400); }
});
router.put('/workshops/:id', authMiddleware, async (req, res) => {
  try {
    const { workshopName, name } = req.body;
    await db.execute('UPDATE base_workshop SET workshop_name=?,update_time=NOW() WHERE id=?', [workshopName||name, req.params.id]);
    ok(res, { id: Number(req.params.id) });
  } catch (e) { fail(res, e.message, 400); }
});

// ── 工作中心 /work-centers/* ──────────────────────────────────
router.get('/work-centers/list', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT wc.id, wc.wc_code as wcCode, wc.wc_code as code,
      wc.wc_name as wcName, wc.wc_name as name, wc.factory_code as factoryCode,
      wc.wc_type as wcType, IFNULL(wc.capacity,0) as capacity,
      w.workshop_name as workshopName, wc.workshop_id as workshopId
      FROM base_work_center wc LEFT JOIN base_workshop w ON wc.workshop_id=w.id
      WHERE wc.deleted=0 ORDER BY wc.id`);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/work-centers/page', authMiddleware, async (req, res) => {
  try {
    const { current=1, pageSize=20 } = req.query;
    const offset = (Number(current)-1)*Number(pageSize);
    const [rows] = await db.execute(`SELECT wc.id, wc.wc_code as code, wc.wc_name as name,
      wc.factory_code as factoryCode, w.workshop_name as workshopName
      FROM base_work_center wc LEFT JOIN base_workshop w ON wc.workshop_id=w.id
      WHERE wc.deleted=0 ORDER BY wc.id LIMIT ? OFFSET ?`, [Number(pageSize),offset]);
    const [[cnt]] = await db.execute('SELECT COUNT(*) as total FROM base_work_center WHERE deleted=0');
    ok(res, { list:rows, total:cnt.total });
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/work-centers/:id', authMiddleware, async (req, res) => {
  try {
    const [[row]] = await db.execute('SELECT wc.*, w.workshop_name as workshopName FROM base_work_center wc LEFT JOIN base_workshop w ON wc.workshop_id=w.id WHERE wc.id=? AND wc.deleted=0', [req.params.id]);
    ok(res, row||null);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/work-centers', authMiddleware, async (req, res) => {
  try {
    const { wcCode, code, wcName, name, workshopId, workshopCode, factoryCode, wcType, capacity } = req.body;
    const [r] = await db.execute('INSERT INTO base_work_center (wc_code,wc_name,workshop_id,workshop_code,factory_code,wc_type,capacity) VALUES (?,?,?,?,?,?,?)',
      [wcCode||code, wcName||name, workshopId||null, workshopCode||'', factoryCode||'NJ', wcType||'', capacity||0]);
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message, 400); }
});

// ── 班组 /teams/* ─────────────────────────────────────────────
router.get('/teams/list', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT t.id, t.team_code as teamCode, t.team_code as code,
      t.team_name as teamName, t.team_name as name, t.workshop_id as workshopId,
      IFNULL(w.workshop_code,'') as workshopCode, IFNULL(w.workshop_name,'') as workshopName,
      t.factory_code as factoryCode, IFNULL(t.status,1) as status
      FROM base_team t LEFT JOIN base_workshop w ON t.workshop_id=w.id
      WHERE t.deleted=0 ORDER BY t.id`);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/teams/page', authMiddleware, async (req, res) => {
  try {
    const { current=1, pageSize=20 } = req.query;
    const offset = (Number(current)-1)*Number(pageSize);
    const [rows] = await db.execute(`SELECT t.id, t.team_code as code, t.team_name as name,
      t.workshop_id as workshopId, IFNULL(w.workshop_code,'') as workshopCode,
      IFNULL(w.workshop_name,'') as workshopName, t.factory_code as factoryCode, IFNULL(t.status,1) as status
      FROM base_team t LEFT JOIN base_workshop w ON t.workshop_id=w.id
      WHERE t.deleted=0 ORDER BY t.id LIMIT ? OFFSET ?`, [Number(pageSize),offset]);
    const [[cnt]] = await db.execute('SELECT COUNT(*) as total FROM base_team WHERE deleted=0');
    ok(res, { list:rows, total:cnt.total, current:Number(current), pageSize:Number(pageSize) });
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/teams/:id', authMiddleware, async (req, res) => {
  try {
    const [[row]] = await db.execute(`SELECT t.id, t.team_code as teamCode, t.team_name as teamName,
      t.workshop_id as workshopId, t.factory_code as factoryCode, t.status
      FROM base_team t WHERE t.id=? AND t.deleted=0`, [req.params.id]);
    ok(res, row||null);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/teams', authMiddleware, async (req, res) => {
  try {
    const { teamCode, code, teamName, name, workshopId, factoryCode } = req.body;
    const [r] = await db.execute('INSERT INTO base_team (team_code,team_name,workshop_id,factory_code) VALUES (?,?,?,?)',
      [teamCode||code, teamName||name, workshopId||null, factoryCode||'NJ']);
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message, 400); }
});
router.put('/teams/:id', authMiddleware, async (req, res) => {
  try {
    const { teamName, name, workshopId, factoryCode } = req.body;
    await db.execute('UPDATE base_team SET team_name=?,workshop_id=?,factory_code=?,update_time=NOW() WHERE id=?',
      [teamName||name, workshopId||null, factoryCode||'NJ', req.params.id]);
    ok(res, { id: Number(req.params.id) });
  } catch (e) { fail(res, e.message, 400); }
});

// ── 员工 /employees/* ─────────────────────────────────────────
// NOTE: actual table uses emp_no/emp_name not employee_no/employee_name
router.get('/employees/list', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT e.id, e.emp_no as empNo, e.emp_no as employeeNo, e.emp_no as code,
      e.emp_name as empName, e.emp_name as employeeName, e.emp_name as name,
      e.factory_code as factoryCode, e.workshop_id as workshopId,
      e.team_id as teamId, e.emp_type as empType, e.position, e.phone,
      IFNULL(w.workshop_name,'') as workshopName, IFNULL(t.team_name,'') as teamName,
      IFNULL(e.status,1) as status
      FROM base_employee e
      LEFT JOIN base_workshop w ON e.workshop_id=w.id
      LEFT JOIN base_team t ON e.team_id=t.id
      WHERE e.deleted=0 ORDER BY e.id`);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/employees/page', authMiddleware, async (req, res) => {
  try {
    const { current=1, pageSize=20 } = req.query;
    const offset = (Number(current)-1)*Number(pageSize);
    const [rows] = await db.execute(`SELECT e.id, e.emp_no as empNo, e.emp_no as code,
      e.emp_name as empName, e.emp_name as name, e.factory_code as factoryCode,
      e.emp_type as empType, e.position, e.phone,
      IFNULL(w.workshop_name,'') as workshopName, IFNULL(t.team_name,'') as teamName,
      IFNULL(e.status,1) as status
      FROM base_employee e
      LEFT JOIN base_workshop w ON e.workshop_id=w.id
      LEFT JOIN base_team t ON e.team_id=t.id
      WHERE e.deleted=0 ORDER BY e.id LIMIT ? OFFSET ?`, [Number(pageSize),offset]);
    const [[cnt]] = await db.execute('SELECT COUNT(*) as total FROM base_employee WHERE deleted=0');
    ok(res, { list:rows, total:cnt.total, current:Number(current), pageSize:Number(pageSize) });
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/employees/:id', authMiddleware, async (req, res) => {
  try {
    const [[row]] = await db.execute(`SELECT e.id, e.emp_no as empNo, e.emp_no as employeeNo,
      e.emp_name as empName, e.emp_name as employeeName, e.factory_code as factoryCode,
      e.workshop_id as workshopId, e.team_id as teamId, e.emp_type as empType,
      e.position, e.phone, e.status
      FROM base_employee e WHERE e.id=? AND e.deleted=0`, [req.params.id]);
    ok(res, row||null);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/employees', authMiddleware, async (req, res) => {
  try {
    const { empNo, employeeNo, code, empName, employeeName, name, factoryCode, workshopId, teamId, empType, position, phone } = req.body;
    const [r] = await db.execute('INSERT INTO base_employee (emp_no,emp_name,factory_code,workshop_id,team_id,emp_type,position,phone) VALUES (?,?,?,?,?,?,?,?)',
      [empNo||employeeNo||code, empName||employeeName||name, factoryCode||'NJ', workshopId||null, teamId||null, empType||'正式', position||'', phone||'']);
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message, 400); }
});
router.put('/employees/:id', authMiddleware, async (req, res) => {
  try {
    const { empName, employeeName, name, factoryCode, workshopId, teamId, empType, position, phone, status } = req.body;
    await db.execute('UPDATE base_employee SET emp_name=?,factory_code=?,workshop_id=?,team_id=?,emp_type=?,position=?,phone=?,status=?,update_time=NOW() WHERE id=?',
      [empName||employeeName||name, factoryCode||'NJ', workshopId||null, teamId||null, empType||'正式', position||'', phone||'', status??1, req.params.id]);
    ok(res, { id: Number(req.params.id) });
  } catch (e) { fail(res, e.message, 400); }
});
router.delete('/employees/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('UPDATE base_employee SET deleted=1 WHERE id=?', [req.params.id]);
    ok(res, null);
  } catch (e) { fail(res, e.message, 400); }
});

module.exports = router;
