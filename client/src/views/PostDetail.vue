<template>
  <div class="post-detail" v-if="post">
    <el-card>
      <div class="post-meta">
        <el-tag>{{ post.category_name }}</el-tag>
        <span class="author">{{ post.display_name }}</span>
        <span class="time">{{ formatTime(post.created_at) }}</span>
      </div>
      <h1 v-if="post.title">{{ post.title }}</h1>

      <!-- 文章用Markdown渲染，其他用普通文本 -->
      <MdPreview
        v-if="post.category_name === '文章'"
        :modelValue="post.content || ''"
        class="md-preview"
      />
      <div class="post-content" v-else-if="post.content">{{ post.content }}</div>

      <div class="post-images" v-if="post.images">
        <el-image
          v-for="(img, index) in post.images.split(',')"
          :key="index"
          :src="img"
          :preview-src-list="post.images.split(',')"
          fit="cover"
          class="post-img"
        />
      </div>

      <div class="actions">
        <span
          class="oo-btn"
          :class="{ active: likeStatus === 'LIKE' }"
          @click="handleLike('LIKE')"
        >OO [{{ post.like_count }}]</span>
        <span
          class="xx-btn"
          :class="{ active: likeStatus === 'DISLIKE' }"
          @click="handleLike('DISLIKE')"
        >XX [{{ post.dislike_count || 0 }}]</span>
      </div>

      <div class="ai-summary" v-if="post.category_name === '文章' || post.category_name === '树洞'">
        <div class="ai-title">
          🤖 AI 总结
          <el-button size="small" @click="generateSummary" :disabled="aiLoading">
            {{ aiSummary ? '重新生成' : '生成总结' }}
          </el-button>
          <el-button size="small" v-if="aiLoading" @click="abortSummary">中断</el-button>
        </div>
        <div class="ai-content" v-if="aiSummary || aiLoading">
          <MdPreview :modelValue="aiSummary" class="md-preview-sm" />
          <span v-if="aiLoading" class="cursor">|</span>
        </div>
      </div>
    </el-card>

    <el-card class="comment-section" id="comments">
      <h3>评论 {{ commentTotal }}</h3>
      <div class="comment-input" v-if="userStore.isLoggedIn()">
        <el-input v-model="commentContent" type="textarea" :rows="3" placeholder="写下你的评论..." />
        <el-button type="primary" @click="handleComment" style="margin-top:8px">发表评论</el-button>
      </div>
      <div v-else class="login-tip">
        <el-button type="primary" text @click="router.push('/login')">登录后发表评论</el-button>
      </div>
      <el-divider />
      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="comment-meta">
          <span class="comment-author">{{ comment.username }}</span>
          <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
          <el-button
            v-if="userStore.user?.id === comment.author_id || userStore.isAdmin()"
            size="small" type="danger" text
            @click="deleteComment(comment.id)"
          >删除</el-button>
        </div>
        <div class="comment-content">{{ comment.content }}</div>
      </div>
      <el-empty v-if="comments.length === 0" description="暂无评论" />
    </el-card>

    <div class="float-back" @click="router.back()">← 返回</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const post = ref<any>(null)
const comments = ref<any[]>([])
const commentTotal = ref(0)
const commentContent = ref('')
const likeStatus = ref<string | null>(null)
const aiSummary = ref('')
const aiLoading = ref(false)
let abortController: AbortController | null = null

const fetchPost = async () => {
  const res: any = await request.get(`/posts/${route.params.id}`)
  post.value = res
}

const fetchComments = async () => {
  const res: any = await request.get(`/posts/${route.params.id}/comments`)
  comments.value = res.list
  commentTotal.value = res.total
}

const fetchLikeStatus = async () => {
  if (!userStore.isLoggedIn()) return
  const res: any = await request.get(`/posts/${route.params.id}/likes/status`)
  likeStatus.value = res.type
}

const handleLike = async (type: string) => {
  if (!userStore.isLoggedIn()) return ElMessage.warning('请先登录')
  const res: any = await request.post(`/posts/${route.params.id}/likes`, { type })
  if (res.action === 'cancel') likeStatus.value = null
  else likeStatus.value = type
  fetchPost()
}

const handleComment = async () => {
  if (!commentContent.value) return ElMessage.warning('评论不能为空')
  await request.post(`/posts/${route.params.id}/comments`, { content: commentContent.value })
  commentContent.value = ''
  ElMessage.success('评论成功')
  fetchComments()
}

const deleteComment = async (id: number) => {
  await request.delete(`/posts/${route.params.id}/comments/${id}`)
  ElMessage.success('已删除')
  fetchComments()
}

const generateSummary = async () => {
  aiSummary.value = ''
  aiLoading.value = true
  abortController = new AbortController()
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/ai/posts/${route.params.id}/summary`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: abortController.signal,
    })
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value)
      const lines = text.split('\n').filter(l => l.startsWith('data: '))
      for (const line of lines) {
        const data = line.replace('data: ', '')
        if (data === '[DONE]') break
        aiSummary.value += data
      }
    }
  } catch (e: any) {
    if (e.name !== 'AbortError') ElMessage.error('生成失败')
  } finally {
    aiLoading.value = false
  }
}

const abortSummary = () => {
  abortController?.abort()
  aiLoading.value = false
}

const formatTime = (time: string) => new Date(time).toLocaleDateString()

onMounted(() => {
  fetchPost()
  fetchComments()
  fetchLikeStatus()
  if (route.hash === '#comments') {
    setTimeout(() => {
      document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })
    }, 500)
  }
})
</script>

<style scoped>
.post-detail { max-width: 800px; margin: 0 auto; }
.post-meta { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; color: #999; font-size: 13px; }
h1 { font-size: 22px; margin-bottom: 16px; }
.post-content { line-height: 1.8; color: #333; white-space: pre-wrap; }
.md-preview { background: transparent; padding: 0; }
.post-images { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
.post-img { width: 100%; max-width: 500px; max-height: 400px; object-fit: contain; border-radius: 4px; display: block; margin-bottom: 8px; }
.actions { display: flex; gap: 16px; margin-top: 24px; align-items: center; }
.oo-btn { color: #e74c3c; font-weight: bold; cursor: pointer; font-size: 15px; }
.oo-btn.active { opacity: 0.5; }
.xx-btn { color: #3498db; font-weight: bold; cursor: pointer; font-size: 15px; }
.xx-btn.active { opacity: 0.5; }
.ai-summary { margin-top: 24px; background: #f9f9f9; border-radius: 8px; padding: 16px; }
.ai-title { display: flex; align-items: center; gap: 8px; font-weight: bold; margin-bottom: 8px; }
.ai-content { line-height: 1.8; color: #333; }
.md-preview-sm { background: transparent; padding: 0; }
.cursor { animation: blink 1s infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
.comment-section { margin-top: 16px; }
.login-tip { margin-bottom: 12px; }
.comment-item { padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
.comment-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.comment-author { font-weight: bold; font-size: 13px; }
.comment-time { font-size: 12px; color: #999; }
.comment-content { color: #333; font-size: 14px; }
.float-back {
  position: fixed;
  right: 30px;
  bottom: 50px;
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 20px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 999;
  transition: all 0.2s;
}
.float-back:hover { color: #f60; border-color: #f60; }
</style>