@echo off
chcp 65001 >nul
echo ========================================
echo MES系统状态检查
echo ========================================
echo.

REM 检查Java版本
echo 📦 Java环境:
java -version 2>&1 | findstr /C:"version"
echo.

REM 检查Maven
echo 📦 Maven环境:
mvn -version 2>&1 | findstr /C:"Apache Maven"
echo.

REM 检查Node.js
echo 📦 Node.js环境:
node -version 2>&1
echo.

REM 检查MySQL
echo 🗄️  MySQL服务:
sc query MySQL80 2>nul | findstr "RUNNING"
if %errorlevel% equ 0 (
    echo    ✅ MySQL服务运行中
) else (
    echo    ❌ MySQL服务未运行
)
echo.

REM 检查前端服务
echo 🎨 前端服务 (3000端口):
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ 前端服务运行中 - http://localhost:3000
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
        echo    进程ID: %%a
    )
) else (
    echo    ❌ 前端服务未运行
)
echo.

REM 检查后端服务
echo 🔧 后端服务 (8080端口):
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ 后端服务运行中 - http://localhost:8080
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
        echo    进程ID: %%a
    )
) else (
    echo    ❌ 后端服务未运行 (需要Java 17)
)
echo.

REM 系统总结
echo 📊 系统状态:
echo    前端: [✅ 运行中] 或 [❌ 未运行]
echo    后端: [❌ 需要Java 17]
echo.

if %errorlevel% equ 0 (
    echo ✅ 所有服务正常
) else (
    echo ⚠️  部分服务未运行，请检查以上状态
)

echo ========================================
pause
