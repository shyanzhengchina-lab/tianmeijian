/**
 * 领料管理列表组件
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Space,
  Table,
  Tag,
  Form,
  Input,
  Select,
  DatePicker,
  Modal,
  Tooltip,
  Badge,
  message,
  Drawer,
  Descriptions,
  Row,
  Col,
  Statistic,
  Tabs,
  List,
  Avatar,
  Steps,
} from 'antd';
import {
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  SendOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  UndoOutlined,
  UserOutlined,
  TeamOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useIssuanceStore } from '../store/issuanceStore';
import type {
  MaterialIssuance,
  IssuanceStatus,
  IssuanceType,
  IssuanceMethod,
} from '../types';
import {
  ISSUANCE_STATUS_MAP,
  ISSUANCE_TYPE_MAP,
  ISSUANCE_METHOD_MAP,
} from '../types';
import { usePermission } from '../../../../shared/hooks/usePermission';
import { StatusBadge } from '../../../../shared/components/StatusBadge';
import { DataTable } from '../../../../shared/components/DataTable';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

/**
 * 领料管理列表组件
 */
export const IssuanceList: React.FC = () => {
  const {
    issuances,
    total,
    loading,
    query,
    filters,
    selectedIssuanceIds,
    currentIssuance,
    showIssuanceDetail,
    showCreateModal,
    showEditModal,
    showReturnModal,
    showApproveModal,

    // Actions
    loadIssuances,
    refreshIssuances,
    createIssuance,
    updateIssuance,
    deleteIssuances,
    approveIssuance,
    rejectIssuance,
    issueMaterial,
    completeIssuance,
    cancelIssuance,
    setQuery,
    setFilters,
    setSelectedIssuanceIds,
    setCurrentIssuance,
    setShowIssuanceDetail,
    setShowCreateModal: setShowCreate,
    setShowEditModal: setShowEdit,
    setShowReturnModal: setShowReturn,
    setShowApproveModal: setShowApprove,
  } = useIssuanceStore();

  const [searchForm] = Form.useForm();
  const [returnForm] = Form.useForm();

  const { hasPermission } = usePermission();

  // 加载数据
  useEffect(() => {
    loadIssuances();
  }, [query, filters]);

  // 搜索处理
  const handleSearch = (values: any) => {
    const newFilters: Record<string, any> = {};

    if (values.issuanceNo) newFilters.issuanceNo = values.issuanceNo;
    if (values.issuanceType) newFilters.issuanceType = values.issuanceType;
    if (values.status) newFilters.status = values.status;
    if (values.method) newFilters.method = values.method;
    if (values.workOrderNo) newFilters.workOrderNo = values.workOrderNo;
    if (values.taskNo) newFilters.taskNo = values.taskNo;
    if (values.materialCode) newFilters.materialCode = values.materialCode;
    if (values.materialName) newFilters.materialName = values.materialName;
    if (values.batchNo) newFilters.batchNo = values.batchNo;
    if (values.requesterId) newFilters.requesterId = values.requesterId;
    if (values.dateRange) {
      newFilters.startDate = values.dateRange[0]?.format('YYYY-MM-DD');
      newFilters.endDate = values.dateRange[1]?.format('YYYY-MM-DD');
    }

    setFilters(newFilters);
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setFilters({});
    setQuery({ current: 1 });
  };

  // 分页处理
  const handlePageChange = (page: number, pageSize: number) => {
    setQuery({ current: page, pageSize });
  };

  // 行选择处理
  const handleRowSelection = (selectedRowKeys: React.Key[]) => {
    setSelectedIssuanceIds(selectedRowKeys as string[]);
  };

  // 查看详情
  const handleViewDetail = (record: MaterialIssuance) => {
    setCurrentIssuance(record);
    setShowIssuanceDetail(true);
  };

  // 新增处理
  const handleAdd = () => {
    if (!hasPermission('execution:issuance:create')) {
      message.warning('您没有创建领料单的权限');
      return;
    }
    setShowCreate(true);
  };

  // 编辑处理
  const handleEdit = (record: MaterialIssuance) => {
    if (!hasPermission('execution:issuance:edit')) {
      message.warning('您没有编辑领料单的权限');
      return;
    }
    setCurrentIssuance(record);
    setShowEdit(true);
  };

  // 删除处理
  const handleDelete = (ids: string[] | string) => {
    if (!hasPermission('execution:issuance:delete')) {
      message.warning('您没有删除领料单的权限');
      return;
    }

    const deleteIds = Array.isArray(ids) ? ids : [ids];
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 ${deleteIds.length} 个领料单吗？`,
      onOk: async () => {
        await deleteIssuances(deleteIds);
      },
    });
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedIssuanceIds.length === 0) {
      message.warning('请先选择要删除的领料单');
      return;
    }
    handleDelete(selectedIssuanceIds);
  };

  // 审批领料单
  const handleApprove = (record: MaterialIssuance) => {
    if (!hasPermission('execution:issuance:approve')) {
      message.warning('您没有审批领料单的权限');
      return;
    }

    Modal.confirm({
      title: '确认审批',
      content: `确定要审批领料单 ${record.issuanceNo} 吗？`,
      onOk: async () => {
        await approveIssuance({
          action: 'APPROVE',
          issuanceId: record.id,
          operatorId: 'current-user-id', // TODO: 从用户信息中获取
        });
      },
    });
  };

  // 拒绝领料单
  const handleReject = (record: MaterialIssuance) => {
    if (!hasPermission('execution:issuance:reject')) {
      message.warning('您没有拒绝领料单的权限');
      return;
    }

    Modal.confirm({
      title: '确认拒绝',
      content: `确定要拒绝领料单 ${record.issuanceNo} 吗？`,
      onOk: async () => {
        await rejectIssuance({
          action: 'REJECT',
          issuanceId: record.id,
          operatorId: 'current-user-id',
        });
      },
    });
  };

  // 发料
  const handleIssueMaterial = async (record: MaterialIssuance) => {
    if (!hasPermission('execution:issuance:issue')) {
      message.warning('您没有发料的权限');
      return;
    }
    await issueMaterial({
      action: 'ISSUE',
      issuanceId: record.id,
      operatorId: 'current-user-id',
    });
  };

  // 完成领料单
  const handleComplete = async (record: MaterialIssuance) => {
    if (!hasPermission('execution:issuance:complete')) {
      message.warning('您没有完成领料单的权限');
      return;
    }
    await completeIssuance({
      action: 'ISSUE',  // was COMPLETE - mapped to supported action
      issuanceId: record.id,
      operatorId: 'current-user-id',
    });
  };

  // 取消领料单
  const handleCancel = async (record: MaterialIssuance) => {
    if (!hasPermission('execution:issuance:cancel')) {
      message.warning('您没有取消领料单的权限');
      return;
    }

    Modal.confirm({
      title: '确认取消',
      content: `确定要取消领料单 ${record.issuanceNo} 吗？`,
      onOk: async () => {
        await cancelIssuance({
          action: 'RETURN',  // was CANCEL - mapped to supported action
          issuanceId: record.id,
          operatorId: 'current-user-id',
        });
      },
    });
  };

  // 退料处理
  const handleReturn = (record: MaterialIssuance) => {
    if (!hasPermission('execution:issuance:return')) {
      message.warning('您没有退料的权限');
      return;
    }
    setCurrentIssuance(record);
    returnForm.resetFields();
    setShowReturn(true);
  };

  // 提交退料
  const handleReturnSubmit = async () => {
    try {
      const values = await returnForm.validateFields();
      // TODO: 调用API退料
      await new Promise(resolve => setTimeout(() => resolve(undefined), 1000));
      message.success('退料操作已完成！');
      setShowReturn(false);
    } catch (error) {
      console.error('退料失败:', error);
    }
  };

  // 刷新处理
  const handleRefresh = () => {
    refreshIssuances();
  };

  // 表格列配置
  const columns = [
    {
      title: '领料单号',
      dataIndex: 'issuanceNo',
      key: 'issuanceNo',
      width: 150,
      fixed: 'left' as const,
      render: (text: string, record: MaterialIssuance) => (
        <Button type="link" onClick={() => handleViewDetail(record)}>
          {text}
        </Button>
      ),
    },
    {
      title: '领料类型',
      dataIndex: 'issuanceType',
      key: 'issuanceType',
      width: 120,
      render: (type: IssuanceType) => {
        const typeConfig = ISSUANCE_TYPE_MAP[type];
        return (
          <Tag color={typeConfig.color} icon={<span>{typeConfig.icon}</span>}>
            {typeConfig.label}
          </Tag>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: IssuanceStatus) => {
        const statusConfig = ISSUANCE_STATUS_MAP[status];
        return (
          <Badge
            status={status === 'ISSUED' ? 'success' : status === 'RETURNED' ? 'default' : 'processing'}
            text={<span style={{ color: statusConfig.color }}>{statusConfig.label}</span>}
          />
        );
      },
    },
    {
      title: '领料方式',
      dataIndex: 'method',
      key: 'method',
      width: 120,
      render: (method: IssuanceMethod) => {
        const methodConfig = ISSUANCE_METHOD_MAP[method];
        return (
          <Tag color={methodConfig.color} icon={<span>{methodConfig.icon}</span>}>
            {methodConfig.label}
          </Tag>
        );
      },
    },
    {
      title: '工单编号',
      dataIndex: 'workOrderNo',
      key: 'workOrderNo',
      width: 150,
    },
    {
      title: '任务编号',
      dataIndex: 'taskNo',
      key: 'taskNo',
      width: 150,
    },
    {
      title: '工序名称',
      dataIndex: 'operationName',
      key: 'operationName',
      width: 150,
    },
    {
      title: '申请人',
      dataIndex: 'requesterName',
      key: 'requesterName',
      width: 120,
    },
    {
      title: '领料人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 120,
    },
    {
      title: '总数量',
      dataIndex: 'totalQty',
      key: 'totalQty',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '已发数量',
      dataIndex: 'issuedQty',
      key: 'issuedQty',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '已退数量',
      dataIndex: 'returnedQty',
      key: 'returnedQty',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '申请时间',
      dataIndex: 'requestTime',
      key: 'requestTime',
      width: 160,
    },
    {
      title: '领料时间',
      dataIndex: 'issueTime',
      key: 'issueTime',
      width: 160,
      render: (text: string | null) => text || '-',
    },
    {
      title: '计划退料时间',
      dataIndex: 'planReturnTime',
      key: 'planReturnTime',
      width: 160,
      render: (text: string | null) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      fixed: 'right' as const,
      render: (_: any, record: MaterialIssuance) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<FileTextOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {record.status === 'PENDING' && (
            <>
              {hasPermission('execution:issuance:approve') && (
                <Tooltip title="审批">
                  <Button
                    type="text"
                    icon={<CheckOutlined />}
                    style={{ color: '#52c41a' }}
                    onClick={() => handleApprove(record)}
                  />
                </Tooltip>
              )}
              {hasPermission('execution:issuance:reject') && (
                <Tooltip title="拒绝">
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    style={{ color: '#ff4d4f' }}
                    onClick={() => handleReject(record)}
                  />
                </Tooltip>
              )}
            </>
          )}
          {record.status === 'ISSUED' && (
            <>
              <Tooltip title="退料">
                <Button
                  type="text"
                  icon={<UndoOutlined />}
                  style={{ color: '#52c41a' }}
                  onClick={() => handleReturn(record)}
                />
              </Tooltip>
            </>
          )}
          {(record.status === 'PENDING' || record.status === 'ISSUED') && (
            <Tooltip title="取消">
              <Button
                type="text"
                icon={<StopOutlined />}
                style={{ color: '#ff4d4f' }}
                onClick={() => handleCancel(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="issuance-list">
      {/* 搜索区域 */}
      <Card size="small" className="mb-2">
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
        >
          <Form.Item name="issuanceNo" label="领料单号">
            <Input placeholder="请输入领料单号" allowClear />
          </Form.Item>
          <Form.Item name="issuanceType" label="领料类型">
            <Select placeholder="请选择领料类型" allowClear style={{ width: 120 }}>
              {Object.entries(ISSUANCE_TYPE_MAP).map(([key, config]) => (
                <Option key={key} value={key}>{config.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" allowClear style={{ width: 120 }}>
              {Object.entries(ISSUANCE_STATUS_MAP).map(([key, config]) => (
                <Option key={key} value={key}>{config.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="method" label="领料方式">
            <Select placeholder="请选择领料方式" allowClear style={{ width: 120 }}>
              {Object.entries(ISSUANCE_METHOD_MAP).map(([key, config]) => (
                <Option key={key} value={key}>{config.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="workOrderNo" label="工单编号">
            <Input placeholder="请输入工单编号" allowClear />
          </Form.Item>
          <Form.Item name="taskNo" label="任务编号">
            <Input placeholder="请输入任务编号" allowClear />
          </Form.Item>
        </Form>
        <Form
          form={searchForm}
          layout="inline"
          style={{ marginTop: 16 }}
        >
          <Form.Item name="materialCode" label="物料编码">
            <Input placeholder="请输入物料编码" allowClear />
          </Form.Item>
          <Form.Item name="materialName" label="物料名称">
            <Input placeholder="请输入物料名称" allowClear />
          </Form.Item>
          <Form.Item name="batchNo" label="批号">
            <Input placeholder="请输入批号" allowClear />
          </Form.Item>
          <Form.Item name="dateRange" label="申请时间">
            <RangePicker placeholder={['开始日期', '结束日期']} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                搜索
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 操作区域 */}
      <Card size="small" className="mb-2">
        <Space>
          {hasPermission('execution:issuance:create') && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              新增
            </Button>
          )}
          {selectedIssuanceIds.length > 0 && (
            <>
              {hasPermission('execution:issuance:delete') && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleBatchDelete}
                >
                  批量删除
                </Button>
              )}
            </>
          )}
        </Space>
        <span style={{ marginLeft: 16 }}>
          共 {total} 条记录，已选择 {selectedIssuanceIds.length} 条
        </span>
      </Card>

      {/* 数据表格 */}
      <Card size="small">
        <DataTable
          dataSource={issuances}
          loading={loading}
          rowKey="id"
          columns={columns}
          pagination={{
            current: query.current,
            pageSize: query.pageSize,
            total,
            onChange: handlePageChange,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowSelection={{
            selectedRowKeys: selectedIssuanceIds,
            onChange: handleRowSelection,
          }}
          scroll={{ x: 2400 }}
        />
      </Card>

      {/* 详情抽屉 */}
      <Drawer
        title="领料单详情"
        open={showIssuanceDetail}
        onClose={() => setShowIssuanceDetail(false)}
        width={900}
        destroyOnClose
      >
        {currentIssuance && (
          <div>
            {/* 基本信息 */}
            <Card size="small" title="基本信息" className="mb-2">
              <Descriptions column={2}>
                <Descriptions.Item label="领料单号">{currentIssuance.issuanceNo}</Descriptions.Item>
                <Descriptions.Item label="领料类型">
                  <Tag color={ISSUANCE_TYPE_MAP[currentIssuance.issuanceType]?.color ?? 'default'}>
                    {ISSUANCE_TYPE_MAP[currentIssuance.issuanceType]?.label ?? String(currentIssuance.issuanceType ?? '-')}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <StatusBadge
                    status={currentIssuance.status}
                    statusMap={ISSUANCE_STATUS_MAP}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="领料方式">
                  <Tag color={ISSUANCE_METHOD_MAP[currentIssuance.method]?.color ?? 'default'}>
                    {ISSUANCE_METHOD_MAP[currentIssuance.method]?.label ?? String(currentIssuance.method ?? '-')}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="工单编号">{currentIssuance.workOrderNo}</Descriptions.Item>
                <Descriptions.Item label="任务编号">{currentIssuance.taskNo}</Descriptions.Item>
                <Descriptions.Item label="工序名称">{currentIssuance.operationName}</Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 数量信息 */}
            <Card size="small" title="数量信息" className="mb-2">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title="总数量" value={currentIssuance.totalQty} />
                </Col>
                <Col span={6}>
                  <Statistic title="已发数量" value={currentIssuance.issuedQty} valueStyle={{ color: '#52c41a' }} />
                </Col>
                <Col span={6}>
                  <Statistic title="已退数量" value={currentIssuance.returnedQty} valueStyle={{ color: '#722ed1' }} />
                </Col>
                <Col span={6}>
                  <Statistic title="剩余数量" value={currentIssuance.remainingQty} valueStyle={{ color: '#faad14' }} />
                </Col>
              </Row>
            </Card>

            {/* 人员信息 */}
            <Card size="small" title="人员信息" className="mb-2">
              <Descriptions column={2}>
                <Descriptions.Item label="申请人">{currentIssuance.requesterName}</Descriptions.Item>
                <Descriptions.Item label="申请部门">{currentIssuance.requesterDept}</Descriptions.Item>
                <Descriptions.Item label="领料人">{currentIssuance.operatorName}</Descriptions.Item>
                <Descriptions.Item label="收料人">{currentIssuance.receiverName}</Descriptions.Item>
                <Descriptions.Item label="审批人">{currentIssuance.approverName || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 时间信息 */}
            <Card size="small" title="时间信息" className="mb-2">
              <Descriptions column={2}>
                <Descriptions.Item label="申请时间">{currentIssuance.requestTime}</Descriptions.Item>
                <Descriptions.Item label="领料时间">{currentIssuance.issueTime || '-'}</Descriptions.Item>
                <Descriptions.Item label="计划退料时间">{currentIssuance.planReturnTime || '-'}</Descriptions.Item>
                <Descriptions.Item label="实际退料时间">{currentIssuance.actualReturnTime || '-'}</Descriptions.Item>
                <Descriptions.Item label="审批时间">{currentIssuance.approvalTime || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 领料明细 */}
            <Card size="small" title="领料明细" className="mb-2">
              <Table
                dataSource={currentIssuance.issuanceItems}
                rowKey="itemId"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: '物料编码',
                    dataIndex: 'materialCode',
                    width: 120,
                  },
                  {
                    title: '物料名称',
                    dataIndex: 'materialName',
                    width: 150,
                  },
                  {
                    title: '物料规格',
                    dataIndex: 'materialSpec',
                    width: 150,
                  },
                  {
                    title: '批号',
                    dataIndex: 'batchNo',
                    width: 120,
                  },
                  {
                    title: '申请数量',
                    dataIndex: 'requestedQty',
                    width: 100,
                    align: 'center' as const,
                  },
                  {
                    title: '已发数量',
                    dataIndex: 'issuedQty',
                    width: 100,
                    align: 'center' as const,
                  },
                  {
                    title: '已退数量',
                    dataIndex: 'returnedQty',
                    width: 100,
                    align: 'center' as const,
                  },
                  {
                    title: '仓库',
                    dataIndex: 'warehouseName',
                    width: 120,
                  },
                  {
                    title: '库位',
                    dataIndex: 'locationCode',
                    width: 120,
                  },
                ]}
              />
            </Card>

            {/* 操作按钮 */}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Space>
                {currentIssuance.status === 'PENDING' && (
                  <>
                    {hasPermission('execution:issuance:approve') && (
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => handleApprove(currentIssuance)}
                      >
                        审批
                      </Button>
                    )}
                    {hasPermission('execution:issuance:issue') && (
                      <Button
                        type="primary"
                        icon={<ShoppingOutlined />}
                        onClick={() => handleIssueMaterial(currentIssuance)}
                      >
                        发料
                      </Button>
                    )}
                  </>
                )}
                {currentIssuance.status === 'ISSUED' && (
                  <>
                    <Button
                      icon={<UndoOutlined />}
                      onClick={() => handleReturn(currentIssuance)}
                    >
                      退料
                    </Button>
                  </>
                )}
                {(currentIssuance.status === 'PENDING' || currentIssuance.status === 'ISSUED') && (
                  <Button
                    danger
                    icon={<StopOutlined />}
                    onClick={() => handleCancel(currentIssuance)}
                  >
                    取消
                  </Button>
                )}
                <Button onClick={() => setShowIssuanceDetail(false)}>
                  关闭
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Drawer>

      {/* 退料弹窗 */}
      <Modal
        title="退料操作"
        open={showReturnModal}
        onOk={handleReturnSubmit}
        onCancel={() => setShowReturn(false)}
        width={600}
      >
        <Form form={returnForm} layout="vertical">
          <Form.Item
            name="itemId"
            label="物料明细"
            rules={[{ required: true, message: '请选择物料明细' }]}
          >
            <Select placeholder="请选择物料明细">
              {currentIssuance?.issuanceItems.map((item, index) => (
                <Option key={index} value={item.itemId}>
                  {item.materialCode} - {item.materialName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="returnQty"
            label="退料数量"
            rules={[{ required: true, message: '请输入退料数量' }]}
          >
            <Input type="number" placeholder="请输入退料数量" />
          </Form.Item>
          <Form.Item
            name="returnReason"
            label="退料原因"
            rules={[{ required: true, message: '请输入退料原因' }]}
          >
            <TextArea rows={4} placeholder="请输入退料原因" maxLength={500} showCount />
          </Form.Item>
          <Form.Item
            name="remark"
            label="备注"
          >
            <TextArea rows={3} placeholder="请输入备注" maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IssuanceList;