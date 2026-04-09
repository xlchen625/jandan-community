import { Response } from 'express'
import pool from '../utils/db'
import { AuthRequest } from '../middlewares/auth.middleware'
import bcrypt from 'bcryptjs'

// 获取当前用户信息
export const getProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  try {
    const [rows]: any = await pool.query(
      'SELECT id, username, avatar, role, created_at FROM users WHERE id = ?',
      [userId]
    )
    res.json(rows[0])
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

// 修改用户名
export const updateUsername = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  const { username } = req.body

  if (!username) return res.status(400).json({ message: '用户名不能为空' })

  try {
    const [exists]: any = await pool.query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, userId]
    )
    if (exists.length > 0) return res.status(400).json({ message: '用户名已存在' })

    await pool.query('UPDATE users SET username = ? WHERE id = ?', [username, userId])
    res.json({ message: '修改成功' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

// 修改密码
export const updatePassword = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  const { oldPassword, newPassword } = req.body

  if (!oldPassword || !newPassword) return res.status(400).json({ message: '请填写完整' })

  try {
    const [rows]: any = await pool.query('SELECT * FROM users WHERE id = ?', [userId])
    const user = rows[0]

    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) return res.status(400).json({ message: '原密码错误' })

    const hashed = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId])
    res.json({ message: '密码修改成功' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}