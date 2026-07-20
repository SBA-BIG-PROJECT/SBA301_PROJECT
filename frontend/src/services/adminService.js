import api from './api';

const adminService = {
  // === Dashboard Analytics ===
  // Backend: AnalyticsController @RequestMapping("/api/v1/admin/analytics")
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
  // Backend: UserController @RequestMapping("/api/v1/admin/users")
  getAllUsers: async (page = 0, size = 20, search, role, isPremium, isActive) => {
    const params = { page, size };
    if (search) params.search = search;
    if (role) params.role = role;
    if (isPremium !== undefined) params.isPremium = isPremium;
    if (isActive !== undefined) params.isActive = isActive;
    
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

  restoreUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/restore`);
    return response.data;
  },

  banUser: async (userId, data) => {
    const response = await api.put(`/admin/users/${userId}/ban`, data);
    return response.data;
  },

  unbanUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/unban`);
    return response.data;
  },
  
  // PUT /api/v1/admin/users/{userId}/role
  changeUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  // DELETE /api/v1/admin/users/{userId}/premium
  revokePremium: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}/premium`);
    return response.data;
  },

  // === Movie Management ===
  // Backend: MovieController @RequestMapping("/api/v1/movies"), admin sub-paths under /admin
  getAllMovies: async (page = 0, size = 20, search, isActive) => {
    const params = { page, size };
    if (search) params.search = search;
    if (isActive !== undefined) params.isActive = isActive;
    
    const response = await api.get('/movies/admin', { params });
    return response.data;
  },
  
  getMovieDetail: async (tmdbId) => {
    const response = await api.get(`/movies/admin/${tmdbId}`);
    return response.data;
  },
  
  createMovie: async (data) => {
    const response = await api.post('/movies/admin', data);
    return response.data;
  },
  
  updateMovie: async (tmdbId, data) => {
    const response = await api.put(`/movies/admin/${tmdbId}`, data);
    return response.data;
  },
  
  deleteMovie: async (tmdbId) => {
    const response = await api.delete(`/movies/admin/${tmdbId}`);
    return response.data;
  },
  
  restoreMovie: async (tmdbId) => {
    const response = await api.post(`/movies/admin/${tmdbId}/restore`);
    return response.data;
  },

  updateMovieGenres: async (tmdbId, genreIds) => {
    const response = await api.put(`/movies/admin/${tmdbId}/genres`, { genreIds });
    return response.data;
  },

  updateMovieCategories: async (tmdbId, categoryIds) => {
    const response = await api.put(`/movies/admin/${tmdbId}/categories`, { categoryIds });
    return response.data;
  },

  // PATCH /api/v1/movies/admin/{tmdbId}/premium?isPremium=true
  setMoviePremium: async (tmdbId, isPremium) => {
    const response = await api.patch(`/movies/admin/${tmdbId}/premium`, null, { params: { isPremium } });
    return response.data;
  },

  // POST /api/v1/movies/admin/upload-image
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/movies/admin/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // === Payment Management ===
  // Backend: PaymentController @RequestMapping("/api/v1/payments"), admin sub-paths under /admin
  getAllPayments: async (page = 0, size = 20, status, userId, planType, search) => {
    const params = { page, size };
    if (status) params.status = status;
    if (userId) params.userId = userId;
    if (planType) params.planType = planType;
    if (search) params.search = search;
    
    const response = await api.get('/payments/admin', { params });
    return response.data;
  },
  
  getPaymentDetail: async (paymentId) => {
    const response = await api.get(`/payments/admin/${paymentId}`);
    return response.data;
  },
  
  // PUT /api/v1/payments/admin/{paymentId}/status?status=...
  // Backend uses @RequestParam String status, not @RequestBody
  updatePaymentStatus: async (paymentId, status) => {
    const response = await api.put(`/payments/admin/${paymentId}/status`, null, { params: { status } });
    return response.data;
  },

  // === Genre & Category Management ===
  // Backend: GenreController @RequestMapping("/api/v1/genres"), admin sub-paths under /admin
  getAllGenres: async () => {
    const response = await api.get('/genres/admin');
    return response.data;
  },

  createGenre: async (genreId, name) => {
    const response = await api.post('/genres/admin', { genreId, name });
    return response.data;
  },

  updateGenre: async (genreId, newName) => {
    const response = await api.put(`/genres/admin/${genreId}`, null, { params: { newName } });
    return response.data;
  },

  deleteGenre: async (genreId) => {
    const response = await api.delete(`/genres/admin/${genreId}`);
    return response.data;
  },

  // Backend: CategoryController @RequestMapping("/api/v1/categories"), admin sub-paths under /admin
  getAllCategories: async () => {
    const response = await api.get('/categories/admin');
    return response.data;
  },

  createCategory: async (categoryId, name) => {
    const response = await api.post('/categories/admin', { categoryId, name });
    return response.data;
  },

  updateCategory: async (categoryId, newName) => {
    const response = await api.put(`/categories/admin/${categoryId}`, null, { params: { newName } });
    return response.data;
  },

  deleteCategory: async (categoryId) => {
    const response = await api.delete(`/categories/admin/${categoryId}`);
    return response.data;
  }
};

export default adminService;
