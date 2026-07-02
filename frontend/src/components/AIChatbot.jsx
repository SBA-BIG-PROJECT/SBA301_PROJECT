import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { chatService, authService, movieService } from '../services'
import logo from '../assets/logo.svg'
import noPoster from '../assets/No-Poster.svg'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w300'

/**
 * Detect if browser language is Vietnamese
 */
const isVietnamese = () => {
  const lang = navigator.language || navigator.userLanguage || ''
  return lang.startsWith('vi')
}

const SUGGESTIONS_VI = [
  'Gợi ý phim đang hot 🔥',
  'Tìm phim hành động hay',
  'Hôm nay nên xem gì?',
  'Phim hài nhẹ nhàng cho cuối tuần',
]

const SUGGESTIONS_EN = [
  'Trending movies right now 🔥',
  'Find great action movies',
  'What should I watch today?',
  'Light comedy for the weekend',
]

const WELCOME_VI =
  'Xin chào! 👋 Tôi là trợ lý AI của SBA Movies. Tôi có thể giúp bạn tìm kiếm phim, gợi ý phim theo thể loại, diễn viên, hay xu hướng. Bạn muốn xem gì hôm nay?'
const WELCOME_EN =
  "Hi there! 👋 I'm the SBA Movies AI assistant. I can help you find movies, recommend by genre, actor, or trending. What would you like to watch today?"

const LOGIN_VI = 'Vui lòng đăng nhập để sử dụng trợ lý AI! 🔐'
const LOGIN_EN = 'Please log in to use the AI assistant! 🔐'

const ERROR_VI = 'Xin lỗi, đã có lỗi xảy ra. Hãy thử lại sau nhé! 🙏'
const ERROR_EN = 'Sorry, something went wrong. Please try again later! 🙏'

const FALLBACK_VI =
  'Xin lỗi, tôi không thể xử lý yêu cầu này. Hãy thử lại nhé! 🙏'
const FALLBACK_EN =
  "Sorry, I couldn't process that request. Please try again! 🙏"

const PLACEHOLDER_VI = 'Hỏi gì đó về phim...'
const PLACEHOLDER_EN = 'Ask me anything about movies...'

/**
 * Parse AI response to extract structured movie data from [AI_MOVIES]...[/AI_MOVIES] block
 * and also fallback to the old [MOVIE_ID:xxx] format for backward compatibility.
 */
const parseAiResponse = (text) => {
  if (!text) return { cleanText: '', movies: [] }

  // Try structured JSON format: [AI_MOVIES]...[/AI_MOVIES]
  const structuredRegex = /\[AI_MOVIES\]\s*([\s\S]*?)\s*\[\/AI_MOVIES\]/
  const structuredMatch = structuredRegex.exec(text)

  if (structuredMatch) {
    try {
      const moviesJson = JSON.parse(structuredMatch[1].trim())
      const cleanText = text
        .replace(/\[AI_MOVIES\][\s\S]*?\[\/AI_MOVIES\]/, '')
        .trim()
      return {
        cleanText,
        movies: moviesJson.map((m) => ({
          id: m.id,
          reason: m.reason || '',
        })),
      }
    } catch (e) {
      console.warn('Failed to parse AI_MOVIES JSON:', e)
    }
  }

  // Fallback: old [MOVIE_ID:xxx] format
  const movieIdRegex = /\[MOVIE_ID:(\d+)\]/g
  const movies = []
  let match
  while ((match = movieIdRegex.exec(text)) !== null) {
    movies.push({ id: parseInt(match[1], 10), reason: '' })
  }
  const cleanText = text.replace(/\s*\[MOVIE_ID:\d+\]/g, '').trim()
  return { cleanText, movies }
}

/**
 * MovieRecommendationCard - A beautiful card showing a recommended movie
 */
const MovieRecommendationCard = ({ movieId, reason, detail, isLoading, onWatch }) => {
  if (isLoading) {
    return (
      <div className="ai-movie-card ai-movie-card--loading">
        <div className="ai-movie-card__poster">
          <div className="ai-skeleton ai-skeleton--poster" />
        </div>
        <div className="ai-movie-card__info">
          <div className="ai-skeleton ai-skeleton--title" />
          <div className="ai-skeleton ai-skeleton--text" />
          <div className="ai-skeleton ai-skeleton--text ai-skeleton--short" />
        </div>
      </div>
    )
  }

  if (!detail) return null

  const posterSrc = detail.posterPath
    ? detail.posterPath.startsWith('http')
      ? detail.posterPath
      : `${TMDB_IMG}${detail.posterPath.startsWith('/') ? '' : '/'}${detail.posterPath}`
    : noPoster

  const rating =
    detail.voteAverage ?? detail.vote_average ?? detail.rating
  const ratingNum = rating != null ? Number(rating) : null

  const releaseYear = detail.releaseDate ?? detail.release_date ?? detail.releaseYear
  const year = releaseYear
    ? String(releaseYear).includes('-')
      ? String(releaseYear).split('-')[0]
      : String(releaseYear).substring(0, 4)
    : null

  const genres = detail.genres || detail.movieGenres || []
  const genreNames = genres
    .map((g) => g.name || g.genre?.name || g)
    .filter(Boolean)
    .slice(0, 3)

  const isPremium = detail.isPremium || detail.is_premium

  return (
    <div className="ai-movie-card" onClick={() => onWatch(movieId)}>
      <div className="ai-movie-card__poster">
        <img src={posterSrc} alt={detail.title} loading="lazy" />
        {isPremium && (
          <span className="ai-movie-card__premium">
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 9, height: 9 }}>
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
            </svg>
            Premium
          </span>
        )}
      </div>
      <div className="ai-movie-card__info">
        <h4 className="ai-movie-card__title">{detail.title}</h4>

        <div className="ai-movie-card__meta">
          {ratingNum != null && !isNaN(ratingNum) && (
            <span className="ai-movie-card__rating">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {ratingNum.toFixed(1)}
            </span>
          )}
          {year && <span className="ai-movie-card__year">{year}</span>}
        </div>

        {genreNames.length > 0 && (
          <div className="ai-movie-card__genres">
            {genreNames.map((name, i) => (
              <span className="ai-movie-card__genre-tag" key={i}>
                {name}
              </span>
            ))}
          </div>
        )}

        {reason && <p className="ai-movie-card__reason">{reason}</p>}

        <button
          className="ai-movie-card__watch"
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onWatch(movieId)
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          {isVietnamese() ? 'Xem ngay' : 'Watch now'}
        </button>
      </div>
    </div>
  )
}

const AIChatbot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [movieCache, setMovieCache] = useState({}) // Cache: { movieId: { data, loading, error } }
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const isLoggedIn = authService.isAuthenticated()
  const currentUser = authService.getCurrentUser()
  const currentUserId = currentUser?.id
  const isVi = isVietnamese()

  // Reset chat when user account changes
  useEffect(() => {
    setMessages([])
    setSessionId(null)
    setMovieCache({})
  }, [currentUserId])

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  /**
   * Fetch movie details for an array of movie objects [{id, reason}]
   * and cache them in state.
   */
  const fetchMovieDetails = useCallback(
    async (movieItems) => {
      const idsToFetch = movieItems
        .map((m) => m.id)
        .filter((id) => !movieCache[id])

      if (idsToFetch.length === 0) return

      // Set loading state for each movie
      setMovieCache((prev) => {
        const next = { ...prev }
        idsToFetch.forEach((id) => {
          next[id] = { data: null, loading: true, error: false }
        })
        return next
      })

      // Fetch all in parallel
      const results = await Promise.allSettled(
        idsToFetch.map((id) => movieService.getMovieDetail(id))
      )

      setMovieCache((prev) => {
        const next = { ...prev }
        results.forEach((result, index) => {
          const id = idsToFetch[index]
          if (result.status === 'fulfilled') {
            next[id] = { data: result.value, loading: false, error: false }
          } else {
            next[id] = { data: null, loading: false, error: true }
          }
        })
        return next
      })
    },
    [movieCache]
  )

  // Load session & messages when opened
  useEffect(() => {
    if (!isOpen) return

    // If we already have messages loaded, just focus input
    if (messages.length > 0) return

    // If we have an existing session, reload messages from backend
    if (isLoggedIn && sessionId) {
      chatService
        .getSession(sessionId)
        .then((res) => {
          const history = res.data?.messages || []
          const loadedMessages = [
            {
              id: 'welcome',
              type: 'ai',
              text: isVi ? WELCOME_VI : WELCOME_EN,
              movies: [],
            },
          ]

          const allMovieItems = []

          history.forEach((msg, idx) => {
            if (msg.role === 'USER') {
              loadedMessages.push({
                id: `hist-user-${idx}`,
                type: 'user',
                text: msg.content,
                movies: [],
              })
            } else if (msg.role === 'ASSISTANT') {
              const { cleanText, movies } = parseAiResponse(msg.content)
              loadedMessages.push({
                id: `hist-ai-${idx}`,
                type: 'ai',
                text: cleanText || msg.content,
                movies,
              })
              if (movies.length > 0) {
                allMovieItems.push(...movies)
              }
            }
          })

          setMessages(loadedMessages)

          // Fetch movie details for all recommended movies in history
          if (allMovieItems.length > 0) {
            fetchMovieDetails(allMovieItems)
          }
        })
        .catch((err) => {
          console.error('Failed to load chat history:', err)
          // Session might be invalid or belong to another user, start fresh
          setSessionId(null)
          showWelcomeAndCreateSession()
        })
    } else {
      // No existing session, show welcome and create new one
      showWelcomeAndCreateSession()
    }
  }, [isOpen, currentUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  const showWelcomeAndCreateSession = () => {
    setMessages([
      {
        id: 'welcome',
        type: 'ai',
        text: isVi ? WELCOME_VI : WELCOME_EN,
        movies: [],
      },
    ])

    if (isLoggedIn) {
      chatService
        .createSession()
        .then((res) => {
          setSessionId(res.data.id)
        })
        .catch((err) => {
          console.error('Failed to create chat session:', err)
        })
    }
  }

  const handleSend = async (overrideText) => {
    const trimmed = (overrideText || inputValue).trim()
    if (!trimmed || isLoading) return

    if (!isLoggedIn) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), type: 'user', text: trimmed, movies: [] },
        {
          id: Date.now() + 1,
          type: 'ai',
          text: isVi ? LOGIN_VI : LOGIN_EN,
          movies: [],
        },
      ])
      setInputValue('')
      return
    }

    // Add user message
    const userMsg = { id: Date.now(), type: 'user', text: trimmed, movies: [] }
    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsLoading(true)

    try {
      // Ensure we have a session
      let currentSessionId = sessionId
      if (!currentSessionId) {
        const sessionRes = await chatService.createSession()
        currentSessionId = sessionRes.data.id
        setSessionId(currentSessionId)
      }

      // Send message to AI via backend
      const response = await chatService.sendMessage(currentSessionId, trimmed)
      const aiContent = response.data?.content || response.data?.text || ''

      const { cleanText, movies } = parseAiResponse(aiContent)

      const aiMsg = {
        id: Date.now() + 1,
        type: 'ai',
        text: cleanText || (isVi ? FALLBACK_VI : FALLBACK_EN),
        movies,
      }

      setMessages((prev) => [...prev, aiMsg])

      // Fetch movie details for recommended movies
      if (movies.length > 0) {
        fetchMovieDetails(movies)
      }
    } catch (error) {
      console.error('AI Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'ai',
          text: isVi ? ERROR_VI : ERROR_EN,
          movies: [],
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = (suggestion) => {
    handleSend(suggestion)
  }

  const handleWatchNow = (movieId) => {
    onClose()
    navigate(`/movie/${movieId}`)
  }

  // Close panel without losing session/messages
  const handleClose = () => {
    onClose()
  }

  // Explicitly start a new chat (reset everything)
  const handleNewChat = () => {
    setMessages([])
    setSessionId(null)
    setMovieCache({})
    showWelcomeAndCreateSession()
  }

  if (!isOpen) return null

  const suggestions = isVi ? SUGGESTIONS_VI : SUGGESTIONS_EN

  return (
    <div className="ai-chat-panel">
      {/* Gradient border glow */}
      <div className="ai-chat-panel__glow" />

      <div className="ai-chat-panel__inner">
        {/* Header */}
        <div className="ai-chat-header">
          <div className="ai-chat-header__left">
            <div className="ai-chat-header__logo">
              <img src={logo} alt="SBA" />
            </div>
            <span className="ai-chat-header__title">SBA Movies AI</span>
            <span className="ai-chat-header__badge">GPT-4o</span>
          </div>
          <div className="ai-chat-header__actions">
            <button
              className="ai-chat-header__new"
              onClick={handleNewChat}
              type="button"
              aria-label="New chat"
              title={isVi ? 'Cuộc trò chuyện mới' : 'New chat'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button
              className="ai-chat-header__close"
              onClick={handleClose}
              type="button"
              aria-label="Close chat"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="ai-chat-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`ai-msg ${msg.type === 'user' ? 'ai-msg--user' : 'ai-msg--ai'}`}
            >
              {msg.type === 'ai' && (
                <div className="ai-msg__avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    <path d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
              )}
              <div className="ai-msg__content">
                <p className="ai-msg__text">{msg.text}</p>

                {/* Movie Recommendation Cards */}
                {msg.movies && msg.movies.length > 0 && (
                  <div className="ai-movie-list">
                    {msg.movies.map((movie) => {
                      const cached = movieCache[movie.id]
                      return (
                        <MovieRecommendationCard
                          key={movie.id}
                          movieId={movie.id}
                          reason={movie.reason}
                          detail={cached?.data}
                          isLoading={!cached || cached.loading}
                          onWatch={handleWatchNow}
                        />
                      )
                    })}
                  </div>
                )}

                {/* Suggestion chips (only on welcome) */}
                {msg.id === 'welcome' && (
                  <div className="ai-suggestions">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        className="ai-suggestion-chip"
                        type="button"
                        onClick={() => handleSuggestionClick(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="ai-msg ai-msg--ai">
              <div className="ai-msg__avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className="ai-msg__content">
                <div className="ai-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="ai-chat-input-wrap">
          <input
            ref={inputRef}
            className="ai-chat-input"
            type="text"
            placeholder={isVi ? PLACEHOLDER_VI : PLACEHOLDER_EN}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            className="ai-chat-send"
            type="button"
            onClick={() => handleSend()}
            disabled={isLoading || !inputValue.trim()}
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIChatbot
