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

export type CatalogGenre = {
  id: number;
  name: string;
};

export type CatalogMovie = {
  tmdbId: string;
  title: string;
  posterUrl: string | null;
  releaseDate: string | null;
  runtimeMinutes: number | null;
  overview: string | null;
  genres: CatalogGenre[];
};

export type CatalogSearchResponse = {
  results: CatalogMovie[];
};

export type CatalogUpcomingResponse = {
  results: CatalogMovie[];
  page: number;
  totalPages: number;
};

export type CatalogCastMember = {
  name: string;
  character: string;
  profileUrl: string | null;
};

export type CatalogCreditsResponse = {
  cast: CatalogCastMember[];
};

export type PaginatedExhibitions = {
  items: ExhibitionSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ListExhibitionsParams = {
  q?: string;
  page?: number;
  pageSize?: number;
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
    runtimeMinutes: number | null;
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

export type TicketKind = 'full' | 'half';

export type PaymentStatus = 'approved' | 'declined';

export type PayOrderPayload = {
  holdId: string;
  result: PaymentStatus;
};

export type OrderTicket = {
  id: string;
  seatLabel: string;
  kind: TicketKind;
};

export type OrderResponse = {
  id: string;
  holdId: string;
  paymentStatus: PaymentStatus;
  totalCents: number;
  paidAt: string | null;
  tickets: OrderTicket[];
};

export type TicketEvent = {
  id: string;
  startsAt: string;
  venueName: string;
  venueAddress: string | null;
};

export type TicketExhibition = {
  id: string;
  title: string;
  posterUrl: string | null;
};

export type MyTicket = {
  id: string;
  kind: TicketKind;
  code: string;
  shareToken: string;
  usedAt: string | null;
  seatLabel: string;
  event: TicketEvent;
  exhibition: TicketExhibition;
};

export type SharedTicket = {
  kind: TicketKind;
  code: string;
  usedAt: string | null;
  seatLabel: string;
  event: TicketEvent;
  exhibition: TicketExhibition;
};

export type TicketsPageData = {
  holds: HoldResponse[];
  tickets: MyTicket[];
};

export type OrganizerEvent = PublicEvent & {
  publishStatus: PublishStatus;
};

export type PublicExhibitionDetail = {
  id: string;
  tmdbId: string;
  title: string;
  posterUrl: string | null;
  runtimeMinutes: number | null;
  overview: string | null;
  releaseDate: string | null;
  genres: CatalogGenre[];
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
