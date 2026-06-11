/**
 * 质检单详情组件
 * 展示质检单完整信息、质检结果、样品统计、判定记录
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space, Badge, Row, Col, Statistic, Timeline, Divider } from 'antd';
import {
  CloseOutlined, EditOutlined, FileTextOutlined, ApartmentOutlined, CalendarOutlined,
  CheckCircleOutlined, StopOutlined, PlayCircleOutlined, ShoppingOutlined,
  ExclamationCircleOutlined, HistoryOutlined, SafetyOutlined, TeamOutlined, UserOutlined
} from '@ant-design/icons';
import { INSPECTION_STATUS_MAP, INSPECTION_TYPE_MAP } from '../types';
import type { Inspection } from '../types';

interface InspectionDetailProps {
  inspection: Inspection;
  onClose: () => void;
  onEdit?: (inspection: Inspection) => void;
  onStart?: (inspection: Inspection) => void;
  onPass?: (inspection: Inspection) => void;
  onFail?: (inspection: Inspection) => void;
  onConditional?: (inspection: Inspection) => void;
  onAssign?: (inspection: Inspection) => void;
}

const InspectionDetail: React.FC<InspectionDetailProps> = ({
  inspection,
  onClose,
  onEdit,
  onStart,
  onPass,
  onFail,
  onConditional,
  onAssign,
}) => {
  const statusConfig = INSPECTION_STATUS_MAP[inspection.status];
  const typeConfig = INSPECTION_TYPE_MAP[inspection.inspectionType];

  // 计算统计
  const statisticsData = {
    sampleQty: inspection.sampleQty,
    qualifiedQty: inspection.qualifiedQty,
    unqualifiedQty: inspection.unqualifiedQty,
    conditionalQty: inspection.conditionalQty,
    qualifiedRate: inspection.sampleQty > 0
      ? ((inspection.qualifiedQty + inspection.conditionalQty) / inspection.sampleQty * 100).toFixed(1)
      : '0',
  };

  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>{inspection.inspectionNo}</span>
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
                onClick={() => onEdit(inspection)}
                disabled={inspection.status !== 'PENDING'}
              >
                编辑
              </Button>
            )}
            {onAssign && inspection.status === 'PENDING' && (
              <Button
                size="small"
                icon={<TeamOutlined />}
                onClick={() => onAssign(inspection)}
              >
                分配
              </Button>
            )}
            {onStart && inspection.status === 'PENDING' && (
              <Button
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => onStart(inspection)}
              >
                开始
              </Button>
            )}
            {onPass && inspection.status === 'IN_PROGRESS' && (
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onPass(inspection)}
              >
                合格
              </Button>
            )}
            {onFail && inspection.status === 'IN_PROGRESS' && (
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => onFail(inspection)}
              >
                不合格
              </Button>
            )}
            {onConditional && inspection.status === 'IN_PROGRESS' && (
              <Button
                size="small"
                icon={<SafetyOutlined />}
                onClick={() => onConditional(inspection)}
              >
                有条件
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
        {/* 质检单标识 */}
        <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <SafetyOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{inspection.inspectionNo}</span>
            <Tag color={typeConfig.color} style={{ fontSize: '14px', padding: '4px 12px', marginLeft: '12px' }}>
              {typeConfig.label}
            </Tag>
          </div>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '12px' }}>
            批号: {inspection.batchNo}
          </div>
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            {inspection.productName} - {inspection.productSpec}
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

        {/* 样品统计 */}
        <Card title="样品统计" style={{ marginBottom: '16px' }} extra={<ShoppingOutlined style={{ color: '#1677ff' }} />}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="抽样数量"
                value={statisticsData.sampleQty}
                suffix="件"
                valueStyle={{ color: '#1677ff' }}
                prefix={<ShoppingOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="合格数量"
                value={statisticsData.qualifiedQty}
                suffix="件"
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="不合格数量"
                value={statisticsData.unqualifiedQty}
                suffix="件"
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<StopOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="有条件数量"
                value={statisticsData.conditionalQty}
                suffix="件"
                valueStyle={{ color: '#faad14' }}
                prefix={<SafetyOutlined />}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '16px' }}>
            <Col span={12}>
              <div style={{ marginBottom: '8px', fontSize: '13px', color: '#666' }}>
                综合合格率: {statisticsData.qualifiedRate}%
              </div>
            </Col>
          </Row>
        </Card>

        {/* 基本信息 */}
        <Card title="基本信息" style={{ marginBottom: '16px' }} extra={<FileTextOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="质检单号" span={1}>
              {inspection.inspectionNo}
            </Descriptions.Item>
            <Descriptions.Item label="浮票号" span={1}>
              {inspection.ticketNo || '无'}
            </Descriptions.Item>

            <Descriptions.Item label="工单号" span={1}>
              {inspection.workOrderNo || '无'}
            </Descriptions.Item>
            <Descriptions.Item label="质检类型" span={1}>
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
            <Descriptions.Item label="检验员" span={1}>
              {inspection.inspector || '-'}
            </Descriptions.Item>

            <Descriptions.Item label="产品编码" span={1}>
              {inspection.productCode}
            </Descriptions.Item>
            <Descriptions.Item label="产品名称" span={1}>
              {inspection.productName}
            </Descriptions.Item>

            <Descriptions.Item label="产品规格" span={2}>
              {inspection.productSpec}
            </Descriptions.Item>

            <Descriptions.Item label="批号" span={1}>
              {inspection.batchNo}
            </Descriptions.Item>
            <Descriptions.Item label="子批号" span={1}>
              {inspection.lotNo || '-'}
            </Descriptions.Item>

            <Descriptions.Item label="质检方案" span={2}>
              {inspection.qcSchemeName}
            </Descriptions.Item>

            <Descriptions.Item label="备注" span={2}>
              {inspection.remark || '无'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 判定信息 */}
        {inspection.result && (
          <Card title="判定信息" style={{ marginBottom: '16px' }} extra={<SafetyOutlined style={{ color: '#1677ff' }} />}>
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="判定结果" span={1}>
                <span style={{
                  color: INSPECTION_STATUS_MAP[inspection.result]?.color,
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  {INSPECTION_STATUS_MAP[inspection.result]?.label}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="检验员" span={1}>
                {inspection.inspector || '-'}
              </Descriptions.Item>

              <Descriptions.Item label="检验时间" span={1}>
                {inspection.inspectionTime || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间" span={1}>
                {inspection.completeTime || '-'}
              </Descriptions.Item>

              {inspection.resultDetails && (
                <Descriptions.Item label="结果详情" span={2}>
                  {inspection.resultDetails}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}

        {/* 时间信息 */}
        <Card title="时间信息" style={{ marginBottom: '16px' }} extra={<CalendarOutlined style={{ color: '#1677ff' }} />}>
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="申请时间" span={1}>
              {inspection.requestTime}
            </Descriptions.Item>
            <Descriptions.Item label="检验时间" span={1}>
              {inspection.inspectionTime || '待检验'}
            </Descriptions.Item>

            <Descriptions.Item label="完成时间" span={1}>
              {inspection.completeTime || '未完成'}
            </Descriptions.Item>

            <Descriptions.Item label="创建人" span={1}>
              {inspection.createdBy}
            </Descriptions.Item>

            <Descriptions.Item label="创建时间" span={1}>
              {inspection.createdAt}
            </Descriptions.Item>

            <Descriptions.Item label="更新时间" span={1}>
              {inspection.updatedAt}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 流程记录 */}
        <Divider />
        <Card title="流程记录" extra={<HistoryOutlined style={{ color: '#1677ff' }} />}>
          <Timeline
            items={[
              {
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {inspection.createdAt} - 质检单创建
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      质检单已创建，状态为待检验
                    </div>
                  </div>
                ),
              },
              ...(inspection.inspectionTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {inspection.inspectionTime} - 开始检验
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      质检单开始检验
                    </div>
                  </div>
                ),
              }] : []),
              ...(inspection.completeTime ? [{
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {inspection.completeTime} - 检验完成
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      检验员: {inspection.inspector}
                    </div>
                    {inspection.result && (
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        判定结果: {INSPECTION_STATUS_MAP[inspection.result]?.label}
                      </div>
                    )}
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

export default InspectionDetail;
