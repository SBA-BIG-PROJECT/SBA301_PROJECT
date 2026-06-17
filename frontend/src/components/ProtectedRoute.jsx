import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks'

/**
 * Protected Route Component
 * Bảo vệ routes yêu cầu authentication
 * 
 * Usage:
 * <Route path="/watchlist" element={
 *   <ProtectedRoute>
 *     <Watchlist />
 *   </ProtectedRoute>
 * } />
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-transparent">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400 font-medium animate-pulse">Checking authentication...</p>
        </div>
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" state={{ from: location.pathname, message: "You need to log in to watch this movie." }} replace />
}
