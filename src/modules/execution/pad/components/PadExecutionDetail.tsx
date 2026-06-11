/**
 * 工序执行任务详情组件
 * 展示执行任务完整信息、执行进度、工艺参数、操作记录
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Badge, Row, Col, Statistic, Progress, Timeline, Divider } from 'antd';
import {
  CloseOutlined, EditOutlined, FileTextOutlined, ApartmentOutlined, CalendarOutlined,
  CheckCircleOutlined, StopOutlined, PlayCircleOutlined, ShoppingOutlined,
  ExclamationCircleOutlined, HistoryOutlined, WarningOutlined,
  PauseCircleOutlined, PlaySquareOutlined, ToolOutlined, TeamOutlined, UserOutlined
} from '@ant-design/icons';
import { EXECUTION_STATUS_MAP, EXECUTION_MODE_MAP } from '../types';
import type { PadExecutionTask } from '../types';

interface PadExecutionDetailProps {
  padTask: PadExecutionTask;
  onClose: () => void;
  onEdit?: (padTask: PadExecutionTask) => void;
  onStart?: (padTask: PadExecutionTask) => void;
  onPause?: (padTask: PadExecutionTask) => void;
  onResume?: (padTask: PadExecutionTask) => void;
  onComplete?: (padTask: PadExecutionTask) => void;
  onCancel?: (padTask: PadExecutionTask) => void;
}

const PadExecutionDetail: React.FC<PadExecutionDetailProps> = ({
  padTask,
  onClose,
  onEdit,
  onStart,
  onPause,
  onResume,
  onComplete,
  onCancel,
}) => {
  const statusConfig = EXECUTION_STATUS_MAP[padTask.status];
  const modeConfig = EXECUTION_MODE_MAP[padTask.executionMode];

  // 计算进度
  const progressData = {
    planQty: padTask.planQty,
    actualQty: padTask.actualQty,
    qualifiedQty: padTask.qualifiedQty,
    unqualifiedQty: padTask.unqualifiedQty,
    scrapQty: padTask.scrapQty,
    completionRate: padTask.planQty > 0 ? (padTask.actualQty / padTask.planQty * 100).toFixed(1) : '0',
    qualifiedRate: padTask.actualQty > 0 ? (padTask.qualifiedQty / padTask.actualQty * 100).toFixed(1) : '0',
    progress: padTask.progress,
  };

  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>{padTask.taskNo}</span>
            <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
            <Tag color={modeConfig.color}>{modeConfig.label}</Tag>
          </Space>
        }
        extra={
          <Space>
            {onEdit && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(padTask)}
                disabled={padTask.status !== 'PENDING'}
              >
                编辑
              </Button>
            )}
            {onStart && padTask.status === 'PENDING' && (
              <Button
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => onStart(padTask)}
              >
                开始
              </Button>
            )}
            {onPause && padTask.status === 'RUNNING' && (
              <Button
                size="small"
                icon={<PauseCircleOutlined />}
                onClick={() => onPause(padTask)}
              >
                暂停
              </Button>
            )}
            {onResume && padTask.status === 'PAUSED' && (
              <Button
                size="small"
                icon={<PlaySquareOutlined />}
                onClick={() => onResume(padTask)}
              >
                恢复
              </Button>
            )}
            {onComplete && padTask.status === 'RUNNING' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onComplete(padTask)}
              >
                完成
              </Button>
            )}
            {onCancel && ['PENDING', 'RUNNING', 'PAUSED'].includes(padTask.status) && (
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => onCancel(padTask)}
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
        {/* 执行任务标识 */}
        <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <ToolOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{padTask.taskNo}</span>
            <Tag color={modeConfig.color} style={{ fontSize: '14px', padding: '4px 12px', marginLeft: '12px' }}>
              {modeConfig.label}
            </Tag>
          </div>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
            {padTask.stepName} - {padTask.productName}
          </div>
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            {padTask.productSpec}
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
            <Col span={8}>
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
            <Col span={8}>
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
            <Col span={8}>
              <div style={{ marginBottom: '8px', fontSize: '13px', color: '#666' }}>
                执行进度: {progressData.progress}%
              </div>
              <Progress
                percent={progressData.progress}
                status={Number(progressData.progress) === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#1677ff',
                  '100%': '#52c41a',
                }}
              />
            </Col>
          </Row>
        </Card>

        {/* 基本信息 */}
        <Card title="基本信息" style={{ marginBottom: '16px' }} extra={<FileTextOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="任务编号" span={1}>
              {padTask.taskNo}
            </Descriptions.Item>
            <Descriptions.Item label="工单号" span={1}>
              {padTask.workOrderNo}
            </Descriptions.Item>

            <Descriptions.Item label="执行模式" span={1}>
              <Tag color={modeConfig.color}>{modeConfig.label}</Tag>
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

            <Descriptions.Item label="产品编码" span={1}>
              {padTask.productCode}
            </Descriptions.Item>
            <Descriptions.Item label="产品名称" span={1}>
              {padTask.productName}
            </Descriptions.Item>

            <Descriptions.Item label="产品规格" span={2}>
              {padTask.productSpec}
            </Descriptions.Item>

            <Descriptions.Item label="工序编码" span={1}>
              {padTask.stepCode}
            </Descriptions.Item>
            <Descriptions.Item label="工序名称" span={1}>
              {padTask.stepName}
            </Descriptions.Item>

            <Descriptions.Item label="计划数量" span={1}>
              {padTask.planQty.toLocaleString()} 件
            </Descriptions.Item>
            <Descriptions.Item label="实际数量" span={1}>
              {padTask.actualQty.toLocaleString()} 件
            </Descriptions.Item>

            <Descriptions.Item label="合格数量" span={1}>
              {padTask.qualifiedQty.toLocaleString()} 件
            </Descriptions.Item>
            <Descriptions.Item label="不合格数量" span={1}>
              {padTask.unqualifiedQty.toLocaleString()} 件
            </Descriptions.Item>

            <Descriptions.Item label="报废数量" span={1}>
              {padTask.scrapQty.toLocaleString()} 件
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={2}>
              {padTask.remark || '无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 分配信息 */}
        <Card title="分配信息" style={{ marginBottom: '16px' }} extra={<TeamOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="工作中心" span={1}>
              {padTask.workcenterName}
            </Descriptions.Item>
            <Descriptions.Item label="工作中心ID" span={1}>
              {padTask.workcenterId}
            </Descriptions.Item>

            <Descriptions.Item label="设备" span={1}>
              {padTask.equipmentName}
            </Descriptions.Item>
            <Descriptions.Item label="设备ID" span={1}>
              {padTask.equipmentId}
            </Descriptions.Item>

            <Descriptions.Item label="操作员" span={1}>
              {padTask.operatorName}
            </Descriptions.Item>
            <Descriptions.Item label="操作员ID" span={1}>
              {padTask.operatorId}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 时间信息 */}
        <Card title="时间信息" style={{ marginBottom: '16px' }} extra={<CalendarOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="计划开始时间" span={1}>
              {padTask.planStartTime}
            </Descriptions.Item>
            <Descriptions.Item label="计划结束时间" span={1}>
              {padTask.planEndTime}
            </Descriptions.Item>

            <Descriptions.Item label="实际开始时间" span={1}>
              {padTask.actualStartTime || '未开始'}
            </Descriptions.Item>
            <Descriptions.Item label="实际结束时间" span={1}>
              {padTask.actualEndTime || '未结束'}
            </Descriptions.Item>

            <Descriptions.Item label="预计结束时间" span={1}>
              {padTask.estimatedEndTime || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 工艺参数 */}
        <Card title="工艺参数" style={{ marginBottom: '16px' }} extra={<ToolOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="温度" span={1}>
              {padTask.temperature !== undefined ? padTask.temperature + '℃' : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="湿度" span={1}>
              {padTask.humidity !== undefined ? padTask.humidity + '%' : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="压力" span={1}>
              {padTask.pressure !== undefined ? padTask.pressure + 'Pa' : '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 系统信息 */}
        <Card title="系统信息" extra={<UserOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="创建人" span={1}>
              {padTask.createdBy}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={1}>
              {padTask.createdAt}
            </Descriptions.Item>

            <Descriptions.Item label="更新时间" span={1}>
              {padTask.updatedAt}
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
                      {padTask.createdAt} - 任务创建
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      工序执行任务已创建，状态为待执行
                    </div>
                  </div>
                ),
              },
              ...(padTask.actualStartTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {padTask.actualStartTime} - 执行开始
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      工序执行任务开始执行
                    </div>
                  </div>
                ),
              }] : []),
              ...(padTask.actualEndTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {padTask.actualEndTime} - 执行完成
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      工序执行任务已完成
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

export default PadExecutionDetail;
