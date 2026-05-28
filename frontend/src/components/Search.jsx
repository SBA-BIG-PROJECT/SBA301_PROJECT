import React from 'react'
import searchIcon from '../assets/search.svg'

function Search({
  searchTerm,
  setSearchTerm,
  className = '',
  placeholder = 'Search for movies...'
}) {
  return (
    <div className={`search ${className}`.trim()}>
      <div>
        <img src={searchIcon} alt="Search" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
  )
}

export default Search