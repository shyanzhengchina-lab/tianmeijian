/**
 * M07 追溯管理 + M08 可视化看板路由
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { ok, fail } = require('../middleware/response');
const { authMiddleware } = require('../middleware/auth');

// ===== M07 追溯管理 =====

// 正向追溯：由批次/物料 -> 成品
router.get('/trace/forward', authMiddleware, async (req, res) => {
  try {
    const { lotCode, materialCode, batchNo } = req.query;
    let lot;
    if (lotCode) {
      const [rows] = await db.execute('SELECT * FROM wms_material_lot WHERE lot_code=? AND deleted=0', [lotCode]);
      lot = rows[0];
    } else if (batchNo) {
      const [rows] = await db.execute('SELECT * FROM wms_material_lot WHERE vendor_batch=? OR lot_code=? AND deleted=0', [batchNo, batchNo]);
      lot = rows[0];
    }
    if (!lot) return fail(res, '未找到对应批次');
    
    // 获取该批次的所有下游关系
    const traceResult = await buildForwardTrace(lot.id);
    ok(res, { rootLot: lot, traceTree: traceResult });
  } catch (e) { fail(res, e.message, 500); }
});

// 反向追溯：由成品/工单 -> 原料
router.get('/trace/backward', authMiddleware, async (req, res) => {
  try {
    const { lotCode, woCode, batchNo } = req.query;
    let workOrder;
    if (woCode) {
      const [rows] = await db.execute('SELECT * FROM mes_work_order WHERE wo_code=? AND deleted=0', [woCode]);
      workOrder = rows[0];
    } else if (batchNo) {
      const [rows] = await db.execute('SELECT * FROM mes_work_order WHERE batch_no=? AND deleted=0', [batchNo]);
      workOrder = rows[0];
    }
    if (!workOrder) return fail(res, '未找到对应工单');
    
    // 获取工单的发料记录 -> 原料批次
    const [issuances] = await db.execute(`
      SELECT id.*, i.wo_code, i.issue_code
      FROM wms_issuance_detail id
      JOIN wms_issuance i ON id.issue_id=i.id
      WHERE i.wo_id=?`, [workOrder.id]);
    
    // 获取QC检验
    const [inspections] = await db.execute('SELECT * FROM qms_inspection_order WHERE wo_id=? AND deleted=0', [workOrder.id]);
    
    // 获取EBR
    const [ebr] = await db.execute('SELECT id,ebr_code,batch_no,ebr_status,material_balance_rate,yield_rate FROM ebr_batch_record WHERE wo_id=? AND deleted=0', [workOrder.id]);
    
    ok(res, { workOrder, materials: issuances, inspections, batchRecords: ebr });
  } catch (e) { fail(res, e.message, 500); }
});

async function buildForwardTrace(lotId, depth = 0) {
  if (depth > 5) return [];
  const [relations] = await db.execute(
    'SELECT r.*,l.material_code,l.material_name,l.lot_type FROM trc_lot_relation r JOIN wms_material_lot l ON r.child_lot_id=l.id WHERE r.parent_lot_id=?',
    [lotId]
  );
  const results = [];
  for (const rel of relations) {
    const children = await buildForwardTrace(rel.child_lot_id, depth + 1);
    results.push({ ...rel, children });
  }
  return results;
}

// 条码查询
router.get('/trace/barcode', authMiddleware, async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return fail(res, '条码不能为空');
    // 查询三级码关联
    const [barcodes] = await db.execute(
      'SELECT b.*,w.product_name,w.batch_no,w.wo_status FROM trc_barcode_relation b LEFT JOIN mes_work_order w ON b.wo_id=w.id WHERE b.product_code=? OR b.box_code=? OR b.pallet_code=? LIMIT 10',
      [code, code, code]
    );
    if (barcodes.length) {
      ok(res, barcodes);
    } else {
      // 查询物料批次
      const [lots] = await db.execute('SELECT * FROM wms_material_lot WHERE lot_code=? AND deleted=0', [code]);
      if (lots.length) {
        ok(res, lots.map(l => ({ type: 'lot', ...l })));
      } else {
        fail(res, '未找到对应条码信息');
      }
    }
  } catch (e) { fail(res, e.message, 500); }
});

// 批次关系添加
router.post('/trace/lot-relations', authMiddleware, async (req, res) => {
  try {
    const { parentLotId, parentLotCode, childLotId, childLotCode, woId, opCode, qtyUsed } = req.body;
    const [r] = await db.execute(
      'INSERT INTO trc_lot_relation (parent_lot_id,parent_lot_code,child_lot_id,child_lot_code,wo_id,op_code,qty_used) VALUES (?,?,?,?,?,?,?)',
      [parentLotId, parentLotCode || '', childLotId, childLotCode || '', woId || null, opCode || '', qtyUsed || 0]
    );
    ok(res, { id: r.insertId });
  } catch (e) { fail(res, e.message, 400); }
});

// ===== M08 可视化看板 =====

// 工厂级看板数据
router.get('/dashboard/factory', authMiddleware, async (req, res) => {
  try {
    const { factoryCode } = req.query;
    const fFilter = factoryCode ? ' AND factory_code=?' : '';
    const fParams = factoryCode ? [factoryCode] : [];
    
    // 工单统计
    const [woStats] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN wo_status=1 THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN wo_status=2 THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN wo_status=3 OR wo_status=4 THEN 1 ELSE 0 END) as waitInspect,
        SUM(CASE WHEN wo_status=5 THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN wo_status=7 THEN 1 ELSE 0 END) as paused
      FROM mes_work_order WHERE deleted=0${fFilter}`, fParams);
    
    // 今日工单
    const [todayWo] = await db.execute(`
      SELECT COUNT(*) as todayTotal,
        SUM(CASE WHEN wo_status=2 THEN 1 ELSE 0 END) as todayInProgress,
        SUM(CASE WHEN wo_status=5 THEN 1 ELSE 0 END) as todayCompleted
      FROM mes_work_order WHERE deleted=0 AND DATE(create_time)=CURDATE()${fFilter}`, fParams);
    
    // 质量统计
    const [qcStats] = await db.execute(`
      SELECT 
        COUNT(*) as totalInspections,
        SUM(CASE WHEN overall_result='PASS' THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN overall_result='FAIL' THEN 1 ELSE 0 END) as failed
      FROM qms_inspection_order WHERE deleted=0 AND DATE(create_time)>=DATE_SUB(CURDATE(),INTERVAL 7 DAY)`);
    
    // 设备状态
    const [eqStats] = await db.execute(`
      SELECT eq_status, COUNT(*) as cnt 
      FROM eqp_equipment WHERE deleted=0${fFilter}
      GROUP BY eq_status`, fParams);
    
    // 近7天OEE平均
    const [oeeAvg] = await db.execute(`
      SELECT ROUND(AVG(oee),2) as avgOee, DATE(stat_date) as date 
      FROM eqp_oee_data WHERE stat_date >= DATE_SUB(CURDATE(),INTERVAL 7 DAY)
      GROUP BY DATE(stat_date) ORDER BY date`);
    
    // 本月偏差
    const [deviations] = await db.execute(`
      SELECT severity, COUNT(*) as cnt FROM mes_deviation 
      WHERE deleted=0 AND DATE(create_time)>=DATE_FORMAT(CURDATE(),'%Y-%m-01')
      GROUP BY severity`);

    // 物料库存预警（低于最小库存）
    const [stockAlerts] = await db.execute(`
      SELECT l.material_code, l.material_name, SUM(l.qty_available) as available, m.min_stock
      FROM wms_material_lot l JOIN base_material m ON l.material_id=m.id
      WHERE l.deleted=0 AND l.lot_status=2
      GROUP BY l.material_id,l.material_code,l.material_name,m.min_stock
      HAVING available < m.min_stock AND m.min_stock > 0
      LIMIT 10`);
    
    ok(res, {
      woStats: woStats[0],
      todayWo: todayWo[0],
      qcStats: qcStats[0],
      eqStats,
      oeeAvg,
      deviations,
      stockAlerts,
    });
  } catch (e) { fail(res, e.message, 500); }
});

// 车间看板
router.get('/dashboard/workshop', authMiddleware, async (req, res) => {
  try {
    const { workshopCode, factoryCode } = req.query;
    const params = [];
    let wFilter = 'WHERE wo.deleted=0';
    if (factoryCode) { wFilter += ' AND wo.factory_code=?'; params.push(factoryCode); }
    if (workshopCode) { wFilter += ' AND wo.workshop_code=?'; params.push(workshopCode); }
    
    const [activeOrders] = await db.execute(`
      SELECT wo.wo_code, wo.product_name, wo.batch_no, wo.plan_qty, wo.actual_qty,
        wo.wo_status, wo.plan_start, wo.plan_end, wo.priority,
        ROUND(wo.actual_qty/NULLIF(wo.plan_qty,0)*100,1) as progress_pct
      FROM mes_work_order wo ${wFilter} AND wo.wo_status IN (1,2,3,4,7)
      ORDER BY wo.priority ASC, wo.plan_start ASC LIMIT 20`, params);
    
    const [taskStats] = await db.execute(`
      SELECT t.task_status, COUNT(*) as cnt 
      FROM mes_task_order t 
      JOIN mes_work_order wo ON t.wo_id=wo.id
      ${wFilter} AND t.deleted=0
      GROUP BY t.task_status`, params);
    
    ok(res, { activeOrders, taskStats });
  } catch (e) { fail(res, e.message, 500); }
});

// 质量看板
router.get('/dashboard/quality', authMiddleware, async (req, res) => {
  try {
    // 近30天检验通过率趋势
    const [trend] = await db.execute(`
      SELECT DATE(create_time) as date,
        COUNT(*) as total,
        SUM(CASE WHEN overall_result='PASS' THEN 1 ELSE 0 END) as passed,
        ROUND(SUM(CASE WHEN overall_result='PASS' THEN 1 ELSE 0 END)/COUNT(*)*100,2) as passRate
      FROM qms_inspection_order WHERE deleted=0 AND create_time >= DATE_SUB(CURDATE(),INTERVAL 30 DAY)
      GROUP BY DATE(create_time) ORDER BY date`);
    
    // 各类型检验统计
    const [byType] = await db.execute(`
      SELECT io_type,
        COUNT(*) as total,
        SUM(CASE WHEN overall_result='PASS' THEN 1 ELSE 0 END) as passed
      FROM qms_inspection_order WHERE deleted=0
      GROUP BY io_type`);
    
    // 待处理不合格
    const [ncPending] = await db.execute(`SELECT COUNT(*) as cnt FROM qms_nonconformance WHERE deleted=0 AND status='OPEN'`);
    
    // 未关闭偏差
    const [devOpen] = await db.execute(`SELECT COUNT(*) as cnt FROM mes_deviation WHERE deleted=0 AND status='OPEN'`);
    
    ok(res, { trend, byType, ncPending: ncPending[0].cnt, devOpen: devOpen[0].cnt });
  } catch (e) { fail(res, e.message, 500); }
});

// 管理驾驶舱
router.get('/dashboard/cockpit', authMiddleware, async (req, res) => {
  try {
    // 月度交付率
    const [deliveryRate] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN wo_status=5 AND actual_end<=plan_end THEN 1 ELSE 0 END) as onTime,
        SUM(CASE WHEN wo_status=5 THEN 1 ELSE 0 END) as completed,
        ROUND(SUM(CASE WHEN wo_status=5 AND actual_end<=plan_end THEN 1 ELSE 0 END)/NULLIF(SUM(CASE WHEN wo_status=5 THEN 1 ELSE 0 END),0)*100,2) as onTimeRate
      FROM mes_work_order WHERE deleted=0 AND YEAR(create_time)=YEAR(CURDATE()) AND MONTH(create_time)=MONTH(CURDATE())`);
    
    // 按工厂的工单量
    const [byFactory] = await db.execute(`
      SELECT factory_code, COUNT(*) as total, SUM(CASE WHEN wo_status=5 THEN 1 ELSE 0 END) as completed
      FROM mes_work_order WHERE deleted=0 GROUP BY factory_code`);
    
    // 全厂OEE
    const [oee] = await db.execute(`
      SELECT ROUND(AVG(oee),2) as avgOee, MIN(oee) as minOee, MAX(oee) as maxOee
      FROM eqp_oee_data WHERE stat_date >= DATE_SUB(CURDATE(),INTERVAL 30 DAY)`);
    
    // 质检一次通过率
    const [firstPassRate] = await db.execute(`
      SELECT ROUND(SUM(CASE WHEN overall_result='PASS' THEN 1 ELSE 0 END)/COUNT(*)*100,2) as rate
      FROM qms_inspection_order WHERE deleted=0 AND YEAR(create_time)=YEAR(CURDATE()) AND MONTH(create_time)=MONTH(CURDATE())`);
    
    ok(res, {
      deliveryRate: deliveryRate[0],
      byFactory,
      oee: oee[0],
      firstPassRate: firstPassRate[0].rate
    });
  } catch (e) { fail(res, e.message, 500); }
});

module.exports = router;
