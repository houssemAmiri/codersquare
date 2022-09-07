import { QueryClient } from '@tanstack/react-query';

export const LOCAL_STORAGE_JWT = 'jwtToken';

const HOST =
  process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://codersquare.xyz';

export class ApiError extends Error {
  public status: number;

  constructor(status: number, msg: string) {
    super(msg);
    this.status = status;
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry(failureCount, error) {
        const { status } = error as ApiError;
        if (typeof status !== 'number') {
          console.error('got non-numeric error code:', error);
          return true;
        }
        return status >= 500 && failureCount < 2;
      },
    },
  },
});

export async function callEndpoint<Request, Response>(
  url: string,
  method: 'get' | 'post' | 'delete',
  request: Request
): Promise<Response> {
  const response = await fetch(`${HOST}${url}`, {
    method: method,
    headers: {
      Authorization: `Bearer ${localStorage.getItem(LOCAL_STORAGE_JWT)}`,
      'Content-Type': 'application/json',
    },
    body: method === 'get' ? undefined : JSON.stringify(request),
  });
  if (!response.ok) {
    let msg = '';
    try {
      msg = (await response.json()).error;
    } finally {
      throw new ApiError(response.status, msg);
    }
  }
  const isJson = response.headers.get('content-type')?.includes('application/json');
  return isJson ? ((await response.json()) as Response) : ({} as Response);
}
