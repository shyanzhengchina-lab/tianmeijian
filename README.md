# 迈迪康 MES 系统

医疗器械制造执行系统（Manufacturing Execution System）

## 技术架构

```
┌─────────────────────────────────────────────┐
│               前端 (React + TypeScript)      │
│   React 19 + Ant Design 6 + Axios           │
│   端口：3000                                 │
└──────────────────┬──────────────────────────┘
                   │  HTTP / REST API
┌──────────────────▼──────────────────────────┐
│               后端 (Java Spring Boot)        │
│   Spring Boot 3.2 + MyBatis-Plus            │
│   端口：8080                                 │
└──────────────────┬──────────────────────────┘
                   │  JDBC
┌──────────────────▼──────────────────────────┐
│               数据库 (MySQL 8.0+)            │
│   数据库名：mes_db                           │
└─────────────────────────────────────────────┘
```

## 项目结构

```
webapp/
├── backend/                    # Java Spring Boot 后端
│   ├── pom.xml                # Maven 依赖配置
│   └── src/main/java/com/mdk/mes/
│       ├── MesApplication.java         # 启动类
│       ├── config/                     # 配置类
│       │   ├── CorsConfig.java         # 跨域配置
│       │   ├── MyBatisPlusConfig.java  # 分页插件
│       │   └── GlobalExceptionHandler.java # 全局异常
│       ├── controller/                 # REST 控制器
│       │   ├── AuthController.java     # 认证
│       │   ├── MaterialController.java # 物料档案
│       │   ├── MaterialCategoryController.java # 物料分类
│       │   ├── UnitController.java     # 计量单位
│       │   └── BomController.java      # 物料清单
│       ├── service/                    # 业务逻辑层
│       ├── repository/                 # 数据访问层（MyBatis-Plus Mapper）
│       ├── entity/                     # 数据库实体类
│       ├── dto/                        # 请求参数对象
│       └── common/                     # 公共类（Result、PageResult）
│   └── src/main/resources/
│       ├── application.yml             # 主配置文件
│       ├── application-dev.yml         # 开发环境配置
│       └── sql/init.sql               # 数据库初始化脚本
│
├── src/                        # React 前端源码
│   ├── api/                    # API 调用层
│   │   ├── http.ts             # Axios 封装（统一拦截）
│   │   ├── auth.ts             # 认证接口
│   │   ├── material.ts         # 物料档案接口
│   │   ├── unit.ts             # 计量单位接口
│   │   └── bom.ts              # 物料清单接口
│   ├── components/layout/      # 主布局组件
│   ├── pages/                  # 页面组件
│   │   ├── login/              # 登录页
│   │   ├── dashboard/          # 生产看板
│   │   ├── material/           # 物料档案
│   │   ├── unit/               # 计量单位
│   │   └── bom/                # 物料清单
│   ├── store/                  # Mock 数据（离线演示用）
│   └── types/                  # TypeScript 类型定义
└── package.json                # 前端依赖（含代理配置）
```

## 快速启动

### 1. 数据库初始化

```bash
# 登录 MySQL
mysql -u root -p

# 执行初始化脚本
source /path/to/webapp/backend/src/main/resources/sql/init.sql
```

### 2. 启动后端

```bash
cd webapp/backend

# 修改数据库连接信息
# 编辑 src/main/resources/application-dev.yml

# 编译启动
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 或打包运行
mvn package -DskipTests
java -jar target/mes-backend-1.0.0.jar --spring.profiles.active=dev
```

后端启动后访问：http://localhost:8080/api

### 3. 启动前端

```bash
cd webapp

# 安装依赖（首次）
npm install

# 启动开发服务器（自动代理 /api 到 localhost:8080）
npm start
```

前端访问：http://localhost:3000

> **注意**：前端配置了代理，开发时 `/api/*` 请求自动转发到 `http://localhost:8080`，无需手动配置跨域。

### 4. 登录账号

| 工号 | 姓名 | 密码 | 角色 |
|------|------|------|------|
| E001 | 张伟 | 123456 | 管理员 |
| E002 | 李娜 | 123456 | 质检员 |
| E003 | 王芳 | 123456 | 操作员 |
| E010 | admin | 123456 | 管理员 |

> **离线演示模式**：如果后端未启动，前端会自动降级为 Mock 数据模式，所有数据操作在内存中完成（页面刷新后重置）。

## API 接口文档

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |

### 物料分类

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/material/category/tree | 获取分类树 |
| POST | /api/material/category | 新增分类 |
| PUT  | /api/material/category | 更新分类 |
| DELETE | /api/material/category/{id} | 删除分类 |

### 物料档案

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/material/page | 分页查询（支持categoryId、keyword、type、status过滤） |
| GET  | /api/material/{id} | 根据ID查询 |
| POST | /api/material | 新增物料 |
| PUT  | /api/material | 更新物料 |
| DELETE | /api/material | 批量删除（Body: [id1,id2]） |
| PUT  | /api/material/status | 批量启用/禁用（Body: {ids:[],status:1}） |

### 计量单位

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/unit/groups | 获取所有分组 |
| GET  | /api/unit/page | 分页查询 |
| POST | /api/unit | 新增单位 |
| PUT  | /api/unit | 更新单位 |
| DELETE | /api/unit | 批量删除 |
| PUT  | /api/unit/status | 批量启用/禁用 |

### 物料清单(BOM)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/bom/page | 分页查询 |
| GET  | /api/bom/{id} | 获取BOM详情（含明细） |
| POST | /api/bom | 新增BOM（含明细） |
| PUT  | /api/bom | 更新BOM（含明细） |
| DELETE | /api/bom | 批量删除 |
| PUT  | /api/bom/{id}/review | 审核 |
| PUT  | /api/bom/{id}/approve | 批准 |
| PUT  | /api/bom/{id}/un-review | 撤销审核 |

## 数据库表说明

| 表名 | 说明 |
|------|------|
| material_category | 物料分类（支持无限层级树形） |
| material | 物料档案 |
| unit_group | 计量单位分组 |
| unit | 计量单位 |
| bom | 物料清单主表 |
| bom_detail | 物料清单明细 |
| sys_user | 系统用户 |

所有表均支持**逻辑删除**（`deleted`字段，MyBatis-Plus 自动处理）。

## 生产环境部署

### 前端打包

```bash
cd webapp
npm run build
# 生成 build/ 目录，部署到 Nginx
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    root /var/www/mes/build;
    index index.html;

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # React Router 支持
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 后端 JAR 包

```bash
cd webapp/backend
mvn package -DskipTests
# 复制 JAR 到服务器
scp target/mes-backend-1.0.0.jar server:/opt/mes/

# 在服务器上启动
java -jar /opt/mes/mes-backend-1.0.0.jar \
  --spring.datasource.url=jdbc:mysql://localhost:3306/mes_db?... \
  --spring.datasource.username=root \
  --spring.datasource.password=yourpwd \
  --server.port=8080
```
