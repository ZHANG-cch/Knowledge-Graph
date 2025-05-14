const Datastore = require('nedb');
const path = require('path');
const bcrypt = require('bcrypt');

// 创建数据库实例
const db = new Datastore({ 
  filename: path.join(__dirname, 'data', 'users.db'), 
  autoload: true 
});

// 创建管理员用户
async function createAdmin() {
  try {
    // 检查是否已存在同名管理员
    const existingAdmin = await new Promise((resolve, reject) => {
      db.findOne({ username: 'admin' }, (err, doc) => {
        if (err) reject(err);
        else resolve(doc);
      });
    });

    if (existingAdmin) {
      console.log('已存在用户名为admin的用户，更新其角色为管理员');
      
      // 更新为管理员角色
      await new Promise((resolve, reject) => {
        db.update(
          { username: 'admin' }, 
          { $set: { type: 'admin' } }, 
          {}, 
          (err, numUpdated) => {
            if (err) reject(err);
            else resolve(numUpdated);
          }
        );
      });
      
      console.log('更新成功！');
      return;
    }
    
    // 创建密码的哈希值
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // 新管理员用户对象
    const adminUser = {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      type: 'admin',
      createdAt: new Date()
    };
    
    // 插入到数据库
    await new Promise((resolve, reject) => {
      db.insert(adminUser, (err, newDoc) => {
        if (err) reject(err);
        else resolve(newDoc);
      });
    });
    
    console.log('管理员用户创建成功！');
    console.log('用户名: admin');
    console.log('密码: admin123');
    console.log('请使用以上信息登录系统');
  } catch (error) {
    console.error('创建管理员用户时出错:', error);
  }
}

// 执行函数
createAdmin(); 