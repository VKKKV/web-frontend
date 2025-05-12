<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

const { logout } = useAuth()

interface User {
  username: string
  email: string
  phone: string
}

interface PasswordForm {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}
const router = useRouter()
const { checkAuth, userId: authUserId } = useAuth()

// 用户信息状态
const userInfo = ref<User>({
  username: '',
  email: '',
  phone: '',
})
const loading = ref(true)
const error = ref('')

// 密码修改相关
const passwordFormRef = ref<FormInstance>()
const passwordForm = ref<PasswordForm>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 表单验证规则
const passwordRules = ref<FormRules>({
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
  ],
  confirmPassword: [
    { validator: (rule, value, callback) => {
      if (value !== passwordForm.value.newPassword) {
        callback(new Error('两次输入密码不一致'))
      }
      else {
        callback()
      }
    }, trigger: 'blur' },
  ],
})

// 获取用户信息
async function fetchUserInfo() {
  loading.value = true
  error.value = ''

  try {
    if (!authUserId.value) {
      throw new Error('未登录')
    }

    const response = await axios.get(`/api/v1/users/${authUserId.value}`)
    if (response.data.code === 200) {
      userInfo.value = response.data.data
    }
    else {
      throw new Error(response.data.message || '获取用户信息失败')
    }
  }
  catch (err: any) {
    console.error('获取用户信息出错:', err)
    error.value = err.message

    if (err.message === '未登录') {
      ElMessage.warning('请先登录')
      router.push('/login')
    }
    else {
      ElMessage.error(err.response?.data?.message || '获取用户信息失败')
    }
  }
  finally {
    loading.value = false
  }
}

// 修改密码
async function handleUpdatePassword(formEl: FormInstance | undefined) {
  if (!formEl)
    return

  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        await ElMessageBox.confirm('确定要修改密码吗？', '安全验证', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })

        if (!authUserId.value) {
          throw new Error('未登录')
        }

        const response = await axios.put('/api/v1/users/update-password', {
          userId: Number.parseInt(authUserId.value),
          oldPassword: passwordForm.value.oldPassword,
          newPassword: passwordForm.value.newPassword,
        })

        if (response.data.code === 200) {
          ElMessage.success('密码修改成功')
          // passwordFormRef.value?.resetFields()
          logout()
        }
        else {
          throw new Error(response.data.message || '修改密码失败')
        }
      }
      catch (err: any) {
        console.error('修改密码出错:', err)

        if (err.message === '未登录') {
          ElMessage.warning('请先登录')
          router.push('/login')
        }
        else {
          ElMessage.error(err.response?.data?.message || '修改密码失败')
        }
      }
    }
  })
}

// 添加自动刷新功能
let refreshTimer: number | null = null

function startAutoRefresh() {
  // 每5分钟刷新一次用户信息
  refreshTimer = window.setInterval(() => {
    if (checkAuth()) {
      fetchUserInfo()
    }
  }, 5 * 60 * 1000)
}

onMounted(() => {
  // 检查是否已登录
  if (checkAuth()) {
    fetchUserInfo()
    startAutoRefresh()
  }
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<template>
  <div class="account-container">
    <el-card v-loading="loading" class="mx-auto max-w-2xl">
      <template #header>
        <div class="card-header">
          <span class="text-xl font-bold">账户信息</span>
          <el-tag type="success" effect="dark">
            已认证
          </el-tag>
        </div>
      </template>

      <!-- 错误提示 -->
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        class="mb-4"
      />

      <el-descriptions border :column="1" class="user-info">
        <el-descriptions-item label="用户名">
          {{ userInfo.username }}
        </el-descriptions-item>
        <el-descriptions-item label="邮箱">
          {{ userInfo.email }}
        </el-descriptions-item>
        <el-descriptions-item label="手机号">
          {{ userInfo.phone }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider border-style="dashed" />

      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="120px"
        class="password-form"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            show-password
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            @click="handleUpdatePassword(passwordFormRef)"
          >
            修改密码
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.account-container {
  padding: 20px;
}
</style>
