import { apiGet, apiPost } from './client';
import type { GateEventsPage, GateScanResult } from './types';

export function listGateEvents(params?: {
  page?: number;
  pageSize?: number;
}): Promise<GateEventsPage> {
  return apiGet<GateEventsPage>('/gate/events', params);
}

export function scanTicket(payload: {
  eventId: string;
  code: string;
}): Promise<GateScanResult> {
  return apiPost<GateScanResult>('/gate/scan', payload);
}
