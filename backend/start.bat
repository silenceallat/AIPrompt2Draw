@echo off
echo 启动 AIPrompt2Draw 后端应用...
echo.
echo 正在使用本地配置文件: application-local.yml
echo 如果数据库连接失败，请检查 application-local.yml 中的配置
echo.

cd /d "%~dp0"

echo 启动 Spring Boot 应用...
mvn spring-boot:run

pause