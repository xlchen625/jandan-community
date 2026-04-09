import { Request, Response } from 'express'
import pool from '../utils/db'
import { AuthRequest } from '../middlewares/auth.middleware'

export const getPosts = async (req: Request, res: Response) => {
  const { category, page = 1, limit = 10, keyword } = req.query
  const offset = (Number(page) - 1) * Number(limit)

  try {
    let sql = `
      SELECT p.*, 
        CASE WHEN p.is_anonymous = 1 THEN COALESCE(p.anonymous_name, '匿名用户') ELSE u.username END as display_name,
        u.avatar, c.name as category_name, c.slug,
        COUNT(DISTINCT CASE WHEN l.type = 'LIKE' THEN l.id END) as like_count,
        COUNT(DISTINCT CASE WHEN l.type = 'DISLIKE' THEN l.id END) as dislike_count,
        COUNT(DISTINCT cm.id) as comment_count
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments cm ON p.id = cm.post_id
      WHERE p.status = 'PUBLISHED' AND p.review_status = 'approved'
    `
    const params: any[] = []

    if (category) {
      sql += ' AND c.slug = ?'
      params.push(category)
    }

    if (keyword) {
      sql += ' AND (p.content LIKE ? OR p.title LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    const orderBy = req.query.sort === 'hot' ? 'like_count DESC, comment_count DESC' : 'p.created_at DESC'
    sql += ` GROUP BY p.id ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    params.push(Number(limit), offset)

    const [rows]: any = await pool.query(sql, params)

    let countSql = `
      SELECT COUNT(*) as total FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'PUBLISHED' AND p.review_status = 'approved'
    `
    const countParams: any[] = []

    if (category) {
      countSql += ' AND c.slug = ?'
      countParams.push(category)
    }

    if (keyword) {
      countSql += ' AND (p.content LIKE ? OR p.title LIKE ?)'
      countParams.push(`%${keyword}%`, `%${keyword}%`)
    }

    const [countRows]: any = await pool.query(countSql, countParams)
    const total = countRows[0].total

    res.json({ list: rows, total, page: Number(page), limit: Number(limit) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: '服务器错误' })
  }
}

export const getPostById = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const [rows]: any = await pool.query(`
      SELECT p.*, 
        CASE WHEN p.is_anonymous = 1 THEN COALESCE(p.anonymous_name, '匿名用户') ELSE u.username END as display_name,
        u.avatar, c.name as category_name, c.slug,
        COUNT(DISTINCT CASE WHEN l.type = 'LIKE' THEN l.id END) as like_count,
        COUNT(DISTINCT CASE WHEN l.type = 'DISLIKE' THEN l.id END) as dislike_count,
        COUNT(DISTINCT cm.id) as comment_count
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments cm ON p.id = cm.post_id
      WHERE p.id = ? AND p.status = 'PUBLISHED' AND p.review_status = 'approved'
      GROUP BY p.id
    `, [id])

    if (rows.length === 0) {
      return res.status(404).json({ message: '内容不存在' })
    }

    res.json(rows[0])
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

export const createPost = async (req: AuthRequest, res: Response) => {
  const { title, content, category_id, images, is_anonymous, anonymous_name } = req.body
  const author_id = req.user?.id || null

  if (!category_id) {
    return res.status(400).json({ message: '分类不能为空' })
  }

  if (!content && !images) {
    return res.status(400).json({ message: '内容或图片不能同时为空' })
  }

  if (Number(category_id) !== 2 && !author_id) {
    return res.status(401).json({ message: '请先登录' })
  }

  try {
    const [result]: any = await pool.query(
      'INSERT INTO posts (title, content, category_id, author_id, images, is_anonymous, anonymous_name, review_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        title || null,
        content || null,
        category_id,
        author_id,
        images || null,
        is_anonymous ? 1 : 0,
        is_anonymous ? (anonymous_name || '匿名用户') : null,
        'pending'
      ]
    )
    res.json({ message: '发布成功，等待审核', id: result.insertId })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: '服务器错误' })
  }
}

export const updatePost = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { title, content, images } = req.body
  const userId = req.user?.id

  try {
    const [rows]: any = await pool.query('SELECT * FROM posts WHERE id = ?', [id])
    if (rows.length === 0) return res.status(404).json({ message: '内容不存在' })

    const post = rows[0]
    if (post.author_id !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: '无权限' })
    }

    await pool.query(
      'UPDATE posts SET title = ?, content = ?, images = ? WHERE id = ?',
      [title, content, images, id]
    )

    res.json({ message: '编辑成功' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

export const deletePost = async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id

  try {
    const [rows]: any = await pool.query('SELECT * FROM posts WHERE id = ?', [id])
    if (rows.length === 0) return res.status(404).json({ message: '内容不存在' })

    const post = rows[0]
    if (post.author_id !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: '无权限' })
    }

    await pool.query('DELETE FROM likes WHERE post_id = ?', [id])
    await pool.query('DELETE FROM comments WHERE post_id = ?', [id])
    await pool.query('DELETE FROM posts WHERE id = ?', [id])

    res.json({ message: '删除成功' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: '服务器错误' })
  }
}