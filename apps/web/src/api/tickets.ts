import { apiGet } from './client';
import type { MyTicket, SharedTicket } from './types';

export function listMyTickets(): Promise<MyTicket[]> {
  return apiGet<MyTicket[]>('/tickets/mine');
}

export function getSharedTicket(shareToken: string): Promise<SharedTicket> {
  return apiGet<SharedTicket>(`/tickets/share/${shareToken}`);
}
