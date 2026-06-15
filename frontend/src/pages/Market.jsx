import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { marketApi } from '../api/client';
import { FUND_CATEGORIES, formatPct } from '../data/mock';
import Sparkline from '../components/charts/Sparkline';
import { Search, ArrowUpDown, RefreshCw, TrendingUp, BarChart3, Coins, DollarSign, Bitcoin, Briefcase } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Button } from '../components/ui/button';

const GROUPS = [
  { id: 'indices', label: 'Endeksler', icon: BarChart3, desc: 'BIST ve global piyasa endeksleri' },
  { id: 'stocks', label: 'BIST Hisseler', icon: TrendingUp, desc: 'Borsa İstanbul hisse senetleri' },
  { id: 'commodities', label: 'Emtia', icon: Coins, desc: 'Altın, gümüş, petrol ve tarım emtiaları' },
  { id: 'fx', label: 'Pariteler', icon: DollarSign, desc: 'Döviz çiftleri ve çapraz kurlar' },
  { id: 'crypto', label: 'Kripto', icon: Bitcoin, desc: 'Kripto para birimleri' },
  { id: 'funds', label: 'Fonlar', icon: Briefcase, desc: 'FonAkış yatırım fonları' },
];

const fmtCcy = (v, ccy) => {
  if (!v) return '-';
  const opts = { minimumFractionDigits: 2, maximumFractionDigits: ccy === 'TRY' ? 2 : 4 };
  try { return new Intl.NumberFormat('tr-TR', opts).format(v); } catch { return v.toFixed(4); }
};

const RiskBar = ({ level }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5,6,7].map((i) => (
      <span key={i} className={`h-1.5 w-2 rounded-sm ${i <= level ? (level >= 6 ? 'bg-red-500' : level >= 4 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200'}`} />
    ))}
  </div>
);

const MarketTable = ({ items, loading, currencyDefault = 'USD' }) => {
  const [sortBy, setSortBy] = useState('change_pct');
  const [dir, setDir] = useState('desc');
  const [q, setQ] = useState('');
  const sortCol = (col) => { if (sortBy === col) setDir(dir === 'asc' ? 'desc' : 'asc'); else { setSortBy(col); setDir('desc'); } };

  const list = useMemo(() => {
    const filtered = items.filter((x) => !q || x.name.toLowerCase().includes(q.toLowerCase()) || x.symbol.toLowerCase().includes(q.toLowerCase()));
    return [...filtered].sort((a, b) => dir === 'asc' ? (a[sortBy] || 0) - (b[sortBy] || 0) : (b[sortBy] || 0) - (a[sortBy] || 0));
  }, [items, q, sortBy, dir]);

  return (
    <div className="fa-card fa-glow overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sembol veya ad ara..." className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20" />
        </div>
        <span className="text-xs text-slate-500 ml-auto">{list.length} kayıt</span>
      </div>
      <div className="overflow-x-auto fa-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
              <th className="text-left px-5 py-3 font-semibold">Sembol</th>
              <th className="text-left px-5 py-3 font-semibold">Ad</th>
              <th className="text-left px-5 py-3 font-semibold hidden lg:table-cell">Kategori</th>
              <th className="text-right px-5 py-3 font-semibold cursor-pointer" onClick={() => sortCol('price')}><span className="inline-flex items-center gap-1">Fiyat <ArrowUpDown size={12} /></span></th>
              <th className="text-right px-5 py-3 font-semibold cursor-pointer" onClick={() => sortCol('change_pct')}><span className="inline-flex items-center gap-1">Değişim % <ArrowUpDown size={12} /></span></th>
              <th className="text-right px-5 py-3 font-semibold hidden md:table-cell">Yüksek</th>
              <th className="text-right px-5 py-3 font-semibold hidden md:table-cell">Düşük</th>
              <th className="text-right px-5 py-3 font-semibold hidden lg:table-cell">Para Birimi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="text-center py-12 text-slate-400">Gerçek zamanlı veriler yükleniyor...</td></tr>
            )}
            {!loading && list.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-slate-400">Sonuç bulunamadı</td></tr>
            )}
            {!loading && list.map((x) => {
              const positive = (x.change_pct || 0) >= 0;
              return (
                <tr key={x.symbol} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs font-bold text-[#0B2447] bg-slate-100 px-2 py-1 rounded">{x.symbol.replace('.IS','').replace('=X','').replace('-USD','')}</span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-[#0B2447]">{x.name}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs hidden lg:table-cell">{x.category}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-[#0B2447]">{fmtCcy(x.price, x.currency || currencyDefault)}</td>
                  <td className={`px-5 py-3.5 text-right font-semibold ${positive ? 'fa-positive' : 'fa-negative'}`}>{formatPct(x.change_pct)}</td>
                  <td className="px-5 py-3.5 text-right text-slate-600 hidden md:table-cell">{fmtCcy(x.high)}</td>
                  <td className="px-5 py-3.5 text-right text-slate-600 hidden md:table-cell">{fmtCcy(x.low)}</td>
                  <td className="px-5 py-3.5 text-right text-xs text-slate-500 hidden lg:table-cell">{x.currency || currencyDefault}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FundsTable = ({ funds }) => {
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState('change_24h');
  const [dir, setDir] = useState('desc');
  const sortCol = (col) => { if (sortBy === col) setDir(dir === 'asc' ? 'desc' : 'asc'); else { setSortBy(col); setDir('desc'); } };

  const list = useMemo(() => {
    let l = funds.filter((f) => (cat === 'all' || f.category === cat) && (!q || f.name.toLowerCase().includes(q.toLowerCase()) || f.code.toLowerCase().includes(q.toLowerCase())));
    return [...l].sort((a, b) => dir === 'asc' ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy]);
  }, [funds, cat, q, sortBy, dir]);

  return (
    <div className="space-y-4">
      <div className="fa-card fa-glow p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Fon kodu veya ad ara..." className="w-full h-10 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20" />
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
                <th className="text-right px-5 py-3 font-semibold cursor-pointer" onClick={() => sortCol('price')}><span className="inline-flex items-center gap-1">Fiyat <ArrowUpDown size={12} /></span></th>
                <th className="text-right px-5 py-3 font-semibold cursor-pointer" onClick={() => sortCol('change_24h')}><span className="inline-flex items-center gap-1">Günlük % <ArrowUpDown size={12} /></span></th>
                <th className="text-right px-5 py-3 font-semibold cursor-pointer" onClick={() => sortCol('change_ytd')}><span className="inline-flex items-center gap-1">YBB % <ArrowUpDown size={12} /></span></th>
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
                  <td className="px-5 py-4 text-slate-600">{f.category_label}</td>
                  <td className="px-5 py-4 text-right font-semibold text-[#0B2447]">{f.price.toFixed(4)}</td>
                  <td className={`px-5 py-4 text-right font-semibold ${f.change_24h >= 0 ? 'fa-positive' : 'fa-negative'}`}>{formatPct(f.change_24h)}</td>
                  <td className={`px-5 py-4 text-right font-semibold ${f.change_ytd >= 0 ? 'fa-positive' : 'fa-negative'}`}>{formatPct(f.change_ytd)}</td>
                  <td className="px-5 py-4"><div className="flex justify-center"><RiskBar level={f.risk} /></div></td>
                  <td className="px-5 py-4"><div className="flex justify-center"><Sparkline data={f.series} width={70} height={28} color={f.change_24h >= 0 ? '#10B981' : '#EF4444'} /></div></td>
                  <td className="px-5 py-4 text-right">
                    <Link to={`/islem/${f.code}`} className="inline-block px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100">Al / Sat</Link>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-slate-400">Sonuç bulunamadı</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Market = () => {
  const { funds } = useAuth();
  const [active, setActive] = useState('indices');
  const [data, setData] = useState({}); // {indices: [], stocks: [], ...}
  const [loading, setLoading] = useState({});
  const [refreshedAt, setRefreshedAt] = useState({});

  const fetchGroup = async (group) => {
    if (group === 'funds') return;
    setLoading((l) => ({ ...l, [group]: true }));
    try {
      const items = await marketApi.group(group);
      setData((d) => ({ ...d, [group]: items }));
      setRefreshedAt((r) => ({ ...r, [group]: new Date() }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading((l) => ({ ...l, [group]: false }));
    }
  };

  useEffect(() => {
    if (active === 'funds') return;
    if (!data[active]) fetchGroup(active);
    // auto-refresh every 90s for current tab
    const id = setInterval(() => { if (active !== 'funds') fetchGroup(active); }, 90000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const currentGroup = GROUPS.find((g) => g.id === active);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Piyasa</h1>
          <p className="text-slate-500 text-sm mt-1">{currentGroup?.desc}</p>
        </div>
        {active !== 'funds' && (
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {refreshedAt[active] && <span>Son güncelleme: {refreshedAt[active].toLocaleTimeString('tr-TR')}</span>}
            <Button variant="outline" size="sm" onClick={() => fetchGroup(active)} className="border-slate-300" disabled={loading[active]}>
              <RefreshCw size={13} className={`mr-1.5 ${loading[active] ? 'animate-spin' : ''}`} /> Yenile
            </Button>
          </div>
        )}
      </div>

      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="bg-white border border-slate-200 p-1 h-auto flex-wrap w-full justify-start gap-1">
          {GROUPS.map((g) => (
            <TabsTrigger key={g.id} value={g.id} className="data-[state=active]:bg-[#0B2447] data-[state=active]:text-white px-3 py-2">
              <g.icon size={14} className="mr-1.5" /> {g.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {GROUPS.filter((g) => g.id !== 'funds').map((g) => (
          <TabsContent key={g.id} value={g.id} className="mt-5">
            <MarketTable items={data[g.id] || []} loading={loading[g.id] && !data[g.id]} />
            <p className="text-[11px] text-slate-400 mt-3 text-center">Veriler Yahoo Finance üzerinden 15 dk gecikmeli olarak alınmaktadır. Yatırım tavsiyesi değildir.</p>
          </TabsContent>
        ))}

        <TabsContent value="funds" className="mt-5">
          <FundsTable funds={funds} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Market;
