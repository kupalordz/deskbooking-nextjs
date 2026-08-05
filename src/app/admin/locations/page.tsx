'use client';
import { useEffect, useState } from 'react';

type Location = { id: number; country: string; city: string; building: string; floor: string; zone: string };

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ country: '', city: '', building: '', floor: '', zone: '' });

  function load() {
    fetch('/api/locations').then((r) => r.json()).then((d) => setLocations(Array.isArray(d) ? d : []));
  }

  useEffect(() => { load(); }, []);

  async function add() {
    const { country, city, building, floor, zone } = form;
    if (!country || !city || !building || !floor || !zone) { setMsg('All fields are required'); return; }
    const r = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (r.ok) { setForm({ country: '', city: '', building: '', floor: '', zone: '' }); setMsg('Location added'); load(); }
    setTimeout(() => setMsg(''), 3000);
  }

  async function remove(id: number) {
    await fetch('/api/locations/' + id, { method: 'DELETE' });
    load();
  }

  const inputClass = 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]';
  const fields: (keyof typeof form)[] = ['country', 'city', 'building', 'floor', 'zone'];

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 md:px-12 md:py-12 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <a href="/admin" className="text-sm text-[#1e3a5f] hover:underline">← Admin</a>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Locations</h2>
      </div>

      {msg && <div className="p-3 bg-blue-50 text-blue-800 rounded-lg mb-4 text-sm">{msg}</div>}

      <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Add Location</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          {fields.map((f) => (
            <input
              key={f}
              className={inputClass}
              placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
              value={form[f]}
              onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))}
            />
          ))}
        </div>
        <button onClick={add} className="px-5 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#16304d]">Add Location</button>
      </div>

      {locations.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm ring-1 ring-gray-100 text-gray-400">No locations yet.</div>
      )}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
        {locations.length > 0 && (
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
        )}
      </div>
    </div>
  );
}
