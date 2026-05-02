import { API_BASE } from '~/config/api';
import { getValidAccessToken, clearTokens } from '~/services/auth';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: Record<string, unknown>;
  params?: Record<string, string | number>;
}

/**
 * Authenticated fetch wrapper.
 * - Injects Bearer token automatically (refreshes if needed)
 * - Appends query params
 * - On 401, clears stored tokens so the app can redirect to login
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, params } = options;

  const token = await getValidAccessToken();

  let url = `${API_BASE}${path}`;
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      )
    );
    url = `${url}?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    await clearTokens();
    throw new Error('SESSION_EXPIRED');
  }

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}
