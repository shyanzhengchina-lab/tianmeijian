@echo off
chcp 65001 >nul
echo ========================================
echo MES系统后端启动脚本
echo ========================================
echo.

REM 检查Java版本
echo [1/5] 检查Java环境...
java -version 2>&1 | findstr "17" >nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 需要Java 17才能运行
    echo    当前Java版本:
    java -version
    echo.
    echo    请安装Java 17，参考: INSTALL_JAVA17_GUIDE.md
    pause
    exit /b 1
)
echo ✅ Java 17已安装

REM 检查Maven
echo [2/5] 检查Maven环境...
mvn -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到Maven
    echo    请安装Maven: https://maven.apache.org/download.cgi
    pause
    exit /b 1
)
echo ✅ Maven已安装

REM 检查MySQL
echo [3/5] 检查MySQL服务...
sc query MySQL80 | findstr "RUNNING" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  警告: MySQL服务未运行
    echo    请启动MySQL服务
    pause
)
echo ✅ MySQL服务检查完成

REM 检查端口8080
echo [4/5] 检查端口8080...
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  警告: 端口8080已被占用
    echo    正在尝试停止占用进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a 2>nul
    )
    timeout /t 2 >nul
)
echo ✅ 端口8080可用

REM 启动后端
echo [5/5] 启动MES后端服务...
echo.
echo ========================================
echo 服务信息:
echo   后端地址: http://localhost:8080
echo   前端地址: http://localhost:3000
echo ========================================
echo.
echo 正在启动Spring Boot应用...
echo.

cd backend
mvn spring-boot:run

echo.
echo 后端服务已停止
pause
