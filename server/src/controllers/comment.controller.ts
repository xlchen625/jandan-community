import { Response, Request } from 'express'
import pool from '../utils/db'
import { AuthRequest } from '../middlewares/auth.middleware'

export const getComments = async (req: AuthRequest, res: Response) => {
  const { postId } = req.params
  const { page = 1, limit = 10 } = req.query
  const offset = (Number(page) - 1) * Number(limit)

  try {
    const [rows]: any = await pool.query(`
      SELECT c.*, u.username, u.avatar
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ? AND c.status = 'visible'
      ORDER BY c.created_at ASC
      LIMIT ? OFFSET ?
    `, [postId, Number(limit), offset])

    const [countRows]: any = await pool.query(
      'SELECT COUNT(*) as total FROM comments WHERE post_id = ? AND status = "visible"',
      [postId]
    )

    res.json({ list: rows, total: countRows[0].total })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

export const createComment = async (req: AuthRequest, res: Response) => {
  const { postId } = req.params
  const { content } = req.body
  const author_id = req.user?.id

  if (!content) {
    return res.status(400).json({ message: '评论内容不能为空' })
  }

  try {
    await pool.query(
      'INSERT INTO comments (content, author_id, post_id) VALUES (?, ?, ?)',
      [content, author_id, postId]
    )
    res.json({ message: '评论成功' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

export const deleteComment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id

  try {
    const [rows]: any = await pool.query('SELECT * FROM comments WHERE id = ?', [id])
    if (rows.length === 0) return res.status(404).json({ message: '评论不存在' })

    const comment = rows[0]
    if (comment.author_id !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: '无权限' })
    }

    await pool.query('DELETE FROM comments WHERE id = ?', [id])
    res.json({ message: '删除成功' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}