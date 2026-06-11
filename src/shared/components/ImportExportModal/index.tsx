/**
 * Import/Export Modal Component
 * Comprehensive modal for import/export operations with file validation
 */

import React, { useState, useCallback } from 'react';
import {
  Modal,
  Upload,
  Select,
  Button,
  Radio,
  Space,
  Typography,
  Alert,
  Divider,
  Tabs,
  Card,
  Tag,
  Progress,
  message,
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useImportExport } from '../../hooks/useImportExport';
import { ImportProgress } from '../ImportProgress';
import type { ImportResult } from '../../api/importExportApi';

const { Text, Paragraph, Title } = Typography;

// ============================================================================
// Component Props
// ============================================================================

export interface ImportExportModalProps {
  /** Modal visibility */
  visible: boolean;
  /** Callback when modal is closed */
  onCancel: () => void;
  /** Module name (e.g., 'material', 'employee') */
  module: string;
  /** Module display name (e.g., '物料管理') */
  moduleName: string;
  /** Callback called on successful import */
  onSuccess?: (result: ImportResult) => void;
  /** Callback called on error */
  onError?: (error: Error) => void;
  /** Progress callback during import */
  onProgress?: (percent: number) => void;
}

// ============================================================================
// Component Implementation
// ============================================================================

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  visible,
  onCancel,
  module,
  moduleName,
  onSuccess,
  onError,
  onProgress,
}) => {
  const {
    handleImport,
    handleExport,
    handleDownloadTemplate,
    importLoading,
    exportLoading,
    validateFile,
    importResult,
    importError,
  } = useImportExport({
    module,
    onSuccess,
    onError,
    onProgress,
  });

  // State management
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [importMode, setImportMode] = useState<'INSERT' | 'UPDATE' | 'UPSERT' | 'REPLACE'>('INSERT');
  const [updateStrategy, setUpdateStrategy] = useState<'SKIP' | 'OVERWRITE' | 'MERGE'>('SKIP');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  /**
   * Handle file upload
   */
  const handleUpload = useCallback(async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      message.error(validation.error);
      return false;
    }

    await handleImport({
      file,
      mode: importMode,
      updateStrategy,
      onUploadProgress: (percent: number) => setUploadProgress(percent),
    });

    setFileList([]);
    setUploadProgress(0);
    return false;
  }, [validateFile, handleImport, importMode, updateStrategy]);

  /**
   * Handle export click
   */
  const handleExportClick = useCallback(async () => {
    await handleExport();
  }, [handleExport]);

  /**
   * Handle template download
   */
  const handleTemplateDownload = useCallback(async () => {
    await handleDownloadTemplate();
  }, [handleDownloadTemplate]);

  /**
   * Handle tab change
   */
  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key as 'import' | 'export');
  }, []);

  /**
   * Handle file selection
   */
  const handleFileChange = useCallback((info: any) => {
    setFileList(info.fileList);
  }, []);

  /**
   * Handle file remove
   */
  const handleFileRemove = useCallback(() => {
    setFileList([]);
    setUploadProgress(0);
  }, []);

  /**
   * Upload configuration
   */
  const uploadProps = {
    accept: '.xls,.xlsx,.csv',
    fileList,
    beforeUpload: handleUpload,
    onChange: handleFileChange,
    onRemove: handleFileRemove,
    disabled: importLoading,
    maxCount: 1,
  };

  /**
   * Import mode options
   */
  const importModeOptions = [
    {
      label: '新增 (仅添加新记录)',
      value: 'INSERT' as const,
      description: '只导入不存在的记录，重复的记录会被跳过',
    },
    {
      label: '更新 (仅更新现有记录)',
      value: 'UPDATE' as const,
      description: '只更新已存在的记录，新记录不会被导入',
    },
    {
      label: '智能导入 (新增并更新)',
      value: 'UPSERT' as const,
      description: '不存在则新增，存在则更新',
    },
    {
      label: '覆盖 (删除全部后导入)',
      value: 'REPLACE' as const,
      description: '删除所有现有数据后再导入新数据',
    },
  ];

  /**
   * Update strategy options
   */
  const updateStrategyOptions = [
    {
      label: '跳过重复数据',
      value: 'SKIP' as const,
      description: '遇到重复数据时跳过，保留原数据',
    },
    {
      label: '覆盖重复数据',
      value: 'OVERWRITE' as const,
      description: '遇到重复数据时用新数据覆盖',
    },
    {
      label: '合并重复数据',
      value: 'MERGE' as const,
      description: '将新旧数据合并',
    },
  ];

  return (
    <Modal
      title={`${moduleName} - ${activeTab === 'import' ? '数据导入' : '数据导出'}`}
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="template"
          icon={<DownloadOutlined />}
          onClick={handleTemplateDownload}
          disabled={exportLoading}
        >
          下载模板
        </Button>,
        activeTab === 'import' ? (
          <Button
            key="import"
            type="primary"
            icon={<UploadOutlined />}
            loading={importLoading}
            disabled={fileList.length === 0 || importLoading}
            onClick={() => {
              if (fileList.length > 0) {
                handleUpload(fileList[0].originFileObj as File);
              }
            }}
          >
            开始导入
          </Button>
        ) : (
          <Button
            key="export"
            type="primary"
            icon={<FileExcelOutlined />}
            loading={exportLoading}
            onClick={handleExportClick}
          >
            开始导出
          </Button>
        ),
      ]}
    >
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'import',
            label: (
              <span>
                <UploadOutlined />
                数据导入
              </span>
            ),
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* Import Mode Selection */}
                <Card size="small" title={<><InfoCircleOutlined /> 导入模式</>}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Select
                      value={importMode}
                      onChange={setImportMode}
                      style={{ width: '100%' }}
                      options={importModeOptions.map((option) => ({
                        label: option.label,
                        value: option.value,
                      }))}
                    />
                    <Paragraph type="secondary" style={{ margin: 0 }}>
                      {importModeOptions.find((opt) => opt.value === importMode)?.description}
                    </Paragraph>
                  </Space>
                </Card>

                {/* Update Strategy Selection */}
                <Card size="small" title={<><ExclamationCircleOutlined /> 重复数据处理</>}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Select
                      value={updateStrategy}
                      onChange={setUpdateStrategy}
                      style={{ width: '100%' }}
                      options={updateStrategyOptions.map((option) => ({
                        label: option.label,
                        value: option.value,
                      }))}
                    />
                    <Paragraph type="secondary" style={{ margin: 0 }}>
                      {updateStrategyOptions.find((opt) => opt.value === updateStrategy)?.description}
                    </Paragraph>
                  </Space>
                </Card>

                {/* Import Instructions */}
                <Alert
                  message="导入说明"
                  description={
                    <ul>
                      <li>请先下载模板，按照模板格式填写数据</li>
                      <li>文件大小不能超过10MB</li>
                      <li>支持Excel (.xls, .xlsx) 和CSV格式</li>
                      <li>导入失败的数据会在下方显示详细错误信息</li>
                      <li>建议先测试导入少量数据，确认无误后再大批量导入</li>
                    </ul>
                  }
                  type="info"
                  showIcon
                />

                {/* File Upload */}
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <Text strong>选择文件</Text>
                  <Upload {...uploadProps} style={{ width: '100%' }}>
                    <Button icon={<UploadOutlined />} loading={importLoading}>
                      {fileList.length === 0 ? '选择文件' : '重新选择'}
                    </Button>
                  </Upload>
                </Space>

                {/* Selected File Info */}
                {fileList.length > 0 && (
                  <Card
                    size="small"
                    style={{ background: '#f5f5f5' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <Space>
                        <FileExcelOutlined style={{ fontSize: '24px' }} />
                        <div>
                          <Text strong>{fileList[0].name}</Text>
                          <br />
                          <Text type="secondary">
                            {((fileList[0].size || 0) / 1024).toFixed(2)} KB
                          </Text>
                        </div>
                      </Space>
                    </Space>
                  </Card>
                )}

                {/* Import Progress */}
                {(uploadProgress > 0 || importLoading) && (
                  <ImportProgress
                    percent={uploadProgress}
                    stage={importLoading ? '正在导入数据...' : '准备导入'}
                    errors={importError ? 1 : 0}
                  />
                )}

                {/* Import Result */}
                {importResult && (
                  <Card size="small" style={{ background: '#f6ffed' }}>
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
                        <Title level={5} style={{ margin: 0 }}>导入完成</Title>
                      </Space>
                      <div>
                        <Space size="large">
                          <Text>
                            总记录数: <Text strong>{importResult.totalRows}</Text>
                          </Text>
                          <Text style={{ color: '#52c41a' }}>
                            成功: <Text strong>{importResult.successCount}</Text>
                          </Text>
                          <Text style={{ color: '#ff4d4f' }}>
                            失败: <Text strong>{importResult.failureCount}</Text>
                          </Text>
                        </Space>
                      </div>
                      {importResult.warnings.length > 0 && (
                        <Alert
                          message={`发现 ${importResult.warnings.length} 个警告`}
                          description={
                            importResult.warnings.slice(0, 3).map((w, i) => (
                              <div key={i}>行 {w.rowNumber}: {w.warningMessage}</div>
                            ))
                          }
                          type="warning"
                          showIcon
                        />
                      )}
                    </Space>
                  </Card>
                )}

                {/* Import Error */}
                {importError && (
                  <Alert
                    message="导入失败"
                    description={importError.message}
                    type="error"
                    showIcon
                  />
                )}
              </Space>
            ),
          },
          {
            key: 'export',
            label: (
              <span>
                <FileExcelOutlined />
                数据导出
              </span>
            ),
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* Export Instructions */}
                <Alert
                  message="导出说明"
                  description={
                    <ul>
                      <li>导出的数据为当前筛选条件下的数据</li>
                      <li>支持导出为Excel或CSV格式</li>
                      <li>大数量数据导出可能需要较长时间</li>
                      <li>导出文件会自动下载到浏览器默认下载目录</li>
                    </ul>
                  }
                  type="info"
                  showIcon
                />

                {/* Export Info Card */}
                <Card size="small">
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Space>
                      <InfoCircleOutlined style={{ fontSize: '20px' }} />
                      <Text strong>导出信息</Text>
                    </Space>
                    <Divider style={{ margin: '8px 0' }} />
                    <Text>模块: <Tag color="blue">{moduleName}</Tag></Text>
                    <Text>格式: <Tag color="green">Excel (.xlsx)</Tag></Text>
                    <Text>数据范围: <Tag>当前筛选结果</Tag></Text>
                  </Space>
                </Card>

                {/* Export Progress */}
                {exportLoading && (
                  <Progress
                    percent={100}
                    status="active"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                )}
              </Space>
            ),
          },
        ]}
      />
    </Modal>
  );
};

export default ImportExportModal;
