<template>
  <div class="publish">
    <el-card>
      <h2>发布内容</h2>
      <el-form :model="form" label-width="80px">

        <div class="category-label" v-if="route.query.category">
          发布到：<el-tag type="warning">{{ categories.find(c => c.slug === route.query.category)?.name }}</el-tag>
        </div>

        <el-form-item label="分类" v-if="!route.query.category">
          <el-select v-model="form.category_id" placeholder="选择分类" @change="handleCategoryChange">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>

        <template v-if="currentSlug === 'tree-hole'">
          <el-form-item label="匿名发布">
            <el-switch v-model="form.is_anonymous" />
          </el-form-item>
          <el-form-item label="匿名昵称" v-if="form.is_anonymous">
            <el-input v-model="form.anonymous_name" placeholder="留空则显示'匿名用户'" />
          </el-form-item>
        </template>

        <el-form-item label="标题" v-if="currentSlug === 'article' || currentSlug === 'pond'">
          <el-input v-model="form.title" placeholder="标题（选填）" />
        </el-form-item>

        <el-form-item label="内容">
          <!-- 文章用Markdown编辑器 -->
          <MdEditor
            v-if="currentSlug === 'article'"
            v-model="form.content"
            style="width:100%"
            :preview="false"
            language="zh-CN"
            placeholder="支持Markdown格式..."
          />
          <!-- 其他分类用普通textarea -->
          <el-input
            v-else
            v-model="form.content"
            type="textarea"
            :rows="6"
            :placeholder="contentPlaceholder"
          />
        </el-form-item>

        <el-form-item label="图片" v-if="currentSlug !== 'tree-hole'">
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            list-type="picture-card"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            accept="image/*"
            :limit="9"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">发布</el-button>
          <el-button @click="router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const categories = ref<any[]>([])
const imageUrls = ref<string[]>([])

const form = ref({
  title: '',
  content: '',
  category_id: null as number | null,
  is_anonymous: false,
  anonymous_name: '',
})

const currentSlug = computed(() => {
  if (route.query.category) return route.query.category as string
  const cat = categories.value.find(c => c.id === form.value.category_id)
  return cat?.slug || ''
})

const contentPlaceholder = computed(() => {
  if (currentSlug.value === 'tree-hole') return '说说你的心里话...'
  if (currentSlug.value === 'photo') return '配点文字说明（选填）'
  if (currentSlug.value === 'funny') return '配点文字说明（选填）'
  return '写点什么...'
})

const handleCategoryChange = () => {
  form.value.is_anonymous = false
  form.value.anonymous_name = ''
  form.value.title = ''
  form.value.content = ''
  imageUrls.value = []
}

const uploadUrl = '/api/upload'
const uploadHeaders = { Authorization: `Bearer ${localStorage.getItem('token')}` }

const handleUploadSuccess = (res: any) => {
  imageUrls.value.push(res.url)
}

const handleRemove = (file: any) => {
  const url = file.response?.url
  imageUrls.value = imageUrls.value.filter(u => u !== url)
}

const loadCategories = async () => {
  try {
    const res: any = await request.get('/categories')
    categories.value = res
    if (route.query.category) {
      const cat = categories.value.find(c => c.slug === route.query.category)
      if (cat) form.value.category_id = cat.id
    }
  } catch {
    categories.value = [
      { id: 1, name: '文章', slug: 'article' },
      { id: 2, name: '树洞', slug: 'tree-hole' },
      { id: 3, name: '随手拍', slug: 'photo' },
      { id: 4, name: '无聊图', slug: 'funny' },
      { id: 5, name: '鱼塘', slug: 'pond' },
    ]
  }
}

const handleSubmit = async () => {
  if (!form.value.category_id) return ElMessage.warning('请选择分类')
  if (currentSlug.value !== 'photo' && currentSlug.value !== 'funny' && !form.value.content) {
    return ElMessage.warning('内容不能为空')
  }
  if ((currentSlug.value === 'photo' || currentSlug.value === 'funny') && imageUrls.value.length === 0) {
    return ElMessage.warning('请至少上传一张图片')
  }
  const token = localStorage.getItem('token')
  if (currentSlug.value !== 'tree-hole' && !token) {
    return ElMessage.warning('请先登录')
  }
  loading.value = true
  try {
    await request.post('/posts', {
      ...form.value,
      images: imageUrls.value.join(',') || undefined
    })
    ElMessage.success('发布成功，等待审核后显示')
    router.push('/')
  } finally {
    loading.value = false
  }
}

onMounted(loadCategories)
</script>

<style scoped>
.publish { max-width: 800px; margin: 0 auto; }
h2 { margin-bottom: 24px; }
.category-label { margin-bottom: 20px; font-size: 14px; color: #666; }
</style>