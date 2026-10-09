// Shared axios instance for the Node API. Every real service call should go through `http`
// so auth headers, token refresh and error messages are handled in one place.
import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

const TOKEN_KEY = "savecircle:token";
const SESSION_KEY = "savecircle:session";

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:4000/api";

// Access token lives in localStorage; the refresh token is an httpOnly cookie set by the API
export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage blocked; requests will go out unauthenticated */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* nothing to clear */
    }
  },
};

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20_000,
  withCredentials: true, // send the refresh-token cookie
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// Error shape every caller gets, so pages can just show `err.message`
export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    opts: { status?: number; code?: string; details?: unknown } = {},
  ) {
    super(message);
    this.name = "ApiError";
    Object.assign(this, opts);
  }
}

interface ApiErrorBody {
  message?: string;
  error?: string;
  code?: string;
  errors?: unknown;
}

function toApiError(error: AxiosError<ApiErrorBody>): ApiError {
  if (axios.isCancel(error)) return new ApiError("Request was cancelled.");
  if (error.code === "ECONNABORTED")
    return new ApiError("The server took too long to respond. Try again.");
  if (!error.response)
    return new ApiError(
      "Can't reach SaveCircle. Check your connection and try again.",
    );

  const { status, data } = error.response;
  const fallback: Record<number, string> = {
    400: "Some details are invalid. Check and try again.",
    401: "Your session has expired. Sign in again.",
    403: "You don't have permission to do that.",
    404: "We couldn't find what you were looking for.",
    409: "This conflicts with an existing record.",
    422: "Some details are invalid. Check and try again.",
    429: "Too many attempts. Wait a moment and try again.",
  };
  const message =
    data?.message ??
    data?.error ??
    fallback[status] ??
    "Something went wrong on our end. Try again shortly.";

  return new ApiError(message, {
    status,
    code: data?.code,
    details: data?.errors,
  });
}

// Request: attach the bearer token
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: on 401, refresh once and replay; concurrent 401s share the same refresh call
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  refreshPromise ??= axios
    .post<{ accessToken: string }>(`${API_URL}/auth/refresh`, null, {
      withCredentials: true,
    })
    .then(({ data }) => {
      tokenStore.set(data.accessToken);
      return data.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

function endSession() {
  tokenStore.clear();
  if (!["/login", "/signup"].includes(window.location.pathname)) {
    const next = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    window.location.assign(`/login?next=${next}`);
  }
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as RetriableConfig | undefined;
    const isAuthCall = original?.url?.startsWith("/auth/");

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthCall
    ) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        endSession();
      }
    }

    return Promise.reject(toApiError(error));
  },
);
