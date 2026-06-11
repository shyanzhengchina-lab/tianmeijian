# MES系统数据库初始化指南

**创建时间**: 2026-05-02
**适用版本**: MySQL 8.0+
**字符集**: utf8mb4

---

## 📋 概述

本指南提供MES系统数据库的完整初始化步骤，包括数据库创建、表结构初始化、初始数据导入等。

---

## 🔧 前置条件

### 1. MySQL服务状态检查

```bash
# 检查MySQL服务是否运行
mysql --version

# 预期输出示例：
# mysql  Ver 9.6.0 for Win64 on x86_64 (MySQL Community Server - GPL)
```

### 2. 获取数据库访问权限

```bash
# 确认有MySQL root用户访问权限
# 需要知道root用户的密码
```

---

## 🚀 快速开始

### 方法一：命令行执行（推荐）

#### 步骤1：登录MySQL

```bash
# 使用root用户登录
mysql -u root -p

# 输入密码后进入MySQL命令行
```

#### 步骤2：创建数据库

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS mes_db
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

-- 验证数据库创建成功
SHOW DATABASES LIKE 'mes_db';

-- 使用数据库
USE mes_db;
```

#### 步骤3：执行初始化脚本

```bash
# 在MySQL命令行外执行
mysql -u root -p mes_db < C:/NEWMES/deca/backend/src/main/resources/sql/init.sql

# 或者在MySQL命令行内执行
source C:/NEWMES/deca/backend/src/main/resources/sql/init.sql;
```

#### 步骤4：验证初始化结果

```sql
-- 查看所有表
SHOW TABLES;

-- 预期输出：42张表
-- material_category, material, unit_group, unit, bom, bom_detail, sys_user,
-- process_routing, routing_step, operation, stage_template, operation_stage_config,
-- production_order, production_order_detail, work_order, work_order_operation, task_order,
-- sys_organization, sys_role, sys_permission, sys_role_permission, sys_user_role,
-- sys_factory, sys_user_factory,
-- pad_task, pad_operation_record, pad_quality_check, pad_material_usage,
-- ebr_record, ebr_step, ebr_equipment_usage, ebr_material_balance,
-- material_issuance, material_issuance_detail,
-- inspection_item, inspection_task, inspection_result,
-- mrb_record, mrb_review_opinion, mrb_disposition,
-- quality_release, release_certificate

-- 查看表结构
DESCRIBE material;

-- 查看初始数据
SELECT COUNT(*) FROM material;
SELECT COUNT(*) FROM unit;
SELECT COUNT(*) FROM sys_user;
```

### 方法二：使用MySQL客户端工具

#### 使用MySQL Workbench

1. 打开MySQL Workbench
2. 连接到MySQL服务器
3. 打开SQL编辑器
4. 执行以下SQL：

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS mes_db
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE mes_db;

-- 然后打开并执行 init.sql 文件内容
```

#### 使用Navicat

1. 连接到MySQL服务器
2. 右键点击连接 → 新建数据库
3. 数据库名：mes_db
4. 字符集：utf8mb4
5. 排序规则：utf8mb4_unicode_ci
6. 打开查询窗口
7. 执行init.sql文件内容

#### 使用phpMyAdmin

1. 登录phpMyAdmin
2. 点击"新建"
3. 数据库名：mes_db
4. 排序规则：utf8mb4_unicode_ci
5. 点击"创建"
6. 选择mes_db数据库
7. 点击"导入"
8. 选择init.sql文件
9. 点击"执行"

---

## 📊 数据库结构说明

### 表分类统计

| 模块 | 表数量 | 表名 |
|------|--------|------|
| **基础数据** | 7张 | material_category, material, unit_group, unit, bom, bom_detail, sys_user |
| **生产管理** | 5张 | production_order, production_order_detail, work_order, work_order_operation, task_order |
| **工艺路径** | 5张 | process_routing, routing_step, operation, stage_template, operation_stage_config |
| **车间执行** | 10张 | pad_task, pad_operation_record, pad_quality_check, pad_material_usage, ebr_record, ebr_step, ebr_equipment_usage, ebr_material_balance, material_issuance, material_issuance_detail |
| **质量管理** | 8张 | inspection_item, inspection_task, inspection_result, mrb_record, mrb_review_opinion, mrb_disposition, quality_release, release_certificate |
| **系统管理** | 7张 | sys_organization, sys_role, sys_permission, sys_role_permission, sys_user_role, sys_factory, sys_user_factory |
| **总计** | **42张** | - |

### 核心表说明

#### 1. 物料管理表

**material (物料档案)**
- 用途：存储所有物料的基本信息
- 关键字段：code, name, category_id, unit_id, type, status
- 索引：code (唯一), category_id, status

**bom (物料清单主表)**
- 用途：存储产品的BOM信息
- 关键字段：code, version, material_id, status
- 索引：code+version (唯一), material_id, status

**bom_detail (BOM明细)**
- 用途：存储BOM的子件信息
- 关键字段：bom_id, material_id, quantity, line_no
- 索引：bom_id, material_id

#### 2. 生产管理表

**production_order (生产订单)**
- 用途：管理生产订单的全生命周期
- 关键字段：order_no, product_id, quantity, status
- 索引：order_no (唯一), product_id, status

**work_order (生产工单)**
- 用途：管理生产工单的执行过程
- 关键字段：work_order_no, production_order_id, status
- 索引：work_order_no (唯一), production_order_id, status

#### 3. 工艺路径表

**process_routing (工艺路径)**
- 用途：管理产品的工艺路径
- 关键字段：routing_code, product_id, version, status
- 索引：routing_code+version (唯一), product_id

**operation (工序)**
- 用途：定义工序信息
- 关键字段：operation_code, operation_name, work_center_id
- 索引：operation_code (唯一), work_center_id

#### 4. 质量管理表

**inspection_task (质检任务)**
- 用途：管理质检任务
- 关键字段：task_no, inspection_type, status
- 索引：task_no (唯一), inspection_type, status

**mrb_record (MRB评审记录)**
- 用途：管理不合格品评审
- 关键字段：record_no, material_id, status
- 索引：record_no (唯一), material_id, status

---

## 🔍 初始数据说明

### 预置数据统计

| 表名 | 初始数据量 | 数据说明 |
|------|-----------|----------|
| sys_user | 4条 | 系统初始用户 |
| unit_group | 12条 | 计量单位分组 |
| unit | 15条 | 计量单位 |
| material_category | 11条 | 物料分类 |
| material | 11条 | 物料档案 |
| bom | 3条 | BOM数据 |
| bom_detail | 8条 | BOM明细 |
| stage_template | 9条 | 阶段模板 |

### 初始用户账号

```sql
-- 查看初始用户
SELECT employee_id, username, role FROM sys_user;

-- 预期输出：
-- +-------------+-----------+-----------+
-- | employee_id | username  | role      |
-- +-------------+-----------+-----------+
-- | E001        | 张伟      | 管理员    |
-- | E002        | 李娜      | 质检员    |
-- | E003        | 王芳      | 操作员    |
-- | E010        | admin     | 管理员    |
-- +-------------+-----------+-----------+
```

**默认密码**: 123456（生产环境请立即修改）

---

## ⚙️ 配置文件更新

### 更新application.yml

```yaml
# backend/src/main/resources/application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mes_db?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
    username: root          # 修改为实际的用户名
    password: your_password  # 修改为实际的密码
    driver-class-name: com.mysql.cj.jdbc.Driver
```

### 创建application-dev.yml

```yaml
# backend/src/main/resources/application-dev.yml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mes_db?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: your_password
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      connection-timeout: 30000
      maximum-pool-size: 10
      minimum-idle: 5

mybatis-plus:
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
    map-underscore-to-camel-case: true
  global-config:
    db-config:
      id-type: AUTO
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0

logging:
  level:
    com.mdk.mes: debug
    org.springframework.web: info
```

---

## ✅ 验证步骤

### 1. 表结构验证

```sql
-- 检查表数量
SELECT COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema = 'mes_db';

-- 预期结果：42

-- 检查所有表名
SHOW TABLES;
```

### 2. 数据验证

```sql
-- 检查初始数据
SELECT 'material' AS table_name, COUNT(*) AS count FROM material
UNION ALL
SELECT 'unit', COUNT(*) FROM unit
UNION ALL
SELECT 'bom', COUNT(*) FROM bom
UNION ALL
SELECT 'sys_user', COUNT(*) FROM sys_user;
```

### 3. 索引验证

```sql
-- 检查关键表的索引
SHOW INDEX FROM material;
SHOW INDEX FROM bom;
SHOW INDEX FROM production_order;
```

### 4. 字符集验证

```sql
-- 检查数据库字符集
SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME = 'mes_db';

-- 预期结果：
-- DEFAULT_CHARACTER_SET_NAME: utf8mb4
-- DEFAULT_COLLATION_NAME: utf8mb4_unicode_ci
```

---

## 🔧 故障排除

### 问题1：密码错误

**错误信息**: `ERROR 1045 (28000): Access denied for user 'root'@'localhost'`

**解决方案**:
```bash
# 重置MySQL root密码（需要停止MySQL服务）
# 1. 停止MySQL服务
# 2. 以跳过权限表模式启动MySQL
# 3. 重置密码
# 4. 重启MySQL服务

# 或者联系数据库管理员获取正确的密码
```

### 问题2：字符集问题

**错误信息**: `Character set 'utf8mb4' is not supported`

**解决方案**:
```sql
-- 检查MySQL版本
SELECT VERSION();

-- 确保MySQL版本 >= 5.5.3
-- utf8mb4需要MySQL 5.5.3或更高版本
```

### 问题3：权限不足

**错误信息**: `ERROR 1142 (42000): CREATE DATABASE command denied`

**解决方案**:
```sql
-- 确保用户有创建数据库的权限
-- 联系数据库管理员授予相应权限

GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

### 问题4：表已存在

**错误信息**: `Table 'xxx' already exists`

**解决方案**:
```sql
-- 删除已存在的数据库（谨慎操作）
DROP DATABASE IF EXISTS mes_db;

-- 然后重新创建和初始化
```

---

## 📝 维护建议

### 1. 定期备份

```bash
# 备份数据库
mysqldump -u root -p mes_db > mes_db_backup_$(date +%Y%m%d).sql

# 恢复数据库
mysql -u root -p mes_db < mes_db_backup_20260502.sql
```

### 2. 性能优化

```sql
-- 分析表
ANALYZE TABLE material;

-- 优化表
OPTIMIZE TABLE material;

-- 检查表
CHECK TABLE material;
```

### 3. 监控查询

```sql
-- 查看慢查询
SHOW VARIABLES LIKE 'slow_query%';

-- 启用慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
```

---

## 🚀 下一步

数据库初始化完成后，可以：

1. **启动后端应用**
   ```bash
   cd C:/NEWMES/deca/backend
   mvn spring-boot:run
   ```

2. **测试API接口**
   ```bash
   # 测试物料查询接口
   curl http://localhost:8080/api/material/page

   # 测试用户登录接口
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"employee_id":"E010","password":"123456"}'
   ```

3. **配置前端连接**
   - 更新前端的API配置
   - 进行前后端联调测试

---

**文档版本**: v1.0
**最后更新**: 2026-05-02
**维护人员**: 系统管理员