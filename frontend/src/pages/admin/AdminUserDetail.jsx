import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/client';
import { formatTRY } from '../../data/mock';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, RefreshCw, Wallet, CreditCard, UserCog, KeyRound, Activity, TrendingUp, TrendingDown, Circle } from 'lucide-react';

const TABS = [
  { id: 'open', label: 'Açık Pozisyonlar', count: 'open_positions' },
  { id: 'closed', label: 'Kapanan', count: 'closed_trades' },
  { id: 'deposits', label: 'Yatırımlar', count: 'deposits' },
  { id: 'withdrawals', label: 'Çekimler', count: 'withdrawals' },
  { id: 'movements', label: 'Hesap Hareketleri', count: 'movements' },
  { id: 'kyc', label: 'KYC' },
];

const fmtDate = (s) => {
  if (!s) return '-';
  if (typeof s === 'string' && s.includes('-') && s.length <= 16) return s.replace(/-/g, '.');
  try {
    const d = new Date(s);
    return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return String(s); }
};

const AdminUserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('open');

  const [balOpen, setBalOpen] = useState(false);
  const [credOpen, setCredOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setD(await adminApi.userDetail(id)); }
    catch (e) { toast.error(e.response?.data?.detail || 'Detay alınamadı'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (loading && !d) return <div className="fa-card fa-glow p-8 text-center text-slate-400">Yükleniyor…</div>;
  if (!d) return <div className="fa-card fa-glow p-8 text-center text-red-500">Kullanıcı bulunamadı</div>;

  const initials = (d.full_name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="admin-user-detail-page">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Müşteri Detayı</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Pozisyon ve hesap hareketleri</p>
        </div>
        <div className="flex gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <Circle size={8} className="fill-emerald-500 text-emerald-500" /> Piyasa Verisi
          </div>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw size={13} className="mr-1.5" /> Yenile</Button>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={() => navigate('/admin/kullanicilar')} data-testid="back-to-users-btn">
        <ArrowLeft size={14} className="mr-1.5" /> Müşteriler
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 lg:gap-6">
        {/* LEFT — profile card */}
        <aside className="space-y-4">
          <div className="fa-card fa-glow p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-white flex items-center justify-center font-bold text-xl shrink-0">{initials}</div>
              <div className="min-w-0">
                <div className="font-bold text-[#0B2447] text-lg leading-tight truncate" data-testid="user-name">{d.full_name}</div>
                <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold tracking-wider rounded bg-slate-100 text-slate-600 uppercase">{d.tier || 'STANDARD'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <StatBox label="Bakiye" value={formatTRY(d.cash_balance)} testid="stat-balance" />
              <StatBox label="Kredi" value={formatTRY(d.credit_balance || 0)} testid="stat-credit" />
              <StatBox label="Açık Poz" value={d.positions_summary?.open_count ?? 0} />
              <StatBox label="Açık P/L" value={`${(d.positions_summary?.open_pl ?? 0) >= 0 ? '+' : ''}${formatTRY(d.positions_summary?.open_pl || 0)}`} positive={(d.positions_summary?.open_pl || 0) >= 0} />
            </div>

            <div className="space-y-2.5 text-sm">
              <Row label="TC Kimlik" value={d.tckn || '-'} />
              <Row label="Telefon" value={d.phone || '-'} />
              <Row label="E-posta" value={d.email} mono />
              <Row label="Müşteri No" value={d.customer_no} mono />
              <Row label="Kayıt" value={fmtDate(d.created_at)} />
              <Row label="Para birimi" value={d.currency || 'TRY'} />
              <Row label="KYC" value={d.kyc_status === 'approved' ? 'verified' : 'unverified'} colored={d.kyc_status === 'approved' ? 'text-emerald-600' : 'text-amber-600'} />
              <Row label="Durum" value={d.suspended ? 'Askıda' : 'Aktif'} colored={d.suspended ? 'text-red-600' : 'text-emerald-600'} />
            </div>

            <div className="space-y-2 mt-6">
              <Button onClick={() => setBalOpen(true)} className="w-full bg-amber-400 hover:bg-amber-300 text-[#0B2447] font-bold" data-testid="balance-action-btn"><Wallet size={14} className="mr-2" /> Bakiye İşlemi</Button>
              <Button onClick={() => setCredOpen(true)} variant="outline" className="w-full" data-testid="credit-action-btn"><CreditCard size={14} className="mr-2" /> Kredi İşlemi</Button>
              <Button onClick={() => setInfoOpen(true)} variant="outline" className="w-full" data-testid="info-edit-btn"><UserCog size={14} className="mr-2" /> Bilgileri Düzenle</Button>
              <Button onClick={() => setPwdOpen(true)} variant="outline" className="w-full" data-testid="password-btn"><KeyRound size={14} className="mr-2" /> Şifre Değiştir</Button>
            </div>
          </div>
        </aside>

        {/* RIGHT — tabs */}
        <section className="fa-card fa-glow min-h-[60vh] overflow-hidden">
          {/* Tab nav */}
          <div className="border-b border-slate-100 px-3 sm:px-5 overflow-x-auto fa-scrollbar">
            <div className="flex gap-1 sm:gap-2 min-w-max">
              {TABS.map((t) => {
                const cnt = t.count && Array.isArray(d[t.count]) ? d[t.count].length : null;
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)} data-testid={`tab-${t.id}`} className={`relative px-3 sm:px-4 py-3 text-sm whitespace-nowrap transition ${active ? 'text-[#0B2447] font-semibold' : 'text-slate-500 hover:text-[#0B2447]'}`}>
                    <span className="flex items-center gap-2">
                      {t.label}
                      {cnt !== null && <span className={`text-[10px] px-1.5 py-0.5 rounded ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{cnt}</span>}
                    </span>
                    {active && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-500 rounded-t" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab content */}
          <div className="p-4 sm:p-6">
            {tab === 'open' && <OpenPositionsTable rows={d.open_positions} />}
            {tab === 'closed' && <TxTable rows={d.closed_trades} kind="closed" />}
            {tab === 'deposits' && <TxTable rows={d.deposits} kind="deposits" />}
            {tab === 'withdrawals' && <TxTable rows={d.withdrawals} kind="withdrawals" />}
            {tab === 'movements' && <TxTable rows={d.movements} kind="movements" />}
            {tab === 'kyc' && <KycPanel d={d} reload={load} />}
          </div>
        </section>
      </div>

      <BalanceDialog open={balOpen} onOpenChange={setBalOpen} userId={id} current={d.cash_balance} onDone={load} kind="balance" />
      <BalanceDialog open={credOpen} onOpenChange={setCredOpen} userId={id} current={d.credit_balance || 0} onDone={load} kind="credit" />
      <InfoDialog open={infoOpen} onOpenChange={setInfoOpen} user={d} onDone={load} />
      <PasswordDialog open={pwdOpen} onOpenChange={setPwdOpen} userId={id} />
    </div>
  );
};

// ----- helpers -----
const StatBox = ({ label, value, positive, testid }) => (
  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3" data-testid={testid}>
    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
    <div className={`mt-1 font-bold ${positive === undefined ? 'text-[#0B2447]' : positive ? 'text-emerald-600' : 'text-red-600'} text-base sm:text-lg truncate`} style={{ fontFamily: 'Manrope' }}>{value}</div>
  </div>
);

const Row = ({ label, value, mono, colored }) => (
  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-0">
    <span className="text-slate-500 text-xs uppercase tracking-wider">{label}</span>
    <span className={`font-semibold ${mono ? 'font-mono text-xs' : 'text-sm'} ${colored || 'text-[#0B2447]'} truncate text-right`}>{value}</span>
  </div>
);

const Empty = ({ icon: Icon = Activity, msg }) => (
  <div className="py-16 text-center text-slate-400">
    <Icon size={26} className="mx-auto mb-2 opacity-40" />
    {msg}
  </div>
);

const OpenPositionsTable = ({ rows }) => {
  if (!rows || rows.length === 0) return <Empty msg="Açık pozisyon yok" />;
  return (
    <div className="overflow-x-auto fa-scrollbar">
      <table className="w-full text-sm">
        <thead><tr className="text-slate-500 text-[11px] uppercase tracking-wider">
          <th className="text-left py-2 pr-3 font-semibold">Sembol</th>
          <th className="text-right py-2 px-3 font-semibold">Lot</th>
          <th className="text-right py-2 px-3 font-semibold">Ort. Maliyet</th>
          <th className="text-right py-2 px-3 font-semibold">Güncel Fiyat</th>
          <th className="text-right py-2 px-3 font-semibold">Maliyet</th>
          <th className="text-right py-2 px-3 font-semibold">Değer</th>
          <th className="text-right py-2 pl-3 font-semibold">P/L</th>
        </tr></thead>
        <tbody>
          {rows.map((h) => (
            <tr key={h.code} className="border-t border-slate-100 hover:bg-slate-50/60">
              <td className="py-3 pr-3"><div className="font-mono font-bold text-[#0B2447]">{h.code.replace('.IS', '')}</div><div className="text-[11px] text-slate-500">{h.name}</div></td>
              <td className="py-3 px-3 text-right text-slate-700">{h.units.toFixed(2)}</td>
              <td className="py-3 px-3 text-right text-slate-600">{h.avg_cost.toFixed(4)}</td>
              <td className="py-3 px-3 text-right text-slate-600">{(h.current_price || 0).toFixed(4)}</td>
              <td className="py-3 px-3 text-right text-slate-600">{formatTRY(h.cost)}</td>
              <td className="py-3 px-3 text-right text-[#0B2447] font-semibold">{formatTRY(h.value)}</td>
              <td className={`py-3 pl-3 text-right font-bold ${h.pl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                <div className="flex items-center justify-end gap-1">
                  {h.pl >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {formatTRY(h.pl)}
                </div>
                <div className="text-[10px] opacity-70">{h.pl_pct.toFixed(2)}%</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TxTable = ({ rows, kind }) => {
  if (!rows || rows.length === 0) {
    const msgs = { closed: 'Kapanmış işlem yok', deposits: 'Para yatırma yok', withdrawals: 'Para çekme yok', movements: 'Hesap hareketi yok' };
    return <Empty msg={msgs[kind] || 'Kayıt yok'} />;
  }
  return (
    <div className="overflow-x-auto fa-scrollbar">
      <table className="w-full text-sm">
        <thead><tr className="text-slate-500 text-[11px] uppercase tracking-wider">
          <th className="text-left py-2 pr-3 font-semibold">Tarih</th>
          <th className="text-left py-2 px-3 font-semibold">İşlem</th>
          <th className="text-left py-2 px-3 font-semibold">Sembol</th>
          <th className="text-right py-2 px-3 font-semibold">Lot</th>
          <th className="text-right py-2 px-3 font-semibold">Fiyat</th>
          <th className="text-right py-2 pl-3 font-semibold">Tutar</th>
        </tr></thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/60">
              <td className="py-3 pr-3 text-slate-500 text-xs">{t.date}</td>
              <td className="py-3 px-3"><span className={`px-2 py-0.5 text-[10px] rounded font-bold uppercase ${
                t.type === 'Alım' ? 'bg-emerald-50 text-emerald-700'
                : t.type === 'Satım' ? 'bg-red-50 text-red-700'
                : t.type === 'Para Yatırma' ? 'bg-blue-50 text-blue-700'
                : t.type === 'Para Çekme' ? 'bg-amber-50 text-amber-700'
                : 'bg-slate-100 text-slate-600'
              }`}>{t.type}</span></td>
              <td className="py-3 px-3 font-mono text-[#0B2447]">{(t.code || '-').replace('.IS', '')}</td>
              <td className="py-3 px-3 text-right text-slate-600">{t.units ? t.units.toFixed(2) : '-'}</td>
              <td className="py-3 px-3 text-right text-slate-600">{t.price ? t.price.toFixed(4) : '-'}</td>
              <td className={`py-3 pl-3 text-right font-bold ${t.total < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatTRY(t.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const KycPanel = ({ d, reload }) => {
  const [docs, setDocs] = useState(null);
  useEffect(() => {
    if (d.has_kyc_documents) {
      adminApi.kycDocs(d.id).then(setDocs).catch(() => {});
    }
  }, [d.id, d.has_kyc_documents]);

  const approve = async () => {
    if (!window.confirm('KYC onaylansın mı?')) return;
    try { await adminApi.kycApprove(d.id); toast.success('KYC onaylandı'); reload(); }
    catch { toast.error('Onaylanamadı'); }
  };
  const reject = async () => {
    const r = window.prompt('Ret nedeni:');
    if (!r) return;
    try { await adminApi.kycReject(d.id, r); toast.success('Reddedildi'); reload(); }
    catch { toast.error('Reddedilemedi'); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KvBox k="Durum" v={d.kyc_status} colored={d.kyc_status === 'approved' ? 'text-emerald-600' : d.kyc_status === 'pending' ? 'text-amber-600' : d.kyc_status === 'rejected' ? 'text-red-600' : 'text-slate-600'} />
        <KvBox k="Gönderim" v={d.kyc_submitted_at ? fmtDate(d.kyc_submitted_at) : '-'} />
        <KvBox k="İnceleme" v={d.kyc_reviewed_at ? fmtDate(d.kyc_reviewed_at) : '-'} />
        <KvBox k="Belge Türü" v={d.kyc_id_doc_type || '-'} />
      </div>
      {d.kyc_rejection_reason && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">Ret nedeni: {d.kyc_rejection_reason}</div>}
      {docs && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {docs.selfie_base64 && (
            <div>
              <div className="text-xs text-slate-500 uppercase mb-2">Selfie</div>
              <img src={docs.selfie_base64.startsWith('data:') ? docs.selfie_base64 : `data:image/jpeg;base64,${docs.selfie_base64}`} alt="selfie" className="rounded-lg border border-slate-200 max-h-72 w-full object-contain bg-slate-50" />
            </div>
          )}
          {docs.id_doc_base64 && (
            <div>
              <div className="text-xs text-slate-500 uppercase mb-2">Kimlik Belgesi ({docs.id_doc_type})</div>
              <img src={docs.id_doc_base64.startsWith('data:') ? docs.id_doc_base64 : `data:image/jpeg;base64,${docs.id_doc_base64}`} alt="id" className="rounded-lg border border-slate-200 max-h-72 w-full object-contain bg-slate-50" />
            </div>
          )}
        </div>
      )}
      {!d.has_kyc_documents && <Empty msg="KYC belgesi yüklenmemiş" />}
      {d.kyc_status === 'pending' && d.has_kyc_documents && (
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <Button onClick={approve} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="kyc-approve-btn">Onayla</Button>
          <Button onClick={reject} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" data-testid="kyc-reject-btn">Reddet</Button>
        </div>
      )}
    </div>
  );
};

const KvBox = ({ k, v, colored }) => (
  <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
    <div className="text-[10px] uppercase text-slate-500 tracking-wider">{k}</div>
    <div className={`mt-1 font-semibold ${colored || 'text-[#0B2447]'}`}>{v}</div>
  </div>
);

// ----- dialogs (light theme) -----
const BalanceDialog = ({ open, onOpenChange, userId, current, onDone, kind }) => {
  const [amt, setAmt] = useState('');
  const [op, setOp] = useState('add'); // add | subtract
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!open) { setAmt(''); setReason(''); setOp('add'); } }, [open]);

  const submit = async () => {
    const a = parseFloat(amt);
    if (!a || a <= 0) return toast.error('Geçerli tutar girin');
    const delta = op === 'add' ? a : -a;
    setBusy(true);
    try {
      if (kind === 'balance') await adminApi.userAdjustBalance(userId, { delta, reason });
      else await adminApi.userAdjustCredit(userId, { delta, reason });
      toast.success(kind === 'balance' ? 'Bakiye güncellendi' : 'Kredi güncellendi');
      onOpenChange(false);
      onDone && onDone();
    } catch (e) { toast.error(e.response?.data?.detail || 'İşlem başarısız'); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{kind === 'balance' ? 'Bakiye İşlemi' : 'Kredi İşlemi'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="bg-slate-50 p-3 rounded-lg text-sm">
            <div className="text-xs text-slate-500">Mevcut</div>
            <div className="font-bold text-[#0B2447] text-lg" style={{ fontFamily: 'Manrope' }}>{formatTRY(current || 0)}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" onClick={() => setOp('add')} className={op === 'add' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} data-testid="op-add"><TrendingUp size={14} className="mr-1.5" /> Ekle</Button>
            <Button type="button" onClick={() => setOp('subtract')} className={op === 'subtract' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} data-testid="op-sub"><TrendingDown size={14} className="mr-1.5" /> Düş</Button>
          </div>
          <div><Label className="text-xs">Tutar (TRY)</Label><Input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} className="mt-1 h-11" placeholder="0,00" data-testid="balance-amount-input" /></div>
          <div><Label className="text-xs">Açıklama (opsiyonel)</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="mt-1" placeholder="Sebep" data-testid="balance-reason-input" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Vazgeç</Button>
          <Button onClick={submit} disabled={busy} className="bg-[#0B2447] hover:bg-[#173A6B] text-white" data-testid="balance-submit-btn">{busy ? 'Gönderiliyor…' : 'Uygula'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const InfoDialog = ({ open, onOpenChange, user, onDone }) => {
  const [form, setForm] = useState({});
  useEffect(() => { if (open) setForm({ full_name: user.full_name, email: user.email, phone: user.phone || '', tckn: user.tckn || '' }); }, [open, user]);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try { await adminApi.userUpdateInfo(user.id, form); toast.success('Güncellendi'); onOpenChange(false); onDone && onDone(); }
    catch (e) { toast.error(e.response?.data?.detail || 'Güncellenemedi'); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Bilgileri Düzenle</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Ad Soyad</Label><Input value={form.full_name || ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1" data-testid="info-name-input" /></div>
          <div><Label className="text-xs">E-posta</Label><Input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" data-testid="info-email-input" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Telefon</Label><Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">TCKN</Label><Input value={form.tckn || ''} onChange={(e) => setForm({ ...form, tckn: e.target.value })} className="mt-1" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Vazgeç</Button>
          <Button onClick={submit} disabled={busy} className="bg-[#0B2447] hover:bg-[#173A6B] text-white" data-testid="info-save-btn">{busy ? 'Kaydediliyor…' : 'Kaydet'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PasswordDialog = ({ open, onOpenChange, userId }) => {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) { setP1(''); setP2(''); } }, [open]);
  const submit = async () => {
    if (!p1 || p1.length < 6) return toast.error('Şifre en az 6 karakter olmalı');
    if (p1 !== p2) return toast.error('Şifreler eşleşmiyor');
    setBusy(true);
    try { await adminApi.userSetPassword(userId, p1); toast.success('Şifre güncellendi'); onOpenChange(false); }
    catch (e) { toast.error(e.response?.data?.detail || 'Güncellenemedi'); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Şifre Değiştir</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Yeni Şifre</Label><Input type="password" value={p1} onChange={(e) => setP1(e.target.value)} className="mt-1" data-testid="new-password-input" /></div>
          <div><Label className="text-xs">Yeni Şifre (Tekrar)</Label><Input type="password" value={p2} onChange={(e) => setP2(e.target.value)} className="mt-1" /></div>
          <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">Bu işlem kullanıcının mevcut oturumlarını etkilemez. Kullanıcıya yeni şifresini iletmeyi unutmayın.</div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Vazgeç</Button>
          <Button onClick={submit} disabled={busy} className="bg-[#0B2447] hover:bg-[#173A6B] text-white" data-testid="password-submit-btn">{busy ? 'Güncelleniyor…' : 'Güncelle'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminUserDetail;
