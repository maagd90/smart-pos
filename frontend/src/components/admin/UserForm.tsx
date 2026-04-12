import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Role, CreateUserData, UpdateUserData } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']),
});

const updateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.enum(['ADMIN', 'MANAGER', 'CASHIER']),
  isActive: z.boolean(),
});

type CreateFormData = z.infer<typeof createSchema>;
type UpdateFormData = z.infer<typeof updateSchema>;

interface UserFormProps {
  user?: User | null;
  onSubmit: (data: CreateUserData | UpdateUserData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function UserForm({ user, onSubmit, onCancel, loading }: UserFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(user ? updateSchema : createSchema) as never,
    defaultValues: user
      ? { name: user.name, email: user.email, role: user.role, isActive: user.isActive }
      : { name: '', email: '', password: '', role: 'CASHIER' },
  });

  useEffect(() => {
    if (user) {
      reset({ name: user.name, email: user.email, role: user.role, isActive: user.isActive });
    }
  }, [user, reset]);

  const inputClass = 'input-field text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const errorClass = 'mt-1 text-xs text-red-500';
  const errorsTyped = errors as Record<string, { message?: string }>;

  return (
    <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
      <div>
        <label className={labelClass}>Full Name *</label>
        <input {...register('name')} className={inputClass} placeholder="John Doe" />
        {errorsTyped.name && <p className={errorClass}>{errorsTyped.name.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Email *</label>
        <input {...register('email')} type="email" className={inputClass} placeholder="john@example.com" />
        {errorsTyped.email && <p className={errorClass}>{errorsTyped.email.message}</p>}
      </div>

      {!user && (
        <div>
          <label className={labelClass}>Password *</label>
          <input {...register('password')} type="password" className={inputClass} placeholder="Min 6 characters" />
          {errorsTyped.password && <p className={errorClass}>{errorsTyped.password.message}</p>}
        </div>
      )}

      <div>
        <label className={labelClass}>Role *</label>
        <select {...register('role')} className={inputClass}>
          {(['ADMIN', 'MANAGER', 'CASHIER'] as Role[]).map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {user && (
        <div className="flex items-center gap-2">
          <input {...register('isActive')} type="checkbox" id="isActive" className="h-4 w-4 text-blue-600 rounded" />
          <label htmlFor="isActive" className="text-sm text-gray-700">Account Active</label>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {loading && <LoadingSpinner size="sm" />}
          {user ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
}
