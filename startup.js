const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const openBrowser = require('open');
const http = require('http');

// 服务器启动配置
const SERVER_FILE = 'server.js';
const PORT = 3001;
const MAX_RETRY = 10;
const RETRY_INTERVAL = 1000; // 1秒

/**
 * 启动Node.js服务器
 */
function startServer() {
  console.log('启动后端服务器...');
  
  // 检查server.js文件是否存在
  if (!fs.existsSync(SERVER_FILE)) {
    console.error(`错误: ${SERVER_FILE} 文件不存在!`);
    process.exit(1);
  }
  
  // 启动服务器进程
  const serverProcess = spawn('node', [SERVER_FILE], {
    stdio: 'inherit',
    shell: true,
    detached: false // Windows下设为false以便在控制台显示
  });
  
  // 监听进程事件
  serverProcess.on('error', (err) => {
    console.error('启动服务器时出错:', err);
    process.exit(1);
  });
  
  serverProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`服务器进程已退出，退出码: ${code}`);
      process.exit(code);
    }
  });
  
  console.log(`服务器进程已启动，PID: ${serverProcess.pid}`);
  return serverProcess;
}

/**
 * 等待服务器启动并检查是否可用
 */
async function waitForServer(retries = 0) {
  return new Promise((resolve, reject) => {
    console.log(`检查服务器是否已启动(尝试 ${retries + 1}/${MAX_RETRY})...`);
    
    // 尝试连接服务器
    const req = http.get(`http://localhost:${PORT}/local/test`, (res) => {
      if (res.statusCode === 200) {
        console.log('服务器已成功启动并响应请求');
        resolve(true);
      } else {
        console.log(`服务器返回状态码: ${res.statusCode}，继续等待...`);
        retry(retries, resolve, reject);
      }
    });
    
    req.on('error', (err) => {
      console.log(`服务器尚未就绪: ${err.message}，继续等待...`);
      retry(retries, resolve, reject);
    });
    
    req.end();
  });
  
  // 内部重试函数
  function retry(retries, resolve, reject) {
    if (retries < MAX_RETRY - 1) {
      setTimeout(() => {
        waitForServer(retries + 1).then(resolve).catch(reject);
      }, RETRY_INTERVAL);
    } else {
      reject(new Error('服务器启动超时，请手动检查服务器状态'));
    }
  }
}

/**
 * 启动浏览器并打开登录页面
 */
async function openLoginPage() {
  const loginPageUrl = `http://localhost:${PORT}/login.html`;
  console.log(`正在打开登录页面: ${loginPageUrl}`);
  
  try {
    // 使用正确的函数调用方式
    await openBrowser(loginPageUrl);
    console.log('已成功打开登录页面');
  } catch (err) {
    console.error('通过open包打开浏览器失败，尝试备用方法...');
    
    // 尝试使用备用方法打开浏览器
    try {
      // 根据操作系统使用不同的命令
      let command;
      const args = [];
      
      if (process.platform === 'win32') {
        command = 'start';
        args.push('""', loginPageUrl); // Windows需要空字符串作为标题参数
      } else if (process.platform === 'darwin') {
        command = 'open';
        args.push(loginPageUrl);
      } else {
        // Linux平台尝试多个命令
        const commands = ['xdg-open', 'google-chrome', 'firefox'];
        for (const cmd of commands) {
          try {
            const { execSync } = require('child_process');
            execSync(`which ${cmd}`);
            command = cmd;
            break;
          } catch (e) {
            // 命令不存在，尝试下一个
          }
        }
        
        if (!command) {
          throw new Error('找不到可用的浏览器命令');
        }
        
        args.push(loginPageUrl);
      }
      
      // 执行命令
      if (command) {
        spawn(command, args, { 
          stdio: 'ignore',
          shell: true,
          detached: true
        }).unref();
        console.log('使用系统命令成功打开浏览器');
      }
    } catch (backupErr) {
      console.error('使用备用方法打开浏览器也失败:', backupErr);
      console.log('请手动打开登录页面:', loginPageUrl);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    // 1. 启动服务器
    const serverProcess = startServer();
    
    // 2. 等待服务器启动
    await waitForServer();
    
    // 3. 打开登录页面
    await openLoginPage();
    
    console.log('系统已成功启动!');
    console.log('按 Ctrl+C 关闭服务器和此启动脚本');
    
    // 处理进程结束信号
    process.on('SIGINT', () => {
      console.log('\n正在关闭服务器...');
      
      if (serverProcess && !serverProcess.killed) {
        // 在Windows上有效关闭子进程
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t']);
        } else {
          serverProcess.kill();
        }
      }
      
      console.log('服务器已关闭，退出启动脚本');
      process.exit(0);
    });
  } catch (err) {
    console.error('启动过程出错:', err);
    process.exit(1);
  }
}

// 执行主函数
main(); 