/**
 * M01 计划管理 + M02 生产执行路由
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { ok, fail, page } = require('../middleware/response');
const { authMiddleware } = require('../middleware/auth');
const dayjs = require('dayjs');

// 生成工单号
const genWoCode = () => `WO${dayjs().format('YYYYMMDD')}${String(Math.floor(Math.random() * 9000) + 1000)}`;
const genTaskCode = () => `TASK${dayjs().format('YYYYMMDDHHmm')}${String(Math.floor(Math.random() * 900) + 100)}`;

// ===== M01 生产工单 =====
router.get('/plan/work-orders', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, woCode, productName, batchNo, woStatus, factoryCode, priority, startDate, endDate } = req.query;
    let sql = 'SELECT * FROM mes_work_order WHERE deleted=0';
    const params = [];
    if (woCode) { sql += ' AND wo_code LIKE ?'; params.push(`%${woCode}%`); }
    if (productName) { sql += ' AND product_name LIKE ?'; params.push(`%${productName}%`); }
    if (batchNo) { sql += ' AND batch_no LIKE ?'; params.push(`%${batchNo}%`); }
    if (woStatus) { sql += ' AND wo_status=?'; params.push(woStatus); }
    if (factoryCode) { sql += ' AND factory_code=?'; params.push(factoryCode); }
    if (priority) { sql += ' AND priority=?'; params.push(priority); }
    if (startDate) { sql += ' AND plan_start >= ?'; params.push(startDate); }
    if (endDate) { sql += ' AND plan_start <= ?'; params.push(endDate + ' 23:59:59'); }
    
    let cntSql = sql.replace('SELECT *', 'SELECT COUNT(*) as cnt');
    const [cntRows] = await db.execute(cntSql, params);
    sql += ` ORDER BY priority ASC, plan_start ASC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});

router.get('/plan/work-orders/:id', authMiddleware, async (req, res) => {
  try {
    const [wo] = await db.execute('SELECT * FROM mes_work_order WHERE id=?', [req.params.id]);
    if (!wo.length) return fail(res, '工单不存在');
    const [tasks] = await db.execute('SELECT * FROM mes_task_order WHERE wo_id=? AND deleted=0 ORDER BY step_no', [req.params.id]);
    ok(res, { ...wo[0], tasks });
  } catch (e) { fail(res, e.message, 500); }
});

router.post('/plan/work-orders', authMiddleware, async (req, res) => {
  try {
    const { erpTaskId, factoryCode, workshopCode, productCode, productName, batchNo, bomId, bomVersion, routeId, routeCode, planQty, unitName, orderType = 'NORMAL', channelType, priority = 3, planStart, planEnd, remark } = req.body;
    if (!productCode || !batchNo || !planQty || !factoryCode) {
      return fail(res, '必填字段不完整：产品编码/批号/计划数量/工厂');
    }
    const woCode = genWoCode();
    const [r] = await db.execute(
      `INSERT INTO mes_work_order (wo_code,erp_task_id,factory_code,workshop_code,product_code,product_name,batch_no,bom_id,bom_version,route_id,route_code,plan_qty,unit_name,order_type,channel_type,priority,plan_start,plan_end,remark,create_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [woCode, erpTaskId || '', factoryCode, workshopCode || '', productCode, productName || '', batchNo, bomId || null, bomVersion || '', routeId || null, routeCode || '', planQty, unitName || '', orderType, channelType || '', priority, planStart || null, planEnd || null, remark || '', req.user?.username || '']
    );
    // 如果有路线，自动生成任务单
    if (routeId) {
      const [steps] = await db.execute('SELECT * FROM base_routing_step WHERE route_id=? AND deleted=0 ORDER BY step_no', [routeId]);
      for (const step of steps) {
        await db.execute(
          'INSERT INTO mes_task_order (task_code,wo_id,wo_code,step_id,step_no,op_id,op_code,op_name,plan_qty) VALUES (?,?,?,?,?,?,?,?,?)',
          [genTaskCode(), r.insertId, woCode, step.id, step.step_no, step.op_id, step.op_code || '', step.op_name || '', planQty]
        );
      }
    }
    ok(res, { id: r.insertId, woCode });
  } catch (e) { fail(res, e.message.includes('Duplicate') ? '批号已存在' : e.message, 400); }
});

router.put('/plan/work-orders/:id', authMiddleware, async (req, res) => {
  try {
    const { productName, planQty, priority, planStart, planEnd, remark, woStatus } = req.body;
    await db.execute(
      'UPDATE mes_work_order SET product_name=?,plan_qty=?,priority=?,plan_start=?,plan_end=?,remark=?,wo_status=COALESCE(?,wo_status),update_time=NOW(),update_by=? WHERE id=? AND deleted=0',
      [productName, planQty, priority || 3, planStart || null, planEnd || null, remark || '', woStatus || null, req.user?.username || '', req.params.id]
    );
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// 工单状态变更
router.put('/plan/work-orders/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const updates = { update_time: new Date(), wo_status: status };
    if (status === 2) updates.actual_start = new Date();
    if (status === 5 || status === 6) updates.actual_end = new Date();
    let sql = 'UPDATE mes_work_order SET wo_status=?, update_time=NOW()';
    const params = [status];
    if (status === 2) { sql += ', actual_start=NOW()'; }
    if (status === 5 || status === 6) { sql += ', actual_end=NOW()'; }
    sql += ' WHERE id=? AND deleted=0';
    params.push(req.params.id);
    await db.execute(sql, params);
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

router.delete('/plan/work-orders/:id', authMiddleware, async (req, res) => {
  try {
    const [wo] = await db.execute('SELECT wo_status FROM mes_work_order WHERE id=?', [req.params.id]);
    if (wo.length && wo[0].wo_status > 1) return fail(res, '进行中的工单不可删除');
    await db.execute('UPDATE mes_work_order SET deleted=1 WHERE id=?', [req.params.id]);
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// ===== M02 任务单 =====
router.get('/execution/task-orders', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, woId, woCode, taskStatus, teamId } = req.query;
    let sql = 'SELECT t.*,w.product_name,w.batch_no FROM mes_task_order t LEFT JOIN mes_work_order w ON t.wo_id=w.id WHERE t.deleted=0';
    const params = [];
    if (woId) { sql += ' AND t.wo_id=?'; params.push(woId); }
    if (woCode) { sql += ' AND t.wo_code LIKE ?'; params.push(`%${woCode}%`); }
    if (taskStatus) { sql += ' AND t.task_status=?'; params.push(taskStatus); }
    if (teamId) { sql += ' AND t.team_id=?'; params.push(teamId); }
    const cntSql = `SELECT COUNT(*) as cnt FROM mes_task_order t WHERE t.deleted=0${woId ? ' AND t.wo_id=?' : ''}${woCode ? ' AND t.wo_code LIKE ?' : ''}${taskStatus ? ' AND t.task_status=?' : ''}${teamId ? ' AND t.team_id=?' : ''}`;
    const [cntRows] = await db.execute(cntSql, params);
    sql += ` ORDER BY t.step_no ASC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});

router.put('/execution/task-orders/:id/assign', authMiddleware, async (req, res) => {
  try {
    const { teamId, operatorId, operatorName } = req.body;
    await db.execute(
      'UPDATE mes_task_order SET team_id=?,operator_id=?,operator_name=?,task_status=2,actual_start=NOW(),update_time=NOW() WHERE id=?',
      [teamId || null, operatorId || null, operatorName || '', req.params.id]
    );
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// 报工
router.post('/execution/report', authMiddleware, async (req, res) => {
  try {
    const { taskId, woId, woCode, opCode, opName, reportQty, scrapQty = 0, operatorId, operatorName, scanCode, remark } = req.body;
    if (!taskId || !reportQty) return fail(res, '任务单ID和报工数量不能为空');
    // 插入报工记录
    await db.execute(
      'INSERT INTO mes_report_record (task_id,wo_id,wo_code,op_code,op_name,report_qty,scrap_qty,operator_id,operator_name,scan_code,remark) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [taskId, woId || null, woCode || '', opCode || '', opName || '', reportQty, scrapQty, operatorId || null, operatorName || '', scanCode || '', remark || '']
    );
    // 更新任务单实际数量
    await db.execute(
      'UPDATE mes_task_order SET actual_qty=actual_qty+?,scrap_qty=scrap_qty+?,update_time=NOW() WHERE id=?',
      [reportQty, scrapQty, taskId]
    );
    // 更新工单实际数量
    if (woId) {
      await db.execute('UPDATE mes_work_order SET actual_qty=actual_qty+?,update_time=NOW() WHERE id=?', [reportQty, woId]);
    }
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// 完成任务单
router.put('/execution/task-orders/:id/complete', authMiddleware, async (req, res) => {
  try {
    await db.execute(
      'UPDATE mes_task_order SET task_status=3,actual_end=NOW(),update_time=NOW() WHERE id=?',
      [req.params.id]
    );
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// 报工记录列表
router.get('/execution/reports', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, woId, woCode, operatorName } = req.query;
    let sql = 'SELECT * FROM mes_report_record WHERE deleted=0';
    const params = [];
    if (woId) { sql += ' AND wo_id=?'; params.push(woId); }
    if (woCode) { sql += ' AND wo_code LIKE ?'; params.push(`%${woCode}%`); }
    if (operatorName) { sql += ' AND operator_name LIKE ?'; params.push(`%${operatorName}%`); }
    const [cntRows] = await db.execute(sql.replace('SELECT *', 'SELECT COUNT(*) as cnt'), params);
    sql += ` ORDER BY create_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});

// 偏差记录
router.get('/execution/deviations', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, status, severity } = req.query;
    let sql = 'SELECT * FROM mes_deviation WHERE deleted=0';
    const params = [];
    if (status) { sql += ' AND status=?'; params.push(status); }
    if (severity) { sql += ' AND severity=?'; params.push(severity); }
    const [cntRows] = await db.execute(sql.replace('SELECT *', 'SELECT COUNT(*) as cnt'), params);
    sql += ` ORDER BY create_time DESC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows, cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});
router.post('/execution/deviations', authMiddleware, async (req, res) => {
  try {
    const { woId, taskId, batchNo, deviationType, severity, description, reporterId, reporterName } = req.body;
    const deviationCode = `DEV${dayjs().format('YYYYMMDDHHmm')}${String(Math.floor(Math.random()*900)+100)}`;
    const [r] = await db.execute(
      'INSERT INTO mes_deviation (deviation_code,wo_id,task_id,batch_no,deviation_type,severity,description,reporter_id,reporter_name) VALUES (?,?,?,?,?,?,?,?,?)',
      [deviationCode, woId || null, taskId || null, batchNo || '', deviationType || '', severity || 'MINOR', description || '', reporterId || null, reporterName || '']
    );
    ok(res, { id: r.insertId, deviationCode });
  } catch (e) { fail(res, e.message, 400); }
});
router.put('/execution/deviations/:id/close', authMiddleware, async (req, res) => {
  try {
    const { rootCause, capa, handlerId, handlerName } = req.body;
    await db.execute(
      'UPDATE mes_deviation SET root_cause=?,capa=?,handler_id=?,handler_name=?,status="CLOSED",close_time=NOW() WHERE id=?',
      [rootCause || '', capa || '', handlerId || null, handlerName || '', req.params.id]
    );
    ok(res);
  } catch (e) { fail(res, e.message, 500); }
});

// =====================================================================
// compat 兼容路由层 — /production-orders/* 和 /work-orders/* 别名
// 都指向 mes_work_order 表（生产计划和工单是同一概念）
// =====================================================================

// wo_status: 1=DRAFT/OPEN, 2=IN_PROGRESS, 3=PAUSED, 4=COMPLETED, 5=CLOSED, 6=CANCELLED
const WO_STATUS_LABEL = { 1:'OPEN', 2:'IN_PROGRESS', 3:'PAUSED', 4:'COMPLETED', 5:'CLOSED', 6:'CANCELLED' };
const PRIORITY_LABEL  = { 1:'URGENT', 2:'HIGH', 3:'NORMAL', 4:'LOW' };

// 满足 ProductionOrderPage.loadFromApi 的字段需求
// item.orderNo, item.customerCode, item.customerName, item.totalQuantity,
// item.completedQuantity, item.deliveryDate, item.priority, item.status, item.createTime, item.createBy
const mapWorkOrderAsPO = (row) => ({
  id:                 row.id,
  orderNo:            row.wo_code,          // ProductionOrderPage uses orderNo
  woCode:             row.wo_code,
  wo_code:            row.wo_code,
  factoryCode:        row.factory_code ?? '',
  workshopCode:       row.workshop_code ?? '',
  customerCode:       row.product_code,     // no customer table; reuse product_code
  customerName:       row.product_name ?? '',
  productCode:        row.product_code,
  productName:        row.product_name ?? '',
  batchNo:            row.batch_no,
  bomId:              row.bom_id,
  bomVersion:         row.bom_version ?? '',
  routeId:            row.route_id,
  routeCode:          row.route_code ?? '',
  planQty:            row.plan_qty ?? 0,
  totalQuantity:      row.plan_qty ?? 0,    // ProductionOrderPage uses totalQuantity
  actualQty:          row.actual_qty ?? 0,
  completedQuantity:  row.actual_qty ?? 0,  // ProductionOrderPage uses completedQuantity
  unitName:           row.unit_name ?? '',
  orderType:          row.order_type ?? 'NORMAL',
  channelType:        row.channel_type ?? '',
  priority:           row.priority ?? 3,
  priorityLabel:      PRIORITY_LABEL[row.priority ?? 3] ?? 'NORMAL',
  woStatus:           row.wo_status ?? 1,
  wo_status:          row.wo_status ?? 1,
  status:             WO_STATUS_LABEL[row.wo_status ?? 1] ?? 'OPEN',
  planStart:          row.plan_start,
  planEnd:            row.plan_end,
  deliveryDate:       row.plan_end,         // map to deliveryDate
  actualStart:        row.actual_start,
  actualEnd:          row.actual_end,
  remark:             row.remark ?? '',
  createTime:         row.create_time,
  updateTime:         row.update_time ?? row.create_time,
  createBy:           row.create_by ?? '',
  updateBy:           row.update_by ?? '',
});

// 满足 ProductionOrderPage workOrders mapping 的字段需求
// item.workOrderNo, item.orderId, item.orderNo, item.materialCode, item.materialName,
// item.spec, item.bomVersion, item.planQuantity, item.completedQuantity, item.progress
const mapWorkOrderAsWO = (row) => ({
  id:                 row.id,
  workOrderNo:        row.wo_code,          // WorkOrder uses workOrderNo
  woCode:             row.wo_code,
  orderId:            row.id,               // self-reference (no separate PO table)
  orderNo:            row.wo_code,
  materialCode:       row.product_code,
  materialName:       row.product_name ?? '',
  spec:               row.bom_version ?? '',
  bomVersion:         row.bom_version ?? '',
  routeCode:          row.route_code ?? '',
  planQuantity:       row.plan_qty ?? 0,
  planQty:            row.plan_qty ?? 0,
  completedQuantity:  row.actual_qty ?? 0,
  actualQty:          row.actual_qty ?? 0,
  unqualifiedQuantity:0,
  batchNo:            row.batch_no,
  factoryCode:        row.factory_code ?? '',
  workshopCode:       row.workshop_code ?? '',
  priority:           row.priority ?? 3,
  woStatus:           row.wo_status ?? 1,
  status:             WO_STATUS_LABEL[row.wo_status ?? 1] ?? 'OPEN',
  progress:           row.plan_qty > 0 ? Math.round((row.actual_qty / row.plan_qty) * 100) : 0,
  planStart:          row.plan_start,
  planEnd:            row.plan_end,
  remark:             row.remark ?? '',
  createTime:         row.create_time,
  createBy:           row.create_by ?? '',
});

// ── /production-orders/* ─────────────────────────────────────────────
router.get('/production-orders/list', authMiddleware, async (req, res) => {
  try {
    const { status, woCode, productName, factoryCode } = req.query;
    let sql = 'SELECT * FROM mes_work_order WHERE deleted=0';
    const params = [];
    // status can be string label (OPEN/IN_PROGRESS) or numeric
    if (status && WO_STATUS_LABEL[status]) {
      sql += ' AND wo_status=?'; params.push(status);
    } else if (status) {
      // reverse lookup: string → number
      const numStatus = Object.entries(WO_STATUS_LABEL).find(([,v]) => v === status.toUpperCase())?.[0];
      if (numStatus) { sql += ' AND wo_status=?'; params.push(numStatus); }
    }
    if (woCode)      { sql += ' AND wo_code LIKE ?';     params.push(`%${woCode}%`); }
    if (productName) { sql += ' AND product_name LIKE ?';params.push(`%${productName}%`); }
    if (factoryCode) { sql += ' AND factory_code=?';     params.push(factoryCode); }
    sql += ' ORDER BY priority ASC, plan_start ASC';
    const [rows] = await db.execute(sql, params);
    ok(res, rows.map(mapWorkOrderAsPO));
  } catch (e) { fail(res, e.message, 500); }
});

router.get('/production-orders/page', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, status, woCode, productName, factoryCode } = req.query;
    let sql = 'SELECT * FROM mes_work_order WHERE deleted=0';
    const params = [];
    if (woCode)      { sql += ' AND wo_code LIKE ?';      params.push(`%${woCode}%`); }
    if (productName) { sql += ' AND product_name LIKE ?'; params.push(`%${productName}%`); }
    if (factoryCode) { sql += ' AND factory_code=?';      params.push(factoryCode); }
    if (status) {
      const numStatus = Object.entries(WO_STATUS_LABEL).find(([,v]) => v === status.toUpperCase())?.[0];
      if (numStatus) { sql += ' AND wo_status=?'; params.push(numStatus); }
    }
    const [cntRows] = await db.execute(sql.replace('SELECT *', 'SELECT COUNT(*) as cnt'), params);
    sql += ` ORDER BY priority ASC, plan_start ASC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows.map(mapWorkOrderAsPO), cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});

router.get('/production-orders/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM mes_work_order WHERE id=? AND deleted=0', [req.params.id]);
    if (!rows.length) return fail(res, '生产订单不存在');
    ok(res, mapWorkOrderAsPO(rows[0]));
  } catch (e) { fail(res, e.message, 500); }
});

// ── /work-orders/* ─────────────────────────────────────────────────
router.get('/work-orders/list', authMiddleware, async (req, res) => {
  try {
    const { orderId, status, woCode, productName } = req.query;
    let sql = 'SELECT * FROM mes_work_order WHERE deleted=0';
    const params = [];
    if (orderId)     { sql += ' AND id=?';                params.push(orderId); }
    if (woCode)      { sql += ' AND wo_code LIKE ?';      params.push(`%${woCode}%`); }
    if (productName) { sql += ' AND product_name LIKE ?'; params.push(`%${productName}%`); }
    if (status) {
      const numStatus = Object.entries(WO_STATUS_LABEL).find(([,v]) => v === status.toUpperCase())?.[0];
      if (numStatus) { sql += ' AND wo_status=?'; params.push(numStatus); }
    }
    sql += ' ORDER BY priority ASC, plan_start ASC';
    const [rows] = await db.execute(sql, params);
    ok(res, rows.map(mapWorkOrderAsWO));
  } catch (e) { fail(res, e.message, 500); }
});

router.get('/work-orders/page', authMiddleware, async (req, res) => {
  try {
    const { pageNum = 1, pageSize = 20, orderId, status, woCode, productName } = req.query;
    let sql = 'SELECT * FROM mes_work_order WHERE deleted=0';
    const params = [];
    if (orderId)     { sql += ' AND id=?';                params.push(orderId); }
    if (woCode)      { sql += ' AND wo_code LIKE ?';      params.push(`%${woCode}%`); }
    if (productName) { sql += ' AND product_name LIKE ?'; params.push(`%${productName}%`); }
    if (status) {
      const numStatus = Object.entries(WO_STATUS_LABEL).find(([,v]) => v === status.toUpperCase())?.[0];
      if (numStatus) { sql += ' AND wo_status=?'; params.push(numStatus); }
    }
    const [cntRows] = await db.execute(sql.replace('SELECT *', 'SELECT COUNT(*) as cnt'), params);
    sql += ` ORDER BY priority ASC, plan_start ASC LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}`;
    const [rows] = await db.execute(sql, params);
    page(res, rows.map(mapWorkOrderAsWO), cntRows[0].cnt, +pageNum, +pageSize);
  } catch (e) { fail(res, e.message, 500); }
});

router.get('/work-orders/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM mes_work_order WHERE id=? AND deleted=0', [req.params.id]);
    if (!rows.length) return fail(res, '工单不存在');
    ok(res, mapWorkOrderAsWO(rows[0]));
  } catch (e) { fail(res, e.message, 500); }
});

module.exports = router;
