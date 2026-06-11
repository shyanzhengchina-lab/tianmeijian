# Import/Export Integration Summary

## Overview

This document summarizes the comprehensive import/export functionality integrated into the MES system. The integration provides a complete solution for data import/export with validation, error handling, and user-friendly feedback.

---

## Files Created

### 1. API Client Layer
**File:** `src/shared/api/importExportApi.ts`

**Purpose:** Comprehensive API client for import/export operations

**Key Features:**
- Import data with multiple modes (INSERT, UPDATE, UPSERT, REPLACE)
- Export data with flexible filtering options
- Template download functionality
- File validation API
- Import/export history tracking
- Progress monitoring support

**Main Components:**
- `ImportExportApiService` class
- Type definitions for all requests/responses
- Error tracking and reporting

### 2. Custom Hook
**File:** `src/shared/hooks/useImportExport.ts`

**Purpose:** React hook for import/export operations

**Key Features:**
- State management for import/export operations
- File validation (type, size, format)
- Progress tracking
- Error handling with detailed error display
- Success/failure callbacks
- Download management

**Return Value:**
```typescript
{
  handleImport,           // Import function
  handleExport,          // Export function
  handleDownloadTemplate, // Template download
  importLoading,         // Import loading state
  exportLoading,         // Export loading state
  importResult,          // Import result data
  importError,           // Import error
  exportError,           // Export error
  validateFile,          // File validation
  validateFileSize,      // File size validation
  clearImportResult,     // Clear result
  clearErrors,           // Clear errors
}
```

### 3. Import/Export Modal
**File:** `src/shared/components/ImportExportModal/index.tsx`

**Purpose:** Comprehensive UI component for import/export operations

**Key Features:**
- Tabbed interface (Import/Export)
- Import mode selection (INSERT, UPDATE, UPSERT, REPLACE)
- Update strategy selection (SKIP, OVERWRITE, MERGE)
- File upload with drag-and-drop support
- Progress indicator
- Real-time status updates
- Error display with detailed information
- Template download button
- Success/failure summary

**Props:**
```typescript
{
  visible: boolean;           // Modal visibility
  onCancel: () => void;       // Close callback
  module: string;             // Module name
  moduleName: string;         // Display name
  onSuccess?: (result) => void;   // Success callback
  onError?: (error) => void;      // Error callback
  onProgress?: (percent) => void; // Progress callback
}
```

### 4. Import Progress Component
**File:** `src/shared/components/ImportProgress/index.tsx`

**Purpose:** Visual component for tracking import progress

**Key Features:**
- Progress bar with status colors
- Stage description display
- Statistics (total, processed, errors)
- Status icons
- Estimated time display
- Error alerts

**Props:**
```typescript
{
  percent: number;       // Progress percentage
  stage: string;         // Current stage description
  errors?: number;       // Error count
  total?: number;        // Total records
  processed?: number;    // Processed records
  active?: boolean;      // Whether operation is active
  statusMessage?: string; // Custom status message
}
```

### 5. Validation Utilities
**File:** `src/shared/utils/importValidation.ts`

**Purpose:** Comprehensive validation utilities for import data

**Key Features:**
- Built-in validators (email, phone, ID card, number, date, etc.)
- Business-specific validators (material code, employee code, etc.)
- Module-specific validation schemas
- Batch validation for multiple records
- Custom validation support
- Error/warning reporting

**Validators:**
- `required`: Required field validation
- `email`: Email format validation
- `phone`: Phone number validation (Chinese format)
- `idCard`: ID card validation with checksum
- `positiveNumber`: Positive number validation
- `number`: Number validation
- `date`: Date format validation
- `dateRange`: Date range validation
- `length`: String length validation
- `range`: Number range validation
- `pattern`: Pattern matching validation
- `enum`: Enum value validation

**Business Validators:**
- `materialCode`: Material code format validation
- `employeeCode`: Employee code format validation
- `unitCode`: Unit code format validation
- `url`: URL format validation

### 6. Integration Guide
**File:** `IMPORT_EXPORT_INTEGRATION_GUIDE.md`

**Purpose:** Comprehensive documentation for developers

**Contents:**
- Quick start guide
- Basic integration examples
- Advanced features
- Module configuration
- Custom validation
- Error handling
- Best practices
- Troubleshooting
- API reference

### 7. Example Integration
**File:** `src/modules/basic-data/material/components/MaterialListWithImportExport.tsx`

**Purpose:** Complete example showing import/export integration

**Features Demonstrated:**
- Import/Export modal integration
- Success/error handling
- Progress tracking
- Data refresh after import
- Statistics update
- User feedback messages

---

## Supported Modules

All 11 basic data modules are supported:

1. **Material (物料)**
   - Required: code, name, unit, category
   - Validation: Code format, unit validation

2. **Employee (员工)**
   - Required: code, name, phone, idCard
   - Validation: Phone format, ID card checksum, duplicate check

3. **Unit (计量单位)**
   - Required: code, name, symbol
   - Validation: Code format

4. **Workshop (车间)**
   - Required: code, name
   - Optional: location, description

5. **WorkCenter (工作中心)**
   - Required: code, name, workshopCode
   - Optional: capacity, description

6. **Team (班组)**
   - Required: code, name, leader
   - Optional: memberCount, description

7. **Operation (工序)**
   - Required: code, name
   - Optional: cycleTime, description
   - Validation: Cycle time is positive number

8. **Equipment (设备)**
   - Required: code, name
   - Optional: model, manufacturer, purchaseDate, status
   - Validation: Status enum (ACTIVE, MAINTENANCE, INACTIVE)

9. **BOM (物料清单)**
   - Required: materialCode, bomCode, componentCode, quantity
   - Optional: unit, description
   - Validation: Quantity is positive number

10. **QC Scheme (质检方案)**
    - Required: code, name, type
    - Optional: description, version

11. **QC Item (质检项目)**
    - Required: code, name, type
    - Optional: specification, tolerance, unit

---

## Key Features

### 1. Multiple Import Modes
- **INSERT**: Only add new records
- **UPDATE**: Only update existing records
- **UPSERT**: Smart import (insert new, update existing)
- **REPLACE**: Delete all and import new data

### 2. Flexible Update Strategies
- **SKIP**: Skip duplicate data
- **OVERWRITE**: Overwrite duplicate data
- **MERGE**: Merge duplicate data

### 3. Comprehensive Validation
- File type validation (Excel, CSV)
- File size validation (max 10MB)
- Data format validation
- Business rule validation
- Custom validation support

### 4. User-Friendly Feedback
- Real-time progress tracking
- Detailed error messages
- Success/failure statistics
- Visual error display with row numbers
- Warnings and error separation

### 5. Error Handling
- Network error detection
- Timeout handling
- File validation errors
- Data validation errors
- Server error handling
- User-friendly error messages

### 6. Progress Tracking
- Upload progress
- Processing progress
- Overall operation progress
- Stage descriptions
- Estimated time remaining

---

## Integration Steps

### Step 1: Add Import/Export Button

```tsx
import { ImportExportModal } from '@/shared/components/ImportExportModal';

const [showImportExport, setShowImportExport] = useState(false);

<Button onClick={() => setShowImportExport(true)}>
  导入/导出
</Button>
```

### Step 2: Add Modal Component

```tsx
<ImportExportModal
  visible={showImportExport}
  onCancel={() => setShowImportExport(false)}
  module="material"
  moduleName="物料管理"
  onSuccess={handleSuccess}
/>
```

### Step 3: Handle Success

```tsx
const handleSuccess = useCallback((result: ImportResult) => {
  refreshData();
  message.success(`导入完成: 成功 ${result.successCount} 条`);
}, []);
```

### Step 4: Handle Errors (Optional)

```tsx
const handleError = useCallback((error: Error) => {
  console.error('Import failed:', error);
  message.error('导入失败: ' + error.message);
}, []);
```

### Step 5: Handle Progress (Optional)

```tsx
const handleProgress = useCallback((percent: number) => {
  console.log(`Progress: ${percent}%`);
}, []);
```

---

## API Endpoints

### Import Endpoints
```
POST /basic-data/{module}/import
POST /basic-data/{module}/validate
POST /basic-data/{module}/import-cancel
```

### Export Endpoints
```
POST /basic-data/{module}/export
```

### Template Endpoints
```
GET /basic-data/{module}/template
GET /basic-data/{module}/template/config
GET /basic-data/{module}/template/info
```

### History Endpoints
```
GET /basic-data/{module}/import-history
GET /basic-data/{module}/export-history
```

---

## File Format Support

### Supported Formats
- **Excel XLSX**: `.xlsx` (recommended)
- **Excel XLS**: `.xls`
- **CSV**: `.csv`

### Encoding Support
- **UTF-8**: Default, supports international characters
- **GBK**: Simplified Chinese
- **ASCII**: Basic ASCII characters

---

## Validation Rules

### Common Validations
1. **Required fields**: Must not be empty
2. **Format validation**: Phone, email, ID card formats
3. **Type validation**: Number, date, string types
4. **Range validation**: Min/max values, length limits
5. **Pattern validation**: Custom regex patterns
6. **Enum validation**: Allowed values

### Module-Specific Validations
Each module has its own validation schema defined in `validationSchemas` object.

---

## Error Handling

### Error Types
1. **File Validation Errors**
   - Invalid file format
   - File too large
   - Empty file
   - Invalid file name

2. **Data Validation Errors**
   - Missing required fields
   - Invalid format
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

### Error Display
- Modal with error table
- Row-level error details
- Error type classification
- Value display
- Error messages

---

## Best Practices

1. **Always download template first**
2. **Validate data before import**
3. **Test with small batches**
4. **Use appropriate import mode**
5. **Provide clear user feedback**
6. **Handle large files gracefully**
7. **Implement retry logic**
8. **Track import/export history**

---

## Performance Considerations

### File Size Limits
- Maximum file size: 10MB
- Recommended chunk size: 1000 records per batch
- Timeout: 120 seconds

### Optimization Tips
- Use streaming for large files
- Implement chunked upload
- Use pagination for export
- Cache validation results
- Implement retry with exponential backoff

---

## Testing Recommendations

1. **Unit Tests**
   - Validation functions
   - Hook behavior
   - API client methods

2. **Integration Tests**
   - Complete import flow
   - Export flow
   - Error scenarios

3. **E2E Tests**
   - User interactions
   - File upload
   - Modal behavior

4. **Performance Tests**
   - Large file handling
   - Concurrent operations
   - Memory usage

---

## Future Enhancements

1. **Additional Features**
   - Batch import from multiple files
   - Scheduled import/export
   - Import/export templates
   - Data transformation rules

2. **UX Improvements**
   - Drag-and-drop file upload
   - File preview
   - Real-time validation
   - Advanced filtering

3. **Performance**
   - Web workers for processing
   - Streaming upload/download
   - Client-side validation

4. **Monitoring**
   - Import/export analytics
   - Performance metrics
   - Error tracking

---

## Support

For issues or questions:

1. Check the Integration Guide
2. Review API documentation
3. Check component examples
4. Contact development team

---

## Summary

The import/export integration provides a complete, production-ready solution for data import/export with:

- ✅ Comprehensive API layer
- ✅ React hooks for easy integration
- ✅ User-friendly UI components
- ✅ Extensive validation
- ✅ Error handling and feedback
- ✅ Progress tracking
- ✅ Support for all 11 modules
- ✅ Complete documentation
- ✅ Example implementations

The system is ready for integration into all basic data modules with minimal code changes required.
