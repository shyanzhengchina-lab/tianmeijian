/**
 * M03 质量管理 + M04 电子批记录(EBR)路由
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { ok, fail, page } = require('../middleware/response');
const { authMiddleware } = require('../middleware/auth');
const dayjs = require('dayjs');

const genCode = (prefix) => `${prefix}${dayjs().format('YYYYMMDDHHmm')}${String(Math.floor(Math.random()*900)+100)}`;

// ===== M03 检验项目 =====
router.get('/quality/inspection-items', authMiddleware, async (req, res) => {
  try {
    const { itemName, itemType } = req.query;
    let sql = 'SELECT * FROM qms_inspection_item WHERE deleted=0';
    const params = [];
    if (itemName) { sql += ' AND item_name LIKE ?'; params.push(`%${itemName}%`); }
    if (itemType) { sql += ' AND item_type=?'; params.push(itemType); }
    sql += ' ORDER BY id';
    const [rows] = await db.execute(sql, params);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/quality/inspection-items', authMiddleware, async (req, res) => {
  try {
    const { itemCode, itemName, itemType, unitName, specMin, specMax, specText, testMethod } = req.body;
    const [r] = await db.execute(
      'INSERT INTO qms_inspection_item (item_code,item_name,item_type,unit_name,spec_min,spec_max,spec_text,test_method) VALUES (?,?,?,?,?,?,?,?)',
      [itemCode, itemName, itemType || '', unitName || '', specMin ?? null, specMax ?? null, specText || '', testMethod || '']
    );
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message.includes('Duplicate') ? '编码已存在' : e.message, 400); }
});
router.delete('/quality/inspection-items/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('UPDATE qms_inspection_item SET deleted=1 WHERE id=?', [req.params.id]);
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// ===== M03 质检方案 =====
router.get('/quality/qc-schemes', authMiddleware, async (req, res) => {
  try {
    const { checkType, materialCode } = req.query;
    let sql = 'SELECT * FROM qms_qc_scheme WHERE deleted=0';
    const params = [];
    if (checkType) { sql += ' AND check_type=?'; params.push(checkType); }
    if (materialCode) { sql += ' AND material_code=?'; params.push(materialCode); }
    const [rows] = await db.execute(sql, params);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/quality/qc-schemes/:id', authMiddleware, async (req, res) => {
  try {
    const [scheme] = await db.execute('SELECT * FROM qms_qc_scheme WHERE id=?', [req.params.id]);
    if (!scheme.length) return fail(res, '不存在');
    const [details] = await db.execute('SELECT * FROM qms_qc_scheme_detail WHERE scheme_id=? ORDER BY sort_no', [req.params.id]);
    ok(res, { ...scheme[0], details });
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/quality/qc-schemes', authMiddleware, async (req, res) => {
  try {
    const { schemeCode, schemeName, materialId, materialCode, checkType, details = [] } = req.body;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [r] = await conn.execute(
        'INSERT INTO qms_qc_scheme (scheme_code,scheme_name,material_id,material_code,check_type) VALUES (?,?,?,?,?)',
        [schemeCode, schemeName, materialId || null, materialCode || '', checkType]
      );
      const schemeId = r.insertId;
      for (let i = 0; i < details.length; i++) {
        const d = details[i];
        await conn.execute(
          'INSERT INTO qms_qc_scheme_detail (scheme_id,item_id,item_code,item_name,spec_min,spec_max,spec_text,is_required,sort_no) VALUES (?,?,?,?,?,?,?,?,?)',
          [schemeId, d.itemId, d.itemCode || '', d.itemName || '', d.specMin ?? null, d.specMax ?? null, d.specText || '', d.isRequired ?? 1, i + 1]
        );
      }
      await conn.commit();
      ok(res, { id: schemeId });
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  } catch (e) { fail(res, e.message, 400); }
});

// ===== M03 检验任务单 =====
router.get('/quality/inspections', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, ioType, ioStatus, woCode, batchNo } = req.query;
    let sql = 'SELECT * FROM qms_inspection_order WHERE deleted=0';
    const params = [];
    if (ioType) { sql += ' AND io_type=?'; params.push(ioType); }
    if (ioStatus) { sql += ' AND io_status=?'; params.push(ioStatus); }
    if (woCode) { sql += ' AND wo_code LIKE ?'; params.push(`%${woCode}%`); }
    if (batchNo) { sql += ' AND batch_no LIKE ?'; params.push(`%${batchNo}%`); }
    const [cntRows] = await db.execute(sql.replace('SELECT *', 'SELECT COUNT(*) as cnt'), params);
    sql += ` ORDER BY create_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/quality/inspections/:id', authMiddleware, async (req, res) => {
  try {
    const [io] = await db.execute('SELECT * FROM qms_inspection_order WHERE id=?', [req.params.id]);
    if (!io.length) return fail(res, '不存在');
    const [results] = await db.execute('SELECT * FROM qms_inspection_result WHERE io_id=?', [req.params.id]);
    ok(res, { ...io[0], results });
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/quality/inspections', authMiddleware, async (req, res) => {
  try {
    const { ioType, woId, woCode, batchNo, materialId, materialCode, materialName, lotId, schemeId, sampleQty, inspectorId, inspectorName } = req.body;
    const ioCode = genCode('IO');
    const [r] = await db.execute(
      'INSERT INTO qms_inspection_order (io_code,io_type,wo_id,wo_code,batch_no,material_id,material_code,material_name,lot_id,scheme_id,sample_qty,inspector_id,inspector_name) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [ioCode, ioType, woId || null, woCode || '', batchNo || '', materialId || null, materialCode || '', materialName || '', lotId || null, schemeId || null, sampleQty || 0, inspectorId || null, inspectorName || '']
    );
    ok(res, { id: r.insertId, ioCode });
  } catch (e) { fail(res, e.message, 400); }
});

// 提交检验结果
router.post('/quality/inspections/:id/results', authMiddleware, async (req, res) => {
  try {
    const { results = [], reviewerId, reviewerName, overallResult } = req.body;
    const ioId = req.params.id;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      // 删除旧结果
      await conn.execute('DELETE FROM qms_inspection_result WHERE io_id=?', [ioId]);
      for (const r of results) {
        await conn.execute(
          'INSERT INTO qms_inspection_result (io_id,item_id,item_code,item_name,actual_value,spec_min,spec_max,spec_text,is_pass,remark) VALUES (?,?,?,?,?,?,?,?,?,?)',
          [ioId, r.itemId, r.itemCode || '', r.itemName || '', r.actualValue || '', r.specMin ?? null, r.specMax ?? null, r.specText || '', r.isPass ?? null, r.remark || '']
        );
      }
      const allPass = results.length > 0 && results.every(r => r.isPass === 1);
      const finalResult = overallResult || (allPass ? 'PASS' : 'FAIL');
      await conn.execute(
        'UPDATE qms_inspection_order SET io_status=3,overall_result=?,reviewer_id=?,reviewer_name=?,inspect_time=NOW(),update_time=NOW() WHERE id=?',
        [finalResult, reviewerId || null, reviewerName || '', ioId]
      );
      await conn.commit();
      ok(res, { overallResult: finalResult });
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  } catch (e) { fail(res, e.message, 500); }
});

// 不合格品记录
router.get('/quality/nonconformances', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, status } = req.query;
    let sql = 'SELECT * FROM qms_nonconformance WHERE deleted=0';
    const params = [];
    if (status) { sql += ' AND status=?'; params.push(status); }
    const [cntRows] = await db.execute(sql.replace('SELECT *', 'SELECT COUNT(*) as cnt'), params);
    sql += ` ORDER BY create_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/quality/nonconformances', authMiddleware, async (req, res) => {
  try {
    const { woId, ioId, batchNo, materialCode, materialName, ncQty, ncReason, deviationId } = req.body;
    const ncCode = genCode('NC');
    const [r] = await db.execute(
      'INSERT INTO qms_nonconformance (nc_code,wo_id,io_id,batch_no,material_code,material_name,nc_qty,nc_reason,deviation_id) VALUES (?,?,?,?,?,?,?,?,?)',
      [ncCode, woId || null, ioId || null, batchNo || '', materialCode || '', materialName || '', ncQty || 0, ncReason || '', deviationId || null]
    );
    ok(res, { id: r.insertId, ncCode });
  } catch (e) { fail(res, e.message, 400); }
});
router.put('/quality/nonconformances/:id/dispose', authMiddleware, async (req, res) => {
  try {
    const { disposition } = req.body;
    await db.execute('UPDATE qms_nonconformance SET disposition=?,status="CLOSED",update_time=NOW() WHERE id=?', [disposition, req.params.id]);
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// ===== M04 电子批记录 =====
router.get('/ebr/batch-records', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, batchNo, productCode, ebrStatus } = req.query;
    let sql = 'SELECT * FROM ebr_batch_record WHERE deleted=0';
    const params = [];
    if (batchNo) { sql += ' AND batch_no LIKE ?'; params.push(`%${batchNo}%`); }
    if (productCode) { sql += ' AND product_code LIKE ?'; params.push(`%${productCode}%`); }
    if (ebrStatus) { sql += ' AND ebr_status=?'; params.push(ebrStatus); }
    const [cntRows] = await db.execute(sql.replace('SELECT *', 'SELECT COUNT(*) as cnt'), params);
    sql += ` ORDER BY create_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});
router.get('/ebr/batch-records/:id', authMiddleware, async (req, res) => {
  try {
    const [ebr] = await db.execute('SELECT * FROM ebr_batch_record WHERE id=?', [req.params.id]);
    if (!ebr.length) return fail(res, '不存在');
    const [steps] = await db.execute('SELECT * FROM ebr_step_record WHERE ebr_id=? ORDER BY step_no', [req.params.id]);
    const [balances] = await db.execute('SELECT * FROM ebr_material_balance WHERE ebr_id=?', [req.params.id]);
    const [equipUsage] = await db.execute('SELECT * FROM ebr_equipment_usage WHERE ebr_id=?', [req.params.id]);
    ok(res, { ...ebr[0], steps, balances, equipUsage });
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/ebr/batch-records', authMiddleware, async (req, res) => {
  try {
    const { woId, woCode, batchNo, productCode, productName, factoryCode, planQty } = req.body;
    const ebrCode = genCode('EBR');
    const [r] = await db.execute(
      'INSERT INTO ebr_batch_record (ebr_code,wo_id,wo_code,batch_no,product_code,product_name,factory_code,plan_qty) VALUES (?,?,?,?,?,?,?,?)',
      [ebrCode, woId, woCode || '', batchNo, productCode || '', productName || '', factoryCode || '', planQty || 0]
    );
    ok(res, { id: r.insertId, ebrCode });
  } catch (e) { fail(res, e.message, 400); }
});

// 电子签名
router.put('/ebr/batch-records/:id/sign', authMiddleware, async (req, res) => {
  try {
    const { signType, signerName } = req.body; // signType: operator/reviewer/qa
    let sql = '';
    if (signType === 'operator') {
      sql = 'UPDATE ebr_batch_record SET operator_sign=?,operator_sign_time=NOW(),ebr_status="REVIEWING" WHERE id=?';
    } else if (signType === 'reviewer') {
      sql = 'UPDATE ebr_batch_record SET reviewer_sign=?,reviewer_sign_time=NOW() WHERE id=?';
    } else if (signType === 'qa') {
      sql = 'UPDATE ebr_batch_record SET qa_sign=?,qa_sign_time=NOW(),ebr_status="SIGNED" WHERE id=?';
    } else {
      return fail(res, '签名类型错误');
    }
    await db.execute(sql, [signerName || req.user?.realName, req.params.id]);
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// 归档批记录
router.put('/ebr/batch-records/:id/archive', authMiddleware, async (req, res) => {
  try {
    await db.execute('UPDATE ebr_batch_record SET ebr_status="ARCHIVED",archive_time=NOW() WHERE id=?', [req.params.id]);
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// 物料平衡记录
router.post('/ebr/material-balances', authMiddleware, async (req, res) => {
  try {
    const { ebrId, batchNo, balances = [] } = req.body;
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute('DELETE FROM ebr_material_balance WHERE ebr_id=?', [ebrId]);
      let totalRate = 0;
      for (const b of balances) {
        const rate = b.theoreticalQty > 0 ? ((b.actualOutput / b.theoreticalQty) * 100) : null;
        const isPass = rate !== null ? (rate >= 96 && rate <= 102 ? 1 : 0) : null;
        totalRate += rate || 0;
        await conn.execute(
          'INSERT INTO ebr_material_balance (ebr_id,batch_no,material_id,material_code,material_name,theoretical_qty,actual_input,actual_output,waste_qty,balance_rate,is_pass,remark) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
          [ebrId, batchNo || '', b.materialId, b.materialCode || '', b.materialName || '', b.theoreticalQty, b.actualInput || 0, b.actualOutput || 0, b.wasteQty || 0, rate, isPass, b.remark || '']
        );
      }
      const avgRate = balances.length > 0 ? (totalRate / balances.length) : null;
      if (avgRate !== null) {
        await conn.execute('UPDATE ebr_batch_record SET material_balance_rate=? WHERE id=?', [avgRate.toFixed(4), ebrId]);
      }
      await conn.commit();
      ok(res, { avgRate });
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  } catch (e) { fail(res, e.message, 500); }
});

// =====================================================================
// compat 兼容路由层 — 前端旧路径 → 真实业务表
// =====================================================================

// ── /inspection-items/* ──────────────────────────────────────────────
// 前端 src/api/inspectionItems.ts 调用 /inspection-items/list
// 映射：item_code→code, item_name→name, item_type→category,
//        spec_text→standard, spec_min→specMin, spec_max→specMax,
//        unit_name→unit, test_method→method
const mapInspectionItem = (row) => ({
  id:          row.id,
  code:        row.item_code,
  itemCode:    row.item_code,
  name:        row.item_name,
  itemName:    row.item_name,
  category:    row.item_type ?? '',
  itemType:    row.item_type ?? '',
  standard:    row.spec_text ?? '',
  specText:    row.spec_text ?? '',
  specMin:     row.spec_min ?? null,
  specMax:     row.spec_max ?? null,
  minValue:    row.spec_min ?? null,
  maxValue:    row.spec_max ?? null,
  unit:        row.unit_name ?? '',
  unitName:    row.unit_name ?? '',
  method:      row.test_method ?? '',
  testMethod:  row.test_method ?? '',
  isKeyItem:   0,
  status:      row.status ?? 1,
  createTime:  row.create_time,
  updateTime:  row.update_time ?? row.create_time,
});

router.get('/inspection-items/list', authMiddleware, async (req, res) => {
  try {
    const { category, status, itemName } = req.query;
    let sql = 'SELECT * FROM qms_inspection_item WHERE deleted=0';
    const params = [];
    if (category)  { sql += ' AND item_type=?';           params.push(category); }
    if (itemName)  { sql += ' AND item_name LIKE ?';      params.push(`%${itemName}%`); }
    if (status !== undefined) { sql += ' AND status=?';   params.push(status); }
    sql += ' ORDER BY id';
    const [rows] = await db.execute(sql, params);
    ok(res, rows.map(mapInspectionItem));
  } catch (e) { fail(res, e.message, 500); }
});

router.get('/inspection-items/page', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, code, category, itemName, status } = req.query;
    let sql = 'SELECT * FROM qms_inspection_item WHERE deleted=0';
    const params = [];
    if (code)      { sql += ' AND item_code LIKE ?';      params.push(`%${code}%`); }
    if (category)  { sql += ' AND item_type=?';           params.push(category); }
    if (itemName)  { sql += ' AND item_name LIKE ?';      params.push(`%${itemName}%`); }
    if (status !== undefined) { sql += ' AND status=?';   params.push(status); }
    const cntSql = sql.replace('SELECT *', 'SELECT COUNT(*) as cnt');
    const [cntRows] = await db.execute(cntSql, params);
    sql += ` ORDER BY id LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows.map(mapInspectionItem), cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});

router.get('/inspection-items/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM qms_inspection_item WHERE id=? AND deleted=0', [req.params.id]);
    if (!rows.length) return fail(res, '质检项目不存在');
    ok(res, mapInspectionItem(rows[0]));
  } catch (e) { fail(res, e.message, 500); }
});

router.post('/inspection-items', authMiddleware, async (req, res) => {
  try {
    const { code, itemCode, name, itemName, category, itemType, standard, specText,
            unit, unitName, minValue, specMin, maxValue, specMax, method, testMethod, status } = req.body;
    const [r] = await db.execute(
      'INSERT INTO qms_inspection_item (item_code,item_name,item_type,unit_name,spec_min,spec_max,spec_text,test_method,status) VALUES (?,?,?,?,?,?,?,?,?)',
      [
        code ?? itemCode,
        name ?? itemName,
        category ?? itemType ?? '',
        unit ?? unitName ?? '',
        minValue ?? specMin ?? null,
        maxValue ?? specMax ?? null,
        standard ?? specText ?? '',
        method ?? testMethod ?? '',
        status ?? 1,
      ]
    );
    const [rows] = await db.execute('SELECT * FROM qms_inspection_item WHERE id=?', [r.insertId]);
    ok(res, mapInspectionItem(rows[0]));
  } catch (e) { fail(res, e.message.includes('Duplicate') ? '编码已存在' : e.message, 400); }
});

router.put('/inspection-items/:id', authMiddleware, async (req, res) => {
  try {
    const { code, itemCode, name, itemName, category, itemType, standard, specText,
            unit, unitName, minValue, specMin, maxValue, specMax, method, testMethod, status } = req.body;
    await db.execute(
      `UPDATE qms_inspection_item SET
        item_code=COALESCE(?,item_code), item_name=COALESCE(?,item_name),
        item_type=COALESCE(?,item_type), unit_name=COALESCE(?,unit_name),
        spec_min=COALESCE(?,spec_min), spec_max=COALESCE(?,spec_max),
        spec_text=COALESCE(?,spec_text), test_method=COALESCE(?,test_method),
        status=COALESCE(?,status)
       WHERE id=? AND deleted=0`,
      [
        code ?? itemCode ?? null,
        name ?? itemName ?? null,
        category ?? itemType ?? null,
        unit ?? unitName ?? null,
        minValue ?? specMin ?? null,
        maxValue ?? specMax ?? null,
        standard ?? specText ?? null,
        method ?? testMethod ?? null,
        status ?? null,
        req.params.id,
      ]
    );
    const [rows] = await db.execute('SELECT * FROM qms_inspection_item WHERE id=?', [req.params.id]);
    ok(res, rows.length ? mapInspectionItem(rows[0]) : {});
  } catch (e) { fail(res, e.message, 500); }
});

router.delete('/inspection-items/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('UPDATE qms_inspection_item SET deleted=1 WHERE id=?', [req.params.id]);
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// ── /inspection-tasks/* ──────────────────────────────────────────────
// 前端 src/api/inspectionTasks.ts 调用 /inspection-tasks/list
// io_type: 1=IQC,2=IPQC,3=FQC  io_status: 1=PENDING,2=ASSIGNED,3=DOING,4=COMPLETED
const IO_TYPE_MAP  = { 1:'IQC', 2:'IPQC', 3:'FQC', IQC:'IQC', IPQC:'IPQC', FQC:'FQC' };
const IO_STATUS_MAP = { 1:'PENDING', 2:'ASSIGNED', 3:'DOING', 4:'COMPLETED' };

const mapInspectionTask = (row) => ({
  id:             row.id,
  taskNo:         row.io_code,
  ioCode:         row.io_code,
  taskType:       IO_TYPE_MAP[row.io_type] ?? String(row.io_type ?? 'IQC'),
  schemeType:     IO_TYPE_MAP[row.io_type] ?? 'IQC',
  ioType:         row.io_type,
  sourceNo:       row.wo_code ?? '',
  woCode:         row.wo_code ?? '',
  batchNo:        row.batch_no ?? '',
  materialCode:   row.material_code ?? '',
  materialName:   row.material_name ?? '',
  sampleQuantity: row.sample_qty ?? 0,
  quantity:       row.sample_qty ?? 0,
  status:         IO_STATUS_MAP[row.io_status] ?? 'PENDING',
  ioStatus:       row.io_status,
  result:         row.overall_result ?? '',
  overallResult:  row.overall_result ?? '',
  inspectorId:    row.inspector_id,
  inspectorName:  row.inspector_name ?? '',
  reviewerName:   row.reviewer_name ?? '',
  completeTime:   row.inspect_time,
  remark:         row.remark ?? '',
  createTime:     row.create_time,
  updateTime:     row.update_time ?? row.create_time,
});

router.get('/inspection-tasks/list', authMiddleware, async (req, res) => {
  try {
    const { ioType, ioStatus, woCode, batchNo } = req.query;
    let sql = 'SELECT * FROM qms_inspection_order WHERE deleted=0';
    const params = [];
    if (ioType)   { sql += ' AND io_type=?';          params.push(ioType); }
    if (ioStatus) { sql += ' AND io_status=?';        params.push(ioStatus); }
    if (woCode)   { sql += ' AND wo_code LIKE ?';     params.push(`%${woCode}%`); }
    if (batchNo)  { sql += ' AND batch_no LIKE ?';    params.push(`%${batchNo}%`); }
    sql += ' ORDER BY create_time DESC';
    const [rows] = await db.execute(sql, params);
    ok(res, rows.map(mapInspectionTask));
  } catch (e) { fail(res, e.message, 500); }
});

router.get('/inspection-tasks/page', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, ioType, ioStatus, woCode, batchNo } = req.query;
    let sql = 'SELECT * FROM qms_inspection_order WHERE deleted=0';
    const params = [];
    if (ioType)   { sql += ' AND io_type=?';          params.push(ioType); }
    if (ioStatus) { sql += ' AND io_status=?';        params.push(ioStatus); }
    if (woCode)   { sql += ' AND wo_code LIKE ?';     params.push(`%${woCode}%`); }
    if (batchNo)  { sql += ' AND batch_no LIKE ?';    params.push(`%${batchNo}%`); }
    const [cntRows] = await db.execute(sql.replace('SELECT *', 'SELECT COUNT(*) as cnt'), params);
    sql += ` ORDER BY create_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows.map(mapInspectionTask), cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});

router.get('/inspection-tasks/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM qms_inspection_order WHERE id=? AND deleted=0', [req.params.id]);
    if (!rows.length) return fail(res, '检验任务不存在');
    ok(res, mapInspectionTask(rows[0]));
  } catch (e) { fail(res, e.message, 500); }
});

router.put('/inspection-tasks/:id', authMiddleware, async (req, res) => {
  try {
    const { inspectorId, inspectorName, status, ioStatus } = req.body;
    const newStatus = ioStatus ?? (status === 'ASSIGNED' ? 2 : status === 'DOING' ? 3 : status === 'COMPLETED' ? 4 : null);
    await db.execute(
      `UPDATE qms_inspection_order SET
         inspector_id=COALESCE(?,inspector_id),
         inspector_name=COALESCE(?,inspector_name),
         io_status=COALESCE(?,io_status),
         update_time=NOW()
       WHERE id=? AND deleted=0`,
      [inspectorId ?? null, inspectorName ?? null, newStatus, req.params.id]
    );
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// ── /quality-releases/* ──────────────────────────────────────────────
// 没有独立放行表；从检验单中拉取 overall_result 有值的记录作为"放行"数据
const mapQualityRelease = (row) => ({
  id:           row.id,
  releaseNo:    `REL-${row.io_code}`,
  releaseType:  IO_TYPE_MAP[row.io_type] === 'FQC' ? 'FINISHED' :
                IO_TYPE_MAP[row.io_type] === 'IQC' ? 'MATERIAL' : 'SEMI_FINISHED',
  taskId:       row.id,
  batchNo:      row.batch_no ?? '',
  materialCode: row.material_code ?? '',
  materialName: row.material_name ?? '',
  conclusion:   row.overall_result === 'PASS' ? 'RELEASED' :
                row.overall_result === 'FAIL' ? 'REJECTED' : 'HOLD',
  status:       row.overall_result === 'PASS' ? 'RELEASED' :
                row.overall_result === 'FAIL' ? 'REJECTED' : 'HOLD',
  approverName: row.reviewer_name ?? '',
  qaName:       row.reviewer_name ?? '',
  approveTime:  row.inspect_time ?? '',
  releaseTime:  row.inspect_time ?? '',
  remark:       row.remark ?? '',
  createTime:   row.create_time,
});

router.get('/quality-releases/list', authMiddleware, async (req, res) => {
  try {
    const { releaseType, conclusion } = req.query;
    let sql = 'SELECT * FROM qms_inspection_order WHERE deleted=0 AND io_status >= 3';
    const params = [];
    if (releaseType === 'FINISHED')     { sql += ' AND io_type=3'; }
    else if (releaseType === 'MATERIAL') { sql += ' AND io_type=1'; }
    else if (releaseType === 'SEMI_FINISHED') { sql += ' AND io_type=2'; }
    if (conclusion === 'RELEASED')      { sql += " AND overall_result='PASS'"; }
    else if (conclusion === 'REJECTED') { sql += " AND overall_result='FAIL'"; }
    else if (conclusion === 'HOLD')     { sql += ' AND overall_result IS NULL'; }
    sql += ' ORDER BY create_time DESC';
    const [rows] = await db.execute(sql, params);
    ok(res, rows.map(mapQualityRelease));
  } catch (e) { fail(res, e.message, 500); }
});

router.get('/quality-releases/page', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, releaseType, conclusion } = req.query;
    let sql = 'SELECT * FROM qms_inspection_order WHERE deleted=0 AND io_status >= 3';
    const params = [];
    if (releaseType === 'FINISHED')      { sql += ' AND io_type=3'; }
    else if (releaseType === 'MATERIAL') { sql += ' AND io_type=1'; }
    else if (releaseType === 'SEMI_FINISHED') { sql += ' AND io_type=2'; }
    if (conclusion === 'RELEASED')       { sql += " AND overall_result='PASS'"; }
    else if (conclusion === 'REJECTED')  { sql += " AND overall_result='FAIL'"; }
    else if (conclusion === 'HOLD')      { sql += ' AND overall_result IS NULL'; }
    const [cntRows] = await db.execute(sql.replace('SELECT *', 'SELECT COUNT(*) as cnt'), params);
    sql += ` ORDER BY create_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows.map(mapQualityRelease), cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});

// ── /qc-schemes/* 前端路径兼容 ──────────────────────────────────────────
// 前端调用 /qc-schemes/list|page|:id|POST|PUT|DELETE
// 后端实际数据在 qms_qc_scheme + qms_qc_scheme_detail
// check_type TINYINT 映射: 1=IQC 2=IPQC 4=IPQC_PATROL 3=FQC 5=清洁
const CHECK_TYPE_TO_SCHEME = {
  1: 'IQC',
  2: 'IPQC',
  3: 'FQC',
  4: 'IPQC_PATROL',
  5: 'OQC',
};
const SCHEME_TYPE_TO_CHECK = {
  'IQC': 1,
  'IPQC': 2, 'IPQC_FIRST': 2, 'IPQC_PATROL': 4, 'IPQC_SELF': 2, 'IPQC_LAST': 2,
  'FQC': 3, 'OQC': 5,
};

function mapQcScheme(row) {
  const checkType = Number(row.check_type ?? row.checkType ?? 1);
  return {
    id:            row.id,
    schemeCode:    row.scheme_code ?? row.schemeCode ?? '',
    schemeName:    row.scheme_name ?? row.schemeName ?? '',
    materialCode:  row.material_code ?? row.materialCode ?? '',
    materialId:    row.material_id ?? row.materialId ?? null,
    checkType:     checkType,
    schemeType:    CHECK_TYPE_TO_SCHEME[checkType] ?? 'IQC',
    samplingType:  'AQL',
    aqlLevel:      '1.0',
    version:       'V1.0',
    effectiveDate: '',
    description:   '',
    status:        row.status ?? 1,
    createTime:    row.create_time ?? row.createTime ?? null,
    updateTime:    row.update_time ?? row.updateTime ?? null,
  };
}

// GET /qc-schemes/list
router.get('/qc-schemes/list', authMiddleware, async (req, res) => {
  try {
    const { status, schemeType } = req.query;
    let sql = 'SELECT * FROM qms_qc_scheme WHERE deleted=0';
    const params = [];
    if (status !== undefined && status !== '') { sql += ' AND status=?'; params.push(status); }
    if (schemeType) {
      const ct = SCHEME_TYPE_TO_CHECK[schemeType];
      if (ct) { sql += ' AND check_type=?'; params.push(ct); }
    }
    sql += ' ORDER BY check_type, id';
    const [rows] = await db.execute(sql, params);
    ok(res, rows.map(mapQcScheme));
  } catch (e) { fail(res, e.message, 500); }
});

// GET /qc-schemes/page
router.get('/qc-schemes/page', authMiddleware, async (req, res) => {
  try {
    const { current = 1, pageSize = 15, status, schemeType } = req.query;
    let sql = 'SELECT * FROM qms_qc_scheme WHERE deleted=0';
    const params = [];
    if (status !== undefined && status !== '') { sql += ' AND status=?'; params.push(status); }
    if (schemeType) {
      const ct = SCHEME_TYPE_TO_CHECK[schemeType];
      if (ct) { sql += ' AND check_type=?'; params.push(ct); }
    }
    const [cntRows] = await db.execute(sql.replace('SELECT *', 'SELECT COUNT(*) as cnt'), params);
    sql += ` ORDER BY check_type, id LIMIT ${+pageSize} OFFSET ${(+current - 1) * +pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows.map(mapQcScheme), cntRows[0].cnt, +current, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});

// GET /qc-schemes/:id  (include details)
router.get('/qc-schemes/:id', authMiddleware, async (req, res) => {
  try {
    const [schemes] = await db.execute('SELECT * FROM qms_qc_scheme WHERE id=? AND deleted=0', [req.params.id]);
    if (!schemes.length) return fail(res, '方案不存在', 404);
    const scheme = mapQcScheme(schemes[0]);
    const [details] = await db.execute(
      'SELECT * FROM qms_qc_scheme_detail WHERE scheme_id=? ORDER BY sort_no',
      [req.params.id]
    );
    scheme.items = details.map(d => ({
      id:         d.id,
      itemId:     d.item_id,
      itemCode:   d.item_code ?? '',
      itemName:   d.item_name ?? '',
      specMin:    d.spec_min ?? null,
      specMax:    d.spec_max ?? null,
      specText:   d.spec_text ?? '',
      isRequired: d.is_required ?? 1,
      sortNo:     d.sort_no ?? 0,
    }));
    ok(res, scheme);
  } catch (e) { fail(res, e.message, 500); }
});

// POST /qc-schemes  (create)
router.post('/qc-schemes', authMiddleware, async (req, res) => {
  try {
    const { schemeCode, schemeName, materialCode, materialId, schemeType, checkType, status } = req.body;
    const ct = checkType ?? SCHEME_TYPE_TO_CHECK[schemeType] ?? 1;
    const [result] = await db.execute(
      'INSERT INTO qms_qc_scheme (scheme_code, scheme_name, material_code, material_id, check_type, status) VALUES (?,?,?,?,?,?)',
      [schemeCode, schemeName, materialCode ?? '', materialId ?? null, ct, status ?? 1]
    );
    ok(res, { id: result.insertId, schemeCode, schemeName, schemeType: CHECK_TYPE_TO_SCHEME[ct] ?? 'IQC' });
  } catch (e) { fail(res, e.message, 500); }
});

// PUT /qc-schemes/:id  (update)
router.put('/qc-schemes/:id', authMiddleware, async (req, res) => {
  try {
    const { schemeName, materialCode, schemeType, checkType, status } = req.body;
    const ct = checkType ?? SCHEME_TYPE_TO_CHECK[schemeType] ?? 1;
    await db.execute(
      'UPDATE qms_qc_scheme SET scheme_name=?, material_code=?, check_type=?, status=? WHERE id=?',
      [schemeName, materialCode ?? '', ct, status ?? 1, req.params.id]
    );
    ok(res, null);
  } catch (e) { fail(res, e.message, 500); }
});

// DELETE /qc-schemes/:id
router.delete('/qc-schemes/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('UPDATE qms_qc_scheme SET deleted=1 WHERE id=?', [req.params.id]);
    ok(res, null);
  } catch (e) { fail(res, e.message, 500); }
});

// DELETE /qc-schemes/batch
router.delete('/qc-schemes/batch', authMiddleware, async (req, res) => {
  try {
    const ids = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return ok(res, null);
    const ph = ids.map(() => '?').join(',');
    await db.execute(`UPDATE qms_qc_scheme SET deleted=1 WHERE id IN (${ph})`, ids);
    ok(res, null);
  } catch (e) { fail(res, e.message, 500); }
});

// ── /qms/* 前端旧路径兼容 ────────────────────────────────────────────
// /qms/inspection-orders → /quality/inspections 逻辑
router.get('/qms/inspection-orders', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, ioType, ioStatus, woCode, batchNo } = req.query;
    let sql = 'SELECT * FROM qms_inspection_order WHERE deleted=0';
    const params = [];
    if (ioType)   { sql += ' AND io_type=?';      params.push(ioType); }
    if (ioStatus) { sql += ' AND io_status=?';    params.push(ioStatus); }
    if (woCode)   { sql += ' AND wo_code LIKE ?'; params.push(`%${woCode}%`); }
    if (batchNo)  { sql += ' AND batch_no LIKE ?';params.push(`%${batchNo}%`); }
    const [cntRows] = await db.execute(sql.replace('SELECT *', 'SELECT COUNT(*) as cnt'), params);
    sql += ` ORDER BY create_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows.map(mapInspectionTask), cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});

module.exports = router;
