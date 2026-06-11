/**
 * 倒冲监控详情组件
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Divider, Timeline, Table } from 'antd';
import {
  CloseOutlined, EditOutlined, FileTextOutlined, ApartmentOutlined, CalendarOutlined,
  PlayCircleOutlined, SyncOutlined, StopOutlined, HistoryOutlined, CheckCircleOutlined,
  ClockCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { BACKFLUSH_STATUS_MAP } from '../types';
import type { BackflushMonitor } from '../types';

interface BackflushMonitorDetailProps {
  monitor: BackflushMonitor;
  onClose: () => void;
  onEdit?: (monitor: BackflushMonitor) => void;
  onTrigger?: (monitor: BackflushMonitor) => void;
  onRetry?: (monitor: BackflushMonitor) => void;
  onCancel?: (monitor: BackflushMonitor) => void;
}

const BackflushMonitorDetail: React.FC<BackflushMonitorDetailProps> = ({
  monitor,
  onClose,
  onEdit,
  onTrigger,
  onRetry,
  onCancel,
}) => {
  const statusConfig = BACKFLUSH_STATUS_MAP[monitor.status];

  // 倒冲明细表格列
  const itemColumns = [
    {
      title: '物料编码',
      dataIndex: 'materialCode',
      width: 150,
    },
    {
      title: '物料名称',
      dataIndex: 'materialName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '物料规格',
      dataIndex: 'materialSpec',
      width: 150,
      ellipsis: true,
    },
    {
      title: '计划数量',
      dataIndex: 'planQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || '-',
    },
    {
      title: '倒冲数量',
      dataIndex: 'backflushQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || '-',
    },
    {
      title: '差异',
      dataIndex: 'diffQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number, record: any) => {
        if (qty === 0) return <span style={{ color: '#52c41a' }}>{qty?.toLocaleString()}</span>;
        return <span style={{ color: '#ff4d4f' }}>{qty?.toLocaleString()}</span>;
      },
    },
    {
      title: '单位',
      dataIndex: 'unit',
      width: 80,
    },
    {
      title: '批号',
      dataIndex: 'batchNo',
      width: 120,
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>{monitor.monitorNo}</span>
            <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
          </Space>
        }
        extra={
          <Space>
            {onEdit && monitor.status === 'PENDING' && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(monitor)}
              >
                编辑
              </Button>
            )}
            {onTrigger && monitor.status === 'PENDING' && (
              <Button
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => onTrigger(monitor)}
              >
                触发倒冲
              </Button>
            )}
            {onRetry && monitor.status === 'FAILED' && (
              <Button
                size="small"
                icon={<SyncOutlined />}
                onClick={() => onRetry(monitor)}
              >
                重试
              </Button>
            )}
            {onCancel && ['PENDING', 'RUNNING'].includes(monitor.status) && (
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => onCancel(monitor)}
              >
                取消
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
        {/* 监控单标识 */}
        <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          {monitor.status === 'FAILED' ? (
            <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '12px' }} />
          ) : monitor.status === 'RUNNING' ? (
            <ClockCircleOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
          ) : monitor.status === 'COMPLETED' ? (
            <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '12px' }} />
          ) : (
            <ClockCircleOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
          )}
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{monitor.monitorNo}</span>
          </div>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
            倒冲监控 - {monitor.productName}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
            工单: {monitor.workOrderNo} | 任务单: {monitor.taskOrderNo}
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

        {/* 基本信息 */}
        <Card title="基本信息" style={{ marginBottom: '16px' }} extra={<FileTextOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="监控单号" span={1}>
              {monitor.monitorNo}
            </Descriptions.Item>
            <Descriptions.Item label="工单号" span={1}>
              {monitor.workOrderNo}
            </Descriptions.Item>

            <Descriptions.Item label="任务单号" span={1}>
              {monitor.taskOrderNo}
            </Descriptions.Item>
            <Descriptions.Item label="工序信息" span={1}>
              {monitor.operationCode} - {monitor.operationName}
            </Descriptions.Item>

            <Descriptions.Item label="产品信息" span={2}>
              {monitor.productCode} - {monitor.productName} ({monitor.productSpec})
            </Descriptions.Item>

            <Descriptions.Item label="完成数量" span={1}>
              {monitor.completedQty?.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="倒冲数量" span={1}>
              {monitor.backflushQty?.toLocaleString()}
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
            <Descriptions.Item label="监控单ID" span={1}>
              {monitor.id}
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={2}>
              {monitor.remark || '无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 执行信息 */}
        {monitor.status !== 'PENDING' && (
          <Card title="执行信息" style={{ marginBottom: '16px' }} extra={<CheckCircleOutlined style={{ color: '#1677ff' }} />}>
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="开始时间" span={1}>
                {monitor.startTime || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="结束时间" span={1}>
                {monitor.endTime || '-'}
              </Descriptions.Item>

              <Descriptions.Item label="倒冲时间" span={1}>
                {monitor.backflushTime || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建人" span={1}>
                {monitor.createdBy}
              </Descriptions.Item>

              <Descriptions.Item label="创建时间" span={1}>
                {monitor.createdAt}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间" span={1}>
                {monitor.updatedAt}
              </Descriptions.Item>

              {monitor.status === 'FAILED' && (
                <Descriptions.Item label="错误原因" span={2}>
                  <span style={{ color: '#ff4d4f' }}>{monitor.errorReason || '-'}</span>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}

        {/* 倒冲明细 */}
        {monitor.items && monitor.items.length > 0 && (
          <Card title="倒冲明细" style={{ marginBottom: '16px' }} extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}>
            <Table
              size="small"
              dataSource={monitor.items}
              columns={itemColumns}
              rowKey="id"
              pagination={false}
              bordered
              scroll={{ x: 1000 }}
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5} align="right">
                      <strong>合计：</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right">
                      <strong>
                        {monitor.items.reduce((sum, item) => sum + (item.backflushQty || 0), 0).toLocaleString()} 件
                      </strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>
        )}

        {/* 流程记录 */}
        <Divider />
        <Card title="流程记录" extra={<HistoryOutlined style={{ color: '#1677ff' }} />}>
          <Timeline
            items={[
              {
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {monitor.createdAt} - 创建监控
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      倒冲监控已创建，等待触发
                    </div>
                  </div>
                ),
              },
              ...(monitor.startTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {monitor.startTime} - 开始倒冲
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      倒冲任务已启动
                    </div>
                  </div>
                ),
              }] : []),
              ...(monitor.backflushTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {monitor.backflushTime} - 倒冲完成
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      完成数量: {monitor.completedQty?.toLocaleString()}，倒冲数量: {monitor.backflushQty?.toLocaleString()}
                    </div>
                  </div>
                ),
              }] : []),
              ...(monitor.status === 'FAILED' ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {monitor.endTime} - 倒冲失败
                    </div>
                    <div style={{ fontSize: '13px', color: '#ff4d4f' }}>
                      错误原因: {monitor.errorReason}
                    </div>
                  </div>
                ),
              }] : []),
            ]}
          />
        </Card>
      </Card>
    </div>
  );
};

export default BackflushMonitorDetail;
