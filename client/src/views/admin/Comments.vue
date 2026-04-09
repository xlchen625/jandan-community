<template>
  <div>
    <el-table :data="comments" v-loading="loading" style="width:100%" border>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="评论内容" min-width="200">
        <template #default="{ row }">
          <div class="comment-text">{{ row.content }}</div>
          <el-tag
            size="small"
            :type="row.status === 'hidden' ? 'danger' : 'success'"
            style="margin-top:4px"
          >
            {{ row.status === 'hidden' ? '已隐藏' : '显示中' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="评论者" width="100">
        <template #default="{ row }">{{ row.username }}</template>
      </el-table-column>
      <el-table-column label="所属内容" min-width="180">
        <template #default="{ row }">
          <div class="post-ref" @click="viewPost(row)">
            <el-tag
              size="small"
              :color="categoryColor(row.category_name)"
              style="border:none;color:#fff;margin-right:4px"
            >{{ row.category_name }}</el-tag>
            <span class="post-id">#{{ row.post_id }}</span>
            <span class="post-preview">{{ row.post_title || (row.post_content || '').slice(0, 20) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="时间" width="110">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <div class="action-btns">
            <el-button
              size="small" link
              :type="row.status === 'hidden' ? 'success' : 'warning'"
              @click="toggleStatus(row)"
            >{{ row.status === 'hidden' ? '显示' : '隐藏' }}</el-button>
            <el-divider direction="vertical" />
            <el-button size="small" link type="danger" @click="deleteComment(row.id)">删除</el-button>
          </div>
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

    <!-- 查看所属内容弹窗 -->
    <el-dialog v-model="postVisible" title="所属内容" width="560px" top="5vh">
      <div v-if="currentPost" class="post-detail">
        <div class="post-meta">
          <el-tag
            :color="categoryColor(currentPost.category_name)"
            style="border:none;color:#fff"
          >{{ currentPost.category_name }}</el-tag>
          <span class="post-id-label">#{{ currentPost.post_id }}</span>
        </div>
        <h3 v-if="currentPost.post_title" class="post-title">{{ currentPost.post_title }}</h3>
        <div class="post-content">{{ currentPost.post_content }}</div>
      </div>
      <template #footer>
        <el-button @click="postVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const comments = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const postVisible = ref(false)
const currentPost = ref<any>(null)

const categoryColor = (name: string) => {
  const map: Record<string, string> = {
    '文章': '#409eff',
    '树洞': '#67c23a',
    '随手拍': '#e6a23c',
    '无聊图': '#9b59b6',
    '鱼塘': '#00b4d8',
  }
  return map[name] || '#909399'
}

const fetchComments = async () => {
  loading.value = true
  try {
    const res: any = await request.get('/admin/comments', { params: { page: page.value } })
    comments.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const toggleStatus = async (row: any) => {
  if (row.status === 'hidden') {
    await request.put(`/admin/comments/${row.id}/show`)
    ElMessage.success('已显示')
  } else {
    await request.put(`/admin/comments/${row.id}/hide`)
    ElMessage.success('已隐藏')
  }
  fetchComments()
}

const deleteComment = async (id: number) => {
  await ElMessageBox.confirm('确认删除该评论？此操作不可恢复', '提示', { type: 'warning' })
  await request.delete(`/admin/comments/${id}`)
  ElMessage.success('已删除')
  fetchComments()
}

const viewPost = (row: any) => {
  currentPost.value = row
  postVisible.value = true
}

const handlePageChange = (p: number) => {
  page.value = p
  fetchComments()
}

const formatTime = (time: string) => new Date(time).toLocaleDateString()

onMounted(fetchComments)
</script>

<style scoped>
.comment-text { font-size: 14px; color: #333; line-height: 1.6; }
.post-ref {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 13px;
}
.post-ref:hover .post-preview { color: #f60; }
.post-id { color: #999; font-size: 12px; flex-shrink: 0; }
.post-preview { color: #555; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.action-btns { display: flex; align-items: center; }
.post-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.post-id-label { font-size: 13px; color: #999; }
.post-title { font-size: 16px; font-weight: bold; margin-bottom: 12px; color: #222; }
.post-content { font-size: 14px; line-height: 1.8; color: #333; white-space: pre-wrap; }
</style>