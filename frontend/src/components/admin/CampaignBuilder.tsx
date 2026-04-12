import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, Users } from 'lucide-react';
import { CreateCampaignData, CustomerSegment, MessageChannel } from '../../types';
import { messagingService } from '../../services/messagingService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import { channelIcon } from '../../utils/helpers';

const schema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  channel: z.enum(['SMS', 'WHATSAPP', 'EMAIL']),
  content: z.string().min(1, 'Message content is required').max(500, 'Max 500 characters'),
  targetSegment: z.enum(['VIP', 'REGULAR', 'INACTIVE', 'NEW']).optional(),
  scheduledAt: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const TEMPLATES = [
  { label: 'Promo', content: 'Hi {name}! Enjoy 20% off your next purchase. Use code SAVE20. Valid until end of month!' },
  { label: 'Loyalty', content: 'Hi {name}! You have {points} loyalty points. Visit us to redeem them!' },
  { label: 'Re-engage', content: 'We miss you, {name}! Come back and enjoy exclusive deals just for you.' },
  { label: 'Thank you', content: 'Thank you for shopping with us, {name}! Your support means the world to us.' },
];

interface CampaignBuilderProps {
  onCampaignCreated?: () => void;
}

export function CampaignBuilder({ onCampaignCreated }: CampaignBuilderProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { channel: 'SMS', content: '' },
  });

  const content = watch('content');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload: CreateCampaignData = {
        ...data,
        scheduledAt: data.scheduledAt || undefined,
        targetSegment: data.targetSegment || undefined,
      };
      await messagingService.createCampaign(payload);
      toast.success('Campaign created successfully!');
      reset();
      onCampaignCreated?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error ?? 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'input-field text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const errorClass = 'mt-1 text-xs text-red-500';

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Campaign Builder</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Campaign Name *</label>
            <input {...register('name')} className={inputClass} placeholder="e.g. Summer Sale 2024" />
            {errors.name && <p className={errorClass}>{errors.name.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Channel</label>
            <select {...register('channel')} className={inputClass}>
              {(['SMS', 'WHATSAPP', 'EMAIL'] as MessageChannel[]).map((ch) => (
                <option key={ch} value={ch}>
                  {channelIcon(ch)} {ch}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Target Segment</label>
            <select {...register('targetSegment')} className={inputClass}>
              <option value="">All Customers</option>
              {(['VIP', 'REGULAR', 'INACTIVE', 'NEW'] as CustomerSegment[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Schedule (optional)</label>
            <input {...register('scheduledAt')} type="datetime-local" className={inputClass} />
          </div>
        </div>

        {/* Message templates */}
        <div>
          <label className={labelClass}>Quick Templates</label>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => setValue('content', t.content)}
                className="px-3 py-2 text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-left transition-colors"
              >
                <span className="font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Message Content *</label>
          <textarea
            {...register('content')}
            rows={4}
            className={inputClass}
            placeholder="Use {name}, {points} as placeholders..."
          />
          <div className="flex justify-between mt-1">
            {errors.content && <p className={errorClass}>{errors.content.message}</p>}
            <span className="text-xs text-gray-400 ml-auto">{content?.length ?? 0}/500</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
          Create Campaign
        </button>
      </form>
    </div>
  );
}
