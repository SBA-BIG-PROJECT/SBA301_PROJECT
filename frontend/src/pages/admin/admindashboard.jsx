import React, { useState, useEffect } from 'react';
import AdminTaskbar from './admintaskbar.jsx';
import { adminService } from '../../services';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [revenueData, setRevenueData] = useState([]);
    const [revenuePeriod, setRevenuePeriod] = useState('1M');
    const [loadingRevenue, setLoadingRevenue] = useState(false);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const data = await adminService.getDashboardStats();
                setStats(data);
                
                // Fetch initial revenue data (1M)
                await fetchRevenueData('1M');
            } catch (error) {
                console.error('Error fetching dashboard stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardStats();
    }, []);

    const fetchRevenueData = async (period) => {
        setLoadingRevenue(true);
        try {
            const end = new Date();
            const start = new Date();
            if (period === '1W') start.setDate(end.getDate() - 7);
            else if (period === '1M') start.setMonth(end.getMonth() - 1);
            else if (period === '1Y') start.setFullYear(end.getFullYear() - 1);
            
            const startDateStr = start.toISOString().split('T')[0];
            const endDateStr = end.toISOString().split('T')[0];
            
            const revData = await adminService.getRevenueAnalytics(startDateStr, endDateStr);
            
            // Process data returned from actual backend API
            if (revData) {
                let chartData = [];
                if (period === '1Y') {
                    // Create list of last 12 months with 0 revenue
                    for(let i=11; i>=0; i--) {
                        const d = new Date();
                        d.setMonth(d.getMonth() - i);
                        chartData.push({ date: `${d.getMonth() + 1}/${d.getFullYear()}`, revenue: 0 });
                    }
                    if (revData.monthlyRevenue && revData.monthlyRevenue.length > 0) {
                        revData.monthlyRevenue.forEach(item => {
                            const dateStr = `${item.month}/${item.year}`;
                            const found = chartData.find(c => c.date === dateStr);
                            if (found) found.revenue = item.revenue;
                        });
                    }
                } else {
                    // Create list of last 7 or 30 days with 0 revenue
                    const days = period === '1W' ? 7 : 30;
                    for(let i=days-1; i>=0; i--) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        // Convert sang YYYY-MM-DD theo local time
                        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        chartData.push({ date: dateStr, revenue: 0 });
                    }
                    if (revData.dailyRevenue && revData.dailyRevenue.length > 0) {
                        revData.dailyRevenue.forEach(item => {
                            const found = chartData.find(c => c.date === item.date.toString());
                            if (found) found.revenue = item.revenue;
                        });
                    }
                }

                if (chartData.length > 0) {
                    setRevenueData(chartData);
                } else {
                    // Fallback mock
                    setRevenueData(generateMockRevenue(period));
                }
            } else {
                setRevenueData(generateMockRevenue(period));
            }
        } catch (error) {
            console.error('Error fetching revenue data', error);
            setRevenueData(generateMockRevenue(period)); // Fallback mock on error
        } finally {
            setLoadingRevenue(false);
        }
    };

    const handlePeriodChange = (period) => {
        setRevenuePeriod(period);
        fetchRevenueData(period);
    };

    const generateMockRevenue = (period) => {
        const data = [];
        const days = period === '1W' ? 7 : period === '1M' ? 30 : 12;
        for(let i=0; i<days; i++) {
            data.push({
                date: period === '1Y' ? `Month ${i+1}` : `Day ${i+1}`,
                revenue: Math.floor(Math.random() * 5000) + 500
            });
        }
        return data;
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    const formatCurrency = (amount) => {
        if (!amount) return '0 VND';
        if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M VND';
        if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K VND';
        return amount + ' VND';
    };

    const handleExportReport = () => {
        if (!stats) return;
        
        const headers = ['Metric', 'Value'];
        const rows = [
            ['Total Users', stats.totalUsers || 0],
            ['Active Users', stats.activeUsers || 0],
            ['Premium Users', stats.premiumUsers || 0],
            ['New Users Today', stats.newUsersToday || 0],
            ['Total Movies', stats.totalMovies || 0],
            ['Total Revenue (VND)', stats.totalRevenue || 0],
            ['Total Views', stats.totalViews || 0],
            ['Total Reviews', stats.totalReviews || 0]
        ];
        
        // Convert to CSV string
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");
            
        // Trigger download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `CineAdmin_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-[#0F172A] text-[#f8fafc] antialiased flex h-screen overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
            <AdminTaskbar />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col md:ml-64 relative min-h-screen">
                {/* TopNavBar */}
                <header className="flex justify-between items-center w-full px-[24px] py-[16px] sticky top-0 z-50 bg-[#0F172A] border-b border-[#334155] shadow-sm h-16 md:hidden">
                    <div className="flex items-center md:hidden gap-[16px]">
                        <span className="material-symbols-outlined text-[#f8fafc] cursor-pointer">menu</span>
                        <span className="text-[24px] leading-[32px] font-bold text-[#E50914]">CineAdmin</span>
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
                            <h1 className="text-[32px] leading-[40px] tracking-[-0.01em] md:text-[48px] md:leading-[1.1] md:tracking-[-0.02em] font-extrabold text-[#f8fafc] text-left mx-0 max-w-none">Dashboard Overview</h1>
                            <p className="text-[16px] leading-[24px] text-[#94a3b8] mt-[4px] text-left">Real-time metrics and system performance.</p>
                        </div>
                        <button 
                            onClick={handleExportReport}
                            disabled={!stats || loading}
                            className={`text-[12px] leading-[16px] tracking-[0.05em] font-medium px-[16px] py-2 rounded-lg transition-all flex items-center gap-[4px] shadow-lg ${stats && !loading ? 'bg-[#E50914] hover:brightness-110 active:brightness-90 text-[#ffffff] shadow-[#E50914]/20' : 'bg-[#334155] text-[#94a3b8] cursor-not-allowed'}`}
                        >
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
                                            <button 
                                                onClick={() => handlePeriodChange('1W')}
                                                className={`px-3 py-1 rounded text-xs font-medium ${revenuePeriod === '1W' ? 'bg-[#E50914] text-[#ffffff]' : 'bg-[#334155] text-[#f8fafc] hover:bg-[#475569]'}`}>
                                                1W
                                            </button>
                                            <button 
                                                onClick={() => handlePeriodChange('1M')}
                                                className={`px-3 py-1 rounded text-xs font-medium ${revenuePeriod === '1M' ? 'bg-[#E50914] text-[#ffffff]' : 'bg-[#334155] text-[#f8fafc] hover:bg-[#475569]'}`}>
                                                1M
                                            </button>
                                            <button 
                                                onClick={() => handlePeriodChange('1Y')}
                                                className={`px-3 py-1 rounded text-xs font-medium ${revenuePeriod === '1Y' ? 'bg-[#E50914] text-[#ffffff]' : 'bg-[#334155] text-[#f8fafc] hover:bg-[#475569]'}`}>
                                                1Y
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full h-[280px] bg-[#0F172A] rounded-lg border border-[#334155]/50 relative p-4 flex items-center justify-center">
                                        {loadingRevenue ? (
                                            <div className="text-[#94a3b8]">Loading chart data...</div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={revenueData} margin={{ top: 10, right: 4, left: 8, bottom: 10 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                    <XAxis 
                                                        dataKey="date" 
                                                        stroke="#94a3b8" 
                                                        fontSize={12} 
                                                        tickLine={false} 
                                                        axisLine={false}
                                                        tickFormatter={(val) => val.toString().length > 10 ? val.toString().substring(0, 10) + '...' : val.toString()}
                                                    />
                                                    <YAxis 
                                                        stroke="#94a3b8" 
                                                        fontSize={12} 
                                                        tickLine={false} 
                                                        axisLine={false}
                                                        width={90}
                                                        tickFormatter={(val) => formatCurrency(val)}
                                                    />
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#f8fafc' }}
                                                        itemStyle={{ color: '#E50914' }}
                                                        cursor={{fill: '#334155', opacity: 0.4}}
                                                    />
                                                    <Bar dataKey="revenue" fill="#E50914" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>

                                {/* Premium vs Free Donut */}
                                <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-[24px] flex flex-col min-h-[350px]">
                                    <h3 className="text-[18px] leading-[28px] font-semibold text-[#f8fafc] mb-[24px]">User Demographics</h3>
                                    <div className="flex-1 flex flex-col items-center justify-center relative w-full h-[200px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Premium', value: stats.premiumUsers },
                                                        { name: 'Free', value: stats.totalUsers - stats.premiumUsers }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    <Cell key="cell-0" fill="#E50914" />
                                                    <Cell key="cell-1" fill="#334155" />
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                                                    itemStyle={{ color: '#f8fafc' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <div className="text-[24px] leading-[32px] font-semibold text-[#f8fafc]">
                                                {stats.totalUsers > 0 ? Math.round((stats.premiumUsers / stats.totalUsers) * 100) : 0}%
                                            </div>
                                            <div className="text-xs text-[#94a3b8]">Premium</div>
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
