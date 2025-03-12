<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { post } from '../api'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { setLoginInfo, redirectAfterLogin, checkAuth } = useAuth()

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
}

const formRef = ref(null)
const loading = ref(false)

// 登录方法
const handleLogin = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      
      try {
        const result = await post('/api/v1/users/login', {
          username: loginForm.username,
          password: loginForm.password
        })
        
        // 保存登录信息
        setLoginInfo(
          result.data.token,
          result.data.userId,
          result.data.username
        )
        
        ElMessage.success('登录成功')
        
        // 跳转到上次访问的页面或首页
        redirectAfterLogin()
      } catch (error) {
        console.error('登录出错:', error)
        // 错误处理已在 http.js 中完成
      } finally {
        loading.value = false
      }
    }
  })
}

// 跳转到注册页面
const goToRegister = () => {
  router.push('/register')
}

// 页面加载时检查登录状态
onMounted(() => {
  // 如果已登录，则重定向到首页
  checkAuth(false)
})
</script>

<template>
  <div class="login-container bg-gray-900 min-h-screen flex items-center justify-center">
    <div class="login-box bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md border border-gray-700">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-white">StockVision</h2>
        <div class="h-1 w-20 bg-gradient-to-r from-blue-600 to-indigo-800 mt-2 mx-auto"></div>
        <p class="text-gray-400 mt-4">登录您的账户</p>
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
        
        <div class="flex justify-between items-center mb-6">
          <el-checkbox label="记住我" />
          <el-button type="text" class="text-blue-400 hover:text-blue-500">忘记密码？</el-button>
        </div>
        
        <el-button 
          type="primary" 
          class="w-full"
          :loading="loading"
          @click="handleLogin"
        >
          登录
        </el-button>
        
        <div class="text-center mt-6 text-gray-400">
          还没有账户？
          <el-button type="text" class="text-blue-400 hover:text-blue-500" @click="goToRegister">
            立即注册
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  background-image: linear-gradient(to right bottom, rgba(17, 24, 39, 0.95), rgba(17, 24, 39, 0.95)), 
                    url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1470&auto=format&fit=crop');
  background-size: cover;
  background-position: center;
}

:deep(.el-form-item__label) {
  color: #e2e8f0;
}

:deep(.el-input__wrapper) {
  background-color: #2d3748;
  border-color: #4a5568;
}

:deep(.el-input__inner) {
  color: #f7fafc;
}

:deep(.el-checkbox__label) {
  color: #e2e8f0;
}
</style> 