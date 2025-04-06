import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit & { body?: unknown }
): Promise<T> {
  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      ...(options?.headers || {}),
      ...(options?.body ? { "Content-Type": "application/json" } : {})
    },
    credentials: "include",
  };
  
  // Handle body correctly to avoid double JSON stringification
  if (options?.body) {
    // If it's already a string and looks like JSON, use it directly
    if (typeof options.body === 'string' && 
        options.body.trim().startsWith('{') && 
        options.body.trim().endsWith('}')) {
      fetchOptions.body = options.body;
    } else {
      // Otherwise stringify it
      fetchOptions.body = JSON.stringify(options.body);
    }
  }

  const res = await fetch(url, fetchOptions);
  await throwIfResNotOk(res);
  
  // If the response is empty (e.g., for DELETE requests that return 204)
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return {} as T;
  }
  
  return await res.json() as T;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
