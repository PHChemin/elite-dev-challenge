import { apiGet, apiPost } from './client';
import type { CreateHoldPayload, HoldResponse } from './types';

export function createHold(payload: CreateHoldPayload): Promise<HoldResponse> {
  return apiPost<HoldResponse>('/reservations/holds', payload);
}

export function getHold(id: string): Promise<HoldResponse> {
  return apiGet<HoldResponse>(`/reservations/holds/${id}`);
}
