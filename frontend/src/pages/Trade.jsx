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
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const Trade = () => {
  const { code } = useParams();
  const nav = useNavigate();
  const { holdings, cashBalance, buyFund, sellFund, funds } = useAuth();

  const [selected, setSelected] = useState(code || '');
  const [mode, setMode] = useState('buy');
  const [amount, setAmount] = useState(''); // TRY amount
  const [units, setUnits] = useState('');
  const [confirm, setConfirm] = useState(false);

  useEffect(() => { if (code) setSelected(code); else if (!selected && funds.length) setSelected(funds[0].code); }, [code, funds, selected]);

  const fund = useMemo(() => funds.find((f) => f.code === selected), [selected, funds]);
  const holding = holdings.find((h) => h.code === selected);

  const handleAmount = (v) => {
    setAmount(v);
    if (v && fund) setUnits((parseFloat(v) / fund.price).toFixed(4));
    else setUnits('');
  };
  const handleUnits = (v) => {
    setUnits(v);
    if (v && fund) setAmount((parseFloat(v) * fund.price).toFixed(2));
    else setAmount('');
  };

  const submit = () => {
    if (!fund) return;
    const u = parseFloat(units);
    if (!u || u <= 0) return toast.error('Geçerli bir miktar girin');
    const result = mode === 'buy' ? buyFund(fund, u) : sellFund(fund, u);
    if (!result.ok) return toast.error(result.msg);
    toast.success(`${mode === 'buy' ? 'Alım' : 'Satım'} gerçekleşti`);
    setAmount(''); setUnits(''); setConfirm(false);
    setTimeout(() => nav('/portfoyum'), 600);
  };

  if (!fund) return null;
  const positive = fund.change_24h >= 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Alım / Satım</h1>
        <p className="text-slate-500 text-sm mt-1">Hemen işlem yapın; emir anında gerçekleşir (demo).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 fa-card fa-glow p-6">
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList className="grid grid-cols-2 w-full bg-slate-100">
              <TabsTrigger value="buy" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Alım</TabsTrigger>
              <TabsTrigger value="sell" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">Satım</TabsTrigger>
            </TabsList>
            <TabsContent value="buy" className="mt-6 space-y-5">
              <div>
                <Label className="text-sm">Fon Seçimi</Label>
                <Select value={selected} onValueChange={(v) => { setSelected(v); setAmount(''); setUnits(''); }}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {funds.map((f) => (
                      <SelectItem key={f.code} value={f.code}>{f.code} — {f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Tutar (TRY)</Label>
                  <Input className="mt-1.5 h-11" type="number" value={amount} onChange={(e) => handleAmount(e.target.value)} placeholder="0,00" />
                </div>
                <div>
                  <Label className="text-sm">Pay Adedi</Label>
                  <Input className="mt-1.5 h-11" type="number" value={units} onChange={(e) => handleUnits(e.target.value)} placeholder="0,0000" />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[25, 50, 75, 100].map((p) => (
                  <button key={p} onClick={() => handleAmount(((cashBalance * p) / 100).toFixed(2))} className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700">{p === 100 ? 'Tümü' : `%${p}`}</button>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="sell" className="mt-6 space-y-5">
              <div>
                <Label className="text-sm">Satılacak Fon</Label>
                <Select value={selected} onValueChange={(v) => { setSelected(v); setAmount(''); setUnits(''); }}>
                  <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {holdings.length === 0 && <div className="px-3 py-2 text-sm text-slate-400">Pozisyonunuz yok</div>}
                    {holdings.map((h) => {
                      const f = funds.find((x) => x.code === h.code);
                      return <SelectItem key={h.code} value={h.code}>{h.code} — {f?.name} ({formatNum(h.units, 2)} pay)</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Tutar (TRY)</Label>
                  <Input className="mt-1.5 h-11" type="number" value={amount} onChange={(e) => handleAmount(e.target.value)} placeholder="0,00" />
                </div>
                <div>
                  <Label className="text-sm">Pay Adedi</Label>
                  <Input className="mt-1.5 h-11" type="number" value={units} onChange={(e) => handleUnits(e.target.value)} placeholder="0,0000" />
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
            <div className="flex justify-between"><span className="text-slate-500">Güncel fiyat</span><span className="font-semibold text-[#0B2447]">{fund.price.toFixed(4)} TRY</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Tahmini tutar</span><span className="font-semibold text-[#0B2447]">{formatTRY(parseFloat(amount || 0))}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Komisyon (demo)</span><span className="font-semibold text-emerald-600">Ücretsiz</span></div>
          </div>

          {!confirm ? (
            <Button onClick={() => {
              if (!units || parseFloat(units) <= 0) return toast.error('Miktar girin');
              setConfirm(true);
            }} className={`w-full mt-5 h-11 text-white font-semibold ${mode === 'buy' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
              {mode === 'buy' ? 'Al Emri Ver' : 'Sat Emri Ver'}
            </Button>
          ) : (
            <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2 mb-3">
                <AlertCircle size={16} className="text-amber-600 mt-0.5" />
                <p className="text-sm text-amber-800">{mode === 'buy' ? `${units} pay ${fund.code} alarak ${formatTRY(parseFloat(amount))} ödemek istediğinizi onaylıyor musunuz?` : `${units} pay ${fund.code} satarak ${formatTRY(parseFloat(amount))} alım yapacağınızı onaylıyor musunuz?`}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setConfirm(false)}>Vazgeç</Button>
                <Button onClick={submit} className={`flex-1 text-white ${mode === 'buy' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}><CheckCircle2 size={16} className="mr-1" /> Onayla</Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="fa-card fa-glow p-5">
            <div className="text-xs text-slate-500 mb-1">Seçili Fon</div>
            <div className="font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>{fund.name}</div>
            <div className="text-xs text-slate-500 mb-3">{fund.category_label}</div>
            <div className="text-2xl font-extrabold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>{fund.price.toFixed(4)} <span className="text-sm font-medium text-slate-400">TRY</span></div>
            <div className={`text-sm font-semibold ${positive ? 'fa-positive' : 'fa-negative'}`}>{formatPct(fund.change_24h)} bugün</div>
          </div>
          <div className="fa-card fa-glow p-5">
            <div className="text-xs text-slate-500 mb-2">Kullanılabilir Bakiye</div>
            <div className="text-xl font-bold text-emerald-600" style={{ fontFamily: 'Manrope' }}>{formatTRY(cashBalance)}</div>
            {holding && (
              <>
                <div className="text-xs text-slate-500 mt-4 mb-2">{fund.code} Pozisyonum</div>
                <div className="text-base font-semibold text-[#0B2447]">{formatNum(holding.units, 2)} pay</div>
                <div className="text-xs text-slate-500">Değer: {formatTRY(holding.units * fund.price)}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trade;
