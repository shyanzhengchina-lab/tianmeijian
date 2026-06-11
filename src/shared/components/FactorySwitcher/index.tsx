/**
 * FactorySwitcher组件统一导出
 */

import FactorySwitcherComponent, { FactorySwitcherProps } from './FactorySwitcher';

// 重新导出类型
export type { FactorySwitcherProps } from './FactorySwitcher';

// 导出组件
export { FactorySwitcherComponent as FactorySwitcher };
export default FactorySwitcherComponent;
