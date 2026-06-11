/**
 * 计量单位详情组件
 * 展示计量单位完整信息、换算配置、使用统计
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Divider, Tabs, Badge, Row, Col, Statistic } from 'antd';
import {
  CloseOutlined, EditOutlined, ApartmentOutlined, CalculatorOutlined,
  ClockCircleOutlined, CheckCircleOutlined, StopOutlined,
  HistoryOutlined, FileTextOutlined, SettingOutlined, ThunderboltOutlined
} from '@ant-design/icons';
import { UNIT_STATUS_MAP, UNIT_METHOD_MAP } from '../types';
import type { UnitItem } from '../types';

interface UnitDetailProps {
  unit: UnitItem;
  onClose: () => void;
  onEdit?: (unit: UnitItem) => void;
  onEnable?: (unit: UnitItem) => void;
  onDisable?: (unit: UnitItem) => void;
  onSetBase?: (unit: UnitItem) => void;
  onUnsetBase?: (unit: UnitItem) => void;
}

const UnitDetail: React.FC<UnitDetailProps> = ({
  unit,
  onClose,
  onEdit,
  onEnable,
  onDisable,
  onSetBase,
  onUnsetBase,
}) => {
  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      active: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      disabled: <StopOutlined style={{ color: '#cf1322' }} />,
    };
    return iconMap[status] || null;
  };

  const statusConfig = UNIT_STATUS_MAP[unit.status];
  const methodConfig = UNIT_METHOD_MAP[unit.method];

  // 模拟使用统计
  const usageStats = {
    useCount: 12500,
    materialCount: 45,
    orderCount: 890,
    convertCount: 680,
  };

  // 模拟相关单位
  const relatedUnits = [
    { id: '1', code: 'kg', name: 'kg', relation: '换算关系', rate: '1:1000' },
    { id: '2', code: 'g', name: 'g', relation: '换算关系', rate: '1:1000000' },
  ];

  // 模拟使用记录
  const usageHistory = [
    { date: '2024-01-15', type: '物料入库', count: 120, unit: 'kg' },
    { date: '2024-01-14', type: '生产工单', count: 85, unit: 'g' },
    { date: '2024-01-13', type: '物料入库', count: 200, unit: 'kg' },
    { date: '2024-01-12', type: '生产工单', count: 156, unit: 'g' },
    { date: '2024-01-11', type: '单位换算', count: 50000, unit: 'g' },
  ];

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Card title="计量单位基本信息" extra={
          <Space>
            {onEdit && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(unit)}
              >
                编辑
              </Button>
            )}
            {onDisable && unit.status === 'active' && (
              <Button
                size="small"
                icon={<StopOutlined />}
                onClick={() => onDisable(unit)}
              >
                禁用
              </Button>
            )}
            {onEnable && unit.status === 'disabled' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onEnable(unit)}
              >
                启用
              </Button>
            )}
            {onSetBase && !unit.isBase && unit.status === 'active' && (
              <Button
                size="small"
                icon={<SettingOutlined />}
                onClick={() => onSetBase(unit)}
              >
                设为基础单位
              </Button>
            )}
            {onUnsetBase && unit.isBase && unit.status === 'active' && (
              <Button
                size="small"
                icon={<SettingOutlined />}
                onClick={() => onUnsetBase(unit)}
              >
                取消基础单位
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
          {/* 单位标识 */}
          <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
            <CalculatorOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
            <div style={{ marginBottom: '8px' }}>
              <Space>
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{unit.name}</span>
                <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>{unit.code}</Tag>
                {unit.isBase && (
                  <Badge count="基础单位" style={{ backgroundColor: '#52c41a' }} />
                )}
              </Space>
            </div>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
              分组: {unit.groupName} | 英文名: {unit.enName || '无'}
            </div>
            <Space>
              {getStatusIcon(unit.status)}
              <Tag color={statusConfig.color} style={{ fontSize: '14px', padding: '4px 12px' }}>
                {statusConfig.label}
              </Tag>
            </Space>
          </div>

          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="单位编码" span={1}>
              {unit.code}
            </Descriptions.Item>
            <Descriptions.Item label="单位名称" span={1}>
              {unit.name}
            </Descriptions.Item>

            <Descriptions.Item label="英文名称" span={1}>
              {unit.enName || '无'}
            </Descriptions.Item>
            <Descriptions.Item label="单位分组" span={1}>
              {unit.groupName}
            </Descriptions.Item>

            <Descriptions.Item label="换算方法" span={1}>
              <Tag color="blue">{methodConfig.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="精度小数位数" span={1}>
              {unit.precision} 位
            </Descriptions.Item>

            <Descriptions.Item label="状态" span={1}>
              <Space>
                {getStatusIcon(unit.status)}
                <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="基础单位" span={1}>
              {unit.isBase ? <Tag color="green">是</Tag> : <Tag>否</Tag>}
            </Descriptions.Item>

            <Descriptions.Item label="创建时间" span={1}>
              {unit.createdAt || '未知'}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间" span={1}>
              {unit.updatedAt || '未知'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'config',
      label: '换算配置',
      children: (
        <Card title="换算配置" extra={<CalculatorOutlined style={{ color: '#1677ff' }} />}>
          {/* 换算方法 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>换算方法</div>
            <div style={{
              padding: '16px',
              background: '#e6f7ff',
              borderRadius: '4px',
              border: '1px solid #91d5ff',
              fontSize: '16px'
            }}>
              {methodConfig.label}
            </div>
          </div>

          {/* 精度配置 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>精度配置</div>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>小数位数</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#52c41a' }}>
                    {unit.precision} 位
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ textAlign: 'center', background: '#fff7e6' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>计算精度</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#faad14' }}>
                    10<sup>-{unit.precision}</sup>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>

          {/* 基础单位设置 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>基础单位设置</div>
            <div style={{
              padding: '16px',
              background: unit.isBase ? '#f6ffed' : '#f5f5f5',
              borderRadius: '4px',
              border: `1px solid ${unit.isBase ? '#b7eb8f' : '#d9d9d9'}`,
              textAlign: 'center'
            }}>
              {unit.isBase ? (
                <div>
                  <CheckCircleOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }} />
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                    当前是基础单位
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                    用于单位换算和统计计算
                  </div>
                </div>
              ) : (
                <div>
                  <ThunderboltOutlined style={{ fontSize: '32px', color: '#8c8c8c', marginBottom: '8px' }} />
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#8c8c8c' }}>
                    当前不是基础单位
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                    通过设置基础单位进行换算
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      ),
    },
    {
      key: 'related',
      label: '相关单位',
      children: (
        <Card title="相关单位" extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}>
          {relatedUnits.map(relatedUnit => (
            <Card
              key={relatedUnit.id}
              size="small"
              style={{ marginBottom: '12px', background: '#fafafa' }}
            >
              <Row gutter={16} align="middle">
                <Col span={8}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1677ff' }}>
                    {relatedUnit.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{relatedUnit.code}</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: '14px', color: '#666' }}>{relatedUnit.relation}</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                    {relatedUnit.rate}
                  </div>
                </Col>
              </Row>
            </Card>
          ))}
        </Card>
      ),
    },
    {
      key: 'usage',
      label: '使用统计',
      children: (
        <div>
          {/* 使用统计 */}
          <Card title="使用统计" style={{ marginBottom: '16px' }} extra={<FileTextOutlined style={{ color: '#1677ff' }} />}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="使用次数"
                  value={usageStats.useCount}
                  valueStyle={{ color: '#1677ff' }}
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="物料数量"
                  value={usageStats.materialCount}
                  suffix="种"
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<ApartmentOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="工单数量"
                  value={usageStats.orderCount}
                  suffix="个"
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<SettingOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="换算次数"
                  value={usageStats.convertCount}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<CalculatorOutlined />}
                />
              </Col>
            </Row>
          </Card>

          {/* 使用记录 */}
          <Card title="最近使用记录" extra={<HistoryOutlined style={{ color: '#1677ff' }} />}>
            <div style={{ background: '#fafafa', borderRadius: '4px', padding: '12px' }}>
              {usageHistory.map((record, index) => (
                <div
                  key={index}
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
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {record.date} - {record.type}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      数量: {record.count.toLocaleString()} {record.unit}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#1677ff', fontWeight: 'bold' }}>
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={
          <Space>
            <CalculatorOutlined style={{ color: '#1677ff' }} />
            <span>{unit.name}</span>
            <Tag color="blue">{unit.code}</Tag>
            <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
            {unit.isBase && (
              <Badge count="基础单位" style={{ backgroundColor: '#52c41a' }} />
            )}
          </Space>
        }
        extra={
          <Space>
            {onEdit && unit.status === 'active' && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(unit)}
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

export default UnitDetail;
