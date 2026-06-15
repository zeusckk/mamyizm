import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { marketApi } from '../api/client';
import { formatPct } from '../data/mock';
import { Search, ArrowUpDown, RefreshCw, TrendingUp, BarChart3, Coins, DollarSign, Bitcoin } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Button } from '../components/ui/button';

const GROUPS = [
  { id: 'indices', label: 'Endeksler', mobLabel: 'Endeks', icon: BarChart3, desc: 'BIST ve global piyasa endeksleri' },
  { id: 'stocks', label: 'BIST Hisseler', mobLabel: 'Hisse', icon: TrendingUp, desc: 'Borsa İstanbul hisse senetleri' },
  { id: 'commodities', label: 'Emtia', mobLabel: 'Emtia', icon: Coins, desc: 'Altın, gümüş, petrol ve tarım emtiaları' },
  { id: 'fx', label: 'Pariteler', mobLabel: 'Parite', icon: DollarSign, desc: 'Döviz çiftleri ve çapraz kurlar' },
  { id: 'crypto', label: 'Kripto', mobLabel: 'Kripto', icon: Bitcoin, desc: 'Kripto para birimleri' },
];

const fmtNum = (v, d = 4) => {
  if (!v) return '-';
  try { return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: d }).format(v); } catch { return v.toFixed(d); }
};

const stripSymbol = (s) => s.replace('.IS', '').replace('=X', '').replace('-USD', '');

const SymbolBadge = ({ symbol, market }) => {
  const isStock = symbol.endsWith('.IS') || market === 'BIST';
  const isFx = symbol.endsWith('=X');
  const isCrypto = symbol.endsWith('-USD');
  const isIndex = symbol.startsWith('^') || ['XU100.IS','XU030.IS','XBANK.IS','XUSIN.IS','XUTEK.IS'].includes(symbol);
  const isCommodity = symbol.endsWith('=F');
  let prefix = 'MKT'; let bg = 'bg-slate-100 text-slate-700';
  if (isIndex) { prefix = 'IDX'; bg = 'bg-blue-50 text-blue-700'; }
  else if (isStock) { prefix = 'BIST'; bg = 'bg-red-50 text-red-700'; }
  else if (isFx) { prefix = 'FX'; bg = 'bg-emerald-50 text-emerald-700'; }
  else if (isCrypto) { prefix = 'CRYPTO'; bg = 'bg-amber-50 text-amber-700'; }
  else if (isCommodity) { prefix = 'EMTIA'; bg = 'bg-purple-50 text-purple-700'; }
  return (
    <div className="flex items-center gap-1.5">
      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${bg}`}>{prefix}</span>
      <span className="font-mono text-xs font-bold text-[#0B2447]">{stripSymbol(symbol)}</span>
    </div>
  );
};

const MarketTable = ({ items, loading, group, onTrade }) => {
  const [sortBy, setSortBy] = useState('change_pct');
  const [dir, setDir] = useState('desc');
  const [q, setQ] = useState('');
  const sortCol = (col) => { if (sortBy === col) setDir(dir === 'asc' ? 'desc' : 'asc'); else { setSortBy(col); setDir('desc'); } };
  const tradable = group === 'stocks';

  const list = useMemo(() => {
    const filtered = items.filter((x) => !q || x.name.toLowerCase().includes(q.toLowerCase()) || x.symbol.toLowerCase().includes(q.toLowerCase()));
    return [...filtered].sort((a, b) => dir === 'asc' ? (a[sortBy] || 0) - (b[sortBy] || 0) : (b[sortBy] || 0) - (a[sortBy] || 0));
  }, [items, q, sortBy, dir]);

  return (
    <div className="fa-card fa-glow overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sembol veya ad ara..." className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20" />
        </div>
        <span className="text-xs text-slate-500 ml-auto whitespace-nowrap">{list.length} kayıt</span>
      </div>
      <div className="overflow-x-auto fa-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
              <th className="text-left px-3 sm:px-5 py-3 font-semibold">Sembol</th>
              <th className="text-left px-3 sm:px-5 py-3 font-semibold">Ad</th>
              <th className="text-left px-5 py-3 font-semibold hidden lg:table-cell">Kategori</th>
              <th className="text-right px-3 sm:px-5 py-3 font-semibold cursor-pointer" onClick={() => sortCol('price')}><span className="inline-flex items-center gap-1">Fiyat <ArrowUpDown size={12} /></span></th>
              <th className="text-right px-3 sm:px-5 py-3 font-semibold cursor-pointer" onClick={() => sortCol('change_pct')}><span className="inline-flex items-center gap-1">% <ArrowUpDown size={12} /></span></th>
              <th className="text-right px-5 py-3 font-semibold hidden md:table-cell">Yüksek</th>
              <th className="text-right px-5 py-3 font-semibold hidden md:table-cell">Düşük</th>
              <th className="text-right px-5 py-3 font-semibold hidden lg:table-cell">PB</th>
              {tradable && <th className="text-right px-3 sm:px-5 py-3 font-semibold">İşlem</th>}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={tradable ? 9 : 8} className="text-center py-12 text-slate-400">Gerçek zamanlı veriler yükleniyor...</td></tr>}
            {!loading && list.length === 0 && <tr><td colSpan={tradable ? 9 : 8} className="text-center py-12 text-slate-400">Sonuç bulunamadı</td></tr>}
            {!loading && list.map((x) => {
              const positive = (x.change_pct || 0) >= 0;
              return (
                <tr key={x.symbol} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-3 sm:px-5 py-3.5"><SymbolBadge symbol={x.symbol} market={x.market} /></td>
                  <td className="px-3 sm:px-5 py-3.5 font-semibold text-[#0B2447]"><div className="truncate max-w-[140px] sm:max-w-none">{x.name}</div></td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs hidden lg:table-cell">{x.category}</td>
                  <td className="px-3 sm:px-5 py-3.5 text-right font-bold text-[#0B2447] whitespace-nowrap">{fmtNum(x.price)}</td>
                  <td className={`px-3 sm:px-5 py-3.5 text-right font-semibold whitespace-nowrap ${positive ? 'fa-positive' : 'fa-negative'}`}>{formatPct(x.change_pct)}</td>
                  <td className="px-5 py-3.5 text-right text-slate-600 hidden md:table-cell">{fmtNum(x.high)}</td>
                  <td className="px-5 py-3.5 text-right text-slate-600 hidden md:table-cell">{fmtNum(x.low)}</td>
                  <td className="px-5 py-3.5 text-right text-xs text-slate-500 hidden lg:table-cell">{x.currency}</td>
                  {tradable && (
                    <td className="px-3 sm:px-5 py-3.5 text-right">
                      <button onClick={() => onTrade(x.symbol)} className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 whitespace-nowrap">Al / Sat</button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Market = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState('indices');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [refreshedAt, setRefreshedAt] = useState({});

  const fetchGroup = async (group) => {
    setLoading((l) => ({ ...l, [group]: true }));
    try {
      const items = await marketApi.group(group);
      setData((d) => ({ ...d, [group]: items }));
      setRefreshedAt((r) => ({ ...r, [group]: new Date() }));
    } catch (e) { console.error(e); }
    finally { setLoading((l) => ({ ...l, [group]: false })); }
  };

  useEffect(() => {
    if (!data[active]) fetchGroup(active);
    const id = setInterval(() => fetchGroup(active), 90000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const currentGroup = GROUPS.find((g) => g.id === active);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Piyasa</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">{currentGroup?.desc}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500">
          {refreshedAt[active] && <span className="hidden sm:inline">Son: {refreshedAt[active].toLocaleTimeString('tr-TR')}</span>}
          <Button variant="outline" size="sm" onClick={() => fetchGroup(active)} className="border-slate-300" disabled={loading[active]}>
            <RefreshCw size={13} className={`mr-1.5 ${loading[active] ? 'animate-spin' : ''}`} /> Yenile
          </Button>
        </div>
      </div>

      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="bg-white border border-slate-200 p-1 h-auto w-full justify-start gap-1 overflow-x-auto fa-scrollbar">
          {GROUPS.map((g) => (
            <TabsTrigger key={g.id} value={g.id} className="data-[state=active]:bg-[#0B2447] data-[state=active]:text-white px-2.5 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap">
              <g.icon size={13} className="mr-1 sm:mr-1.5" />
              <span className="sm:hidden">{g.mobLabel}</span>
              <span className="hidden sm:inline">{g.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {GROUPS.map((g) => (
          <TabsContent key={g.id} value={g.id} className="mt-4 sm:mt-5">
            <MarketTable items={data[g.id] || []} loading={loading[g.id] && !data[g.id]} group={g.id} onTrade={(sym) => navigate(`/islem/${encodeURIComponent(sym)}`)} />
            <p className="text-[11px] text-slate-400 mt-3 text-center px-3">Veriler Yahoo Finance üzerinden 15 dk gecikmeli olarak alınmaktadır. Yatırım tavsiyesi değildir.</p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Market;
export { SymbolBadge, stripSymbol };
