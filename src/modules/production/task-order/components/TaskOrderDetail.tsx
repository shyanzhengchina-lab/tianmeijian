/**
 * 生产任务单详情组件
 * 展示任务单完整信息、执行情况、质量信息、操作记录
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Badge, Row, Col, Statistic, Progress, Timeline, Divider } from 'antd';
import {
  CloseOutlined, EditOutlined, FileTextOutlined, ApartmentOutlined, CalendarOutlined,
  CheckCircleOutlined, StopOutlined, PlayCircleOutlined, ShoppingOutlined,
  ExclamationCircleOutlined, HistoryOutlined, WarningOutlined, TeamOutlined,
  ToolOutlined, UserOutlined, PauseCircleOutlined, PlaySquareOutlined
} from '@ant-design/icons';
import { TO_STATUS_MAP, TO_PRIORITY_MAP } from '../types';
import type { TaskOrder } from '../types';

interface TaskOrderDetailProps {
  taskOrder: TaskOrder;
  onClose: () => void;
  onEdit?: (taskOrder: TaskOrder) => void;
  onAssign?: (taskOrder: TaskOrder) => void;
  onStart?: (taskOrder: TaskOrder) => void;
  onComplete?: (taskOrder: TaskOrder) => void;
  onPause?: (taskOrder: TaskOrder) => void;
  onResume?: (taskOrder: TaskOrder) => void;
  onCancel?: (taskOrder: TaskOrder) => void;
}

const TaskOrderDetail: React.FC<TaskOrderDetailProps> = ({
  taskOrder,
  onClose,
  onEdit,
  onAssign,
  onStart,
  onComplete,
  onPause,
  onResume,
  onCancel,
}) => {
  const statusConfig = TO_STATUS_MAP[taskOrder.status];
  const priorityConfig = TO_PRIORITY_MAP[taskOrder.priority];

  // 计算进度
  const progressData = {
    planQty: taskOrder.planQty,
    actualQty: taskOrder.actualQty,
    qualifiedQty: taskOrder.qualifiedQty,
    unqualifiedQty: taskOrder.unqualifiedQty,
    scrapQty: taskOrder.scrapQty,
    completionRate: taskOrder.planQty > 0 ? (taskOrder.actualQty / taskOrder.planQty * 100).toFixed(1) : '0',
    qualifiedRate: taskOrder.actualQty > 0 ? (taskOrder.qualifiedQty / taskOrder.actualQty * 100).toFixed(1) : '0',
  };

  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>{taskOrder.taskNo}</span>
            <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
            <Tag color={priorityConfig.color}>{priorityConfig.label}</Tag>
          </Space>
        }
        extra={
          <Space>
            {onEdit && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(taskOrder)}
              >
                编辑
              </Button>
            )}
            {onAssign && taskOrder.status === 'PENDING' && (
              <Button
                size="small"
                icon={<TeamOutlined />}
                onClick={() => onAssign(taskOrder)}
              >
                分配
              </Button>
            )}
            {onStart && taskOrder.status === 'ASSIGNED' && (
              <Button
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => onStart(taskOrder)}
              >
                开始
              </Button>
            )}
            {onComplete && taskOrder.status === 'IN_PROGRESS' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onComplete(taskOrder)}
              >
                完成
              </Button>
            )}
            {onPause && taskOrder.status === 'IN_PROGRESS' && (
              <Button
                size="small"
                icon={<PauseCircleOutlined />}
                onClick={() => onPause(taskOrder)}
              >
                暂停
              </Button>
            )}
            {onResume && taskOrder.status === 'PAUSED' && (
              <Button
                size="small"
                icon={<PlaySquareOutlined />}
                onClick={() => onResume(taskOrder)}
              >
                恢复
              </Button>
            )}
            {onCancel && ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(taskOrder.status) && (
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => onCancel(taskOrder)}
              >
                取消
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
        {/* 任务标识 */}
        <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <FileTextOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{taskOrder.taskNo}</span>
            <Tag color={priorityConfig.color} style={{ fontSize: '14px', padding: '4px 12px', marginLeft: '12px' }}>
              {priorityConfig.label}
            </Tag>
          </div>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
            {taskOrder.taskName}
          </div>
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            {taskOrder.productName} - {taskOrder.productSpec}
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

        {/* 执行进度 */}
        <Card title="执行进度" style={{ marginBottom: '16px' }} extra={<ShoppingOutlined style={{ color: '#1677ff' }} />}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="计划数量"
                value={progressData.planQty}
                suffix="件"
                valueStyle={{ color: '#1677ff' }}
                prefix={<ShoppingOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="实际数量"
                value={progressData.actualQty}
                suffix="件"
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="合格"
                value={progressData.qualifiedQty}
                suffix="件"
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="不合格"
                value={progressData.unqualifiedQty}
                suffix="件"
                valueStyle={{ color: '#faad14' }}
                prefix={<WarningOutlined />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="报废"
                value={progressData.scrapQty}
                suffix="件"
                valueStyle={{ color: '#cf1322' }}
                prefix={<StopOutlined />}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '16px' }}>
            <Col span={12}>
              <div style={{ marginBottom: '8px', fontSize: '13px', color: '#666' }}>
                完成率: {progressData.completionRate}%
              </div>
              <Progress
                percent={parseFloat(progressData.completionRate)}
                status={parseFloat(progressData.completionRate) === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#1677ff',
                  '100%': '#52c41a',
                }}
              />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: '8px', fontSize: '13px', color: '#666' }}>
                合格率: {progressData.qualifiedRate}%
              </div>
              <Progress
                percent={parseFloat(progressData.qualifiedRate)}
                status={parseFloat(progressData.qualifiedRate) >= 95 ? 'success' : parseFloat(progressData.qualifiedRate) >= 90 ? 'active' : 'exception'}
                strokeColor={{
                  '0%': '#faad14',
                  '100%': '#52c41a',
                }}
              />
            </Col>
          </Row>
        </Card>

        {/* 基本信息 */}
        <Card title="基本信息" style={{ marginBottom: '16px' }} extra={<FileTextOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="任务单号" span={1}>
              {taskOrder.taskNo}
            </Descriptions.Item>
            <Descriptions.Item label="工单号" span={1}>
              {taskOrder.woNo || '无'}
            </Descriptions.Item>

            <Descriptions.Item label="生产订单" span={1}>
              {taskOrder.poNo || '无'}
            </Descriptions.Item>
            <Descriptions.Item label="任务类型" span={1}>
              {taskOrder.taskType}
            </Descriptions.Item>

            <Descriptions.Item label="状态" span={1}>
              <Space>
                <span style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  background: statusConfig.color,
                }}></span>
                <span>{statusConfig.label}</span>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="优先级" span={1}>
              <span style={{ color: priorityConfig.color, fontWeight: 'bold' }}>
                {priorityConfig.label}
              </span>
            </Descriptions.Item>

            <Descriptions.Item label="产品编码" span={1}>
              {taskOrder.productCode}
            </Descriptions.Item>
            <Descriptions.Item label="产品名称" span={1}>
              {taskOrder.productName}
            </Descriptions.Item>

            <Descriptions.Item label="产品规格" span={2}>
              {taskOrder.productSpec}
            </Descriptions.Item>

            <Descriptions.Item label="任务名称" span={2}>
              {taskOrder.taskName}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 工序和分配信息 */}
        <Card title="工序和分配信息" style={{ marginBottom: '16px' }} extra={<ToolOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="工序编码" span={1}>
              {taskOrder.stepCode}
            </Descriptions.Item>
            <Descriptions.Item label="工序名称" span={1}>
              {taskOrder.stepName}
            </Descriptions.Item>

            <Descriptions.Item label="工作中心" span={1}>
              {taskOrder.workcenterName || '未分配'}
            </Descriptions.Item>
            <Descriptions.Item label="班组" span={1}>
              {taskOrder.teamName || '未分配'}
            </Descriptions.Item>

            <Descriptions.Item label="设备" span={1}>
              {taskOrder.equipmentName || '未分配'}
            </Descriptions.Item>
            <Descriptions.Item label="操作员" span={1}>
              {taskOrder.operatorName || '未分配'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 时间信息 */}
        <Card title="时间信息" style={{ marginBottom: '16px' }} extra={<CalendarOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="计划开始时间" span={1}>
              {taskOrder.planStartTime}
            </Descriptions.Item>
            <Descriptions.Item label="计划结束时间" span={1}>
              {taskOrder.planEndTime}
            </Descriptions.Item>

            <Descriptions.Item label="实际开始时间" span={1}>
              {taskOrder.actualStartTime || '未开始'}
            </Descriptions.Item>
            <Descriptions.Item label="实际结束时间" span={1}>
              {taskOrder.actualEndTime || '未结束'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 质量信息 */}
        <Card title="质量信息" style={{ marginBottom: '16px' }} extra={<ExclamationCircleOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="质检状态" span={1}>
              {taskOrder.qStatus || '未质检'}
            </Descriptions.Item>
            <Descriptions.Item label="质检结果" span={1}>
              {taskOrder.qResult || '待质检'}
            </Descriptions.Item>

            <Descriptions.Item label="实际数量" span={1}>
              {taskOrder.actualQty.toLocaleString()} 件
            </Descriptions.Item>
            <Descriptions.Item label="合格数量" span={1}>
              {taskOrder.qualifiedQty.toLocaleString()} 件
            </Descriptions.Item>

            <Descriptions.Item label="不合格数量" span={1}>
              {taskOrder.unqualifiedQty.toLocaleString()} 件
            </Descriptions.Item>
            <Descriptions.Item label="报废数量" span={1}>
              {taskOrder.scrapQty.toLocaleString()} 件
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 系统信息 */}
        <Card title="系统信息" extra={<UserOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="创建人" span={1}>
              {taskOrder.createdBy}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={1}>
              {taskOrder.createdAt}
            </Descriptions.Item>

            <Descriptions.Item label="更新时间" span={1}>
              {taskOrder.updatedAt}
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={2}>
              {taskOrder.remark || '无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 流程记录 */}
        <Divider />
        <Card title="流程记录" extra={<HistoryOutlined style={{ color: '#1677ff' }} />}>
          <Timeline
            items={[
              {
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {taskOrder.createdAt} - 任务单创建
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      生产任务单已创建，状态为待分配
                    </div>
                  </div>
                ),
              },
              ...(taskOrder.actualStartTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {taskOrder.actualStartTime} - 开始执行
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      生产任务单开始执行
                    </div>
                  </div>
                ),
              }] : []),
              ...(taskOrder.actualEndTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {taskOrder.actualEndTime} - 任务完成
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      生产任务单已完成
                    </div>
                  </div>
                ),
              }] : []),
            ]}
          />
        </Card>
      </Card>
    </div>
  );
};

export default TaskOrderDetail;
