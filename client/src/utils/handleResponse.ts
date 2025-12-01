import type { AuthResponse } from '@interfaces/auth';

export const handleResponse = async <T = AuthResponse>(res: Response): Promise<T> => {
  // Check if response has content before parsing JSON
  const contentType = res.headers.get('content-type');
  const hasJsonContent = contentType && contentType.includes('application/json');

  let data: any;

  // Only parse JSON if content type is JSON and there's content
  if (hasJsonContent && res.status !== 204) {
    const text = await res.text();
    data = text ? JSON.parse(text) : {};
  } else {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data as T;
};
