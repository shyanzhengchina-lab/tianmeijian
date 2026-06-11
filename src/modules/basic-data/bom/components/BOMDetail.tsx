/**
 * 物料清单(BOM)详情组件
 * 展示BOM完整信息和子件明细
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Divider, Table, Tabs, Statistic, Row, Col } from 'antd';
import {
  CloseOutlined, EditOutlined, CopyOutlined, DownloadOutlined, PrinterOutlined,
  FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, StopOutlined
} from '@ant-design/icons';
import { BOM_STATUS_MAP, BOM_TYPE_MAP, CHILD_TYPE_MAP, ISSUE_METHOD_MAP } from '../types';
import type { BomHeader, BomChild } from '../types';

interface BOMDetailProps {
  bom: BomHeader;
  onClose: () => void;
  onEdit?: (bom: BomHeader) => void;
  onCopy?: (bom: BomHeader) => void;
}

const BOMDetail: React.FC<BOMDetailProps> = ({
  bom,
  onClose,
  onEdit,
  onCopy,
}) => {
  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      draft: <ClockCircleOutlined style={{ color: '#8c8c8c' }} />,
      audited: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      approved: <CheckCircleOutlined style={{ color: '#1677ff' }} />,
      disabled: <StopOutlined style={{ color: '#cf1322' }} />,
    };
    return iconMap[status] || null;
  };

  // 子件列表列定义
  const childColumns = [
    {
      title: '行号',
      dataIndex: 'rowNo',
      key: 'rowNo',
      width: 60,
      align: 'center' as const,
    },
    {
      title: '子件编码',
      dataIndex: 'childCode',
      key: 'childCode',
      width: 120,
    },
    {
      title: '子件名称',
      dataIndex: 'childName',
      key: 'childName',
      width: 150,
    },
    {
      title: '规格型号',
      dataIndex: 'spec',
      key: 'spec',
      width: 150,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => {
        const typeConfig = CHILD_TYPE_MAP[type as keyof typeof CHILD_TYPE_MAP];
        return <Tag color={typeConfig?.color}>{typeConfig?.label}</Tag>;
      },
    },
    {
      title: '主数量',
      dataIndex: 'qty',
      key: 'qty',
      width: 100,
      align: 'right' as const,
      render: (qty: number, record: any) => `${qty} ${record.unit}`,
    },
    {
      title: '子件数量',
      dataIndex: 'childQty',
      key: 'childQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number, record: any) => `${qty} ${record.calcUnit}`,
    },
    {
      title: '损耗率',
      dataIndex: 'scrapRate',
      key: 'scrapRate',
      width: 80,
      align: 'right' as const,
      render: (rate: number) => rate ? `${rate}%` : '-',
    },
    {
      title: '领料方式',
      dataIndex: 'issueMethod',
      key: 'issueMethod',
      width: 100,
      render: (method: string) => {
        if (!method) return '-';
        const methodInfo = ISSUE_METHOD_MAP[method as keyof typeof ISSUE_METHOD_MAP];
        return <Tag color={methodInfo?.color}>{methodInfo?.label}</Tag>;
      },
    },
    {
      title: '倒冲工序',
      dataIndex: 'consumeOp',
      key: 'consumeOp',
      width: 100,
    },
    {
      title: '关键物料',
      dataIndex: 'keyMaterial',
      key: 'keyMaterial',
      width: 80,
      align: 'center' as const,
      render: (isKey: boolean) => isKey ? '是' : '否',
    },
    {
      title: '自由项说明',
      dataIndex: 'freeDesc',
      key: 'freeDesc',
      width: 200,
      ellipsis: true,
    },
  ];

  // 统计子件数据
  const childStats = {
    totalCount: bom.children.length,
    keyMaterialCount: bom.children.filter(c => c.keyMaterial).length,
    mainMaterialCount: bom.children.filter(c => c.type === '主料').length,
    auxiliaryMaterialCount: bom.children.filter(c => c.type === '辅料').length,
    packagingMaterialCount: bom.children.filter(c => c.type === '包材').length,
  };

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Card title="BOM基本信息" extra={
          <Space>
            {onEdit && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(bom)}
                disabled={bom.status !== 'draft'}
              >
                编辑
              </Button>
            )}
            {onCopy && (
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => onCopy(bom)}
              >
                复制
              </Button>
            )}
            <Button
              size="small"
              icon={<DownloadOutlined />}
            >
              导出
            </Button>
            <Button
              size="small"
              icon={<PrinterOutlined />}
            >
              打印
            </Button>
          </Space>
        }>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="母件编码" span={1}>
              {bom.code}
            </Descriptions.Item>
            <Descriptions.Item label="物料名称" span={1}>
              {bom.name}
            </Descriptions.Item>

            <Descriptions.Item label="规格型号" span={1}>
              {bom.spec || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="单位" span={1}>
              {bom.unit}
            </Descriptions.Item>

            <Descriptions.Item label="版本号" span={1}>
              <Tag color="blue">{bom.version}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="BOM类型" span={1}>
              {BOM_TYPE_MAP[bom.bomType]?.label || bom.bomType}
            </Descriptions.Item>

            <Descriptions.Item label="主批量" span={1}>
              {bom.mainQty} {bom.mainUnit}
            </Descriptions.Item>
            <Descriptions.Item label="批量" span={1}>
              {bom.batchQty} {bom.calcUnit}
            </Descriptions.Item>

            <Descriptions.Item label="生效日期" span={1}>
              {bom.effectDate}
            </Descriptions.Item>
            <Descriptions.Item label="状态" span={1}>
              <Space>
                {getStatusIcon(bom.status)}
                <Tag color={BOM_STATUS_MAP[bom.status]?.color}>
                  {BOM_STATUS_MAP[bom.status]?.label}
                </Tag>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="创建人" span={1}>
              {bom.createdBy}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={1}>
              {bom.createdAt}
            </Descriptions.Item>

            <Descriptions.Item label="审核人" span={1}>
              {bom.auditedBy || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="审核时间" span={1}>
              {bom.auditedAt || '-'}
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={2}>
              {bom.remark || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'statistics',
      label: '统计信息',
      children: (
        <Card title="BOM统计信息">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="子件总数"
                value={childStats.totalCount}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1677ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="关键物料"
                value={childStats.keyMaterialCount}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="主料"
                value={childStats.mainMaterialCount}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="辅料"
                value={childStats.auxiliaryMaterialCount}
                valueStyle={{ color: '#1677ff' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="包材"
                value={childStats.packagingMaterialCount}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>
        </Card>
      ),
    },
    {
      key: 'children',
      label: `BOM明细 (${bom.children.length})`,
      children: (
        <Card title="BOM子件明细">
          <Table
            dataSource={bom.children}
            columns={childColumns}
            rowKey="id"
            pagination={false}
            size="small"
            bordered
            scroll={{ x: 1200 }}
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
            <span>{bom.name}</span>
            <Tag color={BOM_STATUS_MAP[bom.status]?.color}>
              {BOM_STATUS_MAP[bom.status]?.label}
            </Tag>
            <Tag color={BOM_TYPE_MAP[bom.bomType]?.color}>
              {BOM_TYPE_MAP[bom.bomType]?.label}
            </Tag>
            <Tag color="blue">版本: {bom.version}</Tag>
          </Space>
        }
        extra={
          <Space>
            {onEdit && bom.status === 'draft' && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(bom)}
              >
                编辑
              </Button>
            )}
            {onCopy && (
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => onCopy(bom)}
              >
                复制
              </Button>
            )}
            <Button
              size="small"
              icon={<DownloadOutlined />}
            >
              导出
            </Button>
            <Button
              size="small"
              icon={<PrinterOutlined />}
            >
              打印
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

export default BOMDetail;