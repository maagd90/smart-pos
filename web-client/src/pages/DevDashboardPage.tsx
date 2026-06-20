import { useMemo, useState } from 'react';
import { devApi, setToken } from '../api/dev';

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
  if (typeof data.id === 'string') return data.id;
  const envelope = getEnvelope(value);
  return typeof envelope.id === 'string' ? envelope.id : '';
}

function getTokenFromResponse(value: unknown): string {
  const data = getNestedData(value);
  if (typeof data.accessToken === 'string') return data.accessToken;
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

export function DevDashboardPage() {
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
    const response = await devApi.checkHealth();
    addResult('Gateway Health', response, typeof getEnvelope(response).status === 'string');
  };

  const executeDevLogin = async () => {
    const response = await devApi.devLogin('owner@example.com');
    const token = getTokenFromResponse(response);
    if (token) setToken(token);
    addResult('Dev Login', response, token.length > 0);
  };

  const executeCreateAccount = async (): Promise<string> => {
    const response = await devApi.createAccount('Test Store LLC', 'AED', 'en-AE');
    const accountId = getId(response);
    if (accountId) {
      setIds((current) => ({ ...current, accountId, storeId: '', productId: '', saleId: '' }));
    }
    addResult('Create Account', response, accountId.length > 0);
    return accountId;
  };

  const executeCreateStore = async (accountId: string): Promise<string> => {
    const response = await devApi.createStore(accountId, 'Downtown Branch', 'Asia/Dubai');
    const storeId = getId(response);
    if (storeId) {
      setIds((current) => ({ ...current, storeId, productId: '', saleId: '' }));
    }
    addResult('Create Store', response, storeId.length > 0);
    return storeId;
  };

  const executeCreateProduct = async (storeId: string) => {
    const response = await devApi.createProduct(storeId, productPayload);
    const productId = getId(response);
    const sellingPrice = getSellingPrice(response);
    if (productId) {
      setIds((current) => ({ ...current, productId, saleId: '' }));
    }
    setUnitPrice(sellingPrice);
    addResult('Create Product', response, productId.length > 0);
    return { productId, sellingPrice };
  };

  const executeReceiveStock = async (storeId: string, productId: string) => {
    const response = await devApi.receiveStock(storeId, productId, 10);
    addResult('Receive 10 units', response, getEnvelope(response).success === true);
  };

  const executeCheckStock = async (label: string, storeId: string, productId: string, expected: number) => {
    const response = await devApi.getStock(storeId, productId);
    addResult(label, response, getStock(response) === expected);
  };

  const executeCreateSale = async (storeId: string, productId: string, currentUnitPrice: number): Promise<string> => {
    const response = await devApi.createSale(
      storeId,
      [{ productId, productName: productPayload.name, quantity: 2, unitPrice: currentUnitPrice }],
      'AED'
    );
    const saleId = getId(response);
    if (saleId) setIds((current) => ({ ...current, saleId }));
    addResult('Create Sale (2 units)', response, saleId.length > 0);
    return saleId;
  };

  const executeCreateRefund = async (
    storeId: string,
    saleId: string,
    productId: string,
    currentUnitPrice: number
  ) => {
    const response = await devApi.createRefund(
      storeId,
      saleId,
      [{ productId, productName: productPayload.name, quantity: 1, unitPrice: currentUnitPrice, resellable: true }],
      'AED'
    );
    addResult('Create Refund', response, getEnvelope(response).success === true);
  };

  const executeDailyReport = async (storeId: string) => {
    const response = await devApi.getDailyReport(storeId);
    addResult('Daily Report', response, getEnvelope(response).success === true);
  };

  const runFullFlow = async () => {
    setRunningStep('flow');
    resetFlow();
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

  const steps = useMemo<StepDefinition[]>(
    () => [
      { key: 'health', label: 'Gateway Health', disabled: false, run: () => runStep('health', 'Gateway Health', executeHealthCheck) },
      { key: 'login', label: 'Dev Login', disabled: false, run: () => runStep('login', 'Dev Login', executeDevLogin) },
      { key: 'account', label: 'Create Account', disabled: false, run: () => runStep('account', 'Create Account', async () => { await executeCreateAccount(); }) },
      {
        key: 'store',
        label: 'Create Store',
        disabled: !ids.accountId,
        run: () => runStep('store', 'Create Store', async () => { await executeCreateStore(ids.accountId); }),
      },
      {
        key: 'product',
        label: 'Create Product',
        disabled: !ids.storeId,
        run: () => runStep('product', 'Create Product', async () => { await executeCreateProduct(ids.storeId); }),
      },
      {
        key: 'receive',
        label: 'Receive Stock',
        disabled: !ids.storeId || !ids.productId,
        run: () => runStep('receive', 'Receive Stock', () => executeReceiveStock(ids.storeId, ids.productId)),
      },
      {
        key: 'report',
        label: 'Daily Report',
        disabled: !ids.storeId,
        run: () => runStep('report', 'Daily Report', () => executeDailyReport(ids.storeId)),
      },
    ],
    [ids]
  );

  return (
    <div className="dev-dashboard">
      <h1>Developer Dashboard</h1>
      <p className="muted">Development-only E2E flow testing through the API gateway.</p>
      <div className="actions">
        <button type="button" onClick={() => void runFullFlow()} disabled={runningStep !== null}>
          {runningStep ? 'Running...' : 'Run E2E Flow'}
        </button>
        <button type="button" onClick={resetFlow} disabled={runningStep !== null}>
          Reset
        </button>
      </div>
      <div className="step-list">
        {steps.map((step) => (
          <div key={step.key} className="step-row">
            <span>{step.label}</span>
            <button type="button" onClick={() => void step.run()} disabled={runningStep !== null || step.disabled}>
              Run
            </button>
          </div>
        ))}
      </div>
      {results.length > 0 && (
        <div className="results">
          {results.map((result) => (
            <div key={result.label} className={result.success ? 'result ok' : 'result fail'}>
              <strong>{result.success ? 'OK' : 'FAIL'} — {result.label}</strong>
              <pre>{JSON.stringify(result.response, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
