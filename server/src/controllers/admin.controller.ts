import { Request, Response } from 'express'
import pool from '../utils/db'

export const getUsers = async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query
  const offset = (Number(page) - 1) * Number(limit)
  try {
    const [rows]: any = await pool.query(`
      SELECT id, username, avatar, role, created_at FROM users
      ORDER BY created_at DESC LIMIT ? OFFSET ?
    `, [Number(limit), offset])
    const [countRows]: any = await pool.query('SELECT COUNT(*) as total FROM users')
    res.json({ list: rows, total: countRows[0].total })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params
  const { role } = req.body
  if (!['USER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ message: '角色参数错误' })
  }
  try {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id])
    res.json({ message: '修改成功' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

export const hidePost = async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    await pool.query('UPDATE posts SET status = "HIDDEN" WHERE id = ?', [id])
    res.json({ message: '已下架' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

export const showPost = async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    await pool.query('UPDATE posts SET status = "PUBLISHED" WHERE id = ?', [id])
    res.json({ message: '已上架' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

export const approvePost = async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    await pool.query('UPDATE posts SET review_status = "approved" WHERE id = ?', [id])
    res.json({ message: '审核通过' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

export const rejectPost = async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    await pool.query('UPDATE posts SET review_status = "rejected" WHERE id = ?', [id])
    res.json({ message: '已拒绝' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

export const getAllPosts = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, category } = req.query
  const offset = (Number(page) - 1) * Number(limit)
  try {
    let sql = `
      SELECT p.*, u.username, c.name as category_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `
    const params: any[] = []
    if (category) {
      sql += ' AND c.name = ?'
      params.push(category)
    }
    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(limit), offset)

    const [rows]: any = await pool.query(sql, params)

    let countSql = `SELECT COUNT(*) as total FROM posts p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1`
    const countParams: any[] = []
    if (category) {
      countSql += ' AND c.name = ?'
      countParams.push(category)
    }
    const [countRows]: any = await pool.query(countSql, countParams)
    res.json({ list: rows, total: countRows[0].total })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

export const getAllComments = async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query
  const offset = (Number(page) - 1) * Number(limit)
  try {
    const [rows]: any = await pool.query(`
      SELECT c.*, u.username,
        p.id as post_id, p.title as post_title, p.content as post_content,
        cat.name as category_name
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      LEFT JOIN posts p ON c.post_id = p.id
      LEFT JOIN categories cat ON p.category_id = cat.id
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [Number(limit), offset])
    const [countRows]: any = await pool.query('SELECT COUNT(*) as total FROM comments')
    res.json({ list: rows, total: countRows[0].total })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

export const hideComment = async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    await pool.query('UPDATE comments SET status = "hidden" WHERE id = ?', [id])
    res.json({ message: '已隐藏' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

export const showComment = async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    await pool.query('UPDATE comments SET status = "visible" WHERE id = ?', [id])
    res.json({ message: '已显示' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

export const deleteCommentAdmin = async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM comments WHERE id = ?', [id])
    res.json({ message: '删除成功' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

export const getNotices = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM notices ORDER BY created_at DESC')
    res.json(rows)
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

export const createNotice = async (req: Request, res: Response) => {
  const { content } = req.body
  if (!content) return res.status(400).json({ message: '公告内容不能为空' })
  try {
    await pool.query('INSERT INTO notices (content) VALUES (?)', [content])
    res.json({ message: '发布成功' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

export const deleteNotice = async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM notices WHERE id = ?', [id])
    res.json({ message: '删除成功' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

export const updateNotice = async (req: Request, res: Response) => {
  const { id } = req.params
  const { content } = req.body
  if (!content) return res.status(400).json({ message: '内容不能为空' })
  try {
    await pool.query('UPDATE notices SET content = ? WHERE id = ?', [content, id])
    res.json({ message: '修改成功' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}