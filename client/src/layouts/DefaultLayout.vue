<template>
  <div class="layout">
    <header class="header">
      <div class="header-inner">
        <div class="logo" @click="router.push('/')">煎蛋社区</div>
        <div class="spacer" />
        <div class="user-area">
          <template v-if="userStore.isLoggedIn()">
            <el-dropdown trigger="click">
              <div class="user-trigger">
                <div class="avatar">{{ userStore.user?.username?.slice(0, 1).toUpperCase() }}</div>
                <span class="username">{{ userStore.user?.username }}</span>
                <span class="arrow">▾</span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="router.push('/profile')">👤 用户中心</el-dropdown-item>
                  <el-dropdown-item @click="router.push('/admin')" v-if="userStore.isAdmin()">⚙️ 后台管理</el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">🚪 退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button size="small" @click="router.push('/login')">登录</el-button>
            <el-button size="small" type="primary" @click="router.push('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </header>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const handleLogout = async () => {
  await ElMessageBox.confirm('确认退出登录？', '提示', { type: 'warning' })
  userStore.logout()
}
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.header-inner {
  max-width: 1000px;
  margin: 0 auto;
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
}
.logo {
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  color: #f60;
}
.spacer { flex: 1; }
.user-area { display: flex; align-items: center; gap: 8px; }
.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background 0.2s;
}
.user-trigger:hover { background: #f5f5f5; }
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  flex-shrink: 0;
}
.username { font-size: 14px; color: #333; }
.arrow { font-size: 12px; color: #999; }
.main {
  max-width: 1000px;
  margin: 24px auto;
  padding: 0 16px;
}
</style>