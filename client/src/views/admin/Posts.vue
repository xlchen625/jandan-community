<template>
  <div>
    <div class="filter-bar">
      <div class="category-tabs">
        <span
          v-for="tab in categoryTabs"
          :key="tab.value"
          class="cat-tab"
          :class="{ active: filterCategory === tab.value }"
          @click="switchCategory(tab.value)"
        >{{ tab.label }}</span>
      </div>
      <div class="batch-btns" v-if="selectedIds.length > 0">
        <span class="selected-tip">已选 {{ selectedIds.length }} 条</span>
        <el-button size="small" type="primary" @click="batchAiReview">批量AI审核</el-button>
        <el-button size="small" type="success" @click="batchApprove">批量通过</el-button>
        <el-button size="small" type="danger" @click="batchReject">批量拒绝</el-button>
        <el-button size="small" type="danger" @click="batchDelete">批量删除</el-button>
      </div>
    </div>

    <el-table
      :data="posts"
      v-loading="loading"
      style="width:100%"
      border
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="45" />
      <el-table-column prop="id" label="ID" width="55" />
      <el-table-column label="内容" min-width="250">
        <template #default="{ row }">
          <div class="post-preview" @click="viewDetail(row)">
            {{ row.title || (row.content || '').slice(0, 50) }}
            <el-tag size="small" style="margin-left:4px">查看</el-tag>
          </div>
          <div class="post-images" v-if="row.images">
            <el-image
              v-for="(img, idx) in row.images.split(',')"
              :key="idx"
              :src="img"
              :preview-src-list="row.images.split(',')"
              fit="cover"
              class="thumb"
            />
          </div>
          <div class="post-tags">
            <el-tag size="small" :color="categoryColor(row.category_name)" style="border:none;color:#fff">
              {{ row.category_name }}
            </el-tag>
            <el-tag size="small" :type="statusTagType(row.status)">
              {{ row.status === 'HIDDEN' ? '已下架' : '正常' }}
            </el-tag>
            <el-tag size="small" :type="reviewTagType(row.review_status)">
              {{ reviewLabel(row.review_status) }}
            </el-tag>
          </div>
          <div class="review-reason" v-if="row.review_reason">
            审核理由：{{ row.review_reason }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="username" label="作者" width="90" />
      <el-table-column label="发布时间" width="100">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <div class="action-btns">
            <template v-if="row.review_status === 'pending'">
              <el-button size="small" link type="primary" @click="doAiReview(row)">AI审核</el-button>
              <el-divider direction="vertical" />
              <el-button size="small" link type="success" @click="approvePost(row.id)">通过</el-button>
              <el-divider direction="vertical" />
              <el-button size="small" link type="danger" @click="rejectPost(row.id)">拒绝</el-button>
              <el-divider direction="vertical" />
              <el-button size="small" link type="danger" @click="deletePost(row.id)">删除</el-button>
            </template>
            <template v-else-if="row.review_status === 'approved'">
              <el-button size="small" link type="primary" @click="doAiReview(row)">AI审核</el-button>
              <el-divider direction="vertical" />
              <el-button size="small" link type="warning" @click="toggleStatus(row)">
                {{ row.status === 'HIDDEN' ? '上架' : '下架' }}
              </el-button>
              <el-divider direction="vertical" />
              <el-button size="small" link type="danger" @click="deletePost(row.id)">删除</el-button>
            </template>
            <template v-else-if="row.review_status === 'rejected'">
              <el-button size="small" link type="success" @click="approvePost(row.id)">重新通过</el-button>
              <el-divider direction="vertical" />
              <el-button size="small" link type="danger" @click="deletePost(row.id)">删除</el-button>
            </template>
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

    <!-- 内容详情弹窗 -->
    <el-dialog v-model="detailVisible" title="内容详情" width="600px" top="5vh">
      <div v-if="currentPost" class="detail-content">
        <div class="detail-meta">
          <el-tag :color="categoryColor(currentPost.category_name)" style="border:none;color:#fff">
            {{ currentPost.category_name }}
          </el-tag>
          <span class="detail-author">{{ currentPost.username }}</span>
          <span class="detail-time">{{ formatTime(currentPost.created_at) }}</span>
        </div>
        <h3 v-if="currentPost.title" class="detail-title">{{ currentPost.title }}</h3>
        <div class="detail-text">{{ currentPost.content }}</div>
        <div class="detail-images" v-if="currentPost.images">
          <el-image
            v-for="(img, idx) in currentPost.images.split(',')"
            :key="idx"
            :src="img"
            :preview-src-list="currentPost.images.split(',')"
            fit="cover"
            class="detail-img"
          />
        </div>
        <div class="detail-review" v-if="currentPost.review_reason">
          <strong>审核理由：</strong>{{ currentPost.review_reason }}
        </div>
      </div>
      <template #footer>
        <div class="detail-footer">
          <template v-if="currentPost?.review_status === 'pending'">
            <el-button type="success" @click="approvePost(currentPost.id); detailVisible = false">通过</el-button>
            <el-button type="danger" @click="rejectPost(currentPost.id); detailVisible = false">拒绝</el-button>
          </template>
          <template v-else-if="currentPost?.review_status === 'rejected'">
            <el-button type="success" @click="approvePost(currentPost.id); detailVisible = false">重新通过</el-button>
          </template>
          <el-button @click="detailVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- AI审核弹窗 -->
    <el-dialog v-model="reviewVisible" title="AI审核结果" width="420px">
      <div v-if="reviewLoading" class="review-loading">审核中...</div>
      <div v-else-if="reviewResult" class="review-result">
        <p>
          <strong>结论：</strong>
          <el-tag :type="reviewResult.result === '通过' ? 'success' : 'danger'" size="large">
            {{ reviewResult.result }}
          </el-tag>
          <el-tag v-if="reviewResult.auto_approved" type="success" size="small" style="margin-left:8px">
            已自动审核通过
          </el-tag>
        </p>
        <p v-if="reviewResult.risk_type"><strong>风险类型：</strong>{{ reviewResult.risk_type }}</p>
        <p><strong>理由：</strong>{{ reviewResult.reason }}</p>
      </div>
    </el-dialog>

    <!-- 批量AI审核进度弹窗 -->
    <el-dialog v-model="batchReviewVisible" title="批量AI审核" width="420px" :close-on-click-modal="false">
      <div class="batch-review-progress">
        <p>正在审核 {{ batchReviewCurrent }} / {{ batchReviewTotal }} 条...</p>
        <el-progress :percentage="batchReviewPercent" />
        <div class="batch-review-log">
          <div v-for="(log, idx) in batchReviewLogs" :key="idx" class="log-item">
            <el-tag size="small" :type="log.result === '通过' ? 'success' : 'danger'">{{ log.result }}</el-tag>
            {{ log.title }}
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="batchReviewVisible = false" :disabled="batchReviewCurrent < batchReviewTotal">
          {{ batchReviewCurrent < batchReviewTotal ? '审核中...' : '完成' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const posts = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const filterCategory = ref('')
const selectedRows = ref<any[]>([])
const selectedIds = computed(() => selectedRows.value.map(r => r.id))
const reviewVisible = ref(false)
const reviewLoading = ref(false)
const reviewResult = ref<any>(null)
const detailVisible = ref(false)
const currentPost = ref<any>(null)

const batchReviewVisible = ref(false)
const batchReviewCurrent = ref(0)
const batchReviewTotal = ref(0)
const batchReviewLogs = ref<any[]>([])
const batchReviewPercent = computed(() =>
  batchReviewTotal.value ? Math.round(batchReviewCurrent.value / batchReviewTotal.value * 100) : 0
)

const categoryTabs = [
  { label: '全部', value: '' },
  { label: '文章', value: '文章' },
  { label: '树洞', value: '树洞' },
  { label: '随手拍', value: '随手拍' },
  { label: '无聊图', value: '无聊图' },
]

const categoryColor = (name: string) => {
  const map: Record<string, string> = {
    '文章': '#409eff', '树洞': '#67c23a',
    '随手拍': '#e6a23c', '无聊图': '#9b59b6', '鱼塘': '#00b4d8',
  }
  return map[name] || '#909399'
}

const statusTagType = (status: string) => status === 'HIDDEN' ? 'danger' : 'success'

const reviewTagType = (status: string) => {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'danger'
  return 'warning'
}

const reviewLabel = (status: string) => {
  if (status === 'approved') return '已审核'
  if (status === 'rejected') return '已拒绝'
  return '待审核'
}

const switchCategory = (val: string) => {
  filterCategory.value = val
  page.value = 1
}

watch(filterCategory, () => fetchPosts())

const fetchPosts = async () => {
  loading.value = true
  try {
    const res: any = await request.get('/admin/posts', {
      params: { page: page.value, category: filterCategory.value || undefined }
    })
    posts.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows
}

const viewDetail = (row: any) => {
  currentPost.value = row
  detailVisible.value = true
}

const approvePost = async (id: number) => {
  await request.put(`/admin/posts/${id}/approve`)
  ElMessage.success('审核通过')
  fetchPosts()
}

const rejectPost = async (id: number) => {
  await ElMessageBox.confirm('确认拒绝该内容？', '提示', { type: 'warning' })
  await request.put(`/admin/posts/${id}/reject`)
  ElMessage.success('已拒绝')
  fetchPosts()
}

const toggleStatus = async (row: any) => {
  if (row.status === 'HIDDEN') {
    await request.put(`/admin/posts/${row.id}/show`)
    ElMessage.success('已上架')
  } else {
    await ElMessageBox.confirm('确认下架？', '提示', { type: 'warning' })
    await request.put(`/admin/posts/${row.id}/hide`)
    ElMessage.success('已下架')
  }
  fetchPosts()
}

const deletePost = async (id: number) => {
  await ElMessageBox.confirm('确认删除？不可恢复', '提示', { type: 'warning' })
  await request.delete(`/posts/${id}`)
  ElMessage.success('已删除')
  fetchPosts()
}

const doAiReview = async (row: any) => {
  reviewVisible.value = true
  reviewLoading.value = true
  reviewResult.value = null
  try {
    const res: any = await request.get(`/ai/posts/${row.id}/review`)
    reviewResult.value = res
  } finally {
    reviewLoading.value = false
    fetchPosts()
  }
}

// 批量操作
const batchApprove = async () => {
  const pendingIds = selectedRows.value
    .filter(r => r.review_status === 'pending' || r.review_status === 'rejected')
    .map(r => r.id)
  if (pendingIds.length === 0) return ElMessage.warning('所选内容中没有可通过的条目')
  await ElMessageBox.confirm(`确认批量通过 ${pendingIds.length} 条内容？`, '提示', { type: 'warning' })
  await Promise.all(pendingIds.map(id => request.put(`/admin/posts/${id}/approve`)))
  ElMessage.success('批量通过成功')
  fetchPosts()
}

const batchReject = async () => {
  const pendingIds = selectedRows.value
    .filter(r => r.review_status === 'pending')
    .map(r => r.id)
  if (pendingIds.length === 0) return ElMessage.warning('所选内容中没有待审核的条目')
  await ElMessageBox.confirm(`确认批量拒绝 ${pendingIds.length} 条内容？`, '提示', { type: 'warning' })
  await Promise.all(pendingIds.map(id => request.put(`/admin/posts/${id}/reject`)))
  ElMessage.success('批量拒绝成功')
  fetchPosts()
}

const batchDelete = async () => {
  await ElMessageBox.confirm(`确认删除选中的 ${selectedIds.value.length} 条内容？此操作不可恢复`, '提示', { type: 'warning' })
  await Promise.all(selectedIds.value.map(id => request.delete(`/posts/${id}`)))
  ElMessage.success('批量删除成功')
  fetchPosts()
}

const batchAiReview = async () => {
  const rows = selectedRows.value
  if (rows.length === 0) return
  await ElMessageBox.confirm(`确认对选中的 ${rows.length} 条内容进行AI审核？`, '提示', { type: 'warning' })

  batchReviewVisible.value = true
  batchReviewCurrent.value = 0
  batchReviewTotal.value = rows.length
  batchReviewLogs.value = []

  for (const row of rows) {
    try {
      const res: any = await request.get(`/ai/posts/${row.id}/review`)
      batchReviewLogs.value.push({
        result: res.result,
        title: row.title || (row.content || '').slice(0, 20)
      })
    } catch {
      batchReviewLogs.value.push({
        result: '失败',
        title: row.title || (row.content || '').slice(0, 20)
      })
    }
    batchReviewCurrent.value++
  }
  fetchPosts()
}

const handlePageChange = (p: number) => {
  page.value = p
  fetchPosts()
}

const formatTime = (time: string) => new Date(time).toLocaleDateString()

onMounted(fetchPosts)
</script>

<style scoped>
.filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
.category-tabs { display: flex; gap: 4px; }
.cat-tab { padding: 6px 14px; font-size: 13px; cursor: pointer; border-radius: 4px; color: #666; transition: all 0.2s; }
.cat-tab:hover { background: #f5f5f5; color: #f60; }
.cat-tab.active { background: #f60; color: #fff; }
.batch-btns { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.selected-tip { font-size: 13px; color: #666; }
.post-preview { font-size: 14px; color: #333; margin-bottom: 4px; cursor: pointer; }
.post-preview:hover { color: #f60; }
.post-images { display: flex; gap: 4px; flex-wrap: wrap; margin: 4px 0; }
.thumb { width: 60px; height: 60px; border-radius: 4px; cursor: pointer; }
.post-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 4px; }
.review-reason { font-size: 12px; color: #999; margin-top: 4px; }
.action-btns { display: flex; align-items: center; flex-wrap: wrap; }
.review-loading { text-align: center; padding: 24px; color: #999; }
.review-result p { margin-bottom: 12px; font-size: 14px; line-height: 1.6; }
.detail-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.detail-author { font-size: 13px; color: #666; }
.detail-time { font-size: 13px; color: #999; }
.detail-title { font-size: 18px; font-weight: bold; margin-bottom: 12px; color: #222; }
.detail-text { font-size: 14px; line-height: 1.8; color: #333; white-space: pre-wrap; margin-bottom: 12px; }
.detail-images { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.detail-img { width: 150px; height: 120px; border-radius: 4px; }
.detail-review { font-size: 13px; color: #999; padding: 8px 12px; background: #f9f9f9; border-radius: 4px; }
.detail-footer { display: flex; gap: 8px; justify-content: flex-end; }
.batch-review-progress { padding: 8px 0; }
.batch-review-progress p { margin-bottom: 12px; font-size: 14px; }
.batch-review-log { margin-top: 16px; max-height: 200px; overflow-y: auto; }
.log-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 13px; color: #555; border-bottom: 1px solid #f5f5f5; }
</style>