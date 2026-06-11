/**
 * 生产工单详情组件
 * 展示工单完整信息、工序明细、生产进度、质量信息
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Divider, Tabs, Badge, Row, Col, Statistic, Timeline, Progress, Table } from 'antd';
import {
  CloseOutlined, EditOutlined, ShoppingOutlined, ApartmentOutlined, CalendarOutlined,
  CheckCircleOutlined, StopOutlined, HistoryOutlined, FileTextOutlined,
  SettingOutlined, ToolOutlined, DashboardOutlined, WarningOutlined,
  EyeOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { WO_STATUS_MAP, WO_TYPE_MAP } from '../types';
import type { WorkOrder, WOStep } from '../types';

interface WorkOrderDetailProps {
  workOrder: WorkOrder;
  onClose: () => void;
  onEdit?: (workOrder: WorkOrder) => void;
  onRelease?: (workOrder: WorkOrder) => void;
  onCloseWorkOrder?: (workOrder: WorkOrder) => void;
}

const WorkOrderDetail: React.FC<WorkOrderDetailProps> = ({
  workOrder,
  onClose,
  onEdit,
  onRelease,
  onCloseWorkOrder,
}) => {
  const statusConfig = WO_STATUS_MAP[workOrder.status];
  const typeConfig = WO_TYPE_MAP[workOrder.woType];

  // 模拟生产进度
  const productionProgress = {
    planQty: workOrder.planQty,
    actualQty: workOrder.actualQty || 0,
    qualifiedQty: workOrder.qualifiedQty || 0,
    unqualifiedQty: workOrder.unqualifiedQty || 0,
    scrapQty: workOrder.scrapQty || 0,
    completionRate: workOrder.actualQty ? ((workOrder.actualQty / workOrder.planQty) * 100).toFixed(1) : '0',
  };

  // 工序明细表格列
  const stepColumns = [
    {
      title: '工序号',
      dataIndex: 'stepNo',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '工序编码',
      dataIndex: 'stepCode',
      width: 120,
    },
    {
      title: '工序名称',
      dataIndex: 'stepName',
      width: 150,
    },
    {
      title: '计划数量',
      dataIndex: 'planQty',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '实际数量',
      dataIndex: 'actualQty',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '合格数量',
      dataIndex: 'qualifiedQty',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '不合格数量',
      dataIndex: 'unqualifiedQty',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '报废数量',
      dataIndex: 'scrapQty',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: WOStep) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>
            详情
          </Button>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Card title="工单基本信息" extra={
          <Space>
            {onEdit && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(workOrder)}
              >
                编辑
              </Button>
            )}
            {onRelease && workOrder.status === 'DRAFT' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onRelease(workOrder)}
              >
                发布
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
          {/* 工单标识 */}
          <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
            <ShoppingOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
            <div style={{ marginBottom: '8px' }}>
              <Space>
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{workOrder.woNo}</span>
                <Tag color={typeConfig.color} style={{ fontSize: '14px', padding: '4px 12px', marginLeft: '8px' }}>
                  {typeConfig.label}
                </Tag>
              </Space>
            </div>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
              {workOrder.productName} - {workOrder.productSpec}
            </div>
            <Space>
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                borderRadius: '2px',
                background: statusConfig.color,
                marginRight: '8px'
              }}></span>
              <span>{statusConfig.label}</span>
            </Space>
          </div>

          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="工单号" span={1}>
              {workOrder.woNo}
            </Descriptions.Item>
            <Descriptions.Item label="生产订单" span={1}>
              {workOrder.poNo || '无'}
            </Descriptions.Item>

            <Descriptions.Item label="销售订单" span={1}>
              {workOrder.soNo || '无'}
            </Descriptions.Item>
            <Descriptions.Item label="产品编码" span={1}>
              {workOrder.productCode}
            </Descriptions.Item>
            <Descriptions.Item label="产品名称" span={1}>
              {workOrder.productName}
            </Descriptions.Item>

            <Descriptions.Item label="产品规格" span={1}>
              {workOrder.productSpec}
            </Descriptions.Item>
            <Descriptions.Item label="BOM版本" span={1}>
              {workOrder.bomVersion}
            </Descriptions.Item>

            <Descriptions.Item label="计划数量" span={1}>
              {workOrder.planQty.toLocaleString()} 件
            </Descriptions.Item>
            <Descriptions.Item label="实际数量" span={1}>
              {workOrder.actualQty ? workOrder.actualQty.toLocaleString() : '-'} 件
            </Descriptions.Item>

            <Descriptions.Item label="合格数量" span={1}>
              {workOrder.qualifiedQty ? workOrder.qualifiedQty.toLocaleString() : '-'} 件
            </Descriptions.Item>
            <Descriptions.Item label="不合格数量" span={1}>
              {workOrder.unqualifiedQty ? workOrder.unqualifiedQty.toLocaleString() : '-'} 件
            </Descriptions.Item>
            <Descriptions.Item label="报废数量" span={1}>
              {workOrder.scrapQty ? workOrder.scrapQty.toLocaleString() : '-'} 件
            </Descriptions.Item>

            <Descriptions.Item label="工单类型" span={1}>
              <Tag color={typeConfig.color}>{typeConfig.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态" span={1}>
              <Space>
                <span style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  background: statusConfig.color,
                }}></span>
                <span>{statusConfig.label}</span>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="计划开始日期" span={1}>
              {workOrder.planStartDate}
            </Descriptions.Item>
            <Descriptions.Item label="计划结束日期" span={1}>
              {workOrder.planEndDate}
            </Descriptions.Item>
            <Descriptions.Item label="实际开始日期" span={1}>
              {workOrder.actualStartDate || '待开始'}
            </Descriptions.Item>
            <Descriptions.Item label="实际结束日期" span={1}>
              {workOrder.actualEndDate || '进行中'}
            </Descriptions.Item>

            <Descriptions.Item label="当前工序" span={1}>
              {workOrder.currentStep || '未开始'}
            </Descriptions.Item>
            <Descriptions.Item label="工作中心" span={1}>
              {workOrder.workcenterId || '未分配'}
            </Descriptions.Item>
            <Descriptions.Item label="班组" span={1}>
              {workOrder.teamId || '未分配'}
            </Descriptions.Item>
            <Descriptions.Item label="操作员" span={1}>
              {workOrder.operator || '未分配'}
            </Descriptions.Item>

            <Descriptions.Item label="创建时间" span={1}>
              {workOrder.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间" span={1}>
              {workOrder.updatedAt}
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={2}>
              {workOrder.remark || '无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'steps',
      label: `工序明细 (${workOrder.steps?.length || 0})`,
      children: (
        <div>
          <Card title="工序明细" extra={<FileTextOutlined style={{ color: '#1677ff' }} />}>
            <Table
              size="small"
              dataSource={workOrder.steps || []}
              columns={stepColumns}
              rowKey="stepNo"
              pagination={false}
              bordered
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'progress',
      label: '生产进度',
      children: (
        <div>
          {/* 进度统计 */}
          <Card title="生产进度统计" style={{ marginBottom: '16px' }} extra={<DashboardOutlined style={{ color: '#1677ff' }} />}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="计划数量"
                  value={productionProgress.planQty}
                  suffix="件"
                  valueStyle={{ color: '#1677ff' }}
                  prefix={<ShoppingOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="实际数量"
                  value={productionProgress.actualQty}
                  suffix="件"
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="合格"
                  value={productionProgress.qualifiedQty}
                  suffix="件"
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={4}>
                <Statistic
                  title="不合格"
                  value={productionProgress.unqualifiedQty}
                  suffix="件"
                  valueStyle={{ color: '#faad14' }}
                  prefix={<WarningOutlined />}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: '16px' }}>
              <Col span={6}>
                <Statistic
                  title="报废"
                  value={productionProgress.scrapQty}
                  suffix="件"
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<StopOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="完成率"
                  value={productionProgress.completionRate}
                  suffix="%"
                  valueStyle={{ color: parseFloat(String(productionProgress.completionRate)) >= 95 ? '#52c41a' : parseFloat(String(productionProgress.completionRate)) >= 85 ? '#faad14' : '#cf1322' }}
                  prefix={<ToolOutlined />}
                />
              </Col>
            </Row>
            <div style={{ marginTop: '16px' }}>
              <Progress
                percent={parseFloat(productionProgress.completionRate)}
                status={parseFloat(productionProgress.completionRate) === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#52c41a',
                  '100%': '#52c41a',
                }}
              />
            </div>
          </Card>

          {/* 生产记录 */}
          <Card title="生产记录" extra={<HistoryOutlined style={{ color: '#1677ff' }} />}>
            <Timeline
              items={[
                {
                  children: (
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {workOrder.createdAt} - 工单创建
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        生产工单已创建，状态为草稿
                      </div>
                    </div>
                  ),
                },
                ...(workOrder.actualStartDate ? [{
                  children: (
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {workOrder.actualStartDate} - 生产开始
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        生产工单已开始执行
                      </div>
                    </div>
                  ),
                }] : []),
                ...(workOrder.actualEndDate ? [{
                  children: (
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {workOrder.actualEndDate} - 生产结束
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        生产工单已完成
                      </div>
                    </div>
                  ),
                }] : []),
              ]}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'quality',
      label: '质量信息',
      children: (
        <Card title="质量信息" extra={<ExclamationCircleOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="质检状态" span={1}>
              {workOrder.qualityStatus || '未质检'}
            </Descriptions.Item>
            <Descriptions.Item label="质检结果" span={1}>
              {workOrder.qResult || '待质检'}
            </Descriptions.Item>

            <Descriptions.Item label="当前工序" span={1}>
              {workOrder.currentStep || '未开始'}
            </Descriptions.Item>
            <Descriptions.Item label="工作中心" span={1}>
              {workOrder.workcenterId || '未分配'}
            </Descriptions.Item>

            <Descriptions.Item label="班组" span={1}>
              {workOrder.teamId || '未分配'}
            </Descriptions.Item>
            <Descriptions.Item label="操作员" span={1}>
              {workOrder.operator || '未分配'}
            </Descriptions.Item>

            <Descriptions.Item label="温度要求" span={1}>
              {workOrder.temperature || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="湿度要求" span={1}>
              {workOrder.humidity || '-'}
            </Descriptions.Item>

            <Descriptions.Item label="加温时长" span={1}>
              {workOrder.duration ? `${workOrder.duration} 分钟` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="设备要求" span={1}>
              {workOrder.equipmentIds ? workOrder.equipmentIds.join(', ') : '-'}
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
            <ShoppingOutlined style={{ color: '#1677ff' }} />
            <span>{workOrder.woNo}</span>
            <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
            <Tag color={typeConfig.color}>{typeConfig.label}</Tag>
          </Space>
        }
        extra={
          <Space>
            {onEdit && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(workOrder)}
              >
                编辑
              </Button>
            )}
            {onRelease && workOrder.status === 'DRAFT' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onRelease(workOrder)}
              >
                发布
              </Button>
            )}
            {onCloseWorkOrder && workOrder.status === 'IN_PROGRESS' && (
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => onCloseWorkOrder(workOrder)}
              >
                关闭工单
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
        }
      >
        <Tabs defaultActiveKey="basic" items={tabItems} />
      </Card>
    </div>
  );
};

export default WorkOrderDetail;
