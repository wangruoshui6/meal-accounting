<template>
  <div class="chat-container">
    <!-- 头部导航 -->
    <div class="chat-header">
      <div class="header-left">
        <van-icon name="arrow-left" @click="goBack" class="back-icon" />
      </div>
      <div class="header-center">
        <span class="header-title">AI 饮食助手</span>
      </div>
      <div class="header-right">
        <van-icon name="delete-o" @click="handleClearHistory" class="delete-icon" />
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="chat-messages" ref="messagesContainer">
      <!-- 欢迎消息 -->
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="welcome-icon">🤖</div>
        <div class="welcome-text">
          <h3>你好！我是你的 AI 饮食助手</h3>
          <p>我可以帮你：</p>
          <ul>
            <li>分析你的餐饮消费情况</li>
            <li>提供饮食健康建议</li>
            <li>回答关于记账的问题</li>
          </ul>
          <p class="welcome-tip">试试问我："帮我分析一下最近的饮食消费"</p>
        </div>
      </div>

      <!-- 消息列表 -->
      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['message-item', msg.role]"
      >
        <div class="message-avatar">
          <van-icon v-if="msg.role === 'user'" name="user-circle-o" />
          <span v-else class="ai-avatar">AI</span>
        </div>
        <div class="message-content">
          <div class="message-bubble">
            <div class="message-text" v-html="formatMessage(msg.content)"></div>
            <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
          </div>
        </div>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="message-item assistant">
        <div class="message-avatar">
          <span class="ai-avatar">AI</span>
        </div>
        <div class="message-content">
          <div class="message-bubble loading">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input-container">
      <div class="input-wrapper">
        <van-field
          v-model="inputMessage"
          placeholder="输入消息..."
          :disabled="loading"
          @keyup.enter="handleSendMessage"
          class="chat-input"
        />
        <van-button
          type="primary"
          :disabled="!inputMessage.trim() || loading"
          @click="handleSendMessage"
          class="send-button"
        >
          发送
        </van-button>
      </div>
      <div class="quick-actions">
        <van-button
          size="small"
          plain
          @click="sendQuickMessage('帮我分析一下最近的饮食消费')"
          :disabled="loading"
        >
          分析消费
        </van-button>
        <van-button
          size="small"
          plain
          @click="sendQuickMessage('给我一些饮食健康建议')"
          :disabled="loading"
        >
          健康建议
        </van-button>
        <van-button
          size="small"
          plain
          @click="sendQuickMessage('我最近的花销趋势如何？')"
          :disabled="loading"
        >
          花销趋势
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { sendChatMessage, clearChatHistory, getChatHistory, type ChatMessage } from '../api/chat'
import dayjs from 'dayjs'

const router = useRouter()

// 消息列表
const messages = ref<ChatMessage[]>([])
const inputMessage = ref('')
const loading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

// 返回上一页
const goBack = () => {
  router.back()
}

// 发送消息
const handleSendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || loading.value) {
    return
  }

  // 添加用户消息
  const userMessage: ChatMessage = {
    role: 'user',
    content: message,
    timestamp: new Date().toISOString()
  }
  messages.value.push(userMessage)
  inputMessage.value = ''

  // 滚动到底部
  scrollToBottom()

  // 发送请求
  loading.value = true
  try {
    const response = await sendChatMessage({
      message,
      includeContext: true
    })

    if (response.data.success && response.data.data.success) {
      // 添加 AI 回复
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.data.data.content,
        timestamp: new Date().toISOString()
      }
      messages.value.push(aiMessage)
    } else {
      showToast(response.data.data.error || 'AI 服务暂时不可用')
      // 移除刚才添加的用户消息（因为失败了）
      messages.value.pop()
    }
  } catch (error: any) {
    console.error('发送消息失败:', error)
    showToast(error.message || '发送失败，请稍后重试')
    // 移除刚才添加的用户消息（因为失败了）
    messages.value.pop()
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

// 快速发送消息
const sendQuickMessage = (message: string) => {
  inputMessage.value = message
  handleSendMessage()
}

// 清空对话历史
const handleClearHistory = async () => {
  try {
    await showConfirmDialog({
      title: '清空对话',
      message: '确定要清空所有对话记录吗？'
    })

    await clearChatHistory()
    messages.value = []
    showToast('对话历史已清空')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('清空历史失败:', error)
      showToast('清空失败')
    }
  }
}

// 格式化消息内容（支持换行）
const formatMessage = (content: string) => {
  if (!content) return ''
  // 将换行符转换为 <br>
  return content.replace(/\n/g, '<br>')
}

// 格式化时间
const formatTime = (timestamp?: string) => {
  if (!timestamp) return ''
  return dayjs(timestamp).format('HH:mm')
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 监听消息变化，自动滚动
watch(
  () => messages.value.length,
  () => {
    scrollToBottom()
  }
)

// 加载历史记录
const loadChatHistory = async () => {
  try {
    const response = await getChatHistory()
    if (response.data.success && response.data.data) {
      // 转换时间戳格式
      const historyMessages = response.data.data.map((msg: ChatMessage) => ({
        ...msg,
        timestamp: msg.timestamp || new Date().toISOString()
      }))
      messages.value = historyMessages
      console.log('加载历史记录成功，共', historyMessages.length, '条')
    }
  } catch (error: any) {
    // 如果是404或401，可能是第一次访问或未登录，不显示错误提示
    // 其他错误也静默处理，不影响使用
    if (error.response && error.response.status === 404) {
      console.log('暂无历史记录（首次访问）')
    } else if (error.response && error.response.status === 401) {
      console.log('用户未登录，无法加载历史记录')
    } else {
      console.error('加载历史记录失败:', error)
    }
    // 加载失败不影响使用，只记录日志，不显示错误提示
  }
}

onMounted(() => {
  loadChatHistory()
  scrollToBottom()
})
</script>

<style scoped lang="scss">
.chat-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: white;
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
  position: relative;
  padding-bottom: 70px; // 为底部导航栏留出空间
}

.chat-header {
  background: linear-gradient(135deg, #FF9A6C 0%, #FF6B6B 100%);
  color: white;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .header-left,
  .header-right {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .header-center {
    flex: 1;
    text-align: center;
  }

  .header-title {
    font-size: 18px;
    font-weight: bold;
    color: white;
  }

  .back-icon,
  .delete-icon {
    font-size: 20px;
    color: white;
    cursor: pointer;
    padding: 5px;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }

    &:active {
      opacity: 0.6;
    }
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: 100px; // 为输入框留出空间
  background: white;
}

.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;

  .welcome-icon {
    font-size: 64px;
    margin-bottom: 20px;
  }

  .welcome-text {
    max-width: 300px;

    h3 {
      font-size: 18px;
      color: #323233;
      margin-bottom: 16px;
    }

    p {
      font-size: 14px;
      color: #646566;
      margin-bottom: 8px;
      text-align: left;
    }

    ul {
      text-align: left;
      margin: 12px 0;
      padding-left: 20px;
      color: #646566;
      font-size: 14px;

      li {
        margin-bottom: 8px;
      }
    }

    .welcome-tip {
      margin-top: 20px;
      padding: 12px;
      background: #e8f4ff;
      border-radius: 8px;
      color: #1989fa;
      font-size: 13px;
    }
  }
}

.message-item {
  display: flex;
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease-in;

  &.user {
    flex-direction: row-reverse;

    .message-content {
      align-items: flex-end;
    }

    .message-bubble {
      background: #1989fa;
      color: white;
      border-radius: 12px 12px 2px 12px;
    }
  }

  &.assistant {
    .message-bubble {
      background: white;
      color: #323233;
      border-radius: 12px 12px 12px 2px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
  }
}

.message-avatar {
  width: 36px;
  height: 36px;
  margin: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .van-icon {
    font-size: 36px;
    color: #969799;
  }

  .ai-avatar {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #FF9A6C 0%, #FF6B6B 100%);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
  }
}

.message-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 75%;
  min-width: 0; // 允许 flex 收缩
}

.message-bubble {
  padding: 12px 16px;
  word-wrap: break-word;
  word-break: break-word;

  .message-text {
    font-size: 15px;
    line-height: 1.5;
    margin-bottom: 4px;
  }

  .message-time {
    font-size: 11px;
    opacity: 0.7;
    margin-top: 4px;
  }

  &.loading {
    padding: 16px;
  }
}

.typing-indicator {
  display: flex;
  gap: 4px;

  span {
    width: 8px;
    height: 8px;
    background: #969799;
    border-radius: 50%;
    animation: typing 1.4s infinite;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-input-container {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 400px;
  background: white;
  border-top: 1px solid #ebedf0;
  padding: 8px 16px;
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;

  .chat-input {
    flex: 1;
    background: #f7f8fa;
    border-radius: 20px;
  }

  .send-button {
    flex-shrink: 0;
    border-radius: 20px;
    padding: 0 20px;
    background: linear-gradient(135deg, #FF9A6C 0%, #FF6B6B 100%);
    border: none;
  }
}

.quick-actions {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;

  .van-button {
    flex-shrink: 0;
    border-radius: 16px;
    font-size: 12px;
  }
}

// 滚动条样式
.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #bbb;
}

// 移动端适配
@media (max-width: 480px) {
  .chat-container {
    max-width: 100%;
  }
  
  .chat-input-container {
    max-width: 100%;
    left: 0;
    transform: none;
  }
  
  .welcome-text {
    max-width: 100% !important;
    padding: 0 10px;
  }
  
  .message-content {
    max-width: 80%;
  }
}
</style>

