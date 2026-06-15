import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ShieldCheck, TrendingUp, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Login = () => {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('E-posta ve şifre gerekli');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Hoş geldiniz');
      nav('/panel');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Giriş yapılamadı. Bilgileri kontrol edin.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 fa-gradient-navy text-white relative overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-12">
            <div className="h-10 w-10 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
              <span className="text-white font-extrabold text-xl" style={{ fontFamily: 'Manrope' }}>F</span>
            </div>
            <div>
              <div className="font-extrabold text-xl tracking-tight" style={{ fontFamily: 'Manrope' }}>FonAkış</div>
              <div className="text-[11px] text-blue-200 uppercase tracking-widest">Yatırım Platformu</div>
            </div>
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight mb-6" style={{ fontFamily: 'Manrope' }}>
            Birikiminizi <span className="fa-text-gold">akıllıca</span> yönetin
          </h1>
          <p className="text-blue-100 text-lg max-w-md leading-relaxed">
            12'den fazla yatırım fonu, gerçek zamanlı portföy takibi ve uzman analizleri tek platformda.
          </p>
        </div>
        <div className="relative grid grid-cols-3 gap-4 max-w-lg">
          {[{ ic: ShieldCheck, t: 'SPK Lisanslı*', s: 'Güvenli altyapı' }, { ic: TrendingUp, t: '%41 Yıllık', s: 'Para Piyasası getirisi' }, { ic: Lock, t: '256-bit SSL', s: 'Veri şifreleme' }].map(({ ic: Ic, t, s }, i) => (
            <div key={i} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
              <Ic size={20} className="text-emerald-300 mb-2" />
              <div className="font-semibold text-sm">{t}</div>
              <div className="text-[11px] text-blue-200">{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-lg fa-gradient-navy flex items-center justify-center"><span className="text-white font-extrabold text-xl" style={{ fontFamily: 'Manrope' }}>F</span></div>
            <div className="font-extrabold text-xl text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>FonAkış</div>
          </div>
          <h2 className="text-2xl font-bold text-[#0B2447] mb-2" style={{ fontFamily: 'Manrope' }}>Hesabınıza giriş yapın</h2>
          <p className="text-slate-500 text-sm mb-8">Portföyünüzü yönetmek için oturum açın.</p>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label className="text-[#0B2447] text-sm font-medium">E-posta</Label>
              <Input type="email" placeholder="ornek@eposta.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-11" />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <Label className="text-[#0B2447] text-sm font-medium">Şifre</Label>
                <button type="button" className="text-xs text-[#0B2447] hover:text-emerald-600 font-medium">Şifremi unuttum</button>
              </div>
              <div className="relative">
                <Input type={show ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 bg-[#0B2447] hover:bg-[#173A6B] text-white font-semibold">
              {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200" /> veya <div className="flex-1 h-px bg-slate-200" />
          </div>

          <p className="text-center text-sm text-slate-600">
            Hesabınız yok mu? <Link to="/kayit" className="text-[#0B2447] font-semibold hover:text-emerald-600">Hemen kayıt olun</Link>
          </p>
          <p className="mt-8 text-[11px] text-slate-400 text-center leading-relaxed">
            *Bu, eğitim amaçlı demo bir prototiptir. Gerçek bir SPK lisanslı kurum değildir.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
