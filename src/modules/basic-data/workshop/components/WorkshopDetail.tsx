/**
 * 车间档案详情组件
 * 展示车间完整信息、管理配置、工作中心、使用统计
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Divider, Tabs, Badge, Row, Col, Statistic, Progress } from 'antd';
import {
  CloseOutlined, EditOutlined, ApartmentOutlined, PhoneOutlined, TeamOutlined,
  EnvironmentOutlined, SafetyCertificateOutlined, ClockCircleOutlined,
  CheckCircleOutlined, StopOutlined, SettingOutlined, HistoryOutlined,
  DashboardOutlined, FileTextOutlined
} from '@ant-design/icons';
import { WORKSHOP_STATUS_MAP, WORKSHOP_TYPE_MAP } from '../types';
import type { Workshop } from '../types';

interface WorkshopDetailProps {
  workshop: Workshop;
  onClose: () => void;
  onEdit?: (workshop: Workshop) => void;
  onEnable?: (workshop: Workshop) => void;
  onDisable?: (workshop: Workshop) => void;
  onSetMaintenance?: (workshop: Workshop) => void;
  onUnsetMaintenance?: (workshop: Workshop) => void;
}

const WorkshopDetail: React.FC<WorkshopDetailProps> = ({
  workshop,
  onClose,
  onEdit,
  onEnable,
  onDisable,
  onSetMaintenance,
  onUnsetMaintenance,
}) => {
  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      ACTIVE: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      MAINTENANCE: <StopOutlined style={{ color: '#faad14' }} />,
      DISABLED: <EnvironmentOutlined style={{ color: '#8c8c8c' }} />,
    };
    return iconMap[status] || null;
  };

  const typeConfig = WORKSHOP_TYPE_MAP[workshop.type];
  const statusConfig = WORKSHOP_STATUS_MAP[workshop.status];

  // 模拟工作中心列表
  const workCenters = [
    { id: 'WC-001', name: '磨削中心A', status: 'ACTIVE', utilization: 85 },
    { id: 'WC-002', name: '磨削中心B', status: 'ACTIVE', utilization: 78 },
    { id: 'WC-003', name: '研磨中心A', status: 'ACTIVE', utilization: 92 },
  ];

  // 模拟使用统计
  const usageStats = {
    totalWorkDays: 256,
    avgUtilization: 87.5,
    totalOutput: 125000,
    defectRate: 0.8,
    maintenanceDays: 8,
    accidentCount: 0,
  };

  // 模拟月度趋势
  const monthlyTrend = [
    { month: '1月', utilization: 88, output: 10500, defects: 85 },
    { month: '2月', utilization: 90, output: 11200, defects: 72 },
    { month: '3月', utilization: 85, output: 10800, defects: 90 },
    { month: '4月', utilization: 87, output: 11500, defects: 68 },
    { month: '5月', utilization: 89, output: 11300, defects: 75 },
    { month: '6月', utilization: 86, output: 11000, defects: 80 },
  ];

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Card title="车间基本信息" extra={
          <Space>
            {onEdit && workshop.status === 'ACTIVE' && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(workshop)}
              >
                编辑
              </Button>
            )}
            {onSetMaintenance && workshop.status === 'ACTIVE' && (
              <Button
                size="small"
                icon={<SettingOutlined />}
                onClick={() => onSetMaintenance(workshop)}
              >
                设置维修
              </Button>
            )}
            {onUnsetMaintenance && workshop.status === 'MAINTENANCE' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onUnsetMaintenance(workshop)}
              >
                恢复使用
              </Button>
            )}
            {onDisable && workshop.status === 'ACTIVE' && (
              <Button
                size="small"
                icon={<StopOutlined />}
                onClick={() => onDisable(workshop)}
              >
                停用
              </Button>
            )}
            {onEnable && workshop.status === 'DISABLED' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onEnable(workshop)}
              >
                启用
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
          {/* 车间标识 */}
          <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
            <ApartmentOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
            <div style={{ marginBottom: '8px' }}>
              <Space>
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{workshop.workShopName}</span>
                <Tag color={typeConfig.color} style={{ fontSize: '14px', padding: '4px 12px' }}>
                  {typeConfig.label}
                </Tag>
                <Tag color="blue">{workshop.workShopCode}</Tag>
              </Space>
            </div>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
              主任: {workshop.manager} | 位置: {workshop.location || '未设置'}
            </div>
            <Space>
              {getStatusIcon(workshop.status)}
              <Tag color={statusConfig.color} style={{ fontSize: '14px', padding: '4px 12px' }}>
                {statusConfig.label}
              </Tag>
              {workshop.cleanLevel && (
                <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>
                  {workshop.cleanLevel}
                </Tag>
              )}
            </Space>
          </div>

          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="车间编码" span={1}>
              {workshop.workShopCode}
            </Descriptions.Item>
            <Descriptions.Item label="车间名称" span={1}>
              {workshop.workShopName}
            </Descriptions.Item>

            <Descriptions.Item label="车间类型" span={1}>
              <Tag color={typeConfig.color}>{typeConfig.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态" span={1}>
              <Space>
                {getStatusIcon(workshop.status)}
                <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="车间主任" span={1}>
              {workshop.manager}
            </Descriptions.Item>
            <Descriptions.Item label="联系电话" span={1}>
              {workshop.managerPhone || '未设置'}
            </Descriptions.Item>

            <Descriptions.Item label="车间位置" span={1}>
              {workshop.location || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="洁净等级" span={1}>
              {workshop.cleanLevel || '未设置'}
            </Descriptions.Item>

            <Descriptions.Item label="车间面积" span={1}>
              {workshop.area ? `${workshop.area} ㎡` : '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="车间人数" span={1}>
              {workshop.headCount ? `${workshop.headCount} 人` : '未设置'}
            </Descriptions.Item>

            <Descriptions.Item label="工作中心数" span={1}>
              {workshop.workCenterCount ? `${workshop.workCenterCount} 个` : '未设置'}
            </Descriptions.Item>

            <Descriptions.Item label="创建时间" span={1}>
              {workshop.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间" span={1}>
              {workshop.updatedAt}
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={2}>
              {workshop.remark || '无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'centers',
      label: '工作中心',
      children: (
        <Card title="工作中心配置" extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}>
          <Row gutter={[16, 16]}>
            {workCenters.map(center => (
              <Col key={center.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  size="small"
                  style={{
                    textAlign: 'center',
                    background: '#f5f5f5',
                    borderColor: center.status === 'ACTIVE' ? '#52c41a' : '#8c8c8c'
                  }}
                >
                  <ApartmentOutlined style={{ fontSize: '24px', color: '#1677ff', marginBottom: '8px' }} />
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{center.name}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                    状态: {center.status === 'ACTIVE' ? '正常' : '停用'}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>利用率</div>
                    <Progress
                      percent={center.utilization}
                      size="small"
                      status={center.utilization >= 85 ? 'success' : 'normal'}
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      ),
    },
    {
      key: 'statistics',
      label: '使用统计',
      children: (
        <div>
          {/* 统计指标 */}
          <Card title="统计指标" style={{ marginBottom: '16px' }} extra={<DashboardOutlined style={{ color: '#1677ff' }} />}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="工作天数"
                  value={usageStats.totalWorkDays}
                  suffix="天"
                  valueStyle={{ color: '#1677ff' }}
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="平均利用率"
                  value={usageStats.avgUtilization}
                  suffix="%"
                  valueStyle={{ color: usageStats.avgUtilization >= 85 ? '#52c41a' : '#faad14' }}
                  prefix={<DashboardOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="总产量"
                  value={usageStats.totalOutput}
                  suffix="件"
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<ApartmentOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="不合格率"
                  value={usageStats.defectRate}
                  suffix="%"
                  valueStyle={{ color: usageStats.defectRate <= 1 ? '#52c41a' : '#cf1322' }}
                  prefix={<SettingOutlined />}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: '16px' }}>
              <Col span={12}>
                <Statistic
                  title="维修天数"
                  value={usageStats.maintenanceDays}
                  suffix="天"
                  valueStyle={{ color: '#faad14' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="安全事故"
                  value={usageStats.accidentCount}
                  suffix="次"
                  valueStyle={{ color: usageStats.accidentCount === 0 ? '#52c41a' : '#cf1322' }}
                  prefix={<SafetyCertificateOutlined />}
                />
              </Col>
            </Row>
          </Card>

          {/* 月度趋势 */}
          <Card title="月度生产趋势" extra={<HistoryOutlined style={{ color: '#1677ff' }} />}>
            <Row gutter={16}>
              {monthlyTrend.map(trend => (
                <Col key={trend.month} xs={24} sm={12} md={8} lg={4} xl={4}>
                  <Card
                    size="small"
                    style={{ textAlign: 'center' }}
                    title={<span style={{ fontSize: '12px' }}>{trend.month}</span>}
                  >
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>利用率</div>
                      <Progress
                        percent={trend.utilization}
                        size="small"
                        showInfo={false}
                      />
                    </div>
                    <Row gutter={8} style={{ marginTop: '8px' }}>
                      <Col span={12}>
                        <div style={{ fontSize: '11px', color: '#666' }}>产量</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#52c41a' }}>
                          {trend.output.toLocaleString()}
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ fontSize: '11px', color: '#666' }}>不良品</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: trend.defects <= 75 ? '#52c41a' : '#faad14' }}>
                          {trend.defects}
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </div>
      ),
    },
    {
      key: 'config',
      label: '管理配置',
      children: (
        <Card title="管理配置" extra={<SettingOutlined style={{ color: '#1677ff' }} />}>
          {/* 管理人员 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>管理人员</div>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" style={{ textAlign: 'center', background: '#e6f7ff' }}>
                  <TeamOutlined style={{ fontSize: '32px', color: '#1677ff', marginBottom: '8px' }} />
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>车间主任</div>
                  <div style={{ fontSize: '16px', color: '#1677ff' }}>{workshop.manager}</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
                  <PhoneOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }} />
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>联系电话</div>
                  <div style={{ fontSize: '16px', color: '#52c41a' }}>{workshop.managerPhone || '未设置'}</div>
                </Card>
              </Col>
            </Row>
          </div>

          {/* 车间配置 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>车间配置</div>
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" title="车间类型" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: typeConfig.color }}>
                    {typeConfig.label}
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="洁净等级" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                    {workshop.cleanLevel || '未设置'}
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="工作中心数" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1677ff' }}>
                    {workshop.workCenterCount || 0} 个
                  </div>
                </Card>
              </Col>
            </Row>
          </div>

          {/* 空间配置 */}
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>空间配置</div>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="车间位置" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', color: '#666' }}>
                    {workshop.location || '未设置'}
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="车间面积" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#722ed1' }}>
                    {workshop.area ? `${workshop.area} ㎡` : '未设置'}
                  </div>
                </Card>
              </Col>
            </Row>
          </div>

          {/* 配置说明 */}
          <div style={{
            padding: '16px',
            background: '#f5f5f5',
            borderRadius: '4px',
            marginTop: '24px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>配置说明</div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <div>• 车间类型决定车间的主要工艺和用途</div>
              <div>• 洁净等级决定车间的环境要求和管理级别</div>
              <div>• 工作中心管理车间的设备布局和工艺流程</div>
              <div>• 状态管理车间的使用状态（正常/维修中/停用）</div>
            </div>
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
            <ApartmentOutlined style={{ color: '#1677ff' }} />
            <span>{workshop.workShopName}</span>
            <Tag color={typeConfig.color}>{typeConfig.label}</Tag>
            <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
            <Tag color="blue">{workshop.workShopCode}</Tag>
          </Space>
        }
        extra={
          <Space>
            {onEdit && workshop.status === 'ACTIVE' && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(workshop)}
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

export default WorkshopDetail;
