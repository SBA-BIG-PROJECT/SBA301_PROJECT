import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminTaskbar from './admintaskbar.jsx';
import { adminService } from '../services';

const AdminUser = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Filters
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('all');
    const [premiumStatus, setPremiumStatus] = useState('all');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const searchParam = search ? search : undefined;
            const roleParam = role !== 'all' ? role.toUpperCase() : undefined;
            const premiumParam = premiumStatus !== 'all' ? (premiumStatus === 'active') : undefined;
            
            const data = await adminService.getAllUsers(page, size, searchParam, roleParam, premiumParam);
            setUsers(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page]);

    const handleApplyFilters = () => {
        setPage(0);
        fetchUsers();
    };

    const handleToggleBlock = async (userId) => {
        if (window.confirm('Are you sure you want to disable/delete this user?')) {
            try {
                await adminService.deleteUser(userId);
                fetchUsers();
            } catch (err) {
                console.error('Error disabling user', err);
                alert('Failed to disable user');
            }
        }
    };

    return (
        <div
            className="bg-[#0F172A] text-[#ffdad5] text-[14px] leading-[20px] min-h-screen flex antialiased"
            style={{ fontFamily: 'Inter, sans-serif' }}
        >
            <AdminTaskbar />
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:ml-64 w-full min-h-screen">
                {/* TopNavBar (Mobile mainly, or contextual header) */}
                <header className="bg-[#200e0c] border-b border-[#5e3f3b] shadow-sm flex justify-between items-center w-full px-[24px] py-[16px] sticky top-0 z-50 md:hidden">
                    <div className="text-[24px] leading-[32px] font-semibold text-[#ffb4aa]">CineAdmin</div>
                    <div className="flex items-center gap-[16px] text-[#e9bcb6] font-medium">
                        <span className="material-symbols-outlined cursor-pointer active:opacity-80 hover:text-[#ffb4aa] transition-colors">notifications</span>
                        <span className="material-symbols-outlined cursor-pointer active:opacity-80 hover:text-[#ffb4aa] transition-colors">contrast</span>
                        <span className="material-symbols-outlined cursor-pointer active:opacity-80 hover:text-[#ffb4aa] transition-colors">settings</span>
                        <img
                            alt="Administrator Avatar"
                            className="w-8 h-8 rounded-full border border-[#5e3f3b]"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQuPf4w44U0uL9DnZ2YtMZqe6M7zNDYE-lcBnkmIEs3tE6ldBvdUKkkLYMgiMjZKK0xHguByQuV5Yo3SCSW00odqA6QHLiCwXDMHV_g7d9OYTi5YA_iDZlk64yTcosvIBHtS25-LHyd23R515DOAz01VgH4QiyOE5sPvzzbnoHeAtwk3AdM-e0dIw6c0MOhgTVHHLcArdOYNM8tHXKOX8TH_bMC-m6YFMy1HGqOnP16oGjZwat_eqUDxfIXfTqrlIphXe8xxi39qeG"
                        />
                    </div>
                </header>

                {/* Desktop Header Area (Contextual) */}
                <div className="hidden md:flex justify-between items-center w-full px-[24px] py-[16px] border-b border-[#334155] bg-[#0F172A] sticky top-0 z-30">
                    <div>
                        <h2 className="text-[24px] leading-[32px] font-semibold text-[#ffdad5]">User Management</h2>
                    </div>
                    <div className="flex items-center gap-[16px] text-[#e9bcb6]">
                        <button className="p-2 rounded-full hover:bg-[#1E293B] transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                        <img
                            alt="Administrator Avatar"
                            className="w-10 h-10 rounded-full border border-[#334155]"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIoc1DnvUdS3Y0UuT0OYLbfeMNAAOq1HemaQnPxn9RAHB3YZoJI7v5vyHBWZqm9svHFHZa2ciSXsCUAmg_LkJgD7k9qJkNV-AU1B7F_D5kPviLjpHV2B1iDic5jhT7ewximBHnaHZVZNalfQHAPwoUBfrkqUYvy9d7vsuGR3NBUJeNZFHFHmleOwZTqqitIYwX-FnW7sqzy7h5539oLOaKO92LlsZWgux9oBhHdglZBVPj7y2Ss-XSTYDJL8--G1fJlPGDWY2OCmCv"
                        />
                    </div>
                </div>

                <main className="flex-1 p-[16px] md:p-[24px] space-y-[48px]">
                    {/* Filters & Search Section */}
                    <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-[24px] flex flex-col md:flex-row gap-[24px] items-end">
                        <div className="w-full md:w-1/3 flex flex-col gap-[4px]">
                            <label className="text-[12px] leading-[16px] tracking-[0.05em] font-medium text-[#e9bcb6] uppercase tracking-wider">Search Users</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#e9bcb6]">search</span>
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg py-2 pl-10 pr-4 text-[#ffdad5] text-[14px] leading-[20px] focus:outline-none focus:border-[#e50914] focus:ring-2 focus:ring-[#e50914]/15 transition-all placeholder:text-[#e9bcb6]/50"
                                    placeholder="Search by name, email, or ID..."
                                    type="text"
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-1/4 flex flex-col gap-[4px]">
                            <label className="text-[12px] leading-[16px] tracking-[0.05em] font-medium text-[#e9bcb6] uppercase tracking-wider">Role</label>
                            <div className="relative">
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-4 appearance-none text-[#ffdad5] text-[14px] leading-[20px] focus:outline-none focus:border-[#e50914] focus:ring-2 focus:ring-[#e50914]/15 transition-all">
                                    <option value="all">All Roles</option>
                                    <option value="user">Subscriber</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#e9bcb6] pointer-events-none">arrow_drop_down</span>
                            </div>
                        </div>
                        <div className="w-full md:w-1/4 flex flex-col gap-[4px]">
                            <label className="text-[12px] leading-[16px] tracking-[0.05em] font-medium text-[#e9bcb6] uppercase tracking-wider">Premium Status</label>
                            <div className="relative">
                                <select
                                    value={premiumStatus}
                                    onChange={(e) => setPremiumStatus(e.target.value)}
                                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-4 appearance-none text-[#ffdad5] text-[14px] leading-[20px] focus:outline-none focus:border-[#e50914] focus:ring-2 focus:ring-[#e50914]/15 transition-all">
                                    <option value="all">Any Status</option>
                                    <option value="active">Active Premium</option>
                                    <option value="none">Free Tier</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#e9bcb6] pointer-events-none">arrow_drop_down</span>
                            </div>
                        </div>
                        <div className="w-full md:w-auto flex-1 flex justify-end">
                            <button onClick={handleApplyFilters} className="bg-[#e50914] text-white px-[24px] py-2 rounded-lg text-[14px] leading-[20px] font-medium hover:brightness-110 active:brightness-90 transition-all h-10 whitespace-nowrap">
                                Apply Filters
                            </button>
                        </div>
                    </section>

                    {/* Data Table Section */}
                    <section className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#0F172A] border-b border-[#334155]">
                                    <tr>
                                        <th className="p-[16px] text-[12px] leading-[16px] tracking-[0.05em] font-medium text-[#e9bcb6] uppercase w-12 text-center">
                                            <input className="rounded bg-[#0F172A] border-[#334155] text-[#e50914] focus:ring-[#e50914] focus:ring-offset-[#1E293B]" type="checkbox" />
                                        </th>
                                        <th className="p-[16px] text-[12px] leading-[16px] tracking-[0.05em] font-medium text-[#e9bcb6] uppercase">User</th>
                                        <th className="p-[16px] text-[12px] leading-[16px] tracking-[0.05em] font-medium text-[#e9bcb6] uppercase">User ID</th>
                                        <th className="p-[16px] text-[12px] leading-[16px] tracking-[0.05em] font-medium text-[#e9bcb6] uppercase">Role</th>
                                        <th className="p-[16px] text-[12px] leading-[16px] tracking-[0.05em] font-medium text-[#e9bcb6] uppercase">Premium Status</th>
                                        <th className="p-[16px] text-[12px] leading-[16px] tracking-[0.05em] font-medium text-[#e9bcb6] uppercase">Last Login</th>
                                        <th className="p-[16px] text-[12px] leading-[16px] tracking-[0.05em] font-medium text-[#e9bcb6] uppercase">Status</th>
                                        <th className="p-[16px] text-[12px] leading-[16px] tracking-[0.05em] font-medium text-[#e9bcb6] uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#334155]">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="8" className="p-[16px] text-center text-[#e9bcb6]">Loading users...</td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="p-[16px] text-center text-[#e9bcb6]">No users found</td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user.id} className="hover:bg-[#0F172A]/50 transition-colors group">
                                                <td className="p-[16px] text-center">
                                                    <input className="rounded bg-[#0F172A] border-[#334155] text-[#e50914] focus:ring-[#e50914] focus:ring-offset-[#1E293B]" type="checkbox" />
                                                </td>
                                                <td className="p-[16px]">
                                                    <div className="flex items-center gap-[16px]">
                                                        {user.avatarUrl ? (
                                                            <img
                                                                alt={user.fullName || 'User Avatar'}
                                                                className="w-10 h-10 rounded-full border border-[#334155] object-cover"
                                                                src={user.avatarUrl}
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-[#334155] flex items-center justify-center text-[#ffdad5] font-bold">
                                                                {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'U'}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="text-[14px] leading-[20px] font-medium text-[#ffdad5]">{user.fullName || 'Unknown User'}</div>
                                                            <div className="text-[13px] leading-[18px] font-normal font-['Geist'] text-[#e9bcb6] opacity-70">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-[16px] text-[13px] leading-[18px] font-normal font-['Geist'] text-[#e9bcb6]">USR-{user.id}</td>
                                                <td className="p-[16px]">
                                                    {user.role === 'ADMIN' ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/30">Admin</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-[#334155] text-[#e9bcb6]">Subscriber</span>
                                                    )}
                                                </td>
                                                <td className="p-[16px]">
                                                    {user.isPremium ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400">Active</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-[#334155] text-[#e9bcb6]">Free Tier</span>
                                                    )}
                                                </td>
                                                <td className="p-[16px] text-[14px] leading-[20px] font-normal text-[#e9bcb6]">
                                                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="p-[16px]">
                                                    <span className="inline-flex items-center gap-1">
                                                        <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                        <span className="text-[12px] leading-[16px] tracking-[0.05em] font-medium text-[#e9bcb6]">{user.isActive ? 'Active' : 'Disabled'}</span>
                                                    </span>
                                                </td>
                                                <td className="p-[16px] text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link to={`/admin/users/${user.id}`} className="p-1.5 text-[#e9bcb6] hover:text-white hover:bg-[#334155] rounded transition-colors" title="View Detail">
                                                            <span className="material-symbols-outlined text-sm">visibility</span>
                                                        </Link>
                                                        <button className="p-1.5 text-[#e9bcb6] hover:text-white hover:bg-[#334155] rounded transition-colors" title="Edit Role">
                                                            <span className="material-symbols-outlined text-sm">edit</span>
                                                        </button>
                                                        {user.isActive && (
                                                            <button onClick={() => handleToggleBlock(user.id)} className="p-1.5 text-[#ffb4ab] hover:text-white hover:bg-[#ffb4ab]/20 rounded transition-colors" title="Disable">
                                                                <span className="material-symbols-outlined text-sm">block</span>
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

                        {/* Pagination */}
                        <div className="bg-[#0F172A] border-t border-[#334155] p-[16px] flex items-center justify-between">
                            <div className="text-[12px] leading-[16px] tracking-[0.05em] font-medium text-[#e9bcb6]">
                                Showing <span className="font-bold text-[#ffdad5]">{(page * size) + 1}</span> to <span className="font-bold text-[#ffdad5]">{(page * size) + users.length}</span> of <span className="font-bold text-[#ffdad5]">{totalElements}</span> results
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(Math.max(0, page - 1))}
                                    disabled={page === 0}
                                    className="p-2 rounded border border-[#334155] text-[#e9bcb6] hover:bg-[#1E293B] hover:text-white disabled:opacity-50 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                                </button>
                                <button className="w-8 h-8 rounded bg-[#e50914] text-white text-[14px] leading-[20px] font-medium flex items-center justify-center">{page + 1}</button>
                                <button
                                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                                    disabled={page >= totalPages - 1}
                                    className="p-2 rounded border border-[#334155] text-[#e9bcb6] hover:bg-[#1E293B] hover:text-white transition-colors disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default AdminUser;
