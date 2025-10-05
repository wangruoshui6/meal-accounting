<template>
  <div class="me-container">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <div class="time">{{ currentTime }}</div>
      <div class="status-icons">
        <span class="wifi">📶</span>
        <span class="battery">🔋34%</span>
      </div>
    </div>

    <!-- 用户信息头部 -->
    <div class="user-header">
      <div class="user-avatar">
        <van-icon name="user-circle-o" size="60" />
      </div>
      <div class="user-info">
        <h3 class="username">{{ username }}</h3>
        <p class="user-desc">餐饮记账用户</p>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-section">
      <div class="menu-item" @click="goToSettings">
        <van-icon name="setting-o" />
        <span>设置</span>
        <van-icon name="arrow" />
      </div>
      <div class="menu-item" @click="goToStatistics">
        <van-icon name="chart-trending-o" />
        <span>统计报告</span>
        <van-icon name="arrow" />
      </div>
      <div class="menu-item" @click="goToExport">
        <van-icon name="down" />
        <span>数据导出</span>
        <van-icon name="arrow" />
      </div>
      <div class="menu-item" @click="goToHelp">
        <van-icon name="question-o" />
        <span>帮助中心</span>
        <van-icon name="arrow" />
      </div>
    </div>

    <!-- 数据统计卡片 -->
    <div class="stats-cards">
      <div class="stats-card">
        <div class="stats-number">{{ totalDays }}</div>
        <div class="stats-label">记账天数</div>
      </div>
      <div class="stats-card">
        <div class="stats-number">¥{{ totalAmount }}</div>
        <div class="stats-label">总消费</div>
      </div>
      <div class="stats-card">
        <div class="stats-number">{{ avgDaily }}</div>
        <div class="stats-label">日均消费</div>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="bottom-nav">
      <div class="nav-item" :class="{ active: currentTab === 'home' }" @click="switchTab('home')">
        <van-icon name="home-o" />
        <span>主页</span>
      </div>
      <div class="nav-item" :class="{ active: currentTab === 'record' }" @click="switchTab('record')">
        <van-icon name="calendar-o" />
        <span>记录</span>
      </div>
      <div class="nav-item" :class="{ active: currentTab === 'me' }" @click="switchTab('me')">
        <van-icon name="user-o" />
        <span>我</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'

const router = useRouter()

// 当前时间
const currentTime = ref(dayjs().format('HH:mm'))

// 当前标签页
const currentTab = ref('me')

// 用户信息
const username = ref('用户')

// 统计数据
const totalDays = ref(15)
const totalAmount = ref('1,234.56')
const avgDaily = ref('82.30')

// 切换标签页
const switchTab = (tab: string) => {
  currentTab.value = tab
  if (tab === 'home') {
    router.push('/')
  } else if (tab === 'record') {
    router.push('/calendar')
  }
}

// 菜单点击事件
const goToSettings = () => {
  console.log('前往设置')
}

const goToStatistics = () => {
  console.log('前往统计报告')
}

const goToExport = () => {
  console.log('前往数据导出')
}

const goToHelp = () => {
  console.log('前往帮助中心')
}

// 更新时间
const updateTime = () => {
  currentTime.value = dayjs().format('HH:mm')
}

onMounted(() => {
  // 设置当前标签页状态
  currentTab.value = 'me'
  
  // 每秒更新时间
  setInterval(updateTime, 1000)
})
</script>

<style scoped>
.me-container {
  max-width: 400px;
  margin: 0 auto;
  background: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 状态栏 */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #fff;
  font-size: 14px;
  color: #333;
}

.status-icons {
  display: flex;
  gap: 8px;
}

/* 用户信息头部 */
.user-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
}

.user-avatar {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 4px 0;
}

.user-desc {
  font-size: 14px;
  opacity: 0.8;
  margin: 0;
}

/* 功能菜单 */
.menu-section {
  background: white;
  margin: 8px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background: #f8f9fa;
}

.menu-item .van-icon:first-child {
  font-size: 18px;
  color: #666;
  margin-right: 12px;
}

.menu-item span {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.menu-item .van-icon:last-child {
  font-size: 14px;
  color: #ccc;
}

/* 数据统计卡片 */
.stats-cards {
  display: flex;
  gap: 8px;
  margin: 8px;
}

.stats-card {
  flex: 1;
  background: white;
  padding: 16px 12px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-number {
  font-size: 18px;
  font-weight: bold;
  color: #1976d2;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 12px;
  color: #666;
}

/* 底部导航 */
.bottom-nav {
  display: flex;
  background: white;
  border-top: 1px solid #eee;
  padding: 8px 0;
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 400px;
  z-index: 1000;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #999;
}

.nav-item.active {
  color: #1976d2;
}

.nav-item span {
  font-size: 12px;
  margin-top: 4px;
}

.nav-item .van-icon {
  font-size: 18px;
}
</style>
