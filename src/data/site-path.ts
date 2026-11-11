// Astro's BASE_URL includes a trailing slash because trailingSlash is "always".
export function sitePath(path: `/${string}`) {
  return import.meta.env.BASE_URL + path.slice(1);
}
