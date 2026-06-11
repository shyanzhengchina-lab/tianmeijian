/**
 * 产品系列详情组件
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Divider, Timeline } from 'antd';
import {
  CloseOutlined, EditOutlined, FileTextOutlined, ApartmentOutlined,
  CheckCircleOutlined, StopOutlined, HistoryOutlined
} from '@ant-design/icons';
import { PRODUCT_SERIES_STATUS_MAP } from '../types';
import type { ProductSeries } from '../types';

interface ProductSeriesDetailProps {
  series: ProductSeries;
  onClose: () => void;
  onEdit?: (series: ProductSeries) => void;
  onActivate?: (series: ProductSeries) => void;
  onDeactivate?: (series: ProductSeries) => void;
}

const ProductSeriesDetail: React.FC<ProductSeriesDetailProps> = ({
  series,
  onClose,
  onEdit,
  onActivate,
  onDeactivate,
}) => {
  const statusConfig = PRODUCT_SERIES_STATUS_MAP[series.status];

  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>{series.seriesCode}</span>
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
                onClick={() => onEdit(series)}
              >
                编辑
              </Button>
            )}
            {onActivate && series.status === 'INACTIVE' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onActivate(series)}
              >
                启用
              </Button>
            )}
            {onDeactivate && series.status === 'ACTIVE' && (
              <Button
                size="small"
                icon={<StopOutlined />}
                onClick={() => onDeactivate(series)}
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
        {/* 系列标识 */}
        <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <FileTextOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{series.seriesCode}</span>
          </div>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
            {series.seriesName}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
            类别: {series.category}
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
            <Descriptions.Item label="系列编码" span={1}>
              {series.seriesCode}
            </Descriptions.Item>
            <Descriptions.Item label="系列名称" span={1}>
              {series.seriesName}
            </Descriptions.Item>

            <Descriptions.Item label="类别" span={1}>
              {series.category}
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

            <Descriptions.Item label="系列描述" span={2}>
              {series.description || '无'}
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={2}>
              {series.remarks || '无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 系统信息 */}
        <Card title="系统信息" style={{ marginBottom: '16px' }} extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="系列ID" span={1}>
              {series.id}
            </Descriptions.Item>
            <Descriptions.Item label="创建人" span={1}>
              {series.createdBy}
            </Descriptions.Item>

            <Descriptions.Item label="创建时间" span={1}>
              {series.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间" span={1}>
              {series.updatedAt}
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
                      {series.createdAt} - 创建
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      产品系列已创建
                    </div>
                  </div>
                ),
              },
              ...(series.status === 'INACTIVE' ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {series.updatedAt} - 停用
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      产品系列已停用
                    </div>
                  </div>
                ),
              }] : []),
              ...(series.status === 'ACTIVE' && series.createdAt !== series.updatedAt ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {series.updatedAt} - 启用
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      产品系列已启用
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

export default ProductSeriesDetail;
