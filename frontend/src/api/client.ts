import type { ApiResponse } from '../types';
import { cacheValue, enqueue, getCachedValue, listQueue, markFailed, removeQueued } from './offlineQueue';

const ENDPOINT_KEY = 'vehicleMaintenanceApiEndpoint';

export function getEndpoint(): string {
  return localStorage.getItem(ENDPOINT_KEY) || '';
}

export function setEndpoint(endpoint: string): void {
  localStorage.setItem(ENDPOINT_KEY, endpoint.trim());
}

function buildUrl(action: string, params: Record<string, string | number | undefined> = {}): string {
  const endpoint = getEndpoint();
  if (!endpoint) throw new Error('請先到設定頁填入 Apps Script Web App URL');
  const url = new URL(endpoint);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function normalizeRequestError(error: unknown): Error {
  if (error instanceof TypeError && /fetch/i.test(error.message)) {
    return new Error(
      '無法連線到 Apps Script。常見原因是 Web App 部署存取權不是 Anyone，瀏覽器被導到 Google 登入頁後遭 CORS 擋下；請重新部署並將 access 設為 Anyone，再貼上最新 /exec URL。'
    );
  }
  return error instanceof Error ? error : new Error(String(error));
}

function isNetworkFetchError(error: unknown): boolean {
  return error instanceof TypeError && /fetch/i.test(error.message);
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const finalUrl = response.url || '';

  if (finalUrl.includes('accounts.google.com') || text.includes('accounts.google.com') || text.includes('ServiceLogin')) {
    throw new Error('Apps Script 回傳 Google 登入頁。請將 Web App 部署存取權改成 Anyone，或確認目前瀏覽器已登入且部署允許此帳號存取。');
  }

  let json: ApiResponse<T>;
  try {
    json = JSON.parse(text) as ApiResponse<T>;
  } catch {
    const preview = text.trim().slice(0, 80);
    throw new Error(`Apps Script 沒有回傳 JSON。請確認 Web App URL 與部署權限。回應開頭：${preview}`);
  }

  if (!json.success) throw new Error(json.error?.message || 'API request failed');
  return json.data;
}

export async function apiGet<T>(action: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const cacheKey = `GET:${action}:${JSON.stringify(params)}`;
  try {
    const response = await fetch(buildUrl(action, params));
    const data = await parseApiResponse<T>(response);
    await cacheValue(cacheKey, data);
    return data;
  } catch (error) {
    const cached = await getCachedValue<T>(cacheKey);
    if (cached) return cached;
    throw normalizeRequestError(error);
  }
}

export async function apiPost<T>(action: string, payload: Record<string, unknown>, queueOnFail = true): Promise<T | null> {
  try {
    const response = await fetch(buildUrl(action), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...payload, action })
    });
    return await parseApiResponse<T>(response);
  } catch (error) {
    if (queueOnFail && getEndpoint() && isNetworkFetchError(error)) {
      await enqueue(action, payload);
      return null;
    }
    throw normalizeRequestError(error);
  }
}

export async function syncPendingQueue(): Promise<number> {
  if (!getEndpoint()) return 0;
  const items = await listQueue();
  let synced = 0;
  for (const item of items) {
    if (!item.id) continue;
    try {
      await apiPost(item.action, item.payload, false);
      await removeQueued(item.id);
      synced += 1;
    } catch (error) {
      await markFailed(item.id, error instanceof Error ? error.message : String(error));
    }
  }
  return synced;
}
