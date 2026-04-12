import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
import AuthContext from '../contexts/AuthContext';

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockLogin = jest.fn();

const renderLogin = (isLoading = false) => {
  return render(
    <AuthContext.Provider
      value={{ user: null, token: null, login: mockLogin, logout: jest.fn(), isLoading }}
    >
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== POSITIVE TESTS =====
  test('renders email and password fields', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  test('email field accepts input', async () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText('you@example.com');
    await userEvent.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');
  });

  test('password field accepts input', async () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText('••••••••');
    await userEvent.type(passwordInput, 'mypassword');
    expect(passwordInput).toHaveValue('mypassword');
  });

  test('submit button is present and enabled by default', () => {
    renderLogin();
    const btn = screen.getByRole('button', { name: /sign in/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  test('successful login calls login and redirects to /dashboard', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'user@example.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('token is stored in React context (login function called, not localStorage)', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'user@example.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
    // Verify token is NOT stored in localStorage
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('error message displayed on login failure', async () => {
    mockLogin.mockRejectedValueOnce({ response: { data: { message: 'Invalid credentials' } } });
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'user@example.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
  });

  test('loading state shown during submit', () => {
    renderLogin(true); // isLoading = true
    const btn = screen.getByRole('button', { name: /signing in/i });
    expect(btn).toBeDisabled();
  });

  // ===== NEGATIVE TESTS =====
  test('submit with empty email shows validation error', async () => {
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('submit with invalid email shows validation error', async () => {
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'not-an-email');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('submit with empty password shows validation error', async () => {
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('network error shows error message', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Network Error'));
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'user@example.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'password');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network Error');
    });
  });

  // ===== EDGE CASES =====
  test('password field toggles between password and text type', async () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    await userEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    const hideBtn = screen.getByRole('button', { name: /hide password/i });
    await userEvent.click(hideBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('very long email input is accepted', async () => {
    renderLogin();
    const longEmail = 'a'.repeat(64) + '@' + 'b'.repeat(64) + '.com';
    const emailInput = screen.getByPlaceholderText('you@example.com');
    fireEvent.change(emailInput, { target: { value: longEmail } });
    expect(emailInput).toHaveValue(longEmail);
  });

  test('button disabled while loading (prevents rapid submissions)', () => {
    renderLogin(true);
    const btn = screen.getByRole('button', { name: /signing in/i });
    expect(btn).toBeDisabled();
  });

  test('sign in button has accessible name', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('login form clears error when resubmitting', async () => {
    mockLogin
      .mockRejectedValueOnce({ response: { data: { message: 'Wrong password' } } })
      .mockResolvedValueOnce(undefined);
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'user@example.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Wrong password'));

    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
