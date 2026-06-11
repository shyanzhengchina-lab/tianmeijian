/**
 * 导入弹窗通用组件
 * 支持文件上传、验证、预览、导入等完整导入流程
 */

import React, { useState, useCallback, useRef } from 'react';
import { Modal, Upload, Button, Space, Steps, Alert, Table, Tag, Progress, Spin, message } from 'antd';
import { UploadOutlined, FileExcelOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload';
import type { ColumnsType } from 'antd/es/table';

const { Dragger } = Upload;

/**
 * 导入步骤
 */
export type ImportStep = 'upload' | 'validate' | 'preview' | 'complete';

/**
 * 验证结果
 */
export interface ValidationResult {
  success: boolean;
  errors: Array<{
    row: number;
    field: string;
    value: any;
    error: string;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    value: any;
    warning: string;
  }>;
}

/**
 * 导入配置
 */
export interface ImportConfig {
  accept?: string; // 接受的文件类型，如 '.xlsx,.xls'
  maxSize?: number; // 最大文件大小（MB）
  maxCount?: number; // 最大导入条数
  requireTemplate?: boolean; // 是否需要模板下载
  validateOnUpload?: boolean; // 上传后是否自动验证
  allowUpdateMode?: boolean; // 是否允许选择更新模式
  showProgress?: boolean; // 是否显示进度条
}

/**
 * 导入结果
 */
export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  failCount: number;
  errors?: Array<{
    row: number;
    field: string;
    error: string;
  }>;
  updateMode?: 'create' | 'update' | 'skip';
}

/**
 * 预览数据项
 */
export interface PreviewItem {
  key: string;
  [key: string]: any;
  valid?: boolean;
  errors?: string[];
}

/**
 * ImportModal组件Props
 */
export interface ImportModalProps {
  visible: boolean;
  title: string;
  onCancel: () => void;
  onImport: (result: ImportResult) => void;
  config?: ImportConfig;
  templateUrl?: string; // 模板下载地址
  customUpload?: (file: File) => Promise<ValidationResult | null>; // 自定义上传处理
  customImport?: (data: any[], mode: 'create' | 'update' | 'skip') => Promise<ImportResult>; // 自定义导入处理
}

/**
 * 默认导入配置
 */
const DEFAULT_IMPORT_CONFIG: ImportConfig = {
  accept: '.xlsx,.xls,.csv',
  maxSize: 10, // 10MB
  maxCount: 10000,
  requireTemplate: true,
  validateOnUpload: true,
  allowUpdateMode: true,
  showProgress: true,
};

/**
 * ImportModal组件
 */
function ImportModal({
  visible,
  title,
  onCancel,
  onImport,
  config = DEFAULT_IMPORT_CONFIG,
  templateUrl,
  customUpload,
  customImport,
}: ImportModalProps) {
  // State
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [updateMode, setUpdateMode] = useState<'create' | 'update' | 'skip'>('create');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 文件上传前检查
  const beforeUpload = useCallback((file: UploadFile) => {
    const fileSize = (file.size ?? 0) / 1024 / 1024; // MB
    const maxSize = config.maxSize ?? DEFAULT_IMPORT_CONFIG.maxSize ?? 10;

    if (fileSize > maxSize) {
      message.error(`文件大小不能超过 ${maxSize}MB`);
      return Upload.LIST_IGNORE;
    }

    const fileName = file.name;
    const fileExt = fileName.substring(fileName.lastIndexOf('.'));
    const acceptStr = config.accept ?? DEFAULT_IMPORT_CONFIG.accept ?? '';
    const accept = typeof acceptStr === 'string' ? acceptStr.split(',').map(s => s.trim()) : [];

    if (accept.length > 0 && !accept.includes(fileExt.toLowerCase())) {
      message.error(`不支持的文件类型：${fileExt}`);
      return Upload.LIST_IGNORE;
    }

    return true;
  }, [config]);

  // 文件上传处理
  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      if (customUpload) {
        // 自定义上传处理
        const result = await customUpload(file);
        setValidationResult(result);
        if (result?.success || !result?.errors || result?.errors.length === 0) {
          setCurrentStep('preview');
        } else {
          setCurrentStep('validate');
        }
      } else {
        // 默认上传处理（模拟进度）
        const simulateProgress = () => {
          if (uploadProgress < 90) {
            setUploadProgress(prev => prev + 10);
            setTimeout(simulateProgress, 300);
          } else {
            setUploadProgress(100);
            // 模拟验证
            setTimeout(() => {
              const mockResult: ValidationResult = {
                success: true,
                errors: [],
                warnings: [],
              };
              setValidationResult(mockResult);
              setCurrentStep('validate');
            }, 500);
          }
        };

        simulateProgress();
      }
    } catch (error: any) {
      message.error(`上传失败：${error.message}`);
      setUploading(false);
    } finally {
      setUploading(false);
    }
  }, [customUpload, uploadProgress, config]);

  // Upload props
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    beforeUpload,
    onChange: (info) => {
      setFileList(info.fileList);
      if (info.fileList.length > 0 && info.fileList[0]) {
        handleUpload(info.fileList[0].originFileObj as File);
      }
    },
    onRemove: () => {
      setFileList([]);
      setCurrentStep('upload');
      setValidationResult(null);
      setPreviewData([]);
      setImportResult(null);
    },
    disabled: uploading,
    accept: config.accept || DEFAULT_IMPORT_CONFIG.accept,
    showUploadList: false,
  };

  // 下载模板
  const handleDownloadTemplate = useCallback(() => {
    if (templateUrl) {
      window.open(templateUrl, '_blank');
    } else {
      message.info('请联系管理员获取导入模板');
    }
  }, [templateUrl]);

  // 开始导入
  const handleStartImport = useCallback(async () => {
    if (!validationResult?.success && validationResult?.errors && validationResult.errors.length > 0) {
      message.error('存在验证错误，请修复后再导入');
      return;
    }

    setCurrentStep('complete');
    setUploading(true);

    try {
      if (customImport) {
        const result = await customImport(previewData, updateMode);
        setImportResult(result);
      } else {
        // 模拟导入过程
        const simulateImport = () => {
          if (uploadProgress < 100) {
            setUploadProgress(prev => prev + 5);
            setTimeout(simulateImport, 100);
          } else {
            const mockResult: ImportResult = {
              success: true,
              totalRows: previewData.length,
              successCount: previewData.length,
              failCount: 0,
              updateMode,
            };
            setImportResult(mockResult);
          }
        };

        simulateImport();
      }
    } catch (error: any) {
      message.error(`导入失败：${error.message}`);
      setImportResult({
        success: false,
        totalRows: previewData.length,
        successCount: 0,
        failCount: previewData.length,
      });
    } finally {
      setUploading(false);
    }
  }, [validationResult, previewData, updateMode, customImport, uploadProgress]);

  // 重新开始
  const handleReset = useCallback(() => {
    setCurrentStep('upload');
    setFileList([]);
    setValidationResult(null);
    setPreviewData([]);
    setImportResult(null);
    setUploadProgress(0);
  }, []);

  // 关闭弹窗
  const handleClose = useCallback(() => {
    handleReset();
    onCancel();
  }, [onCancel, handleReset]);

  // 步骤配置
  const steps = [
    {
      title: '上传文件',
      description: '选择并上传要导入的文件',
      icon: <UploadOutlined />,
    },
    {
      title: '数据验证',
      description: '系统自动验证导入数据的完整性',
      icon: <CheckCircleOutlined />,
    },
    {
      title: '预览确认',
      description: '查看将要导入的数据，确认无误',
      icon: <FileExcelOutlined />,
    },
    {
      title: '导入完成',
      description: '显示导入结果',
      icon: <DownloadOutlined />,
    },
  ];

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={handleClose}
      width={900}
      footer={null}
      destroyOnClose
    >
      <div style={{ minHeight: 600 }}>
        {/* 步骤指示器 */}
        <Steps
          current={['upload', 'validate', 'preview', 'complete'].indexOf(currentStep)}
          style={{ marginBottom: 24 }}
          items={steps.map(step => ({ title: step.title, description: step.description, icon: step.icon }))}
        />

        {/* 步骤内容 */}
        {currentStep === 'upload' && (
          <div>
            {config.requireTemplate && (
              <Alert
                message={
                  <Space>
                    请先下载导入模板，按照模板格式填写数据后再上传。
                    {templateUrl && (
                      <Button type="link" size="small" onClick={handleDownloadTemplate}>
                        下载模板
                      </Button>
                    )}
                  </Space>
                }
                type="info"
                style={{ marginBottom: 16 }}
              />
            )}

            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持扩展名：{config.accept || DEFAULT_IMPORT_CONFIG.accept}，
                文件大小不超过 {config.maxSize || DEFAULT_IMPORT_CONFIG.maxSize}MB
              </p>
            </Dragger>
          </div>
        )}

        {currentStep === 'validate' && validationResult && (
          <div>
            {validationResult.success ? (
              <Alert
                message="文件验证通过！数据格式正确，可以继续导入。"
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
            ) : (
              <Alert
                message="文件验证失败！请检查并修正以下错误："
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {validationResult.errors && validationResult.errors.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>错误详情：</div>
                <Table
                  dataSource={validationResult.errors.map((err, idx) => ({
                    key: idx,
                    ...err,
                  }))}
                  columns={[
                    {
                      title: '行号',
                      dataIndex: 'row',
                      width: 80,
                      render: (text: number) => <Tag color="error">{text + 1}</Tag>,
                    },
                    {
                      title: '字段',
                      dataIndex: 'field',
                      width: 120,
                    },
                    {
                      title: '值',
                      dataIndex: 'value',
                      ellipsis: true,
                    },
                    {
                      title: '错误信息',
                      dataIndex: 'error',
                      ellipsis: true,
                    },
                  ]}
                  pagination={false}
                  size="small"
                  scroll={{ y: 300 }}
                />
              </div>
            )}

            {validationResult.warnings && validationResult.warnings.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>警告详情：</div>
                <Table
                  dataSource={validationResult.warnings.map((warn, idx) => ({
                    key: idx,
                    ...warn,
                  }))}
                  columns={[
                    {
                      title: '行号',
                      dataIndex: 'row',
                      width: 80,
                      render: (text: number) => <Tag color="warning">{text + 1}</Tag>,
                    },
                    {
                      title: '字段',
                      dataIndex: 'field',
                      width: 120,
                    },
                    {
                      title: '值',
                      dataIndex: 'value',
                      ellipsis: true,
                    },
                    {
                      title: '警告信息',
                      dataIndex: 'warning',
                      ellipsis: true,
                    },
                  ]}
                  pagination={false}
                  size="small"
                  scroll={{ y: 200 }}
                />
              </div>
            )}
          </div>
        )}

        {currentStep === 'preview' && (
          <div>
            {config.allowUpdateMode && (
              <Alert
                message={
                  <Space>
                    检测到数据可能冲突，请选择导入模式：
                    <Space size="small">
                      <Button
                        type={updateMode === 'create' ? 'primary' : 'default'}
                        size="small"
                        onClick={() => setUpdateMode('create')}
                      >
                        仅新增
                      </Button>
                      <Button
                        type={updateMode === 'update' ? 'primary' : 'default'}
                        size="small"
                        onClick={() => setUpdateMode('update')}
                      >
                        覆盖已有
                      </Button>
                      <Button
                        type={updateMode === 'skip' ? 'primary' : 'default'}
                        size="small"
                        onClick={() => setUpdateMode('skip')}
                      >
                        跳过已有
                      </Button>
                    </Space>
                  </Space>
                }
                type="warning"
                style={{ marginBottom: 16 }}
              />
            )}

            <Alert
              message={`共 ${previewData.length} 条数据将导入，请确认无误后开始导入。`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Table
              dataSource={previewData}
              columns={[
                {
                  title: '序号',
                  dataIndex: 'key',
                  width: 80,
                },
                {
                  title: '数据内容',
                  dataIndex: 'content',
                  ellipsis: true,
                },
              ]}
              pagination={{
                total: previewData.length,
                pageSize: 20,
                showSizeChanger: false,
              }}
              size="small"
              scroll={{ y: 300 }}
            />
          </div>
        )}

        {currentStep === 'complete' && importResult && (
          <div>
            {importResult.success ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
                <div style={{ marginTop: 24, fontSize: 18, fontWeight: 500 }}>
                  导入成功！
                </div>
                <div style={{ marginTop: 16, fontSize: 14 }}>
                  <Space direction="vertical" size="small">
                    <span>总行数：{importResult.totalRows}</span>
                    <span>成功导入：{importResult.successCount} 条</span>
                    {importResult.failCount > 0 && (
                      <span style={{ color: '#ff4d4f' }}>失败：{importResult.failCount} 条</span>
                    )}
                    {importResult.updateMode && (
                      <span>更新模式：{importResult.updateMode === 'create' ? '仅新增' : importResult.updateMode === 'update' ? '覆盖已有' : '跳过已有'}</span>
                    )}
                  </Space>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CloseCircleOutlined style={{ fontSize: 64, color: '#ff4d4f' }} />
                <div style={{ marginTop: 24, fontSize: 18, fontWeight: 500, color: '#ff4d4f' }}>
                  导入失败
                </div>
                <div style={{ marginTop: 16, fontSize: 14, color: '#ff4d4f' }}>
                  {importResult.errors && importResult.errors.length > 0 ? (
                    <Space direction="vertical" size="small">
                      <span>总行数：{importResult.totalRows}</span>
                      <span>成功：{importResult.successCount} 条</span>
                      <span>失败：{importResult.failCount} 条</span>
                    </Space>
                  ) : (
                    '导入过程发生错误，请稍后重试'
                  )}
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              {importResult.success ? (
                <Button type="primary" onClick={handleClose}>
                  完成
                </Button>
              ) : (
                <Space>
                  <Button onClick={handleReset}>
                    重新导入
                  </Button>
                  <Button type="primary" onClick={handleClose}>
                    关闭
                  </Button>
                </Space>
              )}
            </div>
          </div>
        )}

        {/* 进度显示 */}
        {config.showProgress && uploading && (
          <div style={{ marginTop: 16, padding: '20px', background: '#f5f5f5', borderRadius: 4 }}>
            <div style={{ textAlign: 'center' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16, fontSize: 14 }}>
                {currentStep === 'upload' && '正在上传文件...'}
                {currentStep === 'validate' && '正在验证数据...'}
                {currentStep === 'preview' && '正在处理数据...'}
                {currentStep === 'complete' && '正在导入数据...'}
              </div>
              <Progress
                percent={uploadProgress}
                status={uploadProgress < 100 ? 'active' : 'success'}
                style={{ marginTop: 16 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      {currentStep !== 'upload' && currentStep !== 'complete' && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 24px',
          borderTop: '1px solid #f0f0f0',
          background: '#fff',
        }}>
          <Space>
            <Button onClick={() => setCurrentStep((prev: ImportStep) => {
              const steps: ImportStep[] = ['upload', 'validate', 'preview', 'complete'];
              const currentIndex = steps.indexOf(prev);
              return steps[currentIndex - 1];
            })}>
              上一步
            </Button>
            {(currentStep === 'validate' || currentStep === 'preview') && (
              <Button
                type="primary"
                onClick={currentStep === 'preview' ? handleStartImport : () => {
                  if (validationResult?.success || (validationResult?.errors && validationResult.errors.length === 0)) {
                    setCurrentStep('preview');
                  }
                }}
              >
                {currentStep === 'validate' ? '预览数据' : '开始导入'}
              </Button>
            )}
          </Space>
        </div>
      )}
    </Modal>
  );
}

export default ImportModal;