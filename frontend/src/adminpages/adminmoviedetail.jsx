import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminTaskbar from './admintaskbar.jsx';
import { adminService } from '../services';

const AdminMovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    if (id) {
      fetchMovieDetail();
    }
  }, [id]);

  const handleToggleActive = async () => {
    try {
      if (movie.isActive) {
        if (window.confirm('Are you sure you want to deactivate this movie?')) {
          await adminService.deleteMovie(id);
          setMovie({ ...movie, isActive: false });
        }
      } else {
        if (window.confirm('Are you sure you want to restore this movie?')) {
          await adminService.restoreMovie(id);
          setMovie({ ...movie, isActive: true });
        }
      }
    } catch (error) {
      console.error('Error toggling movie status:', error);
      alert('Failed to update movie status');
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0F172A] text-[#f8fafc] min-h-screen flex antialiased" style={{ fontFamily: 'Inter, sans-serif' }}>
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
            <button className="h-10 px-[16px] rounded border border-[#334155] text-[#f8fafc] hover:bg-[#334155] transition-colors flex items-center gap-[8px]">
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
              src={movie.backdropPath ? `https://image.tmdb.org/t/p/original${movie.backdropPath}` : 'https://via.placeholder.com/1920x1080?text=No+Backdrop'}
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
                src={movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : 'https://via.placeholder.com/500x750?text=No+Poster'}
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
                  <span className="text-[32px] font-bold tracking-[-0.01em] text-[#f8fafc] leading-[40px]">{movie.voteAverage || movie.averageRating || '--'}</span>
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
                  <button className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors text-[12px] font-medium tracking-wide">Update Link</button>
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
                    <button className="px-3 py-1 rounded-full border border-dashed border-[#475569] text-[#94A3B8] hover:text-[#f8fafc] hover:border-[#94A3B8] transition-colors flex items-center justify-center">
                      <span className="material-symbols-outlined text-[14px]">add</span>
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[12px] font-medium tracking-wide text-[#94A3B8] block mb-[8px]">Categories</span>
                  <div className="flex flex-wrap gap-[8px]">
                    {movie.categories && movie.categories.length > 0 ? (
                      movie.categories.map(cat => (
                        <span key={cat} className="px-3 py-1 rounded bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/30 text-[12px] font-medium tracking-wide capitalize">{cat}</span>
                      ))
                    ) : (
                      <span className="text-[#94A3B8] text-sm">No categories assigned</span>
                    )}
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
    </div>
  );
};

export default AdminMovieDetail;
