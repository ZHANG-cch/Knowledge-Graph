# 知识图谱系统配置文档

本文档详细说明知识图谱系统的配置选项、参数设置和启动方式，帮助用户更好地配置和使用系统。

## 系统要求

- **Node.js**: 版本12.x或更高
- **操作系统**: Windows, Linux或macOS
- **依赖包**:
  - 标准版启动脚本需要`open`包：`npm install open --save`
  - 简化版启动脚本不需要额外依赖包

## 服务器配置参数

服务器配置参数位于启动脚本中(`startup.js`和`startup-simple.js`)，可根据需要进行修改：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| SERVER_FILE | 'server.js' | 服务器主程序文件名 |
| PORT | 3001 | 服务器监听端口 |
| MAX_RETRY | 10 | 检查服务器就绪的最大尝试次数 |
| RETRY_INTERVAL | 1000 | 检查服务器就绪的间隔(毫秒) |

如需修改这些参数，请编辑启动脚本文件，找到开头的常量定义部分：

```js
// 服务器启动配置
const SERVER_FILE = 'server.js';
const PORT = 3001;
const MAX_RETRY = 10;
const RETRY_INTERVAL = 1000; // 1秒
```

## 启动脚本选择

系统提供两个版本的启动脚本：

### 1. 简化版脚本 (startup-simple.js)

- 不依赖额外的NPM包
- 使用系统命令打开浏览器
- 适合所有环境，特别是无法安装额外依赖的环境
- 命令：`node startup-simple.js`

### 2. 标准版脚本 (startup.js)

- 使用`open`包打开浏览器
- 需先安装依赖：`npm install open --save`
- 如果`open`包不可用，会尝试使用系统命令作为备用方法
- 命令：`node startup.js`

快速启动脚本(`start.bat`和`start.sh`)会自动选择合适的版本，优先使用简化版脚本。

## 端口配置

默认情况下，服务器使用3001端口。如果需要更改端口，请按以下步骤操作：

1. 修改启动脚本中的PORT常量值
2. 修改server.js文件中的相应端口配置
3. 确保防火墙允许新端口的访问

## 数据库配置

知识图谱系统使用Neo4j图数据库，相关配置可在server.js文件中找到。如需修改数据库连接参数，请查找并编辑以下相关配置：

- 数据库URL
- 用户名和密码
- 连接池大小
- 其他Neo4j特定参数

## 环境变量配置

系统支持通过环境变量设置某些配置项。您可以设置以下环境变量：

- `PORT`: 覆盖默认端口设置
- `NODE_ENV`: 设置运行环境(development/production)

设置环境变量的方法：

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

## 浏览器打开配置

启动脚本会尝试打开默认浏览器并访问登录页面。浏览器打开行为可通过以下方式配置：

1. **简化版脚本**：根据操作系统使用不同的系统命令:
   - Windows: `start`命令
   - macOS: `open`命令
   - Linux: 尝试`xdg-open`, `google-chrome`, `firefox`等命令

2. **标准版脚本**：
   - 优先使用`open`包打开浏览器
   - 如失败，退回到与简化版相同的行为

如需禁用自动打开浏览器，可修改启动脚本中的`openLoginPage`或`openBrowser`函数。

## 进程管理

启动脚本启动的服务器进程将在控制台或终端前台运行。如需后台运行，可考虑使用以下工具：

- Windows: 使用任务计划程序或Windows服务
- Linux: 使用`nohup`、`screen`、`tmux`或设置为系统服务
- Node.js工具: `pm2`、`forever`等进程管理器

## 故障排除配置

如遇到启动问题，可检查以下配置项：

1. **端口冲突**：检查端口3001(或自定义端口)是否被占用
   - Windows: `netstat -ano | findstr 3001`
   - Linux/Mac: `lsof -i :3001`

2. **Node.js版本**：确认版本兼容 `node --version`

3. **依赖包安装**：运行 `npm install` 确保所有依赖已安装

4. **权限问题**：确保有足够权限运行脚本和访问文件
   - Linux/Mac: 确保start.sh有执行权限 `chmod +x start.sh`

5. **日志配置**：如需更详细的日志，可修改启动脚本和服务器代码中的日志输出级别

## 自定义配置

您可以通过以下方式自定义系统配置：

1. 创建`config.js`或`config.json`文件存储自定义配置
2. 修改现有启动脚本和服务器代码加载自定义配置
3. 使用环境变量覆盖默认配置

## 安全配置建议

为提高系统安全性，建议进行以下配置：

1. 更改默认端口
2. 设置强密码保护Neo4j数据库
3. 在生产环境中使用HTTPS
4. 限制IP访问范围
5. 定期备份数据

## 更多帮助

如需更多配置帮助，请联系系统管理员或参考项目文档。 