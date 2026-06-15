import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus, Edit, Trash2, RefreshCw, Newspaper } from 'lucide-react';
import { toast } from 'sonner';

const TAGS = ['Piyasa', 'Duyuru', 'Analiz', 'Emtia', 'Strateji'];

const tagColor = (t) => ({
  Piyasa: 'bg-blue-50 text-blue-700',
  Duyuru: 'bg-emerald-50 text-emerald-700',
  Analiz: 'bg-purple-50 text-purple-700',
  Emtia: 'bg-amber-50 text-amber-700',
  Strateji: 'bg-rose-50 text-rose-700',
}[t] || 'bg-slate-100 text-slate-700');

const empty = { date: new Date().toISOString().slice(0, 10), tag: 'Duyuru', title: '', summary: '' };

const AdminNews = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setItems(await adminApi.listNews()); } catch (e) { toast.error('Haberler alınamadı'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!edit.title || !edit.summary) return toast.error('Başlık ve özet zorunlu');
    try {
      if (edit.id) await adminApi.updateNews(edit.id, { date: edit.date, tag: edit.tag, title: edit.title, summary: edit.summary });
      else await adminApi.createNews({ date: edit.date, tag: edit.tag, title: edit.title, summary: edit.summary });
      toast.success(edit.id ? 'Haber güncellendi' : 'Haber eklendi');
      setEdit(null); load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Kaydedilemedi'); }
  };

  const remove = async (id, title) => {
    if (!window.confirm(`"${title}" silinsin mi?`)) return;
    try { await adminApi.deleteNews(id); toast.success('Silindi'); load(); }
    catch (e) { toast.error('Silinemedi'); }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0B2447]" style={{ fontFamily: 'Manrope' }}>Haber Yönetimi</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">{items.length} haber kaydı</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw size={13} className="mr-1.5" /> Yenile</Button>
          <Button onClick={() => setEdit({ ...empty })} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Plus size={14} className="mr-1" /> Yeni Haber</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {loading && <div className="fa-card fa-glow p-6 text-center text-slate-400 md:col-span-2">Yükleniyor…</div>}
        {!loading && items.length === 0 && (
          <div className="fa-card fa-glow p-8 text-center text-slate-400 md:col-span-2">
            <Newspaper size={32} className="mx-auto mb-2 text-slate-300" />
            Henüz haber yok
          </div>
        )}
        {!loading && items.map((n) => (
          <div key={n.id} className="fa-card fa-glow p-5">
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${tagColor(n.tag)}`}>{n.tag}</span>
              <span className="text-[11px] text-slate-400">{n.date}</span>
            </div>
            <h3 className="font-bold text-[#0B2447] text-base mb-2 leading-snug" style={{ fontFamily: 'Manrope' }}>{n.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{n.summary}</p>
            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
              <Button size="sm" variant="outline" onClick={() => setEdit({ ...n })} className="flex-1"><Edit size={13} className="mr-1" /> Düzenle</Button>
              <Button size="sm" variant="outline" onClick={() => remove(n.id, n.title)} className="text-red-600 border-red-200 hover:bg-red-50"><Trash2 size={13} /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{edit?.id ? 'Haberi Düzenle' : 'Yeni Haber'}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Tarih</Label><Input type="date" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">Kategori</Label>
                  <Select value={edit.tag} onValueChange={(v) => setEdit({ ...edit, tag: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{TAGS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-xs">Başlık</Label><Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} className="mt-1" placeholder="Haber başlığı" /></div>
              <div><Label className="text-xs">Özet</Label><Textarea value={edit.summary} onChange={(e) => setEdit({ ...edit, summary: e.target.value })} className="mt-1" rows={5} placeholder="Haber özeti…" /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEdit(null)}>Vazgeç</Button>
            <Button onClick={save} className="bg-[#0B2447] hover:bg-[#173A6B] text-white">Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNews;
