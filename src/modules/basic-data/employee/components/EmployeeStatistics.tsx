/**
 * Employee Statistics Component
 * Displays employee statistics in card format
 */

import React, { useMemo } from 'react';
import { Statistic, Row, Col } from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  TeamOutlined,
} from '@ant-design/icons';

interface EmployeeStatisticsProps {
  totalCount: number;
  activeCount: number;
  leaveCount: number;
  resignedCount: number;
  roleStats?: Record<string, number>;
}

export const EmployeeStatistics: React.FC<EmployeeStatisticsProps> = ({
  totalCount,
  activeCount,
  leaveCount,
  resignedCount,
  roleStats,
}) => {
  const teamLeaderCount = useMemo(() => roleStats?.['班组长'] || 0, [roleStats]);
  const operatorCount = useMemo(() => roleStats?.['操作工'] || 0, [roleStats]);
  const qcCount = useMemo(() => roleStats?.['QC'] || 0, [roleStats]);

  return (
    <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #e8ecf0' }}>
      <Row gutter={16}>
        <Col span={4}>
          <Statistic
            title="员工总数"
            value={totalCount}
            valueStyle={{ color: '#1677ff' }}
            prefix={<UserOutlined style={{ fontSize: 20 }} />}
          />
        </Col>
        <Col span={4}>
          <Statistic
            title="在岗"
            value={activeCount}
            valueStyle={{ color: '#52c41a' }}
            prefix={<CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />}
          />
        </Col>
        <Col span={4}>
          <Statistic
            title="请假"
            value={leaveCount}
            valueStyle={{ color: '#faad14' }}
            prefix={<ClockCircleOutlined style={{ fontSize: 20, color: '#faad14' }} />}
          />
        </Col>
        <Col span={4}>
          <Statistic
            title="离职"
            value={resignedCount}
            valueStyle={{ color: '#f5222d' }}
            prefix={<LogoutOutlined style={{ fontSize: 20, color: '#f5222d' }} />}
          />
        </Col>
        <Col span={8}>
          <div
            style={{
              fontSize: 14,
              color: '#64748b',
              textAlign: 'center',
              paddingTop: 10,
            }}
          >
            <TeamOutlined style={{ marginRight: 8 }} />
            班组长: {teamLeaderCount} 人 | 操作工: {operatorCount} 人 | QC: {qcCount} 人
          </div>
        </Col>
      </Row>
    </div>
  );
};