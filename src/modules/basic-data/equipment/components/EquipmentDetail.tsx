/**
 * 设备档案详情组件
 * 展示设备完整信息和状态监控
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Divider, Tabs, Statistic, Row, Col, Progress, Timeline } from 'antd';
import {
  CloseOutlined, EditOutlined, ToolOutlined, CheckCircleOutlined, StopOutlined,
  WarningOutlined, DashboardOutlined, FileTextOutlined, HistoryOutlined,
  QrcodeOutlined, CameraOutlined, SettingOutlined
} from '@ant-design/icons';
import { EQUIP_STATUS_MAP, EQUIP_CATEGORY_MAP } from '../types';
import type { EquipRecord } from '../types';

interface EquipmentDetailProps {
  equipment: EquipRecord;
  onClose: () => void;
  onEdit?: (equipment: EquipRecord) => void;
  onMaintenance?: (equipment: EquipRecord) => void;
  onCalibration?: (equipment: EquipRecord) => void;
}

const EquipmentDetail: React.FC<EquipmentDetailProps> = ({
  equipment,
  onClose,
  onEdit,
  onMaintenance,
  onCalibration,
}) => {
  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      ACTIVE: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      IDLE: <DashboardOutlined style={{ color: '#1677ff' }} />,
      MAINTENANCE: <ToolOutlined style={{ color: '#faad14' }} />,
      FAULT: <WarningOutlined style={{ color: '#cf1322' }} />,
      DISABLED: <StopOutlined style={{ color: '#8c8c8c' }} />,
    };
    return iconMap[status] || null;
  };

  // 模拟保养历史数据
  const maintenanceHistory = [
    {
      date: '2026-04-15',
      type: '计划保养',
      content: '年度定期保养',
      operator: '张工程师',
      status: 'completed',
    },
    {
      date: '2026-03-10',
      type: '故障维修',
      content: '主轴异响处理',
      operator: '李工程师',
      status: 'completed',
    },
    {
      date: '2026-02-20',
      type: '校准',
      content: '精度校准',
      operator: '王技术员',
      status: 'completed',
    },
  ];

  // 模拟运行参数
  const runtimeParams = {
    currentOee: equipment.currentOee || 85,
    targetOee: equipment.oeeTarget || 85,
    runtime: 1250, // 小时
    cycleCount: 45600, // 循环次数
    temperature: 65, // 温度
    vibration: 0.8, // 振动值
  };

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Card title="设备基本信息" extra={
          <Space>
            {onEdit && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(equipment)}
              >
                编辑
              </Button>
            )}
            {onMaintenance && equipment.status === 'ACTIVE' && (
              <Button
                size="small"
                icon={<ToolOutlined />}
                onClick={() => onMaintenance(equipment)}
              >
                保养
              </Button>
            )}
            {onCalibration && (
              <Button
                size="small"
                icon={<SettingOutlined />}
                onClick={() => onCalibration(equipment)}
              >
                校准
              </Button>
            )}
            <Button
              size="small"
              icon={<QrcodeOutlined />}
            >
              二维码
            </Button>
            <Button
              size="small"
              icon={<CameraOutlined />}
            >
              拍照
            </Button>
          </Space>
        }>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="设备编码" span={1}>
              {equipment.equipCode}
            </Descriptions.Item>
            <Descriptions.Item label="设备名称" span={1}>
              {equipment.equipName}
            </Descriptions.Item>

            <Descriptions.Item label="设备类别" span={1}>
              {EQUIP_CATEGORY_MAP[equipment.category]?.label || equipment.category}
            </Descriptions.Item>
            <Descriptions.Item label="型号规格" span={1}>
              {equipment.model}
            </Descriptions.Item>

            <Descriptions.Item label="品牌/厂商" span={1}>
              {equipment.brand}
            </Descriptions.Item>
            <Descriptions.Item label="出厂序列号" span={1}>
              {equipment.serialNo || '-'}
            </Descriptions.Item>

            <Descriptions.Item label="所属车间" span={1}>
              {equipment.workshop}
            </Descriptions.Item>
            <Descriptions.Item label="工作中心" span={1}>
              {equipment.workCenter}
            </Descriptions.Item>

            <Descriptions.Item label="安装位置" span={1}>
              {equipment.location}
            </Descriptions.Item>
            <Descriptions.Item label="资产编号" span={1}>
              {equipment.assetNo || '-'}
            </Descriptions.Item>

            <Descriptions.Item label="购入日期" span={1}>
              {equipment.purchaseDate}
            </Descriptions.Item>
            <Descriptions.Item label="安装验收日期" span={1}>
              {equipment.installDate || '-'}
            </Descriptions.Item>

            <Descriptions.Item label="保质期至" span={1}>
              {equipment.warrantyDate}
            </Descriptions.Item>
            <Descriptions.Item label="状态" span={1}>
              <Space>
                {getStatusIcon(equipment.status)}
                <Tag color={EQUIP_STATUS_MAP[equipment.status]?.color}>
                  {EQUIP_STATUS_MAP[equipment.status]?.label}
                </Tag>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="特殊工序设备" span={1}>
              {equipment.isSpecialProcess ? '是' : '否'}
            </Descriptions.Item>
            <Descriptions.Item label="需要验证" span={1}>
              {equipment.isValidationRequired ? '是' : '否'}
            </Descriptions.Item>

            <Descriptions.Item label="精度/关键参数" span={1}>
              {equipment.precision || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="OEE目标" span={1}>
              {equipment.oeeTarget ? `${equipment.oeeTarget}%` : '-'}
            </Descriptions.Item>

            <Descriptions.Item label="创建时间" span={1}>
              {equipment.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间" span={1}>
              {equipment.updatedAt}
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={2}>
              {equipment.remark || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'runtime',
      label: '运行监控',
      children: (
        <div>
          {/* OEE指标 */}
          <Card title="设备综合效率(OEE)" style={{ marginBottom: '16px' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="当前OEE"
                  value={runtimeParams.currentOee}
                  suffix="%"
                  valueStyle={{ color: runtimeParams.currentOee >= 80 ? '#52c41a' : runtimeParams.currentOee >= 60 ? '#faad14' : '#cf1322' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="目标OEE"
                  value={runtimeParams.targetOee}
                  suffix="%"
                  valueStyle={{ color: '#1677ff' }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: '16px' }}>
              <Progress
                percent={runtimeParams.currentOee}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                format={(percent) => `${percent}%`}
              />
            </div>
          </Card>

          {/* 运行参数 */}
          <Card title="运行参数" style={{ marginBottom: '16px' }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="运行时长"
                  value={runtimeParams.runtime}
                  suffix="小时"
                  prefix={<DashboardOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="循环次数"
                  value={runtimeParams.cycleCount}
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="设备温度"
                  value={runtimeParams.temperature}
                  suffix="°C"
                  valueStyle={{ color: runtimeParams.temperature > 80 ? '#cf1322' : '#1677ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="振动值"
                  value={runtimeParams.vibration}
                  precision={2}
                  suffix="mm/s"
                  valueStyle={{ color: runtimeParams.vibration > 2 ? '#cf1322' : '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>

          {/* 运行状态 */}
          <Card title="运行状态">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <span style={{ marginRight: '8px' }}>主电机:</span>
                <Tag color="green">运行正常</Tag>
              </div>
              <div>
                <span style={{ marginRight: '8px' }}>液压系统:</span>
                <Tag color="green">压力正常</Tag>
              </div>
              <div>
                <span style={{ marginRight: '8px' }}>冷却系统:</span>
                <Tag color="blue">自动运行</Tag>
              </div>
              <div>
                <span style={{ marginRight: '8px' }}>安全系统:</span>
                <Tag color="green">安全保护正常</Tag>
              </div>
            </Space>
          </Card>
        </div>
      ),
    },
    {
      key: 'maintenance',
      label: '保养历史',
      children: (
        <Card title="保养历史记录">
          <Timeline
            items={maintenanceHistory.map((item, index) => ({
              key: index,
              children: (
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {item.date} - {item.type}
                  </div>
                  <div style={{ color: '#666' }}>{item.content}</div>
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#999' }}>
                    操作人: {item.operator} | 状态: <Tag color="green">{item.status === 'completed' ? '已完成' : '进行中'}</Tag>
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
            <span>{equipment.equipName}</span>
            <Tag color={EQUIP_STATUS_MAP[equipment.status]?.color}>
              {EQUIP_STATUS_MAP[equipment.status]?.label}
            </Tag>
            <Tag color={EQUIP_CATEGORY_MAP[equipment.category]?.color}>
              {EQUIP_CATEGORY_MAP[equipment.category]?.label}
            </Tag>
            <Tag color="blue">OEE: {equipment.currentOee || 0}%</Tag>
          </Space>
        }
        extra={
          <Space>
            {onEdit && equipment.status === 'ACTIVE' && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(equipment)}
              >
                编辑
              </Button>
            )}
            {onMaintenance && (
              <Button
                size="small"
                icon={<ToolOutlined />}
                onClick={() => onMaintenance(equipment)}
              >
                保养
              </Button>
            )}
            <Button
              size="small"
              icon={<QrcodeOutlined />}
            >
              二维码
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

export default EquipmentDetail;