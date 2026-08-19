import { apiGet, apiPatch, apiPost } from './client';
import type {
  CreateEventItemPayload,
  OrganizerEvent,
  PublicEventDetail,
  SeatMapResponse,
  UpdateEventPayload,
} from './types';

export function getPublishedEvent(id: string): Promise<PublicEventDetail> {
  return apiGet<PublicEventDetail>(`/events/${id}`);
}

export function getEventSeats(id: string): Promise<SeatMapResponse> {
  return apiGet<SeatMapResponse>(`/events/${id}/seats`);
}

export function createExhibitionEvents(
  exhibitionId: string,
  events: CreateEventItemPayload[],
): Promise<OrganizerEvent[]> {
  return apiPost<OrganizerEvent[]>(`/exhibitions/${exhibitionId}/events`, {
    events,
  });
}

export function updateEvent(
  id: string,
  payload: UpdateEventPayload,
): Promise<OrganizerEvent> {
  return apiPatch<OrganizerEvent>(`/events/${id}`, payload);
}
