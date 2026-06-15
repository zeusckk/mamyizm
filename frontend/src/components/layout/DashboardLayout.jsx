import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Briefcase, TrendingUp, ListOrdered, FileText, User, Newspaper, LogOut, Wallet, Menu, X, ChevronDown, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { formatTRY } from '../../data/mock';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';

const nav = [
  { to: '/panel', label: 'Kontrol Paneli', icon: LayoutDashboard },
  { to: '/portfoyum', label: 'Portföyüm', icon: Briefcase },
  { to: '/fonlar', label: 'Fonlar', icon: TrendingUp },
  { to: '/islemler', label: 'İşlemlerim', icon: ListOrdered },
  { to: '/hesap-ozeti', label: 'Hesap Özeti', icon: FileText },
  { to: '/haberler', label: 'Haberler', icon: Newspaper },
  { to: '/profil', label: 'Profil & Ayarlar', icon: User },
];

const Logo = ({ className = '' }) => (
  <Link to="/panel" className={`flex items-center gap-2 ${className}`}>
    <div className="h-9 w-9 rounded-lg fa-gradient-navy flex items-center justify-center fa-glow">
      <span className="text-white font-extrabold text-lg" style={{ fontFamily: 'Manrope' }}>F</span>
    </div>
    <div className="leading-tight">
      <div className="font-extrabold text-[#0B2447] tracking-tight text-lg" style={{ fontFamily: 'Manrope' }}>FonAkış</div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Yatırım Platformu</div>
    </div>
  </Link>
);

const DashboardLayout = () => {
  const { user, cashBalance, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/giris'); };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#0B2447]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 h-16 flex items-center gap-4">
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Logo />
          <div className="hidden md:flex flex-1 max-w-md relative ml-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Fon kodu veya ad ara…" className="w-full h-10 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
              <Wallet size={15} className="text-emerald-600" />
              <span className="text-xs text-slate-500">Nakit</span>
              <span className="text-sm font-semibold text-emerald-700">{formatTRY(cashBalance)}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-slate-50 px-2 py-1.5 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-[#0B2447] text-white flex items-center justify-center text-sm font-semibold">
                    {user?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('') || 'K'}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium leading-4">{user?.fullName}</div>
                    <div className="text-[11px] text-slate-500 leading-4">{user?.email}</div>
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
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

      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 pt-6 pb-12 flex gap-6">
        {/* Sidebar */}
        <aside className={`${open ? 'block fixed inset-0 z-30 bg-black/40 lg:bg-transparent' : 'hidden'} lg:block lg:static lg:w-64 shrink-0`} onClick={() => setOpen(false)}>
          <nav className="bg-white lg:bg-transparent w-64 h-full lg:h-auto p-4 lg:p-0 space-y-1" onClick={(e) => e.stopPropagation()}>
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to} to={to} end={to === '/panel'}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-[#0B2447] text-white font-semibold' : 'text-slate-600 hover:bg-white hover:text-[#0B2447]'}`}
              >
                <Icon size={17} /> {label}
              </NavLink>
            ))}
            <Button onClick={() => navigate('/islem')} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
              + Hızlı İşlem
            </Button>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
