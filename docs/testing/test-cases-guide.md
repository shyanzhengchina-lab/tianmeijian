# MES系统测试用例编写指南

**文档版本**: v1.0
**创建时间**: 2026-05-03
**适用范围**: MES系统全栈测试

---

## 目录

1. [测试用例概述](#测试用例概述)
2. [测试用例编写规范](#测试用例编写规范)
3. [测试用例模板](#测试用例模板)
4. [测试数据准备方法](#测试数据准备方法)
5. [Mock数据设计原则](#mock数据设计原则)
6. [测试用例最佳实践](#测试用例最佳实践)
7. [测试用例管理](#测试用例管理)
8. [常见问题与解决方案](#常见问题与解决方案)

---

## 测试用例概述

### 测试用例定义

测试用例是为特定测试目标设计的输入、执行条件、预期结果的集合。一个好的测试用例应该：

- **明确**: 清晰说明要测试的内容
- **可执行**: 有明确的步骤和预期结果
- **可维护**: 易于理解和修改
- **可复用**: 可用于回归测试

### 测试用例分类

#### 按测试类型分类

| 类型 | 说明 | 优先级 |
|------|------|--------|
| **功能测试** | 验证功能是否按需求实现 | P0 |
| **参数测试** | 验证参数格式和范围 | P0 |
| **边界测试** | 验证边界条件处理 | P1 |
| **异常测试** | 验证错误处理机制 | P0 |
| **性能测试** | 验证性能指标 | P1 |

#### 按测试层次分类

| 层次 | 说明 | 工具 |
|------|------|------|
| **单元测试** | 测试独立代码单元 | Vitest/Jest |
| **组件测试** | 测试React组件 | React Testing Library |
| **API测试** | 测试后端API接口 | Postman/JMeter |
| **集成测试** | 测试模块间协作 | Vitest/Cypress |
| **E2E测试** | 测试完整业务流程 | Cypress |

---

## 测试用例编写规范

### 命名规范

#### 1. 用例ID命名

**格式**: `[模块缩写]-[序号]`

**示例**:
```
MC-001: 物料管理-新增物料
PO-001: 生产订单-创建订单
PT-001: PAD任务-开始任务
```

**模块缩写对照表**:

| 模块 | 缩写 |
|------|------|
| 物料管理 | MC (Material) |
| BOM管理 | BM (Bom) |
| 工序管理 | OP (Operation) |
| 设备档案 | EQ (Equipment) |
| 生产订单 | PO (ProductionOrder) |
| 生产工单 | WO (WorkOrder) |
| 生产任务 | TO (TaskOrder) |
| PAD任务 | PT (PadTask) |
| 批记录 | ER (EbrRecord) |
| 领料管理 | MI (MaterialIssuance) |
| 质检任务 | IT (InspectionTask) |
| MRB评审 | MR (MrbRecord) |
| 质量放行 | QR (QualityRelease) |
| 工艺路径 | PR (ProcessRouting) |
| 权限管理 | PM (Permission) |
| 用户认证 | AU (Auth) |

#### 2. 用例标题命名

**格式**: `[动词] + [测试对象] + [测试场景]`

**示例**:
```
✓ 正确: 新增物料-正常场景
✓ 正确: 查询物料列表-分页参数为空
✗ 错误: 测试物料新增
✗ 错误: 测试一下分页
```

#### 3. 文件命名

**格式**: `[模块名].test.ts` 或 `[模块名].test.tsx`

**示例**:
```
✓ 正确: material.test.ts
✓ 正确: material-api.test.ts
✗ 错误: test-material.ts
✗ 错误: MaterialTest.ts
```

### 代码编写规范

#### 1. 测试文件结构

```typescript
// material.test.ts

// 1. 导入依赖
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MaterialApi } from '@/modules/basic-data/material/api';

// 2. 定义测试数据常量
const mockMaterial = {
  code: 'TEST001',
  name: '测试物料',
  categoryId: 1,
  unitId: 1,
};

// 3. 测试套件分组
describe('Material API', () => {

  // 4. 前置/后置处理
  beforeEach(() => {
    // 准备测试数据
  });

  afterEach(() => {
    // 清理测试数据
  });

  // 5. 测试用例
  describe('MC-001: 分页查询物料', () => {
    it('应该返回物料列表', async () => {
      // 测试逻辑
    });

    it('应该处理分页参数', async () => {
      // 测试逻辑
    });
  });
});
```

#### 2. 测试用例编写原则

**AAA原则**: Arrange（准备）、Act（执行）、Assert（断言）

```typescript
// ✅ 好的写法 - 遵循AAA原则
it('应该成功创建物料', async () => {
  // Arrange: 准备测试数据
  const materialData = {
    code: 'TEST001',
    name: '测试物料',
  };

  // Act: 执行被测功能
  const result = await materialApi.create(materialData);

  // Assert: 验证结果
  expect(result.code).toBe(200);
  expect(result.data.code).toBe('TEST001');
});

// ❌ 不好的写法 - 没有清晰的分隔
it('应该成功创建物料', async () => {
  const result = await materialApi.create({ code: 'TEST001' });
  expect(result.code).toBe(200);
});
```

#### 3. 断言编写规范

**单一断言原则**: 每个测试用例只测试一个断言

```typescript
// ✅ 好的写法 - 单一断言
it('应该返回正确的状态码', async () => {
  const result = await materialApi.getPage();
  expect(result.code).toBe(200);
});

it('应该返回数据列表', async () => {
  const result = await materialApi.getPage();
  expect(result.data.list).toBeDefined();
});

// ❌ 不好的写法 - 多个断言
it('应该返回正确的响应', async () => {
  const result = await materialApi.getPage();
  expect(result.code).toBe(200);
  expect(result.data.list).toBeDefined();
  expect(result.data.total).toBeGreaterThan(0);
});
```

#### 4. 测试数据隔离

```typescript
// ✅ 好的写法 - 每个测试用例使用独立数据
it('应该成功创建物料A', async () => {
  const material = await createMaterial({ code: 'A001' });
  expect(material.code).toBe('A001');
});

it('应该成功创建物料B', async () => {
  const material = await createMaterial({ code: 'B001' });
  expect(material.code).toBe('B001');
});

// ❌ 不好的写例 - 测试数据相互依赖
let materialId: number;

it('应该创建物料', async () => {
  const material = await materialApi.create({ code: 'TEST' });
  materialId = material.id;
});

it('应该更新物料', async () => {
  await materialApi.update(materialId, { name: '更新' }); // 依赖上一个测试
});
```

### 注释规范

#### 1. 用例头注释

```typescript
/**
 * MC-001: 分页查询物料
 *
 * 测试场景:
 * - 正常分页查询
 * - 第一页/最后一页边界
 * - 跨页查询
 *
 * 预期结果:
 * - 返回正确的分页信息
 * - 数据列表不为空
 */
it('应该返回物料分页数据', async () => {
  // ...
});
```

#### 2. 关键步骤注释

```typescript
it('应该成功创建物料', async () => {
  // 准备测试数据
  const materialData = { code: 'TEST001', name: '测试物料' };

  // 创建物料
  const result = await materialApi.create(materialData);

  // 验证创建成功
  expect(result.code).toBe(200);

  // 清理测试数据
  await materialApi.delete(result.data.id);
});
```

---

## 测试用例模板

### 1. 单元测试模板

```typescript
// utils/format.test.ts

import { describe, it, expect } from 'vitest';
import { formatDate, formatNumber } from './format';

describe('formatDate', () => {
  describe('TC-001: 正常日期格式化', () => {
    it('应该正确格式化日期', () => {
      // Arrange
      const date = '2026-05-03';

      // Act
      const result = formatDate(date);

      // Assert
      expect(result).toBe('2026/05/03');
    });
  });

  describe('TC-002: 边界值测试', () => {
    it('应该处理空字符串', () => {
      expect(formatDate('')).toBe('--');
    });

    it('应该处理无效日期', () => {
      expect(formatDate('invalid')).toBe('--');
    });
  });

  describe('TC-003: 特殊日期测试', () => {
    it('应该处理闰年日期', () => {
      expect(formatDate('2024-02-29')).toBe('2024/02/29');
    });

    it('应该处理月末日期', () => {
      expect(formatDate('2026-12-31')).toBe('2026/12/31');
    });
  });
});

describe('formatNumber', () => {
  describe('TC-004: 数字格式化测试', () => {
    it('应该格式化整数', () => {
      expect(formatNumber(1000)).toBe('1,000');
    });

    it('应该格式化小数', () => {
      expect(formatNumber(1000.5)).toBe('1,000.5');
    });

    it('应该处理零', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });
});
```

### 2. API测试模板

```typescript
// api/material.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { createMaterial, deleteMaterial } from '../test-utils/factory';

describe('Material API', () => {
  const baseUrl = 'http://localhost:8080/api/material';
  let testMaterialIds: number[] = [];

  beforeEach(async () => {
    // 准备测试数据
    const material1 = await createMaterial({ code: 'A001' });
    const material2 = await createMaterial({ code: 'A002' });
    testMaterialIds = [material1.id, material2.id];
  });

  afterEach(async () => {
    // 清理测试数据
    await deleteMaterial(testMaterialIds);
    testMaterialIds = [];
  });

  describe('MC-001: 分页查询物料', () => {
    it('应该返回物料分页数据', async () => {
      // Arrange
      const params = { page: 1, size: 10 };

      // Act
      const response = await axios.get(`${baseUrl}/page`, { params });

      // Assert
      expect(response.status).toBe(200);
      expect(response.data.code).toBe(200);
      expect(response.data.data.list).toBeDefined();
      expect(response.data.data.total).toBeGreaterThan(0);
    });

    it('应该处理分页参数', async () => {
      // Arrange
      const params = { page: 1, size: 5 };

      // Act
      const response = await axios.get(`${baseUrl}/page`, { params });

      // Assert
      expect(response.data.data.list.length).toBeLessThanOrEqual(5);
    });
  });

  describe('MC-003: 新增物料', () => {
    it('应该成功创建物料', async () => {
      // Arrange
      const materialData = {
        code: 'TEST001',
        name: '测试物料',
        categoryId: 1,
        unitId: 1,
      };

      // Act
      const response = await axios.post(baseUrl, materialData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.data.code).toBe(200);
      expect(response.data.data.id).toBeDefined();

      // Cleanup
      await axios.delete(`${baseUrl}/${response.data.data.id}`);
    });

    it('应该拒绝重复的物料编码', async () => {
      // Arrange
      const materialData = {
        code: testMaterialIds[0], // 使用已存在的编码
        name: '测试物料',
      };

      // Act & Assert
      await expect(axios.post(baseUrl, materialData)).rejects.toThrow();
    });
  });

  describe('MC-005: 批量删除物料', () => {
    it('应该成功删除物料', async () => {
      // Arrange
      const idsToDelete = [testMaterialIds[0]];

      // Act
      const response = await axios.delete(baseUrl, { data: idsToDelete });

      // Assert
      expect(response.status).toBe(200);
      expect(response.data.code).toBe(200);

      // Verify
      const getResponse = await axios.get(`${baseUrl}/${idsToDelete[0]}`);
      expect(getResponse.data.data.deletedAt).toBeDefined();
    });
  });
});
```

### 3. 组件测试模板

```typescript
// components/DataTable/index.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DataTable from './index';

describe('DataTable Component', () => {
  const mockData = [
    { id: 1, name: '物料1', code: 'M001' },
    { id: 2, name: '物料2', code: 'M002' },
  ];

  const mockColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '编码', dataIndex: 'code', key: 'code' },
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

      expect(screen.getByText('物料1')).toBeInTheDocument();
      expect(screen.getByText('物料2')).toBeInTheDocument();
    });

    it('应该渲染表头', () => {
      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          rowKey="id"
        />
      );

      expect(screen.getByText('名称')).toBeInTheDocument();
      expect(screen.getByText('编码')).toBeInTheDocument();
    });
  });

  describe('DT-002: 交互测试', () => {
    it('应该触发行点击事件', () => {
      const onRowClick = vi.fn();

      render(
        <DataTable
          data={mockData}
          columns={mockColumns}
          rowKey="id"
          onRowClick={onRowClick}
        />
      );

      fireEvent.click(screen.getByText('物料1'));
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

      // 点击选择框
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      await waitFor(() => {
        expect(onSelectionChange).toHaveBeenCalled();
      });
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

    it('应该触发分页变化', () => {
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

      // 点击下一页
      const nextButton = screen.getByTitle('下一页');
      fireEvent.click(nextButton);

      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('DT-004: 加载状态测试', () => {
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
  });
});
```

### 4. E2E测试模板

```typescript
// e2e/production-order-flow.cy.ts

describe('生产订单完整流程 E2E', () => {
  beforeEach(() => {
    // 登录
    cy.visit('/login');
    cy.get('#username').type('admin');
    cy.get('#password').type('password');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  describe('PO-001: 创建生产订单', () => {
    it('应该成功创建生产订单', () => {
      // 进入订单管理页面
      cy.visit('/production/production-order');

      // 点击新增按钮
      cy.get('button:contains("新增")').click();

      // 填写订单信息
      cy.get('#orderNo').type(`PO${Date.now()}`);
      cy.get('#productId').select('1');
      cy.get('#quantity').type('1000');
      cy.get('#planStartDate').type('2026-05-05');
      cy.get('#planEndDate').type('2026-05-10');

      // 保存订单
      cy.get('button:contains("保存")').click();

      // 验证保存成功
      cy.contains('保存成功').should('be.visible');

      // 验证订单列表中显示新订单
      cy.get('.ant-table').contains(`PO${Date.now()}`).should('be.visible');
    });

    it('应该验证必填字段', () => {
      cy.visit('/production/production-order');
      cy.get('button:contains("新增")').click();

      // 直接提交表单
      cy.get('button:contains("保存")').click();

      // 验证错误提示
      cy.contains('订单编号不能为空').should('be.visible');
      cy.contains('产品不能为空').should('be.visible');
    });
  });

  describe('PO-002: 下达生产订单', () => {
    beforeEach(() => {
      // 准备测试数据
      cy.visit('/production/production-order');
      cy.get('button:contains("新增")').click();
      cy.get('#orderNo').type('PO001');
      cy.get('#productId').select('1');
      cy.get('#quantity').type('1000');
      cy.get('button:contains("保存")').click();
    });

    it('应该成功下达订单', () => {
      // 选择订单
      cy.get('.ant-table-row-selector').first().click();

      // 点击下达按钮
      cy.get('button:contains("下达")').click();

      // 确认下达
      cy.get('.ant-modal-footer button:contains("确定")').click();

      // 验证下达成功
      cy.contains('下达成功').should('be.visible');

      // 验证订单状态更新
      cy.get('.ant-table').contains('已下达').should('be.visible');
    });
  });

  describe('PO-003: 下推生产工单', () => {
    beforeEach(() => {
      // 准备已下达的订单
      cy.task('createProductionOrder', {
        orderNo: 'PO002',
        status: 'RELEASED',
      });
    });

    it('应该成功下推工单', () => {
      cy.visit('/production/production-order');

      // 选择订单
      cy.get('.ant-table-row-selector').first().click();

      // 点击下推工单按钮
      cy.get('button:contains("下推工单")').click();

      // 填写下推数量
      cy.get('#pushQuantity').type('500');
      cy.get('.ant-modal-footer button:contains("确定")').click();

      // 验证下推成功
      cy.contains('工单创建成功').should('be.visible');

      // 跳转到工单页面验证
      cy.visit('/production/work-order');
      cy.get('.ant-table').contains('WO').should('be.visible');
    });
  });
});
```

---

## 测试数据准备方法

### 1. 工厂模式 (Factory Pattern)

#### 定义

工厂模式用于创建测试数据，提供灵活的数据生成方式。

#### 实现

```typescript
// test-utils/factory.ts

/**
 * 物料工厂
 */
export const materialFactory = {
  /**
   * 创建物料数据
   */
  build: (overrides = {}) => {
    return {
      code: `MAT${Date.now()}`,
      name: `测试物料${Date.now()}`,
      categoryId: 1,
      spec: '测试规格',
      unitId: 1,
      type: '原材料',
      status: 1,
      ...overrides,
    };
  },

  /**
   * 创建并保存物料
   */
  create: async (overrides = {}) => {
    const data = materialFactory.build(overrides);
    const response = await materialApi.create(data);
    return response.data;
  },

  /**
   * 批量创建物料
   */
  createMany: async (count = 10, overrides = {}) => {
    const promises = Array.from({ length: count }, () =>
      materialFactory.create(overrides)
    );
    return Promise.all(promises);
  },
};

/**
 * 生产订单工厂
 */
export const productionOrderFactory = {
  build: (overrides = {}) => {
    return {
      orderNo: `PO${Date.now()}`,
      productId: 1,
      productName: '测试产品',
      quantity: 1000,
      unitId: 1,
      planStartDate: '2026-05-05',
      planEndDate: '2026-05-10',
      status: 'DRAFT',
      ...overrides,
    };
  },

  create: async (overrides = {}) => {
    const data = productionOrderFactory.build(overrides);
    const response = await productionOrderApi.create(data);
    return response.data;
  },
};

// 使用示例
const material = await materialFactory.create({
  code: 'CUSTOM001',
  name: '自定义物料',
});
```

### 2. 测试数据构建器 (Test Data Builder)

#### 定义

构建器模式提供更灵活的数据构建方式，支持链式调用。

#### 实现

```typescript
// test-utils/builder.ts

export class MaterialBuilder {
  private data: any = {};

  constructor() {
    this.reset();
  }

  reset() {
    this.data = {
      code: `MAT${Date.now()}`,
      name: `测试物料`,
      categoryId: 1,
      unitId: 1,
      type: '原材料',
      status: 1,
    };
    return this;
  }

  withCode(code: string) {
    this.data.code = code;
    return this;
  }

  withName(name: string) {
    this.data.name = name;
    return this;
  }

  withCategory(categoryId: number) {
    this.data.categoryId = categoryId;
    return this;
  }

  withUnit(unitId: number) {
    this.data.unitId = unitId;
    return this;
  }

  withStatus(status: number) {
    this.data.status = status;
    return this;
  }

  build() {
    return { ...this.data };
  }

  async create() {
    const data = this.build();
    const response = await materialApi.create(data);
    return response.data;
  }
}

// 使用示例
const material = await new MaterialBuilder()
  .withCode('CUSTOM001')
  .withName('自定义物料')
  .withStatus(1)
  .create();
```

### 3. 数据库初始化脚本

#### 定义

使用SQL脚本初始化测试数据库。

#### 实现

```sql
-- test-data/basic-data.sql

-- 清空测试数据
DELETE FROM material WHERE code LIKE 'TEST%';
DELETE FROM bom WHERE code LIKE 'TEST%';
DELETE FROM production_order WHERE order_no LIKE 'TEST%';

-- 插入测试物料
INSERT INTO material (code, name, category_id, spec, unit_id, type, status)
VALUES
  ('TEST001', '测试物料1', 1, '规格1', 1, '原材料', 1),
  ('TEST002', '测试物料2', 1, '规格2', 1, '原材料', 1),
  ('TEST003', '测试物料3', 1, '规格3', 1, '原材料', 0);

-- 插入测试BOM
INSERT INTO bom (code, version, bom_type, status, material_id, quantity, unit_id)
VALUES
  ('BOM001', '1.0', '主生产', 'DRAFT', 1, 1.0, 1);

-- 插入测试订单
INSERT INTO production_order (order_no, product_id, product_name, quantity, unit_id, plan_start_date, plan_end_date, status)
VALUES
  ('PO001', 1, '测试产品', 1000, 1, '2026-05-05', '2026-05-10', 'DRAFT');
```

### 4. 测试数据清理

#### 实现

```typescript
// test-utils/cleanup.ts

/**
 * 清理测试数据
 */
export const cleanupTestData = async () => {
  const testPrefixes = ['TEST', 'MOCK', 'TMP'];

  // 清理物料
  await materialApi.batchDelete(
    (await materialApi.getPage({ page: 1, size: 1000 }))
      .data.list
      .filter(item => testPrefixes.some(prefix => item.code.startsWith(prefix)))
      .map(item => item.id)
  );

  // 清理BOM
  await bomApi.batchDelete(
    (await bomApi.getPage({ page: 1, size: 1000 }))
      .data.list
      .filter(item => testPrefixes.some(prefix => item.code.startsWith(prefix)))
      .map(item => item.id)
  );

  // 清理订单
  await productionOrderApi.batchDelete(
    (await productionOrderApi.getPage({ page: 1, size: 1000 }))
      .data.list
      .filter(item => testPrefixes.some(prefix => item.orderNo.startsWith(prefix)))
      .map(item => item.id)
  );
};

// 在测试套件中使用
describe('Test Suite', () => {
  beforeAll(async () => {
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });
});
```

---

## Mock数据设计原则

### 1. Mock数据真实性

#### 原则

Mock数据应该尽可能接近真实数据。

#### 实现

```typescript
// ✅ 好的Mock - 接近真实数据
const mockMaterial = {
  code: 'RM001',
  name: '天然乳胶',
  categoryId: 6,
  spec: '氨含量≥60%',
  unitId: 8,
  type: '原材料',
  status: 1,
  createdAt: '2026-05-03T10:00:00',
  updatedAt: '2026-05-03T10:00:00',
};

// ❌ 不好的Mock - 过于简单
const mockMaterial = {
  code: '1',
  name: 'test',
};
```

### 2. Mock数据多样性

#### 原则

提供多种Mock数据覆盖不同场景。

#### 实现

```typescript
// mock-data/materials.ts

export const mockMaterials = {
  // 正常数据
  normal: [
    {
      code: 'RM001',
      name: '天然乳胶',
      status: 1,
    },
    {
      code: 'RM002',
      name: '天然橡胶',
      status: 1,
    },
  ],

  // 状态为0的数据
  inactive: [
    {
      code: 'RM003',
      name: '停用物料',
      status: 0,
    },
  ],

  // 边界数据
  boundary: [
    {
      code: 'A'.repeat(50), // 最大长度
      name: '测试物料',
    },
    {
      code: '', // 空编码
      name: '测试物料',
    },
  ],

  // 特殊字符
  special: [
    {
      code: "'; DROP TABLE material; --", // SQL注入
      name: '测试物料',
    },
    {
      code: '<script>alert("xss")</script>', // XSS
      name: '测试物料',
    },
  ],
};
```

### 3. Mock服务 (MSW)

#### 实现

```typescript
// test/mocks/handlers.ts

import { rest } from 'msw';
import { mockMaterials } from './mock-data';

export const handlers = [
  // Mock物料查询
  rest.get('/api/material/page', (req, res, ctx) => {
    const page = Number(req.url.searchParams.get('page')) || 1;
    const size = Number(req.url.searchParams.get('size')) || 10;

    return res(
      ctx.status(200),
      ctx.json({
        code: 200,
        message: '操作成功',
        data: {
          list: mockMaterials.normal,
          total: mockMaterials.normal.length,
          page,
          size,
        },
      })
    );
  }),

  // Mock物料创建
  rest.post('/api/material', (req, res, ctx) => {
    const material = req.body;

    // 验证必填字段
    if (!material.code || !material.name) {
      return res(
        ctx.status(400),
        ctx.json({
          code: 400,
          message: '必填字段不能为空',
          data: null,
        })
      );
    }

    // 验证重复编码
    if (mockMaterials.normal.some(m => m.code === material.code)) {
      return res(
        ctx.status(400),
        ctx.json({
          code: 400,
          message: '物料编码已存在',
          data: null,
        })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        code: 200,
        message: '操作成功',
        data: {
          id: Date.now(),
          ...material,
          createdAt: new Date().toISOString(),
        },
      })
    );
  }),

  // Mock错误响应
  rest.get('/api/material/error', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        code: 500,
        message: '服务器错误',
        data: null,
      })
    );
  }),
];
```

### 4. Mock服务器配置

```typescript
// test/setup.ts

import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// 创建Mock服务器
export const server = setupServer(...handlers);

// 测试前启动服务器
beforeAll(() => server.listen());

// 每个测试后重置处理器
afterEach(() => server.resetHandlers());

// 测试后关闭服务器
afterAll(() => server.close());
```

---

## 测试用例最佳实践

### 1. 测试用例独立性

#### 原则

每个测试用例应该独立运行，不依赖其他测试用例。

#### 示例

```typescript
// ✅ 好的写例 - 独立测试
describe('物料管理', () => {
  it('应该创建物料A', async () => {
    const material = await createMaterial({ code: 'A001' });
    expect(material.code).toBe('A001');
    await deleteMaterial(material.id);
  });

  it('应该创建物料B', async () => {
    const material = await createMaterial({ code: 'B001' });
    expect(material.code).toBe('B001');
    await deleteMaterial(material.id);
  });
});

// ❌ 不好的写例 - 依赖测试
describe('物料管理', () => {
  let materialId: number;

  it('应该创建物料', async () => {
    const material = await createMaterial({ code: 'A001' });
    materialId = material.id;
  });

  it('应该更新物料', async () => {
    await updateMaterial(materialId, { name: '更新' }); // 依赖上一个测试
  });
});
```

### 2. 测试覆盖率

#### 原则

追求高测试覆盖率，但不盲目追求100%。

#### 示例

```typescript
// 工具函数 - 应该100%覆盖
export const formatDate = (date: string): string => {
  if (!date) return '--';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '--';
  return d.toISOString().split('T')[0].replace(/-/g, '/');
};

// 组件 - 80%覆盖即可
export const DataTable = ({ data, columns }: Props) => {
  // UI组件不需要覆盖所有分支
  return <Table dataSource={data} columns={columns} />;
};
```

### 3. 测试可读性

#### 原则

测试用例应该像文档一样易于理解。

#### 示例

```typescript
// ✅ 好的写例 - 清晰易懂
describe('物料创建', () => {
  it('当物料编码不存在时，应该成功创建物料', async () => {
    // Given: 准备物料数据
    const materialData = {
      code: 'TEST001',
      name: '测试物料',
    };

    // When: 调用创建接口
    const result = await materialApi.create(materialData);

    // Then: 验证创建成功
    expect(result.code).toBe(200);
    expect(result.data.code).toBe('TEST001');
  });

  it('当物料编码已存在时，应该返回错误', async () => {
    // Given: 准备重复的物料编码
    const existingMaterial = await createMaterial({ code: 'DUPLICATE' });
    const duplicateData = { code: 'DUPLICATE', name: '重复物料' };

    // When: 尝试创建重复编码
    const promise = materialApi.create(duplicateData);

    // Then: 验证返回错误
    await expect(promise).rejects.toThrow();
  });
});

// ❌ 不好的写例 - 难以理解
describe('物料创建', () => {
  it('test1', async () => {
    const result = await materialApi.create({ code: 'TEST001' });
    expect(result.code).toBe(200);
  });
});
```

### 4. 测试性能

#### 原则

测试应该快速执行，避免不必要的等待。

#### 示例

```typescript
// ✅ 好的写例 - 使用Mock避免真实请求
it('应该查询物料列表', async () => {
  // 使用Mock数据
  server.use(
    rest.get('/api/material/page', (req, res, ctx) => {
      return res(ctx.json({ code: 200, data: { list: mockData } }));
    })
  );

  const result = await materialApi.getPage();
  expect(result.code).toBe(200);
});

// ❌ 不好的写例 - 等待真实API
it('应该查询物料列表', async () => {
  // 真实API请求，速度慢且不稳定
  const result = await materialApi.getPage();
  expect(result.code).toBe(200);
});
```

---

## 测试用例管理

### 1. 测试用例组织

#### 目录结构

```
src/
├── __tests__/
│   ├── unit/                    # 单元测试
│   │   ├── utils/
│   │   │   └── format.test.ts
│   │   └── hooks/
│   │       └── useTable.test.ts
│   ├── component/               # 组件测试
│   │   ├── shared/
│   │   │   └── DataTable.test.tsx
│   │   └── modules/
│   │       └── material/
│   │           └── MaterialList.test.tsx
│   ├── integration/             # 集成测试
│   │   └── production-flow.test.tsx
│   └── e2e/                     # E2E测试
│       └── production-order.cy.ts
├── test-utils/                  # 测试工具
│   ├── factory.ts
│   ├── builder.ts
│   └── cleanup.ts
└── mocks/                       # Mock数据
    ├── handlers.ts
    └── mock-data.ts
```

### 2. 测试用例文档

#### 测试用例清单

```markdown
# 测试用例清单 - 物料管理

| 用例ID | 用例标题 | 优先级 | 状态 | 执行人 |
|--------|----------|--------|------|--------|
| MC-001 | 分页查询物料 | P0 | 通过 | 张三 |
| MC-002 | 根据ID查询物料 | P0 | 通过 | 张三 |
| MC-003 | 新增物料 | P0 | 通过 | 张三 |
| MC-004 | 更新物料 | P0 | 失败 | 张三 |
| MC-005 | 删除物料 | P0 | 待执行 | 李四 |
```

### 3. 测试用例版本控制

#### Git提交规范

```bash
# 测试相关的提交
git commit -m "test(material): add unit tests for material API"
git commit -m "fix(material): fix failing test for material creation"
git commit -m "feat(material): add E2E test for material flow"
```

---

## 常见问题与解决方案

### 1. 测试执行缓慢

#### 问题

测试执行时间过长，影响开发效率。

#### 解决方案

```typescript
// 1. 使用Mock代替真实请求
server.use(
  rest.get('/api/material/page', (req, res, ctx) => {
    return res(ctx.json({ code: 200, data: mockData }));
  })
);

// 2. 并行执行测试
// vitest.config.ts
export default defineConfig({
  test: {
    threads: true,
    maxThreads: 4,
  },
});

// 3. 使用测试数据库
// 使用内存数据库或Docker容器
```

### 2. 测试数据冲突

#### 问题

多个测试用例使用相同数据导致冲突。

#### 解决方案

```typescript
// 1. 使用唯一ID
const material = await createMaterial({
  code: `TEST${Date.now()}${Math.random()}`,
});

// 2. 使用事务回滚
beforeEach(async () => {
  await db.transaction(async (trx) => {
    // 测试代码
  });
});

// 3. 及时清理测试数据
afterEach(async () => {
  await cleanupTestData();
});
```

### 3. 异步测试失败

#### 问题

异步测试结果不稳定，时好时坏。

#### 解决方案

```typescript
// 1. 使用async/await
it('should create material', async () => {
  const result = await materialApi.create(data);
  expect(result.code).toBe(200);
});

// 2. 使用waitFor等待异步操作
it('should update DOM after async operation', async () => {
  fireEvent.click(button);
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});

// 3. 设置合理的超时时间
it('should handle slow API', { timeout: 10000 }, async () => {
  // 测试代码
});
```

---

**文档历史**

| 版本 | 日期 | 修改人 | 修改内容 |
|------|------|--------|----------|
| v1.0 | 2026-05-03 | 测试团队 | 初始版本 |
