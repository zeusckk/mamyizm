import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatTRY, formatNum } from '../data/mock';
import { Download, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { SymbolBadge } from './Market';

const typeColor = (t) => {
  if (t === 'Alım') return 'bg-emerald-50 text-emerald-700';
  if (t === 'Satım') return 'bg-red-50 text-red-700';
  if (t === 'Para Yatırma') return 'bg-blue-50 text-blue-700';
  if (t === 'Para Çekme') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-700';
};

const Transactions = () => {
  const { transactions } = useAuth();
  const [filter, setFilter] = useState('all');
  const [status, setStatus] = useState('all');

  const list = useMemo(() => transactions.filter((t) =>
    (filter === 'all' || t.type === filter) && (status === 'all' || t.status === status)
  ), [transactions, filter, status]);

  const exportCSV = () => {
    const headers = ['Tarih', 'Tür', 'Fon', 'Pay', 'Fiyat', 'Toplam', 'Durum'];
    const rows = list.map((t) => [t.date, t.type, t.code, t.units, t.price, t.total, t.status]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'islemler.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>İşlemlerim</h1>
          <p className="text-slate-500 text-sm mt-1">Tüm alım/satım ve nakit işlemlerinizin geçmişi.</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="border-slate-300"><Download size={14} className="mr-2" /> CSV İndir</Button>
      </div>

      <div className="fa-card fa-glow p-4 flex flex-wrap gap-3 items-center">
        <Filter size={16} className="text-slate-400" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44 h-9"><SelectValue placeholder="İşlem türü" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm işlemler</SelectItem>
            <SelectItem value="Alım">Alım</SelectItem>
            <SelectItem value="Satım">Satım</SelectItem>
            <SelectItem value="Para Yatırma">Para Yatırma</SelectItem>
            <SelectItem value="Para Çekme">Para Çekme</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Durum" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm durumlar</SelectItem>
            <SelectItem value="Gerçekleşti">Gerçekleşti</SelectItem>
            <SelectItem value="İptal">İptal</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-slate-500">{list.length} kayıt</div>
      </div>

      <div className="fa-card fa-glow overflow-hidden">
        <div className="overflow-x-auto fa-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                <th className="text-left px-5 py-3 font-semibold">Tarih</th>
                <th className="text-left px-5 py-3 font-semibold">İşlem</th>
                <th className="text-left px-5 py-3 font-semibold">Fon</th>
                <th className="text-right px-5 py-3 font-semibold">Pay</th>
                <th className="text-right px-5 py-3 font-semibold">Fiyat</th>
                <th className="text-right px-5 py-3 font-semibold">Toplam</th>
                <th className="text-center px-5 py-3 font-semibold">Durum</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-slate-400">Kayıt bulunamadı</td></tr>}
              {list.map((t) => (
                <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 text-slate-600">{t.date}</td>
                  <td className="px-5 py-3.5"><span className={`px-2 py-1 rounded-md text-xs font-semibold ${typeColor(t.type)}`}>{t.type}</span></td>
                  <td className="px-5 py-3.5 font-semibold text-[#0B2447]">{t.code === '-' ? '-' : <SymbolBadge symbol={t.code} market="BIST" />}</td>
                  <td className="px-5 py-3.5 text-right">{t.units ? formatNum(t.units, 2) : '-'}</td>
                  <td className="px-5 py-3.5 text-right">{t.price ? t.price.toFixed(4) : '-'}</td>
                  <td className={`px-5 py-3.5 text-right font-semibold ${t.total < 0 ? 'fa-negative' : 'text-[#0B2447]'}`}>{formatTRY(t.total)}</td>
                  <td className="px-5 py-3.5 text-center"><span className={`px-2 py-1 rounded-md text-xs font-medium ${t.status === 'Gerçekleşti' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
