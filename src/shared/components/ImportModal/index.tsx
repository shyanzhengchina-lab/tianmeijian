/**
 * ImportModal组件统一导出
 */

import ImportModalComponent, {
  ImportStep,
  ValidationResult,
  ImportConfig,
  ImportResult,
  PreviewItem,
} from './ImportModal';

// 重新导出类型
export type { ImportStep, ValidationResult, ImportConfig, ImportResult, PreviewItem } from './ImportModal';

// 导出组件
export { ImportModalComponent as ImportModal };
export default ImportModalComponent;
