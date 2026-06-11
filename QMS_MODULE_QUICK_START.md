# 质量管理模块快速启动指南

## 1. 数据库初始化

### 方式一：执行完整初始化脚本（推荐）
```bash
mysql -u root -p < backend/src/main/resources/sql/init.sql
```

### 方式二：单独执行QMS模块脚本
```bash
mysql -u root -p mes_db < backend/src/main/resources/sql/qms_init.sql
```

## 2. 验证数据库表

```sql
-- 查看质量管理模块相关表
USE mes_db;
SHOW TABLES LIKE 'inspection%';
SHOW TABLES LIKE 'mrb%';
SHOW TABLES LIKE 'quality%';
SHOW TABLES LIKE 'release%';

-- 验证初始化数据
SELECT * FROM inspection_item;
```

预期结果：
- 8张表：inspection_item, inspection_task, inspection_result, mrb_record, mrb_review_opinion, mrb_disposition, quality_release, release_certificate
- 10条质检项目初始化数据

## 3. 启动应用

```bash
cd backend
mvn spring-boot:run
```

或使用IDE运行 `MesApplication.java`

## 4. API测试

### 质检工作台模块

#### 4.1 创建质检任务
```bash
POST http://localhost:8080/api/inspection-task
Content-Type: application/json

{
  "taskNo": "IT20260502001",
  "taskType": "进料检验",
  "sourceType": "采购订单",
  "sourceNo": "PO20260502001",
  "materialId": 1,
  "materialCode": "RM001",
  "materialName": "天然乳胶",
  "batchNo": "BATCH20260502001",
  "quantity": 1000,
  "unit": "kg",
  "sampleQuantity": 10,
  "inspectDate": "2026-05-02",
  "inspectorId": 2,
  "inspectorName": "李娜",
  "status": "PENDING"
}
```

#### 4.2 提交检验结果
```bash
POST http://localhost:8080/api/inspection-task/1/submit-results
Content-Type: application/json

[
  {
    "itemId": 1,
    "itemCode": "IT001",
    "itemName": "外观检查",
    "sampleNo": "S001",
    "result": "PASS",
    "remark": "无异常"
  },
  {
    "itemId": 7,
    "itemCode": "IT007",
    "itemName": "蛋白质含量",
    "sampleNo": "S001",
    "actualValue": 8.5,
    "result": "PASS",
    "unit": "ppm",
    "remark": "符合标准"
  }
]
```

#### 4.3 完成质检任务
```bash
POST http://localhost:8080/api/inspection-task/1/complete
```

#### 4.4 分页查询质检任务
```bash
GET http://localhost:8080/api/inspection-task/page?page=1&pageSize=20&status=COMPLETED
```

### MRB评审模块

#### 4.5 创建MRB记录
```bash
POST http://localhost:8080/api/mrb-record
Content-Type: application/json

{
  "mrbNo": "MRB20260502001",
  "taskId": 1,
  "materialId": 1,
  "materialCode": "RM001",
  "materialName": "天然乳胶",
  "batchNo": "BATCH20260502001",
  "quantity": 50,
  "unit": "kg",
  "failureType": "外观缺陷",
  "failureDesc": "发现部分产品有破损",
  "reporterId": 2,
  "reporterName": "李娜",
  "status": "PENDING"
}
```

#### 4.6 提交评审意见
```bash
POST http://localhost:8080/api/mrb-record/1/opinion
Content-Type: application/json

{
  "reviewerId": 1,
  "reviewerName": "张伟",
  "role": "质量",
  "opinion": "建议返工处理",
  "recommendation": "REWORK"
}
```

#### 4.7 提交处理方案
```bash
POST http://localhost:8080/api/mrb-record/1/disposition
Content-Type: application/json

{
  "dispositionType": "REWORK",
  "description": "破损产品进行返工处理",
  "quantity": 50,
  "unit": "kg",
  "result": "SUCCESS"
}
```

#### 4.8 完成评审
```bash
POST http://localhost:8080/api/mrb-record/1/complete?disposition=REWORK&dispositionDesc=已安排返工处理
```

### 质量放行模块

#### 4.9 提交放行申请
```bash
POST http://localhost:8080/api/quality-release/submit
Content-Type: application/json

{
  "releaseNo": "QR20260502001",
  "releaseType": "原材料放行",
  "taskId": 1,
  "materialId": 1,
  "materialCode": "RM001",
  "materialName": "天然乳胶",
  "batchNo": "BATCH20260502001",
  "quantity": 950,
  "unit": "kg",
  "warehouseId": 1,
  "warehouseName": "原料仓",
  "applicantId": 3,
  "applicantName": "王芳",
  "status": "PENDING"
}
```

#### 4.10 审批放行
```bash
POST http://localhost:8080/api/quality-release/1/approve?approverId=1&approverName=张伟&approveRemark=检验合格，同意放行&approved=true
```

#### 4.11 生成放行证书
```bash
POST http://localhost:8080/api/quality-release/1/certificate?certificateType=COA
```

#### 4.12 分页查询放行记录
```bash
GET http://localhost:8080/api/quality-release/page?page=1&pageSize=20&status=APPROVED
```

## 5. 常见问题

### 5.1 数据库连接失败
检查 `application.yml` 中的数据库配置：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mes_db
    username: root
    password: your_password
```

### 5.2 任务编号重复
确保每次创建任务时使用唯一的编号，可以在Service层生成唯一编号：
```java
String taskNo = "IT" + System.currentTimeMillis();
```

### 5.3 状态流转错误
查看每个Service实现类中的状态流转逻辑，确保按照正确的顺序操作：
- 质检任务: PENDING → INSPECTING → COMPLETED
- MRB记录: PENDING → REVIEWING → COMPLETED
- 质量放行: PENDING → APPROVED/REJECTED

## 6. 测试数据

### 质检项目数据（已初始化）
```
IT001 - 外观检查
IT002 - 长度
IT003 - 宽度
IT004 - 厚度
IT005 - 拉伸强度
IT006 - 断裂伸长率
IT007 - 蛋白质含量
IT008 - 微生物限度
IT009 - 包装标识
IT010 - 密封性
```

### 系统用户数据（已初始化）
```
E001 - 张伟（管理员）
E002 - 李娜（质检员）
E003 - 王芳（操作员）
E010 - admin（管理员）
```

## 7. 接口文档完整列表

### 质检工作台 (8个接口)
- GET  `/api/inspection-task/page` - 分页查询
- GET  `/api/inspection-task/{id}` - 根据ID查询
- POST `/api/inspection-task` - 新增任务
- PUT  `/api/inspection-task` - 更新任务
- DELETE `/api/inspection-task` - 删除任务
- POST `/api/inspection-task/{taskId}/submit-results` - 提交检验结果
- POST `/api/inspection-task/{taskId}/complete` - 完成任务
- POST `/api/inspection-task/{taskId}/cancel` - 取消任务

### MRB评审 (9个接口)
- GET  `/api/mrb-record/page` - 分页查询
- GET  `/api/mrb-record/{id}` - 根据ID查询
- POST `/api/mrb-record` - 新增记录
- PUT  `/api/mrb-record` - 更新记录
- DELETE `/api/mrb-record` - 删除记录
- POST `/api/mrb-record/{mrbId}/opinion` - 提交评审意见
- POST `/api/mrb-record/{mrbId}/disposition` - 提交处理方案
- POST `/api/mrb-record/{mrbId}/complete` - 完成评审
- POST `/api/mrb-record/{mrbId}/cancel` - 取消评审

### 质量放行 (7个接口)
- GET  `/api/quality-release/page` - 分页查询
- GET  `/api/quality-release/{id}` - 根据ID查询
- POST `/api/quality-release` - 新增记录
- PUT  `/api/quality-release` - 更新记录
- DELETE `/api/quality-release` - 删除记录
- POST `/api/quality-release/submit` - 提交放行申请
- POST `/api/quality-release/{releaseId}/approve` - 审批放行
- POST `/api/quality-release/{releaseId}/certificate` - 生成证书
- POST `/api/quality-release/{releaseId}/revoke` - 撤销放行

## 8. 开发建议

### 8.1 添加日志
在关键业务逻辑中添加日志：
```java
log.info("质检任务 {} 提交检验结果，共 {} 项", taskId, results.size());
```

### 8.2 添加单元测试
为Service层编写单元测试，覆盖主要业务场景。

### 8.3 添加权限控制
在Controller层添加权限注解：
```java
@PreAuthorize("hasRole('INSPECTOR')")
```

### 8.4 添加缓存
对频繁查询的数据添加Redis缓存。

## 9. 支持与帮助

- 详细开发报告：`QMS_MODULE_DEVELOPMENT_REPORT.md`
- 项目路径：`C:\NEWMES\deca\backend`
- 数据库脚本：`backend/src/main/resources/sql/`

---

**祝使用愉快！**
