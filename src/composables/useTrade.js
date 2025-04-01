// composables/useTrade.js
import { ref } from 'vue'
import request from '../utils/request'

export function useTrade() {
  const loading = ref(false)

  const submitOrder = async (orderData) => {
    try {
      return await request.post('/trade/order', orderData)
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
    submitOrder,
  }
}
