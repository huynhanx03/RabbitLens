export function apiPath(...segments: readonly string[]): string {
  const encodedSegments = segments
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment));

  return `/${encodedSegments.join("/")}`;
}
