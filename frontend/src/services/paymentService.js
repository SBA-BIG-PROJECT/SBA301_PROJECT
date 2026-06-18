import apiClient from './api'

const paymentService = {
  // POST /api/v1/payments/premium
  // Backend uses @AuthenticationPrincipal to get userId from JWT token
  // Body: { plan: 'MONTHLY' | 'YEARLY' }
  createPremiumPayment: (plan) => {
    return apiClient.post('/payments/premium', { plan })
  },

  // GET /api/v1/payments/users/{userId}
  getPaymentByUser: (userId) => {
    return apiClient.get(`/payments/users/${userId}`)
  },

  // GET /api/v1/payments/{orderCode}/status
  getPaymentStatus: (orderCode) => {
    return apiClient.get(`/payments/${orderCode}/status`)
  }
}

export default paymentService
