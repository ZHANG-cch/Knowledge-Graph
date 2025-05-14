#!/bin/bash

echo "启动知识图谱系统..."
echo

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
  echo "错误: 未找到Node.js! 请先安装Node.js。"
  echo "可以从 https://nodejs.org 下载安装。"
  read -p "按任意键继续..."
  exit 1
fi

# 优先使用简化版启动脚本
if [ -f startup-simple.js ]; then
  echo "使用简化版启动脚本..."
  node startup-simple.js
  EXIT_CODE=$?
elif [ -f startup.js ]; then
  echo "使用标准版启动脚本..."
  node startup.js
  EXIT_CODE=$?
else
  # 如果两个脚本都不存在，报错
  echo "错误: 未找到启动脚本文件!"
  read -p "按任意键继续..."
  exit 1
fi

# 如果启动脚本运行失败
if [ $EXIT_CODE -ne 0 ]; then
  echo
  echo "系统启动失败，请查看上方错误信息。"
  read -p "按任意键继续..."
  exit $EXIT_CODE
fi

exit 0 