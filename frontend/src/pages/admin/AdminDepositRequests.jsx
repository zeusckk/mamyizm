import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { formatTRY } from '../../data/mock';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Check, X, RefreshCw, Eye, Inbox, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const statusBadge = (s) => ({
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}[s] || 'bg-slate-100 text-slate-700');

const statusLabel = (s) => ({ pending: 'Beklemede', approved: 'Onaylandı', rejected: 'Reddedildi' }[s] || s);

const AdminDepositRequests = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [detail, setDetail] = useState(null);
  const [rejectFor, setRejectFor] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminApi.listDepositRequests({ status, limit: 200 });
      setItems(r.items); setTotal(r.total);
    } catch (e) { toast.error('Liste alınamadı'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const openDetail = async (id) => {
    try { setDetail(await adminApi.depositRequestDetail(id)); }
    catch { toast.error('Detay yüklenemedi'); }
  };

  const approve = async (id) => {
    if (!window.confirm('Bu yatırım talebini onaylıyor musunuz? Kullanıcının bakiyesine eklenecek.')) return;
    try { await adminApi.approveDepositRequest(id); toast.success('Onaylandı, bakiye yüklendi'); setDetail(null); load(); }
    catch (e) { toast.error(e.response?.data?.detail || 'Onaylanamadı'); }
  };

  const reject = async () => {
    if (!rejectFor) return;
    try {
      await adminApi.rejectDepositRequest(rejectFor.id, rejectReason || 'Doğrulanamadı');
      toast.success('Reddedildi');
      setRejectFor(null); setRejectReason(''); setDetail(null); load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Reddedilemedi'); }
  };

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="admin-deposit-requests-page">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Yatırım Talepleri</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">{total} kayıt · Kullanıcıların gönderdiği para yatırma talepleri</p>
        </div>
        <div className="flex gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Bekleyenler</SelectItem>
              <SelectItem value="approved">Onaylananlar</SelectItem>
              <SelectItem value="rejected">Reddedilenler</SelectItem>
              <SelectItem value="all">Tümü</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw size={13} className="mr-1.5" /> Yenile</Button>
        </div>
      </div>

      <div className="fa-card fa-glow overflow-hidden">
        <div className="overflow-x-auto fa-scrollbar">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-slate-500 text-xs uppercase">
              <th className="text-left px-4 py-3 font-semibold">Tarih</th>
              <th className="text-left px-4 py-3 font-semibold">Kullanıcı</th>
              <th className="text-left px-4 py-3 font-semibold">Yöntem</th>
              <th className="text-right px-4 py-3 font-semibold">Tutar</th>
              <th className="text-center px-4 py-3 font-semibold">Durum</th>
              <th className="text-center px-4 py-3 font-semibold">İşlem</th>
            </tr></thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center py-12 text-slate-400">Yükleniyor…</td></tr>}
              {!loading && items.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">
                  <Inbox size={28} className="mx-auto mb-2 text-slate-300" />
                  Kayıt yok
                </td></tr>
              )}
              {!loading && items.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/60" data-testid={`deposit-req-row-${r.id}`}>
                  <td className="px-4 py-3 text-slate-600 text-xs">{r.created_at ? new Date(r.created_at).toLocaleString('tr-TR') : '-'}</td>
                  <td className="px-4 py-3"><div className="font-semibold text-[#0B2447]">{r.user_name}</div><div className="text-[11px] text-slate-500">{r.user_email}</div></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${r.payment_method_type === 'bank' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{r.payment_method_type}</span><div className="text-xs text-slate-600 mt-0.5">{r.payment_method_label}</div></td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatTRY(r.amount)}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 text-[11px] font-bold rounded border ${statusBadge(r.status)}`}>{statusLabel(r.status)}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center">
                      <Button size="sm" variant="outline" onClick={() => openDetail(r.id)} data-testid={`detail-btn-${r.id}`}><Eye size={13} /></Button>
                      {r.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => approve(r.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid={`approve-btn-${r.id}`}><Check size={13} /></Button>
                          <Button size="sm" variant="outline" onClick={() => setRejectFor(r)} className="text-red-600 border-red-200 hover:bg-red-50" data-testid={`reject-btn-${r.id}`}><X size={13} /></Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Talep Detayı</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Durum</span><span className={`px-2 py-0.5 text-[11px] font-bold rounded border ${statusBadge(detail.status)}`}>{statusLabel(detail.status)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Kullanıcı</span><span className="font-semibold">{detail.user_name} ({detail.user_email})</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Tutar</span><span className="font-bold text-emerald-700 text-lg">{formatTRY(detail.amount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Ödeme Yöntemi</span><span>{detail.payment_method_label} ({detail.payment_method_type})</span></div>
              {detail.sender_name && <div className="flex justify-between"><span className="text-slate-500">Gönderen Adı</span><span>{detail.sender_name}</span></div>}
              {detail.tx_hash && <div><div className="text-slate-500 mb-1">TX Hash</div><div className="font-mono text-[11px] bg-slate-50 p-2 rounded break-all">{detail.tx_hash}</div></div>}
              {detail.note && <div><div className="text-slate-500 mb-1">Not</div><div className="bg-slate-50 p-2 rounded">{detail.note}</div></div>}
              {detail.receipt_base64 && (
                <div>
                  <div className="text-slate-500 mb-1">Dekont / Ekran Görüntüsü</div>
                  <img src={detail.receipt_base64.startsWith('data:') ? detail.receipt_base64 : `data:image/jpeg;base64,${detail.receipt_base64}`} alt="Dekont" className="rounded border max-h-64 mx-auto" />
                </div>
              )}
              {detail.rejection_reason && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-2 rounded">
                  <AlertCircle size={14} className="mt-0.5" />
                  <div><div className="font-semibold text-xs">Ret nedeni</div><div className="text-xs">{detail.rejection_reason}</div></div>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                <span>Oluşturulma: {detail.created_at && new Date(detail.created_at).toLocaleString('tr-TR')}</span>
                {detail.reviewed_at && <span>İncelendi: {new Date(detail.reviewed_at).toLocaleString('tr-TR')}</span>}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {detail?.status === 'pending' && (
              <>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setRejectFor(detail)}><X size={14} className="mr-1" /> Reddet</Button>
                <Button onClick={() => approve(detail.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Check size={14} className="mr-1" /> Onayla</Button>
              </>
            )}
            <Button variant="outline" onClick={() => setDetail(null)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectFor} onOpenChange={(o) => !o && (setRejectFor(null), setRejectReason(''))}>
        <DialogContent>
          <DialogHeader><DialogTitle>Talebi Reddet</DialogTitle></DialogHeader>
          {rejectFor && (
            <div className="space-y-3">
              <div className="text-sm text-slate-600">
                <span className="font-semibold">{rejectFor.user_name}</span> kullanıcısına ait <span className="font-bold text-emerald-700">{formatTRY(rejectFor.amount)}</span> tutarındaki talep reddedilecek.
              </div>
              <div><Label className="text-xs">Ret Nedeni</Label><Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} className="mt-1" placeholder="Örn: Dekont ve tutar uyuşmuyor" data-testid="reject-reason-input" /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectFor(null); setRejectReason(''); }}>Vazgeç</Button>
            <Button onClick={reject} className="bg-red-600 hover:bg-red-700 text-white" data-testid="confirm-reject-btn">Reddet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDepositRequests;
