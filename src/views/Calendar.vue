<template>
  <div class="calendar-container">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <div class="time">{{ currentTime }}</div>
      <div class="status-icons">
        <span class="wifi">📶</span>
        <span class="battery">🔋34%</span>
      </div>
    </div>

    <!-- 头部导航 -->
    <div class="header">
      <div class="header-left">
        <van-button type="primary" size="small" class="stats-btn">统计</van-button>
      </div>
      <div class="header-center">
        <van-icon name="cloud" class="cloud-icon" />
        <van-icon name="arrow-left" @click="prevMonth" class="nav-icon" />
        <span class="month-year">{{ currentMonthYear }}</span>
        <van-icon name="arrow-right" @click="nextMonth" class="nav-icon" />
      </div>
      <div class="header-right">
        <van-icon name="ellipsis" class="menu-icon" />
      </div>
    </div>

    <!-- 日历组件 -->
    <div class="calendar">
      <!-- 星期标题 -->
      <div class="weekdays">
        <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
      </div>
      
      <!-- 日期网格 -->
      <div class="date-grid">
        <div 
          v-for="date in calendarDates" 
          :key="date.key"
          :class="['date-cell', {
            'today': date.isToday,
            'has-record': date.hasRecord,
            'current-month': date.isCurrentMonth
          }]"
          @click="selectDate(date)"
        >
          <span class="date-number">{{ date.day }}</span>
          <div v-if="date.hasRecord" class="record-indicators">
            <van-icon name="success" class="check-icon" />
            <van-icon name="notes-o" class="note-icon" />
          </div>
          <span v-if="date.isToday" class="today-label">今</span>
        </div>
      </div>
    </div>

    <!-- 今日记录详情 -->
    <div class="daily-records">
      <div class="record-header">
        <h3 class="record-title">{{ selectedDateDisplay }}的记录(今天) 签</h3>
        <van-button type="danger" size="small" class="delete-btn">删除签到</van-button>
      </div>
      
      <div class="record-divider">
        <span class="divider-text">功过格</span>
      </div>

      <!-- 记录项目列表 -->
      <div class="record-items">
        <div 
          v-for="item in recordItems" 
          :key="item.key"
          :class="['record-item', { 'has-value': item.value > 0 }]"
          @click="editRecord(item)"
        >
          <div class="item-icon">
            <van-icon :name="item.icon" />
          </div>
          <div class="item-content">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-input">
              <input 
                v-model="item.value" 
                type="number" 
                :placeholder="item.placeholder"
                @input="updateRecord(item)"
              />
            </div>
          </div>
          <div class="item-status">
            <span v-if="item.value > 0" class="recorded">已记录 ></span>
            <span v-else class="not-recorded">未记录 ></span>
          </div>
        </div>
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

// 当前月份和年份
const currentMonth = ref(dayjs())
const currentMonthYear = computed(() => currentMonth.value.format('YYYY年MM月'))

// 星期标题
const weekdays = ['一', '二', '三', '四', '五', '六', '日']

// 当前选中的日期
const selectedDate = ref(dayjs())
const selectedDateDisplay = computed(() => selectedDate.value.format('YYYY-MM-D'))

// 当前标签页
const currentTab = ref('record')

// 记录项目
const recordItems = ref([
  { key: 'breakfast', name: '早餐', icon: 'heart', value: 0, placeholder: '0' },
  { key: 'lunch', name: '午餐', icon: 'heart', value: 0, placeholder: '0' },
  { key: 'dinner', name: '晚餐', icon: 'airplane', value: 0, placeholder: '0' },
  { key: 'snack', name: '零食', icon: 'running', value: 0, placeholder: '0' },
  { key: 'custom', name: '', icon: 'plus', value: 0, placeholder: '添加项目' },
  { key: 'bad-habit', name: '不良习惯', icon: 'thumb-circle-o', value: 0, placeholder: '0' },
  { key: 'good-habit', name: '良好习惯', icon: 'thumb-circle-o', value: 0, placeholder: '0' }
])

// 日历日期数据
const calendarDates = computed(() => {
  const startOfMonth = currentMonth.value.startOf('month')
  const endOfMonth = currentMonth.value.endOf('month')
  const startOfWeek = startOfMonth.startOf('week').add(1, 'day') // 从周一开始
  const endOfWeek = endOfMonth.endOf('week').add(1, 'day')
  
  const dates = []
  let current = startOfWeek
  
  while (current.isBefore(endOfWeek) || current.isSame(endOfWeek, 'day')) {
    const isCurrentMonth = current.isSame(currentMonth.value, 'month')
    const isToday = current.isSame(dayjs(), 'day')
    const hasRecord = Math.random() > 0.7 // 模拟有记录的概率
    
    dates.push({
      key: current.format('YYYY-MM-DD'),
      day: current.date(),
      isCurrentMonth,
      isToday,
      hasRecord,
      date: current
    })
    
    current = current.add(1, 'day')
  }
  
  return dates
})

// 切换月份
const prevMonth = () => {
  currentMonth.value = currentMonth.value.subtract(1, 'month')
}

const nextMonth = () => {
  currentMonth.value = currentMonth.value.add(1, 'month')
}

// 选择日期
const selectDate = (dateInfo: any) => {
  selectedDate.value = dateInfo.date
  loadRecordData()
}

// 更新记录
const updateRecord = (item: any) => {
  console.log('更新记录:', item.name, item.value)
}

// 编辑记录
const editRecord = (item: any) => {
  console.log('编辑记录:', item.name)
}

// 加载记录数据
const loadRecordData = () => {
  // 模拟加载数据
  console.log('加载日期数据:', selectedDate.value.format('YYYY-MM-DD'))
}

// 切换标签页
const switchTab = (tab: string) => {
  currentTab.value = tab
  if (tab === 'home') {
    router.push('/')
  } else if (tab === 'me') {
    router.push('/me')
  }
}

// 更新时间
const updateTime = () => {
  currentTime.value = dayjs().format('HH:mm')
}

onMounted(() => {
  // 设置当前标签页状态
  currentTab.value = 'record'
  
  // 每秒更新时间
  setInterval(updateTime, 1000)
  loadRecordData()
})
</script>

<style scoped>
.calendar-container {
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

/* 头部 */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  position: relative;
}

.header-left {
  position: absolute;
  top: 15px;
  left: 20px;
}

.header-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.month-year {
  font-size: 18px;
  font-weight: bold;
  margin: 0 12px;
}

.nav-icon, .cloud-icon, .menu-icon {
  font-size: 20px;
  cursor: pointer;
}

.stats-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.header-right {
  position: absolute;
  top: 15px;
  right: 20px;
}

/* 日历 */
.calendar {
  background: white;
  margin: 8px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 12px;
}

.weekday {
  text-align: center;
  font-weight: bold;
  color: #666;
  padding: 8px 0;
  font-size: 14px;
}

.date-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.date-cell {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  min-height: 40px;
}

.date-cell:hover {
  background: #f0f0f0;
}

.date-cell.today {
  background: #e8f5e8;
  border-color: #4caf50;
}

.date-cell.has-record {
  background: #e3f2fd;
}

.date-cell.current-month {
  color: #333;
}

.date-cell:not(.current-month) {
  color: #ccc;
}

.date-number {
  font-size: 14px;
  font-weight: 500;
}

.record-indicators {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  gap: 2px;
}

.check-icon, .note-icon {
  font-size: 8px;
  color: #4caf50;
}

.today-label {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 8px;
  color: #4caf50;
  font-weight: bold;
}

/* 今日记录 */
.daily-records {
  background: white;
  margin: 8px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex: 1;
  margin-bottom: 80px; /* 为底部导航留空间 */
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.record-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.delete-btn {
  background: #ff5722;
  border: none;
  color: white;
  font-size: 12px;
  padding: 6px 12px;
}

.record-divider {
  border-top: 1px solid #eee;
  margin: 16px 0;
  position: relative;
}

.divider-text {
  position: absolute;
  top: -10px;
  left: 16px;
  background: white;
  padding: 0 8px;
  color: #666;
  font-size: 12px;
}

.record-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s;
}

.record-item:hover {
  background: #e9ecef;
}

.record-item.has-value {
  background: #e8f5e8;
}

.item-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 50%;
  margin-right: 10px;
  font-size: 14px;
  color: #666;
}

.item-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-name {
  font-size: 14px;
  color: #333;
  min-width: 60px;
}

.item-input input {
  width: 60px;
  padding: 4px 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 12px;
}

.item-status {
  color: #666;
  font-size: 12px;
}

.recorded {
  color: #4caf50;
}

.not-recorded {
  color: #999;
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
