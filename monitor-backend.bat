@echo off
chcp 65001 >nul
echo ========================================
echo 后端启动监控脚本
echo ========================================
echo.

echo 正在启动后端监控...
echo 按Ctrl+C停止监控
echo.

:loop
echo [%date% %time%] 检查后端状态...

REM 检查端口8080
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] 后端服务已在8080端口启动！
    echo 可以访问: http://localhost:8080/api
    echo.
    pause
    exit /b 0
)

REM 检查Maven进程
tasklist | findstr /I "java.exe" >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Java进程运行中，正在下载依赖和启动...
) else (
    echo [ERROR] Java进程未运行，启动可能失败
    pause
    exit /b 1
)

timeout /t 5 >nul
goto loop
