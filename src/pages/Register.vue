<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message, Phone } from '@element-plus/icons-vue'
import { post } from '../api'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { checkAuth } = useAuth()

// 注册表单数据
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: ''
})

// 表单验证规则
const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass, trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const formRef = ref(null)
const loading = ref(false)

// 注册方法
const handleRegister = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      
      try {
        await post('/api/v1/users/register', {
          username: registerForm.username,
          password: registerForm.password,
          email: registerForm.email,
          phone: registerForm.phone
        })
        
        ElMessage.success('注册成功，请登录')
        router.push('/login')
      } catch (error) {
        console.error('注册出错:', error)
        // 错误处理已在 http.js 中完成
      } finally {
        loading.value = false
      }
    }
  })
}

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login')
}

// 页面加载时检查登录状态
onMounted(() => {
  // 如果已登录，则重定向到首页
  checkAuth(false)
})
</script>

<template>
  <div class="register-container bg-gray-900 min-h-screen flex items-center justify-center py-12">
    <div class="register-box bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md border border-gray-700">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-white">StockVision</h2>
        <div class="h-1 w-20 bg-gradient-to-r from-blue-600 to-indigo-800 mt-2 mx-auto"></div>
        <p class="text-gray-400 mt-4">创建您的账户</p>
      </div>
      
      <el-form 
        ref="formRef"
        :model="registerForm"
        :rules="rules"
        label-position="top"
      >
        <el-form-item prop="username" label="用户名">
          <el-input 
            v-model="registerForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password" label="密码">
          <el-input 
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item prop="confirmPassword" label="确认密码">
          <el-input 
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item prop="email" label="邮箱">
          <el-input 
            v-model="registerForm.email"
            placeholder="请输入邮箱"
            :prefix-icon="Message"
          />
        </el-form-item>
        
        <el-form-item prop="phone" label="手机号">
          <el-input 
            v-model="registerForm.phone"
            placeholder="请输入手机号"
            :prefix-icon="Phone"
          />
        </el-form-item>
        
        <el-button 
          type="primary" 
          class="w-full"
          :loading="loading"
          @click="handleRegister"
        >
          注册
        </el-button>
        
        <div class="text-center mt-6 text-gray-400">
          已有账户？
          <el-button type="text" class="text-blue-400 hover:text-blue-500" @click="goToLogin">
            立即登录
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.register-container {
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
</style> 