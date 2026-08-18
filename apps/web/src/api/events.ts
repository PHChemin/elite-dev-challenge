import { apiPatch, apiPost } from './client';
import type {
  CreateEventItemPayload,
  OrganizerEvent,
  UpdateEventPayload,
} from './types';

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
