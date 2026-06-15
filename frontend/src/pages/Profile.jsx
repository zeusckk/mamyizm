import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi, kycApi } from '../api/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { User, Bell, Shield, KeyRound, BadgeCheck, Camera, FileText, Upload, X, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';

const kycStatusBadge = (s) => {
  if (s === 'approved') return { l: 'Onaylı', c: 'bg-emerald-100 text-emerald-700 border-emerald-200', ic: CheckCircle2 };
  if (s === 'pending') return { l: 'Beklemede', c: 'bg-amber-100 text-amber-700 border-amber-200', ic: Clock };
  if (s === 'rejected') return { l: 'Reddedildi', c: 'bg-red-100 text-red-700 border-red-200', ic: X };
  return { l: 'Onaysız', c: 'bg-slate-100 text-slate-600 border-slate-200', ic: ShieldCheck };
};

const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const KycSection = () => {
  const { user, refreshMe } = useAuth();
  const [selfie, setSelfie] = useState(null);
  const [idDoc, setIdDoc] = useState(null);
  const [docType, setDocType] = useState('tc_kimlik');
  const [submitting, setSubmitting] = useState(false);
  const selfieRef = useRef();
  const idDocRef = useRef();

  const onSelfieChange = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (!f.type.startsWith('image/')) return toast.error('Selfie için resim dosyası seçin');
    if (f.size > 5 * 1024 * 1024) return toast.error('Selfie en fazla 5 MB olabilir');
    const b64 = await readFileAsBase64(f);
    setSelfie({ name: f.name, size: f.size, type: f.type, base64: b64 });
  };

  const onIdDocChange = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const ok = f.type.startsWith('image/') || f.type === 'application/pdf';
    if (!ok) return toast.error('Kimlik belgesi resim veya PDF olmalı');
    if (f.size > 8 * 1024 * 1024) return toast.error('Belge en fazla 8 MB olabilir');
    const b64 = await readFileAsBase64(f);
    setIdDoc({ name: f.name, size: f.size, type: f.type, base64: b64 });
  };

  const submit = async () => {
    if (!selfie) return toast.error('Selfie yükleyin');
    if (!idDoc) return toast.error('Kimlik belgesi yükleyin');
    setSubmitting(true);
    try {
      await kycApi.submit({
        selfie_base64: selfie.base64,
        id_doc_base64: idDoc.base64,
        id_doc_type: docType,
        id_doc_filename: idDoc.name,
        id_doc_mime: idDoc.type,
      });
      toast.success('KYC başvurunuz alındı');
      await refreshMe();
      setSelfie(null); setIdDoc(null);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'KYC gönderilemedi');
    } finally { setSubmitting(false); }
  };

  const demoApprove = async () => {
    try {
      await kycApi.demoApprove();
      toast.success('KYC onaylandı (demo)');
      await refreshMe();
    } catch (e) { toast.error(e.response?.data?.detail || 'Onaylanamadı'); }
  };

  const status = user?.kyc_status || 'none';
  const badge = kycStatusBadge(status);
  const StatusIcon = badge.ic;

  return (
    <div className="space-y-5">
      <div className="fa-card fa-glow p-5">
        <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BadgeCheck size={18} className="text-[#0B2447]" />
              <h3 className="font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Kimlik Doğrulama (KYC)</h3>
            </div>
            <p className="text-xs text-slate-500">Yatırım işlemleri için kimlik doğrulaması zorunludur.</p>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${badge.c}`}>
            <StatusIcon size={13} /> {badge.l}
          </div>
        </div>
      </div>

      {status === 'approved' ? (
        <div className="fa-card fa-glow p-6 text-center">
          <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={28} />
          </div>
          <h4 className="font-bold text-[#0B2447] text-lg mb-1" style={{ fontFamily: 'Manrope' }}>Hesabınız Onaylı</h4>
          <p className="text-sm text-slate-500">Tüm yatırım işlemlerini gerçekleştirebilirsiniz.</p>
        </div>
      ) : (
        <>
          {status === 'pending' && (
            <div className="fa-card fa-glow p-4 bg-amber-50 border-l-4 border-l-amber-500 flex items-start sm:items-center gap-3 flex-col sm:flex-row">
              <div className="flex items-center gap-3 flex-1">
                <Clock size={20} className="text-amber-600" />
                <div>
                  <div className="font-semibold text-amber-900 text-sm">Başvurunuz incelemede</div>
                  <div className="text-xs text-amber-800">Gerçek sistemde 1-3 iş günü sürer. Demo için hemen onaylayabilirsiniz.</div>
                </div>
              </div>
              <Button onClick={demoApprove} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap">Demo: Hemen Onayla</Button>
            </div>
          )}

          <div className="fa-card fa-glow p-5 space-y-5">
            <h4 className="font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Belge Yükleme</h4>

            <div>
              <Label className="text-sm mb-1.5 block">Kimlik Belgesi Türü</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tc_kimlik">T.C. Kimlik Kartı</SelectItem>
                  <SelectItem value="pasaport">Pasaport</SelectItem>
                  <SelectItem value="ehliyet">Sürücü Belgesi (Ehliyet)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Selfie */}
              <div>
                <Label className="text-sm mb-1.5 block flex items-center gap-1.5"><Camera size={14} /> Selfie (Yüz Fotoğrafı)</Label>
                <input ref={selfieRef} type="file" accept="image/*" capture="user" onChange={onSelfieChange} className="hidden" />
                {!selfie ? (
                  <button onClick={() => selfieRef.current?.click()} className="w-full h-44 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[#0B2447] hover:bg-slate-50 transition-colors">
                    <Camera size={28} className="text-slate-400" />
                    <div className="text-sm font-medium text-slate-600">Selfie yükle veya çek</div>
                    <div className="text-[11px] text-slate-400">JPG / PNG, maks 5 MB</div>
                  </button>
                ) : (
                  <div className="relative h-44 rounded-lg overflow-hidden border border-slate-200">
                    <img src={selfie.base64} alt="selfie" className="w-full h-full object-cover" />
                    <button onClick={() => setSelfie(null)} className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"><X size={14} /></button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate">{selfie.name} • {(selfie.size / 1024).toFixed(0)} KB</div>
                  </div>
                )}
              </div>

              {/* ID Doc */}
              <div>
                <Label className="text-sm mb-1.5 block flex items-center gap-1.5"><FileText size={14} /> Kimlik Belgesi</Label>
                <input ref={idDocRef} type="file" accept="image/*,application/pdf" onChange={onIdDocChange} className="hidden" />
                {!idDoc ? (
                  <button onClick={() => idDocRef.current?.click()} className="w-full h-44 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[#0B2447] hover:bg-slate-50 transition-colors">
                    <Upload size={28} className="text-slate-400" />
                    <div className="text-sm font-medium text-slate-600">Belge yükle</div>
                    <div className="text-[11px] text-slate-400">JPG / PNG / PDF, maks 8 MB</div>
                  </button>
                ) : (
                  <div className="relative h-44 rounded-lg overflow-hidden border border-slate-200">
                    {idDoc.type === 'application/pdf' ? (
                      <div className="h-full w-full bg-slate-100 flex flex-col items-center justify-center gap-2">
                        <FileText size={40} className="text-red-500" />
                        <div className="text-xs font-semibold text-slate-700 truncate max-w-[80%]">{idDoc.name}</div>
                        <div className="text-[10px] text-slate-500">PDF • {(idDoc.size / 1024).toFixed(0)} KB</div>
                      </div>
                    ) : (
                      <img src={idDoc.base64} alt="id" className="w-full h-full object-cover" />
                    )}
                    <button onClick={() => setIdDoc(null)} className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"><X size={14} /></button>
                    {idDoc.type !== 'application/pdf' && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate">{idDoc.name} • {(idDoc.size / 1024).toFixed(0)} KB</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
              <strong>Önemli:</strong> Fotoğraflarınızın net olduğundan, kimlik bilgilerinin okunabilir olduğundan ve selfie'de yüzünüzün tam göründüğünden emin olun. Belgeleriniz KVKK kapsamında korunur.
            </div>

            <Button onClick={submit} disabled={submitting || !selfie || !idDoc} className="w-full h-11 bg-[#0B2447] hover:bg-[#173A6B] text-white font-semibold disabled:opacity-50">
              {submitting ? 'Gönderiliyor...' : 'KYC Başvurusunu Gönder'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

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
    } catch (e) { toast.error(e.response?.data?.detail || 'Güncelleme başarısız'); }
  };
  const changePw = async () => {
    if (!pw.current || !pw.next) return toast.error('Tüm alanları doldurun');
    if (pw.next !== pw.confirm) return toast.error('Yeni şifreler eşleşmiyor');
    try {
      await authApi.changePassword({ current: pw.current, next: pw.next });
      toast.success('Şifre değiştirildi');
      setPw({ current: '', next: '', confirm: '' });
    } catch (e) { toast.error(e.response?.data?.detail || 'Güncelleme başarısız'); }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Profil & Ayarlar</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Hesabınızı, kimlik doğrulamasını ve tercihlerinizi yönetin.</p>
      </div>

      <Tabs defaultValue="kyc">
        <TabsList className="bg-white border border-slate-200 p-1 h-auto flex-wrap w-full justify-start gap-1 overflow-x-auto fa-scrollbar">
          <TabsTrigger value="kyc" className="data-[state=active]:bg-[#0B2447] data-[state=active]:text-white whitespace-nowrap"><BadgeCheck size={13} className="mr-1.5" /> KYC</TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-[#0B2447] data-[state=active]:text-white whitespace-nowrap"><User size={13} className="mr-1.5" /> Profil</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-[#0B2447] data-[state=active]:text-white whitespace-nowrap"><Shield size={13} className="mr-1.5" /> Güvenlik</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-[#0B2447] data-[state=active]:text-white whitespace-nowrap"><Bell size={13} className="mr-1.5" /> Bildirimler</TabsTrigger>
        </TabsList>

        <TabsContent value="kyc" className="mt-5"><KycSection /></TabsContent>

        <TabsContent value="profile" className="mt-5">
          <div className="fa-card fa-glow p-5">
            <h3 className="font-bold text-[#0B2447] mb-5" style={{ fontFamily: 'Manrope' }}>Kişisel Bilgiler</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 rounded-full bg-[#0B2447] text-white flex items-center justify-center text-lg font-bold">
                {user?.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <div className="font-bold text-[#0B2447]">{user?.full_name}</div>
                <div className="text-xs text-slate-500">{user?.email}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[['Ad Soyad', 'fullName', 'text'], ['E-posta', 'email', 'email'], ['Telefon', 'phone', 'tel'], ['T.C. Kimlik No', 'tckn', 'text']].map(([l, k, t]) => (
                <div key={k}>
                  <Label className="text-sm">{l}</Label>
                  <Input type={t} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="mt-1.5 h-11" disabled={k === 'email'} />
                </div>
              ))}
            </div>
            <Button onClick={save} className="mt-6 bg-[#0B2447] hover:bg-[#173A6B] text-white">Değişiklikleri Kaydet</Button>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="fa-card fa-glow p-5">
              <h3 className="font-bold text-[#0B2447] mb-5 flex items-center gap-2" style={{ fontFamily: 'Manrope' }}><KeyRound size={16} /> Şifre Değiştir</h3>
              <div className="space-y-4">
                {[['Mevcut Şifre', 'current'], ['Yeni Şifre', 'next'], ['Yeni Şifre (Tekrar)', 'confirm']].map(([l, k]) => (
                  <div key={k}>
                    <Label className="text-sm">{l}</Label>
                    <Input type="password" value={pw[k]} onChange={(e) => setPw({ ...pw, [k]: e.target.value })} className="mt-1.5 h-11" />
                  </div>
                ))}
                <Button onClick={changePw} className="bg-[#0B2447] hover:bg-[#173A6B] text-white">Şifreyi Güncelle</Button>
              </div>
            </div>
            <div className="fa-card fa-glow p-5">
              <h3 className="font-bold text-[#0B2447] mb-5" style={{ fontFamily: 'Manrope' }}>İki Faktörlü Doğrulama</h3>
              {[['SMS Doğrulama', 'Girişte SMS kodu gönderilir'], ['Authenticator App', 'Google/Microsoft Authenticator']].map(([l, s]) => (
                <div key={l} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg mb-2">
                  <div><div className="font-semibold text-sm text-[#0B2447]">{l}</div><div className="text-xs text-slate-500">{s}</div></div>
                  <Switch />
                </div>
              ))}
              <div className="mt-3 text-xs text-slate-500 bg-amber-50 border border-amber-100 p-3 rounded-lg">Demo modunda 2FA simulasyondur.</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-5">
          <div className="fa-card fa-glow p-5">
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
                  <div><div className="font-semibold text-sm text-[#0B2447]">{l}</div><div className="text-xs text-slate-500">{s}</div></div>
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
