'use client';
import { useEffect, useState } from 'react';

type Location = { id: number; country: string; city: string; building: string; floor: string; zone: string };
type Option = { id: number; category: string; value: string };

const CATEGORIES = ['country', 'city', 'building', 'floor', 'zone'] as const;
type Category = typeof CATEGORIES[number];

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState<Record<Category, string>>({ country: '', city: '', building: '', floor: '', zone: '' });
  const [newOption, setNewOption] = useState<Record<Category, string>>({ country: '', city: '', building: '', floor: '', zone: '' });

  function load() {
    fetch('/api/locations').then((r) => r.json()).then((d) => setLocations(Array.isArray(d) ? d : []));
    fetch('/api/dropdown-options').then((r) => r.json()).then((d) => setOptions(Array.isArray(d) ? d : []));
  }

  useEffect(() => { load(); }, []);

  function opts(cat: Category) { return options.filter((o) => o.category === cat); }

  async function addOption(cat: Category) {
    const val = newOption[cat].trim();
    if (!val) return;
    await fetch('/api/dropdown-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: cat, value: val }),
    });
    setNewOption((p) => ({ ...p, [cat]: '' }));
    load();
  }

  async function removeOption(id: number) {
    await fetch('/api/dropdown-options/' + id, { method: 'DELETE' });
    load();
  }

  async function addLocation() {
    const { country, city, building, floor, zone } = form;
    if (!country || !city || !building || !floor || !zone) { setMsg('All fields are required'); setTimeout(() => setMsg(''), 3000); return; }
    const r = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (r.ok) {
      setForm({ country: '', city: '', building: '', floor: '', zone: '' });
      setMsg('Location added');
      setTimeout(() => setMsg(''), 3000);
      load();
    }
  }

  async function remove(id: number) {
    await fetch('/api/locations/' + id, { method: 'DELETE' });
    load();
  }

  const inputClass = 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] w-full';
  const selectClass = inputClass + ' bg-white';

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 md:px-12 md:py-12 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <a href="/admin" className="text-sm text-[#1e3a5f] hover:underline">← Admin</a>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Locations</h2>
      </div>

      {msg && <div className="p-3 bg-blue-50 text-blue-800 rounded-lg mb-4 text-sm">{msg}</div>}

      {/* Manage Lists */}
      <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100 mb-4">
        <h3 className="font-semibold text-gray-900 mb-4">Manage Lists</h3>
        <div className="flex flex-col gap-4">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{cat}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {opts(cat).map((o) => (
                  <span key={o.id} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">
                    {o.value}
                    <button onClick={() => removeOption(o.id)} className="text-gray-400 hover:text-red-500 leading-none text-sm font-bold">×</button>
                  </span>
                ))}
                {opts(cat).length === 0 && <span className="text-xs text-gray-400">No options yet</span>}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  placeholder={`Add ${cat}...`}
                  value={newOption[cat]}
                  onChange={(e) => setNewOption((p) => ({ ...p, [cat]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addOption(cat)}
                />
                <button onClick={() => addOption(cat)} className="px-3 py-1.5 bg-[#1e3a5f] text-white rounded-lg text-xs font-medium hover:bg-[#16304d]">Add</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Location */}
      <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Add Location</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <label className="text-xs text-gray-500 block mb-1 capitalize">{cat}</label>
              <select className={selectClass} value={form[cat]} onChange={(e) => setForm((p) => ({ ...p, [cat]: e.target.value }))}>
                <option value="">Select {cat}</option>
                {opts(cat).map((o) => <option key={o.id} value={o.value}>{o.value}</option>)}
              </select>
            </div>
          ))}
        </div>
        <button onClick={addLocation} className="px-5 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#16304d]">Add Location</button>
      </div>

      {/* Location table */}
      {locations.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm ring-1 ring-gray-100 text-gray-400">No locations yet.</div>
      )}
      {locations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Country', 'City', 'Building', 'Floor', 'Zone', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {locations.map((l) => (
                <tr key={l.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3">{l.country}</td>
                  <td className="px-4 py-3">{l.city}</td>
                  <td className="px-4 py-3 font-medium">{l.building}</td>
                  <td className="px-4 py-3 text-gray-500">{l.floor}</td>
                  <td className="px-4 py-3 text-gray-500">{l.zone}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove(l.id)} className="text-red-500 text-xs hover:text-red-700 font-medium">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
