import { z } from "zod";

/**
 * Validated search state for server-paginated resource lists.
 * Route components use this schema to validate URL search parameters.
 */
export const resourceListSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(500).catch(100),
  name: z.string().catch(""),
  useRegex: z.coerce.boolean().catch(false),
  sort: z.string().optional(),
  sortReverse: z.coerce.boolean().catch(false),
  vhost: z.string().optional(),
});

export type ResourceListSearch = z.infer<typeof resourceListSearchSchema>;

/**
 * Envelope returned by paginated RabbitMQ endpoints.
 */
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z
    .object({
      items: z.array(item),
      filtered_count: z.number().int().nonnegative(),
      item_count: z.number().int().nonnegative(),
      page: z.number().int().positive(),
      page_count: z.number().int().nonnegative(),
      page_size: z.number().int().positive(),
      total_count: z.number().int().nonnegative(),
    })
    .passthrough();

export type PaginatedResponse<T> = {
  items: T[];
  filtered_count: number;
  item_count: number;
  page: number;
  page_count: number;
  page_size: number;
  total_count: number;
};
