<template>
  <div class="settings-container">
    <div class="header">
      <div class="back-button" @click="goBack">
        <van-icon name="arrow-left" />
      </div>
      <div class="title">设置</div>
    </div>
    
    <div class="settings-content">
      <div class="section">
        <div class="section-title">默认餐饮项目</div>
        <div class="section-desc">您可以自定义默认显示的餐饮项目</div>
        
        <div class="meal-items-list">
          <div 
            v-for="(item, index) in mealItems" 
            :key="index"
            class="meal-item-row"
            :draggable="true"
            @dragstart="onDragStart(index, $event)"
            @dragover="onDragOver($event)"
            @drop="onDrop(index, $event)"
            @dragend="onDragEnd($event)"
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
                @click="removeItem(index)"
              />
              <span v-else class="fixed-item-tip">固定项目</span>
            </div>
          </div>
        </div>
        
        <div class="add-item-btn" @click="addItem">
          <van-icon name="plus" />
          <span>添加项目</span>
        </div>
      </div>
    </div>
    
    <div class="action-buttons">
      <van-button type="default" @click="resetToDefault" class="reset-button">
        恢复默认
      </van-button>
      <van-button type="primary" @click="saveSettings" class="save-button">
        保存设置
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'
import { getDefaultMealItems, saveDefaultMealItems } from '../api/settings'

// 默认项目
const defaultItems = ['早饭', '午饭', '晚饭', '零食', '饮料']

// 当前项目列表
const mealItems = ref<Array<{name: string}>>([])

// 拖拽相关变量
const draggedIndex = ref<number | null>(null)
const draggedOverIndex = ref<number | null>(null)

// 返回上一页
const goBack = () => {
  window.history.back()
}

// 添加项目
const addItem = () => {
  mealItems.value.push({ name: '' })
}

// 删除项目（立即保存并同步）
const removeItem = async (index: number) => {
  // 前5个默认项目不能删除
  if (index < 5) {
    showToast('前5个默认项目不能删除')
    return
  }
  
  if (mealItems.value.length > 1) {
    mealItems.value.splice(index, 1)
    
    // 立即保存并同步
    try {
      // 保存所有项目，包括空名称的
      const allItems = mealItems.value.map(item => item.name.trim())
      
      // 检查是否有至少一个非空项目
      const validItems = allItems.filter(name => name.length > 0)
      if (validItems.length === 0) {
        showToast('至少保留一个项目')
        // 恢复删除的项目
        return
      }
      
      // 检查非空项目是否有重复
      const uniqueValidItems = [...new Set(validItems)]
      if (uniqueValidItems.length !== validItems.length) {
        showToast('项目名称不能重复')
        // 恢复删除的项目（这里不恢复，因为重复检查是在保存时）
      }
      
      // 立即保存到后端
      const response = await saveDefaultMealItems(allItems)
      
      if (response.success) {
        showToast('已删除并保存')
      } else {
        showToast(response.message || '保存失败')
        // 如果保存失败，可以考虑恢复删除的项目
      }
    } catch (error) {
      console.error('删除并保存失败:', error)
      showToast('保存失败，请重试')
    }
  } else {
    showToast('至少保留一个项目')
  }
}

// 拖拽开始
const onDragStart = (index: number, event: DragEvent) => {
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/html', '')
  }
  // 添加拖拽样式
  if (event.target) {
    (event.target as HTMLElement).classList.add('dragging')
  }
}

// 拖拽悬停
const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

// 拖拽放置
const onDrop = (targetIndex: number, event: DragEvent) => {
  event.preventDefault()
  
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) {
    return
  }
  
  // 移动项目
  const draggedItem = mealItems.value[draggedIndex.value]
  mealItems.value.splice(draggedIndex.value, 1)
  mealItems.value.splice(targetIndex, 0, draggedItem)
  
  draggedIndex.value = null
  draggedOverIndex.value = null
}

// 拖拽结束
const onDragEnd = (event: DragEvent) => {
  // 移除拖拽样式
  if (event.target) {
    (event.target as HTMLElement).classList.remove('dragging')
  }
  draggedIndex.value = null
  draggedOverIndex.value = null
}

// 恢复默认设置
const resetToDefault = () => {
  mealItems.value = defaultItems.map(name => ({ name }))
  showToast('已恢复默认设置')
}

// 保存设置
const saveSettings = async () => {
  try {
    // 保存所有项目，包括空名称的（用户可能稍后填写）
    const allItems = mealItems.value.map(item => item.name.trim())
    
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
    
    // 保存所有项目（包括空名称的）到后端
    const response = await saveDefaultMealItems(allItems)
    
    if (response.success) {
      showToast('设置保存成功')
      // 保存成功后返回上一页
      setTimeout(() => {
        window.history.back()
      }, 1000)
    } else {
      showToast(response.data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    showToast('保存失败，请重试')
  }
}

// 加载设置
const loadSettings = async () => {
  try {
    const response = await getDefaultMealItems()
    
    if (response.success && response.data && response.data.length > 0) {
      const items = response.data || defaultItems
      mealItems.value = items.map((name: string) => ({ name }))
    } else {
      // 如果获取失败，使用默认值
      mealItems.value = defaultItems.map(name => ({ name }))
    }
  } catch (error) {
    console.error('加载设置失败:', error)
    // 如果加载失败，使用默认值
    mealItems.value = defaultItems.map(name => ({ name }))
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  align-items: center;
  position: relative;
}

.back-button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  margin-right: 15px;
}

.title {
  font-size: 20px;
  font-weight: 600;
}

.settings-content {
  padding: 20px;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.section-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.meal-items-list {
  margin-bottom: 20px;
}

.meal-item-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: move;
  transition: all 0.2s ease;
  position: relative;
}

.meal-item-row:last-child {
  border-bottom: none;
}

.meal-item-row:hover {
  background-color: #f8f9fa;
}

.meal-item-row.dragging {
  opacity: 0.5;
  transform: rotate(2deg);
}

.drag-handle {
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

.drag-handle:hover {
  color: #667eea;
  background-color: #f0f0f0;
}

.drag-handle:active {
  cursor: grabbing;
}

.item-input {
  flex: 1;
  margin-right: 10px;
}

.item-actions {
  display: flex;
  align-items: center;
}

.delete-btn {
  color: #ff4757;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.delete-btn:hover {
  background-color: #ff475720;
}

.fixed-item-tip {
  font-size: 12px;
  color: #999;
  font-style: italic;
}

.add-item-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.add-item-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.add-item-btn .van-icon {
  margin-right: 8px;
  font-size: 16px;
}

.action-buttons {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 40px);
  max-width: 360px;
  display: flex;
  gap: 10px;
}

.van-button {
  flex: 1;
  height: 50px;
  font-size: 18px;
  border-radius: 25px;
}

.reset-button {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.save-button {
  background: #667eea;
  border: none;
}
</style>
