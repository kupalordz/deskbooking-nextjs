'use client';
import { useEffect, useState } from 'react';

type Desk = {
  id: number;
  name: string;
  zone: string;
  floorId: string;
  xPosition: number;
  yPosition: number;
  active: boolean;
  restricted: boolean;
};

export default function AdminPage() {
  const [desks, setDesks] = useState<Desk[]>([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    name: '',
    zone: '',
    floorId: 'floor-1',
    buildingId: 'hq',
    xPosition: '500',
    yPosition: '300',
    active: true,
    restricted: false,
  });

  function load() {
    fetch('/api/desks').then((r) => r.json()).then((d) => setDesks(Array.isArray(d) ? d : [])).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  function add() {
    fetch('/api/desks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        xPosition: Number(form.xPosition),
        yPosition: Number(form.yPosition),
      }),
    }).then((r) => r.json()).then(() => {
      setMsg('Desk added');
      load();
      setForm({ name: '', zone: '', floorId: 'floor-1', buildingId: 'hq', xPosition: '500', yPosition: '300', active: true, restricted: false });
    });
  }

  function remove(id: number) {
    fetch('/api/desks/' + id, { method: 'DELETE' }).then(() => { setMsg('Desk removed'); load(); });
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]';

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 md:px-12 md:py-12 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Admin - Manage Desks</h2>
        
        <a
          href="/admin/floorplans"
          className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#16304d]"
        >
          Floor Plan Builder
        </a>
      </div>

      {msg && <div className="p-3 bg-green-50 text-green-800 rounded-lg mb-4 text-sm">{msg}</div>}

      <div className="bg-white rounded-2xl p-5 md:p-6 mb-6 shadow-sm ring-1 ring-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Add new desk</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Desk name</label>
            <input className={inputClass} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="D-101" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Zone</label>
            <input className={inputClass} value={form.zone} onChange={(e) => setForm((p) => ({ ...p, zone: e.target.value }))} placeholder="Zone A" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Floor</label>
            <select className={inputClass} value={form.floorId} onChange={(e) => setForm((p) => ({ ...p, floorId: e.target.value }))}>
              <option>floor-1</option>
              <option>floor-2</option>
              <option>floor-3</option>
            </select>
          </div>
          <div className="flex items-end gap-4">
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" checked={form.restricted} onChange={(e) => setForm((p) => ({ ...p, restricted: e.target.checked }))} />
              Restricted
            </label>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">X Position (0-1000)</label>
            <input className={inputClass} type="number" value={form.xPosition} onChange={(e) => setForm((p) => ({ ...p, xPosition: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Y Position (0-1000)</label>
            <input className={inputClass} type="number" value={form.yPosition} onChange={(e) => setForm((p) => ({ ...p, yPosition: e.target.value }))} />
          </div>
        </div>
        <button onClick={add} className="px-5 py-2.5 bg-[#1e3a5f] text-white rounded-lg font-medium hover:bg-[#16304d]">Add Desk</button>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['Name', 'Zone', 'Floor', 'Position', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium border-b border-gray-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {desks.map((d) => (
                <tr key={d.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-gray-500">{d.zone}</td>
                  <td className="px-4 py-3 text-gray-500">{d.floorId}</td>
                  <td className="px-4 py-3 text-gray-500">({d.xPosition}, {d.yPosition})</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${d.restricted ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700'}`}>
                      {d.restricted ? 'Restricted' : 'Open'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove(d.id)} className="px-2.5 py-1 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {desks.length === 0 && <p className="text-center text-gray-400 py-8">No desks yet.</p>}
      </div>
    </div>
  );
}