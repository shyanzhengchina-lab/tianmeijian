/**
 * PAD 任务池页面（PRD §2.1 工业PAD任务领取界面）
 * ─────────────────────────────────────────────
 * 功能：
 *  1. 操作工工牌扫码 / 人脸识别登录（模拟）
 *  2. 任务池列表：按技能自动匹配可领取的派工任务
 *  3. 我的任务：已领取 / 执行中 / 已完成
 *  4. 一键领取任务（锁定机制 — 同一任务不可被两人同时领取）
 *  5. 设备绑定确认（PAD工位与设备自动关联）
 *  6. 任务详情抽屉（工序、设备、批号、SOP文件入口）
 *  7. 紧急任务高亮
 * 适配：10英寸工业PAD 1920×1200，横屏，按钮≥80px
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Card, Row, Col, Tag, Typography, Space, Button, Badge, Avatar,
  Drawer, Modal, message, Divider, Progress, Alert, Tooltip, Input,
  Tabs, Empty, Statistic, Timeline,
} from 'antd';
import {
  UserOutlined, ScanOutlined, CheckCircleOutlined, ClockCircleOutlined,
  PlayCircleOutlined, ToolOutlined, FireOutlined, LockOutlined,
  UnlockOutlined, InfoCircleOutlined, WarningOutlined, DesktopOutlined,
  TeamOutlined, BarChartOutlined, FileTextOutlined, BarcodeOutlined,
  ReloadOutlined, LogoutOutlined, SyncOutlined, ThunderboltOutlined, SendOutlined,
} from '@ant-design/icons';
import {
  ROUTING_STEPS, SHIFTS, TEAMS, OPERATORS, EQUIPMENTS, PAD_STATIONS,
  mockTaskOrders, TASK_STATUS,
} from '../workorder/workOrderData';
import type { TaskOrder, Operator } from '../workorder/workOrderData';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { STORE_KEYS } from '../../store/mesStore';
import { getPadTaskList } from '../../api/padTasks';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

// ─────────────────────────────────────────────────────────────────────────────
// 技能矩阵（操作工 → 可执行工序集合）PRD §3.1 employee_skill 表
// ─────────────────────────────────────────────────────────────────────────────
const SKILL_MATRIX: Record<string, string[]> = {
  // 南京固体制剂（D级）操作工
  OP001: ['PKG-01','PKG-02','PKG-03'],                 // 王建国 - 制粒/干燥/混合
  OP002: ['PKG-04','PKG-05'],                          // 李志强 - 压片/包衣
  OP003: ['PKG-06','PKG-07'],                          // 陈晓梅 - 胶囊充填/内包
  OP004: ['PKG-07','PKG-08'],                          // 刘文华 - 内包/装盒/数片
  OP005: ['PKG-01','PKG-02','PKG-03','PKG-04'],        // 张丽萍 - 备料/制粒/压片
  OP006: ['PKG-01','PKG-02','PKG-03','PKG-04',
          'PKG-05','PKG-06','PKG-07','PKG-08'],         // 周建业 - 全线（班组长）
  // 溧水益生菌（C级冷链）操作工
  OP007: ['PKG-01','PKG-02','PKG-06'],                 // 赵雪峰 - 冷链充填
  OP008: ['PKG-07','PKG-08'],                          // 黄晓燕 - 冷链包装/放行
  // QC检验员
  OP009: ['PKG-08'],                                   // 孙美玲 - FQC/OQC放行
  OP010: ['PKG-01','PKG-02'],                          // 吴建国 - IPQC巡检
  OP011: ['PKG-03','PKG-04','PKG-05'],                 // 郑海涛 - IPQC压片包衣
  OP012: ['PKG-07','PKG-08'],                          // 冯晓云 - OQC包装终检
  OP013: ['PKG-08'],                                   // 蒋志远 - QA放行
  OP014: ['PKG-01','PKG-02','PKG-03','PKG-08'],        // 沈美华 - 制粒IPQC+放行
  OP015: ['PKG-04','PKG-05'],                          // 韩振宇 - 压片包衣
  OP016: ['PKG-06','PKG-07'],                          // 林小荣 - 胶囊/内包装
  OP017: ['PKG-01','PKG-02','PKG-03','PKG-04','PKG-05'], // 杨帆 - 固体制剂前处理
  OP018: ['PKG-01','PKG-02','PKG-03','PKG-04',
          'PKG-05','PKG-06','PKG-07','PKG-08'],         // 陈玲玲 - 全线QC组长
};

// ─────────────────────────────────────────────────────────────────────────────
// Mock 操作员（含工牌号）
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_BADGE_MAP: Record<string, string> = {
  '1001': 'OP001',
  '1002': 'OP002',
  '1003': 'OP003',
  '1004': 'OP004',
  '1005': 'OP005',
  '1006': 'OP006',
  '1007': 'OP007',
  '1008': 'OP008',
  '9999': 'OP018',
};

// ─────────────────────────────────────────────────────────────────────────────
// Mock 任务池数据（模拟 wo_operation_task 表 + PRD 字段扩充）
// ─────────────────────────────────────────────────────────────────────────────
interface TaskPoolItem {
  id: string;
  taskNo: string;
  woNo: string;
  batchNo: string;
  productName: string;
  productSpec: string;
  opNos: string[];          // 本任务涵盖的工序号
  workCenter: string;
  planQty: number;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  planStart: string;
  planEnd: string;
  requiredSkills: string[]; // 需要的工序技能
  equipIds: string[];       // 建议绑定设备
  padStation?: string;
  status: 'OPEN' | 'LOCKED' | 'CLAIMED';
  lockedBy?: string;
  claimedBy?: string;
  isEmergency?: boolean;
  remark?: string;
  sopDocUrl?: string;       // SOP文件链接（模拟）
}

const MOCK_TASK_POOL: TaskPoolItem[] = [
  // ── 天美健VitC咀嚼片 WO-TMJ-20260614-001 ──────────────────────────────────
  {
    id: 'TP001', taskNo: 'TP-20260614-001', woNo: 'WO-TMJ-20260614-001',
    batchNo: 'TMJ-VTC-20260614-001', productName: 'VitC咀嚼片', productSpec: '100mg×60片/瓶',
    opNos: ['PKG-01','PKG-02'], workCenter: '固体制剂车间（D级）-制粒间',
    planQty: 50000,
    priority: 'HIGH', planStart: '2026-06-14 08:00', planEnd: '2026-06-14 14:00',
    requiredSkills: ['PKG-01','PKG-02'], equipIds: ['EQ-GRAN-001'],
    padStation: 'PAD-GRAN-01', status: 'OPEN', isEmergency: false,
    sopDocUrl: '/sop/TMJ-SOP-GRAN-V2.pdf',
    remark: '湿法制粒，终点电流判断，粒度D90≤500μm，注意GMP记录完整性',
  },
  {
    id: 'TP002', taskNo: 'TP-20260614-002', woNo: 'WO-TMJ-20260614-001',
    batchNo: 'TMJ-VTC-20260614-001', productName: 'VitC咀嚼片', productSpec: '100mg×60片/瓶',
    opNos: ['PKG-03','PKG-04'], workCenter: '固体制剂车间（D级）-压片间',
    planQty: 49500,
    priority: 'HIGH', planStart: '2026-06-14 14:00', planEnd: '2026-06-14 20:00',
    requiredSkills: ['PKG-03','PKG-04'], equipIds: ['EQ-PRESS-001'],
    padStation: 'PAD-PRESS-01', status: 'OPEN', isEmergency: false,
    sopDocUrl: '/sop/TMJ-SOP-PRESS-V3.pdf',
    remark: '压片硬度4.0~8.0kP，脆碎度≤0.5%，每30min抽检一次',
  },
  // ── 天美健VitC咀嚼片 WO-TMJ-20260614-002（紧急补单）──────────────────────
  {
    id: 'TP003', taskNo: 'TP-20260614-003', woNo: 'WO-TMJ-20260614-002',
    batchNo: 'TMJ-VTC-20260614-002', productName: 'VitC咀嚼片', productSpec: '100mg×60片/瓶',
    opNos: ['PKG-05','PKG-06'], workCenter: '固体制剂车间（D级）-包衣间',
    planQty: 48000,
    priority: 'URGENT', planStart: '2026-06-14 08:00', planEnd: '2026-06-14 12:00',
    requiredSkills: ['PKG-05','PKG-06'], equipIds: ['EQ-COAT-001'],
    padStation: 'PAD-COAT-01', status: 'OPEN', isEmergency: true,
    sopDocUrl: '/sop/TMJ-SOP-COAT-V2.pdf',
    remark: '【紧急补单】薄膜包衣，增重3.0~5.0%，进风温度55±5℃，注意外观光滑无裂片',
  },
  {
    id: 'TP004', taskNo: 'TP-20260614-004', woNo: 'WO-TMJ-20260614-002',
    batchNo: 'TMJ-VTC-20260614-002', productName: 'VitC咀嚼片', productSpec: '100mg×60片/瓶',
    opNos: ['PKG-07'], workCenter: '固体制剂车间（D级）-内包间',
    planQty: 47800,
    priority: 'NORMAL', planStart: '2026-06-14 13:00', planEnd: '2026-06-14 17:00',
    requiredSkills: ['PKG-07'], equipIds: ['EQ-INNERPACK-001'],
    padStation: 'PAD-INNERPACK-01', status: 'LOCKED', lockedBy: 'OP002',
    sopDocUrl: '/sop/TMJ-SOP-INNERPACK-V2.pdf',
    remark: '数片装瓶60片/瓶，加干燥剂，瓶盖扭矩≥2N·m',
  },
  // ── 天美健复合益生菌胶囊 WO-TMJ-20260614-003 ─────────────────────────────
  {
    id: 'TP005', taskNo: 'TP-20260614-005', woNo: 'WO-TMJ-20260614-003',
    batchNo: 'TMJ-PRO-20260614-001', productName: '复合益生菌胶囊', productSpec: '300mg×30粒/盒（冷链≤8℃）',
    opNos: ['PKG-01','PKG-02'], workCenter: '益生菌车间（C级，≤8℃）-胶囊充填间',
    planQty: 30000,
    priority: 'NORMAL', planStart: '2026-06-14 08:00', planEnd: '2026-06-14 16:00',
    requiredSkills: ['PKG-01','PKG-02'], equipIds: ['EQ-CAPS-001'],
    padStation: 'PAD-CAPS-01', status: 'CLAIMED', claimedBy: 'OP003',
    sopDocUrl: '/sop/TMJ-SOP-CAPS-COLD-V4.pdf',
    remark: '冷链操作，室温≤8℃，胶囊充填重量差异±5%，每批次2h内完成充填',
  },
  {
    id: 'TP006', taskNo: 'TP-20260614-006', woNo: 'WO-TMJ-20260614-003',
    batchNo: 'TMJ-PRO-20260614-001', productName: '复合益生菌胶囊', productSpec: '300mg×30粒/盒（冷链≤8℃）',
    opNos: ['PKG-03','PKG-04'], workCenter: '益生菌车间（C级，≤8℃）-冷链包装间',
    planQty: 29800,
    priority: 'LOW', planStart: '2026-06-14 16:00', planEnd: '2026-06-14 20:00',
    requiredSkills: ['PKG-03','PKG-04'], equipIds: ['EQ-COLDPACK-001'],
    padStation: 'PAD-COLDPACK-01', status: 'OPEN',
    sopDocUrl: '/sop/TMJ-SOP-COLDPACK-V3.pdf',
    remark: '冷链装盒，随箱附温度记录仪，冰袋保冷，发货前确认温度≤8℃',
  },
  {
    id: 'TP007', taskNo: 'TP-20260614-007', woNo: 'WO-TMJ-20260614-003',
    batchNo: 'TMJ-PRO-20260614-001', productName: '复合益生菌胶囊', productSpec: '300mg×30粒/盒（冷链≤8℃）',
    opNos: ['PKG-08'], workCenter: 'QC实验室-理化检验室',
    planQty: 29800,
    priority: 'HIGH', planStart: '2026-06-14 09:00', planEnd: '2026-06-14 13:00',
    requiredSkills: ['PKG-08'], equipIds: [],
    padStation: 'PAD-QC-01', status: 'OPEN', isEmergency: true,
    sopDocUrl: '/sop/TMJ-SOP-OQC-FQC-V5.pdf',
    remark: '【出货前终检】活菌数≥1×10⁹CFU/粒，FQC按方案QC-FQC-PRO-001执行，QA放行签字',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 优先级配置
// ─────────────────────────────────────────────────────────────────────────────
const PRIORITY_CFG: Record<string, { label: string; color: string; bg: string }> = {
  URGENT: { label: '紧急',   color: '#f5222d', bg: '#fff1f0' },
  HIGH:   { label: '高优先', color: '#fa8c16', bg: '#fff7e6' },
  NORMAL: { label: '普通',   color: '#1677ff', bg: '#e6f4ff' },
  LOW:    { label: '低',     color: '#8c8c8c', bg: '#f0f2f5' },
};

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  OPEN:    { label: '可领取', color: '#52c41a', icon: <UnlockOutlined /> },
  LOCKED:  { label: '锁定中', color: '#faad14', icon: <LockOutlined /> },
  CLAIMED: { label: '已领取', color: '#1677ff', icon: <CheckCircleOutlined /> },
};

// ─────────────────────────────────────────────────────────────────────────────
// 技能匹配：检查操作工是否满足任务所需技能
// ─────────────────────────────────────────────────────────────────────────────
const checkSkillMatch = (operatorId: string, task: TaskPoolItem): boolean => {
  const skills = SKILL_MATRIX[operatorId] || [];
  return task.requiredSkills.every(s => skills.includes(s));
};

// ─────────────────────────────────────────────────────────────────────────────
// 任务池卡片
// ─────────────────────────────────────────────────────────────────────────────
const TaskPoolCard: React.FC<{
  task: TaskPoolItem;
  operatorId: string;
  isMine: boolean;
  onClaim: () => void;
  onDetail: () => void;
  onRelease?: () => void;
  onStart?: () => void;
}> = ({ task, operatorId, isMine, onClaim, onDetail, onRelease, onStart }) => {
  const pri = PRIORITY_CFG[task.priority];
  const sts = STATUS_CFG[task.status];
  const skillOk = checkSkillMatch(operatorId, task);
  const isLocked = task.status === 'LOCKED' && task.lockedBy !== operatorId;
  const isClaimed = task.status === 'CLAIMED';

  const borderColor = task.isEmergency ? '#f5222d'
    : task.priority === 'URGENT' ? '#fa8c16'
    : task.priority === 'HIGH' ? '#1677ff' : '#e8ecf0';

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: `2px solid ${borderColor}`,
      boxShadow: task.isEmergency ? '0 0 12px rgba(245,34,45,0.25)' : '0 2px 8px rgba(0,0,0,0.08)',
      overflow: 'hidden',
      marginBottom: 12,
      opacity: (isLocked || (isClaimed && !isMine)) ? 0.6 : 1,
      transition: 'all 0.2s',
    }}>
      {/* 顶部色条 */}
      <div style={{ height: 4, background: borderColor }} />

      <div style={{ padding: '14px 18px' }}>
        {/* 行1：任务号 + 紧急标记 + 优先级 + 状态 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {task.isEmergency && (
            <span style={{
              background: '#f5222d', color: '#fff', padding: '1px 8px',
              borderRadius: 4, fontSize: 11, fontWeight: 700,
              animation: 'blink 1s step-end infinite',
            }}>
              <FireOutlined /> 紧急
            </span>
          )}
          <Text strong style={{ fontSize: 14, color: '#1d2939' }}>{task.taskNo}</Text>
          <Tag color={pri.color} style={{ fontSize: 11, marginLeft: 'auto' }}>{pri.label}</Tag>
          <Tag
            icon={sts.icon}
            style={{
              fontSize: 11, color: sts.color,
              background: `${sts.color}18`,
              border: `1px solid ${sts.color}40`,
            }}
          >
            {sts.label}
          </Tag>
          {!skillOk && (
            <Tooltip title="您的技能证书不满足此任务要求">
              <Tag color="error" style={{ fontSize: 10 }}>技能不匹配</Tag>
            </Tooltip>
          )}
        </div>

        {/* 行2：产品信息 */}
        <div style={{ marginBottom: 6 }}>
          <Text style={{ color: '#1d2939', fontWeight: 600 }}>{task.productName}</Text>
          <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{task.productSpec}</Text>
          <Tag color="blue" style={{ fontSize: 11, marginLeft: 8 }}>批号: {task.batchNo}</Tag>
        </div>

        {/* 行3：工作中心 + 工序 + 计划数量 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          <span style={{
            background: '#e6f4ff', color: '#1677ff', padding: '2px 10px',
            borderRadius: 10, fontSize: 11, fontWeight: 600,
          }}>
            🏭 {task.workCenter}
          </span>
          {task.opNos.map(op => {
            const step = ROUTING_STEPS.find(s => s.opNo === op);
            return (
              <Tooltip key={op} title={step?.name || op}>
                <span style={{
                  background: step?.isKeyOp ? '#fff7e6' : '#f0f2f5',
                  color: step?.isKeyOp ? '#d46b08' : '#667085',
                  padding: '2px 8px', borderRadius: 8, fontSize: 11,
                  border: step?.isKeyOp ? '1px solid #f5d89f' : '1px solid #e8ecf0',
                }}>
                  {op}{step?.isKeyOp ? '★' : ''}
                </span>
              </Tooltip>
            );
          })}
          <span style={{
            background: '#f6ffed', color: '#52c41a', padding: '2px 10px',
            borderRadius: 10, fontSize: 11, fontWeight: 600,
          }}>
            计划 {task.planQty.toLocaleString()} 支
          </span>
        </div>

        {/* 行4：设备 */}
        {task.equipIds.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>设备：</Text>
            {task.equipIds.map(eid => {
              const eq = EQUIPMENTS.find(e => e.id === eid);
              if (!eq) return null;
              return (
                <Tag
                  key={eid}
                  color={eq.status === 'NORMAL' ? 'success' : eq.status === 'MAINTAIN' ? 'warning' : 'error'}
                  style={{ fontSize: 10 }}
                >
                  ⚙️ {eq.name}
                  {eq.status !== 'NORMAL' && ` [${eq.status === 'MAINTAIN' ? '维保中' : '故障'}]`}
                </Tag>
              );
            })}
            {task.padStation && (
              <Tag color="geekblue" style={{ fontSize: 10 }}>📟 {task.padStation}</Tag>
            )}
          </div>
        )}

        {/* 行5：时间 */}
        <div style={{ fontSize: 11, color: '#98a2b3', marginBottom: 10 }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {task.planStart} → {task.planEnd}
        </div>

        {/* 备注 */}
        {task.remark && (
          <Alert
            type={task.isEmergency ? 'error' : 'warning'}
            showIcon
            icon={<WarningOutlined />}
            message={task.remark}
            style={{ borderRadius: 6, marginBottom: 10, fontSize: 11 }}
          />
        )}

        {/* 操作按钮区 */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button
            size="large"
            icon={<InfoCircleOutlined />}
            onClick={onDetail}
            style={{ minWidth: 80, height: 44 }}
          >
            详情
          </Button>
          {isMine && onRelease && (
            <Button
              size="large"
              danger
              icon={<LogoutOutlined />}
              onClick={onRelease}
              style={{ minWidth: 80, height: 44 }}
            >
              放弃
            </Button>
          )}
          {isMine && onStart && task.status === 'CLAIMED' && (
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={onStart}
              style={{ minWidth: 100, height: 44, background: '#52c41a', borderColor: '#52c41a' }}
            >
              开始执行
            </Button>
          )}
          {!isMine && task.status === 'OPEN' && skillOk && (
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={onClaim}
              style={{ minWidth: 100, height: 44 }}
            >
              领取任务
            </Button>
          )}
          {!isMine && task.status === 'OPEN' && !skillOk && (
            <Tooltip title="技能证书不满足此任务要求，联系班组长授权">
              <Button size="large" disabled style={{ minWidth: 100, height: 44 }}>
                技能不匹配
              </Button>
            </Tooltip>
          )}
          {isLocked && (
            <Tag color="warning" style={{ height: 44, lineHeight: '44px', padding: '0 16px' }}>
              <LockOutlined /> 已被锁定
            </Tag>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 任务详情抽屉
// ─────────────────────────────────────────────────────────────────────────────
const TaskDetailDrawer: React.FC<{
  task: TaskPoolItem | null;
  open: boolean;
  operatorId: string;
  onClose: () => void;
  onClaim: () => void;
}> = ({ task, open, operatorId, onClose, onClaim }) => {
  if (!task) return null;
  const pri = PRIORITY_CFG[task.priority];
  const skillOk = checkSkillMatch(operatorId, task);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={480}
      title={
        <Space>
          <FileTextOutlined style={{ color: '#1677ff' }} />
          <span>任务详情</span>
          <Tag color={pri.color}>{pri.label}</Tag>
          {task.isEmergency && <Tag color="error"><FireOutlined /> 紧急</Tag>}
        </Space>
      }
      styles={{ body: { padding: 16, background: '#f5f7fa' } }}
      footer={
        task.status === 'OPEN' && skillOk ? (
          <Button type="primary" size="large" block icon={<CheckCircleOutlined />} onClick={() => { onClaim(); onClose(); }}>
            领取此任务
          </Button>
        ) : null
      }
    >
      {/* 基本信息 */}
      <Card size="small" style={{ marginBottom: 12, borderRadius: 8 }}
        title={<><FileTextOutlined style={{ marginRight: 6, color: '#1677ff' }} />基本信息</>}
      >
        {[
          ['任务单号',   task.taskNo],
          ['来源工单',   task.woNo],
          ['生产批号',   task.batchNo],
          ['产品名称',   task.productName],
          ['产品规格',   task.productSpec],
          ['工作中心',   task.workCenter],
          ['计划数量',   `${task.planQty.toLocaleString()} 支`],
          ['计划开始',   task.planStart],
          ['计划结束',   task.planEnd],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f2f5' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
            <Text strong style={{ fontSize: 12 }}>{value}</Text>
          </div>
        ))}
      </Card>

      {/* 工序要求 */}
      <Card size="small" style={{ marginBottom: 12, borderRadius: 8 }}
        title={<><ToolOutlined style={{ marginRight: 6, color: '#faad14' }} />工序要求</>}
      >
        {task.opNos.map(opNo => {
          const step = ROUTING_STEPS.find(s => s.opNo === opNo);
          const hasSkill = (SKILL_MATRIX[operatorId] || []).includes(opNo);
          return step ? (
            <div key={opNo} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 0', borderBottom: '1px solid #f0f2f5',
            }}>
              <div>
                <Text strong style={{ fontSize: 12 }}>{opNo} {step.name}</Text>
                {step.isKeyOp && <Tag color="orange" style={{ marginLeft: 6, fontSize: 10 }}>关键工序</Tag>}
                {step.mandatoryInspection && <Tag color="blue" style={{ marginLeft: 4, fontSize: 10 }}>必检</Tag>}
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>标准工时: {step.standardTime}min/百支 | {step.workCenter}</Text>
              </div>
              <Tag color={hasSkill ? 'success' : 'error'} style={{ fontSize: 10 }}>
                {hasSkill ? '✅ 有证' : '❌ 无证'}
              </Tag>
            </div>
          ) : null;
        })}
      </Card>

      {/* 设备绑定 */}
      {task.equipIds.length > 0 && (
        <Card size="small" style={{ marginBottom: 12, borderRadius: 8 }}
          title={<><DesktopOutlined style={{ marginRight: 6, color: '#52c41a' }} />绑定设备</>}
        >
          {task.equipIds.map(eid => {
            const eq = EQUIPMENTS.find(e => e.id === eid);
            if (!eq) return null;
            const stColor = eq.status === 'NORMAL' ? '#52c41a' : eq.status === 'MAINTAIN' ? '#faad14' : '#f5222d';
            return (
              <div key={eid} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f2f5' }}>
                <div>
                  <Text strong style={{ fontSize: 12 }}>{eq.name}</Text>
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>{eq.code}</Text>
                </div>
                <Tag style={{ color: stColor, borderColor: stColor, background: `${stColor}18`, fontSize: 10 }}>
                  {eq.status === 'NORMAL' ? '正常' : eq.status === 'MAINTAIN' ? '维保中' : '故障'}
                </Tag>
              </div>
            );
          })}
          {task.padStation && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>PAD工位: </Text>
              <Text strong style={{ fontSize: 12, color: '#1677ff' }}>{task.padStation}</Text>
            </div>
          )}
        </Card>
      )}

      {/* SOP 文件 */}
      {task.sopDocUrl && (
        <Card size="small" style={{ marginBottom: 12, borderRadius: 8 }}
          title={<><FileTextOutlined style={{ marginRight: 6, color: '#722ed1' }} />作业指导书</>}
        >
          <Button
            type="link" block
            icon={<FileTextOutlined />}
            onClick={() => message.info('SOP文件查看功能对接中，将打开 ' + task.sopDocUrl)}
          >
            查看 SOP / 作业指导书
          </Button>
        </Card>
      )}

      {/* 备注 */}
      {task.remark && (
        <Alert
          type={task.isEmergency ? 'error' : 'warning'}
          showIcon
          message="注意事项"
          description={task.remark}
          style={{ borderRadius: 8 }}
        />
      )}
    </Drawer>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 登录弹窗（工牌扫码）
// ─────────────────────────────────────────────────────────────────────────────
const LoginModal: React.FC<{
  open: boolean;
  onLogin: (op: Operator) => void;
}> = ({ open, onLogin }) => {
  const [badgeInput, setBadgeInput] = useState('');
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleScan = useCallback(() => {
    const opId = MOCK_BADGE_MAP[badgeInput.trim()];
    if (!opId) {
      message.error(`工牌编号 "${badgeInput}" 无效，请重试`);
      setBadgeInput('');
      return;
    }
    const op = OPERATORS.find(o => o.id === opId);
    if (!op) { message.error('操作员不存在'); return; }
    onLogin(op);
    setBadgeInput('');
  }, [badgeInput, onLogin]);

  const handleQuickLogin = (badge: string) => {
    const opId = MOCK_BADGE_MAP[badge];
    const op = OPERATORS.find(o => o.id === opId);
    if (op) { onLogin(op); setBadgeInput(''); }
  };

  return (
    <Modal open={open} footer={null} closable={false} centered width={400}>
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>
          <BarcodeOutlined style={{ color: '#1677ff' }} />
        </div>
        <Title level={4} style={{ color: '#1a237e', marginBottom: 4 }}>工牌扫码登录</Title>
        <Text type="secondary" style={{ fontSize: 13 }}>扫描工牌条码或输入工号领取任务</Text>

        <div style={{ marginTop: 20, marginBottom: 16 }}>
          <Input
            ref={inputRef}
            size="large"
            prefix={<ScanOutlined />}
            placeholder="扫描工牌或输入工号"
            value={badgeInput}
            onChange={e => setBadgeInput(e.target.value)}
            onPressEnter={handleScan}
            style={{ borderRadius: 8, fontSize: 16, height: 52 }}
          />
        </div>

        <Button type="primary" size="large" block onClick={handleScan}
          style={{ height: 52, fontSize: 16, borderRadius: 8, marginBottom: 12 }}>
          确认登录
        </Button>

        <Divider style={{ margin: '12px 0', fontSize: 12 }}>快捷演示</Divider>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {[
            { badge: '1001', name: '张三（机加工）' },
            { badge: '1002', name: '李四（热处理）' },
            { badge: '1003', name: '王五（组装）' },
            { badge: '1004', name: '赵六（包装）' },
          ].map(item => (
            <Button key={item.badge} size="small" onClick={() => handleQuickLogin(item.badge)}>
              {item.name}
            </Button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────────────────────────────────────
interface PadTaskPoolPageProps {
  onNavigate?: (page: string) => void;
}

const PadTaskPoolPage: React.FC<PadTaskPoolPageProps> = ({ onNavigate }) => {
  // 任务池和登录操作工持久化到 localStorage
  const [taskPool, setTaskPool] = useLocalStorage<TaskPoolItem[]>(STORE_KEYS.TASK_POOL, MOCK_TASK_POOL);
  const [savedOperatorId, setSavedOperatorId] = useLocalStorage<string | null>(STORE_KEYS.TASK_POOL_OPERATOR, null);

  // ── 从后端加载 PAD 任务，API-first replace ─────────────────────
  const loadTasksFromApi = useCallback(async () => {
    try {
      const resp = await getPadTaskList() as any;
      const apiList: any[] = resp?.data ?? [];
      if (apiList.length > 0) {
        const mappedItems: TaskPoolItem[] = apiList.map(item => ({
          id: String(item.id),
          taskNo: item.taskNo ?? '',
          woNo: item.workOrderNo ?? '',
          batchNo: '',
          productName: item.productName ?? '',
          productSpec: item.productCode ?? '',
          opNos: item.operationCode ? [item.operationCode] : [],
          workCenter: item.workCenterName ?? '',
          planQty: item.planQuantity ?? 0,
          priority: (item.priority === 'HIGH' || item.priority === 'URGENT'
            ? item.priority : item.priority === 'LOW' ? 'LOW' : 'NORMAL') as TaskPoolItem['priority'],
          planStart: item.plannedStartTime ?? '',
          planEnd: item.plannedEndTime ?? '',
          requiredSkills: item.operationCode ? [item.operationCode] : [],
          equipIds: [],
          status: (item.status === 'PENDING' || item.status === 'ASSIGNED'
            ? 'OPEN' : item.status === 'CLAIMED' ? 'CLAIMED' : 'OPEN') as TaskPoolItem['status'],
          isEmergency: item.priority === 'URGENT',
          remark: item.remark ?? undefined,
        }));
        setTaskPool(mappedItems);
      }
    } catch { /* 后端不可用时使用 localStorage mock */ }
  }, []);
  useEffect(() => { loadTasksFromApi(); }, [loadTasksFromApi]);

  // 从持久化的 operatorId 恢复 Operator 对象
  const restoredOperator = useMemo(() => {
    if (!savedOperatorId) return null;
    return OPERATORS.find(op => op.id === savedOperatorId) || null;
  }, [savedOperatorId]);

  const [currentOperator, setCurrentOperator] = useState<Operator | null>(restoredOperator);
  const [loginOpen, setLoginOpen] = useState(!restoredOperator);
  const [detailTask, setDetailTask] = useState<TaskPoolItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pool' | 'mine'>('pool');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // 匹配到当前操作工技能的可领取任务
  const matchedTasks = taskPool.filter(t => {
    if (!currentOperator) return false;
    return t.status === 'OPEN' && checkSkillMatch(currentOperator.id, t);
  });

  // 所有开放任务（可见，包含技能不匹配的）
  const openTasks = taskPool.filter(t => t.status === 'OPEN' || t.status === 'LOCKED');

  // 我的任务
  const myTasks = taskPool.filter(t =>
    t.claimedBy === currentOperator?.id || t.lockedBy === currentOperator?.id
  );

  // 今日完成（模拟）
  const todayDone = 3;

  const handleLogin = useCallback((op: Operator) => {
    setCurrentOperator(op);
    setSavedOperatorId(op.id);  // 持久化登录状态
    setLoginOpen(false);
    message.success(`欢迎，${op.name}！ 已匹配技能可领取任务 ${taskPool.filter(t => t.status === 'OPEN' && checkSkillMatch(op.id, t)).length} 件`);
  }, [taskPool, setSavedOperatorId]);

  const handleClaim = useCallback((task: TaskPoolItem) => {
    if (!currentOperator) return;
    // 锁定校验（PRD：先锁定再确认，防止重复领取）
    if (task.status !== 'OPEN') {
      message.error('该任务已被其他人领取，请刷新列表');
      return;
    }
    Modal.confirm({
      title: '确认领取任务？',
      content: (
        <div>
          <p>任务单：<b>{task.taskNo}</b></p>
          <p>批号：<b>{task.batchNo}</b></p>
          <p>工序：<b>{task.opNos.join(' → ')}</b></p>
          <p>计划数量：<b>{task.planQty.toLocaleString()} 支</b></p>
          {task.equipIds.length > 0 && (
            <p>绑定设备：<b>{task.equipIds.map(id => EQUIPMENTS.find(e => e.id === id)?.name).filter(Boolean).join('、')}</b></p>
          )}
          <Alert type="info" message="领取后任务将锁定至您名下，请及时开始执行" showIcon style={{ marginTop: 8 }} />
        </div>
      ),
      okText: '确认领取',
      cancelText: '取消',
      onOk: () => {
        setTaskPool(prev => prev.map(t =>
          t.id === task.id
            ? { ...t, status: 'CLAIMED', claimedBy: currentOperator.id }
            : t
        ));
        message.success(`✅ 任务 ${task.taskNo} 领取成功！请前往 PAD执行 页面开始操作`);
        setActiveTab('mine');
      },
    });
  }, [currentOperator]);

  const handleRelease = useCallback((task: TaskPoolItem) => {
    Modal.confirm({
      title: '放弃任务？',
      content: '放弃后任务将重新回到任务池，请谨慎操作。',
      okText: '确认放弃',
      okButtonProps: { danger: true },
      onOk: () => {
        setTaskPool(prev => prev.map(t =>
          t.id === task.id
            ? { ...t, status: 'OPEN', claimedBy: undefined }
            : t
        ));
        message.info(`任务 ${task.taskNo} 已放弃，已回到任务池`);
      },
    });
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      message.success('任务池已刷新');
    }, 800);
  };

  const openDetail = (task: TaskPoolItem) => {
    setDetailTask(task);
    setDetailOpen(true);
  };

  if (!currentOperator) {
    return <LoginModal open={loginOpen} onLogin={handleLogin} />;
  }

  const team = TEAMS.find(t => t.id === currentOperator.teamId);
  const mySkills = SKILL_MATRIX[currentOperator.id] || [];

  return (
    <div style={{ padding: 20, background: '#f0f2f5', minHeight: '100vh' }}>

      {/* ===== 派工模式切换横幅 ===== */}
      <div style={{
        background: 'linear-gradient(135deg,#f6ffed 0%,#fff0f6 100%)',
        borderRadius: 10, padding: '10px 16px', marginBottom: 16,
        border: '1.5px solid #b7eb8f',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        {/* 切换到推式派工 */}
        <Tooltip
          title={
            <div style={{ maxWidth: 240 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>推式派工 — 生产任务单</div>
              <div style={{ fontSize: 12 }}>管理员统一排班，主动将任务分配给班组/操作工和设备。适合标准批量生产、计划性强的场景。</div>
            </div>
          }
          placement="bottom"
        >
          <div
            onClick={() => onNavigate && onNavigate('task-order')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 18px', borderRadius: 8,
              background: '#fff', border: '2px dashed #52c41a',
              color: '#389e0d', fontWeight: 600, fontSize: 13,
              cursor: onNavigate ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
          >
            <SendOutlined style={{ fontSize: 16 }} />
            <div>
              <div style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 400 }}>切换到</div>
              <div>推式派工（管理员分配）</div>
            </div>
          </div>
        </Tooltip>

        <div style={{ color: '#98a2b3', fontSize: 18, userSelect: 'none' }}>⇄</div>

        {/* 拉式：当前高亮 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 18px', borderRadius: 8,
          background: '#52c41a', color: '#fff',
          boxShadow: '0 2px 8px rgba(82,196,26,0.30)',
          fontWeight: 600, fontSize: 13,
        }}>
          <ThunderboltOutlined style={{ fontSize: 16 }} />
          <div>
            <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 400 }}>当前模式</div>
            <div>拉式派工（任务池领取）</div>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#52c41a', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontWeight: 600 }}>拉式派工工作流程</span>
          <span style={{ color: '#667085' }}>工牌登录 → 按技能查看可领取任务 → 锁定领取 → PAD执行</span>
          <span style={{ color: '#fa8c16', fontSize: 11 }}>适合：灵活用工、技能差异化大、多任务并行的生产场景</span>
        </div>
      </div>

      {/* ===== 顶部标题栏 ===== */}
      <div style={{
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
        borderRadius: 12, padding: '16px 24px', marginBottom: 20, color: '#fff',
      }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space size={16} align="center">
              <Avatar size={52} style={{ background: 'rgba(255,255,255,0.15)', fontSize: 24 }}>
                {currentOperator.name[0]}
              </Avatar>
              <div>
                <Title level={4} style={{ color: '#fff', margin: 0 }}>
                  <ThunderboltOutlined style={{ marginRight: 8 }} />任务池 — PAD工序领取
                </Title>
                <Text style={{ color: '#c5cae9', fontSize: 13 }}>
                  <UserOutlined style={{ marginRight: 4 }} />
                  {currentOperator.name}（{currentOperator.id}）&nbsp;·&nbsp;
                  <TeamOutlined style={{ marginRight: 4 }} />
                  {team?.name || '—'}&nbsp;·&nbsp;
                  技能: {mySkills.length} 道工序
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space size={24} align="center">
              <Statistic
                title={<span style={{ color: '#c5cae9', fontSize: 11 }}>可领取任务</span>}
                value={matchedTasks.length}
                valueStyle={{ color: '#52c41a', fontSize: 22 }}
              />
              <Statistic
                title={<span style={{ color: '#c5cae9', fontSize: 11 }}>我的任务</span>}
                value={myTasks.length}
                valueStyle={{ color: '#faad14', fontSize: 22 }}
              />
              <Statistic
                title={<span style={{ color: '#c5cae9', fontSize: 11 }}>今日完成</span>}
                value={todayDone}
                valueStyle={{ color: '#fff', fontSize: 22 }}
              />
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#c5cae9', fontSize: 11 }}>当前时间</div>
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 600, fontFamily: 'monospace' }}>
                  {currentTime.toLocaleTimeString('zh-CN')}
                </div>
              </div>
              <Button
                icon={<LogoutOutlined />}
                onClick={() => { setCurrentOperator(null); setSavedOperatorId(null); setLoginOpen(true); }}
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', height: 40 }}
              >
                切换
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 技能标签 */}
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <Text style={{ color: '#9fa8da', fontSize: 11 }}>持证工序：</Text>
          {mySkills.map(op => {
            const step = ROUTING_STEPS.find(s => s.opNo === op);
            return (
              <Tag
                key={op}
                style={{
                  background: 'rgba(255,255,255,0.12)', color: step?.isKeyOp ? '#ffd666' : '#c5cae9',
                  border: step?.isKeyOp ? '1px solid #ffd666' : '1px solid rgba(255,255,255,0.2)',
                  fontSize: 10,
                }}
              >
                {op}{step?.isKeyOp ? '★' : ''}
              </Tag>
            );
          })}
        </div>
      </div>

      {/* ===== Tabs ===== */}
      <Tabs
        activeKey={activeTab}
        onChange={k => setActiveTab(k as 'pool' | 'mine')}
        size="large"
        style={{ background: '#fff', borderRadius: 12, padding: '0 16px', marginBottom: 16 }}
        tabBarExtraContent={
          <Button
            icon={<ReloadOutlined spin={refreshing} />}
            onClick={handleRefresh}
            style={{ marginRight: 8 }}
          >
            刷新
          </Button>
        }
      >
        <TabPane
          tab={
            <span>
              <UnlockOutlined />
              任务池
              <Badge count={matchedTasks.length} offset={[6, -2]}
                style={{ backgroundColor: '#52c41a' }} />
            </span>
          }
          key="pool"
        />
        <TabPane
          tab={
            <span>
              <CheckCircleOutlined />
              我的任务
              {myTasks.length > 0 && <Badge count={myTasks.length} offset={[6, -2]} />}
            </span>
          }
          key="mine"
        />
      </Tabs>

      {/* ===== 任务池列表 ===== */}
      {activeTab === 'pool' && (
        <div>
          {/* 紧急任务警告条 */}
          {openTasks.some(t => t.isEmergency) && (
            <Alert
              type="error"
              showIcon
              icon={<FireOutlined />}
              message={`有 ${openTasks.filter(t => t.isEmergency).length} 件紧急任务待领取，请优先处理！`}
              style={{ marginBottom: 12, borderRadius: 8 }}
            />
          )}

          {/* 技能匹配的任务 */}
          {matchedTasks.length > 0 ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ color: '#52c41a', fontSize: 13 }}>
                  <CheckCircleOutlined style={{ marginRight: 6 }} />
                  技能匹配 — 可直接领取（{matchedTasks.length} 件）
                </Text>
              </div>
              {matchedTasks.map(task => (
                <TaskPoolCard
                  key={task.id}
                  task={task}
                  operatorId={currentOperator.id}
                  isMine={false}
                  onClaim={() => handleClaim(task)}
                  onDetail={() => openDetail(task)}
                />
              ))}
            </>
          ) : (
            <Empty description="暂无匹配您技能的可领取任务" style={{ marginBottom: 24 }} />
          )}

          {/* 其他任务（技能不匹配 / 已锁定） */}
          {openTasks.filter(t => !checkSkillMatch(currentOperator.id, t)).length > 0 && (
            <>
              <Divider style={{ margin: '16px 0' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>其他任务（技能不匹配或已锁定）</Text>
              </Divider>
              {openTasks.filter(t => !checkSkillMatch(currentOperator.id, t)).map(task => (
                <TaskPoolCard
                  key={task.id}
                  task={task}
                  operatorId={currentOperator.id}
                  isMine={false}
                  onClaim={() => handleClaim(task)}
                  onDetail={() => openDetail(task)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* ===== 我的任务 ===== */}
      {activeTab === 'mine' && (
        <div>
          {myTasks.length === 0 ? (
            <Empty
              description="您还未领取任何任务"
              style={{ marginTop: 60 }}
            >
              <Button type="primary" onClick={() => setActiveTab('pool')}>
                前往任务池领取
              </Button>
            </Empty>
          ) : (
            myTasks.map(task => (
              <TaskPoolCard
                key={task.id}
                task={task}
                operatorId={currentOperator.id}
                isMine={true}
                onClaim={() => {}}
                onDetail={() => openDetail(task)}
                onRelease={() => handleRelease(task)}
                onStart={() => {
                  message.success(`开始执行任务 ${task.taskNo}，请切换到「PAD执行」页面`);
                }}
              />
            ))
          )}
        </div>
      )}

      {/* ===== 任务详情抽屉 ===== */}
      <TaskDetailDrawer
        task={detailTask}
        open={detailOpen}
        operatorId={currentOperator.id}
        onClose={() => setDetailOpen(false)}
        onClaim={() => detailTask && handleClaim(detailTask)}
      />
    </div>
  );
};

export default PadTaskPoolPage;
