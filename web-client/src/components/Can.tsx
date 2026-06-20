import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

export function useCan(permission: string) {
  const { permissions, isPlatformAdmin } = useAuth();
  return isPlatformAdmin || permissions.has(permission);
}

export function useCanAny(perms: string[]) {
  const { permissions, isPlatformAdmin } = useAuth();
  if (isPlatformAdmin) return true;
  return perms.some((p) => permissions.has(p));
}

export function Can({ permission, children }: { permission: string; children: ReactNode }) {
  const allowed = useCan(permission);
  if (!allowed) return null;
  return <>{children}</>;
}

export function CanAny({ permissions, children }: { permissions: string[]; children: ReactNode }) {
  const allowed = useCanAny(permissions);
  if (!allowed) return null;
  return <>{children}</>;
}
