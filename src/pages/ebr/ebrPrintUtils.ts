/**
 * ebrPrintUtils.ts — 电子批记录打印工具
 * 通过 iframe + HTML + window.print() 实现打印，无需额外依赖
 * 字段映射：EbrRecord（ebrData.ts）的 routingSteps / routingQtyTotal / goodQtyTotal 等
 */
import type { EbrRecord, EbrRoutingStep } from './ebrData';

const STAGE_NAME_MAP: Record<string, string> = {
  PRE_CLEAN:   '前清场',
  CHECK_IN:    '进站',
  MAT_VERIFY:  '物料一致确认',
  FIRST_PIECE: '首件确认',
  DATA_COLLECT:'数据采集',
  SELF_CHECK:  '自检',
  POST_CLEAN:  '后清场',
  REPORT:      '报工',
  CHECK_OUT:   '出站',
};

const STAGE_ORDER = ['PRE_CLEAN', 'CHECK_IN', 'MAT_VERIFY', 'FIRST_PIECE', 'DATA_COLLECT', 'SELF_CHECK', 'POST_CLEAN', 'REPORT', 'CHECK_OUT'];

function stepStatusLabel(s: string): string {
  const m: Record<string, string> = {
    COMPLETED:   '✓ 已完成',
    IN_PROGRESS: '▶ 进行中',
    PENDING:     '○ 待执行',
    DEVIATION:   '⚠ 偏差',
    SKIPPED:     '— 跳过',
  };
  return m[s] ?? s;
}

function stageStatusLabel(s: string): string {
  const m: Record<string, string> = {
    completed:   '✓ 已完成',
    in_progress: '▶ 进行中',
    pending:     '○ 待执行',
    skipped:     '— 跳过',
  };
  return m[s] ?? s;
}

function ebrStatusLabel(s: string): string {
  const m: Record<string, string> = {
    IN_PROGRESS: '生产中',
    COMPLETED:   '待审核',
    REVIEWED:    '已审核',
    APPROVED:    '已批准放行',
    REJECTED:    '已驳回',
  };
  return m[s] ?? s;
}

function inspTypeLabel(t: string): string {
  const m: Record<string, string> = {
    IQC:         '来料检验',
    IPQC_FIRST:  '首件检验',
    IPQC_SELF:   '过程检验',
    FQC:         '成品检验',
    OQC:         '出货检验',
    SPECIAL:     '特殊检验',
  };
  return m[t] ?? t;
}

export function printEbr(record: EbrRecord): void {
  const iframeId = `ebr_print_${Date.now()}`;
  const iframe   = document.createElement('iframe');
  iframe.id      = iframeId;
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) return;

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'SimSun', '宋体', Arial, sans-serif;
      font-size: 11px;
      color: #000;
      background: #fff;
      padding: 12mm 14mm;
    }
    .cover { text-align: center; padding: 20mm 0; border-bottom: 2px solid #000; margin-bottom: 8mm; }
    .cover h1 { font-size: 22px; font-weight: 900; letter-spacing: 4px; margin-bottom: 6mm; }
    .cover h2 { font-size: 16px; font-weight: 700; margin-bottom: 4mm; }
    .cover .ebr-no { font-size: 14px; font-family: monospace; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 6mm; }
    th, td { border: 1px solid #555; padding: 3px 6px; vertical-align: top; }
    th { background: #e8e8e8; font-weight: 700; text-align: center; }
    td.label { background: #f5f5f5; font-weight: 600; width: 90px; }
    .section-title {
      font-size: 13px; font-weight: 700; margin: 6mm 0 2mm;
      border-left: 4px solid #000; padding-left: 6px;
    }
    .kpi-row { display: flex; gap: 4mm; margin-bottom: 4mm; }
    .kpi-box { flex: 1; border: 1px solid #aaa; text-align: center; padding: 3mm; }
    .kpi-box .val { font-size: 18px; font-weight: 900; }
    .kpi-box .lbl { font-size: 10px; color: #555; margin-top: 1mm; }
    .sig-row { display: flex; gap: 6mm; margin-top: 4mm; flex-wrap: wrap; }
    .sig-box { flex: 1; min-width: 30mm; border: 1px solid #aaa; padding: 3mm; min-height: 18mm; }
    .sig-box .role { font-weight: 700; font-size: 11px; margin-bottom: 2mm; }
    .sig-box .name { font-size: 11px; }
    .sig-box .time { font-size: 9px; color: #555; margin-top: 1mm; }
    .compliance { border: 1px solid #aaa; padding: 3mm; margin-top: 6mm; font-size: 10px; color: #333; }
    .compliance strong { display: block; margin-bottom: 1mm; }
    .deviation-box { border: 1px solid #f90; background: #fffbe6; padding: 3mm; margin-bottom: 3mm; }
    .page-break { page-break-before: always; }
    @page { margin: 0; size: A4; }
    @media print {
      body { padding: 8mm 10mm; }
    }
  `;

  // ── 工序明细行 ────────────────────────────────────────────────────
  const opRows = record.routingSteps.map((step: EbrRoutingStep) => {
    // PAD 阶段快照
    const stageRows = step.stagesSnapshot && step.stagesSnapshot.length > 0
      ? step.stagesSnapshot.map(s => `
          <tr>
            <td style="padding-left:16px;font-size:10px">${STAGE_NAME_MAP[s.code] ?? s.code}</td>
            <td style="text-align:center;font-size:10px">${stageStatusLabel(s.status)}</td>
            <td style="font-size:10px">${s.startTime ?? '—'}</td>
            <td style="font-size:10px">${s.endTime ?? '—'}</td>
            <td style="font-size:10px">${s.operator ?? '—'}</td>
          </tr>`).join('')
      : '';

    // 工艺参数
    const params = step.keyData && Object.keys(step.keyData).length > 0
      ? Object.entries(step.keyData).map(([k, v]) => `${k}: ${v}`).join('；')
      : '—';

    return `
      <tr style="background:#f5f5f5">
        <td colspan="5" style="font-weight:700">
          ${step.opNo} ${step.opName}（${step.workCenter} — ${step.stage}）
          ${step.isKeyOp ? '&nbsp;[关键工序]' : ''}
          ${step.mandatoryInspection ? '&nbsp;[必检]' : ''}
          &nbsp;&nbsp;状态：${stepStatusLabel(step.status)}
          &nbsp;&nbsp;开始：${step.startedAt ?? '—'}&nbsp;&nbsp;完成：${step.completedAt ?? '—'}
        </td>
      </tr>
      <tr>
        <td colspan="2" style="font-size:10px">
          操作员：${step.operatorName ?? '—'}
          &nbsp;&nbsp;设备：${step.equipName ?? (step.equipId ?? '—')}
        </td>
        <td colspan="3" style="font-size:10px">
          完工：${step.reportQty ?? '—'}件&nbsp;&nbsp;
          合格：${step.goodQty ?? '—'}件&nbsp;&nbsp;
          报废：${step.scrapQty ?? '—'}件
        </td>
      </tr>
      ${stageRows}
      <tr>
        <td colspan="5" style="font-size:10px;color:#555">工艺参数：${params}</td>
      </tr>
    `;
  }).join('');

  // ── 检验记录行 ───────────────────────────────────────────────────
  const inspRows = record.inspectionRecords.map(ir => `
    <tr>
      <td style="font-size:10px;font-family:monospace">${ir.taskNo}</td>
      <td style="font-size:10px">${inspTypeLabel(ir.schemeType)}</td>
      <td style="font-size:10px">${ir.schemeName}</td>
      <td style="font-size:10px">${ir.opNo ?? '—'}</td>
      <td style="text-align:center;font-size:10px">${ir.sampleQty}/${ir.totalQty}</td>
      <td style="font-size:10px">${ir.inspectorName ?? '—'}</td>
      <td style="text-align:center;font-size:10px;font-weight:700;color:${ir.conclusion === 'PASS' ? '#389e0d' : ir.conclusion === 'FAIL' ? '#cf1322' : '#888'}">
        ${ir.conclusion === 'PASS' ? '✓ 通过' : ir.conclusion === 'FAIL' ? '✗ 失败' : '待检'}
      </td>
      <td style="font-size:10px">${ir.releaseStatus === 'RELEASED' ? '已放行' : ir.releaseStatus === 'REJECTED' ? '已拒绝' : '待放行'}</td>
      <td style="font-size:10px;color:#cf1322">${ir.failItems && ir.failItems.length > 0 ? ir.failItems.join('、') : '—'}</td>
    </tr>
  `).join('');

  // ── 偏差记录 ─────────────────────────────────────────────────────
  const deviationSection = record.deviations.length > 0
    ? record.deviations.map(d => `
        <div class="deviation-box">
          <strong>[${d.type}] ${d.opNo} ${d.opName}</strong>
          <div>发现：${d.discoveredAt} by ${d.discoveredBy}</div>
          <div>描述：${d.description}</div>
          <div>处置：${d.disposition}</div>
          ${d.closedAt ? `<div>关闭：${d.closedAt} by ${d.closedBy ?? '—'}</div>` : '<div>状态：处理中</div>'}
        </div>
      `).join('')
    : '<p style="color:#999;padding:2mm">无偏差记录</p>';

  // ── 签名行 ───────────────────────────────────────────────────────
  const sigBoxes = record.signatures.map(sig => `
    <div class="sig-box">
      <div class="role">${sig.role}</div>
      <div class="name">${sig.name}</div>
      <div class="time">${sig.signedAt}</div>
      ${sig.remark ? `<div class="time">${sig.remark}</div>` : ''}
    </div>
  `).join('');

  // ── 任务分配 ─────────────────────────────────────────────────────
  const taskRows = record.tasks.map(t => `
    <tr>
      <td style="font-size:10px;font-family:monospace">${t.taskNo}</td>
      <td style="font-size:10px">${t.workCenter}</td>
      <td style="font-size:10px">${t.shiftName} / ${t.team}</td>
      <td style="font-size:10px">${t.operator}</td>
      <td style="font-size:10px">${t.stationScope}</td>
      <td style="text-align:center;font-size:10px">${t.reportQty ?? '—'}</td>
      <td style="text-align:center;font-size:10px">${t.scrapQty ?? '—'}</td>
      <td style="font-size:10px">${t.status === 'DONE' ? '✓ 已完成' : t.status === 'IN_PROGRESS' ? '▶ 进行中' : '○ 待执行'}</td>
    </tr>
  `).join('');

  // ── 审核栏 ───────────────────────────────────────────────────────
  const auditSection = `
    <table>
      <tr>
        <td class="label">QA 审核</td>
        <td>${record.reviewedBy ?? '待审核'}</td>
        <td class="label">审核时间</td>
        <td>${record.reviewedAt ?? '—'}</td>
        <td class="label">审核意见</td>
        <td>${record.reviewRemark ?? '—'}</td>
      </tr>
      <tr>
        <td class="label">批准放行</td>
        <td>${record.approvedBy ?? '待批准'}</td>
        <td class="label">批准时间</td>
        <td>${record.approvedAt ?? '—'}</td>
        <td class="label">批准意见</td>
        <td>${record.approveRemark ?? '—'}</td>
      </tr>
      ${record.rejectReason ? `
      <tr>
        <td class="label" style="color:red">驳回原因</td>
        <td colspan="5" style="color:red">${record.rejectReason}</td>
      </tr>` : ''}
    </table>
  `;

  const html = `<!DOCTYPE html><html lang="zh-CN"><head>
    <meta charset="UTF-8"><title>电子批记录 ${record.ebrNo}</title>
    <style>${css}</style>
  </head><body>

    <!-- 封面 -->
    <div class="cover">
      <h1>电子批记录（EBR）</h1>
      <h2>Electronic Batch Record</h2>
      <div class="ebr-no">${record.ebrNo}</div>
      <div style="margin-top:6mm;font-size:12px">
        状态：${ebrStatusLabel(record.status)} &nbsp;&nbsp;&nbsp; 创建时间：${record.createdAt}
      </div>
      <div style="margin-top:2mm;font-size:11px;color:#555">
        工艺路径：${record.routingCode} &nbsp;&nbsp; BOM版本：${record.bomVersion}
      </div>
    </div>

    <!-- 一、批次产品信息 -->
    <div class="section-title">一、批次产品信息</div>
    <table>
      <tr>
        <td class="label">工单号</td><td>${record.woNo}</td>
        <td class="label">批次号</td><td><strong>${record.batchNo}</strong></td>
        <td class="label">EBR 编号</td><td style="font-family:monospace">${record.ebrNo}</td>
      </tr>
      <tr>
        <td class="label">产品名称</td><td>${record.productName}</td>
        <td class="label">产品规格</td><td>${record.productSpec}</td>
        <td class="label">产品编码</td><td>${record.productCode}</td>
      </tr>
      <tr>
        <td class="label">客户</td><td>${record.customer ?? '—'}</td>
        <td class="label">交货期</td><td>${record.deliveryDate ?? '—'}</td>
        <td class="label">优先级</td><td>${record.priority}</td>
      </tr>
      <tr>
        <td class="label">原材料批号</td><td>${record.materialLotNo ?? '—'}</td>
        <td class="label">原材料规格</td><td>${record.materialSpec ?? '—'}</td>
        <td class="label">IQC结果</td><td>${record.iqcResult ?? '—'}</td>
      </tr>
      <tr>
        <td class="label">手柄批号</td><td>${record.handleLotNo ?? '—'}</td>
        <td class="label">限位批号</td><td>${record.limitLotNo ?? '—'}</td>
        <td class="label">生产订单</td><td>${record.poNo ?? '—'}</td>
      </tr>
      <tr>
        <td class="label">开始时间</td><td>${record.startTime}</td>
        <td class="label">完成时间</td><td>${record.endTime ?? '生产中'}</td>
        <td class="label">更新时间</td><td>${record.updatedAt}</td>
      </tr>
    </table>

    <!-- 二、生产数量汇总 -->
    <div class="section-title">二、生产数量汇总</div>
    <div class="kpi-row">
      <div class="kpi-box"><div class="val">${record.planQtyTotal}</div><div class="lbl">计划数量（件）</div></div>
      <div class="kpi-box"><div class="val">${record.reportQtyTotal}</div><div class="lbl">完工数量（件）</div></div>
      <div class="kpi-box"><div class="val">${record.goodQtyTotal}</div><div class="lbl">合格数量（件）</div></div>
      <div class="kpi-box"><div class="val">${record.scrapQtyTotal}</div><div class="lbl">报废数量（件）</div></div>
      <div class="kpi-box"><div class="val">${record.yieldRate}%</div><div class="lbl">综合良率</div></div>
    </div>

    <!-- 三、任务分配 -->
    ${record.tasks.length > 0 ? `
    <div class="section-title">三、生产任务分配</div>
    <table>
      <thead>
        <tr>
          <th>任务单号</th><th>车间</th><th>班次/班组</th><th>操作员</th>
          <th>工序范围</th><th>完工量</th><th>报废量</th><th>状态</th>
        </tr>
      </thead>
      <tbody>${taskRows}</tbody>
    </table>` : ''}

    <!-- 四、工序执行明细（分页） -->
    <div class="section-title page-break">四、工序执行明细</div>
    ${record.routingSteps.length === 0
      ? '<p style="color:#999;padding:4mm">暂无工序执行记录</p>'
      : `<table>
          <thead>
            <tr>
              <th>工序/阶段</th>
              <th style="width:80px">状态</th>
              <th>开始时间</th>
              <th>结束时间</th>
              <th>操作员</th>
            </tr>
          </thead>
          <tbody>${opRows}</tbody>
        </table>`
    }

    <!-- 五、质量检验记录 -->
    ${record.inspectionRecords.length > 0 ? `
    <div class="section-title">五、质量检验记录</div>
    <table>
      <thead>
        <tr>
          <th>任务编号</th><th>类型</th><th>方案名称</th><th>关联工序</th>
          <th>抽检/总数</th><th>检验员</th><th>结论</th><th>放行</th><th>失败项</th>
        </tr>
      </thead>
      <tbody>${inspRows}</tbody>
    </table>` : ''}

    <!-- 六、偏差记录 -->
    <div class="section-title">六、偏差 / 异常记录</div>
    ${deviationSection}

    <!-- 七、执行签名链 -->
    <div class="section-title">七、执行签名链</div>
    ${record.signatures.length === 0
      ? '<p style="color:#999;padding:4mm">暂无签名记录</p>'
      : `<div class="sig-row">${sigBoxes}</div>`
    }

    <!-- 八、审核与放行 -->
    <div class="section-title">八、审核与放行</div>
    ${auditSection}

    <!-- 合规声明 -->
    <div class="compliance">
      <strong>合规性声明</strong>
      本电子批记录（EBR）由 YonBIP/SY 系统自动生成，记录了批次 ${record.batchNo} 从原料入库到成品出站的完整生产
      执行数据（${record.routingSteps.length} 道工序、${record.inspectionRecords.length} 项检验记录），
      包括操作员电子签名、工艺参数、检验结果等，满足 GMP 第十四章《文件管理》及
      ISO 13485:2016 第4.2条《文件要求》及 21 CFR Part 11《电子记录与电子签名》规定。
      记录一经批准不得修改，如需更正须以偏差报告方式处理。
      <br><br>
      打印时间：${new Date().toLocaleString('zh-CN')} &nbsp;&nbsp;
      系统标识：YonBIP/SY V1.0 &nbsp;&nbsp;
      文件编号：${record.ebrNo}
    </div>

  </body></html>`;

  doc.open();
  doc.write(html);
  doc.close();

  // 等待资源加载后打印
  setTimeout(() => {
    iframe.contentWindow?.print();
    // 打印完毕后延迟销毁
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  }, 500);
}
