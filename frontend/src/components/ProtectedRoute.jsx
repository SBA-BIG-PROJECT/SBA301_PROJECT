import { Navigate } from 'react-router-dom'
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
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />
}
