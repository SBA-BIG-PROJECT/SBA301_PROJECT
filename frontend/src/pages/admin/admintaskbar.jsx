import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminTaskbar = () => {
  const location = useLocation();
  const path = location.pathname;

  // Get collapse state from localStorage (to remember user choice across pages)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('adminSidebarCollapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', isCollapsed);
    if (isCollapsed) {
      document.body.classList.add('admin-sidebar-collapsed');
    } else {
      document.body.classList.remove('admin-sidebar-collapsed');
    }
  }, [isCollapsed]);

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
    <>
      <style>{`
        @media (min-width: 768px) {
          body.admin-sidebar-collapsed .md\\:ml-64 {
            margin-left: 5rem !important; /* w-20 = 5rem */
            transition: margin-left 0.3s ease-in-out;
          }
          .md\\:ml-64 {
            transition: margin-left 0.3s ease-in-out;
          }
        }
      `}</style>
      <aside className={`fixed left-0 top-0 h-screen flex flex-col py-[16px] gap-[8px] bg-[#1E293B] border-r border-[#334155] z-40 hidden md:flex transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20 px-[8px]' : 'w-64 px-[16px]'}`}>
        {/* Brand Logo & Title */}
        <div className={`mb-[24px] flex items-center ${isCollapsed ? 'justify-center' : 'px-[16px] gap-[16px]'}`}>
          <div className="w-[48px] h-[48px] rounded-full bg-[#E50914] flex items-center justify-center text-white font-bold text-[20px] shrink-0 shadow-lg shadow-[#E50914]/20">
            CA
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-[20px] leading-[28px] font-bold text-[#E50914] whitespace-nowrap">CineAdmin</h1>
              <p className="text-[#94A3B8] text-[11px] leading-[14px] tracking-[0.05em] font-medium truncate">
                Management Console
              </p>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <div className="flex-1 flex flex-col gap-[4px] overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            const isActive = path.startsWith(item.path);
            
            return (
              <Link 
                key={item.name}
                to={item.path}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center rounded-lg transition-all cursor-pointer active:scale-95 ${
                  isActive 
                    ? 'bg-[#E50914] text-white shadow-lg shadow-[#E50914]/20' 
                    : 'text-[#94A3B8] hover:bg-[#334155] hover:text-[#F8FAFC]'
                } ${isCollapsed ? 'justify-center p-[12px]' : 'gap-[16px] px-[16px] py-[12px]'}`}
              >
                <span 
                  className={`material-symbols-outlined ${isActive ? 'icon-fill' : ''}`} 
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                {!isCollapsed && <span className="text-[14px] leading-[20px] font-medium whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Bottom Section (Toggle Collapse & Logout) */}
        <div className="mt-auto flex flex-col gap-[4px] pt-[16px] border-t border-[#334155]">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand sidebar" : undefined}
            className={`flex items-center text-[#94A3B8] hover:bg-[#334155] hover:text-[#F8FAFC] rounded-lg transition-all cursor-pointer active:scale-95 ${isCollapsed ? 'justify-center p-[12px]' : 'gap-[16px] px-[16px] py-[12px]'}`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
            {!isCollapsed && <span className="text-[14px] leading-[20px] font-medium whitespace-nowrap">Collapse</span>}
          </button>
          
          <Link 
            to="/logout"
            title={isCollapsed ? "Logout" : undefined}
            className={`flex items-center text-[#94A3B8] hover:bg-[#334155] hover:text-[#F8FAFC] rounded-lg transition-all cursor-pointer active:scale-95 ${isCollapsed ? 'justify-center p-[12px]' : 'gap-[16px] px-[16px] py-[12px]'}`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>logout</span>
            {!isCollapsed && <span className="text-[14px] leading-[20px] font-medium whitespace-nowrap">Logout</span>}
          </Link>
        </div>
      </aside>
    </>
  );
};

export default AdminTaskbar;
