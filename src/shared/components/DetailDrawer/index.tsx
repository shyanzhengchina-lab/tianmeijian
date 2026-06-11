/**
 * DetailDrawer组件统一导出
 */

import DetailDrawerComponent, {
  SimpleDetailDrawer
} from './DetailDrawer';

// 重新导出类型
export type { DetailDrawerProps, SimpleDetailDrawerProps, DetailDrawerAction } from './DetailDrawer';
export type { DetailField } from '../../types/common';

// 导出组件
export { SimpleDetailDrawer };

// 具名导出和默认导出
export { DetailDrawerComponent as DetailDrawer };
export default DetailDrawerComponent;
