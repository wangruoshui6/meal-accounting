<template>
  <div class="calendar-container">
    <!-- 头部导航 -->
    <div class="header">
      <div class="header-center">
        <van-icon name="arrow-left" @click="prevMonth" class="nav-icon" />
        <span class="month-year">{{ currentMonthYear }}</span>
        <van-icon name="arrow-left" @click="nextMonth" class="nav-icon" style="transform: rotate(180deg);" />
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
      </div>
      
      <div class="record-divider">
        <span class="divider-text">记录详情</span>
      </div>

      <!-- 记录项目列表 -->
      <div class="record-items">
        <div 
          v-for="item in recordItems" 
          :key="item.key"
          :class="['record-item', { 
            'has-value': item.value > 0,
            'has-diary': diaryItems.has(item.name)
          }]"
          @click="editRecord(item)"
        >
        <div class="item-icon">
          <van-icon v-if="!item.key.startsWith('custom_')" :name="item.icon" />
        </div>
          <div class="item-content">
            <div class="item-name">{{ item.name }}</div>
          </div>
          <div class="item-status">
            <span v-if="diaryItems.has(item.name)" class="diary-recorded">已记录 ></span>
            <span v-else-if="item.value > 0" class="recorded">已记录 ></span>
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
import { getDefaultMealItems } from '../api/settings'
import { getMealRecord } from '../api/meal'
import { getRecordDates } from '../api/meal'
import { getDiariesByDate } from '../api/diary'

const router = useRouter()

// 当前月份和年份
const currentMonth = ref(dayjs())
const currentMonthYear = computed(() => currentMonth.value.format('YYYY年MM月'))

// 星期标题
const weekdays = ['一', '二', '三', '四', '五', '六', '日']

// 当前选中的日期（从localStorage读取，如果没有则使用当前日期）
const getStoredDate = () => {
  const storedDate = localStorage.getItem('selectedDate')
  if (storedDate) {
    const parsed = dayjs(storedDate)
    if (parsed.isValid()) {
      return parsed
    }
  }
  return dayjs()
}

const selectedDate = ref(getStoredDate())
const selectedDateDisplay = computed(() => selectedDate.value.format('YYYY-MM-D'))

// 初始化月份显示（基于选中的日期）
if (selectedDate.value.isValid()) {
  currentMonth.value = selectedDate.value.startOf('month')
}

// 当前标签页
const currentTab = ref('record')

// 记录项目
interface RecordItem {
  key: string
  name: string
  icon: string
  value: number
  placeholder: string
}

const recordItems = ref<RecordItem[]>([])

// 日记项目
const diaryItems = ref<Set<string>>(new Set())

// 加载所有项目（默认+自定义）
const loadAllItems = async () => {
  try {
    // 从主页的数据中获取动态项目
    const dateKey = selectedDate.value.format('YYYY-MM-DD')
    const record = await getMealRecord(dateKey)
    
    // 构建项目列表
    const allItems: RecordItem[] = []
    const addedNames = new Set<string>() // 用于去重
    
    // 同义词映射
    const synonyms = {
      '早餐': ['早饭', '早膳'],
      '午餐': ['午饭', '中餐', '中饭'],
      '晚餐': ['晚饭', '夜餐', '夜饭'],
      '零食': ['小食', '点心'],
      '饮料': ['饮品', '喝的东西']
    }
    
    // 检查是否为同义词
    const isSynonym = (name: string, addedNames: Set<string>) => {
      for (const [key, values] of Object.entries(synonyms)) {
        if (addedNames.has(key) && values.includes(name)) {
          return true
        }
        if (values.includes(name) && addedNames.has(key)) {
          return true
        }
      }
      return false
    }
    
    // 从后端获取默认项目列表
    let defaultMealItems: string[] = []
    try {
      const defaultItemsResponse = await getDefaultMealItems()
      console.log('获取默认项目响应:', defaultItemsResponse)
      
      if (defaultItemsResponse.success && defaultItemsResponse.data && Array.isArray(defaultItemsResponse.data)) {
        defaultMealItems = defaultItemsResponse.data.filter((name: string) => name && name.trim() !== '')
      } else {
        // 如果获取失败，使用默认值
        defaultMealItems = ['早饭', '午饭', '晚饭', '零食', '饮料']
      }
    } catch (error) {
      console.error('获取默认项目失败:', error)
      // 如果获取失败，使用默认值
      defaultMealItems = ['早饭', '午饭', '晚饭', '零食', '饮料']
    }
    
    // 如果获取的项目为空，使用默认值
    if (defaultMealItems.length === 0) {
      defaultMealItems = ['早饭', '午饭', '晚饭', '零食', '饮料']
    }
    
    console.log('最终默认项目列表:', defaultMealItems)
    
    // 图标映射
    const iconMap: Record<string, string> = {
      '早饭': 'heart',
      '早餐': 'heart',
      '午饭': 'heart',
      '午餐': 'heart',
      '晚饭': 'airplane',
      '晚餐': 'airplane',
      '零食': 'running',
      '饮料': 'water'
    }
    
    // 先添加默认项目（从后端获取的）
    defaultMealItems.forEach((name, index) => {
      // 跳过空名称的项目
      if (!name || name.trim() === '') {
        return
      }
      
      // 确定key：前5个使用固定key，超过5个的使用default_前缀
      const keyMapping: Record<number, string> = {
        0: 'breakfast',
        1: 'lunch',
        2: 'dinner',
        3: 'snack',
        4: 'drink'
      }
      const key = index < 5 && keyMapping[index] ? keyMapping[index] : `default_${index}`
      const icon = iconMap[name] || 'circle'
      
      allItems.push({
        key: key,
        name: name,
        icon: icon,
        value: 0,
        placeholder: '0'
      })
      addedNames.add(name)
    })
    
    // 从主页数据中获取动态项目
    if (record && (record as any).customItems && (record as any).customItems.trim() !== '') {
      try {
        const customItems = JSON.parse((record as any).customItems)
        Object.keys(customItems).forEach((name, index) => {
          if (!addedNames.has(name) && !isSynonym(name, addedNames)) {
            allItems.push({
              key: `custom_${index}`,
              name: name,
              icon: '', // 动态项目不显示图标
              value: 0,
              placeholder: '0'
            })
            addedNames.add(name)
          }
        })
      } catch (error) {
        console.error('解析customItems失败:', error)
      }
    }
    
    recordItems.value = allItems
  } catch (error) {
    console.error('加载项目失败:', error)
  }
}

// 日历日期数据
interface CalendarDate {
  key: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  hasRecord: boolean
  date: dayjs.Dayjs
}

const calendarDates = computed((): CalendarDate[] => {
  const startOfMonth = currentMonth.value.startOf('month')
  const endOfMonth = currentMonth.value.endOf('month')
  const startOfWeek = startOfMonth.startOf('week').add(1, 'day') // 从周一开始
  const endOfWeek = endOfMonth.endOf('week').add(1, 'day')
  
  const dates: CalendarDate[] = []
  let current = startOfWeek
  
  while (current.isBefore(endOfWeek) || current.isSame(endOfWeek, 'day')) {
    const isCurrentMonth = current.isSame(currentMonth.value, 'month')
    const isToday = current.isSame(dayjs(), 'day')
    const dateKey = current.format('YYYY-MM-DD')
    const hasRecord = recordDates.value.has(dateKey) // 检查是否有记录
    
    dates.push({
      key: dateKey,
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
  loadRecordData() // 重新加载记录数据
}

const nextMonth = () => {
  currentMonth.value = currentMonth.value.add(1, 'month')
  loadRecordData() // 重新加载记录数据
}

// 选择日期
const selectDate = (dateInfo: any) => {
  selectedDate.value = dateInfo.date
  loadRecordData()
  loadDiaryData()
  loadAllItems() // 重新加载项目，因为不同日期可能有不同的动态项目
}


// 更新记录
const updateRecord = (item: any) => {
  console.log('更新记录:', item.name, item.value)
}


// 编辑记录
const editRecord = (item: any) => {
  // 跳转到日记页面
  router.push({
    path: '/diary',
    query: {
      date: selectedDate.value.format('YYYY-MM-DD'),
      item: item.name
    }
  })
}


// 页面重新获得焦点时重新加载数据
const handlePageFocus = () => {
  // 同步从主页选择的日期
  const storedDate = localStorage.getItem('selectedDate')
  if (storedDate) {
    const parsed = dayjs(storedDate)
    if (parsed.isValid()) {
      selectedDate.value = parsed
      currentMonth.value = parsed.startOf('month') // 同步月份显示
    }
  }
  
  loadDiaryData()
  loadAllItems() // 重新加载项目，确保与主页同步，包括从设置页面返回时更新默认项目
  loadRecordData() // 重新加载记录数据
}

// 监听页面可见性变化（当从其他页面返回时）
const handleVisibilityChange = () => {
  if (!document.hidden) {
    // 同步从主页选择的日期
    const storedDate = localStorage.getItem('selectedDate')
    if (storedDate) {
      const parsed = dayjs(storedDate)
      if (parsed.isValid()) {
        selectedDate.value = parsed
        currentMonth.value = parsed.startOf('month') // 同步月份显示
      }
    }
    
    // 页面变为可见时，重新加载项目列表（可能从设置页面返回）
    loadAllItems()
    loadDiaryData()
    loadRecordData() // 重新加载记录数据
  }
}

// 有记录的日期列表
const recordDates = ref<Set<string>>(new Set())

// 有日记记录的项目列表（已在上面声明）

// 加载记录数据
const loadRecordData = async () => {
  try {
    // 获取当前月份有记录的日期
    const year = currentMonth.value.year()
    const month = currentMonth.value.month() + 1 // dayjs的月份从0开始
    
    console.log('获取记录日期:', year, month)
    
    // 调用后端API获取有记录的日期
    const response = await getRecordDates(year, month)
    
    if (response.data.success) {
      const dates = response.data.data || []
      recordDates.value = new Set(dates)
      console.log('加载记录日期成功:', recordDates.value)
    } else {
      console.error('获取记录日期失败:', response.data.message)
      recordDates.value = new Set()
    }
  } catch (error) {
    console.error('加载记录数据失败:', error)
    recordDates.value = new Set()
  }
}

// 加载日记数据
const loadDiaryData = async () => {
  try {
    const response = await getDiariesByDate(selectedDate.value.format('YYYY-MM-DD'))
    if (response.data.success) {
      const diaries = response.data.data || []
      const itemsWithDiary = new Set<string>(diaries.map((diary: any) => diary.itemName))
      diaryItems.value = itemsWithDiary
      console.log('加载日记数据成功:', diaryItems.value)
    }
  } catch (error) {
    console.error('加载日记数据失败:', error)
    diaryItems.value = new Set<string>()
  }
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

onMounted(() => {
  // 初始化时同步从主页选择的日期
  const storedDate = localStorage.getItem('selectedDate')
  if (storedDate) {
    const parsed = dayjs(storedDate)
    if (parsed.isValid()) {
      selectedDate.value = parsed
      currentMonth.value = parsed.startOf('month') // 同步月份显示
    }
  }
  // 设置当前标签页状态
  currentTab.value = 'record'
  
  loadRecordData()
  loadAllItems()
  loadDiaryData()
  
  // 监听页面焦点，从日记页面返回时重新加载数据
  window.addEventListener('focus', handlePageFocus)
  
  // 监听页面可见性变化，从设置页面返回时重新加载默认项目
  document.addEventListener('visibilitychange', handleVisibilityChange)
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

/* 头部 */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex: 1;
  flex-direction: row;
}

.header-right {
  flex: 0 0 auto;
}

.month-year {
  font-size: 18px;
  font-weight: bold;
  margin: 0 12px;
}

.nav-icon, .cloud-icon, .menu-icon {
  font-size: 20px;
  cursor: pointer;
  color: white;
  background: transparent;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.nav-icon:hover, .cloud-icon:hover, .menu-icon:hover {
  background: rgba(255, 255, 255, 0.3);
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
  background: #4caf50;
  color: white;
}

.date-cell.has-record .date-number {
  color: white;
  font-weight: 600;
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

.record-item.has-diary {
  background: #f0fdf4;
  border: 1px solid #22c55e;
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


.item-status {
  color: #666;
  font-size: 12px;
}

.recorded {
  color: #4caf50;
}

.diary-recorded {
  color: #22c55e;
  font-weight: bold;
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
