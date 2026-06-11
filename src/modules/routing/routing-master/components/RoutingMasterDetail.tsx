/**
 * 工艺路径主数据详情组件
 * 展示工艺路径完整信息、工序明细配置
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Divider, Tabs, Badge, Row, Col, Statistic, Timeline } from 'antd';
import {
  CloseOutlined, EditOutlined, ApartmentOutlined, ShoppingOutlined,
  CheckCircleOutlined, StopOutlined, HistoryOutlined, FileTextOutlined,
  SettingOutlined, ToolOutlined, DashboardOutlined, BranchesOutlined, AuditOutlined
} from '@ant-design/icons';
import { ROUTING_STATUS_MAP } from '../types';
import type { RoutingMaster, RoutingDetail } from '../types';

interface RoutingMasterDetailProps {
  routingMaster: RoutingMaster;
  onClose: () => void;
  onEdit?: (routingMaster: RoutingMaster) => void;
  onApprove?: (routingMaster: RoutingMaster) => void;
  onActivate?: (routingMaster: RoutingMaster) => void;
  onDeactivate?: (routingMaster: RoutingMaster) => void;
  onArchive?: (routingMaster: RoutingMaster) => void;
}

const RoutingMasterDetail: React.FC<RoutingMasterDetailProps> = ({
  routingMaster,
  onClose,
  onEdit,
  onApprove,
  onActivate,
  onDeactivate,
  onArchive,
}) => {
  const statusConfig = ROUTING_STATUS_MAP[routingMaster.status];

  // 模拟工艺统计
  const routingStats = {
    totalSteps: routingMaster.details?.length || 0,
    totalTime: routingMaster.details?.reduce((sum, detail) => sum + (detail.planTime || 0) + (detail.setupTime || 0), 0),
    avgTime: (routingMaster.details ?? []).length > 0
      ? ((routingMaster.details ?? []).reduce((sum, detail) => sum + (detail.planTime || 0) + (detail.setupTime || 0), 0) / (routingMaster.details ?? []).length).toFixed(1)
      : 0,
    totalCost: routingMaster.details?.reduce((sum, detail) => sum + (detail.totalCost || 0), 0),
    qcSteps: routingMaster.details?.filter(d => d.qcRequired).length || 0,
  };

  // 模拟使用记录
  const usageHistory = [
    { date: '2024-03-01', event: '工艺路径创建', desc: '创建YS-RKQ-STD-V21标准工艺路径' },
    { date: '2024-03-05', event: '路径发布', desc: '工艺路径已发布，可用于生产订单' },
    { date: '2024-03-10', event: '首次使用', desc: '生产订单MO-20260305001首次使用该工艺路径' },
    { date: '2024-03-15', event: '路径更新', desc: 'V2.1版本更新，新增热处理工序' },
  ];

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Card title="工艺路径基本信息" extra={
          <Space>
            {onEdit && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(routingMaster)}
              >
                编辑
              </Button>
            )}
            {onApprove && routingMaster.status === 'DRAFT' && (
              <Button
                size="small"
                type="primary"
                icon={<AuditOutlined />}
                onClick={() => onApprove(routingMaster)}
              >
                批准
              </Button>
            )}
            {onActivate && routingMaster.status === 'INACTIVE' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onActivate(routingMaster)}
              >
                启用
              </Button>
            )}
            {onDeactivate && routingMaster.status === 'ACTIVE' && (
              <Button
                size="small"
                icon={<StopOutlined />}
                onClick={() => onDeactivate(routingMaster)}
              >
                停用
              </Button>
            )}
            {onArchive && routingMaster.status === 'ACTIVE' && (
              <Button
                size="small"
                icon={<FileTextOutlined />}
                onClick={() => onArchive(routingMaster)}
              >
                归档
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
        }>
          {/* 工艺路径标识 */}
          <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
            <BranchesOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
            <div style={{ marginBottom: '8px' }}>
              <Space>
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{routingMaster.routingName}</span>
                <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px', marginLeft: '8px' }}>
                  {routingMaster.routingCode}
                </Tag>
              </Space>
            </div>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
              {routingMaster.productName} - {routingMaster.productSpec}
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
            <Descriptions.Item label="工艺路径编码" span={1}>
              {routingMaster.routingCode}
            </Descriptions.Item>
            <Descriptions.Item label="工艺路径名称" span={1}>
              {routingMaster.routingName}
            </Descriptions.Item>

            <Descriptions.Item label="产品系列" span={1}>
              {routingMaster.productSeries}
            </Descriptions.Item>
            <Descriptions.Item label="产品编码" span={1}>
              {routingMaster.productCode}
            </Descriptions.Item>

            <Descriptions.Item label="产品名称" span={1}>
              {routingMaster.productName}
            </Descriptions.Item>
            <Descriptions.Item label="产品规格" span={1}>
              {routingMaster.productSpec}
            </Descriptions.Item>

            <Descriptions.Item label="BOM版本" span={1}>
              {routingMaster.bomVersion}
            </Descriptions.Item>
            <Descriptions.Item label="工艺版本" span={1}>
              {routingMaster.routingVersion}
            </Descriptions.Item>

            <Descriptions.Item label="工艺类型" span={1}>
              {routingMaster.routingType}
            </Descriptions.Item>
            <Descriptions.Item label="工序数量" span={1}>
              {routingMaster.details?.length || 0} 个
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

            <Descriptions.Item label="生效日期" span={1}>
              {routingMaster.effectiveDate}
            </Descriptions.Item>
            <Descriptions.Item label="失效日期" span={1}>
              {routingMaster.expiryDate || '永久有效'}
            </Descriptions.Item>

            <Descriptions.Item label="批准人" span={1}>
              {routingMaster.approvedBy || '待批准'}
            </Descriptions.Item>
            <Descriptions.Item label="批准时间" span={1}>
              {routingMaster.approvalTime || '待批准'}
            </Descriptions.Item>

            <Descriptions.Item label="创建时间" span={1}>
              {routingMaster.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间" span={1}>
              {routingMaster.updatedAt}
            </Descriptions.Item>

            <Descriptions.Item label="描述" span={2}>
              {routingMaster.description || '无'}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>
              {routingMaster.remark || '无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'details',
      label: `工序明细 (${routingMaster.details?.length || 0})`,
      children: (
        <div>
          {/* 工序统计 */}
          <Card title="工序统计" style={{ marginBottom: '16px' }} extra={<DashboardOutlined style={{ color: '#1677ff' }} />}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="工序总数"
                  value={routingStats.totalSteps}
                  valueStyle={{ color: '#1677ff' }}
                  prefix={<BranchesOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="总工时"
                  value={routingStats.totalTime}
                  suffix="分钟"
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<ToolOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="平均工时"
                  value={routingStats.avgTime}
                  suffix="分钟"
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="总成本"
                  value={routingStats.totalCost}
                  suffix="元"
                  valueStyle={{ color: '#faad14' }}
                  prefix={<ShoppingOutlined />}
                />
              </Col>
            </Row>
          </Card>

          {/* 工序明细 */}
          <Card title="工序明细" extra={<SettingOutlined style={{ color: '#1677ff' }} />}>
            <div style={{ background: '#fafafa', borderRadius: '4px', padding: '12px' }}>
              {routingMaster.details?.map((detail, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    background: '#fff',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    borderLeft: `4px solid ${detail.qcRequired ? '#52c41a' : '#d9d9d9'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        <Badge count={detail.stepNo} style={{ backgroundColor: '#1677ff', marginRight: '8px' }} />
                        {detail.stepName}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                        工序编码: {detail.stepCode} | 工序ID: {detail.operationId}
                      </div>
                      {detail.qcRequired && (
                        <Tag color="red" style={{ marginLeft: '8px' }}>需要质检</Tag>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      计划: {detail.planTime || 0} 分
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      准备: {detail.setupTime || 0} 分
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1677ff', marginBottom: '4px' }}>
                      总工时: {(detail.planTime || 0) + (detail.setupTime || 0)} 分
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: 'usage',
      label: '使用记录',
      children: (
        <Card title="使用记录" extra={<HistoryOutlined style={{ color: '#1677ff' }} />}>
          <Timeline
            items={usageHistory.map((record, index) => ({
              key: index,
              children: (
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {record.date} - {record.event}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    {record.desc}
                  </div>
                </div>
              ),
            }))}
          />
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={
          <Space>
            <BranchesOutlined style={{ color: '#1677ff' }} />
            <span>{routingMaster.routingName}</span>
            <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
            <Tag color="blue">{routingMaster.routingCode}</Tag>
          </Space>
        }
        extra={
          <Space>
            {onEdit && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(routingMaster)}
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
        <Tabs defaultActiveKey="basic" items={tabItems} />
      </Card>
    </div>
  );
};

export default RoutingMasterDetail;
