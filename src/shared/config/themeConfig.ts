/**
 * 主题配置
 * 管理应用的主题样式和颜色配置
 */

import type { ThemeConfig } from 'antd';

/**
 * 主题类型
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * 颜色配置
 */
export const COLORS = {
  // 主色调
  primary: '#1677ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1677ff',

  // 中性色
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e8e8e8',
    300: '#d9d9d9',
    400: '#bfbfbf',
    500: '#8c8c8c',
    600: '#595959',
    700: '#434343',
    800: '#262626',
    900: '#1f1f1f',
  },

  // 功能色
  blue: {
    1: '#e6f7ff',
    2: '#bae7ff',
    3: '#91d5ff',
    4: '#69c0ff',
    5: '#40a9ff',
    6: '#1677ff',
    7: '#0958d9',
    8: '#003eb3',
    9: '#002c8c',
    10: '#001d66',
  },

  cyan: {
    1: '#e6fffb',
    2: '#b5f5ec',
    3: '#87e8de',
    4: '#5cdbd3',
    5: '#36cfc9',
    6: '#13c2c2',
    7: '#08979c',
    8: '#006d75',
    9: '#00474f',
    10: '#002329',
  },

  green: {
    1: '#f6ffed',
    2: '#d9f7be',
    3: '#b7eb8f',
    4: '#95de64',
    5: '#73d13d',
    6: '#52c41a',
    7: '#389e0d',
    8: '#237804',
    9: '#135200',
    10: '#092b00',
  },

  magenta: {
    1: '#fff0f6',
    2: '#ffd6e7',
    3: '#ffadd2',
    4: '#ff85c0',
    5: '#f759ab',
    6: '#eb2f96',
    7: '#c41d7f',
    8: '#9e1068',
    9: '#780650',
    10: '#520339',
  },

  red: {
    1: '#fff1f0',
    2: '#ffccc7',
    3: '#ffa39e',
    4: '#ff7875',
    5: '#ff4d4f',
    6: '#f5222d',
    7: '#cf1322',
    8: '#a8071a',
    9: '#820014',
    10: '#5c0011',
  },

  orange: {
    1: '#fff7e6',
    2: '#ffd591',
    3: '#ffc069',
    4: '#ffa940',
    5: '#fa8c16',
    6: '#faad14',
    7: '#d46b08',
    8: '#ad4e00',
    9: '#873800',
    10: '#612500',
  },

  yellow: {
    1: '#feffe6',
    2: '#ffffb8',
    3: '#fffb8f',
    4: '#fff566',
    5: '#ffec3d',
    6: '#faad14',
    7: '#d4b106',
    8: '#ad8b00',
    9: '#876800',
    10: '#614700',
  },

  volcano: {
    1: '#fff2e8',
    2: '#ffd8bf',
    3: '#ffbb96',
    4: '#ff9c6e',
    5: '#ff7a45',
    6: '#fa541c',
    7: '#d4380d',
    8: '#ad2102',
    9: '#871400',
    10: '#610b00',
  },

  geekblue: {
    1: '#f0f5ff',
    2: '#d6e4ff',
    3: '#adc6ff',
    4: '#85a5ff',
    5: '#597ef7',
    6: '#2f54eb',
    7: '#1d39c4',
    8: '#10239e',
    9: '#061178',
    10: '#030852',
  },

  lime: {
    1: '#fcffe6',
    2: '#f4ffbf',
    3: '#eaff8f',
    4: '#d3f261',
    5: '#bae637',
    6: '#a0d911',
    7: '#7cb305',
    8: '#5b8c00',
    9: '#3f6600',
    10: '#254000',
  },

  gold: {
    1: '#fffbe6',
    2: '#fff1b8',
    3: '#ffe58f',
    4: '#ffd666',
    5: '#ffc53d',
    6: '#faad14',
    7: '#d48806',
    8: '#ad6800',
    9: '#874d00',
    10: '#613400',
  },
} as const;

/**
 * 状态颜色映射
 */
export const STATUS_COLORS = {
  // 通用状态
  active: COLORS.success,
  inactive: COLORS.error,
  enabled: COLORS.success,
  disabled: COLORS.gray[500],

  // 流程状态
  draft: COLORS.gray[500],
  pending: COLORS.warning,
  processing: COLORS.info,
  completed: COLORS.success,
  failed: COLORS.error,
  cancelled: COLORS.gray[600],

  // 审核状态
  submitted: COLORS.blue[6],
  approved: COLORS.success,
  rejected: COLORS.error,
  audited: COLORS.success,

  // 质量状态
  qualified: COLORS.success,
  unqualified: COLORS.error,
  rework: COLORS.warning,
  mrb: COLORS.orange[6],
  released: COLORS.success,

  // 生产状态
  planned: COLORS.blue[6],
  inProduction: COLORS.cyan[6],
  inProgress: COLORS.info,
  productionCompleted: COLORS.success,
  closed: COLORS.gray[500],
  onHold: COLORS.warning,
} as const;

/**
 * 亮色主题配置
 */
export const LIGHT_THEME: ThemeConfig = {
  token: {
    colorPrimary: COLORS.primary,
    colorSuccess: COLORS.success,
    colorWarning: COLORS.warning,
    colorError: COLORS.error,
    colorInfo: COLORS.info,

    // 字体
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,

    // 圆角
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    borderRadiusXS: 2,

    // 间距
    paddingXS: 8,
    paddingSM: 12,
    padding: 16,
    paddingMD: 20,
    paddingLG: 24,
    paddingXL: 32,

    // 阴影
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08)',
  },

  components: {
    Button: {
      borderRadius: 4,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 28,
    },

    Input: {
      borderRadius: 4,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 28,
    },

    Select: {
      borderRadius: 4,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 28,
    },

    DatePicker: {
      borderRadius: 4,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 28,
    },

    Table: {
      borderRadiusLG: 8,
      headerBg: '#fafafa',
      headerSplitColor: '#f0f0f0',
    },

    Card: {
      borderRadiusLG: 8,
      paddingLG: 24,
    },

    Modal: {
      borderRadiusLG: 8,
    },

    Form: {
      verticalLabelPadding: '0 0 8px',
      itemMarginBottom: 24,
    },
  },
};

/**
 * 暗色主题配置
 */
export const DARK_THEME: ThemeConfig = {
  algorithm: undefined, // 暗色模式通过 token 覆盖实现

  token: {
    colorPrimary: COLORS.primary,
    colorSuccess: COLORS.success,
    colorWarning: COLORS.warning,
    colorError: COLORS.error,
    colorInfo: COLORS.info,

    // 字体
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,

    // 圆角
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,

    // 间距
    paddingXS: 8,
    paddingSM: 12,
    padding: 16,
    paddingMD: 20,
    paddingLG: 24,
    paddingXL: 32,
  },

  components: {
    Button: {
      borderRadius: 4,
    },

    Input: {
      borderRadius: 4,
    },

    Select: {
      borderRadius: 4,
    },

    DatePicker: {
      borderRadius: 4,
    },

    Table: {
      headerBg: '#1f1f1f',
      headerSplitColor: '#303030',
    },

    Card: {
      borderRadiusLG: 8,
      paddingLG: 24,
    },

    Modal: {
      borderRadiusLG: 8,
    },
  },
};

/**
 * 自定义主题配置
 */
export const CUSTOM_THEMES = {
  blue: {
    ...LIGHT_THEME,
    token: {
      ...LIGHT_THEME.token,
      colorPrimary: COLORS.blue[6],
    },
  },

  green: {
    ...LIGHT_THEME,
    token: {
      ...LIGHT_THEME.token,
      colorPrimary: COLORS.green[6],
    },
  },

  purple: {
    ...LIGHT_THEME,
    token: {
      ...LIGHT_THEME.token,
      colorPrimary: '#722ed1',
    },
  },

  orange: {
    ...LIGHT_THEME,
    token: {
      ...LIGHT_THEME.token,
      colorPrimary: COLORS.orange[6],
    },
  },
} as const;

/**
 * 获取主题配置
 */
export const getTheme = (themeMode: ThemeMode = 'light'): ThemeConfig => {
  if (themeMode === 'dark') {
    return DARK_THEME;
  }
  return LIGHT_THEME;
};

/**
 * 获取自定义主题配置
 */
export const getCustomTheme = (themeName: keyof typeof CUSTOM_THEMES): ThemeConfig => {
  return CUSTOM_THEMES[themeName];
};

/**
 * 获取状态颜色
 */
export const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || COLORS.gray[500];
};

/**
 * 获取颜色变量
 */
export const getColorVar = (colorName: string): string => {
  const val = COLORS[colorName as keyof typeof COLORS];
  if (val && typeof val === 'string') {
    return val;
  }
  return COLORS.gray[500];
};

/**
 * 检查主题模式是否为暗色
 */
export const isDarkMode = (themeMode: ThemeMode): boolean => {
  if (themeMode === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return themeMode === 'dark';
};

/**
 * 监听系统主题变化
 */
export const watchSystemTheme = (callback: (isDark: boolean) => void): (() => void) => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };

  mediaQuery.addEventListener('change', handler);

  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
};

export default {
  COLORS,
  STATUS_COLORS,
  LIGHT_THEME,
  DARK_THEME,
  CUSTOM_THEMES,
  getTheme,
  getCustomTheme,
  getStatusColor,
  getColorVar,
  isDarkMode,
  watchSystemTheme,
};
