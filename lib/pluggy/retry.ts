import "server-only";

const BASE_MS = 400;

export async function withPluggyRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (i === attempts - 1) break;
      await new Promise((r) => setTimeout(r, BASE_MS * 2 ** i));
    }
  }
  throw last;
}
