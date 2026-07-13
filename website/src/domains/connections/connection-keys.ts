import type { ResourceListSearch } from "@/api/pagination-schema";

export const connectionKeys = {
  all: ["connections"] as const,
  lists: () => [...connectionKeys.all, "list"] as const,
  list: (search: ResourceListSearch) =>
    [...connectionKeys.lists(), search] as const,
  detail: (name: string) =>
    [...connectionKeys.all, "detail", name] as const,
  children: (name: string, protocol: string) =>
    [...connectionKeys.detail(name), "children", protocol] as const,
};
