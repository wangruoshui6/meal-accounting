<template>
  <div class="meal-item">
    <div class="meal-row">
      <div class="meal-name">{{ name }}</div>
      <div class="meal-input">
        <input
          ref="inputRef"
          v-model="localAmount"
          type="number"
          min="0"
          step="0.01"
          :placeholder="placeholder"
          @input="updateAmount"
          @blur="formatAmount"
          @focus="onFocus"
          @click="onClick"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'

interface Props {
  name: string
  amount: number
  placeholder?: string
  type?: 'number' | 'text'
  description?: string
  itemKey?: string
}

interface Emits {
  (e: 'update:amount', value: number): void
  (e: 'update:description', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  type: 'number',
  description: '',
  itemKey: ''
})

const emit = defineEmits<Emits>()


const localAmount = ref(props.amount.toString())
const inputRef = ref<HTMLInputElement>()
const isFocused = ref(false)

watch(() => props.amount, (newValue) => {
  // 只有在没有聚焦时才更新显示值
  if (!isFocused.value) {
    localAmount.value = newValue.toString()
  }
})


// 点击输入框时的处理
const onClick = () => {
  // 如果当前值是0，清空输入框
  if (localAmount.value === '0' || localAmount.value === '0.00') {
    localAmount.value = ''
    // 确保输入框获得焦点并选中所有文本
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.focus()
        inputRef.value.select()
      }
    })
  }
}

// 获得焦点时的处理
const onFocus = () => {
  isFocused.value = true
  // 如果当前值是0，清空输入框
  if (localAmount.value === '0' || localAmount.value === '0.00') {
    localAmount.value = ''
  }
}

const updateAmount = () => {
  const value = parseFloat(localAmount.value) || 0
  // 确保不能输入负数
  const validValue = Math.max(0, value)
  emit('update:amount', validValue)
  // 如果输入了负数，自动修正显示
  if (value < 0) {
    localAmount.value = '0'
  }
  // 确保在输入时也更新本地状态
  localAmount.value = validValue.toString()
}

const formatAmount = () => {
  isFocused.value = false
  const value = parseFloat(localAmount.value) || 0
  // 确保不会显示负数
  const validValue = Math.max(0, value)
  
  // 如果输入的是整数，不显示小数点
  if (validValue === 0) {
    localAmount.value = '0'
  } else if (Number.isInteger(validValue)) {
    localAmount.value = validValue.toString()
  } else {
    localAmount.value = validValue.toFixed(2)
  }
}

// 更新描述（保留接口兼容性）
const updateDescription = () => {
  emit('update:description', '')
}

</script>
