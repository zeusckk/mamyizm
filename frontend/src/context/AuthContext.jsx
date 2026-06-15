import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, portfolioApi, tradeApi, cashApi, txApi, marketApi, setToken, getToken } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [stocks, setStocks] = useState([]); // BIST tradable stocks
  const [ready, setReady] = useState(false);

  const refreshPortfolio = useCallback(async () => {
    try {
      const p = await portfolioApi.get();
      setHoldings(p.holdings || []);
      setCashBalance(p.cash_balance || 0);
    } catch (e) { /* ignore */ }
  }, []);

  const refreshTransactions = useCallback(async () => {
    try { setTransactions(await txApi.list()); } catch (e) { /* ignore */ }
  }, []);

  const refreshStocks = useCallback(async () => {
    try { setStocks(await marketApi.group('stocks')); } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      await refreshStocks();
      if (getToken()) {
        try {
          const { user: u } = await authApi.me();
          setUser(u);
          await refreshPortfolio();
          await refreshTransactions();
        } catch (e) { setToken(null); }
      }
      setReady(true);
    };
    bootstrap();
  }, [refreshStocks, refreshPortfolio, refreshTransactions]);

  const login = async (email, password) => {
    const { token, user: u } = await authApi.login({ email, password });
    setToken(token);
    setUser(u);
    await refreshPortfolio();
    await refreshTransactions();
    return { ok: true };
  };

  const register = async (data) => {
    const payload = {
      full_name: data.fullName || data.full_name,
      email: data.email,
      password: data.password,
      phone: data.phone || undefined,
      tckn: data.tckn || undefined,
    };
    const { token, user: u } = await authApi.register(payload);
    setToken(token);
    setUser(u);
    setHoldings([]); setTransactions([]); setCashBalance(0);
    return { ok: true };
  };

  const logout = () => { setToken(null); setUser(null); setHoldings([]); setTransactions([]); setCashBalance(0); };

  const buyStock = async (symbol, units) => {
    try {
      const r = await tradeApi.buy(symbol, units);
      setCashBalance(r.cash_balance);
      await refreshPortfolio(); await refreshTransactions();
      return { ok: true };
    } catch (e) { return { ok: false, msg: e.response?.data?.detail || 'Hata oluştu' }; }
  };

  const sellStock = async (symbol, units) => {
    try {
      const r = await tradeApi.sell(symbol, units);
      setCashBalance(r.cash_balance);
      await refreshPortfolio(); await refreshTransactions();
      return { ok: true };
    } catch (e) { return { ok: false, msg: e.response?.data?.detail || 'Hata oluştu' }; }
  };

  const depositCash = async (data) => {
    try {
      const r = await cashApi.deposit(data);
      await refreshTransactions();
      return { ok: true, ...r };
    } catch (e) { return { ok: false, msg: e.response?.data?.detail || 'Hata' }; }
  };

  const withdrawCash = async (amount) => {
    try {
      const r = await cashApi.withdraw(amount);
      setCashBalance(r.cash_balance);
      await refreshTransactions();
      return { ok: true };
    } catch (e) { return { ok: false, msg: e.response?.data?.detail || 'Hata' }; }
  };

  const updateUser = (next) => setUser(next);
  const refreshMe = useCallback(async () => {
    try {
      const { user: u } = await authApi.me();
      setUser(u);
    } catch (e) { /* ignore */ }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, ready, holdings, transactions, cashBalance, stocks,
      login, register, logout,
      buyStock, sellStock, depositCash, withdrawCash,
      refreshPortfolio, refreshTransactions, refreshStocks, refreshMe, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
