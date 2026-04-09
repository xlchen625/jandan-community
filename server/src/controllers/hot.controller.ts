import { Request, Response } from 'express'
import pool from '../utils/db'

export const getHotPosts = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT p.*, u.username, u.avatar, c.name as category_name, c.slug,
        COUNT(DISTINCT l.id) as like_count,
        COUNT(DISTINCT cm.id) as comment_count
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN likes l ON p.id = l.post_id AND l.type = 'LIKE'
      LEFT JOIN comments cm ON p.id = cm.post_id
      WHERE p.status = 'PUBLISHED'
      GROUP BY p.id
      ORDER BY like_count DESC, comment_count DESC
      LIMIT 10
    `)

    res.json(rows)
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}