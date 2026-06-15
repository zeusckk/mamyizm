import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatTRY } from '../data/mock';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { ArrowDownToLine, ArrowUpFromLine, Building2, CreditCard } from 'lucide-react';

const AccountSummary = () => {
  const { user, cashBalance, depositCash, withdrawCash, transactions, holdings } = useAuth();
  const [depAmt, setDepAmt] = useState('');
  const [wdAmt, setWdAmt] = useState('');
  const [depOpen, setDepOpen] = useState(false);
  const [wdOpen, setWdOpen] = useState(false);

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

  const handleDeposit = () => {
    const a = parseFloat(depAmt);
    if (!a || a <= 0) return toast.error('Geçerli tutar girin');
    depositCash(a);
    toast.success(`${formatTRY(a)} hesabınıza eklendi`);
    setDepAmt(''); setDepOpen(false);
  };
  const handleWithdraw = () => {
    const a = parseFloat(wdAmt);
    if (!a || a <= 0) return toast.error('Geçerli tutar girin');
    const r = withdrawCash(a);
    if (!r.ok) return toast.error(r.msg);
    toast.success(`${formatTRY(a)} çekildi`);
    setWdAmt(''); setWdOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Hesap Özeti</h1>
        <p className="text-slate-500 text-sm mt-1">Bakiyenizi yönetin, para yatırın veya çekin.</p>
      </div>

      <div className="fa-card fa-glow p-6 fa-gradient-navy text-white relative overflow-hidden">
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
          <div>
            <div className="text-xs text-blue-200 uppercase tracking-wider mb-2">Kullanılabilir Nakit Bakiye</div>
            <div className="text-4xl font-extrabold" style={{ fontFamily: 'Manrope' }}>{formatTRY(cashBalance)}</div>
            <div className="text-xs text-blue-200 mt-2">Hesap Sahibi: {user?.full_name}</div>
          </div>
          <div className="flex gap-2">
            <Dialog open={depOpen} onOpenChange={setDepOpen}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white"><ArrowDownToLine size={15} className="mr-1.5" /> Para Yatır</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Para Yatırma</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label className="text-sm">Tutar (TRY)</Label>
                    <Input type="number" value={depAmt} onChange={(e) => setDepAmt(e.target.value)} placeholder="0,00" className="mt-1.5 h-11" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[500, 1000, 5000, 10000].map((q) => (
                      <button key={q} onClick={() => setDepAmt(String(q))} className="px-3 py-1.5 text-xs rounded-md bg-slate-100 hover:bg-slate-200">{formatTRY(q)}</button>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg flex items-start gap-2">
                    <Building2 size={14} className="mt-0.5" />
                    <span>Demo modunda her tutar onaylanır. Gerçek senaryoda IBAN üzerinden EFT/Havale yapılır.</span>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDepOpen(false)}>Vazgeç</Button>
                  <Button onClick={handleDeposit} className="bg-emerald-600 hover:bg-emerald-700 text-white">Yatır</Button>
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
