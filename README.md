# 煎蛋社区

一个基于 Vue3 + Express 的内容社区平台，参考煎蛋网设计，支持文章、树洞、随手拍、无聊图等多种内容形式，集成 AI 内容审核与摘要功能。

## 技术栈

**前端**
- Vue3 + TypeScript + Vite
- Pinia 状态管理
- Vue Router 路由管理
- Element Plus UI组件库
- Axios 请求封装
- md-editor-v3 Markdown编辑器

**后端**
- Express + TypeScript
- MySQL2 数据库
- JWT 身份认证
- Multer 文件上传
- node-cron 定时任务
- DeepSeek API AI能力

## 主要功能

- 注册/登录/JWT鉴权，角色权限控制（普通用户/管理员）
- 多栏目内容发布（文章支持Markdown、树洞支持匿名）
- OO/XX点赞点踩、评论、热榜
- AI文章总结（SSE流式输出，支持中断/重新生成）
- 内容审核流程（AI自动审核 + 人工审核 + 定时批量审核）
- 后台管理（内容/评论/用户/公告管理，支持批量操作）
- 用户中心（修改用户名/密码）

## 本地运行

### 环境要求

- Node.js >= 18
- MySQL >= 8.0
- pnpm

### 安装步骤

**1. 克隆项目**

\\\ash
git clone https://github.com/你的用户名/jandan-community.git
cd jandan-community
\\\

**2. 配置后端环境变量**

\\\ash
cd server
cp .env.example .env
# 编辑 .env 填入真实配置
\\\

**3. 初始化数据库**

登录 MySQL 执行：

\\\sql
CREATE DATABASE jandan_community;
USE jandan_community;

-- 用户表
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),
  role ENUM('USER', 'ADMIN') DEFAULT 'USER',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 分类表
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL
);

-- 内容表
CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255),
  content TEXT,
  images TEXT,
  status ENUM('PUBLISHED', 'HIDDEN') DEFAULT 'PUBLISHED',
  is_anonymous TINYINT(1) DEFAULT 0,
  anonymous_name VARCHAR(50),
  review_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  review_reason VARCHAR(500),
  author_id INT,
  category_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 评论表
CREATE TABLE comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  content TEXT NOT NULL,
  status ENUM('visible', 'hidden') DEFAULT 'visible',
  author_id INT NOT NULL,
  post_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (post_id) REFERENCES posts(id)
);

-- 点赞表
CREATE TABLE likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('LIKE', 'DISLIKE') NOT NULL,
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_like (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (post_id) REFERENCES posts(id)
);

-- 公告表
CREATE TABLE notices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 初始分类数据
INSERT INTO categories (name, slug) VALUES
('文章', 'article'),
('树洞', 'tree-hole'),
('随手拍', 'photo'),
('无聊图', 'funny'),
('鱼塘', 'pond');
\\\

**4. 安装依赖并启动后端**

\\\ash
cd server
pnpm install
pnpm dev
\\\

**5. 安装依赖并启动前端**

\\\ash
cd client
pnpm install
pnpm dev
\\\

**6. 访问**

浏览器打开 http://localhost:5173

## 项目截图

![首页](docs/home.png)
![后台管理](docs/admin.png)

## License

MIT
