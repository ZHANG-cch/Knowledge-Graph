// 获取注册表单
const registerForm = document.getElementById('registerForm');

// 给注册表单添加提交事件监听器
registerForm.addEventListener('submit', async function (e) {
    // 阻止表单默认提交行为
    e.preventDefault();
    // 获取注册表单中的用户名、密码、确认密码和身份信息
    const identity = document.getElementById('regIdentity').value;
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const email = document.getElementById('regEmail').value;

    // 判断两次输入的密码是否一致
    if (password!== confirmPassword) {
        alert('两次输入的密码不一致，请重新输入！');
        return;
    }

    // 判断密码长度是否在8-16位之间
    if (password.length < 8 || password.length > 16) {
        alert('密码长度必须在 8 - 16 位之间，请重新输入！');
        return;
    }

    // 判断密码中是否包含至少两种字符类型
    let charTypes = 0;
    if (/[a-zA-Z]/.test(password)) charTypes++;
    if (/[0-9]/.test(password)) charTypes++;
    if (/[^a-zA-Z0-9]/.test(password)) charTypes++;

    if (charTypes < 2) {
        alert('密码至少要包含两种字符类型，请重新输入！');
        return;
    }

    try {
        // 将用户数据发送到本地数据库服务
        const response = await fetch('http://localhost:3001/local/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password,
                userType: identity,  // 确保字段名与本地数据库结构一致
                email: email
            })
        });
    
        // 解析响应数据
        const data = await response.json();
        // 判断响应状态码
        if (response.ok) {
            alert(data.message);
            // 刷新管理员页面的用户列表
            if (window.opener && window.opener.loadUserList) {
                setTimeout(() => {
                    window.opener.loadUserList();
                }, 500); // 延迟 500 毫秒
            }
            window.location.href = 'login.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('连接本地数据库出错，请确保服务器已启动！');
    }
});