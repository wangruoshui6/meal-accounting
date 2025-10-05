<template>
  <div class="container">
    <div class="header">
      <div class="header-center">
        <div class="title">餐饮记账</div>
        <div class="app-subtitle">记录每一餐，管理每一分</div>
      </div>
    </div>
    
    <div class="auth-content">
      <van-tabs v-model:active="activeTab" class="auth-tabs">
        <van-tab title="注册" name="register">
          <van-form @submit="onRegister" class="auth-form">
            <van-field
              v-model="reg.username"
              label="账号"
              placeholder="1~6位中文"
              :rules="[
                { required: true, message: '请填写账号' },
                { validator: validateChineseName, message: '仅允许1~6个中文汉字' }
              ]"
              class="auth-field"
            />
            <van-field
              v-model="reg.password"
              type="password"
              label="密码"
              placeholder="6~20位字母数字"
              :rules="[
                { required: true, message: '请填写密码' },
                { validator: validatePassword, message: '6~20位，字母/数字/特殊字符' }
              ]"
              class="auth-field"
            />
            <van-field
              v-model="reg.confirm"
              type="password"
              label="确认密码"
              placeholder="再次输入密码"
              :rules="[
                { required: true, message: '请再次输入密码' },
                { validator: validateConfirm, message: '两次输入不一致' }
              ]"
              class="auth-field"
            />
            <div class="agree-row">
              <van-checkbox v-model="agree" class="agree-checkbox">我已阅读并同意《用户协议》《隐私协议》</van-checkbox>
            </div>
            <van-button round block type="primary" native-type="submit" class="auth-button">注册</van-button>
          </van-form>
        </van-tab>
        <van-tab title="登录" name="login">
          <van-form @submit="onLogin" class="auth-form">
            <van-field
              v-model="loginForm.username"
              label="账号"
              placeholder="请输入您的账号"
              :rules="[{ required: true, message: '请填写账号' }]"
              class="auth-field"
            />
            <van-field
              v-model="loginForm.password"
              type="password"
              label="密码"
              placeholder="请输入您的密码"
              :rules="[{ required: true, message: '请填写密码' }]"
              class="auth-field"
            />
            <div class="auto-row">
              <van-checkbox v-model="autoLogin" class="auto-checkbox">下次自动登录</van-checkbox>
            </div>
            <van-button round block type="primary" native-type="submit" class="auth-button">登录</van-button>
          </van-form>
        </van-tab>
      </van-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { login, register } from '../api/auth'

const router = useRouter()
const activeTab = ref<'register' | 'login'>('register')

const reg = ref({ username: '', password: '', confirm: '' })
const agree = ref(true)

const loginForm = ref({ username: '', password: '' })
const autoLogin = ref(true)

// 仅允许1~6位中文汉字
const validateChineseName = (val?: string) => {
  const v = val || ''
  return /^[\u4e00-\u9fa5]{1,6}$/.test(v)
}

// 6~20位：字母/数字/特殊字符
const validatePassword = (val?: string) => {
  const v = val || ''
  return /^[A-Za-z0-9\W_]{6,20}$/.test(v)
}

const validateConfirm = () => reg.value.password === reg.value.confirm

const onRegister = async () => {
  if (!agree.value) {
    showToast('请先同意协议')
    return
  }
  const res = await register({ username: reg.value.username, password: reg.value.password })
  if (res.success) {
    showToast('注册成功')
    activeTab.value = 'login'
  } else {
    showToast(res.message || '注册失败')
  }
}

const onLogin = async () => {
  const res = await login({ username: loginForm.value.username, password: loginForm.value.password })
  if (res.success && res.token) {
    localStorage.setItem('token', res.token)
    if (res.user) localStorage.setItem('user', JSON.stringify(res.user))
    showToast('登录成功')
    router.replace('/')
  } else {
    showToast(res.message || '登录失败')
  }
}
</script>

<style scoped>
.app-subtitle {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
}

.auth-content {
  padding: 20px;
}

.auth-tabs {
  margin-bottom: 20px;
}

.auth-tabs :deep(.van-tabs__wrap) {
  border-bottom: 1px solid #f0f0f0;
}

.auth-tabs :deep(.van-tab) {
  font-size: 16px;
  font-weight: 500;
}

.auth-tabs :deep(.van-tabs__line) {
  background: #667eea;
  height: 3px;
  border-radius: 2px;
}

.auth-form {
  padding-top: 10px;
}

.auth-field {
  margin-bottom: 16px;
}

.auth-field :deep(.van-field__label) {
  width: 60px;
  font-size: 15px;
  color: #333;
}

.auth-field :deep(.van-field__control) {
  font-size: 15px;
}

.auth-field :deep(.van-field__placeholder) {
  font-size: 14px;
  color: #999;
}

.agree-row, .auto-row {
  margin: 20px 0 24px;
  padding: 0 4px;
}

.agree-checkbox, .auto-checkbox {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.agree-checkbox :deep(.van-checkbox__label), 
.auto-checkbox :deep(.van-checkbox__label) {
  font-size: 13px;
}

.auth-button {
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  margin-top: 8px;
}

.auth-button:active {
  opacity: 0.8;
}

/* 手机端适配 */
@media (max-width: 480px) {
  .auth-content {
    padding: 16px;
  }
  
  .app-subtitle {
    font-size: 13px;
  }
  
  .auth-field :deep(.van-field__label) {
    width: 50px;
    font-size: 14px;
  }
  
  .auth-field :deep(.van-field__control) {
    font-size: 14px;
  }
  
  .auth-button {
    height: 44px;
    font-size: 15px;
  }
  
  .agree-checkbox, .auto-checkbox {
    font-size: 12px;
  }
}
</style>

