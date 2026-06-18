import React from 'react'
import logo from '../assets/logo.svg'

const Spinner = () => {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="relative flex items-center justify-center">
        {/* Glow effect behind logo */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-indigo-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
        {/* Logo with bounce/pulse */}
        <img 
          src={logo} 
          alt="Loading..." 
          className="w-20 h-20 object-contain relative z-10 animate-bounce"
          style={{ animationDuration: '2s' }}
        />
      </div>
      <p className="text-gray-400 text-sm font-semibold tracking-widest uppercase animate-pulse">
        Loading...
      </p>
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export default Spinner