import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { formatTRY } from '../../data/mock';
import { RefreshCw, TrendingUp, Users, PieChart } from 'lucide-react';
import { Button } from '../../components/ui/button';

const AdminReports = () => {
  const [stocks, setStocks] = useState([]);
  const [users, setUsers] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, u, h] = await Promise.all([adminApi.topStocks(), adminApi.topUsers(), adminApi.holdingsDist()]);
      setStocks(s); setUsers(u); setHoldings(h);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Raporlar</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Platform geneli istatistikler ve sıralamalar.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw size={13} className="mr-1.5" /> Yenile</Button>
      </div>

      {loading && <div className="fa-card fa-glow p-8 text-center text-slate-400">Yükleniyor…</div>}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="fa-card fa-glow p-5">
            <h3 className="font-bold text-[#0B2447] mb-4 flex items-center gap-2" style={{ fontFamily: 'Manrope' }}><TrendingUp size={16} /> En Çok İşlem Gören Hisseler</h3>
            {stocks.length === 0 ? <p className="text-sm text-slate-400 py-4 text-center">Veri yok</p> : (
              <table className="w-full text-sm">
                <thead><tr className="text-slate-500 text-xs uppercase border-b border-slate-100">
                  <th className="text-left py-2">Sembol</th><th className="text-right py-2">İşlem</th><th className="text-right py-2">Hacim</th>
                </tr></thead>
                <tbody>{stocks.map((s) => (
                  <tr key={s.symbol} className="border-b border-slate-50">
                    <td className="py-2.5 font-mono font-bold text-[#0B2447]">{(s.symbol || '-').replace('.IS','')}</td>
                    <td className="py-2.5 text-right">{s.tx_count}</td>
                    <td className="py-2.5 text-right font-semibold">{formatTRY(s.volume)}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>

          <div className="fa-card fa-glow p-5">
            <h3 className="font-bold text-[#0B2447] mb-4 flex items-center gap-2" style={{ fontFamily: 'Manrope' }}><Users size={16} /> En Aktif Kullanıcılar</h3>
            {users.length === 0 ? <p className="text-sm text-slate-400 py-4 text-center">Veri yok</p> : (
              <table className="w-full text-sm">
                <thead><tr className="text-slate-500 text-xs uppercase border-b border-slate-100">
                  <th className="text-left py-2">Kullanıcı</th><th className="text-right py-2">İşlem</th><th className="text-right py-2">Hacim</th>
                </tr></thead>
                <tbody>{users.map((u) => (
                  <tr key={u.user_id} className="border-b border-slate-50">
                    <td className="py-2.5"><div className="font-semibold text-[#0B2447] text-xs">{u.full_name}</div><div className="text-[10px] text-slate-500">{u.email}</div></td>
                    <td className="py-2.5 text-right">{u.tx_count}</td>
                    <td className="py-2.5 text-right font-semibold">{formatTRY(u.volume)}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>

          <div className="lg:col-span-2 fa-card fa-glow p-5">
            <h3 className="font-bold text-[#0B2447] mb-4 flex items-center gap-2" style={{ fontFamily: 'Manrope' }}><PieChart size={16} /> Sembol Bazlı Pozisyon Dağılımı</h3>
            {holdings.length === 0 ? <p className="text-sm text-slate-400 py-4 text-center">Veri yok</p> : (
              <table className="w-full text-sm">
                <thead><tr className="text-slate-500 text-xs uppercase border-b border-slate-100">
                  <th className="text-left py-2">Sembol</th><th className="text-right py-2">Kullanıcı Sayısı</th><th className="text-right py-2">Toplam Lot</th>
                </tr></thead>
                <tbody>{holdings.map((h) => (
                  <tr key={h.symbol} className="border-b border-slate-50">
                    <td className="py-2.5 font-mono font-bold text-[#0B2447]">{(h.symbol || '-').replace('.IS','')}</td>
                    <td className="py-2.5 text-right">{h.user_count}</td>
                    <td className="py-2.5 text-right font-semibold">{h.total_units.toFixed(2)}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
