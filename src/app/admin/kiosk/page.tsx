'use client';
import { useEffect, useState } from 'react';

type Settings = Record<string, string>;

const DEFAULTS: Settings = {
  kiosk_name: 'Floor Kiosk',
  checkin_window_before: '30',
  checkin_window_after: '60',
  auto_release_minutes: '60',
  idle_timeout_seconds: '30',
  success_display_seconds: '5',
  kiosk_pin: '',
  welcome_message: 'Welcome! Scan your QR code to check in.',
  company_name: 'Albertsons',
  floor_assignment: '',
};

const SECTIONS = [
  {
    title: 'Identity',
    desc: 'Name and location of this kiosk unit',
    fields: [
      { key: 'kiosk_name', label: 'Kiosk Name', type: 'text', placeholder: 'e.g. Floor 2 Entrance Kiosk' },
      { key: 'company_name', label: 'Company / Site Name', type: 'text', placeholder: 'e.g. Albertsons' },
      { key: 'floor_assignment', label: 'Floor Assignment', type: 'text', placeholder: 'e.g. Floor 2' },
    ],
  },
  {
    title: 'Check-in Rules',
    desc: 'Control when employees can check in and how long before auto-release',
    fields: [
      { key: 'checkin_window_before', label: 'Allow check-in this many minutes before booking', type: 'number', placeholder: '30', suffix: 'min' },
      { key: 'checkin_window_after', label: 'Allow check-in this many minutes after booking starts', type: 'number', placeholder: '60', suffix: 'min' },
      { key: 'auto_release_minutes', label: 'Auto-release desk if not checked in after', type: 'number', placeholder: '60', suffix: 'min' },
    ],
  },
  {
    title: 'Display Settings',
    desc: 'Text shown on the kiosk idle screen',
    fields: [
      { key: 'welcome_message', label: 'Welcome Message', type: 'text', placeholder: 'Welcome! Scan your QR code to check in.' },
      { key: 'success_display_seconds', label: 'Show success screen for', type: 'number', placeholder: '5', suffix: 'sec' },
      { key: 'idle_timeout_seconds', label: 'Return to idle after inactivity', type: 'number', placeholder: '30', suffix: 'sec' },
    ],
  },
  {
    title: 'Security',
    desc: 'PIN required to exit kiosk mode or access settings on the device',
    fields: [
      { key: 'kiosk_pin', label: 'Kiosk Exit PIN', type: 'password', placeholder: '4–6 digit PIN' },
    ],
  },
];

export default function KioskSettingsPage() {
  const [settings, setSettings] = useState<Settings>({ ...DEFAULTS });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d: Settings) => {
        setSettings({ ...DEFAULTS, ...d });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function update(key: string, value: string) {
    setSettings((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  async function save() {
    const entries = Object.entries(settings);
    await Promise.all(
      entries.map(([key, value]) =>
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        })
      )
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading...</div>;

  return (
    <div className="p-5 sm:p-7 md:p-8 max-w-2xl">
      <div className="flex items-start justify-between mb-7">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Kiosk Settings</h2>
          <p className="text-sm text-gray-400 mt-0.5">Configure check-in kiosk behaviour, display, and security</p>
        </div>
        <button
          onClick={save}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${saved ? 'bg-emerald-500 text-white' : 'bg-[#1a2535] text-white hover:bg-[#243148]'}`}
        >
          {saved ? 'Saved ✓' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col gap-5">
        {SECTIONS.map((section) => (
          <div key={section.title} className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">{section.title}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{section.desc}</p>
            </div>
            <div className="flex flex-col gap-3">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="text-xs text-gray-500 font-medium block mb-1">{field.label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={settings[field.key] ?? ''}
                      onChange={(e) => update(field.key, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2535]"
                    />
                    {field.suffix && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-2 rounded-lg whitespace-nowrap">{field.suffix}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 bg-amber-50 rounded-2xl p-4 ring-1 ring-amber-100">
        <p className="text-xs font-semibold text-amber-800 mb-1">How kiosk mode works</p>
        <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
          <li>The kiosk device runs the app in full-screen browser mode</li>
          <li>Employees scan their booking QR code at the entrance</li>
          <li>Check-in is only allowed within the configured window</li>
          <li>Desks are automatically released if the employee does not check in</li>
          <li>The exit PIN prevents employees from exiting kiosk mode</li>
        </ul>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={save}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${saved ? 'bg-emerald-500 text-white' : 'bg-[#1a2535] text-white hover:bg-[#243148]'}`}
        >
          {saved ? 'Saved ✓' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
