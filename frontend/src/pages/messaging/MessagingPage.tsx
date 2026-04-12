import React, { useState, useEffect, useCallback } from 'react';
import { Send, Clock, Users, RefreshCw, MessageSquare } from 'lucide-react';
import { Message, Campaign, Customer, MessageChannel } from '../../types';
import { messagingService } from '../../services/messagingService';
import { customerService } from '../../services/customerService';
import { CampaignBuilder } from '../../components/admin/CampaignBuilder';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDateTime, messageStatusColor, channelIcon } from '../../utils/helpers';
import toast from 'react-hot-toast';

type Tab = 'send' | 'campaigns' | 'history';

export function MessagingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('send');
  const [messages, setMessages] = useState<Message[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);

  // Send form
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [channel, setChannel] = useState<MessageChannel>('SMS');
  const [messageContent, setMessageContent] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await messagingService.getMessageHistory();
      setMessages(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await messagingService.getCampaigns();
      setCampaigns(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') fetchMessages();
    if (activeTab === 'campaigns') fetchCampaigns();
  }, [activeTab, fetchMessages, fetchCampaigns]);

  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomers([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await customerService.getCustomers({ search: customerSearch, limit: 10 });
      setCustomers(res.data);
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  const handleSendMessage = async () => {
    if (!selectedCustomer || !messageContent.trim()) {
      toast.error('Please select a customer and enter a message');
      return;
    }
    setSendLoading(true);
    try {
      await messagingService.sendMessage({
        customerId: selectedCustomer,
        channel,
        content: messageContent,
      });
      toast.success('Message sent successfully');
      setMessageContent('');
      setSelectedCustomer('');
      setCustomerSearch('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error ?? 'Failed to send message');
    } finally {
      setSendLoading(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'send', label: 'Send Message', icon: Send },
    { id: 'campaigns', label: 'Campaigns', icon: Users },
    { id: 'history', label: 'History', icon: Clock },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messaging</h1>
        <p className="text-sm text-gray-500 mt-1">Send messages and manage campaigns</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Send Message Tab */}
      {activeTab === 'send' && (
        <div className="max-w-xl">
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-gray-800">Send Individual Message</h2>
            </div>

            {/* Customer search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <input
                type="text"
                placeholder="Search customer..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="input-field text-sm"
              />
              {customers.length > 0 && customerSearch && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomer(c.id);
                        setCustomerSearch(c.name);
                        setCustomers([]);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                    >
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.phone ?? c.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Channel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
              <div className="grid grid-cols-3 gap-2">
                {(['SMS', 'WHATSAPP', 'EMAIL'] as MessageChannel[]).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                      channel === ch ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span>{channelIcon(ch)}</span>
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                rows={4}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type your message..."
                className="input-field text-sm resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{messageContent.length}/500</p>
            </div>

            <button
              onClick={handleSendMessage}
              disabled={sendLoading || !selectedCustomer || !messageContent.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {sendLoading ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
              Send Message
            </button>
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <CampaignBuilder onCampaignCreated={fetchCampaigns} />

          {/* Campaign list */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Past Campaigns</h3>
              <button onClick={fetchCampaigns} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-10"><LoadingSpinner size="md" /></div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-10 text-gray-400">No campaigns yet</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {campaigns.map((c) => (
                  <div key={c.id} className="px-4 py-3 flex items-center gap-4">
                    <span className="text-xl">{channelIcon(c.channel)}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.content.slice(0, 60)}...</p>
                    </div>
                    <div className="text-right">
                      {c.targetSegment && <Badge variant="gray">{c.targetSegment}</Badge>}
                      <p className="text-xs text-gray-400 mt-1">Sent: {c.sentCount}</p>
                    </div>
                    <Badge variant="default">{c.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Message History</h3>
            <button onClick={fetchMessages} className="btn-secondary text-xs flex items-center gap-1.5 py-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><LoadingSpinner size="md" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No messages sent</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Channel</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Message</th>
                    <th className="text-center px-4 py-2 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {messages.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="text-lg mr-1">{channelIcon(m.channel)}</span>
                        <span className="text-xs text-gray-500">{m.channel}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{m.content}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${messageStatusColor(m.status)}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(m.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
