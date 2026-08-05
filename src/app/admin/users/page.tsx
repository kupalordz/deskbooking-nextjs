'use client';
import { useEffect, useState } from 'react';

type Location = { id: number; country: string; city: string; building: string; floor: string; zone: string };
type Vehicle = { id: number; type: string; plateNumber: string };
type UserProfile = { id: number; name: string; email: string; role: string; group: string; location: Location | null; vehicles: Vehicle[] };
type Option = { id: number; category: string; value: string };

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [roleOptions, setRoleOptions] = useState<Option[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', role: '', group: '', locationId: '' });
  const [vForm, setVForm] = useState({ userProfileId: '', type: 'CAR', plateNumber: '' });
  const [newRole, setNewRole] = useState('');
  const [showManageRoles, setShowManageRoles] = useState(false);

  function load() {
    fetch('/api/user-profiles').then((r) => r.json()).then((d) => setProfiles(Array.isArray(d) ? d : []));
    fetch('/api/locations').then((r) => r.json()).then((d) => setLocations(Array.isArray(d) ? d : []));
    fetch('/api/dropdown-options').then((r) => r.json()).then((d) => {
      const all: Option[] = Array.isArray(d) ? d : [];
      setRoleOptions(all.filter((o) => o.category === 'role'));
    });
  }

  useEffect(() => { load(); }, []);

  async function addRole() {
    const val = newRole.trim();
    if (!val) return;
    await fetch('/api/dropdown-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'role', value: val }),
    });
    setNewRole('');
    load();
  }

  async function removeRole(id: number) {
    await fetch('/api/dropdown-options/' + id, { method: 'DELETE' });
    load();
  }

  async function addProfile() {
    if (!form.name || !form.email || !form.role || !form.group) { setMsg('All fields except location are required'); setTimeout(() => setMsg(''), 3000); return; }
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

  async function addVehicle() {
    if (!vForm.userProfileId || !vForm.plateNumber.trim()) { setMsg('Select a user and enter a plate number'); setTimeout(() => setMsg(''), 3000); return; }
    await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userProfileId: Number(vForm.userProfileId), type: vForm.type, plateNumber: vForm.plateNumber.trim() }),
    });
    setVForm((p) => ({ ...p, plateNumber: '' }));
    setMsg('Vehicle added');
    setTimeout(() => setMsg(''), 3000);
    load();
  }

  async function removeVehicle(vehicleId: number) {
    await fetch('/api/vehicles/' + vehicleId, { method: 'DELETE' });
    load();
  }

  const inputClass = 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]';

  return (
    <div className="p-5 sm:p-7 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">User Profiles</h2>
        <p className="text-sm text-gray-400 mt-0.5">Manage users, roles, and vehicle registrations</p>
      </div>

      {msg && <div className="p-3 bg-blue-50 text-blue-800 rounded-lg mb-4 text-sm">{msg}</div>}

      {/* Manage Roles */}
      <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100 mb-4">
        <button
          onClick={() => setShowManageRoles((v) => !v)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="font-semibold text-gray-900">Manage Roles</h3>
          <span className="text-gray-400 text-sm">{showManageRoles ? '▲' : '▼'}</span>
        </button>
        {showManageRoles && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {roleOptions.map((o) => (
                <span key={o.id} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">
                  {o.value}
                  <button onClick={() => removeRole(o.id)} className="text-gray-400 hover:text-red-500 leading-none text-sm font-bold">×</button>
                </span>
              ))}
              {roleOptions.length === 0 && <span className="text-xs text-gray-400">No roles yet</span>}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                placeholder="New role..."
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addRole()}
              />
              <button onClick={addRole} className="px-3 py-1.5 bg-[#1e3a5f] text-white rounded-lg text-xs font-medium hover:bg-[#16304d]">Add</button>
            </div>
          </div>
        )}
      </div>

      {/* Add User */}
      <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100 mb-4">
        <h3 className="font-semibold text-gray-900 mb-4">Add User</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input className={inputClass} placeholder="Full name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <input className={inputClass} placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <select className={inputClass + ' bg-white'} value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
            <option value="">Select role</option>
            {roleOptions.map((o) => <option key={o.id} value={o.value}>{o.value}</option>)}
          </select>
          <input className={inputClass} placeholder="Group (e.g. IT)" value={form.group} onChange={(e) => setForm((p) => ({ ...p, group: e.target.value }))} />
          <select className={inputClass + ' bg-white sm:col-span-2'} value={form.locationId} onChange={(e) => setForm((p) => ({ ...p, locationId: e.target.value }))}>
            <option value="">No location assigned</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.building} — {l.floor}, {l.zone} ({l.city})</option>
            ))}
          </select>
        </div>
        <button onClick={addProfile} className="px-5 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#16304d]">Add User</button>
      </div>

      {/* Add Vehicle */}
      <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Add Vehicle Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <select className={inputClass + ' bg-white'} value={vForm.userProfileId} onChange={(e) => setVForm((p) => ({ ...p, userProfileId: e.target.value }))}>
            <option value="">Select user</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select className={inputClass + ' bg-white'} value={vForm.type} onChange={(e) => setVForm((p) => ({ ...p, type: e.target.value }))}>
            <option value="CAR">Car</option>
            <option value="MOTORCYCLE">Motorcycle</option>
          </select>
          <input className={inputClass} placeholder="Plate number" value={vForm.plateNumber} onChange={(e) => setVForm((p) => ({ ...p, plateNumber: e.target.value }))} />
        </div>
        <button onClick={addVehicle} className="px-5 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#16304d]">Add Vehicle</button>
      </div>

      {/* User list */}
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
                  className="text-sm text-[#1e3a5f] hover:underline font-medium whitespace-nowrap"
                >
                  {expanded === p.id ? 'Hide' : `Vehicles (${p.vehicles.length})`}
                </button>
                <button onClick={() => removeProfile(p.id)} className="text-red-500 text-sm hover:text-red-700 font-medium">Remove</button>
              </div>
            </div>

            {expanded === p.id && (
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Registered Vehicles</p>
                {p.vehicles.length === 0 && <p className="text-xs text-gray-400">No vehicles yet. Use the Add Vehicle form above.</p>}
                <div className="flex flex-col gap-2">
                  {p.vehicles.map((v) => (
                    <div key={v.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 ring-1 ring-gray-200 text-sm">
                      <span className="font-medium">{v.plateNumber}</span>
                      <span className="text-gray-400 text-xs">{v.type}</span>
                      <button onClick={() => removeVehicle(v.id)} className="text-red-500 text-xs hover:text-red-700 font-medium">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
