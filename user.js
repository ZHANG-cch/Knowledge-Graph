let chatInput, chatSendButton, chatMessages, loadGraphBtn, menuItems, contentSections;
let graphContainer, graphPlaceholder, graphControls; // 图谱相关DOM元素
let network = null;
let nodes = [];
let edges = [];
let nodeTypes = new Set(); // 如果需要节点类型过滤，可以保留
let themeSelect, languageSelect, saveSettingsBtn;
let loginLogoutLink, loginLogoutBtn; // 添加对按钮和链接的引用
let searchInput, searchButton; // 添加对搜索框和搜索按钮的引用

// 翻译字典
const translations = {
    'zh-CN': {
        pageTitle: 'AI图谱 - 知识图谱展示',
        appName: 'AI图谱',
        menuGraph: '知识图谱',
        menuCourses: '课程推荐',
        menuSettings: '设置',
        searchPlaceholder: '搜索节点或关系',
        loginButton: '登录',
        logoutButton: '注销',
        graphPlaceholderText: 'Neo4j知识图谱展示区域',
        loadGraphButton: '加载AI知识图谱',
        zoomInButton: '放大',
        zoomOutButton: '缩小',
        resetButton: '重置',
        chatTitle: '图谱助手',
        chatWelcome1: '您好！我是您的知识图谱助手，可以帮您查询和分析图谱数据。',
        chatWelcome2: '您可以尝试问我："什么是深度学习？" 或 "机器学习和神经网络有什么关系？"',
        chatCommands: '常用命令：<br>/load - 加载完整图谱<br>/search 关键词 - 搜索节点<br>/help - 显示帮助信息',
        chatInputPlaceholder: '输入您关于图谱的查询...',
        courseTitle: '课程推荐',
        courseDescription: '根据您的学习兴趣和知识图谱探索，为您推荐以下课程：',
        course1Title: 'Python数据分析入门',
        course1Desc: '学习使用Python进行数据处理、分析和可视化的基础知识。',
        course2Title: 'Web开发全栈工程师',
        course2Desc: '掌握前端和后端技术，构建现代化的Web应用程序。',
        course3Title: '机器学习实战',
        course3Desc: '深入了解常用机器学习算法及其在实际项目中的应用。',
        viewDetailsButton: '查看详情',
        settingsTitle: '系统设置',
        themeLabel: '界面主题:',
        themeLight: '浅色模式',
        themeDark: '深色模式',
        languageLabel: '显示语言:',
        saveButton: '保存设置',
        dataImportTitle: '数据导入',
        stepByStepImportTitle: '分步导入',
        stepByStepImportDescription: '先导入节点，再导入关系',
        step1Title: '步骤1: 导入节点',
        step2Title: '步骤2: 导入关系',
        nodeFileLabel: '选择节点CSV文件:',
        relationFileLabel: '选择关系CSV文件:',
        importNodesButton: '导入节点',
        importRelationsButton: '导入关系',
        oneStepImportTitle: '一键导入',
        oneStepImportDescription: '同时导入节点和关系',
        importFullButton: '一键导入',
        currentDataTitle: '当前数据状态',
        refreshStatsButton: '刷新状态',
        statsLoading: '加载中...'
    },
    'en-US': {
        pageTitle: 'AI Graph - Knowledge Graph Showcase',
        appName: 'AI Graph',
        menuGraph: 'Knowledge Graph',
        menuCourses: 'Course Recommendations',
        menuSettings: 'Settings',
        searchPlaceholder: 'Search nodes or relationships',
        loginButton: 'Login',
        logoutButton: 'Logout',
        graphPlaceholderText: 'Neo4j Knowledge Graph display area',
        loadGraphButton: 'Load AI Knowledge Graph',
        zoomInButton: 'Zoom In',
        zoomOutButton: 'Zoom Out',
        resetButton: 'Reset',
        chatTitle: 'Graph Assistant',
        chatWelcome1: 'Hello! I am your knowledge graph assistant. I can help you query and analyze graph data.',
        chatWelcome2: 'You can try asking me: "What is deep learning?" or "What is the relationship between machine learning and neural networks?"',
        chatCommands: 'Commands:<br>/load - Load full graph<br>/search keyword - Search nodes<br>/help - Show help',
        chatInputPlaceholder: 'Enter your query about the graph...',
        courseTitle: 'Course Recommendations',
        courseDescription: 'Based on your learning interests and graph exploration, here are some recommended courses:',
        course1Title: 'Intro to Python Data Analysis',
        course1Desc: 'Learn the basics of data processing, analysis, and visualization using Python.',
        course2Title: 'Full-Stack Web Developer',
        course2Desc: 'Master front-end and back-end technologies to build modern web applications.',
        course3Title: 'Machine Learning in Practice',
        course3Desc: 'Gain in-depth understanding of common machine learning algorithms and their real-world applications.',
        viewDetailsButton: 'View Details',
        settingsTitle: 'System Settings',
        themeLabel: 'Interface Theme:',
        themeLight: 'Light Mode',
        themeDark: 'Dark Mode',
        languageLabel: 'Display Language:',
        saveButton: 'Save Settings',
        dataImportTitle: 'Data Import',
        stepByStepImportTitle: 'Step-by-Step Import',
        stepByStepImportDescription: 'Import nodes first, then relationships',
        step1Title: 'Step 1: Import Nodes',
        step2Title: 'Step 2: Import Relationships',
        nodeFileLabel: 'Select Node CSV File:',
        relationFileLabel: 'Select Relationship CSV File:',
        importNodesButton: 'Import Nodes',
        importRelationsButton: 'Import Relationships',
        oneStepImportTitle: 'One-Step Import',
        oneStepImportDescription: 'Import nodes and relationships together',
        importFullButton: 'Import All',
        currentDataTitle: 'Current Data Status',
        refreshStatsButton: 'Refresh Status',
        statsLoading: 'Loading...'
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // 获取 DOM 元素的引用
    menuItems = document.querySelectorAll('.sidebar .menu li');
    contentSections = document.querySelectorAll('.main-content .content .content-section');
    loadGraphBtn = document.querySelector('.load-graph-btn');
    chatInput = document.querySelector('.chat-input input');
    chatSendButton = document.querySelector('.chat-input button');
    chatMessages = document.querySelector('.chat-messages');
    graphContainer = document.getElementById('neo4j-graph');
    graphPlaceholder = document.querySelector('.graph-placeholder');
    graphControls = document.querySelector('.graph-controls');
    themeSelect = document.getElementById('theme-select');
    languageSelect = document.getElementById('language-select');
    saveSettingsBtn = document.querySelector('.save-settings-btn');
    loginLogoutLink = document.getElementById('login-logout-link');
    loginLogoutBtn = document.getElementById('login-logout-btn');
    searchInput = document.querySelector('.search-bar input');
    searchButton = document.querySelector('.search-bar button');

    // --- 确保初始 graph-section 是 flex 布局 ---
    const initialActiveSection = document.querySelector('.content-section.active');
    if (initialActiveSection && initialActiveSection.id === 'graph-section') {
        initialActiveSection.style.display = 'flex';
    }
    // --- 隐藏初始的图谱控件，除非已有图谱数据 ---
    if (graphControls && nodes.length === 0) {
        graphControls.style.display = 'none';
    }

    // --- 应用已保存的设置 ---
    applySavedSettings();
    
    // 自动加载图谱数据的脚本已移除
    /* 
    console.log("页面加载完成，自动加载图谱数据");
    // 使用setTimeout确保所有DOM元素都已完全初始化
    setTimeout(() => {
        try {
            loadGraphData(100);
        } catch (error) {
            console.error("自动加载图谱数据失败:", error);
        }
    }, 500);
    */

    // --- 侧边栏菜单切换逻辑 (恢复原状) ---
    if (menuItems && contentSections) {
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                menuItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                const targetSectionId = this.getAttribute('data-section');

                // 隐藏所有内容区域
                contentSections.forEach(section => {
                    section.style.display = 'none';
                    section.classList.remove('active');
                });

                const targetSection = document.getElementById(targetSectionId);
                if (targetSection) {
                    if(targetSectionId === 'graph-section') {
                        targetSection.style.display = 'flex';
                    } else {
                         targetSection.style.display = 'block';
                    }
                    targetSection.classList.add('active');
                }
            });
        });
    } else {
        console.error("无法找到菜单项或内容区域元素。");
    }

    // --- "加载图谱"按钮逻辑修改 ---
    if (loadGraphBtn) {
        loadGraphBtn.addEventListener('click', function() {
            console.log("加载图谱按钮被点击...");
            // 从Neo4j加载数据
            loadGraphData();
        });
    } else {
        console.warn("未找到加载图谱按钮。");
    }

    // --- 聊天发送逻辑 (核心修改) ---
    // 移除这个函数，使用全局版本
    
    // 加载Neo4j图谱数据
    async function loadGraphData(limit = 100) {
        try {
            // 显示加载中状态
            if (loadGraphBtn) loadGraphBtn.textContent = '加载中...';
            addMessage('正在从数据库加载图谱数据，请稍候...', 'ai');
            
            // 调用API获取图谱数据，确保limit为整数
            const response = await fetch(`/api/graph/all?limit=${parseInt(limit)}`);
            if (!response.ok) {
                throw new Error(`API错误: ${response.status}`);
            }
            const data = await response.json();
            console.log("API返回数据:", data); // 添加日志，检查API返回的数据
            
            if (data.success && data.data) {
                // 解码并处理节点数据
                nodes = data.data.nodes.map(n => {
                    try {
                        return {
                            ...n,
                            id: String(n.id),
                            name: String(n.name || ''),
                            labels: n.labels || ['Node']
                        };
                    } catch (err) {
                        console.error("节点数据处理错误:", err, n);
                        return {
                            id: String(n.id || '未知ID'),
                            name: '解析错误',
                            labels: ['Node']
                        };
                    }
                });
                
                // 解码并处理关系数据
                edges = data.data.relationships.map(r => {
                    try {
                        return {
                            ...r,
                            id: String(r.id),
                            startNodeId: String(r.startNodeId),
                            endNodeId: String(r.endNodeId),
                            type: String(r.type || 'RELATED_TO')
                        };
                    } catch (err) {
                        console.error("关系数据处理错误:", err, r);
                        return {
                            id: String(r.id || '未知ID'),
                            startNodeId: String(r.startNodeId || ''),
                            endNodeId: String(r.endNodeId || ''),
                            type: 'RELATED_TO'
                        };
                    }
                });
                
                console.log(`已加载 ${nodes.length} 个节点和 ${edges.length} 个关系`);
                
                // 验证节点和关系数据的完整性
                const nodeIds = new Set(nodes.map(n => n.id));
                const validEdges = edges.filter(e => 
                    nodeIds.has(e.startNodeId) && nodeIds.has(e.endNodeId)
                );
                
                if (validEdges.length < edges.length) {
                    console.warn(`过滤掉 ${edges.length - validEdges.length} 个无效关系（节点不存在）`);
                    edges = validEdges;
                }
                
                // 更新节点类型集合
                nodeTypes.clear();
                nodes.forEach(node => {
                    if (node.labels && node.labels.length > 0) {
                        nodeTypes.add(node.labels[0]);
                    }
                });
                
                // 初始化或更新图可视化
                initGraphVisualization();
                
                // 成功加载图后，隐藏占位符并显示控件
                if (graphPlaceholder) graphPlaceholder.style.display = 'none';
                if (graphControls) graphControls.style.display = 'flex';
                
                // 显示统计信息
                addMessage(`成功加载图谱数据: ${nodes.length} 个节点和 ${edges.length} 个关系`, 'ai');
                
                // 恢复按钮文本
                if (loadGraphBtn) loadGraphBtn.textContent = '刷新图谱';
            } else {
                throw new Error(data.message || '加载图谱失败');
            }
        } catch (error) {
            console.error('加载图谱数据出错:', error);
            addMessage(`加载图谱数据出错: ${error.message}`, 'ai', true);
            
            // 恢复按钮文本
            if (loadGraphBtn) loadGraphBtn.textContent = '重试加载图谱';
        }
    }

    // 搜索图谱数据
    async function searchGraphData(keyword) {
        if (!keyword) return;
        
        try {
            addMessage(`正在搜索与"${keyword}"相关的节点...`, 'ai');
            
            // 调用搜索API
            const response = await fetch(`/api/graph/search?keyword=${encodeURIComponent(keyword)}`);
            if (!response.ok) {
                throw new Error(`API错误: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.success) {
                // 更新图谱数据
                nodes = data.data.nodes.map(n => ({
                    ...n,
                    id: String(n.id),
                    labels: n.labels || ['Node']
                }));
                
                edges = data.data.relationships.map(r => ({
                    ...r,
                    id: String(r.id),
                    startNodeId: String(r.startNodeId),
                    endNodeId: String(r.endNodeId)
                }));
                
                // 初始化或更新图可视化
                initGraphVisualization();
                
                // 隐藏占位符并显示控件
                if (graphPlaceholder) graphPlaceholder.style.display = 'none';
                if (graphControls) graphControls.style.display = 'flex';
                
                // 显示结果消息
                addMessage(data.message || `找到 ${nodes.length} 个节点和 ${edges.length} 个关系`, 'ai');
            } else {
                addMessage(data.message || '搜索未返回结果', 'ai');
            }
        } catch (error) {
            console.error('搜索图谱数据出错:', error);
            addMessage(`搜索出错: ${error.message}`, 'ai', true);
        }
    }

    async function sendMessage() {
        if (!chatInput || !chatMessages || !graphContainer) return;
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        console.log("发送消息:", messageText); // 添加调试日志
        addMessage(messageText, 'user');
        chatInput.value = '';
        const thinkingMessageElement = addMessage('思考中...', 'ai');

        try {
            // 根据消息类型确定处理方式
            if (messageText.startsWith('/search ')) {
                // 搜索命令
                chatMessages.removeChild(thinkingMessageElement);
                await searchGraphData(messageText.substring(8).trim());
                return;
            }
            
            if (messageText.startsWith('/load')) {
                // 加载图谱命令
                chatMessages.removeChild(thinkingMessageElement);
                await loadGraphData();
                return;
            }
            
            if (messageText.startsWith('/help')) {
                // 帮助命令
                chatMessages.removeChild(thinkingMessageElement);
                addMessage(`可用命令:
- /search <关键词>: 搜索与关键词相关的节点
- /load: 加载完整图谱数据
- /help: 显示此帮助信息
其他任何输入将被视为问题，由AI结合图谱数据回答。`, 'ai');
                return;
            }
            
            // 处理普通问题，调用本地API获取图谱数据
            console.log("调用本地API获取图谱数据");
            const graphResponse = await fetch('/api/ai/graph-query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: messageText })
            }).catch(err => {
                console.error("本地API请求失败:", err);
                return { ok: false, statusText: err.message };
            });
            
            if (!graphResponse.ok) {
                console.error("图谱API请求失败:", graphResponse.statusText);
            }
            
            // 并行调用远程AI聊天API
            console.log("调用远程AI聊天API");
            let chatPromise;
            try {
                chatPromise = fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer 69362561-5030-4509-b828-40cc66e2760c'
                    },
                    body: JSON.stringify({
                        model: 'deepseek-v3-250324',
                        messages: [
                            {"role": "system", "content": "你是人工智能知识图谱助手，你的回答应简短、专业且准确。"},
                            {"role": "user", "content": messageText}
                        ]
                    })
                });
            } catch (err) {
                console.error("远程AI API请求失败:", err);
                chatPromise = Promise.resolve({ ok: false, statusText: err.message });
            }

            // 处理图谱数据结果
            let graphData = null;
            if (graphResponse.ok) {
                try {
                    graphData = await graphResponse.json();
                    console.log("图谱数据响应:", graphData);
                } catch (err) {
                    console.error("解析图谱数据失败:", err);
                }
                
                if (graphData && graphData.success && graphData.data.graphData) {
                    const { nodes: newNodes, relationships: newRels } = graphData.data.graphData;
                    console.log(`获取到 ${newNodes.length} 个节点和 ${newRels.length} 个关系`);
                    
                    // 更新图谱数据
                    if (newNodes.length > 0) {
                        nodes = newNodes.map(n => ({
                            ...n,
                            id: String(n.id),
                            labels: n.labels || ['Node']
                        }));
                        
                        edges = newRels.map(r => ({
                            ...r,
                            id: String(r.id),
                            startNodeId: String(r.startNodeId),
                            endNodeId: String(r.endNodeId)
                        }));
                        
                        // 初始化或更新图可视化
                        initGraphVisualization();
                        
                        // 隐藏占位符并显示控件
                        if (graphPlaceholder) graphPlaceholder.style.display = 'none';
                        if (graphControls) graphControls.style.display = 'flex';
                    }
                }
            }
            
            // 获取聊天回复
            let chatResponse;
            try {
                chatResponse = await chatPromise;
                console.log("收到AI聊天响应状态:", chatResponse.ok);
            } catch (error) {
                console.error("等待聊天响应时出错:", error);
                chatResponse = { ok: false };
            }
            
            // 移除"思考中"
            if (thinkingMessageElement && thinkingMessageElement.parentNode === chatMessages) {
                chatMessages.removeChild(thinkingMessageElement);
            }

            // 处理聊天回复
            if (chatResponse && chatResponse.ok) {
                try {
                    const chatData = await chatResponse.json();
                    console.log("解析AI聊天响应");
                    if (chatData.choices && chatData.choices[0] && chatData.choices[0].message) {
                        addMessage(chatData.choices[0].message.content, 'ai');
                    } else {
                        console.error("AI响应格式不正确:", chatData);
                        addMessage('抱歉，获取回复时出错。响应格式不正确。', 'ai', true);
                    }
                } catch (error) {
                    console.error("解析AI聊天响应时出错:", error);
                    addMessage(`解析AI回复时出错: ${error.message}`, 'ai', true);
                }
            } else {
                // 如果远程AI API失败，使用一个本地回退响应
                console.warn("AI聊天请求失败，使用本地回退响应");
                
                // 提取图谱数据中的实体作为回复内容
                let fallbackMessage = '抱歉，无法连接到AI服务。';
                
                if (graphData && graphData.success && graphData.data.entities) {
                    const entities = graphData.data.entities;
                    if (entities.length > 0) {
                        fallbackMessage += `\n\n我在图谱中找到了以下相关内容: ${entities.join(', ')}`;
                    }
                }
                
                addMessage(fallbackMessage, 'ai', true);
            }
        } catch (error) {
            console.error('发送消息或处理回复时出错:', error);
            if (thinkingMessageElement && thinkingMessageElement.parentNode === chatMessages) {
                chatMessages.removeChild(thinkingMessageElement);
            }
            addMessage(`发生错误: ${error.message}`, 'ai', true);
        }
    }

    // --- 绑定聊天发送事件 ---
    if (chatSendButton && chatInput) {
        chatSendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    } else {
        console.warn("未找到聊天输入框或发送按钮。");
    }

    // --- 图谱可视化函数 (恢复) ---
    function initGraphVisualization() {
        if (!graphContainer) {
            console.error("图谱容器不存在，无法初始化可视化");
            return;
        }
        
        console.log("开始初始化图谱可视化");
        
        try {
            // 检查节点和边数据
            if (!nodes || nodes.length === 0) {
                console.warn("没有节点数据可用于可视化");
                // 显示一个提示信息
                graphContainer.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100%;"><p>没有节点数据可用。请尝试点击"加载AI知识图谱"按钮。</p></div>';
                return;
            }
            
            console.log(`准备可视化 ${nodes.length} 个节点和 ${edges.length} 个边`);

            // 准备 vis-network 数据格式
            const visNodes = nodes.map(node => {
                let color = '#1890ff'; // Default color
                let icon = undefined; // Default: no icon
                let shape = 'dot';
                let size = 15;
                
                // 防止节点标签为undefined导致的错误
                const nodeLabels = node.labels && Array.isArray(node.labels) ? node.labels : ['Node'];
                
                if (nodeLabels.length > 0) {
                    switch (nodeLabels[0]) {
                        case 'Person': color = '#52c41a'; icon = { code: '\uf007', color: '#fff' }; shape = 'icon'; size = 20; break; // fa-user
                        case 'Organization': color = '#faad14'; icon = { code: '\uf1ad', color: '#fff' }; shape = 'icon'; size = 20; break; // fa-building
                        case 'Technology': color = '#722ed1'; icon = { code: '\uf121', color: '#fff' }; shape = 'icon'; size = 20; break; // fa-code
                        case 'Document': color = '#eb2f96'; icon = { code: '\uf15c', color: '#fff' }; shape = 'icon'; size = 20; break; // fa-file-alt
                        case 'Concept': color = '#13c2c2'; shape = 'ellipse'; break;
                        case 'Event': color = '#ff4d4f'; shape = 'star'; break;
                        case 'Location': color = '#ffa940'; icon = { code: '\uf3c5', color: '#fff' }; shape = 'icon'; size = 20; break; // fa-map-marker-alt
                        case 'Tag': color = '#bfbfbf'; shape = 'box'; size = 10; break;
                    }
                }
                
                // 安全地获取节点名称，防止乱码问题
                let nodeName = '';
                try {
                    nodeName = node.name || node.title || `ID: ${node.id}`.substring(0,10);
                } catch (e) {
                    console.warn(`获取节点名称出错:`, e);
                    nodeName = `ID: ${node.id}`.substring(0,10);
                }
                
                // 安全地构建提示信息
                let titleText = '';
                try {
                    const nodeType = nodeLabels.join(', ');
                    const propertiesStr = JSON.stringify(node.properties || {});
                    titleText = `类型: ${nodeType}\nID: ${node.id}\n属性: ${propertiesStr.substring(0, 200)}`;
                } catch (e) {
                    console.warn('构建节点提示信息出错:', e);
                    titleText = `ID: ${node.id}`;
                }
                
                return {
                    id: node.id,
                    label: nodeName,
                    title: titleText,
                    color: { background: color, border: color },
                    shape: shape,
                    size: size,
                    icon: icon,
                    font: { 
                        color: shape === 'icon' ? '#333' : '#fff', 
                        strokeWidth: shape === 'icon' ? 0 : 2, 
                        strokeColor: '#333' 
                    }
                };
            });
            
            // 构建边的集合，过滤无效边（如果源节点或目标节点不存在）
            const validNodeIds = new Set(visNodes.map(node => node.id));
            const visEdges = [];
            
            for (const edge of edges) {
                try {
                    // 检查源节点和目标节点是否存在
                    if (!validNodeIds.has(edge.startNodeId) || !validNodeIds.has(edge.endNodeId)) {
                        console.warn(`跳过显示边 ${edge.id}: 节点不存在 ${edge.startNodeId} -> ${edge.endNodeId}`);
                        continue;
                    }
                    
                    // 安全地获取关系类型
                    let edgeType = '';
                    try {
                        edgeType = edge.type || 'RELATED_TO';
                    } catch (e) {
                        console.warn('获取关系类型出错:', e);
                        edgeType = 'RELATED_TO';
                    }
                    
                    // 避免过长的关系标签导致的显示问题
                    const edgeLabel = edgeType.length > 10 ? edgeType.substring(0, 7) + '...' : edgeType;
                    
                    visEdges.push({
                        id: edge.id,
                        from: edge.startNodeId,
                        to: edge.endNodeId,
                        label: edgeLabel,
                        title: edgeType, // 完整类型作为提示
                        arrows: 'to',
                        color: { color: '#999', highlight: '#1a237e', hover: '#1a237e' },
                        font: { align: 'middle', size: 10 },
                        smooth: { type: 'cubicBezier', forceDirection: 'horizontal', roundness: 0.4 }
                    });
                } catch (error) {
                    console.error('处理边时出错:', error, edge);
                }
            }
            
            console.log(`实际可视化 ${visNodes.length} 个节点和 ${visEdges.length} 个边`);

            // 清空旧的图谱容器
            graphContainer.innerHTML = '';
            const visContainer = document.createElement('div');
            visContainer.style.width = '100%';
            visContainer.style.height = '100%';
            graphContainer.appendChild(visContainer);

            const data = { nodes: visNodes, edges: visEdges };
            console.log("创建网络图实例");
            
            const options = {
                physics: {
                    enabled: true,
                    repulsion: { centralGravity: 0.1, springLength: 150, springConstant: 0.05, nodeDistance: 120 },
                    solver: 'repulsion',
                    stabilization: { iterations: 50 }
                },
                interaction: {
                    hover: true,
                    tooltipDelay: 200,
                    navigationButtons: false,
                    keyboard: true
                },
                nodes: {
                    font: { size: 12 }
                },
                edges: {
                    width: 1.5
                }
            };

            try {
                network = new vis.Network(visContainer, data, options);
                console.log("成功创建网络图实例");
                
                // 添加节点点击事件 (用于在聊天区显示详情)
                network.on('click', function(params) {
                    if (params.nodes.length > 0) {
                        const nodeId = params.nodes[0];
                        const node = nodes.find(n => n.id === nodeId);
                        if (node) {
                            console.log("点击节点:", node.name || node.id);
                            showNodeDetailsGlobal(node); // 使用全局函数显示节点详情
                        }
                    }
                });

                // 稳定后停止物理模拟（可选，提高性能）
                network.on("stabilizationIterationsDone", function () {
                    console.log("网络图稳定化完成");
                    network.setOptions( { physics: false } );
                });
                
                // 检查是否初始化成功
                if (!network) {
                    console.error("网络图初始化失败，network对象为null");
                }
            } catch (error) {
                console.error("创建网络图实例时出错:", error);
                graphContainer.innerHTML = `<div style="color:red;padding:20px;">图谱初始化失败: ${error.message}</div>`;
            }
        } catch (error) {
            console.error("图谱可视化过程中出错:", error);
            graphContainer.innerHTML = `<div style="color:red;padding:20px;">图谱可视化失败: ${error.message}</div>`;
        }
    }

    // --- 显示节点详情函数 (恢复，在聊天区显示) ---
    function showNodeDetails(node) {
        const nodeName = node.name || node.title || `ID: ${node.id}`; // Use backticks for template literal
        const nodeType = node.labels && node.labels.length > 0 ? node.labels.join(', ') : 'Unknown Type';

        // Build the details string carefully using basic concatenation and standard newlines
        let detailText = "Node Details:\n"; // Simple title
        detailText += "Name: " + nodeName + "\n";
        detailText += "Type: " + nodeType + "\n";
        detailText += "ID: " + node.id + "\n";

        // Properties
        if (node.properties && Object.keys(node.properties).length > 0) {
            detailText += "Properties:\n";
            for (const [key, value] of Object.entries(node.properties)) {
                if (key !== 'name' && key !== 'title') { // Avoid redundancy
                    // Indent with simple spaces
                    detailText += "  " + key + ": " + JSON.stringify(value) + "\n";
                }
            }
        }

        // Relationships
        const connectedEdges = edges.filter(edge => edge.startNodeId === node.id || edge.endNodeId === node.id);
        if (connectedEdges.length > 0) {
            detailText += "Relationships:\n";
            connectedEdges.forEach(edge => {
                const isStart = edge.startNodeId === node.id;
                // Use simple ASCII arrows
                const arrow = isStart ? '-->' : '<--';
                const otherNodeId = isStart ? edge.endNodeId : edge.startNodeId;
                const otherNode = nodes.find(n => n.id === otherNodeId);
                // Safely get other node name
                const otherNodeName = otherNode ? (otherNode.name || otherNode.title || `ID: ${otherNode.id}`) : 'Unknown Node';
                // Indent with simple spaces
                detailText += "  " + arrow + " [" + edge.type + "] " + otherNodeName + "\n";
            });
        }

        // Add the plain text details to chat
        addMessage(detailText, 'ai');
    }

    // --- 图谱控制按钮逻辑 (恢复) ---
    const zoomInBtn = graphControls ? graphControls.querySelector('.control-btn:nth-child(1)') : null;
    const zoomOutBtn = graphControls ? graphControls.querySelector('.control-btn:nth-child(2)') : null;
    const resetBtn = graphControls ? graphControls.querySelector('.control-btn:nth-child(3)') : null;

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            if (network) {
                network.moveTo({ scale: network.getScale() * 1.2 });
            }
        });
    }
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            if (network) {
                network.moveTo({ scale: network.getScale() / 1.2 });
            }
        });
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (network) {
                network.fit(); // fit() 会自动调整缩放和平移以适应所有节点
            }
        });
    }

    // --- 设置功能逻辑 ---
    if (themeSelect) {
        themeSelect.addEventListener('change', function() {
            applyTheme(this.value);
            localStorage.setItem('appTheme', this.value);
        });
    }

    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            applyLanguage(this.value);
            localStorage.setItem('appLanguage', this.value);
            // 不需要 alert 了，因为效果是即时的
            // alert('语言设置已保存。页面刷新后完全生效。');
        });
    }

    // 保存按钮的事件监听器 (目前仅作提示)
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            // 由于主题和语言是即时应用的，此按钮当前没有特定操作
            alert('设置已即时应用并保存。');
        });
    }

    // --- 登录/注销按钮点击事件 ---
    if (loginLogoutLink) {
        loginLogoutLink.addEventListener('click', function(event) {
            const isLoggedIn = localStorage.getItem('isUserLoggedIn') === 'true';
            if (isLoggedIn) {
                event.preventDefault(); // 阻止链接跳转
                // 执行注销
                localStorage.removeItem('isUserLoggedIn');
                // 更新按钮状态，传递当前选中的语言
                const currentLanguage = languageSelect ? languageSelect.value : (localStorage.getItem('appLanguage') || 'zh-CN');
                updateLoginButtonUI(currentLanguage);
                alert('已注销'); // 可选提示
            }
            // 如果未登录，则不阻止默认行为，链接会跳转到 login.html
        });
    }

    // 添加搜索框功能
    if (searchButton && searchInput) {
        // 绑定搜索按钮点击事件
        searchButton.addEventListener('click', function() {
            searchAndFocusNode();
        });
        
        // 绑定搜索框回车事件
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchAndFocusNode();
            }
        });
    } else {
        console.warn("未找到搜索框或搜索按钮。");
    }

    // 添加消息到聊天框函数
    function addMessage(content, type = 'ai', isError = false) {
        if (!chatMessages) return null;
        console.log("添加消息:", content, type); // 添加调试日志
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type);
        if (isError) {
            messageDiv.classList.add('error');
        }
        const messageContentDiv = document.createElement('div');
        messageContentDiv.classList.add('message-content');
        messageContentDiv.textContent = content;
        messageDiv.appendChild(messageContentDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageDiv;
    }
    
    // 将全局函数设置为使用局部函数
    window.addMessageGlobal = function(content, type = 'ai', isError = false) {
        return addMessage(content, type, isError);
    };
    
    // 将全局函数设置为使用局部函数
    window.showNodeDetailsGlobal = function(node) {
        return showNodeDetails(node);
    };

    // 在设置页面加载时刷新一次状态
    const currentSectionId = document.querySelector('.content-section.active')?.id;
    if (currentSectionId === 'settings-section') {
        // 原来的refreshImportStats()调用已删除
    }
    
    // 添加菜单切换监听器，当切换到设置页面时刷新状态
    if (menuItems) {
        menuItems.forEach(item => {
            const originalClickHandler = item.onclick;
            
            item.addEventListener('click', function() {
                const targetSectionId = this.getAttribute('data-section');
                // 原来的设置页面导入状态刷新代码已删除
            });
        });
    }
});

// --- 辅助函数 ---

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    // 更新下拉框选择（如果通过代码应用主题）
    if (themeSelect && themeSelect.value !== theme) {
        themeSelect.value = theme;
    }
}

function applyLanguage(language) {
    // 设置 <html> 标签的 lang 属性
    document.documentElement.lang = language;

    // 更新下拉框选择（如果通过代码应用语言）
    if (languageSelect && languageSelect.value !== language) {
        languageSelect.value = language;
    }

    // 获取当前语言的翻译
    const langTranslations = translations[language] || translations['en-US']; // 默认英语

    // 遍历所有带 data-translate-key 的元素并更新文本
    document.querySelectorAll('[data-translate-key]').forEach(element => {
        const key = element.getAttribute('data-translate-key');
        const translation = langTranslations[key];

        if (translation) {
            // 检查是否是输入框的 placeholder
            if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                element.placeholder = translation;
            } else if (element.tagName === 'TITLE') { // 特殊处理标题
                document.title = translation;
            } else {
                // 更新元素的文本内容 (对于按钮内的 span 等)
                element.textContent = translation;
            }
        } else {
            console.warn(`Translation not found for key: ${key} in language: ${language}`);
        }
    });

    // 语言更改后，立即更新登录/注销按钮的文本，传递当前语言
    updateLoginButtonUI(language);
}

function applySavedSettings() {
    const savedTheme = localStorage.getItem('appTheme') || 'light';
    const savedLanguage = localStorage.getItem('appLanguage') || 'zh-CN'; // 默认中文

    // 先应用语言
    applyLanguage(savedLanguage);
    // 再应用主题
    applyTheme(savedTheme);
    // 最后根据登录状态更新按钮 (因为 applyLanguage 也会调用它，这里确保初始加载时执行)
    // updateLoginButtonUI(); // applyLanguage 内部已调用，无需重复
}

function updateLoginButtonUI(language) {
    if (!loginLogoutLink || !loginLogoutBtn) return;

    const isLoggedIn = localStorage.getItem('isUserLoggedIn') === 'true';
    // 使用传入的 language 参数获取翻译
    const currentLanguage = language || 'zh-CN'; // 提供一个默认值
    const currentTranslations = translations[currentLanguage] || translations['en-US'];

    if (isLoggedIn) {
        loginLogoutBtn.textContent = currentTranslations.logoutButton || 'Logout';
        loginLogoutLink.removeAttribute('href'); 
        loginLogoutLink.style.cursor = 'pointer'; 
    } else {
        loginLogoutBtn.textContent = currentTranslations.loginButton || 'Login';
        loginLogoutLink.setAttribute('href', 'login.html');
        loginLogoutLink.style.cursor = ''; 
    }
}

// 搜索节点并聚焦
function searchAndFocusNode() {
    if (!searchInput || !network || nodes.length === 0) return;
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (!searchTerm) return;
    
    // 在节点中查找匹配名称的节点
    const foundNodes = nodes.filter(node => 
        (node.name && node.name.toLowerCase().includes(searchTerm)) || 
        (node.properties && node.properties.name && 
         node.properties.name.toLowerCase().includes(searchTerm))
    );
    
    if (foundNodes.length > 0) {
        // 找到节点，聚焦到第一个匹配的节点
        const nodeId = foundNodes[0].id;
        
        // 切换到图谱页面（如果不在图谱页面）
        const graphMenuItem = document.querySelector('.menu li[data-section="graph-section"]');
        if (graphMenuItem) {
            graphMenuItem.click();
        }
        
        // 聚焦并放大到该节点
        network.focus(nodeId, {
            scale: 1.5, // 放大比例
            animation: {
                duration: 1000,
                easingFunction: "easeInOutQuad"
            }
        });
        
        // 高亮显示该节点
        network.selectNodes([nodeId]);
        
        // 在聊天区域显示节点信息，使用全局showNodeDetailsGlobal函数
        showNodeDetailsGlobal(foundNodes[0]);
    } else {
        // 没有找到节点，使用全局addMessageGlobal函数
        addMessageGlobal(`未找到名称包含"${searchTerm}"的节点`, 'ai');
    }
}