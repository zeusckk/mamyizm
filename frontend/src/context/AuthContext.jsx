import React, { createContext, useContext, useEffect, useState } from 'react';
import { MOCK_USER, MOCK_HOLDINGS, MOCK_TRANSACTIONS } from '../data/mock';

const AuthContext = createContext(null);

const STORAGE_KEY = 'fonakis_session_v1';
const HOLDINGS_KEY = 'fonakis_holdings_v1';
const TX_KEY = 'fonakis_tx_v1';
const CASH_KEY = 'fonakis_cash_v1';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const sess = JSON.parse(s);
      setUser(sess.user);
      const h = JSON.parse(localStorage.getItem(HOLDINGS_KEY) || 'null') || MOCK_HOLDINGS;
      const t = JSON.parse(localStorage.getItem(TX_KEY) || 'null') || MOCK_TRANSACTIONS;
      const c = JSON.parse(localStorage.getItem(CASH_KEY) || 'null');
      setHoldings(h);
      setTransactions(t);
      setCashBalance(c === null ? MOCK_USER.cashBalance : c);
    }
    setReady(true);
  }, []);

  const persist = (next) => {
    if (next.user !== undefined) localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: next.user }));
    if (next.holdings !== undefined) localStorage.setItem(HOLDINGS_KEY, JSON.stringify(next.holdings));
    if (next.transactions !== undefined) localStorage.setItem(TX_KEY, JSON.stringify(next.transactions));
    if (next.cashBalance !== undefined) localStorage.setItem(CASH_KEY, JSON.stringify(next.cashBalance));
  };

  const login = async (email, _password) => {
    // mock login - any email/password works
    const u = { ...MOCK_USER, email: email || MOCK_USER.email };
    setUser(u);
    setHoldings(MOCK_HOLDINGS);
    setTransactions(MOCK_TRANSACTIONS);
    setCashBalance(MOCK_USER.cashBalance);
    persist({ user: u, holdings: MOCK_HOLDINGS, transactions: MOCK_TRANSACTIONS, cashBalance: MOCK_USER.cashBalance });
    return { ok: true };
  };

  const register = async ({ fullName, email }) => {
    const u = { ...MOCK_USER, fullName: fullName || MOCK_USER.fullName, email: email || MOCK_USER.email };
    setUser(u);
    setHoldings([]);
    setTransactions([]);
    setCashBalance(0);
    persist({ user: u, holdings: [], transactions: [], cashBalance: 0 });
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const addTransaction = (tx) => {
    const next = [tx, ...transactions];
    setTransactions(next);
    persist({ transactions: next });
  };

  const updateHoldings = (next) => {
    setHoldings(next);
    persist({ holdings: next });
  };

  const updateCash = (next) => {
    setCashBalance(next);
    persist({ cashBalance: next });
  };

  const buyFund = (fund, units) => {
    const cost = units * fund.price;
    if (cost > cashBalance) return { ok: false, msg: 'Yetersiz bakiye' };
    const existing = holdings.find((h) => h.code === fund.code);
    let nextHoldings;
    if (existing) {
      const totalUnits = existing.units + units;
      const newAvg = (existing.units * existing.avgCost + units * fund.price) / totalUnits;
      nextHoldings = holdings.map((h) => h.code === fund.code ? { ...h, units: totalUnits, avgCost: newAvg, currentPrice: fund.price } : h);
    } else {
      nextHoldings = [...holdings, { code: fund.code, units, avgCost: fund.price, currentPrice: fund.price }];
    }
    const tx = { id: 't_' + Date.now(), date: new Date().toLocaleString('tr-TR'), type: 'Alım', code: fund.code, units, price: fund.price, total: cost, status: 'Gerçekleşti' };
    const nextTx = [tx, ...transactions];
    const nextCash = cashBalance - cost;
    setHoldings(nextHoldings); setTransactions(nextTx); setCashBalance(nextCash);
    persist({ holdings: nextHoldings, transactions: nextTx, cashBalance: nextCash });
    return { ok: true };
  };

  const sellFund = (fund, units) => {
    const existing = holdings.find((h) => h.code === fund.code);
    if (!existing || existing.units < units) return { ok: false, msg: 'Yetersiz pay adedi' };
    const proceeds = units * fund.price;
    const remaining = existing.units - units;
    const nextHoldings = remaining <= 0.0001
      ? holdings.filter((h) => h.code !== fund.code)
      : holdings.map((h) => h.code === fund.code ? { ...h, units: remaining, currentPrice: fund.price } : h);
    const tx = { id: 't_' + Date.now(), date: new Date().toLocaleString('tr-TR'), type: 'Satım', code: fund.code, units, price: fund.price, total: proceeds, status: 'Gerçekleşti' };
    const nextTx = [tx, ...transactions];
    const nextCash = cashBalance + proceeds;
    setHoldings(nextHoldings); setTransactions(nextTx); setCashBalance(nextCash);
    persist({ holdings: nextHoldings, transactions: nextTx, cashBalance: nextCash });
    return { ok: true };
  };

  const depositCash = (amount) => {
    const next = cashBalance + amount;
    const tx = { id: 't_' + Date.now(), date: new Date().toLocaleString('tr-TR'), type: 'Para Yatırma', code: '-', units: 0, price: 0, total: amount, status: 'Gerçekleşti' };
    const nextTx = [tx, ...transactions];
    setCashBalance(next); setTransactions(nextTx);
    persist({ cashBalance: next, transactions: nextTx });
  };

  const withdrawCash = (amount) => {
    if (amount > cashBalance) return { ok: false, msg: 'Yetersiz bakiye' };
    const next = cashBalance - amount;
    const tx = { id: 't_' + Date.now(), date: new Date().toLocaleString('tr-TR'), type: 'Para Çekme', code: '-', units: 0, price: 0, total: -amount, status: 'Gerçekleşti' };
    const nextTx = [tx, ...transactions];
    setCashBalance(next); setTransactions(nextTx);
    persist({ cashBalance: next, transactions: nextTx });
    return { ok: true };
  };

  return (
    <AuthContext.Provider value={{ user, ready, holdings, transactions, cashBalance, login, register, logout, buyFund, sellFund, depositCash, withdrawCash, addTransaction, updateHoldings, updateCash }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
