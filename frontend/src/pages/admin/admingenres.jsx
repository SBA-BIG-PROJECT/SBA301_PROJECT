import React, { useState, useEffect } from 'react';
import AdminTaskbar from './admintaskbar.jsx';
import { adminService } from '../../services';
import { useToast, ToastContainer } from '../../components/Toast.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';

const AdminGenres = () => {
  const { toasts, showToast, closeToast } = useToast();
  const [genres, setGenres] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Form states
  const [newGenreName, setNewGenreName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

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

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [genresData, categoriesData] = await Promise.all([
        adminService.getAllGenres(),
        adminService.getAllCategories()
      ]);
      
      setGenres(genresData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      console.error('Error fetching taxonomy data:', err);
      setError('Failed to load genres and categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateGenre = async () => {
    if (!newGenreName.trim()) return;
    try {
      const id = Math.floor(Date.now() / 1000);
      await adminService.createGenre(id, newGenreName);
      setGenres([...genres, { id, name: newGenreName }]);
      setNewGenreName('');
      setShowGenreModal(false);
    } catch (err) {
      console.error('Error creating genre:', err);
      showToast('error', 'Failed to create genre.');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const id = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      await adminService.createCategory(id, newCategoryName);
      setCategories([...categories, { id, name: newCategoryName }]);
      setNewCategoryName('');
      setShowCategoryModal(false);
    } catch (err) {
      console.error('Error creating category:', err);
      showToast('error', 'Failed to create category.');
    }
  };

  const handleDeleteGenre = (id) => {
    requestConfirm(
      'Delete Genre',
      'Are you sure you want to delete this genre?',
      async () => {
        try {
          await adminService.deleteGenre(id);
          setGenres(genres.filter(g => g.id !== id));
          showToast('success', 'Genre deleted successfully.');
        } catch (err) {
          console.error('Error deleting genre:', err);
          showToast('error', 'Failed to delete genre.');
        }
      },
      'danger'
    );
  };

  const handleDeleteCategory = (id) => {
    requestConfirm(
      'Delete Category',
      'Are you sure you want to delete this category?',
      async () => {
        try {
          await adminService.deleteCategory(id);
          setCategories(categories.filter(c => c.id !== id));
          showToast('success', 'Category deleted successfully.');
        } catch (err) {
          console.error('Error deleting category:', err);
          showToast('error', 'Failed to delete category.');
        }
      },
      'danger'
    );
  };

  return (
    <div className="bg-[#0F172A] text-[#f8fafc] font-['Inter'] min-h-screen flex antialiased">
      <ToastContainer toasts={toasts} onClose={closeToast} />
      {/* SideNavBar */}
      <AdminTaskbar />

      {/* Main Content Wrapper */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen bg-[#0F172A]">
        {/* TopNavBar */}
        <header className="bg-[#0F172A] flex justify-between items-center w-full px-[24px] py-[16px] sticky top-0 z-30 shadow-sm border-b border-[#334155] md:hidden">
          <div className="flex items-center gap-[16px]">
            {/* Mobile Menu Button */}
            <button className="md:hidden text-[#94A3B8] hover:text-[#f8fafc] transition-colors cursor-pointer active:opacity-80">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="md:hidden text-[24px] font-bold text-[#E50914]">CineAdmin</span>
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center bg-[#1E293B] rounded-full px-[16px] py-[8px] border border-[#334155] w-96 focus-within:border-[#E50914] transition-colors">
            <span className="material-symbols-outlined text-[#94A3B8] mr-[8px]">search</span>
            <input 
              className="bg-transparent border-none outline-none text-[14px] text-[#f8fafc] w-full placeholder:text-[#94A3B8]" 
              placeholder="Search genres, categories..." 
              type="text" 
            />
          </div>

          <div className="flex items-center gap-[16px]">
            <button className="text-[#94A3B8] hover:text-[#f8fafc] transition-colors cursor-pointer active:opacity-80 relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#E50914] rounded-full"></span>
            </button>
            <button className="text-[#94A3B8] hover:text-[#f8fafc] transition-colors cursor-pointer active:opacity-80">
              <span className="material-symbols-outlined">contrast</span>
            </button>
            <button className="text-[#94A3B8] hover:text-[#f8fafc] transition-colors cursor-pointer active:opacity-80">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#334155] ml-[8px] overflow-hidden border border-[#334155] cursor-pointer">
              <img alt="Administrator Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-eB2QO9dsFveWII_-7NjgMo8vhLKaPVlmk26WmjzutDlzrD8YFIQWlrH095obZgU6H0n7j1dmMupP-1IrOf7X11CetWqcpHiVSK8xTWREbVM0Btw510hvLrs0hyZHpkLbuB0U4dCDFQueK7-U0-befc4_40pZ787lmGR_gBEaEMoAbUzVFxUVHYbGmfSEz0n27NXkHJlw2NdIQAUa6TYM09YMkECc68ifoO5Vs9U1rgsfUa9TSXp6ObePOIYESuriZEYzWWAOA2Zv"/>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-[24px] md:p-[48px] flex-1 flex flex-col gap-[48px]">
          {/* Page Header */}
          <div className="flex justify-between items-end text-left w-full">
            <div className="text-left">
              <h1 className="text-[32px] leading-[40px] tracking-[-0.01em] md:text-[48px] md:leading-[1.1] md:tracking-[-0.02em] font-extrabold text-[#f8fafc] text-left mx-0 max-w-none">Taxonomy Management</h1>
              <p className="text-[16px] leading-[24px] text-[#94A3B8] mt-[4px] text-left">Manage content genres and structural categories for the platform.</p>
            </div>
            <div className="flex gap-[16px]">
              <button 
                onClick={() => setShowGenreModal(true)}
                className="flex items-center gap-[8px] px-[24px] py-[8px] bg-[#E50914] text-white font-medium text-[14px] rounded-lg hover:brightness-110 active:brightness-90 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Genre
              </button>
              <button 
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center gap-[8px] px-[24px] py-[8px] bg-[#1E293B] border border-[#334155] text-[#f8fafc] font-medium text-[14px] rounded-lg hover:bg-[#334155] transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Category
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
              <span className="material-symbols-outlined text-red-400 text-[48px] mb-4 block">error</span>
              <p className="text-red-400 text-lg font-medium mb-2">Error Loading Taxonomy</p>
              <p className="text-[#94A3B8] text-sm">{error}</p>
              <button onClick={fetchData} className="mt-4 bg-[#334155] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#475569] transition-colors">Retry</button>
            </div>
          )}

          {/* Dual Pane Grid */}
          {!error && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-[24px] flex-1">
              
              {/* Genres Pane */}
              <section className="bg-[#1E293B] border border-[#334155] rounded-xl flex flex-col overflow-hidden min-h-[600px]">
                <div className="p-[24px] border-b border-[#334155] bg-[#1E293B] flex justify-between items-center sticky top-0 z-10">
                  <div className="flex items-center gap-[8px]">
                    <span className="material-symbols-outlined text-[#E50914]">category</span>
                    <h2 className="text-[18px] font-semibold text-[#f8fafc]">Content Genres</h2>
                  </div>
                  <span className="bg-[#334155] text-[#f8fafc] px-[8px] py-[4px] rounded text-[12px] font-mono">{genres.length} Total</span>
                </div>
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0F172A] sticky top-0 z-10">
                      <tr className="border-b border-[#334155] uppercase font-medium text-[12px] text-[#94A3B8]">
                        <th className="py-[16px] px-[24px] w-20">ID</th>
                        <th className="py-[16px] px-[24px]">Name</th>
                        <th className="py-[16px] px-[24px] w-32">Status</th>
                        <th className="py-[16px] px-[24px] text-right w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-[14px] text-[#f8fafc]">
                      {loading ? (
                        <tr><td colSpan="4" className="text-center py-8 text-[#94A3B8]">Loading genres...</td></tr>
                      ) : genres.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-8 text-[#94A3B8]">No genres found</td></tr>
                      ) : genres.map(genre => (
                        <tr key={genre.id} className="border-b border-[#334155] hover:bg-[#334155]/50 transition-colors group">
                          <td className="py-[16px] px-[24px] font-mono text-[#94A3B8]">G-{genre.id}</td>
                          <td className="py-[16px] px-[24px] font-medium text-[#f8fafc]">{genre.name}</td>
                          <td className="py-[16px] px-[24px]">
                            <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase">Active</span>
                          </td>
                          <td className="py-[16px] px-[24px] text-right opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-[#94A3B8] hover:text-[#f8fafc] transition-colors p-1"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                            <button onClick={() => handleDeleteGenre(genre.id)} className="text-[#94A3B8] hover:text-[#E50914] transition-colors p-1"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Categories Pane */}
              <section className="bg-[#1E293B] border border-[#334155] rounded-xl flex flex-col overflow-hidden min-h-[600px]">
                <div className="p-[24px] border-b border-[#334155] bg-[#1E293B] flex justify-between items-center sticky top-0 z-10">
                  <div className="flex items-center gap-[8px]">
                    <span className="material-symbols-outlined text-cyan-400">list</span>
                    <h2 className="text-[18px] font-semibold text-[#f8fafc]">Platform Categories</h2>
                  </div>
                  <span className="bg-[#334155] text-[#f8fafc] px-[8px] py-[4px] rounded text-[12px] font-mono">{categories.length} Total</span>
                </div>
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0F172A] sticky top-0 z-10">
                      <tr className="border-b border-[#334155] uppercase font-medium text-[12px] text-[#94A3B8]">
                        <th className="py-[16px] px-[24px] w-20">ID</th>
                        <th className="py-[16px] px-[24px]">Name</th>
                        <th className="py-[16px] px-[24px] w-32">Items</th>
                        <th className="py-[16px] px-[24px] text-right w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-[14px] text-[#f8fafc]">
                      {loading ? (
                        <tr><td colSpan="4" className="text-center py-8 text-[#94A3B8]">Loading categories...</td></tr>
                      ) : categories.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-8 text-[#94A3B8]">No categories found</td></tr>
                      ) : categories.map(category => (
                        <tr key={category.id} className="border-b border-[#334155] hover:bg-[#334155]/50 transition-colors group">
                          <td className="py-[16px] px-[24px] font-mono text-[#94A3B8]">C-{category.id}</td>
                          <td className="py-[16px] px-[24px] font-medium text-[#f8fafc] flex items-center gap-[8px]">
                            <span className="material-symbols-outlined text-[16px] text-[#94A3B8]">{category.icon || 'star'}</span>
                            {category.name}
                          </td>
                          <td className="py-[16px] px-[24px] text-[#94A3B8]">-</td>
                          <td className="py-[16px] px-[24px] text-right opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-[#94A3B8] hover:text-[#f8fafc] transition-colors p-1"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                            <button onClick={() => handleDeleteCategory(category.id)} className="text-[#94A3B8] hover:text-[#E50914] transition-colors p-1"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

            </div>
          )}
        </div>
      </main>

      {/* Modal: Create Genre */}
      {showGenreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-[16px]">
          {/* Backdrop Blur */}
          <div className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-sm" onClick={() => setShowGenreModal(false)}></div>
          
          {/* Modal Content */}
          <div className="relative bg-[#1E293B] border border-[#334155] rounded-xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
            <div className="p-[24px] border-b border-[#334155] flex justify-between items-center bg-[#0F172A]">
              <h3 className="text-[18px] font-semibold text-[#f8fafc] flex items-center gap-[8px]">
                <span className="material-symbols-outlined text-[#E50914]">add_circle</span>
                Create New Genre
              </h3>
              <button className="text-[#94A3B8] hover:text-[#f8fafc] transition-colors" onClick={() => setShowGenreModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-[24px] flex flex-col gap-[16px]">
              <div className="flex flex-col gap-[4px]">
                <label className="text-[12px] font-medium text-[#94A3B8] uppercase">Genre Name</label>
                <input 
                  value={newGenreName}
                  onChange={(e) => setNewGenreName(e.target.value)}
                  className="bg-[#0F172A] border border-[#334155] rounded-lg px-[16px] py-[8px] text-[14px] text-[#f8fafc] focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none transition-all w-full" 
                  placeholder="e.g. Neo-Noir" 
                  type="text" 
                />
              </div>
              <div className="flex flex-col gap-[4px]">
                <label className="text-[12px] font-medium text-[#94A3B8] uppercase">Short Code (Optional)</label>
                <input 
                  className="bg-[#0F172A] border border-[#334155] rounded-lg px-[16px] py-[8px] text-[14px] text-[#f8fafc] focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none transition-all w-full font-mono" 
                  placeholder="e.g. NNOIR" 
                  type="text" 
                />
              </div>
              <div className="flex items-center gap-[8px] mt-[8px]">
                <input id="genre-active" type="checkbox" defaultChecked className="rounded bg-[#0F172A] border-[#334155] text-[#E50914] focus:ring-[#E50914] focus:ring-offset-[#1E293B]" />
                <label htmlFor="genre-active" className="text-[14px] text-[#f8fafc] cursor-pointer">Set as Active immediately</label>
              </div>
            </div>
            
            <div className="p-[24px] border-t border-[#334155] bg-[#0F172A] flex justify-end gap-[16px]">
              <button 
                onClick={() => setShowGenreModal(false)}
                className="px-[24px] py-[8px] bg-[#1E293B] border border-[#334155] text-[#f8fafc] font-medium text-[14px] rounded-lg hover:bg-[#334155] transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateGenre}
                className="px-[24px] py-[8px] bg-[#E50914] text-white font-medium text-[14px] rounded-lg hover:brightness-110 active:brightness-90 transition-all"
              >
                Save Genre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Category */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-[16px]">
          {/* Backdrop Blur */}
          <div className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)}></div>
          
          {/* Modal Content */}
          <div className="relative bg-[#1E293B] border border-[#334155] rounded-xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
            <div className="p-[24px] border-b border-[#334155] flex justify-between items-center bg-[#0F172A]">
              <h3 className="text-[18px] font-semibold text-[#f8fafc] flex items-center gap-[8px]">
                <span className="material-symbols-outlined text-cyan-400">playlist_add</span>
                Create Category
              </h3>
              <button className="text-[#94A3B8] hover:text-[#f8fafc] transition-colors" onClick={() => setShowCategoryModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-[24px] flex flex-col gap-[16px]">
              <div className="flex flex-col gap-[4px]">
                <label className="text-[12px] font-medium text-[#94A3B8] uppercase">Category Title</label>
                <input 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="bg-[#0F172A] border border-[#334155] rounded-lg px-[16px] py-[8px] text-[14px] text-[#f8fafc] focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none transition-all w-full" 
                  placeholder="e.g. Blockbuster Hits" 
                  type="text" 
                />
              </div>
              <div className="flex flex-col gap-[4px]">
                <label className="text-[12px] font-medium text-[#94A3B8] uppercase">Display Icon (Material Symbol)</label>
                <input 
                  className="bg-[#0F172A] border border-[#334155] rounded-lg px-[16px] py-[8px] text-[14px] text-[#f8fafc] focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] outline-none transition-all w-full font-mono" 
                  placeholder="e.g. movie_filter" 
                  type="text" 
                />
              </div>
            </div>
            
            <div className="p-[24px] border-t border-[#334155] bg-[#0F172A] flex justify-end gap-[16px]">
              <button 
                onClick={() => setShowCategoryModal(false)}
                className="px-[24px] py-[8px] bg-[#1E293B] border border-[#334155] text-[#f8fafc] font-medium text-[14px] rounded-lg hover:bg-[#334155] transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateCategory}
                className="px-[24px] py-[8px] bg-[#E50914] text-white font-medium text-[14px] rounded-lg hover:brightness-110 active:brightness-90 transition-all"
              >
                Create Category
              </button>
            </div>
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

export default AdminGenres;
