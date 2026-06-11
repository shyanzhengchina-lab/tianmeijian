/**
 * Work Orders Tab Component
 * Extracted from ProductionOrderDetail.tsx to reduce deep nesting
 */

import React from 'react';
import { Card, Button, Space, Tag } from 'antd';
import { ShoppingOutlined } from '@ant-design/icons';
import type { WorkOrder } from '../../work-order/types';

interface WorkOrdersTabProps {
  workOrders: WorkOrder[];
  onEdit?: (workOrder: WorkOrder) => void;
  onBatchActivate?: (selectedIds: string[]) => void;
  onBatchLeave?: (selectedIds: string[]) => void;
  onBatchResign?: (selectedIds: string[]) => void;
}

/**
 * Individual Work Order Card Item
 */
const WorkOrderItem: React.FC<{ workOrder: WorkOrder }> = ({ workOrder }) => {
  return (
    <div
      key={workOrder.id}
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
      {/* Work Order Info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {workOrder.woNo}
        </div>
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
          计划: {workOrder.planQty} 件
          {workOrder.actualQty && ` | 实际: ${workOrder.actualQty} 件`}
        </div>
      </div>

      {/* Status Display */}
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: workOrder.status === 'COMPLETED' ? '#52c41a' : workOrder.status === 'IN_PROGRESS' ? '#1677ff' : '#8c8c8c' }}>
        {workOrder.status === 'IN_PROGRESS' ? '生产中' : workOrder.status === 'COMPLETED' ? '已完成' : '待开始'}
      </div>
    </div>
  );
};

/**
 * Work Orders Tab Component
 */
export const WorkOrdersTab: React.FC<WorkOrdersTabProps> = ({
  workOrders,
  onEdit,
  onBatchActivate,
  onBatchLeave,
  onBatchResign
}) => {
  return (
    <Card title="关联生产工单" extra={<ShoppingOutlined style={{ color: '#1677ff' }} />}>
      <div style={{ background: '#fafafa', borderRadius: '4px', padding: '12px' }}>
        {workOrders.map(wo => (
          <WorkOrderItem workOrder={wo} />
        ))}
      </div>
    </Card>
  );
};
