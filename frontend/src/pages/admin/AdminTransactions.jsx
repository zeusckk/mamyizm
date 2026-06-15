import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { formatTRY } from '../../data/mock';
import { Search, RefreshCw, Filter } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const typeColor = (t) => ({
  'Alım': 'bg-emerald-50 text-emerald-700',
  'Satım': 'bg-red-50 text-red-700',
  'Para Yatırma': 'bg-blue-50 text-blue-700',
  'Para Çekme': 'bg-amber-50 text-amber-700',
}[t] || 'bg-slate-100 text-slate-700');

const AdminTransactions = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminApi.transactions({ type, q: q || undefined, limit: 200 });
      setItems(r.items); setTotal(r.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [type]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Tüm İşlemler</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">{total} işlem kaydı</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw size={13} className="mr-1.5" /> Yenile</Button>
      </div>

      <div className="fa-card fa-glow p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs">Sembol ara</Label>
          <div className="relative mt-1.5">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} className="pl-9 h-10" placeholder="THYAO, AKBNK…" />
          </div>
        </div>
        <div>
          <Label className="text-xs">İşlem Türü</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-40 mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="Alım">Alım</SelectItem>
              <SelectItem value="Satım">Satım</SelectItem>
              <SelectItem value="Para Yatırma">Para Yatırma</SelectItem>
              <SelectItem value="Para Çekme">Para Çekme</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={load} className="bg-[#0B2447] hover:bg-[#173A6B] text-white">Filtrele</Button>
      </div>

      <div className="fa-card fa-glow overflow-hidden">
        <div className="overflow-x-auto fa-scrollbar">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-slate-500 text-xs uppercase">
              <th className="text-left px-4 py-3 font-semibold">Tarih</th>
              <th className="text-left px-4 py-3 font-semibold">Kullanıcı</th>
              <th className="text-left px-4 py-3 font-semibold">İşlem</th>
              <th className="text-left px-4 py-3 font-semibold">Sembol</th>
              <th className="text-right px-4 py-3 font-semibold">Lot</th>
              <th className="text-right px-4 py-3 font-semibold">Fiyat</th>
              <th className="text-right px-4 py-3 font-semibold">Toplam</th>
              <th className="text-center px-4 py-3 font-semibold">Durum</th>
            </tr></thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="text-center py-12 text-slate-400">Yükleniyor…</td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-slate-400">Kayıt yok</td></tr>}
              {!loading && items.map((t) => (
                <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-600 text-xs">{t.date}</td>
                  <td className="px-4 py-3"><div className="font-semibold text-[#0B2447]">{t.user_name}</div><div className="text-[11px] text-slate-500">{t.user_email}</div></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs rounded font-semibold ${typeColor(t.type)}`}>{t.type}</span></td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-[#0B2447]">{(t.code === '-' ? '-' : (t.code || '').replace('.IS',''))}</td>
                  <td className="px-4 py-3 text-right">{t.units ? t.units.toFixed(2) : '-'}</td>
                  <td className="px-4 py-3 text-right">{t.price ? t.price.toFixed(4) : '-'}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${t.total < 0 ? 'fa-negative' : 'text-[#0B2447]'}`}>{formatTRY(t.total)}</td>
                  <td className="px-4 py-3 text-center text-xs text-slate-600">{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTransactions;
