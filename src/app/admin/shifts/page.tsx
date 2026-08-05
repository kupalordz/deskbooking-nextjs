'use client';
import { useEffect, useState } from 'react';

type Shift = { id: number; name: string; startTime: string; endTime: string; days: string };

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function EditModal({ shift, onClose, onSaved }: { shift: Shift; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: shift.name, startTime: shift.startTime, endTime: shift.endTime });
  const [days, setDays] = useState<string[]>(shift.days.split(','));

  function toggleDay(d: string) {
    setDays((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d]);
  }

  async function save() {
    await fetch('/api/shifts/' + shift.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, days: days.join(',') }),
    });
    onSaved();
    onClose();
  }

  const inputClass = 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] w-full';
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="font-semibold text-gray-900 mb-4">Edit Shift</h3>
        <div className="flex flex-col gap-3 mb-4">
          <input className={inputClass} placeholder="Shift name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Start time</label>
              <input type="time" className={inputClass} value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">End time</label>
              <input type="time" className={inputClass} value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Days</p>
            <div className="flex gap-2 flex-wrap">
              {ALL_DAYS.map((d) => (
                <button key={d} onClick={() => toggleDay(d)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${days.includes(d) ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="flex-1 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#16304d]">Save</button>
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', startTime: '08:00', endTime: '17:00' });
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [editShift, setEditShift] = useState<Shift | null>(null);

  function load() {
    fetch('/api/shifts').then((r) => r.json()).then((d) => setShifts(Array.isArray(d) ? d : []));
  }

  useEffect(() => { load(); }, []);

  function toggleDay(day: string) {
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  }

  async function add() {
    if (!form.name || !form.startTime || !form.endTime || selectedDays.length === 0) {
      setMsg('Name, times and at least one day are required'); return;
    }
    const r = await fetch('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, days: selectedDays.join(',') }),
    });
    if (r.ok) { setForm({ name: '', startTime: '08:00', endTime: '17:00' }); setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']); setMsg('Shift added'); load(); }
    setTimeout(() => setMsg(''), 3000);
  }

  async function remove(id: number) {
    await fetch('/api/shifts/' + id, { method: 'DELETE' });
    load();
  }

  const inputClass = 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]';

  return (
    <div className="p-5 sm:p-7 md:p-8 max-w-3xl">
      {editShift && <EditModal shift={editShift} onClose={() => setEditShift(null)} onSaved={load} />}

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Shift Schedules</h2>
        <p className="text-sm text-gray-400 mt-0.5">Define work shifts and active days</p>
      </div>

      {msg && <div className="p-3 bg-blue-50 text-blue-800 rounded-lg mb-4 text-sm">{msg}</div>}

      <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Add Shift</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <input className={inputClass + ' sm:col-span-3'} placeholder="Shift name (e.g. Morning Shift)" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <div>
            <label className="text-xs text-gray-500 block mb-1">Start time</label>
            <input type="time" className={inputClass + ' w-full'} value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">End time</label>
            <input type="time" className={inputClass + ' w-full'} value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} />
          </div>
        </div>
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Days</p>
          <div className="flex gap-2 flex-wrap">
            {ALL_DAYS.map((day) => (
              <button key={day} onClick={() => toggleDay(day)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedDays.includes(day) ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {day}
              </button>
            ))}
          </div>
        </div>
        <button onClick={add} className="px-5 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#16304d]">Add Shift</button>
      </div>

      {shifts.length === 0 && <div className="bg-white rounded-2xl p-10 text-center shadow-sm ring-1 ring-gray-100 text-gray-400">No shifts yet.</div>}
      <div className="flex flex-col gap-3">
        {shifts.map((s) => (
          <div key={s.id} className="bg-white rounded-xl px-5 py-4 shadow-sm ring-1 ring-gray-100 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">{s.name}</p>
              <p className="text-sm text-gray-500">{s.startTime} – {s.endTime}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {s.days.split(',').map((d) => (
                  <span key={d} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{d}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setEditShift(s)} className="text-[#1e3a5f] text-sm hover:underline font-medium">Edit</button>
              <button onClick={() => remove(s.id)} className="text-red-500 text-sm hover:text-red-700 font-medium">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
