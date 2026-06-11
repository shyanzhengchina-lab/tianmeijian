/**
 * EquipArchivePage.tsx — 设备档案管理
 * GMP医疗器械MES 设备管理模块 - 设备档案子页
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table, Button, Input, Select, Space, Tag, Popconfirm, message,
  Row, Col, Modal, Form, Badge, Tooltip, Drawer, Descriptions,
  Progress, Divider, Switch,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined, EditOutlined,
  DeleteOutlined, EyeOutlined, CheckCircleOutlined, StopOutlined,
  ExclamationCircleOutlined, ToolOutlined, SettingOutlined,
  CalendarOutlined, WarningOutlined, QrcodeOutlined, SafetyCertificateOutlined,
  StarFilled, FileTextOutlined,
} from '@ant-design/icons';
import {
  EquipRecord, EquipStatus, EquipCategory,
  EQUIP_CATEGORY_MAP, EQUIP_STATUS_MAP,
  mockEquipRecords, mockFaultRecords, mockMaintPlans, mockUsageRecords,
  getDaysUntil, isOverdue, calcEquipScore,
} from './equipmentData';
import { getEquipmentList } from '../../api/equipment';
import type { EquipmentRecord } from '../../api/equipment';
import { getWorkshopList } from '../../api/workshops';
import { getWorkCenterList } from '../../api/workCenters';

const { Option } = Select;
const { TextArea } = Input;

export type ArchiveQuickFilter = 'ALL' | 'ACTIVE' | 'IDLE' | 'FAULT' | 'MAINTENANCE' | 'SPECIAL';

interface EquipArchivePageProps {
  initialQuickFilter?: ArchiveQuickFilter;
}

const genId = () => `eq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

/** 后端 EquipmentRecord → 本地 EquipRecord 映射 */
const mapApiEquip = (e: EquipmentRecord): EquipRecord => {
  const statusMap: Record<string, EquipStatus> = {
    NORMAL: 'ACTIVE', MAINTAIN: 'MAINTENANCE', FAULT: 'FAULT',
  };
  return {
    id: String(e.id ?? ''),
    equipCode: e.code ?? '',
    equipName: e.name ?? '',
    category: (e.category ?? 'MACHINE') as EquipCategory,
    model: e.model ?? '',
    brand: e.brand ?? '',
    workshop: e.workshopName ?? '',
    workCenter: e.workCenterName ?? '',
    location: e.location ?? '',
    purchaseDate: e.purchaseDate ?? '',
    warrantyDate: e.warrantyDate ?? '',
    lastMaintDate: e.lastMaintDate ?? undefined,
    nextMaintDate: e.nextMaintDate ?? undefined,
    precision: e.precision ?? undefined,
    status: statusMap[e.status ?? ''] ?? 'IDLE',
    remark: e.description ?? '',
    createdAt: e.createTime?.slice(0, 10) ?? '',
    updatedAt: e.updateTime?.slice(0, 10) ?? '',
  } as EquipRecord;
};

const EquipArchivePage: React.FC<EquipArchivePageProps> = ({ initialQuickFilter }) => {
  const [list, setList] = useState<EquipRecord[]>(mockEquipRecords);

  // ── 车间 / 工作中心下拉选项（从 API 动态加载）────────────────────
  const [workshopOptions, setWorkshopOptions] = useState<{ label: string; value: string }[]>([]);
  const [workCenterOptions, setWorkCenterOptions] = useState<{ label: string; value: string }[]>([]);

  const loadDropdownData = useCallback(async () => {
    try {
      const [wsResp, wcResp] = await Promise.allSettled([
        getWorkshopList() as any,
        getWorkCenterList() as any,
      ]);
      if (wsResp.status === 'fulfilled') {
        const wsList: any[] = wsResp.value?.data ?? [];
        setWorkshopOptions(wsList.map((w: any) => ({
          label: `${w.name ?? ''}${w.code ? `（${w.code}）` : ''}`,
          value: w.name ?? '',
        })));
      }
      if (wcResp.status === 'fulfilled') {
        const wcList: any[] = wcResp.value?.data ?? [];
        setWorkCenterOptions(wcList.map((w: any) => ({
          label: `${w.name ?? ''}${w.code ? `（${w.code}）` : ''}`,
          value: w.name ?? '',
        })));
      }
    } catch { /* 忽略，保持手动输入 */ }
  }, []);

  const loadFromApi = useCallback(async () => {
    try {
      const resp = await getEquipmentList() as any;
      const apiList: EquipmentRecord[] = resp?.data ?? [];
      if (apiList.length > 0) {
        setList(apiList.map(mapApiEquip));
      }
    } catch { /* 后端不可用时保留 mock */ }
  }, []);

  useEffect(() => {
    loadFromApi();
    loadDropdownData();
  }, [loadFromApi, loadDropdownData]);
  const [searchText, setSearchText] = useState('');
  const [filterCat, setFilterCat] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [quickFilter, setQuickFilter] = useState<ArchiveQuickFilter>(initialQuickFilter ?? 'ALL');
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EquipRecord | null>(null);
  const [form] = Form.useForm();

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<EquipRecord | null>(null);

  const filtered = useMemo(() => list.filter(e => {
    if (quickFilter === 'ACTIVE'      && e.status !== 'ACTIVE') return false;
    if (quickFilter === 'IDLE'        && e.status !== 'IDLE') return false;
    if (quickFilter === 'FAULT'       && e.status !== 'FAULT') return false;
    if (quickFilter === 'MAINTENANCE' && e.status !== 'MAINTENANCE') return false;
    if (quickFilter === 'SPECIAL'     && !e.isSpecialProcess) return false;
    const t = searchText.toLowerCase();
    return (!t || e.equipCode.toLowerCase().includes(t) || e.equipName.includes(t)
      || e.workshop.includes(t) || e.workCenter.includes(t) || e.model.includes(t) || (e.brand || '').includes(t))
      && (!filterCat    || e.category === filterCat)
      && (!filterStatus || e.status   === filterStatus);
  }), [list, searchText, filterCat, filterStatus, quickFilter]);

  const summary = useMemo(() => ({
    total:       list.length,
    active:      list.filter(e => e.status === 'ACTIVE').length,
    idle:        list.filter(e => e.status === 'IDLE').length,
    fault:       list.filter(e => e.status === 'FAULT').length,
    maintenance: list.filter(e => e.status === 'MAINTENANCE').length,
    special:     list.filter(e => e.isSpecialProcess).length,
    overdueMain: list.filter(e => isOverdue(e.nextMaintDate)).length,
  }), [list]);

  const summaryCards: { key: ArchiveQuickFilter; label: string; value: number; color: string; icon: React.ReactNode }[] = [
    { key: 'ALL',         label: '设备总数',  value: summary.total,       color: '#1677FF', icon: <ToolOutlined /> },
    { key: 'ACTIVE',      label: '运行中',    value: summary.active,      color: '#52C41A', icon: <CheckCircleOutlined /> },
    { key: 'FAULT',       label: '故障停机',  value: summary.fault,       color: '#FF4D4F', icon: <ExclamationCircleOutlined /> },
    { key: 'MAINTENANCE', label: '维保中',    value: summary.maintenance,  color: '#FAAD14', icon: <SettingOutlined /> },
    { key: 'SPECIAL',     label: '特殊工序',  value: summary.special,     color: '#722ED1', icon: <SafetyCertificateOutlined /> },
  ];

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'ACTIVE', category: 'MACHINE' });
    setModalOpen(true);
  };

  const handleEdit = (r: EquipRecord) => {
    setEditing(r);
    form.setFieldsValue({ ...r });
    setModalOpen(true);
  };

  const handleView = (r: EquipRecord) => {
    setDetailItem(r);
    setDetailOpen(true);
  };

  const handleDelete = (ids: React.Key[]) => {
    setList(prev => prev.filter(e => !ids.includes(e.id)));
    setSelectedKeys([]);
    message.success(`已删除 ${ids.length} 条设备档案`);
    // 后端同步删除（逐个）
    ids.forEach(id => {
      const numId = parseInt(String(id));
      if (!isNaN(numId)) {
        import('../../api/equipment').then(m => m.deleteEquipment(numId)).catch(() => {});
      }
    });
  };

  const handleStatusChange = (id: string, status: EquipStatus) => {
    const backendStatus: Record<EquipStatus, string> = {
      ACTIVE: 'NORMAL', IDLE: 'NORMAL', MAINTENANCE: 'MAINTAIN',
      FAULT: 'FAULT', SCRAPPED: 'FAULT', DISABLED: 'FAULT',
    };
    setList(prev => prev.map(e => e.id === id
      ? { ...e, status, updatedAt: new Date().toISOString().slice(0, 10) } : e));
    message.success(`设备状态已变更为：${(EQUIP_STATUS_MAP[status] ?? { label: String(status) }).label}`);
    const numId = parseInt(id);
    if (!isNaN(numId)) {
      import('../../api/equipment').then(m => m.updateEquipment(numId, { status: backendStatus[status] })).catch(() => {});
    }
  };

  const handleSave = () => {
    form.validateFields().then(vals => {
      const now = new Date().toISOString().slice(0, 10);
      if (editing) {
        setList(prev => prev.map(e => e.id === editing.id
          ? { ...e, ...vals, updatedAt: now } : e));
        message.success('设备档案修改成功');
        const numId = parseInt(editing.id);
        if (!isNaN(numId)) {
          import('../../api/equipment').then(m => m.updateEquipment(numId, {
            code: vals.equipCode, name: vals.equipName, category: vals.category,
            model: vals.model, brand: vals.brand, location: vals.location,
            precision: vals.precision, description: vals.remark,
          })).then(() => loadFromApi()).catch(() => {});
        }
      } else {
        const newRec: EquipRecord = { ...vals, id: genId(), createdAt: now, updatedAt: now };
        setList(prev => [newRec, ...prev]);
        message.success('新增设备成功');
        import('../../api/equipment').then(m => m.createEquipment({
          code: vals.equipCode, name: vals.equipName, category: vals.category,
          model: vals.model, brand: vals.brand, location: vals.location,
          precision: vals.precision, description: vals.remark,
        })).then(() => loadFromApi()).catch(() => {});
      }
      setModalOpen(false);
    }).catch(() => {});
  };

  const columns: ColumnsType<EquipRecord> = [
    {
      title: '序号', width: 48, align: 'center',
      render: (_: any, __: any, i: number) => <span style={{ color: '#aaa', fontSize: 11 }}>{i + 1}</span>,
    },
    {
      title: '设备编码', dataIndex: 'equipCode', width: 160,
      render: (v: string, r: EquipRecord) => (
        <span style={{ color: '#1677FF', fontWeight: 600, cursor: 'pointer', fontFamily: 'monospace', fontSize: 12 }}
          onClick={() => handleView(r)}>
          <ToolOutlined style={{ marginRight: 4 }} />{v}
          {r.isSpecialProcess && <Tooltip title="特殊工序设备（GMP）"><StarFilled style={{ color: '#722ED1', marginLeft: 4, fontSize: 10 }} /></Tooltip>}
        </span>
      ),
    },
    {
      title: '设备名称', dataIndex: 'equipName', width: 180,
      render: (v: string) => <span style={{ fontWeight: 500, fontSize: 13 }}>{v}</span>,
    },
    {
      title: '类别', dataIndex: 'category', width: 90, align: 'center',
      render: (v: EquipCategory) => {
        const m = EQUIP_CATEGORY_MAP[v] ?? { color: 'default', label: v ?? '-' };
        return <Tag color={m.color} style={{ fontSize: 11 }}>{m.label}</Tag>;
      },
    },
    {
      title: '型号/品牌', dataIndex: 'model', width: 200,
      render: (v: string, r: EquipRecord) => (
        <div>
          <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#333' }}>{v}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{r.brand}</div>
        </div>
      ),
    },
    {
      title: '所属车间 / 工作中心', dataIndex: 'workshop', width: 170,
      render: (v: string, r: EquipRecord) => (
        <div>
          <div style={{ fontSize: 12 }}>{v}</div>
          <Tag style={{ fontFamily: 'monospace', fontSize: 11, marginTop: 2 }}>{r.workCenter}</Tag>
        </div>
      ),
    },
    {
      title: '位置', dataIndex: 'location', width: 100,
      render: (v: string) => <span style={{ fontSize: 12, color: '#888' }}>{v}</span>,
    },
    {
      title: '下次保养', dataIndex: 'nextMaintDate', width: 105, align: 'center',
      sorter: (a, b) => (a.nextMaintDate || '').localeCompare(b.nextMaintDate || ''),
      render: (v: string) => {
        const days = getDaysUntil(v);
        const overdue = isOverdue(v);
        const soon = days !== null && days <= 15 && !overdue;
        return (
          <Tooltip title={overdue ? '保养已逾期！' : soon ? `${days}天后到期` : ''}>
            <span style={{ fontSize: 12, color: overdue ? '#FF4D4F' : soon ? '#FAAD14' : '#555', fontWeight: (overdue || soon) ? 600 : 400 }}>
              {(overdue || soon) && <WarningOutlined style={{ marginRight: 3 }} />}{v || '—'}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'OEE', dataIndex: 'currentOee', width: 80, align: 'center',
      render: (v?: number, r?: EquipRecord) => v != null ? (
        <Tooltip title={`目标 ${r?.oeeTarget || 85}%`}>
          <div style={{ fontSize: 11 }}>
            <span style={{ fontWeight: 700, color: v >= (r?.oeeTarget || 85) ? '#52C41A' : '#FAAD14' }}>{v}%</span>
            <Progress percent={v} showInfo={false} size="small" strokeColor={v >= (r?.oeeTarget || 85) ? '#52C41A' : '#FAAD14'} style={{ marginTop: 2 }} />
          </div>
        </Tooltip>
      ) : <span style={{ color: '#ccc', fontSize: 11 }}>—</span>,
    },
    {
      title: '状态', dataIndex: 'status', width: 90, align: 'center',
      render: (v: EquipStatus) => {
        const m = EQUIP_STATUS_MAP[v] ?? { badge: 'default' as any, label: String(v ?? '-') };
        return <Badge status={m.badge} text={<span style={{ fontSize: 12 }}>{m.label}</span>} />;
      },
    },
    {
      title: '操作', width: 220, fixed: 'right',
      render: (_: any, r: EquipRecord) => (
        <Space size={0} split={<span style={{ color: '#e8e8e8', margin: '0 1px' }}>|</span>}>
          <Button type="link" size="small" icon={<EyeOutlined />} style={{ padding: '0 4px', fontSize: 12 }} onClick={() => handleView(r)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} style={{ padding: '0 4px', fontSize: 12 }} onClick={() => handleEdit(r)}>编辑</Button>
          {r.status === 'ACTIVE' && (
            <Popconfirm title="确认停用该设备？" okText="确认停用" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleStatusChange(r.id, 'DISABLED')}>
              <Button type="link" size="small" icon={<StopOutlined />} style={{ padding: '0 4px', fontSize: 12, color: '#FAAD14' }}>停用</Button>
            </Popconfirm>
          )}
          {r.status === 'DISABLED' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} style={{ padding: '0 4px', fontSize: 12, color: '#52C41A' }} onClick={() => handleStatusChange(r.id, 'ACTIVE')}>启用</Button>
          )}
          {r.status === 'MAINTENANCE' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} style={{ padding: '0 4px', fontSize: 12, color: '#52C41A' }} onClick={() => handleStatusChange(r.id, 'ACTIVE')}>恢复正常</Button>
          )}
          <Popconfirm title="确认删除？" okText="确认" cancelText="取消" icon={<ExclamationCircleOutlined style={{ color: '#FF4D4F' }} />} onConfirm={() => handleDelete([r.id])}>
            <Button type="link" danger size="small" style={{ padding: '0 4px', fontSize: 12 }}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 汇总卡片 */}
      <Row gutter={10} style={{ marginBottom: 12 }}>
        {summaryCards.map(c => {
          const isActive = quickFilter === c.key;
          return (
            <Col key={c.key} flex="1">
              <div onClick={() => setQuickFilter(prev => prev === c.key ? 'ALL' : c.key)}
                style={{
                  background: isActive ? `${c.color}12` : '#fff', borderRadius: 8,
                  padding: '10px 14px', border: `1px solid ${isActive ? c.color : '#f0f0f0'}`,
                  display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: isActive ? `0 0 0 2px ${c.color}30` : '0 1px 4px rgba(0,0,0,.04)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: c.color + '20',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: c.color }}>
                  {c.icon}
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: c.color, lineHeight: 1.2 }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: isActive ? c.color : '#888' }}>{c.label}</div>
                </div>
              </div>
            </Col>
          );
        })}
        {summary.overdueMain > 0 && (
          <Col flex="1">
            <div style={{ background: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 8,
              padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ff4d4f20',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#FF4D4F' }}>
                <WarningOutlined />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#FF4D4F', lineHeight: 1.2 }}>{summary.overdueMain}</div>
                <div style={{ fontSize: 11, color: '#FF4D4F' }}>保养逾期</div>
              </div>
            </div>
          </Col>
        )}
      </Row>

      {/* 搜索栏 */}
      <div style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', marginBottom: 10, border: '1px solid #f0f0f0' }}>
        <Row gutter={10} align="middle">
          <Col flex="none">
            <Input prefix={<SearchOutlined style={{ color: '#bbb' }} />} placeholder="设备编码/名称/型号/品牌/车间"
              value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 240 }} allowClear />
          </Col>
          <Col flex="none">
            <Select placeholder="设备类别" value={filterCat} onChange={setFilterCat} allowClear style={{ width: 120 }}>
              {Object.entries(EQUIP_CATEGORY_MAP).map(([k, v]) => <Option key={k} value={k}>{v.icon} {v.label}</Option>)}
            </Select>
          </Col>
          <Col flex="none">
            <Select placeholder="状态" value={filterStatus} onChange={setFilterStatus} allowClear style={{ width: 110 }}>
              {Object.entries(EQUIP_STATUS_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
            </Select>
          </Col>
          <Col flex="none">
            <Button icon={<ReloadOutlined />} onClick={() => { setSearchText(''); setFilterCat(undefined); setFilterStatus(undefined); setQuickFilter('ALL'); }}>重置</Button>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Space>
              {selectedKeys.length > 0 && (
                <Popconfirm title={`确认删除 ${selectedKeys.length} 条？`} onConfirm={() => handleDelete(selectedKeys)} okText="确认" cancelText="取消">
                  <Button danger icon={<DeleteOutlined />}>批量删除({selectedKeys.length})</Button>
                </Popconfirm>
              )}
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增设备</Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 表格 */}
      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ToolOutlined style={{ color: '#1677FF' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>设备档案清单</span>
          <Tag style={{ marginLeft: 4 }}>{filtered.length} 条</Tag>
          {summary.overdueMain > 0 && <Tag color="error"><WarningOutlined /> {summary.overdueMain}台保养逾期</Tag>}
        </div>
        <Table rowKey="id" dataSource={filtered} columns={columns} size="small"
          scroll={{ x: 1500, y: 'calc(100vh - 380px)' }}
          pagination={{ pageSize: 15, showSizeChanger: true, showQuickJumper: true, showTotal: t => `共 ${t} 条`, size: 'small' }}
          rowSelection={{ selectedRowKeys: selectedKeys, onChange: setSelectedKeys }}
        />
      </div>

      {/* 新增/编辑 Modal */}
      <Modal title={<Space><span style={{ display: 'inline-block', width: 4, height: 16, background: '#1677FF', borderRadius: 2, verticalAlign: 'middle' }} />{editing ? '编辑设备档案' : '新增设备'}</Space>}
        open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)}
        okText="保存" cancelText="取消" width={760} destroyOnClose>
        <Form form={form} layout="vertical" size="middle" style={{ marginTop: 14 }}>
          <Row gutter={14}>
            <Col span={8}><Form.Item name="equipCode" label="设备编码" rules={[{ required: true }]}><Input placeholder="EQ-GRIND-001" /></Form.Item></Col>
            <Col span={8}><Form.Item name="equipName" label="设备名称" rules={[{ required: true }]}><Input placeholder="数控五轴磨床 #1" /></Form.Item></Col>
            <Col span={8}><Form.Item name="category" label="设备类别" rules={[{ required: true }]}>
              <Select>{Object.entries(EQUIP_CATEGORY_MAP).map(([k, v]) => <Option key={k} value={k}>{v.icon} {v.label}</Option>)}</Select>
            </Form.Item></Col>
            <Col span={8}><Form.Item name="model" label="型号" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="brand" label="品牌/厂商"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="serialNo" label="出厂序列号"><Input /></Form.Item></Col>
            <Col span={8}>
              <Form.Item name="workshop" label="所属车间" rules={[{ required: true, message: '请选择所属车间' }]}>
                <Select
                  placeholder="从车间档案选择"
                  allowClear showSearch
                  filterOption={(input, opt) =>
                    String((opt as any)?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={workshopOptions}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="workCenter" label="工作中心">
                <Select
                  placeholder="从工作中心选择"
                  allowClear showSearch
                  filterOption={(input, opt) =>
                    String((opt as any)?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={workCenterOptions}
                />
              </Form.Item>
            </Col>
            <Col span={8}><Form.Item name="location" label="安装位置"><Input placeholder="A区-01号位" /></Form.Item></Col>
            <Col span={8}><Form.Item name="purchaseDate" label="购入日期"><Input placeholder="YYYY-MM-DD" /></Form.Item></Col>
            <Col span={8}><Form.Item name="warrantyDate" label="保质期至"><Input placeholder="YYYY-MM-DD" /></Form.Item></Col>
            <Col span={8}><Form.Item name="assetNo" label="资产编号"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="precision" label="精度/关键参数"><Input placeholder="±0.002mm" /></Form.Item></Col>
            <Col span={8}><Form.Item name="nextMaintDate" label="下次保养日期"><Input placeholder="YYYY-MM-DD" /></Form.Item></Col>
            <Col span={8}><Form.Item name="status" label="状态">
              <Select>{Object.entries(EQUIP_STATUS_MAP).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}</Select>
            </Form.Item></Col>
            <Col span={8}><Form.Item name="isSpecialProcess" label="特殊工序设备" valuePropName="checked"><Switch checkedChildren="是" unCheckedChildren="否" /></Form.Item></Col>
            <Col span={8}><Form.Item name="isValidationRequired" label="需要验证" valuePropName="checked"><Switch checkedChildren="是" unCheckedChildren="否" /></Form.Item></Col>
            <Col span={24}><Form.Item name="remark" label="备注"><TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* 详情 Drawer */}
      <Drawer title={<Space><ToolOutlined style={{ color: '#1677FF' }} /><span>设备详情 — {detailItem?.equipCode}</span></Space>}
        open={detailOpen} onClose={() => setDetailOpen(false)} width={640}
        extra={<Button icon={<EditOutlined />} onClick={() => { setDetailOpen(false); if (detailItem) handleEdit(detailItem); }}>编辑</Button>}>
        {detailItem && (
          <div>
            {/* 状态横幅 */}
            <div style={{ background: (EQUIP_STATUS_MAP[detailItem.status] ?? { color: '#888' }).color + '15',
              border: `1px solid ${(EQUIP_STATUS_MAP[detailItem.status] ?? { color: '#888' }).color}40`,
              borderRadius: 8, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Badge status={(EQUIP_STATUS_MAP[detailItem.status] ?? { badge: 'default' as any }).badge} />
              <span style={{ fontWeight: 600, color: (EQUIP_STATUS_MAP[detailItem.status] ?? { color: '#888' }).color, fontSize: 15 }}>
                {(EQUIP_STATUS_MAP[detailItem.status] ?? { label: String(detailItem.status ?? '-') }).label}
              </span>
              {detailItem.isSpecialProcess && <Tag color="purple" icon={<SafetyCertificateOutlined />}>GMP特殊工序</Tag>}
              {detailItem.isValidationRequired && <Tag color="blue">需验证</Tag>}
              {detailItem.currentOee != null && (
                <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#888' }}>OEE</div>
                  <Progress type="circle" percent={detailItem.currentOee} width={52}
                    strokeColor={detailItem.currentOee >= (detailItem.oeeTarget || 85) ? '#52C41A' : '#FAAD14'} />
                </div>
              )}
            </div>

            <Descriptions bordered size="small" column={2} labelStyle={{ width: 120, fontWeight: 500 }}>
              <Descriptions.Item label="设备编码"><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{detailItem.equipCode}</span></Descriptions.Item>
              <Descriptions.Item label="设备名称">{detailItem.equipName}</Descriptions.Item>
              <Descriptions.Item label="类别"><Tag color={(EQUIP_CATEGORY_MAP[detailItem.category] ?? { color: 'default' }).color}>{(EQUIP_CATEGORY_MAP[detailItem.category] ?? { icon: '', label: detailItem.category ?? '-' }).icon} {(EQUIP_CATEGORY_MAP[detailItem.category] ?? { icon: '', label: detailItem.category ?? '-' }).label}</Tag></Descriptions.Item>
              <Descriptions.Item label="精度/规格">{detailItem.precision || '—'}</Descriptions.Item>
              <Descriptions.Item label="型号" span={2}>{detailItem.model}</Descriptions.Item>
              <Descriptions.Item label="品牌/厂商">{detailItem.brand || '—'}</Descriptions.Item>
              <Descriptions.Item label="出厂序列号"><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{detailItem.serialNo || '—'}</span></Descriptions.Item>
              <Descriptions.Item label="所属车间">{detailItem.workshop}</Descriptions.Item>
              <Descriptions.Item label="工作中心"><Tag style={{ fontFamily: 'monospace' }}>{detailItem.workCenter}</Tag></Descriptions.Item>
              <Descriptions.Item label="安装位置" span={2}>{detailItem.location}</Descriptions.Item>
              <Descriptions.Item label="资产编号">{detailItem.assetNo || '—'}</Descriptions.Item>
              <Descriptions.Item label="购入日期"><CalendarOutlined style={{ marginRight: 4 }} />{detailItem.purchaseDate}</Descriptions.Item>
              <Descriptions.Item label="安装验收">{detailItem.installDate || '—'}</Descriptions.Item>
              <Descriptions.Item label="保质期至">{detailItem.warrantyDate}</Descriptions.Item>
              <Descriptions.Item label="上次保养">{detailItem.lastMaintDate || '—'}</Descriptions.Item>
              <Descriptions.Item label="下次保养">
                {(() => {
                  const overdue = isOverdue(detailItem.nextMaintDate);
                  const days = getDaysUntil(detailItem.nextMaintDate);
                  return (
                    <span style={{ color: overdue ? '#FF4D4F' : days !== null && days <= 15 ? '#FAAD14' : undefined, fontWeight: overdue ? 600 : undefined }}>
                      {(overdue || (days !== null && days <= 15)) && <WarningOutlined style={{ marginRight: 4 }} />}
                      {detailItem.nextMaintDate || '—'}
                      {days !== null && !overdue && <span style={{ color: '#888', marginLeft: 6, fontSize: 11 }}>（{days}天后）</span>}
                      {overdue && <span style={{ color: '#FF4D4F', marginLeft: 6, fontSize: 11 }}>（已逾期）</span>}
                    </span>
                  );
                })()}
              </Descriptions.Item>
              {detailItem.lastCalibDate && <>
                <Descriptions.Item label="上次校准">{detailItem.lastCalibDate}</Descriptions.Item>
                <Descriptions.Item label="下次校准">{detailItem.nextCalibDate || '—'}</Descriptions.Item>
              </>}
              <Descriptions.Item label="设备评分" span={2}>
                {(() => {
                  const score = calcEquipScore(detailItem, mockFaultRecords);
                  return <Progress percent={score} strokeColor={score >= 80 ? '#52C41A' : score >= 60 ? '#FAAD14' : '#FF4D4F'} style={{ width: 200 }} />;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{detailItem.remark || '—'}</Descriptions.Item>
              <Descriptions.Item label="QR码"><QrcodeOutlined style={{ marginRight: 4 }} /><span style={{ fontFamily: 'monospace', fontSize: 11 }}>{detailItem.qrCode || '—'}</span></Descriptions.Item>
              <Descriptions.Item label="最后更新">{detailItem.updatedAt}</Descriptions.Item>
            </Descriptions>

            {/* 关联维保 */}
            <Divider style={{ margin: '16px 0 8px' }}><span style={{ fontSize: 12, color: '#888' }}>最近维保记录</span></Divider>
            {mockMaintPlans.filter(m => m.equipId === detailItem.id).slice(0, 3).map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '6px 10px', background: '#fafafa', borderRadius: 6, border: '1px solid #f0f0f0' }}>
                <Tag color={m.status === 'DONE' ? 'success' : m.status === 'OVERDUE' ? 'error' : 'processing'} style={{ fontSize: 11 }}>
                  {m.status === 'DONE' ? '已完成' : m.status === 'OVERDUE' ? '已逾期' : '待执行'}
                </Tag>
                <span style={{ fontSize: 12, color: '#555' }}>{m.planDate}</span>
                <span style={{ fontSize: 12 }}>{m.maintContent.slice(0, 30)}…</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#888' }}>{m.assignee}</span>
              </div>
            ))}
            {mockMaintPlans.filter(m => m.equipId === detailItem.id).length === 0 && (
              <div style={{ color: '#ccc', textAlign: 'center', padding: '8px 0', fontSize: 12 }}>暂无维保记录</div>
            )}

            {/* 最近使用记录 */}
            <Divider style={{ margin: '16px 0 8px' }}><span style={{ fontSize: 12, color: '#888' }}>最近使用记录（批生产记录）</span></Divider>
            {mockUsageRecords.filter(r => r.equipId === detailItem.id).slice(0, 3).map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '6px 10px', background: '#fafafa', borderRadius: 6, border: '1px solid #f0f0f0' }}>
                <FileTextOutlined style={{ color: '#1677FF', fontSize: 12 }} />
                {r.batchNo && <Tag color="geekblue" style={{ fontFamily: 'monospace', fontSize: 10 }}>{r.batchNo}</Tag>}
                <span style={{ fontSize: 12, color: '#555' }}>{r.startTime}</span>
                <span style={{ fontSize: 12 }}>{r.productName || '—'}</span>
                <span style={{ fontSize: 11, color: '#888', marginLeft: 'auto' }}>{r.operator}</span>
                {r.abnormalFlag && <Tag color="error" style={{ fontSize: 10 }}>异常</Tag>}
                {r.operatorSign ? <Tag color="success" style={{ fontSize: 10 }}>已签名</Tag> : <Tag color="warning" style={{ fontSize: 10 }}>待签名</Tag>}
              </div>
            ))}
            {mockUsageRecords.filter(r => r.equipId === detailItem.id).length === 0 && (
              <div style={{ color: '#ccc', textAlign: 'center', padding: '8px 0', fontSize: 12 }}>暂无使用记录</div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default EquipArchivePage;
