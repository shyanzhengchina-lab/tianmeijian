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

module.exports = router;
