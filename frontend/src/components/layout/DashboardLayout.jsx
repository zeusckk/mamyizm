import React, { useState } from 'react';
import { useOutlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Briefcase, ListOrdered, FileText, User, Newspaper, LogOut, Wallet, Menu, X, ChevronDown, BarChart3, ShoppingCart } from 'lucide-react';
import { Button } from '../ui/button';
import { formatTRY } from '../../data/mock';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AnimatePresence, motion } from 'framer-motion';

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
    <motion.div
      whileHover={{ rotate: 6, scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className="h-9 w-9 rounded-lg fa-gradient-navy flex items-center justify-center fa-glow"
    >
      <span className="text-white font-extrabold text-lg" style={{ fontFamily: 'Manrope' }}>F</span>
    </motion.div>
    <div className="leading-tight">
      <div className="font-extrabold text-[#0B2447] tracking-tight text-base sm:text-lg" style={{ fontFamily: 'Manrope' }}>FonAkış</div>
      <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider">Yatırım Platformu</div>
    </div>
  </Link>
);

const NavItem = ({ to, label, icon: Icon, onClick, mobile = false }) => (
  <NavLink to={to} end={to === '/panel'} onClick={onClick}>
    {({ isActive }) => (
      <motion.div
        whileHover={{ x: mobile ? 0 : 3 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`flex items-center gap-3 px-3 ${mobile ? 'py-3' : 'py-2.5'} rounded-lg text-sm transition-colors relative ${isActive ? 'bg-[#0B2447] text-white font-semibold' : 'text-slate-600 hover:bg-white hover:text-[#0B2447]'}`}
      >
        <Icon size={mobile ? 18 : 17} />
        <span>{label}</span>
        {isActive && (
          <motion.span
            layoutId="navIndicator"
            className="absolute right-2 h-1.5 w-1.5 rounded-full bg-emerald-400"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}
      </motion.div>
    )}
  </NavLink>
);

const BottomNavItem = ({ to, label, icon: Icon }) => (
  <NavLink to={to} end={to === '/panel'} className="flex flex-col items-center justify-center gap-0.5 py-2 px-1 text-[10px] font-medium relative">
    {({ isActive }) => (
      <>
        <motion.div
          animate={{ scale: isActive ? 1 : 0.9, y: isActive ? -2 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className={`p-1.5 rounded-lg ${isActive ? 'bg-[#0B2447] text-white shadow-lg shadow-[#0B2447]/20' : 'text-slate-400'}`}
        >
          <Icon size={18} />
        </motion.div>
        <span className={isActive ? 'text-[#0B2447] font-semibold' : 'text-slate-400'}>{label}</span>
        {isActive && (
          <motion.span
            layoutId="bottomIndicator"
            className="absolute -top-px h-0.5 w-8 rounded-full bg-emerald-400"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
      </>
    )}
  </NavLink>
);

const DashboardLayout = () => {
  const { user, cashBalance, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/giris'); };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#0B2447] pb-20 lg:pb-0">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center gap-2 sm:gap-4">
          <button className="lg:hidden p-1.5 -ml-1 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setOpen(!open)} aria-label="menu">
            <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
              {open ? <X size={22} /> : <Menu size={22} />}
            </motion.div>
          </button>
          <Logo />
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <motion.div
              key={cashBalance}
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100"
            >
              <Wallet size={15} className="text-emerald-600" />
              <span className="text-xs text-slate-500">Nakit</span>
              <span className="text-sm font-semibold text-emerald-700">{formatTRY(cashBalance)}</span>
            </motion.div>
            <motion.div
              key={`m-${cashBalance}`}
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="sm:hidden flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50"
            >
              <Wallet size={13} className="text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">{formatTRY(cashBalance)}</span>
            </motion.div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-slate-50 px-1.5 sm:px-2 py-1.5 rounded-lg transition-colors">
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

      {/* Mobile slide-in menu with animations */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl p-4 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <Logo />
                <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } } }}
                className="space-y-1"
              >
                {nav.map(({ to, label, icon: Icon }) => (
                  <motion.div
                    key={to}
                    variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }}
                    transition={{ duration: 0.25 }}
                  >
                    <NavItem to={to} label={label} icon={Icon} onClick={() => setOpen(false)} mobile />
                  </motion.div>
                ))}
                <motion.button
                  variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { handleLogout(); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-red-600 hover:bg-red-50 mt-4"
                >
                  <LogOut size={18} /> Çıkış Yap
                </motion.button>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 pt-4 sm:pt-6 pb-12 flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:w-64 shrink-0">
          <nav className="space-y-1 sticky top-20">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavItem key={to} to={to} label={label} icon={Icon} />
            ))}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={() => navigate('/islem')} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">+ Hızlı İşlem</Button>
            </motion.div>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <motion.nav
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.1 }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 fa-glow safe-pb"
      >
        <div className="grid grid-cols-5">
          {bottomNav.map((b) => <BottomNavItem key={b.to} {...b} />)}
        </div>
      </motion.nav>
    </div>
  );
};

export default DashboardLayout;
