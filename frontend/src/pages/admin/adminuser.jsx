import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminTaskbar from './admintaskbar.jsx';
import { adminService } from '../../services';
import { useToast, ToastContainer } from '../../components/Toast.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';

const AdminUser = () => {
    const { toasts, showToast, closeToast } = useToast();
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
    const [accountStatus, setAccountStatus] = useState('all');

    // Ban Modal States
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [banUserId, setBanUserId] = useState(null);
    const [banReason, setBanReason] = useState('');

    // Custom Confirm Modal States
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'danger'
    });

    const requestConfirm = (title, message, onConfirm, type = 'danger') => {
        setConfirmConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                closeConfirm();
            },
            type
        });
    };

    const closeConfirm = () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
    };

    // Edit User Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editUserForm, setEditUserForm] = useState({
        id: '',
        fullName: '',
        role: '',
        isActive: true,
        adminNotes: '',
        originalRole: ''
    });
    const [saving, setSaving] = useState(false);

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

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const searchParam = search ? search : undefined;
            const roleParam = role !== 'all' ? role.toUpperCase() : undefined;
            const premiumParam = premiumStatus !== 'all' ? (premiumStatus === 'active') : undefined;
            const activeParam = accountStatus === 'all' ? undefined : (accountStatus === 'active');
            
            const data = await adminService.getAllUsers(page, size, searchParam, roleParam, premiumParam, activeParam);
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

    const handleBan = (userId) => {
        setBanUserId(userId);
        setBanReason('');
        setIsBanModalOpen(true);
    };

    const handleConfirmBan = async (e) => {
        e.preventDefault();
        if (!banReason.trim()) {
            showToast('error', 'Please enter a ban reason.');
            return;
        }
        try {
            await adminService.banUser(banUserId, { banReason });
            showToast('success', 'User banned successfully.');
            setIsBanModalOpen(false);
            fetchUsers();
        } catch (err) {
            console.error('Error banning user:', err);
            showToast('error', 'Failed to ban user.');
        }
    };

    const handleUnban = (userId) => {
        requestConfirm(
            'Unban User',
            'Are you sure you want to unban this user?',
            async () => {
                try {
                    await adminService.unbanUser(userId);
                    showToast('success', 'User unbanned successfully.');
                    fetchUsers();
                } catch (err) {
                    console.error('Error unbanning user:', err);
                    showToast('error', 'Failed to unban user.');
                }
            },
            'success'
        );
    };

    const handleDelete = (userId) => {
        requestConfirm(
            'Delete User',
            'Are you sure you want to delete (deactivate) this user account?',
            async () => {
                try {
                    await adminService.deleteUser(userId);
                    showToast('success', 'User deleted successfully.');
                    fetchUsers();
                } catch (err) {
                    console.error('Error deleting user:', err);
                    showToast('error', 'Failed to delete user.');
                }
            },
            'danger'
        );
    };

    const handleRestore = (userId) => {
        requestConfirm(
            'Restore User',
            'Are you sure you want to restore this user account?',
            async () => {
                try {
                    await adminService.restoreUser(userId);
                    showToast('success', 'User restored successfully.');
                    fetchUsers();
                } catch (err) {
                    console.error('Error restoring user:', err);
                    showToast('error', 'Failed to restore user.');
                }
            },
            'warning'
        );
    };

    const handleChangeRole = (userId, currentRole) => {
        const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
        requestConfirm(
            'Change Role',
            `Are you sure you want to change this user's role to ${newRole}?`,
            async () => {
                try {
                    await adminService.changeUserRole(userId, newRole);
                    showToast('success', 'User role changed successfully.');
                    fetchUsers();
                } catch (err) {
                    console.error('Error changing user role', err);
                    showToast('error', 'Failed to change user role.');
                }
            },
            'info'
        );
    };

    const handleOpenEditModal = (user) => {
        setEditUserForm({
            id: user.id,
            fullName: user.fullName || '',
            role: user.role || 'USER',
            isActive: user.isActive !== false,
            adminNotes: user.adminNotes || '',
            originalRole: user.role || 'USER'
        });
        setIsEditModalOpen(true);
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            // Update user details
            await adminService.updateUser(editUserForm.id, {
                fullName: editUserForm.fullName,
                adminNotes: editUserForm.adminNotes,
                isActive: editUserForm.isActive
            });

            // Update role if changed
            if (editUserForm.role !== editUserForm.originalRole) {
                await adminService.changeUserRole(editUserForm.id, editUserForm.role);
            }

            setIsEditModalOpen(false);
            fetchUsers();
        } catch (err) {
            console.error("Failed to update user:", err);
            showToast('error', 'Failed to update user.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="bg-[#0F172A] text-[#ffdad5] text-[14px] leading-[20px] min-h-screen flex antialiased"
            style={{ fontFamily: 'Inter, sans-serif' }}
        >
            <ToastContainer toasts={toasts} onClose={closeToast} />
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
                        <div className="w-full md:w-1/4 flex flex-col gap-[4px]">
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
                        <div className="w-full md:w-1/6 flex flex-col gap-[4px]">
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
                        <div className="w-full md:w-1/6 flex flex-col gap-[4px]">
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
                        <div className="w-full md:w-1/6 flex flex-col gap-[4px]">
                            <label className="text-[12px] leading-[16px] tracking-[0.05em] font-medium text-[#e9bcb6] uppercase tracking-wider">Account Status</label>
                            <div className="relative">
                                <select
                                    value={accountStatus}
                                    onChange={(e) => setAccountStatus(e.target.value)}
                                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-4 appearance-none text-[#ffdad5] text-[14px] leading-[20px] focus:outline-none focus:border-[#e50914] focus:ring-2 focus:ring-[#e50914]/15 transition-all">
                                    <option value="all">All</option>
                                    <option value="active">Active Only</option>
                                    <option value="inactive">Banned / Deleted</option>
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
                                                        <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : user.bannedAt ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                                                        <span className="text-[12px] leading-[16px] tracking-[0.05em] font-medium text-[#e9bcb6]">
                                                            {user.isActive ? 'Active' : user.bannedAt ? 'Banned' : 'Deleted'}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className="p-[16px] text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link to={`/admin/users/${user.id}`} className="p-1.5 text-[#e9bcb6] hover:text-white hover:bg-[#334155] rounded transition-colors" title="View Detail">
                                                            <span className="material-symbols-outlined text-sm">visibility</span>
                                                        </Link>
                                                        <button onClick={() => handleOpenEditModal(user)} className="p-1.5 text-[#e9bcb6] hover:text-white hover:bg-[#334155] rounded transition-colors" title="Edit User">
                                                            <span className="material-symbols-outlined text-sm">edit</span>
                                                        </button>
                                                        {user.isActive && (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleBan(user.id)} 
                                                                    className="p-1.5 rounded text-amber-400 hover:text-white hover:bg-amber-400/20 transition-colors"
                                                                    title="Ban User"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">block</span>
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDelete(user.id)} 
                                                                    className="p-1.5 rounded text-[#ffb4ab] hover:text-white hover:bg-[#ffb4ab]/20 transition-colors"
                                                                    title="Delete User"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                                </button>
                                                            </>
                                                        )}
                                                        {user.bannedAt && (
                                                            <button 
                                                                onClick={() => handleUnban(user.id)} 
                                                                className="p-1.5 rounded text-green-400 hover:text-white hover:bg-green-400/20 transition-colors"
                                                                title="Unban User"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                                            </button>
                                                        )}
                                                        {user.deletedAt && (
                                                            <button 
                                                                onClick={() => handleRestore(user.id)} 
                                                                className="p-1.5 rounded text-green-400 hover:text-white hover:bg-green-400/20 transition-colors"
                                                                title="Restore User"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">restore</span>
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
                                Showing <span className="font-bold text-[#ffdad5]">{totalElements > 0 ? (page * size) + 1 : 0}</span> to <span className="font-bold text-[#ffdad5]">{(page * size) + users.length}</span> of <span className="font-bold text-[#ffdad5]">{totalElements}</span> results
                            </div>
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
                                                    : 'border border-[#334155] text-[#e9bcb6] hover:bg-[#1E293B] hover:text-white'
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
                    </section>
                </main>
            </div>

            {/* Edit User Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1E293B] border border-[#334155] rounded-xl w-full max-w-lg shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-[#334155]">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-['Inter']">
                                <span className="material-symbols-outlined text-[#E50914]">manage_accounts</span>
                                Edit User Profile
                            </h3>
                            <button 
                                onClick={() => setIsEditModalOpen(false)} 
                                className="text-[#94A3B8] hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        {/* Form */}
                        <form onSubmit={handleSaveUser} className="p-6 space-y-4 font-['Inter']">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">User ID</label>
                                <input 
                                    type="text" 
                                    value={`USR-${editUserForm.id}`} 
                                    disabled 
                                    className="bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-3 text-[#94A3B8] cursor-not-allowed text-sm focus:outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">Full Name</label>
                                <input 
                                    type="text" 
                                    value={editUserForm.fullName} 
                                    onChange={(e) => setEditUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                                    required
                                    className="bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-[#E50914] transition-colors text-sm"
                                    placeholder="Enter user full name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">Role</label>
                                    <select 
                                        value={editUserForm.role} 
                                        onChange={(e) => setEditUserForm(prev => ({ ...prev, role: e.target.value }))}
                                        className="bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-[#E50914] transition-colors text-sm text-[#ffdad5]"
                                    >
                                        <option value="USER" className="bg-[#1E293B] text-white">Subscriber</option>
                                        <option value="ADMIN" className="bg-[#1E293B] text-white">Admin</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">Status</label>
                                    <input 
                                        type="text" 
                                        value={editUserForm.isActive ? 'Active' : 'Disabled (Banned/Deleted)'} 
                                        disabled 
                                        className="bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-3 text-[#94A3B8] cursor-not-allowed text-sm focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">Admin Notes</label>
                                <textarea 
                                    rows="3" 
                                    value={editUserForm.adminNotes} 
                                    onChange={(e) => setEditUserForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                                    className="bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-[#E50914] transition-colors resize-none text-sm"
                                    placeholder="Enter administrative notes for this user"
                                />
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

            {/* Ban User Modal */}
            {isBanModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1E293B] border border-[#334155] rounded-xl w-full max-w-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-[#334155]">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-['Inter']">
                                <span className="material-symbols-outlined text-[#E50914]">gavel</span>
                                Ban User Account
                            </h3>
                            <button 
                                onClick={() => setIsBanModalOpen(false)} 
                                className="text-[#94A3B8] hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        {/* Form */}
                        <form onSubmit={handleConfirmBan} className="p-6 space-y-4 font-['Inter']">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">User ID</label>
                                <input 
                                    type="text" 
                                    value={`USR-${banUserId}`} 
                                    disabled 
                                    className="bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-3 text-[#94A3B8] cursor-not-allowed text-sm focus:outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">Ban Reason</label>
                                <textarea 
                                    rows="3" 
                                    value={banReason} 
                                    onChange={(e) => setBanReason(e.target.value)}
                                    required
                                    className="bg-[#0F172A] border border-[#334155] rounded-lg py-2 px-3 text-white focus:outline-none focus:border-[#E50914] transition-colors resize-none text-sm"
                                    placeholder="Enter the reason for banning this user..."
                                />
                            </div>

                            {/* Footer Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-[#334155]">
                                <button 
                                    type="button" 
                                    onClick={() => setIsBanModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-[#334155] text-[#94A3B8] hover:text-white hover:bg-[#334155] transition-all text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-5 py-2 rounded-lg bg-[#E50914] text-white hover:brightness-110 active:brightness-90 transition-all font-medium text-sm flex items-center gap-1 shadow-lg shadow-[#E50914]/20"
                                >
                                    Confirm Ban
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onCancel={closeConfirm}
                type={confirmConfig.type}
            />
        </div>
    );
};

export default AdminUser;
