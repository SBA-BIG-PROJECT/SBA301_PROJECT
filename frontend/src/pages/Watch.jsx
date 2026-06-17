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
  
  // Related movies
  const [relatedMovies, setRelatedMovies] = useState([])
  
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
        // Tải chi tiết phim, danh sách review, và phim liên quan song song
        const [movieData, reviewsData, relatedData] = await Promise.all([
          movieService.getMovieDetail(id),
          reviewService.getReviews(id, { page: 0, size: 50 }).catch(() => ({ content: [] })),
          movieService.getMovies({ page: 0, size: 10 }).catch(() => ({ content: [] }))
        ])

        if (!active) {
          return
        }

        setMovie(movieData)
        setReviews(reviewsData.content || [])
        setRelatedMovies(relatedData.content || relatedData || [])
        
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
        <div className="mt-10 w-full pb-10">
          <div className="bg-[#15161b] p-6 rounded-xl text-white shadow-lg border border-gray-800">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z" />
                </svg>
                <h3 className="text-xl font-bold">Bình luận ({reviews.length})</h3>
                <div className="flex bg-[#1a1c22] rounded-md overflow-hidden ml-6 text-sm font-medium">
                  <button 
                    onClick={() => setActiveTab('comment')}
                    className={`px-5 py-2 transition-colors ${activeTab === 'comment' ? 'bg-[#2a2d36] text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Bình luận
                  </button>
                  <button 
                    onClick={() => setActiveTab('review')}
                    className={`px-5 py-2 transition-colors ${activeTab === 'review' ? 'bg-[#2a2d36] text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Đánh giá
                  </button>
                </div>
              </div>
              <button className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {!isAuthenticated ? (
              <div className="mb-8">
                <Link to="/login" className="inline-flex items-center gap-2 bg-[#242730] hover:bg-[#2a2d36] text-gray-300 px-6 py-3 rounded-lg text-sm font-medium transition-colors">
                  <span>➜</span> Đăng nhập để bình luận
                </Link>
              </div>
            ) : (
              <div className="mb-8 pl-16 relative">
                <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-300 text-lg">
                  {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                {activeTab === 'review' && (
                  <div className="mb-4 flex items-center gap-4 bg-[#242730] p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-300">Điểm đánh giá của bạn:</p>
                    <div className="flex items-center gap-4 flex-1">
                      <input 
                        type="range" 
                        min="1" max="10" step="0.5" 
                        value={newRating} 
                        onChange={(e) => setNewRating(parseFloat(e.target.value))}
                        className="w-full max-w-xs accent-red-500 cursor-pointer"
                      />
                      <div className="flex items-center justify-center bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20">
                        <span className="font-bold text-red-500">{newRating.toFixed(1)}</span>
                        <span className="text-red-500/50 text-xs ml-1">/ 10</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <form 
                  className="bg-[#242730] rounded-lg overflow-hidden border border-[#2a2d36]"
                  onSubmit={handleCommentSubmit}
                >
                  <div className="relative">
                    <textarea 
                      className="w-full bg-transparent p-4 text-gray-200 placeholder-gray-500 focus:outline-none resize-none min-h-[100px] text-sm"
                      placeholder={activeTab === 'comment' ? "Viết bình luận..." : "Viết đánh giá của bạn..."}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      maxLength={1000}
                    />
                  </div>
                  <div className="bg-[#1a1c22] px-4 py-3 flex items-center justify-between border-t border-[#2a2d36]">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-400 hover:text-gray-300 transition-colors">
                        <input type="checkbox" className="rounded bg-gray-800 border-gray-700 text-red-500 focus:ring-red-500" />
                        Tiết lộ nội dung?
                      </label>
                    </div>
                    <button 
                      type="submit"
                      disabled={submitting || !newComment.trim()}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium text-sm disabled:opacity-50 transition-colors"
                    >
                      {submitting ? 'Đang gửi...' : 'Gửi'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Comments List */}
            <div className="flex flex-col border-t border-gray-800 pt-6">
              {reviews.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <p className="text-gray-500 text-sm">Chưa có bình luận nào</p>
                </div>
              ) : (
                reviews.map((review, index) => (
                  <div key={review.id || index} className="flex gap-4 py-5 border-b border-gray-800/50 last:border-0">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-[#242730] flex items-center justify-center font-bold text-gray-400 text-lg border border-gray-700">
                        {review.userName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="text-[10px] text-gray-500 text-center mt-1 uppercase font-semibold tracking-wider">
                        Wall
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <h4 className="font-bold text-gray-200 text-[15px]">{review.userName || 'Người dùng ẩn danh'}</h4>
                        <span className="text-xs text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">Lv.1 - Nhập môn</span>
                      </div>
                      
                      {review.rating && (
                        <div className="flex items-center gap-1 text-red-500 text-xs font-bold mb-2">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                          <span>{review.rating.toFixed(1)} Điểm</span>
                        </div>
                      )}
                      
                      <div className="text-gray-300 text-[15px] leading-relaxed whitespace-pre-wrap mb-3">
                        {review.comment}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <button className="flex items-center gap-1 hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                        </button>
                        <button className="flex items-center gap-1 hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                        </button>
                        <span>
                          {review.createdAt ? (() => {
                            const date = new Date(review.createdAt);
                            const now = new Date();
                            const diffTime = Math.abs(now - date);
                            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            if (diffHours < 24) return `${diffHours || 1} giờ trước`;
                            return `${diffDays} ngày trước`;
                          })() : 'Vừa xong'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {reviews.length > 0 && (
                <button className="w-full mt-6 bg-[#1a1c22] hover:bg-[#242730] text-gray-300 py-3 rounded-lg font-medium transition-colors text-sm border border-gray-800">
                  Tải thêm bình luận
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RELATED MOVIES SECTION */}
      {!isLoading && !errorMessage && relatedMovies.length > 0 && (
        <div className="w-full pb-20">
          <div className="bg-[#15161b] p-6 rounded-xl text-white border border-gray-800">
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
              </svg>
              <h3 className="text-xl font-bold">Phim tương tự</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {relatedMovies.slice(0, 12).map((relMovie) => (
                <Link 
                  key={relMovie.id} 
                  to={`/movie/${relMovie.id}`}
                  className="group relative rounded-lg overflow-hidden block bg-[#242730] aspect-[2/3]"
                >
                  <img 
                    src={relMovie.posterPath ? `https://image.tmdb.org/t/p/w500${relMovie.posterPath}` : 'https://via.placeholder.com/500x750?text=No+Poster'} 
                    alt={relMovie.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white">
                      <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>

                  {/* Top left badge */}
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    TV/??
                  </div>

                  {/* Bottom right rating */}
                  {relMovie.rating && (
                    <div className="absolute bottom-2 right-2 bg-yellow-500 text-black text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      {relMovie.rating.toFixed(1)}
                    </div>
                  )}

                  {/* Title gradient overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                    <h4 className="text-white text-xs font-medium line-clamp-2">{relMovie.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Watch
