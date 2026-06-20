import { useMemo, useState } from 'react';
import { api, setToken } from './api/client';

interface StepResult {
  label: string;
  response: unknown;
  success: boolean;
}

interface DashboardIds {
  accountId: string;
  storeId: string;
  productId: string;
  saleId: string;
}

interface ApiData {
  id?: string;
  accessToken?: string;
  currentStock?: number;
  sellingPrice?: number;
  [key: string]: unknown;
}

interface ApiEnvelope {
  id?: string;
  accessToken?: string;
  success?: boolean;
  data?: ApiData;
  status?: string;
  [key: string]: unknown;
}

interface StepDefinition {
  key: string;
  label: string;
  disabled: boolean;
  run: () => Promise<void>;
}

const initialIds: DashboardIds = {
  accountId: '',
  storeId: '',
  productId: '',
  saleId: '',
};

const defaultUnitPrice = 1575;

const productPayload = {
  name: 'Premium Coffee Beans',
  sku: 'COF-001',
  category: 'Beverages',
  costPrice: 1500,
  pricingMode: 'markup',
  markupPercent: 5,
  currency: 'AED',
};

const stepButtonStyle = {
  padding: '0.5rem 0.75rem',
  cursor: 'pointer',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getEnvelope(value: unknown): ApiEnvelope {
  return isRecord(value) ? (value as ApiEnvelope) : {};
}

function getNestedData(value: unknown): ApiData {
  const envelope = getEnvelope(value);
  return isRecord(envelope.data) ? envelope.data : {};
}

function getId(value: unknown): string {
  const data = getNestedData(value);
  if (typeof data.id === 'string') {
    return data.id;
  }

  const envelope = getEnvelope(value);
  return typeof envelope.id === 'string' ? envelope.id : '';
}

function getTokenFromResponse(value: unknown): string {
  const data = getNestedData(value);
  if (typeof data.accessToken === 'string') {
    return data.accessToken;
  }

  const envelope = getEnvelope(value);
  return typeof envelope.accessToken === 'string' ? envelope.accessToken : '';
}

function getStock(value: unknown): number | null {
  const data = getNestedData(value);
  return typeof data.currentStock === 'number' ? data.currentStock : null;
}

function getSellingPrice(value: unknown): number {
  const data = getNestedData(value);
  return typeof data.sellingPrice === 'number' ? data.sellingPrice : defaultUnitPrice;
}

/**
 * Developer dashboard for testing the end-to-end business flow.
 * This is a development-only tool and will be replaced by the production UI.
 */
export function App() {
  const [results, setResults] = useState<StepResult[]>([]);
  const [runningStep, setRunningStep] = useState<string | null>(null);
  const [ids, setIds] = useState<DashboardIds>(initialIds);
  const [unitPrice, setUnitPrice] = useState<number>(defaultUnitPrice);

  const addResult = (label: string, response: unknown, success: boolean) => {
    setResults((previous) => {
      const next = previous.filter((result) => result.label !== label);
      return [...next, { label, response, success }];
    });
  };

  const recordFailure = (label: string, error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    addResult(label, { error: message }, false);
  };

  const runStep = async (key: string, label: string, action: () => Promise<void>) => {
    setRunningStep(key);

    try {
      await action();
    } catch (error) {
      recordFailure(label, error);
    } finally {
      setRunningStep(null);
    }
  };

  const resetFlow = () => {
    setToken('');
    setIds(initialIds);
    setUnitPrice(defaultUnitPrice);
    setResults([]);
  };

  const executeHealthCheck = async () => {
    const response = await api.checkHealth();
    addResult('Gateway Health', response, typeof getEnvelope(response).status === 'string');
  };

  const executeDevLogin = async () => {
    const response = await api.devLogin('owner@example.com');
    const token = getTokenFromResponse(response);
    if (token) {
      setToken(token);
    }
    addResult('Dev Login', response, token.length > 0);
  };

  const executeCreateAccount = async (): Promise<string> => {
    const response = await api.createAccount('Test Store LLC', 'AED', 'en-AE');
    const accountId = getId(response);
    if (accountId) {
      setIds((current) => ({ ...current, accountId, storeId: '', productId: '', saleId: '' }));
    }
    addResult('Create Account', response, accountId.length > 0);
    return accountId;
  };

  const executeCreateStore = async (accountId: string): Promise<string> => {
    const response = await api.createStore(accountId, 'Downtown Branch', 'Asia/Dubai');
    const storeId = getId(response);
    if (storeId) {
      setIds((current) => ({ ...current, storeId, productId: '', saleId: '' }));
    }
    addResult('Create Store', response, storeId.length > 0);
    return storeId;
  };

  const executeCreateProduct = async (storeId: string): Promise<{ productId: string; sellingPrice: number }> => {
    const response = await api.createProduct(storeId, productPayload);
    const productId = getId(response);
    const sellingPrice = getSellingPrice(response);
    if (productId) {
      setIds((current) => ({ ...current, productId, saleId: '' }));
    }
    setUnitPrice(sellingPrice);
    addResult(
      'Create Product (cost=1500, markup=5%)',
      response,
      productId.length > 0 && sellingPrice === defaultUnitPrice,
    );
    return { productId, sellingPrice };
  };

  const executeReceiveStock = async (storeId: string, productId: string) => {
    const response = await api.receiveStock(storeId, productId, 10);
    addResult('Receive 10 units', response, getEnvelope(response).success === true);
  };

  const executeCheckStock = async (label: string, storeId: string, productId: string, expected: number) => {
    const response = await api.getStock(storeId, productId);
    addResult(label, response, getStock(response) === expected);
  };

  const executeCreateSale = async (storeId: string, productId: string, currentUnitPrice: number): Promise<string> => {
    const response = await api.createSale(
      storeId,
      [{ productId, productName: productPayload.name, quantity: 2, unitPrice: currentUnitPrice }],
      'AED',
    );
    const saleId = getId(response);
    if (saleId) {
      setIds((current) => ({ ...current, saleId }));
    }
    addResult('Create Sale (2 units)', response, saleId.length > 0);
    return saleId;
  };

  const executeCreateRefund = async (
    storeId: string,
    saleId: string,
    productId: string,
    currentUnitPrice: number,
  ) => {
    const response = await api.createRefund(
      storeId,
      saleId,
      [{ productId, productName: productPayload.name, quantity: 1, unitPrice: currentUnitPrice, resellable: true }],
      'AED',
    );
    addResult('Create Refund (1 resellable unit)', response, getEnvelope(response).success === true);
  };

  const executeDailyReport = async (storeId: string) => {
    const response = await api.getDailyReport(storeId);
    addResult('Daily Report', response, getEnvelope(response).success === true);
  };

  const runHealthCheck = () => runStep('health', 'Gateway Health', executeHealthCheck);
  const runDevLogin = () => runStep('login', 'Dev Login', executeDevLogin);
  const runCreateAccount = () => runStep('account', 'Create Account', async () => {
    await executeCreateAccount();
  });
  const runCreateStore = () => runStep('store', 'Create Store', async () => {
    await executeCreateStore(ids.accountId);
  });
  const runCreateProduct = () => runStep('product', 'Create Product', async () => {
    await executeCreateProduct(ids.storeId);
  });
  const runReceiveStock = () => runStep('receive', 'Receive Stock', async () => {
    await executeReceiveStock(ids.storeId, ids.productId);
  });
  const runCheckInitialStock = () => runStep('stock-before-sale', 'Check Stock (expect 10)', async () => {
    await executeCheckStock('Check Stock (expect 10)', ids.storeId, ids.productId, 10);
  });
  const runCreateSale = () => runStep('sale', 'Create Sale', async () => {
    await executeCreateSale(ids.storeId, ids.productId, unitPrice);
  });
  const runCheckStockAfterSale = () => runStep('stock-after-sale', 'Check Stock after sale (expect 8)', async () => {
    await executeCheckStock('Check Stock after sale (expect 8)', ids.storeId, ids.productId, 8);
  });
  const runCreateRefund = () => runStep('refund', 'Create Refund', async () => {
    await executeCreateRefund(ids.storeId, ids.saleId, ids.productId, unitPrice);
  });
  const runCheckStockAfterRefund = () => runStep('stock-after-refund', 'Check Stock after refund (expect 9)', async () => {
    await executeCheckStock('Check Stock after refund (expect 9)', ids.storeId, ids.productId, 9);
  });
  const runDailyReport = () => runStep('report', 'Daily Report', async () => {
    await executeDailyReport(ids.storeId);
  });

  const runFullFlow = async () => {
    setRunningStep('flow');
    setToken('');
    setIds(initialIds);
    setUnitPrice(defaultUnitPrice);
    setResults([]);

    try {
      await executeHealthCheck();
      await executeDevLogin();
      const accountId = await executeCreateAccount();
      const storeId = await executeCreateStore(accountId);
      const { productId, sellingPrice } = await executeCreateProduct(storeId);
      await executeReceiveStock(storeId, productId);
      await executeCheckStock('Check Stock (expect 10)', storeId, productId, 10);
      const saleId = await executeCreateSale(storeId, productId, sellingPrice);
      await executeCheckStock('Check Stock after sale (expect 8)', storeId, productId, 8);
      await executeCreateRefund(storeId, saleId, productId, sellingPrice);
      await executeCheckStock('Check Stock after refund (expect 9)', storeId, productId, 9);
      await executeDailyReport(storeId);
    } catch (error) {
      recordFailure('Run E2E Flow', error);
    } finally {
      setRunningStep(null);
    }
  };

  const steps = useMemo<StepDefinition[]>(() => [
    { key: 'health', label: 'Gateway Health', disabled: false, run: runHealthCheck },
    { key: 'login', label: 'Dev Login', disabled: false, run: runDevLogin },
    { key: 'account', label: 'Create Account', disabled: false, run: runCreateAccount },
    { key: 'store', label: 'Create Store', disabled: !ids.accountId, run: runCreateStore },
    { key: 'product', label: 'Create Product', disabled: !ids.storeId, run: runCreateProduct },
    { key: 'receive', label: 'Receive Stock', disabled: !ids.storeId || !ids.productId, run: runReceiveStock },
    { key: 'stock-before-sale', label: 'Check Stock (expect 10)', disabled: !ids.storeId || !ids.productId, run: runCheckInitialStock },
    { key: 'sale', label: 'Create Sale', disabled: !ids.storeId || !ids.productId, run: runCreateSale },
    { key: 'stock-after-sale', label: 'Check Stock after sale (expect 8)', disabled: !ids.storeId || !ids.productId, run: runCheckStockAfterSale },
    { key: 'refund', label: 'Create Refund', disabled: !ids.storeId || !ids.productId || !ids.saleId, run: runCreateRefund },
    { key: 'stock-after-refund', label: 'Check Stock after refund (expect 9)', disabled: !ids.storeId || !ids.productId, run: runCheckStockAfterRefund },
    { key: 'report', label: 'Daily Report', disabled: !ids.storeId, run: runDailyReport },
  ], [ids.accountId, ids.productId, ids.saleId, ids.storeId, unitPrice]);

  return (
    <div style={{ fontFamily: 'monospace', padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <h1>Store Management Platform - Developer Dashboard</h1>
      <p style={{ color: '#666' }}>
        Development-only tool for testing the end-to-end business flow through the API gateway.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button
          onClick={() => void runFullFlow()}
          disabled={runningStep !== null}
          style={{ ...stepButtonStyle, fontSize: '1rem' }}
        >
          {runningStep ? 'Running...' : 'Run E2E Flow'}
        </button>
        <button onClick={resetFlow} disabled={runningStep !== null} style={stepButtonStyle}>
          Reset
        </button>
      </div>

      <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {steps.map((step) => (
          <div
            key={step.key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '0.75rem 1rem',
              gap: '1rem',
            }}
          >
            <span>{step.label}</span>
            <button
              onClick={() => void step.run()}
              disabled={runningStep !== null || step.disabled}
              style={stepButtonStyle}
            >
              {runningStep === step.key ? 'Running...' : 'Run Step'}
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div><strong>Account ID:</strong> {ids.accountId || '—'}</div>
        <div><strong>Store ID:</strong> {ids.storeId || '—'}</div>
        <div><strong>Product ID:</strong> {ids.productId || '—'}</div>
        <div><strong>Sale ID:</strong> {ids.saleId || '—'}</div>
      </div>

      {results.length > 0 && (
        <div>
          <h2>Results</h2>
          {results.map((result) => (
            <div
              key={result.label}
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                border: `2px solid ${result.success ? '#4caf50' : '#f44336'}`,
                borderRadius: '6px',
              }}
            >
              <strong>{result.success ? '✅' : '❌'} {result.label}</strong>
              <pre
                style={{
                  background: '#f5f5f5',
                  padding: '0.75rem',
                  overflow: 'auto',
                  fontSize: '0.8rem',
                  maxHeight: '220px',
                }}
              >
                {JSON.stringify(result.response, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
