import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatTRY, formatNum, formatPct } from '../data/mock';
import { Briefcase, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { SymbolBadge, stripSymbol } from './Market';

const COLORS = ['#0B2447', '#10B981', '#C9A66B', '#3B82F6', '#EF4444', '#8B5CF6', '#F59E0B', '#EC4899'];

const DonutChart = ({ data, size = 160 }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cum = 0;
  const r = size / 2 - 12;
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => {
        const start = (cum / total) * Math.PI * 2 - Math.PI / 2;
        cum += d.value;
        const end = (cum / total) * Math.PI * 2 - Math.PI / 2;
        const large = end - start > Math.PI ? 1 : 0;
        const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
        return <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`} fill={COLORS[i % COLORS.length]} />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.6} fill="#fff" />
    </svg>
  );
};

const Portfolio = () => {
  const { holdings, cashBalance, refreshPortfolio, stocks } = useAuth();

  // Refresh portfolio every 60s for live prices
  useEffect(() => { const id = setInterval(() => refreshPortfolio(), 60000); return () => clearInterval(id); }, [refreshPortfolio]);

  const rows = useMemo(() => holdings.map((h) => {
    // join with latest live stock price if available
    const live = stocks.find((s) => s.symbol === h.code);
    const price = live?.price || h.current_price || h.avg_cost;
    const value = h.units * price;
    const cost = h.units * h.avg_cost;
    return { ...h, livePrice: price, value, cost, pl: value - cost, plPct: cost ? ((value - cost) / cost) * 100 : 0 };
  }), [holdings, stocks]);

  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalPl = totalValue - totalCost;
  const totalPlPct = totalCost ? (totalPl / totalCost) * 100 : 0;

  const donut = rows.map((r) => ({ label: stripSymbol(r.code), value: r.value }));
  if (cashBalance > 0) donut.push({ label: 'Nakit', value: cashBalance });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Portföyüm</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Hisse pozisyonlarınız ve nakit (canlı fiyat).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshPortfolio} className="border-slate-300"><RefreshCw size={13} className="mr-1" /> <span className="hidden sm:inline">Yenile</span></Button>
          <Link to="/islem"><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">+ <span className="hidden sm:inline ml-1">Yeni</span> İşlem</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { l: 'Toplam Değer', v: formatTRY(totalValue + cashBalance), s: 'Hisse + Nakit', c: 'text-[#0B2447]' },
          { l: 'Hisse Değeri', v: formatTRY(totalValue), s: `Maliyet: ${formatTRY(totalCost)}`, c: 'text-[#0B2447]' },
          { l: 'Toplam K/Z', v: `${totalPl >= 0 ? '+' : ''}${formatTRY(totalPl)}`, s: formatPct(totalPlPct), c: totalPl >= 0 ? 'fa-positive' : 'fa-negative' },
          { l: 'Nakit', v: formatTRY(cashBalance), s: 'Kullanılabilir', c: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.l} className="fa-card fa-glow p-4 sm:p-5">
            <div className="text-[11px] sm:text-xs text-slate-500 mb-1">{s.l}</div>
            <div className={`text-lg sm:text-xl font-bold ${s.c} truncate`} style={{ fontFamily: 'Manrope' }}>{s.v}</div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">{s.s}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="fa-card fa-glow p-4 sm:p-6">
          <h3 className="font-bold text-[#0B2447] mb-4 text-sm sm:text-base" style={{ fontFamily: 'Manrope' }}>Varlık Dağılımı</h3>
          {donut.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <DonutChart data={donut} />
              <div className="w-full space-y-2">
                {donut.map((d, i) => (
                  <div key={d.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600 font-medium truncate">{d.label}</span>
                    </div>
                    <span className="font-semibold text-[#0B2447] shrink-0">{((d.value / (totalValue + cashBalance || 1)) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm">Henüz pozisyonunuz yok</div>
          )}
        </div>

        <div className="lg:col-span-2 fa-card fa-glow overflow-hidden">
          <div className="p-4 sm:p-6 pb-3">
            <h3 className="font-bold text-[#0B2447] text-sm sm:text-base" style={{ fontFamily: 'Manrope' }}>Pozisyonlarım</h3>
          </div>
          <div className="overflow-x-auto fa-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <th className="text-left px-3 sm:px-5 py-3 font-semibold">Hisse</th>
                  <th className="text-right px-3 sm:px-5 py-3 font-semibold">Lot</th>
                  <th className="text-right px-5 py-3 font-semibold hidden sm:table-cell">Ort. Maliyet</th>
                  <th className="text-right px-3 sm:px-5 py-3 font-semibold">Güncel</th>
                  <th className="text-right px-3 sm:px-5 py-3 font-semibold">Değer</th>
                  <th className="text-right px-3 sm:px-5 py-3 font-semibold">K/Z</th>
                  <th className="text-right px-3 sm:px-5 py-3 font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400 px-4">
                    <Briefcase size={32} className="mx-auto mb-2 text-slate-300" />
                    Henüz pozisyonunuz yok. <Link to="/piyasa" className="text-[#0B2447] font-semibold">Hisseleri keşfedin</Link>
                  </td></tr>
                )}
                {rows.map((r) => (
                  <tr key={r.code} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-3 sm:px-5 py-3 sm:py-4">
                      <SymbolBadge symbol={r.code} market="BIST" />
                      <div className="text-[11px] text-slate-500 mt-1 truncate max-w-[120px] sm:max-w-none">{r.name}</div>
                    </td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-right">{formatNum(r.units, 2)}</td>
                    <td className="px-5 py-3 sm:py-4 text-right hidden sm:table-cell">{r.avg_cost.toFixed(4)}</td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-right font-semibold">{r.livePrice ? r.livePrice.toFixed(4) : '...'}</td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-right font-bold text-[#0B2447] whitespace-nowrap">{formatTRY(r.value)}</td>
                    <td className={`px-3 sm:px-5 py-3 sm:py-4 text-right font-semibold ${r.pl >= 0 ? 'fa-positive' : 'fa-negative'} whitespace-nowrap`}>
                      <div className="flex items-center justify-end gap-1">{r.pl >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{formatPct(r.plPct)}</div>
                      <div className="text-[10px] sm:text-[11px]">{r.pl >= 0 ? '+' : ''}{formatTRY(r.pl)}</div>
                    </td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-right">
                      <Link to={`/islem/${encodeURIComponent(r.code)}`} className="inline-block px-2.5 py-1 text-xs font-semibold bg-slate-100 text-[#0B2447] rounded-md hover:bg-slate-200 whitespace-nowrap">Sat / Al</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
