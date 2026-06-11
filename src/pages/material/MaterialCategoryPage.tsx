/**
 * 物料分类管理页面
 * 功能：树形展示 + 表格 + 新增 / 修改 / 删除分类
 * 参考截图：YonSuite 物料分类风格
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import {
  Tree, Table, Button, Input, Popconfirm, Modal, Form,
  message, Tooltip, Space, Tag, Row, Col,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  FolderOutlined, FolderOpenOutlined, FileOutlined,
  SearchOutlined, ReloadOutlined, ExclamationCircleOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { MaterialCategory } from '../../modules/basic-data/material/types';
import {
  MaterialCategoryRecord,
  getMaterialCategoryList, createMaterialCategory,
  updateMaterialCategory, deleteMaterialCategory,
} from '../../api/materialCategories';
import { mockCategories } from '../../store/mockData';
import './MaterialCategoryPage.css';

// ── 工具函数 ─────────────────────────────────────────────────────────────
const genId = () => `cat_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

/** 将 API flat record 转换为前端 MaterialCategory（id=string） */
function mapApiToCategory(r: MaterialCategoryRecord): MaterialCategory {
  return {
    id:       String(r.id ?? ''),
    code:     r.code     ?? '',
    name:     r.name     ?? '',
    parentId: r.parentId != null ? String(r.parentId) : undefined,
    level:    0,   // computed below
    sort:     r.sortNo  ?? 0,
    status:   r.status === 1 ? 'ACTIVE' as any : 'INACTIVE' as any,
  };
}

/** 将 flat 数组组装成嵌套树 */
function buildCategoryTree(flat: MaterialCategory[]): MaterialCategory[] {
  const map = new Map<string, MaterialCategory>();
  flat.forEach(c => map.set(c.id, { ...c, children: [] }));
  const roots: MaterialCategory[] = [];
  map.forEach(node => {
    if (!node.parentId || node.parentId === '0' || !map.has(node.parentId)) {
      node.level = 1;
      roots.push(node);
    } else {
      const parent = map.get(node.parentId)!;
      node.level = (parent.level ?? 0) + 1;
      parent.children = parent.children || [];
      parent.children.push(node);
    }
  });
  // Clean up empty children arrays
  map.forEach(node => { if (node.children && node.children.length === 0) delete node.children; });
  return roots;
}

/** 深拷贝分类树，将其扁平化为数组 */
const flattenCats = (cats: MaterialCategory[]): MaterialCategory[] => {
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

/** 计算每个分类下关联物料数量（与mockMaterials对应） */
const MATERIAL_COUNT: Record<string, number> = {
  // 汇总
  '1':  35,  // 全部
  // 原材料
  '2':  12,  // 01 原材料合计
  '21':  4,  // 镍钛丝材：M001~M004
  '22':  1,  // 不锈钢材料：M010
  '23':  4,  // 高分子材料：M020~M023
  '24':  2,  // 辅助化学品：M030~M031
  // 半成品
  '3':   8,  // 02 半成品合计
  '31':  3,  // 机加工件：M101~M103
  '32':  1,  // 热处理件：M111
  '33':  1,  // 涂层件：M121
  '34':  3,  // 注塑件：M131~M133
  // 成品
  '4':   4,  // 03 成品合计
  '41':  4,  // 机用根管锉：M201~M204
  '42':  0,  // 手用根管锉：暂无
  '43':  0,  // 热牙胶充填针：暂无
  // 包装材料
  '5':   7,  // 04 包装材料合计
  '51':  3,  // 内包装：M301, M302, M307
  '52':  2,  // 外包装：M303, M304
  '53':  2,  // 标签标识：M305, M306
  // 辅料耗材
  '6':   5,  // 05 辅料耗材合计
  '61':  3,  // 清洗耗材：M401~M403
  '62':  1,  // 检验耗材：M405
  '63':  1,  // 润滑防锈：M404
  // 模具工装
  '7':   3,  // 06 模具工装合计
  '71':  2,  // 螺纹滚压模：M501, M502
  '72':  1,  // 注塑模具：M503
  '73':  0,  // 夹具工装：暂无
};

/** 将 MaterialCategory 树转换为 Ant Tree 节点 */
type DataNode = {
  key: string; title: React.ReactNode;
  children?: DataNode[]; isLeaf?: boolean;
  rawName: string;
};

const toTreeNodes = (cats: MaterialCategory[]): DataNode[] =>
  cats.map(c => ({
    key: c.id,
    rawName: c.name,
    title: (
      <span className="mc-tree-label">
        {c.children && c.children.length > 0
          ? <FolderOutlined style={{ color: '#FAAD14', marginRight: 5 }} />
          : <FileOutlined style={{ color: '#8C8C8C', marginRight: 5 }} />}
        <span className="mc-tree-name">{c.name}</span>
        <span className="mc-tree-code">{c.code}</span>
        {MATERIAL_COUNT[c.id] !== undefined && (
          <span className="mc-tree-cnt">{MATERIAL_COUNT[c.id]}</span>
        )}
      </span>
    ),
    children: c.children ? toTreeNodes(c.children) : undefined,
    isLeaf: !c.children || c.children.length === 0,
  }));

/** 在树中插入/更新/删除节点 */
const insertNode = (
  tree: MaterialCategory[],
  parentId: string,
  newNode: MaterialCategory,
): MaterialCategory[] => {
  return tree.map(c => {
    if (c.id === parentId) {
      return { ...c, children: [...(c.children || []), newNode] };
    }
    if (c.children) {
      return { ...c, children: insertNode(c.children, parentId, newNode) };
    }
    return c;
  });
};

const updateNode = (
  tree: MaterialCategory[],
  updated: MaterialCategory,
): MaterialCategory[] => {
  return tree.map(c => {
    if (c.id === updated.id) return { ...c, ...updated };
    if (c.children) return { ...c, children: updateNode(c.children, updated) };
    return c;
  });
};

const deleteNode = (tree: MaterialCategory[], id: string): MaterialCategory[] => {
  return tree
    .filter(c => c.id !== id)
    .map(c => c.children ? { ...c, children: deleteNode(c.children, id) } : c);
};

// ── 主页面组件 ────────────────────────────────────────────────────────────
const MaterialCategoryPage: React.FC = () => {
  const [cats, setCats] = useLocalStorage<MaterialCategory[]>('bip_material_categories', JSON.parse(JSON.stringify(mockCategories)));
  const [selectedId, setSelectedId] = useState<string>('1');
  const [treeSearch, setTreeSearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [apiLoading, setApiLoading] = useState(false);

  // 弹窗状态
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<MaterialCategory | null>(null);
  const [modalParentId, setModalParentId] = useState<string>('1');
  const [form] = Form.useForm();

  // ── API 加载 ────────────────────────────────────────────────────────────
  const loadFromApi = useCallback(async () => {
    setApiLoading(true);
    try {
      const resp = await getMaterialCategoryList() as any;
      const records: MaterialCategoryRecord[] = resp?.data ?? resp ?? [];
      if (Array.isArray(records) && records.length > 0) {
        const flat = records.map(mapApiToCategory);
        const tree = buildCategoryTree(flat);
        if (tree.length > 0) setCats(tree);
      }
    } catch { /* graceful fallback to localStorage */ } finally { setApiLoading(false); }
  }, [setCats]);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  // ── 树数据 ──────────────────────────────────────────────────────────────
  const treeData = useMemo(() => toTreeNodes(cats), [cats]);
  const allFlat  = useMemo(() => flattenCats(cats), [cats]);

  // ── 表格数据：选中节点的直接子节点（无子则显示自身一条） ──────────────
  const tableRows = useMemo(() => {
    const sel = allFlat.find(c => c.id === selectedId);
    if (!sel) return [];
    const base = sel.children && sel.children.length > 0
      ? sel.children
      : [sel];
    if (!tableSearch) return base;
    return base.filter(c =>
      c.name.includes(tableSearch) || c.code.includes(tableSearch)
    );
  }, [allFlat, selectedId, tableSearch]);

  // ── 统计当前选中节点的子树 ─────────────────────────────────────────────
  const summary = useMemo(() => {
    const total = tableRows.length;
    const withChildren = tableRows.filter(c => c.children && c.children.length > 0).length;
    return { total, withChildren, leaf: total - withChildren };
  }, [tableRows]);

  // ── 操作函数 ────────────────────────────────────────────────────────────
  const openAdd = (parentId: string) => {
    setEditingCat(null);
    setModalParentId(parentId);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (cat: MaterialCategory) => {
    setEditingCat(cat);
    form.setFieldsValue({ name: cat.name, code: cat.code, description: (cat as any).description || '' });
    setModalOpen(true);
  };

  const handleDelete = async (cat: MaterialCategory) => {
    if (cat.children && cat.children.length > 0) {
      message.warning('请先删除子分类后再删除此分类');
      return;
    }
    if (cat.id === '1') { message.error('根节点不可删除'); return; }
    const numId = parseInt(cat.id, 10);
    if (!isNaN(numId) && numId > 0) {
      try { await deleteMaterialCategory(numId); } catch { /* ignore, still update local */ }
    }
    setCats(prev => deleteNode(prev, cat.id));
    message.success(`分类「${cat.name}」已删除`);
    if (selectedId === cat.id) setSelectedId(cat.parentId || '1');
    // Reload from API to stay in sync
    loadFromApi();
  };

  const handleModalOk = () => {
    form.validateFields().then(async vals => {
      if (editingCat) {
        // 编辑
        const numId = parseInt(editingCat.id, 10);
        if (!isNaN(numId) && numId > 0) {
          try {
            await updateMaterialCategory(numId, { name: vals.name, code: vals.code });
          } catch { /* graceful */ }
        }
        const updated: MaterialCategory = { ...editingCat, name: vals.name, code: vals.code };
        setCats(prev => updateNode(prev, updated));
        message.success(`分类「${vals.name}」已修改`);
      } else {
        // 新增
        const parentCat = allFlat.find(c => c.id === modalParentId);
        const numParentId = parseInt(modalParentId, 10);
        let savedId: string | null = null;
        try {
          const resp = await createMaterialCategory({
            name: vals.name,
            code: vals.code,
            parentId: !isNaN(numParentId) ? numParentId : 0,
            sortNo: 0,
            status: 1,
          }) as any;
          if (resp?.data?.id) savedId = String(resp.data.id);
        } catch { /* graceful, use temp id */ }
        const newCat: MaterialCategory = {
          id: savedId ?? genId(),
          name: vals.name,
          code: vals.code,
          parentId: modalParentId,
          level: (parentCat as any)?.level ?? 0 + 1,
          sort: 0,
          status: 'ACTIVE' as any,
        };
        setCats(prev => insertNode(prev, modalParentId, newCat));
        message.success(`分类「${vals.name}」已新增到「${parentCat?.name || '根'}」下`);
        // Reload from API to get server-assigned id
        loadFromApi();
      }
      setModalOpen(false);
      form.resetFields();
    }).catch((err: any) => { if (err?.errorFields) return; });
  };

  // ── 表格列 ──────────────────────────────────────────────────────────────
  const columns = [
    {
      title: '序号',
      width: 55,
      render: (_: any, __: any, i: number) => (
        <span style={{ color: '#aaa', fontSize: 12 }}>{i + 1}</span>
      ),
    },
    {
      title: '编码',
      dataIndex: 'code',
      width: 120,
      render: (v: string) => <span className="mc-code-cell">{v}</span>,
    },
    {
      title: '物料分类',
      dataIndex: 'name',
      width: 200,
      render: (v: string, r: MaterialCategory) => (
        <span className="mc-name-cell">
          {r.children && r.children.length > 0
            ? <FolderOpenOutlined style={{ color: '#FAAD14', marginRight: 6 }} />
            : <FileOutlined style={{ color: '#8C8C8C', marginRight: 6 }} />}
          {v}
        </span>
      ),
    },
    {
      title: '商品数量',
      width: 100,
      render: (_: any, r: MaterialCategory) => (
        <span style={{ color: '#1677FF', fontWeight: 600 }}>
          {MATERIAL_COUNT[r.id] ?? 0}
        </span>
      ),
    },
    {
      title: '末级分类',
      width: 90,
      render: (_: any, r: MaterialCategory) => (
        <Tag color={(!r.children || r.children.length === 0) ? 'blue' : 'default'}
          style={{ borderRadius: 3, fontSize: 12 }}>
          {(!r.children || r.children.length === 0) ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '物料模板',
      width: 100,
      render: () => <span style={{ color: '#bbb', fontSize: 12 }}>—</span>,
    },
    {
      title: '启用项目',
      width: 90,
      render: () => <Tag color="success" style={{ fontSize: 12, borderRadius: 3 }}>已启用</Tag>,
    },
    {
      title: '启用状态',
      width: 90,
      render: () => <Tag color="success" style={{ fontSize: 12, borderRadius: 3 }}>已启用</Tag>,
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, r: MaterialCategory) => (
        <Space size={4}>
          <Button
            type="link" size="small" icon={<PlusOutlined />}
            style={{ fontSize: 13, padding: '0 4px', color: '#1677FF' }}
            onClick={e => { e.stopPropagation(); openAdd(r.id); }}
          >
            新增子类
          </Button>
          <Button
            type="link" size="small" icon={<EditOutlined />}
            style={{ fontSize: 13, padding: '0 4px' }}
            onClick={e => { e.stopPropagation(); openEdit(r); }}
            disabled={r.id === '1'}
          >
            编辑
          </Button>
          <Popconfirm
            title={`确认删除分类「${r.name}」？`}
            description={r.children && r.children.length > 0 ? '⚠️ 该分类含子分类，请先删除子分类' : '删除后不可恢复'}
            onConfirm={() => handleDelete(r)}
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            icon={<ExclamationCircleOutlined style={{ color: '#E60012' }} />}
          >
            <Button
              type="link" danger size="small" icon={<DeleteOutlined />}
              style={{ fontSize: 13, padding: '0 4px' }}
              disabled={r.id === '1'}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="mc-page">
      {/* ── 页头 ── */}
      <div className="mc-page-header">
        <ApartmentOutlined className="mc-page-icon" />
        <span className="mc-page-title">物料分类</span>
        <span className="mc-page-sub">管理产品和物料的分类体系</span>
      </div>

      <div className="mc-layout">
        {/* ── 左侧分类树 ── */}
        <div className="mc-tree-panel">
          <div className="mc-tree-header">
            <span className="mc-tree-title">
              <FolderOutlined style={{ marginRight: 5, color: '#FAAD14' }} />
              分类目录
            </span>
            <Tooltip title="新增根级分类">
              <Button
                type="text" size="small" icon={<PlusOutlined />}
                style={{ color: '#1677FF' }}
                onClick={() => openAdd('1')}
              />
            </Tooltip>
          </div>

          <div className="mc-tree-search">
            <Input
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              placeholder="搜索分类..."
              size="small"
              value={treeSearch}
              onChange={e => setTreeSearch(e.target.value)}
              allowClear
            />
          </div>

          <div className="mc-tree-container">
            <Tree
              treeData={treeData}
              defaultExpandAll
              selectedKeys={[selectedId]}
              blockNode
              className="mc-tree"
              onSelect={keys => {
                if (keys.length > 0) setSelectedId(keys[0] as string);
              }}
            />
          </div>
        </div>

        {/* ── 右侧表格区 ── */}
        <div className="mc-table-panel">
          {/* 搜索栏 */}
          <div className="mc-search-bar">
            <Row gutter={[8, 0]} align="middle">
              <Col>
                <span className="mc-search-label">分类名称/编码</span>
                <Input
                  placeholder="分类名称/编码"
                  value={tableSearch}
                  onChange={e => setTableSearch(e.target.value)}
                  style={{ width: 200 }}
                  allowClear
                  size="small"
                />
              </Col>
              <Col>
                <Button type="primary" size="small" icon={<SearchOutlined />}
                  onClick={() => message.success('查询完成')}>查询</Button>
              </Col>
              <Col>
                <Button size="small" icon={<ReloadOutlined />}
                  loading={apiLoading}
                  onClick={() => { setTableSearch(''); loadFromApi().then(() => message.success('已重置并重新加载')); }}>重置</Button>
              </Col>
            </Row>
          </div>

          {/* 工具栏 */}
          <div className="mc-toolbar">
            <div className="mc-toolbar-left">
              <Button
                type="primary" icon={<PlusOutlined />}
                className="mc-btn-add"
                onClick={() => openAdd(selectedId)}
              >
                新增
              </Button>
              <Button
                icon={<PlusOutlined />}
                style={{ color: '#1677FF', borderColor: '#1677FF' }}
                onClick={() => openAdd('1')}
              >
                新增根级
              </Button>
            </div>
            <div className="mc-toolbar-right">
              <span className="mc-record-count">
                共 <strong>{summary.total}</strong> 个分类
                （含子类 <b style={{ color: '#faad14' }}>{summary.withChildren}</b>，
                末级 <b style={{ color: '#52c41a' }}>{summary.leaf}</b>）
              </span>
            </div>
          </div>

          {/* 表格 */}
          <Table
            rowKey="id"
            dataSource={tableRows}
            columns={columns}
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showTotal: total => `共 ${total} 条`,
              size: 'small',
            }}
            size="small"
            className="mc-table"
            scroll={{ x: 900, y: 'calc(100vh - 330px)' }}
            onRow={r => ({
              onClick: () => setSelectedId(r.id),
              style: { cursor: 'pointer' },
            })}
            rowClassName={r => selectedId === r.id ? 'mc-row-selected' : ''}
          />
        </div>
      </div>

      {/* ── 新增 / 编辑弹窗 ── */}
      <Modal
        open={modalOpen}
        title={
          <span>
            <span style={{
              display: 'inline-block', width: 4, height: 16,
              background: '#1677FF', borderRadius: 2,
              marginRight: 8, verticalAlign: 'middle',
            }} />
            {editingCat ? '编辑物料分类' : '新增物料分类'}
          </span>
        }
        onOk={handleModalOk}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        okText={editingCat ? '保存修改' : '确认新增'}
        cancelText="取消"
        width={480}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {!editingCat && (
            <Form.Item label="上级分类">
              <Input
                value={allFlat.find(c => c.id === modalParentId)?.name || '根分类'}
                disabled
                style={{ background: '#f9f9f9' }}
              />
            </Form.Item>
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="分类名称"
                rules={[{ required: true, message: '请输入分类名称' }]}
              >
                <Input placeholder="如 原材料、半成品、成品..." maxLength={30} showCount />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="分类编码"
                rules={[
                  { required: true, message: '请输入分类编码' },
                  { pattern: /^[A-Za-z0-9\-_]+$/, message: '编码仅支持字母、数字、-、_' },
                ]}
              >
                <Input placeholder="如 01、0101、MAT-A..." maxLength={20} showCount />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="备注说明">
            <Input.TextArea rows={2} placeholder="可选，填写分类用途说明..." />
          </Form.Item>
        </Form>

        {/* 操作说明 */}
        {!editingCat && (
          <div style={{
            background: '#f0f7ff', border: '1px solid #bae0ff',
            borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#555',
          }}>
            💡 新增的分类将挂载在「
            <b style={{ color: '#1677FF' }}>
              {allFlat.find(c => c.id === modalParentId)?.name || '根分类'}
            </b>
            」下，创建后可在列表中继续新增子分类。
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MaterialCategoryPage;
