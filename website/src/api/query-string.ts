import type { ResourceListSearch } from "./pagination-schema";

/**
 * Check whether a string is a syntactically valid regular expression.
 */
export function isValidRegex(value: string): boolean {
  try {
    new RegExp(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Build a URL query string from validated search state.
 * Maps camelCase UI fields to RabbitMQ Management API query parameters.
 *
 * Invalid regex patterns are downgraded to plain-text name filters
 * to avoid sending a query that RabbitMQ will reject.
 */
export function buildListQuery(search: ResourceListSearch): string {
  const params = new URLSearchParams();

  params.set("page", String(search.page));
  params.set("page_size", String(search.pageSize));

  if (search.name) {
    params.set("name", search.name);
    // Only send use_regex=true when the pattern is actually valid
    if (search.useRegex && isValidRegex(search.name)) {
      params.set("use_regex", "true");
    } else if (search.useRegex) {
      // Invalid regex: fall back to literal match
      params.set("use_regex", "false");
    }
  }

  if (search.sort !== undefined) {
    params.set("sort", search.sort);
    params.set("sort_reverse", String(search.sortReverse));
  }

  if (search.vhost !== undefined) {
    params.set("vhost", search.vhost);
  }

  return params.toString();
}

/**
 * Append a query string to an API path.
 */
export function withQuery(path: string, query: string): string {
  if (!query) return path;
  return `${path}?${query}`;
}
