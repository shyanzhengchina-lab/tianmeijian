@echo off
chcp 65001 >nul
echo ========================================
echo MES系统环境自动配置
echo ========================================
echo.

echo 🔍 检查当前Java环境...
java -version 2>&1 | findstr "version"
if %errorlevel% equ 0 (
    echo ✅ Java已安装
) else (
    echo ❌ Java未安装
    goto install_java
)
goto check_maven

:install_java
echo.
echo 📥 需要安装Java
echo.
echo 推荐使用以下方法之一:
echo.
echo 方法1: 使用包管理器 (最快)
echo   winget install EclipseAdoptium.Temurin.8.JDK
echo   或: choco install temurin8 -y
echo.
echo 方法2: 手动下载
echo   访问: https://adoptium.net/temurin/releases/?version=8
echo   下载: Windows x64 JDK
echo   安装后设置: JAVA_HOME 和 PATH
echo.
echo 方法3: 运行自动下载脚本
echo   运行: download-java.bat
echo.

set /p choice="请选择方法 (1/2/3): "
if "%choice%"=="1" (
    echo 使用winget安装...
    winget install EclipseAdoptium.Temurin.8.JDK
) else if "%choice%"=="2" (
    echo 请手动下载安装Java 8
    pause
    exit /b 0
) else if "%choice%"=="3" (
    echo 运行自动下载脚本...
    call download-java.bat
) else (
    echo 无效选择
    pause
    exit /b 1
)

:check_maven
echo.
echo 🔍 检查Maven环境...
mvn -version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Maven已安装
) else (
    echo ❌ Maven未安装
    goto install_maven
)
goto check_mysql

:install_maven
echo.
echo 📥 需要安装Maven
echo.
echo 推荐方法:
echo 1. 使用包管理器: choco install maven -y
echo 2. 手动下载: https://maven.apache.org/download.cgi
echo.

set /p maven_choice="是否安装Maven? (y/n): "
if "%maven_choice%"=="y" (
    choco install maven -y
    if %errorlevel% neq 0 (
        echo 请手动安装Maven
        pause
        exit /b 1
    )
)

:check_mysql
echo.
echo 🔍 检查MySQL服务...
sc query MySQL80 2>nul | findstr "RUNNING" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MySQL服务运行中
) else (
    echo ⚠️  MySQL服务未运行或未安装
    echo 请确保MySQL已安装并启动
)

echo.
echo ========================================
echo 环境检查完成
echo ========================================
echo.
echo 现在可以启动后端服务:
echo   运行: start-backend.bat
echo.
pause
