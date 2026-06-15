import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Plus, ShieldAlert, RefreshCw, Mail } from 'lucide-react';
import { toast } from 'sonner';

const AdminAdmins = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setItems(await adminApi.admins()); } catch (e) { toast.error('Yöneticiler alınamadı'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!creating.email || !creating.password || !creating.full_name) return toast.error('Tüm alanlar zorunlu');
    if (creating.password.length < 6) return toast.error('Şifre en az 6 karakter olmalı');
    try {
      await adminApi.createAdmin(creating);
      toast.success('Yeni yönetici oluşturuldu');
      setCreating(null); load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Oluşturulamadı'); }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Yöneticiler</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">{items.length} aktif yönetici</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw size={13} className="mr-1.5" /> Yenile</Button>
          <Button onClick={() => setCreating({ email: '', password: '', full_name: '' })} className="bg-amber-600 hover:bg-amber-700 text-white"><Plus size={14} className="mr-1" /> Yeni Yönetici</Button>
        </div>
      </div>

      <div className="fa-card fa-glow overflow-hidden">
        <div className="overflow-x-auto fa-scrollbar">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-slate-500 text-xs uppercase">
              <th className="text-left px-4 py-3 font-semibold">Yönetici</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">E-posta</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Kayıt Tarihi</th>
              <th className="text-center px-4 py-3 font-semibold">Durum</th>
            </tr></thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="text-center py-12 text-slate-400">Yükleniyor…</td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={4} className="text-center py-12 text-slate-400">Yönetici yok</td></tr>}
              {!loading && items.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">{a.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>
                      <div>
                        <div className="font-semibold text-[#0B2447]">{a.full_name}</div>
                        <div className="text-[11px] text-amber-700 font-semibold inline-flex items-center gap-1"><ShieldAlert size={10} /> Yönetici</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{a.email}</td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell text-xs">{a.created_at ? new Date(a.created_at).toLocaleDateString('tr-TR') : '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {a.suspended ? <span className="px-2 py-0.5 text-[10px] rounded bg-red-50 text-red-700 font-semibold">Askıda</span> : <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-50 text-emerald-700 font-semibold">Aktif</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!creating} onOpenChange={(o) => !o && setCreating(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Yeni Yönetici Oluştur</DialogTitle></DialogHeader>
          {creating && (
            <div className="space-y-3">
              <div><Label className="text-xs">Ad Soyad</Label><Input value={creating.full_name} onChange={(e) => setCreating({ ...creating, full_name: e.target.value })} className="mt-1" placeholder="Yönetici Ad Soyad" /></div>
              <div><Label className="text-xs">E-posta</Label><Input type="email" value={creating.email} onChange={(e) => setCreating({ ...creating, email: e.target.value })} className="mt-1" placeholder="yonetici@fonakis.com" /></div>
              <div><Label className="text-xs">Şifre (en az 6 karakter)</Label><Input type="password" value={creating.password} onChange={(e) => setCreating({ ...creating, password: e.target.value })} className="mt-1" /></div>
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 p-3 rounded-lg flex gap-2">
                <Mail size={14} className="shrink-0 mt-0.5" />
                <span>Bu hesap tüm admin yetkilerine sahip olacaktır. KYC otomatik olarak onaylı sayılır.</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(null)}>Vazgeç</Button>
            <Button onClick={create} className="bg-amber-600 hover:bg-amber-700 text-white">Oluştur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAdmins;
