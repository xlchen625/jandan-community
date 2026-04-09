import { Response } from 'express'
import pool from '../utils/db'
import { AuthRequest } from '../middlewares/auth.middleware'

// 点赞/点踩/取消
export const toggleLike = async (req: AuthRequest, res: Response) => {
  const { postId } = req.params
  const { type } = req.body // 'LIKE' or 'DISLIKE'
  const userId = req.user?.id

  if (!type || !['LIKE', 'DISLIKE'].includes(type)) {
    return res.status(400).json({ message: 'type参数错误' })
  }

  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM likes WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    )

    if (rows.length > 0) {
      const existing = rows[0]
      if (existing.type === type) {
        // 已经点过同类型，取消
        await pool.query('DELETE FROM likes WHERE id = ?', [existing.id])
        return res.json({ message: '已取消', action: 'cancel' })
      } else {
        // 切换类型
        await pool.query('UPDATE likes SET type = ? WHERE id = ?', [type, existing.id])
        return res.json({ message: '已切换', action: 'switch' })
      }
    }

    // 新增点赞
    await pool.query(
      'INSERT INTO likes (user_id, post_id, type) VALUES (?, ?, ?)',
      [userId, postId, type]
    )
    res.json({ message: '成功', action: 'add' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

// 获取点赞状态
export const getLikeStatus = async (req: AuthRequest, res: Response) => {
  const { postId } = req.params
  const userId = req.user?.id

  try {
    const [rows]: any = await pool.query(
      'SELECT type FROM likes WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    )

    res.json({ type: rows.length > 0 ? rows[0].type : null })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}