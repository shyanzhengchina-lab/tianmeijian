import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getUnitList, createUnit, updateUnit, deleteUnit, batchDeleteUnits } from '../../api/units';
import {
  Table, Button, Input, Space, Tag, Modal, Form, InputNumber,
  Select, Popconfirm, message, Row, Col, Badge, Tree, Divider
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined,
  SearchOutlined, ReloadOutlined, EditOutlined,
  ExclamationCircleOutlined, CloudDownloadOutlined,
  ImportOutlined, ExportOutlined, SettingOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import './UnitPage.css';

// ─── Types ──────────────────────────────────────────────────────────────────
interface UnitItem {
  id: string;
  code: string;
  name: string;
  enName: string;
  groupId: string;
  groupName: string;
  method: '四舍五入' | '入位' | '去位';
  precision: number;
  status: 'active' | 'disabled';
  isBase: boolean;
}

interface UnitGroup {
  id: string;
  name: string;
  children?: UnitGroup[];
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const mockGroups: UnitGroup[] = [
  { id: 'all', name: '全部', children: [
    { id: 'g1', name: '中医药材' },
    { id: 'g2', name: '统计学单位2' },
    { id: 'g3', name: '标准桶' },
    { id: 'g4', name: 'FUWU 服务' },
    { id: 'g5', name: 'Length 长度' },
    { id: 'g6', name: 'Others 其他' },
    { id: 'g7', name: 'PartsNumber 件数' },
    { id: 'g8', name: 'Time 时间' },
    { id: 'g9', name: 'Volume 体积' },
    { id: 'g10', name: 'Weight 质量' },
    { id: 'g11', name: 'YDW 物流单位' },
    { id: 'g12', name: '包装规格' },
  ]}
];

const mockUnits: UnitItem[] = [
  { id: '1',  code: 'fy01', name: '斤',    enName: '',              groupId: 'g10', groupName: '包装材料', method: '入位',   precision: 0, status: 'active',   isBase: false },
  { id: '2',  code: 'MTQ',  name: '立方米', enName: 'Cubic Meters',  groupId: 'g9',  groupName: '体积',   method: '四舍五入', precision: 3, status: 'active',   isBase: false },
  { id: '3',  code: 'KWh',  name: '千瓦时', enName: 'Kilowatt-hour', groupId: 'g6',  groupName: '其他',   method: '四舍五入', precision: 2, status: 'active',   isBase: false },
  { id: '4',  code: 'MA',   name: '毫安',   enName: '',              groupId: 'g8',  groupName: '时间',   method: '入位',   precision: 0, status: 'active',   isBase: false },
  { id: '5',  code: 'KV',   name: '千伏',   enName: '',              groupId: 'g8',  groupName: '时间',   method: '四舍五入', precision: 0, status: 'active',   isBase: true  },
  { id: '6',  code: 'CMT',  name: '厘米',   enName: 'Centimeters',   groupId: 'g5',  groupName: '长度',   method: '四舍五入', precision: 0, status: 'active',   isBase: false },
  { id: '7',  code: 'DMT',  name: '分米',   enName: 'Decimeters',    groupId: 'g5',  groupName: '长度',   method: '四舍五入', precision: 0, status: 'active',   isBase: false },
  { id: '8',  code: '302',  name: 'kg',    enName: '',              groupId: 'g12', groupName: '包装材料', method: '入位',   precision: 2, status: 'active',   isBase: false },
  { id: '9',  code: '301',  name: '个',    enName: '',              groupId: 'g12', groupName: '包装材料', method: '入位',   precision: 0, status: 'disabled', isBase: true  },
  { id: '10', code: 'kg',   name: 'kg',    enName: '',              groupId: 'g7',  groupName: '原料药单位', method: '入位',   precision: 5, status: 'active',   isBase: false },
  { id: '11', code: 'g',    name: 'g',     enName: '',              groupId: 'g7',  groupName: '原料药单位', method: '入位',   precision: 5, status: 'active',   isBase: false },
  { id: '12', code: '102',  name: '粒',    enName: '',              groupId: 'g1',  groupName: '中医药材', method: '入位',   precision: 0, status: 'active',   isBase: false },
  { id: '13', code: 'carLiang', name: '辆', enName: '',             groupId: 'g11', groupName: '车辆',   method: '四舍五入', precision: 2, status: 'active',   isBase: true  },
  { id: '14', code: 'PCS',  name: 'PCS',   enName: 'PCS',           groupId: 'g7',  groupName: '件数',   method: '入位',   precision: 2, status: 'active',   isBase: false },
  { id: '15', code: '枚',   name: '枚',    enName: '',              groupId: 'g12', groupName: '包装规格', method: '入位',   precision: 2, status: 'active',   isBase: false },
  { id: '16', code: '块',   name: '块',    enName: '',              groupId: 'g12', groupName: '包装规格', method: '四舍五入', precision: 3, status: 'active',   isBase: false },
  { id: '17', code: '根',   name: '根',    enName: '',              groupId: 'g12', groupName: '包装规格', method: '入位',   precision: 2, status: 'active',   isBase: false },
  { id: '18', code: 'ml',   name: '毫升',  enName: '',              groupId: 'g1',  groupName: '中医药材', method: '入位',   precision: 5, status: 'active',   isBase: false },
  { id: '19', code: 'TONG', name: '桶',    enName: '',              groupId: 'g1',  groupName: '中医药材', method: '入位',   precision: 2, status: 'active',   isBase: false },
  { id: '20', code: 'YDW02', name: '金',   enName: '',             groupId: 'g12', groupName: '包装规格', method: '入位',   precision: 2, status: 'active',   isBase: false },
];

// ─── Tree helper ─────────────────────────────────────────────────────────────
const buildTreeData = (groups: UnitGroup[]): any[] =>
  groups.map(g => ({
    key: g.id,
    title: (
      <span style={{ fontSize: 13, color: '#333' }}>
        {g.id === 'all' ? '全部' : (
          <><FolderOutlined style={{ color: '#FAAD14', marginRight: 4, fontSize: 12 }} />{g.name}</>
        )}
      </span>
    ),
    children: g.children ? buildTreeData(g.children) : undefined,
  }));

// ─── Component ───────────────────────────────────────────────────────────────
const UnitPage: React.FC = () => {
  const [units, setUnits] = useState<UnitItem[]>(mockUnits);
  const [apiLoading, setApiLoading] = useState(false);

  const loadFromApi = useCallback(async () => {
    setApiLoading(true);
    try {
      const resp = await getUnitList() as any;
      const apiList: any[] = resp.data ?? [];
      if (apiList.length > 0) {
        const mapped: UnitItem[] = apiList.map((item: any) => ({
          id: item.id?.toString() ?? String(Math.random()),
          code: item.code ?? '',
          name: item.name ?? '',
          enName: item.enName ?? '',
          groupId: item.groupId ? `g${item.groupId}` : 'g10',
          groupName: item.groupName ?? '',
          method: (item.method as any) ?? '四舍五入',
          precision: item.precision ?? 0,
          status: item.status === 0 ? 'disabled' : 'active',
          isBase: item.isBase === 1,
        }));
        setUnits(mapped);
      }
    } catch { /* keep mock data on error */ } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null);
  const [form] = Form.useForm();

  // ── Filter ──────────────────────────────────────────────────────────────
  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      const groupMatch = selectedGroupId === 'all' || u.groupId === selectedGroupId;
      const codeMatch  = !searchCode || u.code.toLowerCase().includes(searchCode.toLowerCase());
      const nameMatch  = !searchName || u.name.includes(searchName) || u.enName.toLowerCase().includes(searchName.toLowerCase());
      return groupMatch && codeMatch && nameMatch;
    });
  }, [units, selectedGroupId, searchCode, searchName]);

  const handleReset = () => { setSearchCode(''); setSearchName(''); };

  // ── CRUD handlers ────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingUnit(null);
    form.resetFields();
    form.setFieldsValue({ method: '四舍五入', precision: 0, status: 'active', isBase: false });
    setModalOpen(true);
  };

  const openEdit = (record: UnitItem) => {
    setEditingUnit(record);
    form.setFieldsValue({ ...record });
    setModalOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then(async values => {
      if (editingUnit) {
        try {
          const numId = Number(editingUnit.id);
          if (!isNaN(numId) && numId > 0) {
            await updateUnit(numId, {
              code:      values.code,
              name:      values.name,
              enName:    values.enName,
              groupId:   Number(values.groupId?.replace('g', '')) || undefined,
              method:    values.method,
              precision: values.precision,
              isBase:    values.isBase ? 1 : 0,
              status:    values.status === 'active' ? 1 : 0,
            });
          }
          setUnits(prev => prev.map(u => u.id === editingUnit.id ? { ...u, ...values } : u));
          message.success('修改成功');
        } catch { /* interceptor already toasted */ }
      } else {
        try {
          const resp = await createUnit({
            code:      values.code,
            name:      values.name,
            enName:    values.enName,
            groupId:   Number(values.groupId?.replace('g', '')) || undefined,
            method:    values.method,
            precision: values.precision,
            isBase:    values.isBase ? 1 : 0,
            status:    1,
          }) as any;
          const savedId = resp?.data?.id ? String(resp.data.id) : Date.now().toString();
          const newUnit: UnitItem = {
            ...values,
            id: savedId,
            groupName: mockGroups[0].children?.find((g: UnitGroup) => g.id === values.groupId)?.name || '',
          };
          setUnits(prev => [...prev, newUnit]);
          message.success('新建成功');
        } catch { /* interceptor already toasted */ }
      }
      setModalOpen(false);
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  const handleDelete = async (ids: React.Key[]) => {
    const numIds = ids.map(id => Number(id)).filter(n => !isNaN(n) && n > 0);
    try {
      if (numIds.length === 1) {
        await deleteUnit(numIds[0]);
      } else if (numIds.length > 1) {
        await batchDeleteUnits(numIds);
      }
    } catch { /* interceptor already toasted */ }
    setUnits(prev => prev.filter(u => !ids.includes(u.id)));
    setSelectedRowKeys([]);
    message.success(`已删除 ${ids.length} 条记录`);
  };

  const handleToggle = async (ids: React.Key[], status: 'active' | 'disabled') => {
    const apiStatus = status === 'active' ? 1 : 0;
    const numIds = ids.map(id => Number(id)).filter(n => !isNaN(n) && n > 0);
    for (const numId of numIds) {
      try { await updateUnit(numId, { status: apiStatus }); } catch { /* ignore */ }
    }
    setUnits(prev => prev.map(u => ids.includes(u.id) ? { ...u, status } : u));
    setSelectedRowKeys([]);
    message.success(status === 'active' ? '已启用' : '已停用');
  };

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns: ColumnsType<UnitItem> = [
    {
      title: '序号',
      width: 55,
      align: 'center',
      render: (_: any, __: any, i: number) => (
        <span style={{ color: '#888', fontSize: 12 }}>{i + 1}</span>
      ),
    },
    {
      title: '编码',
      dataIndex: 'code',
      width: 110,
      render: (v: string) => (
        <span style={{ color: '#1677FF', fontFamily: 'monospace', fontSize: 13, cursor: 'pointer' }}>{v}</span>
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 100,
      render: (v: string) => <span style={{ fontWeight: 500, fontSize: 13 }}>{v}</span>,
    },
    {
      title: '英文名称',
      dataIndex: 'enName',
      width: 140,
      render: (v: string) => v ? <span style={{ color: '#555', fontSize: 13 }}>{v}</span> : <span style={{ color: '#ccc' }}>-</span>,
    },
    {
      title: '分组',
      dataIndex: 'groupName',
      width: 120,
      render: (v: string) => <span style={{ fontSize: 13, color: '#444' }}>{v}</span>,
    },
    {
      title: '单位方式',
      dataIndex: 'method',
      width: 110,
      render: (v: string) => <span style={{ fontSize: 12, color: '#555' }}>{v}</span>,
    },
    {
      title: '单位精度',
      dataIndex: 'precision',
      width: 80,
      align: 'center',
      render: (v: number) => <span style={{ fontSize: 13 }}>{v}</span>,
    },
    {
      title: '启用状态',
      dataIndex: 'status',
      width: 90,
      align: 'center',
      render: (v: string) =>
        v === 'active'
          ? <span className="status-tag status-active">已启用</span>
          : <span className="status-tag status-disabled">已停用</span>,
    },
    {
      title: '是否基本单位',
      dataIndex: 'isBase',
      width: 110,
      align: 'center',
      render: (v: boolean) => <span style={{ fontSize: 13, color: v ? '#1677FF' : '#aaa' }}>{v ? '是' : '否'}</span>,
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      render: (_: any, record: UnitItem) => (
        <Space size={0} split={<Divider type="vertical" style={{ margin: 0 }} />}>
          <Button type="link" size="small" style={{ padding: '0 4px', fontSize: 12 }}
            onClick={() => openEdit(record)}>编辑</Button>
          <Button type="link" size="small" style={{ padding: '0 4px', fontSize: 12 }}
            onClick={() => handleToggle([record.id], record.status === 'active' ? 'disabled' : 'active')}>
            {record.status === 'active' ? '停用' : '启用'}
          </Button>
          <Popconfirm
            title="确认删除此计量单位？"
            onConfirm={() => handleDelete([record.id])}
            okText="确认" cancelText="取消"
            icon={<ExclamationCircleOutlined style={{ color: '#E60012' }} />}
          >
            <Button type="link" danger size="small" style={{ padding: '0 4px', fontSize: 12 }}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const treeData = buildTreeData(mockGroups);
  const hasSelected = selectedRowKeys.length > 0;

  return (
    <div className="unit-page-v2">
      {/* ── Left Tree ──────────────────────────────────────────────────── */}
      <div className="unit-tree-panel">
        <div className="tree-search-box">
          <Input
            prefix={<SearchOutlined style={{ color: '#bbb', fontSize: 12 }} />}
            placeholder="请输入关键字"
            size="small"
            style={{ borderRadius: 4, fontSize: 12 }}
          />
        </div>
        <div className="tree-scroll">
          <Tree
            treeData={treeData}
            defaultExpandAll
            selectedKeys={[selectedGroupId]}
            onSelect={keys => { if (keys[0]) setSelectedGroupId(keys[0] as string); }}
            className="unit-group-tree"
            blockNode
          />
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────────────────────────── */}
      <div className="unit-main-panel">

        {/* Search bar */}
        <div className="unit-search-bar">
          <Row gutter={8} align="middle" wrap={false}>
            <Col>
              <Select defaultValue="默认分类" size="small" style={{ width: 110 }}
                options={[{ value: '默认分类', label: '默认分类' }, { value: '自定义', label: '自定义' }]} />
            </Col>
            <Col>
              <span className="search-label">编码</span>
              <Input size="small" style={{ width: 140 }} value={searchCode}
                onChange={e => setSearchCode(e.target.value)} placeholder="请输入编码" allowClear />
            </Col>
            <Col>
              <span className="search-label">名称</span>
              <Input size="small" style={{ width: 140 }} value={searchName}
                onChange={e => setSearchName(e.target.value)} placeholder="请输入名称" allowClear />
            </Col>
            <Col>
              <Button type="primary" size="small" icon={<SearchOutlined />}
                style={{ background: '#1677FF', borderColor: '#1677FF' }}>查询</Button>
            </Col>
            <Col>
              <Button size="small" icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Col>
          </Row>
          <div className="selected-tag-row">
            已选条件：
            {selectedGroupId !== 'all' && (
              <Tag closable onClose={() => setSelectedGroupId('all')} style={{ fontSize: 12 }}>
                分组: {mockGroups[0].children?.find(g => g.id === selectedGroupId)?.name}
              </Tag>
            )}
            {!searchCode && !searchName && selectedGroupId === 'all' && <span style={{ color: '#bbb', fontSize: 12 }}>无</span>}
          </div>
        </div>

        {/* Toolbar */}
        <div className="unit-toolbar">
          <div className="toolbar-btns">
            <Button
              type="primary" icon={<PlusOutlined />}
              className="btn-primary-red"
              onClick={openAdd}
            >新建</Button>
            <Button icon={<CloudDownloadOutlined />} size="small" className="toolbar-btn">
              云调导入 ▾
            </Button>
            <Button icon={<CheckCircleOutlined />} size="small" className="toolbar-btn"
              disabled={!hasSelected}
              onClick={() => handleToggle(selectedRowKeys, 'active')}>
              启用
            </Button>
            <Button icon={<StopOutlined />} size="small" className="toolbar-btn"
              disabled={!hasSelected}
              onClick={() => handleToggle(selectedRowKeys, 'disabled')}>
              停用
            </Button>
            <Button icon={<ImportOutlined />} size="small" className="toolbar-btn">导入 ▾</Button>
            <Button icon={<ExportOutlined />} size="small" className="toolbar-btn">导出</Button>
            <Button icon={<SettingOutlined />} size="small" className="toolbar-btn">设置</Button>
            <Popconfirm
              title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
              onConfirm={() => handleDelete(selectedRowKeys)}
              disabled={!hasSelected}
              okText="确认" cancelText="取消"
            >
              <Button icon={<DeleteOutlined />} size="small" className="toolbar-btn"
                danger disabled={!hasSelected}>删除</Button>
            </Popconfirm>
          </div>
          <div className="toolbar-right-icons">
            <Button type="text" size="small" icon={<ReloadOutlined />} loading={apiLoading}
              style={{ color: '#666' }} onClick={() => loadFromApi()} />
          </div>
        </div>

        {/* Table */}
        <div className="unit-table-wrap">
          <Table
            rowKey="id"
            dataSource={filteredUnits}
            columns={columns}
            loading={apiLoading}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total) => `共${total}条`,
              showQuickJumper: true,
              size: 'small',
              style: { padding: '10px 16px', borderTop: '1px solid #f0f0f0', margin: 0, background: '#fafafa' },
            }}
            scroll={{ x: 1000 }}
            size="small"
            className="unit-data-table"
            rowClassName={(r) => r.status === 'disabled' ? 'row-disabled' : ''}
          />
        </div>
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────── */}
      <Modal
        title={
          <span>
            <span style={{
              display: 'inline-block', width: 4, height: 16,
              background: '#E60012', borderRadius: 2,
              marginRight: 8, verticalAlign: 'middle',
            }} />
            {editingUnit ? '编辑计量单位' : '新建计量单位'}
          </span>
        }
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="保存" cancelText="取消"
        width={520}
        okButtonProps={{ style: { background: '#1677FF' } }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" size="middle" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="编码" rules={[{ required: true, message: '请输入编码' }]}>
                <Input placeholder="例: PCS" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="例: 件" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="enName" label="英文名称">
                <Input placeholder="例: Piece" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="groupId" label="分组" rules={[{ required: true, message: '请选择分组' }]}>
                <Select placeholder="请选择分组" showSearch
                  options={mockGroups[0].children?.map(g => ({ value: g.id, label: g.name }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="method" label="单位方式" rules={[{ required: true }]}>
                <Select options={[
                  { value: '四舍五入', label: '四舍五入' },
                  { value: '入位',   label: '入位' },
                  { value: '去位',   label: '去位' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="precision" label="单位精度" rules={[{ required: true }]}>
                <InputNumber min={0} max={6} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="启用状态">
                <Select options={[
                  { value: 'active',   label: '启用' },
                  { value: 'disabled', label: '停用' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isBase" label="是否基本单位">
                <Select options={[
                  { value: false, label: '否' },
                  { value: true,  label: '是' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default UnitPage;
