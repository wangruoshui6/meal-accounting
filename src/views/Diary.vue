<template>
  <div class="diary-container">
    <!-- 头部导航 -->
    <div class="header">
      <div class="header-left">
        <van-icon name="arrow-left" @click="goBack" class="back-icon" />
      </div>
      <div class="header-center">
        <span class="header-title">日记</span>
      </div>
      <div class="header-right">
        <button @click="saveDiaryData" class="save-btn">保存</button>
      </div>
    </div>

    <!-- 日记内容 -->
    <div class="diary-content">
      <div class="date-info">
        <div class="date-text">{{ selectedDateDisplay }}</div>
        <div class="diary-title">饮食体验</div>
      </div>
      
      <div class="diary-editor">
        <textarea 
          v-model="diaryContent"
          :placeholder="diaryPlaceholder"
          class="diary-textarea"
          @input="onContentChange"
        ></textarea>
      </div>
    </div>

    <!-- 底部工具栏 -->
    <div class="diary-footer">
      <div class="privacy-info">
        <van-icon name="info-o" class="info-icon" />
        <span>日记是私密内容，仅自己可知</span>
      </div>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import dayjs from 'dayjs'
import { showToast } from 'vant'
import { saveDiary, getDiaryContent } from '../api/diary'

const router = useRouter()
const route = useRoute()

// 选中的日期和项目
const selectedDate = ref(dayjs())
const selectedItem = ref('')

// 日记内容
const diaryContent = ref('')

// 计算属性
const selectedDateDisplay = computed(() => {
  const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const dayName = dayNames[selectedDate.value.day()]
  return `${dayName} ${selectedDate.value.format('YYYY年MM月DD日')}`
})

const diaryPlaceholder = computed(() => {
  if (selectedItem.value) {
    return `记录${selectedItem.value}的详细信息...`
  }
  return '在此输入内容'
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 内容变化处理
const onContentChange = () => {
  // 可以在这里添加自动保存逻辑
}

// 保存日记
const saveDiaryData = async () => {
  if (!diaryContent.value.trim()) {
    showToast('请输入日记内容')
    return
  }
  
  try {
    const response = await saveDiary({
      itemName: selectedItem.value,
      content: diaryContent.value,
      date: selectedDate.value.format('YYYY-MM-DD')
    })
    
    if (response.data.success) {
      showToast('保存成功')
      router.back()
    } else {
      showToast(response.data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    showToast('保存失败')
  }
}

// 加载现有日记内容
const loadExistingDiary = async () => {
  if (!selectedItem.value) return
  
  try {
    const response = await getDiaryContent(
      selectedItem.value,
      selectedDate.value.format('YYYY-MM-DD')
    )
    
    if (response.data.success) {
      diaryContent.value = response.data.data || ''
    }
  } catch (error) {
    console.error('加载日记内容失败:', error)
  }
}

onMounted(async () => {
  // 从路由参数获取日期和项目信息
  if (route.query.date) {
    // 确保日期格式正确，移除可能的多余字符
    const dateStr = (route.query.date as string).split(':')[0] // 移除:1这样的后缀
    selectedDate.value = dayjs(dateStr)
  }
  if (route.query.item) {
    selectedItem.value = route.query.item as string
  }
  
  // 加载现有日记内容
  await loadExistingDiary()
})
</script>

<style scoped>
.diary-container {
  max-width: 400px;
  margin: 0 auto;
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* 头部 */
.header {
  background: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
}

.header-left, .header-right {
  flex: 0 0 auto;
}

.header-center {
  flex: 1;
  text-align: center;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.back-icon {
  font-size: 20px;
  color: #666;
  cursor: pointer;
}

.save-btn {
  background: none;
  border: none;
  color: #333;
  font-size: 16px;
  cursor: pointer;
}

/* 日记内容 */
.diary-content {
  flex: 1;
  background: white;
  padding: 20px;
}

.date-info {
  margin-bottom: 24px;
}

.date-text {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.diary-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.diary-editor {
  flex: 1;
}

.diary-textarea {
  width: 100%;
  min-height: 400px;
  border: none;
  outline: none;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  background: transparent;
  resize: none;
  font-family: inherit;
}

.diary-textarea::placeholder {
  color: #999;
}

/* 底部工具栏 */
.diary-footer {
  background: white;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.privacy-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #666;
}

.info-icon {
  font-size: 16px;
}

.toolbar {
  display: flex;
  gap: 24px;
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.tool-icon {
  font-size: 20px;
  color: #666;
}

.tool-item span {
  font-size: 12px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .diary-container {
    max-width: 100%;
  }
  
  .header {
    padding: 12px 16px;
  }
  
  .diary-content {
    padding: 16px;
  }
  
  .diary-textarea {
    min-height: 300px;
  }
}
</style>
