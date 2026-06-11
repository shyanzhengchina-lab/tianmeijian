/**
 * 班组档案详情组件
 * 展示班组完整信息和人员配置
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Divider, Tabs, Statistic, Row, Col, Avatar, List } from 'antd';
import {
  CloseOutlined, EditOutlined, TeamOutlined, UserOutlined, ClockCircleOutlined,
  CheckCircleOutlined, ApartmentOutlined, HistoryOutlined, SettingOutlined,
  DashboardOutlined, LineChartOutlined, WarningOutlined, BookOutlined
} from '@ant-design/icons';
import { TEAM_STATUS_MAP } from '../types';
import type { Team } from '../types';

interface TeamDetailProps {
  team: Team;
  onClose: () => void;
  onEdit?: (team: Team) => void;
  onMembers?: (team: Team) => void;
}

const TeamDetail: React.FC<TeamDetailProps> = ({
  team,
  onClose,
  onEdit,
  onMembers,
}) => {
  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      ACTIVE: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      DISABLED: <ApartmentOutlined style={{ color: '#8c8c8c' }} />,
    };
    return iconMap[status] || null;
  };

  // 模拟班组人员数据
  const members = [
    { id: '1', name: '张三', role: '操作工', skill: '高级', status: 'active', avatar: 'ZS' },
    { id: '2', name: '李四', role: '操作工', skill: '中级', status: 'active', avatar: 'LS' },
    { id: '3', name: '王五', role: '操作工', skill: '初级', status: 'active', avatar: 'WW' },
    { id: '4', name: '赵六', role: '操作工', skill: '中级', status: 'active', avatar: 'ZL' },
    { id: '5', name: '钱七', role: '质检员', skill: '高级', status: 'active', avatar: 'QQ' },
    { id: '6', name: '孙八', role: '组长', skill: '高级', status: 'active', avatar: 'SB' },
    { id: '7', name: '周九', role: '操作工', skill: '初级', status: 'leave', avatar: 'ZJ' },
    { id: '8', name: '吴十', role: '操作工', skill: '中级', status: 'active', avatar: 'WS' },
  ];

  // 模拟班次信息
  const shiftInfo = {
    shiftCode: team.shiftId || '未配置',
    shiftName: '白班A',
    workTime: '08:00-16:00',
    duration: 8,
    totalWorkHours: 8 * team.headCount,
    efficiency: 92,
    qualityRate: 96,
  };

  // 模拟班组统计数据
  const teamStats = {
    totalOutput: 12500,
    avgEfficiency: 90,
    avgQuality: 95,
    defectRate: 0.5,
    attendanceRate: 98,
    overtimeCount: 3,
    trainingHours: 45,
  };

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Card title="班组基本信息" extra={
          <Space>
            {onEdit && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(team)}
              >
                编辑
              </Button>
            )}
            {onMembers && (
              <Button
                size="small"
                icon={<TeamOutlined />}
                onClick={() => onMembers(team)}
              >
                人员管理
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
            <Descriptions.Item label="班组名称" span={1}>
              {team.name}
            </Descriptions.Item>
            <Descriptions.Item label="工作中心" span={1}>
              {team.workCenter}
            </Descriptions.Item>

            <Descriptions.Item label="所属车间" span={1}>
              {team.workshop}
            </Descriptions.Item>
            <Descriptions.Item label="工厂ID" span={1}>
              {team.factoryId}
            </Descriptions.Item>

            <Descriptions.Item label="班次" span={1}>
              {shiftInfo.shiftName} ({shiftInfo.shiftCode})
            </Descriptions.Item>
            <Descriptions.Item label="班组长" span={1}>
              {team.leader}
            </Descriptions.Item>

            <Descriptions.Item label="班组人数" span={1}>
              {team.headCount} 人
            </Descriptions.Item>
            <Descriptions.Item label="状态" span={1}>
              <Space>
                {getStatusIcon(team.status)}
                <Tag color={TEAM_STATUS_MAP[team.status]?.color}>
                  {TEAM_STATUS_MAP[team.status]?.label}
                </Tag>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="工作时间" span={1}>
              {shiftInfo.workTime}
            </Descriptions.Item>
            <Descriptions.Item label="班次时长" span={1}>
              {shiftInfo.duration} 小时
            </Descriptions.Item>

            <Descriptions.Item label="创建时间" span={1}>
              {team.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间" span={1}>
              {team.updatedAt}
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={2}>
              {team.remark || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'members',
      label: `班组成员 (${members.length}人)`,
      children: (
        <Card title="班组成员管理">
          <Row gutter={16}>
            <Col span={18}>
              <List
                dataSource={members}
                renderItem={(member) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{
                          backgroundColor: '#1890ff',
                          color: '#fff',
                        }}>
                          {member.avatar}
                        </Avatar>
                      }
                      title={member.name}
                      description={
                        <Space>
                          <Tag>{member.role}</Tag>
                          <Tag color={member.skill === '高级' ? 'green' : member.skill === '中级' ? 'blue' : 'default'}>
                            {member.skill === '高级' ? '高级技能' : member.skill === '中级' ? '中级技能' : '初级技能'}
                          </Tag>
                          <Tag color={member.status === 'active' ? 'green' : 'red'}>
                            {member.status === 'active' ? '在岗' : '休假'}
                          </Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Avatar size={64} icon={<TeamOutlined />} />
                <div style={{ marginTop: '8px', fontWeight: 'bold' }}>
                  {team.headCount}人
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  在岗 {members.filter(m => m.status === 'active').length}人
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  休假 {members.filter(m => m.status !== 'active').length}人
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      ),
    },
    {
      key: 'performance',
      label: '班组绩效',
      children: (
        <div>
          {/* 绩效指标 */}
          <Card title="班组绩效指标" style={{ marginBottom: '16px' }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="总产量"
                  value={teamStats.totalOutput}
                  suffix="件"
                  prefix={<DashboardOutlined />}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="平均效率"
                  value={teamStats.avgEfficiency}
                  suffix="%"
                  prefix={<LineChartOutlined />}
                  valueStyle={{ color: teamStats.avgEfficiency >= 90 ? '#52c41a' : '#faad14' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="平均良品率"
                  value={teamStats.avgQuality}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: teamStats.avgQuality >= 95 ? '#52c41a' : '#faad14' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="不合格率"
                  value={teamStats.defectRate}
                  suffix="%"
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: teamStats.defectRate <= 1 ? '#52c41a' : '#cf1322' }}
                />
              </Col>
            </Row>
          </Card>

          {/* 其他指标 */}
          <Card title="其他指标">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="出勤率"
                  value={teamStats.attendanceRate}
                  suffix="%"
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="加班次数"
                  value={teamStats.overtimeCount}
                  suffix="次"
                  prefix={<HistoryOutlined />}
                  valueStyle={{ color: '#1677ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="培训时长"
                  value={teamStats.trainingHours}
                  suffix="小时"
                  prefix={<BookOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
          </Card>
        </div>
      ),
    },
    {
      key: 'shift',
      label: '班次配置',
      children: (
        <Card title="班次配置">
          <Descriptions bordered column={2}>
            <Descriptions.Item label="班次代码" span={1}>
              {shiftInfo.shiftCode}
            </Descriptions.Item>
            <Descriptions.Item label="班次名称" span={1}>
              {shiftInfo.shiftName}
            </Descriptions.Item>

            <Descriptions.Item label="工作时间" span={1}>
              {shiftInfo.workTime}
            </Descriptions.Item>
            <Descriptions.Item label="班次时长" span={1}>
              {shiftInfo.duration} 小时
            </Descriptions.Item>

            <Descriptions.Item label="总工时" span={1}>
              {shiftInfo.totalWorkHours} 小时
            </Descriptions.Item>
            <Descriptions.Item label="人均工时" span={1}>
              {(shiftInfo.totalWorkHours / team.headCount).toFixed(1)} 小时/人
            </Descriptions.Item>

            <Descriptions.Item label="效率目标" span={1}>
              85%
            </Descriptions.Item>
            <Descriptions.Item label="实际效率" span={1}>
              <Tag color={shiftInfo.efficiency >= 85 ? 'green' : 'orange'}>
                {shiftInfo.efficiency}%
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="质量目标" span={1}>
              95%
            </Descriptions.Item>
            <Descriptions.Item label="实际质量" span={1}>
              <Tag color={shiftInfo.qualityRate >= 95 ? 'green' : 'orange'}>
                {shiftInfo.qualityRate}%
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={
          <Space>
            <span>{team.name}</span>
            <Tag color={TEAM_STATUS_MAP[team.status]?.color}>
              {TEAM_STATUS_MAP[team.status]?.label}
            </Tag>
            <Tag color="blue">{team.headCount}人</Tag>
            <Tag color="purple">{team.workCenter}</Tag>
          </Space>
        }
        extra={
          <Space>
            {onEdit && team.status === 'ACTIVE' && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(team)}
              >
                编辑
              </Button>
            )}
            {onMembers && (
              <Button
                size="small"
                icon={<TeamOutlined />}
                onClick={() => onMembers(team)}
              >
                人员管理
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

export default TeamDetail;