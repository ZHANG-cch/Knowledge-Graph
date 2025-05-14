// 翻译字典
const translations = {
    'zh-CN': {
        'pageTitle': 'AI图谱 - 管理页面',
        'userManagement': '用户管理',
        'dataEntry': '数据录入',
        'videoManagement': '视频管理',
        'systemSettings': '系统设置',
        'addUser': '添加用户',
        'saveSettings': '保存设置',
        'themeLabel': '系统主题:',
        'languageLabel': '语言设置:',
        'themeLight': '浅色',
        'themeDark': '深色'
    },
    'en-US': {
        'pageTitle': 'AI Graph - Admin',
        'userManagement': 'User Management',
        'dataEntry': 'Data Entry',
        'videoManagement': 'Video Management',
        'systemSettings': 'System Settings',
        'addUser': 'Add User',
        'saveSettings': 'Save Settings',
        'themeLabel': 'Theme:',
        'languageLabel': 'Language:',
        'themeLight': 'Light',
        'themeDark': 'Dark'
    }
};

// 全局变量
let currentSection = 'user-management';
let isUploading = false;
let dataImportInitialized = false;

// 用户数据（提前硬编码，避免API问题）
const demoUsers = [
  {
    username: 'admin3',
    email: 'admin3@163.com',
    type: 'admin',
    _id: '3zP5nJECKuKqlpYJ'
  },
  {
    username: 'user',
    email: '15003168431@163.com',
    type: 'user',
    _id: 'M5NyHDM2kuvBxHad'
  },
  {
    username: 'admin2',
    email: 'sxadc@163.com',
    type: 'user',
    _id: 'QowiiBfYnTklscVE'
  },
  {
    username: 'user1',
    email: 'aa150sdcsd@452.com',
    type: 'user',
    _id: 'paqOorzUxtf0cadP'
  },
  {
    username: 'admin',
    email: 'admin@example.com',
    type: 'admin',
    _id: 'xtoxqraVNW4v8RV1'
  }
];

// 主初始化函数
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，开始初始化管理界面...');
    
    // 检查用户登录状态
    checkUserPermission();
    
    // 初始化导航
    initNavigation();
    
    // 初始化用户管理
    initUserManagement();
    
    // 初始化模态框
    initModals();
    
    // 初始化系统设置
    initSystemSettings();
    
    // 为所有事件添加委托处理
    initEventDelegation();
});

// 检查用户权限
function checkUserPermission() {
    const userType = localStorage.getItem('userType');
    if (userType !== 'admin') {
        console.log('用户权限不足，准备跳转...');
        // alert('您没有访问管理页面的权限！');
        // window.location.href = 'login.html';
    }
}

// 初始化导航功能
function initNavigation() {
    const menuItems = document.querySelectorAll('.menu li');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // 更新菜单状态
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // 获取目标内容区
            const targetId = this.getAttribute('data-target');
            currentSection = targetId;
            
            // 显示对应内容区
            switchContentSection(targetId);
            
            // 更新页面标题和动作按钮
            updateHeaderAndActions(targetId);
        });
    });
    
    // 默认显示用户管理
    document.querySelector('.menu li.active')?.click();
}

// 切换内容区域
function switchContentSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active');
        
        // 如果切换到数据录入，并且尚未初始化，则初始化上传区域
        if (sectionId === 'data-entry' && !dataImportInitialized) {
            initDataImport();
            dataImportInitialized = true;
        }
    }
}

// 更新页面标题和动作按钮
function updateHeaderAndActions(sectionId) {
    // 更新标题
    const headerTitle = document.querySelector('.header h1');
    const actionDiv = document.querySelector('.user-actions');
    
    if (!headerTitle || !actionDiv) return;
    
    const titleMap = {
        'user-management': '用户管理',
        'data-entry': '数据录入',
        'video-management': '视频管理',
        'system-settings': '系统设置'
    };
    
    headerTitle.textContent = titleMap[sectionId] || '管理页面';
    
    // 更新动作按钮
    actionDiv.innerHTML = '';
    
    if (sectionId === 'user-management') {
        actionDiv.innerHTML = `
            <button id="add-user-btn" class="primary-btn">
                <i class="fas fa-plus-circle"></i>
                <span>添加用户</span>
            </button>
            <button id="logout-btn" class="logout-btn">
                <i class="fas fa-sign-out-alt"></i>
                <span>退出登录</span>
            </button>
        `;
    }
}

// 初始化用户管理功能
function initUserManagement() {
    console.log('初始化用户管理功能...');
    
    // 确保有表格体
    const userTableBody = document.querySelector('#user-management .user-list table tbody');
    if (!userTableBody) {
        console.error('找不到用户表格！');
        return;
    }
    
    // 显示加载中
    userTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">加载用户数据...</td></tr>';
    
    // 先使用演示数据渲染用户列表
    renderUserList(demoUsers);
    
    // 然后尝试从API获取真实数据
    fetchUsers();
}

// 渲染用户列表
function renderUserList(users) {
    const tableBody = document.querySelector('#user-management .user-list table tbody');
    if (!tableBody) return;
      
      // 清空表格
    tableBody.innerHTML = '';
    
    if (!users || users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="no-data">暂无用户数据</td></tr>';
        return;
    }
    
    // 填充用户数据
        users.forEach(user => {
        const row = document.createElement('tr');
        row.dataset.userId = user._id || user.id || '';
      
          const roleDisplay = user.type === 'admin' 
            ? '<span class="role-badge admin">管理员</span>' 
            : '<span class="role-badge user">普通用户</span>';
      
          row.innerHTML = `
            <td>${user.username || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${roleDisplay}</td>
            <td class="action-buttons">
                <button class="edit-btn" data-user-id="${user._id || user.id || ''}">编辑</button>
                <button class="delete-btn" data-user-id="${user._id || user.id || ''}">删除</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// 从API获取用户数据
async function fetchUsers() {
    try {
        console.log('从API获取用户数据...');
        
        const response = await fetch('/local/users');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const users = await response.json();
        console.log('获取到用户数据:', users);
        
        if (Array.isArray(users) && users.length > 0) {
            renderUserList(users);
      }
    } catch (error) {
        console.error('获取用户数据失败:', error);
        // 已经渲染了演示数据，所以这里不需要额外处理
    }
}

// 初始化模态框功能
function initModals() {
    // 添加用户模态框
    const addUserModal = document.getElementById('add-user-modal');
    const addUserForm = document.getElementById('add-user-form');
    
    // 编辑用户模态框
    const editUserModal = document.getElementById('edit-user-modal');
    const editUserForm = document.getElementById('edit-user-form');

    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUserSubmit);
    }
    
    if (editUserForm) {
        editUserForm.addEventListener('submit', handleEditUserSubmit);
    }
}

// 处理添加用户表单提交
async function handleAddUserSubmit(event) {
        event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
        const userType = document.getElementById('userType').value;
        
        if (!username || !email || !password) {
          alert('请填写所有必填字段');
          return;
        }

        try {
          const response = await fetch('/local/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password,
                userType
            })
          });

          const data = await response.json();
          
          if (response.ok) {
            alert('用户添加成功!');
            document.getElementById('add-user-modal').style.display = 'none';
            document.getElementById('add-user-form').reset();
            
            // 刷新用户列表
            fetchUsers();
          } else {
            alert(data.message || '添加用户失败');
          }
        } catch (error) {
        console.error('添加用户出错:', error);
          alert('添加用户时发生错误: ' + error.message);
    }
}

// 处理编辑用户表单提交
async function handleEditUserSubmit(event) {
    event.preventDefault();
    
    const userId = document.getElementById('edit-user-id').value;
    const username = document.getElementById('edit-username').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const userType = document.getElementById('edit-userType').value;
    
    if (!username || !email) {
        alert('请填写所有必填字段');
        return;
    }
    
    try {
        const response = await fetch(`/local/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                userType
            })
        });
        
        if (response.ok) {
            alert('用户信息更新成功');
            document.getElementById('edit-user-modal').style.display = 'none';
            
            // 刷新用户列表
            fetchUsers();
        } else {
            const data = await response.json();
            alert(data.message || '更新用户失败');
        }
    } catch (error) {
        console.error('更新用户信息时发生错误:', error);
        alert('更新用户信息时发生错误: ' + error.message);
    }
}

// 事件委托处理
function initEventDelegation() {
    // 全局点击事件委托
    document.body.addEventListener('click', function(event) {
        // 处理模态框打开
        if (event.target.id === 'add-user-btn' || event.target.closest('#add-user-btn')) {
            document.getElementById('add-user-modal').style.display = 'block';
        }
        
        // 处理模态框关闭
        if (event.target.classList.contains('close')) {
            const modal = event.target.closest('.modal');
            if (modal) modal.style.display = 'none';
        }
        
        // 处理模态框外点击关闭
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
        
        // 处理退出登录
        if (event.target.id === 'logout-btn' || event.target.closest('#logout-btn')) {
      if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('isUserLoggedIn');
        localStorage.removeItem('userType');
        window.location.href = 'login.html';
      }
        }
        
        // 处理删除用户
        if (event.target.classList.contains('delete-btn')) {
            const userId = event.target.dataset.userId;
            if (userId && confirm('确认删除此用户？')) {
                deleteUser(userId);
            }
        }
        
        // 处理编辑用户
        if (event.target.classList.contains('edit-btn')) {
            const userId = event.target.dataset.userId;
            if (userId) {
                openEditUserModal(userId, event.target);
            }
        }
    });
}

// 删除用户
async function deleteUser(userId) {
    try {
        const response = await fetch(`/local/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('用户删除成功');
            fetchUsers();
        } else {
            const data = await response.json();
            alert(data.message || '删除用户失败');
        }
    } catch (error) {
        console.error('删除用户时发生错误:', error);
        alert('删除用户时发生错误: ' + error.message);
    }
}

// 打开编辑用户模态框
function openEditUserModal(userId, buttonElement) {
    // 从行中获取数据
    const row = buttonElement.closest('tr');
    if (!row) {
        alert('无法找到用户数据');
    return;
    }
    
    const username = row.cells[0].textContent;
    const email = row.cells[1].textContent;
    const isAdmin = row.cells[2].querySelector('.role-badge.admin') !== null;
    
    // 填充表单
    document.getElementById('edit-user-id').value = userId;
    document.getElementById('edit-username').value = username !== 'N/A' ? username : '';
    document.getElementById('edit-email').value = email !== 'N/A' ? email : '';
    document.getElementById('edit-userType').value = isAdmin ? 'admin' : 'user';
    
    // 显示模态框
    document.getElementById('edit-user-modal').style.display = 'block';
}

// 初始化数据导入功能
function initDataImport() {
    const dropArea = document.getElementById('drop-area');
    if (!dropArea) return;
    
    // 为数据导入区域添加清空数据库按钮，避免重复添加
    const dataImportContainer = dropArea.closest('.data-import-container');
    if (dataImportContainer) {
        // 检查是否已存在清空数据库按钮
        if (!document.getElementById('clear-db-btn')) {
            // 添加清空数据库按钮
            const clearDbBtnContainer = document.createElement('div');
            clearDbBtnContainer.className = 'clear-db-container';
            clearDbBtnContainer.innerHTML = `
                <button type="button" id="clear-db-btn" class="danger-btn">
                    <i class="fas fa-trash-alt"></i> 清空数据库
                </button>
                <p class="warning-text">警告：此操作将删除Neo4j数据库中的所有数据，且无法恢复！</p>
            `;
            // 插入到import-log前面
            const importLog = dataImportContainer.querySelector('.import-log');
            if (importLog) {
                dataImportContainer.insertBefore(clearDbBtnContainer, importLog);
            } else {
                dataImportContainer.appendChild(clearDbBtnContainer);
            }
            
            // 添加清空数据库按钮事件
            const clearDbBtn = document.getElementById('clear-db-btn');
            if (clearDbBtn) {
                clearDbBtn.addEventListener('click', clearDatabase);
            }
        }
    }
    
    // 初始化标签页切换
    initImportTabs();
    
    // 初始化一键导入
    initOneStepImport();
    
    // 初始化分步导入
    initStepByStepImport();
    
    // 初始化数据统计
    initDataStats();
}

// 初始化导入标签页
function initImportTabs() {
    const tabButtons = document.querySelectorAll('.import-tabs .tab-btn');
    const importPanels = document.querySelectorAll('.import-panel');
    
    // 删除现有的事件监听器，避免重复添加
    tabButtons.forEach(button => {
        // 克隆按钮来删除所有事件监听器
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
    });
    
    // 重新获取标签按钮引用
    const newTabButtons = document.querySelectorAll('.import-tabs .tab-btn');
    
    newTabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 更新标签状态
            newTabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // 显示对应面板
            const targetPanel = this.getAttribute('data-target');
            importPanels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === targetPanel) {
                    panel.classList.add('active');
                }
            });
        });
    });
}

// 初始化一键导入
function initOneStepImport() {
    const dropArea = document.getElementById('drop-area');
    if (!dropArea) return;
    
    dropArea.innerHTML = `
        <i class="fas fa-cloud-upload-alt"></i>
        <p>拖放CSV文件到此处或点击上传</p>
        <p class="upload-hint">请同时选择两个文件：节点文件和关系文件</p>
        <div class="file-buttons">
            <button type="button" class="upload-btn" id="select-files-btn">选择CSV文件</button>
            <div class="selected-files">
                <div class="file-item" id="node-file-info">未选择节点文件</div>
                <div class="file-item" id="relation-file-info">未选择关系文件</div>
            </div>
        </div>
    `;
    
    // 创建文件输入元素
    let fileInput = document.getElementById('hidden-file-input');
    
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'hidden-file-input';
        fileInput.accept = '.csv';
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
    }
  
    // 点击上传区域触发文件选择
    const selectBtn = document.getElementById('select-files-btn');
    if (selectBtn) {
        selectBtn.addEventListener('click', function() {
            if (isUploading) {
                alert('文件正在上传中，请等待完成');
                return;
            }
            fileInput.click();
        });
    }
    
    // 文件选择事件
    fileInput.addEventListener('change', handleFileSelect);
    
    // 拖放功能
    dropArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('highlight');
    });
    
    dropArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('highlight');
    });
    
    dropArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('highlight');
        
        if (isUploading) {
            alert('文件正在上传中，请等待完成');
            return;
        }
      
        const files = e.dataTransfer.files;
        handleFiles(files);
    });
}

// 初始化分步导入
function initStepByStepImport() {
    // 初始化节点上传区域
    initNodeUploadArea();
    
    // 初始化关系上传区域
    initRelationUploadArea();
    
    // 添加导入节点按钮事件
    const importNodesBtn = document.getElementById('import-nodes-btn');
    if (importNodesBtn) {
        importNodesBtn.addEventListener('click', importNodes);
    }
    
    // 添加导入关系按钮事件
    const importRelationsBtn = document.getElementById('import-relations-btn');
    if (importRelationsBtn) {
        importRelationsBtn.addEventListener('click', importRelations);
    }
}

// 初始化节点上传区域
function initNodeUploadArea() {
    const nodeDropArea = document.getElementById('node-drop-area');
    if (!nodeDropArea) return;
    
    // 创建节点文件输入元素
    let nodeFileInput = document.getElementById('hidden-node-file-input');
    
    if (!nodeFileInput) {
        nodeFileInput = document.createElement('input');
        nodeFileInput.type = 'file';
        nodeFileInput.id = 'hidden-node-file-input';
        nodeFileInput.accept = '.csv';
        nodeFileInput.style.display = 'none';
        document.body.appendChild(nodeFileInput);
    }
    
    // 选择节点文件按钮事件
    const selectNodeBtn = document.getElementById('select-node-file-btn');
    if (selectNodeBtn) {
        selectNodeBtn.addEventListener('click', function() {
            if (isUploading) {
                alert('文件正在上传中，请等待完成');
                return;
            }
            nodeFileInput.click();
        });
    }
    
    // 节点文件选择事件
    nodeFileInput.addEventListener('change', function(e) {
        if (!e.target.files.length) return;
        
        const file = e.target.files[0];
        const fileInfo = document.getElementById('step-node-file-info');
        if (fileInfo) {
            fileInfo.textContent = `节点文件: ${file.name}`;
        }
    });
    
    // 节点文件拖放功能
    nodeDropArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('highlight');
    });
    
    nodeDropArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('highlight');
    });
    
    nodeDropArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('highlight');
        
        if (isUploading) {
            alert('文件正在上传中，请等待完成');
            return;
        }
        
        const files = e.dataTransfer.files;
        if (files.length === 0) return;
        
        const file = files[0];
        const fileInfo = document.getElementById('step-node-file-info');
        if (fileInfo) {
            fileInfo.textContent = `节点文件: ${file.name}`;
        }
        
        // 设置文件输入的值 (仅用于UI，实际上传会直接使用拖放的文件)
        const nodeFileInput = document.getElementById('hidden-node-file-input');
        if (nodeFileInput) {
            // 由于安全限制，不能直接设置files属性，保存到自定义属性
            nodeFileInput._droppedFile = file;
        }
    });
}

// 初始化关系上传区域
function initRelationUploadArea() {
    const relationDropArea = document.getElementById('relation-drop-area');
    if (!relationDropArea) return;
    
    // 创建关系文件输入元素
    let relationFileInput = document.getElementById('hidden-relation-file-input');
    
    if (!relationFileInput) {
        relationFileInput = document.createElement('input');
        relationFileInput.type = 'file';
        relationFileInput.id = 'hidden-relation-file-input';
        relationFileInput.accept = '.csv';
        relationFileInput.style.display = 'none';
        document.body.appendChild(relationFileInput);
    }
    
    // 选择关系文件按钮事件
    const selectRelationBtn = document.getElementById('select-relation-file-btn');
    if (selectRelationBtn) {
        selectRelationBtn.addEventListener('click', function() {
            if (isUploading) {
                alert('文件正在上传中，请等待完成');
                return;
            }
            relationFileInput.click();
        });
    }
    
    // 关系文件选择事件
    relationFileInput.addEventListener('change', function(e) {
        if (!e.target.files.length) return;
        
        const file = e.target.files[0];
        const fileInfo = document.getElementById('step-relation-file-info');
        if (fileInfo) {
            fileInfo.textContent = `关系文件: ${file.name}`;
        }
    });
    
    // 关系文件拖放功能
    relationDropArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('highlight');
    });
    
    relationDropArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('highlight');
    });
    
    relationDropArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('highlight');
        
        if (isUploading) {
            alert('文件正在上传中，请等待完成');
            return;
        }
        
        const files = e.dataTransfer.files;
        if (files.length === 0) return;
        
        const file = files[0];
        const fileInfo = document.getElementById('step-relation-file-info');
        if (fileInfo) {
            fileInfo.textContent = `关系文件: ${file.name}`;
        }
        
        // 设置文件输入的值 (仅用于UI，实际上传会直接使用拖放的文件)
        const relationFileInput = document.getElementById('hidden-relation-file-input');
        if (relationFileInput) {
            // 由于安全限制，不能直接设置files属性，保存到自定义属性
            relationFileInput._droppedFile = file;
        }
    });
}

// 导入节点
async function importNodes() {
    if (isUploading) {
        alert('已有文件正在上传，请等待完成');
        return;
    }
    
    // 获取节点文件
    const nodeFileInput = document.getElementById('hidden-node-file-input');
    if (!nodeFileInput) return;
    
    // 检查文件是否通过拖放或选择器选中
    let nodeFile = null;
    if (nodeFileInput.files.length > 0) {
        nodeFile = nodeFileInput.files[0];
    } else if (nodeFileInput._droppedFile) {
        nodeFile = nodeFileInput._droppedFile;
    }
    
    if (!nodeFile) {
        alert('请先选择节点CSV文件');
        return;
    }
    
    isUploading = true;
    updateImportLog('开始导入节点数据...');
    
    // 更新状态
    const nodeImportStatus = document.getElementById('node-import-status');
    if (nodeImportStatus) {
        nodeImportStatus.textContent = '正在导入节点...';
        nodeImportStatus.classList.remove('success', 'error');
        nodeImportStatus.classList.add('loading');
    }
    
    try {
        // 创建FormData对象
        const formData = new FormData();
        formData.append('nodeFile', nodeFile);
        
        // 发送请求
        const response = await fetch('/api/import-nodes', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            updateImportLog(`节点导入成功: ${result.nodeCount} 个节点已创建`);
            
            if (nodeImportStatus) {
                nodeImportStatus.textContent = `成功导入 ${result.nodeCount} 个节点`;
                nodeImportStatus.classList.remove('loading', 'error');
                nodeImportStatus.classList.add('success');
            }
            
            // 刷新数据统计
            refreshDataStats();
        } else {
            updateImportLog(`节点导入失败: ${result.message}`, true);
            
            if (nodeImportStatus) {
                nodeImportStatus.textContent = `导入失败: ${result.message}`;
                nodeImportStatus.classList.remove('loading', 'success');
                nodeImportStatus.classList.add('error');
            }
        }
    } catch (error) {
        console.error('节点导入请求失败:', error);
        updateImportLog(`节点导入请求失败: ${error.message}`, true);
        
        if (nodeImportStatus) {
            nodeImportStatus.textContent = `导入错误: ${error.message}`;
            nodeImportStatus.classList.remove('loading', 'success');
            nodeImportStatus.classList.add('error');
        }
    } finally {
        isUploading = false;
    }
}

// 导入关系
async function importRelations() {
    if (isUploading) {
        alert('已有文件正在上传，请等待完成');
        return;
    }
    
    // 获取关系文件
    const relationFileInput = document.getElementById('hidden-relation-file-input');
    if (!relationFileInput) return;
    
    // 检查文件是否通过拖放或选择器选中
    let relationFile = null;
    if (relationFileInput.files.length > 0) {
        relationFile = relationFileInput.files[0];
    } else if (relationFileInput._droppedFile) {
        relationFile = relationFileInput._droppedFile;
    }
    
    if (!relationFile) {
        alert('请先选择关系CSV文件');
        return;
    }
    
    isUploading = true;
    updateImportLog('开始导入关系数据...');
    
    // 更新状态
    const relationImportStatus = document.getElementById('relation-import-status');
    if (relationImportStatus) {
        relationImportStatus.textContent = '正在导入关系...';
        relationImportStatus.classList.remove('success', 'error');
        relationImportStatus.classList.add('loading');
    }
    
    try {
        // 创建FormData对象
        const formData = new FormData();
        formData.append('relationFile', relationFile);
        
        // 发送请求
        const response = await fetch('/api/import-relations', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            updateImportLog(`关系导入成功: ${result.relationCount} 个关系已创建`);
            
            if (relationImportStatus) {
                relationImportStatus.textContent = `成功导入 ${result.relationCount} 个关系`;
                relationImportStatus.classList.remove('loading', 'error');
                relationImportStatus.classList.add('success');
            }
            
            // 刷新数据统计
            refreshDataStats();
        } else {
            updateImportLog(`关系导入失败: ${result.message}`, true);
            
            if (relationImportStatus) {
                relationImportStatus.textContent = `导入失败: ${result.message}`;
                relationImportStatus.classList.remove('loading', 'success');
                relationImportStatus.classList.add('error');
            }
        }
    } catch (error) {
        console.error('关系导入请求失败:', error);
        updateImportLog(`关系导入请求失败: ${error.message}`, true);
        
        if (relationImportStatus) {
            relationImportStatus.textContent = `导入错误: ${error.message}`;
            relationImportStatus.classList.remove('loading', 'success');
            relationImportStatus.classList.add('error');
        }
    } finally {
        isUploading = false;
    }
}

// 初始化数据统计
function initDataStats() {
    const refreshStatsBtn = document.getElementById('refresh-stats-btn');
    if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener('click', refreshDataStats);
    }
    
    // 初始加载统计数据
    refreshDataStats();
}

// 刷新数据统计
async function refreshDataStats() {
    const statsContainer = document.getElementById('data-stats-container');
    if (!statsContainer) return;
    
    statsContainer.innerHTML = '<p>加载数据统计中...</p>';
    
    try {
        const response = await fetch('/api/import-status');
        const result = await response.json();
        
        if (result.success) {
            const stats = result.data;
            let html = '';
            
            // 基本统计信息
            html += `<div class="stats-group">
                <div class="stats-item">
                    <span class="stats-label">节点总数:</span>
                    <span class="stats-value">${stats.nodeCount}</span>
                </div>
                <div class="stats-item">
                    <span class="stats-label">关系总数:</span>
                    <span class="stats-value">${stats.relationCount}</span>
                </div>
            </div>`;
            
            // 节点类型统计
            if (stats.nodeTypes && stats.nodeTypes.length > 0) {
                html += '<div class="stats-group"><h4>节点类型分布:</h4>';
                stats.nodeTypes.forEach(item => {
                    html += `<div class="stats-item">
                        <span class="stats-label">${item.type || '默认类型'}:</span>
                        <span class="stats-value">${item.count}</span>
                    </div>`;
                });
                html += '</div>';
            }
            
            // 关系类型统计
            if (stats.relationTypes && stats.relationTypes.length > 0) {
                html += '<div class="stats-group"><h4>关系类型分布:</h4>';
                stats.relationTypes.forEach(item => {
                    html += `<div class="stats-item">
                        <span class="stats-label">${item.type || '默认关系'}:</span>
                        <span class="stats-value">${item.count}</span>
                    </div>`;
                });
                html += '</div>';
            }
            
            statsContainer.innerHTML = html;
        } else {
            statsContainer.innerHTML = `<p class="error">获取统计数据失败: ${result.message}</p>`;
        }
    } catch (error) {
        console.error('获取数据统计失败:', error);
        statsContainer.innerHTML = `<p class="error">获取统计数据出错: ${error.message}</p>`;
    }
}

// 处理文件选择
function handleFileSelect(event) {
    const files = event.target.files;
    handleFiles(files);
}

// 处理文件
function handleFiles(files) {
    if (!files || files.length !== 2) {
        alert('请同时选择两个文件：节点文件和关系文件');
      return;
    }
    
    const nodeFileInfo = document.getElementById('node-file-info');
    const relationFileInfo = document.getElementById('relation-file-info');
    
    if (nodeFileInfo) nodeFileInfo.textContent = `节点文件: ${files[0].name}`;
    if (relationFileInfo) relationFileInfo.textContent = `关系文件: ${files[1].name}`;
    
    updateImportLog(`已选择文件: ${files[0].name}、${files[1].name}`);
    
    // 上传文件
    uploadFiles(files[0], files[1]);
}

// 上传文件
async function uploadFiles(nodeFile, relationFile) {
    if (!nodeFile || !relationFile) {
    updateImportLog('请选择节点文件和关系文件', true);
    return;
  }
  
  isUploading = true;
    updateImportLog('开始上传文件...');
    
    // 更新进度条
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = '0%';
    
    try {
        // 创建FormData对象，添加文件
        const formData = new FormData();
        formData.append('nodeFile', nodeFile);
        formData.append('relationFile', relationFile);
        
        // 发送请求上传文件
        const xhr = new XMLHttpRequest();
        
        // 监听上传进度
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                if (progressBar) progressBar.style.width = `${percentComplete}%`;
                if (progressText) progressText.textContent = `${percentComplete}%`;
                updateImportLog(`上传进度: ${percentComplete}%`);
            }
        });
        
        // 创建Promise包装XHR
        const uploadPromise = new Promise((resolve, reject) => {
            xhr.open('POST', '/api/import-to-neo4j', true);
            
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('服务器返回了无效的JSON'));
                    }
                } else {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        reject(new Error(errorResponse.message || '上传失败'));
                    } catch (e) {
                        reject(new Error(`上传失败，状态码: ${xhr.status}`));
                    }
                }
            };
            
            xhr.onerror = function() {
                reject(new Error('网络错误，请检查服务器连接'));
            };
            
            // 发送请求
            xhr.send(formData);
        });
        
        // 等待上传完成
        const response = await uploadPromise;
        
        // 更新进度条到100%
        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = '100%';
        
        // 显示成功消息
        updateImportLog(`成功导入 ${response.nodeCount} 个节点和 ${response.relationCount} 个关系到Neo4j`);
        
    } catch (error) {
        console.error('文件上传失败:', error);
    updateImportLog(`导入失败: ${error.message}`, true);
        
        // 重置进度条
        if (progressBar) progressBar.style.width = '0%';
        if (progressText) progressText.textContent = '0%';
  } finally {
    isUploading = false;
    }
}

// 更新导入日志
function updateImportLog(message, isError = false) {
    const logElement = document.getElementById('import-log');
    if (!logElement) return;
    
    const logEntry = document.createElement('div');
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logEntry.style.color = isError ? 'red' : 'green';
    
    logElement.appendChild(logEntry);
    logElement.scrollTop = logElement.scrollHeight;
}

// 清空Neo4j数据库
async function clearDatabase() {
    if (!confirm('警告：此操作将删除Neo4j数据库中的所有数据，且无法恢复！确定要继续吗？')) {
        return;
    }
    
    // 二次确认
    if (!confirm('再次确认：您确定要清空Neo4j数据库中的所有数据吗？')) {
        return;
    }
    
    try {
        updateImportLog('正在清空数据库...');
        
        const response = await fetch('/api/clear-neo4j-database', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            updateImportLog('数据库已成功清空', false);
        } else {
            updateImportLog(`清空数据库失败: ${result.message}`, true);
        }
    } catch (error) {
        console.error('清空数据库请求出错:', error);
        updateImportLog(`清空数据库请求出错: ${error.message}`, true);
    }
}

// 初始化系统设置
function initSystemSettings() {
    const settingsForm = document.querySelector('#system-settings .settings-form');
    
    if (settingsForm) {
        // 加载已保存设置
        loadSavedSettings();
        
        // 保存设置表单提交
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const theme = this.querySelector('select[name="theme"]').value;
            const language = this.querySelector('select[name="language"]').value;
            
            // 保存设置
                localStorage.setItem('adminTheme', theme);
                localStorage.setItem('adminLanguage', language);
                
                // 应用设置
                applySettings(theme, language);
                
                alert('设置已保存！');
        });
    }
}

// 加载保存的设置
function loadSavedSettings() {
    const theme = localStorage.getItem('adminTheme') || 'light';
    const language = localStorage.getItem('adminLanguage') || 'zh-CN';
    
    const settingsForm = document.querySelector('#system-settings .settings-form');
    if (settingsForm) {
        const themeSelect = settingsForm.querySelector('select[name="theme"]');
        const languageSelect = settingsForm.querySelector('select[name="language"]');
        
        if (themeSelect) themeSelect.value = theme;
        if (languageSelect) languageSelect.value = language;
    }
    
    applySettings(theme, language);
    }

// 应用设置
function applySettings(theme, language) {
    // 应用主题
    document.documentElement.className = '';
    document.body.className = '';
    
    if (theme === 'dark') {
        document.documentElement.classList.add('dark-theme');
        document.body.classList.add('dark-theme');
    }
    
    // 应用语言
    const elements = document.querySelectorAll('[data-translate-key]');
    elements.forEach(el => {
        const key = el.getAttribute('data-translate-key');
        if (translations[language] && translations[language][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translations[language][key];
            } else {
                el.textContent = translations[language][key];
            }
        }
    });
    
    // 更新页面标题
    document.title = translations[language]['pageTitle'] || 'AI图谱 - 管理页面';
}

