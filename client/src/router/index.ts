import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/DefaultLayout.vue'),
      children: [
        { path: '', name: 'Home', component: () => import('@/views/Home.vue') },
        { path: 'post/:id', name: 'PostDetail', component: () => import('@/views/PostDetail.vue') },
        { path: 'publish', name: 'Publish', component: () => import('@/views/Publish.vue') },
        { path: 'profile', name: 'Profile', component: () => import('@/views/Profile.vue'), meta: { requiresAuth: true } },
      ]
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        { path: '', redirect: '/admin/posts' },
        { path: 'posts', name: 'AdminPosts', component: () => import('@/views/admin/Posts.vue') },
        { path: 'comments', name: 'AdminComments', component: () => import('@/views/admin/Comments.vue') },
        { path: 'users', name: 'AdminUsers', component: () => import('@/views/admin/Users.vue') },
        { path: 'notices', name: 'AdminNotices', component: () => import('@/views/admin/Notices.vue') },
      ]
    },
    { path: '/login', name: 'Login', component: () => import('@/views/Login.vue') },
    { path: '/register', name: 'Register', component: () => import('@/views/Register.vue') },
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  if (to.meta.requiresAuth && !token) {
    return next('/login')
  }
  if (to.meta.requiresAdmin && user?.role !== 'ADMIN') {
    return next('/')
  }
  next()
})

export default router