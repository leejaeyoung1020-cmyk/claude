export type Gender = "male" | "female";

export type SearchFilters = {
  gender: Gender | null;
  minAge: number;
  maxAge: number;
  department: string | null;
  tagIds: string[];
};

export const defaultFilters: SearchFilters = {
  gender: null,
  minAge: 19,
  maxAge: 30,
  department: null,
  tagIds: [],
};

export function toQuery(filters: SearchFilters): Record<string, string> {
  const query: Record<string, string> = {};
  if (filters.gender !== null) query.gender = filters.gender;
  query.minAge = String(filters.minAge);
  query.maxAge = String(filters.maxAge);
  if (filters.department !== null) query.department = filters.department;
  if (filters.tagIds.length > 0) query.tagIds = filters.tagIds.join(",");
  return query;
}

export function fromQuery(query: Record<string, string>): SearchFilters {
  return {
    gender: query.gender === "male" || query.gender === "female" ? query.gender : null,
    minAge: query.minAge !== undefined ? Number(query.minAge) : defaultFilters.minAge,
    maxAge: query.maxAge !== undefined ? Number(query.maxAge) : defaultFilters.maxAge,
    department: query.department ?? null,
    tagIds: query.tagIds ? query.tagIds.split(",") : [],
  };
}
