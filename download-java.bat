@echo off
chcp 65001 >nul
echo ========================================
echo Java自动下载安装脚本
echo ========================================
echo.

echo 📥 正在下载Java 8 (兼容Spring Boot 2.x)...
echo.

REM 设置下载URL (Java 8 下载链接)
set JAVA_URL=https://download.oracle.com/otn-pub/java/jdk/8u421-b09/3c4b7f726726464c1af4e925a7124488/jdk-8u421-windows-x64.exe
set JAVA_INSTALLER=jdk-8u421-windows-x64.exe

echo 下载地址: %JAVA_URL%
echo 保存文件: %JAVA_INSTALLER%
echo.

REM 使用PowerShell下载
powershell -Command "Invoke-WebRequest -Uri '%JAVA_URL%' -OutFile '%JAVA_INSTALLER%' -UseBasicParsing"

if %errorlevel% neq 0 (
    echo ❌ 下载失败
    echo.
    echo 请尝试以下方法之一:
    echo 1. 手动下载: 访问 https://adoptium.net/temurin/releases/?version=8
    echo 2. 使用包管理器: choco install temurin8 -y
    echo 3. 使用winget: winget install EclipseAdoptium.Temurin.8.JDK
    pause
    exit /b 1
)

echo ✅ 下载完成
echo.

echo 🚀 正在安装Java 8...
echo.

REM 静默安装Java
start /wait "" "%JAVA_INSTALLER%" /s INSTALLDIR="C:\Program Files\Java\jdk1.8.0_421" STATIC=1 AUTO_UPDATE=0 WEB_JAVA=0

if %errorlevel% neq 0 (
    echo ⚠️  自动安装可能未完成，请手动运行安装程序
    echo.
    echo 手动安装步骤:
    echo 1. 双击运行: %JAVA_INSTALLER%
    echo 2. 按照向导完成安装
    echo 3. 设置环境变量:
    echo    JAVA_HOME=C:\Program Files\Java\jdk1.8.0_421
    echo    在Path中添加: %%JAVA_HOME%%\bin
    pause
    exit /b 1
)

echo ✅ Java安装完成
echo.

echo 🔧 正在设置环境变量...
setx JAVA_HOME "C:\Program Files\Java\jdk1.8.0_421" /M
setx PATH "%PATH%;C:\Program Files\Java\jdk1.8.0_421\bin" /M

echo ✅ 环境变量设置完成
echo.

echo 🔍 验证Java安装...
set PATH=%PATH%;C:\Program Files\Java\jdk1.8.0_421\bin
java -version

echo.
echo ========================================
echo ✅ Java安装成功！
echo ========================================
echo.
echo 下一步:
echo 1. 关闭并重新打开命令行
echo 2. 运行: java -version 验证安装
echo 3. 运行: start-backend.bat 启动后端
echo.
pause
