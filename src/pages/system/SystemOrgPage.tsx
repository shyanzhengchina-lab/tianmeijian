/**
 * SystemOrgPage.tsx — 组织机构管理
 * 基于《MES多工厂权限设计.docx》实现：
 *   集团 → 工厂 → 车间 → 产线 → 班组  四级树形结构
 */
import React, { useState, useMemo } from 'react';
import {
  Card, Button, Table, Tag, Space, Modal, Form, Input, Select,
  Popconfirm, message, Tree, Tabs, Tooltip, Badge, Divider,
  Row, Col, Statistic,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  BankOutlined, ApartmentOutlined, TeamOutlined,
  CheckCircleOutlined, StopOutlined, ReloadOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import {
  FACTORIES, FactoryConfig, OrgNode, OrgLevel,
  loadOrgNodes, saveOrgNodes,
  ORG_LEVEL_LABEL, ORG_LEVEL_COLOR,
} from '../../store/rbacData';
import type { DataNode } from 'antd/es/tree';

// ── 工具：OrgNode 转 Tree 节点 ───────────────────────────────────
function buildTree(nodes: OrgNode[], parentId: string | null, factoryId: string): DataNode[] {
  return nodes
    .filter(n => n.factoryId === factoryId && n.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(n => ({
      key:      n.id,
      title: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag
            color={ORG_LEVEL_COLOR[n.level]}
            style={{ margin: 0, fontSize: 10, padding: '0 5px' }}
          >
            {ORG_LEVEL_LABEL[n.level]}
          </Tag>
          <span>{n.name}</span>
          <span style={{ color: '#aaa', fontSize: 11 }}>({n.code})</span>
          {n.status === 'DISABLED' && <Tag color="default" style={{ fontSize: 10 }}>停用</Tag>}
        </span>
      ),
      children: buildTree(nodes, n.id, factoryId),
      _node: n,
    }));
}

// ── 工厂卡片 ─────────────────────────────────────────────────────
const FactoryCard: React.FC<{
  factory: FactoryConfig;
  orgNodes: OrgNode[];
  selected: boolean;
  onClick: () => void;
}> = ({ factory, orgNodes, selected, onClick }) => {
  const workshopCount = orgNodes.filter(n => n.factoryId === factory.id && n.level === 'WORKSHOP').length;
  const lineCount     = orgNodes.filter(n => n.factoryId === factory.id && n.level === 'LINE').length;
  const teamCount     = orgNodes.filter(n => n.factoryId === factory.id && n.level === 'TEAM').length;

  return (
    <Card
      size="small"
      onClick={onClick}
      style={{
        marginBottom: 10, cursor: 'pointer',
        border: `2px solid ${selected ? '#1677ff' : '#f0f0f0'}`,
        background: selected ? '#e6f4ff' : '#fff',
        borderRadius: 10,
        transition: 'all 0.2s',
      }}
      bodyStyle={{ padding: '12px 14px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <BankOutlined style={{ fontSize: 22, color: selected ? '#1677ff' : '#999', marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: selected ? '#1677ff' : '#333' }}>
            {factory.name}
            {factory.nameEn && (
              <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>{factory.nameEn}</span>
            )}
          </div>
          <div style={{ marginTop: 4, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            <Tag style={{ fontSize: 10 }}>{factory.country}</Tag>
            <Tag color="blue" style={{ fontSize: 10 }}>{factory.timezone}</Tag>
            <Tag color="green" style={{ fontSize: 10 }}>{factory.currency}</Tag>
          </div>
          <div style={{ marginTop: 6, display: 'flex', gap: 14, fontSize: 11, color: '#666' }}>
            <span>车间 <b>{workshopCount}</b></span>
            <span>产线 <b>{lineCount}</b></span>
            <span>班组 <b>{teamCount}</b></span>
          </div>
        </div>
        <Badge
          status={factory.status === 'ACTIVE' ? 'success' : 'default'}
          text={factory.status === 'ACTIVE' ? '运行' : '停用'}
        />
      </div>
    </Card>
  );
};

// ── 主组件 ────────────────────────────────────────────────────────
const SystemOrgPage: React.FC = () => {
  const [orgNodes, setOrgNodes]           = useState<OrgNode[]>(loadOrgNodes);
  const [selectedFactoryId, setSelectedFactoryId] = useState<string>(FACTORIES[0].id);
  const [modalOpen, setModalOpen]         = useState(false);
  const [editNode, setEditNode]           = useState<OrgNode | null>(null);
  const [form]                            = Form.useForm();

  const selectedFactory = FACTORIES.find(f => f.id === selectedFactoryId)!;
  const factoryNodes    = useMemo(
    () => orgNodes.filter(n => n.factoryId === selectedFactoryId),
    [orgNodes, selectedFactoryId],
  );

  const treeData = useMemo(
    () => buildTree(orgNodes, null, selectedFactoryId),
    [orgNodes, selectedFactoryId],
  );

  // ── 打开新建对话框 ──────────────────────────────────────────────
  const handleAdd = (parentId: string | null = null) => {
    setEditNode(null);
    form.resetFields();
    // 推断层级
    let defaultLevel: OrgLevel = 'WORKSHOP';
    if (parentId) {
      const parent = orgNodes.find(n => n.id === parentId);
      if (parent?.level === 'WORKSHOP') defaultLevel = 'LINE';
      if (parent?.level === 'LINE')     defaultLevel = 'TEAM';
    }
    form.setFieldsValue({
      factoryId: selectedFactoryId,
      parentId,
      level: defaultLevel,
      status: 'ACTIVE',
      sortOrder: factoryNodes.length + 1,
    });
    setModalOpen(true);
  };

  // ── 打开编辑对话框 ──────────────────────────────────────────────
  const handleEdit = (node: OrgNode) => {
    setEditNode(node);
    form.setFieldsValue({ ...node });
    setModalOpen(true);
  };

  // ── 删除节点 ────────────────────────────────────────────────────
  const handleDelete = (node: OrgNode) => {
    // 检查有无子节点
    const hasChildren = orgNodes.some(n => n.parentId === node.id);
    if (hasChildren) {
      message.warning('请先删除子节点后再删除此节点');
      return;
    }
    const updated = orgNodes.filter(n => n.id !== node.id);
    setOrgNodes(updated);
    saveOrgNodes(updated);
    message.success('删除成功');
  };

  // ── 保存节点 ────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      let updated: OrgNode[];
      if (editNode) {
        updated = orgNodes.map(n => n.id === editNode.id ? { ...n, ...values } : n);
        message.success('修改成功');
      } else {
        const newNode: OrgNode = {
          id:        `ORG_${Date.now()}`,
          code:      values.code,
          name:      values.name,
          parentId:  values.parentId ?? null,
          factoryId: values.factoryId,
          level:     values.level,
          sortOrder: values.sortOrder ?? 99,
          status:    values.status ?? 'ACTIVE',
        };
        updated = [...orgNodes, newNode];
        message.success('新建成功');
      }
      setOrgNodes(updated);
      saveOrgNodes(updated);
      setModalOpen(false);
    } catch { /* validation error */ }
  };

  // ── 列表列定义 ─────────────────────────────────────────────────
  const columns = [
    { title: '编码', dataIndex: 'code', width: 120 },
    { title: '名称', dataIndex: 'name', width: 140 },
    {
      title: '层级', dataIndex: 'level', width: 80,
      render: (v: OrgLevel) => (
        <Tag color={ORG_LEVEL_COLOR[v]} style={{ margin: 0 }}>{ORG_LEVEL_LABEL[v]}</Tag>
      ),
    },
    {
      title: '上级节点', dataIndex: 'parentId', width: 120,
      render: (pid: string | null) => {
        if (!pid) return <span style={{ color: '#aaa' }}>—（根节点）</span>;
        const parent = orgNodes.find(n => n.id === pid);
        return parent?.name ?? pid;
      },
    },
    { title: '排序', dataIndex: 'sortOrder', width: 60 },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: string) => (
        v === 'ACTIVE'
          ? <Badge status="success" text="启用" />
          : <Badge status="default" text="停用" />
      ),
    },
    {
      title: '操作', width: 120,
      render: (_: any, record: OrgNode) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确定删除此节点？"
            onConfirm={() => handleDelete(record)}
            okText="确定" cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── 父级节点选项（下拉） ───────────────────────────────────────
  const parentOptions = factoryNodes.map(n => ({
    value: n.id,
    label: `${ORG_LEVEL_LABEL[n.level]} / ${n.name}`,
  }));

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* 统计行 */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="工厂总数" value={FACTORIES.filter(f => f.status === 'ACTIVE').length}
              prefix={<BankOutlined />} suffix="个" valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="车间总数" value={orgNodes.filter(n => n.level === 'WORKSHOP').length}
              prefix={<ApartmentOutlined />} suffix="个" valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="产线总数" value={orgNodes.filter(n => n.level === 'LINE').length}
              prefix={<ApartmentOutlined />} suffix="条" valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="班组总数" value={orgNodes.filter(n => n.level === 'TEAM').length}
              prefix={<TeamOutlined />} suffix="个" valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 主内容：左侧工厂列表 + 右侧组织结构 */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* 左侧：工厂列表 */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <Card
            size="small"
            title={<><GlobalOutlined style={{ marginRight: 6 }} />工厂列表</>}
            bodyStyle={{ padding: '10px 12px' }}
            style={{ borderRadius: 10 }}
          >
            {FACTORIES.map(f => (
              <FactoryCard
                key={f.id}
                factory={f}
                orgNodes={orgNodes}
                selected={f.id === selectedFactoryId}
                onClick={() => setSelectedFactoryId(f.id)}
              />
            ))}
          </Card>
        </div>

        {/* 右侧：组织结构（树 + 列表切换） */}
        <div style={{ flex: 1 }}>
          <Card
            size="small"
            title={
              <span>
                <ApartmentOutlined style={{ marginRight: 6 }} />
                {selectedFactory.name} · 组织结构
              </span>
            }
            extra={
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => handleAdd(null)}
              >
                新建节点
              </Button>
            }
            style={{ borderRadius: 10 }}
          >
            <Tabs
              size="small"
              items={[
                {
                  key: 'tree',
                  label: '树形视图',
                  children: (
                    <div style={{ padding: '8px 0' }}>
                      {treeData.length > 0 ? (
                        <Tree
                          treeData={treeData}
                          defaultExpandAll
                          blockNode
                          showLine={{ showLeafIcon: false }}
                          titleRender={(node: any) => (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '2px 0' }}>
                              <span>{node.title}</span>
                              <Space size={4} style={{ marginLeft: 16 }}>
                                <Button
                                  size="small" type="link" style={{ padding: 0, height: 20, fontSize: 11 }}
                                  icon={<PlusOutlined />}
                                  onClick={e => { e.stopPropagation(); handleAdd(node._node?.id); }}
                                />
                                <Button
                                  size="small" type="link" style={{ padding: 0, height: 20, fontSize: 11 }}
                                  icon={<EditOutlined />}
                                  onClick={e => { e.stopPropagation(); handleEdit(node._node); }}
                                />
                                <Popconfirm
                                  title="确定删除此节点？"
                                  onConfirm={() => handleDelete(node._node)}
                                  okText="是" cancelText="否"
                                >
                                  <Button
                                    size="small" type="link" danger
                                    style={{ padding: 0, height: 20, fontSize: 11 }}
                                    icon={<DeleteOutlined />}
                                    onClick={e => e.stopPropagation()}
                                  />
                                </Popconfirm>
                              </Space>
                            </div>
                          )}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>
                          暂无组织节点，点击「新建节点」开始配置
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'table',
                  label: '列表视图',
                  children: (
                    <Table
                      dataSource={factoryNodes}
                      columns={columns}
                      rowKey="id"
                      size="small"
                      pagination={{ pageSize: 10, showSizeChanger: false }}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </div>

      {/* 新建/编辑对话框 */}
      <Modal
        open={modalOpen}
        title={editNode ? `编辑节点：${editNode.name}` : '新建组织节点'}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={480}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="factoryId" label="所属工厂">
            <Select disabled options={FACTORIES.map(f => ({ value: f.id, label: f.name }))} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="code" label="节点编码"
                rules={[{ required: true, message: '请输入编码' }]}
              >
                <Input placeholder="如 NJ-WS01" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name" label="节点名称"
                rules={[{ required: true, message: '请输入名称' }]}
              >
                <Input placeholder="如 冲裁车间" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="level" label="层级" rules={[{ required: true }]}>
                <Select
                  options={(['WORKSHOP', 'LINE', 'TEAM'] as OrgLevel[]).map(l => ({
                    value: l, label: ORG_LEVEL_LABEL[l],
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select options={[
                  { value: 'ACTIVE', label: '启用' },
                  { value: 'DISABLED', label: '停用' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="parentId" label="上级节点（留空=挂工厂根节点）">
            <Select
              allowClear
              placeholder="选择上级节点"
              options={parentOptions}
            />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序（数字越小越靠前）">
            <Input type="number" min={1} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SystemOrgPage;
