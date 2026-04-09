import { Router } from 'express'
import { getProfile, updateUsername, updatePassword } from '../controllers/user.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.get('/profile', authMiddleware, getProfile)
router.put('/username', authMiddleware, updateUsername)
router.put('/password', authMiddleware, updatePassword)

export default router