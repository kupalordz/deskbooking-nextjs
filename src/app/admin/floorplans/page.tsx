'use client';
import { useEffect, useRef, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

type Floor = { id: number; floorId: string; name: string; imageUrl: string; isParking: boolean };
type Desk = {
  id: number;
  name: string;
  zone: string;
  floorId: string;
  xPosition: number;
  yPosition: number;
  restricted: boolean;
  hasMonitor: boolean;
  hasKeyboard: boolean;
  hasPedestal: boolean;
  pinWidth: number;
  pinHeight: number;
  pinRotation: number;
};
type Location = { country: string; city: string; building: string; floor: string };

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function FloorPlanBuilder() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [floorDesks, setFloorDesks] = useState<Desk[]>([]);
  const [allDesks, setAllDesks] = useState<Desk[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(null);
  const [pickedDeskId, setPickedDeskId] = useState<string>('');
  const [selectedPinId, setSelectedPinId] = useState<number | null>(null);
  const [editPin, setEditPin] = useState<{ w: number; h: number; r: number } | null>(null);
  const [gridSize, setGridSize] = useState(10);
  const [snapDesks, setSnapDesks] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [snapLines, setSnapLines] = useState<{ type: 'x' | 'y'; value: number }[]>([]);
  const imgRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapTransform = useRef<any>(null);
  const hasMoved = useRef(false);

  const [locCountry, setLocCountry] = useState('');
  const [locCity, setLocCity] = useState('');
  const [locBuilding, setLocBuilding] = useState('');
  const [locFloor, setLocFloor] = useState('');
  const [newFloorId, setNewFloorId] = useState('');
  const [newFloorName, setNewFloorName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParking, setIsParking] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Floor | null>(null);

  function loadFloors() {
    fetch('/api/floors').then((r) => r.json()).then((d) => setFloors(Array.isArray(d) ? d : []));
  }
  function loadAllDesks() {
    fetch('/api/desks').then((r) => r.json()).then((d) => setAllDesks(Array.isArray(d) ? d : []));
  }
  function loadFloorDesks(floorId: string) {
    fetch('/api/desks').then((r) => r.json()).then((d) => {
      setFloorDesks(Array.isArray(d) ? d.filter((x: Desk) => x.floorId === floorId) : []);
    });
  }
  function loadLocations() {
    fetch('/api/locations').then((r) => r.json()).then((d) => setLocations(Array.isArray(d) ? d : []));
  }

  useEffect(() => { loadFloors(); loadAllDesks(); loadLocations(); }, []);

  useEffect(() => {
    if (locBuilding && locFloor) {
      setNewFloorId(slugify(locBuilding) + '-' + slugify(locFloor));
      setNewFloorName(locBuilding + ' · ' + locFloor);
    }
  }, [locBuilding, locFloor]);

  async function handleUpload() {
    if (!selectedFile) { setMsg('Please choose a floor plan image'); return; }
    if (!locCountry || !locCity || !locBuilding || !locFloor) { setMsg('Please select Country, City, Building and Floor'); return; }
    if (!newFloorId || !newFloorName) { setMsg('Floor ID and Floor Name are required'); return; }
    setUploading(true); setMsg('');
    const formData = new FormData();
    formData.append('file', selectedFile);
    const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
    const { url } = await uploadRes.json();
    const floorRes = await fetch('/api/floors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ floorId: newFloorId, name: newFloorName, imageUrl: url, isParking }),
    });
    const floor = await floorRes.json();
    setUploading(false);
    setMsg('Floor plan uploaded successfully');
    setSelectedFile(null); setIsParking(false);
    setLocCountry(''); setLocCity(''); setLocBuilding(''); setLocFloor('');
    setNewFloorId(''); setNewFloorName('');
    loadFloors();
    setSelectedFloor(floor);
    loadFloorDesks(floor.floorId);
  }

  function selectFloor(f: Floor) {
    setSelectedFloor(f);
    loadFloorDesks(f.floorId);
    setPendingPos(null);
    setSelectedPinId(null);
    setEditPin(null);
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!selectedFloor || !imgRef.current || dragId !== null) return;
    const rect = imgRef.current.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 1000);
    const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 1000);
    setPendingPos({ x: xPct, y: yPct });
    setPickedDeskId('');
    setSelectedPinId(null);
    setEditPin(null);
  }

  async function placeDesk() {
    if (!pendingPos || !pickedDeskId || !selectedFloor) return;
    await fetch('/api/desks/' + pickedDeskId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ xPosition: pendingPos.x, yPosition: pendingPos.y, floorId: selectedFloor.floorId }),
    });
    setMsg('Desk placed');
    setTimeout(() => setMsg(''), 3000);
    setPendingPos(null); setPickedDeskId('');
    loadFloorDesks(selectedFloor.floorId); loadAllDesks();
  }

  function applySnap(rawX: number, rawY: number, id: number) {
    const DESK_THRESHOLD = 12;
    let x = gridSize > 0 ? Math.round(rawX / gridSize) * gridSize : rawX;
    let y = gridSize > 0 ? Math.round(rawY / gridSize) * gridSize : rawY;
    const lines: { type: 'x' | 'y'; value: number }[] = [];
    if (snapDesks) {
      for (const d of floorDesks) {
        if (d.id === id) continue;
        if (Math.abs(rawX - d.xPosition) < DESK_THRESHOLD) { x = d.xPosition; lines.push({ type: 'x', value: d.xPosition }); }
        if (Math.abs(rawY - d.yPosition) < DESK_THRESHOLD) { y = d.yPosition; lines.push({ type: 'y', value: d.yPosition }); }
      }
    }
    return { x, y, lines };
  }

  function handlePinMouseDown(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    hasMoved.current = false;
    setDragId(id);
  }

  function handleMapMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (dragId === null || !imgRef.current) return;
    hasMoved.current = true;
    const rect = imgRef.current.getBoundingClientRect();
    const rawX = Math.max(0, Math.min(1000, ((e.clientX - rect.left) / rect.width) * 1000));
    const rawY = Math.max(0, Math.min(1000, ((e.clientY - rect.top) / rect.height) * 1000));
    const { x: xPct, y: yPct, lines } = applySnap(rawX, rawY, dragId);
    setSnapLines(lines);
    setFloorDesks((prev) => prev.map((d) => (d.id === dragId ? { ...d, xPosition: xPct, yPosition: yPct } : d)));
  }

  function handleMapMouseUp() {
    if (dragId === null) return;
    setSnapLines([]);
    if (!hasMoved.current) {
      // Click (not drag) → toggle selection
      if (selectedPinId === dragId) {
        setSelectedPinId(null);
        setEditPin(null);
      } else {
        const desk = floorDesks.find((d) => d.id === dragId);
        if (desk) {
          setSelectedPinId(desk.id);
          setEditPin({ w: desk.pinWidth ?? 16, h: desk.pinHeight ?? 10, r: desk.pinRotation ?? 0 });
          setPendingPos(null);
        }
      }
    } else {
      // Drag → save position
      const desk = floorDesks.find((d) => d.id === dragId);
      if (desk) {
        fetch('/api/desks/' + desk.id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ xPosition: Math.round(desk.xPosition), yPosition: Math.round(desk.yPosition) }),
        }).then(() => { setMsg('Position saved'); setTimeout(() => setMsg(''), 2000); });
      }
    }
    hasMoved.current = false;
    setDragId(null);
  }

  function removeDesk(id: number) {
    fetch('/api/desks/' + id, { method: 'DELETE' }).then(() => {
      if (selectedFloor) { loadFloorDesks(selectedFloor.floorId); loadAllDesks(); }
      if (selectedPinId === id) { setSelectedPinId(null); setEditPin(null); }
    });
  }

  async function savePinSettings() {
    if (!selectedPinId || !editPin || !selectedFloor) return;
    await fetch('/api/desks/' + selectedPinId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinWidth: editPin.w, pinHeight: editPin.h, pinRotation: editPin.r }),
    });
    setMsg('Pin settings saved');
    setTimeout(() => setMsg(''), 2000);
    loadFloorDesks(selectedFloor.floorId);
    setSelectedPinId(null);
    setEditPin(null);
  }

  async function confirmDeleteFloor() {
    if (!deleteTarget) return;
    await fetch('/api/floors/' + deleteTarget.id, { method: 'DELETE' });
    setDeleteTarget(null);
    if (selectedFloor?.id === deleteTarget.id) setSelectedFloor(null);
    setMsg('Floor plan deleted');
    setTimeout(() => setMsg(''), 3000);
    loadFloors(); loadAllDesks();
  }

  const pickedDesk = allDesks.find((d) => d.id === Number(pickedDeskId));
  const selectedPinDesk = floorDesks.find((d) => d.id === selectedPinId);
  const placedIds = new Set(floorDesks.map((d) => d.id));
  const sortedDesks = [...allDesks].sort((a, b) => {
    const aPlaced = placedIds.has(a.id);
    const bPlaced = placedIds.has(b.id);
    if (aPlaced !== bPlaced) return aPlaced ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="p-5 sm:p-7 md:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Floor Plan Builder</h2>
        <p className="text-sm text-gray-400 mt-0.5">Upload floor maps and place desk pins</p>
      </div>

      {msg && <div className="p-3 bg-green-50 text-green-800 rounded-lg mb-4 text-sm">{msg}</div>}

      {/* Upload */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 mb-6">
        <button
          onClick={() => setShowUpload((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <span className="text-sm font-semibold text-gray-900">Upload new floor plan</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showUpload ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {showUpload && (
          <div className="px-5 pb-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Country</label>
                <select value={locCountry} onChange={(e) => { setLocCountry(e.target.value); setLocCity(''); setLocBuilding(''); setLocFloor(''); }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">Select…</option>
                  {locations.map((l) => l.country).filter((v, i, a) => v && a.indexOf(v) === i).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">City</label>
                <select value={locCity} onChange={(e) => { setLocCity(e.target.value); setLocBuilding(''); setLocFloor(''); }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" disabled={!locCountry}>
                  <option value="">Select…</option>
                  {locations.filter((l) => l.country === locCountry).map((l) => l.city).filter((v, i, a) => v && a.indexOf(v) === i).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Building</label>
                <select value={locBuilding} onChange={(e) => { setLocBuilding(e.target.value); setLocFloor(''); }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" disabled={!locCity}>
                  <option value="">Select…</option>
                  {locations.filter((l) => l.country === locCountry && l.city === locCity).map((l) => l.building).filter((v, i, a) => v && a.indexOf(v) === i).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Floor</label>
                <select value={locFloor} onChange={(e) => setLocFloor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" disabled={!locBuilding}>
                  <option value="">Select…</option>
                  {locations.filter((l) => l.country === locCountry && l.city === locCity && l.building === locBuilding).map((l) => l.floor).filter((v, i, a) => v && a.indexOf(v) === i).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Floor ID</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Auto-filled" value={newFloorId} onChange={(e) => setNewFloorId(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Floor Name</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Auto-filled" value={newFloorName} onChange={(e) => setNewFloorName(e.target.value)} />
              </div>
              <div className="flex flex-col justify-end">
                <label className="text-xs text-gray-500 font-medium block mb-1">Floor Plan Image</label>
                <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} className="text-sm" />
                {selectedFile && <p className="text-xs text-gray-400 mt-1 truncate">{selectedFile.name}</p>}
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <button type="button" onClick={() => setIsParking((v) => !v)}
                  className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${isParking ? 'bg-orange-500' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isParking ? 'translate-x-4' : ''}`} />
                </button>
                <span className="text-sm text-gray-600">Parking floor</span>
              </label>
              <button onClick={handleUpload} disabled={uploading}
                className="px-5 py-2 bg-[#1a2535] text-white text-sm font-medium rounded-lg hover:bg-[#243148] disabled:opacity-50">
                {uploading ? 'Uploading…' : 'Upload Floor Plan'}
              </button>
              {uploading && <p className="text-sm text-gray-400">Please wait…</p>}
            </div>
          </div>
        )}
      </div>

      {/* Floor selector */}
      <div className="flex gap-2 flex-wrap mb-6">
        {floors.map((f) => (
          <div key={f.id} className="flex items-center group">
            <button onClick={() => selectFloor(f)}
              className={`px-3 py-1.5 rounded-l-full border text-sm ${selectedFloor?.id === f.id ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-700 border-gray-200'}`}>
              {f.name}
            </button>
            <button onClick={() => setDeleteTarget(f)} title="Delete floor plan"
              className={`px-2 py-1.5 rounded-r-full border-y border-r text-sm leading-none transition-colors ${selectedFloor?.id === f.id ? 'bg-[#1e3a5f] border-[#1e3a5f] text-white/60 hover:text-white hover:bg-red-600 hover:border-red-600' : 'bg-white border-gray-200 text-gray-300 hover:text-red-500 hover:border-red-300'}`}>
              ×
            </button>
          </div>
        ))}
        {floors.length === 0 && <p className="text-sm text-gray-400">No floor plans uploaded yet.</p>}
      </div>

      {/* Delete floor modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-1">Delete floor plan?</h3>
            <p className="text-sm text-gray-500 mb-4">You are about to delete <span className="font-semibold text-gray-800">{deleteTarget.name}</span>.</p>
            <div className="bg-amber-50 rounded-xl p-3 mb-5 text-xs text-amber-800 space-y-1">
              <p className="font-semibold mb-1">This will also:</p>
              <p>• Remove all desk pins placed on this floor map</p>
              <p>• Clear the floor assignment on {allDesks.filter((d) => d.floorId === deleteTarget.floorId).length} desk(s)</p>
              <p>• The image URL will no longer be accessible from the app</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDeleteFloor} className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {selectedFloor && selectedFloor.isParking && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 5v3h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <p className="font-semibold text-orange-900 mb-1">This is a parking floor</p>
          <p className="text-sm text-orange-700 mb-4">Desk pins cannot be placed on parking floors. Use the Parking Spot Builder to assign spots to this map.</p>
          <a href="/admin/parking" className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">Go to Parking Spot Builder</a>
        </div>
      )}

      {selectedFloor && !selectedFloor.isParking && (
        <div className="flex gap-5 flex-col lg:flex-row">
          {/* Map */}
          <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100">
            {/* Snap controls */}
            {/* Toolbar: snap controls + zoom buttons */}
            <div className="flex items-center gap-4 mb-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Grid</span>
                <select value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))}
                  className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none">
                  <option value={0}>Off</option>
                  <option value={5}>Fine (0.5%)</option>
                  <option value={10}>Normal (1%)</option>
                  <option value={20}>Coarse (2%)</option>
                  <option value={50}>Large (5%)</option>
                </select>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" checked={snapDesks} onChange={(e) => setSnapDesks(e.target.checked)} className="accent-[#1e3a5f] w-3.5 h-3.5" />
                <span className="text-xs text-gray-500">Snap to desks</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="accent-[#1e3a5f] w-3.5 h-3.5" />
                <span className="text-xs text-gray-500">Show grid</span>
              </label>
              <div className="flex items-center gap-1 ml-auto">
                <button onClick={() => mapTransform.current?.zoomIn(0.4)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-base leading-none">+</button>
                <button onClick={() => mapTransform.current?.zoomOut(0.4)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-base leading-none">−</button>
                <button onClick={() => mapTransform.current?.resetTransform()} className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 text-sm leading-none">↺</button>
              </div>
            </div>
            <TransformWrapper
              ref={mapTransform}
              initialScale={1} minScale={0.2} maxScale={8} centerOnInit
              panning={{ disabled: dragId !== null }}
              doubleClick={{ mode: 'zoomIn', step: 0.5 }}
              wheel={{ step: 0.2 }}
            >
              <TransformComponent wrapperStyle={{ width: '100%' }} contentStyle={{ width: '100%' }}>
                <div
                  ref={imgRef}
                  onClick={handleImageClick}
                  onMouseMove={handleMapMouseMove}
                  onMouseUp={handleMapMouseUp}
                  onMouseLeave={handleMapMouseUp}
                  style={{ position: 'relative', width: '100%', borderRadius: 8, cursor: dragId ? 'grabbing' : pendingPos ? 'default' : 'crosshair', userSelect: 'none', lineHeight: 0 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedFloor.imageUrl} alt={selectedFloor.name} style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }} draggable={false} />

                  {/* Grid overlay */}
                  {showGrid && gridSize > 0 && (
                    <div style={{
                      position: 'absolute', inset: 0, pointerEvents: 'none',
                      backgroundImage: `linear-gradient(to right,rgba(59,130,246,0.12) 1px,transparent 1px),linear-gradient(to bottom,rgba(59,130,246,0.12) 1px,transparent 1px)`,
                      backgroundSize: `${gridSize / 10}% ${gridSize / 10}%`,
                    }} />
                  )}

                  {/* Snap alignment lines */}
                  {snapLines.map((line, i) => line.type === 'x' ? (
                    <div key={i} style={{ position: 'absolute', left: `${line.value / 10}%`, top: 0, bottom: 0, width: 1, background: 'rgba(59,130,246,0.55)', pointerEvents: 'none' }} />
                  ) : (
                    <div key={i} style={{ position: 'absolute', top: `${line.value / 10}%`, left: 0, right: 0, height: 1, background: 'rgba(59,130,246,0.55)', pointerEvents: 'none' }} />
                  ))}

                  {/* Pending position indicator */}
                  {pendingPos && (
                    <div style={{ position: 'absolute', left: `${pendingPos.x / 10}%`, top: `${pendingPos.y / 10}%`, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                      <div className="w-4 h-4 rounded-full bg-blue-500 ring-2 ring-white shadow-lg animate-pulse" />
                    </div>
                  )}

                  {/* Desk pins */}
                  {floorDesks.map((d) => {
                    const pw = d.pinWidth ?? 16;
                    const ph = d.pinHeight ?? 10;
                    const pr = d.pinRotation ?? 0;
                    const isSelected = selectedPinId === d.id;
                    return (
                      <div
                        key={d.id}
                        onMouseDown={(e) => handlePinMouseDown(e, d.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          left: `${d.xPosition / 10}%`,
                          top: `${d.yPosition / 10}%`,
                          transform: 'translate(-50%, -50%)',
                          cursor: dragId === d.id ? 'grabbing' : 'grab',
                        }}
                        className="group"
                        title={d.name + ' · ' + d.zone}
                      >
                        <div style={{
                          width: pw, height: ph, borderRadius: 2,
                          background: d.restricted ? '#7c3aed' : '#16a34a',
                          transform: `rotate(${pr}deg)`,
                          opacity: isSelected ? 0.7 : 1,
                          display: 'flex', flexDirection: 'column', alignItems: 'stretch',
                          justifyContent: 'center', overflow: 'hidden',
                          padding: '0 3px', boxSizing: 'border-box',
                        }}>
                          {pw >= 30 && ph >= 14 && (
                            <span style={{ fontSize: Math.min(7, Math.floor(ph * 0.40)), fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center', lineHeight: 1, letterSpacing: '0.01em' }}>
                              {d.name}
                            </span>
                          )}
                          {pw >= 30 && ph >= 22 && d.zone && (
                            <span style={{ fontSize: Math.min(7, Math.floor(ph * 0.35)), color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center', lineHeight: 1.2 }}>
                              {d.zone}
                            </span>
                          )}
                        </div>
                        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap pointer-events-none z-30">
                          {d.name}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeDesk(d.id); }}
                          className="hidden group-hover:flex absolute -top-2 -right-2 w-4 h-4 bg-red-600 text-white rounded-full items-center justify-center text-[9px] z-30"
                        >×</button>
                      </div>
                    );
                  })}
                </div>
              </TransformComponent>
            </TransformWrapper>
          </div>

          {/* Right panel */}
          <div className="lg:w-72 flex-shrink-0">
            {pendingPos ? (
              /* Place Desk */
              <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-sm">Place Desk</h3>
                  <button onClick={() => setPendingPos(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                </div>
                <p className="text-xs text-gray-400 mb-4">Position: {pendingPos.x}, {pendingPos.y}</p>
                <div className="mb-3">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Select desk</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white"
                    value={pickedDeskId} onChange={(e) => setPickedDeskId(e.target.value)}>
                    <option value="">Choose a desk...</option>
                    {sortedDesks.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}{placedIds.has(d.id) ? ' (on this floor)' : d.floorId !== selectedFloor.floorId ? ' (other floor)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {pickedDesk && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs space-y-1.5">
                    <div className="flex justify-between"><span className="text-gray-400">Zone</span><span className="font-medium text-gray-700">{pickedDesk.zone || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Current floor</span><span className="font-medium text-gray-700">{pickedDesk.floorId}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Restricted</span><span className="font-medium text-gray-700">{pickedDesk.restricted ? 'Yes' : 'No'}</span></div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amenities</span>
                      <span className="font-medium text-gray-700">{[pickedDesk.hasMonitor && 'Mon', pickedDesk.hasKeyboard && 'KB', pickedDesk.hasPedestal && 'Ped'].filter(Boolean).join(', ') || 'None'}</span>
                    </div>
                  </div>
                )}
                <button onClick={placeDesk} disabled={!pickedDeskId}
                  className="w-full py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#16304d] disabled:opacity-40 disabled:cursor-not-allowed">
                  Place Desk
                </button>
              </div>
            ) : selectedPinId && editPin ? (
              /* Edit Pin */
              <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Edit Pin</h3>
                    {selectedPinDesk && <p className="text-xs text-gray-400 mt-0.5">{selectedPinDesk.name}</p>}
                  </div>
                  <button onClick={() => { setSelectedPinId(null); setEditPin(null); }} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                </div>

                {/* Live preview */}
                <div className="flex items-center justify-center bg-gray-100 rounded-xl mb-4" style={{ height: 72 }}>
                  <div style={{
                    width: editPin.w,
                    height: editPin.h,
                    borderRadius: 2,
                    background: selectedPinDesk?.restricted ? '#7c3aed' : '#16a34a',
                    transform: `rotate(${editPin.r}deg)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '0 3px',
                    boxSizing: 'border-box',
                  }}>
                    {editPin.w >= 30 && editPin.h >= 14 && (
                      <span style={{ fontSize: Math.min(7, Math.floor(editPin.h * 0.40)), fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', lineHeight: 1 }}>
                        {selectedPinDesk?.name}
                      </span>
                    )}
                    {editPin.w >= 30 && editPin.h >= 22 && selectedPinDesk?.zone && (
                      <span style={{ fontSize: Math.min(7, Math.floor(editPin.h * 0.35)), color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', lineHeight: 1.2 }}>
                        {selectedPinDesk.zone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Width */}
                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-gray-500">Width</label>
                    <span className="text-xs text-gray-700 font-mono">{editPin.w}px</span>
                  </div>
                  <input type="range" min={6} max={60} value={editPin.w}
                    onChange={(e) => setEditPin({ ...editPin, w: Number(e.target.value) })}
                    className="w-full accent-[#1e3a5f]" style={{ height: 6 }} />
                </div>

                {/* Height */}
                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-gray-500">Height</label>
                    <span className="text-xs text-gray-700 font-mono">{editPin.h}px</span>
                  </div>
                  <input type="range" min={4} max={40} value={editPin.h}
                    onChange={(e) => setEditPin({ ...editPin, h: Number(e.target.value) })}
                    className="w-full accent-[#1e3a5f]" style={{ height: 6 }} />
                </div>

                {/* Rotation */}
                <div className="mb-5">
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-medium text-gray-500">Rotation</label>
                    <span className="text-xs text-gray-700 font-mono">{editPin.r}°</span>
                  </div>
                  <input type="range" min={0} max={355} step={5} value={editPin.r}
                    onChange={(e) => setEditPin({ ...editPin, r: Number(e.target.value) })}
                    className="w-full accent-[#1e3a5f]" style={{ height: 6 }} />
                  <div className="flex justify-between mt-1 text-[10px] text-gray-300">
                    <span>0°</span><span>90°</span><span>180°</span><span>270°</span><span>355°</span>
                  </div>
                </div>

                <button onClick={savePinSettings}
                  className="w-full py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#16304d]">
                  Save Pin Settings
                </button>
              </div>
            ) : (
              /* Desks on floor */
              <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Desks on this floor</h3>
                {floorDesks.length === 0 ? (
                  <p className="text-xs text-gray-400">No desks placed yet. Click the map to start.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                    {floorDesks.map((d) => (
                      <div key={d.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div style={{
                            width: 14, height: 9, borderRadius: 2, flexShrink: 0,
                            background: d.restricted ? '#7c3aed' : '#16a34a',
                            transform: `rotate(${d.pinRotation ?? 0}deg)`,
                          }} />
                          <span className="font-medium text-gray-800">{d.name}</span>
                          <span className="text-gray-400">{d.zone}</span>
                        </div>
                        <button onClick={() => removeDesk(d.id)} className="text-red-400 hover:text-red-600 font-medium ml-2">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-300 mt-3">Click any pin to resize/rotate · Click map to place</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
