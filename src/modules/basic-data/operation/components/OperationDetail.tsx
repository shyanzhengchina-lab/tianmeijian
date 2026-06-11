/**
 * 工序主数据详情组件
 * 展示工序完整信息和阶段配置
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Divider, Tabs, Timeline, Badge } from 'antd';
import {
  CloseOutlined, EditOutlined, ClockCircleOutlined, ToolOutlined,
  CheckCircleOutlined, ApartmentOutlined, FileTextOutlined,
  SettingOutlined, HistoryOutlined, BranchesOutlined
} from '@ant-design/icons';
import { OP_STATUS_MAP, OP_CATEGORY_MAP, PHASE_TYPE_MAP } from '../types';
import type { Operation, OperationPhase } from '../types';

interface OperationDetailProps {
  operation: Operation;
  onClose: () => void;
  onEdit?: (operation: Operation) => void;
}

const OperationDetail: React.FC<OperationDetailProps> = ({
  operation,
  onClose,
  onEdit,
}) => {
  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      DRAFT: <ApartmentOutlined style={{ color: '#8c8c8c' }} />,
      ACTIVE: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      OBSOLETE: <ClockCircleOutlined style={{ color: '#faad14' }} />,
      DISABLED: <ToolOutlined style={{ color: '#cf1322' }} />,
    };
    return iconMap[status] || null;
  };

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Card title="工序基本信息" extra={
          <Space>
            {onEdit && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(operation)}
              >
                编辑
              </Button>
            )}
            <Button
              size="small"
              icon={<BranchesOutlined />}
            >
              工艺参数
            </Button>
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
          <Descriptions bordered column={2}>
            <Descriptions.Item label="工序编码" span={1}>
              {operation.opCode}
            </Descriptions.Item>
            <Descriptions.Item label="工序名称" span={1}>
              {operation.opName}
            </Descriptions.Item>

            <Descriptions.Item label="简称" span={1}>
              {operation.opShort}
            </Descriptions.Item>
            <Descriptions.Item label="工序类别" span={1}>
              {OP_CATEGORY_MAP[operation.category]?.label || operation.category}
            </Descriptions.Item>

            <Descriptions.Item label="所属车间" span={1}>
              {operation.workshop}
            </Descriptions.Item>
            <Descriptions.Item label="生产线" span={1}>
              {operation.productLine}
            </Descriptions.Item>

            <Descriptions.Item label="工作中心" span={1}>
              {operation.workCenter}
            </Descriptions.Item>
            <Descriptions.Item label="设备类型" span={1}>
              {operation.equipType}
            </Descriptions.Item>

            <Descriptions.Item label="标准工时" span={1}>
              {operation.stdTimeMin} 分钟/件
            </Descriptions.Item>
            <Descriptions.Item label="准备工时" span={1}>
              {operation.prepTimeMin} 分钟/批
            </Descriptions.Item>

            <Descriptions.Item label="版本" span={1}>
              <Tag color="blue">{operation.version}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="生效日期" span={1}>
              {operation.effectDate}
            </Descriptions.Item>

            <Descriptions.Item label="状态" span={2}>
              <Space>
                {getStatusIcon(operation.status)}
                <Tag color={OP_STATUS_MAP[operation.status]?.color}>
                  {OP_STATUS_MAP[operation.status]?.label}
                </Tag>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="创建人" span={1}>
              {operation.createdBy}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间" span={1}>
              {operation.updatedAt}
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={2}>
              {operation.remark || '-'}
            </Descriptions.Item>
          </Descriptions>

          {/* 工序特性标签 */}
          <Divider orientation={"left" as any}>工序特性</Divider>
          <Space wrap style={{ marginTop: '8px' }}>
            {operation.hasFirstPiece && (
              <Badge count="首件" style={{ backgroundColor: '#1677ff' }} />
            )}
            {operation.hasLastPiece && (
              <Badge count="末件" style={{ backgroundColor: '#52c41a' }} />
            )}
            {operation.hasPatrol && (
              <Badge count={`巡检每${operation.patrolFreq}件`} style={{ backgroundColor: '#faad14' }} />
            )}
            {operation.hasCleanup && (
              <Badge count="需清场" style={{ backgroundColor: '#13c2c2' }} />
            )}
            {operation.isBottleneck && (
              <Badge count="瓶颈工序" style={{ backgroundColor: '#cf1322' }} />
            )}
            {operation.isReportPoint && (
              <Badge count="报告点" style={{ backgroundColor: '#eb2f96' }} />
            )}
            {operation.isQcPoint && (
              <Badge count="质检点" style={{ backgroundColor: '#722ed1' }} />
            )}
          </Space>
        </Card>
      ),
    },
    {
      key: 'phases',
      label: `工序阶段 (${operation.phases?.length || 0})`,
      children: (
        <Card title="工序阶段配置">
          {operation.phases && operation.phases.length > 0 ? (
            <Timeline
              items={operation.phases.map((phase, index) => ({
                key: index,
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      <Badge count={phase.seq} style={{ marginRight: '8px' }} />
                      {phase.phaseName}
                      <Tag color={PHASE_TYPE_MAP[phase.phaseType]?.color} style={{ marginLeft: '8px' }}>
                        {PHASE_TYPE_MAP[phase.phaseType]?.label}
                      </Tag>
                      {phase.required && (
                        <Tag color="red" style={{ marginLeft: '4px' }}>必须</Tag>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      代码: {phase.phaseCode} |
                      字段数: {phase.fields?.length || 0}个
                      {phase.eSign && <Tag color="blue" style={{ marginLeft: '4px' }}>电子签名</Tag>}
                      {phase.dualReview && <Tag color="green" style={{ marginLeft: '4px' }}>双人复核</Tag>}
                    </div>
                    {phase.remark && (
                      <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                        备注: {phase.remark}
                      </div>
                    )}
                    {phase.fields && phase.fields.length > 0 && (
                      <div style={{ marginTop: '8px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                          字段配置 ({phase.fields.length}个):
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', fontSize: '11px' }}>
                          {phase.fields.slice(0, 6).map(field => (
                            <div key={field.code} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <Tag>{field.name}</Tag>
                            </div>
                          ))}
                        </div>
                        {phase.fields.length > 6 && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', fontSize: '11px', marginTop: '4px' }}>
                            {phase.fields.slice(6).map(field => (
                              <div key={field.code} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <Tag>{field.name}</Tag>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ),
              }))}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
              <FileTextOutlined style={{ fontSize: 48, marginBottom: '16px' }} />
              <div>该工序暂无阶段配置</div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                请在工序编辑中添加工序阶段
              </div>
            </div>
          )}
        </Card>
      ),
    },
    {
      key: 'environment',
      label: '工艺要求',
      children: (
        <Card title="工艺要求">
          <Descriptions bordered column={1}>
            <Descriptions.Item label="环境要求" span={1}>
              <div style={{
                padding: '12px',
                background: '#e6f7ff',
                borderRadius: '4px',
                border: '1px solid #91d5ff',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {operation.envReq || '无特殊环境要求'}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="参数模板" span={1}>
              <Space>
                <Tag color="blue">{operation.paramTemplate || '未配置'}</Tag>
                {operation.paramTemplate && (
                  <Button size="small" type="link">
                  查看参数详情
                </Button>
                )}
              </Space>
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
            <span>{operation.opName}</span>
            <Tag color={OP_STATUS_MAP[operation.status]?.color}>
              {OP_STATUS_MAP[operation.status]?.label}
            </Tag>
            <Tag color={OP_CATEGORY_MAP[operation.category]?.color}>
              {OP_CATEGORY_MAP[operation.category]?.label}
            </Tag>
            <Tag color="blue">{operation.opCode}</Tag>
          </Space>
        }
        extra={
          <Space>
            {onEdit && operation.status === 'DRAFT' && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(operation)}
              >
                编辑
              </Button>
            )}
            <Button
              size="small"
              icon={<SettingOutlined />}
            >
              参数配置
            </Button>
            <Button
              size="small"
              icon={<BranchesOutlined />}
            >
              工艺验证
            </Button>
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

export default OperationDetail;
