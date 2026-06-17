import React, { useState, useEffect } from 'react';
import AdminTaskbar from './admintaskbar.jsx';
import { adminService } from '../services';

const AdminAnalytics = () => {
  const [movieAnalytics, setMovieAnalytics] = useState(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('movie');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [movieData, revenueData] = await Promise.all([
          adminService.getMovieAnalytics(),
          adminService.getRevenueAnalytics()
        ]);
        setMovieAnalytics(movieData);
        setRevenueAnalytics(revenueData);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="bg-[#0F172A] text-[#f8fafc] font-['Inter'] min-h-screen flex antialiased">
      {/* SideNavBar */}
      <AdminTaskbar />

      {/* Main Content Wrapper */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen bg-[#0F172A]">
        {/* TopNavBar (Mobile Only) */}
        <header className="md:hidden flex justify-between items-center w-full px-[24px] py-[16px] sticky top-0 z-50 bg-[#0F172A] border-b border-[#334155] shadow-sm">
          <div className="text-[24px] font-bold text-[#E50914]">CineAdmin</div>
          <div className="flex gap-[16px] text-[#94A3B8]">
            <span className="material-symbols-outlined cursor-pointer hover:text-[#f8fafc] transition-colors">notifications</span>
            <span className="material-symbols-outlined cursor-pointer hover:text-[#f8fafc] transition-colors">contrast</span>
            <span className="material-symbols-outlined cursor-pointer hover:text-[#f8fafc] transition-colors">settings</span>
          </div>
        </header>

        {/* Dashboard Header */}
        <div className="px-[24px] md:px-[48px] py-[32px] border-b border-[#334155] bg-[#1E293B]/50 backdrop-blur-md sticky top-0 z-30 hidden md:flex items-center justify-between">
          <div>
            <h1 className="text-[32px] font-bold text-[#f8fafc]">Analytics Dashboard</h1>
            <p className="text-[14px] text-[#94A3B8] mt-[4px]">Platform performance and user engagement metrics.</p>
          </div>
          <div className="flex gap-[16px] items-center text-[#94A3B8]">
            <button className="material-symbols-outlined cursor-pointer hover:text-[#f8fafc] transition-colors p-[8px] rounded-full hover:bg-[#334155]">notifications</button>
            <div className="w-px h-6 bg-[#334155]"></div>
            <img alt="Administrator Avatar" className="w-10 h-10 rounded-full border border-[#334155] cursor-pointer hover:opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPMTsST48fPxkcsW8Y51wCykPbFXH44gY-XVqEi_UlZQzr8CN17iN1CqvSyay2B2-TrE4MF8LPa8Y07VGLDybq2AR50OdGDSDnL-Dm6-SoXqnavfzGRoq-9dH7MiYokWa0VBk7AmJhdabbBzojwrrkzSfsrtirf_kBfIAuN7caC8PKaWjykTRzGG7M0W9XoqDMckbw4ITWY8AIPNPfaOAj-XfOPsFZ8cPQRDR7TLvX07YisQ2Y37j94PjhyzLXgvOhFt-oyvPda2bu" />
          </div>
        </div>

        <div className="p-[24px] md:p-[48px] max-w-[1440px] mx-auto w-full flex flex-col gap-[48px]">
          {/* Tab Navigation */}
          <div className="flex border-b border-[#334155] gap-[24px]">
            <button 
              onClick={() => setActiveTab('movie')}
              className={`${activeTab === 'movie' ? 'text-[#E50914] border-b-2 border-[#E50914] font-bold' : 'text-[#94A3B8] font-medium hover:text-[#f8fafc]'} pb-[8px] text-[18px] flex items-center gap-[8px] transition-colors`}
            >
              <span className="material-symbols-outlined">monitoring</span> Movie Analytics
            </button>
            <button 
              onClick={() => setActiveTab('revenue')}
              className={`${activeTab === 'revenue' ? 'text-[#E50914] border-b-2 border-[#E50914] font-bold' : 'text-[#94A3B8] font-medium hover:text-[#f8fafc]'} pb-[8px] text-[18px] flex items-center gap-[8px] transition-colors`}
            >
              <span className="material-symbols-outlined">query_stats</span> Revenue Analytics
            </button>
          </div>

          {loading ? (
             <div className="flex justify-center py-20 text-[#94A3B8]">Loading analytics data...</div>
          ) : activeTab === 'movie' ? (
             <>
               {/* Movie Analytics Stats */}
               <section className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-[24px] flex flex-col justify-between hover:border-[#E50914] transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-[16px]">
                      <div className="text-[14px] text-[#94A3B8]">Total Views (30d)</div>
                      <span className="material-symbols-outlined text-[#7bd0ff]">visibility</span>
                    </div>
                    <div>
                      <div className="text-[32px] font-bold text-[#f8fafc]">{formatNumber(movieAnalytics?.totalViews)}</div>
                    </div>
                  </div>
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-[24px] flex flex-col justify-between hover:border-[#E50914] transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-[16px]">
                      <div className="text-[14px] text-[#94A3B8]">Average Rating</div>
                      <span className="material-symbols-outlined text-yellow-400">star</span>
                    </div>
                    <div>
                      <div className="text-[32px] font-bold text-[#f8fafc]">{movieAnalytics?.averageRating?.toFixed(1) || '0.0'}</div>
                    </div>
                  </div>
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-[24px] flex flex-col justify-between hover:border-[#E50914] transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-[16px]">
                      <div className="text-[14px] text-[#94A3B8]">Total Reviews</div>
                      <span className="material-symbols-outlined text-green-400">rate_review</span>
                    </div>
                    <div>
                      <div className="text-[32px] font-bold text-[#f8fafc]">{formatNumber(movieAnalytics?.totalReviews)}</div>
                    </div>
                  </div>
               </section>
             </>
          ) : (
             <>
               {/* Revenue Analytics Stats */}
               <section className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-[24px] flex flex-col justify-between hover:border-[#E50914] transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-[16px]">
                      <div className="text-[14px] text-[#94A3B8]">Total Revenue</div>
                      <span className="material-symbols-outlined text-emerald-400">payments</span>
                    </div>
                    <div>
                      <div className="text-[32px] font-bold text-[#f8fafc]">${revenueAnalytics?.revenueThisMonth?.toFixed(2) || '0.00'}</div>
                    </div>
                  </div>
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-[24px] flex flex-col justify-between hover:border-[#E50914] transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-[16px]">
                      <div className="text-[14px] text-[#94A3B8]">Successful Payments</div>
                      <span className="material-symbols-outlined text-[#7bd0ff]">check_circle</span>
                    </div>
                    <div>
                      <div className="text-[32px] font-bold text-[#f8fafc]">{formatNumber(revenueAnalytics?.successfulPayments)}</div>
                    </div>
                  </div>
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-[24px] flex flex-col justify-between hover:border-[#E50914] transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-[16px]">
                      <div className="text-[14px] text-[#94A3B8]">New Subscriptions</div>
                      <span className="material-symbols-outlined text-purple-400">subscriptions</span>
                    </div>
                    <div>
                      <div className="text-[32px] font-bold text-[#f8fafc]">{formatNumber(revenueAnalytics?.newSubscriptions)}</div>
                    </div>
                  </div>
               </section>
             </>
          )}


        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;
