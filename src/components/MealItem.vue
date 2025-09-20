<template>
  <div class="meal-item">
    <div class="meal-name">{{ name }}</div>
    <div class="meal-input">
      <input
        v-model="localAmount"
        type="number"
        min="0"
        step="0.01"
        :placeholder="placeholder"
        @input="updateAmount"
        @blur="formatAmount"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  name: string
  amount: number
  placeholder?: string
}

interface Emits {
  (e: 'update:amount', value: number): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '0.00'
})

const emit = defineEmits<Emits>()

const localAmount = ref(props.amount.toString())

watch(() => props.amount, (newValue) => {
  localAmount.value = newValue.toString()
})

const updateAmount = () => {
  const value = parseFloat(localAmount.value) || 0
  // 确保不能输入负数
  const validValue = Math.max(0, value)
  emit('update:amount', validValue)
  // 如果输入了负数，自动修正显示
  if (value < 0) {
    localAmount.value = '0'
  }
}

const formatAmount = () => {
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
</script>
