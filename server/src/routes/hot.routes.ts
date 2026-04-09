import { Router } from 'express'
import { getHotPosts } from '../controllers/hot.controller'

const router = Router()

router.get('/', getHotPosts)

export default router