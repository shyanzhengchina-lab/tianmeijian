/**
 * Import Progress Component
 * Visual component for tracking import operations progress
 */

import React from 'react';
import { Progress, Typography, Space, Alert, Card, Tag } from 'antd';
import {
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

// ============================================================================
// Component Props
// ============================================================================

export interface ImportProgressProps {
  /** Progress percentage (0-100) */
  percent: number;
  /** Current stage description */
  stage: string;
  /** Number of errors encountered */
  errors?: number;
  /** Total number of records to process */
  total?: number;
  /** Number of processed records */
  processed?: number;
  /** Whether the operation is still active */
  active?: boolean;
  /** Custom status message */
  statusMessage?: string;
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Import Progress Component
 * Displays the progress of an import operation with visual feedback
 *
 * @example
 * ```tsx
 * <ImportProgress
 *   percent={75}
 *   stage="正在处理数据..."
 *   errors={2}
 *   total={1000}
 *   processed={750}
 * />
 * ```
 */
export const ImportProgress: React.FC<ImportProgressProps> = ({
  percent,
  stage,
  errors = 0,
  total,
  processed,
  active = true,
  statusMessage,
}) => {
  /**
   * Determine progress status
   */
  const getProgressStatus = (): 'success' | 'exception' | 'active' | 'normal' => {
    if (!active) {
      if (percent === 100 && errors === 0) return 'success';
      if (errors > 0) return 'exception';
      return 'normal';
    }
    return 'active';
  };

  /**
   * Get status icon
   */
  const getStatusIcon = () => {
    const status = getProgressStatus();
    const iconStyle = { fontSize: '20px' };

    if (status === 'active') {
      return <LoadingOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
    }
    if (status === 'success') {
      return <CheckCircleOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
    }
    if (status === 'exception') {
      return <CloseCircleOutlined style={{ ...iconStyle, color: '#ff4d4f' }} />;
    }
    return null;
  };

  /**
   * Get status text color
   */
  const getStatusColor = () => {
    const status = getProgressStatus();
    if (status === 'success') return '#52c41a';
    if (status === 'exception') return '#ff4d4f';
    if (status === 'active') return '#1890ff';
    return '#8c8c8c';
  };

  const status = getProgressStatus();
  const statusColor = getStatusColor();

  return (
    <Card
      size="small"
      style={{
        background: status === 'exception' ? '#fff1f0' : status === 'success' ? '#f6ffed' : '#e6f7ff',
        border: `1px solid ${statusColor}`,
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {/* Stage and Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            {getStatusIcon()}
            <Text strong style={{ color: statusColor }}>
              {stage}
            </Text>
          </Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {percent.toFixed(0)}%
          </Text>
        </div>

        {/* Progress Bar */}
        <Progress
          percent={percent}
          status={status}
          strokeColor={{
            '0%': status === 'exception' ? '#ff7875' : '#91d5ff',
            '100%': status === 'exception' ? '#ff4d4f' : status === 'success' ? '#52c41a' : '#1890ff',
          }}
        />

        {/* Statistics */}
        {(total !== undefined || processed !== undefined || errors > 0) && (
          <Space wrap size="middle">
            {total !== undefined && (
              <Tag color="blue">
                总记录: {total}
              </Tag>
            )}
            {processed !== undefined && (
              <Tag color="green">
                已处理: {processed}
              </Tag>
            )}
            {total !== undefined && processed !== undefined && (
              <Tag color="purple">
                剩余: {total - processed}
              </Tag>
            )}
            {errors > 0 && (
              <Tag color="red">
                错误: {errors}
              </Tag>
            )}
          </Space>
        )}

        {/* Error Alert */}
        {errors > 0 && (
          <Alert
            message={`发现 ${errors} 个错误`}
            description="请检查详细错误信息，修正后可重新导入"
            type="error"
            showIcon
          />
        )}

        {/* Custom Status Message */}
        {statusMessage && (
          <Alert
            message={statusMessage}
            type={status === 'exception' ? 'error' : status === 'success' ? 'success' : 'info'}
            showIcon
          />
        )}

        {/* Estimated Time */}
        {active && percent > 0 && percent < 100 && total && processed && (
          <Paragraph type="secondary" style={{ margin: 0, fontSize: '12px' }}>
            <ExclamationCircleOutlined /> 预计剩余时间: 计算中...
          </Paragraph>
        )}
      </Space>
    </Card>
  );
};

export default ImportProgress;
