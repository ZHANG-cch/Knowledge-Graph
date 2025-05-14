# 知识图谱系统环境配置指南

本文档提供详细的环境配置步骤，帮助您快速设置和运行知识图谱系统。

## 系统要求

- **操作系统**：Windows, Linux或macOS
- **Node.js**：版本12.x或更高
- **图数据库**：Neo4j

## 环境安装步骤

### 1. 安装Node.js

**Windows**:
1. 访问 [Node.js官网](https://nodejs.org/) 下载安装包
2. 运行安装程序，按照向导完成安装
3. 安装完成后，打开命令提示符，输入以下命令确认安装成功：
   ```
   node --version
   npm --version
   ```

**Linux (Ubuntu/Debian)**:
```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**macOS**:
```bash
brew install node
```

### 2. 安装项目依赖

1. 打开终端或命令提示符
2. 导航到项目根目录
3. 运行以下命令安装依赖项：

```bash
npm install
```

如果只需要使用简化版启动脚本，则不需要安装额外依赖。

如果需要使用标准版启动脚本，确保安装`open`包：

```bash
npm install open --save
```

### 3. 配置Neo4j数据库

1. 下载并安装 [Neo4j](https://neo4j.com/download/)
2. 创建一个新数据库或使用现有数据库
3. 记下数据库URL、用户名和密码

### 4. 配置项目

1. 在项目根目录中找到`server.js`文件
2. 修改Neo4j连接配置，更新以下信息：
   - 数据库URL
   - 用户名
   - 密码

```javascript
// 示例Neo4j配置
const neo4jUri = "neo4j://localhost:7687";
const neo4jUser = "neo4j";
const neo4jPassword = "password";
```

3. 如需更改端口设置，请参考CONFIGURATION.md中的说明

### 5. 快速启动

**Windows**:
```
start.bat
```

**Linux/Mac**:
```
chmod +x start.sh
./start.sh
```

或者直接使用Node.js运行启动脚本：

```
node startup-simple.js
```

## 高级配置

### 环境变量

可以使用环境变量覆盖默认配置：

**Windows**:
```
set PORT=4000
set NODE_ENV=production
```

**Linux/Mac**:
```
export PORT=4000
export NODE_ENV=production
```

### NPM脚本

项目定义了以下NPM脚本，可通过`npm run`命令执行：

- `npm start`: 启动服务器
- `npm run start:simple`: 使用简化版启动脚本
- `npm run start:standard`: 使用标准版启动脚本

### 生产环境部署

对于生产环境，建议使用进程管理工具：

```bash
# 安装PM2
npm install pm2 -g

# 使用PM2启动服务
pm2 start server.js
```

## 故障排除

如果遇到启动问题，请参考以下解决方案：

1. **Node.js版本不兼容**：
   - 错误消息: `SyntaxError: Unexpected token`
   - 解决方案: 升级Node.js到12.x或更高版本

2. **依赖项缺失**：
   - 错误消息: `Error: Cannot find module 'xxx'`
   - 解决方案: 运行`npm install`安装所有依赖

3. **端口冲突**：
   - 错误消息: `Error: listen EADDRINUSE: address already in use :::3001`
   - 解决方案: 修改PORT配置或关闭占用端口的程序

4. **Neo4j连接失败**：
   - 错误消息: `Neo4j连接失败`
   - 解决方案: 检查Neo4j服务是否运行，验证连接URL和凭据

5. **`open`包问题**：
   - 错误消息: `TypeError: open is not a function`
   - 解决方案: 安装open包 `npm install open --save` 或使用简化版启动脚本

## 更多资源

- 详细配置选项请参考：`CONFIGURATION.md`
- 启动脚本说明请参考：`README-STARTUP.md`

如需更多帮助，请联系系统管理员。 