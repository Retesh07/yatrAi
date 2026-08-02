/**
 * Base API URL configuration.
 * Uses VITE_API_URL if provided (for separate frontend/backend deployments),
 * otherwise defaults to relative /api/v1 (handled by Vite proxy in dev).
 */
const rawUrl = import.meta.env.VITE_API_URL || '';
export const API_BASE_URL = rawUrl ? `${rawUrl.replace(/\/$/, '')}/api/v1` : '/api/v1';
