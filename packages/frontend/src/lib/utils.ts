export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | { [key: string]: any }
  | ClassValue[]
  | ((...args: any[]) => any)

export function cn(...inputs: ClassValue[]): string {
  let result = ''
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]
    if (!input) continue

    const val = typeof input === 'function' ? input({}) : input
    if (!val) continue

    if (typeof val === 'string' || typeof val === 'number') {
      result += (result ? ' ' : '') + val
    } else if (Array.isArray(val)) {
      for (let j = 0; j < val.length; j++) {
        const item = val[j]
        if (item) {
          result += (result ? ' ' : '') + item
        }
      }
    }
  }
  return result
}

