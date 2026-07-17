import React, { useState, useEffect } from 'react';
import AdminTaskbar from './admintaskbar.jsx';
import adminService from '../../services/adminService';

const AdminPayment = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [revenueStats, setRevenueStats] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');

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
  
  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const statusParam = statusFilter !== 'all' ? statusFilter.toUpperCase() : undefined;
      const data = await adminService.getAllPayments(page, size, statusParam);
      setPayments(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err?.response?.data?.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [dashData, revData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getRevenueAnalytics()
      ]);
      setDashboardStats(dashData);
      setRevenueStats(revData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleApplyFilters = () => {
    setPage(0);
    fetchPayments();
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return 'bg-green-500/10 text-green-500';
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-500';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-[#334155] text-[#94A3B8]';
    }
  };

  return (
    <div className="bg-[#0F172A] text-[#f8fafc] min-h-screen flex antialiased" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <AdminTaskbar />
      
      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen bg-[#0F172A]">
        {/* TopNavBar (Mobile Only) */}
        <header className="md:hidden flex justify-between items-center w-full px-[24px] py-[16px] sticky top-0 z-50 bg-[#0F172A] border-b border-[#334155] shadow-sm">
          <div className="text-[24px] font-bold text-[#E50914]">CineAdmin</div>
          <div className="flex gap-[16px] text-[#94A3B8]">
            <span className="material-symbols-outlined cursor-pointer hover:text-[#E50914] transition-colors">menu</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-[24px] md:p-[48px] flex-1 flex flex-col gap-[48px]">
          {/* Page Header */}
          <div className="hidden md:flex justify-between items-end text-left w-full">
            <div className="text-left">
              <h1 className="text-[32px] leading-[40px] tracking-[-0.01em] md:text-[48px] md:leading-[1.1] md:tracking-[-0.02em] font-extrabold text-[#f8fafc] text-left">Payment Management</h1>
              <p className="text-[16px] leading-[24px] text-[#94a3b8] mt-[4px] text-left">Monitor transaction logs, revenue streams, and premium subscription details.</p>
            </div>
          </div>
          {/* Mobile Page Header */}
          <div className="md:hidden text-left">
            <h1 className="text-[28px] leading-[36px] font-extrabold text-[#f8fafc] text-left">Payment Management</h1>
            <p className="text-[14px] leading-[20px] text-[#94a3b8] mt-[4px] text-left">Monitor transaction logs, revenue streams, and premium subscription details.</p>
          </div>

          {/* Bento Metrics Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[24px]">
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-[24px] flex flex-col gap-[8px]">
              <p className="text-[12px] font-medium text-[#94A3B8] uppercase">Total Revenue (30d)</p>
              <div className="flex items-end justify-between">
                <h3 className="text-[24px] font-bold leading-none text-[#f8fafc]">
                  {revenueStats ? formatCurrency(revenueStats.totalRevenue) : '$0'}
                </h3>
              </div>
            </div>
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-[24px] flex flex-col gap-[8px]">
              <p className="text-[12px] font-medium text-[#94A3B8] uppercase">Successful Txns</p>
              <div className="flex items-end justify-between">
                <h3 className="text-[24px] font-bold leading-none text-[#f8fafc]">
                  {dashboardStats?.successfulPayments || 0}
                </h3>
              </div>
            </div>
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-[24px] flex flex-col gap-[8px]">
              <p className="text-[12px] font-medium text-[#94A3B8] uppercase">Pending Txns</p>
              <div className="flex items-end justify-between">
                <h3 className="text-[24px] font-bold leading-none text-[#f8fafc]">
                  {dashboardStats?.pendingPayments || 0}
                </h3>
              </div>
            </div>
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-[24px] flex flex-col gap-[8px]">
              <p className="text-[12px] font-medium text-[#94A3B8] uppercase">Active Subs</p>
              <div className="flex items-end justify-between">
                <h3 className="text-[24px] font-bold leading-none text-[#f8fafc]">
                  {dashboardStats?.premiumUsers || 0}
                </h3>
                <span className="material-symbols-outlined text-[#94A3B8] opacity-50 text-[32px]">group</span>
              </div>
            </div>
          </section>

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
              <span className="material-symbols-outlined text-red-400 text-[48px] mb-4 block">error</span>
              <p className="text-red-400 text-lg font-medium mb-2">Error Loading Payments</p>
              <p className="text-[#94a3b8] text-sm">{error}</p>
              <button onClick={fetchPayments} className="mt-4 bg-[#334155] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#475569] transition-colors">Retry</button>
            </div>
          )}

          {/* Table Section */}
          {!error && (
            <section className="bg-[#1E293B] border border-[#334155] rounded-xl flex flex-col flex-1 overflow-hidden">
              {/* Toolbar */}
              <div className="p-[24px] border-b border-[#334155] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[16px]">
                <div className="relative w-full sm:w-96">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">search</span>
                  <input className="w-full bg-[#0F172A] border border-[#334155] text-[#f8fafc] rounded-lg pl-10 pr-4 py-2 text-[14px] focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none" placeholder="Search by Order Code..." type="text"/>
                </div>
                <div className="flex items-center gap-[16px] w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full bg-[#0F172A] border border-[#334155] text-[#f8fafc] rounded-lg pl-4 pr-10 py-2 text-[14px] appearance-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="success">Success</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">expand_more</span>
                  </div>
                  <button onClick={handleApplyFilters} className="bg-[#334155] text-white px-4 py-2 rounded-lg text-[14px] hover:bg-[#475569] transition-colors">Filter</button>
                  <button className="bg-transparent border border-[#334155] hover:bg-[#334155] transition-colors text-white h-[38px] px-4 rounded-lg flex items-center justify-center gap-[8px] text-[12px] uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[14px]">download</span>
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#0F172A]">
                    <tr>
                      <th className="p-[8px] text-[10px] font-medium text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Order Code</th>
                      <th className="p-[8px] text-[10px] font-medium text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">User</th>
                      <th className="p-[8px] text-[10px] font-medium text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Plan Type</th>
                      <th className="p-[8px] text-[10px] font-medium text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Amount</th>
                      <th className="p-[8px] text-[10px] font-medium text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="p-[8px] text-[10px] font-medium text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">Date</th>
                      <th className="p-[8px] text-[10px] font-medium text-[#94A3B8] uppercase tracking-wider whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-[14px] divide-y divide-[#334155]">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="p-[32px] text-center text-[#94A3B8]">
                          <span className="material-symbols-outlined animate-spin mr-2 align-middle">progress_activity</span>
                          Loading payments...
                        </td>
                      </tr>
                    ) : payments.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-[32px] text-center text-[#94A3B8]">No payments found</td>
                      </tr>
                    ) : (
                      payments.map((payment) => (
                        <tr key={payment.paymentId} className="hover:bg-[#334155]/50 transition-colors group cursor-pointer border-b border-[#334155]">
                          <td className="p-[16px] font-['Geist'] text-[#7bd0ff] text-[12px]">{payment.orderCode || `#PAY-${payment.paymentId}`}</td>
                          <td className="p-[16px]">
                            <div className="flex items-center gap-[8px]">
                              <div className="w-8 h-8 rounded-full bg-[#334155] flex items-center justify-center text-[12px] font-bold">
                                {payment.userFullName ? payment.userFullName.substring(0, 2).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div className="text-[#f8fafc] font-medium">{payment.userEmail || 'N/A'}</div>
                                <div className="text-[#94A3B8] text-[12px]">ID: USR-{payment.userId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-[16px] text-[#f8fafc]">{payment.planType || 'N/A'}</td>
                          <td className="p-[16px] text-[#f8fafc] font-medium">{formatCurrency(payment.amount)}</td>
                          <td className="p-[16px]">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-[12px] font-medium ${getStatusColor(payment.status)}`}>
                              {payment.status || 'Unknown'}
                            </span>
                          </td>
                          <td className="p-[8px] text-[#94A3B8] text-[12px]">
                            {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : 'N/A'}
                          </td>
                          <td className="p-[16px] text-right">
                            <button className="text-[#94A3B8] hover:text-[#f8fafc] transition-colors">
                              <span className="material-symbols-outlined">more_vert</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-[16px] border-t border-[#334155] flex items-center justify-between text-[#94A3B8] text-xs font-['Inter']">
                <div>{payments.length > 0 ? `Showing ${(page * size) + 1} to ${(page * size) + payments.length} of ${totalElements} entries` : 'No results'}</div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#334155] hover:bg-[#1E293B] hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <span className="material-symbols-outlined text-xs">chevron_left</span>
                  </button>
                  
                  {getPageNumbers().map((pageNum, idx) => {
                    if (pageNum === '...') {
                      return (
                        <span key={`dots-${idx}`} className="w-7 h-7 flex items-center justify-center text-[#94a3b8] text-xs">
                          ...
                        </span>
                      );
                    }
                    const isCurrent = pageNum === page;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
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
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#334155] hover:bg-[#1E293B] hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPayment;
