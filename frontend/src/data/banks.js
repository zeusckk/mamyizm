// Turkish banks catalog with brand colors + logo URLs (Clearbit Logo API; falls back to initials).
// Keep code stable — used as bank_code in payment_methods.

export const BANKS = [
  { code: 'garanti', name: 'Garanti BBVA', domain: 'garantibbva.com.tr', color: '#00A859', text: '#FFFFFF' },
  { code: 'isbankasi', name: 'Türkiye İş Bankası', domain: 'isbank.com.tr', color: '#0033A0', text: '#FFFFFF' },
  { code: 'akbank', name: 'Akbank', domain: 'akbank.com', color: '#E60012', text: '#FFFFFF' },
  { code: 'yapikredi', name: 'Yapı Kredi', domain: 'yapikredi.com.tr', color: '#003F8E', text: '#FFFFFF' },
  { code: 'qnbfinansbank', name: 'QNB Finansbank', domain: 'qnbfinansbank.com', color: '#6E2D8C', text: '#FFFFFF' },
  { code: 'ziraat', name: 'Ziraat Bankası', domain: 'ziraatbank.com.tr', color: '#A51E36', text: '#FFFFFF' },
  { code: 'halkbank', name: 'Halkbank', domain: 'halkbank.com.tr', color: '#003B7E', text: '#FFFFFF' },
  { code: 'vakifbank', name: 'VakıfBank', domain: 'vakifbank.com.tr', color: '#FFB81C', text: '#0B2447' },
  { code: 'denizbank', name: 'DenizBank', domain: 'denizbank.com', color: '#00A2E2', text: '#FFFFFF' },
  { code: 'teb', name: 'TEB', domain: 'teb.com.tr', color: '#0C7B3E', text: '#FFFFFF' },
  { code: 'ing', name: 'ING', domain: 'ing.com.tr', color: '#FF6200', text: '#FFFFFF' },
  { code: 'sekerbank', name: 'Şekerbank', domain: 'sekerbank.com.tr', color: '#00853F', text: '#FFFFFF' },
  { code: 'hsbc', name: 'HSBC', domain: 'hsbc.com.tr', color: '#DB0011', text: '#FFFFFF' },
  { code: 'kuveytturk', name: 'Kuveyt Türk', domain: 'kuveytturk.com.tr', color: '#005696', text: '#FFFFFF' },
  { code: 'enpara', name: 'Enpara.com', domain: 'enpara.com', color: '#FF6200', text: '#FFFFFF' },
  { code: 'fibabanka', name: 'Fibabanka', domain: 'fibabanka.com.tr', color: '#A4292B', text: '#FFFFFF' },
  { code: 'odeabank', name: 'Odeabank', domain: 'odeabank.com.tr', color: '#003366', text: '#FFFFFF' },
  { code: 'albaraka', name: 'Albaraka Türk', domain: 'albaraka.com.tr', color: '#5B8C5A', text: '#FFFFFF' },
  { code: 'turkiyefinans', name: 'Türkiye Finans', domain: 'turkiyefinans.com.tr', color: '#0066B3', text: '#FFFFFF' },
  { code: 'aktifbank', name: 'Aktif Bank', domain: 'aktifbank.com.tr', color: '#0084CA', text: '#FFFFFF' },
  { code: 'paparam', name: 'Papara', domain: 'papara.com', color: '#FFD600', text: '#0B2447' },
  { code: 'other', name: 'Diğer', domain: '', color: '#64748B', text: '#FFFFFF' },
];

export const getBank = (code) => BANKS.find((b) => b.code === code) || BANKS[BANKS.length - 1];

export const bankLogoUrl = (code) => {
  const b = getBank(code);
  return b.domain ? `https://logo.clearbit.com/${b.domain}` : '';
};

export const getBankInitials = (nameOrCode) => {
  const b = BANKS.find((x) => x.code === nameOrCode || x.name === nameOrCode);
  if (b) return b.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  if (!nameOrCode) return 'B';
  return nameOrCode.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
};
