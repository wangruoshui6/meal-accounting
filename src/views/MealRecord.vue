<template>
  <div class="container">
    <!-- 头部 -->
    <div class="header">
      <div class="header-left">
        <div class="settings-button" @click="goToSettings">
          <van-icon name="setting-o" />
        </div>
      </div>
      <div class="header-center">
        <div class="title">餐饮记账</div>
        <div class="date-section">
          <input 
            type="date" 
            v-model="dateInput"
            @change="onDateChange"
            class="date-input"
          />
          <div class="date-display">{{ currentDate }}</div>
          <div class="time-display">{{ currentTime }}</div>
        </div>
      </div>
      <div class="header-right">
        <div class="delete-button" @click="showDeleteModal = true">
          <van-icon name="minus" />
        </div>
        <div class="add-button" @click="showAddModal = true">
          <van-icon name="plus" />
        </div>
      </div>
    </div>

    <!-- 餐饮列表 -->
    <div class="meal-list">
      <MealItem
        v-for="meal in meals"
        :key="meal.key"
        :name="meal.name"
        :amount="meal.amount"
        :placeholder="meal.placeholder"
        :type="meal.type"
        :item-key="meal.key"
        @update:amount="updateMealAmount(meal.key, $event)"
        @update:description="updateMealDescription(meal.key, $event)"
      />
  
    </div>

    <!-- 总计 -->
    <div class="total-section">
      <div class="total-item">
        <span class="total-label">总计</span>
        <span class="total-amount">¥{{ totalAmount.toFixed(2) }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
        <van-button type="default" @click="clearAllDataLocal" class="clear-button">
          清除数据
        </van-button>
      <van-button type="primary" @click="saveRecord" class="save-button">
        保存记录
      </van-button>
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

    <!-- 添加项目弹窗 -->
    <van-dialog
      v-model:show="showAddModal"
      title="添加餐饮项目"
      show-cancel-button
      @confirm="addMealItem"
      @cancel="cancelAdd"
    >
      <div class="add-modal-content">
        <div class="modal-title">你要添加的是:</div>
        <van-field
          v-model="newMealName"
          placeholder="请输入项目名称"
          clearable
        />
      </div>
    </van-dialog>

    <!-- 删除项目弹窗 -->
    <van-dialog
      v-model:show="showDeleteModal"
      title="删除餐饮项目"
      show-cancel-button
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    >
      <div class="delete-modal-content">
        <div class="modal-title">选择要删除的项目:</div>
        <div class="delete-list">
          <div 
            v-for="meal in customMeals" 
            :key="meal.key"
            class="delete-item"
            @click="toggleDeleteSelection(meal.key)"
            :class="{ 'selected': selectedDeleteItems.includes(meal.key) }"
          >
            <span class="item-name">{{ meal.name }}</span>
            <span class="item-amount">¥{{ meal.amount.toFixed(2) }}</span>
            <van-icon 
              :name="selectedDeleteItems.includes(meal.key) ? 'success' : 'circle'" 
              :color="selectedDeleteItems.includes(meal.key) ? '#667eea' : '#ccc'"
            />
          </div>
          <div v-if="customMeals.length === 0" class="no-items">
            暂无动态项目可删除
          </div>
        </div>
      </div>
    </van-dialog>

    <!-- 设置弹窗 -->
    <van-popup v-model:show="showSettingsModal" position="center" :style="{ width: '90%', maxWidth: '400px', borderRadius: '12px' }"> 
      <div class="settings-popup">
        <div class="settings-header">
          <div class="settings-title">默认餐饮项目设置</div>
          <div class="close-btn" @click="closeSettings">
            <van-icon name="cross" />
          </div>
        </div>
        
        <div class="settings-content">
          <div class="settings-desc">您可以自定义默认显示的餐饮项目</div>
          
          <div class="settings-list">
            <div 
              v-for="(item, index) in settingsMealItems" 
              :key="index"
              class="settings-item"
              :draggable="true"
              @dragstart="onSettingsDragStart(index, $event)"
              @dragover="onSettingsDragOver($event)"
              @drop="onSettingsDrop(index, $event)"
              @dragend="onSettingsDragEnd($event)"
            >
              <div class="drag-handle">
                <van-icon name="wap-nav" />
              </div>
              <van-field
                v-model="item.name"
                placeholder="请输入项目名称"
                :border="false"
                class="item-input"
              />
              <div class="item-actions">
                <van-icon 
                  name="cross" 
                  class="delete-btn"
                  @click="removeSettingsItem(index)"
                />
              </div>
            </div>
          </div>
          
          <div class="add-item-section">
            <van-field
              v-model="newItemName"
              placeholder="输入新项目名称"
              :border="false"
              class="new-item-input"
              @keyup.enter="addSettingsItem"
            />
            <van-button type="primary" size="small" @click="addSettingsItem" class="add-btn">
              添加
            </van-button>
          </div>
        </div>
        
        <div class="settings-footer">
          <van-button type="default" @click="closeSettings" class="cancel-btn">
            取消
          </van-button>
          <van-button type="primary" @click="saveSettings" class="save-btn">
            保存设置
          </van-button>
        </div>
      </div>
    </van-popup>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import dayjs from 'dayjs'
import MealItem from '../components/MealItem.vue'
import { saveMealRecord, getMealRecord, deleteCustomItems, clearAllData } from '../api/meal'
import { getDefaultMealItems, saveDefaultMealItems } from '../api/settings'

const router = useRouter()

// 当前日期
const selectedDate = ref(dayjs())
const currentDate = ref(dayjs().format('YYYY年MM月DD日'))
const dateInput = ref(dayjs().format('YYYY-MM-DD'))

// 当前时间
const currentTime = ref(dayjs().format('HH:mm:ss'))

// 餐饮数据
const meals = ref<Array<{
  key: string
  name: string
  amount: number
  placeholder: string
  type: 'number'
  description: string
}>>([])

// 默认项目
const defaultMealItems = ref(['早饭', '午饭', '晚饭', '零食', '饮料'])

// 添加项目相关
const showAddModal = ref(false)
const newMealName = ref('')

// 删除项目相关
const showDeleteModal = ref(false)
const selectedDeleteItems = ref<string[]>([])


// 当前标签页
const currentTab = ref('home')

// 计算总计
const totalAmount = computed(() => {
  return meals.value.reduce((sum, meal) => sum + meal.amount, 0)
})

// 获取动态项目
const customMeals = computed(() => {
  return meals.value.filter(meal => meal.key.startsWith('custom_'))
})

// 更新餐饮金额
const updateMealAmount = (key: string, amount: number) => {
  const meal = meals.value.find(m => m.key === key)
  if (meal) {
    meal.amount = amount
  }
}

// 更新餐饮描述
const updateMealDescription = (key: string, description: string) => {
  const meal = meals.value.find(m => m.key === key)
  if (meal) {
    meal.description = description
  }
}

// 添加新的餐饮项目
const addMealItem = () => {
  if (!newMealName.value.trim()) {
    showToast('请输入项目名称')
    return
  }
  
  // 检查是否已存在相同名称的项目
  const exists = meals.value.some(meal => meal.name === newMealName.value.trim())
  if (exists) {
    showToast('该项目已存在')
    return
  }
  
  // 生成唯一的key
  const newKey = `custom_${Date.now()}`
  
  // 添加新项目
  meals.value.push({
    key: newKey,
    name: newMealName.value.trim(),
    amount: 0,
    placeholder: '',
    type: 'number' as const,
    description: ''
  })
  
  // 清空输入并关闭弹窗
  newMealName.value = ''
  showAddModal.value = false
  showToast('添加成功')
}

// 取消添加
const cancelAdd = () => {
  newMealName.value = ''
  showAddModal.value = false
}


// 清除所有数据
const clearAllDataLocal = async () => {
  try {
    console.log('开始清除数据...')
    
    // 调用后端API清空数据库（后端会清空所有字段，包括customItems）
    const response = await clearAllData(selectedDate.value.format('YYYY-MM-DD'))
    
    console.log('后端清除响应:', response.data)
    
    if (response.data.success) {
      // 重新加载数据，显示后端清空后的状态
      await loadData()
      
      showToast('所有数据已清除')
    } else {
      showToast('清除失败，请重试')
    }
  } catch (error) {
    console.error('清除数据失败:', error)
    showToast('清除失败，请重试')
  }
}


// 切换标签页
const switchTab = (tab: string) => {
  currentTab.value = tab
  if (tab === 'record') {
    router.push('/calendar')
  } else if (tab === 'me') {
    router.push('/me')
  }
}


// 切换删除选择
const toggleDeleteSelection = (key: string) => {
  const index = selectedDeleteItems.value.indexOf(key)
  if (index > -1) {
    selectedDeleteItems.value.splice(index, 1)
  } else {
    selectedDeleteItems.value.push(key)
  }
}

// 确认删除
const confirmDelete = async () => {
  if (selectedDeleteItems.value.length === 0) {
    showToast('请选择要删除的项目')
    return
  }
  
  try {
    // 获取要删除的项目名称
    const itemNames = selectedDeleteItems.value.map(key => {
      const meal = meals.value.find(m => m.key === key)
      return meal ? meal.name : ''
    }).filter(name => name)
    
    if (itemNames.length === 0) {
      showToast('未找到要删除的项目')
      return
    }
    
    console.log('准备删除项目:', itemNames)
    console.log('当前日期:', selectedDate.value.format('YYYY-MM-DD'))
    
    // 先调用后端API删除
    try {
      const response = await deleteCustomItems(selectedDate.value.format('YYYY-MM-DD'), itemNames)
      console.log('后端删除响应:', response.data)
      
      if (response.data.success) {
        console.log('后端删除成功')
        // 后端删除成功后，再从前端列表中删除
        selectedDeleteItems.value.forEach(key => {
          const index = meals.value.findIndex(meal => meal.key === key)
          if (index > -1) {
            meals.value.splice(index, 1)
          }
        })
        showToast(`已删除 ${itemNames.length} 个项目`)
      } else {
        console.log('后端删除失败:', response.data.message)
        showToast(`删除失败: ${response.data.message}`)
        return
      }
    } catch (backendError) {
      console.error('后端删除出错:', backendError)
      showToast('删除失败，请检查网络连接')
      return
    }
    
    selectedDeleteItems.value = []
    showDeleteModal.value = false
    
  } catch (error) {
    console.error('删除项目失败:', error)
    showToast('删除失败，请重试')
  }
}

// 取消删除
const cancelDelete = () => {
  selectedDeleteItems.value = []
  showDeleteModal.value = false
}

// 设置相关状态
const showSettingsModal = ref(false)
const settingsMealItems = ref<Array<{name: string}>>([])
const newItemName = ref('')

// 设置弹窗拖拽相关变量
const settingsDraggedIndex = ref<number | null>(null)
const settingsDraggedOverIndex = ref<number | null>(null)

// 跳转到设置页面
const goToSettings = () => {
  console.log('设置按钮被点击了')
  console.log('显示设置弹窗:', showSettingsModal.value)
  // 加载当前设置
  loadSettings()
  showSettingsModal.value = true
  console.log('设置弹窗状态:', showSettingsModal.value)
}

// 加载设置
const loadSettings = async () => {
  try {
    const response = await getDefaultMealItems()
    if (response.success && response.data && response.data.length > 0) {
      settingsMealItems.value = response.data.map(name => ({ name }))
    } else {
      // 如果没有设置，使用当前默认项目
      settingsMealItems.value = defaultMealItems.value.map(name => ({ name }))
    }
  } catch (error) {
    console.error('加载设置失败:', error)
    settingsMealItems.value = defaultMealItems.value.map(name => ({ name }))
  }
}

// 添加设置项目
const addSettingsItem = () => {
  if (newItemName.value.trim()) {
    settingsMealItems.value.push({ name: newItemName.value.trim() })
    newItemName.value = ''
  }
}

// 删除设置项目
const removeSettingsItem = (index: number) => {
  if (settingsMealItems.value.length > 1) {
    settingsMealItems.value.splice(index, 1)
  } else {
    showToast('至少保留一个项目')
  }
}

// 保存设置
const saveSettings = async () => {
  try {
    const validItems = settingsMealItems.value
      .map(item => item.name.trim())
      .filter(name => name.length > 0)
    
    if (validItems.length === 0) {
      showToast('请至少添加一个项目')
      return
    }
    
    // 检查重复
    const uniqueItems = [...new Set(validItems)]
    if (uniqueItems.length !== validItems.length) {
      showToast('项目名称不能重复')
      return
    }
    
    console.log('准备保存的项目:', uniqueItems)
    
    // 保存到后端
    const response = await saveDefaultMealItems(uniqueItems)
    
    console.log('保存响应:', response)
    
    if (response.success) {
      showToast('设置保存成功')
      showSettingsModal.value = false
      // 重新加载默认项目
      await loadDefaultMealItems()
      await initializeMeals()
    } else {
      showToast(response.message || '保存失败')
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    showToast('保存失败，请重试')
  }
}

// 关闭设置弹窗
const closeSettings = () => {
  showSettingsModal.value = false
  newItemName.value = ''
}

// 设置弹窗拖拽方法
const onSettingsDragStart = (index: number, event: DragEvent) => {
  settingsDraggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/html', '')
  }
  // 添加拖拽样式
  if (event.target) {
    (event.target as HTMLElement).classList.add('dragging')
  }
}

const onSettingsDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const onSettingsDrop = (targetIndex: number, event: DragEvent) => {
  event.preventDefault()
  
  if (settingsDraggedIndex.value === null || settingsDraggedIndex.value === targetIndex) {
    return
  }
  
  // 移动项目
  const draggedItem = settingsMealItems.value[settingsDraggedIndex.value]
  settingsMealItems.value.splice(settingsDraggedIndex.value, 1)
  settingsMealItems.value.splice(targetIndex, 0, draggedItem)
  
  settingsDraggedIndex.value = null
  settingsDraggedOverIndex.value = null
}

const onSettingsDragEnd = (event: DragEvent) => {
  // 移除拖拽样式
  if (event.target) {
    (event.target as HTMLElement).classList.remove('dragging')
  }
  settingsDraggedIndex.value = null
  settingsDraggedOverIndex.value = null
}

// 加载默认餐饮项目
const loadDefaultMealItems = async () => {
  try {
    const response = await getDefaultMealItems()
    if (response.data.success) {
      defaultMealItems.value = response.data.data || ['早饭', '午饭', '晚饭', '零食', '饮料']
    }
  } catch (error) {
    console.error('加载默认餐饮项目失败:', error)
  }
}

// 初始化餐饮数据
const initializeMeals = () => {
  const keyMapping = ['breakfast', 'lunch', 'dinner', 'snack', 'drink']
  meals.value = defaultMealItems.value.map((name, index) => {
    // 前5个使用固定key，超过5个的使用default_前缀（不是custom_）
    const key = index < 5 ? keyMapping[index] : `default_${index}`
    return {
      key: key,
      name: name,
      amount: 0,
      placeholder: '',
      type: 'number' as const,
      description: ''
    }
  })
}

// 日期变化处理
const onDateChange = async () => {
  console.log('日期变化:', dateInput.value)
  selectedDate.value = dayjs(dateInput.value)
  currentDate.value = selectedDate.value.format('YYYY年MM月DD日')
  await loadData()
}

// 保存记录
const saveRecord = async () => {
  if (totalAmount.value === 0) {
    showToast('请输入至少一项金额')
    return
  }

  try {
    // 分离固定项目和动态项目
    const fixedMeals = meals.value.filter(meal => 
      ['breakfast', 'lunch', 'dinner', 'snack', 'drink'].includes(meal.key)
    )
    const customMeals = meals.value.filter(meal => 
      meal.key.startsWith('custom_') || meal.key.startsWith('default_')
    )
    
    // 构建动态项目对象
    const customItems: Record<string, number> = {}
    customMeals.forEach(meal => {
      if (meal.amount > 0) {
        customItems[meal.name] = meal.amount
      }
    })
    
    const recordData = {
      date: selectedDate.value.format('YYYY-MM-DD'),
      breakfast: fixedMeals.find(m => m.key === 'breakfast')?.amount || 0,
      lunch: fixedMeals.find(m => m.key === 'lunch')?.amount || 0,
      dinner: fixedMeals.find(m => m.key === 'dinner')?.amount || 0,
      snack: fixedMeals.find(m => m.key === 'snack')?.amount || 0,
      drink: fixedMeals.find(m => m.key === 'drink')?.amount || 0,
      customItems: Object.keys(customItems).length > 0 ? customItems : undefined
    }

    console.log('准备保存的数据:', recordData)
    const response = await saveMealRecord(recordData)
    console.log('保存响应:', response)
    showToast('保存成功！')
    
    // 保存成功后不清空数据，让用户看到保存的内容
  } catch (error) {
    console.error('保存失败:', error)
    showToast('保存失败，请重试')
  }
}

// 从后端加载数据
const loadData = async () => {
  try {
    const dateKey = selectedDate.value.format('YYYY-MM-DD')
    const record = await getMealRecord(dateKey)
    
    if (record) {
      console.log('从后端加载的数据:', record)
      // 从后端加载数据
      meals.value.forEach(meal => {
        switch (meal.key) {
          case 'breakfast':
            meal.amount = (record as any).breakfast || 0
            break
          case 'lunch':
            meal.amount = (record as any).lunch || 0
            break
          case 'dinner':
            meal.amount = (record as any).dinner || 0
            break
          case 'snack':
            meal.amount = (record as any).snack || 0
            break
          case 'drink':
            meal.amount = (record as any).drink || 0
            break
          default:
            // 处理default_前缀的项目
            if (meal.key.startsWith('default_')) {
              const fieldName = meal.key.replace('default_', '')
              meal.amount = (record as any)[fieldName] || 0
            }
            break
        }
      })
      
      // 加载动态项目
      if ((record as any).customItems && (record as any).customItems.trim() !== '') {
        try {
          const customItems = JSON.parse((record as any).customItems)
          // 移除现有的所有动态项目（包括custom_和default_前缀的）
          meals.value = meals.value.filter(meal => 
            !meal.key.startsWith('custom_') && !meal.key.startsWith('default_')
          )
          
          // 添加从后端加载的动态项目
          Object.entries(customItems).forEach(([name, amount]) => {
            const newKey = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            meals.value.push({
              key: newKey,
              name: name,
              amount: amount as number,
              placeholder: '',
              type: 'number' as const,
              description: ''
            })
          })
        } catch (error) {
          console.error('解析动态项目失败:', error)
        }
      } else {
        // 如果customItems为空，移除所有动态项目（包括custom_和default_前缀的）
        meals.value = meals.value.filter(meal => 
          !meal.key.startsWith('custom_') && !meal.key.startsWith('default_')
        )
      }
    } else {
      // 如果没有后端数据，尝试从本地存储加载
      const saved = localStorage.getItem('meal-record-' + dateKey)
      if (saved) {
        try {
          const data = JSON.parse(saved)
          meals.value.forEach(meal => {
            if (data.meals && data.meals[meal.key]) {
              meal.amount = data.meals[meal.key]
            } else {
              meal.amount = 0
            }
          })
        } catch (error) {
          console.error('加载本地数据失败:', error)
          meals.value.forEach(meal => {
            meal.amount = 0
          })
        }
      } else {
        // 重置所有数据为0
        meals.value.forEach(meal => {
          meal.amount = 0
        })
      }
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    // 如果后端加载失败，重置所有数据为0
    meals.value.forEach(meal => {
      meal.amount = 0
    })
  }
}

// 保存数据到本地存储
const saveData = () => {
  const dateKey = selectedDate.value.format('YYYY-MM-DD')
  const data = {
    date: dateKey,
    meals: meals.value.reduce((acc, meal) => {
      acc[meal.key] = meal.amount
      return acc
    }, {} as Record<string, number>),
    total: totalAmount.value
  }
  localStorage.setItem('meal-record-' + dateKey, JSON.stringify(data))
}

// 监听数据变化，自动保存
watch(meals, () => {
  saveData()
}, { deep: true })

// 页面加载时初始化
onMounted(async () => {
  // 设置当前标签页状态
  currentTab.value = 'home'
  
  await loadDefaultMealItems()
  initializeMeals()
  await loadData()
  
  // 启动时间定时器
  setInterval(() => {
    currentTime.value = dayjs().format('HH:mm:ss')
  }, 1000)
})
</script>

<style scoped>

/* 底部导航样式 */
.bottom-nav {
  display: flex;
  background: white;
  border-top: 1px solid #eee;
  padding: 4px 0;
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
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #999;
}

.nav-item.active {
  color: #1976d2;
}

.nav-item span {
  font-size: 10px;
  margin-top: 2px;
}

.nav-item .van-icon {
  font-size: 16px;
}

/* 为主内容添加底部间距，避免被导航遮挡 */
.container {
  padding-bottom: 100px; /* 调整底部间距，适配更小的导航栏 */
}

/* 调整操作按钮位置 */
.action-buttons {
  position: fixed;
  bottom: 60px; /* 在底部导航上方，调整距离 */
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 40px);
  max-width: 360px;
  display: flex;
  gap: 10px;
  z-index: 999; /* 确保在导航上方 */
}

/* 设置弹窗拖拽样式 */
.settings-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: move;
  transition: all 0.2s ease;
  position: relative;
}

.settings-item:last-child {
  border-bottom: none;
}

.settings-item:hover {
  background-color: #f8f9fa;
}

.settings-item.dragging {
  opacity: 0.5;
  transform: rotate(2deg);
}

.settings-item .drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 12px;
  color: #999;
  cursor: grab;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.settings-item .drag-handle:hover {
  color: #667eea;
  background-color: #f0f0f0;
}

.settings-item .drag-handle:active {
  cursor: grabbing;
}
</style>
