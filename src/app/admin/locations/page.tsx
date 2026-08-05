'use client';
import { useEffect, useState } from 'react';

type Location = { id: number; country: string; city: string; building: string; floor: string; zone: string };
type Option = { id: number; category: string; value: string };

const CATEGORIES = ['country', 'city', 'building', 'floor', 'zone'] as const;
type Category = typeof CATEGORIES[number];

function EditModal({ loc, opts, onClose, onSaved }: { loc: Location; opts: (cat: Category) => Option[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Record<Category, string>>({
    country: loc.country, city: loc.city, building: loc.building, floor: loc.floor, zone: loc.zone,
  });

  async function save() {
    await fetch('/api/locations/' + loc.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    onSaved();
    onClose();
  }

  const selectClass = 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] w-full bg-white';
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="font-semibold text-gray-900 mb-4">Edit Location</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <label className="text-xs text-gray-500 block mb-1 capitalize font-medium">{cat}</label>
              <select className={selectClass} value={form[cat]} onChange={(e) => setForm((p) => ({ ...p, [cat]: e.target.value }))}>
                <option value={form[cat]}>{form[cat]}</option>
                {opts(cat).filter((o) => o.value !== form[cat]).map((o) => <option key={o.id} value={o.value}>{o.value}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="flex-1 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#16304d]">Save</button>
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState<Record<Category, string>>({ country: '', city: '', building: '', floor: '', zone: '' });
  const [editLoc, setEditLoc] = useState<Location | null>(null);

  function load() {
    fetch('/api/locations').then((r) => r.json()).then((d) => setLocations(Array.isArray(d) ? d : []));
    fetch('/api/dropdown-options').then((r) => r.json()).then((d) => setOptions(Array.isArray(d) ? d : []));
  }

  useEffect(() => { load(); }, []);

  function opts(cat: Category) { return options.filter((o) => o.category === cat); }

  async function addLocation() {
    const { country, city, building, floor, zone } = form;
    if (!country || !city || !building || !floor || !zone) { setMsg('All fields are required'); setTimeout(() => setMsg(''), 3000); return; }
    const r = await fetch('/api/locations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    if (r.ok) { setForm({ country: '', city: '', building: '', floor: '', zone: '' }); setMsg('Location added'); setTimeout(() => setMsg(''), 3000); load(); }
  }

  async function remove(id: number) {
    await fetch('/api/locations/' + id, { method: 'DELETE' });
    load();
  }

  const selectClass = 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6] w-full bg-white';

  return (
    <div className="p-5 sm:p-7 md:p-8 max-w-4xl">
      {editLoc && <EditModal loc={editLoc} opts={opts} onClose={() => setEditLoc(null)} onSaved={load} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Locations</h2>
          <p className="text-sm text-gray-400 mt-0.5">Add and manage office locations</p>
        </div>
        <a href="/admin/manage-lists" className="text-sm text-[#3b82f6] hover:underline font-medium">Manage Lists →</a>
      </div>

      {msg && <div className="p-3 bg-blue-50 text-blue-800 rounded-lg mb-4 text-sm">{msg}</div>}

      <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Add Location</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <label className="text-xs text-gray-500 block mb-1 capitalize font-medium">{cat}</label>
              <select className={selectClass} value={form[cat]} onChange={(e) => setForm((p) => ({ ...p, [cat]: e.target.value }))}>
                <option value="">Select {cat}</option>
                {opts(cat).map((o) => <option key={o.id} value={o.value}>{o.value}</option>)}
              </select>
            </div>
          ))}
        </div>
        {opts('country').length === 0 && (
          <p className="text-xs text-amber-600 mb-3">No options available. <a href="/admin/manage-lists" className="underline font-medium">Add options in Manage Lists</a> first.</p>
        )}
        <button onClick={addLocation} className="px-5 py-2 bg-[#1a2535] text-white rounded-lg text-sm font-medium hover:bg-[#243148] transition-colors">Add Location</button>
      </div>

      {locations.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm ring-1 ring-gray-100 text-gray-400">No locations yet.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">All Locations</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {['Country', 'City', 'Building', 'Floor', 'Zone', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium border-b border-gray-200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {locations.map((l) => (
                  <tr key={l.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3">{l.country}</td>
                    <td className="px-4 py-3">{l.city}</td>
                    <td className="px-4 py-3 font-medium">{l.building}</td>
                    <td className="px-4 py-3 text-gray-500">{l.floor}</td>
                    <td className="px-4 py-3 text-gray-500">{l.zone}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button onClick={() => setEditLoc(l)} className="text-[#1e3a5f] text-xs hover:underline font-medium">Edit</button>
                        <button onClick={() => remove(l.id)} className="text-red-500 text-xs hover:text-red-700 font-medium">Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
