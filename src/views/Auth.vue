<template>
  <div class="auth-page">
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>
    <div class="bg-shape shape-3"></div>

    <div class="auth-card">
      <div class="card-header">
        <div class="brand">
          <div class="brand-icon">🍽️</div>
          <div class="brand-text">
            <div class="brand-title">餐饮记账</div>
            <div class="brand-subtitle">轻盈、现代的饮食账本</div>
          </div>
        </div>
        <div class="welcome">
          <div class="welcome-title">欢迎回来</div>
          <div class="welcome-desc">记录每一餐，管理每一分</div>
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
                label="确认"
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
    // 注册成功后，清除所有旧的用户数据，避免数据串线
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // 清除所有日期相关的缓存数据
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('meal-record-') || key === 'selectedDate') {
        localStorage.removeItem(key)
      }
    })
    showToast('注册成功')
    activeTab.value = 'login'
    // 自动填充登录表单
    loginForm.value.username = reg.value.username
    loginForm.value.password = reg.value.password
  } else {
    showToast(res.message || '注册失败')
  }
}

const onLogin = async () => {
  const res = await login({ username: loginForm.value.username, password: loginForm.value.password })
  if (res.success && res.token) {
    // 登录前先清除所有旧的用户数据，确保使用新用户的数据
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // 清除所有日期相关的缓存数据
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('meal-record-') || key === 'selectedDate') {
        localStorage.removeItem(key)
      }
    })
    // 保存新的token和用户信息
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
.auth-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF8F0 0%, #FAFAFA 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 12px;
  box-sizing: border-box;
  width: 100%;
  max-width: 400px; /* 与主界面同宽 */
  margin: 0 auto;
}

.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.45;
}

.shape-1 {
  width: 320px;
  height: 320px;
  background: radial-gradient(circle at 30% 30%, #FF9A6C, #FF6B6B);
  top: -80px;
  left: -60px;
}

.shape-2 {
  width: 260px;
  height: 260px;
  background: radial-gradient(circle at 70% 70%, #34C759, #28A745);
  bottom: -120px;
  right: -40px;
}

.shape-3 {
  width: 180px;
  height: 180px;
  background: radial-gradient(circle at 50% 50%, #FFD9C2, #FFF3E8);
  top: 20%;
  right: 10%;
  opacity: 0.35;
}

.auth-card {
  position: relative;
  width: 100%;
  max-width: 360px; /* 保持与主界面视觉宽度一致 */
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  padding: 24px 18px 26px;
  animation: fadeUp 0.6s ease;
  z-index: 1;
  box-sizing: border-box;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: linear-gradient(135deg, #FF9A6C 0%, #FF6B6B 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  box-shadow: 0 10px 25px rgba(255, 107, 107, 0.28);
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.brand-title {
  font-size: 20px;
  font-weight: 600;
  color: #1F1F1F;
}

.brand-subtitle {
  font-size: 13px;
  color: #666;
}

.welcome {
  text-align: right;
}

.welcome-title {
  font-size: 16px;
  font-weight: 600;
  color: #1F1F1F;
}

.welcome-desc {
  font-size: 13px;
  color: #888;
  margin-top: 2px;
}

.auth-content {
  padding-top: 8px;
}

.auth-tabs {
  margin-bottom: 12px;
}

.auth-tabs :deep(.van-tabs__wrap) {
  border-bottom: 1px solid #f0f0f0;
}

.auth-tabs :deep(.van-tab) {
  font-size: 16px;
  font-weight: 500;
  color: #888;
}

.auth-tabs :deep(.van-tab--active) {
  color: #FF7F6B;
  font-weight: 600;
}

.auth-tabs :deep(.van-tabs__line) {
  background: linear-gradient(135deg, #FF9A6C 0%, #FF6B6B 100%);
  height: 3px;
  border-radius: 2px;
}

.auth-form {
  padding-top: 6px;
}

.auth-field {
  margin-bottom: 14px;
  background: #f8f8f8;
  border-radius: 12px;
  padding: 0 14px;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  border: 1px solid transparent;
}

.auth-field :deep(.van-cell) {
  background: transparent;
  padding: 12px 0;
}

.auth-field :deep(.van-field__label) {
  width: 60px;
  font-size: 15px;
  color: #333;
}

.auth-field :deep(.van-field__control) {
  font-size: 15px;
  color: #333;
}

.auth-field :deep(.van-field__placeholder) {
  font-size: 14px;
  color: #999;
}

.auth-field:focus-within {
  border: 1px solid rgba(255, 122, 104, 0.5);
  box-shadow: 0 10px 24px rgba(255, 122, 104, 0.18);
  transform: translateY(-1px);
}

.agree-row,
.auto-row {
  margin: 12px 0 20px;
  padding: 0 4px;
}

.agree-checkbox,
.auto-checkbox {
  font-size: 13px;
  color: #888;
  line-height: 1.4;
}

.agree-checkbox :deep(.van-checkbox__icon--checked .van-icon),
.auto-checkbox :deep(.van-checkbox__icon--checked .van-icon) {
  background-color: #FF7F6B;
  border-color: #FF7F6B;
  box-shadow: 0 8px 18px rgba(255, 122, 104, 0.32);
}

.agree-checkbox :deep(.van-checkbox__label),
.auto-checkbox :deep(.van-checkbox__label) {
  font-size: 13px;
}

.auth-button {
  height: 48px;
  font-size: 17px;
  font-weight: 600;
  background: linear-gradient(135deg, #FF9A6C 0%, #FF6B6B 100%);
  border: none;
  margin-top: 6px;
  border-radius: 12px;
  box-shadow: 0 14px 28px rgba(255, 122, 104, 0.25);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.auth-button:active {
  transform: translateY(0);
  box-shadow: 0 8px 18px rgba(255, 122, 104, 0.2);
}

.auth-button:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 18px 32px rgba(255, 122, 104, 0.3);
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 手机端适配 */
@media (max-width: 480px) {
  .auth-card {
    padding: 20px 14px 22px;
    width: 100%;
    max-width: 360px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .welcome {
    text-align: left;
  }

  .auth-tabs :deep(.van-tab) {
    font-size: 15px;
  }

  .auth-field :deep(.van-field__label) {
    width: 56px;
    font-size: 14px;
  }

  .auth-field :deep(.van-field__control) {
    font-size: 14px;
  }

  .auth-button {
    height: 44px;
    font-size: 15px;
  }
}
</style>

