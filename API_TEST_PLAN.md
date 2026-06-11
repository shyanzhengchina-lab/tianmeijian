# MES系统API接口测试计划

**创建时间**: 2026-05-02
**测试范围**: 178个RESTful API接口
**测试类型**: 功能测试、集成测试、性能测试

---

## 📋 测试概述

### 测试目标

1. **功能完整性** - 验证所有API接口的功能正确性
2. **数据一致性** - 确保数据库操作的正确性
3. **异常处理** - 验证错误处理机制的完善性
4. **性能指标** - 确保API响应时间符合要求

### 测试范围

| 模块 | Controller | API数量 | 测试优先级 |
|------|-----------|---------|-----------|
| 基础数据 | 5个 | 35个 | P0 |
| 生产管理 | 3个 | 26个 | P0 |
| 工艺路径 | 3个 | 23个 | P1 |
| 车间执行 | 3个 | 44个 | P0 |
| 质量管理 | 3个 | 24个 | P1 |
| 系统管理 | 4个 | 36个 | P2 |
| **总计** | **21个** | **188个** | - |

---

## 🧪 测试用例设计

### 1. 基础数据模块测试 (35个API)

#### 1.1 物料管理 (MaterialController)

**测试用例 MC-001: 分页查询物料**
```http
GET /api/material/page?page=1&size=10&code=&name=&status=
```

**预期结果**:
- 状态码: 200
- 返回格式: `Result<PageResult<Material>>`
- 数据验证: 分页信息正确，数据列表不为空

**测试用例 MC-002: 根据ID查询物料**
```http
GET /api/material/1
```

**预期结果**:
- 状态码: 200
- 返回格式: `Result<Material>`
- 数据验证: 物料ID为1的完整信息

**测试用例 MC-003: 新增物料**
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

**预期结果**:
- 状态码: 200
- 返回格式: `Result<Void>`
- 数据验证: 数据库中新增该物料

**测试用例 MC-004: 更新物料**
```http
PUT /api/material
Content-Type: application/json

{
  "id": 1,
  "code": "RM001",
  "name": "天然乳胶（更新）",
  "categoryId": 6,
  "spec": "氨含量≥60%",
  "unitId": 8,
  "type": "原材料",
  "status": 1
}
```

**预期结果**:
- 状态码: 200
- 返回格式: `Result<Void>`
- 数据验证: 物料信息已更新

**测试用例 MC-005: 批量删除物料**
```http
DELETE /api/material
Content-Type: application/json

[100, 101, 102]
```

**预期结果**:
- 状态码: 200
- 返回格式: `Result<Void>`
- 数据验证: 指定物料已被逻辑删除

**测试用例 MC-006: 批量更新物料状态**
```http
PUT /api/material/status
Content-Type: application/json

{
  "ids": [1, 2, 3],
  "status": 0
}
```

**预期结果**:
- 状态码: 200
- 返回格式: `Result<Void>`
- 数据验证: 指定物料状态已更新

#### 1.2 BOM管理 (BomController)

**测试用例 BC-001: 分页查询BOM**
```http
GET /api/bom/page?page=1&size=10&code=&materialName=&status=
```

**测试用例 BC-002: 获取BOM详情**
```http
GET /api/bom/1
```

**测试用例 BC-003: 新增BOM**
```http
POST /api/bom
Content-Type: application/json

{
  "code": "FG005",
  "version": "1.00",
  "bomType": "主生产",
  "status": "DRAFT",
  "materialId": 7,
  "materialCode": "FG005",
  "materialName": "测试产品",
  "quantity": 1.0,
  "unitId": 12,
  "unitName": "个"
}
```

**测试用例 BC-004: 审核BOM**
```http
PUT /api/bom/1/review
Content-Type: application/json

{
  "reviewer": "张伟"
}
```

**测试用例 BC-005: 批准BOM**
```http
PUT /api/bom/1/approve
Content-Type: application/json

{
  "approver": "李娜"
}
```

### 2. 生产管理模块测试 (26个API)

#### 2.1 生产订单 (ProductionOrderController)

**测试用例 POC-001: 分页查询生产订单**
```http
GET /api/production-order/page?page=1&size=10&orderNo=&productName=&status=
```

**测试用例 POC-002: 创建生产订单**
```http
POST /api/production-order
Content-Type: application/json

{
  "orderNo": "PO20260502001",
  "productId": 4,
  "productName": "医用手套 S号",
  "quantity": 10000,
  "unitId": 12,
  "planStartDate": "2026-05-05",
  "planEndDate": "2026-05-10",
  "status": "DRAFT"
}
```

**测试用例 POC-003: 下达生产订单**
```http
PUT /api/production-order/1/release
```

**测试用例 POC-004: 下推生产工单**
```http
POST /api/production-order/1/push-work-order
```

#### 2.2 生产工单 (WorkOrderController)

**测试用例 WOC-001: 分页查询生产工单**
```http
GET /api/work-order/page?page=1&size=10&workOrderNo=&status=
```

**测试用例 WOC-002: 创建生产工单**
```http
POST /api/work-order
Content-Type: application/json

{
  "workOrderNo": "WO20260502001",
  "productionOrderId": 1,
  "productId": 4,
  "productName": "医用手套 S号",
  "quantity": 5000,
  "status": "DRAFT"
}
```

**测试用例 WOC-003: 开始工单**
```http
PUT /api/work-order/1/start
```

**测试用例 WOC-004: 完成工单**
```http
PUT /api/work-order/1/complete
Content-Type: application/json

{
  "actualQuantity": 4800,
  "qualifiedQuantity": 4750,
  "actualHours": 8
}
```

### 3. 工艺路径模块测试 (23个API)

#### 3.1 工艺路径 (ProcessRoutingController)

**测试用例 PRC-001: 分页查询工艺路径**
```http
GET /api/process-routing/page?page=1&size=10&routingCode=&productName=&status=
```

**测试用例 PRC-002: 创建工艺路径**
```http
POST /api/process-routing
Content-Type: application/json

{
  "routingCode": "RT-GLV-S-001",
  "productId": 4,
  "productModel": "GLV-S",
  "productName": "医用手套 S号",
  "version": "V1.0",
  "isDefault": 1,
  "status": "ACTIVE"
}
```

**测试用例 PRC-003: 复制工艺路径**
```http
POST /api/process-routing/1/copy
```

#### 3.2 工序管理 (OperationController)

**测试用例 OPC-001: 分页查询工序**
```http
GET /api/operation/page?page=1&size=10&operationCode=&operationName=
```

**测试用例 OPC-002: 上移工序**
```http
PUT /api/operation/1/move-up
```

**测试用例 OPC-003: 下移工序**
```http
PUT /api/operation/1/move-down
```

### 4. 车间执行模块测试 (44个API)

#### 4.1 PAD任务 (PadTaskController)

**测试用例 PTC-001: 分页查询PAD任务**
```http
GET /api/pad-task/page?page=1&size=10&taskNo=&status=
```

**测试用例 PTC-002: 开始任务**
```http
POST /api/pad-task/1/start
Content-Type: application/json

{
  "operatorId": "E003",
  "operatorName": "王芳",
  "equipmentId": 1,
  "equipmentName": "设备001"
}
```

**测试用例 PTC-003: 暂停任务**
```http
POST /api/pad-task/1/pause
Content-Type: application/json

{
  "reason": "设备维护"
}
```

**测试用例 PTC-004: 完成任务**
```http
POST /api/pad-task/1/complete
Content-Type: application/json

{
  "actualQuantity": 500,
  "qualifiedQuantity": 495,
  "operatorId": "E003",
  "operatorName": "王芳"
}
```

#### 4.2 电子批记录 (EbrRecordController)

**测试用例 ERC-001: 分页查询批记录**
```http
GET /api/ebr-record/page?page=1&size=10&batchNo=&status=
```

**测试用例 ERC-002: 开始批记录**
```http
POST /api/ebr-record/1/start
```

**测试用例 ERC-003: 完成步骤**
```http
POST /api/ebr-record/step/1/complete
Content-Type: application/json

{
  "operatorId": "E003",
  "operatorName": "王芳",
  "actualData": "{\"temperature\": 25.5, \"humidity\": 60}"
}
```

#### 4.3 领料管理 (MaterialIssuanceController)

**测试用例 MIC-001: 分页查询领料单**
```http
GET /api/material-issuance/page?page=1&size=10&issuanceNo=&status=
```

**测试用例 MIC-002: 审批领料单**
```http
POST /api/material-issuance/1/approve
Content-Type: application/json

{
  "approverId": "E002",
  "approverName": "李娜",
  "approvalOpinion": "同意发料"
}
```

**测试用例 MIC-003: 领料**
```http
POST /api/material-issuance/1/issue
Content-Type: application/json

{
  "operatorId": "E003",
  "operatorName": "王芳"
}
```

### 5. 质量管理模块测试 (24个API)

#### 5.1 质检任务 (InspectionTaskController)

**测试用例 ITC-001: 分页查询质检任务**
```http
GET /api/inspection-task/page?page=1&size=10&taskNo=&inspectionType=&status=
```

**测试用例 ITC-002: 录入质检结果**
```http
POST /api/inspection-task/1/submit-result
Content-Type: application/json

{
  "inspectorId": "E002",
  "inspectorName": "李娜",
  "qualified": 1,
  "qualifiedQuantity": 495,
  "unqualifiedQuantity": 5,
  "inspectionItems": [
    {
      "itemId": 1,
      "itemName": "尺寸检测",
      "actualValue": "S",
      "qualified": 1,
      "remark": "符合标准"
    }
  ]
}
```

#### 5.2 MRB评审 (MrbRecordController)

**测试用例 MRC-001: 分页查询MRB记录**
```http
GET /api/mrb-record/page?page=1&size=10&recordNo=&status=
```

**测试用例 MRC-002: 提交评审意见**
```http
POST /api/mrb-record/1/submit-opinion
Content-Type: application/json

{
  "reviewerId": "E001",
  "reviewerName": "张伟",
  "opinion": "建议返工处理",
  "disposition": "REWORK"
}
```

#### 5.3 质量放行 (QualityReleaseController)

**测试用例 QRC-001: 分页查询质量放行**
```http
GET /api/quality-release/page?page=1&size=10&batchNo=&status=
```

**测试用例 QRC-002: 放行审批**
```http
POST /api/quality-release/1/approve
Content-Type: application/json

{
  "approverId": "E001",
  "approverName": "张伟",
  "certificateNo": "CERT20260502001"
}
```

### 6. 系统管理模块测试 (36个API)

#### 6.1 组织架构 (SysOrganizationController)

**测试用例 SOC-001: 查询组织树**
```http
GET /api/sys-organization/tree
```

**测试用例 SOC-002: 创建组织节点**
```http
POST /api/sys-organization
Content-Type: application/json

{
  "parentId": 0,
  "code": "ORG001",
  "name": "迈迪康制造",
  "sortNo": 1,
  "status": 1
}
```

#### 6.2 角色管理 (SysRoleController)

**测试用例 SRC-001: 分页查询角色**
```http
GET /api/sys-role/page?page=1&size=10&roleName=&status=
```

**测试用例 SRC-002: 分配权限**
```http
POST /api/sys-role/1/assign-permissions
Content-Type: application/json

{
  "permissionIds": [1, 2, 3, 4, 5]
}
```

#### 6.3 权限管理 (SysPermissionController)

**测试用例 SPC-001: 查询权限树**
```http
GET /api/sys-permission/tree
```

#### 6.4 工厂管理 (SysFactoryController)

**测试用例 SFC-001: 分页查询工厂**
```http
GET /api/sys-factory/page?page=1&size=10&factoryName=&status=
```

**测试用例 SFC-002: 为用户分配工厂**
```http
POST /api/sys-factory/assign-users
Content-Type: application/json

{
  "factoryId": 1,
  "userIds": ["E001", "E002", "E003"]
}
```

---

## 🎯 测试执行计划

### 阶段1：基础功能测试 (第1-2天)

**目标**: 验证基础CRUD功能

| 优先级 | 模块 | API数量 | 预计时间 |
|--------|------|---------|----------|
| P0 | 物料管理 | 8个 | 2小时 |
| P0 | BOM管理 | 7个 | 2小时 |
| P0 | 生产订单 | 8个 | 3小时 |
| P0 | 生产工单 | 8个 | 3小时 |
| P0 | PAD任务 | 10个 | 4小时 |

### 阶段2：业务流程测试 (第3-4天)

**目标**: 验证完整业务流程

| 业务流程 | 涉及API | 预计时间 |
|----------|---------|----------|
| 生产订单→工单→任务 | 15个 | 3小时 |
| 领料申请→审批→发料 | 12个 | 2小时 |
| 质检任务→结果录入 | 10个 | 2小时 |
| 批记录→步骤执行 | 15个 | 3小时 |

### 阶段3：异常处理测试 (第5天)

**目标**: 验证异常处理机制

| 测试类型 | 测试数量 | 预计时间 |
|----------|----------|----------|
| 参数校验 | 20个 | 2小时 |
| 权限验证 | 15个 | 2小时 |
| 数据不存在 | 10个 | 1小时 |
| 业务规则 | 15个 | 2小时 |

### 阶段4：性能测试 (第6天)

**目标**: 验证性能指标

| 测试类型 | 性能指标 | 预计时间 |
|----------|----------|----------|
| 响应时间 | < 500ms | 2小时 |
| 并发测试 | 100用户 | 2小时 |
| 大数据量 | 1000条记录 | 2小时 |

---

## 📊 测试报告模板

### 测试执行概况

| 项目 | 数值 |
|------|------|
| 测试用例总数 | 188个 |
| 执行用例数 | ___个 |
| 通过用例数 | ___个 |
| 失败用例数 | ___个 |
| 通过率 | ___% |

### 模块测试结果

| 模块 | API数量 | 通过 | 失败 | 通过率 |
|------|---------|------|------|--------|
| 基础数据 | 35个 | | | |
| 生产管理 | 26个 | | | |
| 工艺路径 | 23个 | | | |
| 车间执行 | 44个 | | | |
| 质量管理 | 24个 | | | |
| 系统管理 | 36个 | | | |

### 性能测试结果

| API接口 | 平均响应时间 | 最大响应时间 | 是否达标 |
|----------|--------------|--------------|----------|
| /api/material/page | | | |
| /api/production-order/page | | | |
| /api/work-order/page | | | |

---

## 🚀 自动化测试建议

### 使用Postman Collection

1. **创建环境变量**
   ```json
   {
     "baseUrl": "http://localhost:8080/api",
     "token": ""
   }
   ```

2. **创建前置脚本**
   ```javascript
   // 自动设置token
   if (pm.environment.get("token")) {
     pm.request.headers.add({
       key: 'Authorization',
       value: 'Bearer ' + pm.environment.get("token")
     });
   }
   ```

3. **创建测试脚本**
   ```javascript
   // 验证响应状态
   pm.test("Status code is 200", function () {
     pm.response.to.have.status(200);
   });

   // 验证响应格式
   pm.test("Response has correct structure", function () {
     var jsonData = pm.response.json();
     pm.expect(jsonData).to.have.property('code');
     pm.expect(jsonData).to.have.property('data');
   });
   ```

### 使用JUnit单元测试

```java
@SpringBootTest
@AutoConfigureMockMvc
public class MaterialControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testGetMaterialPage() throws Exception {
        mockMvc.perform(get("/api/material/page")
                .param("page", "1")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.list").isArray());
    }

    @Test
    public void testCreateMaterial() throws Exception {
        String materialJson = "{\"code\":\"TEST001\",\"name\":\"测试物料\"}";

        mockMvc.perform(post("/api/material")
                .contentType(MediaType.APPLICATION_JSON)
                .content(materialJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }
}
```

---

## 📝 测试注意事项

### 1. 测试数据准备

- 每次测试前准备干净的测试数据
- 测试完成后清理测试数据
- 使用事务回滚保证数据一致性

### 2. 测试环境要求

- MySQL数据库正常运行
- 后端服务启动在8080端口
- 网络连接正常

### 3. 测试执行顺序

1. 先测试基础CRUD接口
2. 再测试业务流程接口
3. 最后测试异常处理和性能

### 4. 测试结果记录

- 详细记录每个测试用例的执行结果
- 失败用例需要记录错误信息和重现步骤
- 生成测试报告并归档

---

**文档版本**: v1.0
**最后更新**: 2026-05-02
**维护人员**: 测试团队