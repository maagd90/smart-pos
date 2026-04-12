import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminPanel from '../pages/AdminPanel';
import AuthContext from '../contexts/AuthContext';

// Mock the api module
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  setAuthToken: jest.fn(),
}));

import api from '../services/api';
const mockApi = api as jest.Mocked<typeof api>;

const shopAdmin = { id: 'u1', name: 'Shop Admin', email: 'admin@shop.com', role: 'shop_admin' as const, shopId: 'shop1' };

const MOCK_STAFF = [
  { id: 's1', name: 'Jane Doe', email: 'jane@shop.com', role: 'cashier', isActive: true },
  { id: 's2', name: 'Mark Lee', email: 'mark@shop.com', role: 'manager', isActive: true },
];

const renderAdminPanel = () => {
  return render(
    <AuthContext.Provider value={{ user: shopAdmin, token: 'tok', login: jest.fn(), logout: jest.fn(), isLoading: false }}>
      <MemoryRouter>
        <AdminPanel />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('AdminPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: api.get fails so component falls back to mock data
    (mockApi.get as jest.Mock).mockRejectedValue(new Error('API unavailable'));
  });

  // ===== POSITIVE TESTS =====
  test('dashboard KPIs are displayed', async () => {
    renderAdminPanel();
    await waitFor(() => {
      expect(screen.getByText('Total Sales')).toBeInTheDocument();
      expect(screen.getByText('Total Customers')).toBeInTheDocument();
      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
    });
  });

  test('staff list displays after loading', async () => {
    (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: MOCK_STAFF });
    renderAdminPanel();
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Mark Lee')).toBeInTheDocument();
    });
  });

  test('add staff button is present', async () => {
    renderAdminPanel();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ add staff/i })).toBeInTheDocument();
    });
  });

  test('clicking Add Staff opens modal', async () => {
    renderAdminPanel();
    await waitFor(() => screen.getByRole('button', { name: /\+ add staff/i }));
    await userEvent.click(screen.getByRole('button', { name: /\+ add staff/i }));
    expect(screen.getByRole('dialog', { name: /staff form/i })).toBeInTheDocument();
  });

  test('staff form can be filled in', async () => {
    renderAdminPanel();
    await waitFor(() => screen.getByRole('button', { name: /\+ add staff/i }));
    await userEvent.click(screen.getByRole('button', { name: /\+ add staff/i }));
    await userEvent.type(screen.getByPlaceholderText('Full name'), 'New Employee');
    await userEvent.type(screen.getByPlaceholderText('staff@shop.com'), 'new@shop.com');
    expect(screen.getByPlaceholderText('Full name')).toHaveValue('New Employee');
    expect(screen.getByPlaceholderText('staff@shop.com')).toHaveValue('new@shop.com');
  });

  test('new staff added to list after successful submit', async () => {
    (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: MOCK_STAFF });
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: {} });
    renderAdminPanel();
    await waitFor(() => screen.getByRole('button', { name: /\+ add staff/i }));
    await userEvent.click(screen.getByRole('button', { name: /\+ add staff/i }));
    await userEvent.type(screen.getByPlaceholderText('Full name'), 'New Employee');
    await userEvent.type(screen.getByPlaceholderText('staff@shop.com'), 'newstaff@shop.com');
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(screen.getByText('New Employee')).toBeInTheDocument();
    });
  });

  test('edit staff button opens modal with staff data', async () => {
    (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: MOCK_STAFF });
    renderAdminPanel();
    await waitFor(() => screen.getByText('Jane Doe'));
    await userEvent.click(screen.getByRole('button', { name: /edit jane doe/i }));
    expect(screen.getByRole('dialog', { name: /staff form/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
  });

  test('delete staff shows confirmation dialog', async () => {
    (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: MOCK_STAFF });
    renderAdminPanel();
    await waitFor(() => screen.getByText('Jane Doe'));
    await userEvent.click(screen.getByRole('button', { name: /delete jane doe/i }));
    expect(screen.getByRole('dialog', { name: /confirm delete/i })).toBeInTheDocument();
  });

  test('confirming delete removes staff from list', async () => {
    (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: MOCK_STAFF });
    (mockApi.delete as jest.Mock).mockResolvedValueOnce({ data: {} });
    renderAdminPanel();
    await waitFor(() => screen.getByText('Jane Doe'));
    await userEvent.click(screen.getByRole('button', { name: /delete jane doe/i }));
    await userEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() => {
      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    });
  });

  test('WhatsApp config button is visible', async () => {
    renderAdminPanel();
    await waitFor(() => {
      expect(screen.getByTestId('whatsapp-config-btn')).toBeInTheDocument();
    });
  });

  test('loading spinner shown while fetching staff', () => {
    // Mock a slow API call that never resolves
    (mockApi.get as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderAdminPanel();
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  // ===== NEGATIVE TESTS =====
  test('invalid email in add staff form shows error', async () => {
    renderAdminPanel();
    await waitFor(() => screen.getByRole('button', { name: /\+ add staff/i }));
    await userEvent.click(screen.getByRole('button', { name: /\+ add staff/i }));
    await userEvent.type(screen.getByPlaceholderText('Full name'), 'Test User');
    await userEvent.type(screen.getByPlaceholderText('staff@shop.com'), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  test('duplicate staff email shows error', async () => {
    (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: MOCK_STAFF });
    renderAdminPanel();
    await waitFor(() => screen.getByText('Jane Doe'));
    await userEvent.click(screen.getByRole('button', { name: /\+ add staff/i }));
    await userEvent.type(screen.getByPlaceholderText('Full name'), 'Duplicate');
    await userEvent.type(screen.getByPlaceholderText('staff@shop.com'), 'jane@shop.com');
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });

  test('cancelling delete confirmation keeps staff in list', async () => {
    (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: MOCK_STAFF });
    renderAdminPanel();
    await waitFor(() => screen.getByText('Jane Doe'));
    await userEvent.click(screen.getByRole('button', { name: /delete jane doe/i }));
    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(screen.queryByRole('dialog', { name: /confirm delete/i })).not.toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  test('cancelling add staff modal closes it', async () => {
    renderAdminPanel();
    await waitFor(() => screen.getByRole('button', { name: /\+ add staff/i }));
    await userEvent.click(screen.getByRole('button', { name: /\+ add staff/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // ===== EDGE CASES =====
  test('staff name with many characters is displayed', async () => {
    const longName = 'Bartholomew Christopher Alexander';
    (mockApi.get as jest.Mock).mockResolvedValueOnce({
      data: [{ id: 'sl', name: longName, email: 'long@shop.com', role: 'cashier', isActive: true }],
    });
    renderAdminPanel();
    await waitFor(() => {
      expect(screen.getByText(longName)).toBeInTheDocument();
    });
  });

  test('form clears after successful staff addition', async () => {
    (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: [] });
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: {} });
    renderAdminPanel();
    await waitFor(() => screen.getByRole('button', { name: /\+ add staff/i }));
    await userEvent.click(screen.getByRole('button', { name: /\+ add staff/i }));
    await userEvent.type(screen.getByPlaceholderText('Full name'), 'Fresh Staff');
    await userEvent.type(screen.getByPlaceholderText('staff@shop.com'), 'fresh@shop.com');
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    // Modal closed = form is gone
    expect(screen.queryByPlaceholderText('Full name')).not.toBeInTheDocument();
  });

  test('staff table has correct column headers', async () => {
    (mockApi.get as jest.Mock).mockResolvedValueOnce({ data: MOCK_STAFF });
    renderAdminPanel();
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });
});
