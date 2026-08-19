import type { Role } from '@/api/types';

export const ROUTES = {
  login: '/login',
  exhibitions: '/',
  exhibitionDetail: '/cartazes/:id',
  organizerExhibitions: '/organizador/cartazes',
  organizerExhibitionNew: '/organizador/cartazes/novo',
  organizerExhibitionDetail: '/organizador/cartazes/:id',
  organizerEventsNew: '/organizador/cartazes/:id/sessoes/nova',
  organizerEventEdit: '/organizador/cartazes/:exhibitionId/sessoes/:eventId/editar',
  eventDetail: '/cartazes/:exhibitionId/sessoes/:eventId',
  eventSeats: '/cartazes/:exhibitionId/sessoes/:eventId/assentos',
  pendingHold: '/pedidos/:holdId',
  tickets: '/ingressos',
  ticketDetail: '/ingressos/:ticketId',
  ticketShare: '/ingresso/:shareToken',
} as const;

export function toExhibitionDetail(id: string): string {
  return `/cartazes/${id}`;
}

export function toOrganizerExhibition(id: string): string {
  return `/organizador/cartazes/${id}`;
}

export function toOrganizerEventsNew(exhibitionId: string): string {
  return `/organizador/cartazes/${exhibitionId}/sessoes/nova`;
}

export function toOrganizerEventEdit(
  exhibitionId: string,
  eventId: string,
): string {
  return `/organizador/cartazes/${exhibitionId}/sessoes/${eventId}/editar`;
}

export function toEventDetail(exhibitionId: string, eventId: string): string {
  return `/cartazes/${exhibitionId}/sessoes/${eventId}`;
}

export function toEventSeats(
  exhibitionId: string,
  eventId: string,
  fullCount: number,
  halfCount: number,
): string {
  const query = new URLSearchParams({
    full: String(fullCount),
    half: String(halfCount),
  });
  return `/cartazes/${exhibitionId}/sessoes/${eventId}/assentos?${query.toString()}`;
}

export function toPendingHold(holdId: string): string {
  return `/pedidos/${holdId}`;
}

export function toTicketDetail(ticketId: string): string {
  return `/ingressos/${ticketId}`;
}

export function toTicketShare(shareToken: string): string {
  return `/ingresso/${shareToken}`;
}

export function ticketShareUrl(shareToken: string): string {
  return `${window.location.origin}${toTicketShare(shareToken)}`;
}

export function homeForRole(role: Role): string {
  return role === 'organizer' ? ROUTES.organizerExhibitions : ROUTES.exhibitions;
}
