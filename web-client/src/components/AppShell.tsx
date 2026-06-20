import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStoreContext } from '../context/StoreContext';
import { Can, CanAny } from './Can';

export function AppShell() {
  const { user, logout, isPlatformAdmin } = useAuth();
  const { stores, selectedStoreId, setSelectedStoreId } = useStoreContext();
  const navigate = useNavigate();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">Smart POS Admin</div>
        <nav>
          {isPlatformAdmin && (
            <>
              <NavLink to="/platform/accounts">Accounts</NavLink>
              <NavLink to="/platform/ai-keys">AI Keys</NavLink>
            </>
          )}
          <Can permission="stores.manage">
            <NavLink to="/account/stores">Stores</NavLink>
          </Can>
          <Can permission="users.manage">
            <NavLink to="/account/users">Users</NavLink>
          </Can>
          <Can permission="users.manage">
            <NavLink to="/account/roles">Role Assignment</NavLink>
          </Can>
          <CanAny permissions={['store.settings.manage', 'stores.manage']}>
            <NavLink to="/store/settings">Store Settings</NavLink>
          </CanAny>
          <Can permission="store.refund_policy.manage">
            <NavLink to="/store/refund-policy">Refund Policy</NavLink>
          </Can>
          <Can permission="reports.export">
            <NavLink to="/store/report-settings">Report Settings</NavLink>
          </Can>
          <CanAny permissions={['deal.approve', 'inventory.change.approve']}>
            <NavLink to="/manager/notifications">Approvals</NavLink>
          </CanAny>
          <span className="nav-disabled">POS (coming soon)</span>
          <span className="nav-disabled">Inventory (coming soon)</span>
          <NavLink to="/dev">Dev Dashboard</NavLink>
        </nav>
      </aside>
      <main className="main">
        <header className="header">
          <div>
            {user && <span>{user.email}</span>}
            {stores.length > 0 && (
              <select
                value={selectedStoreId || ''}
                onChange={(e) => setSelectedStoreId(e.target.value || null)}
              >
                <option value="">Select store</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <button type="button" onClick={() => { logout(); navigate('/login'); }}>
            Logout
          </button>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
