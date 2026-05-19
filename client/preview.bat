@echo off
echo Starting Voice Confession Wall Preview...
echo.
echo 正在启动预览服务器...
echo 访问地址: http://localhost:8080
echo.
cd /d "%~dp0"
python -m http.server 8080
pause