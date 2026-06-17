import api from './api';

const adminService = {
  // === Dashboard Analytics ===
  getDashboardStats: async () => {
    const response = await api.get('/admin/analytics/dashboard');
    return response.data;
  },
  
  getMovieAnalytics: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/admin/analytics/movies', { params });
    return response.data;
  },
  
  getRevenueAnalytics: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/admin/analytics/revenue', { params });
    return response.data;
  },

  // === User Management ===
  getAllUsers: async (page = 0, size = 20, search, role, isPremium) => {
    const params = { page, size };
    if (search) params.search = search;
    if (role) params.role = role;
    if (isPremium !== undefined) params.isPremium = isPremium;
    
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  
  getUserDetail: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },
  
  updateUser: async (userId, data) => {
    const response = await api.put(`/admin/users/${userId}`, data);
    return response.data;
  },
  
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },
  
  // API doc: PUT /api/v1/admin/users/{userId}/role
  changeUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  // API doc: DELETE /admin/users/{userId}/premium
  revokePremium: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}/premium`);
    return response.data;
  },

  // === Movie Management ===
  getAllMovies: async (page = 0, size = 20, search, isActive) => {
    const params = { page, size };
    if (search) params.search = search;
    if (isActive !== undefined) params.isActive = isActive;
    
    const response = await api.get('/admin/movies', { params });
    return response.data;
  },
  
  getMovieDetail: async (tmdbId) => {
    const response = await api.get(`/admin/movies/${tmdbId}`);
    return response.data;
  },
  
  createMovie: async (data) => {
    const response = await api.post('/admin/movies', data);
    return response.data;
  },
  
  updateMovie: async (tmdbId, data) => {
    const response = await api.put(`/admin/movies/${tmdbId}`, data);
    return response.data;
  },
  
  deleteMovie: async (tmdbId) => {
    const response = await api.delete(`/admin/movies/${tmdbId}`);
    return response.data;
  },
  
  restoreMovie: async (tmdbId) => {
    const response = await api.post(`/admin/movies/${tmdbId}/restore`);
    return response.data;
  },

  updateMovieGenres: async (tmdbId, genreIds) => {
    const response = await api.put(`/admin/movies/${tmdbId}/genres`, { genreIds });
    return response.data;
  },

  updateMovieCategories: async (tmdbId, categoryIds) => {
    const response = await api.put(`/admin/movies/${tmdbId}/categories`, { categoryIds });
    return response.data;
  },

  // === Payment Management ===
  getAllPayments: async (page = 0, size = 20, status, userId, planType) => {
    const params = { page, size };
    if (status) params.status = status;
    if (userId) params.userId = userId;
    if (planType) params.planType = planType;
    
    const response = await api.get('/admin/payments', { params });
    return response.data;
  },
  
  getPaymentDetail: async (paymentId) => {
    const response = await api.get(`/admin/payments/${paymentId}`);
    return response.data;
  },
  
  // API doc: PUT /api/v1/admin/payments/{paymentId}/status
  updatePaymentStatus: async (paymentId, status) => {
    const response = await api.put(`/admin/payments/${paymentId}/status`, { status });
    return response.data;
  },

  // === Genre & Category Management ===
  getAllGenres: async () => {
    const response = await api.get('/admin/genres');
    return response.data;
  },

  createGenre: async (genreId, name) => {
    const response = await api.post('/admin/genres', { genreId, name });
    return response.data;
  },

  updateGenre: async (genreId, newName) => {
    const response = await api.put(`/admin/genres/${genreId}`, null, { params: { newName } });
    return response.data;
  },

  deleteGenre: async (genreId) => {
    const response = await api.delete(`/admin/genres/${genreId}`);
    return response.data;
  },

  getAllCategories: async () => {
    const response = await api.get('/admin/categories');
    return response.data;
  },

  createCategory: async (categoryId, name) => {
    const response = await api.post('/admin/categories', { categoryId, name });
    return response.data;
  },

  updateCategory: async (categoryId, newName) => {
    const response = await api.put(`/admin/categories/${categoryId}`, null, { params: { newName } });
    return response.data;
  },

  deleteCategory: async (categoryId) => {
    const response = await api.delete(`/admin/categories/${categoryId}`);
    return response.data;
  }
};

export default adminService;
