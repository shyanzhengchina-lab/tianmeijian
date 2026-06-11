# MES系统后端启动 - Java 17 安装指南

## 📋 当前状态

- ✅ **前端**: 已启动运行在 http://localhost:3000
- ❌ **后端**: 需要Java 17才能启动
- ⚠️ **问题**: 系统现有Java 7，但Spring Boot 3.x需要Java 17+

## 🚀 解决方案 - 安装Java 17

### 方案1: 下载安装Eclipse Temurin (推荐)

#### 步骤1: 下载Java 17
1. 访问官方下载页面: https://adoptium.net/temurin/releases/?version=17
2. 选择版本: **Eclipse Temurin 17 (LTS)**
3. 操作系统: **Windows**
4. 架构: **x64**
5. 类型: **JDK** (不要选JRE)

#### 步骤2: 运行安装程序
```powershell
# 下载文件名类似: OpenJDK17U-jdk_x64_windows_hotspot_17.0.x_x.msi
# 双击运行安装程序，按照向导完成安装
```

#### 步骤3: 配置环境变量

**Windows 10/11:**
1. 右键"此电脑" → 属性 → 高级系统设置 → 环境变量
2. 在"系统变量"中:
   - 新建变量 `JAVA_HOME`
   - 值: `C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot` (根据实际安装路径)
   - 编辑变量 `Path`
   - 添加: `%JAVA_HOME%\bin` (确保在最前面)

**验证安装:**
```cmd
java -version
# 应该显示: openjdk version "17.0.x"
```

### 方案2: 使用包管理器 (如果已安装)

#### Chocolatey:
```powershell
choco install temurin17 -y
```

#### Scoop:
```powershell
scoop install java17-openjdk
```

#### Winget:
```powershell
winget install EclipseAdoptium.Temurin.17.JDK
```

## 🔧 启动后端

安装Java 17后，按以下步骤启动后端:

### 方法1: 使用Maven (推荐)
```cmd
cd C:\NEWMES\deca\backend
mvn spring-boot:run
```

### 方法2: 打包后运行
```cmd
cd C:\NEWMES\deca\backend
mvn clean package
java -jar target/mes-backend-1.0.0.jar
```

### 方法3: 使用IDE
- 如果使用IntelliJ IDEA: 直接运行 `MesApplication.java`
- 如果使用Eclipse: 导入Maven项目后运行主类

## 📊 服务启动验证

启动成功后，检查以下地址:

- **后端健康检查**: http://localhost:8080/actuator/health
- **后端API文档**: http://localhost:8080/swagger-ui.html (如果配置了Swagger)
- **前端访问**: http://localhost:3000

## ⚠️ 常见问题

### 问题1: Java版本仍然显示旧版本
**解决**: 确保新Java的bin路径在Path的最前面，重启命令行

### 问题2: Maven命令未找到
**解决**: 需要安装Maven，参考 https://maven.apache.org/install.html

### 问题3: 端口8080被占用
**解决**:
```cmd
netstat -ano | findstr :8080
taskkill /PID <进程ID> /F
```

### 问题4: 数据库连接失败
**解决**: 检查MySQL服务是否启动，配置文件中的数据库连接信息

## 🎯 快速启动清单

- [ ] 安装Java 17
- [ ] 验证 `java -version` 显示17.x.x
- [ ] 确保MySQL服务运行
- [ ] 运行 `mvn spring-boot:run`
- [ ] 验证 http://localhost:8080 可访问
- [ ] 测试前后端集成

## 📞 需要帮助?

如果遇到问题，请检查:
1. Java版本是否正确
2. Maven是否正常工作
3. MySQL数据库是否运行
4. 端口8080是否被占用

---

**预计安装时间**: 10-15分钟
**后端启动时间**: 1-3分钟
**总计**: 15-20分钟完成全部启动
