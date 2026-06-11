/**
 * 物料详情组件
 * 展示物料完整信息的详情视图
 */

import React from 'react';
import { Descriptions, Card, Tag, Button, Space } from 'antd';
import { CloseOutlined, EditOutlined } from '@ant-design/icons';
import { materialStatusMap, materialTypeMap, inventoryTypeMap } from '../types';
import { StatusBadge } from '../../../../shared/components/StatusBadge';

interface MaterialDetailProps {
  material: any;
  onClose: () => void;
  onEdit?: (material: any) => void;
}

const MaterialDetail: React.FC<MaterialDetailProps> = ({
  material,
  onClose,
  onEdit,
}) => {
  const getStatusColor = (status: string) => {
    return (materialStatusMap as any)[status]?.color || 'default';
  };

  const getStatusLabel = (status: string) => {
    return (materialStatusMap as any)[status]?.label || status;
  };

  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={
          <Space>
            <span>{material.name}</span>
            <Tag color={getStatusColor(material.status)}>
              {getStatusLabel(material.status)}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            {onEdit && (
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(material)}
              >
                编辑
              </Button>
            )}
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
        <Descriptions bordered column={2}>
          <Descriptions.Item label="物料编码" span={1}>
            {material.code}
          </Descriptions.Item>
          <Descriptions.Item label="物料名称" span={1}>
            {material.name}
          </Descriptions.Item>

          <Descriptions.Item label="物料分类" span={1}>
            {material.categoryName}
          </Descriptions.Item>
          <Descriptions.Item label="规格型号" span={1}>
            {material.specification || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="物料类型" span={1}>
            {(materialTypeMap as any)[material.type] || material.type}
          </Descriptions.Item>
          <Descriptions.Item label="库存类型" span={1}>
            {(inventoryTypeMap as any)[material.inventoryType] || material.inventoryType}
          </Descriptions.Item>

          <Descriptions.Item label="计量单位" span={1}>
            {material.unitName}
          </Descriptions.Item>
          <Descriptions.Item label="条形码" span={1}>
            {material.barcode || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="安全库存" span={1}>
            {material.safetyStock || 0}
          </Descriptions.Item>
          <Descriptions.Item label="再订货点" span={1}>
            {material.reorderPoint || 0}
          </Descriptions.Item>

          <Descriptions.Item label="前置时间" span={1}>
            {material.leadTime || 0} 天
          </Descriptions.Item>
          <Descriptions.Item label="状态" span={1}>
            <StatusBadge status={material.status} statusMap={materialStatusMap} />
          </Descriptions.Item>

          <Descriptions.Item label="最小包装量" span={1}>
            {material.minPackageQty || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="标准包装量" span={1}>
            {material.standardPackageQty || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="标准成本" span={1}>
            ¥{material.standardCost?.toFixed(2) || '0.00'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间" span={1}>
            {material.createTime}
          </Descriptions.Item>

          <Descriptions.Item label="更新时间" span={1}>
            {material.updateTime || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="更新人" span={1}>
            {material.updater || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="备注" span={2}>
            {material.remark || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="技术规格" span={2}>
            {material.specifications || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 可以添加更多相关信息的卡片，如库存信息、BOM信息等 */}
      {material.inventoryInfo && (
        <Card title="库存信息" style={{ marginTop: '16px' }}>
          <Descriptions bordered column={3}>
            <Descriptions.Item label="当前库存">
              {material.inventoryInfo.currentQuantity || 0}
            </Descriptions.Item>
            <Descriptions.Item label="可用库存">
              {material.inventoryInfo.availableQuantity || 0}
            </Descriptions.Item>
            <Descriptions.Item label="在途库存">
              {material.inventoryInfo.inTransitQuantity || 0}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

export default MaterialDetail;