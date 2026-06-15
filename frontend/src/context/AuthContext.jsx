import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, portfolioApi, tradeApi, cashApi, txApi, fundsApi, setToken, getToken } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [funds, setFunds] = useState([]);
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

  const refreshFunds = useCallback(async () => {
    try { setFunds(await fundsApi.list()); } catch (e) { /* ignore */ }
  }, []);

  // bootstrap
  useEffect(() => {
    const bootstrap = async () => {
      await refreshFunds();
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
  }, [refreshFunds, refreshPortfolio, refreshTransactions]);

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

  const buyFund = async (fund, units) => {
    try {
      const r = await tradeApi.buy(fund.code, units);
      setCashBalance(r.cash_balance);
      await refreshPortfolio();
      await refreshTransactions();
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e.response?.data?.detail || 'Hata oluştu' };
    }
  };

  const sellFund = async (fund, units) => {
    try {
      const r = await tradeApi.sell(fund.code, units);
      setCashBalance(r.cash_balance);
      await refreshPortfolio();
      await refreshTransactions();
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: e.response?.data?.detail || 'Hata oluştu' };
    }
  };

  const depositCash = async (amount) => {
    try {
      const r = await cashApi.deposit(amount);
      setCashBalance(r.cash_balance);
      await refreshTransactions();
      return { ok: true };
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

  return (
    <AuthContext.Provider value={{
      user, ready, holdings, transactions, cashBalance, funds,
      login, register, logout,
      buyFund, sellFund, depositCash, withdrawCash,
      refreshPortfolio, refreshTransactions, refreshFunds, updateUser,
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
