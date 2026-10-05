export function cn(...inputs: (string | boolean | undefined | null | 0)[]): string {
  return inputs.filter(Boolean).join(' ')
}
