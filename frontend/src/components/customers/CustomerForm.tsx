import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Customer, CreateCustomerData, UpdateCustomerData, CustomerSegment } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  notes: z.string().optional(),
  segment: z.enum(['VIP', 'REGULAR', 'INACTIVE', 'NEW']).optional(),
});

type FormData = z.infer<typeof schema>;

interface CustomerFormProps {
  customer?: Customer | null;
  onSubmit: (data: CreateCustomerData | UpdateCustomerData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function CustomerForm({ customer, onSubmit, onCancel, loading }: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', notes: '', segment: 'NEW' },
  });

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        phone: customer.phone ?? '',
        email: customer.email ?? '',
        notes: customer.notes ?? '',
        segment: customer.segment,
      });
    }
  }, [customer, reset]);

  const handleFormSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      email: data.email || undefined,
      phone: data.phone || undefined,
      notes: data.notes || undefined,
    };
    await onSubmit(payload);
  };

  const inputClass = 'input-field text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const errorClass = 'mt-1 text-xs text-red-500';

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className={labelClass}>Name *</label>
        <input {...register('name')} className={inputClass} placeholder="Customer name" />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Phone</label>
          <input {...register('phone')} className={inputClass} placeholder="+1 234 567 8900" />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input {...register('email')} type="email" className={inputClass} placeholder="john@example.com" />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>
      </div>

      {customer && (
        <div>
          <label className={labelClass}>Segment</label>
          <select {...register('segment')} className={inputClass}>
            {(['VIP', 'REGULAR', 'INACTIVE', 'NEW'] as CustomerSegment[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={labelClass}>Notes</label>
        <textarea {...register('notes')} rows={3} className={inputClass} placeholder="Optional notes..." />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {loading && <LoadingSpinner size="sm" />}
          {customer ? 'Update Customer' : 'Add Customer'}
        </button>
      </div>
    </form>
  );
}
