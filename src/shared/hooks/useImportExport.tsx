/**
 * Import/Export Hook
 * Comprehensive hook for import/export operations with validation and error handling
 */

import { useState, useCallback } from 'react';
import { message, Modal } from 'antd';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  importExportApi,
  type ImportRequest,
  type ImportResult,
  type ExportRequest,
  type ImportError,
} from '../api/importExportApi';

// ============================================================================
// Hook Parameters
// ============================================================================

export interface UseImportExportParams {
  /** Module name (e.g., 'material', 'employee') */
  module: string;
  /** Callback called on successful import */
  onSuccess?: (result: ImportResult) => void;
  /** Callback called on import/export error */
  onError?: (error: Error) => void;
  /** Callback called during import progress */
  onProgress?: (percent: number) => void;
}

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseImportExportReturn {
  // Import state
  importLoading: boolean;
  importResult: ImportResult | null;
  importError: Error | null;

  // Export state
  exportLoading: boolean;
  exportError: Error | null;

  // Actions
  handleImport: (request: ImportRequest) => Promise<void>;
  handleExport: (request?: ExportRequest) => Promise<void>;
  handleDownloadTemplate: () => Promise<void>;

  // Validation
  validateFile: (file: File) => { valid: boolean; error?: string };
  validateFileSize: (file: File) => { valid: boolean; error?: string };

  // Utilities
  clearImportResult: () => void;
  clearErrors: () => void;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Import/Export Hook
 * Provides comprehensive import/export functionality with validation and error handling
 *
 * @example
 * ```tsx
 * const { handleImport, handleExport, importLoading, exportLoading } = useImportExport({
 *   module: 'material',
 *   onSuccess: (result) => {
 *     console.log(`Imported ${result.successCount} records`);
 *   },
 *   onError: (error) => {
 *     console.error('Import failed:', error);
 *   },
 *   onProgress: (percent) => {
 *     console.log(`Progress: ${percent}%`);
 *   },
 * });
 * ```
 */
export const useImportExport = (params: UseImportExportParams): UseImportExportReturn => {
  const { module, onSuccess, onError, onProgress } = params;

  // State management
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<Error | null>(null);
  const [exportError, setExportError] = useState<Error | null>(null);

  /**
   * Clear import result
   */
  const clearImportResult = useCallback(() => {
    setImportResult(null);
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setImportError(null);
    setExportError(null);
  }, []);

  /**
   * File validation
   */
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // File type validation
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];

    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: '请上传Excel或CSV文件',
      };
    }

    // File extension validation
    const validExtensions = ['.xls', '.xlsx', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: '文件格式不支持，请使用Excel或CSV文件',
      };
    }

    // Check file name
    if (file.name.length > 255) {
      return {
        valid: false,
        error: '文件名过长，请缩短文件名',
      };
    }

    return { valid: true };
  }, []);

  /**
   * File size validation
   */
  const validateFileSize = useCallback((file: File): { valid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size === 0) {
      return {
        valid: false,
        error: '文件为空，请选择有效的文件',
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `文件大小不能超过10MB，当前文件大小：${(file.size / 1024 / 1024).toFixed(2)}MB`,
      };
    }

    return { valid: true };
  }, []);

  /**
   * Show import errors in a modal
   */
  const showImportErrors = useCallback((result: ImportResult) => {
    if (result.errors.length === 0) return;

    // Create error table columns
    const columns: ColumnsType<ImportError> = [
      {
        title: '行号',
        dataIndex: 'rowNumber',
        key: 'rowNumber',
        width: 80,
        fixed: 'left' as const,
      },
      {
        title: '字段',
        dataIndex: 'field',
        key: 'field',
        width: 120,
        ellipsis: true
      },
      {
        title: '值',
        dataIndex: 'value',
        key: 'value',
        width: 150,
        ellipsis: true,
        render: (text: string) => (
          <span title={text}>
            {text && text.length > 20 ? `${text.substring(0, 20)}...` : text}
          </span>
        ),
      },
      {
        dataIndex: 'errorMessage',
        key: 'errorMessage',
        width: 300,
        ellipsis: true,
        render: (text: string) => (
          <span title={text} style={{ color: '#ff4d4f' }}>
            {text}
          </span>
        ),
      },
      {
        title: '错误类型',
        dataIndex: 'errorType',
        key: 'errorType',
        width: 120,
        ellipsis: true,
        render: (text: string) => <span>{text}</span>,
      },
    ];

    // Create error table
    const errorContent = (
      <div style={{ maxHeight: 400, overflow: 'auto' }}>
        <Table
          dataSource={result.errors}
          columns={columns}
          pagination={false}
          size="small"
          scroll={{ x: 800 }}
          rowKey="rowNumber"
        />
      </div>
    );

    // Show error modal
    Modal.error({
      title: `导入完成，但存在 ${result.errors.length} 个错误`,
      content: errorContent,
      width: 800,
      okText: '确定',
      centered: true,
    });
  }, []);

  /**
   * Handle import with validation and error handling
   */
  const handleImport = useCallback(async (request: ImportRequest) => {
    setImportLoading(true);
    setImportResult(null);
    setImportError(null);
    setExportError(null);

    try {
      // File validation
      const fileValidation = validateFile(request.file);
      if (!fileValidation.valid) {
        message.error(fileValidation.error);
        setImportError(new Error(fileValidation.error || 'File validation failed'));
        setImportLoading(false);
        return;
      }

      // Size validation
      const sizeValidation = validateFileSize(request.file);
      if (!sizeValidation.valid) {
        Modal.error({
          title: '文件过大',
          content: sizeValidation.error,
        });
        setImportError(new Error(sizeValidation.error || 'File size validation failed'));
        setImportLoading(false);
        return;
      }

      // Show loading message
      const loadingMessage = message.loading('正在导入数据，请稍候...', 0);

      // Import with progress tracking
      const response = await importExportApi.importData(module, {
        ...request,
        onUploadProgress: (percent) => {
          onProgress?.(percent);
        },
      });

      loadingMessage();

      if (response.code === 200) {
        setImportResult(response.data);
        message.success(response.data.message || '导入成功');
        onSuccess?.(response.data);

        // Show detailed errors if any
        if (response.data.failureCount > 0) {
          showImportErrors(response.data);
        }
      } else {
        throw new Error(response.message || '导入失败');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      const errorMessage = error.response?.data?.message || error.message || '导入失败';
      message.error(errorMessage);
      setImportError(error);
      onError?.(error);
    } finally {
      setImportLoading(false);
    }
  }, [module, onSuccess, onError, onProgress, validateFile, validateFileSize, showImportErrors]);

  /**
   * Handle export with error handling
   */
  const handleExport = useCallback(async (request?: ExportRequest) => {
    setExportLoading(true);
    setImportError(null);
    setExportError(null);

    try {
      const loadingMessage = message.loading('正在导出数据，请稍候...', 0);

      const blob = await importExportApi.exportData(module, request);

      loadingMessage();

      // Determine file extension
      const format = request?.format || 'EXCEL_XLSX';
      let extension = '.xlsx';
      if (format === 'CSV') extension = '.csv';
      else if (format === 'PDF') extension = '.pdf';
      else if (format === 'EXCEL_XLS') extension = '.xls';

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${module}_export_${Date.now()}${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('导出成功');
    } catch (error: any) {
      console.error('Export error:', error);
      const errorMessage = error.response?.data?.message || error.message || '导出失败';
      message.error(errorMessage);
      setExportError(error);
      onError?.(error);
    } finally {
      setExportLoading(false);
    }
  }, [module, onError]);

  /**
   * Handle download import template
   */
  const handleDownloadTemplate = useCallback(async () => {
    try {
      const loadingMessage = message.loading('正在下载模板，请稍候...', 0);

      const blob = await importExportApi.downloadTemplate(module);

      loadingMessage();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${module}_import_template.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('模板下载成功');
    } catch (error: any) {
      console.error('Template download error:', error);
      message.error('模板下载失败');
      setExportError(error);
    }
  }, [module]);

  return {
    // Import state
    importLoading,
    importResult,
    importError,

    // Export state
    exportLoading,
    exportError,

    // Actions
    handleImport,
    handleExport,
    handleDownloadTemplate,

    // Validation
    validateFile,
    validateFileSize,

    // Utilities
    clearImportResult,
    clearErrors,
  };
};
