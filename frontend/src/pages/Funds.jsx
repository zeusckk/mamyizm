import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FUNDS, FUND_CATEGORIES, formatPct } from '../data/mock';
import Sparkline from '../components/charts/Sparkline';
import { Search, ArrowUpDown } from 'lucide-react';

const RiskBar = ({ level }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5,6,7].map((i) => (
      <span key={i} className={`h-1.5 w-2 rounded-sm ${i <= level ? (level >= 6 ? 'bg-red-500' : level >= 4 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200'}`} />
    ))}
  </div>
);

const Funds = () => {
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState('change24h');
  const [dir, setDir] = useState('desc');

  const list = useMemo(() => {
    let l = FUNDS.filter((f) => (cat === 'all' || f.category === cat) && (!q || f.name.toLowerCase().includes(q.toLowerCase()) || f.code.toLowerCase().includes(q.toLowerCase())));
    l = [...l].sort((a, b) => dir === 'asc' ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy]);
    return l;
  }, [cat, q, sortBy, dir]);

  const sortCol = (col) => {
    if (sortBy === col) setDir(dir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setDir('desc'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Yatırım Fonları</h1>
        <p className="text-slate-500 text-sm mt-1">Kategoriye göre filtreleyin, karşılaştırın ve işlem yapın.</p>
      </div>

      <div className="fa-card fa-glow p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Fon kodu veya ad ara…" className="w-full h-10 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FUND_CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setCat(c.id)} className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${cat === c.id ? 'bg-[#0B2447] text-white border-[#0B2447]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#0B2447]'}`}>{c.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="fa-card fa-glow overflow-hidden">
        <div className="overflow-x-auto fa-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                <th className="text-left px-5 py-3 font-semibold">Fon</th>
                <th className="text-left px-5 py-3 font-semibold">Kategori</th>
                <th className="text-right px-5 py-3 font-semibold"><button onClick={() => sortCol('price')} className="inline-flex items-center gap-1">Fiyat <ArrowUpDown size={12} /></button></th>
                <th className="text-right px-5 py-3 font-semibold"><button onClick={() => sortCol('change24h')} className="inline-flex items-center gap-1">Günlük % <ArrowUpDown size={12} /></button></th>
                <th className="text-right px-5 py-3 font-semibold"><button onClick={() => sortCol('changeYtd')} className="inline-flex items-center gap-1">YBB % <ArrowUpDown size={12} /></button></th>
                <th className="text-center px-5 py-3 font-semibold">Risk</th>
                <th className="text-center px-5 py-3 font-semibold">30G</th>
                <th className="text-right px-5 py-3 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.code} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <Link to={`/fonlar/${f.code}`} className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-[#0B2447]">{f.code}</div>
                      <div>
                        <div className="font-semibold text-[#0B2447]">{f.name}</div>
                        <div className="text-[11px] text-slate-500">{f.code}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{f.categoryLabel}</td>
                  <td className="px-5 py-4 text-right font-semibold text-[#0B2447]">{f.price.toFixed(4)}</td>
                  <td className={`px-5 py-4 text-right font-semibold ${f.change24h >= 0 ? 'fa-positive' : 'fa-negative'}`}>{formatPct(f.change24h)}</td>
                  <td className={`px-5 py-4 text-right font-semibold ${f.changeYtd >= 0 ? 'fa-positive' : 'fa-negative'}`}>{formatPct(f.changeYtd)}</td>
                  <td className="px-5 py-4"><div className="flex justify-center"><RiskBar level={f.risk} /></div></td>
                  <td className="px-5 py-4"><div className="flex justify-center"><Sparkline data={f.series} width={70} height={28} color={f.change24h >= 0 ? '#10B981' : '#EF4444'} /></div></td>
                  <td className="px-5 py-4 text-right">
                    <Link to={`/islem/${f.code}`} className="inline-block px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100">Al / Sat</Link>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">Sonuç bulunamadı</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Funds;
