/**
 * M05 物料仓储路由
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { ok, fail, page } = require('../middleware/response');
const { authMiddleware } = require('../middleware/auth');
const dayjs = require('dayjs');

const genCode = (prefix) => `${prefix}${dayjs().format('YYYYMMDDHHmm')}${String(Math.floor(Math.random()*900)+100)}`;

// ===== 仓库档案 =====
router.get('/warehouse/warehouses', authMiddleware, async (req, res) => {
  try {
    const { factoryCode } = req.query;
    let sql = 'SELECT * FROM wms_warehouse WHERE deleted=0';
    const params = [];
    if (factoryCode) { sql += ' AND factory_code=?'; params.push(factoryCode); }
    sql += ' ORDER BY id';
    const [rows] = await db.execute(sql, params);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/warehouse/warehouses', authMiddleware, async (req, res) => {
  try {
    const { whCode, whName, factoryCode, whType } = req.body;
    const [r] = await db.execute('INSERT INTO wms_warehouse (wh_code,wh_name,factory_code,wh_type) VALUES (?,?,?,?)',
      [whCode, whName, factoryCode || '', whType || '']);
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message, 400); }
});

// ===== 物料批次(库存) =====
router.get('/warehouse/lots', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, materialCode, materialName, lotStatus, lotType, warehouseCode } = req.query;
    let sql = 'SELECT l.*,m.material_type,m.spec FROM wms_material_lot l LEFT JOIN base_material m ON l.material_id=m.id WHERE l.deleted=0';
    const params = [];
    if (materialCode) { sql += ' AND l.material_code LIKE ?'; params.push(`%${materialCode}%`); }
    if (materialName) { sql += ' AND l.material_name LIKE ?'; params.push(`%${materialName}%`); }
    if (lotStatus) { sql += ' AND l.lot_status=?'; params.push(lotStatus); }
    if (lotType) { sql += ' AND l.lot_type=?'; params.push(lotType); }
    if (warehouseCode) { sql += ' AND l.warehouse_code=?'; params.push(warehouseCode); }
    const baseCnt = `SELECT COUNT(*) as cnt FROM wms_material_lot l WHERE l.deleted=0${materialCode ? ' AND l.material_code LIKE ?' : ''}${materialName ? ' AND l.material_name LIKE ?' : ''}${lotStatus ? ' AND l.lot_status=?' : ''}${lotType ? ' AND l.lot_type=?' : ''}${warehouseCode ? ' AND l.warehouse_code=?' : ''}`;
    const [cntRows] = await db.execute(baseCnt, params);
    sql += ` ORDER BY l.create_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/warehouse/lots/:id', authMiddleware, async (req, res) => {
  try {
    const [lot] = await db.execute('SELECT * FROM wms_material_lot WHERE id=?', [req.params.id]);
    if (!lot.length) return fail(res, '不存在');
    const [logs] = await db.execute('SELECT * FROM wms_inventory_log WHERE lot_id=? ORDER BY create_time DESC LIMIT 50', [req.params.id]);
    ok(res, { ...lot[0], logs });
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/warehouse/lots', authMiddleware, async (req, res) => {
  try {
    const { lotCode, materialId, materialCode, materialName, vendorBatch, lotType = 1, qtyTotal, unitName, warehouseCode, locationCode, mfgDate, expDate, supplier } = req.body;
    const [r] = await db.execute(
      'INSERT INTO wms_material_lot (lot_code,material_id,material_code,material_name,vendor_batch,lot_type,qty_total,qty_available,unit_name,warehouse_code,location_code,mfg_date,exp_date,receipt_date,supplier) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,CURDATE(),?)',
      [lotCode || genCode('LOT'), materialId, materialCode || '', materialName || '', vendorBatch || '', lotType, qtyTotal || 0, qtyTotal || 0, unitName || '', warehouseCode || '', locationCode || '', mfgDate || null, expDate || null, supplier || '']
    );
    // 记录入库流水
    await db.execute(
      'INSERT INTO wms_inventory_log (lot_id,lot_code,material_code,trans_type,qty_change,qty_before,qty_after,ref_code,ref_type,operator_name) VALUES (?,?,?,"IN",?,0,?,?,?,?)',
      [r.insertId, lotCode || '', materialCode || '', qtyTotal || 0, qtyTotal || 0, lotCode || '', 'RECEIPT', req.user?.realName || '']
    );
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message, 400); }
});

// 更新批次状态
router.put('/warehouse/lots/:id/status', authMiddleware, async (req, res) => {
  try {
    const { lotStatus } = req.body;
    await db.execute('UPDATE wms_material_lot SET lot_status=?,update_time=NOW() WHERE id=?', [lotStatus, req.params.id]);
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// ===== 发料单 =====
router.get('/warehouse/issuances', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, woCode, issueStatus } = req.query;
    let sql = 'SELECT i.*,w.product_name,w.batch_no FROM wms_issuance i LEFT JOIN mes_work_order w ON i.wo_id=w.id WHERE i.deleted=0';
    const params = [];
    if (woCode) { sql += ' AND i.wo_code LIKE ?'; params.push(`%${woCode}%`); }
    if (issueStatus) { sql += ' AND i.issue_status=?'; params.push(issueStatus); }
    const [cntRows] = await db.execute(`SELECT COUNT(*) as cnt FROM wms_issuance i WHERE i.deleted=0${woCode ? ' AND i.wo_code LIKE ?' : ''}${issueStatus ? ' AND i.issue_status=?' : ''}`, params);
    sql += ` ORDER BY i.create_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/warehouse/issuances/:id', authMiddleware, async (req, res) => {
  try {
    const [issue] = await db.execute('SELECT * FROM wms_issuance WHERE id=?', [req.params.id]);
    if (!issue.length) return fail(res, '不存在');
    const [details] = await db.execute('SELECT * FROM wms_issuance_detail WHERE issue_id=?', [req.params.id]);
    ok(res, { ...issue[0], details });
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/warehouse/issuances', authMiddleware, async (req, res) => {
  try {
    const { woId, woCode, planDate, details = [] } = req.body;
    const issueCode = genCode('ISS');
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [r] = await conn.execute(
        'INSERT INTO wms_issuance (issue_code,wo_id,wo_code,plan_date,operator_name) VALUES (?,?,?,?,?)',
        [issueCode, woId, woCode || '', planDate || null, req.user?.realName || '']
      );
      const issueId = r.insertId;
      for (const d of details) {
        await conn.execute(
          'INSERT INTO wms_issuance_detail (issue_id,material_id,material_code,material_name,lot_id,lot_code,plan_qty,unit_name) VALUES (?,?,?,?,?,?,?,?)',
          [issueId, d.materialId, d.materialCode || '', d.materialName || '', d.lotId || null, d.lotCode || '', d.planQty || 0, d.unitName || '']
        );
      }
      await conn.commit();
      ok(res, { id: issueId, issueCode });
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  } catch (e) { fail(res, e.message, 400); }
});

// 确认发料
router.put('/warehouse/issuances/:id/confirm', authMiddleware, async (req, res) => {
  try {
    const { details = [] } = req.body;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      for (const d of details) {
        if (d.actualQty > 0) {
          // 更新发料明细实际数量
          await conn.execute('UPDATE wms_issuance_detail SET actual_qty=?,detail_status=2 WHERE id=?', [d.actualQty, d.id]);
          // 扣减库存
          if (d.lotId) {
            const [lot] = await conn.execute('SELECT qty_available FROM wms_material_lot WHERE id=? FOR UPDATE', [d.lotId]);
            if (lot.length) {
              const qtyBefore = lot[0].qty_available;
              const qtyAfter = Math.max(0, qtyBefore - d.actualQty);
              await conn.execute('UPDATE wms_material_lot SET qty_available=?,qty_consumed=qty_consumed+?,update_time=NOW() WHERE id=?',
                [qtyAfter, d.actualQty, d.lotId]);
              await conn.execute(
                'INSERT INTO wms_inventory_log (lot_id,lot_code,material_code,trans_type,qty_change,qty_before,qty_after,ref_code,ref_type,operator_name) VALUES (?,?,?,"OUT",?,?,?,?,?,?)',
                [d.lotId, d.lotCode || '', d.materialCode || '', -d.actualQty, qtyBefore, qtyAfter, req.params.id, 'ISSUANCE', req.user?.realName || '']
              );
            }
          }
        }
      }
      await conn.execute('UPDATE wms_issuance SET issue_status=2,actual_date=CURDATE(),update_time=NOW() WHERE id=?', [req.params.id]);
      await conn.commit();
      ok(res);
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  } catch (e) { fail(res, e.message, 500); }
});

// 库存流水
router.get('/warehouse/inventory-logs', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, materialCode, transType } = req.query;
    let sql = 'SELECT * FROM wms_inventory_log WHERE 1=1';
    const params = [];
    if (materialCode) { sql += ' AND material_code LIKE ?'; params.push(`%${materialCode}%`); }
    if (transType) { sql += ' AND trans_type=?'; params.push(transType); }
    const [cntRows] = await db.execute(sql.replace('SELECT *', 'SELECT COUNT(*) as cnt'), params);
    sql += ` ORDER BY create_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});

// 库存汇总
router.get('/warehouse/inventory-summary', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT l.material_id,l.material_code,l.material_name,l.unit_name,
        SUM(l.qty_total) as total_qty, SUM(l.qty_available) as available_qty,
        SUM(l.qty_reserved) as reserved_qty, COUNT(*) as lot_count
      FROM wms_material_lot l
      WHERE l.deleted=0 AND l.lot_status IN (1,2)
      GROUP BY l.material_id,l.material_code,l.material_name,l.unit_name
      ORDER BY l.material_code`);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});

// =====================================================================
// compat 兼容路由层 — /wms/* 别名 → /warehouse/* 真实路由
// =====================================================================

// 字段映射辅助（保持与 warehouse 原始字段一致，加 camelCase 别名）
const mapLot = (row) => ({
  id:            row.id,
  lotCode:       row.lot_code,
  lot_code:      row.lot_code,
  materialId:    row.material_id,
  materialCode:  row.material_code,
  material_code: row.material_code,
  materialName:  row.material_name,
  material_name: row.material_name,
  vendorBatch:   row.vendor_batch ?? '',
  lotType:       row.lot_type ?? 1,
  lot_type:      row.lot_type ?? 1,
  qtyTotal:      row.qty_total ?? 0,
  qty_total:     row.qty_total ?? 0,
  qtyAvailable:  row.qty_available ?? 0,
  qty_available: row.qty_available ?? 0,
  qtyReserved:   row.qty_reserved ?? 0,
  qtyConsumed:   row.qty_consumed ?? 0,
  unitName:      row.unit_name ?? '',
  unit_name:     row.unit_name ?? '',
  warehouseCode: row.warehouse_code ?? '',
  warehouse_code:row.warehouse_code ?? '',
  locationCode:  row.location_code ?? '',
  lotStatus:     row.lot_status ?? 1,
  lot_status:    row.lot_status ?? 1,
  mfgDate:       row.mfg_date ?? null,
  mfg_date:      row.mfg_date ?? null,
  expDate:       row.exp_date ?? null,
  exp_date:      row.exp_date ?? null,
  supplier:      row.supplier ?? '',
  receiptDate:   row.receipt_date ?? null,
  // joined fields
  materialType:  row.material_type ?? '',
  spec:          row.spec ?? '',
  createTime:    row.create_time,
  updateTime:    row.update_time ?? row.create_time,
});

// /wms/lots
router.get('/wms/lots', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, materialCode, materialName, lotStatus, lotType, warehouseCode } = req.query;
    let sql = 'SELECT l.*,m.material_type,m.spec FROM wms_material_lot l LEFT JOIN base_material m ON l.material_id=m.id WHERE l.deleted=0';
    const params = [];
    if (materialCode)  { sql += ' AND l.material_code LIKE ?'; params.push(`%${materialCode}%`); }
    if (materialName)  { sql += ' AND l.material_name LIKE ?'; params.push(`%${materialName}%`); }
    if (lotStatus)     { sql += ' AND l.lot_status=?';         params.push(lotStatus); }
    if (lotType)       { sql += ' AND l.lot_type=?';           params.push(lotType); }
    if (warehouseCode) { sql += ' AND l.warehouse_code=?';     params.push(warehouseCode); }
    // count
    let cntSql = 'SELECT COUNT(*) as cnt FROM wms_material_lot l WHERE l.deleted=0';
    const cntParams = [];
    if (materialCode)  { cntSql += ' AND l.material_code LIKE ?'; cntParams.push(`%${materialCode}%`); }
    if (materialName)  { cntSql += ' AND l.material_name LIKE ?'; cntParams.push(`%${materialName}%`); }
    if (lotStatus)     { cntSql += ' AND l.lot_status=?';         cntParams.push(lotStatus); }
    if (lotType)       { cntSql += ' AND l.lot_type=?';           cntParams.push(lotType); }
    if (warehouseCode) { cntSql += ' AND l.warehouse_code=?';     cntParams.push(warehouseCode); }
    const [cntRows] = await db.execute(cntSql, cntParams);
    sql += ` ORDER BY l.create_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows.map(mapLot), cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});

router.get('/wms/lots/:id', authMiddleware, async (req, res) => {
  try {
    const [lot] = await db.execute('SELECT l.*,m.material_type,m.spec FROM wms_material_lot l LEFT JOIN base_material m ON l.material_id=m.id WHERE l.id=? AND l.deleted=0', [req.params.id]);
    if (!lot.length) return fail(res, '批次不存在');
    const [logs] = await db.execute('SELECT * FROM wms_inventory_log WHERE lot_id=? ORDER BY create_time DESC LIMIT 50', [req.params.id]);
    ok(res, { ...mapLot(lot[0]), logs });
  } catch (e) { fail(res, e.message, 500); }
});

// /wms/warehouses
router.get('/wms/warehouses', authMiddleware, async (req, res) => {
  try {
    const { factoryCode } = req.query;
    let sql = 'SELECT * FROM wms_warehouse WHERE deleted=0';
    const params = [];
    if (factoryCode) { sql += ' AND factory_code=?'; params.push(factoryCode); }
    sql += ' ORDER BY id';
    const [rows] = await db.execute(sql, params);
    ok(res, rows.map(r => ({
      id: r.id, whCode: r.wh_code, wh_code: r.wh_code,
      whName: r.wh_name, wh_name: r.wh_name,
      factoryCode: r.factory_code, whType: r.wh_type,
    })));
  } catch (e) { fail(res, e.message, 500); }
});

// /wms/issuances
router.get('/wms/issuances', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, woCode, issueStatus } = req.query;
    let sql = 'SELECT i.*,w.product_name,w.batch_no FROM wms_issuance i LEFT JOIN mes_work_order w ON i.wo_id=w.id WHERE i.deleted=0';
    const params = [];
    if (woCode)      { sql += ' AND i.wo_code LIKE ?'; params.push(`%${woCode}%`); }
    if (issueStatus) { sql += ' AND i.issue_status=?'; params.push(issueStatus); }
    const cntBase = `SELECT COUNT(*) as cnt FROM wms_issuance i WHERE i.deleted=0${woCode ? ' AND i.wo_code LIKE ?' : ''}${issueStatus ? ' AND i.issue_status=?' : ''}`;
    const [cntRows] = await db.execute(cntBase, params);
    sql += ` ORDER BY i.create_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});

// /wms/inventory-summary
router.get('/wms/inventory-summary', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT l.material_id, l.material_code, l.material_name, l.unit_name,
        SUM(l.qty_total) as total_qty, SUM(l.qty_available) as available_qty,
        SUM(l.qty_reserved) as reserved_qty, COUNT(*) as lot_count,
        SUM(l.qty_total) as totalQty, SUM(l.qty_available) as availableQty,
        SUM(l.qty_reserved) as reservedQty, COUNT(*) as lotCount
      FROM wms_material_lot l
      WHERE l.deleted=0 AND l.lot_status IN (1,2)
      GROUP BY l.material_id,l.material_code,l.material_name,l.unit_name
      ORDER BY l.material_code`);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});

// /wms/inventory-logs
router.get('/wms/inventory-logs', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, materialCode, transType } = req.query;
    let sql = 'SELECT * FROM wms_inventory_log WHERE 1=1';
    const params = [];
    if (materialCode) { sql += ' AND material_code LIKE ?'; params.push(`%${materialCode}%`); }
    if (transType)    { sql += ' AND trans_type=?';         params.push(transType); }
    const [cntRows] = await db.execute(sql.replace('SELECT *', 'SELECT COUNT(*) as cnt'), params);
    sql += ` ORDER BY create_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});

module.exports = router;
