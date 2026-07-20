import React, { useState, useEffect } from 'react';
import AdminTaskbar from './admintaskbar.jsx';
import { adminService } from '../../services';

const AdminAnalytics = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [movieAnalytics, setMovieAnalytics] = useState(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('movie');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [dashData, movieData, revenueData] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getMovieAnalytics(),
          adminService.getRevenueAnalytics()
        ]);
        setDashboardStats(dashData);
        setMovieAnalytics(movieData);
        setRevenueAnalytics(revenueData);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Could not load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const TMDB_IMG = 'https://image.tmdb.org/t/p/w92';

  return (
    <div className="bg-[#0F172A] text-[#f8fafc] font-['Inter'] min-h-screen flex antialiased">
      <AdminTaskbar />

      <main className="flex-1 md:ml-64 flex flex-col min-h-screen bg-[#0F172A]">
        <div className="p-[24px] md:p-[40px] flex flex-col gap-[40px]">
          <div className="flex justify-between items-end text-left w-full">
            <div className="text-left">
              <h1 className="text-[32px] leading-[40px] tracking-[-0.01em] md:text-[48px] md:leading-[1.1] md:tracking-[-0.02em] font-extrabold text-[#f8fafc] text-left mx-0 max-w-none">Analytics Dashboard</h1>
              <p className="text-[16px] leading-[24px] text-[#94A3B8] mt-[4px] text-left">Platform performance and user engagement metrics.</p>
            </div>
          </div>

          {/* ─── Overview Summary Cards ─── */}
          {loading ? (
            <div className="flex justify-center py-20 text-[#94A3B8]">
              <span className="material-symbols-outlined animate-spin mr-2 align-middle">progress_activity</span>
              Loading analytics data...
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
              <span className="material-symbols-outlined text-red-400 text-[48px] mb-4 block">error</span>
              <p className="text-red-400">{error}</p>
            </div>
          ) : (
            <>
              {/* Summary KPI row */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-[16px]">
                {[
                  { label: 'Total Views', value: formatNumber(dashboardStats?.totalViews), icon: 'visibility', color: '#7bd0ff' },
                  { label: 'Total Reviews', value: formatNumber(dashboardStats?.totalReviews), icon: 'rate_review', color: '#4ade80' },
                  { label: 'Active Movies', value: formatNumber(dashboardStats?.activeMovies), icon: 'movie', color: '#f87171' },
                  { label: 'Total Revenue', value: formatCurrency(dashboardStats?.totalRevenue), icon: 'payments', color: '#fbbf24' },
                ].map((card) => (
                  <div key={card.label} className="bg-[#1E293B] border border-[#334155] rounded-xl p-[20px] flex flex-col gap-[12px] hover:border-[#475569] transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-medium text-[#94A3B8] uppercase tracking-wider">{card.label}</span>
                      <span className="material-symbols-outlined text-[20px]" style={{ color: card.color }}>{card.icon}</span>
                    </div>
                    <div className="text-[28px] font-bold text-[#f8fafc] leading-none">{card.value}</div>
                  </div>
                ))}
              </section>

              {/* Tab Navigation */}
              <div className="flex border-b border-[#334155] gap-[24px]">
                <button
                  onClick={() => setActiveTab('movie')}
                  className={`${activeTab === 'movie' ? 'text-[#E50914] border-b-2 border-[#E50914] font-bold' : 'text-[#94A3B8] font-medium hover:text-[#f8fafc]'} pb-[10px] text-[16px] flex items-center gap-[8px] transition-colors`}
                >
                  <span className="material-symbols-outlined text-[18px]">monitoring</span> Movie Analytics
                </button>
                <button
                  onClick={() => setActiveTab('revenue')}
                  className={`${activeTab === 'revenue' ? 'text-[#E50914] border-b-2 border-[#E50914] font-bold' : 'text-[#94A3B8] font-medium hover:text-[#f8fafc]'} pb-[10px] text-[16px] flex items-center gap-[8px] transition-colors`}
                >
                  <span className="material-symbols-outlined text-[18px]">query_stats</span> Revenue Analytics
                </button>
              </div>

              {/* ─── MOVIE TAB ─── */}
              {activeTab === 'movie' && (
                <div className="flex flex-col gap-[32px]">
                  {/* Top 3 stats from dashboard */}
                  <section className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">
                    {[
                      { label: 'Views Today', value: formatNumber(dashboardStats?.viewsToday), icon: 'today', color: '#7bd0ff' },
                      { label: 'Total Genres', value: formatNumber(dashboardStats?.totalGenres), icon: 'category', color: '#a78bfa' },
                      { label: 'Total Watchlist Items', value: formatNumber(dashboardStats?.totalWatchlistItems), icon: 'bookmark', color: '#fb923c' },
                    ].map((card) => (
                      <div key={card.label} className="bg-[#1E293B] border border-[#334155] rounded-xl p-[20px] flex items-center gap-[16px] hover:border-[#475569] transition-colors">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: card.color + '20' }}>
                          <span className="material-symbols-outlined text-[22px]" style={{ color: card.color }}>{card.icon}</span>
                        </div>
                        <div>
                          <div className="text-[12px] text-[#94A3B8]">{card.label}</div>
                          <div className="text-[24px] font-bold text-[#f8fafc]">{card.value}</div>
                        </div>
                      </div>
                    ))}
                  </section>

                  {/* Tables row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">

                    {/* Most Viewed Movies */}
                    <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
                      <div className="px-[20px] py-[16px] border-b border-[#334155] flex items-center gap-[8px]">
                        <span className="material-symbols-outlined text-[#7bd0ff] text-[18px]">leaderboard</span>
                        <h3 className="text-[14px] font-semibold text-[#f8fafc]">Most Viewed Movies</h3>
                      </div>
                      <div className="divide-y divide-[#334155]">
                        {movieAnalytics?.mostViewedMovies?.length > 0 ? (
                          movieAnalytics.mostViewedMovies.slice(0, 8).map((m, idx) => (
                            <div key={m.tmdbId} className="px-[20px] py-[12px] flex items-center gap-[12px] hover:bg-[#334155]/30 transition-colors">
                              <span className="text-[12px] font-bold text-[#94A3B8] w-5 text-center">{idx + 1}</span>
                              {m.posterPath ? (
                                <img src={m.posterPath.startsWith('http') ? m.posterPath : `${TMDB_IMG}${m.posterPath}`} alt={m.title} className="w-8 h-12 object-cover rounded" />
                              ) : (
                                <div className="w-8 h-12 bg-[#334155] rounded flex items-center justify-center">
                                  <span className="material-symbols-outlined text-[#94A3B8] text-[14px]">movie</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-medium text-[#f8fafc] truncate">{m.title}</div>
                                <div className="text-[11px] text-[#94A3B8]">{formatNumber(m.count)} views</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-[20px] py-[32px] text-center text-[#94A3B8] text-[13px]">No data available</div>
                        )}
                      </div>
                    </div>

                    {/* Highest Rated Movies */}
                    <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
                      <div className="px-[20px] py-[16px] border-b border-[#334155] flex items-center gap-[8px]">
                        <span className="material-symbols-outlined text-yellow-400 text-[18px]">star</span>
                        <h3 className="text-[14px] font-semibold text-[#f8fafc]">Highest Rated Movies</h3>
                      </div>
                      <div className="divide-y divide-[#334155]">
                        {movieAnalytics?.highestRatedMovies?.length > 0 ? (
                          movieAnalytics.highestRatedMovies.slice(0, 8).map((m, idx) => (
                            <div key={m.tmdbId} className="px-[20px] py-[12px] flex items-center gap-[12px] hover:bg-[#334155]/30 transition-colors">
                              <span className="text-[12px] font-bold text-[#94A3B8] w-5 text-center">{idx + 1}</span>
                              {m.posterPath ? (
                                <img src={m.posterPath.startsWith('http') ? m.posterPath : `${TMDB_IMG}${m.posterPath}`} alt={m.title} className="w-8 h-12 object-cover rounded" />
                              ) : (
                                <div className="w-8 h-12 bg-[#334155] rounded flex items-center justify-center">
                                  <span className="material-symbols-outlined text-[#94A3B8] text-[14px]">movie</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-medium text-[#f8fafc] truncate">{m.title}</div>
                                <div className="flex items-center gap-[4px]">
                                  <span className="material-symbols-outlined text-yellow-400 text-[12px]">star</span>
                                  <span className="text-[11px] text-[#94A3B8]">{(m.rating / 2)?.toFixed(1) || 'N/A'} · {formatNumber(m.count)} reviews</span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-[20px] py-[32px] text-center text-[#94A3B8] text-[13px]">No data available</div>
                        )}
                      </div>
                    </div>

                    {/* Popular Genres */}
                    <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden lg:col-span-2">
                      <div className="px-[20px] py-[16px] border-b border-[#334155] flex items-center gap-[8px]">
                        <span className="material-symbols-outlined text-[#a78bfa] text-[18px]">category</span>
                        <h3 className="text-[14px] font-semibold text-[#f8fafc]">Popular Genres</h3>
                      </div>
                      <div className="p-[20px]">
                        {movieAnalytics?.popularGenres?.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[12px]">
                            {movieAnalytics.popularGenres.map((g, idx) => {
                              const maxCount = movieAnalytics.popularGenres[0]?.movieCount || 1;
                              const pct = Math.round((g.movieCount / maxCount) * 100);
                              return (
                                <div key={g.genreId} className="bg-[#0F172A] rounded-lg p-[14px] flex flex-col gap-[8px]">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[12px] font-medium text-[#f8fafc] truncate">{g.genreName}</span>
                                    <span className="text-[10px] text-[#94A3B8]">#{idx + 1}</span>
                                  </div>
                                  <div className="text-[20px] font-bold text-[#a78bfa]">{formatNumber(g.movieCount)}</div>
                                  <div className="w-full bg-[#334155] rounded-full h-1.5">
                                    <div className="bg-[#a78bfa] h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                                  </div>
                                  <div className="text-[10px] text-[#94A3B8]">{g.movieCount} movies</div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center text-[#94A3B8] text-[13px] py-8">No data available</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── REVENUE TAB ─── */}
              {activeTab === 'revenue' && (
                <div className="flex flex-col gap-[32px]">
                  {/* Revenue KPIs */}
                  <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[16px]">
                    {[
                      { label: 'Total Revenue', value: formatCurrency(revenueAnalytics?.totalRevenue), icon: 'payments', color: '#4ade80' },
                      { label: 'Successful Orders', value: formatNumber(revenueAnalytics?.successfulOrders), icon: 'check_circle', color: '#7bd0ff' },
                      { label: 'Total Orders', value: formatNumber(revenueAnalytics?.totalOrders), icon: 'receipt_long', color: '#fb923c' },
                      { label: 'Average Order Value', value: formatCurrency(revenueAnalytics?.averageOrderValue), icon: 'trending_up', color: '#fbbf24' },
                    ].map((card) => (
                      <div key={card.label} className="bg-[#1E293B] border border-[#334155] rounded-xl p-[20px] flex flex-col gap-[12px] hover:border-[#475569] transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-[12px] font-medium text-[#94A3B8] uppercase tracking-wider">{card.label}</span>
                          <span className="material-symbols-outlined text-[20px]" style={{ color: card.color }}>{card.icon}</span>
                        </div>
                        <div className="text-[26px] font-bold text-[#f8fafc] leading-none">{card.value}</div>
                      </div>
                    ))}
                  </section>

                  {/* Plan breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                    {[
                      {
                        label: 'Monthly Plan',
                        count: revenueAnalytics?.monthlyPlanCount,
                        revenue: revenueAnalytics?.monthlyPlanRevenue,
                        color: '#7bd0ff',
                        icon: 'calendar_month'
                      },
                      {
                        label: 'Yearly Plan',
                        count: revenueAnalytics?.yearlyPlanCount,
                        revenue: revenueAnalytics?.yearlyPlanRevenue,
                        color: '#4ade80',
                        icon: 'calendar_today'
                      }
                    ].map((plan) => (
                      <div key={plan.label} className="bg-[#1E293B] border border-[#334155] rounded-xl p-[24px] flex items-center gap-[20px]">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: plan.color + '20' }}>
                          <span className="material-symbols-outlined text-[28px]" style={{ color: plan.color }}>{plan.icon}</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-[13px] text-[#94A3B8] mb-[4px]">{plan.label}</div>
                          <div className="text-[22px] font-bold text-[#f8fafc]">{formatNumber(plan.count)} orders</div>
                          <div className="text-[14px]" style={{ color: plan.color }}>{formatCurrency(plan.revenue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dashboard stats supplemental */}
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-[24px]">
                    <h3 className="text-[14px] font-semibold text-[#f8fafc] mb-[20px] flex items-center gap-[8px]">
                      <span className="material-symbols-outlined text-[#fbbf24] text-[18px]">insights</span>
                      System Revenue Statistics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px]">
                      {[
                        { label: 'Revenue Today', value: formatCurrency(dashboardStats?.revenueToday) },
                        { label: 'Revenue This Month', value: formatCurrency(dashboardStats?.revenueThisMonth) },
                        { label: 'Revenue This Year', value: formatCurrency(dashboardStats?.revenueThisYear) },
                        { label: 'User premium', value: formatNumber(dashboardStats?.premiumUsers) },
                      ].map((item) => (
                        <div key={item.label} className="bg-[#0F172A] rounded-lg p-[16px]">
                          <div className="text-[11px] text-[#94A3B8] uppercase tracking-wide mb-[6px]">{item.label}</div>
                          <div className="text-[18px] font-bold text-[#f8fafc]">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;
