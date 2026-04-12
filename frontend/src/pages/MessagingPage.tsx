import React, { useState, useEffect } from 'react';
import { Plus, Send, X, Sparkles, MessageSquare, Mail, Phone, Clock, CheckCheck } from 'lucide-react';
import { messagingApi, aiApi, Campaign } from '../services/api';
import toast from 'react-hot-toast';

const CHANNELS = ['WhatsApp', 'SMS', 'Email'] as const;
const SEGMENTS = ['VIP', 'Regular', 'Occasional', 'New', 'All'] as const;

const channelIcon: Record<string, React.ReactNode> = {
  WhatsApp: <MessageSquare className="w-4 h-4 text-green-600" />,
  SMS: <Phone className="w-4 h-4 text-blue-600" />,
  Email: <Mail className="w-4 h-4 text-purple-600" />,
};

const statusColor: Record<string, string> = {
  SENT: 'bg-green-100 text-green-800',
  SCHEDULED: 'bg-yellow-100 text-yellow-800',
  DRAFT: 'bg-gray-100 text-gray-700',
  FAILED: 'bg-red-100 text-red-800',
};

interface CampaignForm {
  name: string;
  channel: string;
  segment: string;
  message: string;
  scheduledAt: string;
}

const MessagingPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CampaignForm>({
    name: '', channel: 'WhatsApp', segment: 'VIP', message: '', scheduledAt: '',
  });

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const res = await messagingApi.getCampaigns();
      setCampaigns(res.data);
    } catch {
      // Mock data for demo
      setCampaigns([
        {
          id: '1', name: 'VIP Weekend Promo', channel: 'WhatsApp', segment: 'VIP',
          message: 'Exclusive weekend deals for our VIP members! 20% off all items.',
          status: 'SENT', sentCount: 45, deliveredCount: 43, openedCount: 38,
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: '2', name: 'Monthly Newsletter', channel: 'Email', segment: 'All',
          message: 'Check out what\'s new this month at Smart POS Store!',
          status: 'SENT', sentCount: 210, deliveredCount: 198, openedCount: 112,
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        },
        {
          id: '3', name: 'Flash Sale Alert', channel: 'SMS', segment: 'Regular',
          message: 'FLASH SALE! 30% off beverages today only. Visit us now!',
          status: 'SCHEDULED', sentCount: 0, deliveredCount: 0, openedCount: 0,
          scheduledAt: new Date(Date.now() + 3600000).toISOString(),
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCampaigns(); }, []);

  const generateAiMessage = async () => {
    setAiLoading(true);
    try {
      const res = await aiApi.generateMessage({
        segment: form.segment,
        channel: form.channel,
        context: form.name,
      });
      setForm({ ...form, message: res.data.message });
      toast.success('AI message generated!');
    } catch {
      toast.error('AI generation failed');
      // Fallback mock
      const mockMsg = `Dear ${form.segment} customer, we have exclusive offers just for you! Visit us today and enjoy special discounts. Thank you for your loyalty! 🎉`;
      setForm({ ...form, message: mockMsg });
    } finally {
      setAiLoading(false);
    }
  };

  const createCampaign = async () => {
    if (!form.name.trim() || !form.message.trim()) {
      toast.error('Name and message are required');
      return;
    }
    setSaving(true);
    try {
      await messagingApi.createCampaign({
        ...form,
        scheduledAt: form.scheduledAt || undefined,
      });
      toast.success('Campaign created!');
      setShowModal(false);
      setForm({ name: '', channel: 'WhatsApp', segment: 'VIP', message: '', scheduledAt: '' });
      loadCampaigns();
    } catch {
      toast.error('Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  const totalSent = campaigns.reduce((s, c) => s + c.sentCount, 0);
  const totalDelivered = campaigns.reduce((s, c) => s + c.deliveredCount, 0);
  const totalOpened = campaigns.reduce((s, c) => s + c.openedCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Messaging</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Sent', value: totalSent, icon: <Send className="w-5 h-5 text-blue-600" />, color: 'bg-blue-50' },
          { label: 'Delivered', value: totalDelivered, icon: <CheckCheck className="w-5 h-5 text-green-600" />, color: 'bg-green-50' },
          { label: 'Opened', value: totalOpened, icon: <Mail className="w-5 h-5 text-purple-600" />, color: 'bg-purple-50' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Campaign List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Campaigns</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Campaign</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Channel</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Segment</th>
                <th className="text-center py-3 px-4 text-gray-500 font-medium">Status</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">Sent</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">Delivered</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">Opened</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate max-w-xs">{c.message}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5">{channelIcon[c.channel]}{c.channel}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{c.segment}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status] || 'bg-gray-100 text-gray-700'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">{c.sentCount}</td>
                  <td className="py-3 px-4 text-right text-gray-700">{c.deliveredCount}</td>
                  <td className="py-3 px-4 text-right text-gray-700">{c.openedCount}</td>
                  <td className="py-3 px-4 text-right text-gray-400 text-xs">
                    {c.scheduledAt
                      ? <span className="flex items-center justify-end gap-1"><Clock className="w-3 h-3" />{new Date(c.scheduledAt).toLocaleDateString()}</span>
                      : new Date(c.createdAt).toLocaleDateString()
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h3 className="font-bold text-lg">New Campaign</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign Name *</label>
                <input
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Weekend Promo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Channel</label>
                  <div className="flex gap-2">
                    {CHANNELS.map((ch) => (
                      <button
                        key={ch}
                        onClick={() => setForm({ ...form, channel: ch })}
                        className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg border-2 text-xs font-medium transition-colors ${
                          form.channel === ch ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {channelIcon[ch]}{ch}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Segment</label>
                  <select value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {SEGMENTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Message *</label>
                  <button
                    onClick={generateAiMessage}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    {aiLoading ? 'Generating...' : 'AI Enhance'}
                  </button>
                </div>
                <textarea
                  value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter your message..."
                />
                <p className="text-xs text-gray-400 mt-1">{form.message.length} characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Schedule (optional)</label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={createCampaign} disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {saving ? 'Creating...' : form.scheduledAt ? 'Schedule' : 'Send Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingPage;
