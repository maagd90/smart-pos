
import { Edit, UserCheck, UserX } from 'lucide-react';
import { User, Role } from '../../types';
import { formatDate, getInitials } from '../../utils/helpers';
import { Badge } from '../common/Badge';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  loading?: boolean;
}

const roleVariant: Record<Role, 'danger' | 'warning' | 'default'> = {
  ADMIN: 'danger',
  MANAGER: 'warning',
  CASHIER: 'default',
};

export function UserTable({ users, onEdit, loading }: UserTableProps) {
  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p>Loading users...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return <div className="text-center py-12 text-gray-400">No users found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
            <th className="text-center px-4 py-3 font-medium text-gray-600">Role</th>
            <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                    {getInitials(user.name)}
                  </div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-500">{user.email}</td>
              <td className="px-4 py-3 text-center">
                <Badge variant={roleVariant[user.role]}>{user.role}</Badge>
              </td>
              <td className="px-4 py-3 text-center">
                {user.isActive ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                    <UserCheck className="h-3 w-3" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                    <UserX className="h-3 w-3" />
                    Inactive
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(user.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onEdit(user)}
                  className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
