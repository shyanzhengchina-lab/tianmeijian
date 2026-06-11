/**
 * 员工档案详情组件
 * 展示员工完整信息、技能证书、工作记录等
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Divider, Tabs, Timeline, Badge, Avatar, Row, Col, Statistic } from 'antd';
import {
  CloseOutlined, EditOutlined, UserOutlined, PhoneOutlined, IdcardOutlined,
  TeamOutlined, SafetyCertificateOutlined, ApartmentOutlined, ClockCircleOutlined,
  CheckCircleOutlined, StopOutlined, LogoutOutlined, HistoryOutlined,
  FileTextOutlined, TrophyOutlined, StarOutlined
} from '@ant-design/icons';
import { EMPLOYEE_STATUS_MAP, EMPLOYEE_ROLE_MAP } from '../types';
import type { Employee } from '../types';

interface EmployeeDetailProps {
  employee: Employee;
  onClose: () => void;
  onEdit?: (employee: Employee) => void;
  onLeave?: (employee: Employee) => void;
  onResign?: (employee: Employee) => void;
  onActivate?: (employee: Employee) => void;
}

const EmployeeDetail: React.FC<EmployeeDetailProps> = ({
  employee,
  onClose,
  onEdit,
  onLeave,
  onResign,
  onActivate,
}) => {
  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      ACTIVE: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      LEAVE: <ClockCircleOutlined style={{ color: '#faad14' }} />,
      RESIGNED: <LogoutOutlined style={{ color: '#f5222d' }} />,
    };
    return iconMap[status] || null;
  };

  const roleConfig = EMPLOYEE_ROLE_MAP[employee.role];
  const statusConfig = EMPLOYEE_STATUS_MAP[employee.status];

  // 模拟工作记录
  const workHistory = [
    { date: '2024-01-15', type: '工作记录', desc: '参与生产订单PRO-001，完成数控磨削工序，产量120件', status: 'completed' },
    { date: '2024-01-10', type: '培训记录', desc: '完成设备维护培训，获得设备维修资质', status: 'completed' },
    { date: '2024-01-05', type: '质检记录', desc: '参与产品质量抽检，合格率98%', status: 'completed' },
    { date: '2023-12-20', type: '工作记录', desc: '参与生产订单PRO-008，完成螺纹滚压工序，产量85件', status: 'completed' },
    { date: '2023-12-15', type: '工作记录', desc: '完成设备定期保养，设备运行正常', status: 'completed' },
  ];

  // 模拟绩效统计
  const performanceStats = {
    totalWorkDays: 256,
    avgEfficiency: 96.5,
    qualityRate: 98.2,
    overtimeDays: 12,
    trainingHours: 45,
    bonusPoints: 1280,
  };

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Card title="员工基本信息" extra={
          <Space>
            {onEdit && employee.status === 'ACTIVE' && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(employee)}
              >
                编辑
              </Button>
            )}
            {onLeave && employee.status === 'ACTIVE' && (
              <Button
                size="small"
                icon={<ClockCircleOutlined />}
                onClick={() => onLeave(employee)}
              >
                请假
              </Button>
            )}
            {onResign && employee.status === 'ACTIVE' && (
              <Button
                size="small"
                icon={<StopOutlined />}
                onClick={() => onResign(employee)}
              >
                离职
              </Button>
            )}
            {onActivate && employee.status !== 'ACTIVE' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onActivate(employee)}
              >
                恢复
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
          {/* 员工头像和基本信息 */}
          <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
            <Avatar size={120} icon={<UserOutlined />} style={{ marginBottom: '16px', backgroundColor: '#1677ff' }} />
            <div style={{ marginBottom: '8px' }}>
              <Space>
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{employee.name}</span>
                <Tag color={roleConfig.color} style={{ fontSize: '14px', padding: '4px 12px' }}>{employee.role}</Tag>
                {employee.role === '班组长' && (
                  <StarOutlined style={{ color: '#d46b08', fontSize: '20px' }} />
                )}
              </Space>
            </div>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
              {employee.code} | {employee.teamName || '未分配班组'}
            </div>
            <Space>
              {getStatusIcon(employee.status)}
              <Tag color={statusConfig.color} style={{ fontSize: '14px', padding: '4px 12px' }}>
                {statusConfig.label}
              </Tag>
            </Space>
          </div>

          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="工号" span={1}>
              {employee.code}
            </Descriptions.Item>
            <Descriptions.Item label="角色" span={1}>
              <Tag color={roleConfig.color}>{roleConfig.label}</Tag>
            </Descriptions.Item>

            <Descriptions.Item label="所属班组" span={1}>
              {employee.teamName || '未分配班组'}
            </Descriptions.Item>
            <Descriptions.Item label="所属车间" span={1}>
              {employee.workshopCode || '未分配'}
            </Descriptions.Item>

            <Descriptions.Item label="联系电话" span={1}>
              {employee.phone || '未填写'}
            </Descriptions.Item>
            <Descriptions.Item label="身份证号" span={1}>
              {employee.idCard || '未填写'}
            </Descriptions.Item>

            <Descriptions.Item label="入职日期" span={1}>
              {employee.entryDate || '未填写'}
            </Descriptions.Item>
            <Descriptions.Item label="员工状态" span={1}>
              <Space>
                {getStatusIcon(employee.status)}
                <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="创建时间" span={1}>
              {employee.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间" span={1}>
              {employee.updatedAt}
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={2}>
              {employee.remark || '无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'skills',
      label: '技能证书',
      children: (
        <div>
          <Card
            title="技能/资质"
            style={{ marginBottom: '16px' }}
            extra={<SafetyCertificateOutlined style={{ color: '#1677ff' }} />}
          >
            <div style={{ padding: '16px' }}>
              <Space wrap size={[8, 8]}>
                {employee.skills && employee.skills.length > 0 ? (
                  employee.skills.map(skill => (
                    <Tag
                      key={skill}
                      color="blue"
                      style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '4px' }}
                    >
                      {skill}
                    </Tag>
                  ))
                ) : (
                  <span style={{ color: '#999' }}>暂无技能信息</span>
                )}
              </Space>
            </div>
          </Card>

          <Card
            title="上岗证书"
            style={{ marginBottom: '16px' }}
            extra={<FileTextOutlined style={{ color: '#1677ff' }} />}
          >
            <div style={{ padding: '16px' }}>
              <Space wrap size={[8, 8]}>
                {employee.certifications && employee.certifications.length > 0 ? (
                  employee.certifications.map(cert => (
                    <Tag
                      key={cert}
                      color="green"
                      style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '4px' }}
                    >
                      {cert}
                    </Tag>
                  ))
                ) : (
                  <span style={{ color: '#999' }}>暂无证书信息</span>
                )}
              </Space>
            </div>
          </Card>

          {employee.entryDate && (
            <Card title="工龄信息">
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="入职时间"
                    value={employee.entryDate}
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="工作年限"
                    value={Math.floor((new Date().getTime() - new Date(employee.entryDate).getTime()) / (1000 * 60 * 60 * 24 * 365))}
                    suffix="年"
                    valueStyle={{ fontSize: '20px', color: '#1677ff' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="在岗天数"
                    value={performanceStats.totalWorkDays}
                    suffix="天"
                    valueStyle={{ fontSize: '20px', color: '#52c41a' }}
                  />
                </Col>
              </Row>
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'performance',
      label: '绩效统计',
      children: (
        <div>
          {/* 绩效指标 */}
          <Card title="绩效指标" style={{ marginBottom: '16px' }} extra={<TrophyOutlined style={{ color: '#1677ff' }} />}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="平均效率"
                  value={performanceStats.avgEfficiency}
                  suffix="%"
                  valueStyle={{ color: performanceStats.avgEfficiency >= 95 ? '#52c41a' : '#faad14' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="质量合格率"
                  value={performanceStats.qualityRate}
                  suffix="%"
                  valueStyle={{ color: performanceStats.qualityRate >= 98 ? '#52c41a' : '#faad14' }}
                  prefix={<StarOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="加班天数"
                  value={performanceStats.overtimeDays}
                  suffix="天"
                  valueStyle={{ color: '#1677ff' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="积分奖励"
                  value={performanceStats.bonusPoints}
                  valueStyle={{ color: '#d46b08' }}
                  prefix={<TrophyOutlined />}
                />
              </Col>
            </Row>
          </Card>

          {/* 其他指标 */}
          <Card title="培训记录">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="培训时长"
                  value={performanceStats.trainingHours}
                  suffix="小时"
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<SafetyCertificateOutlined />}
                />
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>技能证书</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1677ff' }}>
                    {employee.skills?.length || 0} + {employee.certifications?.length || 0}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      ),
    },
    {
      key: 'history',
      label: '工作记录',
      children: (
        <Card title="工作记录" extra={<HistoryOutlined style={{ color: '#1677ff' }} />}>
          <Timeline
            items={workHistory.map((record, index) => ({
              key: index,
              children: (
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {record.date} - {record.type}
                    <Badge
                      status={record.status === 'completed' ? 'success' : 'processing'}
                      style={{ marginLeft: '8px' }}
                    />
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
            <UserOutlined style={{ color: '#1677ff' }} />
            <span>{employee.name}</span>
            <Tag color={roleConfig.color}>{roleConfig.label}</Tag>
            <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
            <Tag color="blue">{employee.code}</Tag>
          </Space>
        }
        extra={
          <Space>
            {onEdit && employee.status === 'ACTIVE' && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(employee)}
              >
                编辑
              </Button>
            )}
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
        }
      >
        <Tabs defaultActiveKey="basic" items={tabItems} />
      </Card>
    </div>
  );
};

export default EmployeeDetail;
