<template>
  <div class="profile-wrap">
    <!-- 左侧导航 -->
    <div class="profile-nav">
      <div class="nav-user">
        <div class="nav-avatar">{{ userStore.user?.username?.slice(0, 1).toUpperCase() }}</div>
        <div class="nav-username">{{ userStore.user?.username }}</div>
        <el-tag :type="userStore.isAdmin() ? 'danger' : 'info'" size="small">
          {{ userStore.isAdmin() ? '管理员' : '普通用户' }}
        </el-tag>
      </div>
      <div class="nav-menu">
        <div
          class="nav-item"
          :class="{ active: activeTab === 'profile' }"
          @click="activeTab = 'profile'"
        >👤 个人资料</div>
        <div
          class="nav-item"
          v-if="userStore.isAdmin()"
          @click="router.push('/admin')"
        >⚙️ 后台管理</div>
        <div
          class="nav-item logout-item"
          @click="handleLogout"
        >🚪 退出登录</div>
      </div>
    </div>

    <!-- 右侧内容 -->
    <div class="profile-content">
      <el-card v-if="activeTab === 'profile'">
        <h3>个人资料</h3>

        <el-divider content-position="left">修改用户名</el-divider>
        <el-form :model="usernameForm" label-width="80px">
          <el-form-item label="新用户名">
            <el-input v-model="usernameForm.username" placeholder="输入新用户名" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="usernameLoading" @click="handleUpdateUsername">
              保存
            </el-button>
          </el-form-item>
        </el-form>

        <el-divider content-position="left">修改密码</el-divider>
        <el-form :model="passwordForm" label-width="80px">
          <el-form-item label="原密码">
            <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="输入原密码" />
          </el-form-item>
          <el-form-item label="新密码">
            <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="输入新密码" />
          </el-form-item>
          <el-form-item label="确认密码">
            <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="passwordLoading" @click="handleUpdatePassword">
              保存
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('profile')

const usernameForm = ref({ username: '' })
const passwordForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const usernameLoading = ref(false)
const passwordLoading = ref(false)

const handleUpdateUsername = async () => {
  if (!usernameForm.value.username) return ElMessage.warning('请输入新用户名')
  usernameLoading.value = true
  try {
    await request.put('/user/username', { username: usernameForm.value.username })
    ElMessage.success('修改成功，请重新登录')
    userStore.logout()
  } finally {
    usernameLoading.value = false
  }
}

const handleUpdatePassword = async () => {
  if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword) {
    return ElMessage.warning('请填写完整')
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    return ElMessage.warning('两次密码不一致')
  }
  passwordLoading.value = true
  try {
    await request.put('/user/password', {
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    ElMessage.success('密码修改成功，请重新登录')
    userStore.logout()
  } finally {
    passwordLoading.value = false
  }
}

const handleLogout = async () => {
  await ElMessageBox.confirm('确认退出登录？', '提示', { type: 'warning' })
  userStore.logout()
}
</script>

<style scoped>
.profile-wrap {
  display: flex;
  gap: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.profile-nav {
  width: 180px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  padding: 24px 0;
  height: fit-content;
}

.nav-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0 16px 20px;
  border-bottom: 1px solid #f5f5f5;
}

.nav-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: bold;
}

.nav-username {
  font-size: 15px;
  font-weight: bold;
  color: #333;
}

.nav-menu {
  padding: 12px 0;
}

.nav-item {
  padding: 12px 24px;
  font-size: 14px;
  color: #555;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #fff3e0;
  color: #f60;
}

.nav-item.active {
  background: #fff3e0;
  color: #f60;
  font-weight: bold;
  border-right: 3px solid #f60;
}

.logout-item {
  margin-top: 8px;
  border-top: 1px solid #f5f5f5;
  padding-top: 20px;
  color: #999;
}

.logout-item:hover {
  color: #f56c6c;
  background: #fff0f0;
}

.profile-content {
  flex: 1;
}

h3 {
  font-size: 16px;
  margin-bottom: 20px;
  color: #333;
}
</style>