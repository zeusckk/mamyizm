import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Register = () => {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', tckn: '', phone: '', password: '', accept: false });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: null });
  };

  const validate = () => {
    const e = {};
    if (!form.fullName?.trim()) e.fullName = 'Ad Soyad zorunlu';
    else if (form.fullName.trim().length < 3) e.fullName = 'En az 3 karakter olmalı';
    if (!form.email?.trim()) e.email = 'E-posta zorunlu';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Geçerli bir e-posta girin';
    if (!form.password) e.password = 'Şifre zorunlu';
    else if (form.password.length < 6) e.password = 'En az 6 karakter olmalı';
    if (form.tckn && form.tckn.replace(/\D/g, '').length !== 11) e.tckn = 'TCKN 11 hane olmalı';
    if (!form.accept) e.accept = 'Sözleşmeyi onaylayın';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      const first = Object.values(errors)[0] || 'Lütfen alanları kontrol edin';
      toast.error(first);
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Hesabınız oluşturuldu, hoş geldiniz!');
      setTimeout(() => nav('/panel'), 300);
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      let msg = 'Kayıt yapılamadı. Lütfen tekrar deneyin.';
      if (status === 409) msg = 'Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin.';
      else if (status === 422) msg = 'Bilgileri kontrol edin (geçersiz e-posta veya kısa şifre).';
      else if (detail) msg = typeof detail === 'string' ? detail : JSON.stringify(detail);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fieldErr = (k) => errors[k] && (
    <p className="text-[11px] text-red-600 mt-1">{errors[k]}</p>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8FB] p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl bg-white rounded-2xl fa-glow border border-slate-200 p-6 sm:p-8 lg:p-10"
      >
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex items-center gap-2 mb-6"
        >
          <div className="h-10 w-10 rounded-lg fa-gradient-navy flex items-center justify-center">
            <span className="text-white font-extrabold text-xl" style={{ fontFamily: 'Manrope' }}>F</span>
          </div>
          <div className="font-extrabold text-xl text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>FonAkış</div>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-2xl font-bold text-[#0B2447] mb-2"
          style={{ fontFamily: 'Manrope' }}
        >
          Hesap oluşturun
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-500 text-sm mb-7"
        >
          Dakikalar içinde yatırıma başlayın.
        </motion.p>

        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5" noValidate>
          <motion.div className="sm:col-span-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <Label className="text-sm">Ad Soyad <span className="text-red-500">*</span></Label>
            <Input className={`mt-1.5 h-11 ${errors.fullName ? 'border-red-400 focus-visible:ring-red-300' : ''}`} value={form.fullName} onChange={set('fullName')} placeholder="Ad Soyad" />
            {fieldErr('fullName')}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
            <Label className="text-sm">E-posta <span className="text-red-500">*</span></Label>
            <Input type="email" className={`mt-1.5 h-11 ${errors.email ? 'border-red-400 focus-visible:ring-red-300' : ''}`} value={form.email} onChange={set('email')} placeholder="ornek@eposta.com" autoComplete="email" />
            {fieldErr('email')}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Label className="text-sm">Telefon</Label>
            <Input className="mt-1.5 h-11" value={form.phone} onChange={set('phone')} placeholder="+90 5XX XXX XX XX" autoComplete="tel" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
            <Label className="text-sm">T.C. Kimlik No</Label>
            <Input className={`mt-1.5 h-11 ${errors.tckn ? 'border-red-400' : ''}`} value={form.tckn} onChange={set('tckn')} placeholder="11 hane" maxLength={11} inputMode="numeric" />
            {fieldErr('tckn')}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
            <Label className="text-sm">Şifre <span className="text-red-500">*</span></Label>
            <Input type="password" className={`mt-1.5 h-11 ${errors.password ? 'border-red-400' : ''}`} value={form.password} onChange={set('password')} placeholder="En az 6 karakter" autoComplete="new-password" />
            {fieldErr('password')}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.42 }}
            className="sm:col-span-2 flex items-start gap-2 mt-1"
          >
            <Checkbox id="accept" checked={form.accept} onCheckedChange={(v) => { setForm({ ...form, accept: !!v }); if (errors.accept) setErrors({ ...errors, accept: null }); }} className={errors.accept ? 'border-red-400' : ''} />
            <label htmlFor="accept" className="text-xs text-slate-600 leading-relaxed cursor-pointer select-none">
              Kullanım Koşulları ve KVKK Aydınlatma Metni'ni okudum, onaylıyorum.
            </label>
          </motion.div>
          {errors.accept && <p className="sm:col-span-2 -mt-2 text-[11px] text-red-600">{errors.accept}</p>}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.46 }}
            className="sm:col-span-2"
            whileTap={{ scale: 0.98 }}
          >
            <Button type="submit" disabled={loading} className="w-full h-11 bg-[#0B2447] hover:bg-[#173A6B] text-white font-semibold transition-all">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Oluşturuluyor…
                </span>
              ) : 'Hesap Oluştur'}
            </Button>
          </motion.div>
        </form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-center text-sm text-slate-600 mt-6"
        >
          Zaten üye misiniz? <Link to="/giris" className="text-[#0B2447] font-semibold hover:text-emerald-600">Giriş yapın</Link>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Register;
