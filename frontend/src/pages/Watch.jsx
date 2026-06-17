import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Spinner from '../components/Spinner.jsx'
import { movieService, reviewService } from '../services'
import { useHistory } from '../hooks/useHistory'
import { useAuth } from '../hooks/useAuth'

const Watch = () => {
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const [trailerKey, setTrailerKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  // States cho comment/review
  const [reviews, setReviews] = useState([])
  const [newComment, setNewComment] = useState('')
  const [newRating, setNewRating] = useState(10.0)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('comment')
  
  const { addToHistory } = useHistory()
  const { isAuthenticated, user } = useAuth()

  // Hàm trích xuất Youtube Video ID từ URL
  const extractVideoID = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url; // Trả về ID hoặc nguyên gốc nếu không parse được
  };

  useEffect(() => {
    let active = true

    const loadWatch = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        // Tải chi tiết phim và danh sách review song song
        const [movieData, reviewsData] = await Promise.all([
          movieService.getMovieDetail(id),
          reviewService.getReviews(id, { page: 0, size: 50 }).catch(() => ({ content: [] }))
        ])

        if (!active) {
          return
        }

        setMovie(movieData)
        setReviews(reviewsData.content || [])
        
        // Lấy trailerKey từ trailerUrl do backend trả về
        if (movieData?.trailerUrl) {
          setTrailerKey(extractVideoID(movieData.trailerUrl))
        }
        
        // Add to history when loaded
        if (movieData) {
          addToHistory(movieData)
        }
      } catch (error) {
        console.error(`Error fetching data: ${error}`)
        if (active) {
          setErrorMessage('Could not load movie data. Please try again.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadWatch()

    return () => {
      active = false
    }
  }, [id])

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    
    setSubmitting(true)
    try {
      const review = await reviewService.createReview(id, {
        rating: newRating,
        comment: newComment
      })
      // Thêm review mới lên đầu danh sách
      setReviews(prev => [review, ...prev])
      setNewComment('')
      setNewRating(10.0)
    } catch (error) {
      console.error('Failed to create review', error)
      alert(error.response?.data?.message || 'Failed to post comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Nếu trailerKey đã là 1 embed link thì giữ nguyên, nếu không thì bọc lại
  const embedUrl = trailerKey
    ? (trailerKey.includes('http') ? trailerKey : `https://www.youtube.com/embed/${trailerKey}`)
    : ''

  return (
    <section className="watch">
      <div className="row__header">
        <h2>{movie?.title || 'Watch Trailer'}</h2>
        <Link className="nav__link" to={`/movie/${id}`}>
          Back to details
        </Link>
      </div>

      {isLoading ? (
        <Spinner />
      ) : errorMessage ? (
        <p className="status">{errorMessage}</p>
      ) : trailerKey ? (
        <div className="watch__player">
          <iframe
            className="watch__frame"
            src={embedUrl}
            title={movie?.title || 'Trailer'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <p className="search-results__empty">
          Trailer not available for this title.
        </p>
      )}

      {/* COMMENTS & REVIEWS SECTION */}
      {!isLoading && !errorMessage && (
        <div className="mt-16 max-w-5xl mx-auto px-4 pb-20">
          <div className="bg-[#1a1c22] p-6 rounded-lg text-white border border-gray-800/50">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Bình luận ({reviews.length})</h3>
              <div className="flex border border-gray-600 rounded-md overflow-hidden ml-4 text-sm font-medium">
                <button 
                  onClick={() => setActiveTab('comment')}
                  className={`px-4 py-1.5 transition-colors ${activeTab === 'comment' ? 'bg-white text-black' : 'bg-transparent text-gray-300 hover:bg-gray-800'}`}
                >
                  Bình luận
                </button>
                <button 
                  onClick={() => setActiveTab('review')}
                  className={`px-4 py-1.5 transition-colors ${activeTab === 'review' ? 'bg-white text-black' : 'bg-transparent text-gray-300 hover:bg-gray-800'}`}
                >
                  Đánh giá
                </button>
              </div>
            </div>

            {!isAuthenticated ? (
              <p className="text-gray-400 mb-6 text-sm">
                Vui lòng <Link to="/login" className="text-yellow-500 hover:underline">đăng nhập</Link> để tham gia bình luận.
              </p>
            ) : (
              <div className="mb-8">
                {activeTab === 'review' && (
                  <div className="mb-4 flex items-center gap-4 bg-[#242730] p-4 rounded-lg border border-gray-700/50">
                    <p className="text-sm font-medium text-gray-300">Điểm đánh giá của bạn:</p>
                    <div className="flex items-center gap-4 flex-1">
                      <input 
                        type="range" 
                        min="1" max="10" step="0.5" 
                        value={newRating} 
                        onChange={(e) => setNewRating(parseFloat(e.target.value))}
                        className="w-full max-w-xs accent-yellow-500 cursor-pointer"
                      />
                      <div className="flex items-center justify-center bg-yellow-500/10 px-3 py-1 rounded-lg border border-yellow-500/20">
                        <span className="font-bold text-yellow-500">{newRating.toFixed(1)}</span>
                        <span className="text-yellow-500/50 text-xs ml-1">/ 10</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <form 
                  className="bg-[#242730] rounded-lg border border-gray-700/50 overflow-hidden"
                  onSubmit={handleCommentSubmit}
                >
                  <div className="relative">
                    <textarea 
                      className="w-full bg-transparent p-4 text-gray-300 placeholder-gray-500 focus:outline-none resize-none min-h-[120px] text-sm"
                      placeholder={activeTab === 'comment' ? "Viết bình luận" : "Viết đánh giá của bạn..."}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      maxLength={1000}
                    />
                    <span className="absolute top-4 right-4 text-xs text-gray-500">
                      {newComment.length} / 1000
                    </span>
                  </div>
                  <div className="bg-[#2a2d36] px-4 py-3 flex items-center justify-between border-t border-gray-700/50">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-400 group">
                      <div className="relative flex items-center">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                      </div>
                      Tiết lộ?
                    </label>
                    <button 
                      type="submit"
                      disabled={submitting || !newComment.trim()}
                      className="flex items-center gap-2 text-yellow-500 font-medium text-sm hover:text-yellow-400 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? 'Đang gửi...' : 'Gửi'}
                      {!submitting && (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Comments List */}
            <div className="flex flex-col gap-4">
              {reviews.length === 0 ? (
                <div className="bg-[#15171c] rounded-xl py-16 flex flex-col items-center justify-center border border-gray-800/50">
                  <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  <p className="text-gray-500 text-sm">Chưa có bình luận nào</p>
                </div>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="bg-[#242730] p-4 rounded-lg border border-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-300 text-sm">
                          {review.userName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-200 text-sm">{review.userName || 'Người dùng ẩn danh'}</h4>
                          <p className="text-xs text-gray-500">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN', {
                              year: 'numeric', month: 'long', day: 'numeric'
                            }) : 'Vừa xong'}
                          </p>
                        </div>
                      </div>
                      {review.rating && (
                        <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                          <span>{review.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="pl-13 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {review.comment}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Watch
