/**
 * M06 设备管理路由
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { ok, fail, page } = require('../middleware/response');
const { authMiddleware } = require('../middleware/auth');
const dayjs = require('dayjs');

const genCode = (prefix) => `${prefix}${dayjs().format('YYYYMMDDHHmm')}${String(Math.floor(Math.random()*900)+100)}`;

// ===== 设备档案 =====
router.get('/equipment/list', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, eqCode, eqName, factoryCode, eqStatus, eqType } = req.query;
    let sql = 'SELECT e.*,w.workshop_name FROM eqp_equipment e LEFT JOIN base_workshop w ON e.workshop_id=w.id WHERE e.deleted=0';
    const params = [];
    if (eqCode) { sql += ' AND e.eq_code LIKE ?'; params.push(`%${eqCode}%`); }
    if (eqName) { sql += ' AND e.eq_name LIKE ?'; params.push(`%${eqName}%`); }
    if (factoryCode) { sql += ' AND e.factory_code=?'; params.push(factoryCode); }
    if (eqStatus) { sql += ' AND e.eq_status=?'; params.push(eqStatus); }
    if (eqType) { sql += ' AND e.eq_type=?'; params.push(eqType); }
    const baseSql = `SELECT COUNT(*) as cnt FROM eqp_equipment e WHERE e.deleted=0${eqCode ? ' AND e.eq_code LIKE ?' : ''}${eqName ? ' AND e.eq_name LIKE ?' : ''}${factoryCode ? ' AND e.factory_code=?' : ''}${eqStatus ? ' AND e.eq_status=?' : ''}${eqType ? ' AND e.eq_type=?' : ''}`;
    const [cntRows] = await db.execute(baseSql, params);
    sql += ` ORDER BY e.eq_code LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});

router.get('/equipment/:id', authMiddleware, async (req, res) => {
  try {
    const [eq] = await db.execute('SELECT e.*,w.workshop_name FROM eqp_equipment e LEFT JOIN base_workshop w ON e.workshop_id=w.id WHERE e.id=?', [req.params.id]);
    if (!eq.length) return fail(res, '不存在');
    // 获取最近OEE数据
    const [oeeData] = await db.execute('SELECT * FROM eqp_oee_data WHERE equipment_id=? ORDER BY stat_date DESC LIMIT 7', [req.params.id]);
    // 获取维护计划
    const [maintPlans] = await db.execute('SELECT * FROM eqp_maint_plan WHERE equipment_id=? AND maint_status="PENDING" ORDER BY plan_date LIMIT 5', [req.params.id]);
    ok(res, { ...eq[0], oeeData, maintPlans });
  } catch (e) { fail(res, e.message, 500); }
});

router.post('/equipment', authMiddleware, async (req, res) => {
  try {
    const { eqCode, eqName, eqModel, eqType, factoryCode, workshopId, wcId, manufacturer, purchaseDate, installDate, ratedSpeed, plcIp, plcProtocol, oeeTarget } = req.body;
    const [r] = await db.execute(
      `INSERT INTO eqp_equipment (eq_code,eq_name,eq_model,eq_type,factory_code,workshop_id,wc_id,manufacturer,purchase_date,install_date,rated_speed,plc_ip,plc_protocol,oee_target) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [eqCode, eqName, eqModel || '', eqType || '', factoryCode || '', workshopId || null, wcId || null, manufacturer || '', purchaseDate || null, installDate || null, ratedSpeed || 0, plcIp || '', plcProtocol || '', oeeTarget || 85]
    );
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message.includes('Duplicate') ? '设备编码已存在' : e.message, 400); }
});

router.put('/equipment/:id', authMiddleware, async (req, res) => {
  try {
    const { eqName, eqModel, eqType, eqStatus, workshopId, wcId, ratedSpeed, plcIp, plcProtocol, oeeTarget, lastMaintDate, nextMaintDate } = req.body;
    await db.execute(
      'UPDATE eqp_equipment SET eq_name=?,eq_model=?,eq_type=?,eq_status=?,workshop_id=?,wc_id=?,rated_speed=?,plc_ip=?,plc_protocol=?,oee_target=?,last_maint_date=?,next_maint_date=?,update_time=NOW() WHERE id=? AND deleted=0',
      [eqName, eqModel || '', eqType || '', eqStatus || 'STANDBY', workshopId || null, wcId || null, ratedSpeed || 0, plcIp || '', plcProtocol || '', oeeTarget || 85, lastMaintDate || null, nextMaintDate || null, req.params.id]
    );
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

router.delete('/equipment/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('UPDATE eqp_equipment SET deleted=1 WHERE id=?', [req.params.id]);
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// 设备状态变更
router.put('/equipment/:id/status', authMiddleware, async (req, res) => {
  try {
    const { eqStatus } = req.body;
    await db.execute('UPDATE eqp_equipment SET eq_status=?,update_time=NOW() WHERE id=?', [eqStatus, req.params.id]);
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// ===== OEE数据 =====
router.get('/equipment/:id/oee', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const [rows] = await db.execute(
      'SELECT * FROM eqp_oee_data WHERE equipment_id=? AND stat_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ORDER BY stat_date DESC',
      [req.params.id, days]
    );
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});

router.post('/equipment/:id/oee', authMiddleware, async (req, res) => {
  try {
    const { statDate, shift, availableTime, runTime, downtime, performance, qualityRate } = req.body;
    const availability = availableTime > 0 ? (runTime / availableTime) * 100 : 0;
    const oee = (availability / 100) * (performance / 100) * (qualityRate / 100) * 100;
    const [r] = await db.execute(
      'INSERT INTO eqp_oee_data (equipment_id,eq_code,stat_date,shift,available_time,run_time,downtime,availability,performance,quality_rate,oee) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [req.params.id, '', statDate, shift || '', availableTime, runTime, downtime || 0, availability.toFixed(4), performance, qualityRate, oee.toFixed(4)]
    );
    ok(res, { id: r.insertId, oee: oee.toFixed(2) });
  } catch (e) { fail(res, e.message, 400); }
});

// ===== 维护计划 =====
router.get('/equipment/maint-plans/list', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, maintStatus, maintType, factoryCode } = req.query;
    let sql = `SELECT mp.*,e.eq_name,e.factory_code FROM eqp_maint_plan mp LEFT JOIN eqp_equipment e ON mp.equipment_id=e.id WHERE mp.deleted=0`;
    const params = [];
    if (maintStatus) { sql += ' AND mp.maint_status=?'; params.push(maintStatus); }
    if (maintType) { sql += ' AND mp.maint_type=?'; params.push(maintType); }
    if (factoryCode) { sql += ' AND e.factory_code=?'; params.push(factoryCode); }
    const [cntRows] = await db.execute(sql.replace(/SELECT mp\.\*.*FROM/, 'SELECT COUNT(*) as cnt FROM'), params);
    sql += ` ORDER BY mp.plan_date ASC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});

router.post('/equipment/maint-plans', authMiddleware, async (req, res) => {
  try {
    const { equipmentId, eqCode, maintType, maintContent, planDate, maintainerId, maintainerName } = req.body;
    const planCode = genCode('MP');
    const [r] = await db.execute(
      'INSERT INTO eqp_maint_plan (plan_code,equipment_id,eq_code,maint_type,maint_content,plan_date,maintainer_id,maintainer_name) VALUES (?,?,?,?,?,?,?,?)',
      [planCode, equipmentId, eqCode || '', maintType || 'MONTHLY', maintContent || '', planDate, maintainerId || null, maintainerName || '']
    );
    ok(res, { id: r.insertId, planCode });
  } catch (e) { fail(res, e.message, 400); }
});

router.put('/equipment/maint-plans/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { remark } = req.body;
    await db.execute(
      'UPDATE eqp_maint_plan SET maint_status="DONE",actual_date=CURDATE(),remark=?,update_time=NOW() WHERE id=?',
      [remark || '', req.params.id]
    );
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// ===== 故障记录 =====
router.get('/equipment/faults/list', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, faultStatus, eqCode } = req.query;
    let sql = 'SELECT f.*,e.eq_name,e.factory_code FROM eqp_fault_record f LEFT JOIN eqp_equipment e ON f.equipment_id=e.id WHERE f.deleted=0';
    const params = [];
    if (faultStatus) { sql += ' AND f.fault_status=?'; params.push(faultStatus); }
    if (eqCode) { sql += ' AND f.eq_code LIKE ?'; params.push(`%${eqCode}%`); }
    const [cntRows] = await db.execute(sql.replace(/SELECT f\.\*.*FROM/, 'SELECT COUNT(*) as cnt FROM'), params);
    sql += ` ORDER BY f.fault_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});

router.post('/equipment/faults', authMiddleware, async (req, res) => {
  try {
    const { equipmentId, eqCode, faultType, faultDesc, faultTime, reporterId } = req.body;
    const faultCode = genCode('FLT');
    const [r] = await db.execute(
      'INSERT INTO eqp_fault_record (fault_code,equipment_id,eq_code,fault_type,fault_desc,fault_time,reporter_id) VALUES (?,?,?,?,?,?,?)',
      [faultCode, equipmentId, eqCode || '', faultType || '', faultDesc || '', faultTime || new Date(), reporterId || null]
    );
    // 更新设备状态为故障
    await db.execute('UPDATE eqp_equipment SET eq_status="FAULT",update_time=NOW() WHERE id=?', [equipmentId]);
    ok(res, { id: r.insertId, faultCode });
  } catch (e) { fail(res, e.message, 400); }
});

router.put('/equipment/faults/:id/close', authMiddleware, async (req, res) => {
  try {
    const { recoverTime, repairRecord, repairerId } = req.body;
    const [fault] = await db.execute('SELECT equipment_id,fault_time FROM eqp_fault_record WHERE id=?', [req.params.id]);
    if (fault.length) {
      const downtime = recoverTime
        ? Math.round((new Date(recoverTime) - new Date(fault[0].fault_time)) / 60000)
        : 0;
      await db.execute(
        'UPDATE eqp_fault_record SET fault_status="CLOSED",recover_time=?,downtime_min=?,repair_record=?,repairer_id=? WHERE id=?',
        [recoverTime || new Date(), downtime, repairRecord || '', repairerId || null, req.params.id]
      );
      await db.execute('UPDATE eqp_equipment SET eq_status="STANDBY",update_time=NOW() WHERE id=?', [fault[0].equipment_id]);
    }
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// ===== PLC数据 =====
router.get('/equipment/:id/plc-data', authMiddleware, async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const [rows] = await db.execute(
      'SELECT * FROM eqp_plc_data WHERE equipment_id=? AND data_time >= DATE_SUB(NOW(), INTERVAL ? HOUR) ORDER BY data_time DESC LIMIT 100',
      [req.params.id, hours]
    );
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});

// ===== 校验记录 =====
router.get('/equipment/:id/calibrations', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM eqp_calibration WHERE equipment_id=? AND deleted=0 ORDER BY cal_date DESC', [req.params.id]);
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/equipment/calibrations', authMiddleware, async (req, res) => {
  try {
    const { equipmentId, eqCode, calType, calDate, nextCalDate, calResult, calAgency, certNo, operatorName } = req.body;
    const calCode = genCode('CAL');
    const [r] = await db.execute(
      'INSERT INTO eqp_calibration (cal_code,equipment_id,eq_code,cal_type,cal_date,next_cal_date,cal_result,cal_agency,cert_no,operator_name) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [calCode, equipmentId, eqCode || '', calType || '', calDate, nextCalDate || null, calResult || 'PASS', calAgency || '', certNo || '', operatorName || '']
    );
    ok(res, { id: r.insertId, calCode });
  } catch (e) { fail(res, e.message, 400); }
});

module.exports = router;
