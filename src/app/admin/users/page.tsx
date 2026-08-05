'use client';
import { useEffect, useState } from 'react';

type Location = { id: number; country: string; city: string; building: string; floor: string; zone: string };
type Vehicle = { id: number; type: string; plateNumber: string };
type UserProfile = { id: number; name: string; email: string; role: string; group: string; location: Location | null; vehicles: Vehicle[] };

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', role: '', group: '', locationId: '' });
  const [vForm, setVForm] = useState<Record<number, { type: string; plateNumber: string }>>({});

  function load() {
    fetch('/api/user-profiles').then((r) => r.json()).then((d) => setProfiles(Array.isArray(d) ? d : []));
    fetch('/api/locations').then((r) => r.json()).then((d) => setLocations(Array.isArray(d) ? d : []));
  }

  useEffect(() => { load(); }, []);

  async function addProfile() {
    if (!form.name || !form.email || !form.role || !form.group) { setMsg('All fields except location are required'); return; }
    const r = await fetch('/api/user-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, locationId: form.locationId || null }),
    });
    if (r.ok) { setForm({ name: '', email: '', role: '', group: '', locationId: '' }); setMsg('User added'); load(); }
    else { const d = await r.json(); setMsg(d.error ?? 'Failed'); }
    setTimeout(() => setMsg(''), 3000);
  }

  async function removeProfile(id: number) {
    await fetch('/api/user-profiles/' + id, { method: 'DELETE' });
    load();
  }

  async function addVehicle(profileId: number) {
    const v = vForm[profileId];
    if (!v?.plateNumber) return;
    await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userProfileId: profileId, type: v.type || 'CAR', plateNumber: v.plateNumber }),
    });
    setVForm((p) => ({ ...p, [profileId]: { type: 'CAR', plateNumber: '' } }));
    load();
  }

  async function removeVehicle(vehicleId: number) {
    await fetch('/api/vehicles/' + vehicleId, { method: 'DELETE' });
    load();
  }

  const inputClass = 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]';

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 md:px-12 md:py-12 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <a href="/admin" className="text-sm text-[#1e3a5f] hover:underline">← Admin</a>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">User Profiles</h2>
      </div>

      {msg && <div className="p-3 bg-blue-50 text-blue-800 rounded-lg mb-4 text-sm">{msg}</div>}

      {/* Add form */}
      <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Add User</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input className={inputClass} placeholder="Full name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <input className={inputClass} placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <input className={inputClass} placeholder="Role (e.g. Engineer)" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} />
          <input className={inputClass} placeholder="Group (e.g. IT)" value={form.group} onChange={(e) => setForm((p) => ({ ...p, group: e.target.value }))} />
          <select className={inputClass + ' sm:col-span-2'} value={form.locationId} onChange={(e) => setForm((p) => ({ ...p, locationId: e.target.value }))}>
            <option value="">No location assigned</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.building} — {l.floor}, {l.zone} ({l.city})</option>
            ))}
          </select>
        </div>
        <button onClick={addProfile} className="px-5 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#16304d]">Add User</button>
      </div>

      {/* Profile list */}
      {profiles.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm ring-1 ring-gray-100 text-gray-400">No user profiles yet.</div>
      )}
      <div className="flex flex-col gap-3">
        {profiles.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-500">{p.email} · {p.role} · {p.group}</p>
                {p.location && <p className="text-xs text-gray-400 mt-0.5">{p.location.building}, {p.location.floor}, {p.location.zone}</p>}
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  className="text-sm text-[#1e3a5f] hover:underline font-medium"
                >
                  {expanded === p.id ? 'Hide' : `Vehicles (${p.vehicles.length})`}
                </button>
                <button onClick={() => removeProfile(p.id)} className="text-red-500 text-sm hover:text-red-700 font-medium">Remove</button>
              </div>
            </div>

            {expanded === p.id && (
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Vehicles</p>
                {p.vehicles.length === 0 && <p className="text-xs text-gray-400 mb-3">No vehicles registered.</p>}
                <div className="flex flex-col gap-2 mb-3">
                  {p.vehicles.map((v) => (
                    <div key={v.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 ring-1 ring-gray-200 text-sm">
                      <span>{v.type === 'CAR' ? '🚗' : '🏍️'} {v.plateNumber} <span className="text-gray-400 text-xs ml-1">{v.type}</span></span>
                      <button onClick={() => removeVehicle(v.id)} className="text-red-500 text-xs hover:text-red-700">Remove</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select
                    className={inputClass + ' text-xs'}
                    value={vForm[p.id]?.type ?? 'CAR'}
                    onChange={(e) => setVForm((prev) => ({ ...prev, [p.id]: { ...prev[p.id], type: e.target.value, plateNumber: prev[p.id]?.plateNumber ?? '' } }))}
                  >
                    <option value="CAR">Car</option>
                    <option value="MOTORCYCLE">Motorcycle</option>
                  </select>
                  <input
                    className={inputClass + ' flex-1 text-xs'}
                    placeholder="Plate number"
                    value={vForm[p.id]?.plateNumber ?? ''}
                    onChange={(e) => setVForm((prev) => ({ ...prev, [p.id]: { ...prev[p.id], plateNumber: e.target.value, type: prev[p.id]?.type ?? 'CAR' } }))}
                  />
                  <button onClick={() => addVehicle(p.id)} className="px-3 py-2 bg-[#1e3a5f] text-white rounded-lg text-xs font-medium hover:bg-[#16304d]">Add</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
