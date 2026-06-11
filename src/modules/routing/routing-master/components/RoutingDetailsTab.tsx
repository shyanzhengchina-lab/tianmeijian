/**
 * Routing Details Tab Component
 * Extracted from RoutingMasterDetail.tsx to reduce deep nesting
 */

import React from 'react';
import { Card, Row, Col, Statistic, Badge, Tag, Space, Button, Timeline, Timeline as TimelineComponent } from 'antd';
import { DashboardOutlined, SettingOutlined, BranchesOutlined, ToolOutlined, FileTextOutlined, ShoppingOutlined, HistoryOutlined, CheckCircleOutlined, PlayCircleOutlined, StopOutlined, UndoOutlined } from '@ant-design/icons';
import type { RoutingDetail, RoutingStats } from '../types';

interface RoutingDetailsTabProps {
  routingDetails: RoutingDetail[];
  routingStats: RoutingStats;
  onEdit?: (detail: RoutingDetail) => void;
}

/**
 * Single Routing Detail Card Item
 */
const RoutingDetailItem: React.FC<{ detail: RoutingDetail; index: number }> = ({ detail, index }) => {
  return (
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
    </div>
  );
};

/**
 * Statistics Section Component
 */
const RoutingStatsSection: React.FC<{ routingStats: RoutingStats }> = ({ routingStats }) => {
  return (
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
  );
};

/**
 * Timeline Section Component
 */
const RoutingTimelineSection: React.FC<{ routingDetails: RoutingDetail[] }> = ({ routingDetails }) => {
  return (
    <Timeline>
      {routingDetails.map((detail, index) => (
        <Timeline.Item key={index}>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {detail.date} - {detail.event}
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              {detail.desc}
            </div>
          </div>
        </Timeline.Item>
      ))}
    </Timeline>
  );
};

/**
 * Routing Details Tab Component
 */
export const RoutingDetailsTab: React.FC<RoutingDetailsTabProps> = ({
  routingDetails,
  routingStats,
  onEdit
}) => {
  return (
    <div>
      {/* Statistics Section */}
      <RoutingStatsSection routingStats={routingStats} />

      {/* Details Section */}
      <Card title="工序明细" extra={<SettingOutlined style={{ color: '#1677ff' }} />}>
        <div style={{ background: '#fafafa', borderRadius: '4px', padding: '12px' }}>
          {routingDetails.map((detail, index) => (
            <RoutingDetailItem detail={detail} index={index} />
          ))}
        </div>
      </Card>
    </div>
  );
};
