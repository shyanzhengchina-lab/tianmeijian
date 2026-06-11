# Import/Export Quick Reference

## Quick Integration Steps

### 1. Import the component
```tsx
import { ImportExportModal } from '@/shared/components/ImportExportModal';
```

### 2. Add state
```tsx
const [showImportExport, setShowImportExport] = useState(false);
```

### 3. Add button
```tsx
<Button onClick={() => setShowImportExport(true)}>
  导入/导出
</Button>
```

### 4. Add modal
```tsx
<ImportExportModal
  visible={showImportExport}
  onCancel={() => setShowImportExport(false)}
  module="material"
  moduleName="物料管理"
  onSuccess={(result) => {
    refreshData();
    message.success(`导入完成: ${result.successCount} 条`);
  }}
/>
```

---

## Module Names

Use these module names for the `module` prop:

- `material` - 物料管理
- `employee` - 员工管理
- `unit` - 计量单位
- `workshop` - 车间管理
- `workcenter` - 工作中心
- `team` - 班组管理
- `operation` - 工序管理
- `equipment` - 设备管理
- `bom` - 物料清单
- `qc-scheme` - 质检方案
- `qc-item` - 质检项目

---

## Required Fields

### Material (物料)
- code (物料编码)
- name (物料名称)
- unit (单位)
- category (分类)

### Employee (员工)
- code (员工工号)
- name (姓名)
- phone (电话)
- idCard (身份证)

### Unit (计量单位)
- code (单位编码)
- name (单位名称)
- symbol (单位符号)

### Workshop (车间)
- code (车间编码)
- name (车间名称)

### WorkCenter (工作中心)
- code (工作中心编码)
- name (工作中心名称)
- workshopCode (车间编码)

### Team (班组)
- code (班组编码)
- name (班组名称)
- leader (班组长)

### Operation (工序)
- code (工序编码)
- name (工序名称)

### Equipment (设备)
- code (设备编码)
- name (设备名称)

### BOM (物料清单)
- materialCode (物料编码)
- bomCode (BOM编码)
- componentCode (组件编码)
- quantity (数量)

### QC Scheme (质检方案)
- code (方案编码)
- name (方案名称)
- type (方案类型)

### QC Item (质检项目)
- code (项目编码)
- name (项目名称)
- type (项目类型)

---

## Import Modes

- **INSERT** - 新增 (仅添加新记录)
- **UPDATE** - 更新 (仅更新现有记录)
- **UPSERT** - 智能导入 (新增并更新) ⭐ 推荐
- **REPLACE** - 覆盖 (删除全部后导入)

---

## Update Strategies

- **SKIP** - 跳过重复数据
- **OVERWRITE** - 覆盖重复数据
- **MERGE** - 合并重复数据

---

## File Formats

Supported: `.xlsx`, `.xls`, `.csv`
Max size: 10MB

---

## Example Success Handler

```tsx
const handleSuccess = useCallback((result: ImportResult) => {
  // 刷新数据
  refreshData();

  // 显示消息
  if (result.failureCount === 0) {
    message.success(`成功导入 ${result.successCount} 条`);
  } else {
    message.warning(`成功 ${result.successCount} 条，失败 ${result.failureCount} 条`);
  }

  // 记录错误
  if (result.failureCount > 0) {
    console.warn('导入错误:', result.errors);
  }
}, []);
```

---

## Example Error Handler

```tsx
const handleError = useCallback((error: Error) => {
  console.error('导入失败:', error);

  if (error.message.includes('network')) {
    message.error('网络错误，请检查网络连接');
  } else if (error.message.includes('validation')) {
    message.error('数据验证失败');
  } else {
    message.error('导入失败: ' + error.message);
  }
}, []);
```

---

## Example Progress Handler

```tsx
const handleProgress = useCallback((percent: number) => {
  console.log(`导入进度: ${percent}%`);
}, []);
```

---

## Complete Example

```tsx
import React, { useState, useCallback } from 'react';
import { Button, message } from 'antd';
import { ImportExportModal } from '@/shared/components/ImportExportModal';

export const MaterialList = () => {
  const [showImportExport, setShowImportExport] = useState(false);

  const handleSuccess = useCallback((result) => {
    refreshData();
    message.success(`导入完成: ${result.successCount} 条`);
  }, []);

  const handleError = useCallback((error) => {
    message.error('导入失败: ' + error.message);
  }, []);

  const handleProgress = useCallback((percent) => {
    console.log(`进度: ${percent}%`);
  }, []);

  return (
    <div>
      <Button onClick={() => setShowImportExport(true)}>
        导入/导出
      </Button>

      <ImportExportModal
        visible={showImportExport}
        onCancel={() => setShowImportExport(false)}
        module="material"
        moduleName="物料管理"
        onSuccess={handleSuccess}
        onError={handleError}
        onProgress={handleProgress}
      />
    </div>
  );
};
```

---

## API Reference

### ImportExportModal Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| visible | boolean | ✅ | Modal visibility |
| onCancel | () => void | ✅ | Close callback |
| module | string | ✅ | Module name |
| moduleName | string | ✅ | Module display name |
| onSuccess | (result) => void | ❌ | Success callback |
| onError | (error) => void | ❌ | Error callback |
| onProgress | (percent) => void | ❌ | Progress callback |

### ImportResult

| Property | Type | Description |
|----------|------|-------------|
| totalRows | number | Total rows processed |
| successCount | number | Successfully imported |
| failureCount | number | Failed imports |
| errors | ImportError[] | Error details |
| warnings | ImportWarning[] | Warning details |
| message | string | Success/error message |

---

## Common Issues

### File upload fails
- Check file format (.xlsx, .xls, .csv)
- Check file size (< 10MB)
- Ensure file is not empty

### Validation errors
- Download and use correct template
- Fill all required fields
- Check field formats

### Import slow
- Reduce file size
- Use chunked import
- Check network connection

---

## Need Help?

1. Check `IMPORT_EXPORT_INTEGRATION_GUIDE.md` for detailed documentation
2. See `MaterialListWithImportExport.tsx` for complete example
3. Review `IMPORT_EXPORT_INTEGRATION_SUMMARY.md` for full feature list
