import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import { CheckCircle2, XCircle, Eye, RefreshCw, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';

const AdminKyc = () => {
  const [tab, setTab] = useState('pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      if (tab === 'pending') { const r = await adminApi.kycPending(); setItems(r.items || []); }
      else { setItems(await adminApi.kycAll(tab)); }
    } catch (e) { toast.error('KYC verileri alınamadı'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const view = async (u) => {
    try { setDocs(await adminApi.kycDocs(u.id)); }
    catch (e) { toast.error('Belgeler alınamadı'); }
  };

  const approve = async (id) => {
    try { await adminApi.kycApprove(id); toast.success('KYC onaylandı'); setDocs(null); load(); }
    catch (e) { toast.error(e.response?.data?.detail || 'Onaylanamadı'); }
  };

  const reject = async () => {
    if (!rejecting) return;
    try { await adminApi.kycReject(rejecting.id, reason); toast.success('KYC reddedildi'); setRejecting(null); setReason(''); setDocs(null); load(); }
    catch (e) { toast.error(e.response?.data?.detail || 'Reddedilemedi'); }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>KYC Onayları</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Kullanıcı kimlik doğrulamalarını inceleyin ve onaylayın.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw size={13} className="mr-1.5" /> Yenile</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="pending" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"><Clock size={13} className="mr-1.5" /> Bekleyenler</TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><CheckCircle2 size={13} className="mr-1.5" /> Onaylananlar</TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-red-600 data-[state=active]:text-white"><XCircle size={13} className="mr-1.5" /> Reddedilenler</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-[#0B2447] data-[state=active]:text-white">Tümü</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="fa-card fa-glow overflow-hidden">
        <div className="overflow-x-auto fa-scrollbar">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-slate-500 text-xs uppercase">
              <th className="text-left px-4 py-3 font-semibold">Kullanıcı</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Telefon</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Belge Türü</th>
              <th className="text-center px-4 py-3 font-semibold">Durum</th>
              <th className="text-right px-4 py-3 font-semibold">İşlem</th>
            </tr></thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="text-center py-12 text-slate-400">Yükleniyor…</td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-slate-400">Kayıt yok</td></tr>}
              {!loading && items.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3"><div className="font-semibold text-[#0B2447]">{u.full_name}</div><div className="text-[11px] text-slate-500">{u.email}</div></td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{u.phone || '-'}</td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell text-xs">{u.id_doc_type || u.tckn ? ((u.id_doc_type || '').replace('_', ' ')) : '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 text-[10px] rounded font-semibold ${u.kyc_status === 'approved' ? 'bg-emerald-50 text-emerald-700' : u.kyc_status === 'pending' ? 'bg-amber-50 text-amber-700' : u.kyc_status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'}`}>{u.kyc_status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => view(u)} className="h-8"><Eye size={13} className="mr-1" /> İncele</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Documents viewer */}
      <Dialog open={!!docs} onOpenChange={(o) => !o && setDocs(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{docs?.user?.full_name} — KYC Belgeleri</DialogTitle></DialogHeader>
          {docs && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><div className="text-slate-500">E-posta</div><div className="font-semibold">{docs.user?.email}</div></div>
                <div><div className="text-slate-500">Telefon</div><div className="font-semibold">{docs.user?.phone || '-'}</div></div>
                <div><div className="text-slate-500">TCKN</div><div className="font-semibold">{docs.user?.tckn || '-'}</div></div>
                <div><div className="text-slate-500">Belge Türü</div><div className="font-semibold">{docs.id_doc_type}</div></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-500 mb-2">Selfie</div>
                  <img src={docs.selfie_base64} alt="selfie" className="w-full rounded-lg border border-slate-200" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 mb-2">Kimlik Belgesi</div>
                  {docs.id_doc_mime === 'application/pdf' ? (
                    <div className="h-64 bg-slate-100 rounded-lg flex flex-col items-center justify-center">
                      <FileText size={42} className="text-red-500 mb-2" />
                      <a href={docs.id_doc_base64} target="_blank" rel="noreferrer" download={docs.id_doc_filename} className="text-sm font-semibold text-[#0B2447] underline">PDF'i indir / aç</a>
                    </div>
                  ) : (
                    <img src={docs.id_doc_base64} alt="id" className="w-full rounded-lg border border-slate-200" />
                  )}
                </div>
              </div>
            </div>
          )}
          {docs?.user?.kyc_status === 'pending' && (
            <DialogFooter>
              <Button variant="outline" onClick={() => { setRejecting(docs.user); setDocs(null); }} className="text-red-600 border-red-200 hover:bg-red-50"><XCircle size={14} className="mr-1" /> Reddet</Button>
              <Button onClick={() => approve(docs.user.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white"><CheckCircle2 size={14} className="mr-1" /> Onayla</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>KYC'yi Reddet</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">{rejecting?.full_name} kullanıcısının KYC başvurusu reddedilecek. Sebep belirtin:</p>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Belge net değil / kimlik bilgileri uyuşmuyor…" rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Vazgeç</Button>
            <Button onClick={reject} className="bg-red-600 hover:bg-red-700 text-white">Reddet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminKyc;
