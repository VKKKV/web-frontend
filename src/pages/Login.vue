<script setup>
import { Lock, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { get, post } from '../api'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { setLoginInfo, redirectAfterLogin, updateUserFullInfo } = useAuth()

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ],
}

const formRef = ref(null)
const loading = ref(false)

// 登录方法
async function handleLogin() {
  if (!formRef.value)
    return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true

      try {
        const result = await post('/api/v1/users/login', {
          username: loginForm.username,
          password: loginForm.password,
        })

        // 保存登录基本信息 (token, userId, username)
        setLoginInfo(
          result.data.token,
          result.data.userId,
          result.data.username,
        )

        // 获取完整的用户信息，包括余额
        try {
          const userInfoResult = await get(`/api/v1/users/${result.data.userId}`)
          if (userInfoResult.code === 200) {
            updateUserFullInfo(userInfoResult.data) // 更新全局用户信息，包括余额
          }
        }
        catch (fetchError) {
          console.error('获取用户信息失败:', fetchError)
          // 即使获取详细信息失败，登录本身也算成功了，可以仅记录错误
          ElMessage.warning('登录成功，但获取详细信息失败，部分功能可能受限')
        }

        ElMessage.success('登录成功')

        // 跳转到上次访问的页面或首页
        // redirectAfterLogin()
        redirectAfterLogin()
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
      catch (error) {
        console.error('登录出错:', error)
        // 错误处理已在 http.js 中完成
      }
      finally {
        loading.value = false
      }
    }
  })
}

// 跳转到注册页面
function goToRegister() {
  router.push('/register')
}
</script>

<template>
  <div class="login-container min-h-screen flex items-center justify-center">
    <div class="login-box max-w-md w-full border border-gray-700 rounded-lg p-8 shadow-xl">
      <div class="mb-8 text-center">
        <h2 class="text-3xl font-bold">
          StockVision
        </h2>
        <div class="mx-auto mt-2 h-1 w-20 from-blue-600 to-indigo-800 bg-gradient-to-r" />
        <p class="mt-4 text-gray-400">
          登录您的账户
        </p>
      </div>

      <el-form
        ref="formRef"
        :model="loginForm"
        :rules="rules"
        label-position="top"
      >
        <el-form-item prop="username" label="用户名">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password" label="密码">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-button
          type="primary"
          class="w-full"
          :loading="loading"
          @click="handleLogin"
        >
          登录
        </el-button>

        <div class="mt-6 text-center text-gray-400">
          还没有账户？
          <el-button type="text" class="text-blue-400 hover:text-blue-500" @click="goToRegister">
            立即注册
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>
