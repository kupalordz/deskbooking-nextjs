'use client';
import { useEffect, useRef, useState } from 'react';

type Floor = { id: number; floorId: string; name: string; imageUrl: string };
type Desk = {
  id: number;
  name: string;
  zone: string;
  floorId: string;
  xPosition: number;
  yPosition: number;
  restricted: boolean;
};

export default function FloorPlanBuilder() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [desks, setDesks] = useState<Desk[]>([]);
  const [msg, setMsg] = useState('');
  const [newFloorId, setNewFloorId] = useState('');
  const [newFloorName, setNewFloorName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  function loadFloors() {
    fetch('/api/floors').then((r) => r.json()).then((d) => setFloors(Array.isArray(d) ? d : []));
  }
  function loadDesks(floorId: string) {
    fetch('/api/desks').then((r) => r.json()).then((d) => {
      setDesks(Array.isArray(d) ? d.filter((x: Desk) => x.floorId === floorId) : []);
    });
  }

  useEffect(() => { loadFloors(); }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !newFloorId || !newFloorName) {
      setMsg('Enter Floor ID and Name before choosing a file');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
    const { url } = await uploadRes.json();

    const floorRes = await fetch('/api/floors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ floorId: newFloorId, name: newFloorName, imageUrl: url }),
    });
    const floor = await floorRes.json();

    setUploading(false);
    setMsg('Floor plan uploaded');
    setNewFloorId('');
    setNewFloorName('');
    loadFloors();
    setSelectedFloor(floor);
    loadDesks(floor.floorId);
  }

  function selectFloor(f: Floor) {
    setSelectedFloor(f);
    loadDesks(f.floorId);
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!selectedFloor || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 1000;
    const yPct = ((e.clientY - rect.top) / rect.height) * 1000;

    const name = prompt('Desk name (e.g. D-101):');
    if (!name) return;
    const zone = prompt('Zone (e.g. Zone A):') || 'Zone A';

    fetch('/api/desks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        zone,
        floorId: selectedFloor.floorId,
        buildingId: 'hq',
        xPosition: Math.round(xPct),
        yPosition: Math.round(yPct),
        active: true,
        restricted: false,
      }),
    }).then(() => {
      setMsg('Desk placed');
      loadDesks(selectedFloor.floorId);
    });
  }

  function handlePinMouseDown(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    setDragId(id);
  }

  function handleMapMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (dragId === null || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(1000, ((e.clientX - rect.left) / rect.width) * 1000));
    const yPct = Math.max(0, Math.min(1000, ((e.clientY - rect.top) / rect.height) * 1000));
    setDesks((prev) => prev.map((d) => (d.id === dragId ? { ...d, xPosition: xPct, yPosition: yPct } : d)));
  }

  function handleMapMouseUp() {
    if (dragId === null) return;
    const desk = desks.find((d) => d.id === dragId);
    if (desk) {
      fetch('/api/desks/' + desk.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xPosition: Math.round(desk.xPosition), yPosition: Math.round(desk.yPosition) }),
      }).then(() => setMsg('Desk position saved'));
    }
    setDragId(null);
  }

  function removeDesk(id: number) {
    fetch('/api/desks/' + id, { method: 'DELETE' }).then(() => {
      if (selectedFloor) loadDesks(selectedFloor.floorId);
    });
  }

  return (
    <div className="px-4 py-6 sm:px-8 md:px-12 md:py-12 max-w-6xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 tracking-tight">Floor Plan Builder</h2>

      {msg && <div className="p-3 bg-green-50 text-green-800 rounded-lg mb-4 text-sm">{msg}</div>}

      <div className="bg-white rounded-2xl p-5 md:p-6 mb-6 shadow-sm ring-1 ring-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Upload new floor plan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <input
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            placeholder="Floor ID (e.g. floor-4)"
            value={newFloorId}
            onChange={(e) => setNewFloorId(e.target.value)}
          />
          <input
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            placeholder="Floor name (e.g. HQ - Level 4)"
            value={newFloorName}
            onChange={(e) => setNewFloorName(e.target.value)}
          />
          <input type="file" accept="image/*" onChange={handleUpload} className="text-sm" />
        </div>
        {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {floors.map((f) => (
          <button
            key={f.id}
            onClick={() => selectFloor(f)}
            className={`px-3 py-1.5 rounded-full border text-sm ${selectedFloor?.id === f.id ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-700 border-gray-200'}`}
          >
            {f.name}
          </button>
        ))}
        {floors.length === 0 && <p className="text-sm text-gray-400">No floor plans uploaded yet.</p>}
      </div>

      {selectedFloor && (
        <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm text-gray-500 mb-2">Click anywhere on the image to place a desk. Drag existing pins to reposition.</p>
          <div
            ref={imgRef}
            onClick={handleImageClick}
            onMouseMove={handleMapMouseMove}
            onMouseUp={handleMapMouseUp}
            onMouseLeave={handleMapMouseUp}
            style={{
              position: 'relative',
              width: '100%',
              borderRadius: '8px',
              cursor: 'crosshair',
              userSelect: 'none',
              lineHeight: 0,
            }}
          >
            <img
              src={selectedFloor.imageUrl}
              alt={selectedFloor.name}
              style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }}
              draggable={false}
            />
            {desks.map((d) => (
              <div
                key={d.id}
                onMouseDown={(e) => handlePinMouseDown(e, d.id)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  left: `${d.xPosition / 10}%`,
                  top: `${d.yPosition / 10}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'grab',
                }}
                className="group"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow ${d.restricted ? 'bg-purple-600' : 'bg-green-600'}`}>
                  {d.name.slice(-2)}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeDesk(d.id); }}
                  className="hidden group-hover:flex absolute -top-2 -right-2 w-4 h-4 bg-red-600 text-white rounded-full items-center justify-center text-[9px]"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}