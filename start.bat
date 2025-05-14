@echo off
:: 设置中文编码
chcp 65001 >nul
:: 设置终端颜色
color 0A

echo 知识图谱系统 - 服务器启动脚本
echo ==============================================
echo.

:: 检查Node.js是否安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo 错误: 未找到Node.js! 请先安装Node.js。
  echo 可以从 https://nodejs.org 下载安装。
  pause
  exit /b 1
)

echo 请选择启动方式:
echo 1. 启动服务器
echo 2. 退出
echo.

set /p choice="请输入选择 (1-2): "

if "%choice%"=="1" (
  :: 优先使用简化版启动脚本
  if exist startup-simple.js (
    echo 使用简化版启动脚本...
    node startup-simple.js
    goto check_error
  )

  :: 如果简化版不存在，检查标准版启动脚本
  if exist startup.js (
    echo 使用标准版启动脚本...
    node startup.js
    goto check_error
  )

  :: 如果两个脚本都不存在，报错
  echo 错误: 未找到启动脚本文件!
  pause
  exit /b 1
) else if "%choice%"=="2" (
  echo 已取消启动。
  pause
  exit /b 0
) else (
  echo 无效的选择！
  pause
  exit /b 1
)

:check_error
:: 如果启动脚本运行失败
if %ERRORLEVEL% neq 0 (
  echo.
  echo 系统启动失败，请查看上方错误信息。
  pause
  exit /b %ERRORLEVEL%
)

exit /b 0 