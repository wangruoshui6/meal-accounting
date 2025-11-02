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
          <div class="date-input" @click="openDatePicker">
            {{ dateInput }}
            <van-icon name="calendar-o" class="calendar-icon" />
          </div>
          <div class="date-display">{{ currentDate }}</div>
          <div class="time-display">{{ currentTime }}</div>
          
          <!-- 使用van-popup显示日历 -->
          <van-popup
            v-model:show="showDatePicker"
            position="center"
            :style="{ width: '90%', maxWidth: '350px' }"
            round
          >
            <div class="calendar-popup">
              <div class="calendar-header">
                <div class="header-left">
                  <span class="header-title">统计</span>
                </div>
                <div class="header-center">
                  <button @click="prevMonth" class="nav-arrow">◀</button>
                  <span class="header-month">{{ currentMonthText }}</span>
                  <button @click="nextMonth" class="nav-arrow nav-arrow-right">▶</button>
                </div>
                <div class="header-right">
                  <button class="more-btn">⋯</button>
                </div>
              </div>
              <div class="custom-calendar">
                <div class="calendar-weekdays">
                  <div class="weekday">一</div>
                  <div class="weekday">二</div>
                  <div class="weekday">三</div>
                  <div class="weekday">四</div>
                  <div class="weekday">五</div>
                  <div class="weekday">六</div>
                  <div class="weekday">日</div>
                </div>
                <div class="calendar-days">
                  <div
                    v-for="day in calendarDays"
                    :key="day.key"
                    :class="['calendar-day', { 
                      'has-record': day.hasRecord, 
                      'is-today': day.isToday, 
                      'is-other-month': day.isOtherMonth
                    }]"
                    :data-date="day.date.format('YYYY-MM-DD')"
                    @click="selectDate(day)"
                    :style="selectedDateStr.value === day.date.format('YYYY-MM-DD') ? 'background: #FF9800 !important; color: white !important; border: 3px solid #E65100 !important; transform: scale(1.1) !important; z-index: 999 !important;' : ''"
                  >
                    {{ day.day }}
                  </div>
                </div>
                <div class="calendar-footer">
                  <button @click="closeDatePicker" class="cancel-btn">取消</button>
                  <button @click="confirmDate" class="confirm-btn">确定</button>
                </div>
              </div>
            </div>
          </van-popup>
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
      <van-button type="default" @click="saveRecord" class="save-button">
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
        <div class="select-all-section">
          <button @click="toggleSelectAll" class="select-all-btn">
            {{ isAllSelected ? '取消全选' : '全选' }}
          </button>
        </div>
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
                <!-- 前5个默认项目不能删除 -->
                <van-icon 
                  v-if="index >= 5"
                  name="cross" 
                  class="delete-btn"
                  @click="removeSettingsItem(index)"
                />
                <span v-else class="fixed-item-tip">固定项目</span>
              </div>
            </div>
          </div>
          
          <div class="new-item-section">
            <van-field
              v-model="newItemName"
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
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import dayjs from 'dayjs'
import MealItem from '../components/MealItem.vue'
import { saveMealRecord, getMealRecord, deleteCustomItems, clearAllData, getRecordDates } from '../api/meal'
import { getDefaultMealItems, saveDefaultMealItems } from '../api/settings'

const router = useRouter()

// 当前日期（从localStorage读取，如果没有则使用当前日期）
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
const currentDate = ref(selectedDate.value.format('YYYY年MM月DD日'))
const dateInput = ref(selectedDate.value.format('YYYY-MM-DD'))

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

// 全选状态
const isAllSelected = computed(() => {
  return customMeals.value.length > 0 && selectedDeleteItems.value.length === customMeals.value.length
})


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
const addMealItem = async () => {
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
  
  // 立即保存到后端
  try {
    await saveRecord()
  } catch (error) {
    showToast('添加成功，但保存失败')
  }
  
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
    
    // 调用后端API清空数据库（后端会清空所有字段，包括customItems）
    const response = await clearAllData(selectedDate.value.format('YYYY-MM-DD'))
    
    
    if (response.data.success) {
      // 重新加载数据，显示后端清空后的状态
      await loadData()
      
      showToast('所有数据已清除')
    } else {
      showToast('清除失败，请重试')
    }
  } catch (error) {
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

// 全选/取消全选
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // 取消全选
    selectedDeleteItems.value = []
  } else {
    // 全选
    selectedDeleteItems.value = customMeals.value.map(meal => meal.key)
  }
}

// 确认删除
const confirmDelete = async () => {
  console.log('=== confirmDelete 被调用 ===')
  console.log('selectedDeleteItems.value:', selectedDeleteItems.value)
  
  if (selectedDeleteItems.value.length === 0) {
    showToast('请选择要删除的项目')
    return
  }
  
  try {
    // 获取要删除的项目信息
    console.log('开始获取要删除的项目信息')
    const itemsToDelete = selectedDeleteItems.value.map(key => {
      const meal = meals.value.find(m => m.key === key)
      if (!meal) return null
      
      // 检查是否是前5个固定项目，如果是，不允许删除
      const isFixedItem = ['breakfast', 'lunch', 'dinner', 'snack', 'drink'].includes(meal.key)
      if (isFixedItem) {
        showToast('前5个默认项目不能删除')
        return null
      }
      
      return { key, name: meal.name, isDefault: meal.key.startsWith('default_') || isFixedItem }
    }).filter(item => item !== null)
    
    if (itemsToDelete.length === 0) {
      showToast('未找到要删除的项目')
      return
    }
    
    // 分离默认项目和真正的动态项目
    const defaultItemNames: string[] = []
    const customItemNames: string[] = []
    const defaultItemKeys: string[] = []
    
    itemsToDelete.forEach(item => {
      if (item!.isDefault) {
        defaultItemNames.push(item!.name)
        defaultItemKeys.push(item!.key)
      } else {
        customItemNames.push(item!.name)
      }
    })
    
    // 获取所有需要删除的项目名称（包括默认项目）
    const allItemNames = [...defaultItemNames, ...customItemNames]
    
    // 分离前5个固定项目和第6个及以后的默认项目
    const fixedItemKeys: string[] = []
    const defaultPrefixItemKeys: string[] = []
    const defaultPrefixItemNames: string[] = []
    
    // 在删除前，先保存所有其他默认项目的金额（通过名称匹配，确保即使索引变化也能恢复）
    const amountsToPreserve = new Map<string, number>()
    
    console.log('=== 开始删除流程 ===')
    console.log('要删除的项目:', itemsToDelete.map(i => ({ key: i!.key, name: i!.name, isDefault: i!.isDefault })))
    console.log('defaultItemNames:', defaultItemNames)
    console.log('defaultItemKeys:', defaultItemKeys)
    
    if (defaultItemNames.length > 0) {
      // 在删除前，保存所有默认项目的金额（不管是否为0，都保存，确保不丢失）
      meals.value.forEach(meal => {
        // 保存所有默认项目的金额（包括前5个固定项目和后面的default_前缀项目）
        if (meal.key.startsWith('default_') || ['breakfast', 'lunch', 'dinner', 'snack', 'drink'].includes(meal.key)) {
          // 通过名称保存，因为名称是唯一的，不会因为索引变化而改变
          // 保存所有金额（包括0），因为0也可能是用户有意设置的
          if (meal.name) {
            amountsToPreserve.set(meal.name.trim(), meal.amount)
          }
        }
      })
      console.log('删除前保存的金额:', Array.from(amountsToPreserve.entries()))
      
      defaultItemKeys.forEach(key => {
        const meal = meals.value.find(m => m.key === key)
        if (meal) {
          // 从保存的金额中移除要删除的项目
          amountsToPreserve.delete(meal.name.trim())
          
          if (meal.key.startsWith('default_')) {
            // 这是第6个及以后的默认项目，应该完全删除（从默认项目列表中移除）
            defaultPrefixItemKeys.push(key)
            defaultPrefixItemNames.push(meal.name)
            console.log(`识别为第6个及以后的默认项目: ${meal.name} (key: ${key})`)
          } else {
            // 这是前5个固定项目，只清除金额，不删除项目本身
            fixedItemKeys.push(key)
            console.log(`识别为前5个固定项目: ${meal.name} (key: ${key})`)
          }
        }
      })
      
      console.log('fixedItemKeys:', fixedItemKeys)
      console.log('defaultPrefixItemKeys:', defaultPrefixItemKeys)
      console.log('defaultPrefixItemNames:', defaultPrefixItemNames)
      
      // 处理前5个固定项目：只清除金额
      if (fixedItemKeys.length > 0) {
        fixedItemKeys.forEach(key => {
          const meal = meals.value.find(m => m.key === key)
          if (meal) {
            meal.amount = 0
          }
        })
        
        // 清除前5个固定项目在customItems中的值（如果有的话）
        try {
          const fixedItemNames = fixedItemKeys.map(key => {
            const meal = meals.value.find(m => m.key === key)
            return meal ? meal.name : ''
          }).filter(name => name)
          
          if (fixedItemNames.length > 0) {
            await deleteCustomItems(selectedDate.value.format('YYYY-MM-DD'), fixedItemNames)
          }
        } catch (error) {
          console.error('删除固定项目值失败:', error)
        }
        
        // 保存更新后的数据（固定项目的金额已被清除）
        try {
          await saveRecord()
        } catch (error) {
          console.error('保存更新失败:', error)
        }
      }
      
      // 处理第6个及以后的默认项目：完全删除，从默认项目列表中移除
      if (defaultPrefixItemKeys.length > 0) {
        // 从当前列表中删除
        defaultPrefixItemKeys.forEach(key => {
          const index = meals.value.findIndex(m => m.key === key)
          if (index > -1) {
            meals.value.splice(index, 1)
          }
        })
        
        // 从默认项目列表中移除（永久删除）
        defaultMealItems.value = defaultMealItems.value.filter(name => {
          return !defaultPrefixItemNames.some(deleteName => deleteName.trim() === name.trim())
        })
        
        // 保存更新后的默认项目列表到后端（永久删除）
        try {
          await saveDefaultMealItems(defaultMealItems.value)
        } catch (error) {
          console.error('保存默认项目列表失败:', error)
        }
        
        // 调用后端API删除默认项目在customItems中的值（如果存在）
        // 注意：这里只删除当前日期的数据，历史数据保留（因为历史数据是真实的记录）
        // 但在加载时会清理这些数据，避免显示已删除的默认项目
        try {
          const deleteResponse = await deleteCustomItems(selectedDate.value.format('YYYY-MM-DD'), defaultPrefixItemNames)
          if (!deleteResponse.data.success) {
            console.error('删除默认项目值失败:', deleteResponse.data.message)
          }
        } catch (error) {
          console.error('删除默认项目值失败:', error)
        }
        
        // 重新加载默认项目列表，确保同步
        await loadDefaultMealItems()
      }
    }
    
    // 如果有真正的动态项目，删除它们
    if (customItemNames.length > 0) {
      // 先调用后端API删除
      try {
        const response = await deleteCustomItems(selectedDate.value.format('YYYY-MM-DD'), customItemNames)
        
        if (response.data.success) {
          // 清理localStorage中的数据，避免刷新后恢复
          const dateKey = selectedDate.value.format('YYYY-MM-DD')
          localStorage.removeItem('meal-record-' + dateKey)
          
          // 直接从前端列表中删除项目
          selectedDeleteItems.value.forEach(key => {
            const meal = meals.value.find(m => m.key === key)
            // 只删除真正的动态项目（custom_前缀），不删除默认项目
            if (meal && meal.key.startsWith('custom_')) {
              const index = meals.value.findIndex(m => m.key === key)
              if (index > -1) {
                meals.value.splice(index, 1)
              }
            }
          })
        } else {
          showToast(`删除失败: ${response.data.message}`)
          return
        }
      } catch (backendError) {
        showToast('删除失败，请检查网络连接')
        return
      }
    }
    
    // 如果删除了第6个及以后的默认项目，只需要更新默认项目列表，不需要重新初始化meals
    if (defaultPrefixItemKeys.length > 0) {
      console.log('开始处理删除第6个及以后的默认项目')
      console.log('删除的项目:', defaultPrefixItemNames)
      console.log('当前meals列表（删除前）:', meals.value.map(m => ({ name: m.name, key: m.key, amount: m.amount })))
      
      // 从默认项目列表中移除（已经在上面执行过了）
      // defaultMealItems.value 已经更新了
      
      // 重新加载默认项目列表，确保同步
      await loadDefaultMealItems()
      console.log('重新加载后的默认项目列表:', defaultMealItems.value)
      console.log('当前meals列表（删除后，但未重新初始化）:', meals.value.map(m => ({ name: m.name, key: m.key, amount: m.amount })))
      
      // 重要：不重新初始化meals！只更新被删除项目的key（如果需要）
      // 因为重新初始化会重置所有金额为0，这正是问题所在
      // meals.value 中已经被删除的项目已经从列表中移除了（在第538-545行执行）
      // 现在只需要确保剩余的项目的key是正确的（基于defaultMealItems）
      
      // 更新剩余default_前缀项目的key，确保索引正确
      // 例如：如果删除了第5个（index=4），那么原来的第6个（index=5, key=default_5）应该变成第5个（index=4，但前5个用固定key）
      // 或者：如果删除了第7个（index=6, key=default_6），那么原来的第8个（index=7, key=default_7）应该变成第6个（index=5, key=default_5）
      
      // 但是，由于我们通过名称匹配金额，key的变化不会影响金额的恢复
      // 所以实际上不需要更新key，因为saveRecord()会通过名称保存
      
      // 直接保存当前状态到后端（保持所有金额不变）
      console.log('准备保存当前状态到后端（保持所有金额）')
      console.log('保存前的meals列表:', meals.value.map(m => ({ name: m.name, key: m.key, amount: m.amount })))
      try {
        await saveRecord()
        console.log('✅ 保存成功，当前meals列表的状态:', meals.value.map(m => ({ name: m.name, key: m.key, amount: m.amount })))
        
        // 保存后，确保不会触发任何重新加载数据的操作
        // 不调用 loadData()，因为那会重置所有金额
        // 只更新记录日期列表（不影响当前页面数据）
      } catch (error) {
        console.error('❌ 保存失败:', error)
      }
    } else {
      // 如果没有删除第6个及以后的默认项目，只处理前5个固定项目或动态项目
      // 注意：固定项目的金额已经在上面处理时清除了，不需要再次处理
      // 只需要处理动态项目的删除
      
      // 重新加载数据，确保同步
      await loadData()
    }
    
    const totalDeleted = defaultItemNames.length + customItemNames.length
    if (totalDeleted > 0) {
      showToast(`已清除 ${totalDeleted} 个项目`)
    }
    
    selectedDeleteItems.value = []
    showDeleteModal.value = false
    
  } catch (error) {
    console.error('删除失败:', error)
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

// 日期选择器相关变量
const showDatePicker = ref(false)
const recordDates = ref<Set<string>>(new Set())
const currentMonth = ref(dayjs())
const tempSelectedDate = ref(dayjs().clone())
const selectedDateStr = ref('')

// 跳转到设置页面
const goToSettings = () => {
  // 加载当前设置
  loadSettings()
  showSettingsModal.value = true
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

// 删除设置项目（立即保存并同步）
const removeSettingsItem = async (index: number) => {
  console.log('=== removeSettingsItem 被调用 ===')
  console.log('要删除的索引:', index)
  
  // 前5个默认项目不能删除
  if (index < 5) {
    showToast('前5个默认项目不能删除')
    return
  }
  
  console.log('删除前的settingsMealItems:', settingsMealItems.value.map(i => i.name))
  console.log('删除前的meals列表:', meals.value.map(m => ({ name: m.name, amount: m.amount })))
  
  if (settingsMealItems.value.length > 1) {
    // 在删除前，先保存所有当前项目的金额（通过名称匹配）
    const amountsToPreserve = new Map<string, number>()
    meals.value.forEach(meal => {
      if (meal.key.startsWith('default_') || ['breakfast', 'lunch', 'dinner', 'snack', 'drink'].includes(meal.key)) {
        if (meal.name && meal.amount > 0) {
          amountsToPreserve.set(meal.name.trim(), meal.amount)
        }
      }
    })
    console.log('删除前保存的金额:', Array.from(amountsToPreserve.entries()))
    
    // 获取要删除的项目名称
    const deletedItemName = settingsMealItems.value[index].name.trim()
    console.log('要删除的项目名称:', deletedItemName)
    
    // 从保存的金额中移除要删除的项目
    amountsToPreserve.delete(deletedItemName)
    
    settingsMealItems.value.splice(index, 1)
    
    // 立即保存并同步
    try {
      // 保存所有项目，包括空名称的
      const allItems = settingsMealItems.value.map(item => item.name.trim())
      
      // 检查是否有至少一个非空项目
      const validItems = allItems.filter(name => name.length > 0)
      if (validItems.length === 0) {
        showToast('至少保留一个项目')
        return
      }
      
      // 检查非空项目是否有重复
      const uniqueValidItems = [...new Set(validItems)]
      if (uniqueValidItems.length !== validItems.length) {
        showToast('项目名称不能重复')
      }
      
      // 立即保存到后端
      const response = await saveDefaultMealItems(allItems)
      
      if (response.success) {
        showToast('已删除并保存')
        // 重新加载默认项目
        await loadDefaultMealItems()
        
        // 重要：不调用 initializeMeals()，因为它会重置所有金额为0
        // 而是只更新 meals.value 中对应的项目，保持金额不变
        // 从 meals.value 中删除被删除的项目
        const indexToRemove = meals.value.findIndex(m => m.name.trim() === deletedItemName)
        if (indexToRemove > -1) {
          meals.value.splice(indexToRemove, 1)
        }
        
        console.log('删除后的meals列表（保持金额）:', meals.value.map(m => ({ name: m.name, amount: m.amount })))
        
        // 保存当前状态到后端（保持所有金额）
        await saveRecord()
        console.log('✅ 保存成功，金额已保持')
      } else {
        showToast(response.message || '保存失败')
      }
    } catch (error) {
      console.error('删除并保存失败:', error)
      showToast('保存失败，请重试')
    }
  } else {
    showToast('至少保留一个项目')
  }
}

// 保存设置
const saveSettings = async () => {
  try {
    // 检查输入框中是否有未添加的项目名称
    if (newItemName.value.trim()) {
      showToast('请先添加输入的项目或清空输入框')
      return
    }
    
    // 保存所有项目，包括空名称的（用户可能稍后填写）
    const allItems = settingsMealItems.value.map(item => item.name.trim())
    
    // 检查是否有至少一个非空项目
    const validItems = allItems.filter(name => name.length > 0)
    if (validItems.length === 0) {
      showToast('请至少添加一个项目')
      return
    }
    
    // 检查非空项目是否有重复
    const uniqueValidItems = [...new Set(validItems)]
    if (uniqueValidItems.length !== validItems.length) {
      showToast('项目名称不能重复')
      return
    }
    
    // 在重新初始化之前，先保存当前已有的金额数据（通过key匹配）
    const existingAmounts = new Map<string, number>()
    meals.value.forEach(meal => {
      // 对于固定项目（breakfast, lunch等），通过key保存
      if (['breakfast', 'lunch', 'dinner', 'snack', 'drink'].includes(meal.key)) {
        existingAmounts.set(meal.key, meal.amount)
      }
      // 对于default_前缀的项目，通过名称保存（因为key会变化）
      else if (meal.key.startsWith('default_')) {
        existingAmounts.set(meal.name, meal.amount)
      }
    })
    
    // 保存所有项目（包括空名称的）到后端
    const response = await saveDefaultMealItems(allItems)
    
    if (response.success) {
      showToast('设置保存成功')
      showSettingsModal.value = false
      // 重新加载默认项目
      await loadDefaultMealItems()
      await initializeMeals()
      
      // 恢复已保存的金额数据
      meals.value.forEach(meal => {
        // 恢复固定项目的金额
        if (['breakfast', 'lunch', 'dinner', 'snack', 'drink'].includes(meal.key)) {
          if (existingAmounts.has(meal.key)) {
            meal.amount = existingAmounts.get(meal.key) || 0
          }
        }
        // 恢复default_前缀项目的金额（通过名称匹配）
        else if (meal.key.startsWith('default_') && meal.name) {
          if (existingAmounts.has(meal.name)) {
            meal.amount = existingAmounts.get(meal.name) || 0
          }
        }
      })
    } else {
      showToast(response.message || '保存失败')
    }
  } catch (error) {
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
    console.log('MealRecord获取默认项目响应:', response)
    
    if (response.success && response.data && Array.isArray(response.data)) {
      defaultMealItems.value = response.data.filter((name: string) => name && name.trim() !== '')
    } else {
      // 如果获取失败，使用默认值
      defaultMealItems.value = ['早饭', '午饭', '晚饭', '零食', '饮料']
    }
    
    // 如果获取的项目为空，使用默认值
    if (defaultMealItems.value.length === 0) {
      defaultMealItems.value = ['早饭', '午饭', '晚饭', '零食', '饮料']
    }
    
    console.log('MealRecord最终默认项目列表:', defaultMealItems.value)
  } catch (error) {
    console.error('获取默认项目失败:', error)
    // 如果获取失败，使用默认值
    defaultMealItems.value = ['早饭', '午饭', '晚饭', '零食', '饮料']
  }
}

// 加载有记录的日期
const loadRecordDates = async () => {
  try {
    const year = currentMonth.value.year()
    const month = currentMonth.value.month() + 1
    
    
    const response = await getRecordDates(year, month)
    
    if (response.data.success) {
      const dates = response.data.data || []
      recordDates.value = new Set(dates)
    }
  } catch (error) {
  }
}

// 当前月份文本
const currentMonthText = computed(() => {
  return currentMonth.value.format('YYYY年MM月')
})

// 日历天数计算
const calendarDays = computed(() => {
  const days = []
  const startOfMonth = currentMonth.value.startOf('month')
  const endOfMonth = currentMonth.value.endOf('month')
  const startOfWeek = startOfMonth.startOf('week').add(1, 'day') // 从周一开始
  const endOfWeek = endOfMonth.endOf('week').add(1, 'day') // 到周日结束
  
  let current = startOfWeek
  while (current.isBefore(endOfWeek) || current.isSame(endOfWeek, 'day')) {
    const dateStr = current.format('YYYY-MM-DD')
    const isCurrentMonth = current.isSame(currentMonth.value, 'month')
    const isToday = current.isSame(dayjs(), 'day')
    const hasRecord = recordDates.value.has(dateStr)
    
    days.push({
      key: dateStr,
      day: current.date(),
      date: current,
      isOtherMonth: !isCurrentMonth,
      isToday,
      hasRecord
    })
    
    current = current.add(1, 'day')
  }
  
  return days
})

// 打开日期选择器
const openDatePicker = () => {
  currentMonth.value = selectedDate.value.clone()
  tempSelectedDate.value = selectedDate.value.clone()
  selectedDateStr.value = selectedDate.value.format('YYYY-MM-DD')
  showDatePicker.value = true
}

// 上一个月
const prevMonth = () => {
  currentMonth.value = currentMonth.value.subtract(1, 'month')
  loadRecordDates()
}

// 下一个月
const nextMonth = () => {
  currentMonth.value = currentMonth.value.add(1, 'month')
  loadRecordDates()
}

// 选择日期
const selectDate = (day: any) => {
  if (!day.isOtherMonth) {
    const newDate = day.date.clone()
    tempSelectedDate.value = newDate
    selectedDateStr.value = newDate.format('YYYY-MM-DD')
    
    // 直接修改DOM样式
    setTimeout(() => {
      // 清除所有日期的选中样式
      document.querySelectorAll('.calendar-day').forEach(el => {
        el.style.background = ''
        el.style.color = ''
        el.style.border = ''
        el.style.transform = ''
      })
      
      // 设置当前选中日期的样式
      const targetElement = document.querySelector(`[data-date="${newDate.format('YYYY-MM-DD')}"]`)
      if (targetElement) {
        targetElement.style.background = '#FF9800'
        targetElement.style.color = 'white'
        targetElement.style.border = '3px solid #E65100'
        targetElement.style.transform = 'scale(1.1)'
      }
    }, 50)
  }
}

// 确认日期
const confirmDate = () => {
  selectedDate.value = tempSelectedDate.value
  dateInput.value = selectedDate.value.format('YYYY-MM-DD')
  currentDate.value = selectedDate.value.format('YYYY年MM月DD日')
  showDatePicker.value = false
  
  // 保存选中的日期到localStorage，以便Calendar页面同步
  localStorage.setItem('selectedDate', selectedDate.value.format('YYYY-MM-DD'))
  
  // 重新加载数据
  loadData()
}

// 点击外部关闭日历
const closeDatePicker = () => {
  showDatePicker.value = false
}

// 日期确认
const onDateConfirm = (date: Date) => {
  selectedDate.value = dayjs(date)
  dateInput.value = selectedDate.value.format('YYYY-MM-DD')
  currentDate.value = selectedDate.value.format('YYYY年MM月DD日')
  showDatePicker.value = false
  
  // 保存选中的日期到localStorage，以便Calendar页面同步
  localStorage.setItem('selectedDate', selectedDate.value.format('YYYY-MM-DD'))
  
  // 重新加载数据
  loadData()
}

// 原生日期选择器变化
const onNativeDateChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const newDate = target.value
  
  if (newDate) {
    selectedDate.value = dayjs(newDate)
    dateInput.value = newDate
    currentDate.value = selectedDate.value.format('YYYY年MM月DD日')
    showDatePicker.value = false
    
    // 保存选中的日期到localStorage，以便Calendar页面同步
    localStorage.setItem('selectedDate', selectedDate.value.format('YYYY-MM-DD'))
    
    // 重新加载数据
    loadData()
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
  selectedDate.value = dayjs(dateInput.value)
  currentDate.value = selectedDate.value.format('YYYY年MM月DD日')
  
  // 保存选中的日期到localStorage，以便Calendar页面同步
  localStorage.setItem('selectedDate', selectedDate.value.format('YYYY-MM-DD'))
  
  await loadData()
}

// 保存记录
const saveRecord = async () => {
  // 检查是否有动态项目需要保存
  const hasCustomItems = meals.value.some(meal => 
    meal.key.startsWith('custom_') || meal.key.startsWith('default_')
  )
  
  if (totalAmount.value === 0 && !hasCustomItems) {
    showToast('请输入至少一项金额')
    return
  }

  try {
    console.log('saveRecord - 当前meals列表:', meals.value.map(m => ({ name: m.name, key: m.key, amount: m.amount })))
    
    // 分离固定项目和动态项目
    const fixedMeals = meals.value.filter(meal => 
      ['breakfast', 'lunch', 'dinner', 'snack', 'drink'].includes(meal.key)
    )
    console.log('saveRecord - 固定项目:', fixedMeals.map(m => ({ name: m.name, amount: m.amount })))
    
    // 获取所有默认项目的名称（用于过滤）
    const defaultMealNames = new Set(defaultMealItems.value.map(name => name.trim()))
    console.log('saveRecord - 默认项目名称:', Array.from(defaultMealNames))
    
    // 获取所有需要保存到customItems的项目：
    // 1. 真正的自定义项目（custom_前缀）
    // 2. default_前缀的默认项目（第6个及以后的默认项目，因为后端只有5个固定字段）
    const customMeals = meals.value.filter(meal => 
      meal.key.startsWith('custom_') || meal.key.startsWith('default_')
    )
    console.log('saveRecord - 自定义项目:', customMeals.map(m => ({ name: m.name, key: m.key, amount: m.amount })))
    
    // 构建动态项目对象
    // 注意：default_前缀的默认项目也需要保存到customItems，因为后端只有5个固定字段
    // 但在加载时会通过名称匹配正确关联到默认项目，避免重复显示
    const customItems: Record<string, number> = {}
    customMeals.forEach(meal => {
      // 对于真正的动态项目（custom_前缀），即使金额为0也要保存，以确保刷新后能显示
      // 对于default_前缀的默认项目，只有金额大于0才保存（避免保存大量0值）
      if (meal.key.startsWith('custom_')) {
        // 动态项目：无论金额是否为0都保存
        customItems[meal.name] = meal.amount
      } else if (meal.amount > 0) {
        // default_前缀的默认项目：只有金额大于0才保存
        customItems[meal.name] = meal.amount
      }
    })
    console.log('saveRecord - 保存的customItems:', customItems)
    
    const recordData = {
      recordDate: selectedDate.value.format('YYYY-MM-DD'),
      breakfast: fixedMeals.find(m => m.key === 'breakfast')?.amount || 0,
      lunch: fixedMeals.find(m => m.key === 'lunch')?.amount || 0,
      dinner: fixedMeals.find(m => m.key === 'dinner')?.amount || 0,
      snack: fixedMeals.find(m => m.key === 'snack')?.amount || 0,
      drink: fixedMeals.find(m => m.key === 'drink')?.amount || 0,
      customItems: Object.keys(customItems).length > 0 ? customItems : undefined
    }

    const response = await saveMealRecord(recordData)
    showToast('保存成功！')
    
    // 保存成功后更新记录日期
    await loadRecordDates()
    
    // 保存成功后不清空数据，让用户看到保存的内容
  } catch (error) {
    showToast('保存失败，请重试')
  }
}

// 从后端加载数据
const loadData = async () => {
  try {
    // 先确保加载默认项目（如果还没有加载或需要重新加载）
    // 这里应该总是加载最新的默认项目，以确保同步
    await loadDefaultMealItems()
    
    const dateKey = selectedDate.value.format('YYYY-MM-DD')
    const record = await getMealRecord(dateKey)
    
    // 先初始化默认项目
    initializeMeals()
    
    if (record) {
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
          
          // 获取所有默认项目的名称（用于过滤）
          const defaultMealNames = new Set(defaultMealItems.value.map(name => name.trim()))
          
          // 移除现有的自定义项目（custom_前缀的），但保留默认项目中的default_前缀项目
          const defaultItemsCount = defaultMealItems.value.length
          meals.value = meals.value.filter(meal => {
            // 保留所有固定key的项目（breakfast, lunch, dinner, snack, drink）
            if (['breakfast', 'lunch', 'dinner', 'snack', 'drink'].includes(meal.key)) {
              return true
            }
            // 保留默认项目中的default_前缀项目（index >= 5的默认项目）
            if (meal.key.startsWith('default_')) {
              const index = parseInt(meal.key.replace('default_', ''))
              // 如果是默认项目列表中的项目（index >= 5），保留它
              if (index >= 5 && index < defaultItemsCount) {
                return true
              }
            }
            // 移除所有custom_前缀的项目（这些是用户自定义添加的，不是默认项目）
            return !meal.key.startsWith('custom_')
          })
          
          // 获取需要清理的项目名称（customItems中存在但不在defaultMealItems中的，说明是被删除的默认项目）
          const itemsToClean: string[] = []
          
          // 添加从后端加载的动态项目，但排除默认项目名称，避免重复
          Object.entries(customItems).forEach(([name, amount]) => {
            const nameTrimmed = name.trim()
            
            // 跳过默认项目，避免重复显示
            if (defaultMealNames.has(nameTrimmed)) {
              // 如果customItems中有默认项目，需要恢复对应默认项目的金额
              // 注意：通过名称匹配，而不是索引，避免删除项目后索引变化导致金额错位
              const meal = meals.value.find(m => m.name === nameTrimmed)
              if (meal) {
                meal.amount = amount as number
              } else {
                // 如果找不到对应的meal（可能还未初始化），通过索引查找
                const mealIndex = defaultMealItems.value.findIndex(defaultName => defaultName.trim() === nameTrimmed)
                if (mealIndex >= 0) {
                  const keyMapping = ['breakfast', 'lunch', 'dinner', 'snack', 'drink']
                  const key = mealIndex < 5 ? keyMapping[mealIndex] : `default_${mealIndex}`
                  const mealByKey = meals.value.find(m => m.key === key)
                  if (mealByKey && mealByKey.name === nameTrimmed) {
                    mealByKey.amount = amount as number
                  }
                }
              }
              // 重要：不添加到动态项目列表，避免在删除列表中显示
              // 同时从后端的customItems中清除这些默认项目（如果是第6个及以后的）
              const mealIndexForClean = defaultMealItems.value.findIndex(defaultName => defaultName.trim() === nameTrimmed)
              if (mealIndexForClean >= 5) {
                // 这是第6个及以后的默认项目，应该从customItems中清除（因为它不应该在customItems中）
                itemsToClean.push(nameTrimmed)
              }
              return // 跳过，不添加到动态项目列表
            }
            
            // 如果customItems中有项目，但它不在defaultMealItems中
            // 这可能是：
            // 1. 真正的动态项目（用户主动添加的） - 应该加载并显示
            // 2. 被删除的默认项目 - 应该清理掉，避免显示和统计
            
            // 判断是否为被删除的默认项目：如果该项目在customItems中有值，但在defaultMealItems中不存在
            // 为了避免误判，这里假设所有不在defaultMealItems中的项目都是动态项目
            // 但如果这些项目的值导致了年度账单统计问题，可能需要更严格的判断
            
            // 暂时保留：添加到动态项目列表（这些可能是真正的动态项目）
            const newKey = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            meals.value.push({
              key: newKey,
              name: name,
              amount: amount as number,
              placeholder: '',
              type: 'number' as const,
              description: ''
            })
            
            // 注意：如果这些项目是被删除的默认项目，它们会在统计时被计算进去
            // 但这可能是历史数据，不应该被清理
          })
          
          // 清理customItems中已被删除的默认项目（第6个及以后的默认项目不应该在customItems中）
          if (itemsToClean.length > 0) {
            try {
              await deleteCustomItems(selectedDate.value.format('YYYY-MM-DD'), itemsToClean)
            } catch (error) {
              console.error('清理已删除的默认项目失败:', error)
            }
          }
          
          // 重要：清理customItems中被删除的默认项目（不在defaultMealItems中的项目）
          // 这些项目可能是被删除的默认项目，应该清理掉，避免在统计时被计算进去
          // 但真正的动态项目（已经添加到meals.value中的custom_前缀项目）应该保留
          const deletedDefaultItemsToClean: string[] = []
          Object.keys(customItems).forEach(name => {
            const nameTrimmed = name.trim()
            // 如果customItems中有项目，但它不在defaultMealItems中
            if (!defaultMealNames.has(nameTrimmed)) {
              // 检查是否是真正的动态项目（已经添加到meals.value中的custom_前缀项目）
              const isDynamicItem = meals.value.some(m => m.key.startsWith('custom_') && m.name === nameTrimmed)
              if (!isDynamicItem) {
                // 这不是真正的动态项目，可能是被删除的默认项目，应该清理掉
                // 注意：这里只清理当前日期，历史数据保留（因为历史数据是真实的记录）
                // 但为了避免年度账单统计问题，应该清理这些被删除的默认项目
                deletedDefaultItemsToClean.push(nameTrimmed)
              }
            }
          })
          
          if (deletedDefaultItemsToClean.length > 0) {
            console.log('清理被删除的默认项目:', deletedDefaultItemsToClean)
            try {
              await deleteCustomItems(selectedDate.value.format('YYYY-MM-DD'), deletedDefaultItemsToClean)
            } catch (error) {
              console.error('清理被删除的默认项目失败:', error)
            }
          }
          
          // 清理customItems中的默认项目（如果存在误创建的custom_前缀的默认项目）
          // 找到所有custom_前缀的默认项目并删除
          const defaultItemsToRemove: Array<{ key: string, name: string }> = []
          meals.value.forEach(meal => {
            if (meal.key.startsWith('custom_') && defaultMealNames.has(meal.name.trim())) {
              defaultItemsToRemove.push({ key: meal.key, name: meal.name })
            }
          })
          
          if (defaultItemsToRemove.length > 0) {
            // 先获取要清除的项目名称
            const itemNames = defaultItemsToRemove.map(item => item.name).filter(name => name)
            
            // 删除这些误创建的默认项目
            defaultItemsToRemove.forEach(item => {
              const index = meals.value.findIndex(m => m.key === item.key)
              if (index > -1) {
                meals.value.splice(index, 1)
              }
            })
            
            if (itemNames.length > 0) {
              // 异步清除后端数据（不等待完成，避免阻塞）
              deleteCustomItems(selectedDate.value.format('YYYY-MM-DD'), itemNames).catch(error => {
                console.error('清理默认项目失败:', error)
              })
            }
          }
        } catch (error) {
        }
      } else {
        // 如果customItems为空，移除所有自定义项目（custom_前缀的），但保留默认项目中的default_前缀项目
        // 默认项目中的default_前缀项目是指index >= 5的默认项目
        const defaultItemsCount = defaultMealItems.value.length
        meals.value = meals.value.filter(meal => {
          // 保留所有固定key的项目（breakfast, lunch, dinner, snack, drink）
          if (['breakfast', 'lunch', 'dinner', 'snack', 'drink'].includes(meal.key)) {
            return true
          }
          // 保留默认项目中的default_前缀项目（index >= 5的默认项目）
          if (meal.key.startsWith('default_')) {
            const index = parseInt(meal.key.replace('default_', ''))
            // 如果是默认项目列表中的项目（index >= 5），保留它
            if (index >= 5 && index < defaultItemsCount) {
              return true
            }
          }
          // 移除所有custom_前缀的项目（这些是用户自定义添加的，不是默认项目）
          return !meal.key.startsWith('custom_')
        })
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

// 页面重新获得焦点时重新加载默认项目
const handlePageFocus = () => {
  // 同步从localStorage读取的日期（可能从Calendar页面返回）
  const storedDate = localStorage.getItem('selectedDate')
  if (storedDate) {
    const parsed = dayjs(storedDate)
    if (parsed.isValid()) {
      selectedDate.value = parsed
      dateInput.value = parsed.format('YYYY-MM-DD')
      currentDate.value = parsed.format('YYYY年MM月DD日')
    }
  }
  
  // 当页面重新获得焦点时，重新加载默认项目（可能从设置页面返回）
  loadDefaultMealItems().then(() => {
    // 重新初始化餐饮列表
    initializeMeals()
    // 重新加载当前日期的数据
    loadData()
  })
}

// 监听页面可见性变化（当从其他页面返回时）
const handleVisibilityChange = () => {
  if (!document.hidden) {
    // 同步从localStorage读取的日期（可能从Calendar页面返回）
    const storedDate = localStorage.getItem('selectedDate')
    if (storedDate) {
      const parsed = dayjs(storedDate)
      if (parsed.isValid()) {
        selectedDate.value = parsed
        dateInput.value = parsed.format('YYYY-MM-DD')
        currentDate.value = parsed.format('YYYY年MM月DD日')
      }
    }
    
    // 页面变为可见时，重新加载默认项目（可能从设置页面返回）
    loadDefaultMealItems().then(() => {
      // 重新初始化餐饮列表
      initializeMeals()
      // 重新加载当前日期的数据
      loadData()
    })
  }
}

// 页面加载时初始化
onMounted(async () => {
  // 设置当前标签页状态
  currentTab.value = 'home'
  
  await loadDefaultMealItems()
  await loadData() // 先加载数据，包括动态项目
  await loadRecordDates() // 加载有记录的日期
  
  // 监听页面焦点，从设置页面返回时重新加载默认项目
  window.addEventListener('focus', handlePageFocus)
  
  // 监听页面可见性变化，从设置页面返回时重新加载默认项目
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
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
  justify-content: center;
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #999;
  min-width: 0; /* 允许flex收缩 */
  width: 100%; /* 确保每个项占据相等的宽度 */
  height: 50px; /* 固定高度，确保三个导航项高度一致 */
  box-sizing: border-box; /* 确保padding包含在高度内 */
}

.nav-item.active {
  color: #1976d2;
}

.nav-item span {
  font-size: 10px;
  margin-top: 2px;
  white-space: nowrap; /* 防止文字换行 */
  text-align: center;
  width: 100%;
  line-height: 1.2; /* 固定行高，确保文字高度一致 */
  height: 12px; /* 固定文字高度 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-item .van-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0; /* 防止图标被压缩 */
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

/* 日期选择器样式 */
.date-section {
  position: relative;
}

.date-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid #e0e0e0;
  font-size: 14px;
  color: #1976d2;
  font-weight: 500;
  position: relative;
  z-index: 10;
}

.calendar-icon {
  margin-left: 8px;
  color: #1976d2;
}

/* 日历弹窗样式 */
.calendar-popup {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #20B2AA 0%, #48CAE4 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.header-left {
  flex: 1;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 2;
  justify-content: center;
  min-width: 200px;
}

.header-month {
  font-size: 18px;
  font-weight: 600;
}

.nav-arrow {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-arrow:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(1.05);
}

.nav-arrow-right {
  background: rgba(255, 255, 255, 0.3) !important;
  border: 2px solid rgba(255, 255, 255, 0.5) !important;
}

.header-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  min-width: 60px;
}

.more-btn {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.more-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 18px;
  color: white;
  cursor: pointer;
  padding: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 自定义日历样式 */
.custom-calendar {
  padding: 16px;
  background: white;
}


.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  margin-bottom: 12px;
  padding: 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
}

.weekday {
  text-align: center;
  font-size: 14px;
  color: white;
  padding: 8px 0;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 12px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  background: white;
  color: #333;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
}

.calendar-day:hover {
  background: #e3f2fd;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.calendar-day.is-other-month {
  color: #999;
  background: #f8f9fa;
  opacity: 0.7;
}

.calendar-day.is-today {
  background: linear-gradient(135deg, #2196F3 0%, #21CBF3 100%) !important;
  color: white !important;
  border: 2px solid #1976D2 !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3) !important;
}

.calendar-day.is-selected {
  background: #FF9800 !important;
  color: white !important;
  border: 3px solid #E65100 !important;
  font-weight: 700 !important;
  box-shadow: 0 0 0 2px #FF9800 !important;
  transform: scale(1.15) !important;
  z-index: 10 !important;
}

.calendar-day.has-record {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%) !important;
  color: white !important;
  border: 2px solid #388E3C !important;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.calendar-day.has-record.is-today {
  background: linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%) !important;
  border: 2px solid #1B5E20 !important;
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.4);
}

.calendar-day.has-record.is-selected {
  background: linear-gradient(135deg, #FF5722 0%, #D84315 100%) !important;
  border: 2px solid #BF360C !important;
  box-shadow: 0 4px 12px rgba(255, 87, 34, 0.4) !important;
  transform: scale(1.1) !important;
}

.calendar-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cancel-btn {
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  color: #666;
  border: 2px solid #ddd;
}

.cancel-btn:hover {
  background: linear-gradient(135deg, #e0e0e0 0%, #d0d0d0 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.confirm-btn {
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  color: #666;
  border: 2px solid #ddd;
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #e0e0e0 0%, #d0d0d0 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

:deep(.van-calendar__day--selected::after) {
  background-color: white !important;
}

/* 删除弹窗样式 */
.delete-modal-content {
  padding: 16px;
}

.modal-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #333;
}

.select-all-section {
  margin-bottom: 16px;
  text-align: right;
}

.select-all-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.select-all-btn:hover {
  background: #5a6fd8;
}

.delete-list {
  max-height: 200px;
  overflow-y: auto;
}

.delete-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.delete-item:hover {
  background-color: #f8f9fa;
}

.delete-item.selected {
  background-color: #e3f2fd;
}

.item-name {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.item-amount {
  font-size: 14px;
  color: #666;
  margin-right: 8px;
}

.no-items {
  text-align: center;
  color: #999;
  padding: 20px 0;
  font-size: 14px;
}

:deep(.van-calendar__footer) {
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;
}

:deep(.van-button--primary) {
  width: 100%;
  height: 36px;
  font-size: 14px;
  border-radius: 6px;
}

/* 设置弹窗样式 */
.settings-popup {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.settings-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-title {
  font-size: 16px;
  font-weight: 600;
}

.settings-content {
  padding: 20px;
}

.settings-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
}

.settings-list {
  margin-bottom: 20px;
}

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

.settings-item .item-name {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.settings-item .remove-btn {
  background: #ff4757;
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.settings-item .remove-btn:hover {
  background: #ff3742;
  transform: scale(1.1);
}

.new-item-section {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.new-item-input {
  flex: 1;
  height: 40px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  min-width: 0; /* 确保可以收缩 */
  display: flex;
  align-items: center;
}

.new-item-input :deep(.van-field__control) {
  height: 38px;
  font-size: 14px;
  padding: 0 12px;
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  line-height: 38px;
}

.new-item-input :deep(.van-field__body) {
  height: 38px;
  padding: 0;
  width: 100%;
  display: flex;
  align-items: center;
}

.new-item-input :deep(.van-field__control:focus) {
  border: none;
  outline: none;
  box-shadow: none;
}

.add-btn {
  width: 60px !important;
  height: 40px !important;
  font-size: 12px !important;
  flex-shrink: 0;
  min-width: 60px !important;
}

.settings-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn {
  flex: 1;
  height: 40px;
  font-size: 14px;
}

.save-btn {
  flex: 1;
  height: 40px;
  font-size: 14px;
}

.fixed-item-tip {
  font-size: 12px;
  color: #999;
  font-style: italic;
}
</style>
