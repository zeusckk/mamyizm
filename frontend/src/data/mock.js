// Static constants kept on frontend (categories + formatters)
// All dynamic data (funds, holdings, transactions, news) now come from backend API.

export const FUND_CATEGORIES = [
  { id: 'all', label: 'Tümü' },
  { id: 'para-piyasasi', label: 'Para Piyasası' },
  { id: 'hisse', label: 'Hisse Senedi' },
  { id: 'borclanma', label: 'Borçlanma Araçları' },
  { id: 'altin', label: 'Kıymetli Maden' },
  { id: 'bes', label: 'BES' },
  { id: 'karma', label: 'Karma' },
  { id: 'yabanci', label: 'Yabancı Menkul' },
];

export const formatTRY = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(n || 0);
export const formatNum = (n, d = 4) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n || 0);
export const formatPct = (n) => `${n >= 0 ? '+' : ''}${(n || 0).toFixed(2)}%`;
