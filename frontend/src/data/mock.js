// Mock data for FonAkış (frontend-only prototype)

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

const genSeries = (base, vol = 0.02, days = 30) => {
  const out = [];
  let v = base;
  for (let i = 0; i < days; i++) {
    v = v * (1 + (Math.random() - 0.48) * vol);
    out.push({ d: i + 1, v: Number(v.toFixed(4)) });
  }
  return out;
};

export const FUNDS = [
  {
    code: 'FAH', name: 'FonAkış Hisse Yoğun Fon', category: 'hisse', categoryLabel: 'Hisse Senedi',
    price: 12.4581, change24h: 1.84, changeYtd: 28.42, risk: 6,
    aum: 412_500_000, manager: 'FonAkış Portföy', minBuy: 1, currency: 'TRY',
    series: genSeries(10, 0.025), desc: 'BIST 100 endeksindeki yüksek likiditeli hisselere odaklı, aktif yönetilen büyüme fonu.',
  },
  {
    code: 'FPL', name: 'FonAkış Para Piyasası Likit Fon', category: 'para-piyasasi', categoryLabel: 'Para Piyasası',
    price: 1.8423, change24h: 0.12, changeYtd: 41.85, risk: 1,
    aum: 1_240_000_000, manager: 'FonAkış Portföy', minBuy: 1, currency: 'TRY',
    series: genSeries(1.5, 0.003), desc: 'Düşük riskli, günlük likidite sağlayan kısa vadeli mevduat ve repo fonu.',
  },
  {
    code: 'FBO', name: 'FonAkış Devlet İç Borçlanma Fonu', category: 'borclanma', categoryLabel: 'Borçlanma',
    price: 3.2014, change24h: 0.34, changeYtd: 38.21, risk: 2,
    aum: 678_000_000, manager: 'FonAkış Portföy', minBuy: 1, currency: 'TRY',
    series: genSeries(2.8, 0.006), desc: 'Devlet iç borçlanma senetlerine yatırım yapan orta vadeli sabit getirili fon.',
  },
  {
    code: 'FAL', name: 'FonAkış Altın Fonu', category: 'altin', categoryLabel: 'Altın',
    price: 5.7290, change24h: -0.42, changeYtd: 52.14, risk: 4,
    aum: 322_000_000, manager: 'FonAkış Portföy', minBuy: 1, currency: 'TRY',
    series: genSeries(4.8, 0.018), desc: 'Fiziki altın ve altına dayalı yatırım araçlarına yatırım yapan koruyucu fon.',
  },
  {
    code: 'FKM', name: 'FonAkış Karma Dengeli Fon', category: 'karma', categoryLabel: 'Karma',
    price: 4.1208, change24h: 0.68, changeYtd: 32.91, risk: 4,
    aum: 198_000_000, manager: 'FonAkış Portföy', minBuy: 1, currency: 'TRY',
    series: genSeries(3.4, 0.015), desc: 'Hisse, tahvil ve para piyasası araçlarını dengeli oranda barındıran çok varlıklı fon.',
  },
  {
    code: 'FBE', name: 'FonAkış BES Atak Büyüme Fonu', category: 'bes', categoryLabel: 'BES',
    price: 6.8932, change24h: 1.21, changeYtd: 35.78, risk: 5,
    aum: 540_000_000, manager: 'FonAkış Emeklilik', minBuy: 1, currency: 'TRY',
    series: genSeries(5.6, 0.02), desc: 'Bireysel emeklilik sistemine özel, uzun vadeli büyüme odaklı agresif fon.',
  },
  {
    code: 'FBM', name: 'FonAkış BES Muhafazakar Fonu', category: 'bes', categoryLabel: 'BES',
    price: 2.4571, change24h: 0.18, changeYtd: 31.20, risk: 2,
    aum: 412_000_000, manager: 'FonAkış Emeklilik', minBuy: 1, currency: 'TRY',
    series: genSeries(2.1, 0.005), desc: 'BES katılımcıları için düşük riskli, sabit getirili ağırlıklı muhafazakar fon.',
  },
  {
    code: 'FYH', name: 'FonAkış Yabancı Hisse Fonu', category: 'yabanci', categoryLabel: 'Yabancı',
    price: 9.1284, change24h: -0.91, changeYtd: 24.65, risk: 6,
    aum: 154_000_000, manager: 'FonAkış Portföy', minBuy: 1, currency: 'TRY',
    series: genSeries(7.8, 0.022), desc: 'Global teknoloji ve büyüme hisselerine yatırım yapan döviz hassasiyetli fon.',
  },
  {
    code: 'FTK', name: 'FonAkış Teknoloji Sektörü Fonu', category: 'hisse', categoryLabel: 'Hisse Senedi',
    price: 14.7821, change24h: 2.45, changeYtd: 47.32, risk: 7,
    aum: 89_000_000, manager: 'FonAkış Portföy', minBuy: 1, currency: 'TRY',
    series: genSeries(11, 0.03), desc: 'BIST teknoloji sektörü hisselerine yoğunlaşan, yüksek riskli tematik fon.',
  },
  {
    code: 'FED', name: 'FonAkış Eurobond Fonu', category: 'borclanma', categoryLabel: 'Borçlanma',
    price: 7.4012, change24h: 0.05, changeYtd: 29.18, risk: 3,
    aum: 245_000_000, manager: 'FonAkış Portföy', minBuy: 1, currency: 'TRY',
    series: genSeries(6.2, 0.009), desc: 'TL bazında getiri sağlayan, USD cinsi devlet eurobondlarına yatırım yapan fon.',
  },
  {
    code: 'FGM', name: 'FonAkış Gümüş ve Kıymetli Maden Fonu', category: 'altin', categoryLabel: 'Kıymetli Maden',
    price: 3.5891, change24h: -1.12, changeYtd: 44.78, risk: 5,
    aum: 76_000_000, manager: 'FonAkış Portföy', minBuy: 1, currency: 'TRY',
    series: genSeries(3, 0.025), desc: 'Gümüş ve diğer kıymetli madenlere yatırım yapan tematik enstrüman.',
  },
  {
    code: 'FBL', name: 'FonAkış BIST 30 Endeks Fonu', category: 'hisse', categoryLabel: 'Hisse Senedi',
    price: 8.2941, change24h: 1.32, changeYtd: 26.84, risk: 5,
    aum: 312_000_000, manager: 'FonAkış Portföy', minBuy: 1, currency: 'TRY',
    series: genSeries(7, 0.02), desc: 'BIST 30 endeksini pasif olarak takip eden, düşük maliyetli endeks fonu.',
  },
];

export const MOCK_USER = {
  id: 'u_demo',
  fullName: 'Demo Kullanıcı',
  email: 'demo@fonakis.com',
  tckn: '11111111111',
  phone: '+90 555 000 0000',
  ibanMasked: 'TR** **** **** **** **** ** 1234',
  cashBalance: 48_250.75,
  totalDeposits: 200_000,
};

export const MOCK_HOLDINGS = [
  { code: 'FAH', units: 2450.32, avgCost: 9.84, currentPrice: 12.4581 },
  { code: 'FPL', units: 8200.10, avgCost: 1.6201, currentPrice: 1.8423 },
  { code: 'FAL', units: 980.50, avgCost: 4.21, currentPrice: 5.7290 },
  { code: 'FBE', units: 1240.00, avgCost: 5.92, currentPrice: 6.8932 },
  { code: 'FED', units: 410.75, avgCost: 6.50, currentPrice: 7.4012 },
];

export const MOCK_TRANSACTIONS = [
  { id: 't1', date: '2025-07-08 14:22', type: 'Alım', code: 'FAH', units: 120.50, price: 12.40, total: 1494.20, status: 'Gerçekleşti' },
  { id: 't2', date: '2025-07-07 10:08', type: 'Satım', code: 'FAL', units: 50.00, price: 5.71, total: 285.50, status: 'Gerçekleşti' },
  { id: 't3', date: '2025-07-05 16:45', type: 'Alım', code: 'FBE', units: 200.00, price: 6.81, total: 1362.00, status: 'Gerçekleşti' },
  { id: 't4', date: '2025-07-03 09:30', type: 'Alım', code: 'FPL', units: 1000.00, price: 1.83, total: 1830.00, status: 'Gerçekleşti' },
  { id: 't5', date: '2025-07-01 11:12', type: 'Para Yatırma', code: '-', units: 0, price: 0, total: 10000.00, status: 'Gerçekleşti' },
  { id: 't6', date: '2025-06-28 13:55', type: 'Alım', code: 'FED', units: 80.00, price: 7.30, total: 584.00, status: 'Gerçekleşti' },
  { id: 't7', date: '2025-06-25 15:20', type: 'Satım', code: 'FKM', units: 100.00, price: 4.08, total: 408.00, status: 'Gerçekleşti' },
  { id: 't8', date: '2025-06-22 10:00', type: 'Alım', code: 'FAH', units: 50.00, price: 11.20, total: 560.00, status: 'Gerçekleşti' },
  { id: 't9', date: '2025-06-20 12:30', type: 'Para Çekme', code: '-', units: 0, price: 0, total: -2000.00, status: 'Gerçekleşti' },
  { id: 't10', date: '2025-06-18 14:10', type: 'Alım', code: 'FYH', units: 30.00, price: 8.90, total: 267.00, status: 'İptal' },
];

export const MOCK_NEWS = [
  { id: 'n1', date: '2025-07-09', tag: 'Piyasa', title: 'BIST 100 günü yükselişle kapattı, bankacılık endeksi öne çıktı', summary: 'Endeks gün içinde %2.1 değer kazanırken, bankacılık endeksi %3.4 yükseldi. Yabancı yatırımcı girişi 142M USD oldu.' },
  { id: 'n2', date: '2025-07-09', tag: 'Duyuru', title: 'FonAkış BES Atak Büyüme Fonu yönetim ücretinde indirim', summary: 'FBE fonunun yıllık yönetim ücreti 1 Ağustos itibarıyla %1.91\'den %1.65\'e düşürülecektir.' },
  { id: 'n3', date: '2025-07-08', tag: 'Analiz', title: 'TCMB faiz kararı sonrası tahvil piyasası görünümü', summary: 'Politika faizinin sabit tutulmasıyla 10 yıllık tahvil getirisi 35 baz puan geriledi. Tahvil fonları için olumlu sinyal.' },
  { id: 'n4', date: '2025-07-07', tag: 'Emtia', title: 'Altın ons fiyatı 2,420 USD seviyesinde yatay seyrediyor', summary: 'Jeopolitik gerilimler altına talebi destekliyor; gram altın TL bazında haftalık %1.8 değerlendi.' },
  { id: 'n5', date: '2025-07-05', tag: 'Duyuru', title: 'Yeni mobil uygulama 2.4 sürümü yayında', summary: 'Biyometrik giriş, hızlı işlem ekranı ve özelleştirilebilir kontrol panelleri eklendi.' },
  { id: 'n6', date: '2025-07-04', tag: 'Strateji', title: 'Üçüncü çeyrek varlık dağılım önerimiz: dengeli portföy', summary: 'Hisse %40, tahvil %35, kıymetli maden %15, para piyasası %10 ağırlıklı bir dağılım öneriyoruz.' },
];

export const formatTRY = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(n || 0);
export const formatNum = (n, d = 4) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n || 0);
export const formatPct = (n) => `${n >= 0 ? '+' : ''}${(n || 0).toFixed(2)}%`;
