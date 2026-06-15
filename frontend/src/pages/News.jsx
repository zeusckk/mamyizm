import React, { useState } from 'react';
import { MOCK_NEWS } from '../data/mock';
import { Calendar, Tag } from 'lucide-react';

const tagColor = (t) => {
  if (t === 'Piyasa') return 'bg-blue-50 text-blue-700';
  if (t === 'Duyuru') return 'bg-emerald-50 text-emerald-700';
  if (t === 'Analiz') return 'bg-purple-50 text-purple-700';
  if (t === 'Emtia') return 'bg-amber-50 text-amber-700';
  if (t === 'Strateji') return 'bg-rose-50 text-rose-700';
  return 'bg-slate-100 text-slate-700';
};

const News = () => {
  const [filter, setFilter] = useState('all');
  const tags = ['all', ...Array.from(new Set(MOCK_NEWS.map((n) => n.tag)))];
  const list = filter === 'all' ? MOCK_NEWS : MOCK_NEWS.filter((n) => n.tag === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Piyasa Haberleri</h1>
        <p className="text-slate-500 text-sm mt-1">Güncel duyurular, piyasa analizleri ve strateji önerileri.</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 text-xs font-medium rounded-full border ${filter === t ? 'bg-[#0B2447] text-white border-[#0B2447]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#0B2447]'}`}>
            {t === 'all' ? 'Tümü' : t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {list.map((n, i) => (
          <article key={n.id} className={`fa-card fa-glow p-6 hover:shadow-lg transition-shadow cursor-pointer ${i === 0 && filter === 'all' ? 'lg:col-span-2 fa-gradient-navy text-white' : ''}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-2 py-1 text-xs font-semibold rounded-md ${i === 0 && filter === 'all' ? 'bg-white/15 text-white' : tagColor(n.tag)} inline-flex items-center gap-1`}><Tag size={11} /> {n.tag}</span>
              <span className={`text-xs inline-flex items-center gap-1 ${i === 0 && filter === 'all' ? 'text-blue-200' : 'text-slate-500'}`}><Calendar size={12} /> {n.date}</span>
            </div>
            <h3 className={`font-bold mb-2 leading-snug ${i === 0 && filter === 'all' ? 'text-2xl' : 'text-lg text-[#0B2447]'}`} style={{ fontFamily: 'Manrope' }}>{n.title}</h3>
            <p className={`text-sm leading-relaxed ${i === 0 && filter === 'all' ? 'text-blue-100' : 'text-slate-600'}`}>{n.summary}</p>
            <button className={`mt-4 text-xs font-semibold ${i === 0 && filter === 'all' ? 'text-emerald-300' : 'text-[#0B2447] hover:text-emerald-600'}`}>Devamını oku →</button>
          </article>
        ))}
      </div>
    </div>
  );
};

export default News;
