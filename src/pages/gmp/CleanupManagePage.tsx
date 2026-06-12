/**
 * CleanupManagePage.tsx — 清场管理
 * ================================================================
 * 功能：
 *  1. 清场任务列表（按车间/工单）
 *  2. 8项清场检查清单执行
 *  3. 操作人/复核人/QA三级电子签名
 *  4. 自动生成清场合格证（72h固体/48h液体）
 *  5. 有效期预警 + 超期自动锁定
 * ================================================================
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  Table, Tag, Space, Badge, Button, Modal, Form, Input, Select,
  Steps, Checkbox, Alert, Divider, Row, Col, Card, Statistic,
  Tooltip, Timeline, message, Progress, Descriptions, Typography,
} from 'antd';
import {
  CheckCircleOutlined, ClockCircleOutlined, WarningOutlined,
  SafetyCertificateOutlined, ExclamationCircleOutlined, ReloadOutlined,
  PlusOutlined, EyeOutlined, FileDoneOutlined, FireOutlined,
  UserOutlined, TeamOutlined, AuditOutlined, BankOutlined,
  CloseCircleOutlined, CheckSquareOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const { Text } = Typography;
const { TextArea } = Input;

// ── 类型定义 ─────────────────────────────────────────────────────

export type CleanupStatus =
  | 'PENDING'      // 待清场
  | 'IN_PROGRESS'  // 清场中
  | 'OPERATOR_DONE'// 操作完成，待复核
  | 'CHECKER_DONE' // 复核完成，待QA
  | 'QA_PASSED'    // QA通过，生成合格证
  | 'EXPIRED'      // 合格证已过期
  | 'OVERDUE';     // 超期未清场

export interface CleanupCheckItem {
  id: string;
  seq: number;
  name: string;
  description: string;
  category: 'MATERIAL' | 'EQUIP' | 'ENV' | 'DOC';
  isMandatory: boolean;
  checked: boolean;
  remark?: string;
  photo?: boolean;   // 是否需要拍照
}

export interface CleanupTask {
  id: string;
  taskNo: string;
  woCode: string;
  productName: string;
  workshop: string;
  workshopType: 'SOLID' | 'LIQUID' | 'SOFTGEL' | 'PACKING';  // 影响有效期
  batchNo: string;
  triggerTime: string;   // 触发清场时间（批次完工时间）
  deadline?: string;     // 清场截止时间（可配）
  status: CleanupStatus;
  checkItems: CleanupCheckItem[];
  operatorName?: string;
  operatorSignTime?: string;
  checkerName?: string;
  checkerSignTime?: string;
  qaName?: string;
  qaSignTime?: string;
  qaRemark?: string;
  // 清场合格证
  certNo?: string;
  certIssueTime?: string;
  certValidHours: number;  // 72固体 / 48液体
  certExpireTime?: string;
  certStatus?: 'VALID' | 'EXPIRING' | 'EXPIRED';  // 合格证状态
  failReason?: string;
}

// ── 8项标准清场检查清单 ───────────────────────────────────────────
export const CLEANUP_CHECKLIST_TEMPLATE: Omit<CleanupCheckItem, 'checked' | 'remark'>[] = [
  {
    id: 'CC-01', seq: 1, name: '遗留物清理',
    description: '检查生产区域内是否有上批遗留物料、半成品、废弃物；确认无遗留物',
    category: 'MATERIAL', isMandatory: true, photo: true,
  },
  {
    id: 'CC-02', seq: 2, name: '设备零件检查',
    description: '检查设备可拆卸零件（冲模/管路/接触面件）是否已拆除、清点，无缺失或遗留',
    category: 'EQUIP', isMandatory: true, photo: false,
  },
  {
    id: 'CC-03', seq: 3, name: '设备清洁',
    description: '按清洁SOP完成设备内外壁清洁；清洁剂种类/用量符合规定；目视检查无残留',
    category: 'EQUIP', isMandatory: true, photo: true,
  },
  {
    id: 'CC-04', seq: 4, name: '环境清洁',
    description: '生产区域地面、墙壁、天花板、空调回风口无粉尘/残留；清洁验证达标',
    category: 'ENV', isMandatory: true, photo: true,
  },
  {
    id: 'CC-05', seq: 5, name: '工器具清洁',
    description: '所有接触产品的工器具（铲子/容器/取样工具）已清洁并放置于规定位置',
    category: 'EQUIP', isMandatory: true, photo: false,
  },
  {
    id: 'CC-06', seq: 6, name: '清洁工具处理',
    description: '拖把/毛刷/擦布等清洁工具已清洗消毒并置于指定位置，标记批次',
    category: 'ENV', isMandatory: true, photo: false,
  },
  {
    id: 'CC-07', seq: 7, name: '文件归档',
    description: '本批生产记录、操作记录、检验记录已收集整理，无遗失；EBR已完成填写',
    category: 'DOC', isMandatory: true, photo: false,
  },
  {
    id: 'CC-08', seq: 8, name: '状态牌更新',
    description: '设备状态牌由"运行中"更换为"已清洁"，注明清洁日期/有效期/操作人',
    category: 'DOC', isMandatory: true, photo: false,
  },
];

// ── 合格证有效期（按车间类型） ─────────────────────────────────
export const CLEANUP_VALID_HOURS: Record<CleanupTask['workshopType'], number> = {
  SOLID:   72,   // 固体车间72h
  SOFTGEL: 48,   // 软胶囊车间48h（液态胶皮，更严格）
  LIQUID:  48,   // 液体车间48h
  PACKING: 72,   // 外包72h
};

// 工间类型标签
const WORKSHOP_TYPE_LABELS: Record<CleanupTask['workshopType'], { label: string; color: string }> = {
  SOLID:   { label: '固体车间',   color: '#1677FF' },
  SOFTGEL: { label: '软胶囊车间', color: '#722ED1' },
  LIQUID:  { label: '液体车间',   color: '#52C41A' },
  PACKING: { label: '外包车间',   color: '#FA8C16' },
};

// 状态配置
const STATUS_CFG: Record<CleanupStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:       { label: '待清场',       color: '#FA8C16', icon: <ClockCircleOutlined /> },
  IN_PROGRESS:   { label: '清场中',       color: '#1677FF', icon: <ReloadOutlined spin /> },
  OPERATOR_DONE: { label: '待复核',       color: '#722ED1', icon: <UserOutlined /> },
  CHECKER_DONE:  { label: '待QA签名',    color: '#EB2F96', icon: <AuditOutlined /> },
  QA_PASSED:     { label: '合格证有效',   color: '#52C41A', icon: <SafetyCertificateOutlined /> },
  EXPIRED:       { label: '合格证已过期', color: '#FF4D4F', icon: <WarningOutlined /> },
  OVERDUE:       { label: '超期未清场',   color: '#FF4D4F', icon: <ExclamationCircleOutlined /> },
};

// ── Mock 初始数据 ──────────────────────────────────────────────
const genTaskNo = (idx: number) => `CLN-20260612-${String(idx + 1).padStart(3, '0')}`;
const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString().slice(0, 16).replace('T', ' ');
const hoursLater = (base: string, h: number) => {
  const d = new Date(base.replace(' ', 'T'));
  d.setHours(d.getHours() + h);
  return d.toISOString().slice(0, 16).replace('T', ' ');
};

const makeChecklist = (): CleanupCheckItem[] =>
  CLEANUP_CHECKLIST_TEMPLATE.map(t => ({ ...t, checked: false }));

const makeCheckedList = (doneCount: number): CleanupCheckItem[] =>
  CLEANUP_CHECKLIST_TEMPLATE.map((t, i) => ({
    ...t, checked: i < doneCount, remark: i < doneCount ? '已完成' : undefined,
  }));

const INITIAL_TASKS: CleanupTask[] = [
  {
    id: 'CLN-001', taskNo: genTaskNo(0),
    woCode: 'WO-NJ-20260612-001', productName: '维C咀嚼片', batchNo: 'BN-20260612-001',
    workshop: '南京工厂·固体车间', workshopType: 'SOLID',
    triggerTime: hoursAgo(2), status: 'QA_PASSED',
    checkItems: makeCheckedList(8),
    operatorName: '王建国', operatorSignTime: hoursAgo(1.5),
    checkerName: '赵明辉', checkerSignTime: hoursAgo(1.2),
    qaName: '孔翠萍(QA)', qaSignTime: hoursAgo(1.0), qaRemark: '清场合格，合格证有效',
    certNo: 'CERT-20260612-001',
    certIssueTime: hoursAgo(1.0),
    certValidHours: 72,
    certExpireTime: hoursLater(hoursAgo(1.0), 72),
    certStatus: 'VALID',
  },
  {
    id: 'CLN-002', taskNo: genTaskNo(1),
    woCode: 'WO-NJ-20260612-002', productName: '钙维生素D软胶囊', batchNo: 'BN-20260612-002',
    workshop: '南京工厂·软胶囊车间', workshopType: 'SOFTGEL',
    triggerTime: hoursAgo(0.5), status: 'OPERATOR_DONE',
    checkItems: makeCheckedList(8),
    operatorName: '赵明辉', operatorSignTime: hoursAgo(0.2),
    certValidHours: 48,
  },
  {
    id: 'CLN-003', taskNo: genTaskNo(2),
    woCode: 'WO-LS-20260612-003', productName: '葡萄糖酸锌口服液', batchNo: 'BN-20260612-003',
    workshop: '溧水工厂·液体车间', workshopType: 'LIQUID',
    triggerTime: hoursAgo(1), status: 'IN_PROGRESS',
    checkItems: makeCheckedList(5),
    operatorName: '孙建国',
    certValidHours: 48,
  },
  {
    id: 'CLN-004', taskNo: genTaskNo(3),
    woCode: 'WO-LS-20260611-004', productName: '乳清蛋白粉', batchNo: 'BN-20260611-004',
    workshop: '溧水工厂·固体车间', workshopType: 'SOLID',
    triggerTime: hoursAgo(75), status: 'EXPIRED',
    checkItems: makeCheckedList(8),
    operatorName: '刘志强', operatorSignTime: hoursAgo(73),
    checkerName: '张伟', checkerSignTime: hoursAgo(72.5),
    qaName: '孔翠萍(QA)', qaSignTime: hoursAgo(72),
    certNo: 'CERT-20260611-001',
    certIssueTime: hoursAgo(72),
    certValidHours: 72,
    certExpireTime: hoursAgo(0.1),
    certStatus: 'EXPIRED',
    failReason: '合格证有效期72h已过期，重新开工前须重新清场',
  },
  {
    id: 'CLN-005', taskNo: genTaskNo(4),
    woCode: 'WO-NJ-20260612-005', productName: '鱼油软胶囊', batchNo: 'BN-20260612-005',
    workshop: '南京工厂·软胶囊车间', workshopType: 'SOFTGEL',
    triggerTime: hoursAgo(0.1), status: 'PENDING',
    checkItems: makeChecklist(),
    certValidHours: 48,
  },
];

// ── 清场执行 Modal ────────────────────────────────────────────────
const CleanupExecuteModal: React.FC<{
  task: CleanupTask | null;
  onClose: () => void;
  onUpdate: (task: CleanupTask) => void;
}> = ({ task, onClose, onUpdate }) => {
  const [items, setItems] = useState<CleanupCheckItem[]>(task?.checkItems ?? []);
  const [signStep, setSignStep] = useState<'EXEC' | 'OPERATOR' | 'CHECKER' | 'QA'>('EXEC');
  const [signerName, setSignerName] = useState('');
  const [qaRemark, setQaRemark] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    if (task) {
      setItems(task.checkItems.map(i => ({ ...i })));
      // 确定当前步骤
      if (task.status === 'PENDING' || task.status === 'IN_PROGRESS') setSignStep('EXEC');
      else if (task.status === 'OPERATOR_DONE') setSignStep('CHECKER');
      else if (task.status === 'CHECKER_DONE') setSignStep('QA');
      else setSignStep('EXEC');
    }
  }, [task]);

  if (!task) return null;

  const allChecked = items.every(i => i.checked);
  const checkedCount = items.filter(i => i.checked).length;
  const progress = Math.round((checkedCount / items.length) * 100);

  const handleCheck = (id: string, checked: boolean) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked, remark: checked ? '已完成' : undefined } : i));
  };

  const handleOperatorSign = () => {
    if (!allChecked) { message.warning('请先完成所有清场检查项'); return; }
    if (!signerName.trim()) { message.warning('请输入操作人姓名'); return; }
    const updated: CleanupTask = {
      ...task, checkItems: items, status: 'OPERATOR_DONE',
      operatorName: signerName, operatorSignTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    onUpdate(updated);
    message.success(`操作人 ${signerName} 电子签名成功`);
    onClose();
  };

  const handleCheckerSign = () => {
    if (!signerName.trim()) { message.warning('请输入复核人姓名'); return; }
    const updated: CleanupTask = {
      ...task, checkItems: items, status: 'CHECKER_DONE',
      checkerName: signerName, checkerSignTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    onUpdate(updated);
    message.success(`复核人 ${signerName} 电子签名成功`);
    onClose();
  };

  const handleQaSign = () => {
    if (!signerName.trim()) { message.warning('请输入QA人员姓名'); return; }
    const now = new Date();
    const issueTime = now.toISOString().slice(0, 16).replace('T', ' ');
    const expire = new Date(now.getTime() + task.certValidHours * 3600000)
      .toISOString().slice(0, 16).replace('T', ' ');
    const certNo = `CERT-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    const updated: CleanupTask = {
      ...task, checkItems: items, status: 'QA_PASSED',
      qaName: signerName, qaSignTime: issueTime, qaRemark,
      certNo, certIssueTime: issueTime, certExpireTime: expire, certStatus: 'VALID',
    };
    onUpdate(updated);
    message.success(`QA签名完成！清场合格证 ${certNo} 已生成，有效期至 ${expire}`);
    onClose();
  };

  const catColors: Record<CleanupCheckItem['category'], string> = {
    MATERIAL: '#E60012', EQUIP: '#1677FF', ENV: '#52C41A', DOC: '#FA8C16',
  };
  const catLabels: Record<CleanupCheckItem['category'], string> = {
    MATERIAL: '物料', EQUIP: '设备', ENV: '环境', DOC: '文件',
  };

  const stepMap = {
    EXEC:     0, OPERATOR: 1, CHECKER: 2, QA: 3,
  };
  const currentSignStep =
    task.status === 'PENDING' || task.status === 'IN_PROGRESS' ? 0
    : task.status === 'OPERATOR_DONE' ? 1
    : task.status === 'CHECKER_DONE' ? 2
    : task.status === 'QA_PASSED' ? 3 : 0;

  return (
    <Modal
      title={
        <Space>
          <span style={{ display: 'inline-block', width: 4, height: 18, background: '#52C41A', borderRadius: 2 }} />
          <span style={{ fontWeight: 700 }}>清场执行 — {task.woCode} · {task.productName}</span>
        </Space>
      }
      open={!!task}
      onCancel={onClose}
      footer={null}
      width={820}
      bodyStyle={{ padding: '12px 20px' }}
      destroyOnClose
    >
      {/* 有效期提示 */}
      <Alert
        type="info" showIcon
        style={{ marginBottom: 12, fontSize: 12 }}
        message={
          <span>
            本批次清场合格证有效期：
            <strong style={{ color: '#1677FF' }}>{task.certValidHours}小时</strong>
            （{WORKSHOP_TYPE_LABELS[task.workshopType].label}标准）。
            合格证过期后开工须重新清场。
          </span>
        }
      />

      {/* 三级签名流程 */}
      <Steps
        current={currentSignStep}
        size="small"
        style={{ marginBottom: 16 }}
        items={[
          { title: '清场执行', description: '8项检查清单', icon: <CheckSquareOutlined /> },
          { title: '操作人签名', description: task.operatorSignTime ?? '待签名', icon: <UserOutlined /> },
          { title: '复核人签名', description: task.checkerSignTime ?? '待签名', icon: <TeamOutlined /> },
          { title: 'QA签名', description: task.qaSignTime ?? '待签名', icon: <AuditOutlined /> },
        ]}
      />

      {/* 进度 */}
      <div style={{ marginBottom: 12 }}>
        <Row justify="space-between" align="middle">
          <Col><span style={{ fontSize: 13, fontWeight: 500 }}>清场进度</span></Col>
          <Col>
            <span style={{ fontSize: 12, color: '#888' }}>
              {checkedCount} / {items.length} 项完成
            </span>
          </Col>
        </Row>
        <Progress
          percent={progress}
          strokeColor={progress === 100 ? '#52C41A' : '#1677FF'}
          size="small"
          style={{ marginTop: 4 }}
        />
      </div>

      {/* 清场检查清单 */}
      <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>
        {items.map((item, idx) => (
          <div
            key={item.id}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '7px 0',
              borderBottom: idx < items.length - 1 ? '1px solid #f5f5f5' : 'none',
              background: item.checked ? '#F6FFED' : '#fff',
              borderRadius: 4, paddingLeft: 6,
            }}
          >
            <Checkbox
              checked={item.checked}
              onChange={e => handleCheck(item.id, e.target.checked)}
              disabled={task.status === 'QA_PASSED' || task.status === 'CHECKER_DONE'}
              style={{ marginTop: 2 }}
            />
            <div style={{ flex: 1 }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Space size={4}>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: item.checked ? '#52C41A' : '#e8e8e8',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: '#fff', fontWeight: 700, flexShrink: 0,
                    }}>
                      {idx + 1}
                    </span>
                    <strong style={{ fontSize: 13 }}>{item.name}</strong>
                    <Tag
                      color={catColors[item.category]}
                      style={{ fontSize: 10, padding: '0 3px', margin: 0 }}
                    >
                      {catLabels[item.category]}
                    </Tag>
                    {item.photo && <Tag color="blue" style={{ fontSize: 10, padding: '0 3px', margin: 0 }}>📷 拍照</Tag>}
                    {item.isMandatory && <Tag color="red" style={{ fontSize: 10, padding: '0 3px', margin: 0 }}>必填</Tag>}
                  </Space>
                </Col>
                <Col>
                  {item.checked && (
                    <CheckCircleOutlined style={{ color: '#52C41A', fontSize: 14 }} />
                  )}
                </Col>
              </Row>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2, paddingLeft: 22 }}>
                {item.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 签名区域 */}
      {(task.status === 'PENDING' || task.status === 'IN_PROGRESS') && (
        <div style={{ background: '#F0F9FF', borderRadius: 8, padding: '12px 16px', border: '1px solid #BAE7FF' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            <UserOutlined style={{ marginRight: 6, color: '#1677FF' }} />
            操作人电子签名
          </div>
          <Row gutter={10} align="middle">
            <Col span={12}>
              <Input
                placeholder="请输入操作人姓名（即电子签名）"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                prefix={<UserOutlined style={{ color: '#bbb' }} />}
              />
            </Col>
            <Col span={6}>
              <Button
                type="primary"
                icon={<SafetyCertificateOutlined />}
                disabled={!allChecked || !signerName.trim()}
                onClick={handleOperatorSign}
                style={{ width: '100%' }}
              >
                操作人签名
              </Button>
            </Col>
            <Col span={6}>
              {!allChecked && (
                <Alert type="warning" message="请先完成全部8项检查" showIcon
                  style={{ fontSize: 11, padding: '2px 8px' }} />
              )}
            </Col>
          </Row>
        </div>
      )}

      {task.status === 'OPERATOR_DONE' && (
        <div style={{ background: '#F9F0FF', borderRadius: 8, padding: '12px 16px', border: '1px solid #D3ADF7' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            <TeamOutlined style={{ marginRight: 6, color: '#722ED1' }} />
            复核人电子签名
            {task.operatorName && (
              <span style={{ fontSize: 12, color: '#888', fontWeight: 400, marginLeft: 8 }}>
                操作人：{task.operatorName}（已签，{task.operatorSignTime}）
              </span>
            )}
          </div>
          <Row gutter={10} align="middle">
            <Col span={12}>
              <Input
                placeholder="请输入复核人姓名（不得与操作人相同）"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                prefix={<TeamOutlined style={{ color: '#bbb' }} />}
              />
            </Col>
            <Col span={8}>
              <Button
                style={{ background: '#722ED1', borderColor: '#722ED1', color: '#fff', width: '100%' }}
                icon={<SafetyCertificateOutlined />}
                disabled={!signerName.trim()}
                onClick={handleCheckerSign}
              >
                复核人签名
              </Button>
            </Col>
          </Row>
        </div>
      )}

      {task.status === 'CHECKER_DONE' && (
        <div style={{ background: '#FFF2F0', borderRadius: 8, padding: '12px 16px', border: '1px solid #FFCCC7' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            <AuditOutlined style={{ marginRight: 6, color: '#E60012' }} />
            QA电子签名
            <span style={{ fontSize: 12, color: '#888', fontWeight: 400, marginLeft: 8 }}>
              操作人：{task.operatorName} / 复核人：{task.checkerName}
            </span>
          </div>
          <Row gutter={10}>
            <Col span={8}>
              <Input
                placeholder="QA人员姓名"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                prefix={<AuditOutlined style={{ color: '#bbb' }} />}
              />
            </Col>
            <Col span={10}>
              <Input
                placeholder="QA意见（可选）"
                value={qaRemark}
                onChange={e => setQaRemark(e.target.value)}
              />
            </Col>
            <Col span={6}>
              <Button
                danger type="primary"
                icon={<SafetyCertificateOutlined />}
                disabled={!signerName.trim()}
                onClick={handleQaSign}
                style={{ width: '100%' }}
              >
                QA签名并发证
              </Button>
            </Col>
          </Row>
          <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>
            签名后将自动生成清场合格证（有效期 {task.certValidHours}h）
          </div>
        </div>
      )}

      {task.status === 'QA_PASSED' && task.certNo && (
        <div style={{ background: '#F6FFED', borderRadius: 8, padding: '12px 16px', border: '1px solid #B7EB8F' }}>
          <Row align="middle" gutter={12}>
            <Col>
              <SafetyCertificateOutlined style={{ fontSize: 32, color: '#52C41A' }} />
            </Col>
            <Col flex="auto">
              <div style={{ fontWeight: 700, fontSize: 15, color: '#52C41A' }}>
                清场合格证已生成
              </div>
              <Space size={12} wrap>
                <span style={{ fontSize: 12 }}>证书编号：<Text code>{task.certNo}</Text></span>
                <span style={{ fontSize: 12 }}>签发时间：{task.certIssueTime}</span>
                <span style={{ fontSize: 12 }}>
                  有效期至：<strong style={{ color: '#1677FF' }}>{task.certExpireTime}</strong>
                  （{task.certValidHours}h有效）
                </span>
              </Space>
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                操作：{task.operatorName} | 复核：{task.checkerName} | QA：{task.qaName}
              </div>
            </Col>
          </Row>
        </div>
      )}
    </Modal>
  );
};

// ════════════════════════════════════════════════════════════════
// 主页面
// ════════════════════════════════════════════════════════════════
const CleanupManagePage: React.FC = () => {
  const [tasks, setTasks] = useLocalStorage<CleanupTask[]>('tmj_cleanup_tasks', INITIAL_TASKS);
  const [execTask, setExecTask] = useState<CleanupTask | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterWorkshop, setFilterWorkshop] = useState<string>('');

  // 定期刷新检查过期合格证
  useEffect(() => {
    const check = () => {
      const now = new Date();
      setTasks(prev => prev.map(t => {
        if (t.status === 'QA_PASSED' && t.certExpireTime) {
          const expire = new Date(t.certExpireTime.replace(' ', 'T'));
          if (expire < now) {
            return { ...t, status: 'EXPIRED' as CleanupStatus, certStatus: 'EXPIRED' };
          }
          const hoursLeft = (expire.getTime() - now.getTime()) / 3600000;
          if (hoursLeft < 8) {
            return { ...t, certStatus: 'EXPIRING' };
          }
        }
        return t;
      }));
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [setTasks]);

  const handleUpdate = (updated: CleanupTask) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const filtered = useMemo(() =>
    tasks.filter(t => {
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterWorkshop && !t.workshop.includes(filterWorkshop)) return false;
      return true;
    }), [tasks, filterStatus, filterWorkshop]);

  const summary = useMemo(() => ({
    pending:   tasks.filter(t => t.status === 'PENDING').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'OPERATOR_DONE' || t.status === 'CHECKER_DONE').length,
    valid:     tasks.filter(t => t.status === 'QA_PASSED').length,
    expired:   tasks.filter(t => t.status === 'EXPIRED' || t.status === 'OVERDUE').length,
  }), [tasks]);

  const columns: ColumnsType<CleanupTask> = [
    { title: '清场单号', dataIndex: 'taskNo', width: 160,
      render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
    { title: '生产工单', dataIndex: 'woCode', width: 185,
      render: (v: string, r: CleanupTask) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#1677FF' }}>{v}</span>
          <span style={{ fontSize: 11, color: '#888' }}>{r.productName} | {r.batchNo}</span>
        </Space>
      ) },
    { title: '车间', dataIndex: 'workshop', width: 140,
      render: (v: string, r: CleanupTask) => {
        const cfg = WORKSHOP_TYPE_LABELS[r.workshopType];
        return <Tag color={cfg.color} style={{ fontSize: 11 }}>{cfg.label}</Tag>;
      } },
    { title: '触发时间', dataIndex: 'triggerTime', width: 135,
      render: (v: string) => <span style={{ fontSize: 12, color: '#555' }}>{v}</span> },
    { title: '清场进度', width: 120,
      render: (_: any, r: CleanupTask) => {
        const done = r.checkItems.filter(i => i.checked).length;
        const total = r.checkItems.length;
        const pct = Math.round((done / total) * 100);
        return (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Progress percent={pct} size="small" strokeColor={pct === 100 ? '#52C41A' : '#1677FF'} />
            <span style={{ fontSize: 10, color: '#888' }}>{done}/{total} 项</span>
          </Space>
        );
      } },
    { title: '三级签名', width: 160,
      render: (_: any, r: CleanupTask) => (
        <Space direction="vertical" size={2}>
          <Space size={4}>
            {r.operatorSignTime
              ? <CheckCircleOutlined style={{ color: '#52C41A', fontSize: 12 }} />
              : <CloseCircleOutlined style={{ color: '#d9d9d9', fontSize: 12 }} />}
            <span style={{ fontSize: 11 }}>操作人：{r.operatorName ?? '未签'}</span>
          </Space>
          <Space size={4}>
            {r.checkerSignTime
              ? <CheckCircleOutlined style={{ color: '#52C41A', fontSize: 12 }} />
              : <CloseCircleOutlined style={{ color: '#d9d9d9', fontSize: 12 }} />}
            <span style={{ fontSize: 11 }}>复核人：{r.checkerName ?? '未签'}</span>
          </Space>
          <Space size={4}>
            {r.qaSignTime
              ? <CheckCircleOutlined style={{ color: '#52C41A', fontSize: 12 }} />
              : <CloseCircleOutlined style={{ color: '#d9d9d9', fontSize: 12 }} />}
            <span style={{ fontSize: 11 }}>QA：{r.qaName ?? '未签'}</span>
          </Space>
        </Space>
      ) },
    { title: '合格证', width: 170,
      render: (_: any, r: CleanupTask) => {
        if (!r.certNo) return <Text type="secondary" style={{ fontSize: 11 }}>尚未生成</Text>;
        const isExpired = r.certStatus === 'EXPIRED' || r.status === 'EXPIRED';
        const isExpiring = r.certStatus === 'EXPIRING';
        return (
          <Space direction="vertical" size={2}>
            <Text code style={{ fontSize: 10 }}>{r.certNo}</Text>
            <Space size={4}>
              {isExpired ? (
                <Tag color="red" style={{ fontSize: 10 }}>❌ 已过期</Tag>
              ) : isExpiring ? (
                <Tag color="orange" style={{ fontSize: 10 }}>⚠ 即将过期</Tag>
              ) : (
                <Tag color="green" style={{ fontSize: 10 }}>✓ 有效</Tag>
              )}
              <span style={{ fontSize: 10, color: '#888' }}>至 {r.certExpireTime}</span>
            </Space>
          </Space>
        );
      } },
    { title: '状态', dataIndex: 'status', width: 115,
      render: (v: CleanupStatus) => {
        const cfg = STATUS_CFG[v];
        return (
          <Space size={4}>
            <span style={{ color: cfg.color, fontSize: 14 }}>{cfg.icon}</span>
            <span style={{ fontSize: 12, color: cfg.color, fontWeight: 500 }}>{cfg.label}</span>
          </Space>
        );
      } },
    { title: '操作', width: 100, fixed: 'right',
      render: (_: any, r: CleanupTask) => {
        const canExec = r.status !== 'EXPIRED' && r.status !== 'OVERDUE';
        return (
          <Space size={0}>
            <Button
              type="link" size="small"
              icon={r.status === 'QA_PASSED' ? <EyeOutlined /> : <CheckSquareOutlined />}
              style={{ padding: '0 6px', fontSize: 12, fontWeight: 600,
                color: canExec ? '#1677FF' : '#888' }}
              onClick={() => setExecTask(r)}
            >
              {r.status === 'QA_PASSED' ? '查看' : '执行'}
            </Button>
            {(r.status === 'EXPIRED') && (
              <Button
                type="link" size="small"
                style={{ padding: '0 4px', fontSize: 12, color: '#E60012' }}
                onClick={() => {
                  const reset: CleanupTask = {
                    ...r,
                    status: 'PENDING',
                    checkItems: makeChecklist(),
                    operatorName: undefined, operatorSignTime: undefined,
                    checkerName: undefined, checkerSignTime: undefined,
                    qaName: undefined, qaSignTime: undefined,
                    certNo: undefined, certIssueTime: undefined,
                    certExpireTime: undefined, certStatus: undefined,
                    triggerTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
                  };
                  handleUpdate(reset);
                  message.info('已重置清场任务，请重新执行清场');
                }}
              >
                重新清场
              </Button>
            )}
          </Space>
        );
      } },
  ];

  return (
    <div style={{ padding: '0 0 16px' }}>
      <Alert
        type="warning" showIcon icon={<SafetyCertificateOutlined />}
        style={{ marginBottom: 12, borderRadius: 8, fontSize: 13 }}
        message={
          <span>
            <strong>清场管理规则：</strong>
            每批产品完工后必须执行清场，完成8项检查清单，经操作人→复核人→QA三级电子签名后生成合格证。
            固体车间 <strong style={{ color: '#1677FF' }}>72小时</strong> 有效，
            液体/软胶囊车间 <strong style={{ color: '#722ED1' }}>48小时</strong> 有效。
            超期须<strong style={{ color: '#E60012' }}>重新清场</strong>，不得直接开工。
          </span>
        }
        closable
      />

      {/* 汇总卡片 */}
      <Row gutter={12} style={{ marginBottom: 12 }}>
        {[
          { label: '待清场', value: summary.pending, color: '#FA8C16', icon: <ClockCircleOutlined /> },
          { label: '清场中', value: summary.inProgress, color: '#1677FF', icon: <ReloadOutlined /> },
          { label: '合格证有效', value: summary.valid, color: '#52C41A', icon: <SafetyCertificateOutlined /> },
          { label: '过期/逾期', value: summary.expired, color: '#E60012', icon: <WarningOutlined /> },
        ].map(c => (
          <Col span={6} key={c.label}>
            <Card size="small" bodyStyle={{ padding: '10px 16px' }}
              style={{ border: `1px solid ${c.color}20`, borderRadius: 8 }}>
              <Row align="middle" gutter={10}>
                <Col>
                  <div style={{ width: 36, height: 36, borderRadius: 8,
                    background: c.color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: c.color, fontSize: 18 }}>
                    {c.icon}
                  </div>
                </Col>
                <Col>
                  <div style={{ fontSize: 22, fontWeight: 700, color: c.color, lineHeight: 1.2 }}>{c.value}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{c.label}</div>
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 过滤 */}
      <div style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', marginBottom: 10, border: '1px solid #f0f0f0' }}>
        <Row gutter={10} align="middle">
          <Col flex="none">
            <Select placeholder="状态过滤" value={filterStatus || undefined}
              onChange={setFilterStatus} allowClear style={{ width: 140 }}
              options={Object.entries(STATUS_CFG).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Col>
          <Col flex="none">
            <Select placeholder="车间过滤" value={filterWorkshop || undefined}
              onChange={setFilterWorkshop} allowClear style={{ width: 130 }}
              options={[
                { value: '固体', label: '固体车间' },
                { value: '软胶囊', label: '软胶囊车间' },
                { value: '液体', label: '液体车间' },
                { value: '外包', label: '外包车间' },
              ]} />
          </Col>
          <Col flex="none">
            <Button icon={<ReloadOutlined />}
              onClick={() => { setFilterStatus(''); setFilterWorkshop(''); }}>
              重置
            </Button>
          </Col>
        </Row>
      </div>

      {/* 表格 */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <div style={{ padding: '9px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <SafetyCertificateOutlined style={{ color: '#52C41A' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>清场任务管理</span>
          <Tag style={{ marginLeft: 4 }}>{filtered.length} 条</Tag>
        </div>
        <Table
          rowKey="id"
          dataSource={filtered}
          columns={columns}
          size="small"
          scroll={{ x: 1400, y: 'calc(100vh - 420px)' }}
          pagination={{ pageSize: 15, showSizeChanger: true, showTotal: t => `共 ${t} 条`, size: 'small' }}
          rowClassName={(r: CleanupTask) =>
            r.status === 'EXPIRED' || r.status === 'OVERDUE'
              ? 'ant-table-row-expired'
              : r.certStatus === 'EXPIRING'
              ? 'ant-table-row-expiring'
              : ''
          }
        />
      </div>

      <CleanupExecuteModal task={execTask} onClose={() => setExecTask(null)} onUpdate={handleUpdate} />

      <style>{`
        .ant-table-row-expired td { background: #FFF2F0 !important; }
        .ant-table-row-expiring td { background: #FFFBE6 !important; }
      `}</style>
    </div>
  );
};

export default CleanupManagePage;
