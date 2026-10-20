function apiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL;
  if (typeof configured !== "string") {
    return "";
  }

  return configured.replace(/\/+$/, "");
}

function nestMessage(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null || !("message" in body)) {
    return undefined;
  }

  const { message } = body;
  if (typeof message === "string") {
    return message;
  }

  if (
    Array.isArray(message) &&
    message.every((item) => typeof item === "string")
  ) {
    return message.join(", ");
  }

  return undefined;
}

async function errorFromResponse(response: Response): Promise<Error> {
  let message: string | undefined;

  try {
    message = nestMessage(await response.json());
  } catch {
    message = undefined;
  }

  return new Error(message || response.statusText || `HTTP ${response.status}`);
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw await errorFromResponse(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (text === "") {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
