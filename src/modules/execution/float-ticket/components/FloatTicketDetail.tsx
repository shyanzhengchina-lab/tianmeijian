/**
 * 批生产浮票详情组件
 * 展示浮票完整信息、执行情况、流转记录、质检信息
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Badge, Row, Col, Statistic, Progress, Timeline, Divider, Steps } from 'antd';
import {
  CloseOutlined, EditOutlined, FileTextOutlined, ApartmentOutlined, CalendarOutlined,
  CheckCircleOutlined, StopOutlined, PlayCircleOutlined, ShoppingOutlined,
  ExclamationCircleOutlined, HistoryOutlined, WarningOutlined, RocketOutlined,
  SafetyOutlined, ToolOutlined, TeamOutlined
} from '@ant-design/icons';
import { FLOAT_TICKET_STATUS_MAP, FLOAT_TICKET_TYPE_MAP, QC_RESULT_MAP } from '../types';
import type { FloatTicket } from '../types';


interface FloatTicketDetailProps {
  floatTicket: FloatTicket;
  onClose: () => void;
  onEdit?: (floatTicket: FloatTicket) => void;
  onRelease?: (floatTicket: FloatTicket) => void;
  onStart?: (floatTicket: FloatTicket) => void;
  onComplete?: (floatTicket: FloatTicket) => void;
  onCancel?: (floatTicket: FloatTicket) => void;
  onQc?: (floatTicket: FloatTicket) => void;
}

const FloatTicketDetail: React.FC<FloatTicketDetailProps> = ({
  floatTicket,
  onClose,
  onEdit,
  onRelease,
  onStart,
  onComplete,
  onCancel,
  onQc,
}) => {
  const statusConfig = FLOAT_TICKET_STATUS_MAP[floatTicket.status];
  const typeConfig = FLOAT_TICKET_TYPE_MAP[floatTicket.ticketType];

  // 计算进度
  const progressData = {
    planQty: floatTicket.planQty,
    actualQty: floatTicket.actualQty,
    qualifiedQty: floatTicket.qualifiedQty,
    unqualifiedQty: floatTicket.unqualifiedQty,
    scrapQty: floatTicket.scrapQty,
    completionRate: floatTicket.planQty > 0 ? (floatTicket.actualQty / floatTicket.planQty * 100).toFixed(1) : '0',
    qualifiedRate: floatTicket.actualQty > 0 ? (floatTicket.qualifiedQty / floatTicket.actualQty * 100).toFixed(1) : '0',
    processProgress: floatTicket.processPath?.length > 0
      ? ((floatTicket.completedSteps?.length || 0) / floatTicket.processPath.length * 100).toFixed(0)
      : '0',
  };

  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>{floatTicket.ticketNo}</span>
            <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
            <Tag color={typeConfig.color}>{typeConfig.label}</Tag>
          </Space>
        }
        extra={
          <Space>
            {onEdit && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(floatTicket)}
                disabled={floatTicket.status !== 'CREATED'}
              >
                编辑
              </Button>
            )}
            {onRelease && floatTicket.status === 'CREATED' && (
              <Button
                size="small"
                icon={<RocketOutlined />}
                onClick={() => onRelease(floatTicket)}
              >
                发布
              </Button>
            )}
            {onStart && floatTicket.status === 'RELEASED' && (
              <Button
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => onStart(floatTicket)}
              >
                开始
              </Button>
            )}
            {onComplete && floatTicket.status === 'IN_PROCESS' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onComplete(floatTicket)}
              >
                完成
              </Button>
            )}
            {onQc && floatTicket.status === 'QC_PENDING' && (
              <Button
                size="small"
                icon={<SafetyOutlined />}
                onClick={() => onQc(floatTicket)}
              >
                质检
              </Button>
            )}
            {onCancel && ['CREATED', 'RELEASED', 'IN_PROCESS'].includes(floatTicket.status) && (
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => onCancel(floatTicket)}
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
        {/* 浮票标识 */}
        <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <FileTextOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{floatTicket.ticketNo}</span>
            <Tag color={typeConfig.color} style={{ fontSize: '14px', padding: '4px 12px', marginLeft: '12px' }}>
              {typeConfig.label}
            </Tag>
          </div>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
            批号: {floatTicket.batchNo} / 子批号: {floatTicket.lotNo}
          </div>
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            {floatTicket.productName} - {floatTicket.productSpec}
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

        {/* 生产进度 */}
        <Card title="生产进度" style={{ marginBottom: '16px' }} extra={<ShoppingOutlined style={{ color: '#1677ff' }} />}>
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

        {/* 工序流转进度 */}
        {floatTicket.processPath && floatTicket.processPath.length > 0 && (
          <Card title="工序流转进度" style={{ marginBottom: '16px' }} extra={<ToolOutlined style={{ color: '#1677ff' }} />}>
            <Steps
              current={floatTicket.completedSteps?.length || 0}
              size="small"
              items={floatTicket.processPath.map((step, index) => {
                const isCompleted = floatTicket.completedSteps?.includes(step);
                const isCurrent = (floatTicket.completedSteps?.length || 0) === index;
                return {
                  key: step,
                  title: step,
                  status: (isCompleted ? 'finish' : isCurrent ? 'process' : 'wait') as any,
                };
              })}
            />
          </Card>
        )}

        {/* 基本信息 */}
        <Card title="基本信息" style={{ marginBottom: '16px' }} extra={<FileTextOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="浮票号" span={1}>
              {floatTicket.ticketNo}
            </Descriptions.Item>
            <Descriptions.Item label="工单号" span={1}>
              {floatTicket.workOrderNo}
            </Descriptions.Item>

            <Descriptions.Item label="生产订单" span={1}>
              {floatTicket.productionOrderNo}
            </Descriptions.Item>
            <Descriptions.Item label="浮票类型" span={1}>
              <Tag color={typeConfig.color}>{typeConfig.label}</Tag>
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
              {floatTicket.priority || '-'}
            </Descriptions.Item>

            <Descriptions.Item label="产品编码" span={1}>
              {floatTicket.productCode}
            </Descriptions.Item>
            <Descriptions.Item label="产品名称" span={1}>
              {floatTicket.productName}
            </Descriptions.Item>

            <Descriptions.Item label="产品规格" span={2}>
              {floatTicket.productSpec}
            </Descriptions.Item>

            <Descriptions.Item label="批号" span={1}>
              {floatTicket.batchNo}
            </Descriptions.Item>
            <Descriptions.Item label="子批号" span={1}>
              {floatTicket.lotNo}
            </Descriptions.Item>

            <Descriptions.Item label="计划数量" span={1}>
              {floatTicket.planQty.toLocaleString()} 件
            </Descriptions.Item>
            <Descriptions.Item label="实际数量" span={1}>
              {floatTicket.actualQty.toLocaleString()} 件
            </Descriptions.Item>

            <Descriptions.Item label="合格数量" span={1}>
              {floatTicket.qualifiedQty.toLocaleString()} 件
            </Descriptions.Item>
            <Descriptions.Item label="不合格数量" span={1}>
              {floatTicket.unqualifiedQty.toLocaleString()} 件
            </Descriptions.Item>

            <Descriptions.Item label="报废数量" span={1}>
              {floatTicket.scrapQty.toLocaleString()} 件
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={2}>
              {floatTicket.remark || '无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 流转信息 */}
        <Card title="流转信息" style={{ marginBottom: '16px' }} extra={<TeamOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="当前工作中心" span={1}>
              {floatTicket.currentWorkcenter || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="当前操作员" span={1}>
              {floatTicket.currentOperator || '-'}
            </Descriptions.Item>

            <Descriptions.Item label="工序路径" span={2}>
              <div>
                {floatTicket.processPath?.map((step, index) => (
                  <Tag key={index} style={{ margin: '4px' }}>{step}</Tag>
                ))}
              </div>
            </Descriptions.Item>

            <Descriptions.Item label="已完成工序" span={2}>
              <div>
                {floatTicket.completedSteps?.length ? (
                  floatTicket.completedSteps.map((step, index) => (
                    <Tag key={index} color="green" style={{ margin: '4px' }}>{step}</Tag>
                  ))
                ) : (
                  <span style={{ color: '#999' }}>无</span>
                )}
              </div>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 时间信息 */}
        <Card title="时间信息" style={{ marginBottom: '16px' }} extra={<CalendarOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="发布时间" span={1}>
              {floatTicket.releaseTime || '未发布'}
            </Descriptions.Item>
            <Descriptions.Item label="开始时间" span={1}>
              {floatTicket.startTime || '未开始'}
            </Descriptions.Item>

            <Descriptions.Item label="结束时间" span={1}>
              {floatTicket.endTime || '未结束'}
            </Descriptions.Item>

            <Descriptions.Item label="创建时间" span={1}>
              {floatTicket.createdAt}
            </Descriptions.Item>

            <Descriptions.Item label="更新时间" span={1}>
              {floatTicket.updatedAt}
            </Descriptions.Item>

            <Descriptions.Item label="创建人" span={1}>
              {floatTicket.createdBy}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 质检信息 */}
        <Card title="质检信息" style={{ marginBottom: '16px' }} extra={<SafetyOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="质检结果" span={1}>
              {floatTicket.qcResult ? (
                <span style={{
                  color: QC_RESULT_MAP[floatTicket.qcResult]?.color,
                  fontWeight: 'bold'
                }}>
                  {QC_RESULT_MAP[floatTicket.qcResult]?.label || floatTicket.qcResult}
                </span>
              ) : '待质检'}
            </Descriptions.Item>
            <Descriptions.Item label="检验员" span={1}>
              {floatTicket.inspector || '-'}
            </Descriptions.Item>

            <Descriptions.Item label="检验时间" span={1}>
              {floatTicket.inspectionTime || '-'}
            </Descriptions.Item>

            <Descriptions.Item label="质检详情" span={2}>
              {floatTicket.qcResultDetails || '-'}
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
                      {floatTicket.createdAt} - 浮票创建
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      批生产浮票已创建
                    </div>
                  </div>
                ),
              },
              ...(floatTicket.releaseTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {floatTicket.releaseTime} - 浮票发布
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      批生产浮票已发布，可以开始生产
                    </div>
                  </div>
                ),
              }] : []),
              ...(floatTicket.startTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {floatTicket.startTime} - 生产开始
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      批生产浮票开始执行
                    </div>
                  </div>
                ),
              }] : []),
              ...(floatTicket.endTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {floatTicket.endTime} - 生产完成
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      批生产浮票已完成
                    </div>
                  </div>
                ),
              }] : []),
              ...(floatTicket.inspectionTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {floatTicket.inspectionTime} - 质检完成
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      检验员: {floatTicket.inspector}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      质检结果: {QC_RESULT_MAP[floatTicket.qcResult!]?.label}
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

export default FloatTicketDetail;
