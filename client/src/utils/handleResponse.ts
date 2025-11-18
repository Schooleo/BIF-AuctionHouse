import type { AuthResponse } from "@interfaces/auth";

export const handleResponse = async <T = AuthResponse>(
  res: Response
): Promise<T> => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data as T;
};
