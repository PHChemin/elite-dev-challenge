import { apiGet, apiPatch, apiPost } from './client';
import type {
  CreateExhibitionPayload,
  ExhibitionSummary,
  ListExhibitionsParams,
  OrganizerExhibition,
  OrganizerExhibitionDetail,
  OrganizerExhibitionSummary,
  PaginatedExhibitions,
  PublicExhibitionDetail,
  UpdateExhibitionPayload,
} from './types';

export function listPublishedExhibitions(
  params: ListExhibitionsParams = {},
): Promise<PaginatedExhibitions> {
  return apiGet<PaginatedExhibitions>('/exhibitions', params);
}

export function getPublishedExhibition(
  id: string,
): Promise<PublicExhibitionDetail> {
  return apiGet<PublicExhibitionDetail>(`/exhibitions/${id}`);
}

export function listMyExhibitions(): Promise<OrganizerExhibitionSummary[]> {
  return apiGet<OrganizerExhibitionSummary[]>('/exhibitions/mine');
}

export function getMyExhibition(
  id: string,
): Promise<OrganizerExhibitionDetail> {
  return apiGet<OrganizerExhibitionDetail>(`/exhibitions/mine/${id}`);
}

export function createExhibition(
  payload: CreateExhibitionPayload,
): Promise<OrganizerExhibition> {
  return apiPost<OrganizerExhibition>('/exhibitions', payload);
}

export function updateExhibition(
  id: string,
  payload: UpdateExhibitionPayload,
): Promise<OrganizerExhibition> {
  return apiPatch<OrganizerExhibition>(`/exhibitions/${id}`, payload);
}

export type { ExhibitionSummary };
