import React, { useState } from 'react';
import { useOutlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, ShieldCheck, ListOrdered, Newspaper, BarChart2, UserCog, Settings, FileClock, LogOut, Menu, X, ChevronDown, ShieldAlert } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AnimatePresence, motion } from 'framer-motion';

const nav = [
  { to: '/admin/panel', label: 'Genel Bakış', icon: LayoutDashboard },
  { to: '/admin/kullanicilar', label: 'Kullanıcılar', icon: Users },
  { to: '/admin/kyc', label: 'KYC Onayları', icon: ShieldCheck },
  { to: '/admin/islemler', label: 'İşlemler', icon: ListOrdered },
  { to: '/admin/haberler', label: 'Haber Yönetimi', icon: Newspaper },
  { to: '/admin/raporlar', label: 'Raporlar', icon: BarChart2 },
  { to: '/admin/yoneticiler', label: 'Yöneticiler', icon: UserCog },
  { to: '/admin/ayarlar', label: 'Sistem Ayarları', icon: Settings },
  { to: '/admin/log', label: 'Audit Log', icon: FileClock },
];

const Logo = () => (
  <Link to="/admin/panel" className="flex items-center gap-2">
    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#0B2447] to-[#1B3A6B] flex items-center justify-center fa-glow">
      <ShieldAlert size={18} className="text-amber-300" />
    </div>
    <div className="leading-tight">
      <div className="font-extrabold text-[#0B2447] tracking-tight text-base sm:text-lg" style={{ fontFamily: 'Manrope' }}>FonAkış</div>
      <div className="text-[9px] sm:text-[10px] text-amber-600 uppercase tracking-wider font-bold">Admin Panel</div>
    </div>
  </Link>
);

const NavItem = ({ to, label, icon: Icon, onClick }) => (
  <NavLink to={to} onClick={onClick}>
    {({ isActive }) => (
      <motion.div
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.97 }}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative ${isActive ? 'bg-[#0B2447] text-white font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-[#0B2447]'}`}
      >
        <Icon size={16} />
        <span>{label}</span>
        {isActive && <motion.span layoutId="adminNavIndicator" className="absolute right-2 h-1.5 w-1.5 rounded-full bg-amber-400" />}
      </motion.div>
    )}
  </NavLink>
);

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/giris'); };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#0B2447]">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center gap-3">
          <button className="lg:hidden p-1.5 -ml-1 hover:bg-slate-100 rounded-lg" onClick={() => setOpen(!open)}>
            <motion.div animate={{ rotate: open ? 90 : 0 }}>{open ? <X size={22} /> : <Menu size={22} />}</motion.div>
          </button>
          <Logo />
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wide">
              <ShieldAlert size={12} /> Admin Modu
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-slate-50 px-1.5 sm:px-2 py-1.5 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-semibold">
                    {user?.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('') || 'A'}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium leading-4">{user?.full_name}</div>
                    <div className="text-[11px] text-amber-700 leading-4 font-semibold">Yönetici</div>
                  </div>
                  <ChevronDown size={14} className="text-slate-400 hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut size={14} className="mr-2" /> Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
            <motion.nav initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 260, damping: 28 }} className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6"><Logo /><button onClick={() => setOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={20} /></button></div>
              <div className="space-y-1">{nav.map(({ to, label, icon: Icon }) => <NavItem key={to} to={to} label={label} icon={Icon} onClick={() => setOpen(false)} />)}
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-red-600 hover:bg-red-50 mt-4"><LogOut size={18} /> Çıkış Yap</button>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6 pb-12 flex gap-6">
        <aside className="hidden lg:block lg:w-60 shrink-0">
          <nav className="space-y-1 sticky top-20">
            {nav.map(({ to, label, icon: Icon }) => <NavItem key={to} to={to} label={label} icon={Icon} />)}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
