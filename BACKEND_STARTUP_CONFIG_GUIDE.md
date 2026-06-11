# 后端服务启动配置指南

## 1. 后端配置检查结果

### 1.1 配置文件状态
- **配置文件位置**: `C:/NEWMES/deca/backend/src/main/resources/application.yml`
- **服务端口**: 8080
- **上下文路径**: `/api`
- **数据库类型**: MySQL 8.0+

### 1.2 数据库配置
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mes_db?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
    username: root
    password: your_password_here
    driver-class-name: com.mysql.cj.jdbc.Driver
```

### 1.3 数据库表结构
- **初始化脚本**: `C:/NEWMES/deca/backend/src/main/resources/sql/init.sql`
- **表数量**: 42张表
- **总行数**: 1,347行
- **字符集**: utf8mb4

### 1.4 项目结构
- **框架**: Spring Boot 3.2.4
- **Java版本**: 17
- **构建工具**: Maven
- **ORM框架**: MyBatis-Plus 3.5.6

## 2. 环境依赖检查

### 2.1 当前环境状态
- ✅ **MySQL**: 已安装 (Ver 9.6.0)
- ❌ **Java**: 未安装或未在PATH中
- ❌ **Maven**: 未安装或未在PATH中

### 2.2 需要安装的依赖

#### Java 17 安装
```bash
# Windows下载地址
https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html

# 或使用 OpenJDK
https://adoptium.net/temurin/releases/?version=17

# 安装后设置环境变量
JAVA_HOME=C:\Program Files\Java\jdk-17
Path=%JAVA_HOME%\bin
```

#### Maven 安装
```bash
# Windows下载地址
https://maven.apache.org/download.cgi

# 下载后解压到: C:\Program Files\Apache\Maven

# 设置环境变量
MAVEN_HOME=C:\Program Files\Apache\Maven
Path=%MAVEN_HOME%\bin
```

## 3. 数据库配置步骤

### 3.1 配置MySQL密码
1. **方法一：修改application.yml**
```yaml
# 编辑 application.yml
spring:
  datasource:
    password: your_actual_password
```

2. **方法二：设置MySQL root密码（如果未设置）**
```sql
-- 在MySQL命令行中执行
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_password';
FLUSH PRIVILEGES;
```

### 3.2 初始化数据库
```bash
# 执行初始化脚本
mysql -u root -p < C:/NEWMES/deca/backend/src/main/resources/sql/init.sql
```

### 3.3 验证数据库创建
```bash
mysql -u root -p
# 进入MySQL后执行
USE mes_db;
SHOW TABLES;
-- 应该显示42张表
```

## 4. 后端服务启动步骤

### 4.1 编译项目
```bash
cd C:/NEWMES/deca/backend
mvn clean install
```

### 4.2 启动服务
```bash
# 方法一：使用Maven
mvn spring-boot:run

# 方法二：使用jar文件（编译后）
java -jar target/mes-backend-1.0.0.jar

# 方法三：在IDE中运行
# 运行 MesApplication.main() 方法
```

### 4.3 验证服务启动
```bash
# 检查健康检查接口
curl http://localhost:8080/api/actuator/health

# 或在浏览器中访问
http://localhost:8080/api/actuator/health
```

## 5. API接口验证

### 5.1 主要API端点
- **基础数据管理**:
  - 物料: `GET /api/materials`
  - 单位: `GET /api/units`
  - 车间: `GET /api/workshops`
  - 工作中心: `GET /api/workcenters`

### 5.2 测试API
```bash
# 测试物料接口
curl http://localhost:8080/api/materials

# 测试单位接口
curl http://localhost:8080/api/units

# 测试车间接口
curl http://localhost:8080/api/workshops
```

## 6. 常见问题解决

### 6.1 数据库连接失败
**错误**: `Access denied for user 'root'@'localhost'`

**解决方案**:
1. 检查MySQL密码配置
2. 确认MySQL服务正在运行
3. 验证数据库权限

### 6.2 端口冲突
**错误**: `Port 8080 was already in use`

**解决方案**:
```yaml
# 修改 application.yml 中的端口
server:
  port: 8081  # 或其他可用端口
```

### 6.3 找不到Java命令
**解决方案**:
1. 安装Java 17
2. 配置JAVA_HOME环境变量
3. 将Java bin目录添加到PATH

### 6.4 Maven编译失败
**解决方案**:
1. 检查Maven是否正确安装
2. 验证网络连接（需要下载依赖）
3. 清理Maven缓存: `mvn clean`

## 7. 日志查看

### 7.1 应用日志
- **位置**: 控制台输出
- **日志级别**: DEBUG (com.mdk.mes包)
- **SQL日志**: 已启用MyBatis-Plus SQL日志

### 7.2 常用日志查看
```bash
# 启动时查看完整日志
mvn spring-boot:run

# 重定向日志到文件
mvn spring-boot:run > backend.log 2>&1
```

## 8. 完整启动流程

### 步骤1: 环境准备
1. 安装Java 17
2. 安装Maven 3.x
3. 确认MySQL服务运行

### 步骤2: 数据库配置
1. 配置MySQL root密码
2. 执行数据库初始化脚本
3. 验证42张表创建成功

### 步骤3: 应用配置
1. 更新application.yml中的数据库密码
2. 确认端口配置（8080）
3. 检查其他配置项

### 步骤4: 编译启动
1. 进入backend目录
2. 执行Maven编译
3. 启动Spring Boot应用

### 步骤5: 验证测试
1. 检查启动日志无错误
2. 访问健康检查接口
3. 测试主要API接口

## 9. 当前状态总结

### 已完成
- ✅ 后端代码结构完整
- ✅ 配置文件存在且格式正确
- ✅ 数据库初始化脚本完整（42张表）
- ✅ MySQL服务已安装

### 待完成
- ❌ Java 17安装和配置
- ❌ Maven安装和配置
- ❌ MySQL密码配置
- ❌ 数据库初始化执行
- ❌ 后端服务编译启动

### 下一步行动
1. 安装Java 17和Maven
2. 配置MySQL密码
3. 初始化数据库
4. 启动后端服务
5. 进行API接口测试

## 10. 联系信息
如有问题，请参考项目文档或联系开发团队。
