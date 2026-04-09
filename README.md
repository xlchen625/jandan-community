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

- 注册/登录/JWT鉴权，角色权限控制
- 多栏目内容发布（文章支持Markdown、树洞支持匿名）
- OO/XX点赞点踩、评论、热榜
- AI文章总结（SSE流式输出，支持中断/重新生成）
- 内容审核流程（AI自动 + 人工 + 定时批量）
- 后台管理（内容/评论/用户/公告，支持批量操作）
- 用户中心

## 本地运行

### 环境要求

- Node.js >= 18
- MySQL >= 8.0
- pnpm

### 安装步骤

**1. 克隆项目**

```bash
git clone https://github.com/xlchen625/jandan-community.git
cd jandan-community
```

**2. 配置后端环境变量**

```bash
cd server
cp .env.example .env
# 编辑 .env 填入真实配置
```

**3. 初始化数据库**

登录 MySQL 执行 `server/init.sql` 里的建表语句。

**4. 启动后端**

```bash
cd server
pnpm install
pnpm dev
```

**5. 启动前端**

```bash
cd client
pnpm install
pnpm dev
```

**6. 访问**

浏览器打开 http://localhost:5173

## 项目截图

![首页](docs/home.png)
![后台管理](docs/admin.png)