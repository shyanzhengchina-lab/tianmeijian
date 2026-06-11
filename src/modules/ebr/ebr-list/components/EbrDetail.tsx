/**
 * EBR详情组件
 * 展示EBR完整信息、产品详情、执行情况、审批记录
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Divider, Badge, Row, Col, Statistic, Progress, Timeline } from 'antd';
import {
  CloseOutlined, EditOutlined, FileTextOutlined, ApartmentOutlined, CalendarOutlined,
  CheckCircleOutlined, StopOutlined, PlayCircleOutlined, ShoppingOutlined,
  ExclamationCircleOutlined, HistoryOutlined, WarningOutlined
} from '@ant-design/icons';
import { EBR_STATUS_MAP, EBR_TYPE_MAP } from '../types';
import type { Ebr } from '../types';

interface EbrDetailProps {
  ebr: Ebr;
  onClose: () => void;
  onEdit?: (ebr: Ebr) => void;
  onStart?: (ebr: Ebr) => void;
  onComplete?: (ebr: Ebr) => void;
  onCloseEbr?: (ebr: Ebr) => void;
  onCancel?: (ebr: Ebr) => void;
  onApprove?: (ebr: Ebr) => void;
}

const EbrDetail: React.FC<EbrDetailProps> = ({
  ebr,
  onClose,
  onEdit,
  onStart,
  onComplete,
  onCloseEbr,
  onCancel,
  onApprove,
}) => {
  const statusConfig = EBR_STATUS_MAP[ebr.status];
  const typeConfig = EBR_TYPE_MAP[ebr.ebrType];

  // 计算进度
  const progressData = {
    planQty: ebr.planQty,
    actualQty: ebr.actualQty || 0,
    qualifiedQty: ebr.qualifiedQty || 0,
    unqualifiedQty: (ebr.actualQty || 0) - (ebr.qualifiedQty || 0),
    completionRate: ebr.planQty > 0 ? ((ebr.actualQty || 0) / ebr.planQty * 100).toFixed(1) : '0',
    qualifiedRate: (ebr.actualQty || 0) > 0 ? ((ebr.qualifiedQty || 0) / (ebr.actualQty || 0) * 100).toFixed(1) : '0',
  };

  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>{ebr.ebrNo}</span>
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
                onClick={() => onEdit(ebr)}
              >
                编辑
              </Button>
            )}
            {onStart && ebr.status === 'CREATED' && (
              <Button
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => onStart(ebr)}
              >
                开始
              </Button>
            )}
            {onComplete && ebr.status === 'IN_PROGRESS' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onComplete(ebr)}
              >
                完成
              </Button>
            )}
            {onApprove && ebr.status === 'COMPLETED' && !ebr.approvedBy && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onApprove(ebr)}
              >
                审批
              </Button>
            )}
            {onCloseEbr && ['COMPLETED', 'CANCELLED'].includes(ebr.status) && (
              <Button
                size="small"
                icon={<StopOutlined />}
                onClick={() => onCloseEbr(ebr)}
              >
                关闭
              </Button>
            )}
            {onCancel && ['CREATED', 'IN_PROGRESS'].includes(ebr.status) && (
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => onCancel(ebr)}
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
        {/* EBR标识 */}
        <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <FileTextOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
          <div style={{ marginBottom: '8px' }}>
            <Space>
              <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{ebr.ebrNo}</span>
              <Tag color={typeConfig.color} style={{ fontSize: '14px', padding: '4px 12px', marginLeft: '8px' }}>
                {typeConfig.label}
              </Tag>
            </Space>
          </div>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
            批号: {ebr.batchNo}
          </div>
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            {ebr.productName} - {ebr.productSpec}
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
            <Col span={6}>
              <Statistic
                title="合格数量"
                value={progressData.qualifiedQty}
                suffix="件"
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="不合格数量"
                value={progressData.unqualifiedQty}
                suffix="件"
                valueStyle={{ color: '#faad14' }}
                prefix={<WarningOutlined />}
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
            <Descriptions.Item label="EBR编号" span={1}>
              {ebr.ebrNo}
            </Descriptions.Item>
            <Descriptions.Item label="批号" span={1}>
              {ebr.batchNo}
            </Descriptions.Item>

            <Descriptions.Item label="EBR类型" span={1}>
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

            <Descriptions.Item label="产品编码" span={1}>
              {ebr.productCode}
            </Descriptions.Item>
            <Descriptions.Item label="产品名称" span={1}>
              {ebr.productName}
            </Descriptions.Item>

            <Descriptions.Item label="产品规格" span={2}>
              {ebr.productSpec}
            </Descriptions.Item>

            <Descriptions.Item label="计划数量" span={1}>
              {ebr.planQty.toLocaleString()} 件
            </Descriptions.Item>
            <Descriptions.Item label="实际数量" span={1}>
              {ebr.actualQty ? ebr.actualQty.toLocaleString() : '-'} 件
            </Descriptions.Item>

            <Descriptions.Item label="合格数量" span={1}>
              {ebr.qualifiedQty ? ebr.qualifiedQty.toLocaleString() : '-'} 件
            </Descriptions.Item>

            <Descriptions.Item label="计划开始日期" span={1}>
              {ebr.planStartDate}
            </Descriptions.Item>
            <Descriptions.Item label="计划结束日期" span={1}>
              {ebr.planEndDate}
            </Descriptions.Item>

            <Descriptions.Item label="实际开始日期" span={1}>
              {ebr.actualStartDate || '待开始'}
            </Descriptions.Item>
            <Descriptions.Item label="实际结束日期" span={1}>
              {ebr.actualEndDate || '进行中'}
            </Descriptions.Item>

            <Descriptions.Item label="审批人" span={1}>
              {ebr.approvedBy || '未审批'}
            </Descriptions.Item>
            <Descriptions.Item label="审批时间" span={1}>
              {ebr.approvalTime || '-'}
            </Descriptions.Item>

            <Descriptions.Item label="创建人" span={1}>
              {ebr.createdBy}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={1}>
              {ebr.createdAt}
            </Descriptions.Item>

            <Descriptions.Item label="更新时间" span={1}>
              {ebr.updatedAt}
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={2}>
              {ebr.remark || '无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 流程记录 */}
        <Card title="流程记录" extra={<HistoryOutlined style={{ color: '#1677ff' }} />}>
          <Timeline
            items={[
              {
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {ebr.createdAt} - EBR创建
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      电子批记录已创建，状态为已创建
                    </div>
                  </div>
                ),
              },
              ...(ebr.actualStartDate ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {ebr.actualStartDate} - 执行开始
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      电子批记录开始执行
                    </div>
                  </div>
                ),
              }] : []),
              ...(ebr.actualEndDate ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {ebr.actualEndDate} - 执行完成
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      电子批记录执行完成
                    </div>
                  </div>
                ),
              }] : []),
              ...(ebr.approvalTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {ebr.approvalTime} - 审批通过
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      审批人: {ebr.approvedBy}
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

export default EbrDetail;
