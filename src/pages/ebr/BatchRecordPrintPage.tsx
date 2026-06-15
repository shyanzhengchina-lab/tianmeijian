/**
 * 批包装记录打印页（SOR-MF-PE-02-05 格式）
 *
 * 功能：PAD完成所有工序后，自动从 execMap 提取数据，生成与
 * 《SOR-MF-PE-02-05 批包装记录（盒装）》完全一致的可打印HTML批记录。
 *
 * 包含2份批记录：
 *   1. 批包装记录（SOR-MF-PE-02-05 §1~§7全部章节）
 *   2. 批生产记录（各工序执行汇总）
 *
 * 数据来源：localStorage bip_pad_exec_map（PAD工序执行写入）
 */
import React, { useState, useMemo, useRef } from 'react';
import {
  Button, Card, Tabs, Tag, Space, Typography, Row, Col,
  Select, Empty, Alert, Divider, Badge, Tooltip, Modal, Input,
} from 'antd';
import {
  PrinterOutlined, FileTextOutlined, SafetyCertificateOutlined,
  CheckCircleOutlined, ClockCircleOutlined, FileDoneOutlined,
  ArrowLeftOutlined, ExperimentOutlined, ToolOutlined,
} from '@ant-design/icons';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { OperationExecution } from '../pad/padExecutionData';
import { GMP_OPERATIONS } from '../pad/padExecutionData';
import type { EbrRecord } from './ebrData';
import { EBR_STORAGE_KEY, loadEbrRecords } from './ebrData';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// ────────────────────────────────────────────────────────────────────────────
//  辅助函数
// ────────────────────────────────────────────────────────────────────────────

/** 从 execMap 取指定工序的 DATA_COLLECT records */
function getDCRecords(execMap: Record<string, OperationExecution>, opCode: string): Record<string, unknown>[] {
  const stage = execMap[opCode]?.stages?.DATA_COLLECT;
  if (!stage || stage.status !== 'completed') return [];
  const data = stage.data as any;
  // DataCollectStage 写入 dc_table 字段
  if (Array.isArray(data?.dc_table)) return data.dc_table;
  if (Array.isArray(data?.records))  return data.records;
  return [];
}

/** 从 execMap 取 PRE_CLEAN 阶段数据 */
function getPreClean(execMap: Record<string, OperationExecution>, opCode: string): Record<string, unknown> {
  return (execMap[opCode]?.stages?.PRE_CLEAN?.data ?? {}) as Record<string, unknown>;
}

/** 从 execMap 取 REPORT 阶段数据 */
function getReport(execMap: Record<string, OperationExecution>, opCode: string) {
  const exec = execMap[opCode];
  if (!exec) return null;
  return {
    finishQty: exec.finishQty ?? 0,
    goodQty:   exec.goodQty   ?? 0,
    badQty:    exec.badQty    ?? 0,
    scrapQty:  exec.scrapQty  ?? 0,
    inTime:    exec.inTime    ?? '—',
    outTime:   exec.outTime   ?? '—',
    operator:  exec.stages?.REPORT?.operator ?? exec.stages?.CHECK_OUT?.operator ?? '—',
    reportData: (exec.stages?.REPORT?.data ?? {}) as Record<string, unknown>,
    reportRecords: exec.reportRecords ?? [],
  };
}

/** 判断工序是否已完成 */
function isOpDone(execMap: Record<string, OperationExecution>, opCode: string): boolean {
  return execMap[opCode]?.status === 'completed';
}

/** 计算物料平衡率 */
function balanceRate(output: number, input: number): string {
  if (!input) return '—';
  return ((output / input) * 100).toFixed(2) + '%';
}

/** 格式化日期 */
function fmtDate(d?: string): string {
  if (!d) return '　　　年　　月　　日';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return `${dt.getFullYear()}年${String(dt.getMonth() + 1).padStart(2, '0')}月${String(dt.getDate()).padStart(2, '0')}日`;
}

/** 格式化时间 */
function fmtTime(t?: string): string {
  if (!t) return '—';
  return t;
}

// 9项生产前再确认映射（与 PreCleanStage.tsx 保持一致）
const PRE_CONFIRM_LABELS: { key: string; label: string }[] = [
  { key: 'pc_wo',       label: '是否有批生产指令文件' },
  { key: 'pc_bom',      label: '是否有上批生产遗留物' },
  { key: 'pc_cert',     label: '是否有清场合格证标志' },
  { key: 'pc_material', label: '所有物料与生产指令相符' },
  { key: 'pc_equip',    label: '工器具已清洁' },
  { key: 'pc_ppe',      label: '生产运行状态标志悬挂正确' },
  { key: 'pc_env',      label: '操作室内温湿度符合规定' },
  { key: 'pc_record',   label: '设备生产运行标志悬挂正确' },
  { key: 'pc_qapprove', label: '操作室内压差是否符合规定' },
];

// ────────────────────────────────────────────────────────────────────────────
//  打印样式（注入到 <style> 中，只在打印时生效）
// ────────────────────────────────────────────────────────────────────────────
const PRINT_STYLE = `
@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  .print-page { page-break-after: always; }
  body { font-family: "宋体", SimSun, serif; font-size: 10pt; }
  .record-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  .record-table th, .record-table td {
    border: 1px solid #000;
    padding: 3px 6px;
    text-align: center;
    vertical-align: middle;
  }
  .record-table th { background: #eee; font-weight: bold; }
  .section-title { font-size: 12pt; font-weight: bold; margin: 8px 0 4px 0; }
  .sign-line { display: inline-block; border-bottom: 1px solid #000; min-width: 80px; }
  .cover-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  .cover-table td { border: 1px solid #000; padding: 6px 12px; }
}
@media screen {
  .record-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .record-table th, .record-table td {
    border: 1px solid #d9d9d9;
    padding: 4px 8px;
    text-align: center;
    vertical-align: middle;
  }
  .record-table th { background: #fafafa; font-weight: 600; }
}
`;

// ────────────────────────────────────────────────────────────────────────────
//  批包装记录封面
// ────────────────────────────────────────────────────────────────────────────
interface CoverProps {
  ebr: EbrRecord | null;
  execMap: Record<string, OperationExecution>;
}

const RecordCover: React.FC<CoverProps> = ({ ebr, execMap }) => {
  const weighReport = getReport(execMap, 'OP-GMP-WEIGH');
  const outerReport = getReport(execMap, 'OP-GMP-OUTERPACK');
  const productionDate = weighReport?.inTime ? fmtDate(weighReport.inTime) : '　　　年　　月　　日';
  const productName = ebr?.productName ?? '　　　　　　　';
  const batchNo     = ebr?.batchNo     ?? '　　　　　　　';
  const planQty     = ebr?.planQtyTotal ?? 0;
  const productSpec = ebr?.productSpec  ?? '';

  return (
    <div className="print-page" style={{ padding: '24px 32px', fontFamily: '宋体, SimSun, serif' }}>
      {/* 页眉 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 16 }}>
        <Text style={{ fontSize: 13 }}>江苏天美健大自然生物工程有限公司</Text>
        <Text style={{ fontSize: 11 }}>编码：SOR-MF-PE-02-05</Text>
      </div>

      {/* 标题 */}
      <div style={{ textAlign: 'center', margin: '20px 0 24px' }}>
        <div style={{ fontSize: 22, fontWeight: 'bold', letterSpacing: 4 }}>批 包 装 记 录（盒装）</div>
      </div>

      {/* 封面信息表 */}
      <table className="cover-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px 16px', width: '30%' }}>品　　名：</td>
            <td style={{ border: '1px solid #000', padding: '8px 16px', width: '70%' }}>{productName}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}>产品批号：</td>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}>{batchNo}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}>生产日期：</td>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}>{productionDate}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}>保质期至：</td>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}>　　　年　　月　　日</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}>包装规格：</td>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}>
              {productSpec || '　　片/粒/瓶，　　瓶/盒'}
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}>待包装量：</td>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}>{planQty > 0 ? `${planQty} 片/粒` : '　　　　　　　'}</td>
          </tr>
        </tbody>
      </table>

      {/* 签发信息 */}
      <table className="cover-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px 16px', width: '25%' }}>起　草　人：</td>
            <td style={{ border: '1px solid #000', padding: '8px 16px', width: '25%' }}></td>
            <td style={{ border: '1px solid #000', padding: '8px 16px', width: '25%' }}>起草日期：</td>
            <td style={{ border: '1px solid #000', padding: '8px 16px', width: '25%' }}>　　年　月　日</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}>审　核　人：</td>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}></td>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}>审核日期：</td>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}>　　年　月　日</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}>审　核　人：</td>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}></td>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}>审核日期：</td>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}>　　年　月　日</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}>批　准　人：</td>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}></td>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}>批准日期：</td>
            <td style={{ border: '1px solid #000', padding: '8px 16px' }}>　　年　月　日</td>
          </tr>
        </tbody>
      </table>

      <div style={{ borderTop: '1px solid #ccc', paddingTop: 8, marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11 }}>生效日期：2024年04月22日</Text>
        <Text style={{ fontSize: 11 }}>版本：V1.0</Text>
      </div>

      {/* 目录 */}
      <div style={{ marginTop: 32 }}>
        <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>目　录</div>
        <div style={{ paddingLeft: 32 }}>
          {[
            '1．批包装指令',
            '2．瓶包线岗位生产记录及清场记录',
            '3．外包装岗位生产记录及清场记录',
            '4．各工序QA监控记录',
            '5．物料平衡表',
            '6．成品检验报告',
            '7．成品放行审核单',
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 8, fontSize: 13, lineHeight: '1.8' }}>{item}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
//  §1 批包装指令
// ────────────────────────────────────────────────────────────────────────────
const Section1Instruction: React.FC<{ ebr: EbrRecord | null; execMap: Record<string, OperationExecution> }> = ({ ebr, execMap }) => {
  const weighReport = getReport(execMap, 'OP-GMP-WEIGH');
  const weighRows   = getDCRecords(execMap, 'OP-GMP-WEIGH');
  const productSpec = ebr?.productSpec ?? '';

  return (
    <div className="print-page" style={{ padding: '16px 32px' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 'bold' }}>江苏天美健大自然生物工程有限公司</div>
        <div style={{ fontSize: 14, marginTop: 4 }}>第 1 章　批包装指令</div>
      </div>

      <table className="record-table" style={{ marginBottom: 16 }}>
        <tbody>
          <tr>
            <th style={{ width: '20%' }}>品名</th>
            <td style={{ width: '30%' }}>{ebr?.productName ?? ''}</td>
            <th style={{ width: '20%' }}>批号</th>
            <td style={{ width: '30%' }}>{ebr?.batchNo ?? ''}</td>
          </tr>
          <tr>
            <th>包装规格</th>
            <td>{productSpec || '　　片/粒/瓶，　　瓶/盒'}</td>
            <th>计划产量</th>
            <td>{ebr?.planQtyTotal ?? '—'} 片/粒</td>
          </tr>
          <tr>
            <th>包装开始时间</th>
            <td>{fmtTime(weighReport?.inTime)}</td>
            <th>包装完成时间</th>
            <td>{fmtTime(getReport(execMap, 'OP-GMP-OUTERPACK')?.outTime)}</td>
          </tr>
          <tr>
            <th>工单编号</th>
            <td>{ebr?.woNo ?? '—'}</td>
            <th>EBR编号</th>
            <td>{ebr?.ebrNo ?? '—'}</td>
          </tr>
        </tbody>
      </table>

      {/* BOM物料清单 */}
      <div style={{ fontWeight: 'bold', marginBottom: 6, fontSize: 13 }}>BOM物料清单（批包装指令）：</div>
      <table className="record-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>物料名称</th>
            <th>物料批号</th>
            <th>处方量(kg)</th>
            <th>实称量(kg)</th>
            <th>复核结果</th>
            <th>称量人</th>
            <th>复核人</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          {weighRows.length > 0 ? weighRows.map((r, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{String(r.material_name ?? '')}</td>
              <td>{String(r.batch_no ?? '')}</td>
              <td>{String(r.plan_qty ?? '')}</td>
              <td>{String(r.actual_qty ?? '')}</td>
              <td>
                <span style={{ color: String(r.balance_check) === '复核一致' ? '#52c41a' : '#f5222d' }}>
                  {String(r.balance_check ?? '')}
                </span>
              </td>
              <td>{String(r.dc_operator ?? weighReport?.operator ?? '　　')}</td>
              <td>　　</td>
              <td></td>
            </tr>
          )) : (
            <tr><td colSpan={9} style={{ color: '#aaa', fontStyle: 'italic' }}>称量配料工序尚未完成，数据待填入</td></tr>
          )}
          <tr>
            <td colSpan={3} style={{ fontWeight: 'bold' }}>合计</td>
            <td style={{ fontWeight: 'bold' }}>
              {weighRows.reduce((s, r) => s + Number(r.plan_qty ?? 0), 0).toFixed(3)} kg
            </td>
            <td style={{ fontWeight: 'bold' }}>
              {weighRows.reduce((s, r) => s + Number(r.actual_qty ?? 0), 0).toFixed(3)} kg
            </td>
            <td colSpan={4}></td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 16 }}>
        <Text style={{ fontSize: 12 }}>
          QA签发：_________________　　　　签发日期：{fmtDate(weighReport?.inTime)}
        </Text>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
//  §2 瓶内包线岗位生产记录及清场记录
// ────────────────────────────────────────────────────────────────────────────
const Section2InnerPack: React.FC<{ ebr: EbrRecord | null; execMap: Record<string, OperationExecution> }> = ({ ebr, execMap }) => {
  const preClean   = getPreClean(execMap, 'OP-GMP-INNERPACK');
  const dcRows     = getDCRecords(execMap, 'OP-GMP-INNERPACK');
  const report     = getReport(execMap, 'OP-GMP-INNERPACK');
  const cleanReport = getReport(execMap, 'OP-GMP-INNERCLEAN');
  const cleanData   = (execMap['OP-GMP-INNERCLEAN']?.stages?.POST_CLEAN?.data ?? {}) as Record<string, unknown>;
  const productSpec = ebr?.productSpec ?? '';

  const preConfirmKeys = PRE_CONFIRM_LABELS;

  return (
    <div className="print-page" style={{ padding: '16px 32px' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 'bold' }}>江苏天美健大自然生物工程有限公司</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>第 2 章　瓶内包线岗位生产记录及清场记录</div>
      </div>

      {/* 基础信息行 */}
      <table className="record-table" style={{ marginBottom: 12 }}>
        <tbody>
          <tr>
            <th style={{ width: '12%' }}>品名</th>
            <td style={{ width: '20%' }}>{ebr?.productName ?? ''}</td>
            <th style={{ width: '12%' }}>规格</th>
            <td style={{ width: '20%' }}>{productSpec || '　　片/粒/瓶'}</td>
            <th style={{ width: '12%' }}>批号</th>
            <td>{ebr?.batchNo ?? ''}</td>
          </tr>
          <tr>
            <th>生产日期</th>
            <td>{fmtDate(report?.inTime)}</td>
            <th>装量</th>
            <td>{dcRows[0] ? `${String(dcRows[0].fill_qty ?? '')} 片/粒/瓶` : '—'}</td>
            <th>规格</th>
            <td>{productSpec || '—'}</td>
          </tr>
        </tbody>
      </table>

      {/* 生产前再确认（9项） */}
      <div style={{ fontWeight: 'bold', fontSize: 13, margin: '10px 0 6px 0' }}>
        生产前再确认（9项）：
      </div>
      <table className="record-table" style={{ marginBottom: 12 }}>
        <thead>
          <tr>
            <th style={{ width: '5%' }}>序号</th>
            <th style={{ width: '55%' }}>确认项目</th>
            <th style={{ width: '20%' }}>确认结果</th>
            <th style={{ width: '20%' }}>备注</th>
          </tr>
        </thead>
        <tbody>
          {preConfirmKeys.map((item, i) => {
            const val = preClean[item.key];
            const yesNo = val === true || val === 'true' ? '是 ✓' : (val === false || val === 'false' ? '否 ✗' : '是□ 否□');
            const color = val === true || val === 'true' ? '#52c41a' : (val === false || val === 'false' ? '#f5222d' : '#666');
            return (
              <tr key={item.key}>
                <td>{i + 1}</td>
                <td style={{ textAlign: 'left' }}>● {item.label}</td>
                <td style={{ color }}>{yesNo}</td>
                <td></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 清场合格证信息 */}
      <table className="record-table" style={{ marginBottom: 12 }}>
        <tbody>
          <tr>
            <th style={{ width: '25%' }}>清场合格证编号</th>
            <td style={{ width: '25%' }}>{String(preClean.cert_no ?? '　　　')}</td>
            <th style={{ width: '25%' }}>签发时间</th>
            <td style={{ width: '25%' }}>{String(preClean.cert_time ?? '　　　')}</td>
          </tr>
          <tr>
            <th>有效期至</th>
            <td>{String(preClean.cert_expire ?? '　　　')} （固体72h）</td>
            <th>QA确认</th>
            <td>签名：_____________</td>
          </tr>
        </tbody>
      </table>

      {/* 操作指令 */}
      <div style={{ fontWeight: 'bold', fontSize: 13, margin: '10px 0 6px 0' }}>操作指令：</div>
      <table className="record-table" style={{ marginBottom: 12 }}>
        <tbody>
          {[
            '领取待内包装胶丸，核对物料标签上的品名、批号、规格、数量。',
            '领取内包装用塑料瓶，干燥剂，瓶标签，核对物料标签上的品名、批号、规格、数量。',
            '理瓶：将领来的包装瓶按顺序摆好，由高速自动理瓶机进行理瓶，保证装瓶时瓶在输送带上状态完好。',
            '放干燥剂：将领来的干燥剂放置于高速塞干燥剂机中，保证干燥剂准确无误的装到包装瓶中。',
            '装粒：将待装瓶的产品倒入电子数粒机的料斗中，启动震动器，使产品均匀落入料盘中，调节、震动的量要小，不宜过快，保证产品准确无误的装到包装瓶中。',
            '旋盖：将领来的包装瓶盖放入高速搓式旋盖机中，保证充分旋盖，旋盖力度适中。',
          ].map((ins, i) => (
            <tr key={i}>
              <td style={{ width: '5%', textAlign: 'center' }}>{i + 1}</td>
              <td style={{ textAlign: 'left', padding: '4px 8px' }}>{ins}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 过程数据：装量检查 */}
      <div style={{ fontWeight: 'bold', fontSize: 13, margin: '10px 0 6px 0' }}>
        过程记录（装量检查，每小时一次）：
      </div>
      <table className="record-table" style={{ marginBottom: 12 }}>
        <thead>
          <tr>
            <th>检查时间</th>
            <th>装量(片/粒)</th>
            <th>装量重(g)</th>
            <th>瓶盖密封</th>
            <th>标签位置</th>
            <th>温度(℃)</th>
            <th>湿度(%)</th>
            <th>检查人</th>
          </tr>
        </thead>
        <tbody>
          {dcRows.length > 0 ? dcRows.map((r, i) => (
            <tr key={i}>
              <td>{String(r.check_time ?? '')}</td>
              <td>{String(r.fill_qty ?? '')}</td>
              <td>{String(r.fill_weight ?? '')}</td>
              <td style={{ color: String(r.seal_check) === '合格' ? '#52c41a' : '#f5222d' }}>
                {String(r.seal_check ?? '')}
              </td>
              <td style={{ color: String(r.label_check) === '合格' ? '#52c41a' : '#f5222d' }}>
                {String(r.label_check ?? '')}
              </td>
              <td>{String(r.temp ?? '')}</td>
              <td>{String(r.humidity ?? '')}</td>
              <td>{String(r.dc_operator ?? report?.operator ?? '　　')}</td>
            </tr>
          )) : (
            Array(3).fill(0).map((_, i) => (
              <tr key={i}>
                <td>　　</td><td>　　</td><td>　　</td><td>是□ 否□</td>
                <td>是□ 否□</td><td>　　</td><td>　　</td><td>　　</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 产量汇总 */}
      <table className="record-table" style={{ marginBottom: 12 }}>
        <tbody>
          <tr>
            <th style={{ width: '20%' }}>领取待内包装半成品重量</th>
            <td style={{ width: '30%' }}>{String((execMap['OP-GMP-INNERPACK']?.stages?.MAT_VERIFY?.data as any)?.mat_qty ?? '　　')} kg</td>
            <th style={{ width: '20%' }}>装量</th>
            <td style={{ width: '30%' }}>{dcRows[0] ? `${String(dcRows[0].fill_qty ?? '')} 片/粒/瓶` : '　　'}</td>
          </tr>
          <tr>
            <th>生产开始时间</th>
            <td>{fmtTime(report?.inTime)}</td>
            <th>生产结束时间</th>
            <td>{fmtTime(report?.outTime)}</td>
          </tr>
          <tr>
            <th>完工数量</th>
            <td style={{ color: '#1677ff', fontWeight: 'bold' }}>{report?.finishQty ?? '　　'} 瓶</td>
            <th>合格数量</th>
            <td style={{ color: '#52c41a', fontWeight: 'bold' }}>{report?.goodQty ?? '　　'} 瓶</td>
          </tr>
          <tr>
            <th>不合格数量</th>
            <td style={{ color: report?.badQty ? '#f5222d' : undefined }}>{report?.badQty ?? '　　'} 瓶</td>
            <th>报废数量</th>
            <td>{report?.scrapQty ?? '　　'} 瓶</td>
          </tr>
          <tr>
            <th>操作人签名</th>
            <td>{report?.operator ?? '　　　　'}</td>
            <th>班组长复核</th>
            <td>签名：_____________</td>
          </tr>
        </tbody>
      </table>

      {/* 清场记录 */}
      <div style={{ fontWeight: 'bold', fontSize: 13, margin: '10px 0 6px 0' }}>
        清场记录（内包清场 OP-GMP-INNERCLEAN）：
      </div>
      <table className="record-table">
        <tbody>
          <tr>
            <th style={{ width: '20%' }}>清场开始时间</th>
            <td style={{ width: '30%' }}>{String(cleanData.clean_start ?? cleanReport?.inTime ?? '　　')}</td>
            <th style={{ width: '20%' }}>清场结束时间</th>
            <td style={{ width: '30%' }}>{String(cleanData.clean_end ?? cleanReport?.outTime ?? '　　')}</td>
          </tr>
          <tr>
            <th>清场人签名</th>
            <td>{String(cleanData.clean_operator ?? cleanReport?.operator ?? '　　')}</td>
            <th>班组长签名</th>
            <td>_____________</td>
          </tr>
          <tr>
            <th>QA检查签名</th>
            <td>_____________</td>
            <th>清场合格证编号</th>
            <td>{String(cleanData.cert_no ?? '　　　')}</td>
          </tr>
          <tr>
            <th>清场结论</th>
            <td colSpan={3} style={{ color: '#52c41a', fontWeight: 'bold' }}>
              {isOpDone(execMap, 'OP-GMP-INNERCLEAN') ? '✓ 清场合格' : '待清场'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
//  §3 外包装岗位生产记录及清场记录
// ────────────────────────────────────────────────────────────────────────────
const Section3OuterPack: React.FC<{ ebr: EbrRecord | null; execMap: Record<string, OperationExecution> }> = ({ ebr, execMap }) => {
  const preClean = getPreClean(execMap, 'OP-GMP-OUTERPACK');
  const dcRows   = getDCRecords(execMap, 'OP-GMP-OUTERPACK');
  const report   = getReport(execMap, 'OP-GMP-OUTERPACK');
  const matVerifyData = (execMap['OP-GMP-OUTERPACK']?.stages?.MAT_VERIFY?.data ?? {}) as Record<string, unknown>;
  const productSpec = ebr?.productSpec ?? '';

  return (
    <div className="print-page" style={{ padding: '16px 32px' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 'bold' }}>江苏天美健大自然生物工程有限公司</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>第 3 章　外包装岗位生产记录及清场记录</div>
      </div>

      {/* 基础信息 */}
      <table className="record-table" style={{ marginBottom: 12 }}>
        <tbody>
          <tr>
            <th style={{ width: '12%' }}>品名</th>
            <td style={{ width: '20%' }}>{ebr?.productName ?? ''}</td>
            <th style={{ width: '12%' }}>规格</th>
            <td style={{ width: '20%' }}>{productSpec || '　　瓶/盒'}</td>
            <th style={{ width: '12%' }}>批号</th>
            <td>{ebr?.batchNo ?? ''}</td>
          </tr>
          <tr>
            <th>生产日期</th>
            <td>{fmtDate(report?.inTime)}</td>
            <th>包材版本</th>
            <td>{String(matVerifyData.mat_version ?? '—')}</td>
            <th>外包材批号</th>
            <td>{String(matVerifyData.batch_no ?? '—')}</td>
          </tr>
        </tbody>
      </table>

      {/* 生产前再确认 */}
      <div style={{ fontWeight: 'bold', fontSize: 13, margin: '10px 0 6px 0' }}>
        外包装生产前再确认：
      </div>
      <table className="record-table" style={{ marginBottom: 12 }}>
        <thead>
          <tr>
            <th style={{ width: '5%' }}>序号</th>
            <th style={{ width: '55%' }}>确认项目</th>
            <th style={{ width: '20%' }}>确认结果</th>
            <th style={{ width: '20%' }}>备注</th>
          </tr>
        </thead>
        <tbody>
          {PRE_CONFIRM_LABELS.map((item, i) => {
            const val = preClean[item.key];
            const yesNo = val === true || val === 'true' ? '是 ✓' : (val === false || val === 'false' ? '否 ✗' : '是□ 否□');
            const color = val === true || val === 'true' ? '#52c41a' : (val === false || val === 'false' ? '#f5222d' : '#666');
            return (
              <tr key={item.key}>
                <td>{i + 1}</td>
                <td style={{ textAlign: 'left' }}>● {item.label}</td>
                <td style={{ color }}>{yesNo}</td>
                <td></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 外包材核对 */}
      <div style={{ fontWeight: 'bold', fontSize: 13, margin: '10px 0 6px 0' }}>外包材核对：</div>
      <table className="record-table" style={{ marginBottom: 12 }}>
        <thead>
          <tr>
            <th>包材名称</th>
            <th>领用批号/版本</th>
            <th>领用数量</th>
            <th>核对结果</th>
            <th>核对人</th>
          </tr>
        </thead>
        <tbody>
          {['纸盒', '说明书', '合格证', '彩盒', '封箱带'].map((mat, i) => (
            <tr key={i}>
              <td>{mat}</td>
              <td>　　</td>
              <td>　　</td>
              <td>符合□ 不符合□</td>
              <td>　　</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 外包装过程记录 */}
      <div style={{ fontWeight: 'bold', fontSize: 13, margin: '10px 0 6px 0' }}>
        外包装过程记录（每小时一次）：
      </div>
      <table className="record-table" style={{ marginBottom: 12 }}>
        <thead>
          <tr>
            <th>检查时间</th>
            <th>每盒瓶数</th>
            <th>说明书</th>
            <th>批号打印</th>
            <th>盒体密封</th>
            <th>UPC/批号复核</th>
            <th>检查人</th>
          </tr>
        </thead>
        <tbody>
          {dcRows.length > 0 ? dcRows.map((r, i) => (
            <tr key={i}>
              <td>{String(r.check_time ?? '')}</td>
              <td>{String(r.bottles_per_box ?? '')}</td>
              <td style={{ color: String(r.insert_check) === '合格' ? '#52c41a' : '#f5222d' }}>
                {String(r.insert_check ?? '')}
              </td>
              <td style={{ color: String(r.batch_print) === '清晰正确' ? '#52c41a' : '#f5222d' }}>
                {String(r.batch_print ?? '')}
              </td>
              <td style={{ color: String(r.seal_check) === '合格' ? '#52c41a' : '#f5222d' }}>
                {String(r.seal_check ?? '')}
              </td>
              <td style={{ color: String(r.code_verify) === '一致' ? '#52c41a' : '#f5222d' }}>
                {String(r.code_verify ?? '')}
              </td>
              <td>{String(r.dc_operator ?? report?.operator ?? '　　')}</td>
            </tr>
          )) : (
            Array(3).fill(0).map((_, i) => (
              <tr key={i}>
                <td>　　</td><td>　　</td><td>合格□ 不合格□</td>
                <td>清晰正确□ 不合格□</td><td>合格□ 不合格□</td>
                <td>一致□ 不一致□</td><td>　　</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 产量汇总及清场 */}
      <table className="record-table">
        <tbody>
          <tr>
            <th style={{ width: '20%' }}>装盒开始时间</th>
            <td style={{ width: '30%' }}>{fmtTime(report?.inTime)}</td>
            <th style={{ width: '20%' }}>装盒结束时间</th>
            <td style={{ width: '30%' }}>{fmtTime(report?.outTime)}</td>
          </tr>
          <tr>
            <th>完工装盒数</th>
            <td style={{ fontWeight: 'bold', color: '#1677ff' }}>{report?.finishQty ?? '　　'} 盒</td>
            <th>合格盒数</th>
            <td style={{ fontWeight: 'bold', color: '#52c41a' }}>{report?.goodQty ?? '　　'} 盒</td>
          </tr>
          <tr>
            <th>不合格盒数</th>
            <td style={{ color: report?.badQty ? '#f5222d' : undefined }}>{report?.badQty ?? '　　'} 盒</td>
            <th>装箱数</th>
            <td>　　 箱</td>
          </tr>
          <tr>
            <th>操作人签名</th>
            <td>{report?.operator ?? '　　　　'}</td>
            <th>班组长复核</th>
            <td>签名：_____________</td>
          </tr>
          <tr>
            <th>清场人签名</th>
            <td>_____________</td>
            <th>清场合格证编号</th>
            <td>　　　</td>
          </tr>
          <tr>
            <th>QA检查签名</th>
            <td>_____________</td>
            <th>清场结论</th>
            <td style={{ color: '#52c41a', fontWeight: 'bold' }}>
              {isOpDone(execMap, 'OP-GMP-OUTERPACK') ? '✓ 清场合格' : '待清场'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
//  §4 各工序QA监控记录
// ────────────────────────────────────────────────────────────────────────────
const Section4QAMonitor: React.FC<{ ebr: EbrRecord | null; execMap: Record<string, OperationExecution> }> = ({ ebr, execMap }) => {
  const innerReport = getReport(execMap, 'OP-GMP-INNERPACK');
  const outerReport = getReport(execMap, 'OP-GMP-OUTERPACK');
  const mixRows     = getDCRecords(execMap, 'OP-GMP-MIX');
  const granRows    = getDCRecords(execMap, 'OP-GMP-GRANULATE');
  const innerRows   = getDCRecords(execMap, 'OP-GMP-INNERPACK');
  const outerRows   = getDCRecords(execMap, 'OP-GMP-OUTERPACK');

  const qcItems = [
    {
      op: '混合（OP-GMP-MIX）',
      type: '混合均匀性 RSD',
      spec: 'RSD ≤ 5%',
      result: mixRows.length > 0 ? `RSD = ${String(mixRows[0].mix_rsd ?? '—')}%` : '—',
      judge: mixRows.length > 0 ? (Number(mixRows[0].mix_rsd ?? 99) <= 5 ? '合格' : '不合格') : '待检验',
    },
    {
      op: '制粒干燥（OP-GMP-GRANULATE）',
      type: '颗粒水分',
      spec: '水分 ≤ 3.0%',
      result: granRows.length > 0 ? `${String(granRows[0].granule_moisture ?? '—')}%` : '—',
      judge: granRows.length > 0 ? (Number(granRows[0].granule_moisture ?? 99) <= 3.0 ? '合格' : '不合格') : '待检验',
    },
    {
      op: '内包装（OP-GMP-INNERPACK）装量差异',
      type: '装量差异 每小时抽检',
      spec: '装量偏差 ≤ ±5%',
      result: innerRows.length > 0 ? `${innerRows.length} 次检查，均值 ${innerRows.reduce((s,r)=>s+Number(r.fill_weight??0),0)/Math.max(innerRows.length,1)|0}g` : '—',
      judge: innerRows.every(r => String(r.seal_check) === '合格' && String(r.label_check) === '合格') && innerRows.length > 0 ? '合格' : (innerRows.length > 0 ? '异常' : '待检验'),
    },
    {
      op: '外包装（OP-GMP-OUTERPACK）',
      type: '批号打印/说明书/密封',
      spec: '打印清晰，说明书正确，密封完整',
      result: outerRows.length > 0 ? `${outerRows.length} 次巡检` : '—',
      judge: outerRows.every(r => String(r.batch_print) === '清晰正确' && String(r.insert_check) === '合格') && outerRows.length > 0 ? '合格' : (outerRows.length > 0 ? '异常' : '待检验'),
    },
  ];

  return (
    <div className="print-page" style={{ padding: '16px 32px' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 'bold' }}>江苏天美健大自然生物工程有限公司</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>第 4 章　各工序QA监控记录</div>
      </div>

      <table className="record-table" style={{ marginBottom: 12 }}>
        <tbody>
          <tr>
            <th style={{ width: '15%' }}>品名</th>
            <td style={{ width: '25%' }}>{ebr?.productName ?? ''}</td>
            <th style={{ width: '15%' }}>批号</th>
            <td>{ebr?.batchNo ?? ''}</td>
          </tr>
        </tbody>
      </table>

      {/* QA监控汇总表 */}
      <table className="record-table" style={{ marginBottom: 16 }}>
        <thead>
          <tr>
            <th style={{ width: '22%' }}>监控工序</th>
            <th style={{ width: '18%' }}>监控项目</th>
            <th style={{ width: '22%' }}>质量标准</th>
            <th style={{ width: '18%' }}>检验结果</th>
            <th style={{ width: '10%' }}>结论</th>
            <th style={{ width: '10%' }}>QA签名</th>
          </tr>
        </thead>
        <tbody>
          {qcItems.map((item, i) => (
            <tr key={i}>
              <td style={{ textAlign: 'left' }}>{item.op}</td>
              <td>{item.type}</td>
              <td style={{ textAlign: 'left', fontSize: 11 }}>{item.spec}</td>
              <td style={{ fontWeight: 'bold' }}>{item.result}</td>
              <td style={{ color: item.judge === '合格' ? '#52c41a' : item.judge === '待检验' ? '#999' : '#f5222d', fontWeight: 'bold' }}>
                {item.judge}
              </td>
              <td>_______</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* QA现场监控记录（内包/外包）*/}
      <div style={{ fontWeight: 'bold', fontSize: 13, margin: '10px 0 6px 0' }}>
        QA现场巡检记录（内包装线）：
      </div>
      <table className="record-table" style={{ marginBottom: 12 }}>
        <thead>
          <tr>
            <th>巡检时间</th>
            <th>装量结果</th>
            <th>密封结果</th>
            <th>标签结果</th>
            <th>环境温度(℃)</th>
            <th>环境湿度(%)</th>
            <th>QA签名</th>
          </tr>
        </thead>
        <tbody>
          {innerRows.length > 0 ? innerRows.map((r, i) => (
            <tr key={i}>
              <td>{String(r.check_time ?? '')}</td>
              <td>{String(r.fill_weight ?? '')} g</td>
              <td style={{ color: String(r.seal_check) === '合格' ? '#52c41a' : '#f5222d' }}>{String(r.seal_check ?? '')}</td>
              <td style={{ color: String(r.label_check) === '合格' ? '#52c41a' : '#f5222d' }}>{String(r.label_check ?? '')}</td>
              <td>{String(r.temp ?? '')}</td>
              <td>{String(r.humidity ?? '')}</td>
              <td>_______</td>
            </tr>
          )) : (
            Array(3).fill(0).map((_, i) => (
              <tr key={i}>
                <td>　　</td><td>　　</td><td>合格□ 否□</td>
                <td>合格□ 否□</td><td>　　</td><td>　　</td><td>_______</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* QA监控综合结论 */}
      <table className="record-table">
        <tbody>
          <tr>
            <th style={{ width: '25%' }}>QA监控综合结论</th>
            <td colSpan={3} style={{ textAlign: 'left', color: '#52c41a', fontWeight: 'bold' }}>
              □ 合格，可继续生产　　□ 有异常，暂停生产
            </td>
          </tr>
          <tr>
            <th>QA监控人签名</th>
            <td style={{ width: '30%' }}>_____________</td>
            <th style={{ width: '20%' }}>监控日期</th>
            <td>{fmtDate(innerReport?.inTime ?? outerReport?.inTime)}</td>
          </tr>
          <tr>
            <th>部门负责人审核</th>
            <td>_____________</td>
            <th>审核日期</th>
            <td>　　年　月　日</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
//  §5 物料平衡表
// ────────────────────────────────────────────────────────────────────────────
const Section5MaterialBalance: React.FC<{ ebr: EbrRecord | null; execMap: Record<string, OperationExecution> }> = ({ ebr, execMap }) => {
  const weighRows   = getDCRecords(execMap, 'OP-GMP-WEIGH');
  const innerReport = getReport(execMap, 'OP-GMP-INNERPACK');
  const outerReport = getReport(execMap, 'OP-GMP-OUTERPACK');
  const planQty     = ebr?.planQtyTotal ?? 0;
  const productSpec = ebr?.productSpec ?? '';

  const totalIssuedKg = weighRows.reduce((s, r) => s + Number(r.plan_qty ?? 0), 0);
  const totalActualKg = weighRows.reduce((s, r) => s + Number(r.actual_qty ?? 0), 0);
  const innerGoodQty  = innerReport?.goodQty ?? 0;
  const innerFinish   = innerReport?.finishQty ?? 0;
  const outerFinish   = outerReport?.finishQty ?? 0;

  const rows = [
    {
      item: '原料投入量（称量）',
      input: totalIssuedKg + ' kg',
      output: totalActualKg + ' kg',
      rate: balanceRate(totalActualKg, totalIssuedKg),
      spec: '96.0% ~ 102.0%',
      pass: totalIssuedKg > 0 && (totalActualKg / totalIssuedKg) >= 0.96 && (totalActualKg / totalIssuedKg) <= 1.02,
    },
    {
      item: '内包装：计划投入（待包装量）',
      input: planQty + ' 瓶',
      output: innerFinish + ' 瓶',
      rate: balanceRate(innerFinish, planQty),
      spec: '96.0% ~ 102.0%',
      pass: planQty > 0 && (innerFinish / planQty) >= 0.96 && (innerFinish / planQty) <= 1.02,
    },
    {
      item: '内包装：合格产品数量',
      input: innerFinish + ' 瓶',
      output: innerGoodQty + ' 瓶',
      rate: balanceRate(innerGoodQty, innerFinish),
      spec: '≥ 96.0%',
      pass: innerFinish > 0 && (innerGoodQty / innerFinish) >= 0.96,
    },
    {
      item: '外包装：装盒数量',
      input: innerGoodQty + ' 瓶',
      output: outerFinish + ' 盒',
      rate: balanceRate(outerFinish, innerGoodQty),
      spec: '96.0% ~ 102.0%',
      pass: innerGoodQty > 0 && (outerFinish / innerGoodQty) >= 0.96 && (outerFinish / innerGoodQty) <= 1.02,
    },
  ];

  const allPass = rows.every(r => !r.input.startsWith('0') || r.pass);

  return (
    <div className="print-page" style={{ padding: '16px 32px' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 'bold' }}>江苏天美健大自然生物工程有限公司</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>第 5 章　物料平衡表</div>
      </div>

      <table className="record-table" style={{ marginBottom: 12 }}>
        <tbody>
          <tr>
            <th style={{ width: '15%' }}>品名</th>
            <td style={{ width: '25%' }}>{ebr?.productName ?? ''}</td>
            <th style={{ width: '15%' }}>批号</th>
            <td>{ebr?.batchNo ?? ''}</td>
          </tr>
          <tr>
            <th>包装规格</th>
            <td>{productSpec || '　　片/粒/瓶，　　瓶/盒'}</td>
            <th>计划待包装量</th>
            <td>{planQty} 片/粒</td>
          </tr>
        </tbody>
      </table>

      {/* 物料平衡计算表 */}
      <table className="record-table" style={{ marginBottom: 16 }}>
        <thead>
          <tr>
            <th style={{ width: '30%' }}>物料/产品项目</th>
            <th style={{ width: '15%' }}>投入量</th>
            <th style={{ width: '15%' }}>产出量</th>
            <th style={{ width: '15%' }}>平衡率</th>
            <th style={{ width: '15%' }}>质量标准</th>
            <th style={{ width: '10%' }}>结论</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ textAlign: 'left' }}>{r.item}</td>
              <td>{r.input}</td>
              <td style={{ fontWeight: 'bold' }}>{r.output}</td>
              <td style={{ fontWeight: 'bold', color: r.pass ? '#52c41a' : '#f5222d' }}>{r.rate}</td>
              <td style={{ fontSize: 11 }}>{r.spec}</td>
              <td style={{ color: r.pass ? '#52c41a' : '#f5222d', fontWeight: 'bold' }}>
                {r.input.startsWith('0') ? '—' : r.pass ? '合格' : '异常'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 物料损耗明细 */}
      <div style={{ fontWeight: 'bold', fontSize: 13, margin: '10px 0 6px 0' }}>损耗/不合格品明细：</div>
      <table className="record-table" style={{ marginBottom: 16 }}>
        <thead>
          <tr>
            <th>项目</th>
            <th>工序</th>
            <th>数量</th>
            <th>处置方式</th>
            <th>操作人</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>内包装不合格品</td>
            <td>内包装</td>
            <td>{innerReport?.badQty ?? 0} 瓶</td>
            <td>隔离标识，等待偏差处理</td>
            <td>{innerReport?.operator ?? '　　'}</td>
          </tr>
          <tr>
            <td>内包装报废品</td>
            <td>内包装</td>
            <td>{innerReport?.scrapQty ?? 0} 瓶</td>
            <td>销毁处理</td>
            <td>{innerReport?.operator ?? '　　'}</td>
          </tr>
          <tr>
            <td>外包装不合格品</td>
            <td>外包装</td>
            <td>{outerReport?.badQty ?? 0} 盒</td>
            <td>隔离标识，等待偏差处理</td>
            <td>{outerReport?.operator ?? '　　'}</td>
          </tr>
        </tbody>
      </table>

      {/* 平衡结论及签名 */}
      <table className="record-table">
        <tbody>
          <tr>
            <th style={{ width: '25%' }}>物料平衡综合结论</th>
            <td colSpan={3} style={{ color: allPass ? '#52c41a' : '#f5222d', fontWeight: 'bold', textAlign: 'left' }}>
              {allPass
                ? '✓ 物料平衡合格（96.0%~102.0%），可进行下步操作'
                : '⚠ 物料平衡异常，须开具偏差报告并经QA批准'}
            </td>
          </tr>
          <tr>
            <th>填写人签名</th>
            <td style={{ width: '25%' }}>_____________</td>
            <th style={{ width: '20%' }}>填写日期</th>
            <td>{fmtDate(outerReport?.outTime)}</td>
          </tr>
          <tr>
            <th>QA审核签名</th>
            <td>_____________</td>
            <th>审核日期</th>
            <td>　　年　月　日</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 12, padding: '8px 12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
        <Text style={{ fontSize: 11, color: '#666' }}>
          注：物料平衡率 = 实际产出量 / 计划投入量 × 100%。
          若平衡率超出96.0%~102.0%范围，需填写偏差报告并经QA批准后方可继续。
        </Text>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
//  §6 成品检验报告
// ────────────────────────────────────────────────────────────────────────────
const Section6QCReport: React.FC<{ ebr: EbrRecord | null; execMap: Record<string, OperationExecution> }> = ({ ebr, execMap }) => {
  const outerReport = getReport(execMap, 'OP-GMP-OUTERPACK');
  const productSpec = ebr?.productSpec ?? '';

  const checkItems = [
    { item: '性状', spec: '符合规定', method: '目检', result: '' },
    { item: '装量差异', spec: '±5%以内', method: '称量法', result: '' },
    { item: '崩解时限', spec: '≤30 min', method: 'BP崩解测试仪', result: '' },
    { item: '微生物限度', spec: '符合GMP规定', method: '微生物检验', result: '' },
    { item: '批号/有效期打印', spec: '清晰、正确', method: '目检', result: '' },
    { item: '包装完整性', spec: '密封良好、无破损', method: '目检', result: '' },
    { item: '说明书核对', spec: '与批记录一致', method: '对照检查', result: '' },
    { item: '外观', spec: '整洁、无污染', method: '目检', result: '' },
  ];

  return (
    <div className="print-page" style={{ padding: '16px 32px' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 'bold' }}>江苏天美健大自然生物工程有限公司</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>第 6 章　成品检验报告</div>
      </div>

      <table className="record-table" style={{ marginBottom: 12 }}>
        <tbody>
          <tr>
            <th style={{ width: '15%' }}>品名</th>
            <td style={{ width: '25%' }}>{ebr?.productName ?? ''}</td>
            <th style={{ width: '15%' }}>批号</th>
            <td>{ebr?.batchNo ?? ''}</td>
          </tr>
          <tr>
            <th>规格</th>
            <td>{productSpec || '　　片/粒/瓶，　　瓶/盒'}</td>
            <th>送检数量</th>
            <td>{getReport(execMap, 'OP-GMP-OUTERPACK')?.goodQty ? `${getReport(execMap, 'OP-GMP-OUTERPACK')?.goodQty} 片/粒` : '　　片/粒'}</td>
          </tr>
          <tr>
            <th>送检日期</th>
            <td>{fmtDate(outerReport?.outTime)}</td>
            <th>检验日期</th>
            <td>　　年　月　日</td>
          </tr>
          <tr>
            <th>检验依据</th>
            <td colSpan={3}>《质量标准》/ 企业内控标准 SOR-QS-XX-XXX</td>
          </tr>
        </tbody>
      </table>

      {/* 检验项目表 */}
      <table className="record-table" style={{ marginBottom: 12 }}>
        <thead>
          <tr>
            <th style={{ width: '20%' }}>检验项目</th>
            <th style={{ width: '30%' }}>质量标准/规格</th>
            <th style={{ width: '20%' }}>检验方法</th>
            <th style={{ width: '20%' }}>检验结果</th>
            <th style={{ width: '10%' }}>结论</th>
          </tr>
        </thead>
        <tbody>
          {checkItems.map((item, i) => (
            <tr key={i}>
              <td>{item.item}</td>
              <td style={{ textAlign: 'left' }}>{item.spec}</td>
              <td>{item.method}</td>
              <td style={{ color: '#1677ff' }}>{item.result || '待检验'}</td>
              <td>合格□</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 检验结论 */}
      <table className="record-table">
        <tbody>
          <tr>
            <th style={{ width: '25%' }}>综合检验结论</th>
            <td colSpan={3} style={{ textAlign: 'left' }}>
              □ 合格　　□ 不合格
            </td>
          </tr>
          <tr>
            <th>检验人签名</th>
            <td style={{ width: '25%' }}>_____________</td>
            <th style={{ width: '20%' }}>检验日期</th>
            <td>　　年　月　日</td>
          </tr>
          <tr>
            <th>复核人签名</th>
            <td>_____________</td>
            <th>复核日期</th>
            <td>　　年　月　日</td>
          </tr>
          <tr>
            <th>质量负责人</th>
            <td>_____________</td>
            <th>签发日期</th>
            <td>　　年　月　日</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
//  §7 成品放行审核单
// ────────────────────────────────────────────────────────────────────────────
const Section7Release: React.FC<{ ebr: EbrRecord | null; execMap: Record<string, OperationExecution> }> = ({ ebr, execMap }) => {
  const productSpec = ebr?.productSpec ?? '';
  const completedOps = GMP_OPERATIONS.filter(op => isOpDone(execMap, op.code));
  const allDone = completedOps.length === GMP_OPERATIONS.length;

  const checkList = [
    '批包装指令已审核，品名、批号、规格与批记录一致',
    '生产前再确认（9项）全部完成，清场合格证在有效期内',
    '各工序操作记录完整，偏差项目已处理',
    '装量差异检查合格，过程记录完整',
    '物料平衡计算结果在规定范围内（96.0%~102.0%）',
    '外包装批号打印正确，说明书、合格证齐全',
    '成品检验报告合格',
    '设备清洁及清场记录完整',
  ];

  return (
    <div className="print-page" style={{ padding: '16px 32px' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 'bold' }}>江苏天美健大自然生物工程有限公司</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>第 7 章　成品放行审核单</div>
      </div>

      <table className="record-table" style={{ marginBottom: 12 }}>
        <tbody>
          <tr>
            <th style={{ width: '15%' }}>品名</th>
            <td style={{ width: '25%' }}>{ebr?.productName ?? ''}</td>
            <th style={{ width: '15%' }}>批号</th>
            <td>{ebr?.batchNo ?? ''}</td>
          </tr>
          <tr>
            <th>规格</th>
            <td>{productSpec || '　　片/粒/瓶，　　瓶/盒'}</td>
            <th>申请放行数量</th>
            <td>{getReport(execMap, 'OP-GMP-OUTERPACK')?.goodQty ?? '　　'} 片/粒</td>
          </tr>
          <tr>
            <th>生产完成日期</th>
            <td>{fmtDate(getReport(execMap, 'OP-GMP-OUTERPACK')?.outTime)}</td>
            <th>申请放行日期</th>
            <td>　　年　月　日</td>
          </tr>
          <tr>
            <th>EBR/批记录号</th>
            <td>{ebr?.ebrNo ?? '—'}</td>
            <th>工序完成进度</th>
            <td>
              <span style={{ color: allDone ? '#52c41a' : '#fa8c16', fontWeight: 'bold' }}>
                {completedOps.length}/{GMP_OPERATIONS.length} 工序完成
                {allDone ? '（全部完成）' : '（未完成）'}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 放行检查清单 */}
      <div style={{ fontWeight: 'bold', fontSize: 13, margin: '10px 0 6px 0' }}>放行审核检查清单：</div>
      <table className="record-table" style={{ marginBottom: 16 }}>
        <thead>
          <tr>
            <th style={{ width: '5%' }}>序号</th>
            <th style={{ width: '65%' }}>检查项目</th>
            <th style={{ width: '15%' }}>审核结果</th>
            <th style={{ width: '15%' }}>备注</th>
          </tr>
        </thead>
        <tbody>
          {checkList.map((item, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td style={{ textAlign: 'left' }}>{item}</td>
              <td>合格□ 不合格□</td>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 三级审核签名 */}
      <div style={{ fontWeight: 'bold', fontSize: 13, margin: '10px 0 6px 0' }}>三级审核放行：</div>
      <table className="record-table">
        <tbody>
          <tr>
            <th style={{ width: '25%', background: '#e6f7ff' }}>生产部主管审核</th>
            <td style={{ width: '25%' }}>
              <div>签名：_____________</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>日期：　　年　月　日</div>
            </td>
            <th style={{ width: '25%', background: '#f6ffed' }}>QA审核</th>
            <td style={{ width: '25%' }}>
              <div>签名：_____________</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>日期：　　年　月　日</div>
            </td>
          </tr>
          <tr>
            <th style={{ background: '#fff7e6' }}>质量负责人批准放行</th>
            <td>
              <div>签名：_____________</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>日期：　　年　月　日</div>
            </td>
            <th>放行结论</th>
            <td style={{ fontWeight: 'bold', fontSize: 14 }}>
              □ 准予放行　　□ 拒绝放行
            </td>
          </tr>
        </tbody>
      </table>

      {/* 备注 */}
      <div style={{ marginTop: 16, padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 4, minHeight: 60 }}>
        <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>审核意见：</div>
        <div style={{ color: '#aaa', fontSize: 12 }}>（质量负责人填写）</div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
//  批生产记录（工序执行汇总）
// ────────────────────────────────────────────────────────────────────────────
const ProductionRecordSection: React.FC<{ ebr: EbrRecord | null; execMap: Record<string, OperationExecution> }> = ({ ebr, execMap }) => {
  return (
    <div style={{ padding: '16px 32px' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 6, marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 'bold' }}>江苏天美健大自然生物工程有限公司</div>
        <div style={{ fontSize: 14, marginTop: 4 }}>批 生 产 记 录（工序执行汇总）</div>
        <div style={{ fontSize: 11, marginTop: 4, color: '#666' }}>SOR-MF-PE-02-05 配套</div>
      </div>

      {/* 封面信息 */}
      <table className="record-table" style={{ marginBottom: 16 }}>
        <tbody>
          <tr>
            <th style={{ width: '15%' }}>产品名称</th>
            <td style={{ width: '25%' }}>{ebr?.productName ?? '—'}</td>
            <th style={{ width: '15%' }}>产品批号</th>
            <td>{ebr?.batchNo ?? '—'}</td>
          </tr>
          <tr>
            <th>工单编号</th>
            <td>{ebr?.woNo ?? '—'}</td>
            <th>EBR编号</th>
            <td>{ebr?.ebrNo ?? '—'}</td>
          </tr>
          <tr>
            <th>工艺路线</th>
            <td colSpan={3}>保健品GMP生产工艺路线（称量→混合→制粒→内包→外包）</td>
          </tr>
          <tr>
            <th>生产开始</th>
            <td>{fmtTime(execMap['OP-GMP-WEIGH']?.inTime ?? '—')}</td>
            <th>生产完成</th>
            <td>{fmtTime(execMap['OP-GMP-OUTERPACK']?.outTime ?? '—')}</td>
          </tr>
        </tbody>
      </table>

      {/* 工序执行汇总 */}
      <div style={{ fontWeight: 'bold', fontSize: 13, margin: '10px 0 8px 0' }}>各工序执行记录汇总：</div>
      {GMP_OPERATIONS.map(op => {
        const report = getReport(execMap, op.code);
        const dcRows = getDCRecords(execMap, op.code);
        const done   = isOpDone(execMap, op.code);

        return (
          <div key={op.code} style={{ marginBottom: 16 }}>
            <div style={{
              background: done ? '#f6ffed' : '#fff7e6',
              border: `1px solid ${done ? '#b7eb8f' : '#ffd591'}`,
              borderRadius: 4,
              padding: '6px 12px',
              marginBottom: 6,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text strong style={{ fontSize: 13 }}>
                {op.seq}. {op.name}（{op.code}）
              </Text>
              <Tag color={done ? 'success' : 'warning'}>
                {done ? '✓ 已完成' : '待执行'}
              </Tag>
            </div>
            <table className="record-table">
              <tbody>
                <tr>
                  <th style={{ width: '15%' }}>车间</th>
                  <td style={{ width: '20%' }}>{op.workshop}</td>
                  <th style={{ width: '15%' }}>进站时间</th>
                  <td style={{ width: '20%' }}>{fmtTime(report?.inTime)}</td>
                  <th style={{ width: '15%' }}>出站时间</th>
                  <td>{fmtTime(report?.outTime)}</td>
                </tr>
                <tr>
                  <th>完工数量</th>
                  <td>{report?.finishQty ?? '—'}</td>
                  <th>合格数量</th>
                  <td style={{ color: '#52c41a', fontWeight: 'bold' }}>{report?.goodQty ?? '—'}</td>
                  <th>不合格/报废</th>
                  <td style={{ color: (report?.badQty ?? 0) > 0 ? '#f5222d' : undefined }}>
                    {report?.badQty ?? 0} / {report?.scrapQty ?? 0}
                  </td>
                </tr>
                <tr>
                  <th>操作人</th>
                  <td>{report?.operator ?? '—'}</td>
                  <th>工序状态</th>
                  <td colSpan={3}>
                    <Tag color={done ? 'success' : 'default'}>{done ? '已完成' : '未完成'}</Tag>
                  </td>
                </tr>
                {dcRows.length > 0 && (
                  <tr>
                    <th>过程数据</th>
                    <td colSpan={5} style={{ textAlign: 'left', fontSize: 11 }}>
                      {dcRows.map((r, i) => (
                        <span key={i} style={{ marginRight: 16 }}>
                          {Object.entries(r)
                            .filter(([k]) => !k.startsWith('_'))
                            .slice(0, 4)
                            .map(([k, v]) => `${k}:${String(v)}`)
                            .join('  ')}
                        </span>
                      ))}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* 批生产记录签发 */}
      <table className="record-table" style={{ marginTop: 16 }}>
        <tbody>
          <tr>
            <th style={{ width: '25%' }}>批记录审核</th>
            <td style={{ width: '25%' }}>_____________</td>
            <th style={{ width: '25%' }}>审核日期</th>
            <td>　　年　月　日</td>
          </tr>
          <tr>
            <th>质量部批准</th>
            <td>_____________</td>
            <th>批准日期</th>
            <td>　　年　月　日</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
//  主页面组件
// ────────────────────────────────────────────────────────────────────────────
const BatchRecordPrintPage: React.FC = () => {
  const [ebrRecords] = useLocalStorage<EbrRecord[]>(EBR_STORAGE_KEY, loadEbrRecords());
  const [execMap]    = useLocalStorage<Record<string, OperationExecution>>('bip_pad_exec_map', {});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab,  setActiveTab]  = useState('cover');
  const printRef = useRef<HTMLDivElement>(null);

  // 注入打印样式
  React.useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'batch-record-print-style';
    styleEl.textContent = PRINT_STYLE;
    if (!document.getElementById('batch-record-print-style')) {
      document.head.appendChild(styleEl);
    }
    return () => { document.getElementById('batch-record-print-style')?.remove(); };
  }, []);

  const packEbrs = useMemo(() => ebrRecords.length > 0 ? ebrRecords : [], [ebrRecords]);
  const selectedEbr = selectedId
    ? packEbrs.find(e => e.id === selectedId) ?? null
    : packEbrs[0] ?? null;

  // 统计工序完成情况
  const completedOps = GMP_OPERATIONS.filter(op => execMap[op.code]?.status === 'completed').length;
  const allDone = completedOps === GMP_OPERATIONS.length;

  const handlePrint = () => {
    window.print();
  };

  // 无数据时显示引导
  if (!selectedEbr && packEbrs.length === 0) {
    return (
      <div style={{ padding: 32 }}>
        <Alert
          type="info"
          showIcon
          icon={<FileTextOutlined />}
          message="暂无批记录数据"
          description={
            <div>
              <p>请先在 <strong>PAD工序执行</strong> 中完成以下全部工序，批记录将自动生成：</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {GMP_OPERATIONS.map(op => (
                  <Tag key={op.code} color={isOpDone(execMap, op.code) ? 'success' : 'default'}>
                    {isOpDone(execMap, op.code) ? '✓' : '○'} {op.name}
                  </Tag>
                ))}
              </div>
              <p style={{ marginTop: 12, color: '#999', fontSize: 12 }}>
                当前进度：{completedOps} / {GMP_OPERATIONS.length} 工序完成
              </p>
            </div>
          }
          style={{ marginBottom: 24 }}
        />
        {/* 如果execMap有数据但没有EBR记录，仍可生成预览批记录 */}
        {completedOps > 0 && (
          <Card title="基于PAD执行数据预览批记录" extra={
            <Tag color="orange">PAD数据已采集，EBR批记录尚未正式创建</Tag>
          }>
            <Alert
              type="warning"
              showIcon
              message={`已完成 ${completedOps}/${GMP_OPERATIONS.length} 道工序，可预览已完成工序的批记录内容`}
              style={{ marginBottom: 16 }}
            />
            <BatchRecordContent ebr={null} execMap={execMap} activeTab={activeTab} setActiveTab={setActiveTab} onPrint={handlePrint} />
          </Card>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* 批次选择 */}
      {packEbrs.length > 1 && (
        <Card size="small" style={{ marginBottom: 12 }} className="no-print">
          <Space wrap>
            <Text>选择批次：</Text>
            {packEbrs.map(e => (
              <Button
                key={e.id}
                type={selectedEbr?.id === e.id ? 'primary' : 'default'}
                size="small"
                onClick={() => setSelectedId(e.id)}
              >
                {e.batchNo} — {e.productName}
              </Button>
            ))}
          </Space>
        </Card>
      )}

      {/* 批次状态概览 */}
      <Card
        style={{ marginBottom: 12 }}
        className="no-print"
        title={
          <Space>
            <FileDoneOutlined style={{ color: '#1677ff' }} />
            <Text strong>批包装记录（SOR-MF-PE-02-05）— {selectedEbr?.batchNo ?? '预览模式'}</Text>
            <Tag color={allDone ? 'success' : 'processing'}>
              {allDone ? '全部工序完成，可打印正式记录' : `进行中（${completedOps}/${GMP_OPERATIONS.length}工序）`}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              size="large"
            >
              打印批记录
            </Button>
          </Space>
        }
      >
        <Row gutter={16}>
          {GMP_OPERATIONS.map(op => (
            <Col key={op.code} xs={12} sm={8} md={4}>
              <div style={{
                textAlign: 'center',
                padding: '8px 4px',
                background: isOpDone(execMap, op.code) ? '#f6ffed' : '#fafafa',
                border: `1px solid ${isOpDone(execMap, op.code) ? '#b7eb8f' : '#e0e0e0'}`,
                borderRadius: 6,
              }}>
                <div style={{ fontSize: 18 }}>{isOpDone(execMap, op.code) ? '✅' : '⏳'}</div>
                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>{op.name}</div>
                <div style={{ fontSize: 10, color: '#999' }}>{op.code}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 批记录内容 */}
      <div ref={printRef}>
        <BatchRecordContent
          ebr={selectedEbr}
          execMap={execMap}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onPrint={handlePrint}
        />
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
//  批记录内容（Tab切换）
// ────────────────────────────────────────────────────────────────────────────
const BatchRecordContent: React.FC<{
  ebr: EbrRecord | null;
  execMap: Record<string, OperationExecution>;
  activeTab: string;
  setActiveTab: (t: string) => void;
  onPrint: () => void;
}> = ({ ebr, execMap, activeTab, setActiveTab, onPrint }) => {
  return (
    <Card bodyStyle={{ padding: 0 }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
        tabBarStyle={{ padding: '0 16px', marginBottom: 0 }}
        tabBarGutter={4}
        className="no-print"
        tabBarExtraContent={
          <Button icon={<PrinterOutlined />} onClick={onPrint} className="no-print">
            打印全部
          </Button>
        }
      >
        <TabPane tab={<span>📄 封面&目录</span>} key="cover">
          <RecordCover ebr={ebr} execMap={execMap} />
        </TabPane>
        <TabPane tab={<span>§1 批包装指令</span>} key="s1">
          <Section1Instruction ebr={ebr} execMap={execMap} />
        </TabPane>
        <TabPane tab={<span>§2 瓶包线记录</span>} key="s2">
          <Section2InnerPack ebr={ebr} execMap={execMap} />
        </TabPane>
        <TabPane tab={<span>§3 外包装记录</span>} key="s3">
          <Section3OuterPack ebr={ebr} execMap={execMap} />
        </TabPane>
        <TabPane tab={<span>§4 QA监控</span>} key="s4">
          <Section4QAMonitor ebr={ebr} execMap={execMap} />
        </TabPane>
        <TabPane tab={<span>§5 物料平衡</span>} key="s5">
          <Section5MaterialBalance ebr={ebr} execMap={execMap} />
        </TabPane>
        <TabPane tab={<span>§6 成品检验</span>} key="s6">
          <Section6QCReport ebr={ebr} execMap={execMap} />
        </TabPane>
        <TabPane tab={<span>§7 放行审核</span>} key="s7">
          <Section7Release ebr={ebr} execMap={execMap} />
        </TabPane>
        <TabPane tab={<span>📋 批生产记录</span>} key="production">
          <ProductionRecordSection ebr={ebr} execMap={execMap} />
        </TabPane>
      </Tabs>

      {/* 打印时显示全部内容（无需Tab） */}
      <div style={{ display: 'none' }} className="print-only">
        <RecordCover ebr={ebr} execMap={execMap} />
        <Section1Instruction ebr={ebr} execMap={execMap} />
        <Section2InnerPack ebr={ebr} execMap={execMap} />
        <Section3OuterPack ebr={ebr} execMap={execMap} />
        <Section4QAMonitor ebr={ebr} execMap={execMap} />
        <Section5MaterialBalance ebr={ebr} execMap={execMap} />
        <Section6QCReport ebr={ebr} execMap={execMap} />
        <Section7Release ebr={ebr} execMap={execMap} />
        <ProductionRecordSection ebr={ebr} execMap={execMap} />
      </div>
    </Card>
  );
};

export default BatchRecordPrintPage;
