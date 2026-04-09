import { Router } from 'express'
import { toggleLike, getLikeStatus } from '../controllers/like.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router({ mergeParams: true })

router.post('/', authMiddleware, toggleLike)
router.get('/status', authMiddleware, getLikeStatus)

export default router