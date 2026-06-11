import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getMaterialList, createMaterial, updateMaterial, deleteMaterial, batchDeleteMaterials } from '../../api/materials';
import { getMaterialCategoryList } from '../../api/materialCategories';
import { getUnitList } from '../../api/units';
import {
  getMaterialDiByMaterialId, createMaterialDi, updateMaterialDi,
} from '../../api/udi';
import type { MaterialDiRecord } from '../../api/udi';
import { loadDiMap, saveDiMap } from '../udi/udiUtils';
import {
  Tree, Table, Button, Input, Select, Space, Tag, Modal, Form,
  InputNumber, Popconfirm, message, Tooltip, Row, Col, Divider,
} from 'antd';
import { QrcodeOutlined } from '@ant-design/icons';
import {
  PlusOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined,
  SearchOutlined, ReloadOutlined, EditOutlined, MoreOutlined,
  FolderOutlined, FileOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { mockCategories, mockMaterials, mockUnitGroups } from '../../store/mockData';
import type { MaterialCategoryRecord } from '../../api/materialCategories';
import type { UnitRecord } from '../../api/units';
import { Material, MaterialCategory } from '../../modules/basic-data/material/types';
import './MaterialPage.css';

type DataNode = {
  key: string;
  title: React.ReactNode;
  children?: DataNode[];
  isLeaf?: boolean;
};

const convertToTreeData = (categories: MaterialCategory[]): DataNode[] => {
  return categories.map(cat => ({
    key: cat.id,
    title: (
      <span className="tree-node-label">
        {cat.children && cat.children.length > 0 ? (
          <FolderOutlined style={{ color: '#FAAD14', marginRight: 4 }} />
        ) : (
          <FileOutlined style={{ color: '#8C8C8C', marginRight: 4 }} />
        )}
        {cat.name}
      </span>
    ),
    children: cat.children ? convertToTreeData(cat.children) : undefined,
    isLeaf: !cat.children || cat.children.length === 0,
  }));
};

const flattenCategories = (cats: MaterialCategory[]): MaterialCategory[] => {
  const result: MaterialCategory[] = [];
  const walk = (items: MaterialCategory[]) => {
    items.forEach(c => {
      result.push(c);
      if (c.children) walk(c.children);
    });
  };
  walk(cats);
  return result;
};

// 物料类型色标映射
const TYPE_COLOR: Record<string, string> = {
  '原材料': 'blue',
  '半成品': 'orange',
  '成品':   'green',
  '包装材料': 'purple',
  '辅料':   'cyan',
  '模具工装': 'red',
};

const MaterialPage: React.FC = () => {
  // 初始化空数组，等API加载后填充天美健真实数据
  const [materials, setMaterials] = useState<any[]>([]);
  const [apiLoading, setApiLoading] = useState(false);

  // ── API-loaded categories & units (fallback to mock) ─────────────
  const [apiCategories, setApiCategories] = useState<MaterialCategory[]>([]);
  const [apiUnits, setApiUnits] = useState<Array<{ id: string; name: string; code: string }>>([]);

  const loadFromApi = useCallback(async () => {
    setApiLoading(true);
    try {
      const [matResp, catResp, unitResp] = await Promise.allSettled([
        getMaterialList() as any,
        getMaterialCategoryList() as any,
        getUnitList() as any,
      ]);
      // 物料列表
      if (matResp.status === 'fulfilled') {
        const apiList: any[] = matResp.value?.data ?? [];
        if (apiList.length > 0) {
          const mapped = apiList.map((item: any) => ({
            id: item.id?.toString() ?? item.code ?? String(Math.random()),
            code: item.code ?? '',
            name: item.name ?? '',
            categoryId: item.categoryId?.toString() ?? '2',
            spec: item.spec ?? '',
            unit: item.unitName ?? '',
            type: item.type ?? '原材料',
            brand: item.brand ?? '',
            supplier: item.supplier ?? '',
            minStock: item.minStock ?? 0,
            maxStock: item.maxStock ?? 0,
            price: item.price ?? 0,
            status: item.status === 0 ? 'disabled' : 'active',
            description: item.description ?? '',
          }));
          setMaterials(mapped);
        }
      }
      // 分类树
      if (catResp.status === 'fulfilled') {
        const records: MaterialCategoryRecord[] = catResp.value?.data ?? catResp.value ?? [];
        if (Array.isArray(records) && records.length > 0) {
          // flat → tree
          const flat: MaterialCategory[] = records.map((r, idx) => ({
            id: String(r.id ?? ''),
            parentId: r.parentId != null ? String(r.parentId) : undefined,
            code: r.code ?? '',
            name: r.name ?? '',
            level: 2,
            sort: r.sortNo ?? idx,
            status: r.status === 0 ? 'inactive' as const : 'active' as const,
            children: [] as MaterialCategory[],
          }));
          const idMap: Record<string, MaterialCategory> = {};
          flat.forEach(n => { idMap[n.id] = n; });
          const roots: MaterialCategory[] = [];
          flat.forEach(n => {
            if (n.parentId && idMap[n.parentId]) {
              idMap[n.parentId].children = idMap[n.parentId].children ?? [];
              idMap[n.parentId].children!.push(n);
            } else {
              roots.push(n);
            }
          });
          if (roots.length > 0) setApiCategories(roots);
        }
      }
      // 计量单位
      if (unitResp.status === 'fulfilled') {
        const unitList: UnitRecord[] = unitResp.value?.data ?? unitResp.value ?? [];
        if (Array.isArray(unitList) && unitList.length > 0) {
          const baseUnits = unitList
            .filter(u => u.isBase === 1 || u.isBase == null)
            .map(u => ({ id: String(u.id ?? ''), name: u.name ?? '', code: u.code ?? '' }));
          if (baseUnits.length > 0) setApiUnits(baseUnits);
        }
      }
    } catch { /* keep mock data on error */ } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('1');
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [form] = Form.useForm();
  const [formType, setFormType] = useState<string>(''); // watches material type for DI field visibility

  const treeData = useMemo(() => convertToTreeData(
    (apiCategories.length > 0 ? apiCategories : mockCategories) as any
  ), [apiCategories]);
  const allCategories = useMemo(() => flattenCategories(
    (apiCategories.length > 0 ? apiCategories : mockCategories) as any
  ), [apiCategories]);
  const allUnits = useMemo(() => {
    if (apiUnits.length > 0) return apiUnits.map(u => ({ id: u.id, name: u.name, code: u.code, isMain: true }));
    return mockUnitGroups.flatMap(g => g.units.filter(u => u.isMain));
  }, [apiUnits]);

  // 所有不重复供应商列表用于下拉
  const supplierOptions = useMemo(() => {
    const set = new Set(materials.map(m => m.supplier).filter(Boolean));
    return Array.from(set).map(s => ({ value: s, label: s }));
  }, [materials]);

  // 分类匹配：支持层级匹配（选中父级分类时展示所有子级下的物料）
  const getDescendantIds = (catId: string): string[] => {
    const result: string[] = [catId];
    const walk = (cats: MaterialCategory[]) => {
      cats.forEach(c => {
        if (c.parentId === catId || result.includes(c.parentId || '')) {
          result.push(c.id);
          if (c.children) walk(c.children);
        }
      });
    };
    walk(allCategories);
    return result;
  };

  const filteredMaterials = useMemo(() => {
    const catIds = selectedCategoryId === '1'
      ? null
      : getDescendantIds(selectedCategoryId);
    return (materials as any[]).filter((m: any) => {
      const categoryMatch = !catIds || catIds.includes(m.categoryId ?? '');
      const searchMatch = !searchText ||
        m.name.includes(searchText) ||
        m.code.includes(searchText) ||
        (m.spec || '').includes(searchText) ||
        (m.supplier || '').includes(searchText);
      const typeMatch = !filterType || m.type === filterType;
      const statusMatch = !filterStatus || m.status === filterStatus;
      return categoryMatch && searchMatch && typeMatch && statusMatch;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materials, selectedCategoryId, searchText, filterType, filterStatus, allCategories]);

  const handleAdd = () => {
    setEditingMaterial(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active', categoryId: selectedCategoryId !== '1' ? selectedCategoryId : undefined });
    setFormType('原材料');
    setModalOpen(true);
  };

  const handleEdit = async (record: Material) => {
    setEditingMaterial(record);
    setFormType(record.type ?? '原材料');
    form.setFieldsValue(record);
    // Load existing DI config if type is 成品
    if ((record.type as string) === '成品') {
      try {
        const numId = Number(record.id);
        if (!isNaN(numId)) {
          const resp = await getMaterialDiByMaterialId(numId);
          const di: MaterialDiRecord | null = resp?.data ?? null;
          if (di) {
            form.setFieldsValue({ gtin: di.gtin, diCode: di.diCode, diIssuer: di.issuer });
          }
        } else {
          // Fallback: localStorage DI map
          const diMap = loadDiMap();
          const localDi = diMap[numId];
          if (localDi) {
            form.setFieldsValue({ gtin: localDi.gtin, diCode: localDi.diCode, diIssuer: localDi.issuer });
          }
        }
      } catch {
        const diMap = loadDiMap();
        const localDi = diMap[Number(record.id)];
        if (localDi) form.setFieldsValue({ gtin: localDi.gtin, diCode: localDi.diCode, diIssuer: localDi.issuer });
      }
    }
    setModalOpen(true);
  };

  const handleDelete = async (ids: string[]) => {
    try {
      if (ids.length === 1) {
        const numId = Number(ids[0]);
        if (!isNaN(numId)) await deleteMaterial(numId);
      } else {
        const numIds = ids.map(Number).filter(n => !isNaN(n));
        if (numIds.length > 0) await batchDeleteMaterials(numIds);
      }
      await loadFromApi();
    } catch {
      setMaterials((prev: any[]) => prev.filter((m: any) => !ids.includes(m.id)));
    }
    setSelectedRowKeys([]);
    message.success(`已删除 ${ids.length} 条物料`);
  };

  const handleToggleStatus = (ids: string[], status: 'active' | 'disabled') => {
    setMaterials((prev: any[]) => prev.map((m: any) => ids.includes(m.id) ? { ...m, status } : m));
    setSelectedRowKeys([]);
    message.success(status === 'active' ? '已启用' : '已禁用');
  };

  const handleModalOk = () => {
    form.validateFields().then(async values => {
      // 前端预校验：检查编码唯一性（排除正在编辑的物料自身）
      const duplicate = materials.find((m: any) =>
        m.code === values.code && m.id !== editingMaterial?.id
      );
      if (duplicate) {
        form.setFields([{ name: 'code', errors: [`物料编码「${values.code}」已存在`] }]);
        return;
      }
      const payload = {
        code: values.code,
        name: values.name,
        categoryId: Number(values.categoryId) || undefined,
        spec: values.spec,
        unitName: values.unit,
        type: values.type,
        brand: values.brand,
        supplier: values.supplier,
        minStock: values.minStock,
        maxStock: values.maxStock,
        price: values.price,
        description: values.description,
        status: 1,
      };
      // Helper: persist DI config for 成品
      const saveDiConfig = async (materialId: number, isNew: boolean) => {
        if (values.type !== '成品' || !values.gtin) return;
        const diRecord: MaterialDiRecord = {
          materialId,
          gtin: values.gtin,
          diCode: values.diCode || values.gtin,
          issuer: values.diIssuer || 'GS1',
        };
        // Save to localStorage always
        const diMap = loadDiMap();
        diMap[materialId] = { ...diRecord, materialCode: values.code, materialName: values.name };
        saveDiMap(diMap);
        // Try API
        try {
          if (isNew) {
            await createMaterialDi(diRecord);
          } else {
            const resp = await getMaterialDiByMaterialId(materialId);
            const existing: MaterialDiRecord | null = resp?.data ?? null;
            if (existing?.id) await updateMaterialDi(existing.id, diRecord);
            else await createMaterialDi(diRecord);
          }
        } catch { /* API unavailable, localStorage is sufficient */ }
      };
      if (editingMaterial) {
        try {
          const numId = Number(editingMaterial.id);
          if (!isNaN(numId)) {
            await updateMaterial(numId, payload);
            await saveDiConfig(numId, false);
          }
          await loadFromApi();
          message.success('修改成功');
          setModalOpen(false);
        } catch (err: any) {
          // http interceptor already shows error message; just stay on modal
          if (!err?.errorFields) {
            // backend error already toasted by interceptor — do not close modal
          }
        }
      } else {
        try {
          const resp = await createMaterial(payload) as any;
          const newId = resp?.data?.id ?? resp?.id;
          if (newId) await saveDiConfig(Number(newId), true);
          await loadFromApi();
          message.success('新增成功');
          setModalOpen(false);
        } catch (err: any) {
          // http interceptor already shows "物料编码已存在" error; keep modal open
        }
      }
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  const categoryOptions = allCategories.filter(c => c.id !== '1').map(c => ({
    value: c.id,
    label: c.name,
  }));

  const unitOptions = allUnits.map(u => ({
    value: u.id,
    label: u.name,
  }));

  const columns = [
    {
      title: '序号',
      dataIndex: 'index',
      width: 55,
      render: (_: any, __: any, index: number) => (
        <span style={{ color: '#999', fontSize: 13 }}>{index + 1}</span>
      ),
    },
    {
      title: '物料编码',
      dataIndex: 'code',
      width: 140,
      render: (v: string) => <span className="code-link">{v}</span>,
    },
    {
      title: '物料名称',
      dataIndex: 'name',
      width: 160,
      render: (v: string) => (
        <Tooltip title={v}>
          <span className="name-cell">{v}</span>
        </Tooltip>
      ),
    },
    {
      title: '规格型号',
      dataIndex: 'spec',
      width: 100,
      render: (v: string) => v || <span style={{ color: '#ccc' }}>-</span>,
    },
    {
      title: '计量单位',
      dataIndex: 'unit',
      width: 80,
      render: (v: string) => v || '-',
    },
    {
      title: '物料类型',
      dataIndex: 'type',
      width: 90,
      render: (v: string) => (
        <Tag color={TYPE_COLOR[v] || 'default'} style={{ fontSize: 11, borderRadius: 3 }}>{v}</Tag>
      ),
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      width: 160,
      ellipsis: true,
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      width: 100,
      render: (v: string) => v || <span style={{ color: '#ccc' }}>-</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (v: string) => (
        <Tag
          color={v === 'active' ? 'success' : 'default'}
          style={{ borderRadius: 3, fontSize: 12 }}
        >
          {v === 'active' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Material) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ padding: '0 4px', fontSize: 13 }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除此物料？"
            onConfirm={() => handleDelete([record.id])}
            okText="确认"
            cancelText="取消"
            icon={<ExclamationCircleOutlined style={{ color: '#E60012' }} />}
          >
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
              style={{ padding: '0 4px', fontSize: 13 }}
            >
              删除
            </Button>
          </Popconfirm>
          <Button
            type="link"
            size="small"
            icon={<MoreOutlined />}
            style={{ padding: '0 4px', fontSize: 13, color: '#666' }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="material-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <span className="page-title">物料档案</span>
        </div>
      </div>

      <div className="material-layout">
        {/* Left Tree */}
        <div className="material-tree-panel">
          <div className="tree-search">
            <Input
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              placeholder="搜索分类..."
              size="small"
              style={{ borderRadius: 4 }}
            />
          </div>
          <div className="tree-container">
            <Tree
              treeData={treeData}
              defaultExpandAll
              selectedKeys={[selectedCategoryId]}
              onSelect={(keys) => {
                if (keys.length > 0) setSelectedCategoryId(keys[0] as string);
              }}
              className="material-tree"
              blockNode
            />
          </div>
        </div>

        {/* Right Table Area */}
        <div className="material-table-panel">
          {/* Search Bar */}
          <div className="table-search-bar">
            <Row gutter={[8, 4]} align="middle" wrap>
              <Col>
                <span className="search-label">物料名称</span>
                <Input
                  placeholder="名称 / 编码 / 供应商"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  style={{ width: 180 }}
                  allowClear
                  size="small"
                  prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                />
              </Col>
              <Col>
                <span className="search-label">物料类型</span>
                <Select
                  placeholder="全部类型"
                  value={filterType || undefined}
                  onChange={v => setFilterType(v || '')}
                  style={{ width: 110 }}
                  allowClear
                  size="small"
                  options={[
                    { value: '原材料', label: '原材料' },
                    { value: '半成品', label: '半成品' },
                    { value: '成品',   label: '成品'   },
                    { value: '包装材料', label: '包装材料' },
                    { value: '辅料',   label: '辅料'   },
                    { value: '模具工装', label: '模具工装' },
                  ]}
                />
              </Col>
              <Col>
                <span className="search-label">启用状态</span>
                <Select
                  placeholder="全部"
                  value={filterStatus || undefined}
                  onChange={v => setFilterStatus(v || '')}
                  style={{ width: 90 }}
                  allowClear
                  size="small"
                  options={[
                    { value: 'active',   label: '启用' },
                    { value: 'disabled', label: '禁用' },
                  ]}
                />
              </Col>
              <Col>
                <Button type="primary" size="small" icon={<SearchOutlined />}
                  onClick={() => {}}>查询</Button>
              </Col>
              <Col>
                <Button size="small" icon={<ReloadOutlined />}
                  onClick={() => { setSearchText(''); setFilterType(''); setFilterStatus(''); }}>
                  重置
                </Button>
              </Col>
              <Col flex="auto" style={{ textAlign: 'right', color: '#999', fontSize: 12 }}>
                共 <strong style={{ color: '#1677FF' }}>{filteredMaterials.length}</strong> / {materials.length} 条
              </Col>
            </Row>
          </div>

          {/* Action Toolbar */}
          <div className="table-toolbar">
            <div className="toolbar-left">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
                className="btn-add"
              >
                新增
              </Button>
              <Popconfirm
                title={`确认删除选中的 ${selectedRowKeys.length} 条物料？`}
                onConfirm={() => handleDelete(selectedRowKeys)}
                disabled={selectedRowKeys.length === 0}
                okText="确认"
                cancelText="取消"
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  disabled={selectedRowKeys.length === 0}
                >
                  批量删除
                </Button>
              </Popconfirm>
              <Button
                icon={<StopOutlined />}
                disabled={selectedRowKeys.length === 0}
                onClick={() => handleToggleStatus(selectedRowKeys, 'disabled')}
              >
                禁用
              </Button>
              <Button
                icon={<CheckCircleOutlined />}
                disabled={selectedRowKeys.length === 0}
                onClick={() => handleToggleStatus(selectedRowKeys, 'active')}
                style={{ color: '#52C41A', borderColor: '#52C41A' }}
              >
                启用
              </Button>
            </div>
            <div className="toolbar-right">
              <Button
                icon={<ReloadOutlined />}
                size="small"
                loading={apiLoading}
                onClick={() => { setSearchText(''); setFilterType(''); setFilterStatus(''); loadFromApi(); }}
                style={{ marginRight: 8 }}
              >
                刷新
              </Button>
              <span className="record-count">
                共 <strong>{filteredMaterials.length}</strong> 条记录
              </span>
            </div>
          </div>

          {/* Data Table */}
          <Table
            rowKey="id"
            dataSource={filteredMaterials}
            columns={columns}
            loading={apiLoading}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys as string[]),
            }}
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
              size: 'small',
            }}
            scroll={{ x: 1100, y: 'calc(100vh - 320px)' }}
            size="small"
            bordered={false}
            className="material-table"
            rowClassName={(record) => (record.status as any) === 'disabled' ? 'row-disabled' : ''}
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        title={
          <span>
            <span style={{
              display: 'inline-block', width: 4, height: 16,
              background: '#E60012', borderRadius: 2,
              marginRight: 8, verticalAlign: 'middle'
            }} />
            {editingMaterial ? '编辑物料' : '新增物料'}
          </span>
        }
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={680}
        okButtonProps={{ style: { background: '#1677FF' } }}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          size="middle"
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="物料编码" rules={[{ required: true, message: '请输入物料编码' }]}>
                <Input placeholder="请输入物料编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="物料名称" rules={[{ required: true, message: '请输入物料名称' }]}>
                <Input placeholder="请输入物料名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="categoryId" label="物料分类" rules={[{ required: true, message: '请选择物料分类' }]}>
                <Select placeholder="请选择物料分类" options={categoryOptions} showSearch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="物料类型" rules={[{ required: true, message: '请选择物料类型' }]}>
                <Select
                  placeholder="请选择物料类型"
                  onChange={(v: string) => setFormType(v)}
                  options={[
                    { value: '原材料',   label: '原材料'   },
                    { value: '半成品',   label: '半成品'   },
                    { value: '成品',     label: '成品'     },
                    { value: '辅料',     label: '辅料'     },
                    { value: '包装材料', label: '包装材料' },
                    { value: '模具工装', label: '模具工装' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unit" label="基本单位" rules={[{ required: true, message: '请选择基本单位' }]}>
                <Select placeholder="请选择单位" showSearch>
                  {unitOptions.map(u => (
                    <Select.Option key={u.value} value={u.label}>{u.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="spec" label="规格型号">
                <Input placeholder="请输入规格型号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand" label="品牌">
                <Input placeholder="请输入品牌" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="supplier" label="供应商">
                <Input placeholder="请输入供应商" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="minStock" label="最小库存">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxStock" label="最大库存">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="price" label="参考价格">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="备注">
                <Input.TextArea rows={2} placeholder="请输入备注信息" />
              </Form.Item>
            </Col>
            {/* DI / UDI 配置（仅成品） */}
            {formType === '成品' && (
              <>
                <Col span={24}>
                  <Divider orientationMargin={0} style={{ margin: '8px 0', fontSize: 13, color: '#666' }}>
                    <QrcodeOutlined style={{ marginRight: 6 }} />UDI / DI 配置（成品专属）
                  </Divider>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="gtin"
                    label="GTIN（14位）"
                    rules={[
                      { pattern: /^\d{14}$/, message: 'GTIN必须是14位数字' },
                    ]}
                    tooltip="全球贸易项目代码，由GS1组织颁发的14位数字编码，用作DI（器械标识）"
                  >
                    <Input
                      placeholder="请输入14位GTIN编码"
                      maxLength={14}
                      style={{ fontFamily: 'monospace' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="diCode" label="DI编码" tooltip="器械标识符，默认等于GTIN，可自定义">
                    <Input placeholder="默认与GTIN相同" style={{ fontFamily: 'monospace' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="diIssuer" label="签发机构" initialValue="GS1">
                    <Select>
                      <Select.Option value="GS1">GS1</Select.Option>
                      <Select.Option value="HIBC">HIBC</Select.Option>
                      <Select.Option value="ICCBBA">ICCBBA</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MaterialPage;
