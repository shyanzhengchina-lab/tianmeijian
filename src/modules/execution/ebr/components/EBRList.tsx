/**
 * 电子批记录列表组件
 */

import React, { useEffect, useState } from 'react';
import { Button, Space, Tag, Drawer, Steps, Timeline, Progress, Descriptions, Modal, Form, Input, DatePicker, Select, message } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined, DeleteOutlined, EditOutlined, EyeOutlined, CheckCircleOutlined, ToolOutlined, ExperimentOutlined } from '@ant-design/icons';
import { useEBRStore } from '../store/ebrStore';
import { EBR_STATUS_MAP, STEP_STATUS_MAP, DATA_TYPE_MAP, EBR_COLUMNS } from '../types';
import { StatusBadge } from '../../../../shared/components/StatusBadge';
import { DataTable } from '../../../../shared/components/DataTable';

const { TextArea } = Input;

interface EBRListProps {}

export const EBRList: React.FC<EBRListProps> = () => {
  const {
    ebrRecords,
    total,
    loading,
    error,
    query,
    selectedIds,
    currentRecord,
    currentSteps,
    showDetailDrawer,
    equipmentUsageList,
    materialBalanceList,
    showEquipmentDrawer,
    showBalanceDrawer,
    operationLoading,
    stepOperationLoading,
    activeTab,
    showCreateModal,
    showEditModal,

    setQuery,
    setSelectedIds,
    setCurrentRecord,
    setCurrentSteps,
    setShowDetailDrawer,
    setEquipmentUsageList,
    setShowEquipmentDrawer,
    setMaterialBalanceList,
    setShowBalanceDrawer,
    setActiveTab,
    setShowCreateModal: toggleCreateModal,
    setShowEditModal: toggleEditModal,

    loadEBRRecords,
    refreshEBRRecords,
    createEBRRecord,
    updateEBRRecord,
    deleteEBRRecords,
    startEBR,
    pauseEBR,
    resumeEBR,
    completeEBR,
    cancelEBR,
    loadSteps,
    startStep,
    completeStep,
    pauseStep,
    skipStep,
    approveStep,
    loadEquipmentUsage,
    addEquipmentUsage,
    endEquipmentUsage,
    loadMaterialBalance,
    recalculateBalance,
    adjustVariance,
    clearSelection,
  } = useEBRStore();

  const [searchForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    loadEBRRecords();
  }, [query]);

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
    refreshEBRRecords();
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
      await createEBRRecord(values);
      createForm.resetFields();
    } catch (error) {
      console.error('创建失败:', error);
    }
  };

  /**
   * 编辑按钮
   */
  const handleEdit = (record: any) => {
    setCurrentRecord(record);
    editForm.setFieldsValue(record);
    toggleEditModal(true);
  };

  /**
   * 编辑确认
   */
  const handleEditConfirm = async () => {
    try {
      const values = await editForm.validateFields();
      await updateEBRRecord({ id: currentRecord?.id, ...values });
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
      content: `确定要删除批记录 ${record.ebrNo} 吗？`,
      onOk: async () => {
        await deleteEBRRecords([record.id]);
      },
    });
  };

  /**
   * 批量删除
   */
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      message.warning('请选择要删除的批记录');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedIds.length} 个批记录吗？`,
      onOk: async () => {
        await deleteEBRRecords(selectedIds);
      },
    });
  };

  /**
   * 查看详情
   */
  const handleViewDetail = async (record: any) => {
    setCurrentRecord(record);
    setActiveTab('steps');
    await loadSteps(record.id);
    setShowDetailDrawer(true);
  };

  /**
   * 开始EBR
   */
  const handleStart = async (record: any) => {
    Modal.confirm({
      title: '确认开始',
      content: `确定要开始执行批记录 ${record.ebrNo} 吗？`,
      onOk: async () => {
        await startEBR(record.id);
      },
    });
  };

  /**
   * 暂停EBR
   */
  const handlePause = async (record: any) => {
    Modal.confirm({
      title: '确认暂停',
      content: `确定要暂停批记录 ${record.ebrNo} 吗？`,
      onOk: async () => {
        await pauseEBR(record.id);
      },
    });
  };

  /**
   * 恢复EBR
   */
  const handleResume = async (record: any) => {
    Modal.confirm({
      title: '确认恢复',
      content: `确定要恢复执行批记录 ${record.ebrNo} 吗？`,
      onOk: async () => {
        await resumeEBR(record.id);
      },
    });
  };

  /**
   * 完成EBR
   */
  const handleComplete = async (record: any) => {
    Modal.confirm({
      title: '确认完成',
      content: `确定要完成批记录 ${record.ebrNo} 吗？`,
      onOk: async () => {
        await completeEBR(record.id);
      },
    });
  };

  /**
   * 取消EBR
   */
  const handleCancel = async (record: any) => {
    Modal.confirm({
      title: '确认取消',
      content: `确定要取消批记录 ${record.ebrNo} 吗？`,
      onOk: async () => {
        await cancelEBR(record.id);
      },
    });
  };

  /**
   * 查看设备使用
   */
  const handleViewEquipment = async (record: any) => {
    setCurrentRecord(record);
    await loadEquipmentUsage(record.id);
    setShowEquipmentDrawer(true);
  };

  /**
   * 查看物料平衡
   */
  const handleViewBalance = async (record: any) => {
    setCurrentRecord(record);
    await loadMaterialBalance(record.id);
    setShowBalanceDrawer(true);
  };

  /**
   * 开始步骤
   */
  const handleStartStep = async (step: any) => {
    if (!currentRecord) return;

    Modal.confirm({
      title: '确认开始步骤',
      content: `确定要开始步骤 ${step.stepName} 吗？`,
      onOk: async () => {
        await startStep({
          action: 'START',
          ebrId: currentRecord.id,
          stepId: step.id,
          operatorId: '1', // TODO: 从用户信息获取
        });
      },
    });
  };

  /**
   * 完成步骤
   */
  const handleCompleteStep = async (step: any) => {
    if (!currentRecord) return;

    Modal.confirm({
      title: '确认完成步骤',
      content: `确定要完成步骤 ${step.stepName} 吗？`,
      onOk: async () => {
        await completeStep({
          action: 'COMPLETE',
          ebrId: currentRecord.id,
          stepId: step.id,
          operatorId: '1', // TODO: 从用户信息获取
        });
      },
    });
  };

  /**
   * 审批步骤
   */
  const handleApproveStep = async (step: any) => {
    if (!currentRecord) return;

    Modal.confirm({
      title: '确认审批步骤',
      content: `确定要审批通过步骤 ${step.stepName} 吗？`,
      onOk: async () => {
        await approveStep({
          action: 'APPROVE',
          ebrId: currentRecord.id,
          stepId: step.id,
          operatorId: '1', // TODO: 从用户信息获取
        });
      },
    });
  };

  /**
   * 重新计算平衡
   */
  const handleRecalculateBalance = async () => {
    if (!currentRecord) return;

    Modal.confirm({
      title: '确认重新计算',
      content: '确定要重新计算物料平衡吗？',
      onOk: async () => {
        await recalculateBalance(currentRecord.id);
      },
    });
  };

  /**
   * 调整差异
   */
  const handleAdjustVariance = (record: any) => {
    Modal.confirm({
      title: '调整差异原因',
      content: (
        <Input.TextArea
          placeholder="请输入差异调整原因"
          rows={4}
          id="variance-reason"
        />
      ),
      onOk: async () => {
        const reason = (document.getElementById('variance-reason') as HTMLTextAreaElement)?.value || '';
        await adjustVariance(record.id, reason);
      },
    });
  };

  /**
   * 表格列定义
   */
  const columns = [
    {
      title: '批记录编号',
      dataIndex: 'ebrNo',
      key: 'ebrNo',
      width: 150,
      align: 'center' as const,
      fixed: 'left' as const,
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
          statusMap={EBR_STATUS_MAP}
        />
      ),
    },
    {
      title: '工单编号',
      dataIndex: 'workOrderNo',
      key: 'workOrderNo',
      width: 150,
      align: 'center' as const,
    },
    {
      title: '批号',
      dataIndex: 'batchNo',
      key: 'batchNo',
      width: 150,
      align: 'center' as const,
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 150,
      align: 'center' as const,
    },
    {
      title: '配方名称',
      dataIndex: 'recipeName',
      key: 'recipeName',
      width: 150,
      align: 'center' as const,
    },
    {
      title: '操作员',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '主管',
      dataIndex: 'supervisorName',
      key: 'supervisorName',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '总步骤',
      dataIndex: 'totalSteps',
      key: 'totalSteps',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '已完成',
      dataIndex: 'completedSteps',
      key: 'completedSteps',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '进度',
      key: 'progress',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: any) => {
        const progress = record.totalSteps > 0
          ? Math.round((record.completedSteps / record.totalSteps) * 100)
          : 0;
        return (
          <Progress
            percent={progress}
            size="small"
            status={progress === 100 ? 'success' : 'active'}
          />
        );
      },
    },
    {
      title: '质检状态',
      dataIndex: 'qcStatus',
      key: 'qcStatus',
      width: 100,
      align: 'center' as const,
      render: (status: string) => {
        const statusConfig: Record<string, { label: string; color: string }> = {
          PENDING: { label: '待质检', color: '#faad14' },
          PASSED: { label: '已通过', color: '#52c41a' },
          FAILED: { label: '未通过', color: '#ff4d4f' },
        };
        const config = statusConfig[status] || { label: status, color: '#1890ff' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
      align: 'center' as const,
      render: (time: string) => time || '-',
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160,
      align: 'center' as const,
      render: (time: string) => time || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
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
          {record.status === 'PENDING' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStart(record)}
              >
                开始
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
          {record.status === 'IN_PROGRESS' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<PauseCircleOutlined />}
                onClick={() => handlePause(record)}
              >
                暂停
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleComplete(record)}
              >
                完成
              </Button>
            </>
          )}
          {record.status === 'PAUSED' && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleResume(record)}
            >
              恢复
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<ToolOutlined />}
            onClick={() => handleViewEquipment(record)}
          >
            设备
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ExperimentOutlined />}
            onClick={() => handleViewBalance(record)}
          >
            平衡
          </Button>
        </Space>
      ),
    },
  ];

  /**
   * 步骤列表渲染
   */
  const renderSteps = () => {
    return (
      <Timeline
        mode="left"
        items={currentSteps.map((step) => ({
          color: step.status === 'COMPLETED' ? 'green' : step.status === 'IN_PROGRESS' ? 'blue' : 'gray',
          children: (
            <div key={step.id}>
              <div style={{ marginBottom: 8 }}>
                <Space>
                  <Tag color={STEP_STATUS_MAP[step.status].border}>
                    {STEP_STATUS_MAP[step.status]?.label ?? String(step.status ?? '-')}
                  </Tag>
                  <span style={{ fontWeight: 500 }}>{step.stepName}</span>
                  {step.stepType === 'CRITICAL' && (
                    <Tag color="red">关键步骤</Tag>
                  )}
                  {step.stepType === 'QUALITY' && (
                    <Tag color="orange">质检步骤</Tag>
                  )}
                </Space>
              </div>
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="步骤编号">{step.stepNo}</Descriptions.Item>
                <Descriptions.Item label="预估时间">{step.estimatedTime}s</Descriptions.Item>
                <Descriptions.Item label="操作员">{step.operatorName}</Descriptions.Item>
                {step.actualTime && (
                  <Descriptions.Item label="实际时间">{step.actualTime}s</Descriptions.Item>
                )}
              </Descriptions>
              {step.requireApproval && step.status === 'COMPLETED' && !step.approvalTime && (
                <div style={{ marginTop: 8 }}>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleApproveStep(step)}
                  >
                    审批通过
                  </Button>
                </div>
              )}
              {step.status === 'PENDING' && (
                <div style={{ marginTop: 8 }}>
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleStartStep(step)}
                  >
                    开始执行
                  </Button>
                </div>
              )}
              {step.status === 'IN_PROGRESS' && (
                <div style={{ marginTop: 8 }}>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleCompleteStep(step)}
                  >
                    完成步骤
                  </Button>
                </div>
              )}
            </div>
          ),
        }))}
      />
    );
  };

  return (
    <div style={{ padding: 24 }}>
      {/* 搜索表单 */}
      <Form
        form={searchForm}
        layout="inline"
        onFinish={handleSearch}
        style={{ marginBottom: 16 }}
      >
        <Form.Item name="ebrNo">
          <Input placeholder="批记录编号" allowClear />
        </Form.Item>
        <Form.Item name="status">
          <Select placeholder="状态" allowClear style={{ width: 120 }}>
            {Object.entries(EBR_STATUS_MAP).map(([key, value]) => (
              <Select.Option key={key} value={key}>
                {value.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="workOrderNo">
          <Input placeholder="工单编号" allowClear />
        </Form.Item>
        <Form.Item name="batchNo">
          <Input placeholder="批号" allowClear />
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
        data={ebrRecords}
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

      {/* 详情抽屉 */}
      <Drawer
        title="批记录详情"
        width={800}
        open={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        destroyOnClose
      >
        {currentRecord && (
          <>
            <Descriptions title="基本信息" bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="批记录编号">{currentRecord.ebrNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <StatusBadge status={currentRecord.status} statusMap={EBR_STATUS_MAP} />
              </Descriptions.Item>
              <Descriptions.Item label="工单编号">{currentRecord.workOrderNo}</Descriptions.Item>
              <Descriptions.Item label="批号">{currentRecord.batchNo}</Descriptions.Item>
              <Descriptions.Item label="产品名称">{currentRecord.productName}</Descriptions.Item>
              <Descriptions.Item label="配方名称">{currentRecord.recipeName}</Descriptions.Item>
              <Descriptions.Item label="操作员">{currentRecord.operatorName}</Descriptions.Item>
              <Descriptions.Item label="主管">{currentRecord.supervisorName}</Descriptions.Item>
              <Descriptions.Item label="开始时间">{currentRecord.startTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{currentRecord.endTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="进度">
                <Progress
                  percent={currentRecord.totalSteps > 0
                    ? Math.round((currentRecord.completedSteps / currentRecord.totalSteps) * 100)
                    : 0}
                />
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{currentRecord.remark || '-'}</Descriptions.Item>
            </Descriptions>

            <Steps
              current={currentSteps.findIndex(s => s.status === 'IN_PROGRESS')}
              style={{ marginBottom: 24 }}
              items={currentSteps.slice(0, 5).map((step) => ({
                key: step.id,
                title: step.stepName,
                description: step.status === 'COMPLETED' ? '已完成' : step.status === 'IN_PROGRESS' ? '执行中' : '待执行',
                status: (step.status === 'COMPLETED' ? 'finish' : step.status === 'IN_PROGRESS' ? 'process' : 'wait') as any,
              }))}
            />

            <div style={{ marginBottom: 24 }}>
              <h3>步骤列表</h3>
              {renderSteps()}
            </div>
          </>
        )}
      </Drawer>

      {/* 设备使用抽屉 */}
      <Drawer
        title="设备使用记录"
        width={800}
        open={showEquipmentDrawer}
        onClose={() => setShowEquipmentDrawer(false)}
        destroyOnClose
      >
        {currentRecord && (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="批记录编号">{currentRecord.ebrNo}</Descriptions.Item>
              <Descriptions.Item label="批号">{currentRecord.batchNo}</Descriptions.Item>
            </Descriptions>

            <DataTable
              data={equipmentUsageList}
              loading={loading}
              rowKey="id"
              columns={[
                {
                  title: '设备名称',
                  dataIndex: 'equipmentName',
                  key: 'equipmentName',
                  width: 150,
                  align: 'center' as const,
                },
                {
                  title: '设备编码',
                  dataIndex: 'equipmentCode',
                  key: 'equipmentCode',
                  width: 150,
                  align: 'center' as const,
                },
                {
                  title: '使用类型',
                  dataIndex: 'usageType',
                  key: 'usageType',
                  width: 120,
                  align: 'center' as const,
                  render: (type: string) => {
                    const typeMap: Record<string, { label: string; color: string }> = {
                      PRODUCTION: { label: '生产', color: 'blue' },
                      QUALITY: { label: '质检', color: 'orange' },
                      MAINTENANCE: { label: '维护', color: 'green' },
                    };
                    const config = typeMap[type] || { label: type, color: 'default' };
                    return <Tag color={config.color}>{config.label}</Tag>;
                  },
                },
                {
                  title: '开始时间',
                  dataIndex: 'startTime',
                  key: 'startTime',
                  width: 160,
                  align: 'center' as const,
                },
                {
                  title: '结束时间',
                  dataIndex: 'endTime',
                  key: 'endTime',
                  width: 160,
                  align: 'center' as const,
                  render: (time: string) => time || '-',
                },
                {
                  title: '使用时长',
                  dataIndex: 'duration',
                  key: 'duration',
                  width: 120,
                  align: 'center' as const,
                  render: (duration: number) => `${Math.floor(duration / 60)}分${duration % 60}秒`,
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  width: 100,
                  align: 'center' as const,
                  render: (status: string) => {
                    const statusMap: Record<string, { label: string; color: string }> = {
                      NORMAL: { label: '正常', color: 'green' },
                      ABNORMAL: { label: '异常', color: 'red' },
                      MAINTENANCE: { label: '维护', color: 'orange' },
                    };
                    const config = statusMap[status] || { label: status, color: 'default' };
                    return <Tag color={config.color}>{config.label}</Tag>;
                  },
                },
                {
                  title: '异常次数',
                  dataIndex: 'abnormalCount',
                  key: 'abnormalCount',
                  width: 100,
                  align: 'center' as const,
                },
                {
                  title: '操作员',
                  dataIndex: 'operatorName',
                  key: 'operatorName',
                  width: 120,
                  align: 'center' as const,
                },
              ]}
              pagination={false}
            />
          </>
        )}
      </Drawer>

      {/* 物料平衡抽屉 */}
      <Drawer
        title="物料平衡记录"
        width={800}
        open={showBalanceDrawer}
        onClose={() => setShowBalanceDrawer(false)}
        destroyOnClose
      >
        {currentRecord && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleRecalculateBalance}
              >
                重新计算平衡
              </Button>
            </div>

            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="批记录编号">{currentRecord.ebrNo}</Descriptions.Item>
              <Descriptions.Item label="批号">{currentRecord.batchNo}</Descriptions.Item>
            </Descriptions>

            <DataTable
              data={materialBalanceList}
              loading={loading}
              rowKey="id"
              columns={[
                {
                  title: '物料名称',
                  dataIndex: 'materialName',
                  key: 'materialName',
                  width: 150,
                  align: 'center' as const,
                },
                {
                  title: '物料编码',
                  dataIndex: 'materialCode',
                  key: 'materialCode',
                  width: 150,
                  align: 'center' as const,
                },
                {
                  title: '批号',
                  dataIndex: 'batchNo',
                  key: 'batchNo',
                  width: 150,
                  align: 'center' as const,
                },
                {
                  title: '标准用量',
                  dataIndex: 'standardQty',
                  key: 'standardQty',
                  width: 120,
                  align: 'center' as const,
                  render: (qty: number, record: any) => `${qty} ${record.standardUnit}`,
                },
                {
                  title: '实际用量',
                  dataIndex: 'actualQty',
                  key: 'actualQty',
                  width: 120,
                  align: 'center' as const,
                  render: (qty: number, record: any) => `${qty} ${record.actualUnit}`,
                },
                {
                  title: '差异',
                  dataIndex: 'variance',
                  key: 'variance',
                  width: 100,
                  align: 'center' as const,
                  render: (variance: number) => (
                    <span style={{ color: variance > 0 ? '#ff4d4f' : variance < 0 ? '#52c41a' : '#1890ff' }}>
                      {variance > 0 ? '+' : ''}{variance}
                    </span>
                  ),
                },
                {
                  title: '差异率',
                  dataIndex: 'varianceRate',
                  key: 'varianceRate',
                  width: 100,
                  align: 'center' as const,
                  render: (rate: number) => `${rate.toFixed(2)}%`,
                },
                {
                  title: '平衡状态',
                  dataIndex: 'balanceStatus',
                  key: 'balanceStatus',
                  width: 120,
                  align: 'center' as const,
                  render: (status: string) => {
                    const statusMap: Record<string, { label: string; color: string }> = {
                      BALANCED: { label: '平衡', color: 'green' },
                      OVER: { label: '超量', color: 'red' },
                      SHORT: { label: '不足', color: 'orange' },
                    };
                    const config = statusMap[status] || { label: status, color: 'default' };
                    return <Tag color={config.color}>{config.label}</Tag>;
                  },
                },
                {
                  title: '差异原因',
                  dataIndex: 'varianceReason',
                  key: 'varianceReason',
                  width: 200,
                  align: 'center' as const,
                  render: (reason: string) => reason || '-',
                },
                {
                  title: '操作',
                  key: 'action',
                  width: 100,
                  align: 'center' as const,
                  render: (_: any, record: any) => (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => handleAdjustVariance(record)}
                    >
                      调整
                    </Button>
                  ),
                },
              ]}
              pagination={false}
            />
          </>
        )}
      </Drawer>

      {/* 新增弹窗 */}
      <Modal
        title="新增批记录"
        open={showCreateModal}
        onOk={handleCreateConfirm}
        onCancel={() => toggleCreateModal(false)}
        width={600}
        confirmLoading={loading}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="workOrderId"
            label="工单ID"
            rules={[{ required: true, message: '请输入工单ID' }]}
          >
            <Input placeholder="请输入工单ID" />
          </Form.Item>
          <Form.Item
            name="recipeId"
            label="配方ID"
            rules={[{ required: true, message: '请输入配方ID' }]}
          >
            <Input placeholder="请输入配方ID" />
          </Form.Item>
          <Form.Item
            name="operatorId"
            label="操作员ID"
            rules={[{ required: true, message: '请输入操作员ID' }]}
          >
            <Input placeholder="请输入操作员ID" />
          </Form.Item>
          <Form.Item
            name="supervisorId"
            label="主管ID"
            rules={[{ required: true, message: '请输入主管ID' }]}
          >
            <Input placeholder="请输入主管ID" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑批记录"
        open={showEditModal}
        onOk={handleEditConfirm}
        onCancel={() => toggleEditModal(false)}
        width={600}
        confirmLoading={loading}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="workOrderId" label="工单ID">
            <Input placeholder="请输入工单ID" disabled />
          </Form.Item>
          <Form.Item name="recipeId" label="配方ID">
            <Input placeholder="请输入配方ID" disabled />
          </Form.Item>
          <Form.Item name="operatorId" label="操作员ID">
            <Input placeholder="请输入操作员ID" disabled />
          </Form.Item>
          <Form.Item name="supervisorId" label="主管ID">
            <Input placeholder="请输入主管ID" disabled />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EBRList;