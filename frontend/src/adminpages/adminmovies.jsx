import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminTaskbar from './admintaskbar.jsx';
import adminService from '../services/adminService';

const AdminMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('all');

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

  const handleApplyFilters = () => {
    setPage(0);
    fetchMovies();
  };

  const handleToggleActive = async (tmdbId, currentActive) => {
    try {
      if (currentActive) {
        if (window.confirm('Are you sure you want to deactivate this movie?')) {
          await adminService.deleteMovie(tmdbId);
          fetchMovies();
        }
      } else {
        if (window.confirm('Are you sure you want to restore this movie?')) {
          await adminService.restoreMovie(tmdbId);
          fetchMovies();
        }
      }
    } catch (err) {
      console.error('Error toggling movie status:', err);
      alert('Failed to update movie status');
    }
  };

  return (
    <div className="bg-[#0F172A] text-[#f8fafc] min-h-screen flex antialiased" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <AdminTaskbar />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 md:ml-64 relative bg-[#0F172A]">
        {/* Top Header */}
        <header className="flex justify-between items-center w-full px-[24px] py-[16px] sticky top-0 z-30 bg-[#0F172A] border-b border-[#334155] shadow-sm h-[72px]">
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-[16px]">
              <div>
                <h2 className="text-[32px] leading-[40px] font-bold text-[#f8fafc] tracking-[-0.01em]">Movies</h2>
                <p className="text-[14px] leading-[20px] text-[#94A3B8] mt-[4px]">Manage your content library, update metadata, and control visibility.</p>
              </div>
              <button className="bg-[#E50914] hover:brightness-110 active:brightness-90 text-white px-[24px] py-[8px] rounded-lg flex items-center gap-[8px] transition-all shadow-md text-[14px] font-medium shrink-0 h-[40px]">
                <span className="material-symbols-outlined text-[20px]">add</span>
                Add New Movie
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-[16px] bg-[#1E293B] p-[16px] rounded-lg border border-[#334155] shadow-sm">
              <div className="flex items-center gap-[8px] flex-1 min-w-[200px]">
                <span className="material-symbols-outlined text-[#94A3B8] text-[20px]">filter_list</span>
                <select 
                  value={isActive}
                  onChange={(e) => setIsActive(e.target.value)}
                  className="bg-[#0F172A] border border-[#334155] text-[14px] text-[#f8fafc] rounded-lg px-[16px] py-[8px] focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] w-full max-w-[150px] outline-none">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <button onClick={handleApplyFilters} className="bg-[#334155] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#475569] transition-colors ml-2">Filter</button>
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
                                    src={movie.posterPath ? `https://image.tmdb.org/t/p/w200${movie.posterPath}` : 'https://via.placeholder.com/200x300?text=No+Poster'}
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/200x300?text=No+Poster'; }}
                                  />
                                </div>
                                <div>
                                  <h3 className={`text-[18px] font-semibold text-[#f8fafc] group-hover:text-[#E50914] transition-colors ${!movie.isActive ? 'line-through decoration-[#334155]' : ''}`}>
                                    {movie.title}
                                  </h3>
                                  <div className="text-[12px] text-[#94A3B8] flex gap-[4px] items-center mt-[4px]">
                                    <span>{movie.releaseDate ? movie.releaseDate.substring(0, 4) : 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-[16px] py-[16px]">
                              <div className="flex flex-wrap gap-[4px]">
                                {movie.genres && movie.genres.length > 0 ? (
                                  movie.genres.map(g => (
                                    <span key={g.id} className="px-2 py-1 rounded bg-[#0F172A] border border-[#334155] text-[12px] text-[#94A3B8]">{g.name}</span>
                                  ))
                                ) : (
                                  <span className="text-[#94A3B8] text-[12px]">-</span>
                                )}
                              </div>
                            </td>
                            <td className="px-[16px] py-[16px]">
                              <div className="flex items-center gap-[4px] text-[#f8fafc]">
                                <span className="material-symbols-outlined text-[#E50914] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                <span className="font-medium">{movie.voteAverage || movie.averageRating || '--'}</span>
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
                                <Link to={`/admin/movies/${movie.tmdbId}`} className="p-1.5 text-[#94A3B8] hover:text-[#f8fafc] hover:bg-[#0F172A] rounded transition-colors" title="View Details">
                                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                                </Link>
                                <button className="p-1.5 text-[#94A3B8] hover:text-[#f8fafc] hover:bg-[#0F172A] rounded transition-colors" title="Edit">
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
                <div className="bg-[#0F172A] border-t border-[#334155] p-[16px] flex items-center justify-between text-[14px] text-[#94A3B8]">
                  <span>{movies.length > 0 ? `Showing ${(page * size) + 1} to ${(page * size) + movies.length} of ${totalElements} movies` : 'No results'}</span>
                  <div className="flex gap-[8px]">
                    <button 
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="p-1 rounded border border-[#334155] hover:bg-[#334155] disabled:opacity-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                    </button>
                    <button 
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                      className="p-1 rounded border border-[#334155] hover:bg-[#334155] transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminMovies;
