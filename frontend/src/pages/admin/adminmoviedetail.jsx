import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminTaskbar from './admintaskbar.jsx';
import { adminService } from '../../services';
import { useToast, ToastContainer } from '../../components/Toast.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';

const AdminMovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, showToast, closeToast } = useToast();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    confirmText: '',
    confirmColor: ''
  });

  // Movie Form Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [allGenres, setAllGenres] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [movieForm, setMovieForm] = useState({
    tmdbId: '',
    title: '',
    overview: '',
    posterPath: '',
    backdropPath: '',
    releaseDate: '',
    voteAverage: '',
    voteCount: '',
    trailerUrl: '',
    genreIds: [],
    categoryIds: []
  });

  const fetchMovieDetail = async () => {
    try {
      setLoading(true);
      const data = await adminService.getMovieDetail(id);
      setMovie(data);
    } catch (error) {
      console.error('Error fetching movie detail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchMovieDetail();
    }
  }, [id]);

  useEffect(() => {
    const fetchTaxonomies = async () => {
      try {
        const [genresData, categoriesData] = await Promise.all([
          adminService.getAllGenres(),
          adminService.getAllCategories()
        ]);
        setAllGenres(genresData || []);
        setAllCategories(categoriesData || []);
      } catch (error) {
        console.error('Error fetching taxonomies:', error);
      }
    };
    fetchTaxonomies();
  }, []);

  const handleOpenEditModal = () => {
    if (!movie) return;
    setMovieForm({
      tmdbId: movie.tmdbId,
      title: movie.title || '',
      overview: movie.overview || '',
      posterPath: movie.posterPath || '',
      backdropPath: movie.backdropPath || '',
      releaseDate: movie.releaseDate ? movie.releaseDate.substring(0, 16) : '',
      voteAverage: movie.voteAverage || '',
      voteCount: movie.voteCount || '',
      trailerUrl: movie.trailerUrl || '',
      genreIds: movie.genres ? movie.genres.map(g => g.id) : [],
      categoryIds: movie.categories ? movie.categories.map(c => typeof c === 'object' && c !== null ? (c.categoryId || c.category_id) : c).filter(id => id != null) : []
    });
    setIsEditModalOpen(true);
  };

  const handleGenreCheckboxChange = (genreId) => {
    setMovieForm(prev => {
      const isSelected = prev.genreIds.includes(genreId);
      const newGenreIds = isSelected 
        ? prev.genreIds.filter(id => id !== genreId)
        : [...prev.genreIds, genreId];
      return { ...prev, genreIds: newGenreIds };
    });
  };

  const handleCategoryCheckboxChange = (catId) => {
    setMovieForm(prev => {
      const isSelected = prev.categoryIds.includes(catId);
      const newCategoryIds = isSelected
        ? prev.categoryIds.filter(id => id !== catId)
        : [...prev.categoryIds, catId];
      return { ...prev, categoryIds: newCategoryIds };
    });
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const data = {
        title: movieForm.title,
        overview: movieForm.overview,
        posterPath: movieForm.posterPath,
        backdropPath: movieForm.backdropPath,
        releaseDate: movieForm.releaseDate ? new Date(movieForm.releaseDate).toISOString() : null,
        voteAverage: movieForm.voteAverage ? parseFloat(movieForm.voteAverage) : null,
        voteCount: movieForm.voteCount ? parseInt(movieForm.voteCount) : null,
        trailerUrl: movieForm.trailerUrl,
        genreIds: movieForm.genreIds,
        categoryIds: movieForm.categoryIds
      };

      const updated = await adminService.updateMovie(movieForm.tmdbId, data);
      showToast('success', 'Movie updated successfully!');
      setMovie(updated);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error saving movie details:', err);
      showToast('error', err?.response?.data?.message || 'Failed to save movie information.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = () => {
    if (movie.isActive) {
      setConfirmModal({
        isOpen: true,
        title: 'Deactivate Movie',
        message: 'Are you sure you want to deactivate this movie? It will no longer be visible to regular users.',
        action: async () => {
          try {
            await adminService.deleteMovie(id);
            fetchMovieDetail();
          } catch (err) {
            console.error('Error deactivating movie:', err);
            showToast('error', 'Cannot update movie status.');
          } finally {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
        },
        confirmText: 'Deactivate',
        confirmColor: 'bg-red-600'
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: 'Restore Movie',
        message: 'Are you sure you want to restore this movie? It will become visible to users again.',
        action: async () => {
          try {
            await adminService.restoreMovie(id);
            fetchMovieDetail();
          } catch (err) {
            console.error('Error restoring movie:', err);
            showToast('error', 'Cannot update movie status.');
          } finally {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
        },
        confirmText: 'Restore',
        confirmColor: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0F172A] text-[#f8fafc] min-h-screen flex antialiased" style={{ fontFamily: 'Inter, sans-serif' }}>
        <ToastContainer toasts={toasts} onClose={closeToast} />
        <AdminTaskbar />
        <main className="flex-1 md:ml-64 min-h-screen flex items-center justify-center">
          <div className="text-[#94A3B8]">Loading movie details...</div>
        </main>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="bg-[#0F172A] text-[#f8fafc] min-h-screen flex antialiased" style={{ fontFamily: 'Inter, sans-serif' }}>
        <AdminTaskbar />
        <main className="flex-1 md:ml-64 min-h-screen flex items-center justify-center flex-col gap-4">
          <div className="text-[#94A3B8]">Movie not found</div>
          <button onClick={() => navigate('/admin/movies')} className="text-[#E50914] hover:underline">Back to Movies</button>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#0F172A] text-[#f8fafc] min-h-screen flex antialiased" style={{ fontFamily: 'Inter, sans-serif' }}>
      <ToastContainer toasts={toasts} onClose={closeToast} />
      {/* Sidebar */}
      <AdminTaskbar />
      
      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 min-h-screen relative pb-[64px] bg-[#0F172A]">
        {/* Top Actions Bar (Sticky) */}
        <header className="sticky top-0 z-40 w-full px-[24px] py-[16px] flex justify-between items-center bg-[#0F172A]/80 backdrop-blur-md border-b border-[#334155]">
          <button onClick={() => navigate('/admin/movies')} className="text-[#94A3B8] hover:text-[#f8fafc] flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back
          </button>
          <div className="flex gap-[16px]">
            <button onClick={handleOpenEditModal} className="h-10 px-[16px] rounded border border-[#334155] text-[#f8fafc] hover:bg-[#334155] transition-colors flex items-center gap-[8px] cursor-pointer">
              <span className="material-symbols-outlined text-[14px]">edit</span>
              <span className="text-[12px] font-medium tracking-wide uppercase">Edit Metadata</span>
            </button>
            <button 
              onClick={handleToggleActive}
              className={`h-10 px-[16px] rounded transition-all flex items-center gap-[8px] ${movie.isActive ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'}`}
            >
              <span className="material-symbols-outlined text-[14px]">{movie.isActive ? 'block' : 'restore'}</span>
              <span className="text-[12px] font-medium tracking-wide uppercase">{movie.isActive ? 'Deactivate' : 'Restore'}</span>
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative w-full h-[512px] min-h-[400px] flex items-end">
          {/* Backdrop Image */}
          <div className="absolute inset-0 w-full h-full bg-[#1E293B] overflow-hidden z-0">
            <img 
              alt="Movie Backdrop" 
              className="w-full h-full object-cover opacity-40 object-top" 
              src={movie.backdropPath ? (movie.backdropPath.startsWith('http') ? movie.backdropPath : `https://image.tmdb.org/t/p/original${movie.backdropPath}`) : 'https://via.placeholder.com/1920x1080?text=No+Backdrop'}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/1920x1080?text=No+Backdrop'; }}
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0F172A 0%, rgba(15, 23, 42, 0.4) 50%, rgba(15, 23, 42, 0) 100%)' }}></div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 w-full px-[24px] pb-[32px] flex items-end gap-[32px] max-w-[1440px] mx-auto">
            {/* Poster */}
            <div className="w-48 h-72 flex-shrink-0 rounded-lg overflow-hidden border border-[#334155] shadow-2xl bg-[#0F172A] translate-y-12">
              <img 
                alt="Movie Poster" 
                className="w-full h-full object-cover" 
                src={movie.posterPath ? (movie.posterPath.startsWith('http') ? movie.posterPath : `https://image.tmdb.org/t/p/w500${movie.posterPath}`) : 'https://via.placeholder.com/500x750?text=No+Poster'}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster'; }}
              />
            </div>
            
            {/* Titles */}
            <div className="flex-grow pb-[8px]">
              <div className="flex items-center gap-[8px] mb-[4px]">
                {movie.isActive ? (
                  <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-[10px] uppercase tracking-widest border border-green-500/20 font-medium">Active</span>
                ) : (
                  <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] uppercase tracking-widest border border-red-500/20 font-medium">Inactive</span>
                )}
                <span className="text-[12px] text-[#94A3B8] font-medium tracking-wide">TMDB ID: {movie.tmdbId}</span>
              </div>
              <h2 className="text-[48px] font-extrabold leading-[1.1] tracking-[-0.02em] text-[#f8fafc] drop-shadow-md mb-2">{movie.title}</h2>
              <div className="flex items-center gap-[16px] text-[14px] text-[#94A3B8]">
                <span>{movie.releaseDate ? movie.releaseDate.substring(0, 4) : 'N/A'}</span>
                <span className="w-1 h-1 rounded-full bg-[#334155]"></span>
                <span>{movie.runtime || 120} min</span>
                <span className="w-1 h-1 rounded-full bg-[#334155]"></span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">4k</span> UHD</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Details */}
        <div className="px-[24px] pt-[48px] pb-[32px] max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-[24px]">
            {/* Left Column (Wider) */}
            <div className="lg:col-span-8 flex flex-col gap-[24px]">
              
              {/* Stats Strip */}
              <div className="grid grid-cols-3 gap-[16px]">
                <div className="bg-[#1E293B]/80 backdrop-blur-md border border-[#334155] rounded-lg p-[16px] flex flex-col hover:bg-[#1E293B] hover:border-[#475569] transition-all">
                  <span className="text-[12px] text-[#94A3B8] mb-[8px] flex items-center gap-[4px] font-medium tracking-wide">
                    <span className="material-symbols-outlined text-[16px]">visibility</span> Total Views
                  </span>
                  <span className="text-[32px] font-bold tracking-[-0.01em] text-[#f8fafc] leading-[40px]">{movie.totalViews || 0}</span>
                </div>
                <div className="bg-[#1E293B]/80 backdrop-blur-md border border-[#334155] rounded-lg p-[16px] flex flex-col hover:bg-[#1E293B] hover:border-[#475569] transition-all">
                  <span className="text-[12px] text-[#94A3B8] mb-[8px] flex items-center gap-[4px] font-medium tracking-wide">
                    <span className="material-symbols-outlined text-[16px]">star</span> Average Rating
                  </span>
                  <span className="text-[32px] font-bold tracking-[-0.01em] text-[#f8fafc] leading-[40px]">{movie.voteAverage ? (movie.voteAverage / 2).toFixed(1) : movie.averageRating ? (movie.averageRating / 2).toFixed(1) : '--'}</span>
                  <span className="text-[10px] font-medium tracking-wide text-[#94A3B8] mt-1">From {movie.totalReviews || movie.voteCount || 0} reviews</span>
                </div>
                <div className="bg-[#1E293B]/80 backdrop-blur-md border border-[#334155] rounded-lg p-[16px] flex flex-col hover:bg-[#1E293B] hover:border-[#475569] transition-all">
                  <span className="text-[12px] text-[#94A3B8] mb-[8px] flex items-center gap-[4px] font-medium tracking-wide">
                    <span className="material-symbols-outlined text-[16px]">bookmark</span> Watchlists
                  </span>
                  <span className="text-[32px] font-bold tracking-[-0.01em] text-[#f8fafc] leading-[40px]">{movie.totalWatchlist || 0}</span>
                </div>
              </div>

              {/* Overview */}
              <div className="bg-[#1E293B]/80 backdrop-blur-md border border-[#334155] rounded-lg p-[24px]">
                <h3 className="text-[18px] font-semibold leading-[28px] text-[#f8fafc] mb-[16px]">Overview</h3>
                <p className="text-[16px] leading-[24px] text-[#94A3B8]">
                  {movie.overview || 'No overview available.'}
                </p>
              </div>

              {/* Video / Trailer Preview */}
              <div className="bg-[#1E293B]/80 backdrop-blur-md border border-[#334155] rounded-lg p-[24px]">
                <div className="flex justify-between items-center mb-[16px]">
                  <h3 className="text-[18px] font-semibold leading-[28px] text-[#f8fafc]">Trailer Configuration</h3>
                  <button onClick={handleOpenEditModal} className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors text-[12px] font-medium tracking-wide cursor-pointer">Update Link</button>
                </div>
                <div className="flex items-center gap-[16px] bg-[#0F172A] border border-[#334155] rounded-lg p-[8px]">
                  <div className="w-24 h-16 bg-[#1E293B] rounded flex items-center justify-center border border-[#334155] shrink-0">
                    <span className="material-symbols-outlined text-[#94A3B8] text-[24px]">play_circle</span>
                  </div>
                  <div className="flex flex-col overflow-hidden w-full">
                    <span className="text-[12px] font-medium tracking-wide text-[#f8fafc] truncate">Main Theatrical Trailer</span>
                    <span className="text-[13px] text-[#94A3B8] truncate font-['Geist'] mt-1">{movie.trailerUrl || 'No trailer URL'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column (Narrower) */}
            <div className="lg:col-span-4 flex flex-col gap-[24px]">
              
              {/* Taxonomies */}
              <div className="bg-[#1E293B]/80 backdrop-blur-md border border-[#334155] rounded-lg p-[24px]">
                <h3 className="text-[18px] font-semibold leading-[28px] text-[#f8fafc] mb-[16px]">Taxonomy</h3>
                
                <div className="mb-[16px]">
                  <span className="text-[12px] font-medium tracking-wide text-[#94A3B8] block mb-[8px]">Genres</span>
                  <div className="flex flex-wrap gap-[8px]">
                    {movie.genres && movie.genres.length > 0 ? (
                      movie.genres.map(g => (
                        <span key={g.id} className="px-3 py-1 rounded-full bg-[#334155]/50 border border-[#334155] text-[12px] font-medium tracking-wide text-[#f8fafc] hover:bg-[#334155] transition-colors cursor-pointer">{g.name}</span>
                      ))
                    ) : (
                      <span className="text-[#94A3B8] text-sm">No genres assigned</span>
                    )}
                    <button onClick={handleOpenEditModal} className="px-3 py-1 rounded-full border border-dashed border-[#475569] text-[#94A3B8] hover:text-[#f8fafc] hover:border-[#94A3B8] transition-colors flex items-center justify-center cursor-pointer">
                      <span className="material-symbols-outlined text-[14px]">add</span>
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[12px] font-medium tracking-wide text-[#94A3B8] block mb-[8px]">Categories</span>
                  <div className="flex flex-wrap gap-[8px]">
                    {movie.categories && movie.categories.length > 0 ? (
                      movie.categories.map(cat => (
                        <span key={cat.categoryId || cat.category_id} className="px-3 py-1 rounded bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/30 text-[12px] font-medium tracking-wide capitalize hover:bg-[#3b82f6]/30 cursor-pointer" onClick={handleOpenEditModal}>{cat.name}</span>
                      ))
                    ) : (
                      <span className="text-[#94A3B8] text-sm">No categories assigned</span>
                    )}
                    <button onClick={handleOpenEditModal} className="px-3 py-1 rounded-full border border-dashed border-[#475569] text-[#94A3B8] hover:text-[#f8fafc] hover:border-[#94A3B8] transition-colors flex items-center justify-center cursor-pointer">
                      <span className="material-symbols-outlined text-[14px]">add</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Technical Meta */}
              <div className="bg-[#1E293B]/80 backdrop-blur-md border border-[#334155] rounded-lg p-[24px]">
                <h3 className="text-[18px] font-semibold leading-[28px] text-[#f8fafc] mb-[16px]">Technical Details</h3>
                <div className="flex flex-col gap-[8px]">
                  <div className="flex justify-between items-center py-2 border-b border-[#334155]">
                    <span className="text-[14px] text-[#94A3B8]">Release Date</span>
                    <span className="text-[12px] font-medium tracking-wide text-[#f8fafc]">{movie.releaseDate || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#334155]">
                    <span className="text-[14px] text-[#94A3B8]">Added By</span>
                    <span className="text-[12px] font-medium tracking-wide text-[#f8fafc]">{movie.addedByName || `Admin ID: ${movie.addedBy || 'N/A'}`}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[14px] text-[#94A3B8]">Added Date</span>
                    <span className="text-[12px] font-medium tracking-wide text-[#f8fafc]">{movie.addedAt ? new Date(movie.addedAt).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Edit Movie Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl w-full max-w-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] my-8 overflow-hidden font-['Inter']">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#334155]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#E50914]">edit</span>
                Edit Movie Metadata
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="text-[#94A3B8] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {/* Form */}
            <form onSubmit={handleSaveMovie} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">TMDB ID</label>
                  <input 
                    type="number" 
                    value={movieForm.tmdbId} 
                    disabled
                    className="bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-3 text-[#94A3B8] cursor-not-allowed text-sm focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">Title</label>
                  <input 
                    type="text" 
                    value={movieForm.title} 
                    onChange={(e) => setMovieForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-[#E50914] transition-colors text-sm"
                    placeholder="Movie title"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">Release Date</label>
                  <input 
                    type="datetime-local" 
                    value={movieForm.releaseDate} 
                    onChange={(e) => setMovieForm(prev => ({ ...prev, releaseDate: e.target.value }))}
                    className="bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-[#E50914] transition-colors text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">Vote Average (Rating)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    min="0" 
                    max="10"
                    value={movieForm.voteAverage} 
                    onChange={(e) => setMovieForm(prev => ({ ...prev, voteAverage: e.target.value }))}
                    className="bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-[#E50914] transition-colors text-sm"
                    placeholder="e.g. 8.5"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">Vote Count</label>
                  <input 
                    type="number" 
                    value={movieForm.voteCount} 
                    onChange={(e) => setMovieForm(prev => ({ ...prev, voteCount: e.target.value }))}
                    className="bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-[#E50914] transition-colors text-sm"
                    placeholder="e.g. 12000"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">Overview</label>
                <textarea 
                  rows="3" 
                  value={movieForm.overview} 
                  onChange={(e) => setMovieForm(prev => ({ ...prev, overview: e.target.value }))}
                  className="bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-[#E50914] transition-colors resize-none text-sm"
                  placeholder="Movie overview..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">Poster Path</label>
                  <input 
                    type="text" 
                    value={movieForm.posterPath} 
                    onChange={(e) => setMovieForm(prev => ({ ...prev, posterPath: e.target.value }))}
                    className="bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-[#E50914] transition-colors text-sm"
                    placeholder="e.g. /or06509IRZ11Bebyp11xCeOO14C.jpg"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">Backdrop Path</label>
                  <input 
                    type="text" 
                    value={movieForm.backdropPath} 
                    onChange={(e) => setMovieForm(prev => ({ ...prev, backdropPath: e.target.value }))}
                    className="bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-[#E50914] transition-colors text-sm"
                    placeholder="e.g. /7D643gUjV49v88c5rX65l7B0oT9.jpg"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">Trailer URL</label>
                <input 
                  type="text" 
                  value={movieForm.trailerUrl} 
                  onChange={(e) => setMovieForm(prev => ({ ...prev, trailerUrl: e.target.value }))}
                  className="bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-[#E50914] transition-colors text-sm"
                  placeholder="e.g. https://www.youtube.com/embed/dQw4w9WgXcQ"
                />
              </div>

              {/* Taxonomies Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">Genres</label>
                  <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 max-h-[150px] overflow-y-auto grid grid-cols-2 gap-2">
                    {allGenres.map(g => (
                      <label key={g.id} className="flex items-center gap-2 text-xs text-[#f8fafc] cursor-pointer hover:text-white">
                        <input 
                          type="checkbox" 
                          checked={movieForm.genreIds.includes(g.id)}
                          onChange={() => handleGenreCheckboxChange(g.id)}
                          className="accent-[#E50914]"
                        />
                        <span className="truncate">{g.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">Categories</label>
                  <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 max-h-[150px] overflow-y-auto space-y-2">
                    {allCategories.map(cat => {
                      const catId = cat.categoryId || cat.category_id;
                      return (
                        <label key={catId} className="flex items-center gap-2 text-xs text-[#f8fafc] cursor-pointer hover:text-white">
                          <input 
                            type="checkbox" 
                            checked={movieForm.categoryIds.includes(catId)}
                            onChange={() => handleCategoryCheckboxChange(catId)}
                            className="accent-[#E50914]"
                          />
                          <span className="capitalize">{cat.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#334155]">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#334155] text-[#94A3B8] hover:text-white hover:bg-[#334155] transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#E50914] text-white hover:brightness-110 active:brightness-90 transition-all font-medium text-sm flex items-center gap-1 shadow-lg shadow-[#E50914]/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        confirmText={confirmModal.confirmText}
        confirmColor={confirmModal.confirmColor}
      />
    </div>
  );
};

export default AdminMovieDetail;
