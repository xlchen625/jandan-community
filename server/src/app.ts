import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes'
import postRoutes from './routes/post.routes'
import commentRoutes from './routes/comment.routes'
import likeRoutes from './routes/like.routes'
import hotRoutes from './routes/hot.routes'
import uploadRoutes from './routes/upload.routes'
import path from 'path'
import adminRoutes from './routes/admin.routes'
import categoryRoutes from './routes/category.routes'
import aiRoutes from './routes/ai.routes'
import pool from './utils/db'
import userRoutes from './routes/user.routes'
import cron from 'node-cron'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/posts/:postId/comments', commentRoutes)
app.use('/api/posts/:postId/likes', likeRoutes)
app.use('/api/hot', hotRoutes)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/api/upload', uploadRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/user', userRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'jandan community api is running' })
})
// 公告公开接口
app.get('/api/notices', async (req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM notices ORDER BY created_at DESC LIMIT 5')
    res.json(rows)
  } catch {
    res.status(500).json({ message: '服务器错误' })
  }
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  // 每5分钟批量AI审核待审核的文章和树洞
  cron.schedule('*/5 * * * *', async () => {
    try {
      const [rows]: any = await pool.query(`
        SELECT p.* FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.review_status = 'pending'
        AND c.slug IN ('article', 'tree-hole')
        LIMIT 10
      `)

      if (rows.length === 0) return
      console.log(`[定时审核] 发现 ${rows.length} 条待审核内容`)

      for (const post of rows) {
        try {
          const content = post.title ? `标题：${post.title}\n内容：${post.content}` : post.content
          const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [
                {
                  role: 'system',
                  content: '你是一个内容审核助手，请审核以下内容是否合规。返回JSON格式：{"result":"通过"或"不通过","risk_type":"风险类型，通过则为null","reason":"简要理由"}'
                },
                { role: 'user', content }
              ]
            })
          })

          const data: any = await response.json()
          const text = data.choices[0]?.message?.content
          const clean = text.replace(/```json|```/g, '').trim()
          const parsed = JSON.parse(clean)

          await pool.query('UPDATE posts SET review_reason = ? WHERE id = ?', [parsed.reason, post.id])

          if (parsed.result === '通过') {
            await pool.query('UPDATE posts SET review_status = "approved" WHERE id = ?', [post.id])
            console.log(`[定时审核] 帖子 ${post.id} 审核通过`)
          } else {
            await pool.query('UPDATE posts SET review_status = "rejected" WHERE id = ?', [post.id])
            console.log(`[定时审核] 帖子 ${post.id} 审核拒绝：${parsed.reason}`)
          }
        } catch (e) {
          console.error(`[定时审核] 帖子 ${post.id} 审核失败`, e)
        }
      }
    } catch (e) {
      console.error('[定时审核] 任务执行失败', e)
    }
  })
  
  console.log(`server is running on port ${PORT}`)
})

export default app