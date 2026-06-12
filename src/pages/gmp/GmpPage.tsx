/**
 * GMP合规管理页面 — 增强版
 * 包含：偏差处理（MINOR/MAJOR/CRITICAL）、CAPA管理（闭环流程）、卫生管理记录（8项检查）、不合格品处置
 * 符合《保健食品良好生产规范》GB17405-1998 及 21 CFR Part 111
 */
import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Modal, Form, Input, Select,
  DatePicker, Space, Statistic, Alert, Tabs, Badge, Divider,
  Descriptions, message, Progress, Checkbox, Steps, Timeline,
  InputNumber, Upload, Tooltip,
} from 'antd';
import {
  WarningOutlined, CheckCircleOutlined, AuditOutlined,
  ExperimentOutlined, PlusOutlined, SafetyCertificateOutlined,
  CloseCircleOutlined, SyncOutlined, FileTextOutlined,
  EditOutlined, EyeOutlined, SendOutlined, StopOutlined,
  UploadOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

// ─── API instance ────────────────────────────────────────────────────
const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(cfg => {
  const t = localStorage.getItem('mes_token') || localStorage.getItem('auth_token') || '';
  if (t) cfg.headers!['Authorization'] = `Bearer ${t}`;
  return cfg;
});

// ─── Types ──────────────────────────────────────────────────────────
type DevSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';
type DevStatus   = 'OPEN' | 'INVESTIGATION' | 'PENDING_CLOSE' | 'CLOSED';
type CapaStatus  = 'PENDING' | 'IN_PROGRESS' | 'VERIFY' | 'COMPLETED' | 'OVERDUE';

const SEV_COLOR: Record<DevSeverity, string> = {
  MINOR:    'blue',
  MAJOR:    'orange',
  CRITICAL: 'red',
};
const SEV_LABEL: Record<DevSeverity, string> = {
  MINOR:    '一般(MINOR)',
  MAJOR:    '重要(MAJOR)',
  CRITICAL: '严重(CRITICAL)',
};
const SEV_DESC: Record<DevSeverity, string> = {
  MINOR:    '对产品质量影响较小，可控',
  MAJOR:    '对产品质量有潜在影响，需立即调查',
  CRITICAL: '对产品质量/患者安全有重大影响，必须立即处置',
};

const STATUS_STEPS = ['已开立', '调查中', '待关闭确认', '已关闭'];
const statusToStep: Record<DevStatus, number> = {
  OPEN: 0, INVESTIGATION: 1, PENDING_CLOSE: 2, CLOSED: 3,
};

// 8项卫生检查项目（GMP保健品规范）
const HYGIENE_CHECKLIST = [
  { key: 'equipment_clean',   label: '设备/管道清洁消毒',     required: true  },
  { key: 'floor_wall_clean',  label: '地面/墙面/天花板清洁',  required: true  },
  { key: 'air_disinfection',  label: '空气消毒（紫外灯/臭氧）',required: true  },
  { key: 'dressing_room',     label: '更衣室/洗手设施检查',   required: true  },
  { key: 'tools_clean',       label: '工器具清洗灭菌',        required: true  },
  { key: 'pest_control',      label: '虫害防控检查',          required: false },
  { key: 'temp_humidity',     label: '温湿度记录',            required: true  },
  { key: 'personnel_hygiene', label: '人员卫生（健康证/着装）',required: true  },
];

// ─── Demo data ───────────────────────────────────────────────────────
const deviationDemoData = [
  { id: 1, dev_code: 'DEV-2026060001', wo_code: 'PO-20260601001', title: '称量偏差超限',    type: '工艺偏差', severity: 'MINOR'    as DevSeverity, status: 'CLOSED'      as DevStatus, create_time: '2026-06-02', handler: '张质检', batch_no: 'BN-20260601001', desc: '碳酸钙称量差异0.8%，超出允许范围0.5%', deadline: '2026-06-09', investigation: '冲量筒未校准', root_cause: '计量器具未按计划校验', action: '立即重新校准，更新校验计划' },
  { id: 2, dev_code: 'DEV-2026060002', wo_code: 'PO-20260601002', title: '压片硬度异常',    type: '设备偏差', severity: 'MAJOR'    as DevSeverity, status: 'INVESTIGATION' as DevStatus, create_time: '2026-06-03', handler: '李操作', batch_no: 'BN-20260601002', desc: '压片硬度低于标准值，怀疑冲头磨损', deadline: '2026-06-05', investigation: '冲头磨损导致', root_cause: '', action: '' },
  { id: 3, dev_code: 'DEV-2026060003', wo_code: 'PO-20260601003', title: '胶囊规格偏差',    type: '物料偏差', severity: 'MINOR'    as DevSeverity, status: 'CLOSED'      as DevStatus, create_time: '2026-06-04', handler: '王质检', batch_no: 'BN-20260601003', desc: '软胶囊壁厚偏差±0.05mm，超出GMP规范', deadline: '2026-06-11', investigation: '胶皮液配方不稳定', root_cause: '供应商批次差异', action: '更换合格供应商批次' },
  { id: 4, dev_code: 'DEV-2026060004', wo_code: 'PO-20260605001', title: '灭菌温度波动',    type: '环境偏差', severity: 'CRITICAL' as DevSeverity, status: 'OPEN'        as DevStatus, create_time: '2026-06-06', handler: '刘工程师', batch_no: 'BN-20260605001', desc: '灭菌箱温度波动±3°C，超出允许±1°C，F0值受影响', deadline: '2026-06-07', investigation: '', root_cause: '', action: '' },
];

const capaDemoData = [
  { id: 1, capa_code: 'CAPA-2026060001', title: '压片机冲头更换计划', type: '纠正措施', source: 'DEV-2026060002', status: 'IN_PROGRESS' as CapaStatus, priority: '高', due_date: '2026-06-30', owner: '设备部-刘工', progress: 60, verify_date: '', verify_result: '', approver: '' },
  { id: 2, capa_code: 'CAPA-2026060002', title: '称量操作SOP修订', type: '预防措施', source: 'DEV-2026060001', status: 'COMPLETED' as CapaStatus, priority: '中', due_date: '2026-06-15', owner: '质量部-张质检', progress: 100, verify_date: '2026-06-14', verify_result: '验证合格，称量偏差恢复正常', approver: 'QA负责人-陈经理' },
  { id: 3, capa_code: 'CAPA-2026060003', title: '灭菌系统校准验证', type: '纠正措施', source: 'DEV-2026060004', status: 'PENDING' as CapaStatus, priority: '紧急', due_date: '2026-06-20', owner: '工程部-王工', progress: 10, verify_date: '', verify_result: '', approver: '' },
];

const hygieneDemoData = [
  { id: 1, record_no: 'HYG-20260611-001', workshop: '固体制剂车间(NJ)', area: '称量间', record_date: '2026-06-11', shift: '白班', operator: '李操作员', temp: 22.3, humidity: 48, checklist: { equipment_clean: true, floor_wall_clean: true, air_disinfection: true, dressing_room: true, tools_clean: true, pest_control: true, temp_humidity: true, personnel_hygiene: true }, result: '合格', remark: '' },
  { id: 2, record_no: 'HYG-20260611-002', workshop: '固体制剂车间(NJ)', area: '压片间', record_date: '2026-06-11', shift: '白班', operator: '王芳', temp: 23.1, humidity: 45, checklist: { equipment_clean: true, floor_wall_clean: true, air_disinfection: true, dressing_room: true, tools_clean: true, pest_control: false, temp_humidity: true, personnel_hygiene: true }, result: '合格', remark: '虫害防控已委托外包，本班次正常' },
  { id: 3, record_no: 'HYG-20260610-001', workshop: '软胶囊车间(NJ)', area: '灌装间', record_date: '2026-06-10', shift: '夜班', operator: '陈班长', temp: 21.8, humidity: 52, checklist: { equipment_clean: true, floor_wall_clean: true, air_disinfection: true, dressing_room: true, tools_clean: true, pest_control: true, temp_humidity: true, personnel_hygiene: true }, result: '合格', remark: '' },
  { id: 4, record_no: 'HYG-20260610-002', workshop: '液体制剂车间(LS)', area: '灌装间', record_date: '2026-06-10', shift: '白班', operator: '刘操作', temp: 24.5, humidity: 58, checklist: { equipment_clean: true, floor_wall_clean: false, air_disinfection: true, dressing_room: true, tools_clean: true, pest_control: false, temp_humidity: true, personnel_hygiene: true }, result: '待复查', remark: '地面有积水痕迹，需整改后复查' },
];

// ─── Main Page ───────────────────────────────────────────────────────
const GmpPage: React.FC<{ subPage?: string }> = ({ subPage = 'gmp-deviation' }) => {
  const [activeTab, setActiveTab] = useState(
    subPage === 'gmp-capa' ? 'capa' : subPage === 'gmp-hygiene' ? 'hygiene' : 'deviation'
  );
  const token = localStorage.getItem('mes_token') || localStorage.getItem('auth_token') || '';
  const headers = { Authorization: `Bearer ${token}` };

  return (
    <div style={{ padding: 16 }}>
      <Card bordered={false}
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#722ed1' }} />
            <span style={{ fontWeight: 600, fontSize: 15 }}>GMP合规管理</span>
            <Tag color="purple">符合《保健食品良好生产规范》GB17405 · 21 CFR Part 111</Tag>
          </Space>
        }
      >
        <GmpKpiBar headers={headers} />
        <Divider style={{ margin: '12px 0' }} />
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'deviation',
              label: <><WarningOutlined />偏差处理</>,
              children: <DeviationTab headers={headers} />,
            },
            {
              key: 'capa',
              label: <><AuditOutlined />CAPA管理</>,
              children: <CapaTab headers={headers} />,
            },
            {
              key: 'hygiene',
              label: <><ExperimentOutlined />卫生管理记录</>,
              children: <HygieneTab headers={headers} />,
            },
            {
              key: 'nc',
              label: <><CloseCircleOutlined />不合格品处置</>,
              children: <NcTab headers={headers} />,
            },
          ]}
        />
      </Card>
    </div>
  );
};

// ─── GMP KPI Bar ────────────────────────────────────────────────────
const GmpKpiBar: React.FC<{ headers: any }> = ({ headers }) => {
  const [stats, setStats] = useState<any>({});
  useEffect(() => {
    API.get('/gmp/deviations').then(r => {
      const list = r.data?.data?.list ?? r.data?.data ?? [];
      const open = list.filter((d: any) => d.status === 'OPEN' || d.status === 'INVESTIGATION').length;
      const closed = list.filter((d: any) => d.status === 'CLOSED').length;
      const critical = list.filter((d: any) => d.severity === 'CRITICAL' || d.severity === '严重').length;
      setStats({ openDeviations: open, closedDeviations: closed, criticalDeviations: critical });
    }).catch(() => {
      setStats({ openDeviations: 2, closedDeviations: 12, criticalDeviations: 1, openCapa: 2, overdueCapa: 1, ncPending: 1, monthlyInspections: 47 });
    });
  }, []);

  return (
    <Row gutter={16}>
      {[
        { title: '未关闭偏差', value: stats.openDeviations ?? 2,    color: '#fa8c16', icon: <WarningOutlined /> },
        { title: '严重偏差',   value: stats.criticalDeviations ?? 1, color: '#ff4d4f', icon: <CloseCircleOutlined /> },
        { title: '已关闭偏差', value: stats.closedDeviations ?? 12,  color: '#52c41a', icon: <CheckCircleOutlined /> },
        { title: '进行中CAPA', value: stats.openCapa ?? 2,           color: '#1677ff', icon: <AuditOutlined /> },
        { title: '逾期CAPA',   value: stats.overdueCapa ?? 1,        color: '#ff4d4f', icon: <ClockCircleOutlined /> },
        { title: '本月卫生检查', value: stats.monthlyInspections ?? 47, color: '#13c2c2', icon: <FileTextOutlined /> },
      ].map((k, i) => (
        <Col span={4} key={i}>
          <Card size="small" bordered style={{ borderTop: `3px solid ${k.color}` }}>
            <Statistic title={k.title} value={k.value} valueStyle={{ color: k.color }} prefix={k.icon} />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

// ─── Deviation Tab (enhanced) ────────────────────────────────────────
const DeviationTab: React.FC<{ headers: any }> = ({ headers }) => {
  const [data, setData] = useState<any[]>(deviationDemoData);
  const [showAdd, setShowAdd] = useState(false);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [closeRecord, setCloseRecord] = useState<any>(null);
  const [form] = Form.useForm();
  const [closeForm] = Form.useForm();

  useEffect(() => {
    API.get('/gmp/deviations').then(r => {
      const list = r.data?.data?.list ?? r.data?.data ?? [];
      if (list.length > 0) {
        const mapped = list.map((d: any) => ({
          id: d.id, dev_code: d.dev_code ?? d.devCode ?? '',
          wo_code: d.wo_code ?? d.woCode ?? '', title: d.title ?? '',
          type: d.deviation_type ?? d.type ?? '工艺偏差',
          severity: (d.severity ?? 'MINOR') as DevSeverity,
          status: (d.status ?? 'OPEN') as DevStatus,
          create_time: (d.create_time ?? d.createTime ?? '').slice(0, 10),
          handler: d.handler ?? d.discoverer ?? '',
          batch_no: d.batch_no ?? d.batchNo ?? '',
          desc: d.description ?? d.desc ?? '',
          deadline: d.deadline ?? '', investigation: d.investigation ?? '',
          root_cause: d.root_cause ?? '', action: d.action ?? '',
        }));
        setData(mapped);
      }
    }).catch(() => {});
  }, []);

  const handleAdd = () => {
    form.validateFields().then(values => {
      const newRec = {
        id: data.length + 1,
        dev_code: `DEV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(data.length+1).padStart(3,'0')}`,
        wo_code: values.wo_code ?? '',
        title: values.title, type: values.type,
        severity: values.severity as DevSeverity,
        status: 'OPEN' as DevStatus,
        create_time: dayjs().format('YYYY-MM-DD'),
        handler: values.handler ?? '当前用户',
        batch_no: values.batch_no ?? '',
        desc: values.desc,
        deadline: values.severity === 'CRITICAL' ? dayjs().add(1,'day').format('YYYY-MM-DD')
          : values.severity === 'MAJOR' ? dayjs().add(2,'day').format('YYYY-MM-DD')
          : dayjs().add(7,'day').format('YYYY-MM-DD'),
        investigation: '', root_cause: '', action: '',
      };
      setData(prev => [newRec, ...prev]);
      message.success('偏差单已创建，请在24小时内启动调查');
      setShowAdd(false);
      form.resetFields();
    });
  };

  const handleAdvanceStatus = (record: any) => {
    const next: Record<DevStatus, DevStatus> = {
      OPEN: 'INVESTIGATION', INVESTIGATION: 'PENDING_CLOSE', PENDING_CLOSE: 'CLOSED', CLOSED: 'CLOSED',
    };
    if (record.status === 'INVESTIGATION') {
      setCloseRecord(record);
      return;
    }
    setData(prev => prev.map(d => d.id === record.id ? { ...d, status: next[d.status as DevStatus] } : d));
    message.success('状态已更新');
  };

  const handleClose = () => {
    closeForm.validateFields().then(values => {
      setData(prev => prev.map(d =>
        d.id === closeRecord.id
          ? { ...d, status: 'PENDING_CLOSE' as DevStatus, investigation: values.investigation, root_cause: values.root_cause, action: values.action }
          : d
      ));
      message.success('调查结论已提交，等待QA审批关闭');
      setCloseRecord(null);
      closeForm.resetFields();
    });
  };

  const statusColor: Record<DevStatus, 'processing' | 'warning' | 'default' | 'success'> = {
    OPEN: 'processing', INVESTIGATION: 'warning', PENDING_CLOSE: 'default', CLOSED: 'success',
  };
  const statusLabel: Record<DevStatus, string> = {
    OPEN: '已开立', INVESTIGATION: '调查中', PENDING_CLOSE: '待审批关闭', CLOSED: '已关闭',
  };

  return (
    <div>
      <Alert
        message={
          <span>
            <strong>偏差分级处理规则：</strong>
            <Tag color="blue">MINOR</Tag>7天内关闭 &nbsp;
            <Tag color="orange">MAJOR</Tag>48h内启动调查 &nbsp;
            <Tag color="red">CRITICAL</Tag>24h内启动，立即上报QA负责人，必须启动CAPA
          </span>
        }
        type="warning" showIcon style={{ marginBottom: 12 }}
      />
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          {(['MINOR','MAJOR','CRITICAL'] as DevSeverity[]).map(s => (
            <Tag key={s} color={SEV_COLOR[s]}>{SEV_LABEL[s]}：{data.filter(d => d.severity === s).length}条</Tag>
          ))}
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAdd(true)}>新建偏差单</Button>
      </div>

      <Table
        size="small"
        rowKey="id"
        dataSource={data}
        columns={[
          { title: '偏差单号', dataIndex: 'dev_code', width: 160, render: (v: string) => <code style={{ fontSize: 11 }}>{v}</code> },
          { title: '偏差标题', dataIndex: 'title', width: 160 },
          { title: '批号', dataIndex: 'batch_no', width: 130 },
          { title: '偏差类型', dataIndex: 'type', width: 90 },
          {
            title: '严重程度', dataIndex: 'severity', width: 130,
            render: (v: DevSeverity) => (
              <Tooltip title={SEV_DESC[v] ?? ''}>
                <Tag color={SEV_COLOR[v]}>{SEV_LABEL[v]}</Tag>
              </Tooltip>
            ),
          },
          {
            title: '处理状态', dataIndex: 'status', width: 120,
            render: (v: DevStatus) => <Badge status={statusColor[v]} text={statusLabel[v]} />,
          },
          { title: '截止日期', dataIndex: 'deadline', width: 100 },
          { title: '发现时间', dataIndex: 'create_time', width: 100 },
          { title: '负责人', dataIndex: 'handler', width: 80 },
          {
            title: '操作', width: 160, fixed: 'right',
            render: (_: any, rec: any) => (
              <Space size={4}>
                <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => setViewRecord(rec)}>查看</Button>
                {rec.status !== 'CLOSED' && (
                  <Button size="small" type="link" icon={<SendOutlined />} onClick={() => handleAdvanceStatus(rec)}>
                    {rec.status === 'OPEN' ? '启动调查' : rec.status === 'INVESTIGATION' ? '提交关闭' : '审批关闭'}
                  </Button>
                )}
              </Space>
            ),
          },
        ]}
        expandable={{
          expandedRowRender: (record: any) => (
            <div style={{ padding: '8px 16px' }}>
              <Steps
                size="small"
                current={statusToStep[record.status as DevStatus]}
                style={{ marginBottom: 12 }}
                items={STATUS_STEPS.map(s => ({ title: s }))}
              />
              <Descriptions size="small" bordered column={2}>
                <Descriptions.Item label="偏差描述" span={2}>{record.desc}</Descriptions.Item>
                <Descriptions.Item label="调查结论">{record.investigation || '—'}</Descriptions.Item>
                <Descriptions.Item label="根本原因">{record.root_cause || '—'}</Descriptions.Item>
                <Descriptions.Item label="纠正措施" span={2}>{record.action || '—'}</Descriptions.Item>
              </Descriptions>
            </div>
          ),
        }}
        scroll={{ x: 1100 }}
      />

      {/* 新建偏差 Modal */}
      <Modal title="新建偏差记录" open={showAdd} onCancel={() => { setShowAdd(false); form.resetFields(); }}
        onOk={handleAdd} width={680}
      >
        <Alert message="发现偏差后必须在24小时内完成记录登记。CRITICAL级偏差须立即通知QA负责人。" type="warning" showIcon style={{ marginBottom: 12 }} />
        <Form form={form} layout="vertical" size="small">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="偏差类型" rules={[{ required: true }]}>
                <Select>
                  {['工艺偏差','设备偏差','物料偏差','环境偏差','人员偏差','文件偏差'].map(v => (
                    <Option key={v} value={v}>{v}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="severity" label="严重程度" rules={[{ required: true }]}>
                <Select>
                  {(['MINOR','MAJOR','CRITICAL'] as DevSeverity[]).map(s => (
                    <Option key={s} value={s}>
                      <Tag color={SEV_COLOR[s]}>{SEV_LABEL[s]}</Tag> — {SEV_DESC[s]}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="wo_code" label="关联工单号"><Input placeholder="如 WO-20260601001" /></Form.Item></Col>
            <Col span={12}><Form.Item name="batch_no" label="批号"><Input placeholder="如 BN-20260601001" /></Form.Item></Col>
            <Col span={24}><Form.Item name="title" label="偏差标题" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="handler" label="发现人"><Input placeholder="姓名/工号" /></Form.Item></Col>
            <Col span={12}><Form.Item name="discover_time" label="发现时间"><DatePicker style={{ width: '100%' }} defaultValue={dayjs()} /></Form.Item></Col>
            <Col span={24}>
              <Form.Item name="desc" label="偏差描述（现象、数据、地点）" rules={[{ required: true }]}>
                <TextArea rows={3} placeholder="详细描述偏差情况、实测数据、偏差程度等" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 提交调查结论 Modal */}
      <Modal
        title={`提交调查结论 — ${closeRecord?.dev_code}`}
        open={!!closeRecord}
        onCancel={() => { setCloseRecord(null); closeForm.resetFields(); }}
        onOk={handleClose}
        width={620}
      >
        <Alert message="请填写完整调查结论，QA负责人审批后方可关闭偏差。" type="info" showIcon style={{ marginBottom: 12 }} />
        <Form form={closeForm} layout="vertical" size="small">
          <Form.Item name="investigation" label="调查结论（What happened？）" rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="root_cause" label="根本原因（Why did it happen？）" rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="action" label="纠正/预防措施（How to prevent recurrence？）" rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="capa_required" valuePropName="checked">
            <Checkbox>需要创建CAPA措施（CRITICAL级必选）</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看详情 Modal */}
      <Modal
        title={`偏差详情 — ${viewRecord?.dev_code}`}
        open={!!viewRecord}
        onCancel={() => setViewRecord(null)}
        footer={<Button onClick={() => setViewRecord(null)}>关闭</Button>}
        width={700}
      >
        {viewRecord && (
          <div>
            <Steps
              size="small"
              current={statusToStep[viewRecord.status as DevStatus]}
              style={{ marginBottom: 16 }}
              items={STATUS_STEPS.map(s => ({ title: s }))}
            />
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="偏差单号">{viewRecord.dev_code}</Descriptions.Item>
              <Descriptions.Item label="关联工单">{viewRecord.wo_code}</Descriptions.Item>
              <Descriptions.Item label="批号">{viewRecord.batch_no}</Descriptions.Item>
              <Descriptions.Item label="偏差类型">{viewRecord.type}</Descriptions.Item>
              <Descriptions.Item label="严重程度">
                <Tag color={SEV_COLOR[viewRecord.severity as DevSeverity]}>{SEV_LABEL[viewRecord.severity as DevSeverity]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="处理截止">
                <span style={{ color: dayjs().isAfter(viewRecord.deadline) ? '#ff4d4f' : '#52c41a' }}>
                  {viewRecord.deadline}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="偏差描述" span={2}>{viewRecord.desc}</Descriptions.Item>
              <Descriptions.Item label="调查结论" span={2}>{viewRecord.investigation || '—'}</Descriptions.Item>
              <Descriptions.Item label="根本原因" span={2}>{viewRecord.root_cause || '—'}</Descriptions.Item>
              <Descriptions.Item label="纠正/预防措施" span={2}>{viewRecord.action || '—'}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ─── CAPA Tab (closure workflow) ─────────────────────────────────────
const CapaTab: React.FC<{ headers: any }> = ({ headers }) => {
  const [data, setData] = useState<any[]>(capaDemoData);
  const [showAdd, setShowAdd] = useState(false);
  const [verifyRecord, setVerifyRecord] = useState<any>(null);
  const [form] = Form.useForm();
  const [verForm] = Form.useForm();

  const CAPA_STEPS = ['待启动', '执行中', '待验证', '已完成'];
  const capaToStep: Record<CapaStatus, number> = {
    PENDING: 0, IN_PROGRESS: 1, VERIFY: 2, COMPLETED: 3, OVERDUE: 1,
  };

  const statusTag: Record<CapaStatus, React.ReactNode> = {
    PENDING:     <Tag color="default">待启动</Tag>,
    IN_PROGRESS: <Tag color="processing" icon={<SyncOutlined spin />}>执行中</Tag>,
    VERIFY:      <Tag color="warning">待验证</Tag>,
    COMPLETED:   <Tag color="success" icon={<CheckCircleOutlined />}>已完成</Tag>,
    OVERDUE:     <Tag color="error" icon={<ClockCircleOutlined />}>已逾期</Tag>,
  };
  const priColor: Record<string, string> = { '紧急': 'red', '高': 'orange', '中': 'blue', '低': 'default' };

  const handleAdvance = (record: any) => {
    const nextStatus: Record<CapaStatus, CapaStatus> = {
      PENDING: 'IN_PROGRESS', IN_PROGRESS: 'VERIFY', VERIFY: 'COMPLETED',
      COMPLETED: 'COMPLETED', OVERDUE: 'IN_PROGRESS',
    };
    if (record.status === 'IN_PROGRESS') {
      setVerifyRecord(record);
      return;
    }
    setData(prev => prev.map(d => d.id === record.id
      ? { ...d, status: nextStatus[d.status as CapaStatus], progress: nextStatus[d.status as CapaStatus] === 'VERIFY' ? 80 : d.progress }
      : d
    ));
    message.success('CAPA状态已更新');
  };

  const handleVerify = () => {
    verForm.validateFields().then(values => {
      setData(prev => prev.map(d => d.id === verifyRecord.id
        ? { ...d, status: 'COMPLETED' as CapaStatus, progress: 100, verify_date: dayjs().format('YYYY-MM-DD'), verify_result: values.verify_result, approver: values.approver }
        : d
      ));
      message.success('CAPA已验证关闭');
      setVerifyRecord(null);
      verForm.resetFields();
    });
  };

  return (
    <div>
      <Alert
        message="CAPA闭环流程：偏差开立 → 启动CAPA → 执行整改 → QA验证 → 关闭确认。CRITICAL偏差必须关联CAPA。"
        type="info" showIcon style={{ marginBottom: 12 }}
      />
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Tag color="default">待启动：{data.filter(d => d.status === 'PENDING').length}</Tag>
          <Tag color="processing">执行中：{data.filter(d => d.status === 'IN_PROGRESS').length}</Tag>
          <Tag color="warning">待验证：{data.filter(d => d.status === 'VERIFY').length}</Tag>
          <Tag color="success">已完成：{data.filter(d => d.status === 'COMPLETED').length}</Tag>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAdd(true)}>新建CAPA</Button>
      </div>

      <Table
        size="small"
        rowKey="id"
        dataSource={data}
        columns={[
          { title: 'CAPA编号', dataIndex: 'capa_code', width: 160, render: (v: string) => <code style={{ fontSize: 11 }}>{v}</code> },
          { title: '措施标题', dataIndex: 'title', width: 200 },
          { title: '来源偏差', dataIndex: 'source', width: 140 },
          { title: '措施类型', dataIndex: 'type', width: 90 },
          { title: '优先级', dataIndex: 'priority', width: 80, render: (v: string) => <Tag color={priColor[v]}>{v}</Tag> },
          { title: '状态', dataIndex: 'status', width: 110, render: (v: CapaStatus) => statusTag[v] },
          { title: '完成进度', dataIndex: 'progress', width: 140, render: (v: number) => <Progress percent={v} size="small" status={v === 100 ? 'success' : 'active'} /> },
          { title: '责任人', dataIndex: 'owner', width: 120 },
          { title: '截止日期', dataIndex: 'due_date', width: 100, render: (v: string, r: any) => (
            <span style={{ color: r.status !== 'COMPLETED' && dayjs().isAfter(v) ? '#ff4d4f' : undefined }}>{v}</span>
          )},
          {
            title: '操作', width: 130, fixed: 'right',
            render: (_: any, rec: any) => (
              <Space size={4}>
                <Button size="small" type="link" icon={<EyeOutlined />}>详情</Button>
                {rec.status !== 'COMPLETED' && (
                  <Button size="small" type="link" icon={<SendOutlined />} onClick={() => handleAdvance(rec)}>
                    {rec.status === 'PENDING' ? '启动' : rec.status === 'IN_PROGRESS' ? '提交验证' : '确认完成'}
                  </Button>
                )}
              </Space>
            ),
          },
        ]}
        expandable={{
          expandedRowRender: (record: any) => (
            <div style={{ padding: '8px 16px' }}>
              <Steps
                size="small"
                current={capaToStep[record.status as CapaStatus]}
                style={{ marginBottom: 12 }}
                items={CAPA_STEPS.map(s => ({ title: s }))}
              />
              {record.verify_result && (
                <Descriptions size="small" bordered column={2}>
                  <Descriptions.Item label="验证日期">{record.verify_date}</Descriptions.Item>
                  <Descriptions.Item label="审批人">{record.approver}</Descriptions.Item>
                  <Descriptions.Item label="验证结果" span={2}>{record.verify_result}</Descriptions.Item>
                </Descriptions>
              )}
            </div>
          ),
        }}
        scroll={{ x: 1100 }}
      />

      {/* 验证关闭 Modal */}
      <Modal
        title={`CAPA验证关闭 — ${verifyRecord?.capa_code}`}
        open={!!verifyRecord}
        onCancel={() => { setVerifyRecord(null); verForm.resetFields(); }}
        onOk={handleVerify}
        width={560}
      >
        <Alert message="验证通过后CAPA自动关闭，该结果将归档到电子批记录。" type="info" showIcon style={{ marginBottom: 12 }} />
        <Form form={verForm} layout="vertical" size="small">
          <Form.Item name="verify_result" label="验证结果描述" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="描述验证方法、验证数据、效果评估等" />
          </Form.Item>
          <Form.Item name="approver" label="QA审批人" rules={[{ required: true }]}>
            <Input placeholder="QA负责人姓名" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新建CAPA Modal */}
      <Modal title="新建CAPA措施" open={showAdd} onCancel={() => { setShowAdd(false); form.resetFields(); }}
        onOk={() => {
          form.validateFields().then(v => {
            const newCapa = {
              id: data.length + 1,
              capa_code: `CAPA-${new Date().toISOString().slice(0,10).replace(/-/g,'')}${String(data.length+1).padStart(3,'0')}`,
              title: v.title, type: v.type, source: v.source ?? '',
              status: 'PENDING' as CapaStatus, priority: v.priority,
              due_date: v.due_date ? dayjs(v.due_date).format('YYYY-MM-DD') : '',
              owner: v.owner, progress: 0, verify_date: '', verify_result: '', approver: '',
            };
            setData(prev => [...prev, newCapa]);
            message.success('CAPA已创建');
            setShowAdd(false); form.resetFields();
          });
        }}
        width={600}
      >
        <Form form={form} layout="vertical" size="small">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="措施类型" rules={[{ required: true }]}>
                <Select><Option value="纠正措施">纠正措施</Option><Option value="预防措施">预防措施</Option></Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
                <Select>{['紧急','高','中','低'].map(p => <Option key={p} value={p}>{p}</Option>)}</Select>
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="source" label="来源偏差单号"><Input placeholder="DEV-2026..." /></Form.Item></Col>
            <Col span={12}><Form.Item name="due_date" label="截止日期" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={24}><Form.Item name="title" label="措施标题" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={24}><Form.Item name="owner" label="责任人" rules={[{ required: true }]}><Input placeholder="部门-姓名" /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

// ─── Hygiene Tab (8-item checklist) ─────────────────────────────────
const HygieneTab: React.FC<{ headers: any }> = ({ headers }) => {
  const [data, setData] = useState<any[]>(hygieneDemoData);
  const [showAdd, setShowAdd] = useState(false);
  const [form] = Form.useForm();

  // Count checked items for each record
  const checkedCount = (rec: any) =>
    HYGIENE_CHECKLIST.filter(item => rec.checklist?.[item.key]).length;

  const handleAdd = () => {
    form.validateFields().then(values => {
      const checklist: Record<string, boolean> = {};
      HYGIENE_CHECKLIST.forEach(item => { checklist[item.key] = !!(values[item.key]); });
      const passCount = HYGIENE_CHECKLIST.filter(item => item.required && !checklist[item.key]).length;
      const newRec = {
        id: data.length + 1,
        record_no: `HYG-${dayjs().format('YYYYMMDD')}-${String(data.length+1).padStart(3,'0')}`,
        workshop: values.workshop, area: values.area,
        record_date: dayjs().format('YYYY-MM-DD'), shift: values.shift,
        operator: values.operator,
        temp: parseFloat(values.temp) || 22,
        humidity: parseFloat(values.humidity) || 50,
        checklist,
        result: passCount > 0 ? '不合格' : '合格',
        remark: values.remark ?? '',
      };
      setData(prev => [newRec, ...prev]);
      message.success(passCount > 0
        ? `卫生记录已保存，${passCount}项必检项不合格，请立即整改！`
        : '卫生记录已保存，全项合格');
      setShowAdd(false);
      form.resetFields();
    });
  };

  return (
    <div>
      <Alert
        message={
          <span>
            卫生管理要求：每班生产前后必须完成<strong>8项</strong>清洁检查记录，GMP重点区域需记录温湿度（温度18-26°C，湿度45-65%）。不合格需立即上报并整改。
          </span>
        }
        type="info" showIcon style={{ marginBottom: 12 }}
      />
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Tag color="success">合格：{data.filter(d => d.result === '合格').length}</Tag>
          <Tag color="warning">待复查：{data.filter(d => d.result === '待复查').length}</Tag>
          <Tag color="error">不合格：{data.filter(d => d.result === '不合格').length}</Tag>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAdd(true)}>新增卫生记录</Button>
      </div>

      <Table
        size="small"
        rowKey="id"
        dataSource={data}
        columns={[
          { title: '记录编号', dataIndex: 'record_no', width: 170, render: (v: string) => <code style={{ fontSize: 11 }}>{v}</code> },
          { title: '车间', dataIndex: 'workshop', width: 160 },
          { title: '区域', dataIndex: 'area', width: 80 },
          { title: '记录日期', dataIndex: 'record_date', width: 100 },
          { title: '班次', dataIndex: 'shift', width: 60 },
          { title: '操作人', dataIndex: 'operator', width: 90 },
          { title: '温度(°C)', dataIndex: 'temp', width: 80, render: (v: number) => (
            <span style={{ color: v < 18 || v > 26 ? '#ff4d4f' : '#52c41a' }}>{v}</span>
          )},
          { title: '湿度(%)', dataIndex: 'humidity', width: 80, render: (v: number) => (
            <span style={{ color: v < 45 || v > 65 ? '#ff4d4f' : '#52c41a' }}>{v}</span>
          )},
          {
            title: '检查项(8项)', dataIndex: 'checklist', width: 100,
            render: (_: any, rec: any) => {
              const cnt = checkedCount(rec);
              return <Tag color={cnt === 8 ? 'success' : cnt >= 6 ? 'warning' : 'error'}>{cnt}/8</Tag>;
            },
          },
          {
            title: '检查结果', dataIndex: 'result', width: 90,
            render: (v: string) => <Tag color={v === '合格' ? 'success' : v === '待复查' ? 'warning' : 'error'}>{v}</Tag>,
          },
          { title: '备注', dataIndex: 'remark', width: 140, ellipsis: true },
          { title: '操作', width: 70, render: () => <Button size="small" type="link" icon={<EyeOutlined />}>查看</Button> },
        ]}
        expandable={{
          expandedRowRender: (record: any) => (
            <div style={{ padding: '8px 16px' }}>
              <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 13 }}>8项卫生检查详情</div>
              <Row gutter={[8, 8]}>
                {HYGIENE_CHECKLIST.map(item => {
                  const checked = record.checklist?.[item.key];
                  return (
                    <Col span={6} key={item.key}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '4px 8px', borderRadius: 4,
                        background: checked ? '#f6ffed' : item.required ? '#fff2f0' : '#fafafa',
                        border: `1px solid ${checked ? '#b7eb8f' : item.required ? '#ffccc7' : '#d9d9d9'}`,
                      }}>
                        {checked
                          ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          : <CloseCircleOutlined style={{ color: item.required ? '#ff4d4f' : '#d9d9d9' }} />}
                        <span style={{ fontSize: 12 }}>{item.label}</span>
                        {item.required && !checked && <Tag color="error" style={{ marginLeft: 'auto', fontSize: 10 }}>必检</Tag>}
                      </div>
                    </Col>
                  );
                })}
              </Row>
              {record.remark && <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>备注：{record.remark}</div>}
            </div>
          ),
        }}
        scroll={{ x: 1100 }}
      />

      {/* 新增卫生记录 Modal */}
      <Modal
        title="新增卫生管理记录"
        open={showAdd}
        onCancel={() => { setShowAdd(false); form.resetFields(); }}
        onOk={handleAdd}
        width={720}
      >
        <Form form={form} layout="vertical" size="small">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="workshop" label="车间" rules={[{ required: true }]}>
                <Select>
                  {['固体制剂车间(NJ)','软胶囊车间(NJ)','液体制剂车间(LS)','包装车间(NJ)','包装车间(LS)'].map(v => (
                    <Option key={v} value={v}>{v}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="area" label="区域" rules={[{ required: true }]}>
                <Select>
                  {['称量间','混合间','压片间','胶囊间','灌装间','内包间','外包间','仓储区'].map(v => (
                    <Option key={v} value={v}>{v}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="shift" label="班次" rules={[{ required: true }]}>
                <Select><Option value="白班">白班</Option><Option value="夜班">夜班</Option><Option value="早班">早班</Option><Option value="中班">中班</Option></Select>
              </Form.Item>
            </Col>
            <Col span={8}><Form.Item name="operator" label="操作人" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={4}><Form.Item name="temp" label="温度(°C)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} max={50} step={0.1} /></Form.Item></Col>
            <Col span={4}><Form.Item name="humidity" label="湿度(%)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} max={100} /></Form.Item></Col>
          </Row>

          <Divider style={{ margin: '8px 0' }}>8项卫生检查项目（必检项必须全部勾选）</Divider>
          <Row gutter={[8, 8]}>
            {HYGIENE_CHECKLIST.map(item => (
              <Col span={12} key={item.key}>
                <Form.Item name={item.key} valuePropName="checked" style={{ marginBottom: 4 }}>
                  <Checkbox>
                    {item.label}
                    {item.required && <Tag color="red" style={{ marginLeft: 6, fontSize: 10 }}>必检</Tag>}
                  </Checkbox>
                </Form.Item>
              </Col>
            ))}
          </Row>
          <Form.Item name="remark" label="备注"><Input placeholder="如有异常情况请在此说明" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// ─── NC Tab ──────────────────────────────────────────────────────────
const NcTab: React.FC<{ headers: any }> = ({ headers }) => {
  const ncDemo: any[] = [
    { id: 1, nc_code: 'NC-2026060001', material_name: '天美健钙咀嚼片', batch_no: 'BN-20260601001', nc_type: '压片硬度不足', qty: 500, unit: '瓶', cause: '设备原因', disposition: '返工', status: 'CLOSED', qa: '张质检', create_time: '2026-06-03', remark: '已返工复检，合格' },
    { id: 2, nc_code: 'NC-2026060002', material_name: '软胶囊油脂原料', batch_no: 'LOT-M020101-260601', nc_type: '外观异常(变色)', qty: 5000, unit: 'g', cause: '物料原因', disposition: '退货', status: 'OPEN', qa: '李质检', create_time: '2026-06-05', remark: '待供应商确认' },
    { id: 3, nc_code: 'NC-2026060003', material_name: '保健品瓶盖', batch_no: 'PKG-CAP-260601', nc_type: '尺寸偏差', qty: 2000, unit: '个', cause: '物料原因', disposition: '销毁', status: 'OPEN', qa: '王质检', create_time: '2026-06-07', remark: '尺寸超差，无法使用' },
  ];

  return (
    <div>
      <Alert message="不合格品处置流程：发现→标识隔离→评审→处置（返工/退货/销毁）→复检放行。GMP要求所有NC品均须完整记录。" type="warning" showIcon style={{ marginBottom: 12 }} />
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />}>新建不合格品单</Button>
      </div>
      <Table
        size="small"
        rowKey="id"
        dataSource={ncDemo}
        columns={[
          { title: '不合格品单号', dataIndex: 'nc_code', width: 150, render: (v: string) => <code style={{ fontSize: 11 }}>{v}</code> },
          { title: '物料/产品名称', dataIndex: 'material_name', width: 160 },
          { title: '批号', dataIndex: 'batch_no', width: 150 },
          { title: '不合格类型', dataIndex: 'nc_type', width: 130 },
          { title: '数量', dataIndex: 'qty', width: 80, render: (v: any, r: any) => `${v} ${r.unit}` },
          { title: '原因分类', dataIndex: 'cause', width: 90 },
          {
            title: '处置方式', dataIndex: 'disposition', width: 90,
            render: (v: string) => <Tag color={v==='返工'?'blue':v==='退货'?'orange':'red'}>{v}</Tag>,
          },
          { title: 'QA签名', dataIndex: 'qa', width: 80 },
          {
            title: '状态', dataIndex: 'status', width: 90,
            render: (v: string) => <Tag color={v==='CLOSED'?'success':'warning'}>{v==='CLOSED'?'已处置':'待处置'}</Tag>,
          },
          { title: '登记时间', dataIndex: 'create_time', width: 100 },
          { title: '备注', dataIndex: 'remark', width: 140, ellipsis: true },
          { title: '操作', width: 100, render: (_: any, rec: any) => (
            <Space size={4}>
              <Button size="small" type="link" icon={<EyeOutlined />}>查看</Button>
              {rec.status === 'OPEN' && <Button size="small" type="link" icon={<EditOutlined />}>处置</Button>}
            </Space>
          )},
        ]}
        scroll={{ x: 1200 }}
      />
    </div>
  );
};

export default GmpPage;
