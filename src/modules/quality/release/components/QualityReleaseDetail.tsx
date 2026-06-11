/**
 * 质量放行单详情组件
 * 展示放行单完整信息、审批信息、流程记录
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Badge, Row, Col, Timeline, Divider } from 'antd';
import {
  CloseOutlined, EditOutlined, FileTextOutlined, ApartmentOutlined, CalendarOutlined,
  CheckCircleOutlined, StopOutlined, SafetyOutlined, HistoryOutlined,
  UserOutlined
} from '@ant-design/icons';
import { RELEASE_STATUS_MAP, RELEASE_TYPE_MAP } from '../types';
import type { QualityRelease } from '../types';

interface QualityReleaseDetailProps {
  qualityRelease: QualityRelease;
  onClose: () => void;
  onEdit?: (qualityRelease: QualityRelease) => void;
  onApprove?: (qualityRelease: QualityRelease) => void;
  onReject?: (qualityRelease: QualityRelease) => void;
  onCancel?: (qualityRelease: QualityRelease) => void;
}

const QualityReleaseDetail: React.FC<QualityReleaseDetailProps> = ({
  qualityRelease,
  onClose,
  onEdit,
  onApprove,
  onReject,
  onCancel,
}) => {
  const statusConfig = RELEASE_STATUS_MAP[qualityRelease.status];
  const typeConfig = RELEASE_TYPE_MAP[qualityRelease.releaseType];

  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>{qualityRelease.releaseNo}</span>
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
                onClick={() => onEdit(qualityRelease)}
                disabled={qualityRelease.status !== 'PENDING'}
              >
                编辑
              </Button>
            )}
            {onApprove && qualityRelease.status === 'PENDING' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onApprove(qualityRelease)}
              >
                批准
              </Button>
            )}
            {onReject && qualityRelease.status === 'PENDING' && (
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => onReject(qualityRelease)}
              >
                拒绝
              </Button>
            )}
            {onCancel && qualityRelease.status === 'PENDING' && (
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => onCancel(qualityRelease)}
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
        {/* 放行单标识 */}
        <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <SafetyOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{qualityRelease.releaseNo}</span>
            <Tag color={typeConfig.color} style={{ fontSize: '14px', padding: '4px 12px', marginLeft: '12px' }}>
              {typeConfig.label}
            </Tag>
          </div>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
            批号: {qualityRelease.batchNo} - 数量: {qualityRelease.qty}
          </div>
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            {qualityRelease.productName} - {qualityRelease.productSpec}
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

        {/* 基本信息 */}
        <Card title="基本信息" style={{ marginBottom: '16px' }} extra={<FileTextOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="放行单号" span={1}>
              {qualityRelease.releaseNo}
            </Descriptions.Item>
            <Descriptions.Item label="质检单号" span={1}>
              {qualityRelease.inspectionNo || '无'}
            </Descriptions.Item>

            <Descriptions.Item label="放行类型" span={1}>
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
              {qualityRelease.productCode}
            </Descriptions.Item>
            <Descriptions.Item label="产品名称" span={1}>
              {qualityRelease.productName}
            </Descriptions.Item>

            <Descriptions.Item label="产品规格" span={2}>
              {qualityRelease.productSpec}
            </Descriptions.Item>

            <Descriptions.Item label="批号" span={1}>
              {qualityRelease.batchNo}
            </Descriptions.Item>
            <Descriptions.Item label="子批号" span={1}>
              {qualityRelease.lotNo || '-'}
            </Descriptions.Item>

            <Descriptions.Item label="数量" span={1}>
              {qualityRelease.qty.toLocaleString()} 件
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={1}>
              {qualityRelease.remark || '无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 审批信息 */}
        {qualityRelease.status !== 'PENDING' && (
          <Card title="审批信息" style={{ marginBottom: '16px' }} extra={<SafetyOutlined style={{ color: '#1677ff' }} />}>
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="申请人" span={1}>
                {qualityRelease.requester}
              </Descriptions.Item>
              <Descriptions.Item label="批准人" span={1}>
                {qualityRelease.approver || '-'}
              </Descriptions.Item>

              {qualityRelease.status === 'APPROVED' && (
                <>
                  <Descriptions.Item label="批准时间" span={1}>
                    {qualityRelease.approvalTime || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="完成时间" span={1}>
                    {qualityRelease.completeTime || '-'}
                  </Descriptions.Item>
                </>
              )}
              {qualityRelease.status === 'REJECTED' && (
                <Descriptions.Item label="拒绝原因" span={2}>
                  {qualityRelease.rejectReason || '-'}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}

        {/* 时间信息 */}
        <Card title="时间信息" style={{ marginBottom: '16px' }} extra={<CalendarOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="申请时间" span={1}>
              {qualityRelease.requestTime}
            </Descriptions.Item>

            {qualityRelease.approvalTime && (
              <Descriptions.Item label="批准时间" span={1}>
                {qualityRelease.approvalTime}
              </Descriptions.Item>
            )}

            {qualityRelease.completeTime && (
              <Descriptions.Item label="完成时间" span={1}>
                {qualityRelease.completeTime}
              </Descriptions.Item>
            )}

            <Descriptions.Item label="创建人" span={1}>
              {qualityRelease.createdBy}
            </Descriptions.Item>

            <Descriptions.Item label="创建时间" span={1}>
              {qualityRelease.createdAt}
            </Descriptions.Item>

            <Descriptions.Item label="更新时间" span={1}>
              {qualityRelease.updatedAt}
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
                      {qualityRelease.createdAt} - 放行单创建
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      质量放行单已创建，状态为待批准
                    </div>
                  </div>
                ),
              },
              ...(qualityRelease.status === 'APPROVED' && qualityRelease.completeTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {qualityRelease.completeTime} - 放行批准
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      批准人: {qualityRelease.approver}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      批准时间: {qualityRelease.approvalTime}
                    </div>
                  </div>
                ),
              }] : []),
              ...(qualityRelease.status === 'REJECTED' ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {qualityRelease.approvalTime} - 放行拒绝
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      拒绝原因: {qualityRelease.rejectReason || '未说明'}
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

export default QualityReleaseDetail;
