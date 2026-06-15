import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';

import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Funds from './pages/Funds';
import Market from './pages/Market';
import FundDetail from './pages/FundDetail';
import Trade from './pages/Trade';
import Portfolio from './pages/Portfolio';
import Transactions from './pages/Transactions';
import AccountSummary from './pages/AccountSummary';
import Profile from './pages/Profile';
import News from './pages/News';

const PrivateRoute = () => {
  const { user, ready } = useAuth();
  if (!ready) return <div className="min-h-screen flex items-center justify-center text-slate-400">Yükleniyor…</div>;
  if (!user) return <Navigate to="/giris" replace />;
  return <Outlet />;
};

const PublicRoute = () => {
  const { user, ready } = useAuth();
  if (!ready) return <div className="min-h-screen flex items-center justify-center text-slate-400">Yükleniyor…</div>;
  if (user) return <Navigate to="/panel" replace />;
  return <Outlet />;
};

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/giris" element={<Login />} />
              <Route path="/kayit" element={<Register />} />
            </Route>
            <Route element={<PrivateRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/panel" element={<Dashboard />} />
                <Route path="/piyasa" element={<Market />} />
                <Route path="/fonlar" element={<Funds />} />
                <Route path="/fonlar/:code" element={<FundDetail />} />
                <Route path="/islem/:code?" element={<Trade />} />
                <Route path="/portfoyum" element={<Portfolio />} />
                <Route path="/islemler" element={<Transactions />} />
                <Route path="/hesap-ozeti" element={<AccountSummary />} />
                <Route path="/profil" element={<Profile />} />
                <Route path="/haberler" element={<News />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/panel" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </div>
  );
}

export default App;
