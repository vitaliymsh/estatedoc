export function cn(...inputs: any[]): string {
  return inputs
    .flatMap((input) => (typeof input === 'function' ? input({}) : input))
    .filter(Boolean)
    .join(' ')
}
