import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatTRY, formatPct, formatNum } from '../data/mock';
import Sparkline from '../components/charts/Sparkline';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { ChevronLeft, Info, TrendingUp, Shield, Building2, Coins } from 'lucide-react';

const Stat = ({ label, value, sub }) => (
  <div>
    <div className="text-xs text-slate-500 mb-1">{label}</div>
    <div className="text-base font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>{value}</div>
    {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
  </div>
);

const FundDetail = () => {
  const { code } = useParams();
  const nav = useNavigate();
  const { holdings, funds } = useAuth();
  const [range, setRange] = useState('1A');

  const fund = useMemo(() => funds.find((f) => f.code === code), [code, funds]);
  const myHolding = holdings.find((h) => h.code === code);

  if (!fund) {
    return (
      <div className="fa-card fa-glow p-8 text-center">
        <p className="text-slate-500">Fon bulunamadı.</p>
        <Link to="/fonlar" className="text-[#0B2447] font-semibold">Fon listesine dön</Link>
      </div>
    );
  }

  const positive = fund.change_24h >= 0;

  return (
    <div className="space-y-6">
      <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#0B2447]"><ChevronLeft size={16} /> Geri</button>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl fa-gradient-navy text-white flex items-center justify-center font-bold" style={{ fontFamily: 'Manrope' }}>{fund.code}</div>
          <div>
            <div className="text-xs text-slate-500">{fund.category_label}</div>
            <h1 className="text-xl lg:text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>{fund.name}</h1>
            <div className="text-xs text-slate-500 mt-1">{fund.manager}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-300" onClick={() => nav(`/islem/${fund.code}`)}>Sat</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => nav(`/islem/${fund.code}`)}>Al</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 fa-card fa-glow p-6">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-xs text-slate-500">Güncel Fiyat</div>
              <div className="flex items-baseline gap-3">
                <div className="text-3xl font-extrabold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>{fund.price.toFixed(4)} <span className="text-base font-medium text-slate-400">{fund.currency}</span></div>
                <div className={`text-sm font-semibold ${positive ? 'fa-positive' : 'fa-negative'}`}>{formatPct(fund.change_24h)}</div>
              </div>
            </div>
            <div className="flex gap-1">
              {['1H','1A','3A','6A','1Y','YBB'].map((r) => (
                <button key={r} onClick={() => setRange(r)} className={`px-2.5 py-1 text-xs rounded-md ${range === r ? 'bg-[#0B2447] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{r}</button>
              ))}
            </div>
          </div>
          <Sparkline data={fund.series} width={800} height={220} color={positive ? '#10B981' : '#EF4444'} strokeWidth={2.5} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6 pt-6 border-t border-slate-100">
            <Stat label="YBB Getiri" value={<span className={fund.change_ytd >= 0 ? 'fa-positive' : 'fa-negative'}>{formatPct(fund.change_ytd)}</span>} />
            <Stat label="Risk Düzeyi" value={`${fund.risk} / 7`} sub={fund.risk >= 6 ? 'Yüksek' : fund.risk >= 4 ? 'Orta' : 'Düşük'} />
            <Stat label="Fon Büyüklüğü" value={formatTRY(fund.aum)} />
            <Stat label="Min. Alım" value={`${fund.minBuy} pay`} />
          </div>
        </div>

        <div className="space-y-6">
          {myHolding && (
            <div className="fa-card fa-glow p-5 border-l-4 border-l-emerald-500">
              <div className="text-xs text-slate-500 mb-2">Bu Fondaki Pozisyonum</div>
              <div className="text-xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>{formatTRY(myHolding.units * fund.price)}</div>
              <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                <div><div className="text-slate-500">Pay Adedi</div><div className="font-semibold text-[#0B2447]">{formatNum(myHolding.units, 2)}</div></div>
                <div><div className="text-slate-500">Ort. Maliyet</div><div className="font-semibold text-[#0B2447]">{myHolding.avg_cost.toFixed(4)}</div></div>
                <div><div className="text-slate-500">K/Z</div><div className={`font-semibold ${fund.price >= myHolding.avg_cost ? 'fa-positive' : 'fa-negative'}`}>{formatTRY((fund.price - myHolding.avg_cost) * myHolding.units)}</div></div>
                <div><div className="text-slate-500">K/Z %</div><div className={`font-semibold ${fund.price >= myHolding.avg_cost ? 'fa-positive' : 'fa-negative'}`}>{formatPct(((fund.price - myHolding.avg_cost) / myHolding.avg_cost) * 100)}</div></div>
              </div>
            </div>
          )}
          <div className="fa-card fa-glow p-5">
            <h3 className="font-bold text-[#0B2447] mb-3 flex items-center gap-2" style={{ fontFamily: 'Manrope' }}><Info size={16} /> Fon Hakkında</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{fund.desc}</p>
          </div>
          <div className="fa-card fa-glow p-5">
            <h3 className="font-bold text-[#0B2447] mb-3" style={{ fontFamily: 'Manrope' }}>Temel Bilgiler</h3>
            <div className="space-y-3 text-sm">
              {[
                { ic: Building2, l: 'Kurucu', v: fund.manager },
                { ic: Coins, l: 'Para Birimi', v: fund.currency },
                { ic: Shield, l: 'Risk Skoru', v: `${fund.risk} / 7` },
                { ic: TrendingUp, l: 'Toplam Varlık', v: formatTRY(fund.aum) },
              ].map((r) => (
                <div key={r.l} className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2"><r.ic size={14} /> {r.l}</span>
                  <span className="font-semibold text-[#0B2447]">{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundDetail;
