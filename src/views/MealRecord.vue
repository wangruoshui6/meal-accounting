<template>
  <div class="container">
    <!-- 头部 -->
    <div class="header">
      <div class="title">餐饮记账</div>
      <div class="date-section">
        <input 
          type="date" 
          v-model="dateInput"
          @change="onDateChange"
          class="date-input"
        />
        <div class="date-display">{{ currentDate }}</div>
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
        @update:amount="updateMealAmount(meal.key, $event)"
      />
    </div>

    <!-- 总计 -->
    <div class="total-section">
      <div class="total-item">
        <span class="total-label">总计</span>
        <span class="total-amount">¥{{ totalAmount.toFixed(2) }}</span>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="save-button">
      <van-button type="primary" @click="saveRecord">
        保存记录
      </van-button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { showToast } from 'vant'
import dayjs from 'dayjs'
import MealItem from '../components/MealItem.vue'
import { saveMealRecord, getMealRecord } from '../api/meal'

// 当前日期
const selectedDate = ref(dayjs())
const currentDate = ref(dayjs().format('YYYY年MM月DD日'))
const dateInput = ref(dayjs().format('YYYY-MM-DD'))

// 餐饮数据
const meals = ref([
  { key: 'breakfast', name: '早饭', amount: 0, placeholder: '0' },
  { key: 'lunch', name: '午饭', amount: 0, placeholder: '0' },
  { key: 'dinner', name: '晚饭', amount: 0, placeholder: '0' },
  { key: 'snack', name: '零食', amount: 0, placeholder: '0' },
  { key: 'drink', name: '饮料', amount: 0, placeholder: '0' },
  { key: 'other', name: '其他', amount: 0, placeholder: '0' }
])

// 计算总计
const totalAmount = computed(() => {
  return meals.value.reduce((sum, meal) => sum + meal.amount, 0)
})

// 更新餐饮金额
const updateMealAmount = (key: string, amount: number) => {
  const meal = meals.value.find(m => m.key === key)
  if (meal) {
    meal.amount = amount
  }
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
    const recordData = {
      recordDate: selectedDate.value.format('YYYY-MM-DD'),
      breakfast: meals.value.find(m => m.key === 'breakfast')?.amount || 0,
      lunch: meals.value.find(m => m.key === 'lunch')?.amount || 0,
      dinner: meals.value.find(m => m.key === 'dinner')?.amount || 0,
      snack: meals.value.find(m => m.key === 'snack')?.amount || 0,
      drink: meals.value.find(m => m.key === 'drink')?.amount || 0,
      other: meals.value.find(m => m.key === 'other')?.amount || 0
    }

    await saveMealRecord(recordData)
    showToast('保存成功！')
    
    // 清空数据
    meals.value.forEach(meal => {
      meal.amount = 0
    })
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
      // 从后端加载数据
      meals.value.forEach(meal => {
        switch (meal.key) {
          case 'breakfast':
            meal.amount = record.breakfast || 0
            break
          case 'lunch':
            meal.amount = record.lunch || 0
            break
          case 'dinner':
            meal.amount = record.dinner || 0
            break
          case 'snack':
            meal.amount = record.snack || 0
            break
          case 'drink':
            meal.amount = record.drink || 0
            break
          case 'other':
            meal.amount = record.other || 0
            break
        }
      })
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

// 页面加载时加载数据
loadData()
</script>
