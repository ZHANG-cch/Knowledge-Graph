// 获取登录表单元素
const loginForm = document.getElementById('loginForm');

// 为登录表单添加提交事件监听器
loginForm.addEventListener('submit', async function (e) {
    // 阻止表单的默认提交行为（防止页面刷新）
    e.preventDefault();

    // 获取用户选择的身份
    const identity = document.getElementById('loginIdentity').value;
    // 获取用户输入的用户名
    const username = document.getElementById('loginUsername').value;
    // 获取用户输入的密码
    const password = document.getElementById('loginPassword').value;

    // 简单的验证，确保用户名和密码不为空
    if (username === "" || password === "") {
        alert("用户名和密码不能为空，请输入完整信息！");
        return;
    }

    try {
        // 发送凭据到本地数据库服务进行验证
        const response = await fetch('http://localhost:3001/local/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password,
                identity  // 添加身份信息到请求体
            })
        });

        // 解析响应数据
        const data = await response.json();
        // 判断响应状态码
        if (response.ok) {
            alert(data.message);
            // 登录成功后，设置登录状态标志
            localStorage.setItem('isUserLoggedIn', 'true'); 
            // 存储用户角色信息
            localStorage.setItem('userType', data.userType || 'user');
            
            // 根据用户角色跳转到不同页面
            if (data.userType === 'admin') {
                window.location.href = 'admin.html'; // 管理员进入管理页面
            } else {
                window.location.href = 'user.html'; // 普通用户进入用户页面
            }
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Login error:', error); // 添加错误日志
        alert('登录过程中出错，请稍后再试！');
    }
});