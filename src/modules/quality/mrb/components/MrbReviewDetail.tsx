/**
 * MRB评审单详情组件
 * 展示MRB评审完整信息、不良详情、评审记录、处理结果
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Badge, Row, Col, Statistic, Timeline, Divider } from 'antd';
import {
  CloseOutlined, EditOutlined, FileTextOutlined, ApartmentOutlined, CalendarOutlined,
  CheckCircleOutlined, StopOutlined, WarningOutlined, HistoryOutlined,
  UserOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { MRB_STATUS_MAP, DISPOSITION_RESULT_MAP } from '../types';
import type { MrbReview } from '../types';

interface MrbReviewDetailProps {
  mrbReview: MrbReview;
  onClose: () => void;
  onEdit?: (mrbReview: MrbReview) => void;
  onStart?: (mrbReview: MrbReview) => void;
  onApprove?: (mrbReview: MrbReview) => void;
  onReject?: (mrbReview: MrbReview) => void;
  onCloseMrb?: (mrbReview: MrbReview) => void;
}

const MrbReviewDetail: React.FC<MrbReviewDetailProps> = ({
  mrbReview,
  onClose,
  onEdit,
  onStart,
  onApprove,
  onReject,
  onCloseMrb,
}) => {
  const statusConfig = MRB_STATUS_MAP[mrbReview.status];

  // 不良等级颜色
  const defectLevelColors = {
    MINOR: '#52c41a',
    MAJOR: '#faad14',
    CRITICAL: '#ff4d4f',
  };

  const defectLevelLabels = {
    MINOR: '轻微',
    MAJOR: '主要',
    CRITICAL: '严重',
  };

  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>{mrbReview.mrbNo}</span>
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
                onClick={() => onEdit(mrbReview)}
                disabled={mrbReview.status !== 'PENDING'}
              >
                编辑
              </Button>
            )}
            {onStart && mrbReview.status === 'PENDING' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onStart(mrbReview)}
              >
                开始
              </Button>
            )}
            {onApprove && mrbReview.status === 'IN_REVIEW' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onApprove(mrbReview)}
              >
                批准
              </Button>
            )}
            {onReject && mrbReview.status === 'IN_REVIEW' && (
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => onReject(mrbReview)}
              >
                拒绝
              </Button>
            )}
            {onCloseMrb && mrbReview.status === 'APPROVED' && (
              <Button
                size="small"
                icon={<StopOutlined />}
                onClick={() => onCloseMrb(mrbReview)}
              >
                关闭
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
        {/* MRB标识 */}
        <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <WarningOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{mrbReview.mrbNo}</span>
          </div>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
            批号: {mrbReview.batchNo} - 数量: {mrbReview.qty}
          </div>
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            {mrbReview.productName} - {mrbReview.productSpec}
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

        {/* 不良信息 */}
        <Card title="不良信息" style={{ marginBottom: '16px' }} extra={<ExclamationCircleOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="MRB编号" span={1}>
              {mrbReview.mrbNo}
            </Descriptions.Item>
            <Descriptions.Item label="质检单号" span={1}>
              {mrbReview.inspectionNo || '无'}
            </Descriptions.Item>

            <Descriptions.Item label="产品编码" span={1}>
              {mrbReview.productCode}
            </Descriptions.Item>
            <Descriptions.Item label="产品名称" span={1}>
              {mrbReview.productName}
            </Descriptions.Item>

            <Descriptions.Item label="产品规格" span={2}>
              {mrbReview.productSpec}
            </Descriptions.Item>

            <Descriptions.Item label="批号" span={1}>
              {mrbReview.batchNo}
            </Descriptions.Item>
            <Descriptions.Item label="数量" span={1}>
              {mrbReview.qty.toLocaleString()} 件
            </Descriptions.Item>

            <Descriptions.Item label="不良等级" span={2}>
              <span style={{
                color: defectLevelColors[mrbReview.defectLevel],
                fontWeight: 'bold',
                fontSize: '14px',
                padding: '4px 12px',
                borderRadius: '4px',
                background: defectLevelColors[mrbReview.defectLevel] + '15'
              }}>
                {defectLevelLabels[mrbReview.defectLevel]}
              </span>
            </Descriptions.Item>

            <Descriptions.Item label="不良描述" span={2}>
              {mrbReview.defectDescription}
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

            <Descriptions.Item label="备注" span={1}>
              {mrbReview.remark || '无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 评审信息 */}
        {mrbReview.status !== 'PENDING' && (
          <Card title="评审信息" style={{ marginBottom: '16px' }} extra={<UserOutlined style={{ color: '#1677ff' }} />}>
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="评审人" span={1}>
                {mrbReview.reviewer || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="评审时间" span={1}>
                {mrbReview.reviewTime || '-'}
              </Descriptions.Item>

              {mrbReview.status === 'APPROVED' && (
                <>
                  <Descriptions.Item label="批准人" span={1}>
                    {mrbReview.approver || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="完成时间" span={1}>
                    {mrbReview.completeTime || '-'}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          </Card>
        )}

        {/* 处理结果 */}
        {mrbReview.dispositionResult && (
          <Card title="处理结果" style={{ marginBottom: '16px' }} extra={<CheckCircleOutlined style={{ color: '#1677ff' }} />}>
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="处理结果" span={2}>
                <span style={{
                  color: DISPOSITION_RESULT_MAP[mrbReview.dispositionResult]?.color,
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  {DISPOSITION_RESULT_MAP[mrbReview.dispositionResult]?.label || mrbReview.dispositionResult}
                </span>
              </Descriptions.Item>

              <Descriptions.Item label="处理意见" span={2}>
                {mrbReview.dispositionRemark || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* 时间信息 */}
        <Card title="时间信息" style={{ marginBottom: '16px' }} extra={<CalendarOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="申请时间" span={1}>
              {mrbReview.requestTime}
            </Descriptions.Item>

            {mrbReview.reviewTime && (
              <Descriptions.Item label="评审时间" span={1}>
                {mrbReview.reviewTime}
              </Descriptions.Item>
            )}

            {mrbReview.completeTime && (
              <Descriptions.Item label="完成时间" span={1}>
                {mrbReview.completeTime}
              </Descriptions.Item>
            )}

            <Descriptions.Item label="创建人" span={1}>
              {mrbReview.createdBy}
            </Descriptions.Item>

            <Descriptions.Item label="创建时间" span={1}>
              {mrbReview.createdAt}
            </Descriptions.Item>

            <Descriptions.Item label="更新时间" span={1}>
              {mrbReview.updatedAt}
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
                      {mrbReview.createdAt} - MRB评审单创建
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      MRB评审单已创建，状态为待评审
                    </div>
                  </div>
                ),
              },
              ...(mrbReview.reviewTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {mrbReview.reviewTime} - 评审开始
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      评审人: {mrbReview.reviewer}
                    </div>
                  </div>
                ),
              }] : []),
              ...(mrbReview.status === 'APPROVED' && mrbReview.completeTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {mrbReview.completeTime} - 评审完成
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      批准人: {mrbReview.approver}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      处理结果: {DISPOSITION_RESULT_MAP[mrbReview.dispositionResult!]?.label}
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

export default MrbReviewDetail;
