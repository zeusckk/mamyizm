import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus, Edit, Trash2, RefreshCw, Wallet, Building2, Copy } from 'lucide-react';
import { toast } from 'sonner';

const emptyBank = { type: 'bank', label: '', bank_name: '', account_holder: '', iban: '', account_number: '', branch: '', active: true, notes: '' };
const emptyCrypto = { type: 'crypto', label: '', currency: 'USDT', network: 'TRC20', address: '', memo: '', active: true, notes: '' };

const NETWORKS = ['TRC20', 'ERC20', 'BEP20', 'Bitcoin', 'Polygon', 'Solana'];
const CURRENCIES = ['USDT', 'USDC', 'BTC', 'ETH', 'BNB', 'TRX', 'SOL'];

const AdminPaymentMethods = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setItems(await adminApi.listPaymentMethods()); }
    catch (e) { toast.error('Ödeme yöntemleri alınamadı'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!edit.label) return toast.error('Etiket zorunlu');
    if (edit.type === 'bank' && (!edit.iban || !edit.account_holder)) return toast.error('IBAN ve hesap sahibi zorunlu');
    if (edit.type === 'crypto' && !edit.address) return toast.error('Cüzdan adresi zorunlu');
    const payload = { ...edit };
    delete payload.id; delete payload.created_at;
    try {
      if (edit.id) await adminApi.updatePaymentMethod(edit.id, payload);
      else await adminApi.createPaymentMethod(payload);
      toast.success(edit.id ? 'Güncellendi' : 'Eklendi');
      setEdit(null); load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Kaydedilemedi'); }
  };

  const remove = async (it) => {
    if (!window.confirm(`"${it.label}" silinsin mi?`)) return;
    try { await adminApi.deletePaymentMethod(it.id); toast.success('Silindi'); load(); }
    catch (e) { toast.error('Silinemedi'); }
  };

  const toggleActive = async (it) => {
    try {
      await adminApi.updatePaymentMethod(it.id, { ...it, active: !it.active });
      load();
    } catch { toast.error('Güncellenemedi'); }
  };

  const copy = (v) => { navigator.clipboard.writeText(v); toast.success('Kopyalandı'); };

  const banks = items.filter((x) => x.type === 'bank');
  const cryptos = items.filter((x) => x.type === 'crypto');

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="admin-payment-methods-page">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Ödeme Yöntemleri</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">{items.length} aktif/pasif yöntem · Kullanıcılar para yatırırken bu hesapları görür.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw size={13} className="mr-1.5" /> Yenile</Button>
          <Button onClick={() => setEdit({ ...emptyBank })} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="add-bank-btn"><Plus size={14} className="mr-1" /> Banka Hesabı</Button>
          <Button onClick={() => setEdit({ ...emptyCrypto })} className="bg-amber-600 hover:bg-amber-700 text-white" data-testid="add-crypto-btn"><Plus size={14} className="mr-1" /> Kripto Adres</Button>
        </div>
      </div>

      {loading && <div className="fa-card fa-glow p-6 text-center text-slate-400">Yükleniyor…</div>}

      {!loading && (
        <>
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2"><Building2 size={14} /> Banka Hesapları ({banks.length})</h2>
            {banks.length === 0 && <div className="fa-card fa-glow p-6 text-center text-slate-400 text-sm">Banka hesabı eklenmemiş.</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {banks.map((b) => (
                <div key={b.id} className={`fa-card fa-glow p-4 ${!b.active ? 'opacity-60' : ''}`} data-testid={`pm-bank-${b.id}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">{b.bank_name || 'Banka'}</div>
                      <div className="font-bold text-[#0B2447] text-base">{b.label}</div>
                    </div>
                    <Switch checked={!!b.active} onCheckedChange={() => toggleActive(b)} />
                  </div>
                  <div className="space-y-1 text-sm mt-2 border-t border-slate-100 pt-3">
                    <div className="flex justify-between"><span className="text-slate-500">Hesap Sahibi</span><span className="font-semibold text-[#0B2447]">{b.account_holder}</span></div>
                    <div className="flex justify-between gap-2"><span className="text-slate-500">IBAN</span><span className="font-mono text-xs text-[#0B2447] truncate cursor-pointer" onClick={() => copy(b.iban)} title="Kopyala">{b.iban}</span></div>
                    {b.branch && <div className="flex justify-between"><span className="text-slate-500">Şube</span><span className="text-slate-700">{b.branch}</span></div>}
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <Button size="sm" variant="outline" onClick={() => setEdit({ ...b })} className="flex-1"><Edit size={13} className="mr-1" /> Düzenle</Button>
                    <Button size="sm" variant="outline" onClick={() => remove(b)} className="text-red-600 border-red-200 hover:bg-red-50"><Trash2 size={13} /></Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2"><Wallet size={14} /> Kripto Adresler ({cryptos.length})</h2>
            {cryptos.length === 0 && <div className="fa-card fa-glow p-6 text-center text-slate-400 text-sm">Kripto adres eklenmemiş.</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cryptos.map((c) => (
                <div key={c.id} className={`fa-card fa-glow p-4 ${!c.active ? 'opacity-60' : ''}`} data-testid={`pm-crypto-${c.id}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-xs text-amber-600 uppercase font-bold tracking-wider mb-0.5">{c.currency} · {c.network}</div>
                      <div className="font-bold text-[#0B2447] text-base">{c.label}</div>
                    </div>
                    <Switch checked={!!c.active} onCheckedChange={() => toggleActive(c)} />
                  </div>
                  <div className="space-y-1 text-sm mt-2 border-t border-slate-100 pt-3">
                    <div>
                      <div className="text-slate-500 text-xs mb-1">Cüzdan Adresi</div>
                      <div className="flex items-center gap-1 bg-slate-50 px-2 py-1.5 rounded font-mono text-[11px] text-[#0B2447] break-all" onClick={() => copy(c.address)}>
                        <span className="flex-1">{c.address}</span>
                        <Copy size={12} className="text-slate-400 cursor-pointer shrink-0" />
                      </div>
                    </div>
                    {c.memo && <div className="flex justify-between"><span className="text-slate-500">Memo</span><span className="font-mono text-xs">{c.memo}</span></div>}
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <Button size="sm" variant="outline" onClick={() => setEdit({ ...c })} className="flex-1"><Edit size={13} className="mr-1" /> Düzenle</Button>
                    <Button size="sm" variant="outline" onClick={() => remove(c)} className="text-red-600 border-red-200 hover:bg-red-50"><Trash2 size={13} /></Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{edit?.id ? 'Yöntemi Düzenle' : edit?.type === 'bank' ? 'Yeni Banka Hesabı' : 'Yeni Kripto Adres'}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div><Label className="text-xs">Etiket (kullanıcıya görünecek)</Label><Input value={edit.label} onChange={(e) => setEdit({ ...edit, label: e.target.value })} className="mt-1" placeholder={edit.type === 'bank' ? 'Garanti BBVA' : 'USDT TRC20'} data-testid="pm-label-input" /></div>

              {edit.type === 'bank' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Banka Adı</Label><Input value={edit.bank_name || ''} onChange={(e) => setEdit({ ...edit, bank_name: e.target.value })} className="mt-1" /></div>
                    <div><Label className="text-xs">Şube</Label><Input value={edit.branch || ''} onChange={(e) => setEdit({ ...edit, branch: e.target.value })} className="mt-1" /></div>
                  </div>
                  <div><Label className="text-xs">Hesap Sahibi</Label><Input value={edit.account_holder || ''} onChange={(e) => setEdit({ ...edit, account_holder: e.target.value })} className="mt-1" data-testid="pm-holder-input" /></div>
                  <div><Label className="text-xs">IBAN</Label><Input value={edit.iban || ''} onChange={(e) => setEdit({ ...edit, iban: e.target.value })} className="mt-1 font-mono" placeholder="TR12 0006 …" data-testid="pm-iban-input" /></div>
                  <div><Label className="text-xs">Hesap No (opsiyonel)</Label><Input value={edit.account_number || ''} onChange={(e) => setEdit({ ...edit, account_number: e.target.value })} className="mt-1" /></div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Coin</Label>
                      <Select value={edit.currency || 'USDT'} onValueChange={(v) => setEdit({ ...edit, currency: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label className="text-xs">Ağ</Label>
                      <Select value={edit.network || 'TRC20'} onValueChange={(v) => setEdit({ ...edit, network: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{NETWORKS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label className="text-xs">Cüzdan Adresi</Label><Input value={edit.address || ''} onChange={(e) => setEdit({ ...edit, address: e.target.value })} className="mt-1 font-mono" data-testid="pm-address-input" /></div>
                  <div><Label className="text-xs">Memo / Tag (opsiyonel)</Label><Input value={edit.memo || ''} onChange={(e) => setEdit({ ...edit, memo: e.target.value })} className="mt-1" /></div>
                </>
              )}

              <div><Label className="text-xs">Not (opsiyonel)</Label><Textarea value={edit.notes || ''} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} className="mt-1" rows={2} /></div>

              <div className="flex items-center gap-2 pt-2">
                <Switch checked={!!edit.active} onCheckedChange={(v) => setEdit({ ...edit, active: v })} />
                <span className="text-sm">Aktif (kullanıcılar görür)</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Vazgeç</Button>
            <Button onClick={save} className="bg-[#0B2447] hover:bg-[#173A6B] text-white" data-testid="pm-save-btn">Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPaymentMethods;
