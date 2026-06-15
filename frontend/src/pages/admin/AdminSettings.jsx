import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const AdminSettings = () => {
  const [s, setS] = useState(null);
  const [orig, setOrig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await adminApi.settings(); setS(r); setOrig(JSON.stringify(r)); } catch (e) { toast.error('Ayarlar alınamadı'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await adminApi.updateSettings({
        commission_rate: parseFloat(s.commission_rate) || 0,
        min_trade_amount: parseFloat(s.min_trade_amount) || 0,
        max_trade_amount: parseFloat(s.max_trade_amount) || 0,
        min_deposit: parseFloat(s.min_deposit) || 0,
        max_withdraw: parseFloat(s.max_withdraw) || 0,
        maintenance_mode: !!s.maintenance_mode,
        announcement: s.announcement || '',
      });
      setS(r); setOrig(JSON.stringify(r));
      toast.success('Ayarlar kaydedildi');
    } catch (e) { toast.error(e.response?.data?.detail || 'Kaydedilemedi'); }
    finally { setSaving(false); }
  };

  if (loading || !s) return <div className="fa-card fa-glow p-8 text-center text-slate-400">Yükleniyor…</div>;
  const dirty = JSON.stringify(s) !== orig;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Sistem Ayarları</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Komisyon, limit ve duyuruları yönetin.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw size={13} className="mr-1.5" /> Yenile</Button>
          <Button onClick={save} disabled={!dirty || saving} className="bg-[#0B2447] hover:bg-[#173A6B] text-white"><Save size={13} className="mr-1.5" /> {saving ? 'Kaydediliyor…' : 'Kaydet'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="fa-card fa-glow p-5">
          <h3 className="font-bold text-[#0B2447] mb-4" style={{ fontFamily: 'Manrope' }}>İşlem Ayarları</h3>
          <div className="space-y-4">
            <div><Label className="text-sm">Komisyon Oranı (% — 0 = ücretsiz)</Label><Input type="number" step="0.01" value={s.commission_rate} onChange={(e) => setS({ ...s, commission_rate: e.target.value })} className="mt-1.5 h-11" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm">Min. İşlem (TL)</Label><Input type="number" value={s.min_trade_amount} onChange={(e) => setS({ ...s, min_trade_amount: e.target.value })} className="mt-1.5 h-11" /></div>
              <div><Label className="text-sm">Maks. İşlem (TL)</Label><Input type="number" value={s.max_trade_amount} onChange={(e) => setS({ ...s, max_trade_amount: e.target.value })} className="mt-1.5 h-11" /></div>
            </div>
          </div>
        </div>

        <div className="fa-card fa-glow p-5">
          <h3 className="font-bold text-[#0B2447] mb-4" style={{ fontFamily: 'Manrope' }}>Para Hareketleri</h3>
          <div className="space-y-4">
            <div><Label className="text-sm">Min. Para Yatırma (TL)</Label><Input type="number" value={s.min_deposit} onChange={(e) => setS({ ...s, min_deposit: e.target.value })} className="mt-1.5 h-11" /></div>
            <div><Label className="text-sm">Maks. Para Çekme (TL/işlem)</Label><Input type="number" value={s.max_withdraw} onChange={(e) => setS({ ...s, max_withdraw: e.target.value })} className="mt-1.5 h-11" /></div>
          </div>
        </div>

        <div className="lg:col-span-2 fa-card fa-glow p-5">
          <h3 className="font-bold text-[#0B2447] mb-4" style={{ fontFamily: 'Manrope' }}>Sistem Durumu</h3>
          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 bg-slate-50 rounded-lg gap-3">
              <div className="flex items-start gap-3 flex-1">
                <AlertTriangle size={18} className={s.maintenance_mode ? 'text-red-500 shrink-0 mt-0.5' : 'text-slate-400 shrink-0 mt-0.5'} />
                <div>
                  <Label className="text-sm font-semibold">Bakım Modu</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Açıkken kullanıcılar yeni işlem yapamaz; sadece okuma mod aktif olur.</p>
                </div>
              </div>
              <Switch checked={!!s.maintenance_mode} onCheckedChange={(v) => setS({ ...s, maintenance_mode: v })} />
            </div>
            <div>
              <Label className="text-sm">Genel Duyuru Metni (kullanıcılara görünür)</Label>
              <Textarea value={s.announcement || ''} onChange={(e) => setS({ ...s, announcement: e.target.value })} rows={3} className="mt-1.5" placeholder="Boş bırakılabilir…" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
