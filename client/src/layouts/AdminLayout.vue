<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">⚙️ 后台管理</div>
      </div>
      <nav class="sidebar-nav">
        <div
          v-for="item in navItems"
          :key="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
          @click="router.push(item.path)"
        >
          {{ item.icon }} {{ item.label }}
        </div>
      </nav>
      <div class="sidebar-footer">
        <button class="footer-btn" @click="goHome">← 返回</button>
      </div>
    </aside>
    <main class="admin-main">
      <div class="admin-header">
        <span class="admin-title">{{ pageTitle }}</span>
        <span class="admin-user">{{ userStore.user?.username }}</span>
      </div>
      <div class="admin-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const navItems = [
  { path: '/admin/posts', icon: '📄', label: '内容管理' },
  { path: '/admin/comments', icon: '💬', label: '评论管理' },
  { path: '/admin/users', icon: '👥', label: '用户管理' },
  { path: '/admin/notices', icon: '📢', label: '公告管理' },
]

const pageTitle = computed(() => {
  return navItems.find(i => i.path === route.path)?.label || '后台管理'
})

const goHome = () => {
  router.push('/profile')
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f0f2f5;
}

.sidebar {
  width: 220px;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100vh; /* 加这一行 */
  position: sticky; /* 加这一行，滚动时粘住 */
  top: 0;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.sidebar-logo {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
}

.nav-item {
  padding: 12px 16px;
  color: rgba(255,255,255,0.65);
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 4px;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255,255,255,0.08);
  color: #fff;
}

.nav-item.active {
  background: #f60;
  color: #fff;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.footer-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.4);
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.footer-btn:hover {
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.7);
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-header {
  background: #fff;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  flex-shrink: 0;
}

.admin-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.admin-user {
  font-size: 13px;
  color: #999;
}

.admin-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>