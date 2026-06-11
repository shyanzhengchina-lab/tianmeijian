# MES系统组件测试指南

**文档版本**: v1.0
**创建时间**: 2026-05-03
**适用范围**: React组件测试

---

## 目录

1. [组件测试概述](#组件测试概述)
2. [测试环境配置](#测试环境配置)
3. [共享组件测试](#共享组件测试)
4. [业务组件测试](#业务组件测试)
5. [Hook测试规范](#hook测试规范)
6. [测试最佳实践](#测试最佳实践)
7. [常见问题与解决方案](#常见问题与解决方案)

---

## 组件测试概述

### 测试目标

组件测试的目标是验证React组件的：

- **渲染正确性**: 组件是否按预期渲染
- **交互正确性**: 用户交互是否正确处理
- **状态管理**: 组件状态是否正确更新
- **Props传递**: Props是否正确传递和使用
- **事件处理**: 事件是否正确触发和处理

### 测试工具

| 工具 | 版本 | 用途 |
|------|------|------|
| **Vitest** | latest | 测试运行器 |
| **React Testing Library** | latest | React组件测试 |
| **Jest** | latest | 断言库 |
| **MSW** | latest | Mock API请求 |
| **@testing-library/user-event** | latest | 模拟用户操作 |

### 测试原则

1. **用户视角**: 从用户角度测试组件行为
2. **测试行为而非实现**: 测试组件做了什么，而不是怎么做的
3. **可访问性**: 确保组件对所有用户可访问
4. **简洁明了**: 测试代码应该易于理解和维护

---

## 测试环境配置

### 1. Vitest配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
});
```

### 2. 测试设置文件

```typescript
// test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// 每个测试后清理
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

### 3. 测试辅助函数

```typescript
// test/utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import store from '@/shared/stores';

/**
 * 渲染带路由的组件
 */
export function renderWithRouter(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(<BrowserRouter>{ui}</BrowserRouter>, options);
}

/**
 * 渲染带Store的组件
 */
export function renderWithStore(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(<Provider store={store}>{ui}</Provider>, options);
}

/**
 * 渲染完整环境的组件
 */
export function renderWithAll(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <Provider store={store}>
        <ConfigProvider locale={zhCN}>{children}</ConfigProvider>
      </Provider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}
```

---

## 共享组件测试

### 1. DataTable组件测试

#### 组件说明

DataTable是基于Ant Design Table封装的通用数据表格组件，支持分页、排序、筛选、行选择等功能。

#### 测试用例

```typescript
// shared/components/DataTable/index.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataTable from './index';
import type { DataTableRef } from './index';

describe('DataTable Component', () => {
  const mockData = [
    {
      id: 1,
      code: 'RM001',
      name: '天然乳胶',
      spec: '氨含量≥60%',
      unit: 'kg',
      status: 1,
    },
    {
      id: 2,
      code: 'RM002',
      name: '天然橡胶',
      spec: '氨含量≥60%',
      unit: 'kg',
      status: 1,
    },
    {
      id: 3,
      code: 'RM003',
      name: '停用物料',
      spec: '测试规格',
      unit: 'kg',
      status: 0,
    },
  ];

  const mockColumns = [
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
      sorter: true,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '规格',
      dataIndex: 'spec',
      key: 'spec',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <span>{status === 1 ? '启用' : '停用'}</span>
      ),
    },
  ];

  describe('DT-001: 数据渲染测试', () => {
    it('应该渲染数据列表', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          rowKey="id"
        />
      );

      expect(screen.getByText('天然乳胶')).toBeInTheDocument();
      expect(screen.getByText('天然橡胶')).toBeInTheDocument();
      expect(screen.getByText('停用物料')).toBeInTheDocument();
    });

    it('应该渲染表头', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          rowKey="id"
        />
      );

      expect(screen.getByText('编码')).toBeInTheDocument();
      expect(screen.getByText('名称')).toBeInTheDocument();
      expect(screen.getByText('规格')).toBeInTheDocument();
      expect(screen.getByText('单位')).toBeInTheDocument();
      expect(screen.getByText('状态')).toBeInTheDocument();
    });

    it('应该处理空数据', () => {
      render(
        <DataTable
          data={[]}
          columns={mockColumns}
          rowKey="id"
        />
      );

      expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });
  });

  describe('DT-002: 交互测试', () => {
    it('应该触发行点击事件', async () => {
      const onRowClick = vi.fn();

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          rowKey="id"
          onRowClick={onRowClick}
        />
      );

      const firstRow = screen.getByText('天然乳胶').closest('tr');
      if (firstRow) {
        await userEvent.click(firstRow);
      }

      expect(onRowClick).toHaveBeenCalledTimes(1);
      expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
    });

    it('应该支持行选择', async () => {
      const onSelectionChange = vi.fn();

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          rowKey="id"
          rowSelection={{ onChange: onSelectionChange }}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      await userEvent.click(checkboxes[1]); // 跳过表头复选框

      expect(onSelectionChange).toHaveBeenCalled();
    });

    it('应该支持多行选择', async () => {
      const onSelectionChange = vi.fn();

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          rowKey="id"
          rowSelection={{
            type: 'checkbox',
            onChange: onSelectionChange,
          }}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      await userEvent.click(checkboxes[1]);
      await userEvent.click(checkboxes[2]);

      expect(onSelectionChange).toHaveBeenCalled();
    });
  });

  describe('DT-003: 分页测试', () => {
    it('应该显示分页信息', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          rowKey="id"
          pagination={{ total: 100, pageSize: 10, current: 1 }}
        />
      );

      expect(screen.getByText('共 100 条')).toBeInTheDocument();
    });

    it('应该触发分页变化', async () => {
      const onPageChange = vi.fn();

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          rowKey="id"
          pagination={{
            total: 100,
            pageSize: 10,
            current: 1,
            onChange: onPageChange,
          }}
        />
      );

      const nextButton = screen.getByTitle('下一页');
      await userEvent.click(nextButton);

      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('应该处理第一页和最后一页', async () => {
      const onPageChange = vi.fn();

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          rowKey="id"
          pagination={{
            total: 100,
            pageSize: 10,
            current: 1,
            onChange: onPageChange,
          }}
        />
      );

      const prevButton = screen.getByTitle('上一页');
      expect(prevButton).toBeDisabled();

      const nextButton = screen.getByTitle('下一页');
      await userEvent.click(nextButton);
      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('DT-004: 排序测试', () => {
    it('应该支持排序', async () => {
      const onTableChange = vi.fn();

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          rowKey="id"
          onChange={onTableChange}
        />
      );

      const codeHeader = screen.getByText('编码');
      await userEvent.click(codeHeader);

      expect(onTableChange).toHaveBeenCalled();
    });
  });

  describe('DT-005: 加载状态测试', () => {
    it('应该显示加载状态', () => {
      render(
        <DataTable
          data={[]}
          columns={mockColumns}
          rowKey="id"
          loading={true}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('加载时不显示数据', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          rowKey="id"
          loading={true}
        />
      );

      expect(screen.queryByText('天然乳胶')).not.toBeInTheDocument();
    });
  });

  describe('DT-006: Ref测试', () => {
    it('应该支持reload方法', () => {
      const ref = { current: null } as React.MutableRefObject<DataTableRef | null>;
      const onReload = vi.fn();

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          rowKey="id"
          ref={ref}
          onReload={onReload}
        />
      );

      if (ref.current) {
        ref.current.reload();
      }

      expect(onReload).toHaveBeenCalled();
    });

    it('应该支持getSelectedRows方法', async () => {
      const ref = { current: null } as React.MutableRefObject<DataTableRef | null>;

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          rowKey="id"
          rowSelection={{ type: 'checkbox' }}
          ref={ref}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      await userEvent.click(checkboxes[1]);

      if (ref.current) {
        const selectedRows = ref.current.getSelectedRows();
        expect(selectedRows).toHaveLength(1);
      }
    });

    it('应该支持clearSelection方法', async () => {
      const ref = { current: null } as React.MutableRefObject<DataTableRef | null>;

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          rowKey="id"
          rowSelection={{ type: 'checkbox' }}
          ref={ref}
        />
      );

      const checkboxes = screen.getAllByRole('role');
      await userEvent.click(checkboxes[1]);

      if (ref.current) {
        ref.current.clearSelection();
        const selectedRows = ref.current.getSelectedRows();
        expect(selectedRows).toHaveLength(0);
      }
    });
  });

  describe('DT-007: 自定义渲染测试', () => {
    it('应该支持自定义单元格渲染', () => {
      const customColumns = [
        {
          title: '状态',
          dataIndex: 'status',
          key: 'status',
          render: (status: number) => {
            const color = status === 1 ? 'green' : 'red';
            const text = status === 1 ? '启用' : '停用';
            return <span style={{ color }}>{text}</span>;
          },
        },
      ];

      render(
        <DataTable
          data={mockData}
          columns={customColumns}
          rowKey="id"
        />
      );

      expect(screen.getByText('启用')).toBeInTheDocument();
      expect(screen.getByText('停用')).toBeInTheDocument();
    });
  });
});
```

### 2. FormModal组件测试

```typescript
// shared/components/FormModal/index.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormModal from './index';

describe('FormModal Component', () => {
  const mockProps = {
    open: true,
    title: '新增物料',
    mode: 'add',
    fields: [
      {
        name: 'code',
        label: '物料编码',
        type: 'input',
        required: true,
      },
      {
        name: 'name',
        label: '物料名称',
        type: 'input',
        required: true,
      },
      {
        name: 'categoryId',
        label: '物料分类',
        type: 'select',
        required: true,
        options: [
          { label: '原材料', value: 1 },
          { label: '成品', value: 2 },
        ],
      },
      {
        name: 'spec',
        label: '规格型号',
        type: 'textarea',
      },
    ],
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  describe('FM-001: 渲染测试', () => {
    it('应该渲染表单弹窗', () => {
      render(<FormModal {...mockProps} />);

      expect(screen.getByText('新增物料')).toBeInTheDocument();
      expect(screen.getByLabelText('物料编码')).toBeInTheDocument();
      expect(screen.getByLabelText('物料名称')).toBeInTheDocument();
      expect(screen.getByLabelText('物料分类')).toBeInTheDocument();
      expect(screen.getByLabelText('规格型号')).toBeInTheDocument();
    });

    it('应该显示必填标记', () => {
      render(<FormModal {...mockProps} />);

      expect(screen.getByText('*物料编码')).toBeInTheDocument();
      expect(screen.getByText('*物料名称')).toBeInTheDocument();
      expect(screen.getByText('*物料分类')).toBeInTheDocument();
    });

    it('应该显示确定和取消按钮', () => {
      render(<FormModal {...mockProps} />);

      expect(screen.getByText('确定')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });
  });

  describe('FM-002: 表单提交测试', () => {
    it('应该提交表单数据', async () => {
      render(<FormModal {...mockProps} />);

      await userEvent.type(screen.getByLabelText('物料编码'), 'TEST001');
      await userEvent.type(screen.getByLabelText('物料名称'), '测试物料');
      await userEvent.selectOptions(
        screen.getByLabelText('物料分类'),
        '1'
      );
      await userEvent.type(screen.getByLabelText('规格型号'), '测试规格');

      const submitButton = screen.getByText('确定');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockProps.onSubmit).toHaveBeenCalledWith({
          code: 'TEST001',
          name: '测试物料',
          categoryId: 1,
          spec: '测试规格',
        });
      });
    });

    it('应该验证必填字段', async () => {
      render(<FormModal {...mockProps} />);

      const submitButton = screen.getByText('确定');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('请输入物料编码')).toBeInTheDocument();
        expect(screen.getByText('请输入物料名称')).toBeInTheDocument();
      });

      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('FM-003: 编辑模式测试', () => {
    it('应该显示编辑标题', () => {
      render(<FormModal {...mockProps} mode="edit" title="编辑物料" />);

      expect(screen.getByText('编辑物料')).toBeInTheDocument();
    });

    it('应该填充初始数据', () => {
      render(
        <FormModal
          {...mockProps}
          mode="edit"
          initialValues={{
            code: 'TEST001',
            name: '测试物料',
            categoryId: 1,
            spec: '测试规格',
          }}
        />
      );

      expect(screen.getByDisplayValue('TEST001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('测试物料')).toBeInTheDocument();
      expect(screen.getByDisplayValue('测试规格')).toBeInTheDocument();
    });
  });

  describe('FM-004: 取消操作测试', () => {
    it('应该调用取消回调', async () => {
      render(<FormModal {...mockProps} />);

      const cancelButton = screen.getByText('取消');
      await userEvent.click(cancelButton);

      expect(mockProps.onCancel).toHaveBeenCalled();
    });

    it('应该关闭弹窗', () => {
      const { rerender } = render(<FormModal {...mockProps} />);

      expect(screen.getByText('新增物料')).toBeInTheDocument();

      rerender(<FormModal {...mockProps} open={false} />);

      expect(screen.queryByText('新增物料')).not.toBeInTheDocument();
    });
  });
});
```

### 3. DetailDrawer组件测试

```typescript
// shared/components/DetailDrawer/index.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DetailDrawer from './index';

describe('DetailDrawer Component', () => {
  const mockData = {
    id: 1,
    code: 'RM001',
    name: '天然乳胶',
    categoryId: 1,
    categoryName: '原材料',
    spec: '氨含量≥60%',
    unitId: 1,
    unitName: 'kg',
    type: '原材料',
    status: 1,
    createdAt: '2026-05-03 10:00:00',
    updatedAt: '2026-05-03 10:00:00',
  };

  const mockFields = [
    {
      label: '物料编码',
      dataIndex: 'code',
      type: 'text' as const,
    },
    {
      label: '物料名称',
      dataIndex: 'name',
      type: 'text' as const,
    },
    {
      label: '物料分类',
      dataIndex: 'categoryName',
      type: 'text' as const,
    },
    {
      label: '规格型号',
      dataIndex: 'spec',
      type: 'text' as const,
    },
    {
      label: '计量单位',
      dataIndex: 'unitName',
      type: 'text' as const,
    },
    {
      label: '状态',
      dataIndex: 'status',
      type: 'status' as const,
      statusMap: {
        1: { text: '启用', color: 'green' },
        0: { text: '停用', color: 'red' },
      },
    },
  ];

  describe('DD-001: 渲染测试', () => {
    it('应该渲染详情抽屉', () => {
      render(
        <DetailDrawer
          open={true}
          title="物料详情"
          data={mockData}
          fields={mockFields}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('物料详情')).toBeInTheDocument();
      expect(screen.getByText('物料编码')).toBeInTheDocument();
      expect(screen.getByText('物料名称')).toBeInTheDocument();
    });

    it('应该显示数据值', () => {
      render(
        <DetailDrawer
          open={true}
          title="物料详情"
          data={mockData}
          fields={mockFields}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('RM001')).toBeInTheDocument();
      expect(screen.getByText('天然乳胶')).toBeInTheDocument();
      expect(screen.getByText('原材料')).toBeInTheDocument();
      expect(screen.getByText('氨含量≥60%')).toBeInTheDocument();
      expect(screen.getByText('kg')).toBeInTheDocument();
    });

    it('应该渲染状态标签', () => {
      render(
        <DetailDrawer
          open={true}
          title="物料详情"
          data={mockData}
          fields={mockFields}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('启用')).toBeInTheDocument();
    });
  });

  describe('DD-002: 关闭测试', () => {
    it('应该调用关闭回调', async () => {
      const onClose = vi.fn();

      render(
        <DetailDrawer
          open={true}
          title="物料详情"
          data={mockData}
          fields={mockFields}
          onClose={onClose}
        />
      );

      const closeButton = screen.getByLabelText('Close');
      await userEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('应该关闭抽屉', () => {
      const { rerender } = render(
        <DetailDrawer
          open={true}
          title="物料详情"
          data={mockData}
          fields={mockFields}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('物料详情')).toBeInTheDocument();

      rerender(
        <DetailDrawer
          open={false}
          title="物料详情"
          data={mockData}
          fields={mockFields}
          onClose={vi.fn()}
        />
      );

      expect(screen.queryByText('物料详情')).not.toBeInTheDocument();
    });
  });

  describe('DD-003: 空数据测试', () => {
    it('应该处理空数据', () => {
      render(
        <DetailDrawer
          open={true}
          title="物料详情"
          data={{}}
          fields={mockFields}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('--')).toBeInTheDocument();
    });
  });
});
```

---

## 业务组件测试

### 1. MaterialList组件测试

```typescript
// modules/basic-data/material/components/MaterialList.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MaterialList from './MaterialList';
import { materialApi } from '../api';

// Mock API
vi.mock('../api', () => ({
  materialApi: {
    getPage: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('MaterialList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ML-001: 列表渲染测试', () => {
    it('应该加载物料列表', async () => {
      const mockResponse = {
        data: {
          list: [
            { id: 1, code: 'RM001', name: '天然乳胶', status: 1 },
            { id: 2, code: 'RM002', name: '天然橡胶', status: 1 },
          ],
          total: 2,
        },
      };

      (materialApi.getPage as any).mockResolvedValue(mockResponse);

      render(<MaterialList />);

      await waitFor(() => {
        expect(screen.getByText('天然乳胶')).toBeInTheDocument();
        expect(screen.getByText('天然橡胶')).toBeInTheDocument();
      });

      expect(materialApi.getPage).toHaveBeenCalled();
    });
  });

  describe('ML-002: 新增物料测试', () => {
    it('应该打开新增弹窗', async () => {
      (materialApi.getPage as any).mockResolvedValue({ data: { list: [], total: 0 } });

      render(<MaterialList />);

      await waitFor(() => {
        const addButton = screen.getByText('新增');
        expect(addButton).toBeInTheDocument();
      });

      const addButton = screen.getByText('新增');
      await userEvent.click(addButton);

      expect(screen.getByText('新增物料')).toBeInTheDocument();
    });

    it('应该成功创建物料', async () => {
      (materialApi.getPage as any).mockResolvedValue({ data: { list: [], total: 0 } });
      (materialApi.create as any).mockResolvedValue({
        data: { code: 'TEST001', name: '测试物料' },
      });

      render(<MaterialList />);

      await waitFor(() => {
        const addButton = screen.getByText('新增');
        await userEvent.click(addButton);
      });

      await userEvent.type(screen.getByLabelText('物料编码'), 'TEST001');
      await userEvent.type(screen.getByLabelText('物料名称'), '测试物料');

      const submitButton = screen.getByText('确定');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(materialApi.create).toHaveBeenCalledWith({
          code: 'TEST001',
          name: '测试物料',
        });
      });
    });
  });

  describe('ML-003: 编辑物料测试', () => {
    it('应该打开编辑弹窗', async () => {
      const mockResponse = {
        data: {
          list: [{ id: 1, code: 'RM001', name: '天然乳胶', status: 1 }],
          total: 1,
        },
      };

      (materialApi.getPage as any).mockResolvedValue(mockResponse);

      render(<MaterialList />);

      await waitFor(() => {
        const editButton = screen.getByLabelText('edit');
        expect(editButton).toBeInTheDocument();
      });

      const editButton = screen.getByLabelText('edit');
      await userEvent.click(editButton);

      expect(screen.getByText('编辑物料')).toBeInTheDocument();
    });
  });

  describe('ML-004: 删除物料测试', () => {
    it('应该删除物料', async () => {
      const mockResponse = {
        data: {
          list: [{ id: 1, code: 'RM001', name: '天然乳胶', status: 1 }],
          total: 1,
        },
      };

      (materialApi.getPage as any).mockResolvedValue(mockResponse);
      (materialApi.delete as any).mockResolvedValue({});

      render(<MaterialList />);

      await waitFor(() => {
        const deleteButton = screen.getByLabelText('delete');
        expect(deleteButton).toBeInTheDocument();
      });

      const deleteButton = screen.getByLabelText('delete');
      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('确认删除吗？')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('确定');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(materialApi.delete).toHaveBeenCalledWith([1]);
      });
    });
  });
});
```

---

## Hook测试规范

### 1. useTable Hook测试

```typescript
// shared/hooks/useTable.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTable } from './useTable';

describe('useTable Hook', () => {
  const mockApi = {
    getPage: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('UT-001: 数据加载测试', () => {
    it('应该加载数据', async () => {
      const mockResponse = {
        data: { list: [{ id: 1 }], total: 1 },
      };

      mockApi.getPage.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useTable({ api: mockApi }));

      await waitFor(() => {
        expect(result.current.data).toEqual([{ id: 1 }]);
        expect(result.current.pagination.total).toBe(1);
      });
    });

    it('应该处理加载状态', async () => {
      mockApi.getPage.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { result } = renderHook(() => useTable({ api: mockApi }));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('UT-002: 分页测试', () => {
    it('应该支持分页', async () => {
      mockApi.getPage.mockResolvedValue({ data: { list: [], total: 100 } });

      const { result } = renderHook(() => useTable({ api: mockApi }));

      await waitFor(() => {
        expect(result.current.pagination.total).toBe(100);
      });

      act(() => {
        result.current.handlePageChange(2);
      });

      expect(result.current.pagination.current).toBe(2);
    });

    it('应该支持每页条数变化', async () => {
      mockApi.getPage.mockResolvedValue({ data: { list: [], total: 100 } });

      const { result } = renderHook(() => useTable({ api: mockApi }));

      act(() => {
        result.current.handleSizeChange(20);
      });

      expect(result.current.pagination.pageSize).toBe(20);
    });
  });

  describe('UT-003: 搜索测试', () => {
    it('应该支持搜索', async () => {
      mockApi.getPage.mockResolvedValue({ data: { list: [], total: 0 } });

      const { result } = renderHook(() => useTable({ api: mockApi }));

      act(() => {
        result.current.handleSearch({ keyword: '测试' });
      });

      await waitFor(() => {
        expect(mockApi.getPage).toHaveBeenCalledWith({
          page: 1,
          size: 10,
          keyword: '测试',
        });
      });
    });
  });
});
```

### 2. useForm Hook测试

```typescript
// shared/hooks/useForm.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useForm } from './useForm';

describe('useForm Hook', () => {
  describe('UF-001: 表单值管理测试', () => {
    it('应该初始化表单值', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: { code: 'TEST001', name: '测试' },
        })
      );

      expect(result.current.values).toEqual({ code: 'TEST001', name: '测试' });
    });

    it('应该更新表单值', () => {
      const { result } = renderHook(() =>
        useForm({ initialValues: { code: '', name: '' } })
      );

      act(() => {
        result.current.setValues({ code: 'TEST001', name: '测试' });
      });

      expect(result.current.values).toEqual({ code: 'TEST001', name: '测试' });
    });
  });

  describe('UF-002: 表单验证测试', () => {
    it('应该验证必填字段', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: { code: '', name: '' },
          rules: {
            code: [{ required: true, message: '编码不能为空' }],
            name: [{ required: true, message: '名称不能为空' }],
          },
        })
      );

      act(() => {
        result.current.validate();
      });

      expect(result.current.errors.code).toBe('编码不能为空');
      expect(result.current.errors.name).toBe('名称不能为空');
    });

    it('应该通过验证', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: { code: 'TEST001', name: '测试' },
          rules: {
            code: [{ required: true, message: '编码不能为空' }],
            name: [{ required: true, message: '名称不能为空' }],
          },
        })
      );

      act(() => {
        result.current.validate();
      });

      expect(result.current.isValid).toBe(true);
    });
  });
});
```

---

## 测试最佳实践

### 1. 使用用户视角测试

```typescript
// ✅ 好的写例 - 用户视角
it('应该允许用户搜索物料', async () => {
  render(<MaterialList />);

  const searchInput = screen.getByPlaceholderText('请输入物料名称');
  await userEvent.type(searchInput, '乳胶');

  const searchButton = screen.getByText('搜索');
  await userEvent.click(searchButton);

  await waitFor(() => {
    expect(screen.getByText('天然乳胶')).toBeInTheDocument();
  });
});

// ❌ 不好的写例 - 实现细节
it('应该调用search函数', () => {
  const searchSpy = vi.fn();
  render(<MaterialList onSearch={searchSpy} />);

  searchSpy('乳胶');
  expect(searchSpy).toHaveBeenCalledWith('乳胶');
});
```

### 2. 测试行为而非实现

```typescript
// ✅ 好的写例 - 测试行为
it('应该显示错误消息', async () => {
  render(<MaterialForm />);

  await userEvent.click(screen.getByText('保存'));

  expect(screen.getByText('请输入物料编码')).toBeInTheDocument();
});

// ❌ 不好的写例 - 测试实现
it('应该设置error状态', async () => {
  render(<MaterialForm />);

  await userEvent.click(screen.getByText('保存'));

  expect(screen.getByText('请输入物料编码').className).toContain('error');
});
```

### 3. 使用语义化查询

```typescript
// ✅ 好的写例 - 语义化查询
const button = screen.getByRole('button', { name: '保存' });
const input = screen.getByLabelText('物料编码');
const text = screen.getByText('天然乳胶');

// ❌ 不好的写例 - CSS选择器
const button = screen.querySelector('.ant-btn-primary');
const input = screen.querySelector('#material-code');
const text = screen.querySelector('.material-name');
```

### 4. 测试边界情况

```typescript
it('应该处理空数据', () => {
  render(<DataTable data={[]} columns={columns} />);
  expect(screen.getByText('暂无数据')).toBeInTheDocument();
});

it('应该处理加载错误', async () => {
  (materialApi.getPage as any).mockRejectedValue(new Error('网络错误'));

  render(<MaterialList />);

  await waitFor(() => {
    expect(screen.getByText('加载失败')).toBeInTheDocument();
  });
});
```

---

## 常见问题与解决方案

### 1. 异步测试失败

#### 问题

异步测试时好时坏，不稳定。

#### 解决方案

```typescript
// 使用waitFor等待异步操作
await waitFor(() => {
  expect(screen.getByText('成功')).toBeInTheDocument();
}, { timeout: 3000 });

// 使用findBy代替getBy
const element = await findByText('成功');
```

### 2. Mock组件

#### 问题

测试时需要Mock子组件。

#### 解决方案

```typescript
// Mock子组件
vi.mock('../ChildComponent', () => ({
  default: () => <div>Mock Child</div>,
}));
```

### 3. 测试样式

#### 问题

需要测试组件样式。

#### 解决方案

```typescript
// 测试样式
expect(element).toHaveStyle({
  color: 'red',
  fontSize: '14px',
});
```

---

**文档历史**

| 版本 | 日期 | 修改人 | 修改内容 |
|------|------|--------|----------|
| v1.0 | 2026-05-03 | 测试团队 | 初始版本 |
