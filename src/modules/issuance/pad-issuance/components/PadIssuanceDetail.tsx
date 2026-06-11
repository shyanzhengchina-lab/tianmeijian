/**
 * 工位领料详情组件
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Divider, Timeline, Table } from 'antd';
import {
  CloseOutlined, EditOutlined, FileTextOutlined, ApartmentOutlined, CalendarOutlined,
  CheckCircleOutlined, StopOutlined, PlayCircleOutlined, ShoppingCartOutlined,
  HistoryOutlined, UserOutlined
} from '@ant-design/icons';
import { PAD_ISSUANCE_STATUS_MAP } from '../types';
import type { PadIssuance } from '../types';

interface PadIssuanceDetailProps {
  issuance: PadIssuance;
  onClose: () => void;
  onEdit?: (issuance: PadIssuance) => void;
  onSubmit?: (issuance: PadIssuance) => void;
  onApprove?: (issuance: PadIssuance) => void;
  onReject?: (issuance: PadIssuance) => void;
  onIssue?: (issuance: PadIssuance) => void;
  onComplete?: (issuance: PadIssuance) => void;
  onCancel?: (issuance: PadIssuance) => void;
}

const PadIssuanceDetail: React.FC<PadIssuanceDetailProps> = ({
  issuance,
  onClose,
  onEdit,
  onSubmit,
  onApprove,
  onReject,
  onIssue,
  onComplete,
  onCancel,
}) => {
  const statusConfig = PAD_ISSUANCE_STATUS_MAP[issuance.status];

  // 物料明细表格列
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
      title: '已发数量',
      dataIndex: 'issuedQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || '-',
    },
    {
      title: '待发数量',
      dataIndex: 'pendingQty',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || '-',
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
            <span>{issuance.issuanceNo}</span>
            <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
          </Space>
        }
        extra={
          <Space>
            {onEdit && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(issuance)}
                disabled={issuance.status !== 'DRAFT'}
              >
                编辑
              </Button>
            )}
            {onSubmit && issuance.status === 'DRAFT' && (
              <Button
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => onSubmit(issuance)}
              >
                提交
              </Button>
            )}
            {onApprove && issuance.status === 'SUBMITTED' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onApprove(issuance)}
              >
                批准
              </Button>
            )}
            {onReject && issuance.status === 'SUBMITTED' && (
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => onReject(issuance)}
              >
                拒绝
              </Button>
            )}
            {onIssue && issuance.status === 'APPROVED' && (
              <Button
                size="small"
                icon={<ShoppingCartOutlined />}
                onClick={() => onIssue(issuance)}
              >
                发料
              </Button>
            )}
            {onComplete && issuance.status === 'ISSUED' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onComplete(issuance)}
              >
                完成
              </Button>
            )}
            {onCancel && ['DRAFT', 'SUBMITTED'].includes(issuance.status) && (
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => onCancel(issuance)}
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
        {/* 领料单标识 */}
        <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <ShoppingCartOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{issuance.issuanceNo}</span>
          </div>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
            工位领料单 - {issuance.workstation}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
            任务单号: {issuance.taskNo} | 工单号: {issuance.workOrderNo}
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
            <Descriptions.Item label="领料单号" span={1}>
              {issuance.issuanceNo}
            </Descriptions.Item>
            <Descriptions.Item label="任务单号" span={1}>
              {issuance.taskNo}
            </Descriptions.Item>

            <Descriptions.Item label="工单号" span={1}>
              {issuance.workOrderNo}
            </Descriptions.Item>
            <Descriptions.Item label="工序信息" span={1}>
              {issuance.operationCode} - {issuance.operationName}
            </Descriptions.Item>

            <Descriptions.Item label="工位" span={1}>
              {issuance.workstation}
            </Descriptions.Item>
            <Descriptions.Item label="操作人" span={1}>
              {issuance.worker}
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
            <Descriptions.Item label="任务ID" span={1}>
              {issuance.taskId}
            </Descriptions.Item>

            <Descriptions.Item label="申请日期" span={1}>
              {issuance.requestDate}
            </Descriptions.Item>
            <Descriptions.Item label="要求日期" span={1}>
              {issuance.requiredDate}
            </Descriptions.Item>

            <Descriptions.Item label="申请人" span={1}>
              {issuance.requestBy}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={1}>
              {issuance.remark || '无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 审批信息 */}
        {issuance.status !== 'DRAFT' && (
          <Card title="审批信息" style={{ marginBottom: '16px' }} extra={<UserOutlined style={{ color: '#1677ff' }} />}>
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="提交时间" span={1}>
                {issuance.submitTime || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="批准人" span={1}>
                {issuance.approvedBy || '-'}
              </Descriptions.Item>

              <Descriptions.Item label="批准时间" span={1}>
                {issuance.approveTime || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="发料人" span={1}>
                {issuance.issuedBy || '-'}
              </Descriptions.Item>

              <Descriptions.Item label="发料时间" span={1}>
                {issuance.issueTime || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间" span={1}>
                {issuance.completeTime || '-'}
              </Descriptions.Item>

              <Descriptions.Item label="创建人" span={1}>
                {issuance.createdBy}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={1}>
                {issuance.createdAt}
              </Descriptions.Item>

              <Descriptions.Item label="更新时间" span={2}>
                {issuance.updatedAt}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* 物料明细 */}
        {issuance.items && issuance.items.length > 0 && (
          <Card title="物料明细" style={{ marginBottom: '16px' }} extra={<ApartmentOutlined style={{ color: '#1677ff' }} />}>
            <Table
              size="small"
              dataSource={issuance.items}
              columns={itemColumns}
              rowKey="id"
              pagination={false}
              bordered
              scroll={{ x: 1000 }}
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={6} align="right">
                      <strong>合计：</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align="right">
                      <strong>
                        {issuance.items.reduce((sum, item) => sum + (item.planQty || 0), 0).toLocaleString()} 件
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
                      {issuance.createdAt} - 领料单创建
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      工位领料单已创建，状态为草稿
                    </div>
                  </div>
                ),
              },
              ...(issuance.submitTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {issuance.submitTime} - 提交审批
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      领料单已提交，等待审批
                    </div>
                  </div>
                ),
              }] : []),
              ...(issuance.approveTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {issuance.approveTime} - 审批通过
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      批准人: {issuance.approvedBy}
                    </div>
                  </div>
                ),
              }] : []),
              ...(issuance.issueTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {issuance.issueTime} - 已发料
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      发料人: {issuance.issuedBy}
                    </div>
                  </div>
                ),
              }] : []),
              ...(issuance.completeTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {issuance.completeTime} - 完成
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      领料流程已全部完成
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

export default PadIssuanceDetail;
