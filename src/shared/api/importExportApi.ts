/**
 * Import/Export API Client
 * Comprehensive import/export functionality with validation and error handling
 */

import { apiClient } from './apiClient';
import type { ApiResponse } from './requestTypes';

// ============================================================================
// Import Types
// ============================================================================

/**
 * Import mode determines how data is processed
 */
export type ImportMode = 'INSERT' | 'UPDATE' | 'UPSERT' | 'REPLACE';

/**
 * Update strategy for handling duplicates
 */
export type UpdateStrategy = 'SKIP' | 'OVERWRITE' | 'MERGE';

/**
 * File encoding options
 */
export type FileEncoding = 'UTF-8' | 'GBK' | 'ASCII';

/**
 * Import request parameters
 */
export interface ImportRequest {
  /** File to import */
  file: File;
  /** Import mode - INSERT, UPDATE, UPSERT, or REPLACE */
  mode?: ImportMode;
  /** Strategy for handling existing data */
  updateStrategy?: UpdateStrategy;
  /** File encoding */
  encoding?: FileEncoding;
  /** Progress callback */
  onUploadProgress?: (percent: number) => void;
}

/**
 * Import result with detailed statistics
 */
export interface ImportResult {
  /** Total number of rows processed */
  totalRows: number;
  /** Number of successfully imported rows */
  successCount: number;
  /** Number of failed rows */
  failureCount: number;
  /** Detailed error information */
  errors: ImportError[];
  /** Warning messages */
  warnings: ImportWarning[];
  /** Success/error message */
  message: string;
  /** Processing time in milliseconds */
  processingTime?: number;
}

/**
 * Detailed import error information
 */
export interface ImportError {
  /** Row number in the file (1-indexed) */
  rowNumber: number;
  /** Field name that caused the error */
  field: string;
  /** Value that caused the error */
  value: string;
  /** Error message */
  errorMessage: string;
  /** Error type classification */
  errorType: string;
  /** Whether this is a critical error that stops import */
  critical?: boolean;
}

/**
 * Import warning information
 */
export interface ImportWarning {
  /** Row number in the file */
  rowNumber: number;
  /** Field name */
  field: string;
  /** Value */
  value: string;
  /** Warning message */
  warningMessage: string;
  /** Warning type */
  warningType: string;
}

// ============================================================================
// Export Types
// ============================================================================

/**
 * Export format options
 */
export type ExportFormat = 'EXCEL_XLS' | 'EXCEL_XLSX' | 'CSV' | 'PDF';

/**
 * Filter condition for export
 */
export interface FilterCondition {
  /** Field name */
  field: string;
  /** Comparison operator */
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'like';
  /** Filter value */
  value: any;
}

/**
 * Export request parameters
 */
export interface ExportRequest {
  /** Specific fields to export (empty = all fields) */
  fields?: string[];
  /** Filter conditions */
  filters?: FilterCondition[];
  /** Export format */
  format?: ExportFormat;
  /** File encoding */
  encoding?: FileEncoding;
  /** Whether to include headers */
  includeHeaders?: boolean;
  /** Maximum rows to export */
  maxRows?: number;
  /** Query parameters */
  query?: Record<string, any>;
}

/**
 * Export template configuration
 */
export interface ExportTemplate {
  /** Template file name */
  fileName: string;
  /** Sheet name for Excel files */
  sheetName: string;
  /** Field definitions */
  fields: ExportField[];
  /** Template description */
  description?: string;
}

/**
 * Export field definition
 */
export interface ExportField {
  /** Field name in data */
  name: string;
  /** Display label */
  label: string;
  /** Column width */
  width?: number;
  /** Whether field is required */
  required?: boolean;
  /** Format string (e.g., date format, number format) */
  format?: string;
  /** Predefined options for select fields */
  options?: string[];
  /** Validation rules */
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    maxLength?: number;
  };
}

// ============================================================================
// Template Types
// ============================================================================

/**
 * Import template information
 */
export interface ImportTemplateInfo {
  /** Template file name */
  fileName: string;
  /** Module name */
  moduleName: string;
  /** Description */
  description: string;
  /** Required fields */
  requiredFields: string[];
  /** Optional fields */
  optionalFields: string[];
  /** Example data */
  exampleData?: Record<string, any>;
  /** Last updated timestamp */
  lastUpdated: string;
}

// ============================================================================
// Import/Export API Service
// ============================================================================

/**
 * Import/Export API Service
 * Provides comprehensive import/export functionality
 */
class ImportExportApiService {
  /**
   * Import data for a specific module
   * @param module - Module name (e.g., 'material', 'employee')
   * @param request - Import request parameters
   * @returns Import result with detailed statistics
   */
  async importData<T = any>(
    module: string,
    request: ImportRequest
  ): Promise<ApiResponse<ImportResult>> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('mode', request.mode || 'INSERT');
    formData.append('updateStrategy', request.updateStrategy || 'SKIP');
    formData.append('encoding', request.encoding || 'UTF-8');

    return apiClient.post<ApiResponse<ImportResult>>(
      `/basic-data/${module}/import`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            request.onUploadProgress?.(percentCompleted);
          }
        },
      }
    );
  }

  /**
   * Export data from a specific module
   * @param module - Module name (e.g., 'material', 'employee')
   * @param request - Export request parameters
   * @returns Blob data for download
   */
  async exportData(
    module: string,
    request?: ExportRequest
  ): Promise<Blob> {
    const response = await apiClient.post(
      `/basic-data/${module}/export`,
      request || {},
      {
        responseType: 'blob',
      }
    ) as any;

    return (response as any).data;
  }

  /**
   * Download import template for a specific module
   * @param module - Module name (e.g., 'material', 'employee')
   * @returns Blob data for template download
   */
  async downloadTemplate(
    module: string
  ): Promise<Blob> {
    const response = await apiClient.get(
      `/basic-data/${module}/template`,
      {
        responseType: 'blob',
      }
    ) as any;

    return (response as any).data;
  }

  /**
   * Get export template configuration
   * @param module - Module name (e.g., 'material', 'employee')
   * @returns Template configuration with field definitions
   */
  async getExportTemplate(
    module: string
  ): Promise<ApiResponse<ExportTemplate>> {
    return apiClient.get(`/basic-data/${module}/template/config`);
  }

  /**
   * Get import template information
   * @param module - Module name (e.g., 'material', 'employee')
   * @returns Template information with field requirements
   */
  async getImportTemplateInfo(
    module: string
  ): Promise<ApiResponse<ImportTemplateInfo>> {
    return apiClient.get(`/basic-data/${module}/template/info`);
  }

  /**
   * Validate import file before processing
   * @param module - Module name
   * @param file - File to validate
   * @returns Validation result
   */
  async validateImportFile(
    module: string,
    file: File
  ): Promise<ApiResponse<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    rowCount: number;
  }>> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post(
      `/basic-data/${module}/validate`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  }

  /**
   * Get import history
   * @param module - Module name
   * @param query - Query parameters
   * @returns Import history records
   */
  async getImportHistory(
    module: string,
    query?: {
      page?: number;
      pageSize?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ApiResponse<any>> {
    return apiClient.get(`/basic-data/${module}/import-history`, {
      params: query,
    });
  }

  /**
   * Get export history
   * @param module - Module name
   * @param query - Query parameters
   * @returns Export history records
   */
  async getExportHistory(
    module: string,
    query?: {
      page?: number;
      pageSize?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ApiResponse<any>> {
    return apiClient.get(`/basic-data/${module}/export-history`, {
      params: query,
    });
  }

  /**
   * Cancel ongoing import operation
   * @param module - Module name
   * @param operationId - Operation ID to cancel
   * @returns Cancellation result
   */
  async cancelImport(
    module: string,
    operationId: string
  ): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return apiClient.post(`/basic-data/${module}/import-cancel`, {
      operationId,
    });
  }
}

// Export singleton instance
export const importExportApi = new ImportExportApiService();


