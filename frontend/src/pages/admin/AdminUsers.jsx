import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { formatTRY } from '../../data/mock';
import { Search, RefreshCw, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';

const statusBadge = (s) => {
  if (s === 'approved') return 'bg-emerald-50 text-emerald-700';
  if (s === 'pending') return 'bg-amber-50 text-amber-700';
  if (s === 'rejected') return 'bg-red-50 text-red-700';
  return 'bg-slate-100 text-slate-500';
};

const AdminUsers = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [kyc, setKyc] = useState('all');
  const [role, setRole] = useState('all');
  const [detail, setDetail] = useState(null);
  const [edit, setEdit] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminApi.listUsers({ q: q || undefined, kyc, role, limit: 100 });
      setItems(r.items); setTotal(r.total);
    } catch (e) { toast.error('Kullanıcılar alınamadı'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [kyc, role]);

  const openDetail = async (u) => {
    try { setDetail(await adminApi.userDetail(u.id)); } catch (e) { toast.error('Detay alınamadı'); }
  };

  const saveEdit = async () => {
    try {
      await adminApi.updateUser(edit.id, {
        full_name: edit.full_name, phone: edit.phone, tckn: edit.tckn,
        cash_balance: parseFloat(edit.cash_balance) || 0,
        suspended: !!edit.suspended, role: edit.role,
      });
      toast.success('Kullanıcı güncellendi'); setEdit(null); load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Güncellenemedi'); }
  };

  const remove = async (id, email) => {
    if (!window.confirm(`${email} kullanıcısını silmek istediğinizden emin misiniz?`)) return;
    try { await adminApi.deleteUser(id); toast.success('Kullanıcı silindi'); load(); }
    catch (e) { toast.error(e.response?.data?.detail || 'Silinemedi'); }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Kullanıcılar</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">{total} kayıtlı kullanıcı</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw size={13} className="mr-1.5" /> Yenile</Button>
      </div>

      <div className="fa-card fa-glow p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs">Ara (ad / e-posta / telefon / TCKN)</Label>
          <div className="relative mt-1.5">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} className="pl-9 h-10" placeholder="Ara..." />
          </div>
        </div>
        <div>
          <Label className="text-xs">KYC</Label>
          <Select value={kyc} onValueChange={setKyc}>
            <SelectTrigger className="w-36 mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="none">Onaysız</SelectItem>
              <SelectItem value="pending">Beklemede</SelectItem>
              <SelectItem value="approved">Onaylı</SelectItem>
              <SelectItem value="rejected">Reddedildi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Rol</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-32 mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="user">Kullanıcı</SelectItem>
              <SelectItem value="admin">Yönetici</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={load} className="bg-[#0B2447] hover:bg-[#173A6B] text-white">Ara</Button>
      </div>

      <div className="fa-card fa-glow overflow-hidden">
        <div className="overflow-x-auto fa-scrollbar">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-slate-500 text-xs uppercase">
              <th className="text-left px-4 py-3 font-semibold">Kullanıcı</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Telefon</th>
              <th className="text-center px-4 py-3 font-semibold">KYC</th>
              <th className="text-center px-4 py-3 font-semibold">Rol</th>
              <th className="text-right px-4 py-3 font-semibold">Bakiye</th>
              <th className="text-center px-4 py-3 font-semibold">Durum</th>
              <th className="text-right px-4 py-3 font-semibold">İşlem</th>
            </tr></thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center py-12 text-slate-400">Yükleniyor…</td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-slate-400">Sonuç yok</td></tr>}
              {!loading && items.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/60 cursor-pointer" onClick={() => openDetail(u)}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#0B2447]">{u.full_name}</div>
                    <div className="text-[11px] text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{u.phone || '-'}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 text-[10px] rounded font-semibold ${statusBadge(u.kyc_status)}`}>{u.kyc_status}</span></td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 text-[10px] rounded font-semibold ${u.role === 'admin' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{u.role}</span></td>
                  <td className="px-4 py-3 text-right font-semibold">{formatTRY(u.cash_balance)}</td>
                  <td className="px-4 py-3 text-center">{u.suspended ? <span className="px-2 py-0.5 text-[10px] rounded bg-red-50 text-red-700 font-semibold">Askıda</span> : <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-50 text-emerald-700 font-semibold">Aktif</span>}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setEdit({ ...u })} className="p-1.5 hover:bg-slate-100 rounded text-[#0B2447]"><Edit size={14} /></button>
                    <button onClick={() => remove(u.id, u.email)} className="p-1.5 hover:bg-red-50 rounded text-red-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{detail?.full_name}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {[['E-posta', detail.email], ['Telefon', detail.phone || '-'], ['TCKN', detail.tckn || '-'], ['Rol', detail.role], ['KYC', detail.kyc_status], ['Durum', detail.suspended ? 'Askıda' : 'Aktif'], ['Nakit', formatTRY(detail.cash_balance)], ['Toplam Yatırılan', formatTRY(detail.total_deposits)]].map(([l, v]) => (
                  <div key={l}><div className="text-xs text-slate-500">{l}</div><div className="font-semibold text-[#0B2447]">{v}</div></div>
                ))}
              </div>
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-500 mb-2">Pozisyonlar ({detail.holdings?.length || 0})</h4>
                {(detail.holdings || []).length === 0 ? <p className="text-sm text-slate-400">Pozisyon yok</p> : (
                  <table className="w-full text-xs"><thead><tr className="text-slate-500"><th className="text-left py-1">Sembol</th><th className="text-right">Lot</th><th className="text-right">Ort. Maliyet</th></tr></thead>
                  <tbody>{detail.holdings.map((h) => <tr key={h.code} className="border-t border-slate-100"><td className="py-1.5 font-mono font-semibold">{h.code.replace('.IS','')}</td><td className="text-right">{h.units.toFixed(2)}</td><td className="text-right">{h.avg_cost.toFixed(4)}</td></tr>)}</tbody></table>
                )}
              </div>
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-500 mb-2">Son İşlemler</h4>
                {(detail.recent_transactions || []).length === 0 ? <p className="text-sm text-slate-400">İşlem yok</p> : (
                  <div className="max-h-48 overflow-y-auto fa-scrollbar"><table className="w-full text-xs"><tbody>
                    {detail.recent_transactions.map((t) => <tr key={t.id} className="border-b border-slate-50"><td className="py-1.5 text-slate-500">{t.date}</td><td className="py-1.5">{t.type}</td><td className="py-1.5 font-mono">{(t.code || '-').replace('.IS','')}</td><td className="py-1.5 text-right font-semibold">{formatTRY(t.total)}</td></tr>)}
                  </tbody></table></div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Kullanıcıyı Düzenle</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div><Label className="text-xs">Ad Soyad</Label><Input value={edit.full_name || ''} onChange={(e) => setEdit({ ...edit, full_name: e.target.value })} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Telefon</Label><Input value={edit.phone || ''} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">TCKN</Label><Input value={edit.tckn || ''} onChange={(e) => setEdit({ ...edit, tckn: e.target.value })} className="mt-1" /></div>
              </div>
              <div><Label className="text-xs">Nakit Bakiye (TL)</Label><Input type="number" value={edit.cash_balance ?? 0} onChange={(e) => setEdit({ ...edit, cash_balance: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Rol</Label>
                <Select value={edit.role} onValueChange={(v) => setEdit({ ...edit, role: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="user">Kullanıcı</SelectItem><SelectItem value="admin">Yönetici</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <Label className="text-sm flex items-center gap-2"><AlertCircle size={14} className="text-red-500" /> Hesabı Askıya Al</Label>
                <Switch checked={!!edit.suspended} onCheckedChange={(v) => setEdit({ ...edit, suspended: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Vazgeç</Button>
            <Button onClick={saveEdit} className="bg-[#0B2447] hover:bg-[#173A6B] text-white">Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
