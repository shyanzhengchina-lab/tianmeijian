/**
 * printUtils.ts — MES打印工具函数
 *
 * 提供两种打印能力：
 * 1. printQcRecords()  — QC检验记录打印（支持单张/双张）
 * 2. printFloatUpdate() — 浮漂更新页打印（出站时可选打印）
 *
 * 实现方式：动态创建隐藏 iframe，注入 HTML+打印CSS，调用 window.print()，
 * 打印完毕后自动销毁 iframe。无需额外依赖。
 */

// ── 类型定义 ─────────────────────────────────────────────────────────

export interface QcRowData {
  passQty: number | null;
  ngQty: number | null;
  ngDesc: string;
  result: 'pass' | 'fail' | 'pending';
  inspector: string;
  inspectDate: string;
}

export interface QcRecord {
  recordNo: string;
  title: string;
  docNo: string;
  deviceLabel: string;
  device: string;
  sampleRule: string;
  passStandard: string;
  inspectMethod?: string;
  sendQty: number | null;
  conclusion: '合格' | '不合格' | '';
  qcSign: string;
  reviewSign: string;
  submittedAt?: string;
  rows: Array<{
    key: string;
    opName: string;
    item: string;
    std: string;
    stdParam: string;
    data: QcRowData;
  }>;
}

export interface WorkOrderInfo {
  productName: string;
  productSpec: string;
  productLength?: string;
  batchNo: string;
  woNo: string;
  planQty: number;
}

export interface FloatUpdateInfo {
  workOrder: WorkOrderInfo;
  opName: string;
  opCode: string;
  outQty: number;
  nextOpName?: string;
  outTime: string;
  operator: string;
  floatBarcode: string;
  receiver?: string;
}

// ── 共享打印CSS ──────────────────────────────────────────────────────

const BASE_PRINT_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'SimSun', '宋体', Arial, sans-serif;
    font-size: 12px;
    color: #000;
    background: #fff;
    padding: 12mm 14mm;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    border: 1px solid #333;
    padding: 4px 6px;
    vertical-align: middle;
    word-break: break-all;
  }
  th {
    background: #e8e8e8;
    font-weight: bold;
    text-align: center;
  }
  .doc-header {
    text-align: center;
    margin-bottom: 10px;
  }
  .doc-title {
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 2px;
    margin-bottom: 4px;
  }
  .doc-meta {
    font-size: 11px;
    color: #444;
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .section-title {
    font-weight: bold;
    background: #d9d9d9;
    text-align: center;
  }
  .result-pass { color: #006400; font-weight: bold; }
  .result-fail { color: #cc0000; font-weight: bold; }
  .conclusion-box {
    border: 2px solid #333;
    display: inline-block;
    padding: 3px 14px;
    font-size: 14px;
    font-weight: bold;
    margin-right: 8px;
  }
  .sign-row {
    display: flex;
    gap: 40px;
    margin-top: 6px;
  }
  .sign-item {
    flex: 1;
    border-bottom: 1px solid #555;
    min-height: 28px;
    padding-bottom: 2px;
    font-size: 12px;
  }
  .page-break { page-break-before: always; }
  @media print {
    body { padding: 8mm 10mm; }
  }
`;

// ── 辅助函数 ─────────────────────────────────────────────────────────

function resultLabel(r: 'pass' | 'fail' | 'pending'): string {
  if (r === 'pass') return '<span class="result-pass">✓ 合格</span>';
  if (r === 'fail') return '<span class="result-fail">✗ 不合格</span>';
  return '待检';
}

function conclusionLabel(c: string): string {
  if (c === '合格') return '<span class="result-pass">合格</span>';
  if (c === '不合格') return '<span class="result-fail">不合格</span>';
  return '';
}

/** 执行打印：将HTML注入隐藏iframe并触发打印 */
function doPrint(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:0;height:0;border:none;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8">
    <title>YonBIP/SY打印</title>
    <style>${BASE_PRINT_CSS}</style>
  </head><body>${html}</body></html>`);
  doc.close();

  // 等待资源加载后打印
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // 打印对话框关闭后销毁 iframe
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 200);
  };

  // 兜底：如果 onload 未触发
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 1500);
    } catch (_) { /* ignore */ }
  }, 500);
}

// ── 1. QC 检验记录打印 ────────────────────────────────────────────────

function renderQcRecord(rec: QcRecord, wo: WorkOrderInfo, pageBreak: boolean): string {
  const rowsHtml = rec.rows.map((row, idx) => `
    <tr>
      <td style="text-align:center">${idx + 1}</td>
      <td style="text-align:center">${row.opName}</td>
      <td style="text-align:center">${row.item}</td>
      <td>${row.std}</td>
      <td style="text-align:center">${row.data.passQty ?? '-'}</td>
      <td style="text-align:center">${row.data.ngQty ?? '-'}</td>
      <td style="text-align:center">${row.data.ngDesc || '-'}</td>
      <td style="text-align:center">${resultLabel(row.data.result)}</td>
      <td style="text-align:center">${row.data.inspector || '-'}</td>
    </tr>
  `).join('');

  return `
    ${pageBreak ? '<div class="page-break"></div>' : ''}
    <div class="doc-header">
      <div class="doc-title">${rec.title}</div>
    </div>
    <div class="doc-meta">
      <span>文件编号：${rec.docNo}</span>
      <span>记录编号：${rec.recordNo}</span>
      <span>日期：${rec.submittedAt ?? new Date().toLocaleString('zh-CN')}</span>
    </div>

    <!-- 产品信息 -->
    <table style="margin-bottom:8px">
      <tr>
        <th style="width:12%">产品名称</th>
        <td style="width:22%">${wo.productName}</td>
        <th style="width:10%">规格型号</th>
        <td style="width:18%">${wo.productSpec}</td>
        <th style="width:10%">批次号</th>
        <td>${wo.batchNo}</td>
      </tr>
      <tr>
        <th>工单号</th>
        <td>${wo.woNo}</td>
        <th>计划数量</th>
        <td>${wo.planQty} 支</td>
        <th>送检数量</th>
        <td>${rec.sendQty ?? '-'} 支</td>
      </tr>
      <tr>
        <th>${rec.deviceLabel}</th>
        <td colspan="3">${rec.device}</td>
        <th>抽样方案</th>
        <td>${rec.sampleRule}</td>
      </tr>
      ${rec.inspectMethod ? `
      <tr>
        <th>检验方法</th>
        <td colspan="5">${rec.inspectMethod}</td>
      </tr>` : ''}
      <tr>
        <th>合格判定</th>
        <td colspan="5">${rec.passStandard}</td>
      </tr>
    </table>

    <!-- 检验明细 -->
    <table style="margin-bottom:8px">
      <thead>
        <tr>
          <th style="width:5%">序号</th>
          <th style="width:14%">工序名称</th>
          <th style="width:10%">检验项目</th>
          <th style="width:22%">检验标准要求</th>
          <th style="width:8%">合格数</th>
          <th style="width:8%">不合格数</th>
          <th style="width:13%">不合格描述</th>
          <th style="width:10%">判定结果</th>
          <th style="width:10%">检验员</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <!-- 综合结论 -->
    <table style="margin-bottom:8px">
      <tr>
        <th style="width:15%">综合检验结论</th>
        <td>
          <span class="conclusion-box">${conclusionLabel(rec.conclusion)}</span>
          ${rec.conclusion === '合格' ? '所有抽检项目均满足要求' : rec.conclusion === '不合格' ? '存在不合格项，需进行处置' : '-'}
        </td>
      </tr>
    </table>

    <!-- 签名栏 -->
    <div class="sign-row">
      <div class="sign-item">检验员（QC）：${rec.qcSign || ''}&nbsp;&nbsp;&nbsp;&nbsp;日期：${rec.submittedAt?.slice(0, 10) ?? ''}</div>
      <div class="sign-item">复核员（QA）：${rec.reviewSign || ''}（如适用）&nbsp;&nbsp;&nbsp;&nbsp;日期：</div>
      <div class="sign-item">备注：以上记录独立存档，不纳入批生产记录。</div>
    </div>
    <div style="margin-top:6px; font-size:10px; color:#666;">
      关联批次号：${wo.batchNo} &nbsp;|&nbsp; 本记录由 YonBIP/SY 系统自动生成
    </div>
  `;
}

/**
 * 打印 QC 检验记录（支持单张和双张）
 */
export function printQcRecords(records: QcRecord[], workOrder: WorkOrderInfo): void {
  const html = records
    .map((rec, i) => renderQcRecord(rec, workOrder, i > 0))
    .join('');
  doPrint(html);
}

// ── 2. 浮漂更新页打印 ─────────────────────────────────────────────────

/**
 * 打印出站浮漂更新页
 */
export function printFloatUpdate(info: FloatUpdateInfo): void {
  const now = new Date().toLocaleString('zh-CN');
  const html = `
    <div class="doc-header">
      <div class="doc-title">生产流程浮漂更新页</div>
      <div style="font-size:12px;color:#555;margin-top:4px">
        工序出站记录 — YonBIP/SY 系统自动生成
      </div>
    </div>

    <table style="margin-bottom:12px">
      <tr>
        <th style="width:16%">产品名称</th>
        <td style="width:28%">${info.workOrder.productName}</td>
        <th style="width:14%">规格型号</th>
        <td>${info.workOrder.productSpec}</td>
      </tr>
      <tr>
        <th>批次号</th>
        <td>${info.workOrder.batchNo}</td>
        <th>工单号</th>
        <td>${info.workOrder.woNo}</td>
      </tr>
      <tr>
        <th>浮漂条码</th>
        <td colspan="3" style="font-family:monospace;font-size:14px;font-weight:bold">
          ${info.floatBarcode}
        </td>
      </tr>
    </table>

    <table style="margin-bottom:12px">
      <thead>
        <tr>
          <th colspan="4" class="section-title" style="font-size:14px;padding:6px">出站信息</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th style="width:18%">当前完成工序</th>
          <td style="width:30%;font-weight:bold;font-size:14px">${info.opName}</td>
          <th style="width:16%">工序编码</th>
          <td>${info.opCode}</td>
        </tr>
        <tr>
          <th>出站数量</th>
          <td style="font-size:16px;font-weight:bold;color:#006400">${info.outQty} 件</td>
          <th>出站时间</th>
          <td>${info.outTime || now}</td>
        </tr>
        <tr>
          <th>下道工序</th>
          <td style="font-weight:bold;color:#00008B">${info.nextOpName || '全部完工 ✓'}</td>
          <th>操作员</th>
          <td>${info.operator}</td>
        </tr>
        ${info.receiver ? `
        <tr>
          <th>接收人</th>
          <td colspan="3">${info.receiver}</td>
        </tr>` : ''}
      </tbody>
    </table>

    <!-- 流转确认栏 -->
    <table style="margin-bottom:10px">
      <thead>
        <tr><th colspan="4" class="section-title">流转确认</th></tr>
      </thead>
      <tbody>
        <tr>
          <th style="width:20%">移交人签名</th>
          <td style="min-height:32px;width:30%">&nbsp;</td>
          <th style="width:20%">接收人签名</th>
          <td style="min-height:32px">&nbsp;</td>
        </tr>
        <tr>
          <th>移交日期</th>
          <td>${now}</td>
          <th>接收日期</th>
          <td>&nbsp;</td>
        </tr>
      </tbody>
    </table>

    <!-- 条码区 -->
    <div style="margin-top:10px;padding:8px;border:1px dashed #888;text-align:center">
      <div style="font-size:10px;color:#888;margin-bottom:4px">浮漂条码（扫描此码可在MES中追溯本批次）</div>
      <div style="font-size:18px;font-family:monospace;font-weight:bold;letter-spacing:3px">
        ${info.floatBarcode}
      </div>
    </div>

    <div style="margin-top:8px;font-size:10px;color:#888;text-align:right">
      打印时间：${now} &nbsp;|&nbsp; YonBIP/SY系统
    </div>
  `;
  doPrint(html);
}
