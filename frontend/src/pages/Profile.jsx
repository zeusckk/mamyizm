import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { toast } from 'sonner';
import { User, Bell, Shield, KeyRound } from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ fullName: user?.full_name || '', email: user?.email || '', phone: user?.phone || '', tckn: user?.tckn || '' });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [notifs, setNotifs] = useState({ email: true, sms: false, push: true, news: true, priceAlerts: false });

  const save = async () => {
    try {
      const r = await authApi.updateProfile({ full_name: form.fullName, phone: form.phone, tckn: form.tckn });
      updateUser(r.user);
      toast.success('Profil bilgileri güncellendi');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Güncelleme başarısız');
    }
  };
  const changePw = async () => {
    if (!pw.current || !pw.next) return toast.error('Tüm alanları doldurun');
    if (pw.next !== pw.confirm) return toast.error('Yeni şifreler eşleşmiyor');
    try {
      await authApi.changePassword({ current: pw.current, next: pw.next });
      toast.success('Şifre değiştirildi');
      setPw({ current: '', next: '', confirm: '' });
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Şifre değiştirme başarısız');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Profil & Ayarlar</h1>
        <p className="text-slate-500 text-sm mt-1">Hesabınızı ve tercihlerinizi yönetin.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="bg-white border border-slate-200 p-1 h-auto flex-wrap">
          <TabsTrigger value="profile" className="data-[state=active]:bg-[#0B2447] data-[state=active]:text-white"><User size={14} className="mr-1.5" /> Profil</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-[#0B2447] data-[state=active]:text-white"><Shield size={14} className="mr-1.5" /> Güvenlik</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-[#0B2447] data-[state=active]:text-white"><Bell size={14} className="mr-1.5" /> Bildirimler</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="fa-card fa-glow p-6">
            <h3 className="font-bold text-[#0B2447] mb-5" style={{ fontFamily: 'Manrope' }}>Kişisel Bilgiler</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-[#0B2447] text-white flex items-center justify-center text-xl font-bold">
                {user?.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <div className="font-bold text-[#0B2447]">{user?.full_name}</div>
                <div className="text-sm text-slate-500">Hesap oluşturulma: Tem 2025</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                ['Ad Soyad', 'fullName', 'text'],
                ['E-posta', 'email', 'email'],
                ['Telefon', 'phone', 'text'],
                ['T.C. Kimlik No', 'tckn', 'text'],
              ].map(([l, k, t]) => (
                <div key={k}>
                  <Label className="text-sm">{l}</Label>
                  <Input type={t} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="mt-1.5 h-11" />
                </div>
              ))}
            </div>
            <Button onClick={save} className="mt-6 bg-[#0B2447] hover:bg-[#173A6B] text-white">Değişiklikleri Kaydet</Button>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="fa-card fa-glow p-6">
              <h3 className="font-bold text-[#0B2447] mb-5 flex items-center gap-2" style={{ fontFamily: 'Manrope' }}><KeyRound size={16} /> Şifre Değiştir</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Mevcut Şifre</Label>
                  <Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label className="text-sm">Yeni Şifre</Label>
                  <Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className="mt-1.5 h-11" />
                </div>
                <div>
                  <Label className="text-sm">Yeni Şifre (Tekrar)</Label>
                  <Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} className="mt-1.5 h-11" />
                </div>
                <Button onClick={changePw} className="bg-[#0B2447] hover:bg-[#173A6B] text-white">Şifreyi Güncelle</Button>
              </div>
            </div>
            <div className="fa-card fa-glow p-6">
              <h3 className="font-bold text-[#0B2447] mb-5" style={{ fontFamily: 'Manrope' }}>İki Faktörlü Doğrulama</h3>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg mb-3">
                <div>
                  <div className="font-semibold text-sm text-[#0B2447]">SMS Doğrulama</div>
                  <div className="text-xs text-slate-500">Girişte SMS kodu gönderilir</div>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <div className="font-semibold text-sm text-[#0B2447]">Authenticator App</div>
                  <div className="text-xs text-slate-500">Google/Microsoft Authenticator</div>
                </div>
                <Switch />
              </div>
              <div className="mt-4 text-xs text-slate-500 bg-amber-50 border border-amber-100 p-3 rounded-lg">Demo modunda 2FA simulasyondur.</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="fa-card fa-glow p-6">
            <h3 className="font-bold text-[#0B2447] mb-5" style={{ fontFamily: 'Manrope' }}>Bildirim Tercihleri</h3>
            <div className="space-y-3">
              {[
                ['email', 'E-posta Bildirimleri', 'İşlem ve hesap bildirimleri'],
                ['sms', 'SMS Bildirimleri', 'Kritik işlem onayları'],
                ['push', 'Mobil Push', 'Uygulama bildirimleri'],
                ['news', 'Piyasa Haberleri', 'Günlük özet ve duyurular'],
                ['priceAlerts', 'Fiyat Alarmları', 'Belirlediğiniz seviyelerde uyarı'],
              ].map(([k, l, s]) => (
                <div key={k} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-sm text-[#0B2447]">{l}</div>
                    <div className="text-xs text-slate-500">{s}</div>
                  </div>
                  <Switch checked={notifs[k]} onCheckedChange={(v) => setNotifs({ ...notifs, [k]: v })} />
                </div>
              ))}
            </div>
            <Button onClick={() => toast.success('Tercihler kaydedildi')} className="mt-6 bg-[#0B2447] hover:bg-[#173A6B] text-white">Tercihleri Kaydet</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
