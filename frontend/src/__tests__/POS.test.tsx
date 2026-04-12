import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import POS from '../pages/POS';
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

const cashier = { id: 'u1', name: 'Test Cashier', email: 'cashier@test.com', role: 'cashier' as const, shopId: 'shop1' };

const renderPOS = () => {
  return render(
    <AuthContext.Provider value={{ user: cashier, token: 'tok', login: jest.fn(), logout: jest.fn(), isLoading: false }}>
      <MemoryRouter>
        <POS />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('POS Terminal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== POSITIVE TESTS =====
  test('products are displayed in a grid', () => {
    renderPOS();
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Tea')).toBeInTheDocument();
    expect(screen.getByText('Sandwich')).toBeInTheDocument();
  });

  test('search input filters products by name', async () => {
    renderPOS();
    const searchInput = screen.getByPlaceholderText(/search products/i);
    await userEvent.type(searchInput, 'Coffee');
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.queryByText('Tea')).not.toBeInTheDocument();
  });

  test('category filter shows only matching products', async () => {
    renderPOS();
    const categorySelect = screen.getByRole('combobox', { name: /filter by category/i });
    await userEvent.selectOptions(categorySelect, 'Food');
    expect(screen.getByText('Sandwich')).toBeInTheDocument();
    expect(screen.queryByText('Coffee')).not.toBeInTheDocument();
  });

  test('add product to cart', async () => {
    renderPOS();
    await userEvent.click(screen.getByRole('button', { name: /add coffee to cart/i }));
    expect(screen.getByTestId('cart-item-1')).toBeInTheDocument();
  });

  test('cart quantity updates when adding same product twice', async () => {
    renderPOS();
    const addBtn = screen.getByRole('button', { name: /add coffee to cart/i });
    await userEvent.click(addBtn);
    await userEvent.click(addBtn);
    const cartItem = screen.getByTestId('cart-item-1');
    expect(cartItem).toHaveTextContent('2');
  });

  test('increase quantity button works', async () => {
    renderPOS();
    await userEvent.click(screen.getByRole('button', { name: /add coffee to cart/i }));
    await userEvent.click(screen.getByRole('button', { name: /increase quantity of coffee/i }));
    const cartItem = screen.getByTestId('cart-item-1');
    expect(cartItem).toHaveTextContent('2');
  });

  test('decrease quantity removes item when quantity reaches 0', async () => {
    renderPOS();
    await userEvent.click(screen.getByRole('button', { name: /add coffee to cart/i }));
    await userEvent.click(screen.getByRole('button', { name: /decrease quantity of coffee/i }));
    expect(screen.queryByTestId('cart-item-1')).not.toBeInTheDocument();
  });

  test('remove button removes item from cart', async () => {
    renderPOS();
    await userEvent.click(screen.getByRole('button', { name: /add coffee to cart/i }));
    await userEvent.click(screen.getByRole('button', { name: /remove coffee from cart/i }));
    expect(screen.queryByTestId('cart-item-1')).not.toBeInTheDocument();
  });

  test('cart total calculates correctly with single item', async () => {
    renderPOS();
    // Set tax to 0 first for easy math
    fireEvent.change(screen.getByLabelText(/tax %/i), { target: { value: '0' } });
    await userEvent.click(screen.getByRole('button', { name: /add coffee to cart/i }));
    expect(screen.getByTestId('cart-total')).toHaveTextContent('3.50');
  });

  test('customer can be selected from dropdown', async () => {
    renderPOS();
    const select = screen.getByRole('combobox', { name: /select customer/i });
    await userEvent.selectOptions(select, 'c1');
    expect(select).toHaveValue('c1');
  });

  test('discount applies correctly', async () => {
    renderPOS();
    fireEvent.change(screen.getByLabelText(/tax %/i), { target: { value: '0' } });
    await userEvent.click(screen.getByRole('button', { name: /add coffee to cart/i }));
    fireEvent.change(screen.getByLabelText(/discount %/i), { target: { value: '50' } });
    // 3.50 - 50% = 1.75
    expect(screen.getByTestId('cart-total')).toHaveTextContent('1.75');
  });

  test('checkout button calls api.post and shows receipt', async () => {
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { id: 'ORD-001' } });
    renderPOS();
    await userEvent.click(screen.getByRole('button', { name: /add coffee to cart/i }));
    await userEvent.click(screen.getByRole('button', { name: /checkout/i }));
    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/orders', expect.any(Object));
      expect(screen.getByTestId('receipt')).toBeInTheDocument();
    });
  });

  test('receipt displays after successful checkout', async () => {
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { id: 'ORD-999' } });
    renderPOS();
    await userEvent.click(screen.getByRole('button', { name: /add coffee to cart/i }));
    await userEvent.click(screen.getByRole('button', { name: /checkout/i }));
    await waitFor(() => {
      expect(screen.getByTestId('receipt')).toBeInTheDocument();
      expect(screen.getByText(/receipt/i)).toBeInTheDocument();
    });
  });

  test('cart clears after successful checkout and new sale button shown', async () => {
    (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: { id: 'ORD-002' } });
    renderPOS();
    await userEvent.click(screen.getByRole('button', { name: /add coffee to cart/i }));
    await userEvent.click(screen.getByRole('button', { name: /checkout/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /new sale/i })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByRole('button', { name: /new sale/i }));
    expect(screen.queryByTestId('receipt')).not.toBeInTheDocument();
  });

  // ===== NEGATIVE TESTS =====
  test('adding out-of-stock product shows error', async () => {
    renderPOS();
    // Water Bottle has stock: 0
    await userEvent.click(screen.getByRole('button', { name: /add water bottle to cart/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/out of stock/i);
    });
  });

  test('checkout with empty cart shows error', async () => {
    renderPOS();
    await userEvent.click(screen.getByRole('button', { name: /checkout/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/cart is empty/i);
    });
  });

  test('network error during checkout shows error message', async () => {
    (mockApi.post as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));
    renderPOS();
    await userEvent.click(screen.getByRole('button', { name: /add coffee to cart/i }));
    await userEvent.click(screen.getByRole('button', { name: /checkout/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/network error/i);
    });
  });

  test('out-of-stock product button has aria-disabled attribute', () => {
    renderPOS();
    const waterBtn = screen.getByRole('button', { name: /add water bottle to cart/i });
    expect(waterBtn).toHaveAttribute('aria-disabled', 'true');
  });

  // ===== EDGE CASES =====
  test('product name is displayed (truncation applied via CSS)', () => {
    renderPOS();
    expect(screen.getByText('Coffee')).toBeInTheDocument();
  });

  test('product prices are displayed correctly', () => {
    renderPOS();
    expect(screen.getByText('$3.50')).toBeInTheDocument();
    expect(screen.getByText('$2.50')).toBeInTheDocument();
  });

  test('100% discount makes total 0 (or 0 with tax component)', async () => {
    renderPOS();
    fireEvent.change(screen.getByLabelText(/tax %/i), { target: { value: '0' } });
    await userEvent.click(screen.getByRole('button', { name: /add coffee to cart/i }));
    fireEvent.change(screen.getByLabelText(/discount %/i), { target: { value: '100' } });
    expect(screen.getByTestId('cart-total')).toHaveTextContent('0.00');
  });

  test('search input is present with placeholder', () => {
    renderPOS();
    expect(screen.getByPlaceholderText(/search products/i)).toBeInTheDocument();
  });

  test('category filter contains All option and categories', () => {
    renderPOS();
    const select = screen.getByRole('combobox', { name: /filter by category/i });
    expect(select).toBeInTheDocument();
    expect(screen.getAllByRole('option', { name: /beverages/i }).length).toBeGreaterThan(0);
  });

  test('cart shows empty message when no items', () => {
    renderPOS();
    expect(screen.getByText(/cart is empty/i)).toBeInTheDocument();
  });
});
