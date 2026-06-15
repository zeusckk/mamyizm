import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';

const Register = () => {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', tckn: '', phone: '', password: '', accept: false });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target ? e.target.value : e });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) return toast.error('Zorunlu alanları doldurun');
    if (!form.accept) return toast.error('Sözleşmeyi onaylayın');
    setLoading(true);
    await register(form);
    setLoading(false);
    toast.success('Hesabınız oluşturuldu');
    nav('/panel');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8FB] p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl fa-glow border border-slate-200 p-8 lg:p-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-lg fa-gradient-navy flex items-center justify-center"><span className="text-white font-extrabold text-xl" style={{ fontFamily: 'Manrope' }}>F</span></div>
          <div className="font-extrabold text-xl text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>FonAkış</div>
        </div>
        <h2 className="text-2xl font-bold text-[#0B2447] mb-2" style={{ fontFamily: 'Manrope' }}>Hesap oluşturun</h2>
        <p className="text-slate-500 text-sm mb-8">Dakikalar içinde yatırıma başlayın.</p>

        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <Label className="text-sm">Ad Soyad *</Label>
            <Input className="mt-1.5 h-11" value={form.fullName} onChange={set('fullName')} placeholder="Ad Soyad" />
          </div>
          <div>
            <Label className="text-sm">E-posta *</Label>
            <Input type="email" className="mt-1.5 h-11" value={form.email} onChange={set('email')} placeholder="ornek@eposta.com" />
          </div>
          <div>
            <Label className="text-sm">Telefon</Label>
            <Input className="mt-1.5 h-11" value={form.phone} onChange={set('phone')} placeholder="+90 5XX XXX XX XX" />
          </div>
          <div>
            <Label className="text-sm">T.C. Kimlik No</Label>
            <Input className="mt-1.5 h-11" value={form.tckn} onChange={set('tckn')} placeholder="11 hane" maxLength={11} />
          </div>
          <div>
            <Label className="text-sm">Şifre *</Label>
            <Input type="password" className="mt-1.5 h-11" value={form.password} onChange={set('password')} placeholder="En az 8 karakter" />
          </div>
          <div className="sm:col-span-2 flex items-start gap-2 mt-1">
            <Checkbox id="accept" checked={form.accept} onCheckedChange={(v) => setForm({ ...form, accept: !!v })} />
            <label htmlFor="accept" className="text-xs text-slate-600 leading-relaxed">
              Kullanım Koşulları ve KVKK Aydınlatma Metni'ni okudum, onaylıyorum.
            </label>
          </div>
          <Button type="submit" disabled={loading} className="sm:col-span-2 h-11 bg-[#0B2447] hover:bg-[#173A6B] text-white font-semibold">
            {loading ? 'Oluşturuluyor…' : 'Hesap Oluştur'}
          </Button>
        </form>
        <p className="text-center text-sm text-slate-600 mt-6">
          Zaten üye misiniz? <Link to="/giris" className="text-[#0B2447] font-semibold hover:text-emerald-600">Giriş yapın</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
