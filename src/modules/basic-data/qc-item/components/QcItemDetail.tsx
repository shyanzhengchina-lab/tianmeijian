/**
 * 质检项目详情组件
 * 展示质检项目完整信息、标准值配置、适用范围等
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Divider, Tabs, Badge, Row, Col, Statistic } from 'antd';
import {
  CloseOutlined, EditOutlined, ExperimentOutlined, SafetyCertificateOutlined,
  ApartmentOutlined, ClockCircleOutlined, CheckCircleOutlined, StopOutlined,
  CopyOutlined, HistoryOutlined, FileTextOutlined, DashboardOutlined
} from '@ant-design/icons';
import { QC_ITEM_STATUS_MAP, QC_ITEM_CATEGORY_MAP, QC_STANDARD_TYPE_MAP, QC_APPLY_TYPE_MAP } from '../types';
import type { QcItem } from '../types';

interface QcItemDetailProps {
  qcItem: QcItem;
  onClose: () => void;
  onEdit?: (qcItem: QcItem) => void;
  onCopy?: (qcItem: QcItem) => void;
  onActivate?: (qcItem: QcItem) => void;
  onDeactivate?: (qcItem: QcItem) => void;
}

const QcItemDetail: React.FC<QcItemDetailProps> = ({
  qcItem,
  onClose,
  onEdit,
  onCopy,
  onActivate,
  onDeactivate,
}) => {
  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      ACTIVE: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      INACTIVE: <StopOutlined style={{ color: '#8c8c8c' }} />,
      DRAFT: <ClockCircleOutlined style={{ color: '#faad14' }} />,
    };
    return iconMap[status] || null;
  };

  const categoryConfig = QC_ITEM_CATEGORY_MAP[qcItem.category];
  const standardTypeConfig = QC_STANDARD_TYPE_MAP[qcItem.standardType];
  const statusConfig = QC_ITEM_STATUS_MAP[qcItem.status];

  // 模拟使用统计
  const usageStats = {
    schemeCount: 5,
    inspectionCount: 1280,
    passRate: 99.2,
    avgScore: 98.5,
  };

  // 模拟检验记录
  const inspectionHistory = [
    { date: '2024-01-15', type: 'FQC检验', result: 'PASS', value: '0.248' },
    { date: '2024-01-14', type: 'IPQC自检', result: 'PASS', value: '0.252' },
    { date: '2024-01-14', type: 'IPQC巡检', result: 'PASS', value: '0.250' },
    { date: '2024-01-13', type: 'FQC检验', result: 'PASS', value: '0.251' },
    { date: '2024-01-12', type: 'IPQC首检', result: 'PASS', value: '0.247' },
  ];

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Card title="质检项目基本信息" extra={
          <Space>
            {onEdit && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(qcItem)}
              >
                编辑
              </Button>
            )}
            {onCopy && (
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => onCopy(qcItem)}
              >
                复制
              </Button>
            )}
            {onActivate && qcItem.status === 'INACTIVE' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onActivate(qcItem)}
              >
                启用
              </Button>
            )}
            {onDeactivate && qcItem.status === 'ACTIVE' && (
              <Button
                size="small"
                icon={<StopOutlined />}
                onClick={() => onDeactivate(qcItem)}
              >
                停用
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
          {/* 项目标识 */}
          <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
            <ExperimentOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
            <div style={{ marginBottom: '8px' }}>
              <Space>
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{qcItem.itemName}</span>
                <Tag color={categoryConfig.color} style={{ fontSize: '14px', padding: '4px 12px' }}>
                  {categoryConfig.label}
                </Tag>
                {qcItem.isCritical && (
                  <Badge count="关键项" style={{ backgroundColor: '#cf1322' }} />
                )}
              </Space>
            </div>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
              {qcItem.itemCode}
            </div>
            <Space>
              {getStatusIcon(qcItem.status)}
              <Tag color={statusConfig.color} style={{ fontSize: '14px', padding: '4px 12px' }}>
                {statusConfig.label}
              </Tag>
              <Tag color="blue">{qcItem.version}</Tag>
            </Space>
          </div>

          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="项目编码" span={1}>
              {qcItem.itemCode}
            </Descriptions.Item>
            <Descriptions.Item label="项目名称" span={1}>
              {qcItem.itemName}
            </Descriptions.Item>

            <Descriptions.Item label="检验大类" span={1}>
              <Tag color={categoryConfig.color}>{categoryConfig.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="标准值类型" span={1}>
              <Tag color={standardTypeConfig.color}>{standardTypeConfig.label}</Tag>
            </Descriptions.Item>

            <Descriptions.Item label="量具类型" span={1}>
              {qcItem.instrumentType || '未指定'}
            </Descriptions.Item>
            <Descriptions.Item label="版本" span={1}>
              {qcItem.version}
            </Descriptions.Item>

            <Descriptions.Item label="关键项" span={1}>
              {qcItem.isCritical ? <Tag color="red">是</Tag> : <Tag>否</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="必检项" span={1}>
              {qcItem.isRequired ? <Tag color="green">是</Tag> : <Tag>否</Tag>}
            </Descriptions.Item>

            <Descriptions.Item label="引用标准" span={2}>
              {qcItem.refStandard || '未指定'}
            </Descriptions.Item>

            <Descriptions.Item label="创建时间" span={1}>
              {qcItem.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间" span={1}>
              {qcItem.updatedAt}
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={2}>
              {qcItem.remark || '无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'standard',
      label: '标准值配置',
      children: (
        <Card title="标准值配置" extra={<SafetyCertificateOutlined style={{ color: '#1677ff' }} />}>
          {/* 标准值描述 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>标准值描述</div>
            <div style={{
              padding: '12px',
              background: '#e6f7ff',
              borderRadius: '4px',
              border: '1px solid #91d5ff',
              fontSize: '16px'
            }}>
              {qcItem.standardValue || '未配置'}
            </div>
          </div>

          {/* 数值型配置 */}
          {qcItem.standardType === 'NUMERIC' && (
            <>
              <Divider orientation={"left" as any}>数值范围</Divider>
              <Row gutter={16}>
                <Col span={8}>
                  <Card size="small" title="下限值" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1677ff' }}>
                      {qcItem.minValue !== undefined ? `${qcItem.minValue}` : '—'}
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="上限值" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1677ff' }}>
                      {qcItem.maxValue !== undefined ? `${qcItem.maxValue}` : '—'}
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="单位" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                      {qcItem.unit || '—'}
                    </div>
                  </Card>
                </Col>
              </Row>
            </>
          )}

          {/* 枚举型配置 */}
          {qcItem.standardType === 'ENUM' && qcItem.enumOptions && (
            <>
              <Divider orientation={"left" as any}>合格选项</Divider>
              <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
                <Space wrap>
                  {qcItem.enumOptions.map((option, index) => (
                    <Tag key={index} color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>
                      ✓ {option}
                    </Tag>
                  ))}
                </Space>
              </div>
            </>
          )}

          {/* 布尔型配置 */}
          {qcItem.standardType === 'BOOLEAN' && (
            <>
              <Divider orientation={"left" as any}>判断标准</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" style={{ textAlign: 'center', background: '#f6ffed', borderColor: '#b7eb8f' }}>
                    <CheckCircleOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }} />
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>合格/通过</div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ textAlign: 'center', background: '#fff1f0', borderColor: '#ffa39e' }}>
                    <StopOutlined style={{ fontSize: '32px', color: '#f5222d', marginBottom: '8px' }} />
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>不合格/不通过</div>
                  </Card>
                </Col>
              </Row>
            </>
          )}

          {/* 文本型配置 */}
          {qcItem.standardType === 'TEXT' && (
            <>
              <Divider orientation={"left" as any}>判断标准</Divider>
              <div style={{
                padding: '16px',
                background: '#fff7e6',
                borderRadius: '4px',
                border: '1px solid #ffd591',
                textAlign: 'center'
              }}>
                <ExperimentOutlined style={{ fontSize: '32px', color: '#faad14', marginBottom: '8px' }} />
                <div style={{ fontSize: '16px' }}>人工判断</div>
                <div style={{ fontSize: '14px', color: '#666' }}>由检验人员根据标准和经验进行判断</div>
              </div>
            </>
          )}
        </Card>
      ),
    },
    {
      key: 'apply',
      label: '适用范围',
      children: (
        <Card title="适用检验类型" extra={<DashboardOutlined style={{ color: '#1677ff' }} />}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>该质检项目适用于以下检验类型：</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {Object.entries(QC_APPLY_TYPE_MAP).map(([key, value]) => {
                const isApplied = qcItem.applyTypes.includes(key as any);
                return (
                  <Card
                    key={key}
                    size="small"
                    style={{
                      textAlign: 'center',
                      opacity: isApplied ? 1 : 0.4,
                      background: isApplied ? '#f0f5ff' : '#f5f5f5',
                      borderColor: isApplied ? '#adc6ff' : '#d9d9d9'
                    }}
                  >
                    {isApplied && <CheckCircleOutlined style={{ color: '#52c41a', marginBottom: '8px' }} />}
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>{value.label}</div>
                    <Tag color={isApplied ? value.color : 'default'}>{key}</Tag>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* 使用统计 */}
          <Divider orientation={"left" as any}>使用统计</Divider>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="质检方案数量"
                value={usageStats.schemeCount}
                valueStyle={{ color: '#1677ff' }}
                prefix={<FileTextOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="检验次数"
                value={usageStats.inspectionCount}
                valueStyle={{ color: '#52c41a' }}
                prefix={<ExperimentOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="合格率"
                value={usageStats.passRate}
                suffix="%"
                valueStyle={{ color: usageStats.passRate >= 99 ? '#52c41a' : '#faad14' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均评分"
                value={usageStats.avgScore}
                valueStyle={{ color: '#722ed1' }}
                prefix={<DashboardOutlined />}
              />
            </Col>
          </Row>
        </Card>
      ),
    },
    {
      key: 'history',
      label: '检验记录',
      children: (
        <Card title="最近检验记录" extra={<HistoryOutlined style={{ color: '#1677ff' }} />}>
          <div style={{ marginBottom: '16px' }}>
            <Row gutter={16}>
              <Col span={6}>
                <div style={{ padding: '12px', background: '#f6ffed', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>合格</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                    {inspectionHistory.filter(h => h.result === 'PASS').length}
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ padding: '12px', background: '#fff1f0', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>不合格</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f5222d' }}>
                    {inspectionHistory.filter(h => h.result === 'FAIL').length}
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ padding: '12px', background: '#e6f7ff', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>合格率</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1677ff' }}>
                    {((inspectionHistory.filter(h => h.result === 'PASS').length / inspectionHistory.length) * 100).toFixed(1)}%
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ padding: '12px', background: '#fff7e6', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>检验次数</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                    {inspectionHistory.length}
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* 检验记录列表 */}
          <div style={{ background: '#fafafa', borderRadius: '4px', padding: '12px' }}>
            {inspectionHistory.map((record, index) => (
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
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {record.date} - {record.type}
                    <Badge
                      status={record.result === 'PASS' ? 'success' : 'error'}
                      style={{ marginLeft: '8px' }}
                    />
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    检验结果: {record.result} | 测量值: {record.value}
                  </div>
                </div>
                <Tag color={record.result === 'PASS' ? 'green' : 'red'}>
                  {record.result === 'PASS' ? '合格' : '不合格'}
                </Tag>
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
            <ExperimentOutlined style={{ color: '#1677ff' }} />
            <span>{qcItem.itemName}</span>
            <Tag color={categoryConfig.color}>{categoryConfig.label}</Tag>
            <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
            <Tag color="blue">{qcItem.itemCode}</Tag>
            {qcItem.isCritical && (
              <Badge count="关键项" style={{ backgroundColor: '#cf1322' }} />
            )}
          </Space>
        }
        extra={
          <Space>
            {onEdit && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(qcItem)}
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

export default QcItemDetail;
