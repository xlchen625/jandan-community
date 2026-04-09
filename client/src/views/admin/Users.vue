<template>
  <div>
    <h2>用户管理</h2>
    <el-table :data="users" v-loading="loading" style="width:100%">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column label="角色" width="120">
        <template #default="{ row }">
          <el-tag :type="row.role === 'ADMIN' ? 'danger' : 'info'">{{ row.role }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="120">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button
            size="small"
            @click="toggleRole(row)"
          >
            {{ row.role === 'ADMIN' ? '降为普通用户' : '设为管理员' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      :total="total"
      :page-size="10"
      :current-page="page"
      layout="prev, pager, next"
      @current-change="handlePageChange"
      style="margin-top:16px"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const users = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)

const fetchUsers = async () => {
  loading.value = true
  try {
    const res: any = await request.get('/admin/users', { params: { page: page.value } })
    users.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const toggleRole = async (row: any) => {
  const newRole = row.role === 'ADMIN' ? 'USER' : 'ADMIN'
  await request.put(`/admin/users/${row.id}/role`, { role: newRole })
  ElMessage.success('修改成功')
  fetchUsers()
}

const handlePageChange = (p: number) => {
  page.value = p
  fetchUsers()
}

const formatTime = (time: string) => new Date(time).toLocaleDateString()

onMounted(fetchUsers)
</script>