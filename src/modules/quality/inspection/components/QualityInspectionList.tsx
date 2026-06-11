/**
 * 质量检验管理列表组件
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
  Progress,
  message,
  Drawer,
  Tabs,
  Descriptions,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CheckOutlined,
  StopOutlined,
  EyeOutlined,
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useQualityInspectionStore } from '../store/qualityInspectionStore';
import type {
  QualityInspection,
  InspectionStatus,
  InspectionType,
  InspectionResult,
} from '../types';
import {
  QUALITY_INSPECTION_STATUS_MAP,
  QUALITY_INSPECTION_TYPE_MAP,
  QUALITY_INSPECTION_RESULT_MAP,
} from '../types';
import { usePermission } from '../../../../shared/hooks/usePermission';
import { StatusBadge } from '../../../../shared/components/StatusBadge';
import { DataTable } from '../../../../shared/components/DataTable';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

/**
 * 质量检验列表组件
 */
export const QualityInspectionList: React.FC = () => {
  const {
    qualityInspections,
    total,
    loading,
    query,
    filters,
    selectedInspectionIds,
    currentInspection,
    showInspectionDetail,
    showCreateModal,
    showEditModal,
    showInspectionModal,
    showApprovalModal,
    inspectionLoading,

    // Actions
    loadQualityInspections,
    refreshQualityInspections,
    deleteQualityInspections,
    startInspection,
    submitInspectionResult,
    approveInspection,
    cancelInspection,
    setQuery,
    setFilters,
    setSelectedInspectionIds,
    setCurrentInspection,
    setShowInspectionDetail,
    setShowCreateModal: setShowCreate,
    setShowEditModal: setShowEdit,
    setShowInspectionModal: setShowInspection,
    setShowApprovalModal: setShowApproval,
  } = useQualityInspectionStore();

  const [searchForm] = Form.useForm();
  const [approveForm] = Form.useForm();

  const { hasPermission } = usePermission();

  // 加载数据
  useEffect(() => {
    loadQualityInspections();
  }, [query, filters]);

  // 搜索处理
  const handleSearch = (values: any) => {
    const newFilters: Record<string, any> = {};

    if (values.inspectionNo) newFilters.inspectionNo = values.inspectionNo;
    if (values.inspectionType) newFilters.inspectionType = values.inspectionType;
    if (values.status) newFilters.status = values.status;
    if (values.workOrderNo) newFilters.workOrderNo = values.workOrderNo;
    if (values.productCode) newFilters.productCode = values.productCode;
    if (values.productName) newFilters.productName = values.productName;
    if (values.batchNo) newFilters.batchNo = values.batchNo;
    if (values.inspectorId) newFilters.inspectorId = values.inspectorId;
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
    setSelectedInspectionIds(selectedRowKeys as string[]);
  };

  // 查看详情
  const handleViewDetail = (record: QualityInspection) => {
    setCurrentInspection(record);
    setShowInspectionDetail(true);
  };

  // 新增处理
  const handleAdd = () => {
    if (!hasPermission('quality:inspection:create')) {
      message.warning('您没有创建质量检验的权限');
      return;
    }
    setShowCreate(true);
  };

  // 编辑处理
  const handleEdit = (record: QualityInspection) => {
    if (!hasPermission('quality:inspection:edit')) {
      message.warning('您没有编辑质量检验的权限');
      return;
    }
    setCurrentInspection(record);
    setShowEdit(true);
  };

  // 删除处理
  const handleDelete = (ids: string[] | string) => {
    if (!hasPermission('quality:inspection:delete')) {
      message.warning('您没有删除质量检验的权限');
      return;
    }

    const deleteIds = Array.isArray(ids) ? ids : [ids];
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 ${deleteIds.length} 个质量检验吗？`,
      onOk: async () => {
        await deleteQualityInspections(deleteIds);
      },
    });
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedInspectionIds.length === 0) {
      message.warning('请先选择要删除的质量检验');
      return;
    }
    handleDelete(selectedInspectionIds);
  };

  // 开始检验
  const handleStartInspection = async (record: QualityInspection) => {
    if (!hasPermission('quality:inspection:inspect')) {
      message.warning('您没有执行检验的权限');
      return;
    }
    await startInspection(record.id);
  };

  // 提交检验结果
  const handleSubmitResult = (record: QualityInspection) => {
    if (!hasPermission('quality:inspection:submit')) {
      message.warning('您没有提交检验结果的权限');
      return;
    }
    setCurrentInspection(record);
    setShowInspection(true);
  };

  // 审核处理
  const handleApprove = (record: QualityInspection) => {
    if (!hasPermission('quality:inspection:approve')) {
      message.warning('您没有审核质量检验的权限');
      return;
    }
    setCurrentInspection(record);
    approveForm.resetFields();
    setShowApproval(true);
  };

  // 取消检验
  const handleCancel = async (record: QualityInspection) => {
    if (!hasPermission('quality:inspection:cancel')) {
      message.warning('您没有取消质量检验的权限');
      return;
    }

    Modal.confirm({
      title: '确认取消',
      content: `确定要取消检验 ${record.inspectionNo} 吗？`,
      onOk: async () => {
        await cancelInspection({
          inspectionId: record.id,
          cancelReason: '用户取消',
        });
      },
    });
  };

  // 提交审核
  const handleApproveSubmit = async () => {
    try {
      const values = await approveForm.validateFields();
      await approveInspection({
        inspectionId: currentInspection!.id,
        approverId: 'current-user-id', // TODO: 从用户信息中获取
        approveResult: values.approveResult,
        approveComment: values.approveComment,
      });
    } catch (error) {
      console.error('审核失败:', error);
    }
  };

  // 刷新处理
  const handleRefresh = () => {
    refreshQualityInspections();
  };

  // 表格列配置
  const columns = [
    {
      title: '检验单号',
      dataIndex: 'inspectionNo',
      key: 'inspectionNo',
      width: 150,
      fixed: 'left' as const,
      render: (text: string, record: QualityInspection) => (
        <Button type="link" onClick={() => handleViewDetail(record)}>
          {text}
        </Button>
      ),
    },
    {
      title: '检验类型',
      dataIndex: 'inspectionType',
      key: 'inspectionType',
      width: 120,
      render: (type: InspectionType) => {
        const typeConfig = QUALITY_INSPECTION_TYPE_MAP[type];
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
      render: (status: InspectionStatus) => {
        const statusConfig = QUALITY_INSPECTION_STATUS_MAP[status];
        return (
          <Badge
            status={(status as any) === 'APPROVED' ? 'success' : (status as any) === 'REJECTED' ? 'error' : 'processing'}
            text={<span style={{ color: statusConfig.color }}>{statusConfig.label}</span>}
          />
        );
      },
    },
    {
      title: '工单编号',
      dataIndex: 'workOrderNo',
      key: 'workOrderNo',
      render: (text: string | undefined) => text || '-',
    },
    {
      title: '产品编码',
      dataIndex: 'productCode',
      key: 'productCode',
      render: (text: string | undefined) => text || '-',
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
      render: (text: string | undefined) => text || '-',
    },
    {
      title: '批号',
      dataIndex: 'batchNo',
      key: 'batchNo',
      width: 120,
    },
    {
      title: '检验数量',
      dataIndex: 'inspectionQty',
      key: 'inspectionQty',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '合格数量',
      dataIndex: 'qualifiedQty',
      key: 'qualifiedQty',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '不合格数量',
      dataIndex: 'unqualifiedQty',
      key: 'unqualifiedQty',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '检验结果',
      dataIndex: 'inspectionResult',
      key: 'inspectionResult',
      width: 100,
      render: (result: InspectionResult) => {
        const resultConfig = (QUALITY_INSPECTION_RESULT_MAP as any)[result];
        return (
          <Tag color={resultConfig.color} icon={<span>{resultConfig.icon}</span>}>
            {resultConfig.label}
          </Tag>
        );
      },
    },
    {
      title: '合格率',
      dataIndex: 'qualifiedRate',
      key: 'qualifiedRate',
      width: 100,
      render: (rate: number) => (
        <Progress
          percent={rate}
          size="small"
          status={rate >= 90 ? 'success' : rate >= 80 ? 'normal' : 'exception'}
        />
      ),
    },
    {
      title: '检验方案',
      dataIndex: 'schemeName',
      key: 'schemeName',
      width: 150,
    },
    {
      title: '检验员',
      dataIndex: 'inspectorName',
      key: 'inspectorName',
      width: 120,
    },
    {
      title: '计划检验时间',
      dataIndex: 'planInspectTime',
      key: 'planInspectTime',
      width: 160,
    },
    {
      title: '实际检验时间',
      dataIndex: 'actualInspectTime',
      key: 'actualInspectTime',
      width: 160,
    },
    {
      title: '审核人',
      dataIndex: 'approverName',
      key: 'approverName',
      width: 120,
      render: (text: string | null) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: QualityInspection) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {record.status === 'PENDING' && (
            <>
              <Tooltip title="开始检验">
                <Button
                  type="text"
                  icon={<SearchOutlined />}
                  style={{ color: '#1890ff' }}
                  onClick={() => handleStartInspection(record)}
                />
              </Tooltip>
            </>
          )}
          {record.status === 'INSPECTING' && (
            <>
              <Tooltip title="提交结果">
                <Button
                  type="text"
                  icon={<CheckOutlined />}
                  style={{ color: '#52c41a' }}
                  onClick={() => handleSubmitResult(record)}
                />
              </Tooltip>
            </>
          )}
          {record.status === 'COMPLETED' && (
            <>
              <Tooltip title="审核">
                <Button
                  type="text"
                  icon={<CheckOutlined />}
                  style={{ color: '#722ed1' }}
                  onClick={() => handleApprove(record)}
                />
              </Tooltip>
            </>
          )}
          {(record.status === 'PENDING' || record.status === 'INSPECTING') && (
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
    <div className="quality-inspection-list">
      {/* 搜索区域 */}
      <Card size="small" className="mb-2">
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
        >
          <Form.Item name="inspectionNo" label="检验单号">
            <Input placeholder="请输入检验单号" allowClear />
          </Form.Item>
          <Form.Item name="inspectionType" label="检验类型">
            <Select placeholder="请选择检验类型" allowClear style={{ width: 120 }}>
              {Object.entries(QUALITY_INSPECTION_TYPE_MAP).map(([key, config]) => (
                <Option key={key} value={key}>{config.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" allowClear style={{ width: 120 }}>
              {Object.entries(QUALITY_INSPECTION_STATUS_MAP).map(([key, config]) => (
                <Option key={key} value={key}>{config.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="productCode" label="产品编码">
            <Input placeholder="请输入产品编码" allowClear />
          </Form.Item>
          <Form.Item name="productName" label="产品名称">
            <Input placeholder="请输入产品名称" allowClear />
          </Form.Item>
        </Form>
        <Form
          form={searchForm}
          layout="inline"
          style={{ marginTop: 16 }}
        >
          <Form.Item name="batchNo" label="批号">
            <Input placeholder="请输入批号" allowClear />
          </Form.Item>
          <Form.Item name="dateRange" label="检验时间">
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
          {hasPermission('quality:inspection:create') && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              新增
            </Button>
          )}
          {selectedInspectionIds.length > 0 && (
            <>
              {hasPermission('quality:inspection:delete') && (
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
          共 {total} 条记录，已选择 {selectedInspectionIds.length} 条
        </span>
      </Card>

      {/* 数据表格 */}
      <Card size="small">
        <DataTable
          dataSource={qualityInspections}
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
            selectedRowKeys: selectedInspectionIds,
            onChange: handleRowSelection,
          }}
          scroll={{ x: 2800 }}
        />
      </Card>

      {/* 详情抽屉 */}
      <Drawer
        title="质量检验详情"
        open={showInspectionDetail}
        onClose={() => setShowInspectionDetail(false)}
        width={800}
        destroyOnClose
      >
        {currentInspection && (
          <div>
            {/* 基本信息 */}
            <Card size="small" title="基本信息" className="mb-2">
              <Descriptions column={2}>
                <Descriptions.Item label="检验单号">{currentInspection.inspectionNo}</Descriptions.Item>
                <Descriptions.Item label="检验类型">
                  <Tag color={QUALITY_INSPECTION_TYPE_MAP[currentInspection.inspectionType]?.color ?? 'default'}>
                    {QUALITY_INSPECTION_TYPE_MAP[currentInspection.inspectionType]?.label ?? String(currentInspection.inspectionType ?? '-')}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <StatusBadge
                    status={currentInspection.status}
                    statusMap={QUALITY_INSPECTION_STATUS_MAP}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="工单编号">{currentInspection.workOrderNo || '-'}</Descriptions.Item>
                <Descriptions.Item label="产品编码">{currentInspection.productCode || '-'}</Descriptions.Item>
                <Descriptions.Item label="产品名称">{currentInspection.productName || '-'}</Descriptions.Item>
                <Descriptions.Item label="产品规格">{currentInspection.productSpec || '-'}</Descriptions.Item>
                <Descriptions.Item label="批号">{currentInspection.batchNo}</Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 数量信息 */}
            <Card size="small" title="数量信息" className="mb-2">
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="检验数量" value={currentInspection.inspectionQty} />
                </Col>
                <Col span={8}>
                  <Statistic title="合格数量" value={currentInspection.qualifiedQty} valueStyle={{ color: '#52c41a' }} />
                </Col>
                <Col span={8}>
                  <Statistic title="不合格数量" value={currentInspection.unqualifiedQty} valueStyle={{ color: '#ff4d4f' }} />
                </Col>
              </Row>
              <div style={{ marginTop: 16 }}>
                <Progress
                  percent={currentInspection.qualifiedRate}
                  status={currentInspection.qualifiedRate >= 90 ? 'success' : currentInspection.qualifiedRate >= 80 ? 'normal' : 'exception'}
                />
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  合格率：{currentInspection.qualifiedRate}%
                </div>
              </div>
            </Card>

            {/* 检验方案 */}
            <Card size="small" title="检验方案" className="mb-2">
              <Descriptions column={2}>
                <Descriptions.Item label="方案名称">{currentInspection.schemeName}</Descriptions.Item>
                <Descriptions.Item label="抽样方法">{currentInspection.sampleMethod}</Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 检验项目 */}
            <Card size="small" title="检验项目" className="mb-2">
              <Tabs
                items={currentInspection.inspectionItems.map((item, index) => ({
                  key: index.toString(),
                  label: `${item.itemCode} ${item.itemName}`,
                  children: (
                    <Descriptions column={2}>
                      <Descriptions.Item label="项目类型">{item.itemType}</Descriptions.Item>
                      <Descriptions.Item label="标准值">{item.standardValue}</Descriptions.Item>
                      <Descriptions.Item label="公差范围">{item.tolerance}</Descriptions.Item>
                      <Descriptions.Item label="抽样数量">{item.sampleSize}</Descriptions.Item>
                      <Descriptions.Item label="检验方法">{item.checkMethod}</Descriptions.Item>
                      <Descriptions.Item label="实际值">{item.actualValue}</Descriptions.Item>
                      <Descriptions.Item label="检验结果">
                        <Tag color={item.result === 'PASS' ? 'green' : item.result === 'FAIL' ? 'red' : 'orange'}>
                          {item.result === 'PASS' ? '合格' : item.result === 'FAIL' ? '不合格' : '条件合格'}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="备注" span={2}>
                        {item.remark || '-'}
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                }))}
              />
            </Card>

            {/* 人员信息 */}
            <Card size="small" title="人员信息" className="mb-2">
              <Descriptions column={2}>
                <Descriptions.Item label="检验员">{currentInspection.inspectorName}</Descriptions.Item>
                <Descriptions.Item label="审核人">{currentInspection.approverName || '-'}</Descriptions.Item>
                <Descriptions.Item label="计划检验时间">{currentInspection.planInspectTime}</Descriptions.Item>
                <Descriptions.Item label="实际检验时间">{currentInspection.actualInspectTime}</Descriptions.Item>
                <Descriptions.Item label="审核时间">{currentInspection.approveTime || '-'}</Descriptions.Item>
                <Descriptions.Item label="备注">{currentInspection.remark || '-'}</Descriptions.Item>
              </Descriptions>
            </Card>

            {/* 操作按钮 */}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Space>
                {currentInspection.status === 'PENDING' && (
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={() => handleStartInspection(currentInspection)}
                  >
                    开始检验
                  </Button>
                )}
                {currentInspection.status === 'INSPECTING' && (
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => handleSubmitResult(currentInspection)}
                  >
                    提交结果
                  </Button>
                )}
                {currentInspection.status === 'COMPLETED' && (
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => handleApprove(currentInspection)}
                  >
                    审核
                  </Button>
                )}
                <Button onClick={() => setShowInspectionDetail(false)}>
                  关闭
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Drawer>

      {/* 审批弹窗 */}
      <Modal
        title="审核质量检验"
        open={showApprovalModal}
        onOk={handleApproveSubmit}
        onCancel={() => setShowApproval(false)}
        confirmLoading={inspectionLoading}
        width={600}
      >
        <Form form={approveForm} layout="vertical">
          <Form.Item
            name="approveResult"
            label="审核结果"
            rules={[{ required: true, message: '请选择审核结果' }]}
          >
            <Select>
              <Option value="APPROVED">通过</Option>
              <Option value="REJECTED">不通过</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="approveComment"
            label="审核意见"
            rules={[{ required: true, message: '请输入审核意见' }]}
          >
            <TextArea
              rows={4}
              placeholder="请输入审核意见"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QualityInspectionList;