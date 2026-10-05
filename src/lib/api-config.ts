/**
 * Client-side API origin. Defaults to `/backend`, which Next.js rewrites
 * to the real backend so the browser stays same-origin (no CORS).
 */
export const API_BASE_URL = (
  process.env.API_BASE_URL ?? "https://carts.reapmind.com/admin/"
).replace(/\/$/, "");
