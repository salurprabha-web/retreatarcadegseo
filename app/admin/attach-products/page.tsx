'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { adminApi } from '@/components/admin/admin-api';

type Row = { id: string; title: string; category: string; suggested: string[]; reason: string };
type Svc = { id: string; title: string; count: number };

export default function AttachProducts() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [services, setServices] = useState<Svc[]>([]);
  const [info, setInfo] = useState({ total: 0, attached: 0 });
  const [pick, setPick] = useState<Record<string, string[]>>({});
  const [on, setOn] = useState<Record<string, boolean>>({});
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState('');
  const [done, setDone] = useState<any>(null);

  async function scan() {
    setBusy('scan'); setDone(null);
    try {
      const r = await adminApi('/api/admin/attach-products', { action: 'scan' });
      setRows(r.products); setServices(r.services); setInfo({ total: r.total, attached: r.attached });
      setPick(Object.fromEntries(r.products.map((p: Row) => [p.id, p.suggested])));
      setOn(Object.fromEntries(r.products.map((p: Row) => [p.id, true])));
    } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  const shown = (rows || []).filter((r) => (!cat || r.category === cat) && (!q || r.title.toLowerCase().includes(q.toLowerCase())));
  const cats = Array.from(new Set((rows || []).map((r) => r.category))).sort();
  const selected = (rows || []).filter((r) => on[r.id] && (pick[r.id] || []).length);

  const toggleSvc = (pid: string, sid: string) => setPick((p) => ({ ...p, [pid]: (p[pid] || []).includes(sid) ? (p[pid] || []).filter((x) => x !== sid) : [...(p[pid] || []), sid] }));

  async function apply() {
    if (!selected.length) { toast.error('Tick at least one product that has a service'); return; }
    if (!window.confirm(`Attach ${selected.length} products to their services?`)) return;
    setBusy('apply');
    try {
      const r = await adminApi('/api/admin/attach-products', { action: 'apply', items: selected.map((s) => ({ productId: s.id, serviceIds: pick[s.id] })) });
      setDone(r);
      toast.success(`${r.products} products attached`);
      await scan();
    } catch (e: any) { toast.error(e.message); }
    setBusy('');
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-gray-900">Why some products get no city pages</h2>
        <p className="mt-1 text-sm text-gray-600">Auto Pages writes city pages only for products that are listed in a service (the &quot;Related Events&quot; list). Products that are in no service are skipped. This screen finds them and attaches them in one go, copying how you attached your other products.</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-600">
          <li>Press <b>Scan</b>. You see every product that is in no service, with suggested services already ticked.</li>
          <li>Change any ticks you disagree with, and untick products you want to leave out for now (for example to do photo booths first).</li>
          <li>Press <b>Attach</b>. Then open Auto Pages: Preview shows the new pages to write.</li>
        </ol>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={scan} disabled={!!busy}>{busy === 'scan' ? 'Scanning...' : '1. Scan'}</Button>
          {rows && <span className="text-sm text-gray-500">{info.attached} of {info.total} products are already in a service; <b>{rows.length}</b> are not.</span>}
        </div>
      </section>

      {done && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Done: {done.products} products attached across {done.servicesUpdated} services. Next: <Link href="/admin/auto-pages" className="font-semibold underline">open Auto Pages</Link>, press Preview, then Write drafts.
        </div>
      )}
      {rows && rows.length === 0 && !done && <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-800">Every product is already in at least one service.</div>}

      {rows && rows.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <select className="p-2 text-sm" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">All categories ({rows.length})</option>
              {cats.map((c) => <option key={c} value={c}>{c} ({rows.filter((r) => r.category === c).length})</option>)}
            </select>
            <Input className="max-w-xs" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="text-sm font-medium text-orange-700 hover:underline" onClick={() => setOn({ ...on, ...Object.fromEntries(shown.map((r) => [r.id, true])) })}>Tick these</button>
            <button className="text-sm font-medium text-gray-500 hover:underline" onClick={() => setOn({ ...on, ...Object.fromEntries(shown.map((r) => [r.id, false])) })}>Untick these</button>
            <Button className="ml-auto" onClick={apply} disabled={!!busy || !selected.length}>{busy === 'apply' ? 'Attaching...' : `2. Attach ${selected.length} products`}</Button>
          </div>
          <div className="space-y-2">
            {shown.map((r) => (
              <div key={r.id} className={`rounded-xl border p-3 ${on[r.id] ? 'border-gray-200' : 'border-gray-100 bg-gray-50 opacity-70'}`}>
                <label className="flex cursor-pointer flex-wrap items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!on[r.id]} onChange={(e) => setOn({ ...on, [r.id]: e.target.checked })} />
                  <b className="text-gray-900">{r.title}</b>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{r.category || 'No category'}</span>
                  <span className="text-xs text-gray-400">{r.reason}</span>
                </label>
                <div className="mt-2 flex flex-wrap gap-1.5 pl-6">
                  {services.map((s) => {
                    const ticked = (pick[r.id] || []).includes(s.id);
                    return (
                      <button key={s.id} type="button" onClick={() => toggleSvc(r.id, s.id)} className={`rounded-full border px-2.5 py-1 text-xs ${ticked ? 'border-orange-500 bg-orange-50 font-semibold text-orange-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                        {s.title.length > 34 ? s.title.slice(0, 34) + '…' : s.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
