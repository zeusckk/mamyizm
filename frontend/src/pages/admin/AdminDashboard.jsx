import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminApi } from '../../api/client';
import { formatTRY, formatPct } from '../../data/mock';
import { Users, ShieldCheck, Activity, TrendingUp, Wallet, ArrowUpRight, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/button';

const Stat = ({ icon: Icon, label, value, sub, color = 'text-[#0B2447]', bg = 'bg-slate-100' }) => (
  <div className="fa-card fa-glow p-4 sm:p-5">
    <div className="flex items-center justify-between mb-3">
      <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center ${color}`}><Icon size={17} /></div>
    </div>
    <div className="text-xs text-slate-500 mb-1">{label}</div>
    <div className={`text-xl sm:text-2xl font-bold ${color}`} style={{ fontFamily: 'Manrope' }}>{value}</div>
    {sub && <div className="text-[11px] text-slate-400 mt-1">{sub}</div>}
  </div>
);

const AdminDashboard = () => {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setData(await adminApi.stats()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  if (loading && !data) return <div className="fa-card fa-glow p-8 text-center text-slate-400">Yükleniyor…</div>;
  if (!data) return <div className="fa-card fa-glow p-8 text-center text-red-500">Veriler alınamadı</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Genel Bakış</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Platform durumunu ve son aktiviteleri inceleyin.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="border-slate-300"><RefreshCw size={13} className="mr-1.5" /> Yenile</Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat icon={Users} label="Toplam Kullanıcı" value={data.users.total} sub={`${data.users.active} aktif • ${data.users.suspended} askıda`} bg="bg-blue-50" color="text-blue-700" />
        <Stat icon={ShieldCheck} label="Bekleyen KYC" value={data.kyc.pending} sub={`${data.kyc.approved} onaylı• ${data.kyc.none} onaysız`} bg="bg-amber-50" color="text-amber-700" />
        <Stat icon={Activity} label="Toplam İşlem" value={data.trading.total_transactions} sub={`${data.trading.total_holdings} aktif pozisyon`} bg="bg-emerald-50" color="text-emerald-700" />
        <Stat icon={Wallet} label="Toplam Nakit (TL)" value={formatTRY(data.cash.total_cash_balance)} sub={`Yatırılan: ${formatTRY(data.cash.total_deposits)}`} bg="bg-purple-50" color="text-purple-700" />
      </div>

      {/* Trading volumes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="fa-card fa-glow p-5">
          <h3 className="font-bold text-[#0B2447] mb-4" style={{ fontFamily: 'Manrope' }}>İşlem Hacmi</h3>
          <div className="space-y-3">
            {['Alım', 'Satım'].map((t) => (
              <div key={t} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{t}</span>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#0B2447]">{formatTRY(data.trading.volumes?.[t]?.volume || 0)}</div>
                  <div className="text-[11px] text-slate-500">{data.trading.volumes?.[t]?.count || 0} işlem</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 fa-card fa-glow p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>En Çok İşlem Gören Hisseler</h3>
            <Link to="/admin/raporlar" className="text-xs text-slate-500 hover:text-[#0B2447]">Tümü →</Link>
          </div>
          {(data.trading.top_symbols || []).length === 0 ? (
            <div className="text-sm text-slate-400 py-6 text-center">Henüz işlem yok</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="text-slate-500 text-xs uppercase border-b border-slate-100">
                <th className="text-left py-2">Sembol</th><th className="text-right py-2">İşlem</th><th className="text-right py-2">Hacim</th>
              </tr></thead>
              <tbody>
                {data.trading.top_symbols.map((s) => (
                  <tr key={s.symbol} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 font-mono font-bold text-[#0B2447]">{(s.symbol || '-').replace('.IS','')}</td>
                    <td className="py-2.5 text-right">{s.count}</td>
                    <td className="py-2.5 text-right font-semibold">{formatTRY(s.volume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="fa-card fa-glow p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Yeni Kayıtlar</h3>
            <Link to="/admin/kullanicilar" className="text-xs text-slate-500 hover:text-[#0B2447]">Tümü →</Link>
          </div>
          <div className="space-y-2">
            {data.recent_users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#0B2447] truncate">{u.full_name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${u.kyc_status === 'approved' ? 'bg-emerald-50 text-emerald-700' : u.kyc_status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{u.kyc_status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="fa-card fa-glow p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Son İşlemler</h3>
            <Link to="/admin/islemler" className="text-xs text-slate-500 hover:text-[#0B2447]">Tümü →</Link>
          </div>
          <div className="space-y-2">
            {data.recent_transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 text-sm">
                <div className="min-w-0">
                  <div className="font-semibold text-[#0B2447]">{t.type} — <span className="font-mono">{(t.code || '-').replace('.IS','')}</span></div>
                  <div className="text-[11px] text-slate-500 truncate">{t.user_email} • {t.date}</div>
                </div>
                <div className="font-bold text-[#0B2447] shrink-0">{formatTRY(t.total)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
