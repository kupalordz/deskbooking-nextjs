'use client';
import { useEffect, useState } from 'react';

type ParkingSpot = { id: number; name: string; type: string; zone: string };

export default function AdminParkingPage() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState<'CAR' | 'MOTORCYCLE'>('CAR');
  const [zone, setZone] = useState('');
  const [msg, setMsg] = useState('');

  function load() {
    fetch('/api/parking-spots').then((r) => r.json()).then((d) => setSpots(Array.isArray(d) ? d : []));
  }

  useEffect(() => { load(); }, []);

  async function add() {
    if (!name.trim() || !zone.trim()) { setMsg('Name and zone are required'); return; }
    const r = await fetch('/api/parking-spots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), type, zone: zone.trim() }),
    });
    if (r.ok) { setName(''); setMsg('Spot added'); load(); } else { setMsg('Failed to add'); }
    setTimeout(() => setMsg(''), 3000);
  }

  async function remove(id: number) {
    await fetch('/api/parking-spots/' + id, { method: 'DELETE' });
    load();
  }

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 md:px-12 md:py-12 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <a href="/admin" className="text-sm text-[#1e3a5f] hover:underline">← Admin</a>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Manage Parking Spots</h2>
      </div>

      {msg && <div className="p-3 bg-blue-50 text-blue-800 rounded-lg mb-4 text-sm">{msg}</div>}

      {/* Add form */}
      <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Add Spot</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Spot name (e.g. P-001)"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'CAR' | 'MOTORCYCLE')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
          >
            <option value="CAR">Car</option>
            <option value="MOTORCYCLE">Motorcycle</option>
          </select>
          <input
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            placeholder="Zone (e.g. Level 1)"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
          />
          <button
            onClick={add}
            className="px-5 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#16304d]"
          >
            Add
          </button>
        </div>
      </div>

      {/* Spot list */}
      {spots.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm ring-1 ring-gray-100 text-gray-400">
          No parking spots yet. Add one above.
        </div>
      )}
      <div className="flex flex-col gap-3">
        {spots.map((s) => (
          <div key={s.id} className="bg-white rounded-xl px-5 py-4 shadow-sm ring-1 ring-gray-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
              <p className="text-xs text-gray-500">{s.type === 'CAR' ? '🚗 Car' : '🏍️ Motorcycle'} · {s.zone}</p>
            </div>
            <button onClick={() => remove(s.id)} className="text-red-500 text-sm hover:text-red-700 font-medium">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
