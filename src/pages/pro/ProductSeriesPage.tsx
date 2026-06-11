import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import {
  Table, Button, Input, Select, Space, Tag, Popconfirm, message,
  Modal, Form, Row, Col, Tooltip, Divider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, EditOutlined, StopOutlined, PlayCircleOutlined,
  SearchOutlined, ReloadOutlined, DeleteOutlined, ExclamationCircleOutlined,
  AppstoreOutlined, BranchesOutlined, SettingOutlined,
} from '@ant-design/icons';
import { ProductSeries, SeriesStatus, mockRoutingMasters } from './seriesData';
import { useSeriesContext } from './SeriesContext';
import { getProductSeriesList } from '../../api/productSeries';
import './ProPage.css';

interface Props {
  onNavigateRouting?: () => void;
}

const STATUS_MAP: Record<SeriesStatus, { label: string; color: string; bg: string; border: string }> = {
  active:   { label: '启用', color: '#52C41A', bg: '#f6ffed', border: '#b7eb8f' },
  disabled: { label: '停用', color: '#FF4D4F', bg: '#fff2f0', border: '#ffccc7' },
};

const FAMILY_COLORS = ['blue', 'purple', 'cyan', 'geekblue', 'magenta', 'volcano', 'gold', 'lime'];
const getFamilyColor = (name: string, list: string[]) => {
  const idx = list.indexOf(name);
  return FAMILY_COLORS[idx % FAMILY_COLORS.length] || 'default';
};

const ProductSeriesPage: React.FC<Props> = ({ onNavigateRouting }) => {
  // ── 从共享 Context 读写 ───────────────────────────────────────────
  const { seriesList: series, setSeriesList: setSeries, families, setFamilies } = useSeriesContext();

  // ── 从后端加载产品系列（API-first replace）───────────────────────
  const loadFromApi = useCallback(async () => {
    try {
      const resp = await getProductSeriesList() as any;
      const apiList: any[] = resp?.data ?? [];
      if (apiList.length > 0) {
        const mapped: ProductSeries[] = apiList.map(item => ({
          id:                   String(item.id ?? ''),
          seriesCode:           item.code ?? item.seriesCode ?? '',
          seriesName:           item.name ?? item.seriesName ?? '',
          productFamily:        item.category ?? '',
          defaultRoutingCode:   item.specification ?? undefined,
          status:               (item.status === 0 ? 'disabled' : 'active') as SeriesStatus,
          remark:               item.remark ?? '',
          createdAt:            item.createTime?.slice(0, 10) ?? '',
          updatedAt:            item.updateTime?.slice(0, 10) ?? '',
        }));
        setSeries(mapped);  // API-first REPLACE
      }
    } catch { /* 后端不可用时保留 mockProductSeries */ }
  }, [setSeries]);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  // ── 搜索 / 过滤 ──────────────────────────────────────────────────
  const [searchCode, setSearchCode]     = useState('');
  const [searchName, setSearchName]     = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterFamily, setFilterFamily] = useState<string | undefined>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // ── 系列新建/编辑 Modal ───────────────────────────────────────────
  const [modalOpen, setModalOpen]     = useState(false);
  const [editingItem, setEditingItem] = useState<ProductSeries | null>(null);
  const [form] = Form.useForm();

  // ── 产品族管理 Modal ─────────────────────────────────────────────
  const [familyMgrOpen, setFamilyMgrOpen]         = useState(false);
  const [editingFamily, setEditingFamily]         = useState<string | null>(null);
  const [familyInput, setFamilyInput]             = useState('');
  const [familyInputErr, setFamilyInputErr]       = useState('');
  const [familyInlineInput, setFamilyInlineInput] = useState('');

  // ── 过滤 ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => series.filter(s => {
    const codeOk   = !searchCode   || s.seriesCode.toLowerCase().includes(searchCode.toLowerCase());
    const nameOk   = !searchName   || s.seriesName.includes(searchName);
    const statOk   = !filterStatus || s.status === filterStatus;
    const familyOk = !filterFamily || s.productFamily === filterFamily;
    return codeOk && nameOk && statOk && familyOk;
  }), [series, searchCode, searchName, filterStatus, filterFamily]);

  // ── 统计 ─────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    series.length,
    active:   series.filter(s => s.status === 'active').length,
    disabled: series.filter(s => s.status === 'disabled').length,
  }), [series]);

  // ── 系列：新建 / 编辑 / 保存 ─────────────────────────────────────
  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active' });
    setModalOpen(true);
  };

  const handleEdit = (item: ProductSeries) => {
    setEditingItem(item);
    form.setFieldsValue({ ...item });
    setModalOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      const now = new Date().toISOString().slice(0, 10);
      if (editingItem) {
        setSeries(prev => prev.map(s =>
          s.id === editingItem.id ? { ...s, ...values, updatedAt: now } : s
        ));
        message.success('修改成功');
      } else {
        if (series.some(s => s.seriesCode === values.seriesCode)) {
          message.error('系列编码已存在，请修改后重试');
          return;
        }
        const newItem: ProductSeries = {
          ...values,
          id: `PS${Date.now()}`,
          createdAt: now,
          updatedAt: now,
        };
        setSeries(prev => [newItem, ...prev]);
        message.success('新建成功');
      }
      setModalOpen(false);
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  // ── 系列：停用 / 启用 ────────────────────────────────────────────
  const handleToggleStatus = (item: ProductSeries) => {
    const next: SeriesStatus = item.status === 'active' ? 'disabled' : 'active';
    setSeries(prev => prev.map(s =>
      s.id === item.id ? { ...s, status: next, updatedAt: new Date().toISOString().slice(0, 10) } : s
    ));
    message.success(next === 'active' ? '已启用' : '已停用');
  };

  // ── 批量停用 ─────────────────────────────────────────────────────
  const handleBatchDisable = () => {
    setSeries(prev => prev.map(s =>
      selectedRowKeys.includes(s.id)
        ? { ...s, status: 'disabled', updatedAt: new Date().toISOString().slice(0, 10) }
        : s
    ));
    setSelectedRowKeys([]);
    message.success(`已停用 ${selectedRowKeys.length} 条产品系列`);
  };

  // ── 关联工艺路径数 ────────────────────────────────────────────────
  const getRoutingCount = (seriesCode: string) =>
    mockRoutingMasters.filter(r => r.seriesCode === seriesCode && r.status !== 'ARCHIVED').length;

  // ════════════════════════════════════════════════════════
  // 产品族枚举管理
  // ════════════════════════════════════════════════════════

  const openFamilyMgr = () => {
    setFamilyInlineInput('');
    setEditingFamily(null);
    setFamilyInput('');
    setFamilyInputErr('');
    setFamilyMgrOpen(true);
  };

  const validateFamilyName = (name: string, excludeSelf?: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return '产品族名称不能为空';
    if (trimmed.length > 30) return '最多 30 个字符';
    if (families.filter(f => f !== excludeSelf).includes(trimmed)) return '该产品族名称已存在';
    return '';
  };

  const handleFamilyInlineAdd = () => {
    const err = validateFamilyName(familyInlineInput);
    if (err) { message.error(err); return; }
    setFamilies(prev => [...prev, familyInlineInput.trim()]);
    setFamilyInlineInput('');
    message.success('产品族新增成功');
  };

  const startEditFamily = (name: string) => {
    setEditingFamily(name);
    setFamilyInput(name);
    setFamilyInputErr('');
  };

  const saveEditFamily = () => {
    const err = validateFamilyName(familyInput, editingFamily!);
    if (err) { setFamilyInputErr(err); return; }
    const newName = familyInput.trim();
    setFamilies(prev => prev.map(f => f === editingFamily ? newName : f));
    setSeries(prev => prev.map(s =>
      s.productFamily === editingFamily ? { ...s, productFamily: newName } : s
    ));
    setEditingFamily(null);
    setFamilyInput('');
    setFamilyInputErr('');
    message.success('产品族已重命名，已同步更新关联系列');
  };

  const cancelEditFamily = () => {
    setEditingFamily(null);
    setFamilyInput('');
    setFamilyInputErr('');
  };

  const handleDeleteFamily = (name: string) => {
    const usedCount = series.filter(s => s.productFamily === name).length;
    if (usedCount > 0) {
      message.error(`「${name}」已被 ${usedCount} 条产品系列引用，不可删除`);
      return;
    }
    setFamilies(prev => prev.filter(f => f !== name));
    message.success('已删除');
  };

  // ── 表格列 ───────────────────────────────────────────────────────
  const columns: ColumnsType<ProductSeries> = [
    {
      title: '系列编码', dataIndex: 'seriesCode', width: 130,
      render: (v: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#C8000A', fontSize: 13 }}>{v}</span>
      ),
    },
    {
      title: '系列名称', dataIndex: 'seriesName', width: 200,
      render: (v: string, r: ProductSeries) => (
        <div>
          <div style={{ fontWeight: 500 }}>{v}</div>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{r.productFamily}</div>
        </div>
      ),
    },
    {
      title: '所属产品族', dataIndex: 'productFamily', width: 160,
      render: (v: string) => (
        <Tag color={getFamilyColor(v, families)} style={{ fontSize: 11 }}>{v}</Tag>
      ),
    },
    {
      title: '默认工艺路径', dataIndex: 'defaultRoutingCode', width: 200,
      render: (v: string | undefined, r: ProductSeries) => {
        const cnt = getRoutingCount(r.seriesCode);
        return (
          <div>
            {v
              ? <span style={{ fontFamily: 'monospace', color: '#1677FF', fontSize: 12 }}>{v}</span>
              : <span style={{ color: '#ccc', fontSize: 12 }}>—</span>
            }
            {cnt > 0 && (
              <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>共 {cnt} 条路径</div>
            )}
          </div>
        );
      },
    },
    {
      title: '状态', dataIndex: 'status', width: 80, align: 'center' as const,
      render: (v: SeriesStatus) => {
        const s = STATUS_MAP[v];
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500,
            color: s.color, background: s.bg, border: `1px solid ${s.border}`,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
            {s.label}
          </span>
        );
      },
    },
    {
      title: '更新日期', dataIndex: 'updatedAt', width: 100,
      render: (v: string) => <span style={{ fontSize: 12, color: '#888' }}>{v}</span>,
    },
    {
      title: '操作', width: 200, fixed: 'right' as const,
      render: (_: any, r: ProductSeries) => (
        <Space size={0} wrap>
          <Button type="link" size="small" icon={<EditOutlined />}
            style={{ padding: '0 4px', fontSize: 12 }}
            onClick={() => handleEdit(r)}>编辑</Button>

          <Button type="link" size="small"
            icon={r.status === 'active' ? <StopOutlined /> : <PlayCircleOutlined />}
            style={{ padding: '0 4px', fontSize: 12, color: r.status === 'active' ? '#FF4D4F' : '#52C41A' }}
            onClick={() => handleToggleStatus(r)}>
            {r.status === 'active' ? '停用' : '启用'}
          </Button>

          <Tooltip title="查看关联工艺路径">
            <Button type="link" size="small" icon={<BranchesOutlined />}
              style={{ padding: '0 4px', fontSize: 12, color: '#722ED1' }}
              onClick={() => {
                message.info(`跳转查看「${r.seriesCode}」关联工艺路径`);
                onNavigateRouting?.();
              }}>路径</Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="pro-page">

      {/* ── 统计卡片 ── */}
      <div className="pro-stats-bar">
        <div className="pro-stat-item">
          <span className="stat-num" style={{ color: '#1677FF' }}>{stats.total}</span>
          <span className="stat-label">全部系列</span>
        </div>
        <div className="pro-stat-divider" />
        <div className="pro-stat-item">
          <span className="stat-num" style={{ color: '#52C41A' }}>{stats.active}</span>
          <span className="stat-label">已启用</span>
        </div>
        <div className="pro-stat-divider" />
        <div className="pro-stat-item">
          <span className="stat-num" style={{ color: '#FF4D4F' }}>{stats.disabled}</span>
          <span className="stat-label">已停用</span>
        </div>
        <div className="pro-stat-divider" />
        <div
          className="pro-stat-item pro-stat-clickable"
          style={{ flexDirection: 'row', gap: 6 }}
          onClick={openFamilyMgr}
        >
          <SettingOutlined style={{ color: '#722ED1' }} />
          <span style={{ fontSize: 12, color: '#722ED1', fontWeight: 500 }}>产品族管理</span>
          <span style={{
            fontSize: 11, color: '#fff', background: '#722ED1',
            borderRadius: 10, padding: '0 6px', lineHeight: '18px',
          }}>{families.length}</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12, color: '#aaa' }}>
          <AppstoreOutlined style={{ marginRight: 4 }} />产品系列是工艺路径的归属维度
        </div>
      </div>

      {/* ── 搜索栏 ── */}
      <div className="pro-search-bar">
        <Row gutter={8} align="middle" style={{ width: '100%' }}>
          <Col>
            <span className="search-label">编码</span>
            <Input size="small" style={{ width: 130 }} placeholder="系列编码"
              value={searchCode} onChange={e => setSearchCode(e.target.value)} allowClear />
          </Col>
          <Col>
            <span className="search-label">名称</span>
            <Input size="small" style={{ width: 140 }} placeholder="系列名称"
              value={searchName} onChange={e => setSearchName(e.target.value)} allowClear />
          </Col>
          <Col>
            <span className="search-label">产品族</span>
            <Select size="small" style={{ width: 140 }} placeholder="全部" allowClear
              value={filterFamily} onChange={setFilterFamily}
              options={families.map(f => ({ value: f, label: f }))} />
          </Col>
          <Col>
            <span className="search-label">状态</span>
            <Select size="small" style={{ width: 90 }} placeholder="全部" allowClear
              value={filterStatus} onChange={setFilterStatus}
              options={[{ value: 'active', label: '启用' }, { value: 'disabled', label: '停用' }]} />
          </Col>
          <Col>
            <Button type="primary" size="small" icon={<SearchOutlined />}
              style={{ background: '#C8000A', borderColor: '#C8000A' }}>查询</Button>
          </Col>
          <Col>
            <Button size="small" icon={<ReloadOutlined />}
              onClick={() => {
                setSearchCode(''); setSearchName('');
                setFilterStatus(undefined); setFilterFamily(undefined);
                loadFromApi();
              }}>重置</Button>
          </Col>
        </Row>
      </div>

      {/* ── 工具栏 ── */}
      <div className="pro-toolbar">
        <div className="toolbar-btns">
          <Button type="primary" icon={<PlusOutlined />}
            className="btn-primary-red" onClick={handleAdd}>新建系列</Button>
          <Popconfirm
            title={`确认批量停用选中的 ${selectedRowKeys.length} 条系列？`}
            onConfirm={handleBatchDisable}
            disabled={selectedRowKeys.length === 0}
            okText="确认" cancelText="取消">
            <Button size="small" icon={<StopOutlined />} danger
              disabled={selectedRowKeys.length === 0}>批量停用</Button>
          </Popconfirm>
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>
          共 <strong style={{ color: '#333' }}>{filtered.length}</strong> 条
          {selectedRowKeys.length > 0 && (
            <span style={{ marginLeft: 8, color: '#1677FF' }}>已选 {selectedRowKeys.length} 条</span>
          )}
        </div>
      </div>

      {/* ── 表格 ── */}
      <div className="pro-table-wrap">
        <Table
          rowKey="id"
          dataSource={filtered}
          columns={columns}
          className="pro-table"
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{ pageSize: 20, showTotal: t => `共${t}条`, showSizeChanger: true, size: 'small' }}
          scroll={{ x: 1000 }}
          size="small"
          rowClassName={r => r.status === 'disabled' ? 'row-disabled' : ''}
        />
      </div>

      {/* ══ 产品族管理弹窗 ══ */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SettingOutlined style={{ color: '#722ED1' }} />
            产品族管理
            <span style={{ fontSize: 12, color: '#aaa', fontWeight: 400 }}>— 定义产品系列的分类枚举值</span>
          </div>
        }
        open={familyMgrOpen}
        onCancel={() => { setFamilyMgrOpen(false); setEditingFamily(null); }}
        footer={<Button onClick={() => { setFamilyMgrOpen(false); setEditingFamily(null); }}>关闭</Button>}
        width={480}
        destroyOnClose={false}
      >
        <div style={{ marginBottom: 12 }}>
          {families.length === 0 && (
            <div style={{ textAlign: 'center', color: '#ccc', padding: '24px 0', fontSize: 13 }}>
              暂无产品族，请在下方添加
            </div>
          )}
          {families.map((name, idx) => {
            const usedCount = series.filter(s => s.productFamily === name).length;
            const isEditing = editingFamily === name;
            return (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px',
                background: isEditing ? '#f0f7ff' : (idx % 2 === 0 ? '#fafafa' : '#fff'),
                borderRadius: 6,
                border: isEditing ? '1px solid #91caff' : '1px solid transparent',
                marginBottom: 4,
                transition: 'all 0.15s',
              }}>
                <span style={{ width: 20, textAlign: 'right', color: '#bbb', fontSize: 12, flexShrink: 0 }}>
                  {idx + 1}
                </span>
                {isEditing ? (
                  <>
                    <Input size="small" value={familyInput} autoFocus
                      status={familyInputErr ? 'error' : ''}
                      onChange={e => { setFamilyInput(e.target.value); setFamilyInputErr(''); }}
                      onPressEnter={saveEditFamily}
                      style={{ flex: 1 }} />
                    {familyInputErr && (
                      <span style={{ fontSize: 11, color: '#ff4d4f', flexShrink: 0 }}>{familyInputErr}</span>
                    )}
                    <Button size="small" type="primary" onClick={saveEditFamily}
                      style={{ background: '#722ED1', borderColor: '#722ED1', flexShrink: 0 }}>保存</Button>
                    <Button size="small" onClick={cancelEditFamily} style={{ flexShrink: 0 }}>取消</Button>
                  </>
                ) : (
                  <>
                    <Tag color={FAMILY_COLORS[idx % FAMILY_COLORS.length]}
                      style={{ flex: 1, fontSize: 13, padding: '2px 10px', margin: 0, cursor: 'default' }}>
                      {name}
                    </Tag>
                    <span style={{ fontSize: 11, color: '#aaa', flexShrink: 0 }}>
                      {usedCount > 0 ? `${usedCount} 个系列` : '未使用'}
                    </span>
                    <Tooltip title="重命名">
                      <Button type="text" size="small" icon={<EditOutlined />}
                        style={{ color: '#1677FF', padding: '0 4px', flexShrink: 0 }}
                        onClick={() => startEditFamily(name)} />
                    </Tooltip>
                    <Tooltip title={usedCount > 0 ? `已被 ${usedCount} 个系列引用，不可删除` : '删除'}>
                      <Popconfirm
                        title={`确认删除产品族「${name}」？`}
                        description="删除后不可恢复，请确保无系列引用此分类"
                        disabled={usedCount > 0}
                        okText="确认删除" cancelText="取消"
                        okButtonProps={{ danger: true }}
                        icon={<ExclamationCircleOutlined style={{ color: '#FF4D4F' }} />}
                        onConfirm={() => handleDeleteFamily(name)}>
                        <Button type="text" size="small" icon={<DeleteOutlined />}
                          danger disabled={usedCount > 0}
                          style={{ padding: '0 4px', flexShrink: 0 }} />
                      </Popconfirm>
                    </Tooltip>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <Divider style={{ margin: '10px 0' }} />

        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>
            <PlusOutlined style={{ marginRight: 4 }} />新增产品族
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input size="small"
              placeholder="输入产品族名称，如：激光锉族"
              value={familyInlineInput}
              onChange={e => setFamilyInlineInput(e.target.value)}
              onPressEnter={handleFamilyInlineAdd}
              maxLength={30} showCount
              style={{ flex: 1 }} />
            <Button size="small" type="primary" icon={<PlusOutlined />}
              onClick={handleFamilyInlineAdd}
              disabled={!familyInlineInput.trim()}
              style={{ background: '#722ED1', borderColor: '#722ED1', flexShrink: 0 }}>添加</Button>
          </div>
        </div>
      </Modal>

      {/* ══ 新建 / 编辑 产品系列 弹窗 ══ */}
      <Modal
        title={
          <span>
            <span style={{
              display: 'inline-block', width: 4, height: 16,
              background: '#C8000A', borderRadius: 2, marginRight: 8, verticalAlign: 'middle',
            }} />
            {editingItem ? '编辑产品系列' : '新建产品系列'}
          </span>
        }
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="保存" cancelText="取消" width={520}
        okButtonProps={{ style: { background: '#C8000A', borderColor: '#C8000A' } }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" size="middle" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="seriesCode" label="系列编码"
                rules={[
                  { required: true, message: '请输入系列编码' },
                  { pattern: /^[A-Z0-9\-]{2,20}$/, message: '仅大写字母、数字、连字符，2~20位' },
                ]}>
                <Input placeholder="如：RT-RKQ" disabled={!!editingItem} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="系列状态" rules={[{ required: true }]}>
                <Select options={[{ value: 'active', label: '启用' }, { value: 'disabled', label: '停用' }]} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="seriesName" label="系列名称"
                rules={[{ required: true, message: '请输入系列名称' }, { max: 50 }]}>
                <Input placeholder="如：机用根管锉标准系列" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="productFamily" label="所属产品族" rules={[{ required: true, message: '请选择产品族' }]}>
                <Select placeholder="请选择" showSearch
                  options={families.map(f => ({ value: f, label: f }))}
                  dropdownRender={menu => (
                    <>
                      {menu}
                      <Divider style={{ margin: '4px 0' }} />
                      <div style={{ padding: '4px 8px' }}>
                        <Button type="link" size="small" icon={<SettingOutlined />}
                          style={{ color: '#722ED1', padding: 0, fontSize: 12 }}
                          onClick={() => { setModalOpen(false); setTimeout(openFamilyMgr, 100); }}>
                          管理产品族枚举值
                        </Button>
                      </div>
                    </>
                  )} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="defaultRoutingCode" label="默认工艺路径">
                <Select placeholder="请选择（可为空）" allowClear showSearch
                  options={mockRoutingMasters
                    .filter(r => r.status === 'ENABLED')
                    .map(r => ({ value: r.routingCode, label: `${r.routingCode}  ${r.version}` }))} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={3} placeholder="产品系列说明、适用范围等" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductSeriesPage;
