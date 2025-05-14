const express = require('express');
const bcrypt = require('bcrypt');
const Datastore = require('nedb');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const csv = require('csv-parser');
const neo4j = require('neo4j-driver');

// 修复Node.js util 废弃警告
const util = require('util');
// 替换废弃的util.isArray
util.isArray = Array.isArray;
// 替换废弃的util.isDate
util.isDate = function(obj) { return obj instanceof Date; };
// 替换废弃的util.isRegExp
util.isRegExp = function(obj) { return obj instanceof RegExp; };

const app = express();

// 使用固定端口3001
const PORT = 3001;

// Body parsing middleware
app.use(express.json());

// Provide static file service
app.use(express.static(path.join(__dirname)));

// 设置文件上传存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// 创建Neo4j连接
const driver = neo4j.driver(
    'bolt://101.126.136.231:7687',
    neo4j.auth.basic('neo4j', 'knowgneo4j')
);

// 测试Neo4j连接
async function testNeo4jConnection() {
    const session = driver.session();
    try {
        const result = await session.run('RETURN 1 AS num');
        console.log('Neo4j连接成功:', result.records[0].get('num').toNumber());
        return true;
    } catch (error) {
        console.error('Neo4j连接失败:', error);
        return false;
    } finally {
        await session.close();
    }
}

// 应用启动时测试连接
testNeo4jConnection();

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Create user database instance
const userDb = new Datastore({
    filename: path.join(__dirname, 'data', 'users.db'),
    autoload: true
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Database operations wrapper (kept for cleaner async/await)
const dbOperations = {
    findUserByUsername: async (username) => {
        return new Promise((resolve, reject) => {
            userDb.findOne({ username }, (err, user) => {
                if (err) reject(err);
                else resolve(user);
            });
        });
    },
    findUserByEmail: async (email) => {
        return new Promise((resolve, reject) => {
            userDb.findOne({ email }, (err, user) => {
                if (err) reject(err);
                else resolve(user);
            });
        });
    },
    findAllUsers: async (query = {}, projection = {}) => {
        return new Promise((resolve, reject) => {
            userDb.find(query, projection, (err, users) => {
                if (err) reject(err);
                else resolve(users);
            });
        });
    },
    insertUser: async (userData) => {
        return new Promise((resolve, reject) => {
            userDb.insert(userData, (err, newUser) => {
                if (err) reject(err);
                else resolve(newUser);
            });
        });
    },
    updateUser: async (query, update, options = {}) => {
        return new Promise((resolve, reject) => {
            userDb.update(query, update, options, (err, numAffected, affectedDocuments) => {
                if (err) reject(err);
                else resolve({ numAffected, affectedDocuments });
            });
        });
    },
    removeUser: async (query, options = {}) => {
        return new Promise((resolve, reject) => {
            userDb.remove(query, options, (err, numRemoved) => {
                if (err) reject(err);
                else resolve(numRemoved);
            });
        });
    }
};

// Register endpoint - using local DB
app.post('/local/register', async (req, res, next) => {
    console.log('Register request body:', req.body); // Keep log for debugging registration
    try {
        // Removed Joi validation for simplicity in local context
        const { username, email, password, userType = 'user' } = req.body; // Default type to 'user'

        if (!username || !email || !password) {
             return res.status(400).json({ message: 'Missing required fields: username, email, password' });
        }

        // Check username existence
        const existingUser = await dbOperations.findUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists!' });
        }

        // Check email existence
        const existingEmail = await dbOperations.findUserByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already in use!' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user object
        const newUser = {
            username,
            email,
            password: hashedPassword,
            type: userType, // Use provided type or default
            createdAt: new Date()
        };

        const savedUser = await dbOperations.insertUser(newUser);

        // Return new user info (excluding password)
        const newUserInfo = {
            _id: savedUser._id,
            username: savedUser.username,
            email: savedUser.email,
            type: savedUser.type,
            createdAt: savedUser.createdAt
        };

        res.status(201).json({ message: 'Registration successful!', user: newUserInfo });
    } catch (error) {
        console.error("Registration Error:", error); // Log the actual error
        next(error); // Pass to error handler
    }
});

// Login endpoint - using local DB
app.post('/local/login', async (req, res, next) => {
    try {
        // Removed Joi validation
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Missing username or password' });
        }

        const user = await dbOperations.findUserByUsername(username);
        if (!user) {
            return res.status(400).json({ message: 'Username does not exist!' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Incorrect password!' });
        }

        // Removed JWT generation - not needed for local routes
        res.status(200).json({ message: 'Login successful!', userType: user.type }); // Simplified response
    } catch (error) {
         console.error("Login Error:", error);
         next(error);
    }
});

// Get all users - from local DB
app.get('/local/users', async (req, res, next) => {
    try {
        const users = await dbOperations.findAllUsers({}, { password: 0 }); // Exclude password field
        res.status(200).json(users);
    } catch (error) {
        console.error("Get Users Error:", error);
        next(error);
    }
});

// Edit user - update local DB (Kept the endpoint, but removed auth middleware)
/**
 * 处理更新本地用户信息的请求。
 * 该端点允许通过用户 ID 更新用户的用户名和/或邮箱。
 * 
 * @param {Object} req - Express 请求对象，包含用户 ID 和要更新的字段。
 * @param {Object} res - Express 响应对象，用于返回处理结果。
 * @param {Function} next - Express 中间件的 next 函数，用于错误处理。
 */
app.put('/local/users/:id', async (req, res, next) => { // Removed authenticateToken, checkAdmin
    try {
        // 从请求参数中获取用户 ID
        const userId = req.params.id;
        // 从请求体中提取要更新的用户名、邮箱和角色
        const { username, email, userType } = req.body;

        // 检查是否提供了要更新的字段
        if (!username && !email && !userType) {
            // 如果没有提供任何更新字段，返回 400 错误
            return res.status(400).json({ message: 'No update fields provided (username, email or userType)' });
        }

        // 创建一个对象来存储要更新的字段
        const updateFields = {};
        // 如果提供了用户名，将其添加到更新字段对象中
        if (username) updateFields.username = username;
        // 如果提供了邮箱，将其添加到更新字段对象中
        if (email) updateFields.email = email;
        // 如果提供了用户角色，将其添加到更新字段对象中
        if (userType) updateFields.type = userType;

        // 调用数据库操作函数来更新用户信息
        const result = await dbOperations.updateUser(
            { _id: userId }, // 查询条件，根据用户 ID 查找用户
            { $set: updateFields }, // 更新操作，设置要更新的字段
            { returnUpdatedDocs: true } // 选项，返回更新后的文档
        );

        // 检查是否有用户被更新
        if (result.numAffected === 0) {
            // 如果没有用户被更新，说明用户不存在，返回 404 错误
            return res.status(404).json({ message: 'User not found' });
        }

        // 创建一个对象来存储更新后的用户信息，排除密码字段
        const updatedUserInfo = { 
            _id: result.affectedDocuments._id,
            username: result.affectedDocuments.username,
            email: result.affectedDocuments.email,
            type: result.affectedDocuments.type,
            createdAt: result.affectedDocuments.createdAt
        };

        // 返回 200 响应，表明用户信息更新成功，并返回更新后的用户信息
        res.status(200).json({ message: 'User info updated successfully', user: updatedUserInfo });
    } catch (error) {
        // 捕获并记录更新用户信息时发生的错误
        console.error("Update User Error:", error);
        // 将错误传递给全局错误处理中间件
        next(error);
    }
});

// Delete user - from local DB (Kept the endpoint, but removed auth middleware)
app.delete('/local/users/:id', async (req, res, next) => { // Removed authenticateToken, checkAdmin
    try {
        const userId = req.params.id;
        const numRemoved = await dbOperations.removeUser({ _id: userId });

        if (numRemoved === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error("Delete User Error:", error);
        next(error);
    }
});

// Test endpoint - kept for checking DB connection
app.get('/local/test', async (req, res) => {
    try {
        const users = await dbOperations.findAllUsers({}, { password: 0 });
        res.status(200).json({ 
            message: 'Local database connection OK',
            userCount: users.length,
            success: true
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Local database connection error',
            error: error.message,
            success: false
        });
    }
});

// API端点处理CSV文件上传并导入到Neo4j
app.post('/api/import-to-neo4j', upload.fields([
    { name: 'nodeFile', maxCount: 1 },
    { name: 'relationFile', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('接收到文件上传请求');
        
        if (!req.files || !req.files.nodeFile || !req.files.relationFile) {
            return res.status(400).json({
                success: false,
                message: '缺少节点文件或关系文件'
            });
        }
        
        const nodeFile = req.files.nodeFile[0];
        const relationFile = req.files.relationFile[0];
        
        console.log('上传的文件:', {
            nodeFile: nodeFile.filename,
            relationFile: relationFile.filename
        });
        
        // 检查文件编码并转换为UTF-8
        console.log("检查文件编码...");
        const nodeFilePath = await ensureUtf8Encoding(nodeFile.path);
        const relationFilePath = await ensureUtf8Encoding(relationFile.path);
        
        // 处理节点文件并导入Neo4j
        const nodes = await processNodeFile(nodeFilePath);
        console.log(`已处理 ${nodes.length} 个节点`);
        
        // 处理关系文件并导入Neo4j
        const relations = await processRelationFile(relationFilePath);
        console.log(`已处理 ${relations.length} 个关系`);
        
        // 导入到Neo4j数据库
        const importResult = await importToNeo4j(nodes, relations);
        
        res.status(200).json({
            success: true,
            message: '文件导入成功',
            nodeCount: nodes.length,
            relationCount: relations.length
        });
    } catch (error) {
        console.error('导入过程中出错:', error);
        res.status(500).json({
            success: false,
            message: '导入失败: ' + error.message
        });
    }
});

// 检查文件编码并转换为UTF-8
async function ensureUtf8Encoding(filePath) {
    try {
        // 先尝试以UTF-8读取文件内容
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 检查是否有乱码字符（可能表示编码不是UTF-8）
        const hasMalformedChars = /\uFFFD/.test(content);
        
        if (hasMalformedChars) {
            console.log(`文件 ${filePath} 可能不是UTF-8编码，尝试以GBK/GB18030读取`);
            
            // 尝试安装iconv-lite（如果需要）
            try {
                // 如果未安装iconv-lite，会抛出错误
                require.resolve('iconv-lite');
            } catch (e) {
                console.log('安装iconv-lite来处理编码转换...');
                require('child_process').execSync('npm install iconv-lite --no-save', { stdio: 'inherit' });
            }
            
            // 使用GBK/GB18030读取文件
            const iconv = require('iconv-lite');
            const buffer = fs.readFileSync(filePath);
            let decodedContent;
            
            try {
                // 尝试GBK编码
                decodedContent = iconv.decode(buffer, 'gbk');
            } catch (e) {
                // 尝试GB18030编码
                decodedContent = iconv.decode(buffer, 'gb18030');
            }
            
            // 生成转换后的文件名
            const convertedFilePath = filePath + '.utf8';
            
            // 以UTF-8编码保存转换后的内容
            fs.writeFileSync(convertedFilePath, decodedContent, 'utf8');
            console.log(`文件已转换为UTF-8编码: ${convertedFilePath}`);
            
            return convertedFilePath;
        }
        
        // 如果没有乱码，返回原始文件路径
        return filePath;
    } catch (error) {
        console.error('文件编码检查/转换失败:', error);
        // 出错时返回原始文件路径
        return filePath;
    }
}

// 新增API端点用于清空Neo4j数据库
app.post('/api/clear-neo4j-database', async (req, res) => {
    const session = driver.session();
    try {
        console.log('清空Neo4j数据库请求');
        
        // 执行清空数据库的Cypher查询
        await session.run('MATCH (n) DETACH DELETE n');
        
        console.log('Neo4j数据库已清空');
        
        res.status(200).json({
            success: true,
            message: '数据库已成功清空'
        });
    } catch (error) {
        console.error('清空Neo4j数据库出错:', error);
        res.status(500).json({
            success: false,
            message: '清空数据库失败: ' + error.message
        });
    } finally {
        await session.close();
    }
});

// 处理节点CSV文件
async function processNodeFile(filePath) {
    return new Promise((resolve, reject) => {
        const nodes = [];
        const headers = new Set();
        let headerRow = null;
        
        try {
            // 使用UTF-8编码读取文件内容
            const fileContent = fs.readFileSync(filePath, 'utf8');
            
            // 检测BOM (Byte Order Mark)并移除
            let cleanContent = fileContent;
            if (fileContent.charCodeAt(0) === 0xFEFF) {
                cleanContent = fileContent.substring(1);
                console.log("检测到UTF-8 BOM标记，已移除");
            }
            
            const lines = cleanContent.split(/\r?\n/);
            
            if (lines.length === 0) {
                reject(new Error('CSV文件为空'));
                return;
            }
            
            // 处理标题行
            let headerLine = lines[0].trim();
            
            // 如果标题行被双引号包裹，需要去除
            if (headerLine.startsWith('"') && headerLine.endsWith('"')) {
                headerLine = headerLine.substring(1, headerLine.length - 1);
            }
            
            // 分割标题行
            headerRow = headerLine.split(',').map(h => h.trim().toLowerCase());
            console.log("CSV文件标题行:", headerRow);
            
            // 检查必填字段
            if (!headerRow.includes('id') || !headerRow.includes('name')) {
                console.error('CSV文件缺少必填字段。必须包含id和name列');
                console.error('当前列:', headerRow);
                reject(new Error('CSV文件格式错误: 必须包含id和name列'));
                return;
            }
            
            // 记录所有列名
            headerRow.forEach(h => headers.add(h));
            
            // 处理数据行
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue; // 跳过空行
                
                // 如果行被双引号包裹，需要去除
                let dataLine = line;
                if (dataLine.startsWith('"') && dataLine.endsWith('"')) {
                    dataLine = dataLine.substring(1, dataLine.length - 1);
                }
                
                // 处理CSV引号转义
                const values = parseCSVLine(dataLine);
                
                if (values.length < headerRow.length) {
                    console.warn(`行 ${i+1} 的值数量少于列数，可能存在解析问题`);
                }
                
                // 创建数据对象
                const data = {};
                for (let j = 0; j < headerRow.length; j++) {
                    if (j < values.length) {
                        data[headerRow[j]] = values[j].trim();
                    }
                }
                
                // 标准化字段名
                const normalizedData = {};
                Object.keys(data).forEach(key => {
                    const lowerKey = key.trim().toLowerCase();
                    normalizedData[lowerKey] = data[key];
                });
                
                const id = normalizedData.id || '';
                const name = normalizedData.name || '';
                
                if (!id || !name) {
                    console.warn(`跳过无效行，缺少id或name: ${JSON.stringify(normalizedData)}`);
                    continue; // 跳过无效行
                }
                
                // 构建节点，确保所有字段都是UTF-8编码的字符串
                nodes.push({
                    id: id,
                    name: name,
                    type: normalizedData.type || 'default',
                    description: normalizedData.description || ''
                });
            }
            
            console.log(`成功解析 ${nodes.length} 个节点`);
            console.log(`CSV列名: ${Array.from(headers).join(', ')}`);
            
            // 检查是否有潜在的编码问题
            const sampleNames = nodes.slice(0, 3).map(n => n.name);
            console.log(`节点名称样本: ${sampleNames.join(', ')}`);
            
            resolve(nodes);
        } catch (error) {
            console.error('处理CSV文件时出错:', error);
            reject(error);
        }
    });
}

// 辅助函数：解析CSV行，处理引号内的逗号
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            // 处理转义引号
            if (i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++; // 跳过下一个引号
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // 找到字段分隔符
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    // 添加最后一个字段
    result.push(current);
    return result;
}

// 处理关系CSV文件
async function processRelationFile(filePath) {
    return new Promise((resolve, reject) => {
        const relations = [];
        const headers = new Set();
        let headerRow = null;
        
        try {
            // 使用UTF-8编码读取文件内容
            const fileContent = fs.readFileSync(filePath, 'utf8');
            
            // 检测BOM (Byte Order Mark)并移除
            let cleanContent = fileContent;
            if (fileContent.charCodeAt(0) === 0xFEFF) {
                cleanContent = fileContent.substring(1);
                console.log("检测到UTF-8 BOM标记，已移除");
            }
            
            const lines = cleanContent.split(/\r?\n/);
            
            if (lines.length === 0) {
                reject(new Error('CSV文件为空'));
                return;
            }
            
            // 处理标题行
            let headerLine = lines[0].trim();
            
            // 如果标题行被双引号包裹，需要去除
            if (headerLine.startsWith('"') && headerLine.endsWith('"')) {
                headerLine = headerLine.substring(1, headerLine.length - 1);
            }
            
            // 分割标题行
            headerRow = headerLine.split(',').map(h => h.trim().toLowerCase());
            console.log("关系CSV文件标题行:", headerRow);
            
            // 定义可接受的字段名
            const sourceIdFields = ['sourceid', 'source_id', 'source', 'from', 'start', 'startid', 'start_id', 'source_name', 'sourcename', 'from_node', 'start_node'];
            const targetIdFields = ['targetid', 'target_id', 'target', 'to', 'end', 'endid', 'end_id', 'target_name', 'targetname', 'to_node', 'end_node'];
            
            // 检查必填字段
            const hasSourceField = sourceIdFields.some(field => headerRow.includes(field));
            const hasTargetField = targetIdFields.some(field => headerRow.includes(field));
            
            if (!hasSourceField) {
                console.error('CSV文件缺少来源节点ID字段。必须包含以下列之一:', sourceIdFields.join(', '));
                console.error('当前列:', headerRow);
                reject(new Error('CSV文件格式错误: 缺少来源节点ID字段'));
                return;
            }
            
            if (!hasTargetField) {
                console.error('CSV文件缺少目标节点ID字段。必须包含以下列之一:', targetIdFields.join(', '));
                console.error('当前列:', headerRow);
                reject(new Error('CSV文件格式错误: 缺少目标节点ID字段'));
                return;
            }
            
            // 记录所有列名
            headerRow.forEach(h => headers.add(h));
            
            // 处理数据行
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue; // 跳过空行
                
                // 如果行被双引号包裹，需要去除
                let dataLine = line;
                if (dataLine.startsWith('"') && dataLine.endsWith('"')) {
                    dataLine = dataLine.substring(1, dataLine.length - 1);
                }
                
                // 处理CSV引号转义
                const values = parseCSVLine(dataLine);
                
                // 创建数据对象
                const data = {};
                for (let j = 0; j < headerRow.length; j++) {
                    if (j < values.length) {
                        data[headerRow[j]] = values[j].trim();
                    }
                }
                
                // 标准化字段名
                const normalizedData = {};
                Object.keys(data).forEach(key => {
                    const lowerKey = key.trim().toLowerCase();
                    normalizedData[lowerKey] = data[key];
                });
                
                // 确定sourceId
                let sourceId = null;
                for (const field of sourceIdFields) {
                    if (normalizedData[field]) {
                        sourceId = normalizedData[field];
                        break;
                    }
                }
                
                // 确定targetId
                let targetId = null;
                for (const field of targetIdFields) {
                    if (normalizedData[field]) {
                        targetId = normalizedData[field];
                        break;
                    }
                }
                
                if (!sourceId || !targetId) {
                    console.warn(`跳过无效行，缺少sourceId或targetId: ${JSON.stringify(normalizedData)}`);
                    continue; // 跳过无效行
                }
                
                // 获取关系类型和其他属性
                let type = normalizedData.type || normalizedData.relation || normalizedData.relationship || 'RELATED_TO';
                const weight = parseFloat(normalizedData.weight) || 1.0;
                const description = normalizedData.description || '';
                
                // 创建合法的关系类型名称(Neo4j关系类型不能包含空格和特殊字符)
                type = type.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
                if (type === '' || type === '__') {
                    type = 'RELATED_TO'; // 默认关系类型
                }
                
                // 构建关系
                relations.push({
                    sourceId: sourceId,
                    targetId: targetId,
                    type: type,
                    weight: weight,
                    description: description
                });
            }
            
            // 检查是否有潜在的编码问题
            if (relations.length > 0) {
                console.log(`关系样本: ${relations[0].sourceId} -> ${relations[0].targetId} (${relations[0].type})`);
            }
            
            console.log(`成功解析 ${relations.length} 个关系`);
            console.log(`CSV列名: ${Array.from(headers).join(', ')}`);
            resolve(relations);
        } catch (error) {
            console.error('处理关系CSV文件时出错:', error);
            reject(error);
        }
    });
}

// 导入数据到Neo4j
async function importToNeo4j(nodes, relations) {
    const session = driver.session();
    try {
        // 先清空数据库
        await session.run('MATCH (n) DETACH DELETE n');
        console.log("数据库已清空，开始导入数据");
        
        // 创建节点 - 使用显式UTF-8编码
        let nodeSuccessCount = 0;
        let nodeFailCount = 0;
        
        // 添加唯一ID到节点
        const nodesWithIds = nodes.map(node => {
            // 确保ID是字符串类型
            if (typeof node.id !== 'string') {
                node.id = String(node.id);
            }
            return node;
        });
        
        // 创建节点
        for (const node of nodesWithIds) {
            try {
                await session.run(
                    `CREATE (n:Node {id: $id, name: $name, type: $type, description: $description})`,
                    {
                        id: String(node.id),  // 确保ID是字符串
                        name: String(node.name),  // 确保名称是字符串
                        type: String(node.type || 'default'),
                        description: String(node.description || '')
                    }
                );
                nodeSuccessCount++;
            } catch (error) {
                console.error(`创建节点失败: ${node.id} (${node.name})`, error);
                nodeFailCount++;
            }
        }
        
        console.log(`节点创建统计: 成功=${nodeSuccessCount}, 失败=${nodeFailCount}`);
        
        // 创建索引 - 使用新语法
        await session.run('CREATE INDEX node_id_index IF NOT EXISTS FOR (n:Node) ON (n.id)');
        await session.run('CREATE INDEX node_name_index IF NOT EXISTS FOR (n:Node) ON (n.name)');
        
        // 创建双向映射: ID <-> 名称
        // 从CSV文件建立映射
        const nodeIdToNameMap = new Map(); // ID -> Name
        const nodeNameToIdMap = new Map(); // Name -> ID
        
        nodesWithIds.forEach(node => {
            nodeIdToNameMap.set(String(node.id), String(node.name));
            nodeNameToIdMap.set(String(node.name), String(node.id));
        });
        
        // 检查所有节点是否正确创建，并获取其ID和名称
        const nodeCheckResult = await session.run('MATCH (n:Node) RETURN n.id as id, n.name as name');
        const createdNodes = nodeCheckResult.records.map(record => ({
            id: record.get('id'),
            name: record.get('name')
        }));
        
        console.log(`成功创建了 ${createdNodes.length} 个节点`);
        if (createdNodes.length > 0) {
            console.log(`创建的节点示例: ID=${createdNodes[0].id}, 名称=${createdNodes[0].name}`);
        }
        
        // 更新映射表：添加从数据库获取的实际节点
        createdNodes.forEach(node => {
            nodeIdToNameMap.set(String(node.id), String(node.name));
            nodeNameToIdMap.set(String(node.name), String(node.id));
        });
        
        console.log(`创建了节点映射: ID->名称(${nodeIdToNameMap.size}个)和名称->ID(${nodeNameToIdMap.size}个)`);
        
        // 显示部分映射样本
        console.log("ID -> 名称映射样本:");
        let count = 0;
        for (const [id, name] of nodeIdToNameMap.entries()) {
            console.log(`  ${id} -> ${name}`);
            count++;
            if (count >= 5) break; // 只显示前5个样本
        }
        
        // 创建关系 - 先验证节点存在，避免关系创建失败
        let relationSuccessCount = 0;
        let relationFailCount = 0;
        
        for (const rel of relations) {
            // 获取源节点和目标节点ID，优先使用ID，不存在则尝试使用名称查找ID
            let sourceId = String(rel.sourceId);
            let targetId = String(rel.targetId);
            let sourceIdFound = false;
            let targetIdFound = false;
            
            // 1. 检查sourceId是否为有效ID
            if (nodeIdToNameMap.has(sourceId)) {
                sourceIdFound = true;
            } 
            // 2. 检查sourceId是否为节点名称
            else if (nodeNameToIdMap.has(sourceId)) {
                const mappedId = nodeNameToIdMap.get(sourceId);
                console.log(`使用名称映射查找源节点: ${sourceId} -> ${mappedId}`);
                sourceId = mappedId;
                sourceIdFound = true;
            }
            
            // 1. 检查targetId是否为有效ID
            if (nodeIdToNameMap.has(targetId)) {
                targetIdFound = true;
            } 
            // 2. 检查targetId是否为节点名称
            else if (nodeNameToIdMap.has(targetId)) {
                const mappedId = nodeNameToIdMap.get(targetId);
                console.log(`使用名称映射查找目标节点: ${targetId} -> ${mappedId}`);
                targetId = mappedId;
                targetIdFound = true;
            }
            
            // 如果还是找不到，尝试直接查询数据库
            if (!sourceIdFound) {
                try {
                    // 尝试通过名称查询
                    const result = await session.run(
                        'MATCH (n:Node) WHERE n.name = $name RETURN n.id as id',
                        { name: sourceId }
                    );
                    if (result.records.length > 0) {
                        sourceId = result.records[0].get('id');
                        sourceIdFound = true;
                        console.log(`通过数据库查询找到源节点: ${rel.sourceId} -> ${sourceId}`);
                        
                        // 更新映射
                        nodeNameToIdMap.set(rel.sourceId, sourceId);
                    }
                } catch (error) {
                    console.error(`源节点查询失败: ${sourceId}`, error);
                }
            }
            
            if (!targetIdFound) {
                try {
                    // 尝试通过名称查询
                    const result = await session.run(
                        'MATCH (n:Node) WHERE n.name = $name RETURN n.id as id',
                        { name: targetId }
                    );
                    if (result.records.length > 0) {
                        targetId = result.records[0].get('id');
                        targetIdFound = true;
                        console.log(`通过数据库查询找到目标节点: ${rel.targetId} -> ${targetId}`);
                        
                        // 更新映射
                        nodeNameToIdMap.set(rel.targetId, targetId);
                    }
                } catch (error) {
                    console.error(`目标节点查询失败: ${targetId}`, error);
                }
            }
            
            // 检查源节点和目标节点是否最终找到
            if (!sourceIdFound) {
                console.warn(`跳过关系创建: 源节点不存在 ${rel.sourceId} -> ${rel.targetId}`);
                relationFailCount++;
                continue;
            }
            
            if (!targetIdFound) {
                console.warn(`跳过关系创建: 目标节点不存在 ${rel.sourceId} -> ${rel.targetId}`);
                relationFailCount++;
                continue;
            }
            
            // 如果源节点和目标节点都存在，创建关系
            try {
                // 确保关系类型合法（不能有中文和特殊字符）
                let relationType = String(rel.type).toUpperCase().replace(/[^A-Z0-9_]/g, '_');
                if (relationType === '' || relationType === '__') {
                    relationType = 'RELATED_TO'; // 默认关系类型
                }
                
                // 如果是中文关系，记录原始类型作为属性
                const originalType = String(rel.type);
                
                // 使用参数化查询避免字符编码问题
                await session.run(
                    `
                    MATCH (source:Node {id: $sourceId})
                    MATCH (target:Node {id: $targetId})
                    CREATE (source)-[r:${relationType} {
                        weight: $weight, 
                        description: $description,
                        originalType: $originalType
                    }]->(target)
                    RETURN r
                    `,
                    {
                        sourceId: sourceId,
                        targetId: targetId,
                        weight: parseFloat(rel.weight) || 1.0,
                        description: String(rel.description || ''),
                        originalType: originalType
                    }
                );
                relationSuccessCount++;
            } catch (error) {
                console.error(`创建关系失败: ${sourceId} -> ${targetId}, 类型: ${rel.type}`, error);
                relationFailCount++;
            }
        }
        
        console.log(`关系创建统计: 成功=${relationSuccessCount}, 失败=${relationFailCount}`);
        
        // 查询统计信息
        const nodeCount = await session.run('MATCH (n) RETURN count(n) as count');
        const relCount = await session.run('MATCH ()-[r]->() RETURN count(r) as count');
        
        const stats = {
            nodeCount: nodeCount.records[0].get('count').toNumber(),
            relationCount: relCount.records[0].get('count').toNumber()
        };
        
        console.log('导入统计:', stats);
        
        return { 
            success: true,
            stats
        };
    } catch (error) {
        console.error('Neo4j导入错误:', error);
        throw error;
    } finally {
        await session.close();
    }
}

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err); // Log errors to console for local dev
    res.status(500).json({ message: 'Server error, please try again later' });
});

// 获取完整图谱数据
app.get('/api/graph/all', async (req, res) => {
    const session = driver.session();
    try {
        // 解析limit参数并确保它是整数
        const limit = parseInt(req.query.limit || '100');
        
        // 查询所有节点
        const nodesQuery = `
            MATCH (n)
            RETURN n
            LIMIT $limit
        `;
        
        const nodesResult = await session.run(nodesQuery, { 
            limit: neo4j.int(limit) // 使用neo4j.int()确保是Neo4j整数类型
        });
        
        // 检查是否有节点返回
        if (nodesResult.records.length === 0) {
            return res.json({
                success: true,
                data: { nodes: [], relationships: [] },
                message: '数据库中没有节点数据'
            });
        }
        
        // 处理节点数据，确保ID为字符串类型
        const nodes = nodesResult.records.map(record => {
            const node = record.get('n');
            try {
                return {
                    id: String(node.properties.id),
                    name: String(node.properties.name || ''),
                    labels: Array.from(node.labels),
                    properties: Object.fromEntries(
                        Object.entries(node.properties).map(([k, v]) => [k, String(v)])
                    )
                };
            } catch (error) {
                console.error('处理节点数据出错:', error);
                return {
                    id: String(node.identity.toString()), // 使用Neo4j内部ID作为备用
                    name: 'Error',
                    labels: Array.from(node.labels),
                    properties: { error: 'Data processing error' }
                };
            }
        });
        
        // 创建节点ID映射，用于关系查询
        const nodeIds = nodes.map(node => node.id);
        
        // 查询这些节点之间的关系
        const relsQuery = `
            MATCH (n)-[r]->(m)
            WHERE n.id IN $nodeIds AND m.id IN $nodeIds
            RETURN r, n.id as source, m.id as target
            LIMIT $limit
        `;
        
        const relsResult = await session.run(relsQuery, { 
            nodeIds: nodeIds,
            limit: neo4j.int(limit)
        });
        
        // 处理关系数据
        const relationships = relsResult.records.map(record => {
            try {
                const rel = record.get('r');
                const sourceId = record.get('source');
                const targetId = record.get('target');
                
                return {
                    id: rel.identity.toString(),
                    startNodeId: String(sourceId),
                    endNodeId: String(targetId),
                    type: String(rel.type),
                    properties: Object.fromEntries(
                        Object.entries(rel.properties).map(([k, v]) => [k, String(v)])
                    )
                };
            } catch (error) {
                console.error('处理关系数据出错:', error);
                return null; // 将返回null的记录过滤掉
            }
        }).filter(rel => rel !== null); // 过滤掉处理失败的关系
        
        res.json({ 
            success: true, 
            data: { 
                nodes, 
                relationships,
                stats: {
                    nodeCount: nodes.length,
                    relationshipCount: relationships.length
                }
            } 
        });
    } catch (error) {
        console.error('获取图谱数据出错:', error);
        res.status(500).json({ 
            success: false, 
            message: '获取图谱数据失败: ' + error.message 
        });
    } finally {
        await session.close();
    }
});

// 按关键词搜索节点
app.get('/api/graph/search', async (req, res) => {
    const session = driver.session();
    try {
        const keyword = req.query.keyword;
        if (!keyword) {
            return res.status(400).json({
                success: false,
                message: '请提供搜索关键词'
            });
        }
        
        // 使用模糊匹配搜索节点
        const nodesResult = await session.run(
            `MATCH (n) 
             WHERE toLower(n.name) CONTAINS toLower($keyword) OR 
                   toLower(n.description) CONTAINS toLower($keyword)
             RETURN n 
             LIMIT 50`,
            { 
                keyword,
                limit: neo4j.int(50) // 确保LIMIT是整数
            }
        );
        
        // 处理节点数据
        const nodes = nodesResult.records.map(record => {
            const node = record.get('n');
            return {
                id: String(node.properties.id),
                name: node.properties.name,
                labels: Array.from(node.labels),
                properties: node.properties
            };
        });
        
        if (nodes.length === 0) {
            return res.json({
                success: true,
                data: { nodes: [], relationships: [] },
                message: '未找到匹配的节点'
            });
        }
        
        // 获取节点ID列表
        const nodeIds = nodes.map(node => node.id);
        
        // 查询这些节点之间的关系
        const relsResult = await session.run(
            `MATCH (a)-[r]->(b) 
             WHERE a.id IN $nodeIds AND b.id IN $nodeIds
             RETURN a, r, b`,
            { nodeIds }
        );
        
        // 处理关系数据
        const relationships = relsResult.records.map(record => {
            const sourceNode = record.get('a');
            const targetNode = record.get('b');
            const rel = record.get('r');
            
            return {
                id: rel.identity.toString(),
                startNodeId: String(sourceNode.properties.id),
                endNodeId: String(targetNode.properties.id),
                type: rel.type,
                properties: rel.properties
            };
        });
        
        res.json({
            success: true,
            data: { nodes, relationships },
            message: `找到 ${nodes.length} 个匹配节点和 ${relationships.length} 个关系`
        });
    } catch (error) {
        console.error('搜索图谱数据出错:', error);
        res.status(500).json({
            success: false,
            message: '搜索图谱数据失败: ' + error.message
        });
    } finally {
        await session.close();
    }
});

// 查找两节点间路径
app.get('/api/graph/path', async (req, res) => {
    const session = driver.session();
    try {
        const sourceId = req.query.sourceId;
        const targetId = req.query.targetId;
        
        if (!sourceId || !targetId) {
            return res.status(400).json({
                success: false,
                message: '请同时提供起始和目标节点ID'
            });
        }
        
        // 查找最短路径
        const pathResult = await session.run(
            `MATCH (source:Node {id: $sourceId}),
                  (target:Node {id: $targetId}),
                  path = shortestPath((source)-[*..5]-(target))
             RETURN path`,
            { sourceId, targetId }
        );
        
        if (pathResult.records.length === 0) {
            return res.json({
                success: true,
                data: { nodes: [], relationships: [] },
                message: '未找到连接这两个节点的路径'
            });
        }
        
        // 提取路径中的节点和关系
        const pathNodes = new Map();
        const pathRels = [];
        
        pathResult.records.forEach(record => {
            const path = record.get('path');
            
            // 处理路径中的节点
            path.segments.forEach(segment => {
                const startNode = segment.start;
                const endNode = segment.end;
                const relationship = segment.relationship;
                
                // 添加起始节点（如果尚未添加）
                if (!pathNodes.has(String(startNode.properties.id))) {
                    pathNodes.set(String(startNode.properties.id), {
                        id: String(startNode.properties.id),
                        name: startNode.properties.name,
                        labels: Array.from(startNode.labels),
                        properties: startNode.properties
                    });
                }
                
                // 添加结束节点（如果尚未添加）
                if (!pathNodes.has(String(endNode.properties.id))) {
                    pathNodes.set(String(endNode.properties.id), {
                        id: String(endNode.properties.id),
                        name: endNode.properties.name,
                        labels: Array.from(endNode.labels),
                        properties: endNode.properties
                    });
                }
                
                // 添加关系
                pathRels.push({
                    id: relationship.identity.toString(),
                    startNodeId: String(startNode.properties.id),
                    endNodeId: String(endNode.properties.id),
                    type: relationship.type,
                    properties: relationship.properties
                });
            });
        });
        
        res.json({
            success: true,
            data: {
                nodes: Array.from(pathNodes.values()),
                relationships: pathRels
            },
            message: `找到从"${sourceId}"到"${targetId}"的路径，包含 ${pathNodes.size} 个节点和 ${pathRels.length} 个关系`
        });
    } catch (error) {
        console.error('查找路径出错:', error);
        res.status(500).json({
            success: false,
            message: '查找路径失败: ' + error.message
        });
    } finally {
        await session.close();
    }
});

// AI问答结合图谱数据
app.post('/api/ai/graph-query', async (req, res) => {
    const session = driver.session();
    try {
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                message: '请提供查询问题'
            });
        }
        
        // 尝试从问题中提取实体名称
        let entities = [];
        if (query.includes('与') && query.includes('相关')) {
            const matches = query.match(/与(.+?)相关/);
            if (matches && matches[1]) {
                entities.push(matches[1].trim());
            }
        }
        
        // 如果没有匹配到实体，可以用更通用的方法尝试提取名词
        if (entities.length === 0) {
            // 简单的关键词提取（实际应用可能需要更复杂的NLP）
            const keywords = query.split(/\s+|，|,|。|\./).filter(w => w.length > 1);
            entities = [...keywords];
        }
        
        let graphData = { nodes: [], relationships: [] };
        
        // 如果找到实体，查询相关的图谱数据
        if (entities.length > 0) {
            for (const entity of entities) {
                try {
                    // 查找与实体名称匹配的节点
                    const nodeResult = await session.run(
                        `MATCH (n:Node) 
                         WHERE toLower(n.name) CONTAINS toLower($entity) 
                         RETURN n LIMIT $limit`,
                        { 
                            entity,
                            limit: neo4j.int(5) // 使用neo4j.int确保整数
                        }
                    );
                    
                    if (nodeResult.records.length > 0) {
                        // 找到相关节点，获取它的邻居节点
                        const nodeIds = nodeResult.records.map(record => 
                            String(record.get('n').properties.id)
                        );
                        
                        // 获取这些节点及其一阶邻居
                        const neighborResult = await session.run(
                            `MATCH (n:Node)-[r]-(neighbor) 
                             WHERE n.id IN $nodeIds
                             RETURN n, r, neighbor 
                             LIMIT $limit`,
                            { 
                                nodeIds,
                                limit: neo4j.int(50) // 使用neo4j.int确保整数
                            }
                        );
                        
                        // 处理数据
                        const nodes = new Map();
                        const rels = [];
                        
                        neighborResult.records.forEach(record => {
                            const node = record.get('n');
                            const rel = record.get('r');
                            const neighbor = record.get('neighbor');
                            
                            // 添加中心节点
                            if (!nodes.has(String(node.properties.id))) {
                                nodes.set(String(node.properties.id), {
                                    id: String(node.properties.id),
                                    name: node.properties.name,
                                    labels: Array.from(node.labels),
                                    properties: node.properties
                                });
                            }
                            
                            // 添加邻居节点
                            if (!nodes.has(String(neighbor.properties.id))) {
                                nodes.set(String(neighbor.properties.id), {
                                    id: String(neighbor.properties.id),
                                    name: neighbor.properties.name,
                                    labels: Array.from(neighbor.labels),
                                    properties: neighbor.properties
                                });
                            }
                            
                            // 添加关系
                            const isOutgoing = rel.startNodeIdentity.equals(node.identity);
                            rels.push({
                                id: rel.identity.toString(),
                                startNodeId: isOutgoing 
                                    ? String(node.properties.id) 
                                    : String(neighbor.properties.id),
                                endNodeId: isOutgoing 
                                    ? String(neighbor.properties.id) 
                                    : String(node.properties.id),
                                type: rel.type,
                                properties: rel.properties
                            });
                        });
                        
                        // 合并到结果中
                        graphData.nodes = [...graphData.nodes, ...Array.from(nodes.values())];
                        graphData.relationships = [...graphData.relationships, ...rels];
                    }
                } catch (entityError) {
                    console.warn(`查询实体"${entity}"时出错:`, entityError);
                    // 继续处理其他实体
                }
            }
            
            // 去重
            const uniqueNodes = new Map();
            graphData.nodes.forEach(node => {
                uniqueNodes.set(node.id, node);
            });
            
            const uniqueRels = new Map();
            graphData.relationships.forEach(rel => {
                uniqueRels.set(rel.id, rel);
            });
            
            graphData.nodes = Array.from(uniqueNodes.values());
            graphData.relationships = Array.from(uniqueRels.values());
        }
        
        res.json({
            success: true,
            data: {
                graphData,
                answer: `已找到与您问题相关的 ${graphData.nodes.length} 个节点和 ${graphData.relationships.length} 个关系。`,
                entities
            }
        });
    } catch (error) {
        console.error('处理图谱问答出错:', error);
        res.status(500).json({
            success: false,
            message: '处理问答失败: ' + error.message
        });
    } finally {
        await session.close();
    }
});

// 节点和关系文件上传处理
app.post('/api/upload-csv', upload.fields([
    { name: 'nodeFile', maxCount: 1 },
    { name: 'relationFile', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.files) {
            return res.status(400).json({
                success: false,
                message: '未上传文件'
            });
        }
        
        console.log('上传的文件:', req.files);
        
        const nodeFile = req.files.nodeFile ? req.files.nodeFile[0] : null;
        const relationFile = req.files.relationFile ? req.files.relationFile[0] : null;
        
        if (!nodeFile && !relationFile) {
            return res.status(400).json({
                success: false,
                message: '请至少上传一个CSV文件'
            });
        }
        
        let nodes = [];
        let relations = [];
        
        // 处理节点文件
        if (nodeFile) {
            console.log('检查文件编码...');
            // 检查并确保文件是UTF-8编码
            const utf8NodeFilePath = await ensureUtf8Encoding(nodeFile.path);
            
            console.log(`开始处理节点文件: ${utf8NodeFilePath}`);
            nodes = await processNodeFile(utf8NodeFilePath);
            console.log(`已处理 ${nodes.length} 个节点`);
            
            // 显示节点信息样本帮助调试
            if (nodes.length > 0) {
                console.log('节点样本:');
                nodes.slice(0, 3).forEach((node, idx) => {
                    console.log(`  节点 #${idx+1}: ID=${node.id}, 名称=${node.name}, 类型=${node.type}`);
                });
            }
        }
        
        // 处理关系文件
        if (relationFile) {
            console.log('检查文件编码...');
            // 检查并确保文件是UTF-8编码
            const utf8RelationFilePath = await ensureUtf8Encoding(relationFile.path);
            
            console.log(`开始处理关系文件: ${utf8RelationFilePath}`);
            relations = await processRelationFile(utf8RelationFilePath);
            console.log(`已处理 ${relations.length} 个关系`);
            
            // 显示关系信息样本帮助调试
            if (relations.length > 0) {
                console.log('关系样本:');
                relations.slice(0, 3).forEach((rel, idx) => {
                    console.log(`  关系 #${idx+1}: ${rel.sourceId} -> ${rel.targetId} (${rel.type})`);
                });
            }
        }
        
        // 导入到Neo4j
        if (nodes.length > 0 || relations.length > 0) {
            try {
                const result = await importToNeo4j(nodes, relations);
                return res.json({
                    success: true,
                    stats: result.stats,
                    message: `成功导入 ${result.stats.nodeCount} 个节点和 ${result.stats.relationCount} 个关系`
                });
            } catch (error) {
                console.error('导入Neo4j失败:', error);
                return res.status(500).json({
                    success: false,
                    message: '导入Neo4j失败: ' + error.message
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: '没有有效数据可导入'
            });
        }
    } catch (error) {
        console.error('文件处理错误:', error);
        res.status(500).json({
            success: false,
            message: '文件处理错误: ' + error.message
        });
    }
});

// 分步操作API: 只导入节点
app.post('/api/import-nodes', upload.fields([
    { name: 'nodeFile', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('接收到节点文件上传请求');
        
        if (!req.files || !req.files.nodeFile) {
            return res.status(400).json({
                success: false,
                message: '缺少节点文件'
            });
        }
        
        const nodeFile = req.files.nodeFile[0];
        
        console.log('上传的节点文件:', nodeFile.filename);
        
        // 检查文件编码并转换为UTF-8
        console.log("检查文件编码...");
        const nodeFilePath = await ensureUtf8Encoding(nodeFile.path);
        
        // 处理节点文件
        const nodes = await processNodeFile(nodeFilePath);
        console.log(`已处理 ${nodes.length} 个节点`);
        
        // 导入节点到Neo4j数据库
        const session = driver.session();
        try {
            // 先清空数据库
            await session.run('MATCH (n) DETACH DELETE n');
            console.log("数据库已清空，开始导入节点");
            
            let nodeSuccessCount = 0;
            let nodeFailCount = 0;
            
            // 创建节点
            for (const node of nodes) {
                try {
                    await session.run(
                        `CREATE (n:Node {id: $id, name: $name, type: $type, description: $description})`,
                        {
                            id: String(node.id),  // 确保ID是字符串
                            name: String(node.name),  // 确保名称是字符串
                            type: String(node.type || 'default'),
                            description: String(node.description || '')
                        }
                    );
                    nodeSuccessCount++;
                } catch (error) {
                    console.error(`创建节点失败: ${node.id} (${node.name})`, error);
                    nodeFailCount++;
                }
            }
            
            console.log(`节点创建统计: 成功=${nodeSuccessCount}, 失败=${nodeFailCount}`);
            
            // 创建索引 - 使用新语法
            await session.run('CREATE INDEX node_id_index IF NOT EXISTS FOR (n:Node) ON (n.id)');
            
            // 获取统计信息
            const nodeCount = await session.run('MATCH (n) RETURN count(n) as count');
            
            res.status(200).json({
                success: true,
                message: '节点文件导入成功',
                nodeCount: nodeCount.records[0].get('count').toNumber(),
                successes: nodeSuccessCount,
                failures: nodeFailCount
            });
        } catch (error) {
            console.error('导入节点过程中出错:', error);
            res.status(500).json({
                success: false,
                message: '导入节点失败: ' + error.message
            });
        } finally {
            await session.close();
        }
    } catch (error) {
        console.error('节点导入过程中出错:', error);
        res.status(500).json({
            success: false,
            message: '节点导入失败: ' + error.message
        });
    }
});

// 分步操作API: 只导入关系
app.post('/api/import-relations', upload.fields([
    { name: 'relationFile', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('接收到关系文件上传请求');
        
        if (!req.files || !req.files.relationFile) {
            return res.status(400).json({
                success: false,
                message: '缺少关系文件'
            });
        }
        
        const relationFile = req.files.relationFile[0];
        
        console.log('上传的关系文件:', relationFile.filename);
        
        // 检查文件编码并转换为UTF-8
        console.log("检查文件编码...");
        const relationFilePath = await ensureUtf8Encoding(relationFile.path);
        
        // 处理关系文件
        const relations = await processRelationFile(relationFilePath);
        console.log(`已处理 ${relations.length} 个关系`);
        
        // 导入关系到Neo4j数据库
        const session = driver.session();
        try {
            // 获取所有节点ID
            const nodeResult = await session.run('MATCH (n:Node) RETURN n.id as id');
            const nodeIds = nodeResult.records.map(record => String(record.get('id')));
            const nodeIdSet = new Set(nodeIds);
            
            console.log(`数据库中有 ${nodeIds.length} 个节点`);
            
            let relationSuccessCount = 0;
            let relationFailCount = 0;
            
            // 创建关系 - 只使用ID匹配
            for (const rel of relations) {
                const sourceId = String(rel.sourceId);
                const targetId = String(rel.targetId);
                
                // 检查源节点和目标节点是否存在
                if (!nodeIdSet.has(sourceId)) {
                    console.warn(`跳过关系创建: 源节点ID不存在 ${sourceId}`);
                    relationFailCount++;
                    continue;
                }
                
                if (!nodeIdSet.has(targetId)) {
                    console.warn(`跳过关系创建: 目标节点ID不存在 ${targetId}`);
                    relationFailCount++;
                    continue;
                }
                
                // 创建关系
                try {
                    // 确保关系类型合法（不能有中文和特殊字符）
                    let relationType = String(rel.type).toUpperCase().replace(/[^A-Z0-9_]/g, '_');
                    if (relationType === '' || relationType === '__') {
                        relationType = 'RELATED_TO'; // 默认关系类型
                    }
                    
                    // 原始类型作为属性
                    const originalType = String(rel.type);
                    
                    // 使用参数化查询
                    await session.run(
                        `
                        MATCH (source:Node {id: $sourceId})
                        MATCH (target:Node {id: $targetId})
                        CREATE (source)-[r:${relationType} {
                            weight: $weight, 
                            description: $description,
                            originalType: $originalType
                        }]->(target)
                        RETURN r
                        `,
                        {
                            sourceId: sourceId,
                            targetId: targetId,
                            weight: parseFloat(rel.weight) || 1.0,
                            description: String(rel.description || ''),
                            originalType: originalType
                        }
                    );
                    relationSuccessCount++;
                } catch (error) {
                    console.error(`创建关系失败: ${sourceId} -> ${targetId}, 类型: ${rel.type}`, error);
                    relationFailCount++;
                }
            }
            
            console.log(`关系创建统计: 成功=${relationSuccessCount}, 失败=${relationFailCount}`);
            
            // 获取统计信息
            const relCount = await session.run('MATCH ()-[r]->() RETURN count(r) as count');
            
            res.status(200).json({
                success: true,
                message: '关系文件导入成功',
                relationCount: relCount.records[0].get('count').toNumber(),
                successes: relationSuccessCount,
                failures: relationFailCount
            });
        } catch (error) {
            console.error('导入关系过程中出错:', error);
            res.status(500).json({
                success: false,
                message: '导入关系失败: ' + error.message
            });
        } finally {
            await session.close();
        }
    } catch (error) {
        console.error('关系导入过程中出错:', error);
        res.status(500).json({
            success: false,
            message: '关系导入失败: ' + error.message
        });
    }
});

// 获取导入状态API
app.get('/api/import-status', async (req, res) => {
    const session = driver.session();
    try {
        // 获取节点数量
        const nodeCount = await session.run('MATCH (n) RETURN count(n) as count');
        
        // 获取关系数量
        const relCount = await session.run('MATCH ()-[r]->() RETURN count(r) as count');
        
        // 获取节点类型分布
        const nodeTypes = await session.run('MATCH (n:Node) RETURN n.type as type, count(n) as count');
        const typeDistribution = nodeTypes.records.map(record => ({
            type: record.get('type'),
            count: record.get('count').toNumber()
        }));
        
        // 获取关系类型分布
        const relTypes = await session.run('MATCH ()-[r]->() RETURN type(r) as type, count(r) as count');
        const relationDistribution = relTypes.records.map(record => ({
            type: record.get('type'),
            count: record.get('count').toNumber()
        }));
        
        res.status(200).json({
            success: true,
            data: {
                nodeCount: nodeCount.records[0].get('count').toNumber(),
                relationCount: relCount.records[0].get('count').toNumber(),
                nodeTypes: typeDistribution,
                relationTypes: relationDistribution
            }
        });
    } catch (error) {
        console.error('获取导入状态出错:', error);
        res.status(500).json({
            success: false,
            message: '获取状态失败: ' + error.message
        });
    } finally {
        await session.close();
    }
});