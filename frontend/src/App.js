import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from './components/ui/sonner';

import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import Trade from './pages/Trade';
import Portfolio from './pages/Portfolio';
import Transactions from './pages/Transactions';
import AccountSummary from './pages/AccountSummary';
import Profile from './pages/Profile';
import News from './pages/News';

// Admin
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminKyc from './pages/admin/AdminKyc';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminNews from './pages/admin/AdminNews';
import AdminReports from './pages/admin/AdminReports';
import AdminAdmins from './pages/admin/AdminAdmins';
import AdminSettings from './pages/admin/AdminSettings';
import AdminAuditLog from './pages/admin/AdminAuditLog';
import AdminPaymentMethods from './pages/admin/AdminPaymentMethods';
import AdminDepositRequests from './pages/admin/AdminDepositRequests';
import AdminUserDetail from './pages/admin/AdminUserDetail';

const Loading = () => <div className="min-h-screen flex items-center justify-center text-slate-400">Yükleniyor…</div>;

const PrivateRoute = ({ requireAdmin = false }) => {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/giris" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/panel" replace />;
  // If user is admin but tries to access user routes, redirect to admin
  if (!requireAdmin && user.role === 'admin') return <Navigate to="/admin/panel" replace />;
  return <Outlet />;
};

const PublicRoute = () => {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin/panel' : '/panel'} replace />;
  return <Outlet />;
};

function App() {
  return (
    <div className="App">
      <ThemeProvider>
        <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/giris" element={<Login />} />
              <Route path="/kayit" element={<Register />} />
            </Route>

            {/* User routes */}
            <Route element={<PrivateRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/panel" element={<Dashboard />} />
                <Route path="/piyasa" element={<Market />} />
                <Route path="/islem/:symbol?" element={<Trade />} />
                <Route path="/portfoyum" element={<Portfolio />} />
                <Route path="/islemler" element={<Transactions />} />
                <Route path="/hesap-ozeti" element={<AccountSummary />} />
                <Route path="/profil" element={<Profile />} />
                <Route path="/haberler" element={<News />} />
              </Route>
            </Route>

            {/* Admin routes */}
            <Route element={<PrivateRoute requireAdmin />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/panel" element={<AdminDashboard />} />
                <Route path="/admin/kullanicilar" element={<AdminUsers />} />
                <Route path="/admin/kullanicilar/:id" element={<AdminUserDetail />} />
                <Route path="/admin/kyc" element={<AdminKyc />} />
                <Route path="/admin/islemler" element={<AdminTransactions />} />
                <Route path="/admin/yatirim-talepleri" element={<AdminDepositRequests />} />
                <Route path="/admin/odeme-yontemleri" element={<AdminPaymentMethods />} />
                <Route path="/admin/haberler" element={<AdminNews />} />
                <Route path="/admin/raporlar" element={<AdminReports />} />
                <Route path="/admin/yoneticiler" element={<AdminAdmins />} />
                <Route path="/admin/ayarlar" element={<AdminSettings />} />
                <Route path="/admin/log" element={<AdminAuditLog />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/panel" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
