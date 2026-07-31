import { auth } from "../../firebase"; // firebase.js lives at project root, one level above src/apiClient.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
 
  console.warn(
    "NEXT_PUBLIC_API_URL is not set. Add it to .env.local, e.g. NEXT_PUBLIC_API_URL=http://localhost:8080"
  );
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
   
    return {};
  }

  const token = await currentUser.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const authHeader = await getAuthHeader();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
   
    const message = await response.text();
    throw new ApiError(response.status, message || response.statusText);
  }

 
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export { ApiError };