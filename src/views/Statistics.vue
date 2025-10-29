<template>
  <div class="statistics-page" :class="{ 'dark-theme': isDarkMode }">
    <!-- 头部 -->
    <div class="header">
      <van-nav-bar
        title="数据统计"
        left-arrow
        @click-left="goBack"
        fixed
        placeholder
      >
        <template #right>
          <van-icon 
            :name="isDarkMode ? 'sunny' : 'moon-o'" 
            @click="toggleTheme"
            class="theme-toggle"
          />
        </template>
      </van-nav-bar>
    </div>

    <!-- 图表类型切换 -->
    <div class="chart-type-tabs">
      <van-tabs v-model:active="chartType" @change="onChartTypeChange">
        <van-tab title="饼图" name="pie">
          <div class="chart-container">
            <div class="chart-title">消费占比分析</div>
            <div class="chart-wrapper">
              <canvas ref="pieChart" width="250" height="120"></canvas>
            </div>
          </div>
        </van-tab>
        <van-tab title="柱状图" name="bar">
          <div class="chart-container">
            <div class="chart-title">消费对比分析</div>
            <div class="chart-wrapper">
              <canvas ref="barChart" width="250" height="120"></canvas>
            </div>
          </div>
        </van-tab>
      </van-tabs>
    </div>

    <!-- 时间范围选择 -->
    <div class="time-range-selector">
      <van-tabs v-model:active="timeRange" @change="onTimeRangeChange">
        <van-tab title="周" name="week"></van-tab>
        <van-tab title="月" name="month"></van-tab>
        <van-tab title="年" name="year"></van-tab>
      </van-tabs>
    </div>

    <!-- 趋势分析卡片 -->
    <div class="trend-analysis">
      <div class="trend-card">
        <div class="trend-icon">📈</div>
        <div class="trend-content">
          <div class="trend-title">消费趋势</div>
          <div class="trend-value" :class="trendDirection">
            {{ trendText }}
          </div>
        </div>
      </div>
      <div class="trend-card">
        <div class="trend-icon">💰</div>
        <div class="trend-content">
          <div class="trend-title">平均消费</div>
          <div class="trend-value">¥{{ averageSpending }}</div>
        </div>
      </div>
    </div>

    <!-- 图例 -->
    <div class="legend">
      <div class="legend-title">消费项目</div>
      <div class="legend-items">
        <div 
          v-for="item in legendItems" 
          :key="item.key"
          class="legend-item"
          :class="{ active: item.visible, 'fixed-item': item.isFixed }"
          @click="toggleLegend(item)"
        >
          <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
          <span class="legend-text">
            {{ item.name }}
            <span v-if="!item.isFixed" class="dynamic-badge">动态</span>
          </span>
          <span class="legend-amount">¥{{ item.total.toFixed(0) }}</span>
        </div>
      </div>
    </div>

    <!-- 颜色主题选择 -->
    <div class="theme-selector">
      <div class="theme-title">主题色彩</div>
      <div class="color-palettes">
        <div 
          v-for="palette in colorPalettes" 
          :key="palette.name"
          class="color-palette"
          :class="{ active: currentPalette === palette.name }"
          @click="selectPalette(palette)"
        >
          <div class="palette-colors">
            <div 
              v-for="color in palette.colors" 
              :key="color"
              class="palette-color"
              :style="{ backgroundColor: color }"
            ></div>
          </div>
          <div class="palette-name">{{ palette.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getMealRecordsByDateRange } from '../api/meal'
import dayjs from 'dayjs'

const router = useRouter()

// 主题相关
const isDarkMode = ref(false)
const currentPalette = ref('default')

// 图表类型和时间范围
const chartType = ref('pie')
const timeRange = ref('week')

// 图表引用
const pieChart = ref<HTMLCanvasElement>()
const barChart = ref<HTMLCanvasElement>()

// 颜色主题
const colorPalettes = ref([
  {
    name: '默认',
    colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7']
  },
  {
    name: '温暖',
    colors: ['#ff7675', '#fd79a8', '#fdcb6e', '#e17055', '#d63031']
  },
  {
    name: '清新',
    colors: ['#00b894', '#00cec9', '#74b9ff', '#a29bfe', '#fd79a8']
  },
  {
    name: '商务',
    colors: ['#2d3436', '#636e72', '#74b9ff', '#0984e3', '#6c5ce7']
  }
])

// 图例项目类型定义
interface LegendItem {
  key: string
  name: string
  color: string
  visible: boolean
  total: number
  isFixed: boolean
  otherItems?: string[]
}

// 图例数据 - 动态生成
const legendItems = ref<LegendItem[]>([])

// 固定项目配置
const fixedItems = [
  { key: 'breakfast', name: '早餐', color: '#ff6b6b' },
  { key: 'lunch', name: '午餐', color: '#4ecdc4' },
  { key: 'dinner', name: '晚餐', color: '#45b7d1' },
  { key: 'snack', name: '零食', color: '#f9ca24' },
  { key: 'drink', name: '饮料', color: '#6c5ce7' }
]

// 动态项目颜色池
const dynamicColors = [
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
  '#10AC84', '#EE5A24', '#0984E3', '#6C5CE7', '#A29BFE',
  '#FD79A8', '#FDCB6E', '#E17055', '#81ECEC', '#74B9FF'
]

// 趋势分析
const trendDirection = ref('up')
const trendText = ref('上升 5.2%')
const averageSpending = ref('45.6')

// 统计数据
const chartData = ref<any[]>([])

// 返回上一页
const goBack = () => {
  router.back()
}

// 切换主题
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('statistics-theme', isDarkMode.value ? 'dark' : 'light')
  redrawCurrentChart()
}

// 选择颜色主题
const selectPalette = (palette: any) => {
  currentPalette.value = palette.name
  legendItems.value.forEach((item, index) => {
    item.color = palette.colors[index] || palette.colors[0]
  })
  localStorage.setItem('statistics-palette', palette.name)
  redrawCurrentChart()
}

// 图表类型切换
const onChartTypeChange = (type: string) => {
  chartType.value = type
  nextTick(() => {
    redrawCurrentChart()
  })
}

// 时间范围切换
const onTimeRangeChange = (range: string) => {
  timeRange.value = range
  loadChartData()
  nextTick(() => {
    redrawCurrentChart()
  })
}

// 切换图例显示
const toggleLegend = (item: any) => {
  item.visible = !item.visible
  redrawCurrentChart()
}

// 重绘当前图表
const redrawCurrentChart = () => {
  nextTick(() => {
    if (chartType.value === 'pie') {
      drawPieChart()
    } else if (chartType.value === 'bar') {
      drawBarChart()
    }
  })
}

// 加载图表数据
const loadChartData = async () => {
  try {
    // 根据时间范围获取真实数据
    const data = await getRealData(timeRange.value)
    chartData.value = data
    
    // 更新图例数据
    updateLegendTotals(data)
    
    // 计算趋势分析
    calculateTrendAnalysis(data)
  } catch (error) {
    console.error('加载图表数据失败:', error)
    // 如果API失败，使用模拟数据作为备用
    const fallbackData = generateMockData(timeRange.value)
    chartData.value = fallbackData
    updateLegendTotals(fallbackData)
    calculateTrendAnalysis(fallbackData)
  }
}

// 获取真实数据
const getRealData = async (range: string) => {
  const data: any[] = []
  
  try {
    if (range === 'week') {
      // 获取最近7天的数据
      for (let i = 6; i >= 0; i--) {
        const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
        try {
          const response = await getMealRecordsByDateRange(date, date)
          if (response.data && response.data.success && response.data.data.length > 0) {
            const record = response.data.data[0]
            data.push({
              date: dayjs(date).format('MM-DD'),
              breakfast: record.breakfast || 0,
              lunch: record.lunch || 0,
              dinner: record.dinner || 0,
              snack: record.snack || 0,
              drink: record.drink || 0,
              customItems: record.customItems || {}
            })
          } else {
            data.push({
              date: dayjs(date).format('MM-DD'),
              breakfast: 0,
              lunch: 0,
              dinner: 0,
              snack: 0,
              drink: 0,
              customItems: {}
            })
          }
        } catch (error) {
          console.warn(`获取${date}数据失败:`, error)
          data.push({
            date: dayjs(date).format('MM-DD'),
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            snack: 0,
            drink: 0,
            customItems: {}
          })
        }
      }
    } else if (range === 'month') {
      // 获取最近12个月的数据
      for (let i = 11; i >= 0; i--) {
        const startDate = dayjs().subtract(i, 'month').startOf('month').format('YYYY-MM-DD')
        const endDate = dayjs().subtract(i, 'month').endOf('month').format('YYYY-MM-DD')
        try {
          const response = await getMealRecordsByDateRange(startDate, endDate)
          if (response.data && response.data.success && response.data.data.length > 0) {
            const records = response.data.data
            const monthData = {
              date: dayjs(startDate).format('YYYY-MM'),
              breakfast: 0,
              lunch: 0,
              dinner: 0,
              snack: 0,
              drink: 0,
              customItems: {}
            }
            
            records.forEach(record => {
              monthData.breakfast += record.breakfast || 0
              monthData.lunch += record.lunch || 0
              monthData.dinner += record.dinner || 0
              monthData.snack += record.snack || 0
              monthData.drink += record.drink || 0
            })
            
            data.push(monthData)
          } else {
            data.push({
              date: dayjs(startDate).format('YYYY-MM'),
              breakfast: 0,
              lunch: 0,
              dinner: 0,
              snack: 0,
              drink: 0,
              customItems: {}
            })
          }
        } catch (error) {
          console.warn(`获取${startDate}到${endDate}数据失败:`, error)
          data.push({
            date: dayjs(startDate).format('YYYY-MM'),
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            snack: 0,
            drink: 0,
            customItems: {}
          })
        }
      }
    } else if (range === 'year') {
      // 获取最近5年的数据
      for (let i = 4; i >= 0; i--) {
        const startDate = dayjs().subtract(i, 'year').startOf('year').format('YYYY-MM-DD')
        const endDate = dayjs().subtract(i, 'year').endOf('year').format('YYYY-MM-DD')
        try {
          const response = await getMealRecordsByDateRange(startDate, endDate)
          if (response.data && response.data.success && response.data.data.length > 0) {
            const records = response.data.data
            const yearData = {
              date: dayjs(startDate).format('YYYY'),
              breakfast: 0,
              lunch: 0,
              dinner: 0,
              snack: 0,
              drink: 0,
              customItems: {}
            }
            
            records.forEach(record => {
              yearData.breakfast += record.breakfast || 0
              yearData.lunch += record.lunch || 0
              yearData.dinner += record.dinner || 0
              yearData.snack += record.snack || 0
              yearData.drink += record.drink || 0
            })
            
            data.push(yearData)
          } else {
            data.push({
              date: dayjs(startDate).format('YYYY'),
              breakfast: 0,
              lunch: 0,
              dinner: 0,
              snack: 0,
              drink: 0,
              customItems: {}
            })
          }
        } catch (error) {
          console.warn(`获取${startDate}到${endDate}数据失败:`, error)
          data.push({
            date: dayjs(startDate).format('YYYY'),
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            snack: 0,
            drink: 0,
            customItems: {}
          })
        }
      }
    }
  } catch (error) {
    console.error('获取真实数据失败:', error)
    throw error
  }
  
  return data
}

// 生成模拟数据（备用）
const generateMockData = (range: string) => {
  const data: any[] = []
  
  if (range === 'week') {
    // 最近7天
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day')
      data.push({
        date: date.format('MM-DD'),
        breakfast: Math.floor(Math.random() * 50) + 10,
        lunch: Math.floor(Math.random() * 80) + 20,
        dinner: Math.floor(Math.random() * 60) + 15,
        snack: Math.floor(Math.random() * 30) + 5,
        drink: Math.floor(Math.random() * 25) + 5
      })
    }
  } else if (range === 'month') {
    // 最近12个月
    for (let i = 11; i >= 0; i--) {
      const date = dayjs().subtract(i, 'month')
      data.push({
        date: date.format('YYYY-MM'),
        breakfast: Math.floor(Math.random() * 200) + 100,
        lunch: Math.floor(Math.random() * 300) + 200,
        dinner: Math.floor(Math.random() * 250) + 150,
        snack: Math.floor(Math.random() * 100) + 50,
        drink: Math.floor(Math.random() * 80) + 40
      })
    }
  } else if (range === 'year') {
    // 最近5年
    for (let i = 4; i >= 0; i--) {
      const date = dayjs().subtract(i, 'year')
      data.push({
        date: date.format('YYYY'),
        breakfast: Math.floor(Math.random() * 2000) + 1000,
        lunch: Math.floor(Math.random() * 3000) + 2000,
        dinner: Math.floor(Math.random() * 2500) + 1500,
        snack: Math.floor(Math.random() * 1000) + 500,
        drink: Math.floor(Math.random() * 800) + 400
      })
    }
  }
  
  return data
}

// 更新图例总计
// 动态生成图例数据
const generateLegendItems = (data: any[]): LegendItem[] => {
  const items = new Map<string, LegendItem>()
  
  // 添加固定项目
  fixedItems.forEach(fixedItem => {
    items.set(fixedItem.key, {
      key: fixedItem.key,
      name: fixedItem.name,
      color: fixedItem.color,
      visible: true,
      total: 0,
      isFixed: true
    })
  })
  
  // 收集所有动态项目
  const dynamicItems = new Set<string>()
  data.forEach(record => {
    if (record.customItems) {
      Object.keys(record.customItems).forEach(key => {
        dynamicItems.add(key)
      })
    }
  })
  
  // 添加动态项目（限制数量，避免图表过于拥挤）
  const maxDynamicItems = 8 // 最多显示8个动态项目
  const sortedDynamicItems = Array.from(dynamicItems).slice(0, maxDynamicItems)
  
  sortedDynamicItems.forEach((itemKey, index) => {
    items.set(`custom_${itemKey}`, {
      key: `custom_${itemKey}`,
      name: itemKey,
      color: dynamicColors[index % dynamicColors.length],
      visible: true,
      total: 0,
      isFixed: false
    })
  })
  
  // 如果有超过限制的动态项目，添加"其他"项目
  if (dynamicItems.size > maxDynamicItems) {
    const otherItems = Array.from(dynamicItems).slice(maxDynamicItems)
    items.set('other', {
      key: 'other',
      name: `其他(${otherItems.length}项)`,
      color: '#95A5A6',
      visible: true,
      total: 0,
      isFixed: false,
      otherItems: otherItems
    })
  }
  
  return Array.from(items.values())
}

// 更新图例数据
const updateLegendTotals = (data: any[]) => {
  // 重新生成图例
  legendItems.value = generateLegendItems(data)
  
  // 计算每个项目的总计
  legendItems.value.forEach(item => {
    if (item.key === 'other') {
      // 计算"其他"项目的总计
      item.total = data.reduce((sum, record) => {
        if (record.customItems && item.otherItems) {
          return sum + item.otherItems.reduce((otherSum, otherKey) => {
            return otherSum + (record.customItems[otherKey] || 0)
          }, 0)
        }
        return sum
      }, 0)
    } else if (item.key.startsWith('custom_')) {
      // 计算动态项目的总计
      const originalKey = item.key.replace('custom_', '')
      item.total = data.reduce((sum, record) => {
        return sum + (record.customItems?.[originalKey] || 0)
      }, 0)
    } else {
      // 计算固定项目的总计
      item.total = data.reduce((sum, record) => sum + (record[item.key] || 0), 0)
    }
  })
  
  // 按金额排序，金额大的在前
  legendItems.value.sort((a, b) => b.total - a.total)
}

// 计算趋势分析
const calculateTrendAnalysis = (data: any[]) => {
  if (data.length < 2) return
  
  const firstHalf = data.slice(0, Math.floor(data.length / 2))
  const secondHalf = data.slice(Math.floor(data.length / 2))
  
  const firstTotal = firstHalf.reduce((sum, record) => 
    sum + record.breakfast + record.lunch + record.dinner + record.snack + record.drink, 0)
  const secondTotal = secondHalf.reduce((sum, record) => 
    sum + record.breakfast + record.lunch + record.dinner + record.snack + record.drink, 0)
  
  const change = ((secondTotal - firstTotal) / firstTotal) * 100
  trendDirection.value = change > 0 ? 'up' : 'down'
  trendText.value = `${change > 0 ? '上升' : '下降'} ${Math.abs(change).toFixed(1)}%`
  
  const totalSpending = data.reduce((sum, record) => 
    sum + record.breakfast + record.lunch + record.dinner + record.snack + record.drink, 0)
  averageSpending.value = (totalSpending / data.length).toFixed(1)
}


// 绘制饼图
const drawPieChart = () => {
  if (!pieChart.value) return
  
  const canvas = pieChart.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const radius = Math.min(centerX, centerY) - 30
  
  // 计算总值
  const total = legendItems.value.reduce((sum, item) => sum + item.total, 0)
  if (total === 0) {
    // 显示无数据提示
    ctx.fillStyle = isDarkMode.value ? '#ccc' : '#666'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('暂无数据', centerX, centerY)
    return
  }
  
  let currentAngle = -Math.PI / 2
  
  // 绘制扇形
  legendItems.value.forEach(item => {
    if (!item.visible || item.total === 0) return
    
    const sliceAngle = (item.total / total) * 2 * Math.PI
    
    // 绘制扇形
    ctx.fillStyle = item.color
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
    ctx.closePath()
    ctx.fill()
    
    // 绘制边框
    ctx.strokeStyle = isDarkMode.value ? '#333' : '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 绘制百分比标签
    const labelAngle = currentAngle + sliceAngle / 2
    const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7)
    const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7)
    
    const percentage = ((item.total / total) * 100).toFixed(1)
    if (parseFloat(percentage) >= 3) { // 降低阈值，显示更多标签
      ctx.fillStyle = isDarkMode.value ? '#fff' : '#333'
      ctx.font = 'bold 10px Arial' // 减小字体
      ctx.textAlign = 'center'
      ctx.fillText(`${percentage}%`, labelX, labelY)
    }
    
    currentAngle += sliceAngle
  })
  
  // 在中心显示总计
  ctx.fillStyle = isDarkMode.value ? '#fff' : '#333'
  ctx.font = 'bold 14px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`总计: ¥${total.toFixed(0)}`, centerX, centerY + 5)
}

// 绘制柱状图
const drawBarChart = () => {
  if (!barChart.value) return
  
  const canvas = barChart.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  const padding = 40
  const chartWidth = canvas.width - padding * 2
  const chartHeight = canvas.height - padding * 2
  
  // 获取最大值
  const maxValue = Math.max(...legendItems.value.map(item => item.total))
  if (maxValue === 0) {
    // 显示无数据提示
    ctx.fillStyle = isDarkMode.value ? '#ccc' : '#666'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('暂无数据', canvas.width / 2, canvas.height / 2)
    return
  }
  
  const visibleItems = legendItems.value.filter(item => item.visible && item.total > 0)
  const maxBars = 10 // 最多显示10个柱子，避免过于拥挤
  const displayItems = visibleItems.slice(0, maxBars)
  const barWidth = chartWidth / displayItems.length
  const barSpacing = barWidth * 0.1 // 减小间距
  
  // 绘制坐标轴
  const axisColor = isDarkMode.value ? '#444' : '#e0e0e0'
  ctx.strokeStyle = axisColor
  ctx.lineWidth = 1
  
  // Y轴
  ctx.beginPath()
  ctx.moveTo(padding, padding)
  ctx.lineTo(padding, canvas.height - padding)
  ctx.stroke()
  
  // X轴
  ctx.beginPath()
  ctx.moveTo(padding, canvas.height - padding)
  ctx.lineTo(canvas.width - padding, canvas.height - padding)
  ctx.stroke()
  
  // 绘制Y轴标签
  ctx.fillStyle = isDarkMode.value ? '#ccc' : '#666'
  ctx.font = '10px Arial'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 5; i++) {
    const value = (i * maxValue / 5)
    const y = canvas.height - padding - (i * chartHeight / 5)
    ctx.fillText(`¥${Math.round(value)}`, padding - 5, y + 3)
  }
  
  // 绘制柱状图
  displayItems.forEach((item, index) => {
    const barHeight = (item.total / maxValue) * chartHeight
    const x = padding + index * barWidth + barSpacing
    const y = canvas.height - padding - barHeight
    const width = barWidth - barSpacing * 2
    
    // 绘制柱子
    ctx.fillStyle = item.color
    ctx.fillRect(x, y, width, barHeight)
    
    // 绘制数值标签
    if (item.total > 0) {
      ctx.fillStyle = isDarkMode.value ? '#fff' : '#333'
      ctx.font = 'bold 9px Arial' // 减小字体
      ctx.textAlign = 'center'
      ctx.fillText(`¥${item.total.toFixed(0)}`, x + width / 2, y - 3)
    }
    
    // 绘制项目名称（截断过长的名称）
    ctx.fillStyle = isDarkMode.value ? '#fff' : '#333'
    ctx.font = '9px Arial' // 减小字体
    ctx.textAlign = 'center'
    const displayName = item.name.length > 6 ? item.name.substring(0, 6) + '...' : item.name
    ctx.fillText(displayName, x + width / 2, canvas.height - padding + 12)
  })
  
  // 如果有更多项目，显示提示
  if (visibleItems.length > maxBars) {
    ctx.fillStyle = isDarkMode.value ? '#ccc' : '#666'
    ctx.font = '8px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`还有${visibleItems.length - maxBars}个项目未显示`, canvas.width / 2, canvas.height - 5)
  }
}

// 初始化主题
const initTheme = () => {
  const savedTheme = localStorage.getItem('statistics-theme')
  const savedPalette = localStorage.getItem('statistics-palette')
  
  if (savedTheme === 'dark') {
    isDarkMode.value = true
  }
  
  if (savedPalette) {
    const palette = colorPalettes.value.find(p => p.name === savedPalette)
    if (palette) {
      selectPalette(palette)
    }
  }
}

// 组件挂载
onMounted(() => {
  initTheme()
  loadChartData()
  nextTick(() => {
    drawPieChart()
  })
})
</script>

<style scoped>
.statistics-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: all 0.3s ease;
  padding-bottom: 80px; /* 为底部导航留出空间 */
}

.statistics-page.dark-theme {
  background-color: #1a1a1a;
  color: #fff;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 8px 0;
}

.theme-toggle {
  font-size: 18px;
  color: white;
  cursor: pointer;
}

.chart-type-tabs {
  background: white;
  margin: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark-theme .chart-type-tabs {
  background: #2a2a2a;
}

.time-range-selector {
  background: white;
  margin: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark-theme .time-range-selector {
  background: #2a2a2a;
}

.chart-container {
  background: white;
  margin: 5px;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-title {
  font-size: 12px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
  text-align: center;
}

.dark-theme .chart-title {
  color: #fff;
}

.chart-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 140px; /* 固定高度，更紧凑 */
}

.dark-theme .chart-wrapper {
  background: #333;
}

canvas {
  max-width: 100%;
  max-height: 120px; /* 减小高度，更紧凑 */
}

.trend-analysis {
  display: flex;
  gap: 5px;
  margin: 5px;
}

.trend-card {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
}

.dark-theme .trend-card {
  background: #2a2a2a;
}

.trend-icon {
  font-size: 24px;
}

.trend-content {
  flex: 1;
}

.trend-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.dark-theme .trend-title {
  color: #ccc;
}

.trend-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.dark-theme .trend-value {
  color: #fff;
}

.trend-value.up {
  color: #52c41a;
}

.trend-value.down {
  color: #ff4d4f;
}

.legend {
  background: white;
  margin: 5px;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark-theme .legend {
  background: #2a2a2a;
}

.legend-title {
  font-size: 12px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.dark-theme .legend-title {
  color: #fff;
}

.legend-items {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.legend-item:hover {
  background-color: #f8f9fa;
}

.dark-theme .legend-item:hover {
  background-color: #333;
}

.legend-item.active {
  border-color: #667eea;
  background-color: #f0f2ff;
}

.dark-theme .legend-item.active {
  background-color: #1a1a2e;
}

.legend-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
}

.legend-text {
  font-size: 12px;
  color: #333;
  flex: 1;
}

.dark-theme .legend-text {
  color: #fff;
}

.legend-amount {
  font-size: 12px;
  color: #666;
  font-weight: bold;
}

.dark-theme .legend-amount {
  color: #ccc;
}

.dynamic-badge {
  font-size: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1px 4px;
  border-radius: 3px;
  margin-left: 4px;
  font-weight: normal;
}

.fixed-item .legend-text {
  font-weight: 500;
}

.theme-selector {
  background: white;
  margin: 5px;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark-theme .theme-selector {
  background: #2a2a2a;
}

.theme-title {
  font-size: 12px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.dark-theme .theme-title {
  color: #fff;
}

.color-palettes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.color-palette {
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.color-palette:hover {
  background-color: #f8f9fa;
}

.dark-theme .color-palette:hover {
  background-color: #333;
}

.color-palette.active {
  border-color: #667eea;
  background-color: #f0f2ff;
}

.dark-theme .color-palette.active {
  background-color: #1a1a2e;
}

.palette-colors {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.palette-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.palette-name {
  font-size: 12px;
  color: #333;
  text-align: center;
}

.dark-theme .palette-name {
  color: #fff;
}

/* 标签页样式 */
:deep(.van-tabs__nav) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

:deep(.van-tab) {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

:deep(.van-tab--active) {
  color: white;
}

:deep(.van-tabs__line) {
  background-color: white;
}

/* 移动端优化 */
@media (max-width: 480px) {
  .chart-wrapper {
    padding: 5px;
    height: 120px; /* 更小的高度 */
  }
  
  .trend-analysis {
    flex-direction: column;
    margin: 5px;
    gap: 5px;
  }
  
  .trend-card {
    padding: 8px;
  }
  
  .legend-items {
    grid-template-columns: 1fr;
    gap: 5px;
  }
  
  .legend-item {
    padding: 5px 6px;
  }
  
  .color-palettes {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    margin: 3px;
    padding: 6px;
  }
  
  .legend {
    margin: 3px;
    padding: 6px;
  }
  
  .theme-selector {
    margin: 3px;
    padding: 6px;
  }
  
  canvas {
    max-height: 100px; /* 更小的高度 */
  }
}
</style>
