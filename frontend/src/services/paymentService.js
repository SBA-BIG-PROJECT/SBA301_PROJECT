import axios from 'axios'
import apiClient from './api'

// Since Payment API seems to be on /api/payments instead of /api/v1/payments
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
const PAYMENT_API_URL = API_BASE_URL.replace('/v1', '') + '/payments'

// For authenticated payment requests, we still need the token
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const paymentService = {
  createPremiumPayment: (data) => {
    return axios.post(`${PAYMENT_API_URL}/premium`, data, {
      headers: getAuthHeaders()
    })
  },

  handleWebhook: (data) => {
    return axios.post(`${PAYMENT_API_URL}/webhook`, data)
  },

  getPaymentByUser: (userId) => {
    return axios.get(`${PAYMENT_API_URL}/users/${userId}`, {
      headers: getAuthHeaders()
    })
  },

  getPaymentStatus: (orderCode) => {
    return axios.get(`${PAYMENT_API_URL}/${orderCode}/status`, {
      headers: getAuthHeaders()
    })
  }
}

export default paymentService
