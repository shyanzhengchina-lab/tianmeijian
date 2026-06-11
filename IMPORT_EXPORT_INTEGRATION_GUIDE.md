# Import/Export Integration Guide

This guide provides comprehensive instructions for integrating import/export functionality into MES system modules.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Basic Integration](#basic-integration)
3. [Advanced Features](#advanced-features)
4. [Module Configuration](#module-configuration)
5. [Custom Validation](#custom-validation)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Add Import/Export Button to Your Component

```tsx
import React, { useState } from 'react';
import { Button } from 'antd';
import { ImportExportModal } from '@/shared/components/ImportExportModal';

export const YourModuleList: React.FC = () => {
  const [showImportExport, setShowImportExport] = useState(false);

  const handleImportSuccess = (result) => {
    // Refresh your data
    refreshData();
    // Show success message
    message.success(`成功导入 ${result.successCount} 条记录`);
  };

  return (
    <div>
      {/* Your existing UI */}
      <Button
        type="primary"
        onClick={() => setShowImportExport(true)}
      >
        导入/导出
      </Button>

      {/* Import/Export Modal */}
      <ImportExportModal
        visible={showImportExport}
        onCancel={() => setShowImportExport(false)}
        module="material"  // Your module name
        moduleName="物料管理"  // Module display name
        onSuccess={handleImportSuccess}
      />
    </div>
  );
};
```

### 2. Handle Import Success

```tsx
const handleImportSuccess = useCallback((result: ImportResult) => {
  // Refresh module data
  fetchData();

  // Show success message
  message.success(`导入完成: 成功 ${result.successCount} 条, 失败 ${result.failureCount} 条`);

  // Handle partial failures
  if (result.failureCount > 0) {
    console.warn('Some records failed to import:', result.errors);
  }

  // Handle warnings
  if (result.warnings.length > 0) {
    console.warn('Import warnings:', result.warnings);
  }
}, []);
```

---

## Basic Integration

### Using the ImportExportModal Component

The `ImportExportModal` component provides a complete UI for import/export operations:

```tsx
<ImportExportModal
  visible={modalVisible}
  onCancel={() => setModalVisible(false)}
  module="employee"           // Required: Module name
  moduleName="员工管理"        // Required: Display name
  onSuccess={handleSuccess}    // Optional: Success callback
  onError={handleError}        // Optional: Error callback
  onProgress={handleProgress} // Optional: Progress callback
/>
```

### Using the useImportExport Hook

For more control, use the hook directly:

```tsx
import { useImportExport } from '@/shared/hooks/useImportExport';

const { handleImport, handleExport, importLoading } = useImportExport({
  module: 'material',
  onSuccess: (result) => {
    console.log('Import result:', result);
    refreshData();
  },
  onError: (error) => {
    console.error('Import failed:', error);
    // Custom error handling
  },
  onProgress: (percent) => {
    console.log(`Progress: ${percent}%`);
  },
});
```

---

## Advanced Features

### Custom Validation

You can add custom validation rules:

```typescript
import { validationSchemas } from '@/shared/utils/importValidation';

// Define custom validator
const customValidator = (value: any, fieldName: string) => {
  if (value && value.length < 3) {
    return {
      field: fieldName,
      value,
      message: `${fieldName}长度不能少于3个字符`,
      type: 'length',
    };
  }
  return null;
};

// Add to validation schema
validationSchemas.material.push({
  field: 'customField',
  required: true,
  validator: customValidator,
  min: 3,
  max: 50,
});
```

### Progress Tracking

Track import/export progress in real-time:

```tsx
const { handleImport } = useImportExport({
  module: 'employee',
  onProgress: (percent) => {
    // Update progress bar
    setProgress(percent);
    // Update status text
    if (percent < 30) setStatus('正在验证数据...');
    else if (percent < 70) setStatus('正在处理数据...');
    else setStatus('正在保存数据...');
  },
});
```

### Error Handling

Comprehensive error handling:

```tsx
const { handleImport, importError } = useImportExport({
  module: 'material',
  onError: (error) => {
    // Log error details
    console.error('Import error:', error);

    // Show user-friendly message
    if (error.message.includes('network')) {
      message.error('网络错误，请检查网络连接');
    } else if (error.message.includes('timeout')) {
      message.error('请求超时，请稍后重试');
    } else {
      message.error(error.message || '导入失败');
    }

    // Track error for analytics
    trackError('import_failed', { module: 'material', error: error.message });
  },
});

// Display error state
{importError && (
  <Alert
    message="导入失败"
    description={importError.message}
    type="error"
    showIcon
    closable
    onClose={() => clearErrors()}
  />
)}
```

### File Validation

Custom file validation before upload:

```tsx
const { validateFile, validateFileSize } = useImportExport({ module: 'material' });

const handleFileSelect = (file: File) => {
  // Validate file type
  const fileValidation = validateFile(file);
  if (!fileValidation.valid) {
    message.error(fileValidation.error);
    return false;
  }

  // Validate file size
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) {
    message.error(sizeValidation.error);
    return false;
  }

  // File is valid, proceed with upload
  return true;
};
```

---

## Module Configuration

### Material Module

**Supported formats:** Excel (.xlsx, .xls), CSV

**Required fields:**
- `code`: Material code (uppercase, alphanumeric, hyphens, underscores)
- `name`: Material name
- `unit`: Unit code
- `category`: Category code

**Optional fields:**
- `specification`: Material specification
- `price`: Unit price (number)
- `description`: Description

**Example integration:**

```tsx
<ImportExportModal
  visible={showModal}
  onCancel={() => setShowModal(false)}
  module="material"
  moduleName="物料管理"
  onSuccess={(result) => {
    materialStore.fetchMaterials();
    message.success(`导入完成: ${result.successCount} 条`);
  }}
/>
```

### Employee Module

**Supported formats:** Excel (.xlsx, .xls), CSV

**Required fields:**
- `code`: Employee code
- `name`: Employee name
- `phone`: Phone number (Chinese format: 1[3-9]xxxxxxxxx)
- `idCard`: ID card number (18 digits with checksum)

**Optional fields:**
- `email`: Email address
- `gender`: Gender (MALE, FEMALE, OTHER)
- `position`: Position/title
- `teamCode`: Team code
- `workshopCode`: Workshop code

**Validation:**
- Phone format validation
- ID card format and checksum validation
- Email format validation (if provided)

### Unit Module

**Supported formats:** Excel (.xlsx, .xls), CSV

**Required fields:**
- `code`: Unit code (alphanumeric)
- `name`: Unit name
- `symbol`: Unit symbol

**Example:** KG (kilogram), PC (piece), M (meter)

### Workshop Module

**Supported formats:** Excel (.xlsx, .xls), CSV

**Required fields:**
- `code`: Workshop code
- `name`: Workshop name

**Optional fields:**
- `location`: Physical location
- `description`: Description

### WorkCenter Module

**Supported formats:** Excel (.xlsx, .xls), CSV

**Required fields:**
- `code`: Work center code
- `name`: Work center name
- `workshopCode`: Parent workshop code

**Optional fields:**
- `capacity`: Production capacity
- `description`: Description

### Team Module

**Supported formats:** Excel (.xlsx, .xls), CSV

**Required fields:**
- `code`: Team code
- `name`: Team name
- `leader`: Team leader name

**Optional fields:**
- `memberCount`: Number of members
- `description`: Description

### Operation Module

**Supported formats:** Excel (.xlsx, .xls), CSV

**Required fields:**
- `code`: Operation code
- `name`: Operation name

**Optional fields:**
- `cycleTime`: Cycle time in minutes (positive number)
- `description`: Description

### Equipment Module

**Supported formats:** Excel (.xlsx, .xls), CSV

**Required fields:**
- `code`: Equipment code
- `name`: Equipment name

**Optional fields:**
- `model`: Equipment model
- `manufacturer`: Manufacturer
- `purchaseDate`: Purchase date (ISO format)
- `status`: Equipment status (ACTIVE, MAINTENANCE, INACTIVE)
- `workcenterCode`: Work center code

### BOM Module

**Supported formats:** Excel (.xlsx, .xls), CSV

**Required fields:**
- `materialCode`: Parent material code
- `bomCode`: BOM code
- `componentCode`: Component code
- `quantity`: Quantity (positive number)

**Optional fields:**
- `unit`: Unit
- `description`: Description

### QC Scheme Module

**Supported formats:** Excel (.xlsx, .xls), CSV

**Required fields:**
- `code`: QC scheme code
- `name`: QC scheme name
- `type`: QC scheme type

**Optional fields:**
- `description`: Description
- `version`: Version number

### QC Item Module

**Supported formats:** Excel (.xlsx, .xls), CSV

**Required fields:**
- `code`: QC item code
- `name`: QC item name
- `type`: QC item type

**Optional fields:**
- `specification`: Specification
- `tolerance`: Tolerance
- `unit`: Unit

---

## Custom Validation

### Adding Module-Specific Validation

```typescript
// src/shared/utils/importValidation.ts

// Define custom validator
const customValidator = (value: any, fieldName: string): FieldError | null => {
  // Your validation logic
  if (!/^[A-Z]{3}\d{4}$/.test(value)) {
    return {
      field: fieldName,
      value,
      message: `${fieldName}格式不正确，应为3个大写字母+4位数字`,
      type: 'business',
    };
  }
  return null;
};

// Add to validation schema
validationSchemas.yourModule = [
  {
    field: 'customField',
    required: true,
    validator: customValidator,
  },
];
```

### Using Built-in Validators

```typescript
import { validators } from '@/shared/utils/importValidation';

// Required field
{ field: 'name', required: true }

// Email format
{ field: 'email', validator: (v) => validators.email(v, 'email') }

// Phone number
{ field: 'phone', validator: (v) => validators.phone(v, 'phone') }

// Positive number
{ field: 'quantity', validator: (v) => validators.positiveNumber(v, 'quantity') }

// String length
{
  field: 'code',
  validator: (v) => validators.length(v, 'code', 3, 10)
}

// Number range
{
  field: 'price',
  validator: (v) => validators.range(v, 'price', 0, 1000000)
}

// Date
{
  field: 'purchaseDate',
  validator: (v) => validators.date(v, 'purchaseDate')
}

// Enum values
{
  field: 'status',
  allowedValues: ['ACTIVE', 'INACTIVE', 'MAINTENANCE']
}

// Pattern matching
{
  field: 'code',
  pattern: /^[A-Z]{3}\d{4}$/,
  message: '编码格式不正确'
}
```

---

## Error Handling

### Common Error Types

1. **File Validation Errors**
   - Invalid file format
   - File too large (>10MB)
   - Empty file
   - Invalid file name

2. **Data Validation Errors**
   - Missing required fields
   - Invalid format (phone, email, ID card)
   - Out of range values
   - Invalid enum values

3. **Network Errors**
   - Connection timeout
   - Server unavailable
   - Network interruption

4. **Server Errors**
   - Invalid data format
   - Duplicate records
   - Business rule violations
   - Database errors

### Error Handling Example

```tsx
const { handleImport, importError } = useImportExport({
  module: 'material',
  onError: (error) => {
    // Log error for debugging
    console.error('Import error:', error);

    // Show appropriate message based on error type
    const errorMsg = error.message.toLowerCase();

    if (errorMsg.includes('network') || errorMsg.includes('timeout')) {
      message.error('网络连接失败，请检查网络后重试');
    } else if (errorMsg.includes('file')) {
      message.error('文件格式或大小不符合要求');
    } else if (errorMsg.includes('validation')) {
      message.error('数据验证失败，请检查文件内容');
    } else if (errorMsg.includes('duplicate')) {
      message.error('存在重复数据，请检查后重试');
    } else {
      message.error('导入失败: ' + error.message);
    }

    // Track error for monitoring
    trackEvent('import_error', {
      module: 'material',
      errorType: error.name,
      message: error.message,
    });
  },
});
```

---

## Best Practices

### 1. Always Download Template First

```tsx
// Show template download button prominently
<Button
  icon={<DownloadOutlined />}
  onClick={handleDownloadTemplate}
>
  下载导入模板
</Button>
```

### 2. Validate Data Before Import

```tsx
const validateBeforeImport = async (file: File) => {
  try {
    // Pre-validate file
    const validation = await importExportApi.validateImportFile('material', file);

    if (!validation.data.valid) {
      Modal.error({
        title: '数据验证失败',
        content: validation.data.errors.map(err => err).join('\n'),
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
};
```

### 3. Use Appropriate Import Mode

- **INSERT**: Only add new records (skip existing)
- **UPDATE**: Only update existing records
- **UPSERT**: Smart import (insert new, update existing) - recommended
- **REPLACE**: Delete all and import (use with caution)

### 4. Test with Small Batches First

```tsx
const handleImport = async (file: File) => {
  // Test with first 10 rows
  const testFile = await createTestFile(file, 10);
  const result = await handleImport(testFile);

  if (result.successCount === 10) {
    // Test passed, proceed with full import
    await handleImport(file);
  } else {
    message.error('测试导入失败，请检查数据格式');
  }
};
```

### 5. Provide Clear User Feedback

```tsx
const { importLoading, importResult } = useImportExport({ module: 'material' });

// Show loading state
{importLoading && (
  <Alert
    message="正在导入数据..."
    description="请稍候，大文件可能需要较长时间"
    type="info"
    showIcon
  />
)}

// Show result
{importResult && (
  <Alert
    message="导入完成"
    description={`成功: ${importResult.successCount} 条，失败: ${importResult.failureCount} 条`}
    type={importResult.failureCount === 0 ? 'success' : 'warning'}
    showIcon
  />
)}
```

### 6. Handle Large Files Gracefully

```tsx
const handleLargeFileImport = async (file: File) => {
  const CHUNK_SIZE = 1000; // Process 1000 records at a time

  try {
    // Split file into chunks
    const chunks = await splitFileIntoChunks(file, CHUNK_SIZE);

    let totalSuccess = 0;
    let totalFailure = 0;

    // Process chunks sequentially
    for (let i = 0; i < chunks.length; i++) {
      const result = await handleImport(chunks[i]);
      totalSuccess += result.successCount;
      totalFailure += result.failureCount;

      // Update progress
      message.loading(`正在处理第 ${i + 1}/${chunks.length} 批数据...`);
    }

    message.success(`导入完成: 成功 ${totalSuccess} 条，失败 ${totalFailure} 条`);
  } catch (error) {
    console.error('Chunked import error:', error);
  }
};
```

### 7. Implement Retry Logic

```tsx
const { handleImport } = useImportExport({
  module: 'material',
  onError: async (error) => {
    if (error.message.includes('timeout') || error.message.includes('network')) {
      const retry = await confirmRetry();
      if (retry) {
        // Retry with exponential backoff
        await retryWithBackoff(handleImport, file, 3);
      }
    }
  },
});
```

---

## Troubleshooting

### Issue: File Upload Fails

**Symptoms:**
- Upload button doesn't work
- Error: "File validation failed"

**Solutions:**
1. Check file format (must be .xlsx, .xls, or .csv)
2. Verify file size (max 10MB)
3. Ensure file is not empty
4. Check file name (max 255 characters)

```tsx
// Add debug logging
console.log('File type:', file.type);
console.log('File size:', file.size);
console.log('File name:', file.name);
```

### Issue: Import Validation Errors

**Symptoms:**
- Import fails with validation errors
- Error messages about required fields or format

**Solutions:**
1. Download and use the correct template
2. Fill all required fields
3. Check field formats (phone, email, ID card)
4. Verify business rules (e.g., material code format)

```tsx
// Show detailed errors
<ImportExportModal
  onSuccess={(result) => {
    if (result.failureCount > 0) {
      console.log('Errors:', result.errors);
    }
  }}
/>
```

### Issue: Export Format Issues

**Symptoms:**
- Exported file won't open
- Data appears garbled
- Wrong file format

**Solutions:**
1. Specify correct export format
2. Use UTF-8 encoding for international characters
3. Check export filters and parameters

```tsx
await handleExport({
  format: 'EXCEL_XLSX',
  encoding: 'UTF-8',
  fields: ['code', 'name', 'unit'],
});
```

### Issue: Performance Problems

**Symptoms:**
- Import takes very long time
- Browser becomes unresponsive
- Memory issues

**Solutions:**
1. Reduce file size (split into multiple files)
2. Use chunked import for large datasets
3. Implement progress indicators
4. Consider server-side batch processing

```tsx
// Use chunked import
const CHUNK_SIZE = 500;
const chunks = splitFileIntoChunks(file, CHUNK_SIZE);

for (const chunk of chunks) {
  await handleImport(chunk);
  updateProgress();
}
```

### Issue: Duplicate Data

**Symptoms:**
- Duplicate records after import
- "Duplicate key" errors

**Solutions:**
1. Use appropriate update strategy (SKIP, OVERWRITE, MERGE)
2. Check for duplicates before import
3. Use UPSERT mode for smart handling

```tsx
await handleImport({
  mode: 'UPSERT',
  updateStrategy: 'OVERWRITE',
});
```

### Issue: Network Errors

**Symptoms:**
- Timeout errors
- Connection refused
- 502/503 errors

**Solutions:**
1. Check server availability
2. Implement retry logic with exponential backoff
3. Show clear error messages to user
4. Implement offline detection

```tsx
const retryImport = async (file: File, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await handleImport(file);
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
};
```

---

## API Reference

### ImportExportModal Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| visible | boolean | Yes | Modal visibility |
| onCancel | () => void | Yes | Close callback |
| module | string | Yes | Module name |
| moduleName | string | Yes | Module display name |
| onSuccess | (result) => void | No | Success callback |
| onError | (error) => void | No | Error callback |
| onProgress | (percent) => void | No | Progress callback |

### useImportExport Return Value

| Property | Type | Description |
|----------|------|-------------|
| handleImport | (request) => Promise<void> | Import data |
| handleExport | (request?) => Promise<void> | Export data |
| handleDownloadTemplate | () => Promise<void> | Download template |
| importLoading | boolean | Import loading state |
| exportLoading | boolean | Export loading state |
| importResult | ImportResult \| null | Import result |
| importError | Error \| null | Import error |
| exportError | Error \| null | Export error |
| validateFile | (file) => ValidationResult | Validate file |
| validateFileSize | (file) => ValidationResult | Validate file size |
| clearImportResult | () => void | Clear result |
| clearErrors | () => void | Clear errors |

---

## Support

For issues or questions:

1. Check this guide
2. Review API documentation
3. Check component examples in other modules
4. Contact development team

---

## Changelog

### Version 1.0.0 (2026-05-04)
- Initial release
- Support for all 11 basic data modules
- Comprehensive validation
- Error handling
- Progress tracking
- Template download
