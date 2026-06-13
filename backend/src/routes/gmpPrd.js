/**
 * 天美健MES — PRD §8/§10/§11/§13/§15/§17 后端API
 * ============================================================
 * §8  称量配料防错 (mes_weigh_record)
 * §10 清场管理    (mes_cleanup_task)  — 动态有效期 GD:72h/YQ:48h/YT:48h/PK:24h
 * §11 质量门控    (mes_quality_gate)  — 工序间放行+不合格拦截自动创建偏差
 * §13 偏差管理    (mes_deviation + mes_capa) — 自动触发链路+CAPA闭环
 * §15 审计追踪    (sys_audit_log)     — ALCOA+合规检查
 * §17 EBR签名    (ebr_signature)     — 三级电子签名补充
 * ============================================================
 */
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { ok, fail } = require('../middleware/response');
const { authMiddleware } = require('../middleware/auth');
const crypto  = require('crypto');

// ─── 工具函数 ──────────────────────────────────────────────────────────────
function genCode(prefix) {
  const d  = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const ran = String(Math.floor(Math.random()*1000)).padStart(3,'0');
  return `${prefix}-${ymd}${ran}`;
}

/** 写入审计日志（带ALCOA+检查） */
async function writeAuditLog({ userId, username, factoryCode, module, action,
  targetType, targetId, detail, ipAddress, beforeVal, afterVal, riskLevel = 'LOW' }) {
  const raw      = `${username}|${module}|${action}|${targetId}|${Date.now()}`;
  const checksum = crypto.createHash('sha256').update(raw).digest('hex');
  // ALCOA+不符合项检测
  const flags = [];
  if (!username)   flags.push('Attributable:缺少操作人');
  if (!detail)     flags.push('Legible:操作详情为空');
  if (!targetId)   flags.push('Original:目标记录ID缺失');
  await db.execute(
    `INSERT INTO sys_audit_log
     (user_id,username,factory_code,module,action,target_type,target_id,
      detail,ip_address,checksum,before_value,after_value,risk_level,alcoa_flag)
     VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [userId||null, username||'', factoryCode||'', module, action,
     targetType||'', String(targetId||''), detail||'', ipAddress||'',
     checksum, beforeVal||null, afterVal||null, riskLevel, flags.join(';')]
  );
}

// ════════════════════════════════════════════════════════════════════════════
// §13 偏差管理 API — 自动触发链路 + CAPA闭环
// ════════════════════════════════════════════════════════════════════════════

/** GET /api/deviations/page — 偏差列表（分页+筛选） */
router.get('/deviations/page', authMiddleware, async (req, res) => {
  try {
    const { pageNum=1, pageSize=20, status, severity, triggerSource, batchNo, keyword } = req.query;
    let sql = `SELECT * FROM mes_deviation WHERE deleted=0`;
    const p = [];
    if (status)        { sql += ' AND status=?';           p.push(status); }
    if (severity)      { sql += ' AND severity=?';         p.push(severity); }
    if (triggerSource) { sql += ' AND trigger_source=?';   p.push(triggerSource); }
    if (batchNo)       { sql += ' AND batch_no LIKE ?';    p.push(`%${batchNo}%`); }
    if (keyword)       { sql += ' AND (title LIKE ? OR deviation_code LIKE ? OR description LIKE ?)';
                         p.push(`%${keyword}%`,`%${keyword}%`,`%${keyword}%`); }
    const [cnt] = await db.execute(sql.replace('SELECT *','SELECT COUNT(*) AS total'), p);
    sql += ` ORDER BY create_time DESC LIMIT ? OFFSET ?`;
    p.push(Number(pageSize), (Number(pageNum)-1)*Number(pageSize));
    const [rows] = await db.execute(sql, p);
    ok(res, { list: rows, total: cnt[0].total, pageNum: Number(pageNum), pageSize: Number(pageSize) });
  } catch(e){ fail(res, e.message); }
});

/** GET /api/deviations/:id — 偏差详情 */
router.get('/deviations/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM mes_deviation WHERE id=? AND deleted=0', [req.params.id]);
    if (!rows.length) return fail(res, '偏差记录不存在', 404);
    const [capas] = await db.execute('SELECT * FROM mes_capa WHERE dev_code=? AND deleted=0', [rows[0].deviation_code]);
    ok(res, { ...rows[0], capas });
  } catch(e){ fail(res, e.message); }
});

/** POST /api/deviations — 手动/自动创建偏差 */
router.post('/deviations', authMiddleware, async (req, res) => {
  try {
    const {
      batchNo, woId, woCode, productName,
      title, deviationType, deviationType2, severity, description,
      triggerSource = 'MANUAL', triggerRefId = '',
      reporterName, handlerName, deadline, capaRequired = false
    } = req.body;

    const devCode  = genCode('DEV');
    // severity → deadline规则: CRITICAL=3天 MAJOR=7天 MINOR=14天
    const daysMap  = { CRITICAL: 3, MAJOR: 7, MINOR: 14 };
    const dl       = deadline || new Date(Date.now() + daysMap[severity||'MINOR']*86400000)
                       .toISOString().slice(0,10);
    const [r] = await db.execute(
      `INSERT INTO mes_deviation
       (deviation_code,batch_no,wo_id,wo_code,product_name,
        title,deviation_type,deviation_type2,severity,description,
        trigger_source,trigger_ref_id,
        reporter_name,handler_name,deadline,capa_required,status)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [devCode, batchNo||'', woId||null, woCode||'', productName||'',
       title||devCode, deviationType||'工艺偏差', deviationType2||'',
       severity||'MINOR', description||'',
       triggerSource, triggerRefId,
       reporterName||'', handlerName||'', dl, capaRequired?1:0, 'OPEN']
    );
    await writeAuditLog({
      username: reporterName||'系统自动', module: 'DEVIATION', action: 'CREATE',
      targetType: 'mes_deviation', targetId: devCode,
      detail: `创建偏差[${devCode}] 严重度:${severity} 来源:${triggerSource}`,
      riskLevel: severity === 'CRITICAL' ? 'CRITICAL' : severity === 'MAJOR' ? 'HIGH' : 'MEDIUM'
    });
    ok(res, { id: r.insertId, devCode });
  } catch(e){ fail(res, e.message); }
});

/** PUT /api/deviations/:id/investigate — 提交调查结果 */
router.put('/deviations/:id/investigate', authMiddleware, async (req, res) => {
  try {
    const { rootCause, investResult, handlerName } = req.body;
    await db.execute(
      `UPDATE mes_deviation SET root_cause=?,invest_result=?,handler_name=?,
       status='INVESTIGATION',update_time=NOW() WHERE id=?`,
      [rootCause||'', investResult||'', handlerName||'', req.params.id]
    );
    ok(res, { msg: '调查结果已提交' });
  } catch(e){ fail(res, e.message); }
});

/** PUT /api/deviations/:id/close — 关闭偏差 */
router.put('/deviations/:id/close', authMiddleware, async (req, res) => {
  try {
    const { capa, handlerName } = req.body;
    await db.execute(
      `UPDATE mes_deviation SET capa=?,status='CLOSED',close_time=NOW(),
       handler_name=?,update_time=NOW() WHERE id=?`,
      [capa||'', handlerName||'', req.params.id]
    );
    await writeAuditLog({
      username: handlerName||'', module: 'DEVIATION', action: 'CLOSE',
      targetType: 'mes_deviation', targetId: req.params.id,
      detail: `偏差关闭，整改措施: ${capa}`, riskLevel: 'MEDIUM'
    });
    ok(res, { msg: '偏差已关闭' });
  } catch(e){ fail(res, e.message); }
});

// ─── CAPA管理 ────────────────────────────────────────────────────────────────

/** GET /api/capas/page — CAPA列表 */
router.get('/capas/page', authMiddleware, async (req, res) => {
  try {
    const { pageNum=1, pageSize=20, status, priority, devCode } = req.query;
    let sql = 'SELECT * FROM mes_capa WHERE deleted=0';
    const p = [];
    if (status)  { sql += ' AND status=?';   p.push(status); }
    if (priority){ sql += ' AND priority=?'; p.push(priority); }
    if (devCode) { sql += ' AND dev_code=?'; p.push(devCode); }
    const [cnt] = await db.execute(sql.replace('SELECT *','SELECT COUNT(*) AS total'), p);
    sql += ' ORDER BY create_time DESC LIMIT ? OFFSET ?';
    p.push(Number(pageSize), (Number(pageNum)-1)*Number(pageSize));
    const [rows] = await db.execute(sql, p);
    ok(res, { list: rows, total: cnt[0].total });
  } catch(e){ fail(res, e.message); }
});

/** POST /api/capas — 创建CAPA */
router.post('/capas', authMiddleware, async (req, res) => {
  try {
    const { deviationId, devCode, title, capaType, priority,
            description, rootCause, actionPlan, ownerName, dueDate } = req.body;
    const capaCode = genCode('CAPA');
    const [r] = await db.execute(
      `INSERT INTO mes_capa
       (capa_code,deviation_id,dev_code,title,capa_type,priority,
        description,root_cause,action_plan,owner_name,due_date,status,progress)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [capaCode, deviationId||null, devCode||'', title||capaCode,
       capaType||'CORRECTIVE', priority||'MEDIUM',
       description||'', rootCause||'', actionPlan||'',
       ownerName||'', dueDate||null, 'PENDING', 0]
    );
    // 关联到偏差
    if (devCode) await db.execute(
      'UPDATE mes_deviation SET capa_id=?,capa_required=1 WHERE deviation_code=?',
      [capaCode, devCode]
    );
    ok(res, { id: r.insertId, capaCode });
  } catch(e){ fail(res, e.message); }
});

/** PUT /api/capas/:id/progress — 更新CAPA进度 */
router.put('/capas/:id/progress', authMiddleware, async (req, res) => {
  try {
    const { progress, status, verifyResult, approverName, completeDate } = req.body;
    await db.execute(
      `UPDATE mes_capa SET progress=?,status=?,verify_result=?,
       approver_name=?,complete_date=?,update_time=NOW() WHERE id=?`,
      [progress, status, verifyResult||'', approverName||'', completeDate||null, req.params.id]
    );
    ok(res, { msg: 'CAPA进度已更新' });
  } catch(e){ fail(res, e.message); }
});

// ════════════════════════════════════════════════════════════════════════════
// §8 称量配料防错 API
// ════════════════════════════════════════════════════════════════════════════

/** GET /api/weigh-records/page — 称量记录列表 */
router.get('/weigh-records/page', authMiddleware, async (req, res) => {
  try {
    const { pageNum=1, pageSize=20, sessionStatus, batchNo, woCode } = req.query;
    let sql = 'SELECT id,session_id,wo_code,batch_no,product_name,operator_name,reviewer_name,total_items,passed_items,failed_items,warning_items,session_status,deviation_id,complete_time,create_time FROM mes_weigh_record WHERE deleted=0';
    const p = [];
    if (sessionStatus){ sql += ' AND session_status=?'; p.push(sessionStatus); }
    if (batchNo)      { sql += ' AND batch_no LIKE ?';  p.push(`%${batchNo}%`); }
    if (woCode)       { sql += ' AND wo_code LIKE ?';   p.push(`%${woCode}%`); }
    const [cnt] = await db.execute(sql.replace(/SELECT .+ FROM/,'SELECT COUNT(*) AS total FROM'), p);
    sql += ' ORDER BY create_time DESC LIMIT ? OFFSET ?';
    p.push(Number(pageSize),(Number(pageNum)-1)*Number(pageSize));
    const [rows] = await db.execute(sql, p);
    ok(res, { list: rows, total: cnt[0].total });
  } catch(e){ fail(res, e.message); }
});

/** POST /api/weigh-records — 保存称量记录（含自动触发偏差） */
router.post('/weigh-records', authMiddleware, async (req, res) => {
  try {
    const {
      woId, woCode, batchNo, productName, bomId,
      operatorName, reviewerName,
      totalItems, passedItems, failedItems, warningItems,
      weighDetails, sessionStatus = 'COMPLETED'
    } = req.body;

    const sessionId  = genCode('WS');
    let   deviationId = '';

    // 有称量失败项 → 自动创建偏差
    if (failedItems > 0) {
      const devCode = genCode('DEV');
      await db.execute(
        `INSERT INTO mes_deviation
         (deviation_code,batch_no,wo_code,title,deviation_type,deviation_type2,
          severity,description,trigger_source,trigger_ref_id,
          reporter_name,handler_name,status)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [devCode, batchNo||'', woCode||'',
         `称量配料防错-${failedItems}项核对失败`, '物料偏差', '称量偏差',
         failedItems >= 2 ? 'MAJOR' : 'MINOR',
         `批号${batchNo}称量作业中${failedItems}项核对失败（四重核对不通过）`,
         'WEIGH_ERROR', sessionId,
         operatorName||'系统自动', reviewerName||'', 'OPEN']
      );
      deviationId = devCode;
    }

    const [r] = await db.execute(
      `INSERT INTO mes_weigh_record
       (session_id,wo_id,wo_code,batch_no,product_name,bom_id,
        operator_name,reviewer_name,total_items,passed_items,failed_items,
        warning_items,weigh_details,session_status,deviation_id,complete_time)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
      [sessionId, woId||null, woCode||'', batchNo||'', productName||'', bomId||null,
       operatorName||'', reviewerName||'',
       totalItems||0, passedItems||0, failedItems||0, warningItems||0,
       JSON.stringify(weighDetails||[]), sessionStatus, deviationId]
    );
    await writeAuditLog({
      username: operatorName||'', module: 'WEIGH', action: 'COMPLETE',
      targetType: 'mes_weigh_record', targetId: sessionId,
      detail: `称量完成: 总${totalItems}项 通过${passedItems} 失败${failedItems} 警告${warningItems}`,
      riskLevel: failedItems > 0 ? 'HIGH' : 'LOW'
    });
    ok(res, { id: r.insertId, sessionId, deviationId });
  } catch(e){ fail(res, e.message); }
});

// ════════════════════════════════════════════════════════════════════════════
// §10 清场管理 API — 动态有效期
// ════════════════════════════════════════════════════════════════════════════
const CERT_VALID_HOURS = { SOLID: 72, LIQUID: 48, SOFTGEL: 48, PACKING: 24 };

/** GET /api/cleanup-tasks/page — 清场任务列表 */
router.get('/cleanup-tasks/page', authMiddleware, async (req, res) => {
  try {
    const { pageNum=1, pageSize=20, status, workshopType, batchNo } = req.query;
    let sql = 'SELECT * FROM mes_cleanup_task WHERE deleted=0';
    const p = [];
    if (status)      { sql += ' AND status=?';       p.push(status); }
    if (workshopType){ sql += ' AND workshop_type=?'; p.push(workshopType); }
    if (batchNo)     { sql += ' AND batch_no LIKE ?'; p.push(`%${batchNo}%`); }
    const [cnt] = await db.execute(sql.replace('SELECT *','SELECT COUNT(*) AS total'), p);
    sql += ' ORDER BY create_time DESC LIMIT ? OFFSET ?';
    p.push(Number(pageSize),(Number(pageNum)-1)*Number(pageSize));
    const [rows] = await db.execute(sql, p);
    // 实时更新合格证状态（动态有效期检查）
    const now = Date.now();
    for (const r of rows) {
      if (r.cert_expire_time && r.status === 'QA_PASSED') {
        const expMs  = new Date(r.cert_expire_time).getTime();
        const diffH  = (expMs - now) / 3600000;
        r.cert_status = diffH < 0 ? 'EXPIRED' : diffH < 12 ? 'EXPIRING' : 'VALID';
        // 自动更新DB
        if (r.cert_status === 'EXPIRED' && r.status !== 'EXPIRED') {
          await db.execute('UPDATE mes_cleanup_task SET status="EXPIRED",cert_status="EXPIRED" WHERE id=?',[r.id]);
          r.status = 'EXPIRED';
        }
      }
    }
    ok(res, { list: rows, total: cnt[0].total });
  } catch(e){ fail(res, e.message); }
});

/** POST /api/cleanup-tasks — 创建清场任务 */
router.post('/cleanup-tasks', authMiddleware, async (req, res) => {
  try {
    const { woId, woCode, batchNo, productName, workshop, workshopType = 'SOLID' } = req.body;
    const taskNo      = genCode('CLN');
    const validHours  = CERT_VALID_HOURS[workshopType] || 72;
    const deadline    = new Date(Date.now() + 8*3600000); // 清场截止时间=触发后8h
    const [r] = await db.execute(
      `INSERT INTO mes_cleanup_task
       (task_no,wo_id,wo_code,batch_no,product_name,workshop,workshop_type,
        cert_valid_hours,trigger_time,deadline,status)
       VALUES(?,?,?,?,?,?,?,?,NOW(),?,?)`,
      [taskNo, woId||null, woCode||'', batchNo||'', productName||'',
       workshop||'', workshopType, validHours,
       deadline.toISOString().slice(0,19).replace('T',' '), 'PENDING']
    );
    ok(res, { id: r.insertId, taskNo, validHours });
  } catch(e){ fail(res, e.message); }
});

/** PUT /api/cleanup-tasks/:id/sign — 三级签名 */
router.put('/cleanup-tasks/:id/sign', authMiddleware, async (req, res) => {
  try {
    const { signType, signerName, remark, checkItems } = req.body;
    let sql, nextStatus;
    if (signType === 'OPERATOR') {
      sql = `UPDATE mes_cleanup_task SET operator_name=?,operator_sign_time=NOW(),
             status='OPERATOR_DONE',check_items=? WHERE id=?`;
      nextStatus = 'OPERATOR_DONE';
      await db.execute(sql, [signerName, JSON.stringify(checkItems||[]), req.params.id]);
    } else if (signType === 'CHECKER') {
      sql = `UPDATE mes_cleanup_task SET checker_name=?,checker_sign_time=NOW(),
             status='CHECKER_DONE' WHERE id=?`;
      await db.execute(sql, [signerName, req.params.id]);
      nextStatus = 'CHECKER_DONE';
    } else if (signType === 'QA') {
      // QA通过 → 生成合格证 + 计算有效期
      const [task] = await db.execute('SELECT * FROM mes_cleanup_task WHERE id=?',[req.params.id]);
      if (!task.length) return fail(res,'任务不存在');
      const validHours = task[0].cert_valid_hours || 72;
      const certNo     = genCode('CC');
      const issueTime  = new Date();
      const expireTime = new Date(issueTime.getTime() + validHours*3600000);
      await db.execute(
        `UPDATE mes_cleanup_task SET qa_name=?,qa_sign_time=NOW(),qa_remark=?,
         status='QA_PASSED',cert_no=?,cert_issue_time=?,cert_expire_time=?,cert_status='VALID'
         WHERE id=?`,
        [signerName, remark||'', certNo,
         issueTime.toISOString().slice(0,19).replace('T',' '),
         expireTime.toISOString().slice(0,19).replace('T',' '),
         req.params.id]
      );
      nextStatus = 'QA_PASSED';
      await writeAuditLog({
        username: signerName, module: 'CLEANUP', action: 'QA_SIGN',
        targetType: 'mes_cleanup_task', targetId: req.params.id,
        detail: `清场合格证${certNo}已签发，有效期${validHours}h，到期:${expireTime.toISOString().slice(0,16)}`,
        riskLevel: 'MEDIUM'
      });
      return ok(res, { msg: '清场合格证已签发', certNo, expireTime, validHours });
    }
    ok(res, { msg: `${signType}签名完成`, nextStatus });
  } catch(e){ fail(res, e.message); }
});

/** GET /api/cleanup-tasks/valid — 获取当前有效的清场合格证 */
router.get('/cleanup-tasks/valid', authMiddleware, async (req, res) => {
  try {
    const { workshopType, workshop } = req.query;
    let sql = `SELECT * FROM mes_cleanup_task WHERE status='QA_PASSED' AND cert_status='VALID' AND deleted=0`;
    const p = [];
    if (workshopType){ sql += ' AND workshop_type=?'; p.push(workshopType); }
    if (workshop)    { sql += ' AND workshop LIKE ?'; p.push(`%${workshop}%`); }
    const [rows] = await db.execute(sql, p);
    // 检查是否快到期
    const now = Date.now();
    rows.forEach(r => {
      if (r.cert_expire_time) {
        const diffH = (new Date(r.cert_expire_time).getTime() - now) / 3600000;
        r.remaining_hours = Math.max(0, diffH).toFixed(1);
        r.cert_status = diffH < 0 ? 'EXPIRED' : diffH < 12 ? 'EXPIRING' : 'VALID';
      }
    });
    ok(res, rows);
  } catch(e){ fail(res, e.message); }
});

// ════════════════════════════════════════════════════════════════════════════
// §11 质量门控 API — 工序间放行检查 + 自动创建偏差
// ════════════════════════════════════════════════════════════════════════════

/** GET /api/quality-gates/page — 质量门控列表 */
router.get('/quality-gates/page', authMiddleware, async (req, res) => {
  try {
    const { pageNum=1, pageSize=20, gateStatus, batchNo, woCode } = req.query;
    let sql = 'SELECT * FROM mes_quality_gate WHERE deleted=0';
    const p = [];
    if (gateStatus){ sql += ' AND gate_status=?'; p.push(gateStatus); }
    if (batchNo)   { sql += ' AND batch_no LIKE ?'; p.push(`%${batchNo}%`); }
    if (woCode)    { sql += ' AND wo_code LIKE ?'; p.push(`%${woCode}%`); }
    const [cnt] = await db.execute(sql.replace('SELECT *','SELECT COUNT(*) AS total'), p);
    sql += ' ORDER BY create_time DESC LIMIT ? OFFSET ?';
    p.push(Number(pageSize),(Number(pageNum)-1)*Number(pageSize));
    const [rows] = await db.execute(sql, p);
    ok(res, { list: rows, total: cnt[0].total });
  } catch(e){ fail(res, e.message); }
});

/** POST /api/quality-gates — 创建质量门控检查单 */
router.post('/quality-gates', authMiddleware, async (req, res) => {
  try {
    const { woId, woCode, batchNo, productName,
            fromOpCode, fromOpName, toOpCode, toOpName, gateItems } = req.body;
    const gateNo = genCode('QG');
    const [r] = await db.execute(
      `INSERT INTO mes_quality_gate
       (gate_no,wo_id,wo_code,batch_no,product_name,
        from_op_code,from_op_name,to_op_code,to_op_name,gate_items,gate_status)
       VALUES(?,?,?,?,?,?,?,?,?,?,'PENDING')`,
      [gateNo, woId||null, woCode||'', batchNo||'', productName||'',
       fromOpCode||'', fromOpName||'', toOpCode||'', toOpName||'',
       JSON.stringify(gateItems||[])]
    );
    ok(res, { id: r.insertId, gateNo });
  } catch(e){ fail(res, e.message); }
});

/** PUT /api/quality-gates/:id/inspect — 提交检查结果 */
router.put('/quality-gates/:id/inspect', authMiddleware, async (req, res) => {
  try {
    const { allPassed, gateItems, inspectorName, blockReason, ipAddress } = req.body;
    const gateStatus  = allPassed ? 'PASSED' : 'BLOCKED';
    let   devCode     = '';

    // 未通过 → 自动创建偏差
    if (!allPassed) {
      const [gate] = await db.execute('SELECT * FROM mes_quality_gate WHERE id=?',[req.params.id]);
      if (gate.length) {
        devCode = genCode('DEV');
        await db.execute(
          `INSERT INTO mes_deviation
           (deviation_code,batch_no,wo_code,title,deviation_type,deviation_type2,
            severity,description,trigger_source,trigger_ref_id,reporter_name,status)
           VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
          [devCode, gate[0].batch_no, gate[0].wo_code,
           `质量门控不合格-${gate[0].from_op_name}→${gate[0].to_op_name}`,
           '工艺偏差', '质量门控', 'MAJOR',
           blockReason || `工序${gate[0].from_op_name}质量门控检查未通过，拦截流转至${gate[0].to_op_name}`,
           'QUALITY_GATE', gate[0].gate_no, inspectorName||'系统自动', 'OPEN']
        );
      }
    }

    await db.execute(
      `UPDATE mes_quality_gate SET all_passed=?,gate_items=?,gate_status=?,
       block_reason=?,inspector_name=?,inspect_time=NOW(),deviation_code=? WHERE id=?`,
      [allPassed?1:0, JSON.stringify(gateItems||[]), gateStatus,
       blockReason||'', inspectorName||'', devCode, req.params.id]
    );

    await writeAuditLog({
      username: inspectorName||'', module: 'QUALITY_GATE', action: 'INSPECT',
      targetType: 'mes_quality_gate', targetId: req.params.id,
      detail: `质量门控检查: ${gateStatus}${devCode ? ` 自动偏差:${devCode}` : ''}`,
      ipAddress, riskLevel: allPassed ? 'LOW' : 'HIGH'
    });

    ok(res, { gateStatus, devCode, msg: allPassed ? '质量门控通过，工序流转放行' : `质量门控拦截，已创建偏差${devCode}` });
  } catch(e){ fail(res, e.message); }
});

// ════════════════════════════════════════════════════════════════════════════
// §17 EBR电子签名 API（补充三级签名记录）
// ════════════════════════════════════════════════════════════════════════════

/** POST /api/ebr/signatures — 记录电子签名 */
router.post('/ebr/signatures', authMiddleware, async (req, res) => {
  try {
    const { ebrId, batchNo, signType, userId, userName, userRole, signMeaning, ipAddress } = req.body;
    // 生成签名哈希（21 CFR Part 11合规）
    const raw      = `${ebrId}|${userName}|${signType}|${signMeaning}|${Date.now()}`;
    const checksum = crypto.createHash('sha256').update(raw).digest('hex');
    const [r] = await db.execute(
      `INSERT INTO ebr_signature(ebr_id,batch_no,sign_type,user_id,user_name,user_role,sign_meaning,ip_address,checksum)
       VALUES(?,?,?,?,?,?,?,?,?)`,
      [ebrId, batchNo||'', signType, userId||null, userName||'', userRole||'', signMeaning||'', ipAddress||'', checksum]
    );
    // 同步更新ebr_batch_record对应字段
    const fieldMap = {
      OPERATE:    'operator_sign=?,operator_sign_time=NOW()',
      REVIEW:     'reviewer_sign=?,reviewer_sign_time=NOW()',
      QA_APPROVE: 'qa_sign=?,qa_sign_time=NOW()'
    };
    if (fieldMap[signType]) {
      let newStatus;
      if (signType === 'OPERATE')    newStatus = 'UNDER_REVIEW';
      if (signType === 'REVIEW')     newStatus = 'APPROVED';
      if (signType === 'QA_APPROVE') newStatus = 'ARCHIVED';
      await db.execute(
        `UPDATE ebr_batch_record SET ${fieldMap[signType]},ebr_status=? WHERE id=?`,
        [userName, newStatus, ebrId]
      );
    }
    await writeAuditLog({
      userId, username: userName, module: 'EBR', action: `SIGN_${signType}`,
      targetType: 'ebr_batch_record', targetId: ebrId,
      detail: `批记录电子签名[${signType}]: ${signMeaning?.substring(0,100)}`,
      ipAddress, riskLevel: signType === 'QA_APPROVE' ? 'HIGH' : 'MEDIUM'
    });
    ok(res, { id: r.insertId, checksum, msg: `${signType}签名已记录` });
  } catch(e){ fail(res, e.message); }
});

/** GET /api/ebr/signatures/:ebrId — 获取批记录签名历史 */
router.get('/ebr/signatures/:ebrId', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM ebr_signature WHERE ebr_id=? ORDER BY signed_at',
      [req.params.ebrId]
    );
    ok(res, rows);
  } catch(e){ fail(res, e.message); }
});

// ════════════════════════════════════════════════════════════════════════════
// §17 生产前再确认 API
// ════════════════════════════════════════════════════════════════════════════

/** GET /api/pre-confirms/page — 再确认记录列表 */
router.get('/pre-confirms/page', authMiddleware, async (req, res) => {
  try {
    const { pageNum=1, pageSize=20, woId } = req.query;
    let sql = 'SELECT pc.*,wo.wo_code,wo.batch_no,wo.product_name FROM mes_pre_confirm pc LEFT JOIN mes_work_order wo ON pc.wo_id=wo.id WHERE pc.deleted=0';
    const p = [];
    if (woId){ sql += ' AND pc.wo_id=?'; p.push(woId); }
    const [cnt] = await db.execute(sql.replace(/SELECT .+FROM/,'SELECT COUNT(*) AS total FROM'), p);
    sql += ' ORDER BY pc.create_time DESC LIMIT ? OFFSET ?';
    p.push(Number(pageSize),(Number(pageNum)-1)*Number(pageSize));
    const [rows] = await db.execute(sql, p);
    // 解析check_items JSON
    rows.forEach(r => {
      try { r.check_items = JSON.parse(r.check_items||'[]'); } catch{ r.check_items = []; }
    });
    ok(res, { list: rows, total: cnt[0].total });
  } catch(e){ fail(res, e.message); }
});

/** POST /api/pre-confirms — 提交生产前再确认 */
router.post('/pre-confirms', authMiddleware, async (req, res) => {
  try {
    const { woId, taskId, confirmType='PRE', checkItems, allPassed, operatorName } = req.body;
    const [r] = await db.execute(
      `INSERT INTO mes_pre_confirm(wo_id,task_id,confirm_type,check_items,all_passed,operator_name,operator_id,confirm_time)
       VALUES(?,?,?,?,?,?,?,NOW())`,
      [woId, taskId||null, confirmType, JSON.stringify(checkItems||[]), allPassed?1:0, operatorName||'', null]
    );
    await writeAuditLog({
      username: operatorName||'', module: 'PRE_CONFIRM', action: 'SUBMIT',
      targetType: 'mes_pre_confirm', targetId: r.insertId,
      detail: `生产前再确认: ${allPassed?'全部通过':'有项目未通过'} 共${checkItems?.length||0}项`,
      riskLevel: allPassed ? 'LOW' : 'HIGH'
    });
    ok(res, { id: r.insertId, allPassed });
  } catch(e){ fail(res, e.message); }
});

// ════════════════════════════════════════════════════════════════════════════
// §15 审计追踪 API — ALCOA+合规
// ════════════════════════════════════════════════════════════════════════════

/** GET /api/audit-logs/page — 审计日志列表（带ALCOA+分析） */
router.get('/audit-logs/page', authMiddleware, async (req, res) => {
  try {
    const { pageNum=1, pageSize=50, module, action, username,
            riskLevel, startTime, endTime, targetType } = req.query;
    let sql = 'SELECT * FROM sys_audit_log WHERE 1=1';
    const p = [];
    if (module)     { sql += ' AND module=?';            p.push(module); }
    if (action)     { sql += ' AND action LIKE ?';       p.push(`%${action}%`); }
    if (username)   { sql += ' AND username LIKE ?';     p.push(`%${username}%`); }
    if (riskLevel)  { sql += ' AND risk_level=?';        p.push(riskLevel); }
    if (targetType) { sql += ' AND target_type=?';       p.push(targetType); }
    if (startTime)  { sql += ' AND create_time >= ?';    p.push(startTime); }
    if (endTime)    { sql += ' AND create_time <= ?';    p.push(endTime); }
    const [cnt] = await db.execute(sql.replace('SELECT *','SELECT COUNT(*) AS total'), p);
    sql += ' ORDER BY create_time DESC LIMIT ? OFFSET ?';
    p.push(Number(pageSize),(Number(pageNum)-1)*Number(pageSize));
    const [rows] = await db.execute(sql, p);
    // ALCOA+统计分析
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) AS total_logs,
        SUM(CASE WHEN alcoa_flag!='' AND alcoa_flag IS NOT NULL THEN 1 ELSE 0 END) AS alcoa_issues,
        SUM(CASE WHEN risk_level='CRITICAL' THEN 1 ELSE 0 END) AS critical_cnt,
        SUM(CASE WHEN risk_level='HIGH' THEN 1 ELSE 0 END) AS high_cnt,
        COUNT(DISTINCT username) AS user_cnt,
        COUNT(DISTINCT module) AS module_cnt
      FROM sys_audit_log WHERE 1=1
      ${startTime ? 'AND create_time >= "'+startTime+'"' : ''}
      ${endTime   ? 'AND create_time <= "'+endTime+'"'   : ''}
    `);
    ok(res, { list: rows, total: cnt[0].total, alcoaStats: stats[0] });
  } catch(e){ fail(res, e.message); }
});

/** GET /api/audit-logs/alcoa-check — ALCOA+合规检查报告 */
router.get('/audit-logs/alcoa-check', authMiddleware, async (req, res) => {
  try {
    const [issues] = await db.execute(`
      SELECT id,username,module,action,target_id,alcoa_flag,create_time
      FROM sys_audit_log
      WHERE alcoa_flag IS NOT NULL AND alcoa_flag!=''
      ORDER BY create_time DESC LIMIT 100
    `);
    const flagCounts = {};
    issues.forEach(r => {
      (r.alcoa_flag||'').split(';').filter(Boolean).forEach(f => {
        const key = f.split(':')[0];
        flagCounts[key] = (flagCounts[key]||0)+1;
      });
    });
    const alcoaPrinciples = [
      { key:'Attributable', label:'可归属', desc:'每条记录必须关联具体操作人', count: flagCounts['Attributable']||0 },
      { key:'Legible',      label:'清晰易读', desc:'操作详情必须可读',            count: flagCounts['Legible']||0 },
      { key:'Contemporaneous', label:'同步记录', desc:'操作与记录时间一致',        count: flagCounts['Contemporaneous']||0 },
      { key:'Original',     label:'原始记录', desc:'目标记录ID不可为空',           count: flagCounts['Original']||0 },
      { key:'Accurate',     label:'准确',    desc:'数据内容准确完整',              count: flagCounts['Accurate']||0 },
      { key:'Complete',     label:'完整',    desc:'记录字段齐全无缺',              count: flagCounts['Complete']||0 },
    ];
    ok(res, { issues: issues.slice(0,20), alcoaPrinciples, totalIssues: issues.length });
  } catch(e){ fail(res, e.message); }
});

/** POST /api/audit-logs — 手动写入审计日志（前端直接调用） */
router.post('/audit-logs', authMiddleware, async (req, res) => {
  try {
    const { userId, username, factoryCode, module, action,
            targetType, targetId, detail, ipAddress,
            beforeValue, afterValue, riskLevel } = req.body;
    await writeAuditLog({ userId, username, factoryCode, module, action,
      targetType, targetId, detail, ipAddress,
      beforeVal: beforeValue, afterVal: afterValue, riskLevel });
    ok(res, { msg: '审计日志已记录' });
  } catch(e){ fail(res, e.message); }
});

/** GET /api/audit-logs/modules — 统计各模块操作量 */
router.get('/audit-logs/modules', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT module, COUNT(*) AS cnt, 
             SUM(CASE WHEN risk_level IN('HIGH','CRITICAL') THEN 1 ELSE 0 END) AS high_risk_cnt
      FROM sys_audit_log GROUP BY module ORDER BY cnt DESC
    `);
    ok(res, rows);
  } catch(e){ fail(res, e.message); }
});

module.exports = router;
