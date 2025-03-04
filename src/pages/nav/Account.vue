<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

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

// 用户信息状态
const userInfo = ref<User>({
  username: '',
  email: '',
  phone: ''
})
const loading = ref(false)
// const loading = ref(true)
const error = ref('')

// 密码修改相关
const passwordFormRef = ref<FormInstance>()
const passwordForm = ref<PasswordForm>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 表单验证规则
const passwordRules = ref<FormRules>({
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少8位', trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: (rule, value, callback) => {
      if (value !== passwordForm.value.newPassword) {
        callback(new Error('两次输入密码不一致'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ]
})

// 获取用户信息
// const fetchUserInfo = async () => {
//   try {
//     const token = localStorage.getItem('token')
//     const userId = localStorage.getItem('userId')
    
//     const response = await fetch(`/api/v1/users/${userId}`, {
//       headers: {
//         'Authorization': `Bearer ${token}`
//       }
//     })
    
//     if (!response.ok) throw new Error('获取信息失败')
    
//     const data = await response.json()
//     userInfo.value = data.data
//   } catch (err) {
//     error.value = err.message
//     ElMessage.error('获取用户信息失败')
//   } finally {
//     loading.value = false
//   }
// }

// 修改密码
const handleUpdatePassword = async (formEl: FormInstance | undefined) => {
  if (!formEl) return

  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        await ElMessageBox.confirm('确定要修改密码吗？', '安全验证', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        const response = await fetch('/api/v1/users/update-password', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            old_password: passwordForm.value.oldPassword,
            new_password: passwordForm.value.newPassword
          })
        })

        if (!response.ok) throw new Error('密码修改失败')
        
        ElMessage.success('密码修改成功')
        passwordFormRef.value?.resetFields()
      } catch (err) {
        ElMessage.error(err.message)
      }
    }
  })
}

// onMounted(() => {
//   if (localStorage.getItem('token')) {
//     fetchUserInfo()
//   } else {
//     ElMessage.warning('请先登录')
//     // 这里可以跳转到登录页面
//   }
// })
</script>

<template>
  <div class="account-container">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span class="text-xl">账户信息</span>
          <el-tag type="success" effect="dark">已认证</el-tag>
        </div>
      </template>

      <el-descriptions border :column="1">
        <el-descriptions-item label="用户名">{{ userInfo.username }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ userInfo.email }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ userInfo.phone }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />

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
            placeholder="请输入原密码"
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            show-password
            placeholder="8位以上字母数字组合"
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入新密码"
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
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.password-form {
  margin-top: 30px;
  max-width: 600px;
}
</style>