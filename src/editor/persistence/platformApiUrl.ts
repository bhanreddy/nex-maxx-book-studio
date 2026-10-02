/** Config accepts either the service origin or its documented /api/v1 base. */
export function platformApiUrl(base: string, endpoint: string): string {
  return `${base.replace(/\/+$/, "").replace(/\/api(?:\/v1)?$/, "")}/${endpoint.replace(/^\/+/, "")}`;
}
