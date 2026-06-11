# MES系统API测试清单

**文档版本**: v1.0
**创建时间**: 2026-05-03
**项目名称**: 医疗器械MES系统
**API总数**: 166个

---

## 目录

1. [测试概述](#测试概述)
2. [基础数据模块](#基础数据模块)
3. [生产管理模块](#生产管理模块)
4. [车间执行模块](#车间执行模块)
5. [质量管理模块](#质量管理模块)
6. [工艺路径模块](#工艺路径模块)
7. [系统管理模块](#系统管理模块)
8. [用户认证模块](#用户认证模块)
9. [测试重点说明](#测试重点说明)
10. [测试用例统计](#测试用例统计)

---

## 测试概述

### API分类统计

| 模块分类 | 子模块数 | API数量 | 测试优先级 | 测试用例估计 |
|----------|----------|---------|-----------|--------------|
| **基础数据** | 11个 | 56个 | P0/P1/P2 | 340个 |
| **生产管理** | 3个 | 22个 | P0 | 130个 |
| **车间执行** | 3个 | 34个 | P0 | 200个 |
| **质量管理** | 3个 | 18个 | P1 | 110个 |
| **工艺路径** | 1个 | 8个 | P2 | 50个 |
| **系统管理** | 1个 | 36个 | P2 | 100个 |
| **用户认证** | 1个 | 5个 | P0 | 30个 |
| **总计** | **23个** | **179个** | - | **960个** |

### 测试分类

| 测试类型 | 说明 | API覆盖率 |
|----------|------|-----------|
| **功能测试** | 验证API功能正确性 | 100% |
| **参数校验** | 验证参数格式和范围 | 100% |
| **边界测试** | 验证边界条件处理 | 80% |
| **异常测试** | 验证错误处理机制 | 100% |
| **权限测试** | 验证权限控制 | 100% |
| **性能测试** | 验证响应时间 | 60% |

---

## 基础数据模块

### 1. 物料管理 (MaterialController) - P0

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/material/page` | GET | P0 | 分页、筛选、排序 |
| 2 | `/api/material/{id}` | GET | P0 | 数据完整性 |
| 3 | `/api/material` | POST | P0 | 参数校验、业务规则 |
| 4 | `/api/material` | PUT | P0 | 数据更新、版本控制 |
| 5 | `/api/material` | DELETE | P0 | 批量删除、逻辑删除 |
| 6 | `/api/material/status` | PUT | P0 | 批量状态更新 |
| 7 | `/api/material/export` | GET | P1 | 数据导出 |
| 8 | `/api/material/import` | POST | P1 | 数据导入、校验 |

#### 测试用例

##### MC-001: 分页查询物料

```http
GET /api/material/page?page=1&size=10&code=&name=&status=
```

**测试场景**:
- [ ] 正常分页查询
- [ ] 第一页/最后一页边界
- [ ] 分页大小为空/无效值
- [ ] 跨页查询
- [ ] 总数为0的情况

**测试数据**:
```json
{
  "code": "RM001",
  "name": "天然乳胶",
  "categoryId": 1,
  "spec": "氨含量≥60%",
  "unitId": 1,
  "type": "原材料",
  "status": 1
}
```

**预期结果**:
- 状态码: 200
- 返回分页信息正确
- 数据格式符合定义

##### MC-003: 新增物料

```http
POST /api/material
Content-Type: application/json

{
  "code": "TEST001",
  "name": "测试物料",
  "categoryId": 1,
  "spec": "测试规格",
  "unitId": 1,
  "type": "原材料",
  "status": 1
}
```

**测试场景**:
- [ ] 正常新增
- [ ] 物料编码已存在
- [ ] 物料编码为空/超长
- [ ] 必填字段缺失
- [ ] 物料分类不存在
- [ ] 计量单位不存在
- [ ] SQL注入测试
- [ ] XSS测试

**预期结果**:
- 成功: 状态码200，数据保存成功
- 失败: 状态码400/500，返回具体错误信息

##### MC-005: 批量删除物料

```http
DELETE /api/material
Content-Type: application/json

[100, 101, 102]
```

**测试场景**:
- [ ] 正常批量删除
- [ ] 删除已使用的物料
- [ ] 删除不存在的物料
- [ ] 空数组
- [ ] 超大批量（100+）
- [ ] 权限验证

**预期结果**:
- 成功: 执行逻辑删除
- 失败: 返回具体失败原因

---

### 2. BOM管理 (BomController) - P0

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/bom/page` | GET | P0 | 分页、版本查询 |
| 2 | `/api/bom/{id}` | GET | P0 | 完整BOM结构 |
| 3 | `/api/bom` | POST | P0 | BOM创建、明细行 |
| 4 | `/api/bom` | PUT | P0 | BOM更新、版本控制 |
| 5 | `/api/bom` | DELETE | P0 | 批量删除 |
| 6 | `/api/bom/{id}/review` | PUT | P0 | 审核流程 |
| 7 | `/api/bom/{id}/approve` | PUT | P0 | 批准流程 |
| 8 | `/api/bom/{id}/activate` | PUT | P1 | BOM生效 |
| 9 | `/api/bom/{id}/deactivate` | PUT | P1 | BOM失效 |
| 10 | `/api/bom/{id}/copy` | POST | P1 | BOM复制 |

#### 测试重点

**业务流程测试**:
- [ ] 草稿→审核→批准→生效完整流程
- [ ] 状态流转限制
- [ ] 审核人权限验证
- [ ] 批准人权限验证

**边界条件**:
- [ ] BOM版本格式验证
- [ ] BOM明细行数量限制
- [ ] 用料数量范围验证
- [ ] 单位换算验证

---

### 3. 工序管理 (OperationController) - P2

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/operation/page` | GET | P2 | 分页查询 |
| 2 | `/api/operation/{id}` | GET | P2 | 详情查询 |
| 3 | `/api/operation` | POST | P2 | 新增工序 |
| 4 | `/api/operation` | PUT | P2 | 更新工序 |
| 5 | `/api/operation` | DELETE | P2 | 删除工序 |
| 6 | `/api/operation/{id}/move-up` | PUT | P2 | 上移工序 |
| 7 | `/api/operation/{id}/move-down` | PUT | P2 | 下移工序 |

#### 测试重点

**排序逻辑**:
- [ ] 上移到顶部边界
- [ ] 下移到底部边界
- [ ] 单个工序排序
- [ ] 批量移动

---

### 4. 设备档案 (EquipmentController) - P2

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/equipment/page` | GET | P2 | 分页、状态筛选 |
| 2 | `/api/equipment/{id}` | GET | P2 | 设备详情 |
| 3 | `/api/equipment` | POST | P2 | 新增设备 |
| 4 | `/api/equipment` | PUT | P2 | 更新设备 |
| 5 | `/api/equipment` | DELETE | P2 | 删除设备 |
| 6 | `/api/equipment/status` | PUT | P2 | 状态更新 |

---

### 5. 工作中心 (WorkCenterController) - P2

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/work-center/page` | GET | P2 | 分页查询 |
| 2 | `/api/work-center/{id}` | GET | P2 | 详情查询 |
| 3 | `/api/work-center` | POST | P2 | 新增工作中心 |
| 4 | `/api/work-center` | PUT | P2 | 更新工作中心 |
| 5 | `/api/work-center` | DELETE | P2 | 删除工作中心 |
| 6 | `/api/work-center/statistics` | GET | P1 | 统计数据 |

---

### 6. 班组档案 (TeamController) - P2

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/team/page` | GET | P2 | 分页查询 |
| 2 | `/api/team/{id}` | GET | P2 | 详情查询 |
| 3 | `/api/team` | POST | P2 | 新增班组 |
| 4 | `/api/team` | PUT | P2 | 更新班组 |
| 5 | `/api/team` | DELETE | P2 | 删除班组 |

---

### 7. 员工档案 (EmployeeController) - P2

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/employee/page` | GET | P2 | 分页查询 |
| 2 | `/api/employee/{id}` | GET | P2 | 详情查询 |
| 3 | `/api/employee` | POST | P2 | 新增员工 |
| 4 | `/api/employee` | PUT | P2 | 更新员工 |
| 5 | `/api/employee` | DELETE | P2 | 删除员工 |

---

### 8. 质检项目 (QcItemController) - P2

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/qc-item/page` | GET | P2 | 分页查询 |
| 2 | `/api/qc-item/{id}` | GET | P2 | 详情查询 |
| 3 | `/api/qc-item` | POST | P2 | 新增质检项目 |
| 4 | `/api/qc-item` | PUT | P2 | 更新质检项目 |
| 5 | `/api/qc-item` | DELETE | P2 | 删除质检项目 |

---

### 9. 质检方案 (QcSchemeController) - P2

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/qc-scheme/page` | GET | P2 | 分页查询 |
| 2 | `/api/qc-scheme/{id}` | GET | P2 | 详情查询 |
| 3 | `/api/qc-scheme` | POST | P2 | 新增质检方案 |
| 4 | `/api/qc-scheme` | PUT | P2 | 更新质检方案 |
| 5 | `/api/qc-scheme` | DELETE | P2 | 删除质检方案 |

---

### 10. 车间档案 (WorkshopController) - P2

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/workshop/page` | GET | P2 | 分页查询 |
| 2 | `/api/workshop/{id}` | GET | P2 | 详情查询 |
| 3 | `/api/workshop` | POST | P2 | 新增车间 |
| 4 | `/api/workshop` | PUT | P2 | 更新车间 |
| 5 | `/api/workshop` | DELETE | P2 | 删除车间 |
| 6 | `/api/workshop/statistics` | GET | P1 | 统计数据 |

---

### 11. 计量单位 (UnitController) - P2

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/unit/page` | GET | P2 | 分页查询 |
| 2 | `/api/unit/{id}` | GET | P2 | 详情查询 |
| 3 | `/api/unit` | POST | P2 | 新增计量单位 |
| 4 | `/api/unit` | PUT | P2 | 更新计量单位 |
| 5 | `/api/unit` | DELETE | P2 | 删除计量单位 |

---

## 生产管理模块

### 1. 生产订单 (ProductionOrderController) - P0

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/production-order/page` | GET | P0 | 分页、状态筛选 |
| 2 | `/api/production-order/{id}` | GET | P0 | 订单详情 |
| 3 | `/api/production-order` | POST | P0 | 创建订单 |
| 4 | `/api/production-order` | PUT | P0 | 更新订单 |
| 5 | `/api/production-order` | DELETE | P0 | 删除订单 |
| 6 | `/api/production-order/{id}/release` | PUT | P0 | 下达订单 |
| 7 | `/api/production-order/{id}/push-work-order` | POST | P0 | 下推工单 |
| 8 | `/api/production-order/{id}/cancel` | PUT | P1 | 取消订单 |

#### 测试重点

**业务流程**:
- [ ] 草稿→下达→完成流程
- [ ] 订单数量验证
- [ ] 产品BOM存在性验证
- [ ] 下推工单逻辑
- [ ] 订单取消验证

**边界条件**:
- [ ] 订单数量为0/负数
- [ ] 计划日期验证
- [ ] 状态流转限制

---

### 2. 生产工单 (WorkOrderController) - P0

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/work-order/page` | GET | P0 | 分页、状态筛选 |
| 2 | `/api/work-order/{id}` | GET | P0 | 工单详情 |
| 3 | `/api/work-order` | POST | P0 | 创建工单 |
| 4 | `/api/work-order` | PUT | P0 | 更新工单 |
| 5 | `/api/work-order` | DELETE | P0 | 删除工单 |
| 6 | `/api/work-order/{id}/start` | PUT | P0 | 开始工单 |
| 7 | `/api/work-order/{id}/complete` | PUT | P0 | 完成工单 |
| 8 | `/api/work-order/{id}/suspend` | PUT | P1 | 暂停工单 |
| 9 | `/api/work-order/statistics` | GET | P1 | 工单统计 |

#### 测试重点

**工单流程**:
- [ ] 草稿→开始→完成流程
- [ ] 工单开始条件验证
- [ ] 工单完成数据验证
- [ ] 合格率计算
- [ ] 实际工时记录

---

### 3. 生产任务单 (TaskOrderController) - P0

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/task-order/page` | GET | P0 | 分页查询 |
| 2 | `/api/task-order/{id}` | GET | P0 | 任务详情 |
| 3 | `/api/task-order` | POST | P0 | 创建任务 |
| 4 | `/api/task-order` | PUT | P0 | 更新任务 |
| 5 | `/api/task-order` | DELETE | P0 | 删除任务 |
| 6 | `/api/task-order/{id}/assign` | PUT | P0 | 任务分配 |

---

## 车间执行模块

### 1. PAD任务 (PadTaskController) - P0

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/pad-task/page` | GET | P0 | 分页查询 |
| 2 | `/api/pad-task/{id}` | GET | P0 | 任务详情 |
| 3 | `/api/pad-task/{id}/start` | POST | P0 | 开始任务 |
| 4 | `/api/pad-task/{id}/pause` | POST | P0 | 暂停任务 |
| 5 | `/api/pad-task/{id}/resume` | POST | P0 | 恢复任务 |
| 6 | `/api/pad-task/{id}/complete` | POST | P0 | 完成任务 |
| 7 | `/api/pad-task/{id}/record` | POST | P0 | 记录数据 |
| 8 | `/api/pad-task/statistics` | GET | P1 | 统计数据 |

#### 测试重点

**任务流程**:
- [ ] 待执行→执行中→暂停→恢复→完成
- [ ] 任务开始条件验证
- [ ] 操作员权限验证
- [ ] 设备验证
- [ ] 数据记录格式验证
- [ ] 任务完成数量验证

---

### 2. 电子批记录 (EbrRecordController) - P0

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/ebr-record/page` | GET | P0 | 分页查询 |
| 2 | `/api/ebr-record/{id}` | GET | P0 | 批记录详情 |
| 3 | `/api/ebr-record/{id}/start` | POST | P0 | 开始批记录 |
| 4 | `/api/ebr-record/step/{stepId}/start` | POST | P0 | 开始步骤 |
| 5 | `/api/ebr-record/step/{stepId}/complete` | POST | P0 | 完成步骤 |
| 6 | `/api/ebr-record/{id}/complete` | POST | P0 | 完成批记录 |
| 7 | `/api/ebr-record/{id}/print` | GET | P1 | 打印批记录 |

#### 测试重点

**批记录流程**:
- [ ] 开始→步骤执行→完成
- [ ] 步骤顺序验证
- [ ] 步骤必填项验证
- [ ] 电子签名验证
- [ ] 批记录打印

---

### 3. 领料管理 (MaterialIssuanceController) - P0

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/material-issuance/page` | GET | P0 | 分页查询 |
| 2 | `/api/material-issuance/{id}` | GET | P0 | 领料单详情 |
| 3 | `/api/material-issuance` | POST | P0 | 创建领料单 |
| 4 | `/api/material-issuance` | PUT | P0 | 更新领料单 |
| 5 | `/api/material-issuance` | DELETE | P0 | 删除领料单 |
| 6 | `/api/material-issuance/{id}/submit` | POST | P0 | 提交审批 |
| 7 | `/api/material-issuance/{id}/approve` | POST | P0 | 审批通过 |
| 8 | `/api/material-issuance/{id}/reject` | POST | P0 | 审批拒绝 |
| 9 | `/api/material-issuance/{id}/issue` | POST | P0 | 领料 |
| 10 | `/api/material-issuance/statistics` | GET | P1 | 统计数据 |

#### 测试重点

**领料流程**:
- [ ] 草稿→提交→审批→领料
- [ ] 库存验证
- [ ] 审批权限验证
- [ ] 领料数量验证
- [ ] 库存扣减验证

---

## 质量管理模块

### 1. 质检任务 (InspectionTaskController) - P1

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/inspection-task/page` | GET | P1 | 分页查询 |
| 2 | `/api/inspection-task/{id}` | GET | P1 | 任务详情 |
| 3 | `/api/inspection-task` | POST | P1 | 创建质检任务 |
| 4 | `/api/inspection-task/{id}/assign` | POST | P1 | 分配质检员 |
| 5 | `/api/inspection-task/{id}/submit-result` | POST | P0 | 提交结果 |
| 6 | `/api/inspection-task/statistics` | GET | P1 | 统计数据 |

#### 测试重点

**质检流程**:
- [ ] 待分配→已分配→质检中→完成
- [ ] 质检项目完整性验证
- [ ] 质检结果格式验证
- [ ] 合格判定逻辑
- [ ] 不合格品处理

---

### 2. MRB评审 (MrbRecordController) - P1

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/mrb-record/page` | GET | P1 | 分页查询 |
| 2 | `/api/mrb-record/{id}` | GET | P1 | 评审详情 |
| 3 | `/api/mrb-record` | POST | P1 | 创建评审记录 |
| 4 | `/api/mrb-record/{id}/submit-opinion` | POST | P1 | 提交意见 |
| 5 | `/api/mrb-record/{id}/approve` | POST | P1 | 评审批准 |
| 6 | `/api/mrb-record/statistics` | GET | P2 | 统计数据 |

#### 测试重点

**评审流程**:
- [ ] 待评审→评审中→评审完成
- [ ] 评审权限验证
- [ ] 评审意见格式验证
- [ ] 处理方式验证

---

### 3. 质量放行 (QualityReleaseController) - P1

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/quality-release/page` | GET | P1 | 分页查询 |
| 2 | `/api/quality-release/{id}` | GET | P1 | 放行详情 |
| 3 | `/api/quality-release` | POST | P1 | 创建放行申请 |
| 4 | `/api/quality-release/{id}/approve` | POST | P0 | 放行审批 |
| 5 | `/api/quality-release/{id}/generate-certificate` | POST | P1 | 生成证书 |
| 6 | `/api/quality-release/statistics` | GET | P2 | 统计数据 |

#### 测试重点

**放行流程**:
- [ ] 待放行→放行审核→已放行
- [ ] 放行条件验证
- [ ] 质检结果验证
- [ ] 证书生成

---

## 工艺路径模块

### 1. 工艺路径主数据 (ProcessRoutingController) - P2

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/process-routing/page` | GET | P2 | 分页查询 |
| 2 | `/api/process-routing/{id}` | GET | P2 | 路径详情 |
| 3 | `/api/process-routing` | POST | P2 | 创建工艺路径 |
| 4 | `/api/process-routing` | PUT | P2 | 更新工艺路径 |
| 5 | `/api/process-routing` | DELETE | P2 | 删除工艺路径 |
| 6 | `/api/process-routing/{id}/activate` | PUT | P2 | 激活路径 |
| 7 | `/api/process-routing/{id}/deactivate` | PUT | P2 | 停用路径 |
| 8 | `/api/process-routing/{id}/copy` | POST | P2 | 复制路径 |

---

## 系统管理模块

### 1. 权限管理 (PermissionController) - P2

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/sys-permission/tree` | GET | P2 | 权限树 |
| 2 | `/api/sys-permission/page` | GET | P2 | 分页查询 |
| 3 | `/api/sys-permission` | POST | P2 | 新增权限 |
| 4 | `/api/sys-permission` | PUT | P2 | 更新权限 |
| 5 | `/api/sys-permission` | DELETE | P2 | 删除权限 |

#### API列表 - 角色管理

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 6 | `/api/sys-role/page` | GET | P2 | 分页查询 |
| 7 | `/api/sys-role/{id}` | GET | P2 | 角色详情 |
| 8 | `/api/sys-role` | POST | P2 | 新增角色 |
| 9 | `/api/sys-role` | PUT | P2 | 更新角色 |
| 10 | `/api/sys-role` | DELETE | P2 | 删除角色 |
| 11 | `/api/sys-role/{id}/assign-permissions` | POST | P2 | 分配权限 |

#### API列表 - 用户管理

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 12 | `/api/sys-user/page` | GET | P2 | 分页查询 |
| 13 | `/api/sys-user/{id}` | GET | P2 | 用户详情 |
| 14 | `/api/sys-user` | POST | P2 | 新增用户 |
| 15 | `/api/sys-user` | PUT | P2 | 更新用户 |
| 16 | `/api/sys-user` | DELETE | P2 | 删除用户 |
| 17 | `/api/sys-user/{id}/assign-roles` | POST | P2 | 分配角色 |
| 18 | `/api/sys-user/{id}/assign-factories` | POST | P2 | 分配工厂 |

#### API列表 - 组织管理

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 19 | `/api/sys-organization/tree` | GET | P2 | 组织树 |
| 20 | `/api/sys-organization/page` | GET | P2 | 分页查询 |
| 21 | `/api/sys-organization` | POST | P2 | 新增组织 |
| 22 | `/api/sys-organization` | PUT | P2 | 更新组织 |
| 23 | `/api/sys-organization` | DELETE | P2 | 删除组织 |

#### API列表 - 工厂管理

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 24 | `/api/sys-factory/page` | GET | P2 | 分页查询 |
| 25 | `/api/sys-factory/{id}` | GET | P2 | 工厂详情 |
| 26 | `/api/sys-factory` | POST | P2 | 新增工厂 |
| 27 | `/api/sys-factory` | PUT | P2 | 更新工厂 |
| 28 | `/api/sys-factory` | DELETE | P2 | 删除工厂 |
| 29 | `/api/sys-factory/assign-users` | POST | P2 | 分配用户 |

---

## 用户认证模块

### 1. 认证管理 (AuthController) - P0

#### API列表

| 序号 | 端点 | 方法 | 优先级 | 测试重点 |
|------|------|------|--------|----------|
| 1 | `/api/auth/login` | POST | P0 | 登录验证 |
| 2 | `/api/auth/logout` | POST | P0 | 登出 |
| 3 | `/api/auth/refresh-token` | POST | P0 | Token刷新 |
| 4 | `/api/auth/current-user` | GET | P0 | 当前用户信息 |
| 5 | `/api/auth/change-password` | POST | P0 | 修改密码 |

#### 测试重点

**登录流程**:
- [ ] 正确用户名密码
- [ ] 错误用户名密码
- [ ] 用户名/密码为空
- [ ] 账户被锁定
- [ ] 账户未激活
- [ ] Token过期
- [ ] Token刷新

---

## 测试重点说明

### 1. 边界条件测试

#### 测试场景

| 场景 | 测试点 | 示例 |
|------|--------|------|
| **数值边界** | 最小值、最大值、0、负数 | 数量: 0, -1, 999999 |
| **字符串边界** | 空字符串、超长字符串、特殊字符 | 编码: '', 'A'×51, 'SQL' |
| **列表边界** | 空列表、单元素、超大列表 | 批量删除: [], [1], [1..1000] |
| **日期边界** | 过去日期、未来日期、格式错误 | 日期: '1900-01-01', '2099-12-31' |

### 2. 错误处理测试

#### 测试场景

| 场景 | 测试点 | 预期结果 |
|------|--------|----------|
| **参数错误** | 缺少必填参数、参数类型错误 | 400 + 错误信息 |
| **数据不存在** | ID不存在、关联数据不存在 | 404 + 错误信息 |
| **业务规则** | 状态不允许操作、权限不足 | 403/400 + 错误信息 |
| **系统错误** | 数据库连接失败、服务异常 | 500 + 错误信息 |

### 3. 权限控制测试

#### 测试场景

| 场景 | 测试点 | 预期结果 |
|------|--------|----------|
| **未登录访问** | 无Token访问受保护API | 401 + 错误信息 |
| **Token过期** | 使用过期Token | 401 + 错误信息 |
| **权限不足** | 无权限访问资源 | 403 + 错误信息 |
| **跨租户访问** | 访问其他租户数据 | 403 + 错误信息 |

### 4. 数据一致性测试

#### 测试场景

| 场景 | 测试点 | 验证方法 |
|------|--------|----------|
| **事务一致性** | 多表操作失败回滚 | 检查数据库状态 |
| **并发一致性** | 多用户同时更新同一数据 | 检查最终状态 |
| **关联数据** | 删除主表数据，从表处理 | 检查外键约束 |
| **状态一致性** | 多步骤操作的状态同步 | 检查状态机 |

### 5. 性能测试

#### 测试场景

| 场景 | 测试点 | 性能指标 |
|------|--------|----------|
| **响应时间** | API平均响应时间 | < 500ms (P95) |
| **并发测试** | 多用户同时访问 | 支持100+并发 |
| **大数据量** | 查询大量数据 | 1000条 < 2s |
| **压力测试** | 持续高负载 | 不崩溃、不降级 |

---

## 测试用例统计

### 按模块统计

| 模块 | API数量 | 功能测试 | 参数测试 | 边界测试 | 异常测试 | 性能测试 | 合计 |
|------|---------|----------|----------|----------|----------|----------|------|
| 基础数据 | 56 | 168 | 56 | 45 | 56 | 15 | 340 |
| 生产管理 | 22 | 66 | 22 | 20 | 22 | 10 | 140 |
| 车间执行 | 34 | 102 | 34 | 30 | 34 | 10 | 210 |
| 质量管理 | 18 | 54 | 18 | 18 | 18 | 2 | 110 |
| 工艺路径 | 8 | 24 | 8 | 8 | 8 | 2 | 50 |
| 系统管理 | 36 | 72 | 36 | 0 | 36 | 0 | 144 |
| 用户认证 | 5 | 15 | 5 | 5 | 5 | 0 | 30 |
| **总计** | **179** | **501** | **179** | **126** | **179** | **39** | **1024** |

### 按优先级统计

| 优先级 | API数量 | 功能测试 | 参数测试 | 边界测试 | 异常测试 | 性能测试 | 合计 |
|--------|---------|----------|----------|----------|----------|----------|------|
| P0 | 88 | 264 | 88 | 70 | 88 | 30 | 540 |
| P1 | 46 | 138 | 46 | 36 | 46 | 9 | 275 |
| P2 | 45 | 99 | 45 | 20 | 45 | 0 | 209 |
| **总计** | **179** | **501** | **179** | **126** | **179** | **39** | **1024** |

### 测试覆盖率目标

| 测试类型 | 目标覆盖率 | 实际覆盖率 | 状态 |
|----------|-----------|-----------|------|
| 功能测试 | 100% | - | 待执行 |
| 参数测试 | 100% | - | 待执行 |
| 边界测试 | 80% | - | 待执行 |
| 异常测试 | 100% | - | 待执行 |
| 性能测试 | 60% | - | 待执行 |

---

## 附录

### A. 测试用例模板

```markdown
## TC-XXX: [测试用例名称]

**API**: [HTTP方法和端点]
**优先级**: [P0/P1/P2]
**测试类型**: [功能/参数/边界/异常/性能]

### 测试场景

[测试场景描述]

### 测试步骤

1. [步骤1]
2. [步骤2]
3. [步骤3]

### 测试数据

```json
{
  "field1": "value1",
  "field2": "value2"
}
```

### 预期结果

- [ ] 状态码: XXX
- [ ] 返回数据: [具体要求]
- [ ] 数据库状态: [验证点]

### 实际结果

[实际执行结果]

### 测试结果

[ ] 通过
[ ] 失败

### 备注

[备注信息]
```

### B. 测试数据准备脚本

```sql
-- test-data/material-test-data.sql
INSERT INTO material (code, name, category_id, unit_id, status)
VALUES
  ('TEST001', '测试物料1', 1, 1, 1),
  ('TEST002', '测试物料2', 1, 1, 1),
  ('TEST003', '测试物料3', 1, 1, 0);
```

---

**文档历史**

| 版本 | 日期 | 修改人 | 修改内容 |
|------|------|--------|----------|
| v1.0 | 2026-05-03 | 测试团队 | 初始版本 |
