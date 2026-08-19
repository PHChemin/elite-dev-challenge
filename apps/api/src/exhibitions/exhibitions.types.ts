export type ExhibitionSummary = {
  id: string;
  title: string;
  posterUrl: string | null;
  nextStartsAt: Date | null;
  eventCount: number;
};

export type PaginatedExhibitions = {
  items: ExhibitionSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
