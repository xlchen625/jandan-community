<template>
  <div>
    <el-card style="margin-bottom:16px">
      <h3 style="margin-bottom:16px">{{ editingId ? '编辑公告' : '发布公告' }}</h3>
      <MdEditor
        v-model="content"
        style="width:100%"
        language="zh-CN"
        placeholder="支持Markdown格式..."
        :preview="true"
      />
      <div style="margin-top:8px; display:flex; gap:8px">
        <el-button type="primary" @click="submitNotice">{{ editingId ? '保存修改' : '发布' }}</el-button>
        <el-button v-if="editingId" @click="cancelEdit">取消</el-button>
      </div>
    </el-card>

    <el-table :data="notices" style="width:100%" border>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="公告内容" min-width="400">
        <template #default="{ row }">
          <MdPreview :modelValue="row.content" class="notice-preview" />
        </template>
      </el-table-column>
      <el-table-column label="发布时间" width="120">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button size="small" link type="primary" @click="editNotice(row)">编辑</el-button>
          <el-divider direction="vertical" />
          <el-button size="small" link type="danger" @click="deleteNotice(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MdEditor, MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import 'md-editor-v3/lib/preview.css'
import request from '@/utils/request'

const notices = ref<any[]>([])
const content = ref('')
const editingId = ref<number | null>(null)

const fetchNotices = async () => {
  const res: any = await request.get('/admin/notices')
  notices.value = res
}

const submitNotice = async () => {
  if (!content.value) return ElMessage.warning('公告内容不能为空')
  if (editingId.value) {
    await request.put(`/admin/notices/${editingId.value}`, { content: content.value })
    ElMessage.success('修改成功')
    cancelEdit()
  } else {
    await request.post('/admin/notices', { content: content.value })
    ElMessage.success('发布成功')
    content.value = ''
  }
  fetchNotices()
}

const editNotice = (row: any) => {
  editingId.value = row.id
  content.value = row.content
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const cancelEdit = () => {
  editingId.value = null
  content.value = ''
}

const deleteNotice = async (id: number) => {
  await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' })
  await request.delete(`/admin/notices/${id}`)
  ElMessage.success('已删除')
  fetchNotices()
}

const formatTime = (time: string) => new Date(time).toLocaleDateString()

onMounted(fetchNotices)
</script>

<style scoped>
.notice-preview {
  background: transparent;
  padding: 0;
  font-size: 13px;
}
</style>