/**
 * 通用组件统一导出
 */

// Hooks
export { useBatchOperation } from '../hooks/useBatchOperation';
export type {
  BatchOperationConfig,
  BatchOperationResult,
  UseBatchOperationReturn,
} from '../hooks/useBatchOperation';

// DataTable
export { DataTable } from './DataTable/index';
export type { DataTableProps, DataTableRef, TableAction } from './DataTable/types';
export { default as DataTableWithExportImport } from './DataTable/withExportImport';

// SearchForm
export { SearchForm } from './SearchForm';

// ActionBar
export { ActionBar } from './ActionBar';

// StatusBadge
export {
  StatusBadge,
  SimpleStatusBadge,
  COMMON_STATUS_MAP,
} from './StatusBadge';

// FormModal
export { FormModal } from './FormModal';

// DetailDrawer
export {
  DetailDrawer,
  SimpleDetailDrawer,
} from './DetailDrawer';

// ImportModal
export {
  ImportModal,
} from './ImportModal';

// ExportModal
export {
  ExportModal,
} from './ExportModal';

// RealTimeNotifier (暂时注释，存在依赖问题)
// export {
//   default as RealTimeNotifier,
//   OnlineStatusIndicator,
//   RealTimeStatsCard,
//   RealTimeUpdateIndicator,
// } from './RealTimeNotifier';

// FactorySwitcher
export {
  FactorySwitcher,
} from './FactorySwitcher';

// BatchProgressModal
export {
  BatchProgressModal,
} from './BatchProgressModal';
export type {
  BatchProgressState,
  BatchOperationItem,
  BatchItemStatus,
  BatchProgressModalProps,
} from './BatchProgressModal';

// ImportExportModal
export {
  ImportExportModal,
} from './ImportExportModal';
export type {
  ImportExportModalProps,
} from './ImportExportModal';

// ImportProgress
export {
  ImportProgress,
} from './ImportProgress';
export type {
  ImportProgressProps,
} from './ImportProgress';