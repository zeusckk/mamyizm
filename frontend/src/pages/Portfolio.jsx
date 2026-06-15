import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatTRY, formatNum, formatPct } from '../data/mock';
import { Briefcase, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '../components/ui/button';

const COLORS = ['#0B2447', '#10B981', '#C9A66B', '#3B82F6', '#EF4444', '#8B5CF6', '#F59E0B'];

const DonutChart = ({ data, size = 180 }) => {
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
  const { holdings, cashBalance, funds } = useAuth();

  const rows = useMemo(() => holdings.map((h) => {
    const f = funds.find((x) => x.code === h.code);
    const price = f ? f.price : h.current_price;
    const value = h.units * price;
    const cost = h.units * h.avg_cost;
    return { ...h, fund: f, price, value, cost, pl: value - cost, plPct: cost ? ((value - cost) / cost) * 100 : 0 };
  }), [holdings, funds]);

  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalPl = totalValue - totalCost;
  const totalPlPct = totalCost ? (totalPl / totalCost) * 100 : 0;

  const donut = rows.map((r) => ({ label: r.code, value: r.value }));
  if (cashBalance > 0) donut.push({ label: 'Nakit', value: cashBalance });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Portföyüm</h1>
          <p className="text-slate-500 text-sm mt-1">Sahip olduğunuz tüm fonlar ve nakit pozisyon.</p>
        </div>
        <Link to="/islem"><Button className="bg-emerald-600 hover:bg-emerald-700 text-white">+ Yeni İşlem</Button></Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="fa-card fa-glow p-5">
          <div className="text-xs text-slate-500 mb-1">Toplam Değer</div>
          <div className="text-xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>{formatTRY(totalValue + cashBalance)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Fon + Nakit</div>
        </div>
        <div className="fa-card fa-glow p-5">
          <div className="text-xs text-slate-500 mb-1">Fon Değeri</div>
          <div className="text-xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>{formatTRY(totalValue)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Maliyet: {formatTRY(totalCost)}</div>
        </div>
        <div className="fa-card fa-glow p-5">
          <div className="text-xs text-slate-500 mb-1">Toplam K/Z</div>
          <div className={`text-xl font-bold ${totalPl >= 0 ? 'fa-positive' : 'fa-negative'}`} style={{ fontFamily: 'Manrope' }}>{totalPl >= 0 ? '+' : ''}{formatTRY(totalPl)}</div>
          <div className={`text-[11px] mt-1 ${totalPl >= 0 ? 'fa-positive' : 'fa-negative'}`}>{formatPct(totalPlPct)}</div>
        </div>
        <div className="fa-card fa-glow p-5">
          <div className="text-xs text-slate-500 mb-1">Nakit</div>
          <div className="text-xl font-bold text-emerald-600" style={{ fontFamily: 'Manrope' }}>{formatTRY(cashBalance)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Kullanılabilir</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="fa-card fa-glow p-6">
          <h3 className="font-bold text-[#0B2447] mb-4" style={{ fontFamily: 'Manrope' }}>Varlık Dağılımı</h3>
          {donut.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <DonutChart data={donut} />
              <div className="w-full space-y-2">
                {donut.map((d, i) => (
                  <div key={d.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-600 font-medium">{d.label}</span>
                    </div>
                    <span className="font-semibold text-[#0B2447]">{((d.value / (totalValue + cashBalance || 1)) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm">Henüz pozisyonunuz yok</div>
          )}
        </div>

        <div className="lg:col-span-2 fa-card fa-glow overflow-hidden">
          <div className="p-6 pb-3">
            <h3 className="font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Pozisyonlarım</h3>
          </div>
          <div className="overflow-x-auto fa-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <th className="text-left px-5 py-3 font-semibold">Fon</th>
                  <th className="text-right px-5 py-3 font-semibold">Pay</th>
                  <th className="text-right px-5 py-3 font-semibold">Ort. Maliyet</th>
                  <th className="text-right px-5 py-3 font-semibold">Güncel</th>
                  <th className="text-right px-5 py-3 font-semibold">Değer</th>
                  <th className="text-right px-5 py-3 font-semibold">K/Z</th>
                  <th className="text-right px-5 py-3 font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400">
                    <Briefcase size={32} className="mx-auto mb-2 text-slate-300" />
                    Henüz pozisyonunuz yok. <Link to="/fonlar" className="text-[#0B2447] font-semibold">Fonları keşfedin</Link>
                  </td></tr>
                )}
                {rows.map((r) => (
                  <tr key={r.code} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <Link to={`/fonlar/${r.code}`} className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-[#0B2447]">{r.code}</div>
                        <div>
                          <div className="font-semibold text-[#0B2447]">{r.fund?.name}</div>
                          <div className="text-[11px] text-slate-500">{r.fund?.category_label}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-right">{formatNum(r.units, 2)}</td>
                    <td className="px-5 py-4 text-right">{r.avg_cost.toFixed(4)}</td>
                    <td className="px-5 py-4 text-right font-semibold">{r.price.toFixed(4)}</td>
                    <td className="px-5 py-4 text-right font-bold text-[#0B2447]">{formatTRY(r.value)}</td>
                    <td className={`px-5 py-4 text-right font-semibold ${r.pl >= 0 ? 'fa-positive' : 'fa-negative'}`}>
                      <div className="flex items-center justify-end gap-1">
                        {r.pl >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {formatPct(r.plPct)}
                      </div>
                      <div className="text-[11px]">{r.pl >= 0 ? '+' : ''}{formatTRY(r.pl)}</div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link to={`/islem/${r.code}`} className="inline-block px-3 py-1.5 text-xs font-semibold bg-slate-100 text-[#0B2447] rounded-md hover:bg-slate-200">Sat / Al</Link>
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
