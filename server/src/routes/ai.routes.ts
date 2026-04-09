import { Router } from 'express'
import { summarizePost, reviewPost } from '../controllers/ai.controller'
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.get('/posts/:id/summary', summarizePost)
router.get('/posts/:id/review', authMiddleware, adminMiddleware, reviewPost)

export default router