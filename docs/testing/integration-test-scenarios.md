# MES系统集成测试场景设计

**文档版本**: v1.0
**创建时间**: 2026-05-03
**适用范围**: MES系统集成测试和E2E测试

---

## 目录

1. [集成测试概述](#集成测试概述)
2. [关键业务流程测试](#关键业务流程测试)
3. [跨模块功能测试](#跨模块功能测试)
4. [性能测试场景](#性能测试场景)
5. [并发测试场景](#并发测试场景)
6. [异常处理测试场景](#异常处理测试场景)
7. [测试数据准备](#测试数据准备)
8. [测试执行计划](#测试执行计划)

---

## 集成测试概述

### 测试目标

集成测试的目标是验证：

- **模块间协作**: 不同模块之间的数据交互和业务协作
- **前后端集成**: 前端UI与后端API的集成
- **数据一致性**: 数据在系统流转中的一致性
- **业务流程**: 完整业务流程的端到端验证
- **系统性能**: 系统在真实场景下的性能表现

### 测试范围

| 测试类型 | 覆盖范围 | 优先级 |
|----------|----------|--------|
| **业务流程测试** | 关键业务流程的完整验证 | P0 |
| **跨模块测试** | 模块间功能集成 | P0 |
| **性能测试** | 响应时间、并发能力 | P1 |
| **数据一致性** | 数据流转的一致性 | P0 |
| **异常处理** | 异常场景的处理机制 | P1 |

### 测试工具

| 工具 | 用途 | 版本 |
|------|------|------|
| **Cypress** | E2E测试 | latest |
| **Vitest** | 集成测试 | latest |
| **JMeter** | 性能测试 | 5.x |
| **Test Containers** | 测试环境 | latest |
| **Docker** | 环境隔离 | latest |

---

## 关键业务流程测试

### 1. 生产订单完整流程 (IT-PO-001)

#### 流程描述

生产订单从创建到完成的全流程：创建→下达→下推工单→工单执行→完成。

#### 测试场景

##### 场景1: 创建并下达生产订单

**步骤**:
1. 登录系统
2. 进入生产订单管理页面
3. 点击"新增"按钮
4. 填写订单信息:
   - 订单编号: PO20260503001
   - 产品: 医用手套 S号
   - 数量: 10000个
   - 计划开始日期: 2026-05-05
   - 计划结束日期: 2026-05-10
5. 点击"保存"
6. 选择新创建的订单
7. 点击"下达"按钮
8. 确认下达

**预期结果**:
- 订单成功创建，状态为"草稿"
- 订单成功下达，状态变为"已下达"
- 系统自动创建生产工单

##### 场景2: 下推生产工单

**前置条件**: 订单已下达

**步骤**:
1. 进入生产订单管理页面
2. 选择已下达的订单
3. 点击"下推工单"按钮
4. 填写下推信息:
   - 下推数量: 5000个
   - 下推比例: 50%
5. 确认下推

**预期结果**:
- 成功创建生产工单
- 工单编号自动生成
- 工单状态为"待执行"
- 订单剩余数量更新

##### 场景3: 工单执行和完成

**前置条件**: 工单已创建

**步骤**:
1. 进入生产工单管理页面
2. 选择工单
3. 点击"开始"按钮
4. 系统自动创建PAD任务
5. 进入PAD任务页面
6. 选择任务并开始执行
7. 填写实际产量: 4900个
8. 填写合格产量: 4850个
9. 填写不合格产量: 50个
10. 完成任务
11. 返回工单页面，点击"完成"按钮
12. 填写实际工时: 8小时

**预期结果**:
- 工单状态从"待执行"→"执行中"→"已完成"
- 实际产量和合格率正确计算
- 生产数据正确记录
- 库存数据更新

##### 场景4: 异常处理

**步骤**:
1. 尝试创建数量为0的订单
2. 尝试下达不存在的订单
3. 尝试下推数量超过订单剩余数量的工单
4. 尝试完成未开始的工单

**预期结果**:
- 系统正确拦截异常操作
- 显示友好的错误提示
- 数据不会损坏

#### 测试代码

```typescript
// e2e/production-order-flow.cy.ts
describe('生产订单完整流程', () => {
  beforeEach(() => {
    cy.login('admin', 'password');
  });

  it('应该完成生产订单完整流程', () => {
    const orderNo = `PO${Date.now()}`;

    // 1. 创建生产订单
    cy.visit('/production/production-order');
    cy.get('button:contains("新增")').click();
    cy.get('#orderNo').type(orderNo);
    cy.get('#productId').select('4'); // 医用手套 S号
    cy.get('#quantity').type('10000');
    cy.get('#planStartDate').type('2026-05-05');
    cy.get('#planEndDate').type('2026-05-10');
    cy.get('button:contains("保存")').click();
    cy.contains('保存成功').should('be.visible');

    // 2. 下达订单
    cy.get('.ant-table').contains(orderNo).closest('tr')
      .find('.ant-checkbox-wrapper').click();
    cy.get('button:contains("下达")').click();
    cy.get('.ant-modal-footer button:contains("确定")').click();
    cy.contains('下达成功').should('be.visible');

    // 3. 验证订单状态
    cy.get('.ant-table').contains(orderNo).closest('tr')
      .should('contain', '已下达');

    // 4. 下推工单
    cy.get('button:contains("下推工单")').click();
    cy.get('#pushQuantity').type('5000');
    cy.get('.ant-modal-footer button:contains("确定")').click();
    cy.contains('工单创建成功').should('be.visible');

    // 5. 验证工单创建
    cy.visit('/production/work-order');
    cy.get('.ant-table').should('contain', 'WO');
  });

  it('应该验证必填字段', () => {
    cy.visit('/production/production-order');
    cy.get('button:contains("新增")').click();
    cy.get('button:contains("保存")').click();

    cy.contains('订单编号不能为空').should('be.visible');
    cy.contains('产品不能为空').should('be.visible');
    cy.contains('数量不能为空').should('be.visible');
  });
});
```

---

### 2. 领料管理完整流程 (IT-MI-001)

#### 流程描述

领料申请→审批→发料→库存扣减的完整流程。

#### 测试场景

##### 场景1: 创建领料单

**步骤**:
1. 登录系统
2. 进入领料管理页面
3. 点击"新增"按钮
4. 填写领料信息:
   - 领料单号: MI20260503001
   - 生产工单: WO20260503001
   - 领料明细:
     - 物料: 天然乳胶
     - 数量: 100kg
5. 点击"保存"

**预期结果**:
- 领料单成功创建
- 状态为"待审批"
- 库存充足性验证通过

##### 场景2: 审批领料单

**前置条件**: 领料单已创建

**步骤**:
1. 进入领料管理页面
2. 选择待审批的领料单
3. 点击"审批"按钮
4. 填写审批意见:
   - 审批结果: 同意
   - 审批意见: 同意发料
5. 确认审批

**预期结果**:
- 领料单状态变为"已审批"
- 审批记录保存

##### 场景3: 执行发料

**前置条件**: 领料单已审批

**步骤**:
1. 进入领料管理页面
2. 选择已审批的领料单
3. 点击"发料"按钮
4. 确认发料

**预期结果**:
- 领料单状态变为"已发料"
- 库存数量扣减
- 发料记录保存

##### 场景4: 库存不足处理

**步骤**:
1. 创建超过库存数量的领料单
2. 尝试提交审批

**预期结果**:
- 系统提示库存不足
- 不允许提交审批

#### 测试代码

```typescript
// e2e/material-issuance-flow.cy.ts
describe('领料管理完整流程', () => {
  beforeEach(() => {
    cy.login('admin', 'password');
  });

  it('应该完成领料完整流程', () => {
    const issuanceNo = `MI${Date.now()}`;

    // 1. 创建领料单
    cy.visit('/issuance/material-issuance');
    cy.get('button:contains("新增")').click();
    cy.get('#issuanceNo').type(issuanceNo);
    cy.get('#workOrderId').select('1');
    cy.get('#materialId').select('1');
    cy.get('#quantity').type('100');
    cy.get('button:contains("保存")').click();
    cy.contains('保存成功').should('be.visible');

    // 2. 审批领料单
    cy.get('.ant-table').contains(issuanceNo).closest('tr')
      .find('.ant-checkbox-wrapper').click();
    cy.get('button:contains("审批")').click();
    cy.get('#approvalResult').select('1'); // 同意
    cy.get('#approvalOpinion').type('同意发料');
    cy.get('.ant-modal-footer button:contains("确定")').click();
    cy.contains('审批成功').should('be.visible');

    // 3. 执行发料
    cy.get('button:contains("发料")').click();
    cy.get('.ant-modal-footer button:contains("确定")').click();
    cy.contains('发料成功').should('be.visible');

    // 4. 验证库存
    cy.visit('/inventory/inventory-query');
    cy.get('#materialId').select('1');
    cy.get('button:contains("查询")').click();
    // 验证库存数量减少
  });

  it('应该拒绝库存不足的领料', () => {
    cy.visit('/issuance/material-issuance');
    cy.get('button:contains("新增")').click();
    cy.get('#quantity').type('999999'); // 超大数量
    cy.get('button:contains("保存")').click();

    cy.contains('库存不足').should('be.visible');
  });
});
```

---

### 3. 质检管理完整流程 (IT-QM-001)

#### 流程描述

质检任务分配→质检执行→结果录入→不合格品处理→质量放行的完整流程。

#### 测试场景

##### 场景1: 创建质检任务

**步骤**:
1. 登录系统
2. 进入质检管理页面
3. 点击"新增"按钮
4. 填写质检信息:
   - 质检编号: IT20260503001
   - 质检类型: 进料检验
   - 检验批号: BATCH001
   - 质检项目:
     - 尺寸检测
     - 外观检测
     - 性能检测
5. 点击"保存"

**预期结果**:
- 质检任务成功创建
- 状态为"待分配"

##### 场景2: 分配质检员

**前置条件**: 质检任务已创建

**步骤**:
1. 选择质检任务
2. 点击"分配"按钮
3. 选择质检员: 李娜
4. 确认分配

**预期结果**:
- 任务状态变为"待执行"
- 质检员收到通知

##### 场景3: 执行质检并录入结果

**前置条件**: 任务已分配

**步骤**:
1. 进入质检任务页面
2. 选择待执行的任务
3. 点击"开始"按钮
4. 逐项录入质检结果:
   - 尺寸检测: 合格
   - 外观检测: 合格
   - 性能检测: 不合格
5. 填写不合格数量: 10个
6. 填写质检结论: 部分不合格
7. 提交结果

**预期结果**:
- 任务状态变为"已完成"
- 质检结果保存
- 自动创建MRB评审记录

##### 场景4: MRB评审

**前置条件**: 存在不合格品

**步骤**:
1. 进入MRB评审页面
2. 选择待评审的记录
3. 点击"评审"按钮
4. 填写评审意见:
   - 处理方式: 返工
   - 评审意见: 建议返工处理
5. 提交评审

**预期结果**:
- 评审记录保存
- 不合格品进入返工流程

##### 场景5: 质量放行

**前置条件**: 全部合格或已处理

**步骤**:
1. 进入质量放行页面
2. 点击"新增"按钮
3. 填写放行信息:
   - 批号: BATCH001
   - 放行类型: 最终放行
4. 提交申请
5. 点击"审批"按钮
6. 生成放行证书

**预期结果**:
- 质量放行成功
- 放行证书生成
- 产品可以入库或发货

#### 测试代码

```typescript
// e2e/quality-management-flow.cy.ts
describe('质量管理完整流程', () => {
  beforeEach(() => {
    cy.login('admin', 'password');
  });

  it('应该完成质检完整流程', () => {
    const taskNo = `IT${Date.now()}`;

    // 1. 创建质检任务
    cy.visit('/quality/inspection-task');
    cy.get('button:contains("新增")').click();
    cy.get('#taskNo').type(taskNo);
    cy.get('#inspectionType').select('1'); // 进料检验
    cy.get('#batchNo').type('BATCH001');
    cy.get('#materialId').select('1');
    cy.get('button:contains("保存")').click();
    cy.contains('保存成功').should('be.visible');

    // 2. 分配质检员
    cy.get('.ant-table').contains(taskNo).closest('tr')
      .find('.ant-checkbox-wrapper').click();
    cy.get('button:contains("分配")').click();
    cy.get('#inspectorId').select('2'); // 李娜
    cy.get('.ant-modal-footer button:contains("确定")').click();
    cy.contains('分配成功').should('be.visible');

    // 3. 执行质检
    cy.get('button:contains("执行")').click();
    cy.get('#item1').select('1'); // 合格
    cy.get('#item2').select('1'); // 合格
    cy.get('#item3').select('0'); // 不合格
    cy.get('#unqualifiedQuantity').type('10');
    cy.get('button:contains("提交")').click();
    cy.contains('提交成功').should('be.visible');

    // 4. 验证MRB评审记录
    cy.visit('/quality/mrb-record');
    cy.get('.ant-table').should('contain', 'MRB');
  });

  it('应该完成质量放行', () => {
    const releaseNo = `QR${Date.now()}`;

    // 1. 创建放行申请
    cy.visit('/quality/quality-release');
    cy.get('button:contains("新增")').click();
    cy.get('#releaseNo').type(releaseNo);
    cy.get('#batchNo').type('BATCH001');
    cy.get('#releaseType').select('1'); // 最终放行
    cy.get('button:contains("保存")').click();
    cy.contains('保存成功').should('be.visible');

    // 2. 审批放行
    cy.get('.ant-table').contains(releaseNo).closest('tr')
      .find('.ant-checkbox-wrapper').click();
    cy.get('button:contains("审批")').click();
    cy.get('#certificateNo').type(`CERT${Date.now()}`);
    cy.get('.ant-modal-footer button:contains("确定")').click();
    cy.contains('审批成功').should('be.visible');

    // 3. 验证放行证书
    cy.get('button:contains("生成证书")').click();
    cy.contains('证书生成成功').should('be.visible');
  });
});
```

---

### 4. 用户认证和权限控制 (IT-AU-001)

#### 流程描述

用户登录→权限验证→资源访问→权限越权测试。

#### 测试场景

##### 场景1: 正常登录流程

**步骤**:
1. 访问登录页面
2. 输入用户名: admin
3. 输入密码: password
4. 点击"登录"按钮

**预期结果**:
- 登录成功
- 跳转到首页
- 显示用户信息

##### 场景2: 错误密码登录

**步骤**:
1. 访问登录页面
2. 输入用户名: admin
3. 输入错误密码
4. 点击"登录"按钮

**预期结果**:
- 登录失败
- 显示错误提示

##### 场景3: 权限验证

**步骤**:
1. 使用普通用户登录
2. 尝试访问管理员页面
3. 尝试执行管理员操作

**预期结果**:
- 无权限访问
- 显示权限不足提示
- 操作被拦截

##### 场景4: Token过期处理

**步骤**:
1. 登录系统
2. 等待Token过期
3. 尝试执行操作

**预期结果**:
- 自动跳转到登录页
- 提示Token过期
- 支持Token刷新

#### 测试代码

```typescript
// e2e/auth-flow.cy.ts
describe('用户认证和权限控制', () => {
  it('应该正常登录', () => {
    cy.visit('/login');
    cy.get('#username').type('admin');
    cy.get('#password').type('password');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard');
    cy.contains('欢迎').should('be.visible');
  });

  it('应该拒绝错误密码', () => {
    cy.visit('/login');
    cy.get('#username').type('admin');
    cy.get('#password').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.contains('用户名或密码错误').should('be.visible');
  });

  it('应该验证权限', () => {
    cy.login('user', 'password');
    cy.visit('/system/permission');

    cy.contains('权限不足').should('be.visible');
  });

  it('应该处理Token过期', () => {
    cy.login('admin', 'password');
    cy.clearLocalStorage(); // 清除Token模拟过期

    cy.visit('/production/production-order');

    cy.url().should('include', '/login');
    cy.contains('登录已过期').should('be.visible');
  });
});
```

---

## 跨模块功能测试

### 1. 生产-库存集成测试 (IT-PI-001)

#### 测试场景

##### 场景1: 生产订单创建时检查库存

**步骤**:
1. 创建生产订单
2. 系统自动检查物料库存
3. 库存充足: 允许创建
4. 库存不足: 提示并阻止

**预期结果**:
- 正确验证库存充足性
- 友好的提示信息

##### 场景2: 领料扣减库存

**步骤**:
1. 创建领料单
2. 审批通过
3. 执行发料
4. 验证库存扣减

**预期结果**:
- 库存数量正确扣减
- 库存流水记录完整

##### 场景3: 完工增加库存

**步骤**:
1. 完成生产工单
2. 系统自动增加成品库存
3. 验证库存增加

**预期结果**:
- 成品库存正确增加
- 库存流水记录完整

---

### 2. 生产-质量集成测试 (IT-PQ-001)

#### 测试场景

##### 场景1: 生产完成自动创建质检任务

**步骤**:
1. 完成生产工单
2. 系统自动创建质检任务
3. 验证质检任务创建

**预期结果**:
- 质检任务自动创建
- 任务信息正确

##### 场景2: 质检不合格触发MRB

**步骤**:
1. 执行质检
2. 录入不合格结果
3. 系统自动创建MRB评审
4. 验证MRB记录

**预期结果**:
- MRB记录自动创建
- 评审流程正常

---

### 3. 质量-库存集成测试 (IT-QI-001)

#### 测试场景

##### 场景1: 不合格品扣减库存

**步骤**:
1. 发现不合格品
2. 记录不合格数量
3. 库存自动扣减不合格品
4. 验证库存

**预期结果**:
- 不合格品库存扣减
- 合格品库存保持不变

##### 场景2: 返工增加在制品

**步骤**:
1. MRB决定返工
2. 创建返工工单
3. 增加在制品库存
4. 验证库存

**预期结果**:
- 在制品库存正确增加
- 库存流水记录完整

---

## 性能测试场景

### 1. API响应时间测试 (IT-PF-001)

#### 测试场景

##### 场景1: 单个API响应时间

**测试指标**:
- P50: < 200ms
- P95: < 500ms
- P99: < 1000ms

**测试方法**:
```typescript
// 性能测试脚本
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95%请求<500ms
  },
};

export default function () {
  let response = http.get('http://test-mes.local/api/material/page');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

##### 场景2: 复杂查询响应时间

**测试场景**:
- 查询1000+记录
- 多条件筛选
- 多字段排序

**预期结果**:
- 响应时间 < 1s
- 返回数据正确

---

### 2. 并发测试 (IT-PF-002)

#### 测试场景

##### 场景1: 多用户并发查询

**测试配置**:
- 并发用户: 100
- 持续时间: 5分钟
- 操作: 查询物料列表

**预期结果**:
- 成功率 > 99%
- 平均响应时间 < 500ms
- 系统不崩溃

**测试脚本**:
```typescript
// k6并发测试
export let options = {
  stages: [
    { duration: '1m', target: 50 },   // 1分钟增加到50用户
    { duration: '2m', target: 100 },  // 2分钟增加到100用户
    { duration: '1m', target: 0 },    // 1分钟降到0用户
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],   // 失败率<1%
  },
};

export default function () {
  let response = http.get('http://test-mes.local/api/material/page');
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
}
```

##### 场景2: 多用户并发写入

**测试配置**:
- 并发用户: 50
- 持续时间: 5分钟
- 操作: 创建物料

**预期结果**:
- 成功率 > 95%
- 数据一致性正确
- 无死锁

---

### 3. 大数据量测试 (IT-PF-003)

#### 测试场景

##### 场景1: 大数据量查询

**测试数据**:
- 物料数据: 10000条
- 订单数据: 5000条
- 工单数据: 10000条

**测试操作**:
- 分页查询
- 条件筛选
- 数据导出

**预期结果**:
- 查询响应时间 < 2s
- 导出时间 < 30s
- 内存使用正常

##### 场景2: 大数据量写入

**测试数据**:
- 批量创建1000个物料
- 批量创建500个订单

**预期结果**:
- 写入成功率 100%
- 写入时间 < 60s
- 数据完整性正确

---

## 并发测试场景

### 1. 同一数据并发修改 (IT-CC-001)

#### 测试场景

**场景**: 多个用户同时修改同一物料

**步骤**:
1. 用户A和用户B同时打开物料编辑页面
2. 用户A修改名称并保存
3. 用户B修改规格并保存

**预期结果**:
- 最后保存生效
- 不产生数据冲突
- 可选: 启用乐观锁

---

### 2. 库存并发扣减 (IT-CC-002)

#### 测试场景

**场景**: 多个领料单同时扣减同一物料库存

**步骤**:
1. 创建10个领料单，每个扣减100kg
2. 库存初始500kg
3. 同时执行发料操作

**预期结果**:
- 库存不会变为负数
- 部分发料失败
- 返回明确的错误信息

---

### 3. 订单并发创建 (IT-CC-003)

#### 测试场景

**场景**: 多个用户同时创建生产订单

**步骤**:
1. 10个用户同时创建订单
2. 订单编号唯一性验证

**预期结果**:
- 订单编号不重复
- 所有订单成功创建
- 数据完整性正确

---

## 异常处理测试场景

### 1. 网络异常 (IT-EH-001)

#### 测试场景

##### 场景1: 网络中断

**步骤**:
1. 创建生产订单
2. 提交时中断网络
3. 恢复网络

**预期结果**:
- 显示网络错误提示
- 支持重新提交
- 数据不会丢失

##### 场景2: API超时

**步骤**:
1. 执行查询操作
2. 模拟API响应超时

**预期结果**:
- 显示超时提示
- 支持重试
- 不影响其他操作

---

### 2. 数据异常 (IT-EH-002)

#### 测试场景

##### 场景1: 必填字段缺失

**步骤**:
1. 创建物料时省略必填字段
2. 提交表单

**预期结果**:
- 前端验证拦截
- 显示字段错误提示
- 不提交到后端

##### 场景2: 数据格式错误

**步骤**:
1. 输入错误的日期格式
2. 输入错误的数字格式
3. 提交表单

**预期结果**:
- 格式验证拦截
- 显示格式错误提示
- 不提交到后端

##### 场景3: 关联数据不存在

**步骤**:
1. 创建订单时选择不存在的产品
2. 提交表单

**预期结果**:
- 后端验证拦截
- 显示错误提示
- 不创建数据

---

### 3. 业务规则异常 (IT-EH-003)

#### 测试场景

##### 场景1: 状态不允许操作

**步骤**:
1. 尝试删除已下达的订单
2. 尝试完成未开始的工单
3. 尝试审批已审批的领料单

**预期结果**:
- 业务规则拦截
- 显示友好的错误提示
- 操作不执行

##### 场景2: 库存不足

**步骤**:
1. 创建超过库存的领料单
2. 尝试发料

**预期结果**:
- 库存验证拦截
- 显示库存不足提示
- 不扣减库存

---

## 测试数据准备

### 1. 测试数据策略

#### 数据清理

```typescript
// test/utils/cleanup.ts
export const cleanupTestData = async () => {
  // 清理测试物料
  await materialApi.batchDelete(
    (await materialApi.getPage({ page: 1, size: 10000 }))
      .data.list
      .filter(m => m.code.startsWith('TEST'))
      .map(m => m.id)
  );

  // 清理测试订单
  await productionOrderApi.batchDelete(
    (await productionOrderApi.getPage({ page: 1, size: 10000 }))
      .data.list
      .filter(o => o.orderNo.startsWith('TEST'))
      .map(o => o.id)
  );

  // ... 清理其他测试数据
};
```

#### 数据初始化

```sql
-- test-data/init.sql
-- 基础数据
INSERT INTO material (code, name, category_id, unit_id, status) VALUES
  ('TEST001', '测试物料1', 1, 1, 1),
  ('TEST002', '测试物料2', 1, 1, 1);

-- 仓库数据
INSERT INTO warehouse (code, name, type, status) VALUES
  ('WH001', '成品仓', '成品', 1),
  ('WH002', '原料仓', '原料', 1);

-- 库存数据
INSERT INTO inventory (warehouse_id, material_id, quantity) VALUES
  (1, 1, 1000),
  (1, 2, 500);
```

### 2. 测试环境配置

#### Docker Compose

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: test_mes_db
    ports:
      - "3307:3306"
    volumes:
      - ./test-data/init.sql:/docker-entrypoint-initdb.d/init.sql

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/test_mes_db
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: password
    depends_on:
      - mysql

  frontend:
    build: .
    ports:
      - "3000:80"
    environment:
      VITE_API_BASE_URL: http://localhost:8080/api
```

---

## 测试执行计划

### 1. 每日测试

| 时间 | 测试类型 | 模块 | 负责人 |
|------|----------|------|--------|
| 09:00-10:00 | 冒烟测试 | 所有模块 | QA |
| 10:00-12:00 | 功能测试 | P0模块 | QA |
| 14:00-16:00 | 回归测试 | 本日修改 | QA |
| 16:00-17:00 | Bug验证 | 本日Bug | 开发 |

### 2. 每周测试

| 日期 | 测试类型 | 范围 |
|------|----------|------|
| 周一 | P0回归测试 | 核心业务流程 |
| 周二-周三 | P1回归测试 | 重要功能 |
| 周四 | P2回归测试 | 一般功能 |
| 周五 | 性能测试 | 关键API |

### 3. 发布前测试

| 阶段 | 测试类型 | 时间 |
|------|----------|------|
| 第1天 | 全量功能测试 | 8小时 |
| 第2天 | 性能测试 | 4小时 |
| 第3天 | 安全测试 | 4小时 |
| 第4天 | 兼容性测试 | 4小时 |
| 第5天 | 回归测试 | 8小时 |

---

## 附录

### A. 测试报告模板

```markdown
# 集成测试报告

**测试时间**: 2026-05-03
**测试人**: XXX
**测试环境**: 测试环境

## 测试概况

| 项目 | 数值 |
|------|------|
| 测试用例总数 | 50个 |
| 执行用例数 | 50个 |
| 通过用例数 | 48个 |
| 失败用例数 | 2个 |
| 通过率 | 96% |

## 模块测试结果

| 模块 | 用例数 | 通过 | 失败 | 通过率 |
|------|--------|------|------|--------|
| 生产订单 | 10 | 10 | 0 | 100% |
| 领料管理 | 10 | 10 | 0 | 100% |
| 质量管理 | 10 | 9 | 1 | 90% |
| 用户认证 | 10 | 9 | 1 | 90% |
| 跨模块集成 | 10 | 10 | 0 | 100% |

## 失败用例详情

| 用例ID | 用例标题 | 失败原因 | 严重程度 |
|--------|----------|----------|----------|
| IT-QM-003 | 质检结果录入 | 不合格品数量计算错误 | 高 |
| IT-AU-004 | Token过期 | 自动跳转失败 | 中 |

## 性能测试结果

| API | P50 | P95 | P99 | 是否达标 |
|-----|-----|-----|-----|----------|
| /api/material/page | 150ms | 450ms | 800ms | 是 |
| /api/production-order/create | 200ms | 550ms | 900ms | 否 |

## 测试结论

通过率96%，发现2个Bug，建议修复后重新测试。
```

### B. 测试工具配置

#### Cypress配置

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://test-mes.local',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    video: true,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // 实现其他事件监听器
    },
  },
});
```

---

**文档历史**

| 版本 | 日期 | 修改人 | 修改内容 |
|------|------|--------|----------|
| v1.0 | 2026-05-03 | 测试团队 | 初始版本 |
