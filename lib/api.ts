export function api(path: string, options?: RequestInit) {
  return fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
}
