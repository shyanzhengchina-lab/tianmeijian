@echo off
chcp 65001 >nul
echo ========================================
echo MES后端启动脚本
echo ========================================
echo.

echo [环境配置]
echo 设置JAVA_HOME: C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot
echo 设置MAVEN_HOME: C:\ProgramData\chocolatey\lib\maven\apache-maven-3.9.15

set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot
set MAVEN_HOME=C:\ProgramData\chocolatey\lib\maven\apache-maven-3.9.15
set PATH=%JAVA_HOME%\bin;%MAVEN_HOME%\bin;%PATH%

echo.
echo [版本检查]
java -version
echo.
echo ========================================
echo 开始启动MES后端...
echo 后端地址: http://localhost:8080/api
echo ========================================
echo.

cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev

echo.
echo 后端服务已停止
pause
