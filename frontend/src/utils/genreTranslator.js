export const genreTranslationMap = {
  'hành động': 'Action',
  'phiêu lưu': 'Adventure',
  'hoạt hình': 'Animation',
  'hài': 'Comedy',
  'hình sự': 'Crime',
  'tài liệu': 'Documentary',
  'chính kịch': 'Drama',
  'gia đình': 'Family',
  'giả tưởng': 'Fantasy',
  'giả tượng': 'Fantasy',
  'lịch sử': 'History',
  'kinh dị': 'Horror',
  'nhạc': 'Music',
  'bí ẩn': 'Mystery',
  'lãng mạn': 'Romance',
  'khoa học viễn tưởng': 'Science Fiction',
  'phim truyền hình': 'TV Movie',
  'chương trình truyền hình': 'TV Show',
  'gây cấn': 'Thriller',
  'chiến tranh': 'War',
  'miền tây': 'Western'
};

export const translateGenre = (genreName) => {
  if (!genreName) return genreName;
  
  // Normalize string to NFC, convert to lowercase, collapse multiple spaces
  let name = genreName.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
  
  // Remove leading "phim " prefix if it exists
  name = name.replace(/^phim\s+/, '').trim();
  
  if (genreTranslationMap[name]) return genreTranslationMap[name];
  
  // Try NFD just in case
  let nameNFD = genreName.normalize('NFD').toLowerCase().replace(/\s+/g, ' ').trim();
  if (genreTranslationMap[nameNFD]) return genreTranslationMap[nameNFD];
  
  // If all else fails, use a fallback heuristic for this specific word
  if (name.includes('giả') && name.includes('tư')) return 'Fantasy';

  return genreName;
};
