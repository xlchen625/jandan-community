import { Router } from 'express'
import pool from '../utils/db'
import { Request, Response } from 'express'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM categories')
    res.json(rows)
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
})

export default router