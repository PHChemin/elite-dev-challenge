export function paginateMeta(
  total: number,
  page: number,
  pageSize: number,
): {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  skip: number;
} {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    skip: (page - 1) * pageSize,
  };
}
