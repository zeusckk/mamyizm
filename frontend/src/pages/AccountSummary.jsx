import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatTRY } from '../data/mock';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { toast } from 'sonner';
import { ArrowDownToLine, ArrowUpFromLine, Building2, CreditCard, Wallet, Copy, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { paymentMethodsApi, depositRequestsApi } from '../api/client';

const statusUI = (s) => ({
  pending: { l: 'Beklemede', c: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  approved: { l: 'Onaylandı', c: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  rejected: { l: 'Reddedildi', c: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
}[s] || { l: s, c: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock });

const AccountSummary = () => {
  const { user, cashBalance, depositCash, withdrawCash, transactions, holdings } = useAuth();
  const [depAmt, setDepAmt] = useState('');
  const [wdAmt, setWdAmt] = useState('');
  const [depOpen, setDepOpen] = useState(false);
  const [wdOpen, setWdOpen] = useState(false);

  const [pms, setPms] = useState([]);
  const [selectedPm, setSelectedPm] = useState(null);
  const [senderName, setSenderName] = useState('');
  const [note, setNote] = useState('');
  const [txHash, setTxHash] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const monthly = useMemo(() => {
    const now = new Date();
    const m = transactions.filter((t) => {
      const d = new Date(t.date.split(' ')[0]);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const dep = m.filter((t) => t.type === 'Para Yatırma').reduce((s, t) => s + t.total, 0);
    const wd = m.filter((t) => t.type === 'Para Çekme').reduce((s, t) => s + Math.abs(t.total), 0);
    const buy = m.filter((t) => t.type === 'Alım').reduce((s, t) => s + t.total, 0);
    const sell = m.filter((t) => t.type === 'Satım').reduce((s, t) => s + t.total, 0);
    return { dep, wd, buy, sell };
  }, [transactions]);

  const loadPms = async () => {
    try { setPms(await paymentMethodsApi.listActive()); } catch { /* silent */ }
  };
  const loadRequests = async () => {
    try { setMyRequests(await depositRequestsApi.myList()); } catch { /* silent */ }
  };

  useEffect(() => {
    loadPms();
    loadRequests();
    setSenderName(user?.full_name || '');
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (depOpen) { loadPms(); }
  }, [depOpen]);

  const banks = pms.filter((p) => p.type === 'bank');
  const cryptos = pms.filter((p) => p.type === 'crypto');

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error('Dosya 5 MB üzeri olamaz');
    const reader = new FileReader();
    reader.onload = () => setReceipt(reader.result);
    reader.readAsDataURL(f);
  };

  const copy = (v) => { navigator.clipboard.writeText(v); toast.success('Kopyalandı'); };

  const handleDeposit = async () => {
    const a = parseFloat(depAmt);
    if (!a || a <= 0) return toast.error('Geçerli tutar girin');
    if (!selectedPm) return toast.error('Bir ödeme yöntemi seçin');
    setSubmitting(true);
    const r = await depositCash({
      amount: a,
      payment_method_id: selectedPm.id,
      sender_name: senderName,
      note: note || undefined,
      tx_hash: selectedPm.type === 'crypto' ? (txHash || undefined) : undefined,
      receipt_base64: receipt || undefined,
    });
    setSubmitting(false);
    if (!r.ok) return toast.error(r.msg);
    toast.success('Talebiniz alındı. Yönetici onayı bekleniyor.');
    setDepAmt(''); setSelectedPm(null); setNote(''); setTxHash(''); setReceipt(null);
    setDepOpen(false);
    loadRequests();
  };

  const handleWithdraw = async () => {
    const a = parseFloat(wdAmt);
    if (!a || a <= 0) return toast.error('Geçerli tutar girin');
    const r = await withdrawCash(a);
    if (!r.ok) return toast.error(r.msg);
    toast.success(`${formatTRY(a)} çekildi`);
    setWdAmt(''); setWdOpen(false);
  };

  return (
    <div className="space-y-6" data-testid="account-summary-page">
      <div>
        <h1 className="text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Hesap Özeti</h1>
        <p className="text-slate-500 text-sm mt-1">Bakiyenizi yönetin, para yatırın veya çekin.</p>
      </div>

      <div className="fa-card fa-glow p-6 fa-gradient-navy text-white relative overflow-hidden">
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
          <div>
            <div className="text-xs text-blue-200 uppercase tracking-wider mb-2">Kullanılabilir Nakit Bakiye</div>
            <div className="text-4xl font-extrabold" style={{ fontFamily: 'Manrope' }} data-testid="cash-balance">{formatTRY(cashBalance)}</div>
            <div className="text-xs text-blue-200 mt-2">Hesap Sahibi: {user?.full_name}</div>
          </div>
          <div className="flex gap-2">
            <Dialog open={depOpen} onOpenChange={setDepOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" data-testid="open-deposit-btn"><ArrowDownToLine size={15} className="mr-1.5" /> Para Yatır</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Para Yatırma Talebi</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 rounded-lg flex gap-2">
                    <Building2 size={16} className="mt-0.5 shrink-0" />
                    <span>Aşağıdaki hesaplardan birine transfer yapın, dekontu veya işlem hash'ini yükleyin. Yönetici onayından sonra bakiyeniz yüklenecektir.</span>
                  </div>

                  <Tabs defaultValue="bank">
                    <TabsList className="grid grid-cols-2 w-full">
                      <TabsTrigger value="bank" data-testid="tab-bank"><Building2 size={14} className="mr-1.5" /> Banka ({banks.length})</TabsTrigger>
                      <TabsTrigger value="crypto" data-testid="tab-crypto"><Wallet size={14} className="mr-1.5" /> Kripto ({cryptos.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="bank" className="space-y-2 mt-3">
                      {banks.length === 0 && <div className="text-center text-slate-400 text-sm py-6">Şu an aktif banka hesabı yok.</div>}
                      {banks.map((b) => (
                        <button key={b.id} onClick={() => setSelectedPm(b)} className={`w-full text-left fa-card p-3 transition border ${selectedPm?.id === b.id ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-slate-300'}`} data-testid={`pm-bank-${b.id}`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-bold text-[#0B2447]">{b.label}</div>
                            <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{b.bank_name}</span>
                          </div>
                          <div className="text-xs text-slate-600">{b.account_holder}</div>
                          <div className="flex items-center justify-between mt-1.5 gap-2">
                            <span className="font-mono text-xs text-[#0B2447] truncate">{b.iban}</span>
                            <button onClick={(e) => { e.stopPropagation(); copy(b.iban); }} className="text-slate-400 hover:text-[#0B2447] shrink-0"><Copy size={13} /></button>
                          </div>
                        </button>
                      ))}
                    </TabsContent>

                    <TabsContent value="crypto" className="space-y-2 mt-3">
                      {cryptos.length === 0 && <div className="text-center text-slate-400 text-sm py-6">Şu an aktif kripto adres yok.</div>}
                      {cryptos.map((c) => (
                        <button key={c.id} onClick={() => setSelectedPm(c)} className={`w-full text-left fa-card p-3 transition border ${selectedPm?.id === c.id ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-200 hover:border-slate-300'}`} data-testid={`pm-crypto-${c.id}`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-bold text-[#0B2447]">{c.label}</div>
                            <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-50 text-amber-700 px-2 py-0.5 rounded">{c.currency} · {c.network}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded mt-1.5">
                            <span className="font-mono text-[10px] text-[#0B2447] truncate flex-1">{c.address}</span>
                            <button onClick={(e) => { e.stopPropagation(); copy(c.address); }} className="text-slate-400 hover:text-[#0B2447] shrink-0"><Copy size={12} /></button>
                          </div>
                          {c.memo && <div className="text-[11px] text-slate-500 mt-1">Memo: <span className="font-mono">{c.memo}</span></div>}
                        </button>
                      ))}
                    </TabsContent>
                  </Tabs>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <Label className="text-xs">Tutar (TRY)</Label>
                      <Input type="number" value={depAmt} onChange={(e) => setDepAmt(e.target.value)} placeholder="0,00" className="mt-1.5 h-10" data-testid="deposit-amount-input" />
                    </div>
                    <div>
                      <Label className="text-xs">Gönderen Adı</Label>
                      <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} className="mt-1.5 h-10" data-testid="sender-name-input" />
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {[500, 1000, 5000, 10000].map((q) => (
                      <button key={q} type="button" onClick={() => setDepAmt(String(q))} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 hover:bg-slate-200">{formatTRY(q)}</button>
                    ))}
                  </div>

                  {selectedPm?.type === 'crypto' && (
                    <div>
                      <Label className="text-xs">İşlem Hash (TX Hash)</Label>
                      <Input value={txHash} onChange={(e) => setTxHash(e.target.value)} className="mt-1.5 h-10 font-mono text-xs" placeholder="0x..." data-testid="tx-hash-input" />
                    </div>
                  )}

                  <div>
                    <Label className="text-xs">Not (opsiyonel)</Label>
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="mt-1.5" rows={2} placeholder="Ek bilgi..." />
                  </div>

                  <div>
                    <Label className="text-xs">Dekont / Ekran Görüntüsü (opsiyonel, maks 5 MB)</Label>
                    <Input type="file" accept="image/*" onChange={onFile} className="mt-1.5" data-testid="receipt-input" />
                    {receipt && <img src={receipt} alt="Önizleme" className="mt-2 rounded border max-h-32" />}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDepOpen(false)}>Vazgeç</Button>
                  <Button onClick={handleDeposit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="submit-deposit-btn">
                    {submitting ? 'Gönderiliyor…' : 'Talep Gönder'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={wdOpen} onOpenChange={setWdOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"><ArrowUpFromLine size={15} className="mr-1.5" /> Para Çek</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Para Çekme</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label className="text-sm">Tutar (TRY)</Label>
                    <Input type="number" value={wdAmt} onChange={(e) => setWdAmt(e.target.value)} placeholder="0,00" className="mt-1.5 h-11" />
                    <div className="text-xs text-slate-500 mt-1">Kullanılabilir: <span className="font-semibold text-[#0B2447]">{formatTRY(cashBalance)}</span></div>
                  </div>
                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg flex items-start gap-2">
                    <CreditCard size={14} className="mt-0.5" />
                    <span>Tanımlı IBAN: {user?.iban_masked || 'TR** **** ****'}</span>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setWdOpen(false)}>Vazgeç</Button>
                  <Button onClick={handleWithdraw} className="bg-[#0B2447] hover:bg-[#173A6B] text-white">Çek</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* My deposit requests */}
      {myRequests.length > 0 && (
        <div className="fa-card fa-glow p-5">
          <h3 className="font-bold text-[#0B2447] mb-3 flex items-center gap-2" style={{ fontFamily: 'Manrope' }}>
            <Clock size={16} /> Yatırım Taleplerim
          </h3>
          <div className="space-y-2" data-testid="my-deposit-requests">
            {myRequests.slice(0, 8).map((r) => {
              const st = statusUI(r.status);
              const Icon = st.icon;
              return (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="font-semibold text-[#0B2447] text-sm">{formatTRY(r.amount)} · {r.payment_method_label}</div>
                    <div className="text-[11px] text-slate-500">{r.created_at && new Date(r.created_at).toLocaleString('tr-TR')}</div>
                    {r.rejection_reason && <div className="text-[11px] text-red-600 mt-0.5">Ret nedeni: {r.rejection_reason}</div>}
                  </div>
                  <span className={`text-[11px] px-2 py-1 rounded font-bold border flex items-center gap-1 ${st.c}`}>
                    <Icon size={12} /> {st.l}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-bold text-[#0B2447] mb-3" style={{ fontFamily: 'Manrope' }}>Bu Ayın Özeti</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { l: 'Yatırılan', v: monthly.dep, c: 'text-emerald-600' },
            { l: 'Çekilen', v: monthly.wd, c: 'text-amber-600' },
            { l: 'Alım Tutarı', v: monthly.buy, c: 'text-[#0B2447]' },
            { l: 'Satım Tutarı', v: monthly.sell, c: 'text-[#0B2447]' },
          ].map((s) => (
            <div key={s.l} className="fa-card fa-glow p-5">
              <div className="text-xs text-slate-500 mb-1">{s.l}</div>
              <div className={`text-xl font-bold ${s.c}`} style={{ fontFamily: 'Manrope' }}>{formatTRY(s.v)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="fa-card fa-glow p-6">
        <h3 className="font-bold text-[#0B2447] mb-4" style={{ fontFamily: 'Manrope' }}>Hesap Bilgileri</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {[
            ['Ad Soyad', user?.full_name],
            ['E-posta', user?.email],
            ['Telefon', user?.phone],
            ['IBAN', user?.iban_masked],
            ['Aktif Pozisyon', `${holdings.length} fon`],
            ['Toplam Yatırım', formatTRY(user?.total_deposits)],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500">{l}</span>
              <span className="font-semibold text-[#0B2447]">{v || '-'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountSummary;
