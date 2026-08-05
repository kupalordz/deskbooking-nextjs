'use client';
import { useEffect, useState } from 'react';

type Desk = {
  id: number;
  name: string;
  zone: string;
  floorId: string;
  buildingId: string;
  active: boolean;
  restricted: boolean;
  hasMonitor: boolean;
  hasKeyboard: boolean;
  hasPedestal: boolean;
  xPosition: number;
  yPosition: number;
};

type Option = { id: number; category: string; value: string };
type Location = { id: number; country: string; city: string; building: string; floor: string };

type FormData = Omit<Desk, 'xPosition' | 'yPosition'> & { country: string; city: string };

const EMPTY: FormData = {
  id: 0, name: '', zone: '', country: '', city: '', floorId: '', buildingId: '',
  active: true, restricted: false,
  hasMonitor: false, hasKeyboard: false, hasPedestal: false,
};

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : ''}`} />
    </button>
  );
}

export default function DesksPage() {
  const [desks, setDesks] = useState<Desk[]>([]);
  const [opts, setOpts] = useState<Option[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormData>({ ...EMPTY });
  const [editDesk, setEditDesk] = useState<FormData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000); }

  function load() {
    fetch('/api/desks').then((r) => r.json()).then((d) => setDesks(Array.isArray(d) ? d : []));
  }

  useEffect(() => {
    load();
    fetch('/api/dropdown-options').then((r) => r.json()).then((d) => setOpts(Array.isArray(d) ? d : []));
    fetch('/api/locations').then((r) => r.json()).then((d) => setLocations(Array.isArray(d) ? d : []));
  }, []);

  const zones = opts.filter((o) => o.category === 'zone').map((o) => o.value);

  function unique(arr: string[]) { return arr.filter((v, i, a) => v && a.indexOf(v) === i); }
  const countries = unique(locations.map((l) => l.country));
  function citiesFor(country: string) { return unique(locations.filter((l) => l.country === country).map((l) => l.city)); }
  function buildingsFor(country: string, city: string) { return unique(locations.filter((l) => l.country === country && l.city === city).map((l) => l.building)); }
  function floorsFor(country: string, city: string, building: string) { return unique(locations.filter((l) => l.country === country && l.city === city && l.building === building).map((l) => l.floor)); }

  async function addDesk() {
    if (!form.name.trim()) { flash('Name is required'); return; }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, country, city, ...deskData } = form;
    const res = await fetch('/api/desks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...deskData, xPosition: 0, yPosition: 0 }),
    });
    if (res.ok) { flash('Desk added'); setForm({ ...EMPTY }); setShowAdd(false); load(); }
    else flash('Failed to add desk');
  }

  async function saveEdit() {
    if (!editDesk || !editDesk.name.trim()) { flash('Name is required'); return; }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, country, city, ...deskData } = editDesk;
    const res = await fetch('/api/desks/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deskData),
    });
    if (res.ok) { flash('Saved'); setEditDesk(null); load(); }
    else flash('Failed to save');
  }

  async function deleteDesk() {
    if (deleteId === null) return;
    await fetch('/api/desks/' + deleteId, { method: 'DELETE' });
    setDeleteId(null); flash('Desk deleted'); load();
  }

  async function toggleActive(d: Desk) {
    await fetch('/api/desks/' + d.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !d.active }),
    });
    load();
  }

  const filtered = desks.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.zone.toLowerCase().includes(search.toLowerCase()) ||
    d.floorId.toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2535] bg-white';
  const selCls = inputCls;

  function DeskForm({ data, onChange }: {
    data: FormData;
    onChange: (k: string, v: string | boolean) => void;
  }) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Desk Name *</label>
            <input className={inputCls} value={data.name} onChange={(e) => onChange('name', e.target.value)} placeholder="e.g. A-01" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Zone</label>
            <select className={selCls} value={data.zone} onChange={(e) => onChange('zone', e.target.value)}>
              <option value="">Select zone…</option>
              {zones.map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Country</label>
            <select className={selCls} value={data.country}
              onChange={(e) => { onChange('country', e.target.value); onChange('city', ''); onChange('buildingId', ''); onChange('floorId', ''); }}>
              <option value="">Select country…</option>
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">City</label>
            <select className={selCls} value={data.city} disabled={!data.country}
              onChange={(e) => { onChange('city', e.target.value); onChange('buildingId', ''); onChange('floorId', ''); }}>
              <option value="">Select city…</option>
              {citiesFor(data.country).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Building</label>
            <select className={selCls} value={data.buildingId} disabled={!data.city}
              onChange={(e) => { onChange('buildingId', e.target.value); onChange('floorId', ''); }}>
              <option value="">Select building…</option>
              {buildingsFor(data.country, data.city).map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Floor</label>
            <select className={selCls} value={data.floorId} disabled={!data.buildingId}
              onChange={(e) => onChange('floorId', e.target.value)}>
              <option value="">Select floor…</option>
              {floorsFor(data.country, data.city, data.buildingId).map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          {([['active', 'Active'], ['restricted', 'Restricted'], ['hasMonitor', 'Monitor'], ['hasKeyboard', 'Keyboard'], ['hasPedestal', 'Pedestal']] as [string, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
              <Toggle value={data[key as keyof typeof EMPTY] as boolean} onChange={(v) => onChange(key, v)} />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-7 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Desks</h2>
          <p className="text-sm text-gray-400 mt-0.5">Manage desk configuration, zones, and amenities</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setForm({ ...EMPTY }); }}
          className="px-4 py-2 bg-[#1a2535] text-white text-sm font-medium rounded-lg hover:bg-[#243148]"
        >+ Add Desk</button>
      </div>

      {msg && <div className="p-3 bg-green-50 text-green-800 rounded-lg mb-4 text-sm">{msg}</div>}

      {/* Search */}
      <div className="mb-4">
        <input className="w-full max-w-sm px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Search desks…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Desk list */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
        {filtered.length === 0 && (
          <div className="p-10 text-center text-gray-400 text-sm">No desks found. Add one to get started.</div>
        )}
        {filtered.map((d, i) => (
          <div key={d.id} className={`flex items-center gap-4 px-5 py-3.5 flex-wrap ${i > 0 ? 'border-t border-gray-100' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900 text-sm">{d.name}</p>
                {d.restricted && <span className="text-[10px] font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Restricted</span>}
                {!d.active && <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {[d.zone, d.buildingId, d.floorId].filter(Boolean).join(' · ')}
                {(d.hasMonitor || d.hasKeyboard || d.hasPedestal) && (
                  <span className="ml-2 text-gray-300">
                    {[d.hasMonitor && 'Monitor', d.hasKeyboard && 'Keyboard', d.hasPedestal && 'Pedestal'].filter(Boolean).join(', ')}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Toggle value={d.active} onChange={() => toggleActive(d)} />
              <button onClick={() => setEditDesk({ ...d, country: '', city: '' })} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">Edit</button>
              <button onClick={() => setDeleteId(d.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Add Desk</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <DeskForm data={form} onChange={(k, v) => setForm((p) => ({ ...p, [k]: v }))} />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={addDesk} className="flex-1 px-4 py-2 rounded-lg bg-[#1a2535] text-white text-sm font-medium hover:bg-[#243148]">Add Desk</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editDesk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Edit Desk</h3>
              <button onClick={() => setEditDesk(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <DeskForm
              data={editDesk}
              onChange={(k, v) => setEditDesk((p) => p ? { ...p, [k]: v } : p)}
            />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditDesk(null)} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={saveEdit} className="flex-1 px-4 py-2 rounded-lg bg-[#1a2535] text-white text-sm font-medium hover:bg-[#243148]">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">Delete desk?</h3>
            <p className="text-sm text-gray-500 mb-2">This will permanently remove the desk.</p>
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-5">Any existing bookings for this desk may be affected.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={deleteDesk} className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
