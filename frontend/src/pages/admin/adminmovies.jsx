import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminTaskbar from './admintaskbar.jsx';
import adminService from '../../services/adminService';
import { translateGenre } from '../../utils/genreTranslator.js';
import { useToast, ToastContainer } from '../../components/Toast.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';

const AdminMovies = () => {
  const { toasts, showToast, closeToast } = useToast();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null,
    confirmText: '',
    confirmColor: ''
  });

  // Filters
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('all');

  // Movie Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [allGenres, setAllGenres] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingBackdrop, setUploadingBackdrop] = useState(false);
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

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (field === 'posterPath') setUploadingPoster(true);
      else setUploadingBackdrop(true);

      const response = await adminService.uploadImage(file);
      setMovieForm(prev => ({ ...prev, [field]: response.url }));
      showToast('success', 'Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('error', 'Failed to upload image.');
    } finally {
      if (field === 'posterPath') setUploadingPoster(false);
      else setUploadingBackdrop(false);
      e.target.value = ''; // Reset file input
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPageButtons = 5;

    if (totalPages <= maxPageButtons) {
      for (let i = 0; i < totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let start = Math.max(0, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      if (page <= 1) {
        end = 3;
      } else if (page >= totalPages - 2) {
        start = totalPages - 4;
      }

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (start > 0) {
        if (start > 1) {
          pageNumbers.unshift('...');
        }
        pageNumbers.unshift(0);
      }

      if (end < totalPages - 1) {
        if (end < totalPages - 2) {
          pageNumbers.push('...');
        }
        pageNumbers.push(totalPages - 1);
      }
    }
    return pageNumbers;
  };

  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      const searchParam = search ? search : undefined;
      const activeParam = isActive !== 'all' ? (isActive === 'active') : undefined;
      
      const data = await adminService.getAllMovies(page, size, searchParam, activeParam);
      setMovies(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError(err?.response?.data?.message || 'Failed to load movies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [page]);

  useEffect(() => {
    const fetchTaxonomies = async () => {
      try {
        const [genresData, categoriesData] = await Promise.all([
          adminService.getAllGenres(),
          adminService.getAllCategories()
        ]);
        setAllGenres(genresData || []);
        setAllCategories(categoriesData || []);
      } catch (err) {
        console.error('Error fetching taxonomies:', err);
      }
    };
    fetchTaxonomies();
  }, []);

  const handleApplyFilters = () => {
    setPage(0);
    fetchMovies();
  };

  const handleOpenAddModal = () => {
    setMovieForm({
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
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (movie) => {
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
    setIsEditMode(true);
    setIsModalOpen(true);
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
        tmdbId: parseInt(movieForm.tmdbId),
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

      if (isEditMode) {
        await adminService.updateMovie(movieForm.tmdbId, data);
        showToast('success', 'Movie updated successfully!');
      } else {
        await adminService.createMovie(data);
        showToast('success', 'New movie added successfully!');
      }

      setIsModalOpen(false);
      fetchMovies();
    } catch (err) {
      console.error('Error saving movie:', err);
      showToast('error', err?.response?.data?.message || 'Failed to save movie.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = (tmdbId, currentActive) => {
    if (currentActive) {
      setConfirmModal({
        isOpen: true,
        title: 'Deactivate Movie',
        message: 'Are you sure you want to deactivate this movie?',
        action: async () => {
          try {
            await adminService.deleteMovie(tmdbId);
            fetchMovies();
          } catch (err) {
            console.error('Error toggling movie status:', err);
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
        message: 'Are you sure you want to restore this movie?',
        action: async () => {
          try {
            await adminService.restoreMovie(tmdbId);
            fetchMovies();
          } catch (err) {
            console.error('Error toggling movie status:', err);
            showToast('error', 'Cannot update movie status.');
          } finally {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
        },
        confirmText: 'Restore',
        confirmColor: 'bg-emerald-600 shadow-emerald-600/20'
      });
    }
  };

  const handleTogglePremium = async (tmdbId, currentPremium) => {
    try {
      await adminService.setMoviePremium(tmdbId, !currentPremium);
      showToast('success', `Movie marked as ${!currentPremium ? 'Premium' : 'Standard'} successfully!`);
      fetchMovies();
    } catch (err) {
      console.error('Error toggling premium status:', err);
      showToast('error', err?.response?.data?.message || 'Failed to update premium status.');
    }
  };

  return (
    <div className="bg-[#0F172A] text-[#f8fafc] min-h-screen flex antialiased" style={{ fontFamily: 'Inter, sans-serif' }}>
      <ToastContainer toasts={toasts} onClose={closeToast} />
      {/* Sidebar */}
      <AdminTaskbar />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 md:ml-64 relative bg-[#0F172A]">
        {/* Top Header */}
        <header className="flex justify-between items-center w-full px-[24px] py-[16px] sticky top-0 z-30 bg-[#0F172A] border-b border-[#334155] shadow-sm h-[72px] md:hidden">
          <div className="flex items-center flex-1 md:hidden">
            <button className="text-[#94A3B8] p-[8px] hover:bg-[#334155] rounded-lg transition-colors">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
          <div className="flex-1 flex items-center hidden md:flex">
            <div className="relative w-full max-w-md group">
              <span className="material-symbols-outlined absolute left-[8px] top-1/2 -translate-y-1/2 text-[#94A3B8] text-[20px] group-focus-within:text-[#E50914] transition-colors">search</span>
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg pl-[32px] pr-[16px] py-[8px] text-[14px] leading-[20px] text-[#f8fafc] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-all" 
                placeholder="Search movies by title..." 
                type="text"
              />
            </div>
            <button onClick={handleApplyFilters} className="ml-4 bg-[#334155] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#475569] transition-colors">Search</button>
          </div>
          <div className="flex items-center gap-[8px]">
            <button className="text-[#94A3B8] hover:text-[#f8fafc] hover:bg-[#334155] p-[8px] rounded-full transition-colors cursor-pointer active:opacity-80">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="text-[#94A3B8] hover:text-[#f8fafc] hover:bg-[#334155] p-[8px] rounded-full transition-colors cursor-pointer active:opacity-80">
              <span className="material-symbols-outlined">contrast</span>
            </button>
            <div className="h-8 w-8 rounded-full overflow-hidden ml-[8px] border border-[#334155] cursor-pointer hover:border-[#E50914] transition-colors">
              <img alt="Administrator Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1nkEsS53TQtTacn5ay6hcqL_4MV72553eqnYXI5ofn93SUHz2-cIspkaiWIn35raIp5aAVZZ5r2fyj4fWdUEr_WokzyxK0qiyQrk_l0yctXbK-9rzu99Lj1jmEqUwZxcmyJ5xgAR7PPfzdmz5_MEu_HkPs_Zy46rh5Ua-vnm6s-loeN7O_o8WHRjaWr8kmaZu3MHMPBD0hNy9bVyQLYrr6PAPjf4Lskdnn_AxhyCDWdAfNaoN7Zz5DPin3IdWk-7LIY8sww2OEsx5"/>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-[16px] lg:p-[24px]">
          <div className="max-w-[1600px] mx-auto flex flex-col gap-[24px]">
            
            {/* Title & Add Button */}
            <div className="flex justify-between items-end text-left w-full">
              <div className="text-left">
                <h1 className="text-[32px] leading-[40px] tracking-[-0.01em] md:text-[48px] md:leading-[1.1] md:tracking-[-0.02em] font-extrabold text-[#f8fafc] text-left mx-0 max-w-none">Movies</h1>
                <p className="text-[16px] leading-[24px] text-[#94A3B8] mt-[4px] text-left">Manage your content library, update metadata, and control visibility.</p>
              </div>
              <button onClick={handleOpenAddModal} className="bg-[#E50914] hover:brightness-110 active:brightness-90 text-white px-[24px] py-[8px] rounded-lg flex items-center gap-[8px] transition-all shadow-md text-[14px] font-medium shrink-0 h-[40px] cursor-pointer mb-[4px]">
                <span className="material-symbols-outlined text-[20px]">add</span>
                Add New Movie
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-[16px] bg-[#1E293B] p-[16px] rounded-lg border border-[#334155] shadow-sm">
              <div className="relative flex-1 min-w-[260px] max-w-md group">
                <span className="material-symbols-outlined absolute left-[8px] top-1/2 -translate-y-1/2 text-[#94A3B8] text-[20px] group-focus-within:text-[#E50914] transition-colors">search</span>
                <input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg pl-[32px] pr-[16px] py-[8px] text-[14px] leading-[20px] text-[#f8fafc] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] transition-all" 
                  placeholder="Search movies by title..." 
                  type="text"
                />
              </div>
              <div className="flex items-center gap-[8px] min-w-[200px]">
                <span className="material-symbols-outlined text-[#94A3B8] text-[20px]">filter_list</span>
                <div className="relative w-full max-w-[150px]">
                  <select 
                    value={isActive}
                    onChange={(e) => setIsActive(e.target.value)}
                    className="bg-[#0F172A] border border-[#334155] text-[14px] text-[#f8fafc] rounded-lg pl-[16px] pr-[36px] py-[8px] focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] w-full outline-none appearance-none cursor-pointer">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">arrow_drop_down</span>
                </div>
                <button onClick={handleApplyFilters} className="bg-[#E50914] hover:brightness-110 active:brightness-90 text-white px-4 py-2 rounded-lg text-sm transition-all font-medium ml-2">Apply Filters</button>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                <span className="material-symbols-outlined text-red-400 text-[48px] mb-4 block">error</span>
                <p className="text-red-400 text-lg font-medium mb-2">Error Loading Movies</p>
                <p className="text-[#94a3b8] text-sm">{error}</p>
                <button onClick={fetchMovies} className="mt-4 bg-[#334155] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#475569] transition-colors">Retry</button>
              </div>
            )}

            {/* Table */}
            {!error && (
              <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-[#0F172A] border-b border-[#334155] text-[12px] text-[#94A3B8] uppercase tracking-wider">
                        <th className="px-[16px] py-[16px] font-medium">Movie</th>
                        <th className="px-[16px] py-[16px] font-medium">Genres</th>
                        <th className="px-[16px] py-[16px] font-medium">Rating</th>
                        <th className="px-[16px] py-[16px] font-medium">Views</th>
                        <th className="px-[16px] py-[16px] font-medium">Status</th>
                        <th className="px-[16px] py-[16px] font-medium">Added</th>
                        <th className="px-[16px] py-[16px] font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-[14px] divide-y divide-[#334155]">
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="px-[16px] py-[32px] text-center text-[#94A3B8]">
                            <span className="material-symbols-outlined animate-spin mr-2 align-middle">progress_activity</span>
                            Loading movies...
                          </td>
                        </tr>
                      ) : movies.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-[16px] py-[32px] text-center text-[#94A3B8]">No movies found</td>
                        </tr>
                      ) : (
                        movies.map(movie => (
                          <tr key={movie.tmdbId} className={`hover:bg-[#334155]/50 transition-colors group ${!movie.isActive ? 'opacity-60' : ''}`}>
                            <td className="px-[16px] py-[16px]">
                              <div className="flex items-center gap-[16px]">
                                <div className={`w-12 h-16 rounded overflow-hidden shrink-0 bg-[#0F172A] border border-[#334155] relative ${!movie.isActive ? 'grayscale' : ''}`}>
                                  <img 
                                    alt={movie.title} 
                                    className="w-full h-full object-cover" 
                                    src={movie.posterPath ? (movie.posterPath.startsWith('http') ? movie.posterPath : `https://image.tmdb.org/t/p/w200${movie.posterPath}`) : 'https://via.placeholder.com/200x300?text=No+Poster'}
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/200x300?text=No+Poster'; }}
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className={`text-[18px] font-semibold text-[#f8fafc] group-hover:text-[#E50914] transition-colors ${!movie.isActive ? 'line-through decoration-[#334155]' : ''}`}>
                                      {movie.title}
                                    </h3>
                                    {movie.isPremium && (
                                      <span className="bg-yellow-500/20 text-yellow-500 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-yellow-500/30">Premium</span>
                                    )}
                                  </div>
                                  <div className="text-[12px] text-[#94A3B8] flex gap-[4px] items-center mt-[4px]">
                                    <span>{movie.releaseDate ? movie.releaseDate.substring(0, 10) : 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-[16px] py-[16px]">
                              <div className="flex flex-wrap gap-[4px]">
                                {movie.genres && movie.genres.length > 0 ? (
                                  movie.genres.map(g => (
                                    <span key={g.id} className="px-2 py-1 rounded bg-[#0F172A] border border-[#334155] text-[12px] text-[#94A3B8]">{translateGenre(g.name)}</span>
                                  ))
                                ) : (
                                  <span className="text-[#94A3B8] text-[12px]">-</span>
                                )}
                              </div>
                            </td>
                            <td className="px-[16px] py-[16px]">
                              <div className="flex items-center gap-[4px] text-[#f8fafc]">
                                <span className="material-symbols-outlined text-[#E50914] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                <span className="font-medium">{movie.voteAverage ? (movie.voteAverage / 2).toFixed(1) : movie.averageRating ? (movie.averageRating / 2).toFixed(1) : '--'}</span>
                              </div>
                            </td>
                            <td className="px-[16px] py-[16px] text-[#94A3B8]">{movie.totalViews || 0}</td>
                            <td className="px-[16px] py-[16px]">
                              {movie.isActive ? (
                                <span className="inline-flex items-center px-2 py-1 rounded text-[12px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded text-[12px] bg-[#334155] text-[#f8fafc] border border-[#334155]">Inactive</span>
                              )}
                            </td>
                            <td className="px-[16px] py-[16px] text-[#94A3B8]">
                              {movie.addedAt ? new Date(movie.addedAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-[16px] py-[16px] text-right">
                              <div className="flex items-center justify-end gap-[8px] opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleTogglePremium(movie.tmdbId, movie.isPremium)} className={`p-1.5 rounded transition-colors cursor-pointer ${movie.isPremium ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-[#94A3B8] hover:text-yellow-500 hover:bg-[#0F172A]'}`} title={movie.isPremium ? "Remove Premium" : "Make Premium"}>
                                  <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
                                </button>
                                <Link to={`/admin/movies/${movie.tmdbId}`} className="p-1.5 text-[#94A3B8] hover:text-[#f8fafc] hover:bg-[#0F172A] rounded transition-colors" title="View Details">
                                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                                </Link>
                                <button onClick={() => handleOpenEditModal(movie)} className="p-1.5 text-[#94A3B8] hover:text-[#f8fafc] hover:bg-[#0F172A] rounded transition-colors cursor-pointer" title="Edit">
                                  <span className="material-symbols-outlined text-[20px]">edit</span>
                                </button>
                                {movie.isActive ? (
                                  <button onClick={() => handleToggleActive(movie.tmdbId, true)} className="p-1.5 text-[#94A3B8] hover:text-[#E50914] hover:bg-[#0F172A] rounded transition-colors" title="Deactivate">
                                    <span className="material-symbols-outlined text-[20px]">block</span>
                                  </button>
                                ) : (
                                  <button onClick={() => handleToggleActive(movie.tmdbId, false)} className="p-1.5 text-[#94A3B8] hover:text-emerald-400 hover:bg-[#0F172A] rounded transition-colors" title="Restore">
                                    <span className="material-symbols-outlined text-[20px]">restore</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="bg-[#0F172A] border-t border-[#334155] p-[16px] flex items-center justify-between text-xs text-[#94A3B8] font-['Inter']">
                  <span>{movies.length > 0 ? `Showing ${(page * size) + 1} to ${(page * size) + movies.length} of ${totalElements} movies` : 'No results'}</span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="h-7 px-2.5 flex items-center gap-1 rounded-md border border-[#334155] text-xs font-medium text-[#94A3B8] hover:bg-[#1E293B] hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                      <span>Prev</span>
                    </button>
                    
                    {getPageNumbers().map((pageNum, idx) => {
                      if (pageNum === '...') {
                        return (
                          <span key={`dots-${idx}`} className="h-7 px-1 flex items-end justify-center text-[#94a3b8] text-xs">
                            ...
                          </span>
                        );
                      }
                      const isCurrent = pageNum === page;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`h-7 min-w-[28px] px-2 flex items-center justify-center rounded-md text-xs font-medium transition-all ${
                            isCurrent 
                              ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/25' 
                              : 'border border-[#334155] text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}

                    <button 
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                      className="h-7 px-2.5 flex items-center gap-1 rounded-md border border-[#334155] text-xs font-medium text-[#94A3B8] hover:bg-[#1E293B] hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <span>Next</span>
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Add / Edit Movie Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl w-full max-w-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] my-8 overflow-hidden font-['Inter']">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#334155]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#E50914]">{isEditMode ? 'edit' : 'add_box'}</span>
                {isEditMode ? 'Edit Movie Metadata' : 'Add New Movie'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
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
                    onChange={(e) => setMovieForm(prev => ({ ...prev, tmdbId: e.target.value }))}
                    required
                    disabled={isEditMode}
                    className="bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-[#E50914] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g. 299534"
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
                  <div className="flex justify-between items-center">
                    <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">Poster Path</label>
                    <label className="text-[10px] text-[#E50914] cursor-pointer hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">upload</span>
                      Upload Local
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'posterPath')} disabled={uploadingPoster} />
                    </label>
                  </div>
                  <div className="relative w-full">
                    <input 
                      type="text" 
                      value={movieForm.posterPath} 
                      onChange={(e) => setMovieForm(prev => ({ ...prev, posterPath: e.target.value }))}
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-[#E50914] transition-colors text-sm pr-8"
                      placeholder="e.g. /or06509IRZ11Bebyp11xCeOO14C.jpg"
                      disabled={uploadingPoster}
                    />
                    {uploadingPoster && <span className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#94A3B8] animate-spin text-[16px]">progress_activity</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">Backdrop Path</label>
                    <label className="text-[10px] text-[#E50914] cursor-pointer hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">upload</span>
                      Upload Local
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'backdropPath')} disabled={uploadingBackdrop} />
                    </label>
                  </div>
                  <div className="relative w-full">
                    <input 
                      type="text" 
                      value={movieForm.backdropPath} 
                      onChange={(e) => setMovieForm(prev => ({ ...prev, backdropPath: e.target.value }))}
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-[#E50914] transition-colors text-sm pr-8"
                      placeholder="e.g. /7D643gUjV49v88c5rX65l7B0oT9.jpg"
                      disabled={uploadingBackdrop}
                    />
                    {uploadingBackdrop && <span className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#94A3B8] animate-spin text-[16px]">progress_activity</span>}
                  </div>
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
              <div className="grid grid-cols-1 gap-4 pt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">Genres</label>
                  <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-3 max-h-[150px] overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-2">
                    {allGenres.map(g => (
                      <label key={g.id} className="flex items-center gap-2 text-xs text-[#f8fafc] cursor-pointer hover:text-white">
                        <input 
                          type="checkbox" 
                          checked={movieForm.genreIds.includes(g.id)}
                          onChange={() => handleGenreCheckboxChange(g.id)}
                          className="accent-[#E50914]"
                        />
                        <span className="truncate">{translateGenre(g.name)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#334155]">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
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

export default AdminMovies;
