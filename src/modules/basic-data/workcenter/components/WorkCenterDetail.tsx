/**
 * 工作中心详情组件
 * 展示工作中心完整信息和产能分析
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Divider, Tabs, Statistic, Row, Col, Progress, Timeline } from 'antd';
import {
  CloseOutlined, EditOutlined, ToolOutlined, CheckCircleOutlined,
  DashboardOutlined, TeamOutlined, ClockCircleOutlined, BankOutlined,
  ApartmentOutlined, HistoryOutlined, LineChartOutlined, SettingOutlined
} from '@ant-design/icons';
import { STATUS_MAP, CATEGORY_MAP } from '../types';
import type { WorkCenter } from '../types';

interface WorkCenterDetailProps {
  workCenter: WorkCenter;
  onClose: () => void;
  onEdit?: (workCenter: WorkCenter) => void;
  onMaintenance?: (workCenter: WorkCenter) => void;
}

const WorkCenterDetail: React.FC<WorkCenterDetailProps> = ({
  workCenter,
  onClose,
  onEdit,
  onMaintenance,
}) => {
  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      ACTIVE: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      DISABLED: <ApartmentOutlined style={{ color: '#8c8c8c' }} />,
      MAINTENANCE: <ToolOutlined style={{ color: '#faad14' }} />,
    };
    return iconMap[status] || null;
  };

  // 模拟产能分析数据
  const capacityAnalysis = {
    dailyCapacity: workCenter.capacity * workCenter.shiftCount * (workCenter.shiftHours / 8),
    monthlyCapacity: workCenter.capacity * workCenter.shiftCount * workCenter.shiftHours * 20, // 假设20工作日
    utilizationRate: 85, // 利用率
    efficiencyRate: 90, // 效率
    qualityRate: 95, // 良率
  };

  // 模拟历史记录数据
  const historyRecords = [
    {
      date: '2026-04-28',
      type: '产能调整',
      content: '产能从1800调整为2000件/班',
      operator: '生产经理',
    },
    {
      date: '2026-04-20',
      type: '设备维护',
      content: '完成3号设备大修',
      operator: '设备工程师',
    },
    {
      date: '2026-04-15',
      type: '人员调整',
      content: '班组负责人变更为张工',
      operator: '人事主管',
    },
    {
      date: '2026-04-01',
      type: '班次调整',
      content: '班次从2次调整为3次',
      operator: '车间主任',
    },
  ];

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Card title="工作中心基本信息" extra={
          <Space>
            {onEdit && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(workCenter)}
              >
                编辑
              </Button>
            )}
            {onMaintenance && workCenter.status === 'ACTIVE' && (
              <Button
                size="small"
                icon={<ToolOutlined />}
                onClick={() => onMaintenance(workCenter)}
              >
                设置整修
              </Button>
            )}
            <Button
              size="small"
              icon={<LineChartOutlined />}
            >
              产能分析
            </Button>
            <Button
              size="small"
              icon={<HistoryOutlined />}
            >
              历史记录
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
          <Descriptions bordered column={2}>
            <Descriptions.Item label="工作中心编码" span={1}>
              {workCenter.wcCode}
            </Descriptions.Item>
            <Descriptions.Item label="工作中心名称" span={1}>
              {workCenter.wcName}
            </Descriptions.Item>

            <Descriptions.Item label="工作中心分类" span={1}>
              {CATEGORY_MAP[workCenter.category]?.label || workCenter.category}
            </Descriptions.Item>
            <Descriptions.Item label="所属车间" span={1}>
              {workCenter.workshop}
            </Descriptions.Item>

            <Descriptions.Item label="负责人" span={1}>
              {workCenter.leader}
            </Descriptions.Item>
            <Descriptions.Item label="位置" span={1}>
              {workCenter.location}
            </Descriptions.Item>

            <Descriptions.Item label="班组数" span={1}>
              {workCenter.headCount}
            </Descriptions.Item>
            <Descriptions.Item label="班次数" span={1}>
              {workCenter.shiftCount}
            </Descriptions.Item>

            <Descriptions.Item label="班时数" span={1}>
              {workCenter.shiftHours} 小时
            </Descriptions.Item>
            <Descriptions.Item label="成本中心" span={1}>
              {workCenter.costCenter}
            </Descriptions.Item>

            <Descriptions.Item label="产能" span={1}>
              {workCenter.capacity} {workCenter.capacityUnit}
            </Descriptions.Item>
            <Descriptions.Item label="设备数量" span={1}>
              {workCenter.equipCount} 台
            </Descriptions.Item>

            <Descriptions.Item label="状态" span={2}>
              <Space>
                {getStatusIcon(workCenter.status)}
                <Tag color={STATUS_MAP[workCenter.status]?.color}>
                  {STATUS_MAP[workCenter.status]?.label}
                </Tag>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="创建时间" span={1}>
              {workCenter.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间" span={1}>
              {workCenter.updatedAt}
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={2}>
              {workCenter.remark || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'capacity',
      label: '产能分析',
      children: (
        <div>
          {/* 产能统计 */}
          <Card title="产能统计" style={{ marginBottom: '16px' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="日产能"
                  value={capacityAnalysis.dailyCapacity}
                  suffix="件"
                  prefix={<DashboardOutlined />}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="月产能"
                  value={capacityAnalysis.monthlyCapacity}
                  suffix="件"
                  prefix={<LineChartOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="理论年产能"
                  value={capacityAnalysis.monthlyCapacity * 12}
                  suffix="件"
                  prefix={<BankOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
          </Card>

          {/* 产能利用率 */}
          <Card title="产能利用率分析" style={{ marginBottom: '16px' }}>
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={capacityAnalysis.utilizationRate}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                    format={(percent) => `${percent}%`}
                  />
                  <div style={{ marginTop: '8px', fontWeight: 'bold' }}>设备利用率</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={capacityAnalysis.efficiencyRate}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                    format={(percent) => `${percent}%`}
                  />
                  <div style={{ marginTop: '8px', fontWeight: 'bold' }}>生产效率</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={capacityAnalysis.qualityRate}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                    format={(percent) => `${percent}%`}
                  />
                  <div style={{ marginTop: '8px', fontWeight: 'bold' }}>良品率</div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* 产能详情 */}
          <Card title="产能构成">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <span style={{ marginRight: '8px' }}>单班产能:</span>
                <Tag color="blue">{workCenter.capacity} {workCenter.capacityUnit}</Tag>
              </div>
              <div>
                <span style={{ marginRight: '8px' }}>日产能:</span>
                <Tag color="green">{capacityAnalysis.dailyCapacity} 件</Tag>
              </div>
              <div>
                <span style={{ marginRight: '8px' }}>人员配置:</span>
                <Space>
                  <TeamOutlined /> {workCenter.headCount} 组
                  <ClockCircleOutlined /> {workCenter.shiftCount} 班 × {workCenter.shiftHours} 时
                </Space>
              </div>
              <div>
                <span style={{ marginRight: '8px' }}>设备配置:</span>
                <Space>
                  <DashboardOutlined /> {workCenter.equipCount} 台
                  <span style={{ color: '#8c8c8c' }}>(平均 {Math.round(capacityAnalysis.dailyCapacity / workCenter.equipCount)} 件/台·日)</span>
                </Space>
              </div>
            </Space>
          </Card>
        </div>
      ),
    },
    {
      key: 'history',
      label: '历史记录',
      children: (
        <Card title="工作中心变更历史">
          <Timeline
            items={historyRecords.map((record, index) => ({
              key: index,
              children: (
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {record.date} - {record.type}
                  </div>
                  <div style={{ color: '#666' }}>{record.content}</div>
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#999' }}>
                    操作人: {record.operator}
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
            <span>{workCenter.wcName}</span>
            <Tag color={STATUS_MAP[workCenter.status]?.color}>
              {STATUS_MAP[workCenter.status]?.label}
            </Tag>
            <Tag color={CATEGORY_MAP[workCenter.category]?.color}>
              {CATEGORY_MAP[workCenter.category]?.label}
            </Tag>
            <Tag color="blue">产能: {workCenter.capacity} {workCenter.capacityUnit}</Tag>
          </Space>
        }
        extra={
          <Space>
            {onEdit && workCenter.status === 'ACTIVE' && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(workCenter)}
              >
                编辑
              </Button>
            )}
            <Button
              size="small"
              icon={<SettingOutlined />}
            >
              配置管理
            </Button>
            <Button
              size="small"
              icon={<LineChartOutlined />}
            >
              产能报告
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

export default WorkCenterDetail;