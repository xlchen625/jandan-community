import { Request, Response } from 'express'
import pool from '../utils/db'

export const summarizePost = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const [rows]: any = await pool.query('SELECT * FROM posts WHERE id = ?', [id])
    if (rows.length === 0) return res.status(404).json({ message: '内容不存在' })

    const post = rows[0]
    const content = post.title ? `标题：${post.title}\n内容：${post.content}` : post.content

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        stream: true,
        messages: [
          { role: 'system', content: '你是一个内容总结助手，请用简洁的语言总结用户提供的内容，100字以内。' },
          { role: 'user', content: `请总结以下内容：\n${content}` }
        ]
      })
    })

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    req.on('close', () => { reader.cancel() })

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

      for (const line of lines) {
        const data = line.replace('data: ', '')
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n')
          break
        }
        try {
          const parsed = JSON.parse(data)
          const text = parsed.choices[0]?.delta?.content
          if (text) res.write(`data: ${text}\n\n`)
        } catch {}
      }
    }

    res.end()
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

export const reviewPost = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const [rows]: any = await pool.query('SELECT * FROM posts WHERE id = ?', [id])
    if (rows.length === 0) return res.status(404).json({ message: '内容不存在' })

    const post = rows[0]
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

    // 存审核理由
    await pool.query('UPDATE posts SET review_reason = ? WHERE id = ?', [parsed.reason, id])

    // 文章(1)和树洞(2)AI审核通过自动上架
    if (parsed.result === '通过' && (post.category_id === 1 || post.category_id === 2)) {
      await pool.query('UPDATE posts SET review_status = "approved" WHERE id = ?', [id])
      parsed.auto_approved = true
    } else if (parsed.result === '不通过') {
      await pool.query('UPDATE posts SET review_status = "rejected" WHERE id = ?', [id])
    }

    res.json(parsed)
  } catch (error) {
    res.status(500).json({ message: 'AI审核失败' })
  }
}