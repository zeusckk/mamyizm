import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { Button } from '../../components/ui/button';
import { RefreshCw, FileClock } from 'lucide-react';

const actionLabel = (a) => ({
  'user.update': { l: 'Kullanıcı Güncellendi', c: 'bg-blue-50 text-blue-700' },
  'user.delete': { l: 'Kullanıcı Silindi', c: 'bg-red-50 text-red-700' },
  'kyc.approve': { l: 'KYC Onaylandı', c: 'bg-emerald-50 text-emerald-700' },
  'kyc.reject': { l: 'KYC Reddedildi', c: 'bg-red-50 text-red-700' },
  'news.create': { l: 'Haber Oluşturuldu', c: 'bg-purple-50 text-purple-700' },
  'news.update': { l: 'Haber Güncellendi', c: 'bg-purple-50 text-purple-700' },
  'news.delete': { l: 'Haber Silindi', c: 'bg-red-50 text-red-700' },
  'admin.create': { l: 'Yönetici Oluşturuldu', c: 'bg-amber-50 text-amber-700' },
  'settings.update': { l: 'Ayarlar Güncellendi', c: 'bg-slate-100 text-slate-700' },
}[a] || { l: a, c: 'bg-slate-100 text-slate-700' });

const AdminAuditLog = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const r = await adminApi.auditLog({ limit: 200 }); setItems(r.items); setTotal(r.total); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Audit Log</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">{total} yönetici işlemi kaydı</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw size={13} className="mr-1.5" /> Yenile</Button>
      </div>

      <div className="fa-card fa-glow overflow-hidden">
        <div className="overflow-x-auto fa-scrollbar">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-slate-500 text-xs uppercase">
              <th className="text-left px-4 py-3 font-semibold">Tarih</th>
              <th className="text-left px-4 py-3 font-semibold">Yönetici</th>
              <th className="text-left px-4 py-3 font-semibold">İşlem</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Hedef ID</th>
              <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Detay</th>
            </tr></thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="text-center py-12 text-slate-400">Yükleniyor…</td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-slate-400"><FileClock size={32} className="mx-auto mb-2 text-slate-300" />Henüz kayıt yok</td></tr>}
              {!loading && items.map((it) => {
                const lbl = actionLabel(it.action);
                return (
                  <tr key={it.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{new Date(it.created_at).toLocaleString('tr-TR')}</td>
                    <td className="px-4 py-3"><div className="font-semibold text-[#0B2447]">{it.admin_name}</div><div className="text-[11px] text-slate-500">{it.admin_email}</div></td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-semibold rounded ${lbl.c}`}>{lbl.l}</span></td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500 hidden md:table-cell">{it.target_id ? it.target_id.slice(0, 12) + '…' : '-'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell"><pre className="font-mono text-[10px] max-w-xs overflow-hidden">{Object.keys(it.meta || {}).length ? JSON.stringify(it.meta) : '-'}</pre></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLog;
