/**
 * DataTable增强组件 - 添加导出导入功能
 */

import React, { useState, useRef } from 'react';
import {
  Button,
  Dropdown,
  Upload,
  message,
  Modal,
  Progress,
  Table,
  Space,
  Tag,
  Divider,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  DownloadOutlined,
  UploadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import * as XLSX from 'xlsx';
import DataTable, { DataTableProps, DataTableRef } from './index';

/**
 * 导入校验结果
 */
export interface ImportValidationResult {
  row: number;
  errors: string[];
  warnings: string[];
  data?: any;
}

/**
 * 导入结果
 */
export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  results: ImportValidationResult[];
}

/**
 * 增强型DataTable Props
 */
export interface DataTableWithExportImportProps<T> extends Omit<DataTableProps<T>, 'onExport'> {
  // 导出配置
  enableExport?: boolean;
  exportFormats?: ('excel' | 'csv' | 'pdf')[];
  exportFileName?: string;

  // 导入配置
  enableImport?: boolean;
  importValidator?: (data: any[]) => ImportValidationResult[];
  onImport?: (data: any[]) => Promise<void>;
  importTemplate?: any; // 导入模板示例

  // 自定义导出处理
  customExportHandler?: (format: string) => void;
}

/**
 * DataTable增强组件 - 支持导出导入
 */
function DataTableWithExportImport<T extends Record<string, any>>(
  props: DataTableWithExportImportProps<T>,
  ref: React.Ref<DataTableRef>
) {
  const {
    data,
    columns,
    enableExport = true,
    exportFormats = ['excel', 'csv'],
    exportFileName = 'export',
    enableImport = true,
    importValidator,
    onImport,
    importTemplate,
    customExportHandler,
    ...restProps
  } = props;

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const tableRef = useRef<DataTableRef>(null);

  /**
   * 导出为Excel
   */
  const exportToExcel = () => {
    try {
      if (customExportHandler) {
        customExportHandler('excel');
        return;
      }

      // 准备导出数据
      const exportData = (data ?? []).map((item, index) => {
        const row: any = { 序号: index + 1 };

        columns.forEach((col: any) => {
          if (col.dataIndex) {
            const key = Array.isArray(col.dataIndex) ? col.dataIndex.join('.') : col.dataIndex;
            let value = key.split('.').reduce((obj: any, k: string) => obj?.[k], item);

            // 如果是render函数，需要手动处理
            if (col.render && typeof col.render !== 'string') {
              // 尝试获取原始值
              row[col.title as string] = value;
            } else {
              row[col.title as string] = value ?? '';
            }
          }
        });

        return row;
      });

      // 创建工作簿
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      // 下载文件
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `${exportFileName}_${dateStr}.xlsx`);

      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  /**
   * 导出为CSV
   */
  const exportToCsv = () => {
    try {
      if (customExportHandler) {
        customExportHandler('csv');
        return;
      }

      // 准备导出数据
      const exportData = (data ?? []).map((item, index) => {
        const row: any = { 序号: index + 1 };

        columns.forEach((col: any) => {
          if (col.dataIndex) {
            const key = Array.isArray(col.dataIndex) ? col.dataIndex.join('.') : col.dataIndex;
            const value = key.split('.').reduce((obj: any, k: string) => obj?.[k], item);
            row[col.title as string] = value ?? '';
          }
        });

        return row;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(ws);

      // 下载CSV文件
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);

      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `${exportFileName}_${dateStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  /**
   * 导出为PDF（简化版，实际需要使用jsPDF等库）
   */
  const exportToPdf = () => {
    try {
      if (customExportHandler) {
        customExportHandler('pdf');
        return;
      }

      // 简化处理，提示用户
      message.info('PDF导出功能需要集成jsPDF等库，当前版本暂不支持');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  /**
   * 处理文件上传
   */
  const handleFileUpload: UploadProps['onChange'] = async (info) => {
    const file = info.file;
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        setImporting(true);
        setUploadProgress(0);

        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // 读取第一个工作表
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // 转换为JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          dateNF: 'yyyy-mm-dd',
        });

        setUploadProgress(50);

        // 数据验证
        if (importValidator) {
          const validationResults = importValidator(jsonData);
          setImportResult({
            total: jsonData.length,
            success: validationResults.filter(r => r.errors.length === 0).length,
            failed: validationResults.filter(r => r.errors.length > 0).length,
            results: validationResults,
          });
        }

        setUploadProgress(80);

        // 如果有有效的数据，执行导入
        if (onImport) {
          await onImport(jsonData);
        }

        setUploadProgress(100);
        setImporting(false);

        message.success('导入处理完成');
      } catch (error) {
        console.error('导入失败:', error);
        message.error('导入失败');
        setImporting(false);
      }
    };

    reader.readAsBinaryString(file as unknown as File);
  };

  /**
   * 下载导入模板
   */
  const downloadTemplate = () => {
    try {
      if (!importTemplate) {
        message.warning('未提供导入模板');
        return;
      }

      // 创建工作簿
      const ws = XLSX.utils.json_to_sheet([importTemplate]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');

      // 下载模板
      XLSX.writeFile(wb, `${exportFileName}_template.xlsx`);
      message.success('模板下载成功');
    } catch (error) {
      console.error('下载模板失败:', error);
      message.error('下载模板失败');
    }
  };

  /**
   * 导出菜单
   */
  const exportMenuItems: MenuProps['items'] = [
    ...(exportFormats.includes('excel') ? [{
      key: 'excel',
      icon: <FileExcelOutlined />,
      label: '导出Excel',
      onClick: exportToExcel,
    }] : []),
    ...(exportFormats.includes('csv') ? [{
      key: 'csv',
      icon: <FileTextOutlined />,
      label: '导出CSV',
      onClick: exportToCsv,
    }] : []),
    ...(exportFormats.includes('pdf') ? [{
      key: 'pdf',
      icon: <FilePdfOutlined />,
      label: '导出PDF',
      onClick: exportToPdf,
    }] : []),
  ];

  /**
   * 导入结果表格列
   */
  const importResultColumns = [
    {
      title: '行号',
      dataIndex: 'row',
      key: 'row',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'errors',
      key: 'status',
      width: 100,
      render: (errors: string[]) => (
        errors.length === 0 ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            成功
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">
            失败
          </Tag>
        )
      ),
    },
    {
      title: '错误信息',
      dataIndex: 'errors',
      key: 'errors',
      render: (errors: string[]) => (
        <div>
          {errors.map((error, index) => (
            <div key={index} style={{ color: '#ff4d4f' }}>
              {error}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: '警告信息',
      dataIndex: 'warnings',
      key: 'warnings',
      render: (warnings: string[]) => (
        <div>
          {warnings.map((warning, index) => (
            <div key={index} style={{ color: '#faad14' }}>
              {warning}
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        ref={ref}
        {...restProps}
        data={data}
        columns={columns}
        onRefresh={restProps.onRefresh}
        onExport={() => {
          // 不使用默认导出，使用自定义导出菜单
        }}
        title={
          restProps.title || (
            <div className="data-table-actions">
              <Space>
                {enableExport && (
                  <Dropdown menu={{ items: exportMenuItems }} placement="bottomLeft">
                    <Button icon={<DownloadOutlined />}>
                      导出
                    </Button>
                  </Dropdown>
                )}

                {enableImport && (
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={() => setUploadModalVisible(true)}
                  >
                    导入
                  </Button>
                )}
              </Space>
            </div>
          )
        }
        footer={
          restProps.footer || (
            <div className="data-table-footer">
              {restProps.showRefresh && restProps.onRefresh && (
                <Button
                  icon={<DownloadOutlined />}
                  onClick={restProps.onRefresh}
                  disabled={restProps.loading}
                >
                  刷新
                </Button>
              )}
            </div>
          )
        }
      />

      {/* 导入弹窗 */}
      <Modal
        title="导入数据"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setImportResult(null);
          setUploadProgress(0);
        }}
        footer={[
          <Button key="template" icon={<DownloadOutlined />} onClick={downloadTemplate}>
            下载模板
          </Button>,
          <Button key="close" onClick={() => setUploadModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <p>支持文件格式：.xlsx, .xls, .csv</p>
            <Upload.Dragger
              accept=".xlsx,.xls,.csv"
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleFileUpload}
            >
              <p className="ant-upload-drag-icon">
                <CloudUploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
              <p className="ant-upload-hint">支持单个文件上传，请先下载导入模板</p>
            </Upload.Dragger>
          </div>

          {importing && (
            <div>
              <p>导入进度：</p>
              <Progress percent={uploadProgress} status="active" />
            </div>
          )}

          {importResult && (
            <div>
              <Divider>导入结果</Divider>
              <Space style={{ marginBottom: 16 }}>
                <Tag color="blue">总计: {importResult.total}</Tag>
                <Tag color="success">成功: {importResult.success}</Tag>
                <Tag color="error">失败: {importResult.failed}</Tag>
              </Space>

              {importResult.results.length > 0 && (
                <Table
                  columns={importResultColumns}
                  dataSource={importResult.results}
                  rowKey="row"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条`,
                  }}
                  scroll={{ y: 300 }}
                />
              )}
            </div>
          )}
        </Space>
      </Modal>
    </>
  );
}

export default React.forwardRef(DataTableWithExportImport);
