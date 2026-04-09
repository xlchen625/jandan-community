<template>
  <div class="home">
    <el-tabs v-model="activeCategory">
      <el-tab-pane label="首页" name="" />
      <el-tab-pane label="文章" name="article" />
      <el-tab-pane label="树洞" name="tree-hole" />
      <el-tab-pane label="随手拍" name="photo" />
      <el-tab-pane label="无聊图" name="funny" />
      <el-tab-pane label="鱼塘 🚧" name="pond" />
    </el-tabs>

    <div class="content-wrap">
      <div class="post-list">
        <div class="list-header">
          <div class="publish-btn-wrap" v-if="activeCategory !== '' && activeCategory !== 'pond'">
            <el-button type="primary" @click="router.push(`/publish?category=${activeCategory}`)">
              ✏️ 我要发布
            </el-button>
          </div>
          <div v-else></div>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索内容..."
            clearable
            @input="handleSearch"
            style="width: 180px"
          />
        </div>

        <!-- 鱼塘建设中提示 -->
        <div v-if="activeCategory === 'pond'" class="building-tip">
          <el-empty description="鱼塘正在建设中，敬请期待 🚧" />
        </div>

        <template v-else>
          <el-empty v-if="posts.length === 0 && !loading" description="暂无内容" />
          <el-card
            v-for="post in posts"
            :key="post.id"
            class="post-card"
            @click="router.push(`/post/${post.id}`)"
          >
            <div class="post-meta">
              <span class="category-tag">{{ post.category_name }}</span>
              <span class="author">{{ post.display_name }}</span>
              <span class="time">{{ formatTime(post.created_at) }}</span>
            </div>
            <div class="post-title" v-if="post.title">{{ post.title }}</div>
            <div class="post-content" v-if="post.content">
              {{ post.content.slice(0, 100) }}{{ post.content.length > 100 ? '...' : '' }}
            </div>
            <div class="post-images" v-if="post.images">
              <img
                v-for="(img, index) in post.images.split(',')"
                :key="index"
                v-lazy="img"
                class="post-img"
              />
            </div>
            <div class="post-footer" @click.stop>
              <span
                class="oo"
                :class="{ active: likeStatusMap[post.id] === 'LIKE' }"
                @click="handleLike(post, 'LIKE')"
              >OO [{{ post.like_count }}]</span>
              <span
                class="xx"
                :class="{ active: likeStatusMap[post.id] === 'DISLIKE' }"
                @click="handleLike(post, 'DISLIKE')"
              >XX [{{ post.dislike_count || 0 }}]</span>
              <span class="comment" @click="router.push(`/post/${post.id}#comments`)">
                □ {{ post.comment_count }}
              </span>
            </div>
          </el-card>

          <div v-if="loading" class="loading">加载中...</div>

          <el-pagination
            v-if="total > pageSize"
            :total="total"
            :page-size="pageSize"
            :current-page="page"
            layout="prev, pager, next"
            @current-change="handlePageChange"
            style="margin-top: 16px; justify-content: center; display: flex"
          />
        </template>
      </div>

      <div class="sidebar">
        <div class="notice-list" v-if="notices.length > 0">
          <div class="sidebar-title">📢 公告</div>
          <div v-for="notice in notices" :key="notice.id" class="notice-item">
            {{ notice.content }}
            <div class="notice-time">{{ formatTime(notice.created_at) }}</div>
          </div>
        </div>

        <div class="hot-card">
          <div class="sidebar-section-title">热榜</div>
          <div class="hot-tabs">
            <span
              v-for="tab in hotTabs"
              :key="tab.key"
              class="hot-tab"
              :class="{ active: hotTab === tab.key }"
              @click="switchHotTab(tab.key)"
            >{{ tab.label }}</span>
          </div>
          <div
            v-for="(item, index) in currentHotList"
            :key="item.id"
            class="hot-item"
          >
            <span class="hot-rank" :class="index < 3 ? 'hot-rank-top' : ''">{{ index + 1 }}</span>
            <div class="hot-main">
              <div class="hot-text" @click="router.push(`/post/${item.id}`)">
                {{ item.title || (item.content || '').slice(0, 20) }}
              </div>
              <div class="hot-thumb-wrap" v-if="item.images" @click="router.push(`/post/${item.id}`)">
                <img :src="item.images.split(',')[0]" class="hot-thumb" />
              </div>
              <div class="hot-stats" @click.stop>
                <span
                  class="hot-oo"
                  :class="{ active: likeStatusMap[item.id] === 'LIKE' }"
                  @click="handleLike(item, 'LIKE')"
                >OO [{{ item.like_count }}]</span>
                <span
                  class="hot-xx"
                  :class="{ active: likeStatusMap[item.id] === 'DISLIKE' }"
                  @click="handleLike(item, 'DISLIKE')"
                >XX [{{ item.dislike_count || 0 }}]</span>
              </div>
            </div>
          </div>
          <el-empty v-if="currentHotList.length === 0" description="暂无数据" :image-size="50" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const posts = ref<any[]>([])
const hotByCategory = ref<Record<string, any[]>>({})
const notices = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = 10
const activeCategory = ref('')
const searchKeyword = ref('')
const hotTab = ref('tree-hole')
const likeStatusMap = ref<Record<number, string | null>>({})
let searchTimer: any = null

const hotTabs = [
  { key: 'tree-hole', label: '树洞' },
  { key: 'photo', label: '随手拍' },
  { key: 'funny', label: '无聊图' },
]

const currentHotList = computed(() => {
  return (hotByCategory.value[hotTab.value] || []).slice(0, 10)
})

const fetchPosts = async () => {
  loading.value = true
  try {
    const res: any = await request.get('/posts', {
      params: {
        category: activeCategory.value || undefined,
        page: page.value,
        limit: pageSize,
        keyword: searchKeyword.value || undefined
      }
    })
    posts.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const handleLike = async (post: any, type: string) => {
  if (!userStore.isLoggedIn()) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    const res: any = await request.post(`/posts/${post.id}/likes`, { type })
    if (res.action === 'cancel') {
      likeStatusMap.value[post.id] = null
      if (type === 'LIKE') post.like_count--
      else post.dislike_count = (post.dislike_count || 1) - 1
    } else if (res.action === 'switch') {
      likeStatusMap.value[post.id] = type
      if (type === 'LIKE') {
        post.like_count++
        post.dislike_count = (post.dislike_count || 1) - 1
      } else {
        post.dislike_count = (post.dislike_count || 0) + 1
        post.like_count--
      }
    } else {
      likeStatusMap.value[post.id] = type
      if (type === 'LIKE') post.like_count++
      else post.dislike_count = (post.dislike_count || 0) + 1
    }
  } catch {}
}

const fetchHotByCategory = async (slug: string) => {
  const res: any = await request.get('/posts', {
    params: { category: slug, page: 1, limit: 10, sort: 'hot' }
  })
  hotByCategory.value[slug] = res.list
}

const fetchNotices = async () => {
  const res: any = await request.get('/notices')
  notices.value = res
}

const switchHotTab = (key: string) => {
  hotTab.value = key
  fetchHotByCategory(key)
}

const handleSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    fetchPosts()
  }, 500)
}

watch(activeCategory, (val) => {
  if (val === 'pond') return
  page.value = 1
  fetchPosts()
})

const handlePageChange = (p: number) => {
  page.value = p
  fetchPosts()
}

const formatTime = (time: string) => new Date(time).toLocaleDateString()

onMounted(() => {
  fetchPosts()
  fetchNotices()
  fetchHotByCategory('tree-hole')
})
</script>

<style scoped>
.content-wrap { display: flex; gap: 24px; }
.post-list { flex: 1; min-width: 0; }
.list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.building-tip { padding: 48px 0; }

.post-card { margin-bottom: 12px; cursor: pointer; transition: box-shadow 0.2s; }
.post-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
.post-meta { display: flex; gap: 8px; font-size: 12px; color: #999; margin-bottom: 8px; align-items: center; }
.category-tag { background: #fff3e0; color: #f60; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.post-title { font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #222; }
.post-content { color: #555; font-size: 14px; line-height: 1.6; }
.post-images { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
.post-img { width: calc(50% - 4px); height: 200px; object-fit: cover; border-radius: 4px; }
.post-footer { display: flex; gap: 16px; margin-top: 12px; align-items: center; }
.oo { color: #e74c3c; font-weight: bold; cursor: pointer; font-size: 13px; }
.oo.active { opacity: 0.5; }
.xx { color: #3498db; font-weight: bold; cursor: pointer; font-size: 13px; }
.xx.active { opacity: 0.5; }
.comment { color: #999; font-size: 13px; cursor: pointer; }
.comment:hover { color: #f60; }
.loading { text-align: center; padding: 24px; color: #999; }

.sidebar { width: 240px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; }

.notice-list { background: #fff; border-radius: 8px; padding: 16px; border-left: 3px solid #f60; }
.sidebar-title { font-weight: bold; margin-bottom: 12px; font-size: 15px; }
.notice-item { font-size: 13px; color: #333; padding: 8px 0; border-bottom: 1px solid #f5f5f5; line-height: 1.6; }
.notice-item:last-child { border-bottom: none; }
.notice-time { font-size: 11px; color: #bbb; margin-top: 4px; }

.hot-card { background: #fff; border-radius: 8px; padding: 12px 16px; position: sticky; top: 72px; }
.sidebar-section-title { font-size: 13px; color: #999; font-weight: bold; margin-bottom: 8px; }
.hot-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
.hot-tab { font-size: 13px; color: #666; cursor: pointer; padding: 2px 8px; border-radius: 4px; }
.hot-tab:hover { color: #f60; }
.hot-tab.active { background: #f60; color: #fff; }

.hot-item { display: flex; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
.hot-item:last-child { border-bottom: none; }
.hot-rank { width: 20px; height: 20px; background: #eee; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; color: #999; margin-top: 2px; }
.hot-rank-top { background: #f60; color: #fff; }
.hot-main { flex: 1; min-width: 0; }
.hot-text { font-size: 13px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 4px; cursor: pointer; }
.hot-text:hover { color: #f60; }
.hot-thumb { width: 100%; height: 60px; object-fit: cover; border-radius: 4px; margin-bottom: 4px; cursor: pointer; }
.hot-stats { display: flex; gap: 8px; font-size: 12px; }
.hot-oo { color: #e74c3c; font-weight: bold; cursor: pointer; }
.hot-oo.active { opacity: 0.5; }
.hot-xx { color: #3498db; font-weight: bold; cursor: pointer; }
.hot-xx.active { opacity: 0.5; }
</style>