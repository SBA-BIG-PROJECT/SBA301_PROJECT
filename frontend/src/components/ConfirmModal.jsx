import React from 'react'

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
  if (!isOpen) return null

  const typeConfig = {
    danger: {
      btnBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      iconColor: 'text-red-500',
      iconBg: 'bg-red-500/10',
      icon: 'report'
    },
    warning: {
      btnBg: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500',
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10',
      icon: 'warning'
    },
    success: {
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10',
      icon: 'check_circle'
    },
    info: {
      btnBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
      icon: 'info'
    }
  }

  const config = typeConfig[type] || typeConfig.danger

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#334155] bg-[#15161b] p-6 text-left shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all z-10">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${config.iconBg} ${config.iconColor}`}>
            <span className="material-symbols-outlined text-[24px]">
              {config.icon}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#f8fafc] mb-1">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-colors bg-[#242730] hover:bg-[#2c303b] border border-[#334155] rounded-lg cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#15161b] cursor-pointer ${config.btnBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
