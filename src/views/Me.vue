<template>
  <div class="me-container">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <div class="time">{{ currentTime }}</div>
    </div>

    <!-- 下拉刷新 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">

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
      <div class="menu-item" @click="handleLogout">
        <van-icon name="logout" />
        <span>退出登录</span>
        <van-icon name="arrow" />
      </div>
    </div>

    <!-- 数据统计卡片 -->
    <div class="stats-cards">
      <div class="stats-card">
        <div class="stats-icon">📅</div>
        <div class="stats-number">{{ loading ? '...' : totalDays }}</div>
        <div class="stats-label">记账天数</div>
      </div>
      <div class="stats-card">
        <div class="stats-icon">💰</div>
        <div class="stats-number">{{ loading ? '...' : `¥${totalAmount}` }}</div>
        <div class="stats-label">总消费</div>
      </div>
      <div class="stats-card">
        <div class="stats-icon">📊</div>
        <div class="stats-number">{{ loading ? '...' : avgDaily }}</div>
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
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { getUserStatistics } from '../api/meal'
import { logout } from '../api/auth'
import { showToast, showConfirmDialog } from 'vant'

const router = useRouter()

// 当前时间
const currentTime = ref(dayjs().format('HH:mm'))

// 当前标签页
const currentTab = ref('me')

// 用户信息
const username = ref('用户')

// 统计数据
const totalDays = ref(0)
const totalAmount = ref('0.00')
const avgDaily = ref('0.00')

// 加载状态
const loading = ref(false)
const refreshing = ref(false)

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

const goToExport = () => {
  showToast('数据导出功能开发中...')
}

const goToHelp = () => {
  showToast('帮助中心功能开发中...')
}

// 登出功能
const handleLogout = async () => {
  try {
    await showConfirmDialog({
      title: '退出登录',
      message: '确定要退出登录吗？'
    })
    
    const res = await logout()
    if (res.success) {
      // 清除本地存储
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      showToast('已退出登录')
      router.replace('/auth')
    } else {
      showToast(res.message || '登出失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      // 即使API失败，也清除本地存储并跳转
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.replace('/auth')
    }
  }
}

// 更新时间
const updateTime = () => {
  currentTime.value = dayjs().format('HH:mm')
}

// 加载用户统计数据
const loadUserStatistics = async () => {
  try {
    loading.value = true
    const response = await getUserStatistics()
    
    if (response.data && response.data.success) {
      const data = response.data.data
      totalDays.value = data.totalDays || 0
      totalAmount.value = formatAmount(data.totalAmount || 0)
      avgDaily.value = formatAmount(data.avgDaily || 0)
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
    // 如果API失败，使用本地存储的数据作为备用
    loadLocalStatistics()
  } finally {
    loading.value = false
  }
}

// 格式化金额
const formatAmount = (amount: number): string => {
  return amount.toFixed(2)
}

// 从本地存储加载统计数据（备用方案）
const loadLocalStatistics = () => {
  try {
    // 从localStorage获取所有记录日期
    const allKeys = Object.keys(localStorage)
    const recordKeys = allKeys.filter(key => key.startsWith('meal-record-'))
    
    let totalAmountValue = 0
    let totalDaysValue = recordKeys.length
    
    recordKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}')
        if (data.meals) {
          Object.values(data.meals).forEach(amount => {
            totalAmountValue += Number(amount) || 0
          })
        }
        if (data.customItems) {
          Object.values(data.customItems).forEach(amount => {
            totalAmountValue += Number(amount) || 0
          })
        }
      } catch (e) {
        console.error('解析本地数据失败:', e)
      }
    })
    
    totalDays.value = totalDaysValue
    totalAmount.value = formatAmount(totalAmountValue)
    avgDaily.value = totalDaysValue > 0 ? formatAmount(totalAmountValue / totalDaysValue) : '0.00'
  } catch (error) {
    console.error('加载本地统计数据失败:', error)
  }
}

// 获取用户名
const loadUserInfo = () => {
  try {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      username.value = user.username || user.nickname || '用户'
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 下拉刷新
const onRefresh = async () => {
  refreshing.value = true
  try {
    await loadUserStatistics()
    showToast('刷新成功')
  } catch (error) {
    showToast('刷新失败')
  } finally {
    refreshing.value = false
  }
}

onMounted(() => {
  // 设置当前标签页状态
  currentTab.value = 'me'
  
  // 加载用户信息
  loadUserInfo()
  
  // 加载统计数据
  loadUserStatistics()
  
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
  justify-content: center;
  align-items: center;
  padding: 8px 16px;
  background: #fff;
  font-size: 14px;
  color: #333;
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
  transition: transform 0.2s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
}

.stats-icon {
  font-size: 20px;
  margin-bottom: 8px;
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
