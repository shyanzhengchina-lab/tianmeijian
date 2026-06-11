/**
 * 组织架构列表组件
 */

import React, { useEffect, useState } from 'react';
import { Button, Space, Tree, Drawer, Descriptions, Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, DeleteOutlined, EditOutlined, EyeOutlined, CheckOutlined, StopOutlined, SwapOutlined } from '@ant-design/icons';
import { useOrganizationStore } from '../store/organizationStore';
import { ORG_NODE_STATUS_MAP, ORG_NODE_TYPE_MAP, ORG_NODE_COLUMNS } from '../types';
import { StatusBadge } from '../../../../shared/components/StatusBadge';
import { DataTable } from '../../../../shared/components/DataTable';

interface OrganizationListProps {}

export const OrganizationList: React.FC<OrganizationListProps> = () => {
  const {
    orgNodes,
    total,
    loading,
    error,
    query,
    selectedIds,
    currentNode,
    treeData,
    expandedKeys,
    showDetailDrawer,
    showCreateModal,
    showEditModal,

    setQuery,
    setSelectedIds,
    setCurrentNode,
    setExpandedKeys,
    setShowDetailDrawer,
    setShowCreateModal: toggleCreateModal,
    setShowEditModal: toggleEditModal,

    loadOrgNodes,
    refreshOrgNodes,
    createOrgNode,
    updateOrgNode,
    deleteOrgNodes,
    updateStatus,
    loadTree,
    clearSelection,
  } = useOrganizationStore();

  const [searchForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    loadOrgNodes();
    loadTree();
  }, [query]);

  /**
   * 树形数据转换
   */
  const convertTreeData = (data: any[]): any[] => {
    return data.map(item => ({
      key: item.id,
      title: `${item.nodeCode} - ${item.nodeName}`,
      children: item.children ? convertTreeData(item.children) : undefined,
    }));
  };

  /**
   * 搜索处理
   */
  const handleSearch = (values: any) => {
    setQuery(values);
  };

  /**
   * 重置搜索
   */
  const handleReset = () => {
    searchForm.resetFields();
    setQuery({
      current: 1,
      pageSize: 15,
    });
  };

  /**
   * 刷新列表
   */
  const handleRefresh = () => {
    refreshOrgNodes();
    loadTree();
  };

  /**
   * 分页变化
   */
  const handlePageChange = (page: number, pageSize: number) => {
    setQuery({ current: page, pageSize });
  };

  /**
   * 行选择变化
   */
  const handleRowSelectionChange = (selectedRowKeys: React.Key[]) => {
    setSelectedIds(selectedRowKeys as string[]);
  };

  /**
   * 新增按钮
   */
  const handleAdd = () => {
    toggleCreateModal(true);
  };

  /**
   * 创建确认
   */
  const handleCreateConfirm = async () => {
    try {
      const values = await createForm.validateFields();
      await createOrgNode(values);
      createForm.resetFields();
    } catch (error) {
      console.error('创建失败:', error);
    }
  };

  /**
   * 编辑按钮
   */
  const handleEdit = (record: any) => {
    setCurrentNode(record);
    editForm.setFieldsValue(record);
    toggleEditModal(true);
  };

  /**
   * 编辑确认
   */
  const handleEditConfirm = async () => {
    try {
      const values = await editForm.validateFields();
      await updateOrgNode({ id: currentNode?.id, ...values });
      editForm.resetFields();
    } catch (error) {
      console.error('编辑失败:', error);
    }
  };

  /**
   * 删除按钮
   */
  const handleDelete = async (record: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除组织节点 ${record.nodeName} 吗？`,
      onOk: async () => {
        await deleteOrgNodes([record.id]);
      },
    });
  };

  /**
   * 批量删除
   */
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      message.warning('请选择要删除的组织节点');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedIds.length} 个组织节点吗？`,
      onOk: async () => {
        await deleteOrgNodes(selectedIds);
      },
    });
  };

  /**
   * 查看详情
   */
  const handleViewDetail = (record: any) => {
    setCurrentNode(record);
    setShowDetailDrawer(true);
  };

  /**
   * 生效
   */
  const handleActivate = async (record: any) => {
    Modal.confirm({
      title: '确认生效',
      content: `确定要生效组织节点 ${record.nodeName} 吗？`,
      onOk: async () => {
        await updateStatus([record.id], 'ACTIVE');
      },
    });
  };

  /**
   * 停用
   */
  const handleDeactivate = async (record: any) => {
    Modal.confirm({
      title: '确认停用',
      content: `确定要停用组织节点 ${record.nodeName} 吗？`,
      onOk: async () => {
        await updateStatus([record.id], 'INACTIVE');
      },
    });
  };

  /**
   * 表格列定义
   */
  const columns = [
    {
      title: '节点编码',
      dataIndex: 'nodeCode',
      key: 'nodeCode',
      width: 150,
      align: 'center' as const,
      fixed: 'left' as const,
    },
    {
      title: '节点名称',
      dataIndex: 'nodeName',
      key: 'nodeName',
      width: 200,
      align: 'center' as const,
    },
    {
      title: '节点类型',
      dataIndex: 'nodeType',
      key: 'nodeType',
      width: 120,
      align: 'center' as const,
      render: (type: string) => {
        const typeMap: Record<string, { label: string; color: string }> = {
          COMPANY: { label: '公司', color: '#1890ff' },
          DEPARTMENT: { label: '部门', color: '#52c41a' },
          TEAM: { label: '班组', color: '#faad14' },
        };
        const config = typeMap[type] || { label: type, color: '#1890ff' };
        return <span style={{ color: config.color, fontWeight: 500 }}>{config.label}</span>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => (
        <StatusBadge
          status={status}
          statusMap={ORG_NODE_STATUS_MAP}
        />
      ),
    },
    {
      title: '父节点',
      dataIndex: 'parentName',
      key: 'parentName',
      width: 150,
      align: 'center' as const,
      render: (name: string) => name || '-',
    },
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '负责人',
      dataIndex: 'leaderName',
      key: 'leaderName',
      width: 120,
      align: 'center' as const,
      render: (name: string) => name || '-',
    },
    {
      title: '工厂',
      dataIndex: 'factoryName',
      key: 'factoryName',
      width: 150,
      align: 'center' as const,
    },
    {
      title: '车间',
      dataIndex: 'workshopName',
      key: 'workshopName',
      width: 150,
      align: 'center' as const,
      render: (name: string) => name || '-',
    },
    {
      title: '工作中心',
      dataIndex: 'workCenterName',
      key: 'workCenterName',
      width: 150,
      align: 'center' as const,
      render: (name: string) => name || '-',
    },
    {
      title: '员工数量',
      dataIndex: 'employeeCount',
      key: 'employeeCount',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '班组数量',
      dataIndex: 'teamCount',
      key: 'teamCount',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '部门数量',
      dataIndex: 'departmentCount',
      key: 'departmentCount',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      align: 'center' as const,
      render: (phone: string) => phone || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      align: 'center' as const,
      render: (email: string) => email || '-',
    },
    {
      title: '创建人',
      dataIndex: 'creatorName',
      key: 'creatorName',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      align: 'center' as const,
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'INACTIVE' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleActivate(record)}
              >
                生效
              </Button>
              <Button
                type="link"
                size="small"
                icon={<DeleteOutlined />}
                danger
                onClick={() => handleDelete(record)}
              >
                删除
              </Button>
            </>
          )}
          {record.status === 'ACTIVE' && (
            <Button
              type="link"
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleDeactivate(record)}
            >
              停用
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, display: 'flex', gap: 24 }}>
      {/* 左侧树形结构 */}
      <div style={{ width: 300, flexShrink: 0 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>组织架构树</span>
          <Button
            type="link"
            size="small"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
          >
            刷新
          </Button>
        </div>
        <Tree
          showLine
          expandedKeys={expandedKeys}
          onExpand={setExpandedKeys}
          treeData={convertTreeData(treeData)}
          height={600}
        />
      </div>

      {/* 右侧列表 */}
      <div style={{ flex: 1 }}>
        {/* 搜索表单 */}
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="nodeCode">
            <Input placeholder="节点编码" allowClear />
          </Form.Item>
          <Form.Item name="nodeName">
            <Input placeholder="节点名称" allowClear />
          </Form.Item>
          <Form.Item name="nodeType">
            <Select placeholder="节点类型" allowClear style={{ width: 120 }}>
              <Select.Option value="COMPANY">公司</Select.Option>
              <Select.Option value="DEPARTMENT">部门</Select.Option>
              <Select.Option value="TEAM">班组</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" allowClear style={{ width: 120 }}>
              <Select.Option value="ACTIVE">生效</Select.Option>
              <Select.Option value="INACTIVE">停用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {/* 操作栏 */}
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增
            </Button>
            {selectedIds.length > 0 && (
              <Button danger icon={<DeleteOutlined />} onClick={handleBatchDelete}>
                批量删除 ({selectedIds.length})
              </Button>
            )}
          </Space>
        </div>

        {/* 数据表格 */}
        <DataTable
          data={orgNodes}
          loading={loading}
          rowKey="id"
          columns={columns}
          pagination={{
            current: query.current,
            pageSize: query.pageSize,
            total,
            onChange: handlePageChange,
          }}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: handleRowSelectionChange,
          }}
        />
      </div>

      {/* 详情抽屉 */}
      <Drawer
        title="组织节点详情"
        width={600}
        open={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        destroyOnClose
      >
        {currentNode && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="节点编码">{currentNode.nodeCode}</Descriptions.Item>
            <Descriptions.Item label="节点名称">{currentNode.nodeName}</Descriptions.Item>
            <Descriptions.Item label="节点类型">
              <span style={{ color: ORG_NODE_TYPE_MAP[currentNode.nodeType]?.color ?? '#aaa', fontWeight: 500 }}>
                {ORG_NODE_TYPE_MAP[currentNode.nodeType]?.label ?? String(currentNode.nodeType ?? '-')}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <StatusBadge status={currentNode.status} statusMap={ORG_NODE_STATUS_MAP} />
            </Descriptions.Item>
            <Descriptions.Item label="父节点">{currentNode.parentName || '-'}</Descriptions.Item>
            <Descriptions.Item label="层级">{currentNode.level}</Descriptions.Item>
            <Descriptions.Item label="排序">{currentNode.sort}</Descriptions.Item>
            <Descriptions.Item label="负责人">{currentNode.leaderName || '-'}</Descriptions.Item>
            <Descriptions.Item label="副负责人">{currentNode.deputyLeaderName || '-'}</Descriptions.Item>
            <Descriptions.Item label="工厂">{currentNode.factoryName}</Descriptions.Item>
            <Descriptions.Item label="车间">{currentNode.workshopName || '-'}</Descriptions.Item>
            <Descriptions.Item label="工作中心">{currentNode.workCenterName || '-'}</Descriptions.Item>
            <Descriptions.Item label="员工数量">{currentNode.employeeCount}</Descriptions.Item>
            <Descriptions.Item label="班组数量">{currentNode.teamCount}</Descriptions.Item>
            <Descriptions.Item label="部门数量">{currentNode.departmentCount}</Descriptions.Item>
            <Descriptions.Item label="电话">{currentNode.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{currentNode.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="地址">{currentNode.address || '-'}</Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>{currentNode.description || '-'}</Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{currentNode.remark || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建人">{currentNode.creatorName}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{currentNode.createTime}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      {/* 新增弹窗 */}
      <Modal
        title="新增组织节点"
        open={showCreateModal}
        onOk={handleCreateConfirm}
        onCancel={() => toggleCreateModal(false)}
        width={600}
        confirmLoading={loading}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="nodeCode"
            label="节点编码"
            rules={[{ required: true, message: '请输入节点编码' }]}
          >
            <Input placeholder="请输入节点编码" />
          </Form.Item>
          <Form.Item
            name="nodeName"
            label="节点名称"
            rules={[{ required: true, message: '请输入节点名称' }]}
          >
            <Input placeholder="请输入节点名称" />
          </Form.Item>
          <Form.Item
            name="nodeType"
            label="节点类型"
            rules={[{ required: true, message: '请选择节点类型' }]}
          >
            <Select placeholder="请选择节点类型">
              <Select.Option value="COMPANY">公司</Select.Option>
              <Select.Option value="DEPARTMENT">部门</Select.Option>
              <Select.Option value="TEAM">班组</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="parentId"
            label="父节点"
          >
            <Input placeholder="请输入父节点ID" />
          </Form.Item>
          <Form.Item
            name="sort"
            label="排序"
            rules={[{ required: true, message: '请输入排序' }]}
            initialValue={0}
          >
            <InputNumber placeholder="请输入排序" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="factoryId"
            label="工厂"
            rules={[{ required: true, message: '请选择工厂' }]}
          >
            <Select placeholder="请选择工厂">
              <Select.Option value="factory1">工厂1</Select.Option>
              <Select.Option value="factory2">工厂2</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="workshopId" label="车间">
            <Select placeholder="请选择车间">
              <Select.Option value="workshop1">车间1</Select.Option>
              <Select.Option value="workshop2">车间2</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="workCenterId" label="工作中心">
            <Select placeholder="请选择工作中心">
              <Select.Option value="workcenter1">工作中心1</Select.Option>
              <Select.Option value="workcenter2">工作中心2</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="leaderId" label="负责人">
            <Input placeholder="请输入负责人ID" />
          </Form.Item>
          <Form.Item name="deputyLeaderId" label="副负责人">
            <Input placeholder="请输入副负责人ID" />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input placeholder="请输入地址" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑组织节点"
        open={showEditModal}
        onOk={handleEditConfirm}
        onCancel={() => toggleEditModal(false)}
        width={600}
        confirmLoading={loading}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="nodeCode" label="节点编码">
            <Input placeholder="请输入节点编码" disabled />
          </Form.Item>
          <Form.Item name="nodeName" label="节点名称">
            <Input placeholder="请输入节点名称" disabled />
          </Form.Item>
          <Form.Item name="nodeType" label="节点类型">
            <Select placeholder="请选择节点类型" disabled>
              <Select.Option value="COMPANY">公司</Select.Option>
              <Select.Option value="DEPARTMENT">部门</Select.Option>
              <Select.Option value="TEAM">班组</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="parentId" label="父节点">
            <Input placeholder="请输入父节点ID" disabled />
          </Form.Item>
          <Form.Item name="sort" label="排序">
            <InputNumber placeholder="请输入排序" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="factoryId" label="工厂">
            <Select placeholder="请选择工厂" disabled>
              <Select.Option value="factory1">工厂1</Select.Option>
              <Select.Option value="factory2">工厂2</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="workshopId" label="车间">
            <Select placeholder="请选择车间" disabled>
              <Select.Option value="workshop1">车间1</Select.Option>
              <Select.Option value="workshop2">车间2</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="workCenterId" label="工作中心">
            <Select placeholder="请选择工作中心" disabled>
              <Select.Option value="workcenter1">工作中心1</Select.Option>
              <Select.Option value="workcenter2">工作中心2</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="leaderId" label="负责人">
            <Input placeholder="请输入负责人ID" disabled />
          </Form.Item>
          <Form.Item name="deputyLeaderId" label="副负责人">
            <Input placeholder="请输入副负责人ID" />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input placeholder="请输入地址" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrganizationList;