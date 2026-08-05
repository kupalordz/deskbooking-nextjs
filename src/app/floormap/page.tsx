'use client';
import { useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

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

type Floor = { id: number; floorId: string; name: string; imageUrl: string };

type BookingSummary = { bookingDate: string; status: string; deskId: number };

export default function FloorMap() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [desks, setDesks] = useState<Desk[]>([]);
  const [floor, setFloor] = useState('');
  const [bookedIds, setBookedIds] = useState<number[]>([]);
  const [selected, setSelected] = useState<Desk | null>(null);
  const [msg, setMsg] = useState('');

  function load() {
    fetch('/api/floors').then((r) => r.json()).then((d) => {
      const list = Array.isArray(d) ? d : [];
      setFloors(list);
      if (list.length > 0 && !floor) setFloor(list[0].floorId);
    });
    fetch('/api/desks').then((r) => r.json()).then((d) => setDesks(Array.isArray(d) ? d : []));
    fetch('/api/bookings').then((r) => r.json()).then((d: BookingSummary[]) => {
      const today = new Date().toISOString().split('T')[0];
      const ids = (Array.isArray(d) ? d : [])
        .filter((b: BookingSummary) => b.bookingDate === today && b.status !== 'CANCELLED')
        .map((b: BookingSummary) => b.deskId);
      setBookedIds(ids);
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentFloor = floors.find((f) => f.floorId === floor);
  const floorDesks = desks.filter((d) => d.floorId === floor && d.active);

  function pinColor(d: Desk) {
    if (d.restricted) return '#7c3aed';
    if (bookedIds.includes(d.id)) return '#dc2626';
    return '#16a34a';
  }

  function book() {
    if (!selected) return;
    const today = new Date().toISOString().split('T')[0];
    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deskId: selected.id, bookingDate: today }),
    }).then((r) => {
      if (r.ok) {
        setMsg('Booked ' + selected.name + '!');
        setBookedIds((p) => [...p, selected.id]);
        setSelected(null);
      } else {
        setMsg('Already booked for today');
      }
    });
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-gray-200 flex gap-2 items-center flex-wrap">
        <span className="text-sm font-medium text-gray-700 mr-2 whitespace-nowrap">Floor:</span>
        {floors.map((f) => (
          <button
            key={f.floorId}
            onClick={() => { setFloor(f.floorId); setSelected(null); }}
            className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap ${floor === f.floorId ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-gray-700 border-gray-200'}`}
          >
            {f.name}
          </button>
        ))}
        {floors.length === 0 && <span className="text-sm text-gray-400">No floors yet. Upload one in Admin.</span>}
        <div className="flex gap-3 sm:gap-4 text-xs text-gray-500 items-center flex-wrap sm:ml-auto">
          <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block flex-shrink-0"></span>Available</span>
          <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block flex-shrink-0"></span>Booked</span>
          <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block flex-shrink-0"></span>Restricted</span>
        </div>
      </div>

      <div className="flex-1 relative bg-gray-50 overflow-hidden">
        {!currentFloor && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            {floors.length === 0 ? 'No floor plans uploaded yet.' : 'Select a floor above.'}
          </div>
        )}

        {currentFloor && (
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={5}
            centerOnInit
            doubleClick={{ mode: 'zoomIn', step: 0.7 }}
            pinch={{ step: 5 }}
            wheel={{ step: 0.2 }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <div className="w-full h-full relative">
                <div className="absolute top-3 right-3 z-50 flex flex-col gap-1 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                  <button type="button" onClick={() => zoomIn()} className="w-10 h-10 flex items-center justify-center text-xl text-gray-700 hover:bg-gray-50 border-b border-gray-200">+</button>
                  <button type="button" onClick={() => zoomOut()} className="w-10 h-10 flex items-center justify-center text-xl text-gray-700 hover:bg-gray-50 border-b border-gray-200">-</button>
                  <button type="button" onClick={() => resetTransform()} className="w-10 h-10 flex items-center justify-center text-[10px] text-gray-700 hover:bg-gray-50">Reset</button>
                </div>

                <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%' }}>
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentFloor.imageUrl}
                      alt={currentFloor.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                      draggable={false}
                    />
                    {floorDesks.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => setSelected(d)}
                        style={{
                          position: 'absolute',
                          left: `${d.xPosition / 10}%`,
                          top: `${d.yPosition / 10}%`,
                          transform: 'translate(-50%, -50%)',
                          cursor: 'pointer',
                          zIndex: 20,
                        }}
                        title={d.name}
                      >
                        <div
                          style={{
                            position: 'relative',
                            width: selected?.id === d.id ? '28px' : '22px',
                            height: selected?.id === d.id ? '28px' : '22px',
                            borderRadius: '50%',
                            background: pinColor(d),
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </TransformComponent>
              </div>
            )}
          </TransformWrapper>
        )}
      </div>

      {msg && <div className="px-4 sm:px-6 py-3 bg-green-50 border-t border-green-200 text-sm text-green-800">{msg}</div>}

      {selected && (
        <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center gap-4 flex-wrap">
          <div>
            <p className="font-semibold">{selected.name}</p>
            <p className="text-sm text-gray-500">Zone: {selected.zone} - Floor: {selected.floorId}</p>
          </div>
          <div className="flex gap-2">
            {!bookedIds.includes(selected.id) && (
              <button onClick={book} className="px-5 py-2.5 bg-[#1e3a5f] text-white rounded-lg font-medium hover:bg-[#16304d]">Book Today</button>
            )}
            {bookedIds.includes(selected.id) && <span className="text-red-600 font-medium text-sm">Already booked</span>}
            <button onClick={() => setSelected(null)} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}