import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminTaskbar from './admintaskbar.jsx';
import { adminService } from '../../services';
import Spinner from '../../components/Spinner.jsx';

const AdminUserDetail = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('payment');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [recentReviews, setRecentReviews] = useState([]);
    const [recentWatchlist, setRecentWatchlist] = useState([]);
    const [recentViews, setRecentViews] = useState([]);
    const [editFullName, setEditFullName] = useState('');
    const [editAdminNotes, setEditAdminNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchUserDetail = async () => {
        try {
            setLoading(true);
            const data = await adminService.getUserDetail(id);
            if (data && data.user) {
                const enrichedUser = {
                    ...data.user,
                    totalSpent: data.user.totalSpent || '0.00',
                    moviesWatched: data.user.totalViews || 0,
                    reviewsCount: data.user.totalReviews || 0
                };
                setUser(enrichedUser);
                setEditFullName(data.user.fullName || '');
                setEditAdminNotes(data.user.adminNotes || '');
                setPaymentHistory(data.paymentHistory || []);
                setRecentReviews(data.recentReviews || []);
                setRecentWatchlist(data.recentWatchlist || []);
                setRecentViews(data.recentViews || []);
            } else {
                setUser(null);
            }
        } catch (err) {
            console.error("Error fetching user details", err);
            setError("Could not load user details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserDetail();
    }, [id]);

    const handleRoleChange = async () => {
        if (!user) return;
        const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
        if (window.confirm(`Are you sure you want to change role to ${newRole}?`)) {
            try {
                await adminService.changeUserRole(id, newRole);
                setUser(prev => ({ ...prev, role: newRole }));
            } catch (err) {
                alert("Failed to change role");
            }
        }
    };

    const handleToggleDisable = async () => {
        if (!user) return;
        const action = user.isActive ? 'disable' : 'enable';
        if (window.confirm(`Are you sure you want to ${action} this account?`)) {
            try {
                if (user.isActive) {
                    await adminService.deleteUser(id);
                } else {
                    // Update user to active via updateUser if backend supports it, otherwise reload
                    await adminService.updateUser(id, { isActive: true });
                }
                await fetchUserDetail();
            } catch (err) {
                alert(`Failed to ${action} account`);
            }
        }
    };

    const handleSaveChanges = async () => {
        try {
            setSaving(true);
            const updated = await adminService.updateUser(id, {
                fullName: editFullName,
                adminNotes: editAdminNotes
            });
            alert('User profile updated successfully!');
            setUser(prev => ({
                ...prev,
                fullName: updated.fullName,
                adminNotes: updated.adminNotes
            }));
        } catch (err) {
            console.error("Failed to update user profile", err);
            alert('Failed to update user profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Spinner /></div>;
    if (error) return <div className="text-red-500 p-12">{error}</div>;
    if (!user) return <div className="text-white p-12">User not found</div>;

    return (
        <div className="bg-[#0F172A] text-[#f8fafc] font-['Inter'] min-h-screen flex antialiased">
            {/* SideNavBar */}
            <AdminTaskbar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col md:ml-64 min-w-0 bg-[#0F172A]">
                {/* TopNavBar */}
                <header className="bg-[#0F172A] border-b border-[#334155] shadow-sm flex justify-between items-center w-full px-[24px] py-[16px] sticky top-0 z-30">
                    {/* Search Bar (on_left) */}
                    <div className="relative w-full max-w-md hidden md:block">
                        <span className="material-symbols-outlined absolute left-[16px] top-1/2 -translate-y-1/2 text-[#94A3B8]">search</span>
                        <input 
                            className="w-full bg-[#1E293B] border border-[#334155] rounded-lg py-[8px] pl-[48px] pr-[16px] text-[#f8fafc] text-[14px] focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]/20 transition-all placeholder:text-[#94A3B8]" 
                            placeholder="Search users, movies, ID..." 
                            type="text"
                        />
                    </div>
                    {/* Mobile Menu Toggle */}
                    <button className="md:hidden text-[#94A3B8] hover:text-[#E50914] transition-colors cursor-pointer active:opacity-80">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    {/* Right Actions */}
                    <div className="flex items-center gap-[16px]">
                        <button className="text-[#94A3B8] hover:text-[#E50914] transition-colors cursor-pointer active:opacity-80 p-[8px] rounded-full hover:bg-[#334155]">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                        <button className="text-[#94A3B8] hover:text-[#E50914] transition-colors cursor-pointer active:opacity-80 p-[8px] rounded-full hover:bg-[#334155] hidden sm:block">
                            <span className="material-symbols-outlined">contrast</span>
                        </button>
                        <button className="text-[#94A3B8] hover:text-[#E50914] transition-colors cursor-pointer active:opacity-80 p-[8px] rounded-full hover:bg-[#334155] hidden sm:block">
                            <span className="material-symbols-outlined">settings</span>
                        </button>
                        <div className="w-[1px] h-[32px] bg-[#334155] mx-[8px] hidden sm:block"></div>
                        <img 
                            alt="Administrator Avatar" 
                            className="w-[32px] h-[32px] rounded-full object-cover border border-[#334155] cursor-pointer hover:border-[#E50914] transition-colors" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbbNt9D1x0sueS5vVMGVpSQ1TDA4vS0zgks0_YiiASahwqKjXYYeR3TwNPANYFvEYTUzYhm8mn0B1p1oXQDqzIsFQqEsA5pqbUfyrV-MzGnblCjRihn_feEVbWBGG0PMqCekO6Cnn3tCZDu0lqFoC2K6PG_vbuOzEqkGb_Bt8X4KXsael6warwGgWBHytA3uCPemnX18F_uLDJvYg96B9RR5CVqkQdmWVWjSOOAGGAKDBdbCimBVOOlji9WRAvw2Cdna5cTy6h7Oao"
                        />
                    </div>
                </header>

                {/* Page Canvas */}
                <div className="p-[24px] md:p-[48px] flex flex-col gap-[48px] w-full max-w-[1440px] mx-auto">
                    {/* Breadcrumbs & Meta */}
                    <div className="flex flex-col gap-[4px]">
                        <div className="flex items-center gap-[4px] text-[#94A3B8] text-[12px] uppercase font-medium">
                            <Link to="/admin/users" className="hover:text-[#E50914] transition-colors">Users</Link>
                            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                            <span className="text-[#f8fafc]">USR-{user.id}</span>
                        </div>
                    </div>

                    {/* Profile Header */}
                    <section className="bg-[#1E293B] rounded-xl border border-[#334155] p-[24px] md:p-[32px] flex flex-col md:flex-row gap-[32px] items-start md:items-center justify-between relative overflow-hidden">
                        {/* Subtle background glow */}
                        <div className="absolute -top-[64px] -left-[64px] w-64 h-64 bg-[#E50914]/5 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-[24px] relative z-10 w-full md:w-auto">
                            {user.avatarUrl ? (
                                <img 
                                    alt="User Profile" 
                                    className="w-[64px] h-[64px] rounded-full object-cover border-2 border-[#0F172A] bg-[#334155] shadow-[0_4px_20px_rgba(0,0,0,0.5)]" 
                                    src={user.avatarUrl}
                                />
                            ) : (
                                <div className="w-[64px] h-[64px] rounded-full object-cover border-2 border-[#0F172A] bg-[#334155] shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center justify-center text-xl font-bold">
                                    {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'U'}
                                </div>
                            )}
                            <div className="flex flex-col items-center sm:items-start gap-[4px] text-center sm:text-left mt-[8px] sm:mt-0">
                                <div className="flex items-center gap-[8px]">
                                    <h2 className="text-[24px] md:text-[32px] font-bold text-[#f8fafc] m-0">{user.fullName || 'Unknown User'}</h2>
                                    {user.isPremium && <span className="px-[8px] py-[4px] rounded bg-[#7bd0ff]/20 border border-[#7bd0ff] text-[#7bd0ff] text-[12px] uppercase tracking-wider font-medium">Premium</span>}
                                    {user.role === 'ADMIN' && <span className="px-[8px] py-[4px] rounded bg-[#e50914]/20 border border-[#e50914] text-[#e50914] text-[12px] uppercase tracking-wider font-medium">Admin</span>}
                                    {!user.isActive && <span className="px-[8px] py-[4px] rounded bg-red-500/20 border border-red-500 text-red-400 text-[12px] uppercase tracking-wider font-medium">Disabled</span>}
                                </div>
                                <p className="text-[14px] text-[#94A3B8] mb-[4px]">{user.email}</p>
                                <p className="text-[12px] text-[#94A3B8] uppercase opacity-70 font-medium">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-[16px] w-full md:w-auto relative z-10 border-t border-[#334155] md:border-t-0 pt-[24px] md:pt-0">
                            <button onClick={handleRoleChange} className="px-[24px] py-[16px] rounded-lg border border-[#334155] text-[#f8fafc] bg-transparent hover:bg-[#334155] text-[12px] uppercase tracking-wider font-medium transition-all flex items-center justify-center gap-[8px]">
                                <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                                Change Role
                            </button>
                            <button onClick={handleToggleDisable} className="px-[24px] py-[16px] rounded-lg border border-transparent bg-[#E50914] text-white hover:brightness-110 active:brightness-90 text-[12px] uppercase tracking-wider font-medium transition-all flex items-center justify-center gap-[8px] shadow-[0_4px_14px_rgba(229,9,20,0.2)]">
                                <span className="material-symbols-outlined text-[18px]">block</span>
                                {user.isActive ? 'Disable Account' : 'Enable Account'}
                            </button>
                        </div>
                    </section>

                    {/* Stats Bento Grid */}
                    <section className="grid grid-cols-2 md:grid-cols-4 gap-[24px]">
                        <div className="bg-[#1E293B] p-[24px] rounded-xl border border-[#334155] flex flex-col justify-between gap-[16px] relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-16 h-16 bg-[#334155] rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
                            <span className="material-symbols-outlined text-[#94A3B8] relative z-10">account_balance_wallet</span>
                            <div className="relative z-10">
                                <p className="text-[12px] font-medium text-[#94A3B8] uppercase mb-[4px]">Total Spent</p>
                                <p className="text-[24px] font-semibold text-[#f8fafc]">${user.totalSpent || '0.00'}</p>
                            </div>
                        </div>
                        <div className="bg-[#1E293B] p-[24px] rounded-xl border border-[#334155] flex flex-col justify-between gap-[16px] relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-16 h-16 bg-[#334155] rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
                            <span className="material-symbols-outlined text-[#94A3B8] relative z-10">theaters</span>
                            <div className="relative z-10">
                                <p className="text-[12px] font-medium text-[#94A3B8] uppercase mb-[4px]">Movies Watched</p>
                                <p className="text-[24px] font-semibold text-[#f8fafc]">{user.moviesWatched || 0}</p>
                            </div>
                        </div>
                        <div className="bg-[#1E293B] p-[24px] rounded-xl border border-[#334155] flex flex-col justify-between gap-[16px] relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-16 h-16 bg-[#334155] rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
                            <span className="material-symbols-outlined text-[#94A3B8] relative z-10">rate_review</span>
                            <div className="relative z-10">
                                <p className="text-[12px] font-medium text-[#94A3B8] uppercase mb-[4px]">Reviews Left</p>
                                <p className="text-[24px] font-semibold text-[#f8fafc]">{user.reviewsCount || 0}</p>
                            </div>
                        </div>
                        <div className="bg-[#1E293B] p-[24px] rounded-xl border border-[#334155] flex flex-col justify-between gap-[16px] relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-16 h-16 bg-[#334155] rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
                            <span className="material-symbols-outlined text-[#94A3B8] relative z-10">devices</span>
                            <div className="relative z-10">
                                <p className="text-[12px] font-medium text-[#94A3B8] uppercase mb-[4px]">Active Devices</p>
                                <p className="text-[24px] font-semibold text-[#f8fafc]">3 <span className="text-[14px] text-[#94A3B8] font-normal">/ 4 allowed</span></p>
                            </div>
                        </div>
                    </section>

                    {/* Admin Edit Section */}
                    <section className="bg-[#1E293B] rounded-xl border border-[#334155] p-[24px] flex flex-col gap-[24px]">
                        <h3 className="text-[18px] font-bold text-[#f8fafc]">Admin Management Notes & Profile</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                            <div className="flex flex-col gap-[8px]">
                                <label className="text-[12px] text-[#94A3B8] uppercase tracking-wider font-medium">User Full Name</label>
                                <input 
                                    type="text"
                                    value={editFullName}
                                    onChange={(e) => setEditFullName(e.target.value)}
                                    className="bg-[#0F172A] border border-[#334155] rounded-lg py-[10px] px-[16px] text-[#f8fafc] focus:outline-none focus:border-[#E50914] transition-colors"
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div className="flex flex-col gap-[8px]">
                                <label className="text-[12px] text-[#94A3B8] uppercase tracking-wider font-medium">Admin Notes</label>
                                <textarea 
                                    rows="3"
                                    value={editAdminNotes}
                                    onChange={(e) => setEditAdminNotes(e.target.value)}
                                    className="bg-[#0F172A] border border-[#334155] rounded-lg py-[10px] px-[16px] text-[#f8fafc] focus:outline-none focus:border-[#E50914] transition-colors resize-none"
                                    placeholder="Write notes about this user (e.g., reason for disable, customer segment, behavior history...)"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button 
                                onClick={handleSaveChanges}
                                disabled={saving}
                                className="px-[24px] py-[12px] rounded-lg bg-[#E50914] text-white hover:brightness-110 active:brightness-90 font-medium transition-all shadow-[0_4px_14px_rgba(229,9,20,0.2)] disabled:opacity-50 flex items-center gap-[8px]"
                            >
                                <span className="material-symbols-outlined text-[18px]">save</span>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </section>

                    {/* Tabbed Interface */}
                    <section className="flex flex-col gap-[24px] flex-1">
                        {/* Tab Navigation */}
                        <div className="flex gap-[24px] border-b border-[#334155] overflow-x-auto no-scrollbar">
                            <button 
                                onClick={() => setActiveTab('payment')}
                                className={`text-[12px] font-medium uppercase tracking-wider pb-[8px] mb-[-1px] whitespace-nowrap flex items-center gap-[4px] transition-colors ${activeTab === 'payment' ? 'text-[#E50914] border-b-2 border-[#E50914]' : 'text-[#94A3B8] border-b-2 border-transparent hover:text-[#f8fafc] hover:border-[#334155]'}`}
                            >
                                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                                Payment History
                            </button>
                            <button 
                                onClick={() => setActiveTab('reviews')}
                                className={`text-[12px] font-medium uppercase tracking-wider pb-[8px] mb-[-1px] whitespace-nowrap flex items-center gap-[4px] transition-colors ${activeTab === 'reviews' ? 'text-[#E50914] border-b-2 border-[#E50914]' : 'text-[#94A3B8] border-b-2 border-transparent hover:text-[#f8fafc] hover:border-[#334155]'}`}
                            >
                                <span className="material-symbols-outlined text-[16px]">star</span>
                                Reviews
                            </button>
                            <button 
                                onClick={() => setActiveTab('watchlist')}
                                className={`text-[12px] font-medium uppercase tracking-wider pb-[8px] mb-[-1px] whitespace-nowrap flex items-center gap-[4px] transition-colors ${activeTab === 'watchlist' ? 'text-[#E50914] border-b-2 border-[#E50914]' : 'text-[#94A3B8] border-b-2 border-transparent hover:text-[#f8fafc] hover:border-[#334155]'}`}
                            >
                                <span className="material-symbols-outlined text-[16px]">bookmark</span>
                                Watchlist
                            </button>
                            <button 
                                onClick={() => setActiveTab('history')}
                                className={`text-[12px] font-medium uppercase tracking-wider pb-[8px] mb-[-1px] whitespace-nowrap flex items-center gap-[4px] transition-colors ${activeTab === 'history' ? 'text-[#E50914] border-b-2 border-[#E50914]' : 'text-[#94A3B8] border-b-2 border-transparent hover:text-[#f8fafc] hover:border-[#334155]'}`}
                            >
                                <span className="material-symbols-outlined text-[16px]">history</span>
                                Viewing History
                            </button>
                        </div>

                        {/* Tab Content: Payment History Data Table */}
                        {activeTab === 'payment' && (
                            <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden flex flex-col">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[600px]">
                                        <thead className="bg-[#0F172A] border-b border-[#334155]">
                                            <tr>
                                                <th className="p-[16px] text-[12px] font-medium uppercase text-[#94A3B8] w-[120px]">Date</th>
                                                <th className="p-[16px] text-[12px] font-medium uppercase text-[#94A3B8]">Transaction ID</th>
                                                <th className="p-[16px] text-[12px] font-medium uppercase text-[#94A3B8]">Plan</th>
                                                <th className="p-[16px] text-[12px] font-medium uppercase text-[#94A3B8]">Amount</th>
                                                <th className="p-[16px] text-[12px] font-medium uppercase text-[#94A3B8] text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[14px]">
                                            {paymentHistory && paymentHistory.length > 0 ? (
                                                paymentHistory.map((payment) => (
                                                    <tr key={payment.paymentId} className="border-b border-[#334155] hover:bg-[#334155]/50 transition-colors cursor-pointer group">
                                                        <td className="p-[16px] text-[#94A3B8] group-hover:text-[#f8fafc] transition-colors">
                                                            {new Date(payment.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="p-[16px] text-[#f8fafc] font-mono text-[13px]">
                                                            #{payment.transactionId || `TXN-${payment.orderCode}`}
                                                        </td>
                                                        <td className="p-[16px] text-[#f8fafc]">{payment.planType}</td>
                                                        <td className="p-[16px] text-[#f8fafc] font-semibold">${payment.amount}</td>
                                                        <td className="p-[16px] text-right">
                                                            <span className={`inline-flex items-center justify-center px-[8px] py-[2px] rounded text-[12px] font-medium uppercase ${
                                                                payment.status === 'SUCCESS' 
                                                                    ? 'bg-[#7bd0ff]/20 border border-[#7bd0ff] text-[#7bd0ff]' 
                                                                    : 'bg-red-500/20 border border-red-500 text-[#ffb4ab]'
                                                            }`}>
                                                                {payment.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="p-[16px] text-center text-[#94A3B8]">
                                                        No payment history found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination Footer */}
                                <div className="bg-[#0F172A] border-t border-[#334155] p-[16px] flex justify-between items-center">
                                    <span className="text-[14px] text-[#94A3B8]">
                                        Showing 1 to {paymentHistory.length} of {paymentHistory.length} entries
                                    </span>
                                    <div className="flex gap-[4px]">
                                        <button className="p-[4px] rounded text-[#94A3B8] hover:bg-[#334155] hover:text-[#f8fafc] disabled:opacity-50 transition-colors" disabled>
                                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                        </button>
                                        <button className="p-[4px] rounded text-[#94A3B8] hover:bg-[#334155] hover:text-[#f8fafc] disabled:opacity-50 transition-colors" disabled>
                                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Reviews Data Table */}
                        {activeTab === 'reviews' && (
                            <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden flex flex-col">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[600px]">
                                        <thead className="bg-[#0F172A] border-b border-[#334155]">
                                            <tr>
                                                <th className="p-[16px] text-[12px] font-medium uppercase text-[#94A3B8] w-[120px]">Date</th>
                                                <th className="p-[16px] text-[12px] font-medium uppercase text-[#94A3B8]">Movie</th>
                                                <th className="p-[16px] text-[12px] font-medium uppercase text-[#94A3B8]">Rating</th>
                                                <th className="p-[16px] text-[12px] font-medium uppercase text-[#94A3B8]">Comment</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[14px]">
                                            {recentReviews && recentReviews.length > 0 ? (
                                                recentReviews.map((review) => (
                                                    <tr key={review.id} className="border-b border-[#334155] hover:bg-[#334155]/50 transition-colors">
                                                        <td className="p-[16px] text-[#94A3B8]">{new Date(review.createdAt).toLocaleDateString()}</td>
                                                        <td className="p-[16px] text-[#f8fafc] font-medium">{review.movieTitle}</td>
                                                        <td className="p-[16px] text-[#7bd0ff] font-semibold">{review.rating} / 5.0</td>
                                                        <td className="p-[16px] text-[#94A3B8]">{review.comment}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="p-[16px] text-center text-[#94A3B8]">
                                                        No reviews left.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Watchlist Data Table */}
                        {activeTab === 'watchlist' && (
                            <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden flex flex-col">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[600px]">
                                        <thead className="bg-[#0F172A] border-b border-[#334155]">
                                            <tr>
                                                <th className="p-[16px] text-[12px] font-medium uppercase text-[#94A3B8] w-[120px]">Added Date</th>
                                                <th className="p-[16px] text-[12px] font-medium uppercase text-[#94A3B8]">Movie</th>
                                                <th className="p-[16px] text-[12px] font-medium uppercase text-[#94A3B8]">Rating</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[14px]">
                                            {recentWatchlist && recentWatchlist.length > 0 ? (
                                                recentWatchlist.map((item) => (
                                                    <tr key={item.id} className="border-b border-[#334155] hover:bg-[#334155]/50 transition-colors">
                                                        <td className="p-[16px] text-[#94A3B8]">{new Date(item.addedAt).toLocaleDateString()}</td>
                                                        <td className="p-[16px] text-[#f8fafc] font-medium">{item.movieTitle}</td>
                                                        <td className="p-[16px] text-[#94A3B8]">{item.voteAverage} (Based on {item.voteCount} votes)</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="3" className="p-[16px] text-center text-[#94A3B8]">
                                                        Watchlist is empty.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Viewing History Data Table */}
                        {activeTab === 'history' && (
                            <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden flex flex-col">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[600px]">
                                        <thead className="bg-[#0F172A] border-b border-[#334155]">
                                            <tr>
                                                <th className="p-[16px] text-[12px] font-medium uppercase text-[#94A3B8] w-[120px]">Watched Date</th>
                                                <th className="p-[16px] text-[12px] font-medium uppercase text-[#94A3B8]">Movie</th>
                                                <th className="p-[16px] text-[12px] font-medium uppercase text-[#94A3B8]">Duration (s)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[14px]">
                                            {recentViews && recentViews.length > 0 ? (
                                                recentViews.map((item) => (
                                                    <tr key={item.id} className="border-b border-[#334155] hover:bg-[#334155]/50 transition-colors">
                                                        <td className="p-[16px] text-[#94A3B8]">{new Date(item.watchedAt).toLocaleDateString()}</td>
                                                        <td className="p-[16px] text-[#f8fafc] font-medium">{item.movieTitle}</td>
                                                        <td className="p-[16px] text-[#94A3B8]">{item.watchDuration} seconds</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="3" className="p-[16px] text-center text-[#94A3B8]">
                                                        No viewing history.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default AdminUserDetail;
