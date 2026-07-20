import { useEffect, useState, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner.jsx'
import { movieService, commentService } from '../services'
import { useHistory } from '../hooks/useHistory'
import { useAuth } from '../hooks/useAuth'
import { useToast, ToastContainer } from '../components/Toast.jsx'

const Watch = () => {
  const { toasts, showToast, closeToast } = useToast()
  const { id } = useParams()
  const navigate = useNavigate()
  const [movie, setMovie] = useState(null)
  const [embedUrl, setEmbedUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // States for comment/review
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [newRating, setNewRating] = useState(5.0)
  const [submitting, setSubmitting] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)

  // Related movies
  const [relatedMovies, setRelatedMovies] = useState([])

  // Custom Player States & Refs
  const playerWrapperRef = useRef(null)
  const [player, setPlayer] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(50)
  const [isMuted, setIsMuted] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const { addToHistory } = useHistory()
  const { isAuthenticated, user } = useAuth()

  // Function to extract YouTube Video ID from URL
  const extractVideoID = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url; // Return ID or original if unparseable
  };

  useEffect(() => {
    let active = true

    const loadWatch = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        // Load movie details, comments, and related movies in parallel
        const [movieData, commentsData, relatedData] = await Promise.all([
          movieService.getMovieDetail(id),
          commentService.getComments(id).catch(() => ({ content: [] })),
          movieService.getMovies({ page: 0, size: 10 }).catch(() => ({ content: [] }))
        ])

        if (!active) {
          return
        }

        setMovie(movieData)
        setComments(commentsData.content || commentsData || [])
        setRelatedMovies(relatedData.content || relatedData || [])

        // Try resolving the playToken if available
        if (movieData?.playToken) {
          try {
            const resolvedUrl = await movieService.resolvePlayToken(movieData.playToken)
            if (resolvedUrl) {
              setEmbedUrl(resolvedUrl)
            } else {
              setErrorMessage('Trailer not available for this movie.')
            }
          } catch (tokenError) {
            console.error('Failed to resolve play token:', tokenError)
            setErrorMessage('Failed to load trailer. Please try again.')
          }
        } else {
          setErrorMessage('Trailer not available for this movie.')
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

  }, [id])

  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
      ) {
        e.preventDefault();
        showToast('warning', 'Developer tools are disabled on this page.');
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showToast]);

  // --- Load YouTube IFrame API ---
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // --- Initialize YT Player ---
  useEffect(() => {
    if (!embedUrl) return;
    const videoId = extractVideoID(embedUrl);
    if (!videoId) return;

    let ytPlayer;

    const initPlayer = () => {
      ytPlayer = new window.YT.Player('yt-player', {
        videoId: videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: (event) => {
            setPlayer(event.target);
            setDuration(event.target.getDuration());
            event.target.setVolume(volume);
          },
          onStateChange: (event) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
            if (event.data === window.YT.PlayerState.PLAYING) {
              setDuration(event.target.getDuration());
            }
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        initPlayer();
      };
    }

    return () => {
      if (ytPlayer && ytPlayer.destroy) {
        ytPlayer.destroy();
      }
      setPlayer(null);
      setIsPlaying(false);
    };
  }, [embedUrl]);

  // --- Track Time Progress ---
  useEffect(() => {
    let interval;
    if (isPlaying && player) {
      interval = setInterval(() => {
        setCurrentTime(player.getCurrentTime());
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isPlaying, player]);

  // --- Auto-Hide Controls ---
  useEffect(() => {
    if (!isPlaying) {
      setControlsVisible(true);
      return;
    }
    const timeout = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [isPlaying, currentTime]);

  const handleMouseMove = () => {
    setControlsVisible(true);
  };

  // --- Fullscreen change listener ---
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // --- Player Event Handlers ---
  const handlePlayPause = () => {
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const handleSeek = (e) => {
    if (!player) return;
    const time = parseFloat(e.target.value);
    player.seekTo(time, true);
    setCurrentTime(time);
  };

  const handleVolumeChange = (e) => {
    if (!player) return;
    const val = parseInt(e.target.value);
    setVolume(val);
    player.setVolume(val);
    if (val === 0) {
      player.mute();
      setIsMuted(true);
    } else {
      player.unMute();
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    if (!player) return;
    if (isMuted) {
      player.unMute();
      player.setVolume(volume || 50);
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };

  const handleToggleFullscreen = () => {
    const element = playerWrapperRef.current;
    if (!element) return;

    if (!document.fullscreenElement) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const comment = await commentService.createComment(id, {
        content: newComment
      })
      // Add new comment to top of list
      setComments(prev => [comment, ...prev])
      setNewComment('')
    } catch (error) {
      console.error('Failed to create review', error)
      showToast('error', error.response?.data?.message || 'Failed to post comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }



  const handleToggleLike = async (commentId) => {
    if (!isAuthenticated) return;
    try {
      const result = await commentService.toggleLike(commentId);
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, likeCount: result.likeCount, liked: result.liked } : c
      ));
    } catch (error) {
      console.error('Failed to toggle like', error);
    }
  };

  return (
    <section className="watch">
      <div className="row__header">
        <h2>{movie?.title || 'Watch Movie'}</h2>
        <Link className="nav__link" to={`/movie/${id}`}>
          Back to details
        </Link>
      </div>

      {isLoading ? (
        <Spinner />
      ) : errorMessage ? (
        <p className="status">{errorMessage}</p>
      ) : movie?.isLocked && movie?.requiresPremium ? (
        <div className="watch__locked flex flex-col items-center justify-center p-20 bg-[#15161b] rounded-xl border border-gray-800 text-center">
          <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="crownGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" fill="url(#crownGrad)" />
          </svg>
          <h3 className="text-2xl font-bold text-white mb-2">Premium Content</h3>
          <p className="text-gray-400 mb-6">
            This movie is exclusively available for Premium members. Upgrade your plan to watch.
          </p>
          <button
            onClick={() => navigate('/payment')}
            className="px-8 py-3 rounded-lg font-bold text-white text-sm transition-all hover:brightness-110 active:brightness-90 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" /></svg>
              Upgrade to Premium
            </span>
          </button>
        </div>
      ) : movie?.isLocked ? (
        <div className="watch__locked flex flex-col items-center justify-center p-20 bg-[#15161b] rounded-xl border border-gray-800 text-center">
          <svg className="w-16 h-16 text-gray-500 mb-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" /></svg>
          <h3 className="text-2xl font-bold text-white mb-2">Not Yet Released</h3>
          <p className="text-gray-400">
            This movie will be available on {new Date(movie.releaseDate).toLocaleString('en-US')}
          </p>
        </div>
      ) : embedUrl ? (
        <div
          ref={playerWrapperRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setControlsVisible(false)}
          className="watch__player relative group overflow-hidden bg-black rounded-3xl border border-white/10 select-none w-full max-w-5xl mx-auto aspect-video shadow-2xl"
        >
          {/* Lớp phủ trong suốt chặn mọi tương tác chuột trực tiếp vào iframe của YouTube */}
          <div
            onClick={handlePlayPause}
            className="absolute inset-0 z-10 bg-transparent cursor-pointer"
          ></div>

          {/* Vùng trình phát của YouTube API (chặn tất cả chuột) */}
          <div
            id="yt-player"
            className="w-full h-full pointer-events-none"
          ></div>

          {/* Bộ điều khiển phát phim tùy chỉnh */}
          <div
            className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-6 flex flex-col gap-4 transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
          >
            {/* Thanh tua thời gian (Seek Bar) */}
            <div className="flex items-center w-full">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-white/20 accent-[#E50914] rounded-lg appearance-none cursor-pointer hover:h-1.5 transition-all outline-none"
              />
            </div>

            {/* Các nút bấm điều khiển */}
            <div className="flex items-center justify-between w-full text-white">
              {/* Nút bên trái */}
              <div className="flex items-center gap-6">
                <button
                  onClick={handlePlayPause}
                  className="focus:outline-none hover:text-[#E50914] transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[32px] leading-none">
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </button>

                <span className="text-xs font-semibold text-gray-300 font-mono tracking-wider">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Nút bên phải */}
              <div className="flex items-center gap-6">
                {/* Âm lượng */}
                <div className="flex items-center gap-2 group/volume">
                  <button
                    onClick={handleToggleMute}
                    className="focus:outline-none hover:text-[#E50914] transition-colors flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[22px] leading-none">
                      {isMuted || volume === 0 ? 'volume_off' : volume < 50 ? 'volume_down' : 'volume_up'}
                    </span>
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-0 overflow-hidden group-hover/volume:w-20 h-1 bg-white/20 accent-white rounded-lg appearance-none cursor-pointer transition-all duration-300 outline-none"
                  />
                </div>

                {/* Toàn màn hình */}
                <button
                  onClick={handleToggleFullscreen}
                  className="focus:outline-none hover:text-[#E50914] transition-colors flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[22px] leading-none">
                    {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="search-results__empty">
          Movie not available for this title.
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
                <h3 className="text-xl font-bold">Comments & Reviews ({comments.length})</h3>
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
                  <span>➜</span> Login to comment
                </Link>
              </div>
            ) : (
              <div className="mb-8 flex gap-4">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 shrink-0 rounded-full object-cover mt-1" />
                ) : (
                  <div className="w-10 h-10 shrink-0 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-300 text-sm mt-1">
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}

                <form
                  className="flex-1 flex flex-col gap-3"
                  onSubmit={handleCommentSubmit}
                >
                  {/* Comment Input */}
                  <div className="relative">
                    <textarea
                      className="w-full bg-[#242730] border border-[#2a2d36] rounded-xl p-4 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-red-500/50 resize-none min-h-[80px] text-sm transition-colors"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      maxLength={1000}
                    />

                    <div className="absolute bottom-3 right-3 flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-400 hover:text-gray-300 transition-colors bg-[#1a1c22] px-2 py-1 rounded-md border border-gray-800">
                        <input type="checkbox" className="rounded bg-gray-800 border-gray-700 text-red-500 focus:ring-red-500 w-3 h-3" />
                        Spoilers
                      </label>
                      <button
                        type="submit"
                        disabled={submitting || !newComment.trim()}
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-1.5 rounded-full font-medium text-xs disabled:opacity-50 transition-colors shadow-lg"
                      >
                        {submitting ? 'Posting...' : 'Post'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Comments List */}
            <div className="flex flex-col border-t border-gray-800 pt-6">
              {comments.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <p className="text-gray-500 text-sm">No comments yet</p>
                </div>
              ) : (
                comments.map((commentItem, index) => (
                  <div key={commentItem.id || index} className="flex gap-4 py-5 border-b border-gray-800/50 last:border-0">
                    <div className="flex-shrink-0">
                      {commentItem.authorAvatarUrl ? (
                        <img src={commentItem.authorAvatarUrl} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-gray-700" />
                      ) : commentItem.authorName === user?.username && user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-gray-700" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#242730] flex items-center justify-center font-bold text-gray-400 text-lg border border-gray-700">
                          {commentItem.authorName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="text-[10px] text-gray-500 text-center mt-1 uppercase font-semibold tracking-wider">
                        Wall
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-2">
                        <h4 className="font-bold text-gray-200 text-[15px]">{commentItem.authorName || 'Anonymous user'}</h4>
                        <span className="text-xs text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">Lv.1 - Beginner</span>
                      </div>

                      <div className="text-gray-300 text-[15px] leading-relaxed whitespace-pre-wrap mb-3">
                        {commentItem.content}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <button 
                          onClick={() => handleToggleLike(commentItem.id)}
                          className={`flex items-center gap-1 transition-colors ${commentItem.liked ? 'text-red-500' : 'hover:text-white'}`}
                        >
                          <svg className="w-4 h-4" fill={commentItem.liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                          <span>{commentItem.likeCount || ''}</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
                        </button>
                        <span>
                          {commentItem.createdAt ? (() => {
                            const date = new Date(commentItem.createdAt);
                            const now = new Date();
                            const diffTime = Math.abs(now - date);
                            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                            if (diffHours < 24) return `${diffHours || 1} hours ago`;
                            return `${diffDays} days ago`;
                          })() : 'Just now'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {comments.length > 0 && (
                <button className="w-full mt-6 bg-[#1a1c22] hover:bg-[#242730] text-gray-300 py-3 rounded-lg font-medium transition-colors text-sm border border-gray-800">
                  Load more comments
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
              <h3 className="text-xl font-bold">Related movies</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {relatedMovies.slice(0, 12).map((relMovie) => (
                <Link
                  key={relMovie.id}
                  to={`/movie/${relMovie.id}`}
                  className="group relative rounded-lg overflow-hidden block bg-[#242730] aspect-[2/3]"
                >
                  <img
                    src={relMovie.posterPath ? (relMovie.posterPath.startsWith('http') ? relMovie.posterPath : `https://image.tmdb.org/t/p/w500${relMovie.posterPath}`) : 'https://via.placeholder.com/500x750?text=No+Poster'}
                    alt={relMovie.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white">
                      <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
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
                      {(relMovie.rating / 2).toFixed(1)}
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

      <ToastContainer toasts={toasts} onClose={closeToast} />
    </section>
  )
}

export default Watch
