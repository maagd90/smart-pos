import { useState, useEffect } from 'react';
import { Settings, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { AppSettings } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const { settings: storeSettings, featureFlags, setSettings, setFeatureFlags } = useSettingsStore();
  const [settings, setLocalSettings] = useState<AppSettings>(storeSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get('/settings')
      .then((res) => {
        if (res.data?.data) {
          const s = res.data.data;
          setLocalSettings(s);
          setSettings(s);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      setSettings(settings);
      toast.success('Settings saved successfully');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error ?? 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'input-field text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">System configuration and preferences</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Store Info */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Settings className="h-4 w-4 text-blue-600" />
          Store Information
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Store Name</label>
            <input
              value={settings.storeName}
              onChange={(e) => setLocalSettings({ ...settings, storeName: e.target.value })}
              className={inputClass}
              placeholder="My Store"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Store Phone</label>
            <input
              value={settings.storePhone}
              onChange={(e) => setLocalSettings({ ...settings, storePhone: e.target.value })}
              className={inputClass}
              placeholder="+1 234 567 8900"
            />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Store Address</label>
            <input
              value={settings.storeAddress}
              onChange={(e) => setLocalSettings({ ...settings, storeAddress: e.target.value })}
              className={inputClass}
              placeholder="123 Main St, City, State 12345"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Store Email</label>
            <input
              type="email"
              value={settings.storeEmail}
              onChange={(e) => setLocalSettings({ ...settings, storeEmail: e.target.value })}
              className={inputClass}
              placeholder="store@example.com"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={labelClass}>Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => setLocalSettings({ ...settings, timezone: e.target.value })}
              className={inputClass}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern (ET)</option>
              <option value="America/Chicago">Central (CT)</option>
              <option value="America/Denver">Mountain (MT)</option>
              <option value="America/Los_Angeles">Pacific (PT)</option>
              <option value="Asia/Bangkok">Bangkok (ICT)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Europe/London">London (GMT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Financial Settings */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Financial Settings</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => setLocalSettings({ ...settings, currency: e.target.value })}
              className={inputClass}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="THB">THB (฿)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="SGD">SGD ($)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Tax Rate (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={settings.taxRate}
              onChange={(e) => setLocalSettings({ ...settings, taxRate: Number(e.target.value) })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Loyalty Points Rate</label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={settings.loyaltyPointsRate}
              onChange={(e) => setLocalSettings({ ...settings, loyaltyPointsRate: Number(e.target.value) })}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-400">Points per $1 spent</p>
          </div>
        </div>
        <div>
          <label className={labelClass}>Receipt Footer</label>
          <textarea
            rows={2}
            value={settings.receiptFooter}
            onChange={(e) => setLocalSettings({ ...settings, receiptFooter: e.target.value })}
            className={inputClass}
            placeholder="Thank you for your purchase!"
          />
        </div>
      </div>

      {/* Feature Flags */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Feature Flags</h2>
        <p className="text-xs text-gray-400">Enable or disable system features</p>
        <div className="space-y-3">
          {(Object.entries(featureFlags) as [keyof typeof featureFlags, boolean][]).map(([key, enabled]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-xs text-gray-400">
                  {key === 'aiEnabled' && 'Enable AI-powered insights and recommendations'}
                  {key === 'messagingEnabled' && 'Enable SMS/WhatsApp/Email messaging'}
                  {key === 'loyaltyEnabled' && 'Enable customer loyalty points system'}
                  {key === 'analyticsEnabled' && 'Enable advanced analytics and reporting'}
                </p>
              </div>
              <button
                onClick={() => setFeatureFlags({ [key]: !enabled })}
                className={`flex-shrink-0 ${enabled ? 'text-blue-600' : 'text-gray-400'}`}
              >
                {enabled ? (
                  <ToggleRight className="h-8 w-8" />
                ) : (
                  <ToggleLeft className="h-8 w-8" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save button (bottom) */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 px-6">
          {saving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
