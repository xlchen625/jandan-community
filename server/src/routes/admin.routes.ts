import { Router } from 'express'
import {
  getUsers, updateUserRole,
  hidePost, showPost, approvePost, rejectPost, getAllPosts,
  getAllComments, hideComment, showComment, deleteCommentAdmin,
  getNotices, createNotice, updateNotice, deleteNotice
} from '../controllers/admin.controller'
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.use(authMiddleware, adminMiddleware)

router.get('/users', getUsers)
router.put('/users/:id/role', updateUserRole)

router.get('/posts', getAllPosts)
router.put('/posts/:id/hide', hidePost)
router.put('/posts/:id/show', showPost)
router.put('/posts/:id/approve', approvePost)
router.put('/posts/:id/reject', rejectPost)

router.get('/comments', getAllComments)
router.put('/comments/:id/hide', hideComment)
router.put('/comments/:id/show', showComment)
router.delete('/comments/:id', deleteCommentAdmin)

router.get('/notices', getNotices)
router.post('/notices', createNotice)
router.put('/notices/:id', updateNotice)
router.delete('/notices/:id', deleteNotice)

export default router