export type Role = 'admin' | 'organizer' | 'customer' | 'gate';

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type PublishStatus = 'draft' | 'published';

export type CatalogMovie = {
  tmdbId: string;
  title: string;
  posterUrl: string | null;
  releaseDate: string | null;
};

export type CatalogSearchResponse = {
  results: CatalogMovie[];
};

export type ExhibitionSummary = {
  id: string;
  title: string;
  posterUrl: string | null;
  nextStartsAt: string | null;
  eventCount: number;
};

export type OrganizerExhibition = {
  id: string;
  tmdbId: string;
  organizerId: string;
  title: string;
  posterUrl: string | null;
  publishStatus: PublishStatus;
};

export type OrganizerExhibitionSummary = OrganizerExhibition & {
  nextStartsAt: string | null;
  eventCount: number;
};

export type PublicEvent = {
  id: string;
  startsAt: string;
  venueName: string;
  venueAddress: string | null;
  priceFull: number;
  priceHalf: number;
  maxTicketsPerOrder: number;
};

export type PublicEventDetail = PublicEvent & {
  exhibition: {
    id: string;
    title: string;
    posterUrl: string | null;
  };
  freeSeatCount: number;
};

export type SeatStatus = 'free' | 'held_by_me' | 'taken';

export type SeatMapSeat = {
  label: string;
  status: SeatStatus;
};

export type SeatMapResponse = {
  myHold: { id: string; expiresAt: string } | null;
  seats: SeatMapSeat[];
};

export type HoldResponse = {
  id: string;
  eventId: string;
  fullCount: number;
  halfCount: number;
  expiresAt: string;
  seatLabels: string[];
  event: PublicEvent;
  exhibition: {
    id: string;
    title: string;
    posterUrl: string | null;
  };
};

export type CreateHoldPayload = {
  eventId: string;
  seatLabels: string[];
  fullCount: number;
  halfCount: number;
};

export type OrganizerEvent = PublicEvent & {
  publishStatus: PublishStatus;
};

export type PublicExhibitionDetail = {
  id: string;
  tmdbId: string;
  title: string;
  posterUrl: string | null;
  events: PublicEvent[];
};

export type OrganizerExhibitionDetail = OrganizerExhibition & {
  events: OrganizerEvent[];
};

export type CreateExhibitionPayload = {
  tmdbId: string;
};

export type UpdateExhibitionPayload = {
  tmdbId?: string;
  publishStatus?: PublishStatus;
};

export type CreateEventItemPayload = {
  startsAt: string;
  venueName: string;
  venueAddress?: string;
  priceFull: number;
  priceHalf?: number;
  maxTicketsPerOrder?: number;
};

export type UpdateEventPayload = Partial<CreateEventItemPayload> & {
  publishStatus?: PublishStatus;
};

export type FieldErrors = Record<string, string[]>;

export type ApiErrorBody = {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
  fieldErrors?: FieldErrors;
};
