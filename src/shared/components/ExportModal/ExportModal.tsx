/**
 * 导出弹窗通用组件
 * 支持多种导出格式、字段选择、数据过滤等导出功能
 */

import React, { useState, useCallback } from 'react';
import { Modal, Checkbox, Button, Space, Radio, Select, message, Spin, Alert } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined, FileTextOutlined, FilterOutlined } from '@ant-design/icons';

/**
 * 导出格式
 */
export type ExportFormat = 'excel' | 'csv' | 'pdf' | 'json';

/**
 * 导出字段配置
 */
export interface ExportField {
  key: string;
  label: string;
  required?: boolean; // 是否默认选中
  dataType?: 'string' | 'number' | 'date' | 'boolean'; // 数据类型
}

/**
 * 导出配置
 */
export interface ExportConfig {
  formats?: ExportFormat[]; // 支持的导出格式
  defaultFormat?: ExportFormat; // 默认导出格式
  showFieldSelector?: boolean; // 是否显示字段选择器
  showFilter?: boolean; // 是否显示数据过滤
  maxSize?: number; // 最大导出条数
  allowDownloadHistory?: boolean; // 是否允许下载历史
}

/**
 * 导出选项
 */
export interface ExportOptions {
  format: ExportFormat;
  fields: string[]; // 选中的字段
  filters?: Record<string, any>; // 过滤条件
  includeHeader?: boolean; // 是否包含表头
  fileName?: string; // 自定义文件名
}

/**
 * ExportModal组件Props
 */
export interface ExportModalProps {
  visible: boolean;
  title: string;
  onCancel: () => void;
  onExport: (options: ExportOptions) => void;
  fields?: ExportField[]; // 可导出的字段列表
  config?: ExportConfig;
  exportLoading?: boolean;
  previewData?: any[]; // 预览数据（可选）
  historyData?: Array<{ fileName: string; exportTime: string; recordCount: number }>; // 导出历史
}

/**
 * 默认导出配置
 */
const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  formats: ['excel', 'csv'],
  defaultFormat: 'excel',
  showFieldSelector: true,
  showFilter: false,
  maxSize: 100000,
  allowDownloadHistory: true,
};

/**
 * 导出格式配置
 */
const EXPORT_FORMAT_CONFIG = {
  excel: {
    label: 'Excel',
    icon: <FileExcelOutlined />,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
  },
  csv: {
    label: 'CSV',
    icon: <FileTextOutlined />,
    mimeType: 'text/csv',
    extension: '.csv',
  },
  pdf: {
    label: 'PDF',
    icon: <FilePdfOutlined />,
    mimeType: 'application/pdf',
    extension: '.pdf',
  },
  json: {
    label: 'JSON',
    icon: <FileTextOutlined />,
    mimeType: 'application/json',
    extension: '.json',
  },
};

/**
 * ExportModal组件
 */
function ExportModal({
  visible,
  title,
  onCancel,
  onExport,
  fields = [],
  config = DEFAULT_EXPORT_CONFIG,
  exportLoading = false,
  previewData,
  historyData,
}: ExportModalProps) {
  // State
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(
    (config.defaultFormat || DEFAULT_EXPORT_CONFIG.defaultFormat) as ExportFormat
  );
  const [selectedFields, setSelectedFields] = useState<string[]>(
    fields.filter(f => f.required).map(f => f.key)
  );
  const [includeHeader, setIncludeHeader] = useState(true);
  const [customFileName, setCustomFileName] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [exporting, setExporting] = useState(false);

  // 全选/取消全选字段
  const handleSelectAllFields = useCallback(() => {
    setSelectedFields(fields.map(f => f.key));
  }, [fields]);

  const handleUnselectAllFields = useCallback(() => {
    const requiredFields = fields.filter(f => f.required).map(f => f.key);
    setSelectedFields(requiredFields);
  }, [fields]);

  // 导出处理
  const handleExport = useCallback(async () => {
    setExporting(true);

    try {
      const options: ExportOptions = {
        format: selectedFormat,
        fields: selectedFields,
        includeHeader,
        fileName: customFileName || undefined,
      };

      await onExport(options);

      message.success('导出成功！');
      onCancel(); // 导出成功后关闭弹窗
    } catch (error: any) {
      message.error(`导出失败：${error.message || '未知错误'}`);
    } finally {
      setExporting(false);
    }
  }, [selectedFormat, selectedFields, includeHeader, customFileName, onExport, onCancel]);

  // 重置
  const handleReset = useCallback(() => {
    setSelectedFormat((config.defaultFormat || DEFAULT_EXPORT_CONFIG.defaultFormat) as ExportFormat);
    setSelectedFields(fields.filter(f => f.required).map(f => f.key));
    setIncludeHeader(true);
    setCustomFileName('');
    setShowHistory(false);
  }, [fields, config]);

  // 关闭弹窗
  const handleClose = useCallback(() => {
    handleReset();
    onCancel();
  }, [onCancel, handleReset]);

  // 格式选择
  const formatOptions = (config.formats || DEFAULT_EXPORT_CONFIG.formats || ['excel', 'csv'] as ExportFormat[]).map(format => ({
    label: (
      <Space>
        {EXPORT_FORMAT_CONFIG[format].icon}
        <span>{EXPORT_FORMAT_CONFIG[format].label}</span>
      </Space>
    ),
    value: format,
  }));

  // 获取导出预览
  const getExportPreview = useCallback(() => {
    if (!previewData || previewData.length === 0) {
      return null;
    }

    return {
      total: previewData.length,
      selected: selectedFields.length,
      size: new Blob([
        JSON.stringify(previewData.map(row => {
          const obj: any = {};
          selectedFields.forEach(field => {
            obj[field] = row[field];
          });
          return obj;
        })),
      ], { type: 'text/plain' }).size,
      format: selectedFormat,
    };
  }, [previewData, selectedFields, selectedFormat]);

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={handleClose}
      width={800}
      footer={
        <Space>
          <Button onClick={handleClose}>
            取消
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting || exportLoading}
            disabled={selectedFields.length === 0}
          >
            {exporting ? '导出中...' : '导出'}
          </Button>
        </Space>
      }
      destroyOnClose
    >
      <div style={{ minHeight: 400 }}>
        {/* 导出格式选择 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 16 }}>
            <Space>
              <FilterOutlined />
              <span>导出设置</span>
            </Space>
          </div>

          <Space direction="vertical" size="large" style={{ marginLeft: 24 }}>
            {/* 格式选择 */}
            <div>
              <div style={{ marginBottom: 8, fontSize: 14 }}>
                <span>导出格式：</span>
              </div>
              <Radio.Group
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                style={{ marginLeft: 16 }}
              >
                {formatOptions.map(option => (
                  <Radio key={option.value} value={option.value}>
                    {option.label}
                  </Radio>
                ))}
              </Radio.Group>
            </div>

            {/* 文件名 */}
            <div>
              <div style={{ marginBottom: 8, fontSize: 14 }}>
                <span>文件名：</span>
              </div>
              <input
                type="text"
                placeholder="留空则使用默认文件名"
                value={customFileName}
                onChange={e => setCustomFileName(e.target.value)}
                style={{
                  marginLeft: 16,
                  padding: '6px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  width: 300,
                }}
              />
            </div>

            {/* 是否包含表头 */}
            <div>
              <Checkbox checked={includeHeader} onChange={e => setIncludeHeader(e.target.checked)}>
                包含表头
              </Checkbox>
            </div>
          </Space>
        </div>

        {/* 字段选择 */}
        {config.showFieldSelector && fields.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 16 }}>
              <Space>
                <FileExcelOutlined />
                <span>字段选择</span>
              </Space>
              <Space style={{ marginLeft: 16, fontSize: 12 }}>
                <Button size="small" onClick={handleSelectAllFields}>
                  全选
                </Button>
                <Button size="small" onClick={handleUnselectAllFields}>
                  取消全选
                </Button>
              </Space>
            </div>

            <Checkbox.Group
              value={selectedFields}
              onChange={setSelectedFields}
              style={{
                marginLeft: 24,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
              }}
            >
              {fields.map(field => (
                <Checkbox key={field.key} value={field.key} disabled={field.required}>
                  <Space>
                    {field.required && <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>}
                    <span>{field.label}</span>
                  </Space>
                </Checkbox>
              ))}
            </Checkbox.Group>
          </div>
        )}

        {/* 导出预览 */}
        {getExportPreview() && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 16 }}>
              <Space>
                <FilterOutlined />
                <span>导出预览</span>
              </Space>
            </div>

            <Alert
              message={
                <Space direction="vertical" size="small">
                  <span>总数据量：{getExportPreview()?.total} 条</span>
                  <span>选中字段：{getExportPreview()?.selected} 个</span>
                  <span>预估文件大小：{((getExportPreview()?.size ?? 0) / 1024).toFixed(2)} KB</span>
                  <span>导出格式：{EXPORT_FORMAT_CONFIG[selectedFormat].label}</span>
                </Space>
              }
              type="info"
              showIcon
            />

            {selectedFields.length === 0 && (
              <Alert
                message="请至少选择一个导出字段！"
                type="warning"
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        )}

        {/* 导出历史 */}
        {config.allowDownloadHistory && historyData && historyData.length > 0 && (
          <div>
            <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 16 }}>
              <Space>
                <DownloadOutlined />
                <span>导出历史</span>
              </Space>
              <Button
                size="small"
                type={showHistory ? 'default' : 'link'}
                onClick={() => setShowHistory(!showHistory)}
                style={{ marginLeft: 16 }}
              >
                {showHistory ? '隐藏' : '显示'}
              </Button>
            </div>

            {showHistory && (
              <div style={{
                marginLeft: 24,
                padding: '12px',
                background: '#f5f5f5',
                borderRadius: 4,
                maxHeight: 200,
                overflowY: 'auto',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fafafa', borderBottom: '2px solid #f0f0f0' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>文件名</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>导出时间</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>记录数</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '8px 12px' }}>{item.fileName}</td>
                        <td style={{ padding: '8px 12px' }}>{item.exportTime}</td>
                        <td style={{ padding: '8px 12px' }}>{item.recordCount}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <Button
                            type="link"
                            size="small"
                            onClick={() => {
                              message.info(`重新导出：${item.fileName}`);
                            }}
                          >
                            重新导出
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 加载状态 */}
        {exporting && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
          }}>
            <Spin size="large" />
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      {!exporting && (
        <div style={{
          marginTop: 24,
          padding: '16px 24px',
          borderTop: '1px solid #f0f0f0',
          background: '#fafafa',
        }}>
          <Space>
            <Button onClick={handleReset}>
              重置设置
            </Button>
            <Button onClick={handleClose}>
              取消导出
            </Button>
          </Space>
        </div>
      )}
    </Modal>
  );
}

export default ExportModal;