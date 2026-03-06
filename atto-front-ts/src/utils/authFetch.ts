export const getAuthToken = (): string => {
  try {
    const raw = localStorage.getItem('atto_auth');
    if (!raw) return '';
    const parsed = JSON.parse(raw) as { token?: string };
    return String(parsed?.token ?? '').trim();
  } catch {
    return '';
  }
};

export const withAuthHeaders = (headers?: HeadersInit): Headers => {
  const next = new Headers(headers ?? {});
  const token = getAuthToken();
  if (token) {
    next.set('Authorization', `Bearer ${token}`);
  }
  return next;
};

export const authFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  return fetch(input, {
    ...init,
    credentials: init?.credentials ?? 'include',
    headers: withAuthHeaders(init?.headers),
  }).then((response) => {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('attoUser');
      localStorage.removeItem('atto_auth');
      window.dispatchEvent(new Event('auth-changed'));
    }
    return response;
  });
};
