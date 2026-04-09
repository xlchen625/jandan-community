import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware'
import { upload } from '../utils/upload'
import { Request, Response } from 'express'

const router = Router()

router.post('/', authMiddleware, upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: '请选择文件' })
  }
  const url = `http://localhost:3000/uploads/${req.file.filename}`
  res.json({ url })
})

export default router