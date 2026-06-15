import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Briefcase, ListOrdered, FileText, User, Newspaper, LogOut, Wallet, Menu, X, ChevronDown, BarChart3, ShoppingCart } from 'lucide-react';
import { Button } from '../ui/button';
import { formatTRY } from '../../data/mock';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';

const nav = [
  { to: '/panel', label: 'Kontrol Paneli', icon: LayoutDashboard },
  { to: '/portfoyum', label: 'Portföyüm', icon: Briefcase },
  { to: '/piyasa', label: 'Piyasa', icon: BarChart3 },
  { to: '/islem', label: 'Al / Sat', icon: ShoppingCart },
  { to: '/islemler', label: 'İşlemlerim', icon: ListOrdered },
  { to: '/hesap-ozeti', label: 'Hesap Özeti', icon: FileText },
  { to: '/haberler', label: 'Haberler', icon: Newspaper },
  { to: '/profil', label: 'Profil & Ayarlar', icon: User },
];

const bottomNav = [
  { to: '/panel', label: 'Panel', icon: LayoutDashboard },
  { to: '/piyasa', label: 'Piyasa', icon: BarChart3 },
  { to: '/islem', label: 'Al/Sat', icon: ShoppingCart },
  { to: '/portfoyum', label: 'Portföy', icon: Briefcase },
  { to: '/profil', label: 'Profil', icon: User },
];

const Logo = ({ className = '' }) => (
  <Link to="/panel" className={`flex items-center gap-2 ${className}`}>
    <div className="h-9 w-9 rounded-lg fa-gradient-navy flex items-center justify-center fa-glow">
      <span className="text-white font-extrabold text-lg" style={{ fontFamily: 'Manrope' }}>F</span>
    </div>
    <div className="leading-tight">
      <div className="font-extrabold text-[#0B2447] tracking-tight text-base sm:text-lg" style={{ fontFamily: 'Manrope' }}>FonAkış</div>
      <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider">Yatırım Platformu</div>
    </div>
  </Link>
);

const DashboardLayout = () => {
  const { user, cashBalance, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/giris'); };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#0B2447] pb-20 lg:pb-0">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center gap-2 sm:gap-4">
          <button className="lg:hidden p-1.5 -ml-1" onClick={() => setOpen(!open)} aria-label="menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Logo />
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
              <Wallet size={15} className="text-emerald-600" />
              <span className="text-xs text-slate-500">Nakit</span>
              <span className="text-sm font-semibold text-emerald-700">{formatTRY(cashBalance)}</span>
            </div>
            <div className="sm:hidden flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50">
              <Wallet size={13} className="text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">{formatTRY(cashBalance)}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-slate-50 px-1.5 sm:px-2 py-1.5 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-[#0B2447] text-white flex items-center justify-center text-sm font-semibold">
                    {user?.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('') || 'K'}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium leading-4">{user?.full_name}</div>
                    <div className="text-[11px] text-slate-500 leading-4">{user?.email}</div>
                  </div>
                  <ChevronDown size={14} className="text-slate-400 hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/profil')}>
                  <User size={14} className="mr-2" /> Profil & Ayarlar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/hesap-ozeti')}>
                  <FileText size={14} className="mr-2" /> Hesap Özeti
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut size={14} className="mr-2" /> Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile slide-in menu */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <nav className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <Logo />
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-slate-100 rounded"><X size={20} /></button>
            </div>
            <div className="space-y-1">
              {nav.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} end={to === '/panel'} onClick={() => setOpen(false)}
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${isActive ? 'bg-[#0B2447] text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}>
                  <Icon size={18} /> {label}
                </NavLink>
              ))}
              <button onClick={() => { handleLogout(); setOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-red-600 hover:bg-red-50 mt-4">
                <LogOut size={18} /> Çıkış Yap
              </button>
            </div>
          </nav>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6 pb-12 flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:w-64 shrink-0">
          <nav className="space-y-1 sticky top-20">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === '/panel'}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-[#0B2447] text-white font-semibold' : 'text-slate-600 hover:bg-white hover:text-[#0B2447]'}`}>
                <Icon size={17} /> {label}
              </NavLink>
            ))}
            <Button onClick={() => navigate('/islem')} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">+ Hızlı İşlem</Button>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 fa-glow safe-pb">
        <div className="grid grid-cols-5">
          {bottomNav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/panel'}
              className={({ isActive }) => `flex flex-col items-center justify-center gap-1 py-2 px-1 text-[10px] font-medium transition-colors ${isActive ? 'text-[#0B2447]' : 'text-slate-400'}`}>
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-[#0B2447] text-white' : ''}`}>
                    <Icon size={18} />
                  </div>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;
