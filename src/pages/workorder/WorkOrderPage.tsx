import React, { useState, useCallback, useEffect } from 'react';
import {
  Button, Input, Select, Drawer, message, Modal, Form,
  InputNumber, Tabs, Popconfirm, Divider, Tag, Space, Table,
  Tooltip, Badge,
} from 'antd';
import {
  SearchOutlined, PlusOutlined, ReloadOutlined, EyeOutlined,
  SendOutlined, FileTextOutlined, UnorderedListOutlined,
  ApartmentOutlined, PrinterOutlined,
  CheckCircleOutlined, EditOutlined, DeleteOutlined,
  CheckOutlined, RollbackOutlined, DownloadOutlined,
  TeamOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import {
  mockProductionOrders, mockWorkOrders, mockTaskOrders, mockFloatTicketsV2,
  ProductionOrder, WorkOrder, TaskOrder, FloatTicketV2,
  PO_STATUS, WO_STATUS, TASK_STATUS, FT_STATUS,
  POStatus, WOStatus,
  ROUTING_STEPS,
} from './workOrderData';
import './WorkOrderPage.css';
import {
  getProductionOrderList, createProductionOrder, updateProductionOrder, deleteProductionOrder,
} from '../../api/productionOrders';
import type { ProductionOrderRecord } from '../../api/productionOrders';
import { getWorkOrderList, createWorkOrder } from '../../api/workOrders';
import type { WorkOrderRecord } from '../../api/workOrders';
import { getTaskOrderList, createTaskOrder } from '../../api/taskOrders';
import type { TaskOrderRecord } from '../../api/taskOrders';

const { Option } = Select;
const { TextArea } = Input;

// 生成唯一ID
const genId = (prefix: string) => `${prefix}${Date.now()}${Math.floor(Math.random() * 100)}`;
const today = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');
const nowStr = () => new Date().toLocaleString('zh-CN');

// ── 生产订单卡片 ─────────────────────────────────────────────────────
const POCard: React.FC<{
  po: ProductionOrder;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAudit: () => void;
  onUnaudit: () => void;
  onPushWO: () => void;
}> = ({ po, onClick, onEdit, onDelete, onAudit, onUnaudit, onPushWO }) => {
  const sc = PO_STATUS[po.status];
  const woCount = po.workOrders?.length || 0;
  return (
    <div className="wo-card" onClick={onClick}>
      <div className="wo-card-accent" style={{ background: sc.color }} />
      <div className="wo-card-body">
        <div className="wo-row1">
          <span className="wo-no">{po.orderNo}</span>
          {po.soNo && <span className="wo-ref">关联销售单: {po.soNo}</span>}
          <span className="wo-status-badge" style={{ color: sc.color, background: sc.bg }}>{sc.label}</span>
          {po.isAudited && <Tag color="green" style={{ fontSize: 10, padding: '0 4px', marginLeft: 4 }}>已审核</Tag>}
        </div>
        <div className="wo-row2">
          <span className="wo-product">{po.productName} — {po.productSpec}</span>
        </div>
        <div className="wo-row3">
          <span className="wo-pill">总量 <b>{po.totalQty.toLocaleString()} 支</b></span>
          <span className="wo-pill">交期 <b>{po.deliveryDate}</b></span>
          <span className="wo-pill">工单 <b>{woCount}</b> 张</span>
          {po.remark && <span className="wo-pill">备注: {po.remark}</span>}
        </div>
        <div className="wo-row4">
          <span className="wo-meta">🕒 {po.createdAt}</span>
          <span className="wo-meta">👤 {po.createdBy}</span>
        </div>
      </div>
      <div className="wo-card-actions" onClick={e => e.stopPropagation()}>
        <Tooltip title="查看详情">
          <Button size="small" type="text" icon={<EyeOutlined />} onClick={onClick} />
        </Tooltip>
        {po.status === 'OPEN' && !po.isAudited && (
          <Tooltip title="编辑">
            <Button size="small" type="text" icon={<EditOutlined />} onClick={onEdit} />
          </Tooltip>
        )}
        {!po.isAudited && (
          <Tooltip title="审核">
            <Button size="small" type="text" icon={<CheckOutlined />} style={{ color: '#52c41a' }} onClick={onAudit} />
          </Tooltip>
        )}
        {po.isAudited && po.status === 'OPEN' && (
          <Tooltip title="反审核">
            <Button size="small" type="text" icon={<RollbackOutlined />} style={{ color: '#faad14' }} onClick={onUnaudit} />
          </Tooltip>
        )}
        {po.isAudited && po.status === 'OPEN' && (
          <Tooltip title="下推工单">
            <Button size="small" type="text" icon={<DownloadOutlined />} style={{ color: '#1677ff' }} onClick={onPushWO} />
          </Tooltip>
        )}
        {po.status === 'OPEN' && !po.isAudited && (
          <Tooltip title="删除">
            <Popconfirm title="确认删除此生产订单？" onConfirm={onDelete} okText="删除" cancelText="取消"
              okButtonProps={{ danger: true }}>
              <Button size="small" type="text" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

// ── 生产工单卡片 ─────────────────────────────────────────────────────
const WOCard: React.FC<{
  wo: WorkOrder;
  onClick: () => void;
  onCreateTask: () => void;
}> = ({ wo, onClick, onCreateTask }) => {
  const sc = WO_STATUS[wo.status];
  const pct = wo.planQty > 0 && wo.actualQty ? Math.round((wo.actualQty / wo.planQty) * 100) : 0;
  return (
    <div className="wo-card" onClick={onClick}>
      <div className="wo-card-accent" style={{ background: sc.color }} />
      <div className="wo-card-body">
        <div className="wo-row1">
          <span className="wo-no">{wo.woNo}</span>
          <span className="wo-ref">←{wo.poNo}</span>
          <span className="wo-batch-tag">{wo.batchNo}</span>
          <span className="wo-status-badge" style={{ color: sc.color, background: sc.bg }}>{sc.label}</span>
        </div>
        <div className="wo-row2">
          <span className="wo-product">{wo.productName} — {wo.productSpec}</span>
        </div>
        <div className="wo-row3">
          <span className="wo-pill">计划 <b>{wo.planQty.toLocaleString()} 支</b></span>
          {wo.actualQty !== undefined && <span className="wo-pill green">实产 <b>{wo.actualQty.toLocaleString()}</b></span>}
          {wo.scrapQty !== undefined && wo.scrapQty > 0 && <span className="wo-pill red">报废 <b>{wo.scrapQty}</b></span>}
          <span className="wo-pill">{wo.routingName}</span>
        </div>
        {wo.status === 'IN_PROGRESS' && (
          <div className="wo-progress-row">
            <div className="wo-progress-track">
              <div className="wo-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="wo-progress-pct">{pct}%</span>
          </div>
        )}
        <div className="wo-row4">
          <span className="wo-meta">📅 {wo.planStart || '-'} ~ {wo.planEnd || '-'}</span>
          <span className="wo-meta">👤 {wo.createdBy}</span>
        </div>
      </div>
      <div className="wo-card-actions" onClick={e => e.stopPropagation()}>
        <Tooltip title="查看详情">
          <Button size="small" type="text" icon={<EyeOutlined />} onClick={onClick} />
        </Tooltip>
        {(wo.status === 'RELEASED' || wo.status === 'IN_PROGRESS') && (
          <Tooltip title="生成任务单">
            <Button size="small" type="text" icon={<TeamOutlined />} style={{ color: '#1677ff' }} onClick={onCreateTask} />
          </Tooltip>
        )}
      </div>
    </div>
  );
};

// 任务单行
const TaskRow: React.FC<{ task: TaskOrder }> = ({ task }) => {
  const ts = TASK_STATUS[task.status];
  return (
    <div className="task-row">
      <span className="task-icon">📋</span>
      <div className="task-body">
        <div className="task-row1">
          <span className="task-no">{task.taskNo}</span>
          <span className="task-status" style={{ color: ts.color }}>{ts.label}</span>
        </div>
        <div className="task-row2">
          <span className="task-meta">🏭 {task.workCenter}</span>
          <span className="task-meta">👥 {task.team}</span>
          <span className="task-meta">👤 {task.operator}</span>
        </div>
        <div className="task-row3">
          <span className="task-scope">工序: {task.stationScope}</span>
        </div>
        <div className="task-row4">
          <span className="task-meta"><ClockCircleOutlined /> {task.planStart} ~ {task.planEnd}</span>
          {task.reportQty !== undefined && <span className="task-meta green">报工: {task.reportQty.toLocaleString()} 支</span>}
        </div>
      </div>
    </div>
  );
};

// 浮票行
const FTRow: React.FC<{ ft: FloatTicketV2 }> = ({ ft }) => {
  const fs = FT_STATUS[ft.status];
  return (
    <div className="ft-row">
      <div className="ft-row-left">
        <span className="ft-row-no">{ft.ticketNo}</span>
        <span className="ft-row-status" style={{ color: fs.color }}>{fs.label}</span>
        {ft.currentOp && <span className="ft-row-op">📍 {ft.currentOp}</span>}
      </div>
      <div className="ft-row-right">
        <span className="ft-row-time">{ft.printTime}</span>
        <Button size="small" type="text" icon={<PrinterOutlined />} style={{ color: '#666' }}
          onClick={() => message.info(`打印浮票 ${ft.ticketNo}`)} />
      </div>
    </div>
  );
};

// ── 生产订单详情抽屉 ─────────────────────────────────────────────────
const PODrawer: React.FC<{
  po: ProductionOrder | null; open: boolean; onClose: () => void; workOrders: WorkOrder[];
}> = ({ po, open, onClose, workOrders }) => {
  if (!po) return null;
  const sc = PO_STATUS[po.status];
  const relatedWOs = workOrders.filter(w => w.poId === po.id);
  const completedWOs = relatedWOs.filter(w => w.status === 'COMPLETED').length;
  const totalQtyDone = relatedWOs.reduce((s, w) => s + (w.actualQty || 0), 0);
  const pct = po.totalQty > 0 ? Math.round((totalQtyDone / po.totalQty) * 100) : 0;

  return (
    <Drawer open={open} onClose={onClose} width={460} title="生产订单详情"
      styles={{ header: { background: '#fff', borderBottom: '1px solid #e8ecf0' }, body: { background: '#f5f7fa', padding: 16 } }}>
      <div className="wd-section">
        <div className="wd-title">
          📋 订单信息
          <span style={{ color: sc.color, marginLeft: 8, fontSize: 12 }}>{sc.label}</span>
          {po.isAudited && <Tag color="green" style={{ marginLeft: 8, fontSize: 10 }}>已审核</Tag>}
        </div>
        {[
          ['订单号', po.orderNo], ['销售订单', po.soNo || '-'], ['产品名称', po.productName],
          ['产品规格', po.productSpec], ['产品编码', po.productCode],
          ['总计划量', `${po.totalQty.toLocaleString()} 支`],
          ['交货日期', po.deliveryDate], ['备注', po.remark || '-'],
          ['创建人', po.createdBy], ['创建时间', po.createdAt],
        ].map(([l, v]) => (
          <div key={l} className="wd-row">
            <span className="wd-label">{l}</span>
            <span className="wd-val">{v}</span>
          </div>
        ))}
      </div>

      <div className="wd-section">
        <div className="wd-title">📊 工单执行进度</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <div className="wd-qty-card"><div className="wd-qty-val">{relatedWOs.length}</div><div className="wd-qty-label">总工单数</div></div>
          <div className="wd-qty-card wd-qty-green"><div className="wd-qty-val">{completedWOs}</div><div className="wd-qty-label">已完成</div></div>
          <div className="wd-qty-card"><div className="wd-qty-val">{totalQtyDone.toLocaleString()}</div><div className="wd-qty-label">已产出(支)</div></div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#98a2b3', marginBottom: 4 }}>
            <span>整体完成率</span><span style={{ color: '#389e0d', fontWeight: 600 }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: '#f0f2f5', borderRadius: 4 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#52c41a', borderRadius: 4, transition: 'width 0.5s' }} />
          </div>
        </div>
      </div>

      <div className="wd-section">
        <div className="wd-title">⚙️ 关联工单（{relatedWOs.length} 张）</div>
        {relatedWOs.length === 0 ? (
          <div style={{ color: '#98a2b3', fontSize: 12, padding: '8px 0' }}>暂无工单，审核后可下推拆批</div>
        ) : relatedWOs.map(w => {
          const ws = WO_STATUS[w.status];
          return (
            <div key={w.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f2f5' }}>
              <div>
                <div style={{ fontSize: 12, color: '#1d2939', fontWeight: 600 }}>{w.woNo}</div>
                <div style={{ fontSize: 11, color: '#98a2b3' }}>批号: {w.batchNo} · {w.planQty.toLocaleString()} 支</div>
              </div>
              <span style={{ fontSize: 11, color: ws.color, background: ws.bg, padding: '2px 8px', borderRadius: 10, border: `1px solid ${ws.color}30` }}>{ws.label}</span>
            </div>
          );
        })}
      </div>
    </Drawer>
  );
};

// ── 生产工单详情抽屉 ─────────────────────────────────────────────────
const WODrawer: React.FC<{
  wo: WorkOrder | null; open: boolean; onClose: () => void;
  tasks: TaskOrder[]; floatTickets: FloatTicketV2[];
}> = ({ wo, open, onClose, tasks, floatTickets }) => {
  if (!wo) return null;
  const sc = WO_STATUS[wo.status];
  const relatedTasks = tasks.filter(t => t.woId === wo.id);
  const relatedFTs = floatTickets.filter(f => f.woId === wo.id);
  const pct = wo.planQty > 0 && wo.actualQty ? Math.round((wo.actualQty / wo.planQty) * 100) : 0;

  return (
    <Drawer open={open} onClose={onClose} width={460} title="工单详情"
      styles={{ header: { background: '#fff', borderBottom: '1px solid #e8ecf0' }, body: { background: '#f5f7fa', padding: 16 } }}>
      <div className="wd-section">
        <div className="wd-title">📋 工单信息 <span style={{ color: sc.color, marginLeft: 8 }}>{sc.label}</span></div>
        {[
          ['工单号', wo.woNo], ['批号', wo.batchNo], ['来源订单', wo.poNo],
          ['产品', wo.productName], ['规格', wo.productSpec],
          ['工艺路径', wo.routingName], ['计划数量', `${wo.planQty.toLocaleString()} 支`],
          ['实际数量', wo.actualQty ? `${wo.actualQty.toLocaleString()} 支` : '-'],
          ['报废数量', wo.scrapQty ? `${wo.scrapQty} 支` : '0'],
          ['计划开始', wo.planStart || '-'], ['计划结束', wo.planEnd || '-'],
          ['实际开始', wo.actualStart || '-'], ['实际结束', wo.actualEnd || '-'],
          ['创建人', wo.createdBy], ['创建时间', wo.createdAt],
        ].map(([l, v]) => (
          <div key={l} className="wd-row">
            <span className="wd-label">{l}</span>
            <span className="wd-val" style={l === '批号' ? { color: '#1677ff', fontWeight: 600 } : {}}>{v}</span>
          </div>
        ))}
      </div>

      {wo.status === 'IN_PROGRESS' && (
        <div className="wd-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#98a2b3', marginBottom: 6 }}>
            <span>生产进度</span><span style={{ color: '#389e0d', fontWeight: 600 }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: '#f0f2f5', borderRadius: 4 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#52c41a', borderRadius: 4 }} />
          </div>
        </div>
      )}

      <div className="wd-section">
        <div className="wd-title">📌 生产任务单（L3）— {relatedTasks.length} 张</div>
        {relatedTasks.length === 0 ? (
          <div style={{ color: '#98a2b3', fontSize: 12, padding: '6px 0' }}>暂无任务单，可点击工单卡片上"生成任务单"按钮</div>
        ) : relatedTasks.map(t => <TaskRow key={t.id} task={t} />)}
      </div>

      <div className="wd-section">
        <div className="wd-title">🏷️ 生产浮票（L4 随工单）— {relatedFTs.length} 张</div>
        {relatedFTs.length === 0 ? (
          <div style={{ color: '#98a2b3', fontSize: 12, padding: '6px 0' }}>暂无浮票</div>
        ) : relatedFTs.map(f => <FTRow key={f.id} ft={f} />)}
        {wo.status !== 'CREATED' && (
          <Button size="small" icon={<PrinterOutlined />} style={{ marginTop: 8 }}
            onClick={() => message.info('批量打印浮票功能待接入热敏打印机')}>
            批量打印浮票
          </Button>
        )}
      </div>

      {wo.status === 'CREATED' && (
        <Button block type="primary" icon={<SendOutlined />} style={{ marginTop: 8 }}
          onClick={() => { message.success(`工单 ${wo.woNo} 已下发到车间`); onClose(); }}>
          下发工单到车间
        </Button>
      )}
    </Drawer>
  );
};

// ── 新建/编辑生产订单弹窗 ────────────────────────────────────────────
const POFormModal: React.FC<{
  open: boolean;
  editData: ProductionOrder | null;
  onClose: () => void;
  onSaved: (po: ProductionOrder) => Promise<void>;
}> = ({ open, editData, onClose, onSaved }) => {
  const [form] = Form.useForm();
  const isEdit = !!editData;

  React.useEffect(() => {
    if (open) {
      if (editData) {
        form.setFieldsValue({
          soNo: editData.soNo,
          productCode: editData.productCode,
          productName: editData.productName,
          productSpec: editData.productSpec,
          totalQty: editData.totalQty,
          deliveryDate: editData.deliveryDate,
          remark: editData.remark,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editData, form]);

  const handleOk = () => {
    form.validateFields().then(async vals => {
      if (isEdit && editData) {
        const updated: ProductionOrder = {
          ...editData,
          soNo: vals.soNo,
          productCode: vals.productCode,
          productName: vals.productName,
          productSpec: vals.productSpec,
          totalQty: vals.totalQty,
          deliveryDate: vals.deliveryDate,
          remark: vals.remark,
        };
        await onSaved(updated);
        message.success(`生产订单 ${updated.orderNo} 修改成功`);
      } else {
        const newPO: ProductionOrder = {
          id: genId('PO'),
          orderNo: `MO-${today()}-${String(Math.floor(Math.random() * 900) + 100)}`,
          soNo: vals.soNo,
          productCode: vals.productCode,
          productName: vals.productName,
          productSpec: vals.productSpec,
          totalQty: vals.totalQty,
          completedQty: 0,
          scrapQty: 0,
          deliveryDate: vals.deliveryDate,
          remark: vals.remark,
          status: 'OPEN',
          priority: vals.priority || 'NORMAL',
          bomVersion: vals.bomVersion || '1.0',
          routingCode: vals.routingCode || '',
          isAudited: false,
          createdAt: nowStr(),
          createdBy: '当前用户',
          workOrders: [],
        };
        await onSaved(newPO);
        message.success(`生产订单 ${newPO.orderNo} 创建成功`);
      }
      onClose();
      form.resetFields();
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  return (
    <Modal
      open={open}
      title={isEdit ? '编辑生产订单' : '新建生产订单'}
      onCancel={() => { onClose(); form.resetFields(); }}
      onOk={handleOk}
      okText={isEdit ? '保存修改' : '创建订单'}
      cancelText="取消"
      width={520}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="soNo" label="关联销售订单号（选填）">
          <Input placeholder="如 SO-20260420-088" />
        </Form.Item>
        <Form.Item name="productName" label="产品名称" rules={[{ required: true, message: '请填写产品名称' }]}>
          <Input placeholder="如 机用根管锉" />
        </Form.Item>
        <Form.Item name="productCode" label="产品编码" rules={[{ required: true, message: '请填写产品编码' }]}>
          <Input placeholder="如 RKQ-25-04" />
        </Form.Item>
        <Form.Item name="productSpec" label="产品规格" rules={[{ required: true, message: '请填写规格' }]}>
          <Input placeholder="如 #25 / 04锥度 / 25mm" />
        </Form.Item>
        <Form.Item name="totalQty" label="计划总数量（支）" rules={[{ required: true }]}>
          <InputNumber min={1} style={{ width: '100%' }} placeholder="30000" />
        </Form.Item>
        <Form.Item name="deliveryDate" label="交货日期" rules={[{ required: true, message: '请填写交货日期' }]}>
          <Input placeholder="2026-05-10" />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <TextArea rows={2} placeholder="可选填写备注信息" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ── 下推工单弹窗（自动拆批）────────────────────────────────────────────
const PushWOModal: React.FC<{
  open: boolean;
  po: ProductionOrder | null;
  onClose: () => void;
  onPushed: (wos: WorkOrder[]) => void | Promise<void>;
}> = ({ open, po, onClose, onPushed }) => {
  const [form] = Form.useForm();
  const [batchSize, setBatchSize] = useState(5000);

  React.useEffect(() => {
    if (open && po) {
      const defaultBatch = Math.min(5000, po.totalQty);
      setBatchSize(defaultBatch);
      const batchCount = Math.ceil(po.totalQty / defaultBatch);
      form.setFieldsValue({ batchSize: defaultBatch, batchCount });
    }
  }, [open, po, form]);

  const handleBatchSizeChange = (val: number | null) => {
    if (!po || !val) return;
    setBatchSize(val);
    const batchCount = Math.ceil(po.totalQty / val);
    form.setFieldValue('batchCount', batchCount);
  };

  const handleOk = () => {
    form.validateFields().then(vals => {
      if (!po) return;
      const batchCount = Math.ceil(po.totalQty / vals.batchSize);
      const newWOs: WorkOrder[] = [];
      for (let i = 0; i < batchCount; i++) {
        const qty = i < batchCount - 1 ? vals.batchSize : po.totalQty - vals.batchSize * (batchCount - 1);
        const seq = String(i + 1).padStart(3, '0');
        const wo: WorkOrder = {
          id: genId('WO'),
          woNo: `WO-${today()}-${seq}`,
          poId: po.id,
          poNo: po.orderNo,
          batchNo: `RKQ-${today()}-${seq}`,
          productCode: po.productCode,
          productName: po.productName,
          productSpec: po.productSpec,
          bomVersion: po.bomVersion || '1.0',
          planQty: qty,
          routingCode: po.routingCode || 'YS-RKQ-STD-V21',
          routingName: '根管锉标准工艺路径V2.1',
          status: 'RELEASED',
          priority: po.priority || 'NORMAL',
          releaseTime: nowStr(),
          planStart: nowStr(),
          planEnd: '',
          createdAt: nowStr(),
          createdBy: '当前用户',
        };
        newWOs.push(wo);
      }
      onPushed(newWOs);
      message.success(`已自动下推 ${batchCount} 张工单（每批 ${vals.batchSize} 支）`);
      onClose();
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  const batchCount = po ? Math.ceil(po.totalQty / batchSize) : 0;

  return (
    <Modal
      open={open}
      title={`下推生产工单 — ${po?.orderNo}`}
      onCancel={onClose}
      onOk={handleOk}
      okText="确认下推"
      cancelText="取消"
    >
      <div style={{ marginBottom: 12, padding: '10px 14px', background: '#f0f7ff', borderRadius: 6, border: '1px solid #bae0ff', fontSize: 13 }}>
        <div><b>产品：</b>{po?.productName} {po?.productSpec}</div>
        <div><b>总计划量：</b>{po?.totalQty.toLocaleString()} 支</div>
        <div style={{ color: '#666', marginTop: 4, fontSize: 12 }}>⚠️ 医疗器械法规：单批不超过5000支，便于批次追溯</div>
      </div>
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item name="batchSize" label="每批数量（支，建议≤5000）" rules={[{ required: true }]}>
          <InputNumber min={1} max={po?.totalQty || 99999} style={{ width: '100%' }}
            onChange={v => handleBatchSizeChange(v as number)} />
        </Form.Item>
        <Form.Item label="将自动拆分为">
          <div style={{ padding: '8px 12px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6, fontSize: 14, fontWeight: 600, color: '#389e0d' }}>
            共 {batchCount} 张工单，批号从 RKQ-{today()}-001 ~ RKQ-{today()}-{String(batchCount).padStart(3, '0')}
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ── 生成任务单弹窗 ────────────────────────────────────────────────────
const CreateTaskModal: React.FC<{
  open: boolean;
  wo: WorkOrder | null;
  existingTasks: TaskOrder[];
  onClose: () => void;
  onCreated: (tasks: TaskOrder[]) => void | Promise<void>;
}> = ({ open, wo, existingTasks, onClose, onCreated }) => {
  const [form] = Form.useForm();
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);

  const assignedStepIds = existingTasks
    .filter(t => t.woId === wo?.id)
    .flatMap(t => t.stepIds || []);

  const availableSteps = ROUTING_STEPS.filter(s => !assignedStepIds.includes(s.id));

  React.useEffect(() => {
    if (open) {
      form.resetFields();
      setSelectedSteps([]);
    }
  }, [open, form]);

  const handleOk = () => {
    form.validateFields().then(vals => {
      if (!wo || selectedSteps.length === 0) {
        message.warning('请选择至少一道工序');
        return;
      }
      const steps = ROUTING_STEPS.filter(s => selectedSteps.includes(s.id));
      const stepDesc = steps.map(s => `${s.opNo}(${s.name})`).join(', ');
      const taskSeq = (existingTasks.filter(t => t.woId === wo.id).length + 1);
      const suffix = String.fromCharCode(64 + taskSeq); // A, B, C...
      const newTask: TaskOrder = {
        id: genId('TK'),
        taskNo: `TK-${today()}-${wo.woNo.slice(-3)}-${suffix}${taskSeq}`,
        woId: wo.id,
        woNo: wo.woNo,
        batchNo: wo.batchNo,
        workCenter: vals.workCenter,
        shiftId: 'SH01',
        shiftName: '白班',
        team: vals.team,
        operator: vals.operator,
        stationScope: stepDesc,
        stepIds: selectedSteps,
        planQty: wo.planQty,
        planStart: vals.planStart || nowStr(),
        planEnd: vals.planEnd || '',
        status: 'ASSIGNED',
      };
      onCreated([newTask]);
      message.success(`任务单 ${newTask.taskNo} 已创建并派工给 ${vals.team}`);
      onClose();
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  return (
    <Modal
      open={open}
      title={`按工序生成任务单 — ${wo?.woNo}`}
      onCancel={onClose}
      onOk={handleOk}
      okText="生成任务单"
      cancelText="取消"
      width={560}
    >
      <div style={{ marginBottom: 12, padding: '10px 14px', background: '#f0f7ff', borderRadius: 6, border: '1px solid #bae0ff', fontSize: 13 }}>
        <div><b>工单：</b>{wo?.woNo} &nbsp;|&nbsp; <b>批号：</b><span style={{ color: '#1677ff' }}>{wo?.batchNo}</span></div>
        <div><b>产品：</b>{wo?.productName} {wo?.productSpec} &nbsp;|&nbsp; <b>数量：</b>{wo?.planQty.toLocaleString()} 支</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#667085', marginBottom: 6, fontWeight: 600 }}>选择本次任务单负责的工序（可多选）</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {availableSteps.length === 0 ? (
            <span style={{ color: '#98a2b3', fontSize: 12 }}>所有工序已派任务单，无可用工序</span>
          ) : availableSteps.map(step => (
            <div
              key={step.id}
              onClick={() => setSelectedSteps(prev =>
                prev.includes(step.id) ? prev.filter(s => s !== step.id) : [...prev, step.id]
              )}
              style={{
                padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                border: `1px solid ${selectedSteps.includes(step.id) ? '#1677ff' : '#d0d5dd'}`,
                background: selectedSteps.includes(step.id) ? '#e6f4ff' : '#f9fafb',
                color: selectedSteps.includes(step.id) ? '#1677ff' : '#344054',
                fontWeight: selectedSteps.includes(step.id) ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ color: '#98a2b3', fontSize: 11 }}>{step.opNo}</span> {step.name}
            </div>
          ))}
        </div>
        {assignedStepIds.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#98a2b3' }}>
            ✅ 已分配工序：{ROUTING_STEPS.filter(s => assignedStepIds.includes(s.id)).map(s => s.name).join('、')}
          </div>
        )}
      </div>

      <Form form={form} layout="vertical">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <Form.Item name="workCenter" label="工作中心/车间" rules={[{ required: true, message: '请选择工作中心' }]}>
            <Select placeholder="选择车间">
              <Option value="机加工车间">机加工车间</Option>
              <Option value="研磨车间">研磨车间</Option>
              <Option value="精加工车间">精加工车间</Option>
              <Option value="热处理车间">热处理车间</Option>
              <Option value="检验车间">检验车间</Option>
            </Select>
          </Form.Item>
          <Form.Item name="team" label="执行班组" rules={[{ required: true, message: '请选择班组' }]}>
            <Select placeholder="选择班组">
              <Option value="甲班A组">甲班A组</Option>
              <Option value="甲班B组">甲班B组</Option>
              <Option value="乙班A组">乙班A组</Option>
              <Option value="乙班B组">乙班B组</Option>
              <Option value="丙班A组">丙班A组</Option>
            </Select>
          </Form.Item>
          <Form.Item name="operator" label="主操作工" rules={[{ required: true, message: '请填写操作工' }]}>
            <Input placeholder="如 张三" />
          </Form.Item>
          <Form.Item name="planStart" label="计划开始时间">
            <Input placeholder="2026-04-25 08:00" />
          </Form.Item>
          <Form.Item name="planEnd" label="计划结束时间">
            <Input placeholder="2026-04-25 14:00" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

// ── 主页面 ───────────────────────────────────────────────────────────
const WorkOrderPage: React.FC = () => {
  const [pos, setPos] = useState<ProductionOrder[]>(mockProductionOrders);
  const [wos, setWos] = useState<WorkOrder[]>(mockWorkOrders);
  const [tasks, setTasks] = useState<TaskOrder[]>(mockTaskOrders);
  const [floatTickets] = useState<FloatTicketV2[]>(mockFloatTicketsV2);

  // ── Backend priority mapping helpers ──────────────────────────────
  const PO_STATUS_MAP: Record<string, POStatus> = {
    DRAFT: 'OPEN', RELEASED: 'RELEASED', IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED', CLOSED: 'COMPLETED',
  };
  const WO_STATUS_MAP: Record<string, WOStatus> = {
    DRAFT: 'CREATED', RELEASED: 'RELEASED', IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED', CLOSED: 'COMPLETED',
  };

  // ── API data loading ───────────────────────────────────────────────
  const loadFromApi = useCallback(async () => {
    try {
      const [poResp, woResp, tkResp] = await Promise.allSettled([
        getProductionOrderList() as Promise<any>,
        getWorkOrderList()        as Promise<any>,
        getTaskOrderList()        as Promise<any>,
      ]);

      // Production orders (L1)
      if (poResp.status === 'fulfilled') {
        const apiPos: ProductionOrderRecord[] = poResp.value?.data ?? [];
        if (apiPos.length > 0) {
          setPos(apiPos.map(p => ({
            id:          String(p.id ?? ''),
            orderNo:     p.orderNo ?? '',
            soNo:        p.customerName ? undefined : undefined, // no soNo in backend
            productCode: '',
            productName: p.customerName ?? '',
            productSpec: '',
            totalQty:    p.totalQuantity ?? 0,
            completedQty: p.completedQuantity ?? 0,
            scrapQty:    0,
            deliveryDate: p.deliveryDate ?? '',
            remark:      p.remark ?? '',
            status:      PO_STATUS_MAP[p.status ?? ''] ?? 'OPEN',
            priority:    p.priority === 4 ? 'URGENT' : p.priority === 3 ? 'HIGH' : p.priority === 1 ? 'LOW' : 'NORMAL',
            bomVersion:  '1.0',
            routingCode: '',
            isAudited:   p.status !== 'DRAFT',
            createdAt:   p.createTime?.slice(0, 19).replace('T', ' ') ?? '',
            createdBy:   p.createBy ?? '',
            workOrders:  [],
          } as ProductionOrder)));
        }
      }

      // Work orders (L2)
      if (woResp.status === 'fulfilled') {
        const apiWos: WorkOrderRecord[] = woResp.value?.data ?? [];
        if (apiWos.length > 0) {
          setWos(apiWos.map(w => ({
            id:          String(w.id ?? ''),
            woNo:        w.workOrderNo ?? '',
            poId:        w.orderId ? String(w.orderId) : '',
            poNo:        w.orderNo ?? '',
            batchNo:     w.workOrderNo ?? '',
            productCode: w.materialCode ?? '',
            productName: w.materialName ?? '',
            productSpec: w.spec ?? '',
            bomVersion:  w.bomVersion ?? '1.0',
            planQty:     w.planQuantity ?? 0,
            actualQty:   w.completedQuantity ?? undefined,
            scrapQty:    w.unqualifiedQuantity ?? undefined,
            routingCode: '',
            routingName: w.workCenterName ?? '标准工艺路径',
            status:      WO_STATUS_MAP[w.status ?? ''] ?? 'CREATED',
            priority:    'NORMAL',
            planStart:   w.startDate ?? '',
            planEnd:     w.endDate ?? '',
            actualStart: w.actualStartTime ?? undefined,
            actualEnd:   w.actualEndTime ?? undefined,
            createdAt:   w.createTime?.slice(0, 19).replace('T', ' ') ?? '',
            createdBy:   w.createBy ?? '',
          } as WorkOrder)));
        }
      }

      // Task orders (L3)
      if (tkResp.status === 'fulfilled') {
        const apiTasks: TaskOrderRecord[] = tkResp.value?.data ?? [];
        if (apiTasks.length > 0) {
          setTasks(apiTasks.map(t => ({
            id:          String(t.id ?? ''),
            taskNo:      t.taskNo ?? '',
            woId:        t.workOrderId ? String(t.workOrderId) : '',
            woNo:        t.workOrderNo ?? '',
            batchNo:     '',
            workCenter:  t.workCenterName ?? '',
            shiftId:     'SH01',
            shiftName:   '白班',
            team:        '',
            operator:    t.assignedToName ?? '',
            stationScope: t.operationName ?? '',
            stepIds:     t.operationCode ? [t.operationCode] : [],
            planQty:     t.planQuantity ?? 0,
            reportQty:   t.completedQuantity ?? undefined,
            planStart:   t.startTime ?? '',
            planEnd:     t.endTime ?? '',
            status:      (t.status === 'PENDING' ? 'ASSIGNED' : t.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : t.status === 'COMPLETED' ? 'COMPLETED' : 'ASSIGNED') as any,
          } as TaskOrder)));
        }
      }
    } catch { /* keep mock on full failure */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  // 抽屉/弹窗状态
  const [poDrawerOpen, setPoDrawerOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<ProductionOrder | null>(null);
  const [woDrawerOpen, setWoDrawerOpen] = useState(false);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);

  // PO表单弹窗
  const [poFormOpen, setPoFormOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<ProductionOrder | null>(null);

  // 下推工单弹窗
  const [pushWOOpen, setPushWOOpen] = useState(false);
  const [pushingPO, setPushingPO] = useState<ProductionOrder | null>(null);

  // 生成任务单弹窗
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [taskTargetWO, setTaskTargetWO] = useState<WorkOrder | null>(null);

  const [activeTab, setActiveTab] = useState('wo');
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // 汇总
  const woSummary = {
    created:    wos.filter(w => w.status === 'CREATED').length,
    released:   wos.filter(w => w.status === 'RELEASED').length,
    inProgress: wos.filter(w => w.status === 'IN_PROGRESS').length,
    completed:  wos.filter(w => w.status === 'COMPLETED').length,
    total:      wos.length,
  };
  const poSummary = {
    open:       pos.filter(p => p.status === 'OPEN').length,
    released:   pos.filter(p => p.status === 'RELEASED').length,
    inProgress: pos.filter(p => p.status === 'IN_PROGRESS').length,
    completed:  pos.filter(p => p.status === 'COMPLETED').length,
    total:      pos.length,
  };

  // 过滤
  const filteredWOs = wos.filter(w => {
    const matchText = !searchText || w.woNo.includes(searchText) || w.batchNo.includes(searchText) || w.productName.includes(searchText);
    const matchStatus = filterStatus === 'ALL' || w.status === filterStatus;
    return matchText && matchStatus;
  });
  const filteredPOs = pos.filter(p => {
    const matchText = !searchText || p.orderNo.includes(searchText) || p.productName.includes(searchText) || (p.soNo || '').includes(searchText);
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchText && matchStatus;
  });

  // ── 生产订单操作 ──
  const handleAudit = (po: ProductionOrder) => {
    setPos(prev => prev.map(p => p.id === po.id ? { ...p, isAudited: true } : p));
    message.success(`订单 ${po.orderNo} 已审核通过，可下推工单`);
  };

  const handleUnaudit = (po: ProductionOrder) => {
    setPos(prev => prev.map(p => p.id === po.id ? { ...p, isAudited: false } : p));
    message.warning(`订单 ${po.orderNo} 已反审核`);
  };

  const handleDeletePO = async (po: ProductionOrder) => {
    const numId = Number(po.id);
    try {
      if (!isNaN(numId) && numId > 0) await deleteProductionOrder(numId);
    } catch { /* ignore, remove locally anyway */ }
    setPos(prev => prev.filter(p => p.id !== po.id));
    message.success(`订单 ${po.orderNo} 已删除`);
  };

  const handleSavePO = async (po: ProductionOrder) => {
    // 判断是新增还是编辑：id 以 'PO' 前缀开头说明是本地生成的新PO，否则为API回来的数字ID
    const numId = Number(po.id);
    const isNew = isNaN(numId) || numId <= 0;
    const payload: ProductionOrderRecord = {
      orderNo:     po.orderNo,
      deliveryDate: po.deliveryDate,
      totalQuantity: po.totalQty,
      remark:       po.remark,
      status:       'DRAFT',
    };
    try {
      if (isNew) {
        const resp = await createProductionOrder(payload) as any;
        const saved = resp?.data;
        const finalPo: ProductionOrder = {
          ...po,
          id: saved?.id ? String(saved.id) : po.id,
          orderNo: saved?.orderNo ?? po.orderNo,
        };
        setPos(prev => [finalPo, ...prev]);
      } else {
        await updateProductionOrder(numId, payload);
        setPos(prev => prev.map(p => p.id === po.id ? po : p));
      }
    } catch {
      // HTTP interceptor already toasted the error; still update local state optimistically
      setPos(prev => {
        const idx = prev.findIndex(p => p.id === po.id);
        if (idx >= 0) { const next = [...prev]; next[idx] = po; return next; }
        return [po, ...prev];
      });
    }
  };

  const handlePushWOs = async (newWOs: WorkOrder[]) => {
    // Persist each work order to backend
    const savedWOs: WorkOrder[] = [];
    for (const wo of newWOs) {
      try {
        const payload: WorkOrderRecord = {
          workOrderNo:   wo.woNo,
          orderId:       pushingPO ? Number(pushingPO.id) || undefined : undefined,
          orderNo:       wo.poNo,
          planQuantity:  wo.planQty,
          bomVersion:    wo.bomVersion,
          status:        'RELEASED',
          remark:        wo.batchNo,
        };
        const resp = await createWorkOrder(payload) as any;
        savedWOs.push({
          ...wo,
          id: resp?.data?.id ? String(resp.data.id) : wo.id,
        });
      } catch {
        savedWOs.push(wo); // fallback: keep local
      }
    }
    setWos(prev => [...savedWOs, ...prev]);
    if (pushingPO) {
      setPos(prev => prev.map(p => p.id === pushingPO.id
        ? { ...p, status: 'RELEASED' as POStatus, workOrders: savedWOs.map(w => w.woNo) }
        : p));
    }
  };

  const handleCreateTasks = async (newTasks: TaskOrder[]) => {
    // Persist each task to backend, then update local state
    const savedTasks: TaskOrder[] = [];
    for (const task of newTasks) {
      try {
        const woNumId = Number(task.woId);
        const payload: TaskOrderRecord = {
          taskNo:        task.taskNo,
          workOrderId:   !isNaN(woNumId) && woNumId > 0 ? woNumId : undefined,
          workOrderNo:   task.woNo,
          workCenterName: task.workCenter,
          assignedToName: task.operator,
          planQuantity:  task.planQty,
          status:        'PENDING',
        };
        const resp = await createTaskOrder(payload) as any;
        savedTasks.push({
          ...task,
          id: resp?.data?.id ? String(resp.data.id) : task.id,
        });
      } catch {
        savedTasks.push(task);
      }
    }
    setTasks(prev => [...savedTasks, ...prev]);
    if (taskTargetWO) {
      setWos(prev => prev.map(w => w.id === taskTargetWO.id && w.status === 'RELEASED'
        ? { ...w, status: 'IN_PROGRESS' as WOStatus }
        : w));
    }
  };

  const tabItems = [
    {
      key: 'wo',
      label: <span><UnorderedListOutlined /> 生产工单 L2</span>,
      children: (
        <>
          <div className="wo-kpi-row">
            {[
              { label: '已创建', val: woSummary.created,    color: '#8c8c8c' },
              { label: '已下发', val: woSummary.released,   color: '#faad14' },
              { label: '生产中', val: woSummary.inProgress, color: '#52c41a' },
              { label: '已完成', val: woSummary.completed,  color: '#13c2c2' },
              { label: '合计',   val: woSummary.total,      color: '#1d2939' },
            ].map(k => (
              <div key={k.label} className="wo-kpi">
                <div className="wo-kpi-val" style={{ color: k.color }}>{k.val}</div>
                <div className="wo-kpi-label">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="wo-toolbar">
            <div style={{ display: 'flex', gap: 8, flex: 1 }}>
              <Input prefix={<SearchOutlined style={{ color: '#666' }} />} placeholder="搜索工单号/批号/产品..."
                value={searchText} onChange={e => setSearchText(e.target.value)}
                style={{ width: 240 }} allowClear />
              <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 130 }}>
                <Option value="ALL">全部状态</Option>
                {Object.entries(WO_STATUS).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
              </Select>
            </div>
            <Button icon={<ReloadOutlined />} onClick={() => { loadFromApi(); message.success('已刷新'); }}>刷新</Button>
          </div>
          <div className="wo-list">
            {filteredWOs.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#98a2b3', padding: '40px 0', fontSize: 14 }}>暂无工单数据</div>
            ) : filteredWOs.map(wo => (
              <WOCard
                key={wo.id}
                wo={wo}
                onClick={() => { setSelectedWO(wo); setWoDrawerOpen(true); }}
                onCreateTask={() => { setTaskTargetWO(wo); setCreateTaskOpen(true); }}
              />
            ))}
          </div>
        </>
      ),
    },
    {
      key: 'po',
      label: <span><FileTextOutlined /> 生产订单 L1</span>,
      children: (
        <>
          <div className="wo-kpi-row">
            {[
              { label: '待下发', val: poSummary.open,        color: '#faad14' },
              { label: '已下发', val: poSummary.released,    color: '#1890ff' },
              { label: '生产中', val: poSummary.inProgress,  color: '#52c41a' },
              { label: '已完成', val: poSummary.completed,   color: '#13c2c2' },
              { label: '合计',   val: poSummary.total,       color: '#1d2939' },
            ].map(k => (
              <div key={k.label} className="wo-kpi">
                <div className="wo-kpi-val" style={{ color: k.color }}>{k.val}</div>
                <div className="wo-kpi-label">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="wo-toolbar">
            <div style={{ display: 'flex', gap: 8, flex: 1 }}>
              <Input prefix={<SearchOutlined style={{ color: '#666' }} />} placeholder="搜索订单号/销售单/产品..."
                value={searchText} onChange={e => setSearchText(e.target.value)}
                style={{ width: 240 }} allowClear />
              <Select value={filterStatus} onChange={setFilterStatus} style={{ width: 130 }}>
                <Option value="ALL">全部状态</Option>
                {Object.entries(PO_STATUS).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
              </Select>
            </div>
            <Button type="primary" icon={<PlusOutlined />}
              onClick={() => { setEditingPO(null); setPoFormOpen(true); }}>
              新建订单
            </Button>
          </div>
          <div className="wo-list">
            {filteredPOs.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#98a2b3', padding: '40px 0', fontSize: 14 }}>暂无订单数据</div>
            ) : filteredPOs.map(po => (
              <POCard
                key={po.id}
                po={po}
                onClick={() => { setSelectedPO(po); setPoDrawerOpen(true); }}
                onEdit={() => { setEditingPO(po); setPoFormOpen(true); }}
                onDelete={() => handleDeletePO(po)}
                onAudit={() => handleAudit(po)}
                onUnaudit={() => handleUnaudit(po)}
                onPushWO={() => { setPushingPO(po); setPushWOOpen(true); }}
              />
            ))}
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="wo-page">
      <div className="wo-page-header">
        <ApartmentOutlined style={{ color: '#1677ff', marginRight: 8 }} />
        生产管理（L1 生产订单 → L2 生产工单 → L3 生产任务单 → L4 生产浮票）
      </div>

      <div className="wo-tabs-wrap">
        <Tabs
          activeKey={activeTab}
          onChange={k => { setActiveTab(k); setSearchText(''); setFilterStatus('ALL'); }}
          items={tabItems}
          tabBarStyle={{ background: '#fff', padding: '0 16px', borderBottom: '1px solid #e8ecf0', marginBottom: 0 }}
        />
      </div>

      {/* 抽屉和弹窗 */}
      <PODrawer po={selectedPO} open={poDrawerOpen} onClose={() => setPoDrawerOpen(false)} workOrders={wos} />
      <WODrawer wo={selectedWO} open={woDrawerOpen} onClose={() => setWoDrawerOpen(false)} tasks={tasks} floatTickets={floatTickets} />
      <POFormModal
        open={poFormOpen}
        editData={editingPO}
        onClose={() => setPoFormOpen(false)}
        onSaved={handleSavePO}
      />
      <PushWOModal
        open={pushWOOpen}
        po={pushingPO}
        onClose={() => setPushWOOpen(false)}
        onPushed={handlePushWOs}
      />
      <CreateTaskModal
        open={createTaskOpen}
        wo={taskTargetWO}
        existingTasks={tasks}
        onClose={() => setCreateTaskOpen(false)}
        onCreated={handleCreateTasks}
      />
    </div>
  );
};

export default WorkOrderPage;
