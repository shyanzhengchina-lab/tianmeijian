/**
 * 质检方案详情组件
 * 展示质检方案完整信息、适用对象、抽样规则、检验项配置
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Divider, Tabs, Badge, Row, Col, Statistic, Timeline } from 'antd';
import {
  CloseOutlined, EditOutlined, ExperimentOutlined, SafetyCertificateOutlined,
  ApartmentOutlined, ClockCircleOutlined, CheckCircleOutlined, StopOutlined,
  CopyOutlined, HistoryOutlined, FileTextOutlined, AuditOutlined
} from '@ant-design/icons';
import { QC_SCHEME_STATUS_MAP, QC_SCHEME_TYPE_MAP, QC_SAMPLING_TYPE_MAP } from '../types';
import type { QcScheme, QcSchemeItem } from '../types';

interface QcSchemeDetailProps {
  qcScheme: QcScheme;
  onClose: () => void;
  onEdit?: (qcScheme: QcScheme) => void;
  onCopy?: (qcScheme: QcScheme) => void;
  onActivate?: (qcScheme: QcScheme) => void;
  onDeactivate?: (qcScheme: QcScheme) => void;
  onApprove?: (qcScheme: QcScheme) => void;
}

const QcSchemeDetail: React.FC<QcSchemeDetailProps> = ({
  qcScheme,
  onClose,
  onEdit,
  onCopy,
  onActivate,
  onDeactivate,
  onApprove,
}) => {
  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      ACTIVE: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      INACTIVE: <StopOutlined style={{ color: '#d9d9d9' }} />,
      DRAFT: <ClockCircleOutlined style={{ color: '#8c8c8c' }} />,
    };
    return iconMap[status] || null;
  };

  const typeConfig = QC_SCHEME_TYPE_MAP[qcScheme.schemeType];
  const samplingConfig = QC_SAMPLING_TYPE_MAP[qcScheme.samplingType];
  const statusConfig = QC_SCHEME_STATUS_MAP[qcScheme.status];

  // 模拟使用统计
  const usageStats = {
    useCount: 256,
    inspectionCount: 12500,
    passRate: 98.5,
    avgCycleTime: 12,
  };

  // 模拟应用记录
  const applicationHistory = [
    { date: '2024-01-15', type: 'IPQC首检', result: '通过', batch: 'PRD-001' },
    { date: '2024-01-14', type: 'IPQC自检', result: '通过', batch: 'PRD-002' },
    { date: '2024-01-13', type: 'IPQC巡检', result: '通过', batch: 'PRD-003' },
    { date: '2024-01-12', type: 'IPQC首检', result: '通过', batch: 'PRD-004' },
    { date: '2024-01-11', type: 'IPQC自检', result: '通过', batch: 'PRD-005' },
  ];

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Card title="质检方案基本信息" extra={
          <Space>
            {onEdit && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(qcScheme)}
              >
                编辑
              </Button>
            )}
            {onCopy && (
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => onCopy(qcScheme)}
              >
                复制
              </Button>
            )}
            {onActivate && qcScheme.status === 'INACTIVE' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onActivate(qcScheme)}
              >
                启用
              </Button>
            )}
            {onDeactivate && qcScheme.status === 'ACTIVE' && (
              <Button
                size="small"
                icon={<StopOutlined />}
                onClick={() => onDeactivate(qcScheme)}
              >
                停用
              </Button>
            )}
            {onApprove && qcScheme.status === 'DRAFT' && (
              <Button
                size="small"
                type="primary"
                icon={<AuditOutlined />}
                onClick={() => onApprove(qcScheme)}
              >
                批准
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
          {/* 方案标识 */}
          <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
            <FileTextOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
            <div style={{ marginBottom: '8px' }}>
              <Space>
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{qcScheme.schemeName}</span>
                <Tag color={typeConfig.color} style={{ fontSize: '14px', padding: '4px 12px' }}>
                  {typeConfig.label}
                </Tag>
                <Tag color="blue">{qcScheme.schemeCode}</Tag>
              </Space>
            </div>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
              版本: {qcScheme.version} | 生效: {qcScheme.effectiveDate}
            </div>
            <Space>
              {getStatusIcon(qcScheme.status)}
              <Tag color={statusConfig.color} style={{ fontSize: '14px', padding: '4px 12px' }}>
                {statusConfig.label}
              </Tag>
              {qcScheme.approvedBy && (
                <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px' }}>
                  已批准
                </Tag>
              )}
            </Space>
          </div>

          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="方案编码" span={1}>
              {qcScheme.schemeCode}
            </Descriptions.Item>
            <Descriptions.Item label="方案名称" span={1}>
              {qcScheme.schemeName}
            </Descriptions.Item>

            <Descriptions.Item label="检验类型" span={1}>
              <Tag color={typeConfig.color}>{typeConfig.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="抽样规则" span={1}>
              <Tag color={samplingConfig.color}>{samplingConfig.label}</Tag>
            </Descriptions.Item>

            <Descriptions.Item label="版本" span={1}>
              {qcScheme.version}
            </Descriptions.Item>
            <Descriptions.Item label="状态" span={1}>
              <Space>
                {getStatusIcon(qcScheme.status)}
                <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="生效日期" span={1}>
              {qcScheme.effectiveDate}
            </Descriptions.Item>
            <Descriptions.Item label="失效日期" span={1}>
              {qcScheme.expiryDate || '永久有效'}
            </Descriptions.Item>

            <Descriptions.Item label="批准人" span={1}>
              {qcScheme.approvedBy || '待批准'}
            </Descriptions.Item>
            <Descriptions.Item label="检验项数量" span={1}>
              <Space>
                {qcScheme.items.filter(i => i.enabled).length} / {qcScheme.items.length} 启用
                <Badge count={qcScheme.items.length} style={{ backgroundColor: '#1677ff' }} />
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="创建时间" span={1}>
              {qcScheme.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间" span={1}>
              {qcScheme.updatedAt}
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={2}>
              {qcScheme.remark || '无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'applicable',
      label: '适用对象',
      children: (
        <Card title="适用对象" extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}>
          {/* 产品型号 */}
          {qcScheme.productModel && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>适用产品型号</div>
              <div style={{
                padding: '12px',
                background: '#e6f7ff',
                borderRadius: '4px',
                border: '1px solid #91d5ff',
                fontSize: '16px'
              }}>
                {qcScheme.productModel}
              </div>
            </div>
          )}

          {/* 物料编码 */}
          {qcScheme.materialCode && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>适用物料编码</div>
              <div style={{
                padding: '12px',
                background: '#f6ffed',
                borderRadius: '4px',
                border: '1px solid #b7eb8f',
                fontSize: '16px'
              }}>
                {qcScheme.materialCode}
              </div>
            </div>
          )}

          {/* 工序信息 */}
          {qcScheme.operationCode && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>适用工序信息</div>
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" title="工序编码" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1677ff' }}>
                      {qcScheme.operationCode}
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="工序序号" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                      {qcScheme.operationSeq || '—'}
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          )}

          {/* 适用范围说明 */}
          <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
            <Space>
              <ApartmentOutlined style={{ color: '#1677ff' }} />
              <span>
                {qcScheme.schemeType === 'IQC' && '适用于指定物料的来料检验'}
                {(qcScheme.schemeType.includes('IPQC') || qcScheme.schemeType === 'STERILE') && '适用于指定工序的生产过程检验'}
                {(qcScheme.schemeType === 'FQC' || qcScheme.schemeType === 'OQC') && '适用于指定产品的成品检验'}
              </span>
            </Space>
          </div>
        </Card>
      ),
    },
    {
      key: 'sampling',
      label: '抽样规则',
      children: (
        <Card title="抽样规则" extra={<SafetyCertificateOutlined style={{ color: '#1677ff' }} />}>
          {/* 抽样规则类型 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>抽样规则类型</div>
            <div style={{
              padding: '12px',
              background: '#e6f7ff',
              borderRadius: '4px',
              border: '1px solid #91d5ff',
              fontSize: '16px'
            }}>
              {samplingConfig.label}
            </div>
          </div>

          {/* 具体抽样参数 */}
          {qcScheme.samplingType === 'FULL' && (
            <>
              <Divider orientation={"left" as any}>全检说明</Divider>
              <div style={{ padding: '16px', background: '#f6ffed', borderRadius: '4px', textAlign: 'center' }}>
                <SafetyCertificateOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }} />
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>全检模式</div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                  每件产品都进行检验，适用于关键质量要求
                </div>
              </div>
            </>
          )}

          {qcScheme.samplingType === 'AQL' && (
            <>
              <Divider orientation={"left" as any}>AQL抽样参数</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" title="AQL水平" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1677ff' }}>
                      {qcScheme.aqlLevel}
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="适用标准" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', color: '#52c41a' }}>
                      GB/T 2828.1-2012
                    </div>
                  </Card>
                </Col>
              </Row>
              <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                <Space>
                  <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
                  <span>按照AQL标准进行抽样检验，在质量和成本之间取得平衡</span>
                </Space>
              </div>
            </>
          )}

          {qcScheme.samplingType === 'FIXED' && (
            <>
              <Divider orientation={"left" as any}>固定数量抽样</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" title="样本量" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                      {qcScheme.sampleSize} 件
                    </div>
                  </Card>
                </Col>
              </Row>
              <div style={{ padding: '12px', background: '#fff7e6', borderRadius: '4px' }}>
                <Space>
                  <SafetyCertificateOutlined style={{ color: '#faad14' }} />
                  <span>每次检验固定数量的样本，适用于批量生产</span>
                </Space>
              </div>
            </>
          )}

          {qcScheme.samplingType === 'PERCENT' && (
            <>
              <Divider orientation={"left" as any}>百分比抽样</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" title="抽样百分比" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f5222d' }}>
                      {qcScheme.samplePercent}%
                    </div>
                  </Card>
                </Col>
              </Row>
              <div style={{ padding: '12px', background: '#fff1f0', borderRadius: '4px' }}>
                <Space>
                  <SafetyCertificateOutlined style={{ color: '#f5222d' }} />
                  <span>按照百分比进行抽样检验，适用于大批量生产</span>
                </Space>
              </div>
            </>
          )}
        </Card>
      ),
    },
    {
      key: 'items',
      label: `检验项 (${qcScheme.items.length})`,
      children: (
        <div>
          {/* 检验项统计 */}
          <Card title="检验项统计" style={{ marginBottom: '16px' }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="检验项总数"
                  value={qcScheme.items.length}
                  valueStyle={{ color: '#1677ff' }}
                  prefix={<ExperimentOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="启用项数"
                  value={qcScheme.items.filter(i => i.enabled).length}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="关键项数"
                  value={qcScheme.items.filter(i => i.isCritical && i.enabled).length}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<SafetyCertificateOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="必检项数"
                  value={qcScheme.items.filter(i => i.isRequired && i.enabled).length}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<FileTextOutlined />}
                />
              </Col>
            </Row>
          </Card>

          {/* 检验项列表 */}
          <Card title="检验项明细" extra={<ExperimentOutlined style={{ color: '#1677ff' }} />}>
            <div style={{ background: '#fafafa', borderRadius: '4px', padding: '12px' }}>
              {qcScheme.items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    background: '#fff',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    borderLeft: `4px solid ${item.enabled ? '#52c41a' : '#d9d9d9'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        <Space>
                          <Badge count={item.seqNo} style={{ backgroundColor: '#1677ff' }} />
                          <span>{item.itemName}</span>
                          {item.isCritical && <Tag color="red">关键项</Tag>}
                          {item.isRequired && <Tag color="orange">必检项</Tag>}
                          {!item.enabled && <Tag color="default">已停用</Tag>}
                        </Space>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                        编码: {item.itemCode} | 标准值: {item.standardValue || '—'}
                        {item.unit && ` | 单位: ${item.unit}`}
                      </div>
                      {item.remark && (
                        <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                          备注: {item.remark}
                        </div>
                      )}
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
      label: '使用统计',
      children: (
        <div>
          {/* 使用统计 */}
          <Card title="使用统计" style={{ marginBottom: '16px' }}>
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
                  valueStyle={{ color: usageStats.passRate >= 98 ? '#52c41a' : '#faad14' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="平均周期"
                  value={usageStats.avgCycleTime}
                  suffix="分钟"
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
            </Row>
          </Card>

          {/* 应用记录 */}
          <Card title="最近应用记录" extra={<HistoryOutlined style={{ color: '#1677ff' }} />}>
            <Timeline
              items={applicationHistory.map((record, index) => ({
                key: index,
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {record.date} - {record.type}
                      <Badge
                        status={record.result === '通过' ? 'success' : 'error'}
                        style={{ marginLeft: '8px' }}
                      />
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      批次: {record.batch} | 结果: {record.result}
                    </div>
                  </div>
                ),
              }))}
            />
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
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>{qcScheme.schemeName}</span>
            <Tag color={typeConfig.color}>{typeConfig.label}</Tag>
            <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
            <Tag color="blue">{qcScheme.schemeCode}</Tag>
            <Badge count={qcScheme.items.length} style={{ backgroundColor: '#1677ff' }} />
          </Space>
        }
        extra={
          <Space>
            {onEdit && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(qcScheme)}
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

export default QcSchemeDetail;
