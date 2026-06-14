/**
 * 车间看板详情组件
 * 展示车间看板的完整信息、设备状态、工序执行、生产统计
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Divider, Row, Col, Statistic, Progress, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CloseOutlined, EditOutlined, ApartmentOutlined, UserOutlined, CheckCircleOutlined,
  ClockCircleOutlined, WarningOutlined, StopOutlined, ToolOutlined,
  PlayCircleOutlined, PauseCircleOutlined, HistoryOutlined, ApartmentOutlined as ApartmentIcon
} from '@ant-design/icons';
import { WORKSHOP_STATUS_MAP, EQUIPMENT_STATUS_MAP } from '../types';
import type { WorkshopDashboard, EquipmentStatusInfo as EquipmentStatus, OperationExecution } from '../types';

interface WorkshopDetailProps {
  dashboard: WorkshopDashboard;
  onClose: () => void;
  onEdit?: (dashboard: WorkshopDashboard) => void;
}

const WorkshopDetail: React.FC<WorkshopDetailProps> = ({
  dashboard,
  onClose,
  onEdit,
}) => {
  const statusConfig = WORKSHOP_STATUS_MAP[dashboard.status];

  // 设备状态表格列
  const equipmentColumns: ColumnsType<EquipmentStatus> = [
    {
      title: '设备名称',
      dataIndex: 'equipmentName',
      width: 150,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (status: string) => {
        const config = EQUIPMENT_STATUS_MAP[status as keyof typeof EQUIPMENT_STATUS_MAP];
        return (
          <Tag color={config.color} style={{ fontWeight: 500 }}>
            {config.icon} {config.label}
          </Tag>
        );
      },
    },
    {
      title: '当前任务',
      width: 200,
      render: (_: any, record: EquipmentStatus) =>
        record.currentTask ? (
          <div>
            <div>{record.currentTask.taskNo}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.currentTask.productName}</div>
            <Progress percent={record.currentTask.progress} size="small" />
          </div>
        ) : '-',
    },
    {
      title: '运行参数',
      width: 200,
      render: (_: any, record: EquipmentStatus) => (
        <Space direction="vertical" size="small">
          {record.temperature !== undefined && (
            <div>温度: {record.temperature}°C</div>
          )}
          {record.speed !== undefined && (
            <div>速度: {record.speed} rpm</div>
          )}
          {record.efficiency !== undefined && (
            <div>效率: {record.efficiency}%</div>
          )}
        </Space>
      ),
    },
    {
      title: '运行时间',
      width: 180,
      render: (_: any, record: EquipmentStatus) => (
        <Space size="small">
          <Tag>运行: {record.runTime}h</Tag>
          <Tag>空闲: {record.idleTime}h</Tag>
          <Tag>维护: {record.maintenanceTime}h</Tag>
        </Space>
      ),
    },
    {
      title: '告警',
      width: 150,
      render: (_: any, record: EquipmentStatus) =>
        record.alarms.length > 0 ? (
          <Space direction="vertical" size="small">
            {record.alarms.slice(0, 2).map((alarm) => (
              <Tag
                key={alarm.id}
                color={alarm.alarmType === 'CRITICAL' ? 'error' : alarm.alarmType === 'WARNING' ? 'warning' : 'default'}
                style={{ fontSize: '12px' }}
              >
                {alarm.alarmType}: {alarm.alarmCode}
              </Tag>
            ))}
            {record.alarms.length > 2 && (
              <Tag>+{record.alarms.length - 2} more</Tag>
            )}
          </Space>
        ) : (
          <Tag color="success">无告警</Tag>
        ),
    },
  ];

  // 工序执行表格列
  const operationColumns: ColumnsType<OperationExecution> = [
    {
      title: '工序',
      dataIndex: 'stepName',
      width: 150,
      render: (_: any, record: OperationExecution) => (
        <div>
          <div>{record.stepCode}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.stepName}</div>
        </div>
      ),
    },
    {
      title: '工单号',
      dataIndex: 'workOrderNo',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { label: string; color: string; icon: any }> = {
          PENDING: { label: '待开始', color: '#8c8c8c', icon: ClockCircleOutlined },
          RUNNING: { label: '进行中', color: '#52c41a', icon: PlayCircleOutlined },
          PAUSED: { label: '已暂停', color: '#faad14', icon: PauseCircleOutlined },
          COMPLETED: { label: '已完成', color: '#1677ff', icon: CheckCircleOutlined },
        };
        const config = statusMap[status];
        return (
          <Tag color={config.color} style={{ fontWeight: 500 }}>
            {config.icon && <config.icon style={{ marginRight: '4px' }} />}
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '生产进度',
      width: 180,
      render: (_: any, record: OperationExecution) => (
        <div>
          <Progress percent={record.progress} size="small" />
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            {record.actualQty} / {record.planQty}
          </div>
        </div>
      ),
    },
    {
      title: '质量',
      width: 150,
      render: (_: any, record: OperationExecution) => (
        <Space size="small">
          <Tag color="success">合格: {record.qualifiedQty}</Tag>
          <Tag color="error">不良: {record.unqualifiedQty}</Tag>
        </Space>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      width: 100,
    },
    {
      title: '设备',
      dataIndex: 'equipmentName',
      width: 120,
    },
    {
      title: '时间',
      width: 150,
      render: (_: any, record: OperationExecution) => (
        <Space direction="vertical" size="small">
          <div style={{ fontSize: '12px' }}>开始: {record.startTime || '-'}</div>
          <div style={{ fontSize: '12px' }}>预计: {record.estimatedEndTime || '-'}</div>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={
          <Space>
            <ApartmentOutlined style={{ color: '#1677ff' }} />
            <span>{dashboard.workshopName} - {dashboard.workcenterName}</span>
            <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
          </Space>
        }
        extra={
          <Space>
            {onEdit && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(dashboard)}
              >
                编辑
              </Button>
            )}
            <Button
              size="small"
              icon={<HistoryOutlined />}
            >
              版本历史
            </Button>
            <Button
              size="small"
              icon={<CloseOutlined />}
              onClick={onClose}
            >
              关闭
            </Button>
          </Space>
        }
      >
        {/* 车间标识 */}
        <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <ApartmentIcon style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{dashboard.workshopName}</span>
          </div>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
            工作中心: {dashboard.workcenterName}
          </div>
          <Space>
            <span style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              background: statusConfig.color,
              marginRight: '8px'
            }}></span>
            <span>{statusConfig.label}</span>
          </Space>
        </div>

        {/* 统计概览 */}
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={6}>
            <Card bordered>
              <Statistic
                title="工单统计"
                value={dashboard.totalOrders}
                valueStyle={{ color: '#1677ff' }}
                prefix={<ApartmentOutlined />}
              />
              <div style={{ marginTop: '8px' }}>
                <Space size="small">
                  <Tag color="success">完成: {dashboard.completedOrders}</Tag>
                  <Tag color="processing">进行中: {dashboard.inProgressOrders}</Tag>
                </Space>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card bordered>
              <Statistic
                title="人员统计"
                value={dashboard.presentOperators}
                suffix={`/ ${dashboard.totalOperators}`}
                valueStyle={{ color: '#52c41a' }}
                prefix={<UserOutlined />}
              />
              <div style={{ marginTop: '8px' }}>
                <Tag color="error">缺勤: {dashboard.absentOperators}</Tag>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card bordered>
              <Statistic
                title="设备统计"
                value={dashboard.runningEquipment}
                suffix={`/ ${dashboard.totalEquipment}`}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
              <div style={{ marginTop: '8px' }}>
                <Space size="small">
                  <Tag>空闲: {dashboard.idleEquipment}</Tag>
                  <Tag color="warning">维护: {dashboard.maintenanceEquipment}</Tag>
                  <Tag color="default">停机: {dashboard.stoppedEquipment}</Tag>
                </Space>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card bordered>
              <Statistic
                title="今日产能"
                value={dashboard.dailyActualQty}
                suffix={`/ ${dashboard.dailyPlanQty}`}
                valueStyle={{ color: '#1677ff' }}
                prefix={<ToolOutlined />}
              />
              <div style={{ marginTop: '8px' }}>
                <Tag color="success">合格率: {dashboard.dailyQualifiedRate?.toFixed(1)}%</Tag>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 设备状态 */}
        <Card title="设备运行状态" style={{ marginBottom: '16px' }} extra={<CheckCircleOutlined style={{ color: '#1677ff' }} />}>
          <Table
            size="small"
            // Mock data for demonstration
            dataSource={[
              {
                id: 'ES-001',
                equipmentId: 'EQ001',
                equipmentName: '车床CNC-001',
                workcenterId: dashboard.workcenterId,
                status: 'RUNNING',
                temperature: 25.5,
                speed: 1500,
                efficiency: 92.5,
                currentTask: {
                  taskNo: 'TO-20260425001',
                  productName: 'VitC咀嚼片',
                  progress: 64,
                },
                runTime: 6.5,
                idleTime: 0.5,
                maintenanceTime: 0,
                alarms: [],
                updateTime: new Date().toISOString(),
              },
            ]}
            columns={equipmentColumns}
            rowKey="id"
            pagination={false}
            bordered
            scroll={{ x: 1200 }}
          />
        </Card>

        {/* 工序执行 */}
        <Card title="工序执行状态" style={{ marginBottom: '16px' }} extra={<PlayCircleOutlined style={{ color: '#1677ff' }} />}>
          <Table
            size="small"
            // Mock data for demonstration
            dataSource={[
              {
                id: 'OE-001',
                workOrderId: 'WO-001',
                workOrderNo: 'WO-20260425001',
                taskId: 'TO-001',
                taskNo: 'TO-20260425001',
                stepCode: 'OP0020',
                stepName: '车削',
                status: 'RUNNING',
                planQty: 500,
                actualQty: 320,
                qualifiedQty: 315,
                unqualifiedQty: 3,
                progress: 64,
                startTime: '2026-04-05 08:15:00',
                estimatedEndTime: '2026-04-05 14:00:00',
                operatorId: 'OP001',
                operatorName: '张三',
                equipmentId: 'EQ001',
                equipmentName: '车床CNC-001',
                updateTime: new Date().toISOString(),
              },
            ]}
            columns={operationColumns}
            rowKey="id"
            pagination={false}
            bordered
            scroll={{ x: 1200 }}
          />
        </Card>

        {/* 更新信息 */}
        <Card title="更新信息" extra={<ClockCircleOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="看板ID">
              {dashboard.id}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {dashboard.updateTime}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Card>
    </div>
  );
};

export default WorkshopDetail;
