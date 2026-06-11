/**
 * 生产工单详情组件
 */

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Descriptions,
  Tag,
  Space,
  Button,
  Table,
  Statistic,
  Row,
  Col,
  Card,
  Progress,
  Steps,
  Timeline,
  message,
  Modal,
  InputNumber,
  Tabs,
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
  TeamOutlined,
  SettingOutlined,
  HistoryOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useWorkOrderStore } from '../store/workOrderStore';
import type { WorkOrder, TaskOrder } from '../types';
import {
  WORK_ORDER_STATUS_MAP,
  WORK_ORDER_PRIORITY_MAP,
  WORK_ORDER_TYPE_MAP,
} from '../types';
import { StatusBadge } from '../../../../shared/components/StatusBadge';

interface WorkOrderDetailProps {
  visible: boolean;
  onClose: () => void;
  record: WorkOrder | null;
}

/**
 * 生产工单详情组件
 */
export const WorkOrderDetail: React.FC<WorkOrderDetailProps> = ({
  visible,
  onClose,
  record,
}) => {
  const {
    loadTaskOrders,
    taskOrders,
    taskLoading,
    updateWorkOrderStatus,
    updateTaskOrderStatus,
    reportWorkOrderProgress,
    loading,
  } = useWorkOrderStore();

  const [activeTab, setActiveTab] = useState('info');
  const [reportingTaskId, setReportingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && record) {
      loadTaskOrders(record.id);
    }
  }, [visible, record, loadTaskOrders]);

  if (!record) return null;

  /**
   * 更新工单状态
   */
  const handleUpdateStatus = async (status: string) => {
    Modal.confirm({
      title: '确认状态变更',
      content: `确定要将工单状态更改为 ${status} 吗？`,
      onOk: async () => {
        await updateWorkOrderStatus(record.id, status);
      },
    });
  };

  /**
   * 更新任务单状态
   */
  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    Modal.confirm({
      title: '确认状态变更',
      content: `确定要将任务单状态更改为 ${status} 吗？`,
      onOk: async () => {
        await updateTaskOrderStatus(taskId, status);
      },
    });
  };

  /**
   * 汇报进度
   */
  const handleReportProgress = async (taskId: string, progress: number, qty: number) => {
    await reportWorkOrderProgress(taskId, progress, qty);
    setReportingTaskId(null);
  };

  /**
   * 任务单表格列定义
   */
  const taskColumns = [
    {
      title: '任务单号',
      dataIndex: 'taskNo',
      key: 'taskNo',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '工序名称',
      dataIndex: 'operationName',
      key: 'operationName',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '工作中心',
      dataIndex: 'workCenter',
      key: 'workCenter',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '计划数量',
      dataIndex: 'planQty',
      key: 'planQty',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '实际数量',
      dataIndex: 'actualQty',
      key: 'actualQty',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      align: 'center' as const,
      render: (progress: number) => (
        <Progress percent={progress} size="small" />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => (
        <StatusBadge status={status} statusMap={WORK_ORDER_STATUS_MAP} />
      ),
    },
    {
      title: '操作员',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: any, task: TaskOrder) => (
        <Space size="small">
          {task.status === 'CREATED' && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
            >
              开始
            </Button>
          )}
          {task.status === 'IN_PROGRESS' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<PauseCircleOutlined />}
                onClick={() => handleUpdateTaskStatus(task.id, 'PAUSED')}
              >
                暂停
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
              >
                完成
              </Button>
            </>
          )}
          {task.status === 'PAUSED' && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
            >
              恢复
            </Button>
          )}
          {task.status === 'IN_PROGRESS' && reportingTaskId === task.id && (
            <InputNumber
              min={0}
              max={100}
              defaultValue={task.progress}
              onPressEnter={(e) => {
                const value = (e.target as HTMLInputElement).value;
                handleReportProgress(task.id, parseInt(value), task.actualQty + 1);
              }}
              style={{ width: 80 }}
              placeholder="进度"
            />
          )}
        </Space>
      ),
    },
  ];

  /**
   * 流程步骤
   */
  const getSteps = () => {
    const steps = [
      {
        title: '草稿',
        status: record.status === 'DRAFT' ? 'process' : 'finish',
        description: '工单创建',
        icon: <FileTextOutlined />,
      },
      {
        title: '已创建',
        status: record.status === 'CREATED' ? 'process' :
               record.status === 'DRAFT' ? 'wait' : 'finish',
        description: '工单已创建',
        icon: <EditOutlined />,
      },
      {
        title: '已下发',
        status: record.status === 'RELEASED' ? 'process' :
               ['DRAFT', 'CREATED'].includes(record.status) ? 'wait' : 'finish',
        description: '工单已下发',
        icon: <RocketOutlined />,
      },
      {
        title: '执行中',
        status: record.status === 'IN_PROGRESS' ? 'process' :
               ['DRAFT', 'CREATED', 'RELEASED'].includes(record.status) ? 'wait' : 'finish',
        description: '工单执行中',
        icon: <SettingOutlined />,
      },
      {
        title: '已完成',
        status: record.status === 'COMPLETED' ? 'finish' :
               record.status === 'CANCELLED' ? 'error' : 'wait',
        description: '工单已完成',
        icon: <CheckCircleOutlined />,
      },
    ];

    return steps;
  };

  return (
    <Drawer
      title="生产工单详情"
      width={1000}
      open={visible}
      onClose={onClose}
      destroyOnClose
      footer={
        <Space style={{ textAlign: 'right', width: '100%' }}>
          {record.status === 'CREATED' && (
            <Button icon={<RocketOutlined />} type="primary" onClick={() => handleUpdateStatus('RELEASED')}>
              下发工单
            </Button>
          )}
          {record.status === 'RELEASED' && (
            <Button icon={<PlayCircleOutlined />} type="primary" onClick={() => handleUpdateStatus('IN_PROGRESS')}>
              开始执行
            </Button>
          )}
          {record.status === 'IN_PROGRESS' && (
            <>
              <Button icon={<PauseCircleOutlined />} onClick={() => handleUpdateStatus('PAUSED')}>
                暂停
              </Button>
              <Button icon={<CheckCircleOutlined />} type="primary" onClick={() => handleUpdateStatus('COMPLETED')}>
                完成
              </Button>
            </>
          )}
          {record.status === 'PAUSED' && (
            <Button icon={<PlayCircleOutlined />} type="primary" onClick={() => handleUpdateStatus('IN_PROGRESS')}>
              恢复
            </Button>
          )}
          {['DRAFT', 'CREATED', 'RELEASED', 'IN_PROGRESS', 'PAUSED'].includes(record.status) && (
            <Button icon={<StopOutlined />} danger onClick={() => handleUpdateStatus('CANCELLED')}>
              取消
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
            label: '基本信息',
            children: (
              <>
                {/* 统计信息 */}
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="计划数量"
                        value={record.quantity}
                        prefix={<FileTextOutlined />}
                        suffix={record.unit}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="已完成数量"
                        value={record.completedQty}
                        prefix={<CheckCircleOutlined />}
                        suffix={record.unit}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="完成进度"
                        value={record.progress}
                        prefix={<Progress type="circle" percent={record.progress} size={20} />}
                        suffix="%"
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="剩余数量"
                        value={record.totalQty - record.completedQty}
                        prefix={<HistoryOutlined />}
                        suffix={record.unit}
                        valueStyle={{ color: (record.totalQty - record.completedQty) > 0 ? '#cf1322' : '#3f8600' }}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* 基本信息 */}
                <Card title="基本信息" style={{ marginBottom: 16 }}>
                  <Descriptions column={2} bordered>
                    <Descriptions.Item label="工单编号">{record.woNo}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <StatusBadge status={record.status} statusMap={WORK_ORDER_STATUS_MAP} />
                    </Descriptions.Item>
                    <Descriptions.Item label="产品编码">{record.productCode}</Descriptions.Item>
                    <Descriptions.Item label="产品名称">{record.productName}</Descriptions.Item>
                    <Descriptions.Item label="产品规格">{record.productSpec || '-'}</Descriptions.Item>
                    <Descriptions.Item label="数量">
                      {record.quantity} {record.unit}
                    </Descriptions.Item>
                    <Descriptions.Item label="优先级">
                      <Tag color={WORK_ORDER_PRIORITY_MAP[record.priority]?.color ?? 'default'}>
                        {WORK_ORDER_PRIORITY_MAP[record.priority]?.label ?? String(record.priority ?? '-')}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="工单类型">
                      <Tag color={WORK_ORDER_TYPE_MAP[record.type]?.color ?? 'default'}>
                        {WORK_ORDER_TYPE_MAP[record.type]?.label ?? String(record.type ?? '-')}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {/* 计划信息 */}
                <Card title="计划信息" style={{ marginBottom: 16 }}>
                  <Descriptions column={2} bordered>
                    <Descriptions.Item label="计划开始时间">
                      <ClockCircleOutlined /> {record.planStartTime}
                    </Descriptions.Item>
                    <Descriptions.Item label="计划结束时间">
                      <ClockCircleOutlined /> {record.planEndTime}
                    </Descriptions.Item>
                    <Descriptions.Item label="实际开始时间">
                      {record.actualStartTime ? (
                        <>
                          <ClockCircleOutlined /> {record.actualStartTime}
                        </>
                      ) : (
                        '-'
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="实际结束时间">
                      {record.actualEndTime ? (
                        <>
                          <ClockCircleOutlined /> {record.actualEndTime}
                        </>
                      ) : (
                        '-'
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {/* 执行信息 */}
                <Card title="执行信息" style={{ marginBottom: 16 }}>
                  <Descriptions column={2} bordered>
                    <Descriptions.Item label="工作中心">{record.workCenter}</Descriptions.Item>
                    <Descriptions.Item label="操作员">
                      <UserOutlined /> {record.operatorName}
                    </Descriptions.Item>
                    <Descriptions.Item label="班组">
                      <TeamOutlined /> {record.teamName}
                    </Descriptions.Item>
                    <Descriptions.Item label="BOM版本">{record.bomVersion}</Descriptions.Item>
                  </Descriptions>
                </Card>

                {/* 流程信息 */}
                <Card title="流程信息" style={{ marginBottom: 16 }}>
                  <Steps
                    current={getSteps().findIndex(s => s.status === 'process')}
                    style={{ marginBottom: 24 }}
                    items={getSteps().map((step) => ({
                      title: step.title,
                      description: step.description,
                      status: step.status as any,
                      icon: step.icon,
                    }))}
                  />
                </Card>

                {/* 备注信息 */}
                <Card title="备注信息">
                  <Descriptions column={1} bordered>
                    <Descriptions.Item label="备注">{record.remark || '-'}</Descriptions.Item>
                    <Descriptions.Item label="创建人">{record.creatorName}</Descriptions.Item>
                    <Descriptions.Item label="创建时间">{record.createTime}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </>
            ),
          },
          {
            key: 'tasks',
            label: `任务单列表 (${taskOrders.length})`,
            children: (
              <Table
                columns={taskColumns}
                dataSource={taskOrders}
                rowKey="id"
                loading={taskLoading}
                pagination={false}
                size="small"
                scroll={{ x: 1200 }}
              />
            ),
          },
        ]}
      />
    </Drawer>
  );
};

export default WorkOrderDetail;
