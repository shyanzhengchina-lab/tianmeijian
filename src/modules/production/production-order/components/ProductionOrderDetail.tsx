/**
 * 生产订单详情组件
 * 展示生产订单完整信息、产品配置、进度跟踪、关联工单
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Divider, Tabs, Badge, Row, Col, Statistic, Timeline, Progress } from 'antd';
import {
  CloseOutlined, EditOutlined, ShoppingOutlined, ApartmentOutlined, CalendarOutlined,
  CheckCircleOutlined, StopOutlined, HistoryOutlined, FileTextOutlined,
  SettingOutlined, ToolOutlined, DashboardOutlined, TeamOutlined
} from '@ant-design/icons';
import { PO_STATUS_MAP, PO_PRIORITY_MAP } from '../types';
import type { ProductionOrder } from '../types';
import { WorkOrdersTab } from './WorkOrdersTab';

interface ProductionOrderDetailProps {
  productionOrder: ProductionOrder;
  onClose: () => void;
  onEdit?: (productionOrder: ProductionOrder) => void;
}

const ProductionOrderDetail: React.FC<ProductionOrderDetailProps> = ({
  productionOrder,
  onClose,
  onEdit,
}) => {
  const statusConfig = PO_STATUS_MAP[productionOrder.status];
  const priorityConfig = PO_PRIORITY_MAP[productionOrder.priority];

  // 模拟生产进度
  const productionProgress = {
    totalQty: productionOrder.totalQty,
    completedQty: productionOrder.completedQty || 0,
    scrapQty: productionOrder.scrapQty || 0,
    completionRate: ((productionOrder.completedQty || 0) / productionOrder.totalQty) * 100,
  };

  // 模拟工单列表
  const workOrders = [
    { id: 'WO-001', woNo: 'WO-20260425001-01', status: 'IN_PROGRESS', planQty: 2000, actualQty: 1850 },
    { id: 'WO-002', woNo: 'WO-20260425001-02', status: 'IN_PROGRESS', planQty: 2500, actualQty: 2300 },
    { id: 'WO-003', woNo: 'WO-20260425001-03', status: 'PENDING', planQty: 2000, actualQty: undefined },
    { id: 'WO-004', woNo: 'WO-20260425001-04', status: 'PENDING', planQty: 1500, actualQty: undefined },
    { id: 'WO-005', woNo: 'WO-20260425001-05', status: 'PENDING', planQty: 2000, actualQty: undefined },
  ];

  // 模拟生产记录
  const productionHistory = [
    { date: '2024-04-20', event: '订单发布', desc: '生产订单已发布，开始生产准备' },
    { date: '2024-04-21', event: '首次发料', desc: '物料已发料到生产线' },
    { date: '2024-04-25', event: '生产开始', desc: '第一工单WO-001开始生产' },
    { date: '2024-04-28', event: '完成首检', desc: '首工单WO-001首件检验通过' },
  ];

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Card title="订单基本信息" extra={
          <Space>
            {onEdit && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(productionOrder)}
              >
                编辑
              </Button>
            )}
            <Button
              size="small"
              icon={<HistoryOutlined />}
            >
              变更记录
            </Button>
            <Button
              size="small"
              icon={<CloseOutlined />}
              onClick={onClose}
            >
              关闭
            </Button>
          </Space>
        }>
          {/* 订单标识 */}
          <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
            <ShoppingOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
            <div style={{ marginBottom: '8px' }}>
              <Space>
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{productionOrder.orderNo}</span>
                <Tag color={priorityConfig.color} style={{ fontSize: '14px', padding: '4px 12px', marginLeft: '8px' }}>
                  {priorityConfig.label}
                </Tag>
              </Space>
            </div>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
              {productionOrder.soNo && `销售订单: ${productionOrder.soNo}`}
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

          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="订单编号" span={1}>
              {productionOrder.orderNo}
            </Descriptions.Item>
            <Descriptions.Item label="销售订单" span={1}>
              {productionOrder.soNo || '无'}
            </Descriptions.Item>

            <Descriptions.Item label="产品编码" span={1}>
              {productionOrder.productCode}
            </Descriptions.Item>
            <Descriptions.Item label="产品名称" span={1}>
              {productionOrder.productName}
            </Descriptions.Item>

            <Descriptions.Item label="产品规格" span={1}>
              {productionOrder.productSpec}
            </Descriptions.Item>
            <Descriptions.Item label="BOM版本" span={1}>
              {productionOrder.bomVersion}
            </Descriptions.Item>

            <Descriptions.Item label="工艺路径" span={1}>
              {productionOrder.routingCode}
            </Descriptions.Item>
            <Descriptions.Item label="订单总量" span={1}>
              {productionOrder.totalQty.toLocaleString()} 件
            </Descriptions.Item>

            <Descriptions.Item label="优先级" span={1}>
              <Tag color={priorityConfig.color}>{priorityConfig.label}</Tag>
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

            <Descriptions.Item label="交货日期" span={1}>
              {productionOrder.deliveryDate}
            </Descriptions.Item>
            <Descriptions.Item label="发布日期" span={1}>
              {productionOrder.releaseDate || '未发布'}
            </Descriptions.Item>

            <Descriptions.Item label="审核状态" span={1}>
              {productionOrder.isAudited ? (
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
                  <span>已审核</span>
                </Space>
              ) : (
                <span>未审核</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="审核人" span={1}>
              {productionOrder.auditedBy || '待审核'}
            </Descriptions.Item>

            <Descriptions.Item label="审核时间" span={1}>
              {productionOrder.auditedAt || '待审核'}
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={2}>
              {productionOrder.remark || '无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'progress',
      label: '生产进度',
      children: (
        <div>
          {/* 进度统计 */}
          <Card title="生产进度统计" style={{ marginBottom: '16px' }} extra={<DashboardOutlined style={{ color: '#1677ff' }} />}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="订单总量"
                  value={productionProgress.totalQty}
                  suffix="件"
                  valueStyle={{ color: '#1677ff' }}
                  prefix={<ShoppingOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="已完成"
                  value={productionProgress.completedQty}
                  suffix="件"
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="报废数量"
                  value={productionProgress.scrapQty}
                  suffix="件"
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<StopOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="完成率"
                  value={productionProgress.completionRate}
                  suffix="%"
                  valueStyle={{ color: productionProgress.completionRate >= 95 ? '#52c41a' : productionProgress.completionRate >= 85 ? '#faad14' : '#cf1322' }}
                  prefix={<ToolOutlined />}
                />
              </Col>
            </Row>
            <div style={{ marginTop: '16px' }}>
              <Progress
                percent={productionProgress.completionRate}
                status={productionProgress.completionRate === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#52c41a',
                  '100%': '#52c41a',
                }}
              />
            </div>
          </Card>

          {/* 生产记录 */}
          <Card title="生产记录" extra={<HistoryOutlined style={{ color: '#1677ff' }} />}>
            <Timeline>
              {productionHistory.map((record, index) => (
                <Timeline.Item key={index}>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {record.date} - {record.event}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      {record.desc}
                    </div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </div>
      ),
    },
    {
      key: 'workorders',
      label: `关联工单 (${workOrders.length})`,
      children: (
        <Card title="关联生产工单" extra={<TeamOutlined style={{ color: '#1677ff' }} />}>
          <div style={{ background: '#fafafa', borderRadius: '4px', padding: '12px' }}>
            {workOrders.map(wo => (
              <div
                key={wo.id}
                style={{
                  padding: '12px',
                  background: '#fff',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{wo.woNo}</div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                    计划: {wo.planQty} 件
                    {wo.actualQty && ` | 实际: ${wo.actualQty} 件`}
                  </div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: wo.status === 'COMPLETED' ? '#52c41a' : wo.status === 'IN_PROGRESS' ? '#1677ff' : '#8c8c8c' }}>
                  {wo.status === 'IN_PROGRESS' ? '生产中' : wo.status === 'COMPLETED' ? '已完成' : '待开始'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={
          <Space>
            <ShoppingOutlined style={{ color: '#1677ff' }} />
            <span>{productionOrder.orderNo}</span>
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
                onClick={() => onEdit(productionOrder)}
              >
                编辑
              </Button>
            )}
            <Button
              size="small"
              icon={<HistoryOutlined />}
            >
              变更记录
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
        <Tabs defaultActiveKey="basic" items={tabItems} />
      </Card>
    </div>
  );
};

export default ProductionOrderDetail;
