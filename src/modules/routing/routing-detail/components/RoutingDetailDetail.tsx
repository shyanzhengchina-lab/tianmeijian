/**
 * 工艺明细详情组件
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Divider, Timeline, Statistic, Row, Col } from 'antd';
import {
  CloseOutlined, EditOutlined, FileTextOutlined, ApartmentOutlined,
  CheckCircleOutlined, StopOutlined, HistoryOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { ROUTING_DETAIL_STATUS_MAP } from '../types';
import type { RoutingDetail } from '../types';

interface RoutingDetailDetailProps {
  detail: RoutingDetail;
  onClose: () => void;
  onEdit?: (detail: RoutingDetail) => void;
  onActivate?: (detail: RoutingDetail) => void;
  onDeactivate?: (detail: RoutingDetail) => void;
}

const RoutingDetailDetail: React.FC<RoutingDetailDetailProps> = ({
  detail,
  onClose,
  onEdit,
  onActivate,
  onDeactivate,
}) => {
  const statusConfig = ROUTING_DETAIL_STATUS_MAP[detail.status];

  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>{detail.operationCode} - {detail.operationName}</span>
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
                onClick={() => onEdit(detail)}
              >
                编辑
              </Button>
            )}
            {onActivate && detail.status === 'INACTIVE' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onActivate(detail)}
              >
                启用
              </Button>
            )}
            {onDeactivate && detail.status === 'ACTIVE' && (
              <Button
                size="small"
                icon={<StopOutlined />}
                onClick={() => onDeactivate(detail)}
              >
                停用
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
        {/* 工序标识 */}
        <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <ClockCircleOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{detail.operationCode} - {detail.operationName}</span>
          </div>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
            工艺路线: {detail.routingNo} | 序号: {detail.sequence}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
            工作中心: {detail.workCenter} {detail.equipment ? `| 设备: ${detail.equipment}` : ''}
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
            <Descriptions.Item label="工艺路线号" span={1}>
              {detail.routingNo}
            </Descriptions.Item>
            <Descriptions.Item label="序号" span={1}>
              {detail.sequence}
            </Descriptions.Item>

            <Descriptions.Item label="工序编码" span={1}>
              {detail.operationCode}
            </Descriptions.Item>
            <Descriptions.Item label="工序名称" span={1}>
              {detail.operationName}
            </Descriptions.Item>

            <Descriptions.Item label="工作中心" span={1}>
              {detail.workCenter}
            </Descriptions.Item>
            <Descriptions.Item label="设备" span={1}>
              {detail.equipment || '-'}
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
            <Descriptions.Item label="工艺路线ID" span={1}>
              {detail.routingId}
            </Descriptions.Item>

            <Descriptions.Item label="工序描述" span={2}>
              {detail.operationDesc || '无'}
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={2}>
              {detail.remarks || '无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 时间信息 */}
        <Card title="时间信息(分钟)" style={{ marginBottom: '16px' }} extra={<ClockCircleOutlined style={{ color: '#1677ff' }} />}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="标准时间"
                value={detail.standardTime}
                precision={2}
                suffix="分钟"
                valueStyle={{ color: '#1677ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="准备时间"
                value={detail.setupTime}
                precision={2}
                suffix="分钟"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="人工时间"
                value={detail.laborTime}
                precision={2}
                suffix="分钟"
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="机器时间"
                value={detail.machineTime}
                precision={2}
                suffix="分钟"
                valueStyle={{ color: '#13c2c2' }}
              />
            </Col>
          </Row>
        </Card>

        {/* 系统信息 */}
        <Card title="系统信息" style={{ marginBottom: '16px' }} extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="明细ID" span={1}>
              {detail.id}
            </Descriptions.Item>
            <Descriptions.Item label="创建人" span={1}>
              {detail.createdBy}
            </Descriptions.Item>

            <Descriptions.Item label="创建时间" span={1}>
              {detail.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间" span={1}>
              {detail.updatedAt}
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
                      {detail.createdAt} - 创建
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      工艺明细已创建，序号: {detail.sequence}
                    </div>
                  </div>
                ),
              },
              ...(detail.status === 'INACTIVE' ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {detail.updatedAt} - 停用
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      工艺明细已停用
                    </div>
                  </div>
                ),
              }] : []),
              ...(detail.status === 'ACTIVE' && detail.createdAt !== detail.updatedAt ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {detail.updatedAt} - 启用
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      工艺明细已启用
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

export default RoutingDetailDetail;
