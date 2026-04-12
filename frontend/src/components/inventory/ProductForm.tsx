import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product, CreateProductData } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  cost: z.coerce.number().min(0).optional(),
  category: z.string().min(1, 'Category is required'),
  barcode: z.string().optional(),
  reorderPoint: z.coerce.number().min(0).optional(),
  reorderQuantity: z.coerce.number().min(0).optional(),
  initialStock: z.coerce.number().min(0).optional(),
  location: z.string().optional(),
  isActive: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (data: CreateProductData & { isActive?: boolean }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const CATEGORIES = ['Food', 'Beverages', 'Electronics', 'Clothing', 'Health', 'Beauty', 'Other'];

export function ProductForm({ product, onSubmit, onCancel, loading }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      sku: '',
      price: 0,
      category: 'Other',
      reorderPoint: 5,
      reorderQuantity: 10,
      initialStock: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku,
        description: product.description ?? '',
        price: product.price,
        cost: product.cost ?? undefined,
        category: product.category,
        barcode: product.barcode ?? '',
        reorderPoint: product.reorderPoint,
        reorderQuantity: product.reorderQuantity,
        isActive: product.isActive,
      });
    }
  }, [product, reset]);

  const inputClass = 'input-field text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const errorClass = 'mt-1 text-xs text-red-500';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Product Name *</label>
          <input {...register('name')} className={inputClass} placeholder="e.g. Coca Cola 500ml" />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>
        <div>
          <label className={labelClass}>SKU *</label>
          <input {...register('sku')} className={inputClass} placeholder="e.g. CC-500" />
          {errors.sku && <p className={errorClass}>{errors.sku.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea {...register('description')} rows={2} className={inputClass} placeholder="Optional description" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Price *</label>
          <input {...register('price')} type="number" step="0.01" className={inputClass} />
          {errors.price && <p className={errorClass}>{errors.price.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Cost</label>
          <input {...register('cost')} type="number" step="0.01" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Category *</label>
          <select {...register('category')} className={inputClass}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p className={errorClass}>{errors.category.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Barcode</label>
          <input {...register('barcode')} className={inputClass} placeholder="Optional barcode" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Reorder Point</label>
          <input {...register('reorderPoint')} type="number" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Reorder Qty</label>
          <input {...register('reorderQuantity')} type="number" className={inputClass} />
        </div>
        {!product && (
          <div>
            <label className={labelClass}>Initial Stock</label>
            <input {...register('initialStock')} type="number" className={inputClass} />
          </div>
        )}
      </div>

      <div>
        <label className={labelClass}>Storage Location</label>
        <input {...register('location')} className={inputClass} placeholder="e.g. Aisle 3, Shelf B" />
      </div>

      {product && (
        <div className="flex items-center gap-2">
          <input {...register('isActive')} type="checkbox" id="isActive" className="h-4 w-4 text-blue-600 rounded" />
          <label htmlFor="isActive" className="text-sm text-gray-700">Active (visible in POS)</label>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {loading ? <LoadingSpinner size="sm" /> : null}
          {product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
