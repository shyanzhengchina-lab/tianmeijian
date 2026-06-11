/**
 * 领料单详情组件
 */

import React from 'react';
import {
  Drawer,
  Descriptions,
  Tag,
  Space,
  Button,
  Table,
  Statistic,
  Row,
  Col,
  Card,
  Steps,
  Timeline,
  message,
  Modal,
  Input,
} from 'antd';
import {
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  UndoOutlined,
  FileTextOutlined,
  UserOutlined,
  ClockCircleOutlined,
  ShoppingOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useIssuanceStore } from '../store/issuanceStore';
import type { MaterialIssuance } from '../types';
import {
  ISSUANCE_STATUS_MAP,
  ISSUANCE_TYPE_MAP,
  ISSUANCE_METHOD_MAP,
} from '../types';
import { StatusBadge } from '../../../../shared/components/StatusBadge';

const { TextArea } = Input;

interface IssuanceDetailProps {
  visible: boolean;
  onClose: () => void;
  record: MaterialIssuance | null;
}

/**
 * 领料单详情组件
 */
export const IssuanceDetail: React.FC<IssuanceDetailProps> = ({
  visible,
  onClose,
  record,
}) => {
  const {
    approveIssuance,
    rejectIssuance,
    issueMaterial,
    completeIssuance,
    cancelIssuance,
    returnMaterial,
    loading,
    showApproveModal,
    showReturnModal,
    setShowApproveModal: setShowApprove,
    setShowReturnModal: setShowReturn,
  } = useIssuanceStore();

  if (!record) return null;

  /**
   * 审批领料单
   */
  const handleApprove = async () => {
    Modal.confirm({
      title: '确认审批',
      content: (
        <div>
          <p>确定要审批通过领料单 {record.issuanceNo} 吗？</p>
          <TextArea
            id="approval-comment"
            placeholder="请输入审批意见（可选）"
            rows={3}
          />
        </div>
      ),
      onOk: async () => {
        const comment = (document.getElementById('approval-comment') as HTMLTextAreaElement)?.value || '';
        await approveIssuance({
          action: 'APPROVE',
          issuanceId: record.id,
          operatorId: '1', // TODO: 从用户信息获取
          remark: comment,
        });
      },
    });
  };

  /**
   * 拒绝领料单
   */
  const handleReject = async () => {
    Modal.confirm({
      title: '确认拒绝',
      content: (
        <div>
          <p>确定要拒绝领料单 {record.issuanceNo} 吗？</p>
          <TextArea
            id="reject-reason"
            placeholder="请输入拒绝原因"
            rows={3}
          />
        </div>
      ),
      onOk: async () => {
        const reason = (document.getElementById('reject-reason') as HTMLTextAreaElement)?.value || '';
        await rejectIssuance({
          action: 'REJECT',
          issuanceId: record.id,
          operatorId: '1', // TODO: 从用户信息获取
          remark: reason,
        });
      },
    });
  };

  /**
   * 领料
   */
  const handleIssue = async () => {
    Modal.confirm({
      title: '确认领料',
      content: `确定要执行领料单 ${record.issuanceNo} 的领料操作吗？`,
      onOk: async () => {
        await issueMaterial({
          action: 'ISSUE',
          issuanceId: record.id,
          operatorId: '1', // TODO: 从用户信息获取
        });
      },
    });
  };

  /**
   * 完成领料
   */
  const handleComplete = async () => {
    Modal.confirm({
      title: '确认完成',
      content: `确定要完成领料单 ${record.issuanceNo} 吗？`,
      onOk: async () => {
        await completeIssuance({
          action: 'ISSUE',
          issuanceId: record.id,
          operatorId: '1', // TODO: 从用户信息获取
        });
      },
    });
  };

  /**
   * 取消领料单
   */
  const handleCancel = async () => {
    Modal.confirm({
      title: '确认取消',
      content: `确定要取消领料单 ${record.issuanceNo} 吗？`,
      onOk: async () => {
        await cancelIssuance({
          action: 'ISSUE',
          issuanceId: record.id,
          operatorId: '1', // TODO: 从用户信息获取
        });
      },
    });
  };

  /**
   * 退料
   */
  const handleReturn = (item: any) => {
    Modal.confirm({
      title: '确认退料',
      content: (
        <div>
          <p>确定要退料 {item.materialName} 吗？</p>
          <Input
            id="return-qty"
            type="number"
            placeholder="退料数量"
            style={{ marginBottom: 8 }}
          />
          <TextArea
            id="return-reason"
            placeholder="退料原因"
            rows={3}
          />
        </div>
      ),
      onOk: async () => {
        const qty = parseFloat((document.getElementById('return-qty') as HTMLInputElement)?.value || '0');
        const reason = (document.getElementById('return-reason') as HTMLTextAreaElement)?.value || '';

        if (qty <= 0) {
          message.error('退料数量必须大于0');
          return false;
        }

        await returnMaterial({
          issuanceId: record.id,
          itemId: item.itemId,
          returnQty: qty,
          returnReason: reason,
          operatorId: '1', // TODO: 从用户信息获取
        });
        return true;
      },
    });
  };

  /**
   * 领料明细表格列定义
   */
  const itemColumns = [
    {
      title: '物料编码',
      dataIndex: 'materialCode',
      key: 'materialCode',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '物料名称',
      dataIndex: 'materialName',
      key: 'materialName',
      width: 150,
      align: 'center' as const,
    },
    {
      title: '规格',
      dataIndex: 'materialSpec',
      key: 'materialSpec',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '批号',
      dataIndex: 'batchNo',
      key: 'batchNo',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '申请数量',
      dataIndex: 'requestedQty',
      key: 'requestedQty',
      width: 100,
      align: 'center' as const,
      render: (qty: number, record: any) => `${qty} ${record.unit}`,
    },
    {
      title: '实发数量',
      dataIndex: 'issuedQty',
      key: 'issuedQty',
      width: 100,
      align: 'center' as const,
      render: (qty: number, record: any) => `${qty} ${record.unit}`,
    },
    {
      title: '已退数量',
      dataIndex: 'returnedQty',
      key: 'returnedQty',
      width: 100,
      align: 'center' as const,
      render: (qty: number, record: any) => `${qty} ${record.unit}`,
    },
    {
      title: '仓库',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 120,
      align: 'center' as const,
    },
    {
      title: '库位',
      dataIndex: 'locationCode',
      key: 'locationCode',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '领料时间',
      dataIndex: 'issueTime',
      key: 'issueTime',
      width: 160,
      align: 'center' as const,
      render: (time: string) => time || '-',
    },
    {
      title: '退料时间',
      dataIndex: 'returnTime',
      key: 'returnTime',
      width: 160,
      align: 'center' as const,
      render: (time: string) => time || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: any, item: any) => (
        <Button
          type="link"
          size="small"
          icon={<UndoOutlined />}
          onClick={() => handleReturn(item)}
          disabled={record.status !== 'ISSUED' || item.issuedQty <= item.returnedQty}
        >
          退料
        </Button>
      ),
    },
  ];

  /**
   * 流程步骤
   */
  const getSteps = () => {
    const steps = [
      {
        title: '申请',
        status: 'finish',
        description: `申请人：${record.requesterName}`,
        icon: <UserOutlined />,
      },
      {
        title: '审批',
        status: record.approvalTime ? 'finish' : record.status === 'CANCELLED' ? 'error' : 'process',
        description: record.approvalTime
          ? `审批人：${record.approverName}`
          : '待审批',
        icon: <CheckOutlined />,
      },
      {
        title: '领料',
        status: record.issueTime ? 'finish' : record.status === 'CANCELLED' ? 'error' : 'wait',
        description: record.issueTime
          ? `领料人：${record.operatorName}`
          : '待领料',
        icon: <ShoppingOutlined />,
      },
      {
        title: '完成',
        status: record.status === 'RETURNED' || record.status === 'PARTIAL_RETURN' ? 'finish' : 'wait',
        description: record.status === 'RETURNED'
          ? '已退料'
          : record.status === 'PARTIAL_RETURN'
          ? '部分退料'
          : '待完成',
        icon: <InboxOutlined />,
      },
    ];

    return steps;
  };

  return (
    <Drawer
      title="领料单详情"
      width={1000}
      open={visible}
      onClose={onClose}
      destroyOnClose
      footer={
        <Space style={{ textAlign: 'right', width: '100%' }}>
          {record.status === 'PENDING' && (
            <>
              <Button icon={<CheckOutlined />} type="primary" onClick={handleApprove}>
                审批通过
              </Button>
              <Button icon={<CloseOutlined />} danger onClick={handleReject}>
                拒绝
              </Button>
            </>
          )}
          {record.status === 'PENDING' && record.approvalTime && (
            <Button icon={<SendOutlined />} type="primary" onClick={handleIssue}>
              执行领料
            </Button>
          )}
          {record.status === 'ISSUED' && (
            <>
              <Button icon={<InboxOutlined />} type="primary" onClick={handleComplete}>
                完成领料
              </Button>
            </>
          )}
          {(record.status === 'PENDING' || record.status === 'ISSUED') && (
            <Button icon={<ExclamationCircleOutlined />} danger onClick={handleCancel}>
              取消
            </Button>
          )}
          <Button onClick={onClose}>关闭</Button>
        </Space>
      }
    >
      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总数量"
              value={record.totalQty}
              prefix={<ShoppingOutlined />}
              suffix="件"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已发数量"
              value={record.issuedQty}
              prefix={<InboxOutlined />}
              suffix="件"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已退数量"
              value={record.returnedQty}
              prefix={<UndoOutlined />}
              suffix="件"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="剩余数量"
              value={record.remainingQty}
              prefix={<FileTextOutlined />}
              suffix="件"
              valueStyle={{ color: record.remainingQty > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 基本信息 */}
      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="领料单号">{record.issuanceNo}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <StatusBadge status={record.status} statusMap={ISSUANCE_STATUS_MAP} />
          </Descriptions.Item>
          <Descriptions.Item label="领料类型">
            <Tag color={ISSUANCE_TYPE_MAP[record.issuanceType]?.color ?? 'default'}>
              {ISSUANCE_TYPE_MAP[record.issuanceType]?.icon ?? ''} {ISSUANCE_TYPE_MAP[record.issuanceType]?.label ?? String(record.issuanceType ?? '-')}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="领料方式">
            <Tag color={ISSUANCE_METHOD_MAP[record.method]?.color ?? 'default'}>
              {ISSUANCE_METHOD_MAP[record.method]?.icon ?? ''} {ISSUANCE_METHOD_MAP[record.method]?.label ?? String(record.method ?? '-')}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="工单编号">{record.workOrderNo}</Descriptions.Item>
          <Descriptions.Item label="任务编号">{record.taskNo}</Descriptions.Item>
          <Descriptions.Item label="工序名称">{record.operationName}</Descriptions.Item>
          <Descriptions.Item label="申请部门">{record.requesterDept}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 人员信息 */}
      <Card title="人员信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="申请人">{record.requesterName}</Descriptions.Item>
          <Descriptions.Item label="领料人">{record.operatorName}</Descriptions.Item>
          <Descriptions.Item label="收料人">{record.receiverName}</Descriptions.Item>
          <Descriptions.Item label="审批人">{record.approverName || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 流程信息 */}
      <Card title="流程信息" style={{ marginBottom: 16 }}>
        <Steps
          current={getSteps().findIndex(s => s.status === 'process')}
          style={{ marginBottom: 24 }}
          items={getSteps().map((step) => ({
            title: step.title,
            description: step.description,
            status: step.status as any,
            icon: step.icon,
          }))}
        />
        <Descriptions column={2} bordered>
          <Descriptions.Item label="申请时间">
            <ClockCircleOutlined /> {record.requestTime}
          </Descriptions.Item>
          <Descriptions.Item label="审批时间">
            {record.approvalTime ? (
              <>
                <ClockCircleOutlined /> {record.approvalTime}
              </>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="领料时间">
            {record.issueTime ? (
              <>
                <ClockCircleOutlined /> {record.issueTime}
              </>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="计划退料时间">
            {record.planReturnTime ? (
              <>
                <ClockCircleOutlined /> {record.planReturnTime}
              </>
            ) : (
              '-'
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 领料明细 */}
      <Card title="领料明细" style={{ marginBottom: 16 }}>
        <Table
          columns={itemColumns}
          dataSource={record.issuanceItems}
          rowKey="itemId"
          pagination={false}
          size="small"
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 备注信息 */}
      <Card title="备注信息">
        <Descriptions column={1} bordered>
          <Descriptions.Item label="审批意见">
            {record.approvalComment || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="备注">{record.remark || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </Drawer>
  );
};

export default IssuanceDetail;
