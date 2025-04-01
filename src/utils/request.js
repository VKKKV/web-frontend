// 新建 utils/request.js
import axios from 'axios'

const service = axios.create({
  baseURL: '/api/v1/',
  timeout: 10000,
})

service.interceptors.response.use(
  (response) => {
    if (response.data?.code === 200) {
      return response.data.data
    }
    return Promise.reject(response.data?.message || 'Error')
  },
  (error) => {
    return Promise.reject(error)
  },
)

export default service
