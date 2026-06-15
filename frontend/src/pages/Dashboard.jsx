import React, { useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatTRY, formatPct, formatNum } from '../data/mock';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, PiggyBank, Activity, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { SymbolBadge } from './Market';

const StatCard = ({ icon: Icon, label, value, change, positive }) => (
  <div className="fa-card fa-glow p-4 sm:p-5">
    <div className="flex items-center justify-between mb-3">
      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-slate-100 flex items-center justify-center text-[#0B2447]"><Icon size={16} /></div>
      {change !== undefined && (
        <div className={`text-[11px] sm:text-xs font-semibold flex items-center gap-1 ${positive ? 'fa-positive' : 'fa-negative'}`}>
          {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />} {formatPct(change)}
        </div>
      )}
    </div>
    <div className="text-[11px] sm:text-xs text-slate-500 mb-1">{label}</div>
    <div className="text-lg sm:text-xl font-bold text-[#0B2447] truncate" style={{ fontFamily: 'Manrope' }}>{value}</div>
  </div>
);

const Dashboard = () => {
  const { user, holdings, cashBalance, stocks, refreshStocks } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { const id = setInterval(() => refreshStocks(), 90000); return () => clearInterval(id); }, [refreshStocks]);

  const portfolioStats = useMemo(() => {
    let totalValue = 0, totalCost = 0;
    holdings.forEach((h) => {
      const live = stocks.find((s) => s.symbol === h.code);
      const price = live?.price || h.current_price || h.avg_cost;
      totalValue += h.units * price; totalCost += h.units * h.avg_cost;
    });
    const pl = totalValue - totalCost;
    return { totalValue, totalCost, pl, plPct: totalCost ? (pl / totalCost) * 100 : 0 };
  }, [holdings, stocks]);

  const netAssets = portfolioStats.totalValue + cashBalance;
  const topGainers = [...stocks].filter((s) => s.price > 0).sort((a, b) => b.change_pct - a.change_pct).slice(0, 4);
  const topLosers = [...stocks].filter((s) => s.price > 0).sort((a, b) => a.change_pct - b.change_pct).slice(0, 4);
  const kycOk = user?.kyc_status === 'approved';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Hoş geldiniz, {user?.full_name?.split(' ')[0]}</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Portföyünüzün güncel durumuna bir göz atın.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-slate-300" onClick={() => navigate('/piyasa')}>Piyasayı Keşfet</Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate('/islem')}>+ Yeni İşlem</Button>
        </div>
      </div>

      {!kycOk && (
        <div className="fa-card fa-glow p-4 border-l-4 border-l-amber-500 bg-amber-50/40 flex items-start gap-3">
          <ShieldAlert className="text-amber-600 shrink-0" size={20} />
          <div className="flex-1">
            <div className="font-semibold text-amber-900 text-sm">Kimlik Doğrulaması (KYC) Bekliyor</div>
            <div className="text-xs text-amber-800 mt-0.5">İşlem yapabilmek için profil sayfasından selfie ve kimlik belgesi yüklemeniz gerekiyor.</div>
          </div>
          <Button size="sm" onClick={() => navigate('/profil')} className="bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap">Tamamla →</Button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={PiggyBank} label="Net Varlık" value={formatTRY(netAssets)} change={portfolioStats.plPct} positive={portfolioStats.pl >= 0} />
        <StatCard icon={TrendingUp} label="Hisse Değeri" value={formatTRY(portfolioStats.totalValue)} change={portfolioStats.plPct} positive={portfolioStats.pl >= 0} />
        <StatCard icon={Wallet} label="Nakit Bakiye" value={formatTRY(cashBalance)} />
        <StatCard icon={Activity} label="Toplam K/Z" value={`${portfolioStats.pl >= 0 ? '+' : ''}${formatTRY(portfolioStats.pl)}`} change={portfolioStats.plPct} positive={portfolioStats.pl >= 0} />
      </div>

      <div className="fa-card fa-glow p-4 sm:p-6">
        <h3 className="font-bold text-[#0B2447] mb-4 text-sm sm:text-base" style={{ fontFamily: 'Manrope' }}>Hızlı Erişim</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { l: 'Para Yatır', to: '/hesap-ozeti', c: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
            { l: 'Hisse Al/Sat', to: '/islem', c: 'bg-[#0B2447] text-white hover:bg-[#173A6B]' },
            { l: 'Portföyüm', to: '/portfoyum', c: 'bg-slate-100 text-[#0B2447] hover:bg-slate-200' },
            { l: 'Piyasa', to: '/piyasa', c: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
          ].map((q) => (
            <Link key={q.l} to={q.to} className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${q.c}`}>
              {q.l} <ArrowUpRight size={13} />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {[{ title: 'En Çok Yükselen BIST Hisseler', list: topGainers }, { title: 'En Çok Düşen BIST Hisseler', list: topLosers }].map((b) => (
          <div key={b.title} className="fa-card fa-glow p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-bold text-[#0B2447] text-sm sm:text-base" style={{ fontFamily: 'Manrope' }}>{b.title}</h3>
              <Link to="/piyasa" className="text-xs text-slate-500 hover:text-[#0B2447] font-medium">Tümü →</Link>
            </div>
            <div className="space-y-2">
              {b.list.length === 0 && <div className="text-center text-slate-400 text-sm py-6">Veriler yükleniyor...</div>}
              {b.list.map((f) => (
                <Link to={`/islem/${encodeURIComponent(f.symbol)}`} key={f.symbol} className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <SymbolBadge symbol={f.symbol} market="BIST" />
                      <div className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">{f.name}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-[#0B2447]">{formatNum(f.price, 4)}</div>
                    <div className={`text-xs font-medium ${f.change_pct >= 0 ? 'fa-positive' : 'fa-negative'}`}>{formatPct(f.change_pct)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
