import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminTaskbar = () => {
  const location = useLocation();
  const path = location.pathname;

  const menuItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard' },
    { name: 'Users', icon: 'group', path: '/admin/users' },
    { name: 'Movies', icon: 'movie', path: '/admin/movies' },
    { name: 'Payments', icon: 'payments', path: '/admin/payments' },
    { name: 'Analytics', icon: 'analytics', path: '/admin/analytics' },
    { name: 'Genres', icon: 'category', path: '/admin/genres' },
    { name: 'Categories', icon: 'list', path: '/admin/categories' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col p-[16px] gap-[8px] bg-[#1E293B] border-r border-[#334155] z-40 hidden md:flex">
      {/* Brand Logo & Title */}
      <div className="mb-[24px] px-[16px] flex items-center gap-[16px]">
        <div className="w-[48px] h-[48px] rounded-full bg-[#E50914] flex items-center justify-center text-white font-bold text-[20px]">
          CA
        </div>
        <div>
          <h1 className="text-[20px] leading-[28px] font-bold text-[#E50914]">CineAdmin</h1>
          <p className="text-[#94A3B8] text-[12px] leading-[16px] tracking-[0.05em] font-medium">Management Console</p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 flex flex-col gap-[4px] overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          // Determine if this path is active
          const isActive = path.startsWith(item.path);
          
          return (
            <Link 
              key={item.name}
              to={item.path}
              className={`flex items-center gap-[16px] rounded-lg px-[16px] py-[12px] transition-all cursor-pointer active:scale-95 ${
                isActive 
                  ? 'bg-[#E50914] text-white shadow-lg shadow-[#E50914]/20' 
                  : 'text-[#94A3B8] hover:bg-[#334155] hover:text-[#F8FAFC]'
              }`}
            >
              <span 
                className={`material-symbols-outlined ${isActive ? 'icon-fill' : ''}`} 
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="text-[14px] leading-[20px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Section (Logout) */}
      <div className="mt-auto flex flex-col gap-[4px] pt-[16px]">
        <Link 
          to="/logout"
          className="flex items-center gap-[16px] text-[#94A3B8] hover:bg-[#334155] hover:text-[#F8FAFC] rounded-lg px-[16px] py-[12px] transition-all cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>logout</span>
          <span className="text-[14px] leading-[20px] font-medium">Logout</span>
        </Link>
      </div>
    </aside>
  );
};

export default AdminTaskbar;
