'use client';
import { useEffect, useState } from 'react';

type Option = { id: number; category: string; value: string };

const CATEGORIES = [
  { key: 'country', label: 'Country' },
  { key: 'city', label: 'City' },
  { key: 'building', label: 'Building' },
  { key: 'floor', label: 'Floor' },
  { key: 'zone', label: 'Zone' },
  { key: 'role', label: 'Role' },
] as const;

type CategoryKey = typeof CATEGORIES[number]['key'];

export default function ManageListsPage() {
  const [options, setOptions] = useState<Option[]>([]);
  const [newValue, setNewValue] = useState<Record<CategoryKey, string>>({
    country: '', city: '', building: '', floor: '', zone: '', role: '',
  });
  const [msg, setMsg] = useState('');

  function load() {
    fetch('/api/dropdown-options').then((r) => r.json()).then((d) => setOptions(Array.isArray(d) ? d : []));
  }

  useEffect(() => { load(); }, []);

  function opts(cat: CategoryKey) {
    return options.filter((o) => o.category === cat);
  }

  async function addOption(cat: CategoryKey) {
    const val = newValue[cat].trim();
    if (!val) return;
    const r = await fetch('/api/dropdown-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: cat, value: val }),
    });
    if (r.ok) {
      setNewValue((p) => ({ ...p, [cat]: '' }));
      load();
    } else {
      setMsg('Already exists');
      setTimeout(() => setMsg(''), 2000);
    }
  }

  async function removeOption(id: number) {
    await fetch('/api/dropdown-options/' + id, { method: 'DELETE' });
    load();
  }

  return (
    <div className="p-5 sm:p-7 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Manage Lists</h2>
        <p className="text-sm text-gray-400 mt-0.5">Add or remove options for location fields and user roles</p>
      </div>

      {msg && <div className="p-3 bg-red-50 text-red-700 rounded-lg mb-4 text-sm">{msg}</div>}

      <div className="flex flex-col gap-4">
        {CATEGORIES.map(({ key, label }) => (
          <div key={key} className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{label}</h3>
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{opts(key).length} options</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3 min-h-[28px]">
              {opts(key).map((o) => (
                <span key={o.id} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full">
                  {o.value}
                  <button
                    onClick={() => removeOption(o.id)}
                    className="text-gray-400 hover:text-red-500 ml-0.5 text-sm font-bold leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              {opts(key).length === 0 && <span className="text-xs text-gray-400 italic">No options yet</span>}
            </div>

            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                placeholder={`Add ${label.toLowerCase()}...`}
                value={newValue[key]}
                onChange={(e) => setNewValue((p) => ({ ...p, [key]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && addOption(key)}
              />
              <button
                onClick={() => addOption(key)}
                className="px-4 py-2 bg-[#1a2535] text-white rounded-lg text-sm font-medium hover:bg-[#243148] transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
