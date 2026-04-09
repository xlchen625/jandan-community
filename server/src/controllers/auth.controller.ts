import { Request, Response } from 'express'
import pool from '../utils/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// 注册
export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' })
  }

  try {
    // 检查用户名是否已存在
    const [rows]: any = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    )
    if (rows.length > 0) {
      return res.status(400).json({ message: '用户名已存在' })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 插入用户
    await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    )

    res.json({ message: '注册成功' })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}

// 登录
export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' })
  }

  try {
    // 查找用户
    const [rows]: any = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    )
    if (rows.length === 0) {
      return res.status(400).json({ message: '用户名或密码错误' })
    }

    const user = rows[0]

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: '用户名或密码错误' })
    }

    // 生成JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    )

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
}