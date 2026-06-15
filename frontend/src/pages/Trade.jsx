import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatTRY, formatNum, formatPct } from '../data/mock';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { SymbolBadge, stripSymbol } from './Market';

const Trade = () => {
  const { symbol } = useParams();
  const nav = useNavigate();
  const { holdings, cashBalance, buyStock, sellStock, stocks, user, refreshStocks } = useAuth();

  const decodedSymbol = symbol ? decodeURIComponent(symbol) : '';
  const [selected, setSelected] = useState(decodedSymbol || '');
  const [mode, setMode] = useState('buy');
  const [amount, setAmount] = useState('');
  const [units, setUnits] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (decodedSymbol) setSelected(decodedSymbol);
    else if (!selected && stocks.length) setSelected(stocks[0].symbol);
  }, [decodedSymbol, stocks, selected]);

  // Auto-refresh stocks every 60s
  useEffect(() => { const id = setInterval(() => refreshStocks(), 60000); return () => clearInterval(id); }, [refreshStocks]);

  const stock = useMemo(() => stocks.find((s) => s.symbol === selected), [selected, stocks]);
  const holding = holdings.find((h) => h.code === selected);
  const kycOk = user?.kyc_status === 'approved';

  const handleAmount = (v) => {
    setAmount(v);
    if (v && stock?.price) setUnits((parseFloat(v) / stock.price).toFixed(4)); else setUnits('');
  };
  const handleUnits = (v) => {
    setUnits(v);
    if (v && stock?.price) setAmount((parseFloat(v) * stock.price).toFixed(2)); else setAmount('');
  };

  const submit = async () => {
    if (!stock) return;
    const u = parseFloat(units);
    if (!u || u <= 0) return toast.error('Geçerli bir miktar girin');
    setBusy(true);
    const result = mode === 'buy' ? await buyStock(stock.symbol, u) : await sellStock(stock.symbol, u);
    setBusy(false);
    if (!result.ok) return toast.error(result.msg);
    toast.success(`${mode === 'buy' ? 'Alım' : 'Satım'} gerçekleşti`);
    setAmount(''); setUnits(''); setConfirm(false);
    setTimeout(() => nav('/portfoyum'), 700);
  };

  if (!stocks.length) return <div className="fa-card fa-glow p-8 text-center text-slate-400">Hisseler yükleniyor...</div>;
  if (!stock) return <div className="fa-card fa-glow p-8 text-center text-slate-400">Hisse bulunamadı</div>;
  const positive = (stock.change_pct || 0) >= 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Alım / Satım</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">BIST hisselerinde anında işlem (canlı fiyat).</p>
      </div>

      {!kycOk && (
        <div className="fa-card fa-glow p-4 border-l-4 border-l-amber-500 bg-amber-50/50 flex items-start gap-3">
          <ShieldAlert className="text-amber-600 shrink-0" size={20} />
          <div className="flex-1">
            <div className="font-semibold text-amber-900 text-sm">KYC Onayı Gerekli</div>
            <div className="text-xs text-amber-800 mt-0.5">İşlem yapabilmek için kimlik doğrulaması (selfie + kimlik belgesi) yapmanız gerekiyor.</div>
          </div>
          <Button size="sm" onClick={() => nav('/profil')} className="bg-amber-600 hover:bg-amber-700 text-white">KYC'yi Tamamla</Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 fa-card fa-glow p-4 sm:p-6">
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList className="grid grid-cols-2 w-full bg-slate-100">
              <TabsTrigger value="buy" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Alım</TabsTrigger>
              <TabsTrigger value="sell" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">Satım</TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="mt-5 space-y-4">
              <div>
                <Label className="text-sm">Hisse Seçimi</Label>
                <Select value={selected} onValueChange={(v) => { setSelected(v); setAmount(''); setUnits(''); }}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stocks.map((s) => (
                      <SelectItem key={s.symbol} value={s.symbol}>BIST: {stripSymbol(s.symbol)} — {s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-sm">Tutar (TRY)</Label>
                  <Input className="mt-1.5 h-11" type="number" inputMode="decimal" value={amount} onChange={(e) => handleAmount(e.target.value)} placeholder="0,00" />
                </div>
                <div>
                  <Label className="text-sm">Lot Adedi</Label>
                  <Input className="mt-1.5 h-11" type="number" inputMode="decimal" value={units} onChange={(e) => handleUnits(e.target.value)} placeholder="0,0000" />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[25, 50, 75, 100].map((p) => (
                  <button key={p} onClick={() => handleAmount(((cashBalance * p) / 100).toFixed(2))} className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700">{p === 100 ? 'Tümü' : `%${p}`}</button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="sell" className="mt-5 space-y-4">
              <div>
                <Label className="text-sm">Satılacak Hisse</Label>
                <Select value={selected} onValueChange={(v) => { setSelected(v); setAmount(''); setUnits(''); }}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {holdings.length === 0 && <div className="px-3 py-2 text-sm text-slate-400">Pozisyonunuz yok</div>}
                    {holdings.map((h) => (
                      <SelectItem key={h.code} value={h.code}>BIST: {stripSymbol(h.code)} — {h.name} ({formatNum(h.units, 2)} lot)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-sm">Tutar (TRY)</Label>
                  <Input className="mt-1.5 h-11" type="number" inputMode="decimal" value={amount} onChange={(e) => handleAmount(e.target.value)} placeholder="0,00" />
                </div>
                <div>
                  <Label className="text-sm">Lot Adedi</Label>
                  <Input className="mt-1.5 h-11" type="number" inputMode="decimal" value={units} onChange={(e) => handleUnits(e.target.value)} placeholder="0,0000" />
                </div>
              </div>
              {holding && (
                <div className="flex gap-2 flex-wrap">
                  {[25, 50, 75, 100].map((p) => (
                    <button key={p} onClick={() => handleUnits(((holding.units * p) / 100).toFixed(4))} className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700">{p === 100 ? 'Tümü' : `%${p}`}</button>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-6 border-t border-slate-100 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Güncel fiyat</span><span className="font-semibold text-[#0B2447]">{stock.price ? formatNum(stock.price, 4) : '...'} TRY</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Tahmini tutar</span><span className="font-semibold text-[#0B2447]">{formatTRY(parseFloat(amount || 0))}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Komisyon (demo)</span><span className="font-semibold text-emerald-600">Ücretsiz</span></div>
          </div>

          {!confirm ? (
            <Button onClick={() => {
              if (!units || parseFloat(units) <= 0) return toast.error('Miktar girin');
              if (!kycOk) return toast.error('KYC onayı gerekli');
              setConfirm(true);
            }} disabled={!kycOk} className={`w-full mt-5 h-11 text-white font-semibold ${mode === 'buy' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}>
              {mode === 'buy' ? 'Al Emri Ver' : 'Sat Emri Ver'}
            </Button>
          ) : (
            <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2 mb-3">
                <AlertCircle size={16} className="text-amber-600 mt-0.5" />
                <p className="text-sm text-amber-800">{units} lot {stripSymbol(stock.symbol)} {mode === 'buy' ? `alarak ${formatTRY(parseFloat(amount))} ödemek` : `satarak ${formatTRY(parseFloat(amount))} alım yapmak`} istediğinizi onaylıyor musunuz?</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setConfirm(false)} disabled={busy}>Vazgeç</Button>
                <Button onClick={submit} disabled={busy} className={`flex-1 text-white ${mode === 'buy' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}><CheckCircle2 size={16} className="mr-1" /> {busy ? 'Gönderiliyor...' : 'Onayla'}</Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="fa-card fa-glow p-5">
            <div className="flex items-center gap-2 mb-2"><SymbolBadge symbol={stock.symbol} market="BIST" /></div>
            <div className="font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>{stock.name}</div>
            <div className="text-xs text-slate-500 mb-3">{stock.category}</div>
            <div className="text-2xl font-extrabold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>{formatNum(stock.price, 4)} <span className="text-sm font-medium text-slate-400">TRY</span></div>
            <div className={`text-sm font-semibold ${positive ? 'fa-positive' : 'fa-negative'}`}>{formatPct(stock.change_pct)} bugün</div>
          </div>
          <div className="fa-card fa-glow p-5">
            <div className="text-xs text-slate-500 mb-2">Kullanılabilir Bakiye</div>
            <div className="text-xl font-bold text-emerald-600" style={{ fontFamily: 'Manrope' }}>{formatTRY(cashBalance)}</div>
            {holding && (
              <>
                <div className="text-xs text-slate-500 mt-4 mb-2">{stripSymbol(stock.symbol)} Pozisyonum</div>
                <div className="text-base font-semibold text-[#0B2447]">{formatNum(holding.units, 2)} lot</div>
                <div className="text-xs text-slate-500">Değer: {formatTRY(holding.units * (stock.price || 0))}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trade;
