import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Customer } from '../../types';
import { customerService } from '../../services/customerService';
import { CustomerDetail } from '../../components/customers/CustomerDetail';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    customerService
      .getCustomerById(id)
      .then(setCustomer)
      .catch(() => setError('Customer not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>{error ?? 'Customer not found'}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <CustomerDetail customer={customer} />
    </div>
  );
}
