import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatTRY, formatPct } from '../data/mock';
import Sparkline from '../components/charts/Sparkline';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, PiggyBank, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

const StatCard = ({ icon: Icon, label, value, change, positive }) => (
  <div className="fa-card fa-glow p-5">
    <div className="flex items-center justify-between mb-3">
      <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-[#0B2447]"><Icon size={18} /></div>
      {change !== undefined && (
        <div className={`text-xs font-semibold flex items-center gap-1 ${positive ? 'fa-positive' : 'fa-negative'}`}>
          {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {formatPct(change)}
        </div>
      )}
    </div>
    <div className="text-xs text-slate-500 mb-1">{label}</div>
    <div className="text-xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>{value}</div>
  </div>
);

const Dashboard = () => {
  const { user, holdings, cashBalance, funds } = useAuth();
  const navigate = useNavigate();

  const portfolioStats = useMemo(() => {
    let totalValue = 0, totalCost = 0;
    holdings.forEach((h) => { totalValue += h.units * h.current_price; totalCost += h.units * h.avg_cost; });
    const pl = totalValue - totalCost;
    const plPct = totalCost ? (pl / totalCost) * 100 : 0;
    return { totalValue, totalCost, pl, plPct };
  }, [holdings]);

  const netAssets = portfolioStats.totalValue + cashBalance;
  const topGainers = [...funds].sort((a, b) => b.change_24h - a.change_24h).slice(0, 4);
  const topLosers = [...funds].sort((a, b) => a.change_24h - b.change_24h).slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Hoş geldiniz, {user?.full_name?.split(' ')[0]}</h1>
          <p className="text-slate-500 text-sm mt-1">Portföyünüzün güncel durumuna bir göz atın.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-300" onClick={() => navigate('/fonlar')}>Fonları Keşfet</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate('/islem')}>+ Yeni İşlem</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={PiggyBank} label="Net Varlık" value={formatTRY(netAssets)} change={portfolioStats.plPct} positive={portfolioStats.pl >= 0} />
        <StatCard icon={TrendingUp} label="Portföy Değeri" value={formatTRY(portfolioStats.totalValue)} change={portfolioStats.plPct} positive={portfolioStats.pl >= 0} />
        <StatCard icon={Wallet} label="Nakit Bakiye" value={formatTRY(cashBalance)} />
        <StatCard icon={Activity} label="Toplam K/Z" value={`${portfolioStats.pl >= 0 ? '+' : ''}${formatTRY(portfolioStats.pl)}`} change={portfolioStats.plPct} positive={portfolioStats.pl >= 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 fa-card fa-glow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Portföy Performansı</h3>
              <p className="text-xs text-slate-500">Son 30 gün</p>
            </div>
            <div className="flex gap-1">
              {['1H', '1A', '3A', '1Y'].map((p, i) => (
                <button key={p} className={`px-2.5 py-1 text-xs rounded-md ${i === 1 ? 'bg-[#0B2447] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{p}</button>
              ))}
            </div>
          </div>
          {funds[0] && <Sparkline data={funds[0].series} width={800} height={180} color="#0B2447" strokeWidth={2.5} />}
        </div>

        <div className="fa-card fa-glow p-6">
          <h3 className="font-bold text-[#0B2447] mb-4" style={{ fontFamily: 'Manrope' }}>Hızlı Erişim</h3>
          <div className="space-y-2">
            {[
              { l: 'Para Yatır', to: '/hesap-ozeti' },
              { l: 'Para Çek', to: '/hesap-ozeti' },
              { l: 'Fon Al / Sat', to: '/islem' },
              { l: 'Portföyümü Gör', to: '/portfoyum' },
              { l: 'İşlem Geçmişi', to: '/islemler' },
            ].map((q) => (
              <Link key={q.l} to={q.to} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 text-sm font-medium text-[#0B2447] border border-slate-100">
                {q.l} <ArrowUpRight size={14} className="text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[{ title: 'En Çok Yükselenler', list: topGainers, positive: true }, { title: 'En Çok Düşenler', list: topLosers, positive: false }].map((b) => (
          <div key={b.title} className="fa-card fa-glow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>{b.title}</h3>
              <Link to="/fonlar" className="text-xs text-slate-500 hover:text-[#0B2447] font-medium">Tümü →</Link>
            </div>
            <div className="space-y-3">
              {b.list.map((f) => (
                <Link to={`/fonlar/${f.code}`} key={f.code} className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-[#0B2447]">{f.code}</div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#0B2447] truncate">{f.name}</div>
                      <div className="text-[11px] text-slate-500">{f.category_label}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Sparkline data={f.series} width={60} height={24} color={f.change_24h >= 0 ? '#10B981' : '#EF4444'} />
                    <div className="text-right w-20">
                      <div className="text-sm font-semibold text-[#0B2447]">{f.price.toFixed(4)}</div>
                      <div className={`text-xs font-medium ${f.change_24h >= 0 ? 'fa-positive' : 'fa-negative'}`}>{formatPct(f.change_24h)}</div>
                    </div>
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
