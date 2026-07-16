import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Detail from './pages/Detail.jsx'
import Genre from './pages/Genre.jsx'
import Category from './pages/Category.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'
import Register from './pages/Register.jsx'
import SearchPage from './pages/Search.jsx'
import Watch from './pages/Watch.jsx'
import Watchlist from './pages/Watchlist.jsx'
import History from './pages/History.jsx'
import Payment from './pages/Payment.jsx'
import AdminDashboard from './pages/admin/admindashboard.jsx'
import AdminUser from './pages/admin/adminuser.jsx'
import AdminUserDetail from './pages/admin/adminuserdetail.jsx'
import AdminMovies from './pages/admin/adminmovies.jsx'
import AdminMovieDetail from './pages/admin/adminmoviedetail.jsx'
import AdminPayment from './pages/admin/adminpayment.jsx'
import AdminAnalytics from './pages/admin/adminalytics.jsx'
import AdminGenres from './pages/admin/admingenres.jsx'
import { AdminRoute } from './components/AdminRoute.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="genre/:id" element={<Genre />} />
          <Route path="category/:id" element={<Category />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="movie/:id" element={<Detail />} />
          <Route path="watch/:id" element={<ProtectedRoute><Watch /></ProtectedRoute>} />
          <Route path="watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
          <Route path="history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Route>
        
        {/* Admin Routes - without standard Layout */}
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute>
            <AdminUser />
          </AdminRoute>
        } />
        <Route path="/admin/users/:id" element={
          <AdminRoute>
            <AdminUserDetail />
          </AdminRoute>
        } />
        <Route path="/admin/movies" element={
          <AdminRoute>
            <AdminMovies />
          </AdminRoute>
        } />
        <Route path="/admin/movies/:id" element={
          <AdminRoute>
            <AdminMovieDetail />
          </AdminRoute>
        } />
        <Route path="/admin/payments" element={
          <AdminRoute>
            <AdminPayment />
          </AdminRoute>
        } />
        <Route path="/admin/analytics" element={
          <AdminRoute>
            <AdminAnalytics />
          </AdminRoute>
        } />
        <Route path="/admin/genres" element={
          <AdminRoute>
            <AdminGenres />
          </AdminRoute>
        } />
        <Route path="/admin/categories" element={
          <AdminRoute>
            <AdminGenres />
          </AdminRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App