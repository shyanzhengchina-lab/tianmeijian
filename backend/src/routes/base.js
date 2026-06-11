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

module.exports = router;
