'use client';
import { useEffect, useRef, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

type ParkingSpot = {
  id: number;
  name: string;
  type: string;
  zone: string;
  active: boolean;
  country: string;
  city: string;
  building: string;
  floor: string;
  floorId: string;
  xPosition: number;
  yPosition: number;
};

type Floor = { id: number; floorId: string; name: string; imageUrl: string; isParking: boolean };
type Location = { id: number; country: string; city: string; building: string; floor: string };

type FormData = Omit<ParkingSpot, 'id' | 'active'>;

const EMPTY: FormData = {
  name: '', type: 'CAR', zone: '',
  country: '', city: '', building: '', floor: '', floorId: '',
  xPosition: 0, yPosition: 0,
};

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white';

function unique(arr: string[]) { return arr.filter((v, i, a) => v && a.indexOf(v) === i); }

function SpotForm({ data, onChange, locations }: {
  data: FormData;
  onChange: (k: string, v: string) => void;
  locations: Location[];
}) {
  const countries = unique(locations.map((l) => l.country));
  const cities = unique(locations.filter((l) => l.country === data.country).map((l) => l.city));
  const buildings = unique(locations.filter((l) => l.country === data.country && l.city === data.city).map((l) => l.building));
  const floors = unique(locations.filter((l) => l.country === data.country && l.city === data.city && l.building === data.building).map((l) => l.floor));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Spot Name *</label>
          <input className={inputCls} value={data.name} onChange={(e) => onChange('name', e.target.value)} placeholder="e.g. P-001" />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Type</label>
          <select className={inputCls} value={data.type} onChange={(e) => onChange('type', e.target.value)}>
            <option value="CAR">Car</option>
            <option value="MOTORCYCLE">Motorcycle</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-500 font-medium block mb-1">Zone / Level</label>
          <input className={inputCls} value={data.zone} onChange={(e) => onChange('zone', e.target.value)} placeholder="e.g. Level B1" />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Country</label>
          <select className={inputCls} value={data.country}
            onChange={(e) => { onChange('country', e.target.value); onChange('city', ''); onChange('building', ''); onChange('floor', ''); onChange('floorId', ''); }}>
            <option value="">Select country…</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">City</label>
          <select className={inputCls} value={data.city} disabled={!data.country}
            onChange={(e) => { onChange('city', e.target.value); onChange('building', ''); onChange('floor', ''); onChange('floorId', ''); }}>
            <option value="">Select city…</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Building</label>
          <select className={inputCls} value={data.building} disabled={!data.city}
            onChange={(e) => { onChange('building', e.target.value); onChange('floor', ''); onChange('floorId', ''); }}>
            <option value="">Select building…</option>
            {buildings.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Floor</label>
          <select className={inputCls} value={data.floor} disabled={!data.building}
            onChange={(e) => onChange('floor', e.target.value)}>
            <option value="">Select floor…</option>
            {floors.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : ''}`} />
    </button>
  );
}

export default function AdminParkingPage() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormData>({ ...EMPTY });
  const [editSpot, setEditSpot] = useState<(FormData & { id: number; active: boolean }) | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Map section
  const [mapFloorId, setMapFloorId] = useState('');
  const [placing, setPlacing] = useState<ParkingSpot | null>(null);
  const imgRef = useRef<HTMLDivElement | null>(null);

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 3000); }

  function load() {
    fetch('/api/parking-spots').then((r) => r.json()).then((d) => setSpots(Array.isArray(d) ? d : []));
  }

  useEffect(() => {
    load();
    fetch('/api/floors').then((r) => r.json()).then((d) => {
      const list = (Array.isArray(d) ? d : []).filter((f: Floor) => f.isParking);
      setFloors(list);
      if (list.length > 0) setMapFloorId(list[0].floorId);
    });
    fetch('/api/locations').then((r) => r.json()).then((d) => setLocations(Array.isArray(d) ? d : []));
  }, []);

  async function addSpot() {
    if (!form.name.trim()) { flash('Name is required'); return; }
    const res = await fetch('/api/parking-spots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { flash('Spot added'); setForm({ ...EMPTY }); setShowAdd(false); load(); }
    else flash('Failed to add spot');
  }

  async function saveEdit() {
    if (!editSpot || !editSpot.name.trim()) { flash('Name is required'); return; }
    const { id, active, ...spotData } = editSpot;
    const res = await fetch('/api/parking-spots/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spotData),
    });
    if (res.ok) { flash('Saved'); setEditSpot(null); load(); }
    else flash('Failed to save');
  }

  async function deleteSpot() {
    if (deleteId === null) return;
    await fetch('/api/parking-spots/' + deleteId, { method: 'DELETE' });
    setDeleteId(null); flash('Spot removed'); load();
  }

  async function toggleActive(s: ParkingSpot) {
    await fetch('/api/parking-spots/' + s.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !s.active }),
    });
    load();
  }

  function handleMapClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!placing || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 1000;
    const yPct = ((e.clientY - rect.top) / rect.height) * 1000;
    fetch('/api/parking-spots/' + placing.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ floorId: mapFloorId, xPosition: xPct, yPosition: yPct }),
    }).then(() => { load(); setPlacing(null); });
  }

  const currentMapFloor = floors.find((f) => f.floorId === mapFloorId);
  const mapSpots = spots.filter((s) => s.floorId === mapFloorId && (s.xPosition !== 0 || s.yPosition !== 0));
  const filtered = spots.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.zone.toLowerCase().includes(search.toLowerCase()) ||
    s.building.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-5 sm:p-7 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Parking Spots</h2>
          <p className="text-sm text-gray-400 mt-0.5">Manage spot details, location, and map placement</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setForm({ ...EMPTY }); }}
          className="px-4 py-2 bg-[#1a2535] text-white text-sm font-medium rounded-lg hover:bg-[#243148]"
        >+ Add Spot</button>
      </div>

      {msg && <div className="p-3 bg-green-50 text-green-800 rounded-lg mb-4 text-sm">{msg}</div>}

      {/* Spot list */}
      <div className="mb-4">
        <input className="w-full max-w-sm px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Search spots…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden mb-8">
        {filtered.length === 0 && (
          <div className="p-10 text-center text-gray-400 text-sm">No parking spots found. Add one to get started.</div>
        )}
        {filtered.map((s, i) => (
          <div key={s.id} className={`flex items-center gap-4 px-5 py-3.5 flex-wrap ${i > 0 ? 'border-t border-gray-100' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.type === 'CAR' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                  {s.type === 'CAR' ? 'Car' : 'Motorcycle'}
                </span>
                {!s.active && <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
                {s.floorId && (s.xPosition !== 0 || s.yPosition !== 0) && (
                  <span className="text-[10px] font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Mapped</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {[s.zone, s.building, s.floor].filter(Boolean).join(' · ')}
                {s.country && <span className="ml-1 text-gray-300">({s.country}{s.city ? ', ' + s.city : ''})</span>}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Toggle value={s.active} onChange={() => toggleActive(s)} />
              <button
                onClick={() => { setPlacing(placing?.id === s.id ? null : s); }}
                title="Place on map"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${placing?.id === s.id ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {placing?.id === s.id ? 'Cancel Place' : 'Place'}
              </button>
              <button onClick={() => setEditSpot({ ...s })} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">Edit</button>
              <button onClick={() => setDeleteId(s.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Floor Map section */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">Floor Map Placement</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {placing
                ? `Click on the map to place "${placing.name}"`
                : 'Press "Place" on a spot then click the map to set its position'}
            </p>
          </div>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
            value={mapFloorId}
            onChange={(e) => setMapFloorId(e.target.value)}
          >
            <option value="">Select floor…</option>
            {floors.map((f) => <option key={f.floorId} value={f.floorId}>{f.name}</option>)}
          </select>
        </div>

        <div className="relative bg-gray-50" style={{ minHeight: 500 }}>
          {!currentMapFloor && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
              {floors.length === 0 ? 'No parking floor maps yet. Upload one in Floor Plans with "Parking floor" enabled.' : 'Select a floor above.'}
            </div>
          )}

          {currentMapFloor && (
            <TransformWrapper
              initialScale={1}
              minScale={0.3}
              maxScale={6}
              centerOnInit
              panning={{ disabled: !!placing }}
              doubleClick={{ mode: 'zoomIn', step: 0.7 }}
              wheel={{ step: 0.2 }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <div className="relative w-full" style={{ minHeight: 500 }}>
                  <div className="absolute top-3 right-3 z-50 flex flex-col bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    <button type="button" onClick={() => zoomIn()} className="w-9 h-9 flex items-center justify-center text-lg text-gray-600 hover:bg-gray-50 border-b border-gray-100">+</button>
                    <button type="button" onClick={() => zoomOut()} className="w-9 h-9 flex items-center justify-center text-lg text-gray-600 hover:bg-gray-50 border-b border-gray-100">−</button>
                    <button type="button" onClick={() => resetTransform()} className="w-9 h-8 flex items-center justify-center text-[9px] font-medium text-gray-400 hover:bg-gray-50 uppercase tracking-wide">Fit</button>
                  </div>

                  <TransformComponent wrapperStyle={{ width: '100%', minHeight: 500 }} contentStyle={{ width: '100%' }}>
                    <div
                      ref={imgRef}
                      style={{ position: 'relative', width: '100%', cursor: placing ? 'crosshair' : 'default' }}
                      onClick={handleMapClick}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentMapFloor.imageUrl}
                        alt={currentMapFloor.name}
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                        draggable={false}
                      />
                      {mapSpots.map((s) => (
                        <div
                          key={s.id}
                          style={{
                            position: 'absolute',
                            left: `${s.xPosition / 10}%`,
                            top: `${s.yPosition / 10}%`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 20,
                          }}
                          title={s.name}
                        >
                          <div style={{
                            width: placing?.id === s.id ? 18 : 14,
                            height: placing?.id === s.id ? 18 : 14,
                            borderRadius: '50%',
                            background: s.type === 'CAR' ? '#2563eb' : '#ea580c',
                            boxShadow: placing?.id === s.id
                              ? '0 0 0 3px rgba(255,255,255,0.9), 0 0 0 5px #2563eb'
                              : '0 0 0 2px rgba(255,255,255,0.8)',
                            transition: 'all 0.15s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <span style={{ fontSize: 7, color: 'white', fontWeight: 700, lineHeight: 1 }}>P</span>
                          </div>
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginTop: 2,
                            background: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            fontSize: 9,
                            padding: '1px 4px',
                            borderRadius: 3,
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                          }}>{s.name}</div>
                        </div>
                      ))}
                    </div>
                  </TransformComponent>
                </div>
              )}
            </TransformWrapper>
          )}

          {placing && currentMapFloor && (
            <div className="absolute bottom-3 left-3 z-50 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs text-amber-800 font-medium shadow-sm">
              Click anywhere on the map to place <strong>{placing.name}</strong>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="px-5 py-3 border-t border-gray-100 flex gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 flex-shrink-0" />Car spot
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0" />Motorcycle spot
          </span>
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Add Parking Spot</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <SpotForm data={form} onChange={(k, v) => setForm((p) => ({ ...p, [k]: v }))} locations={locations} />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={addSpot} className="flex-1 px-4 py-2 rounded-lg bg-[#1a2535] text-white text-sm font-medium hover:bg-[#243148]">Add Spot</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editSpot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Edit Parking Spot</h3>
              <button onClick={() => setEditSpot(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <SpotForm
              data={editSpot}
              onChange={(k, v) => setEditSpot((p) => p ? { ...p, [k]: v } : p)}
              locations={locations}
            />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditSpot(null)} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={saveEdit} className="flex-1 px-4 py-2 rounded-lg bg-[#1a2535] text-white text-sm font-medium hover:bg-[#243148]">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">Remove spot?</h3>
            <p className="text-sm text-gray-500 mb-2">This will deactivate the parking spot.</p>
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-5">Any existing bookings for this spot may be affected.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={deleteSpot} className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
