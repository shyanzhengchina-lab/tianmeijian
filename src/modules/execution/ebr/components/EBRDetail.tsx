/**
 * 电子批记录详情组件
 */

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Descriptions,
  Tag,
  Space,
  Button,
  Card,
  Statistic,
  Row,
  Col,
  Progress,
  Steps,
  Timeline,
  message,
  Modal,
  Tabs,
  Table,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  EditOutlined,
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  ExperimentOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  RocketOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useEBRStore } from '../store/ebrStore';
import type { EBRRecord, EBRStep, EquipmentUsage, MaterialBalance } from '../types';
import {
  EBR_STATUS_MAP,
  STEP_STATUS_MAP,
  DATA_TYPE_MAP,
} from '../types';
import { StatusBadge } from '../../../../shared/components/StatusBadge';

const { TabPane } = Tabs;

interface EBRDetailProps {
  visible: boolean;
  onClose: () => void;
  record: EBRRecord | null;
}

/**
 * 电子批记录详情组件
 */
export const EBRDetail: React.FC<EBRDetailProps> = ({
  visible,
  onClose,
  record,
}) => {
  const {
    currentSteps,
    equipmentUsageList,
    materialBalanceList,
    loading,
    loadSteps,
    startEBR,
    pauseEBR,
    resumeEBR,
    completeEBR,
    cancelEBR,
    startStep,
    completeStep,
    approveStep,
    loadEquipmentUsage,
    loadMaterialBalance,
  } = useEBRStore();

  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (visible && record) {
      loadSteps(record.id);
      loadEquipmentUsage(record.id);
      loadMaterialBalance(record.id);
    }
  }, [visible, record, loadSteps, loadEquipmentUsage, loadMaterialBalance]);

  if (!record) return null;

  /**
   * 开始EBR
   */
  const handleStart = async () => {
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
  const handlePause = async () => {
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
  const handleResume = async () => {
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
  const handleComplete = async () => {
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
  const handleCancel = async () => {
    Modal.confirm({
      title: '确认取消',
      content: `确定要取消批记录 ${record.ebrNo} 吗？`,
      onOk: async () => {
        await cancelEBR(record.id);
      },
    });
  };

  /**
   * 开始步骤
   */
  const handleStartStep = async (step: EBRStep) => {
    Modal.confirm({
      title: '确认开始步骤',
      content: `确定要开始步骤 ${step.stepName} 吗？`,
      onOk: async () => {
        await startStep({
          action: 'START',
          ebrId: record.id,
          stepId: step.id,
          operatorId: '1',
        });
      },
    });
  };

  /**
   * 完成步骤
   */
  const handleCompleteStep = async (step: EBRStep) => {
    Modal.confirm({
      title: '确认完成步骤',
      content: `确定要完成步骤 ${step.stepName} 吗？`,
      onOk: async () => {
        await completeStep({
          action: 'COMPLETE',
          ebrId: record.id,
          stepId: step.id,
          operatorId: '1',
        });
      },
    });
  };

  /**
   * 审批步骤
   */
  const handleApproveStep = async (step: EBRStep) => {
    Modal.confirm({
      title: '确认审批步骤',
      content: `确定要审批通过步骤 ${step.stepName} 吗？`,
      onOk: async () => {
        await approveStep({
          action: 'APPROVE',
          ebrId: record.id,
          stepId: step.id,
          operatorId: '1',
        });
      },
    });
  };

  /**
   * 设备使用表格列
   */
  const equipmentColumns = [
    {
      title: '设备名称',
      dataIndex: 'equipmentName',
      key: 'equipmentName',
      width: 150,
    },
    {
      title: '设备编码',
      dataIndex: 'equipmentCode',
      key: 'equipmentCode',
      width: 150,
    },
    {
      title: '使用类型',
      dataIndex: 'usageType',
      key: 'usageType',
      width: 120,
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
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160,
      render: (time: string) => time || '-',
    },
    {
      title: '使用时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
      render: (duration: number) => `${Math.floor(duration / 60)}分${duration % 60}秒`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
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
  ];

  /**
   * 物料平衡表格列
   */
  const balanceColumns = [
    {
      title: '物料名称',
      dataIndex: 'materialName',
      key: 'materialName',
      width: 150,
    },
    {
      title: '物料编码',
      dataIndex: 'materialCode',
      key: 'materialCode',
      width: 150,
    },
    {
      title: '批号',
      dataIndex: 'batchNo',
      key: 'batchNo',
      width: 150,
    },
    {
      title: '标准用量',
      dataIndex: 'standardQty',
      key: 'standardQty',
      width: 120,
      render: (qty: number, record: MaterialBalance) => `${qty} ${record.standardUnit}`,
    },
    {
      title: '实际用量',
      dataIndex: 'actualQty',
      key: 'actualQty',
      width: 120,
      render: (qty: number, record: MaterialBalance) => `${qty} ${record.actualUnit}`,
    },
    {
      title: '差异',
      dataIndex: 'variance',
      key: 'variance',
      width: 100,
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
      render: (rate: number) => `${rate.toFixed(2)}%`,
    },
    {
      title: '平衡状态',
      dataIndex: 'balanceStatus',
      key: 'balanceStatus',
      width: 120,
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
  ];

  return (
    <Drawer
      title="电子批记录详情"
      width={1000}
      open={visible}
      onClose={onClose}
      destroyOnClose
      footer={
        <Space style={{ textAlign: 'right', width: '100%' }}>
          {record.status === 'PENDING' && (
            <>
              <Button icon={<PlayCircleOutlined />} type="primary" onClick={handleStart}>
                开始
              </Button>
              <Button icon={<StopOutlined />} danger onClick={handleCancel}>
                取消
              </Button>
            </>
          )}
          {record.status === 'IN_PROGRESS' && (
            <>
              <Button icon={<PauseCircleOutlined />} onClick={handlePause}>
                暂停
              </Button>
              <Button icon={<CheckCircleOutlined />} type="primary" onClick={handleComplete}>
                完成
              </Button>
            </>
          )}
          {record.status === 'PAUSED' && (
            <Button icon={<PlayCircleOutlined />} type="primary" onClick={handleResume}>
              恢复
            </Button>
          )}
          <Button onClick={onClose}>关闭</Button>
        </Space>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'info',
            label: (
              <Space>
                <InfoCircleOutlined />
                基本信息
              </Space>
            ),
            children: (
              <>
                {/* 统计信息 */}
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="总步骤"
                        value={record.totalSteps}
                        prefix={<SettingOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="已完成"
                        value={record.completedSteps}
                        prefix={<CheckCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="进度"
                        value={record.totalSteps > 0
                          ? Math.round((record.completedSteps / record.totalSteps) * 100)
                          : 0}
                        suffix="%"
                        prefix={<Progress type="circle" percent={record.totalSteps > 0
                          ? Math.round((record.completedSteps / record.totalSteps) * 100)
                          : 0} size={20} />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="异常次数"
                        value={record.abnormalCount}
                        prefix={<SafetyOutlined />}
                        valueStyle={{ color: record.abnormalCount > 0 ? '#cf1322' : '#3f8600' }}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* 基本信息 */}
                <Card title="基本信息" style={{ marginBottom: 16 }}>
                  <Descriptions column={2} bordered>
                    <Descriptions.Item label="批记录编号">{record.ebrNo}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <StatusBadge status={record.status} statusMap={EBR_STATUS_MAP} />
                    </Descriptions.Item>
                    <Descriptions.Item label="工单编号">{record.workOrderNo}</Descriptions.Item>
                    <Descriptions.Item label="批号">{record.batchNo}</Descriptions.Item>
                    <Descriptions.Item label="产品名称">{record.productName}</Descriptions.Item>
                    <Descriptions.Item label="配方名称">{record.recipeName}</Descriptions.Item>
                    <Descriptions.Item label="操作员">
                      <UserOutlined /> {record.operatorName}
                    </Descriptions.Item>
                    <Descriptions.Item label="主管">
                      <UserOutlined /> {record.supervisorName}
                    </Descriptions.Item>
                    <Descriptions.Item label="开始时间">
                      {record.startTime ? (
                        <>
                          <ClockCircleOutlined /> {record.startTime}
                        </>
                      ) : (
                        '-'
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="结束时间">
                      {record.endTime ? (
                        <>
                          <ClockCircleOutlined /> {record.endTime}
                        </>
                      ) : (
                        '-'
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {/* 步骤列表 */}
                <Card title="执行步骤" style={{ marginBottom: 16 }}>
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
                </Card>

                {/* 备注信息 */}
                <Card title="备注信息">
                  <Descriptions column={1} bordered>
                    <Descriptions.Item label="备注">{record.remark || '-'}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </>
            ),
          },
          {
            key: 'equipment',
            label: (
              <Space>
                <ToolOutlined />
                设备使用
              </Space>
            ),
            children: (
              <Table
                columns={equipmentColumns}
                dataSource={equipmentUsageList}
                loading={loading}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ),
          },
          {
            key: 'balance',
            label: (
              <Space>
                <ExperimentOutlined />
                物料平衡
              </Space>
            ),
            children: (
              <Table
                columns={balanceColumns}
                dataSource={materialBalanceList}
                loading={loading}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ),
          },
        ]}
      />
    </Drawer>
  );
};

export default EBRDetail;
