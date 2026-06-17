import React, { useState, useEffect } from 'react';
import AdminTaskbar from './admintaskbar.jsx';
import { adminService } from '../services';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const data = await adminService.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error('Error fetching dashboard stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardStats();
    }, []);

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    const formatCurrency = (amount) => {
        if (!amount) return '$0';
        if (amount >= 1000000) return '$' + (amount / 1000000).toFixed(1) + 'M';
        if (amount >= 1000) return '$' + (amount / 1000).toFixed(1) + 'K';
        return '$' + amount;
    };

    return (
        <div className="bg-[#0F172A] text-[#f8fafc] antialiased flex h-screen overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
            <AdminTaskbar />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col md:ml-64 relative min-h-screen">
                {/* TopNavBar */}
                <header className="flex justify-between items-center w-full px-[24px] py-[16px] sticky top-0 z-50 bg-[#0F172A] border-b border-[#334155] shadow-sm h-16">
                    <div className="flex items-center md:hidden gap-[16px]">
                        <span className="material-symbols-outlined text-[#f8fafc] cursor-pointer">menu</span>
                        <span className="text-[24px] leading-[32px] font-bold text-[#E50914]">CineAdmin</span>
                    </div>
                    <div className="hidden md:flex items-center flex-1 max-w-md ml-[24px]">
                        <div className="relative w-full">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">search</span>
                            <input className="w-full bg-[#1E293B] border border-[#334155] rounded-lg pl-10 pr-4 py-2 text-[14px] leading-[20px] text-[#f8fafc] focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]/50 transition-all" placeholder="Search..." type="text" />
                        </div>
                    </div>
                    <div className="flex items-center gap-[16px] ml-auto">
                        <button className="text-[#94a3b8] hover:text-[#E50914] transition-colors cursor-pointer active:opacity-80">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                        <button className="text-[#94a3b8] hover:text-[#E50914] transition-colors cursor-pointer active:opacity-80">
                            <span className="material-symbols-outlined">contrast</span>
                        </button>
                        <div className="w-8 h-8 rounded-full bg-[#334155] overflow-hidden cursor-pointer ml-[8px]">
                            <img alt="Administrator Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbCyRsOvj5MHAZVD678WOq7zwaLLw8BEtfwgM76xIqZhxIjkwejgnw64XTpJxC0mdUv6_CQP4lUdG8Yn8RrmDg-rGYzCxQUfqCCdjHEjWGBps0A59nIibgMUBnW-MXOMy_NuK8VNAUHl--Re1sd6MQ5QcZ-AFQkwP8AKQSiBwZq7Zuh42IiXVkObv9a4JZT9GcEUTyPMa5tdQbyQXv1QeQulHKIi0vUirsq7KGmkWfIcE50eXWWF7GSWBgmfXL5BfRaRb5GZwJUSP5" />
                        </div>
                    </div>
                </header>

                {/* Main Canvas */}
                <main className="flex-1 overflow-y-auto p-[16px] md:p-[24px] lg:p-[48px] space-y-[48px]">
                    {/* Page Header */}
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-[32px] leading-[40px] tracking-[-0.01em] md:text-[48px] md:leading-[1.1] md:tracking-[-0.02em] font-extrabold text-[#f8fafc]">Dashboard Overview</h1>
                            <p className="text-[16px] leading-[24px] text-[#94a3b8] mt-[4px]">Real-time metrics and system performance.</p>
                        </div>
                        <button className="bg-[#E50914] hover:brightness-110 active:brightness-90 text-[#ffffff] text-[12px] leading-[16px] tracking-[0.05em] font-medium px-[16px] py-2 rounded-lg transition-all flex items-center gap-[4px] shadow-lg shadow-[#E50914]/20">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            Export Report
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20 text-[#94a3b8]">Loading dashboard metrics...</div>
                    ) : stats ? (
                        <>
                            {/* Bento Grid KPIs */}
                            <section className="grid grid-cols-2 md:grid-cols-4 gap-[16px] md:gap-[24px]">
                                {/* KPI 1 */}
                                <div className="bg-[#1E293B] rounded-xl p-[16px] md:p-[24px] border border-[#334155] hover:border-[#475569] transition-colors group">
                                    <div className="flex justify-between items-start mb-[8px]">
                                        <span className="text-[#94a3b8] text-[12px] leading-[16px] tracking-[0.05em] font-medium uppercase tracking-wider">Total Users</span>
                                        <span className="material-symbols-outlined text-[#E50914] bg-[#E50914]/10 p-1 rounded">group</span>
                                    </div>
                                    <div className="text-[32px] leading-[40px] tracking-[-0.01em] font-bold text-[#f8fafc] group-hover:text-[#E50914] transition-colors">
                                        {formatNumber(stats.totalUsers)}
                                    </div>
                                </div>
                                {/* KPI 2 */}
                                <div className="bg-[#1E293B] rounded-xl p-[16px] md:p-[24px] border border-[#334155] hover:border-[#475569] transition-colors group">
                                    <div className="flex justify-between items-start mb-[8px]">
                                        <span className="text-[#94a3b8] text-[12px] leading-[16px] tracking-[0.05em] font-medium uppercase tracking-wider">Active Users</span>
                                        <span className="material-symbols-outlined text-[#7bd0ff] bg-[#7bd0ff]/10 p-1 rounded">person_play</span>
                                    </div>
                                    <div className="text-[32px] leading-[40px] tracking-[-0.01em] font-bold text-[#f8fafc] group-hover:text-[#7bd0ff] transition-colors">
                                        {formatNumber(stats.activeUsers)}
                                    </div>
                                </div>
                                {/* KPI 3 */}
                                <div className="bg-[#1E293B] rounded-xl p-[16px] md:p-[24px] border border-[#334155] hover:border-[#475569] transition-colors group">
                                    <div className="flex justify-between items-start mb-[8px]">
                                        <span className="text-[#94a3b8] text-[12px] leading-[16px] tracking-[0.05em] font-medium uppercase tracking-wider">Premium Users</span>
                                        <span className="material-symbols-outlined text-amber-400 bg-amber-400/10 p-1 rounded">workspace_premium</span>
                                    </div>
                                    <div className="text-[32px] leading-[40px] tracking-[-0.01em] font-bold text-[#f8fafc] group-hover:text-amber-400 transition-colors">
                                        {formatNumber(stats.premiumUsers)}
                                    </div>
                                </div>
                                {/* KPI 4 */}
                                <div className="bg-[#1E293B] rounded-xl p-[16px] md:p-[24px] border border-[#334155] hover:border-[#475569] transition-colors group">
                                    <div className="flex justify-between items-start mb-[8px]">
                                        <span className="text-[#94a3b8] text-[12px] leading-[16px] tracking-[0.05em] font-medium uppercase tracking-wider">New Users Today</span>
                                        <span className="material-symbols-outlined text-cyan-400 bg-cyan-400/10 p-1 rounded">person_add</span>
                                    </div>
                                    <div className="text-[32px] leading-[40px] tracking-[-0.01em] font-bold text-[#f8fafc] group-hover:text-cyan-400 transition-colors">
                                        {formatNumber(stats.newUsersToday)}
                                    </div>
                                </div>
                                {/* KPI 5 */}
                                <div className="bg-[#1E293B] rounded-xl p-[16px] md:p-[24px] border border-[#334155] hover:border-[#475569] transition-colors group">
                                    <div className="flex justify-between items-start mb-[8px]">
                                        <span className="text-[#94a3b8] text-[12px] leading-[16px] tracking-[0.05em] font-medium uppercase tracking-wider">Total Movies</span>
                                        <span className="material-symbols-outlined text-purple-400 bg-purple-400/10 p-1 rounded">movie</span>
                                    </div>
                                    <div className="text-[32px] leading-[40px] tracking-[-0.01em] font-bold text-[#f8fafc] group-hover:text-purple-400 transition-colors">
                                        {formatNumber(stats.totalMovies)}
                                    </div>
                                </div>
                                {/* KPI 6 */}
                                <div className="bg-[#1E293B] rounded-xl p-[16px] md:p-[24px] border border-[#334155] hover:border-[#475569] transition-colors group">
                                    <div className="flex justify-between items-start mb-[8px]">
                                        <span className="text-[#94a3b8] text-[12px] leading-[16px] tracking-[0.05em] font-medium uppercase tracking-wider">Total Revenue</span>
                                        <span className="material-symbols-outlined text-emerald-400 bg-emerald-400/10 p-1 rounded">payments</span>
                                    </div>
                                    <div className="text-[32px] leading-[40px] tracking-[-0.01em] font-bold text-[#f8fafc] group-hover:text-emerald-400 transition-colors">
                                        {formatCurrency(stats.totalRevenue)}
                                    </div>
                                </div>
                                {/* KPI 7 */}
                                <div className="bg-[#1E293B] rounded-xl p-[16px] md:p-[24px] border border-[#334155] hover:border-[#475569] transition-colors group">
                                    <div className="flex justify-between items-start mb-[8px]">
                                        <span className="text-[#94a3b8] text-[12px] leading-[16px] tracking-[0.05em] font-medium uppercase tracking-wider">Total Views</span>
                                        <span className="material-symbols-outlined text-blue-400 bg-blue-400/10 p-1 rounded">visibility</span>
                                    </div>
                                    <div className="text-[32px] leading-[40px] tracking-[-0.01em] font-bold text-[#f8fafc] group-hover:text-blue-400 transition-colors">
                                        {formatNumber(stats.totalViews)}
                                    </div>
                                </div>
                                {/* KPI 8 */}
                                <div className="bg-[#1E293B] rounded-xl p-[16px] md:p-[24px] border border-[#334155] hover:border-[#475569] transition-colors group">
                                    <div className="flex justify-between items-start mb-[8px]">
                                        <span className="text-[#94a3b8] text-[12px] leading-[16px] tracking-[0.05em] font-medium uppercase tracking-wider">Total Reviews</span>
                                        <span className="material-symbols-outlined text-pink-400 bg-pink-400/10 p-1 rounded">reviews</span>
                                    </div>
                                    <div className="text-[32px] leading-[40px] tracking-[-0.01em] font-bold text-[#f8fafc] group-hover:text-pink-400 transition-colors">
                                        {formatNumber(stats.totalReviews)}
                                    </div>
                                </div>
                            </section>

                            {/* Charts Section */}
                            <section className="grid grid-cols-1 lg:grid-cols-3 gap-[24px]">
                                {/* Revenue Overview */}
                                <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-[24px] lg:col-span-2 flex flex-col min-h-[350px]">
                                    <div className="flex justify-between items-center mb-[24px]">
                                        <h3 className="text-[18px] leading-[28px] font-semibold text-[#f8fafc]">Revenue Overview</h3>
                                        <div className="flex gap-2">
                                            <button className="px-3 py-1 rounded text-xs font-medium bg-[#334155] text-[#f8fafc]">1W</button>
                                            <button className="px-3 py-1 rounded text-xs font-medium bg-[#E50914] text-[#ffffff]">1M</button>
                                            <button className="px-3 py-1 rounded text-xs font-medium bg-[#334155] text-[#f8fafc]">1Y</button>
                                        </div>
                                    </div>
                                    {/* Placeholder for Chart */}
                                    <div className="flex-1 w-full bg-[#0F172A] rounded-lg border border-[#334155]/50 relative overflow-hidden flex items-end px-4 pb-4 gap-2">
                                        <div className="w-full h-full absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                                        <div className="w-[10%] h-[30%] bg-gradient-to-t from-[#E50914]/20 to-[#E50914]/80 rounded-t-sm z-10"></div>
                                        <div className="w-[10%] h-[45%] bg-gradient-to-t from-[#E50914]/20 to-[#E50914]/80 rounded-t-sm z-10"></div>
                                        <div className="w-[10%] h-[35%] bg-gradient-to-t from-[#E50914]/20 to-[#E50914]/80 rounded-t-sm z-10"></div>
                                        <div className="w-[10%] h-[60%] bg-gradient-to-t from-[#E50914]/20 to-[#E50914]/80 rounded-t-sm z-10"></div>
                                        <div className="w-[10%] h-[50%] bg-gradient-to-t from-[#E50914]/20 to-[#E50914]/80 rounded-t-sm z-10"></div>
                                        <div className="w-[10%] h-[75%] bg-gradient-to-t from-[#E50914]/20 to-[#E50914]/80 rounded-t-sm z-10"></div>
                                        <div className="w-[10%] h-[65%] bg-gradient-to-t from-[#E50914]/20 to-[#E50914]/80 rounded-t-sm z-10"></div>
                                        <div className="w-[10%] h-[85%] bg-gradient-to-t from-[#E50914]/20 to-[#E50914]/80 rounded-t-sm z-10"></div>
                                        <div className="w-[10%] h-[100%] bg-gradient-to-t from-[#E50914]/20 to-[#E50914]/80 rounded-t-sm z-10"></div>
                                    </div>
                                </div>

                                {/* Premium vs Free Donut */}
                                <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-[24px] flex flex-col min-h-[350px]">
                                    <h3 className="text-[18px] leading-[28px] font-semibold text-[#f8fafc] mb-[24px]">User Demographics</h3>
                                    <div className="flex-1 flex flex-col items-center justify-center relative">
                                        <div className="w-48 h-48 rounded-full border-[16px] border-[#334155] relative flex items-center justify-center">
                                            <div
                                                className="absolute inset-[-16px] rounded-full border-[16px] border-[#E50914]"
                                                style={{
                                                    clipPath: stats.totalUsers > 0
                                                        ? `polygon(50% 50%, 100% 0, 100% ${(stats.premiumUsers / stats.totalUsers) * 100}%, ${(stats.premiumUsers / stats.totalUsers) > 0.5 ? '0' : '100%'} 100%, 0 100%, 0 0, 50% 0)` // simplified clipping logic for visual representation
                                                        : 'none',
                                                    transform: `rotate(${Math.min((stats.premiumUsers / Math.max(1, stats.totalUsers)) * 360, 360)}deg)`
                                                }}
                                            ></div>
                                            <div className="text-center">
                                                <div className="text-[24px] leading-[32px] font-semibold text-[#f8fafc]">
                                                    {stats.totalUsers > 0 ? Math.round((stats.premiumUsers / stats.totalUsers) * 100) : 0}%
                                                </div>
                                                <div className="text-xs text-[#94a3b8]">Premium</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-center gap-[24px] mt-[16px]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-[#E50914]"></div>
                                            <span className="text-sm text-[#94a3b8]">Premium ({stats.premiumUsers})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-[#334155]"></div>
                                            <span className="text-sm text-[#94a3b8]">Free ({stats.totalUsers - stats.premiumUsers})</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </>
                    ) : (
                        <div className="flex justify-center py-20 text-[#94a3b8]">No data available.</div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
